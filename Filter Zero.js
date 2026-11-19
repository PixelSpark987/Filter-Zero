// ==UserScript==
// @name         Filter Zero
// @description  A custom CSS blur applied to specified tags in Philomena booru sites, originally intended to bypass Twibooru's 128-tag limit for spoilered and hidden tags.
// @author       PixelSpark987 - https://is.gd/PS987
// @version      2026-11-19_02
// @icon         https://is.gd/TwibooruSVG
// @downloadURL  https://raw.githubusercontent.com/PixelSpark987/Filter-Zero/refs/heads/main/Filter%20Zero.js
// @updateURL    https://raw.githubusercontent.com/PixelSpark987/Filter-Zero/refs/heads/main/Filter%20Zero.js
// @namespace    http://tampermonkey.net/
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_notification
// @grant        GM_xmlhttpRequest
// @connect      raw.githubusercontent.com
// 
// Main Sites
// @match        *://derpibooru.org/*
// @match        *://*.derpibooru.org/*
// @match        *://manebooru.art/*
// @match        *://*.manebooru.art/*
// @match        *://ponerpics.org/*
// @match        *://*.ponerpics.org/*
// @match        *://tantabus.ai/*
// @match        *://*.tantabus.ai/*
// @match        *://twibooru.org/*
// @match        *://*.twibooru.org/*
// 
// Other Sites
// @match        *://furbooru.org/*
// @match        *://*.furbooru.org/*
// ==/UserScript==

