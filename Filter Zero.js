// ==UserScript==
// @name         Filter Zero
// @description  Applies a CSS blur to specified tags in philomena booru sites to bypass Twibooru's 128-tag limit for spoilered and hidden tags
// @author       PixelSpark987 - https://is.gd/PS987
// @icon         https://cdn.twibooru.org/favicon.svg
// @downloadURL  https://raw.githubusercontent.com/PixelSpark987/Filter-Zero/refs/heads/main/Filter%20Zero.js
// @updateURL    https://raw.githubusercontent.com/PixelSpark987/Filter-Zero/refs/heads/main/Filter%20Zero.js
// @namespace    http://tampermonkey.net/
// @grant        GM_addStyle
// @version      2.5.0
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
// @match        *://trixiebooru.org/*
// @match        *://*.trixiebooru.org/*
// @match        *://furbooru.org/*
// @match        *://*.furbooru.org/*
// ==/UserScript==

(function() {
    'use strict';

    // =========================================================================
    // SCRIPT SETTINGS
    // =========================================================================

    const HIDE_TOOLTIPS = true; // Set to true to hide image hover tooltips, or false to keep them

    // =========================================================================
    // PER-SITE TAG CONFIGURATION (One tag per line)
    // =========================================================================

    const SITE_TAGS = {
        // Main Sites
        'derpibooru.org': [
            'tag placeholder 1',
            'tag placeholder 2',
            'tag placeholder 3',
        ],
        'manebooru.art': [
            'tag placeholder 1',
            'tag placeholder 2',
            'tag placeholder 3',
        ],
        'ponerpics.org': [
            'tag placeholder 1',
            'tag placeholder 2',
            'tag placeholder 3',
        ],
        'ponybooru.org': [
            'tag placeholder 1',
            'tag placeholder 2',
            'tag placeholder 3',
        ],
        'tantabus.ai': [
            'tag placeholder 1',
            'tag placeholder 2',
            'tag placeholder 3',
        ],
        'twibooru.org': [
            'tag placeholder 1',
            'tag placeholder 2',
            'tag placeholder 3',
        ],

        // Other Sites
        'trixiebooru.org': [
            'tag placeholder 1',
            'tag placeholder 2',
            'tag placeholder 3',
        ],
        'furbooru.org': [
            'tag placeholder 1',
            'tag placeholder 2',
            'tag placeholder 3',
        ]
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
        img.custom-local-blur {
            filter: blur(25px) grayscale(100%) !important;
            transition: filter 0.3s ease-in-out !important;
        }

        .image-container:hover img.custom-local-blur {
            filter: blur(0px) grayscale(0%) !important;
        }
    `;

    if (typeof GM_addStyle !== 'undefined') {
        GM_addStyle(css);
    } else {
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }

    // Scan DOM elements and apply blur class to image targets
    function processThumbnails() {
        const containers = document.querySelectorAll('.image-container, .image-show');

        containers.forEach(container => {
            const anchor = container.querySelector('a');
            const img = container.querySelector('img');

            // Handle tooltip suppression safely without breaking tag matching
            if (HIDE_TOOLTIPS) {
                if (anchor && anchor.hasAttribute('title')) {
                    anchor.setAttribute('data-original-title', anchor.getAttribute('title'));
                    anchor.removeAttribute('title');
                }
                if (img && img.hasAttribute('title')) {
                    img.setAttribute('data-original-title', img.getAttribute('title'));
                    img.removeAttribute('title');
                }
            } else {
                if (anchor && anchor.hasAttribute('data-original-title')) {
                    anchor.setAttribute('title', anchor.getAttribute('data-original-title'));
                    anchor.removeAttribute('data-original-title');
                }
                if (img && img.hasAttribute('data-original-title')) {
                    img.setAttribute('title', img.getAttribute('data-original-title'));
                    img.removeAttribute('data-original-title');
                }
            }

            // Check multiple potential data attributes across different Philomena views
            const rawTags = container.getAttribute('data-image-tag-aliases') ||
                            container.getAttribute('data-tags') ||
                            container.getAttribute('data-tag-names') || '';
            const linkTitle = anchor?.getAttribute('title') || anchor?.getAttribute('data-original-title') || '';

            if (!rawTags && !linkTitle) return;

            // Extract tags as exact complete strings using comma separation or Philomena's JSON/space-delimited string layout
            const tagString = (rawTags + ', ' + linkTitle).toLowerCase();
            const extractedTags = tagString.split(/,\s*/).map(t => t.trim());

            // Check for exact string matches against your blur tag list
            const shouldBlur = extractedTags.some(tag => blurTagsSet.has(tag)) ||
                               Array.from(blurTagsSet).some(targetTag => tagString.includes(targetTag));

            if (img) {
                if (shouldBlur) {
                    img.classList.add('custom-local-blur');
                } else {
                    img.classList.remove('custom-local-blur');
                }
            }
        });
    }

    // Debounced scan queue using requestAnimationFrame to prevent Firefox thread locking
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
            // Ignore mutations caused by our own class changes
            if (mutation.target.classList && mutation.target.classList.contains('custom-local-blur')) {
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