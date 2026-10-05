// ==UserScript==
// @name         Filter Zero
// @description  Applies a CSS blur to specified tags in philomena booru sites to bypass Twibooru's 128-tag limit for spoilered and hidden tags
// @author       PixelSpark987 - https://is.gd/PS987
// @icon         https://cdn.twibooru.org/favicon.svg
// @downloadURL  https://raw.githubusercontent.com/PixelSpark987/Filter-Zero/refs/heads/main/Filter%20Zero.js
// @updateURL    https://raw.githubusercontent.com/PixelSpark987/Filter-Zero/refs/heads/main/Filter%20Zero.js
// @namespace    http://tampermonkey.net/
// @grant        GM_addStyle
// @version      2.8.3
// Main Sites
// @match        *://derpibooru.org/*
// @match        *://*.derpibooru.org/*
// @match        *://manebooru.art/*
// @match        *://*.manebooru.art/*
// @match        *://ponerpics.org/*
// @match        *://*.ponerpics.org/*
// @match        *://ponybooru.org/*
// @match        *://*.ponybooru.org/*
// @match        *://tantabus.ai/*
// @match        *://*.tantabus.ai/*
// @match        *://twibooru.org/*
// @match        *://*.twibooru.org/*
// Other Sites
// @match        *://furbooru.org/*
// @match        *://*.furbooru.org/*
// @match        *://trixiebooru.org/*
// @match        *://*.trixiebooru.org/*
// ==/UserScript==