// Immediately Invoked Function Expression (IIFE) to isolate variables and avoid polluting global scope
(function() {
    // Enable strict mode to enforce cleaner code execution and prevent silent global variable assignments
    'use strict';

    // =========================================================================
    // SCRIPT SETTINGS
    // =========================================================================

    // Boolean flag to control whether browser-native thumbnail 'title' hover tooltips are removed
    const HIDE_TOOLTIPS = true; // Set to true to hide image hover tooltips, or false to keep them

    // Boolean flag to control whether damaged tag warnings also trigger a Tampermonkey notification
    const NOTIFY_ON_DAMAGED_TAGS = true;

    // =========================================================================
    // SITE REGISTRY & RAW GITHUB ASSET LINKS
    // To add new sites, add them to the // @match list above and add their domain 
    // and raw GitHub tag list URL below.
    // =========================================================================

    const SITE_CONFIG = {
        'derpibooru.org': 'https://raw.githubusercontent.com/PixelSpark987/Filter-Zero/refs/heads/main/Main%20Sites/Derpibooru-Tags.list',
        'manebooru.art':  'https://raw.githubusercontent.com/PixelSpark987/Filter-Zero/refs/heads/main/Main%20Sites/Manebooru-Tags.list',
        'ponerpics.org':  'https://raw.githubusercontent.com/PixelSpark987/Filter-Zero/refs/heads/main/Main%20Sites/Ponerpics-Tags.list',
        'tantabus.ai':    'https://raw.githubusercontent.com/PixelSpark987/Filter-Zero/refs/heads/main/Main%20Sites/Tantabus-Tags.list',
        'twibooru.org':   'https://raw.githubusercontent.com/PixelSpark987/Filter-Zero/refs/heads/main/Main%20Sites/Twibooru-Tags.list',
        'furbooru.org':   'https://raw.githubusercontent.com/PixelSpark987/Filter-Zero/refs/heads/main/Other%20Sites/Furbooru-Tags.list'
    };

    // =========================================================================
    // HOST MATCHING, CACHING & BACKGROUND SYNC SETUP
    // =========================================================================

    // Function to find the matching configuration for the current site domain
    function getCurrentSiteConfig() {
        const hostname = window.location.hostname.toLowerCase();
        for (const [siteDomain, tagListUrl] of Object.entries(SITE_CONFIG)) {
            if (hostname === siteDomain || hostname.endsWith('.' + siteDomain)) {
                return { domain: siteDomain, url: tagListUrl };
            }
        }
        return null;
    }

    const currentSite = getCurrentSiteConfig();
    const cacheKey = currentSite ? 'filter_zero_tags_' + currentSite.domain : null;

    // Load initial tags synchronously from local Tampermonkey cache for instant zero-delay filtering
    let currentTagsArray = cacheKey ? (GM_getValue(cacheKey, []) || []) : [];

    // Global Set holding active lookup tags
    let blurTagsSet = new Set();

    // Helper function to build / rebuild the O(1) lookup set from an array of strings
    function rebuildBlurSet(tagsArray) {
        blurTagsSet = new Set(
            tagsArray
                .filter(t => t && typeof t === 'string' && !t.startsWith('tag placeholder'))
                .map(t => t.toLowerCase().trim())
        );
    }

    // Build the initial set immediately on startup
    rebuildBlurSet(currentTagsArray);

    // Parses one-tag-per-line single-quoted entries (e.g. 'you\'re right') and flags damaged lines
    function parseSingleQuotedTagList(rawText) {
        const lines = rawText.split(/\r?\n/);
        const parsedTags = [];
        const issues = [];

        lines.forEach((rawLine, index) => {
            const lineNumber = index + 1;
            const trimmed = rawLine.trim();

            // Ignore empty or whitespace-only lines
            if (!trimmed) return;

            // Must begin with an opening single quote
            if (!trimmed.startsWith("'")) {
                issues.push({
                    line: lineNumber,
                    raw: rawLine,
                    reason: "Missing opening single quote (')"
                });
                return;
            }

            // Walk characters inside the single-quoted string to validate escapes and find closing quote
            let unescapedTag = '';
            let closedProperly = false;
            let i = 1;

            while (i < trimmed.length) {
                const ch = trimmed[i];

                if (ch === '\\') {
                    // Backslash at the very end of the line means no closing quote was reached
                    if (i + 1 >= trimmed.length) {
                        issues.push({
                            line: lineNumber,
                            raw: rawLine,
                            reason: "Trailing backslash with missing closing single quote"
                        });
                        return;
                    }

                    const nextCh = trimmed[i + 1];
                    if (nextCh === "'") {
                        // Valid escaped apostrophe: \' -> '
                        unescapedTag += "'";
                        i += 2;
                    } else if (nextCh === '\\') {
                        // Escaped backslash: \\ -> \
                        unescapedTag += '\\';
                        i += 2;
                    } else {
                        // Keep other escaped characters intact while flagging unusual escape
                        unescapedTag += nextCh;
                        i += 2;
                    }
                } else if (ch === "'") {
                    closedProperly = true;

                    // Any non-whitespace characters after the closing quote indicate a damaged line
                    const trailingAfterQuote = trimmed.slice(i + 1).trim();
                    if (trailingAfterQuote.length > 0) {
                        issues.push({
                            line: lineNumber,
                            raw: rawLine,
                            reason: `Unexpected trailing content after closing quote: "${trailingAfterQuote}"`
                        });
                        return;
                    }
                    break;
                } else {
                    unescapedTag += ch;
                    i += 1;
                }
            }

            if (!closedProperly) {
                issues.push({
                    line: lineNumber,
                    raw: rawLine,
                    reason: "Unclosed single quote or unescaped apostrophe inside tag (use \\' for apostrophes)"
                });
                return;
            }

            const cleanedTag = unescapedTag.trim();
            if (!cleanedTag) {
                issues.push({
                    line: lineNumber,
                    raw: rawLine,
                    reason: "Empty tag value inside single quotes"
                });
                return;
            }

            parsedTags.push(cleanedTag);
        });

        return { tags: parsedTags, issues };
    }

    // Background function to fetch latest tag list from GitHub, validate, cache, and hot-swap
    function syncTagsInBackground() {
        if (!currentSite) return;

        // Skip if we already checked GitHub during this browser session
        const sessionKey = 'filter_zero_checked_' + currentSite.domain;
        if (sessionStorage.getItem(sessionKey)) return;

        GM_xmlhttpRequest({
            method: "GET",
            url: currentSite.url,
            onload: function(response) {
                if (response.status === 200) {
                    const { tags: freshTags, issues } = parseSingleQuotedTagList(response.responseText);

                    if (issues.length > 0) {
                        console.warn(`[Filter Zero] WARNING: Detected ${issues.length} damaged tag line(s) in ${currentSite.domain} list! Keeping existing cached tags safe.`);
                        issues.forEach(issue => {
                            console.warn(`[Filter Zero] Line ${issue.line}: ${issue.reason} -> ${issue.raw.trim()}`);
                        });

                        if (NOTIFY_ON_DAMAGED_TAGS && typeof GM_notification !== 'undefined') {
                            const firstIssue = issues[0];
                            GM_notification({
                                title: "Filter Zero Damaged Tag Detected",
                                text: `${currentSite.domain} (Line ${firstIssue.line}): ${firstIssue.reason}. Check console for details.`,
                                timeout: 6000
                            });
                        }
                        return;
                    }

                    // Save validated tags to persistent local storage cache
                    GM_setValue(cacheKey, freshTags);
                    // Mark as checked for this session
                    sessionStorage.setItem(sessionKey, 'true');

                    // Hot-swap the tags in memory and immediately re-scan the page
                    rebuildBlurSet(freshTags);
                    queueScan();
                    console.log(`[Filter Zero] Successfully updated and applied ${freshTags.length} tags for ${currentSite.domain}`);
                } else {
                    console.warn(`[Filter Zero] Failed to fetch tag list for ${currentSite.domain}. HTTP status: ${response.status}`);
                }
            },
            onerror: function(err) {
                console.warn(`[Filter Zero] Background sync network request failed for ${currentSite.domain}`, err);
            }
        });
    }

    // CSS stylesheet string to be injected into the DOM
    const css = `
        /* Applies strong blur and removes color for filtered thumbnails */
        .custom-local-blur {
            filter: blur(25px) grayscale(100%) !important;
            transition: filter 0.3s ease-in-out !important;
        }

        /* Removes blur and restores color when the user hovers over the thumbnail */
        .image-container:hover .custom-local-blur,
        .image-show-container:hover .custom-local-blur,
        .image-target:hover .custom-local-blur {
            filter: blur(0px) grayscale(0%) !important;
        }

        /* Simulated Overlay Styles showing matched spoiler tags */
        .filter-zero-overlay {
            pointer-events: none !important;
            transition: opacity 0.3s ease-in-out !important;
            opacity: 1 !important;
        }

        /* Hides spoiler tag overlay when thumbnail is hovered */
        .image-container:hover .filter-zero-overlay {
            opacity: 0 !important;
        }

        /* Tagsauce Matched Tag Styles (dims and greys out matching sidebar tags) */
        .tag .filter-zero-greyscale,
        .tag a.filter-zero-greyscale {
            filter: grayscale(100%) !important;
            opacity: 0.3 !important;
            color: #888 !important;
            transition: filter 0.2s ease-in-out, opacity 0.2s ease-in-out, color 0.2s ease-in-out !important;
        }

        /* Restores full color and opacity when hovering over greyed-out sidebar tags */
        .tag:hover .filter-zero-greyscale,
        .tag:hover a.filter-zero-greyscale {
            filter: grayscale(0%) !important;
            opacity: 1 !important;
            color: inherit !important;
        }
    `;

    // Inject CSS into page using GM_addStyle if provided by userscript manager, otherwise fallback to standard DOM creation
    if (typeof GM_addStyle !== 'undefined') {
        // Use Tampermonkey/Violentmonkey native helper
        GM_addStyle(css);
    } else {
        // Fallback: create standard <style> element manually
        const style = document.createElement('style');
        // Set style text content to our CSS rules
        style.textContent = css;
        // Append style element to page <head>
        document.head.appendChild(style);
    }

    // Helper function to extract all raw tag strings from tagsauce containers on post pages
    function getTagsauceText() {
        // Find tagsauce element by ID or class name
        const tagsauceEl = document.querySelector('#tagsauce, .tagsauce');
        // Return empty string if tagsauce is not present on current page
        if (!tagsauceEl) return '';

        // Read dataset attributes containing tag strings
        const dsTags = tagsauceEl.getAttribute('data-tags') || tagsauceEl.getAttribute('data-image-tags') || '';

        // Extract text from individual tag links inside the tagsauce container
        const tagLinksText = Array.from(tagsauceEl.querySelectorAll('.tag__name, a[data-tag-name]'))
            .map(el => el.getAttribute('data-tag-name') || el.textContent)
            .join(', ');

        // Combine dataset and link tags into a single lowercase string
        return (dsTags + ', ' + tagLinksText).toLowerCase();
    }

    // Function to apply greyscale styles to matching tag pills in sidebar/tagsauce without breaking dropdown menus
    function processTagsauceTags() {
        // Select all tag container elements on the page
        const tagElements = document.querySelectorAll('.tag[data-tag-name], #tagsauce .tag');

        // Loop over each tag container
        tagElements.forEach(tagEl => {
            // Extract tag name from data attribute or internal elements, converting to lowercase
            const tagName = (tagEl.getAttribute('data-tag-name') ||
                             tagEl.querySelector('.tag__name')?.getAttribute('data-tag-name') ||
                             tagEl.querySelector('.tag__name')?.textContent || '').toLowerCase().trim();

            // Skip if no valid tag name was found
            if (!tagName) return;

            // Target elements within the tag pill to apply greyscale styling
            const targets = tagEl.querySelectorAll('.tag__name, .tag__count, span > a');

            // Check if this tag exists in our target blur set
            if (blurTagsSet.has(tagName)) {
                // Apply greyscale class if matched
                targets.forEach(el => el.classList.add('filter-zero-greyscale'));
            } else {
                // Remove greyscale class if not matched
                targets.forEach(el => el.classList.remove('filter-zero-greyscale'));
            }
        });
    }

    // Function to create or update spoiler info overlay text on gallery thumbnails
    function updateOverlay(container, matchedTags) {
        // Skip overlay creation if container is not a standard thumbnail grid item
        if (!container.classList.contains('image-container')) {
            // Remove any existing overlay on non-gallery containers (like main image view)
            const existingOverlay = container.querySelector('.filter-zero-overlay');
            if (existingOverlay) existingOverlay.remove();
            return;
        }

        // Check if an overlay element already exists inside this container
        let overlay = container.querySelector('.filter-zero-overlay');

        // If no tags matched, remove existing overlay and exit
        if (matchedTags.length === 0) {
            if (overlay) overlay.remove();
            return;
        }

        // Create overlay element if it does not exist yet
        if (!overlay) {
            overlay = document.createElement('div');
            // Apply Philomena booru structure and custom overlay class
            overlay.className = 'media-box__overlay js-spoiler-info-overlay filter-zero-overlay';
            // Append overlay to thumbnail container
            container.appendChild(overlay);
        }

        // Format matched tag names with HTML span elements and tooltips matching native Philomena markup
        const formattedHtml = matchedTags.map((tag, idx) => {
            // Add comma separator for subsequent tags
            const separator = idx === 0 ? '' : ', ';
            return `${separator}<span title="${tag}">${tag}</span>`;
        }).join('');

        // Inject formatted HTML content into overlay container
        overlay.innerHTML = formattedHtml;
    }

    // Main function to scan DOM elements and apply blur filters to image/video media
    function processThumbnails() {
        // Process tagsauce sidebar tags first
        processTagsauceTags();

        // Retrieve tagsauce text string from page
        const tagsauceString = getTagsauceText();

        // Find all thumbnail/image containers on the page
        const containers = document.querySelectorAll('.image-container, .image-show-container');

        // Iterate over each media container
        containers.forEach(container => {
            // Find inner anchor link
            const anchor = container.querySelector('a');

            // Targeted selection logic prioritizing actual image/video targets while ignoring Philomena warning/blocked placeholder SVGs
            const mediaTarget = container.querySelector('#image-display') ||
                                container.querySelector('.image-show img, .image-show video') ||
                                container.querySelector('.image-target img, .image-target video') ||
                                container.querySelector('.imgspoiler img') ||
                                container.querySelector('picture img') ||
                                container.querySelector('img:not([src*="tagblocked"]):not([src*="svg"]), video');

            // Handle hover title tooltip toggling
            if (HIDE_TOOLTIPS) {
                // Move original title attribute to data attribute to suppress browser tooltip
                if (anchor && anchor.hasAttribute('title')) {
                    anchor.setAttribute('data-original-title', anchor.getAttribute('title'));
                    anchor.removeAttribute('title');
                }
                if (mediaTarget && mediaTarget.hasAttribute('title')) {
                    mediaTarget.setAttribute('data-original-title', mediaTarget.getAttribute('title'));
                    mediaTarget.removeAttribute('title');
                }
            } else {
                // Restore original title attribute from stored data attribute
                if (anchor && anchor.hasAttribute('data-original-title')) {
                    anchor.setAttribute('title', anchor.getAttribute('data-original-title'));
                    anchor.removeAttribute('data-original-title');
                }
                if (mediaTarget && mediaTarget.hasAttribute('data-original-title')) {
                    mediaTarget.setAttribute('title', mediaTarget.getAttribute('data-original-title'));
                    mediaTarget.removeAttribute('title');
                }
            }

            // Extract tag list attributes from container element
            const rawTags = container.getAttribute('data-image-tag-aliases') ||
                            container.getAttribute('data-image-tags') ||
                            container.getAttribute('data-tags') ||
                            container.getAttribute('data-tag-names') || '';

            // Extract link title text string
            const linkTitle = anchor?.getAttribute('title') || anchor?.getAttribute('data-original-title') || '';

            // Skip processing if no tag information could be retrieved
            if (!rawTags && !linkTitle && !tagsauceString) return;

            // Combine all tags into a single lowercase string
            const tagString = (rawTags + ', ' + linkTitle + ', ' + tagsauceString).toLowerCase();

            // Split tags string into individual trimmed tag strings preserving their original order on the page
            const extractedTags = tagString.split(/,\s*/).map(t => t.trim());

            // Filter tags preserving the exact order they appear in the thumbnail/tagsauce list rather than config order
            const matchedTags = [];
            const seenTags = new Set();

            // Iterate over the tags in the order they appear on the post
            extractedTags.forEach(extractedTag => {
                // Check if the current tag is in our blur list and has not already been added
                if (blurTagsSet.has(extractedTag) && !seenTags.has(extractedTag)) {
                    matchedTags.push(extractedTag);
                    seenTags.add(extractedTag);
                }
            });

            // Boolean flag confirming whether thumbnail should be blurred
            const shouldBlur = matchedTags.length > 0;

            // Apply or remove blur classes based on match result
            if (mediaTarget) {
                if (shouldBlur) {
                    // Add blur CSS class
                    mediaTarget.classList.add('custom-local-blur');
                    // Update overlay with matched tags sorted by page appearance order
                    updateOverlay(container, matchedTags);
                } else {
                    // Remove blur CSS class
                    mediaTarget.classList.remove('custom-local-blur');
                    // Remove overlay content
                    updateOverlay(container, []);
                }
            }
        });
    }

    // Flag used for debouncing scan calls across multiple DOM events
    let isScheduled = false;

    // Queue function to delay DOM scanning until the next animation frame for performance optimization
    function queueScan() {
        // Prevent duplicate scheduling if scan is already queued
        if (isScheduled) return;
        isScheduled = true;

        // Schedule execution on next repaint
        requestAnimationFrame(() => {
            // Execute media scanning logic
            processThumbnails();
            // Reset queue flag after execution
            isScheduled = false;
        });
    }

    // Set up MutationObserver to handle dynamic content loading (infinite scroll / AJAX updates)
    const observer = new MutationObserver((mutations) => {
        let shouldUpdate = false;

        // Loop over DOM mutations
        for (const mutation of mutations) {
            // Ignore changes caused directly by our own injected classes to prevent infinite loop triggers
            if (mutation.target.classList &&
               (mutation.target.classList.contains('custom-local-blur') ||
                mutation.target.classList.contains('filter-zero-overlay') ||
                mutation.target.classList.contains('filter-zero-greyscale'))) {
                continue;
            }
            // Flag that genuine external DOM changes occurred
            shouldUpdate = true;
            break;
        }

        // Trigger scan queue if relevant DOM nodes changed
        if (shouldUpdate) {
            queueScan();
        }
    });

    // Initialization routine to start scanning and attach observers
    function init() {
        // Execute initial media scan immediately using local cache
        queueScan();

        // Trigger background sync to check for updates on GitHub without blocking page render
        setTimeout(syncTagsInBackground, 1500);

        // Locate main content container element
        const targetNode = document.querySelector('#content') || document.querySelector('#maincontent') || document.body;

        // Start watching for child node modifications and subtree changes
        if (targetNode) {
            observer.observe(targetNode, { childList: true, subtree: true });
        }
    }

    // Execute script logic after DOM is fully loaded or immediately if already loaded
    if (document.readyState === 'loading') {
        // Wait for DOMContentLoaded event if page is still loading
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // Run initialization directly if DOM is ready
        init();
    }
})();
