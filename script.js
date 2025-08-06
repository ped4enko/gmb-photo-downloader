// ==UserScript==
// @name         Google Maps Images Extractor
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Extract and download high-resolution images from Google Maps contributor pages
// @author       Ped4enko
// @match        https://www.google.com/maps/contrib/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Configuration
    const config = {
        downloadDelay: 1000, // Delay between downloads (ms)
        targetResolution: 's2048-v1' // High resolution parameter
    };

    // Create floating UI panel
    function createUI() {
        const panel = document.createElement('div');
        panel.id = 'gmaps-image-extractor-panel';
        panel.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                width: 350px;
                background: #1a73e8;
                color: white;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                z-index: 10000;
                font-family: 'Google Sans', Arial, sans-serif;
                font-size: 14px;
            ">
                <div style="
                    background: #1557b0;
                    padding: 16px;
                    border-radius: 12px 12px 0 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: move;
                " id="panel-header">
                    <h3 style="margin: 0; color: white; font-size: 16px;">🗺️ Google Maps Image Extractor</h3>
                    <button id="close-panel" style="
                        background: #ea4335;
                        border: none;
                        color: white;
                        padding: 6px 12px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                    ">×</button>
                </div>
                <div style="padding: 16px;">
                    <div style="margin-bottom: 16px; text-align: center;">
                        <div style="
                            background: rgba(255,255,255,0.1);
                            padding: 8px;
                            border-radius: 6px;
                            font-size: 12px;
                            margin-bottom: 12px;
                        ">
                            Downloads images at ${config.targetResolution} resolution
                        </div>
                        <button id="scan-images" style="
                            background: #34a853;
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 8px;
                            cursor: pointer;
                            width: 100%;
                            font-size: 14px;
                            font-weight: 500;
                        ">🔍 Scan for Google Photos Images</button>
                    </div>

                    <div id="results" style="
                        max-height: 300px;
                        overflow-y: auto;
                        background: rgba(255,255,255,0.1);
                        border-radius: 8px;
                        padding: 12px;
                        margin-bottom: 12px;
                        display: none;
                    ">
                        <div id="image-count" style="margin-bottom: 10px; font-weight: 500;"></div>
                        <div id="image-list"></div>
                    </div>

                    <div id="download-controls" style="display: none;">
                        <button id="download-all" style="
                            background: #fbbc04;
                            color: #1f1f1f;
                            border: none;
                            padding: 10px 16px;
                            border-radius: 6px;
                            cursor: pointer;
                            width: 48%;
                            margin-right: 4%;
                            font-weight: 500;
                        ">📥 Download All</button>
                        <button id="download-selected" style="
                            background: #ff6d01;
                            color: white;
                            border: none;
                            padding: 10px 16px;
                            border-radius: 6px;
                            cursor: pointer;
                            width: 48%;
                            font-weight: 500;
                        ">📥 Selected</button>
                    </div>

                    <div id="progress" style="
                        margin-top: 12px;
                        background: rgba(255,255,255,0.1);
                        border-radius: 8px;
                        padding: 12px;
                        display: none;
                    ">
                        <div id="progress-text" style="margin-bottom: 8px;">Ready</div>
                        <div style="
                            width: 100%;
                            background: rgba(255,255,255,0.2);
                            border-radius: 4px;
                            overflow: hidden;
                        ">
                            <div id="progress-bar" style="
                                width: 0%;
                                height: 8px;
                                background: #34a853;
                                border-radius: 4px;
                                transition: width 0.3s ease;
                            "></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(panel);

        // Add event listeners
        setupEventListeners();
    }

    // Find all Google Photos images in the page
    function findGooglePhotosImages() {
        const images = [];
        const processedUrls = new Set();

        // Look for images in various ways
        const selectors = [
            'img[src*="googleusercontent.com/gps-cs/"]',
            'img[src*="lh3.googleusercontent.com/gps-cs/"]',
            'img[src*="lh4.googleusercontent.com/gps-cs/"]',
            'img[src*="lh5.googleusercontent.com/gps-cs/"]'
        ];

        selectors.forEach(selector => {
            const imgElements = document.querySelectorAll(selector);
            imgElements.forEach(img => {
                if (img.src && isGooglePhotosUrl(img.src)) {
                    const originalUrl = img.src;
                    const highResUrl = convertToHighResolution(originalUrl);

                    if (!processedUrls.has(highResUrl)) {
                        images.push({
                            originalUrl: originalUrl,
                            highResUrl: highResUrl,
                            alt: img.alt || 'Google Photos Image',
                            element: img
                        });
                        processedUrls.add(highResUrl);
                    }
                }
            });
        });

        // Also check for background images and data attributes
        const allElements = document.querySelectorAll('*');
        allElements.forEach(el => {
            // Check data attributes that might contain image URLs
            const attributes = ['data-src', 'data-lazy-src', 'data-original'];
            attributes.forEach(attr => {
                const url = el.getAttribute(attr);
                if (url && isGooglePhotosUrl(url)) {
                    const highResUrl = convertToHighResolution(url);
                    if (!processedUrls.has(highResUrl)) {
                        images.push({
                            originalUrl: url,
                            highResUrl: highResUrl,
                            alt: 'Google Photos Image (from data attribute)',
                            element: el
                        });
                        processedUrls.add(highResUrl);
                    }
                }
            });

            // Check background images
            const style = window.getComputedStyle(el);
            const bgImage = style.backgroundImage;
            if (bgImage && bgImage !== 'none') {
                const matches = bgImage.match(/url\(['"]?(.*?)['"]?\)/);
                if (matches && matches[1] && isGooglePhotosUrl(matches[1])) {
                    const highResUrl = convertToHighResolution(matches[1]);
                    if (!processedUrls.has(highResUrl)) {
                        images.push({
                            originalUrl: matches[1],
                            highResUrl: highResUrl,
                            alt: 'Google Photos Background Image',
                            element: el
                        });
                        processedUrls.add(highResUrl);
                    }
                }
            }
        });

        // Also scan page source for any URLs that might not be in DOM yet
        const pageHTML = document.documentElement.outerHTML;
        const urlRegex = /https:\/\/lh[3-6]\.googleusercontent\.com\/gps-cs\/[^"'\s>]+/g;
        const urlMatches = pageHTML.match(urlRegex) || [];

        urlMatches.forEach(url => {
            if (isGooglePhotosUrl(url)) {
                const highResUrl = convertToHighResolution(url);
                if (!processedUrls.has(highResUrl)) {
                    images.push({
                        originalUrl: url,
                        highResUrl: highResUrl,
                        alt: 'Google Photos Image (from page source)',
                        element: null
                    });
                    processedUrls.add(highResUrl);
                }
            }
        });

        console.log(`Found ${images.length} Google Photos images`);
        return images;
    }

    // Check if URL is a Google Photos/GoogleUserContent URL
    function isGooglePhotosUrl(url) {
        return url.includes('googleusercontent.com/gps-cs/') &&
               (url.includes('lh3.') || url.includes('lh4.') || url.includes('lh5.') || url.includes('lh6.'));
    }

    // Convert Google Photos URL to high resolution
    function convertToHighResolution(url) {
        // Remove existing size parameters and add high resolution parameter
        // Pattern: =w1200-h969-p-k-no or =w400-h300-no or similar
        const sizeParamRegex = /=[wh]\d+(-[wh]\d+)*(-[a-z-]+)*(-no)?$/;
        let cleanUrl = url.replace(sizeParamRegex, '');

        // Add high resolution parameter
        return cleanUrl + '=' + config.targetResolution;
    }

    // Generate filename from URL
    function getFilenameFromUrl(url, index) {
        try {
            // Extract the unique ID from Google Photos URL
            const urlParts = url.split('/');
            const imageId = urlParts[urlParts.length - 1].split('=')[0];
            const shortId = imageId.substring(0, 16); // Use first 16 characters
            return `gmaps_image_${index + 1}_${shortId}.jpg`;
        } catch {
            return `gmaps_image_${index + 1}_${Date.now()}.jpg`;
        }
    }

    // Display found images
    function displayImages(images) {
        const resultsDiv = document.getElementById('results');
        const countDiv = document.getElementById('image-count');
        const listDiv = document.getElementById('image-list');

        countDiv.innerHTML = `
            <span style="color: #34a853;">✓ Found ${images.length} Google Photos images</span><br>
            <span style="font-size: 12px; opacity: 0.9;">Will download at ${config.targetResolution} resolution</span>
        `;
        listDiv.innerHTML = '';

        images.forEach((img, index) => {
            const imgDiv = document.createElement('div');
            imgDiv.style.cssText = `
                border: 1px solid rgba(255,255,255,0.2);
                margin: 6px 0;
                padding: 10px;
                border-radius: 6px;
                background: rgba(255,255,255,0.05);
            `;

            const filename = getFilenameFromUrl(img.highResUrl, index);

            imgDiv.innerHTML = `
                <label style="display: flex; align-items: center; cursor: pointer;">
                    <input type="checkbox" checked data-index="${index}" style="margin-right: 10px; transform: scale(1.2);">
                    <div style="flex: 1;">
                        <div style="font-weight: 500; font-size: 13px; margin-bottom: 4px;">${filename}</div>
                        <div style="font-size: 11px; opacity: 0.8;">High-res: ${config.targetResolution}</div>
                        <div style="font-size: 10px; opacity: 0.6; word-break: break-all; margin-top: 2px;">
                            ${img.originalUrl.substring(0, 60)}...
                        </div>
                    </div>
                </label>
            `;

            listDiv.appendChild(imgDiv);
        });

        resultsDiv.style.display = 'block';
        document.getElementById('download-controls').style.display = 'block';
    }

    // Download a single image
    function downloadImage(imageData, filename, index, total) {
        return new Promise((resolve) => {
            const progressText = document.getElementById('progress-text');
            const progressBar = document.getElementById('progress-bar');

            progressText.innerHTML = `
                📥 Downloading ${index + 1}/${total}<br>
                <span style="font-size: 12px; opacity: 0.8;">${filename}</span>
            `;
            progressBar.style.width = `${((index + 1) / total) * 100}%`;

            // Use the high resolution URL
            const url = imageData.highResUrl;

            fetch(url, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.blob();
                })
                .then(blob => {
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = filename;
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(link.href);

                    console.log(`Downloaded: ${filename}`);
                    setTimeout(resolve, config.downloadDelay);
                })
                .catch(error => {
                    console.error(`Failed to download ${filename}:`, error);
                    // Fallback: try direct link method
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = filename;
                    link.target = '_blank';
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    setTimeout(resolve, config.downloadDelay);
                });
        });
    }

    // Download selected images
    async function downloadImages(images, selectedOnly = false) {
        const progressDiv = document.getElementById('progress');
        progressDiv.style.display = 'block';

        let imagesToDownload = images;

        if (selectedOnly) {
            const checkboxes = document.querySelectorAll('#image-list input[type="checkbox"]:checked');
            const selectedIndices = Array.from(checkboxes).map(cb => parseInt(cb.dataset.index));
            imagesToDownload = images.filter((_, index) => selectedIndices.includes(index));
        }

        if (imagesToDownload.length === 0) {
            alert('No images selected for download!');
            progressDiv.style.display = 'none';
            return;
        }

        console.log(`Starting download of ${imagesToDownload.length} images...`);

        for (let i = 0; i < imagesToDownload.length; i++) {
            const imageData = imagesToDownload[i];
            const filename = getFilenameFromUrl(imageData.highResUrl, i);
            await downloadImage(imageData, filename, i, imagesToDownload.length);
        }

        document.getElementById('progress-text').innerHTML = `
            ✅ Completed!<br>
            <span style="font-size: 12px;">Downloaded ${imagesToDownload.length} high-resolution images</span>
        `;

        setTimeout(() => {
            progressDiv.style.display = 'none';
        }, 5000);
    }

    // Setup event listeners
    function setupEventListeners() {
        let foundImages = [];

        document.getElementById('close-panel').addEventListener('click', () => {
            document.getElementById('gmaps-image-extractor-panel').remove();
        });

        document.getElementById('scan-images').addEventListener('click', () => {
            document.getElementById('scan-images').textContent = '🔄 Scanning...';
            document.getElementById('scan-images').disabled = true;

            // Wait a bit for any lazy-loaded images
            setTimeout(() => {
                foundImages = findGooglePhotosImages();
                displayImages(foundImages);

                document.getElementById('scan-images').textContent = '🔍 Scan for Google Photos Images';
                document.getElementById('scan-images').disabled = false;
            }, 2000);
        });

        document.getElementById('download-all').addEventListener('click', () => {
            if (foundImages.length > 0) {
                downloadImages(foundImages, false);
            }
        });

        document.getElementById('download-selected').addEventListener('click', () => {
            if (foundImages.length > 0) {
                downloadImages(foundImages, true);
            }
        });

        // Make panel draggable
        let isDragging = false;
        let currentX, currentY, initialX, initialY, xOffset = 0, yOffset = 0;

        const panel = document.getElementById('gmaps-image-extractor-panel').firstElementChild;
        const header = document.getElementById('panel-header');

        header.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        function dragStart(e) {
            if (e.target.id === 'close-panel') return;

            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
            isDragging = true;
            header.style.cursor = 'grabbing';
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;

                xOffset = currentX;
                yOffset = currentY;

                panel.style.transform = `translate(${currentX}px, ${currentY}px)`;
            }
        }

        function dragEnd() {
            isDragging = false;
            header.style.cursor = 'move';
        }
    }

    // Initialize the script
    function init() {
        // Check if we're on the right page
        if (!window.location.href.includes('google.com/maps/contrib/')) {
            console.log('Google Maps Image Extractor: Not on a Google Maps contributor page');
            return;
        }

        // Wait for page to load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(createUI, 1000);
            });
        } else {
            setTimeout(createUI, 1000);
        }

        console.log('Google Maps Image Extractor: Initialized');
    }

    // Start the script
    init();

})();
