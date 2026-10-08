// ==UserScript==
// @name         Filter Zero
// @description  Applies a CSS blur to specified tags in philomena booru sites to bypass Twibooru's 128-tag limit for spoilered and hidden tags
// @author       PixelSpark987 - https://is.gd/PS987
// @icon         https://cdn.twibooru.org/favicon.svg
// @downloadURL  https://raw.githubusercontent.com/PixelSpark987/Filter-Zero/refs/heads/main/Filter%20Zero.js
// @updateURL    https://raw.githubusercontent.com/PixelSpark987/Filter-Zero/refs/heads/main/Filter%20Zero.js
// @namespace    http://tampermonkey.net/
// @version      2026-10-07_01
// @grant        GM_addStyle
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

    // =========================================================================
    // PER-SITE TAG CONFIGURATION -
    // To add aditional sites, add them in the // @match list, and clone a tag list below, edit the name (url) of the list, and add tags to it
    // If filtering breaks, make sure each tag list has a comma after each entry - usually, it will be the tag directly above where TampermMonkey says the error is
    // =========================================================================

    // Object map storing hostnames as keys and arrays of target tags to blur as values
    const SITE_TAGS = {
        // Main Sites
        // Target tag names for Derpibooru
        'derpibooru.org': [
            'adolf hitler',
            'adventure time',
            'alcohol',
            'anal',
            'anus',
            'army',
            'artist:cookie-lovey',
            'artist:sikojensika',
            'beer',
            'bleeding',
            'blood',
            'bob belcher',
            'bob\'s burgers',
            'body horror',
            'brian griffin',
            'broken leg',
            'corpse',
            'covered in manure',
            'covered in scat',
            'crotchboobs',
            'crotchbra',
			'degradation',
            'diaper',
            'diaper ftish',
        	'diaper usage',
        	'diapered',
            'emaciated',
            'exposed bone',
            'exposed muscle',
            'family guy',
            'fart',
            'fart cloud',
            'fart fetish',
            'fat',
            'fattershy',
            'finn the human',
            'flesh cube',
            'foot focus',
            'futa',
			'griffon',
			'gryphon',
            'guts',
			'humiliation',
            'hyper',
            'hyper belly',
            'hyper pregnancy',
            'impossibly large belly',
            'impossibly large penis',
            'injured',
            'jake the dog',
            'lois griffin',
            'long tongue',
            'manure',
            'meg griffin',
            'military uniform',
            'multiple pregnancy',
            'nazi',
            'nazi armband',
            'nazi uniform',
        	'non-baby in diaper',
            'obese',
            'peter griffin',
			'piss drinking',
			'pissing',
            'ponut',
        	'poofy diaper',
            'poop',
            'poop eating',
			'poop in hair',
            'poop stains',
            'pregnant',
            'propaganda',
            'propaganda poster',
            'ptsd',
			'rape',
            'rick and morty',
            'rick sanchez',
			'rule 63',
            'scat',
            'shell shock',
            'skinless',
        	'soaked diaper',
			'starlard glimmer',
            'strong fat',
            'swastika',
            'translucent belly',
            'transparent belly',
            'transparent flesh',
        	'urine',
        	'used diaper',
    		'using diaper',
            'vore',
            'war',
			'watersports',
    		'wet diaper',
        	'wetting',
			'wetting diaper',
            'womb with a view',
			'zebra',
        ],
         // 
        // Target tag names for Manebooru
        'manebooru.art': [
            'anal',
            'army',
            'crotchboobs',
            'crotchbra',
            'foot focus',
			'griffon',
			'gryphon',
			'fat',
            'ponut',
			'rape',
			'rule 63',
            'scat',
            'vore',
            'war',
            'womb with a view',
			'zebra',
        ],
         //
        // Target tag names for Ponerpics
        'ponerpics.org': [
            'anal',
            'army',
            'crotchboobs',
            'crotchbra',
            'foot focus',
			'griffon',
			'gryphon',
            'ponut',
			'rape',
			'rule 63',
            'scat',
            'vore',
            'war',
            'womb with a view',
			'zebra',
        ],
         //
        // Target tag names for Tantabus
        'tantabus.ai': [
			'abdominal bulge',
			'abuse',
            'anal',
			'anal insertion',
			'anatomically correct',
			'ankle cuffs',
			'anus',
            'army',
			'ball gag',
			'bdsm',
			'beaten',
			'beaten up',
			'bleeding',
			'blood',
			'bloody mouth',
			'bondage',
			'bondage furnature',
			'bondage gear',
			'bound and gagged',
			'bound wings',
			'bruised',
			'brutal',
			'buttplug',
			'buttslut',
			'chained',
			'collar',
			'creator:longarms',
            'crotchboobs',
            'crotchbra',
			'cum inflation',
			'dark genitals',
			'diaper',
			'diaper fetish',
			'diaper slave',
			'diapered',
			'dominatrix',
			'excessive cum',
            'foot focus',
			'fucking machine',
			'full diaper',
			'futa',
			'gag',
			'griffon',
			'gryphon',
			'handprint',
			'harness gag',
			'helpless',
			'humiliation',
			'implied rape',
			'jeweled buttplug',
			'large penetration',
			'latex',
			'leaky diaper',
			'leash',
			'leg binder',
			'magic suppression',
			'medial ring',
			'milking machine',
			'muscular female',
			'non-baby in diaper',
			'nose ring',
			'orc',
			'pacifier gag',
			'piercing',
			'piss drinking',
			'pissing',
            'ponut',
			'poop',
			'poop eating',
			'poop in hair',
			'pregnant',
			'rape',
			'restrained',
			'rule 63',
            'scat',
			'sex slave',
			'slavery',
			'sling bikini',
			'spreader bar',
			'strapon',
			'tied',
			'tied to chair',
			'twilybuse',
			'urine',
			'used diaper',
			'using diaper',
            'vore',
            'war',
			'watersports',
			'wet diaper',
			'wetting',
			'wetting diaper',
            'womb with a view',
			'wrist cuffs',
			'zebra',
        ],
         //
        // Target tag names for Twibooru
        'twibooru.org': [
			'alcohol',
            'anal',
            'anal insertion',
            'anus',
            'army',
            'artist:fizzyizatty',
            'artist:gin-blade',
            'bdsm',
            'big balls',
            'big belly',
			'big breasts',
			'blackmail',
			'bondage',
			'bound',
			'bunny suit',
			'busty applejack',
			'busty aria blaze',
			'busty fluttershy',
			'busty pinkie pie',
			'busty rainbow dash',
			'busty rarity',
			'busty starlight glimmer',
			'busty twilight sparkle',
			'cocktail',
            'chastity',
            'chastity cage',
			'coercion',
            'covered in scat',
            'crotchboobs',
            'crotchbra',
            'cum inflation',
			'double penetration',
			'edgelight glimmer',
            'fart',
            'fart cloud',
            'fart fetish',
			'fat',
            'fat fetish',
            'fattershy',
            'flat chastity cage',
            'foot focus',
            'futa',
            'futa on female',
			'futa starlight glimmer',
			'futa twilight sparkle',
			'griffon',
			'gryphon',
            'huge balls',
            'huge belly',
			'huge butt',
            'huge breasts',
            'huge penis',
            'immobile',
            'impossibly large belly',
            'impossibly large butt',
            'impossibly large everything',
            'impossibly large penis',
            'impossibly obese',
            'inflation',
			'lactation',
			'large breasts',
			'large butt',
			'lolidom',
			'malesub',
			'milk squirt',
            'morbidly obese',
			'multiple penetration',
			'musk',
			'musky balls',
            'nipple piercing',
            'obese',
			'ophiotaurus',
            'pet play',
			'playboy bunny',
			'playboy bunny applejack',
			'playboy bunny fluttershy',
			'playboy bunny pinkie pie',
			'playboy bunny rainbow dash',
			'playboy bunny rarity',
			'playboy bunny twilight sparkle',
            'ponut',
            'poop',
            'poop eating',
            'poop on bed',
            'poop on face',
            'poop stains',
            'pregnant',
			'punk',
			'rape',
			'reverse rape',
			'rule 63',
            'scat',
			'solo futa',
			'starlard glimmer',
			'submissive',
			'teats',
			'tentacle bondage',
			'tentacle porn',
			'tentacles',
			'tentacles on female',
			'threat',
            'thunder thighs',
			'twisub',
			'udder',
			'vine bondage',
            'vore',
            'war',
            'wine bottle',
            'womb with a view',
			'zebra',
        ],
         //
        // Other Sites - mapping target tag names for Furbooru
        'furbooru.org': [
            'anal',
            'army',
            'artist:cbcamesburyfan',
            'artist:the-furry-railfan',
			'buttplug',
			'double chin',
			'fat',
			'fat fetish',
            'foot focus',
			'griffon',
			'gryphon',
			'huge breasts',
			'huge butt',
            'hyper',
            'hyper belly',
            'hyper breasts',
            'hyper inflation',
			'maw',
			'maw play',
			'morbidly obese',
			'obese',
			'open maw',
			'oral vore',
			'overweight',
			'rape',
			'rule 63',
            'scat',
			'slightly chubby',
            'teats',
			'thick thighs',
			'uvula',
			'uvula focus',
            'vore',
            'war',
            'womb with a view',
			'zebra',
        ],
         //
        ],
    };

    // =========================================================================
    // HOST MATCHING & SETUP (not needing to be modified to add new sites!!!)
    // =========================================================================

    // Function to retrieve the correct list of target tags based on the current domain
    function getActiveTags() {
        // Get the current site's hostname and normalize it to lowercase
        const hostname = window.location.hostname.toLowerCase();

        // Loop through all entries in the SITE_TAGS object
        for (const [siteDomain, tags] of Object.entries(SITE_TAGS)) {
            // Check if hostname matches site domain directly or is a subdomain (e.g. www.derpibooru.org)
            if (hostname === siteDomain || hostname.endsWith('.' + siteDomain)) {
                // Return the matching list of tags for this domain
                return tags;
            }
        }
        // Return an empty array if current domain is not in the list
        return [];
    }

    // Retrieve active tags for the current site
    const currentTagsArray = getActiveTags();

    // Convert array into a Set for fast O(1) lookup, cleaning up whitespace and converting tags to lowercase
    const blurTagsSet = new Set(
        currentTagsArray
            // Filter out empty strings or place-holder entries
            .filter(t => t && !t.startsWith('tag placeholder'))
            // Strip surrounding whitespace and convert to lowercase
            .map(t => t.toLowerCase().trim())
    );

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
                    mediaTarget.removeAttribute('data-original-title');
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

            // Filter tags preserving the exact order they appear in the thumbnail/tagsauce list rather than SITE_TAGS order
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
        // Execute initial media scan
        queueScan();

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