(function() {
    'use strict';

    // =========================================================================
    // SCRIPT SETTINGS
    // =========================================================================

    const HIDE_TOOLTIPS = true; // Set to true to hide image hover tooltips, or false to keep them

    // =========================================================================
    // PER-SITE TAG CONFIGURATION
    // =========================================================================

    const SITE_TAGS = {
        // Main Sites
        'derpibooru.org': [
            'crotchboobs',
            'crotchbra',
            'foot focus',
            'vore',
        ],
        'manebooru.art': [
            'crotchboobs',
            'crotchbra',
            'foot focus',
            'vore',
        ],
        'ponerpics.org': [
            'crotchboobs',
            'crotchbra',
            'foot focus',
            'vore',
        ],
        'ponybooru.org': [
            'crotchboobs',
            'crotchbra',
            'foot focus',
            'vore',
        ],
        'tantabus.ai': [
            'crotchboobs',
            'crotchbra',
            'foot focus',
            'vore',
        ],
        'twibooru.org': [
            'artist:fizzyizatty',
            'crotchboobs',
            'crotchbra',
            'fat fetish',
            'fattershy',
            'foot focus',
            'immobile',
            'impossibly large belly',
            'impossibly large butt',
            'impossibly large everything',
            'impossibly obese',
            'morbidly obese',
            'obese',
            'vore',
        ],

        // Other Sites
        'furbooru.org': [
            'artist:cbcamesburyfan',
            'artist:the-furry-railfan',
            'foot focus',
            'hyper',
            'hyper belly',
            'hyper breasts',
            'hyper inflation',
            'teats',
            'vore',
        ],
        'trixiebooru.org': [
            'crotchboobs',
            'crotchbra',
            'foot focus',
            'vore',
        ],
    };

    // =========================================================================
    // HOST MATCHING & SETUP
    // =========================================================================

    function getActiveTags() {
        const hostname = window.location.hostname.toLowerCase();
        for (const [siteDomain, tags] of Object.entries(SITE_TAGS)) {
            if (hostname === siteDomain || hostname.endsWith('.' + siteDomain)) {
                return tags;
            }
        }
        return [];
    }

    const currentTagsArray = getActiveTags();
    const blurTagsSet = new Set(
        currentTagsArray
            .filter(t => t && !t.startsWith('tag placeholder'))
            .map(t => t.toLowerCase().trim())
    );

    // Inject CSS rules
    const css = `
        .custom-local-blur {
            filter: blur(25px) grayscale(100%) !important;
            transition: filter 0.3s ease-in-out !important;
        }

        .image-container:hover .custom-local-blur,
        .image-show-container:hover .custom-local-blur,
        .image-target:hover .custom-local-blur {
            filter: blur(0px) grayscale(0%) !important;
        }

        /* Simulated Overlay Styles */
        .filter-zero-overlay {
            pointer-events: none !important;
            transition: opacity 0.3s ease-in-out !important;
            opacity: 1 !important;
        }

        .image-container:hover .filter-zero-overlay {
            opacity: 0 !important;
        }

        /* Tagsauce Matched Tag Styles */
        .tag .filter-zero-greyscale,
        .tag a.filter-zero-greyscale {
            filter: grayscale(100%) !important;
            opacity: 0.3 !important;
            color: #888 !important;
            transition: filter 0.2s ease-in-out, opacity 0.2s ease-in-out, color 0.2s ease-in-out !important;
        }

        .tag:hover .filter-zero-greyscale,
        .tag:hover a.filter-zero-greyscale {
            filter: grayscale(0%) !important;
            opacity: 1 !important;
            color: inherit !important;
        }
    `;

    if (typeof GM_addStyle !== 'undefined') {
        GM_addStyle(css);
    } else {
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }

    // Helper to gather tags from .tagsauce / #tagsauce elements on post pages
    function getTagsauceText() {
        const tagsauceEl = document.querySelector('#tagsauce, .tagsauce');
        if (!tagsauceEl) return '';

        const dsTags = tagsauceEl.getAttribute('data-tags') || tagsauceEl.getAttribute('data-image-tags') || '';
        const tagLinksText = Array.from(tagsauceEl.querySelectorAll('.tag__name, a[data-tag-name]'))
            .map(el => el.getAttribute('data-tag-name') || el.textContent)
            .join(', ');

        return (dsTags + ', ' + tagLinksText).toLowerCase();
    }

    // Greyscale matching tags in the tagsauce container without disturbing dropdown elements
    function processTagsauceTags() {
        const tagElements = document.querySelectorAll('.tag[data-tag-name], #tagsauce .tag');

        tagElements.forEach(tagEl => {
            const tagName = (tagEl.getAttribute('data-tag-name') ||
                             tagEl.querySelector('.tag__name')?.getAttribute('data-tag-name') ||
                             tagEl.querySelector('.tag__name')?.textContent || '').toLowerCase().trim();

            if (!tagName) return;

            const targets = tagEl.querySelectorAll('.tag__name, .tag__count, span > a');

            if (blurTagsSet.has(tagName)) {
                targets.forEach(el => el.classList.add('filter-zero-greyscale'));
            } else {
                targets.forEach(el => el.classList.remove('filter-zero-greyscale'));
            }
        });
    }

    // Manage spoiler info overlay creation and updates (gallery grid thumbnails only)
    function updateOverlay(container, matchedTags) {
        // Skip overlay creation entirely if on a post detail view container
        if (!container.classList.contains('image-container')) {
            const existingOverlay = container.querySelector('.filter-zero-overlay');
            if (existingOverlay) existingOverlay.remove();
            return;
        }

        let overlay = container.querySelector('.filter-zero-overlay');

        if (matchedTags.length === 0) {
            if (overlay) overlay.remove();
            return;
        }

        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'media-box__overlay js-spoiler-info-overlay filter-zero-overlay';
            container.appendChild(overlay);
        }

        // Format tags with span tooltips matching native Philomena markup
        const formattedHtml = matchedTags.map((tag, idx) => {
            const separator = idx === 0 ? '' : ', ';
            return `${separator}<span title="${tag}">${tag}</span>`;
        }).join('');

        overlay.innerHTML = formattedHtml;
    }

    // Scan DOM elements and apply blur class to image/video targets
    function processThumbnails() {
        processTagsauceTags();

        const tagsauceString = getTagsauceText();
        const containers = document.querySelectorAll('.image-container, .image-show-container');

        containers.forEach(container => {
            const anchor = container.querySelector('a');
            const mediaTarget = container.querySelector('#image-display') ||
                                container.querySelector('.image-target img, .image-target video') ||
                                container.querySelector('img, video');

            if (HIDE_TOOLTIPS) {
                if (anchor && anchor.hasAttribute('title')) {
                    anchor.setAttribute('data-original-title', anchor.getAttribute('title'));
                    anchor.removeAttribute('title');
                }
                if (mediaTarget && mediaTarget.hasAttribute('title')) {
                    mediaTarget.setAttribute('data-original-title', mediaTarget.getAttribute('title'));
                    mediaTarget.removeAttribute('title');
                }
            } else {
                if (anchor && anchor.hasAttribute('data-original-title')) {
                    anchor.setAttribute('title', anchor.getAttribute('data-original-title'));
                    anchor.removeAttribute('data-original-title');
                }
                if (mediaTarget && mediaTarget.hasAttribute('data-original-title')) {
                    mediaTarget.setAttribute('title', mediaTarget.getAttribute('data-original-title'));
                    mediaTarget.removeAttribute('data-original-title');
                }
            }

            const rawTags = container.getAttribute('data-image-tag-aliases') ||
                            container.getAttribute('data-image-tags') ||
                            container.getAttribute('data-tags') ||
                            container.getAttribute('data-tag-names') || '';
            const linkTitle = anchor?.getAttribute('title') || anchor?.getAttribute('data-original-title') || '';

            if (!rawTags && !linkTitle && !tagsauceString) return;

            const tagString = (rawTags + ', ' + linkTitle + ', ' + tagsauceString).toLowerCase();
            const extractedTags = tagString.split(/,\s*/).map(t => t.trim());

            // Collect exact matching tags for overlay generation
            const matchedTags = Array.from(blurTagsSet).filter(targetTag =>
                extractedTags.includes(targetTag) || tagString.includes(targetTag)
            );

            const shouldBlur = matchedTags.length > 0;

            if (mediaTarget) {
                if (shouldBlur) {
                    mediaTarget.classList.add('custom-local-blur');
                    updateOverlay(container, matchedTags);
                } else {
                    mediaTarget.classList.remove('custom-local-blur');
                    updateOverlay(container, []);
                }
            }
        });
    }

    // Debounced scan queue using requestAnimationFrame
    let isScheduled = false;

    function queueScan() {
        if (isScheduled) return;
        isScheduled = true;

        requestAnimationFrame(() => {
            processThumbnails();
            isScheduled = false;
        });
    }

    // MutationObserver setup
    const observer = new MutationObserver((mutations) => {
        let shouldUpdate = false;

        for (const mutation of mutations) {
            if (mutation.target.classList &&
               (mutation.target.classList.contains('custom-local-blur') ||
                mutation.target.classList.contains('filter-zero-overlay') ||
                mutation.target.classList.contains('filter-zero-greyscale'))) {
                continue;
            }
            shouldUpdate = true;
            break;
        }

        if (shouldUpdate) {
            queueScan();
        }
    });

    // Start observer and run initial scans
    function init() {
        queueScan();

        const targetNode = document.querySelector('#content') || document.querySelector('#maincontent') || document.body;
        if (targetNode) {
            observer.observe(targetNode, { childList: true, subtree: true });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
