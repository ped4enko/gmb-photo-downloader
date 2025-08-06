# gmb-photo-downloader
Easy script for find and download photos from your Customers on your GMB profile

The script to work specifically on Google Maps contributor pages and handle the Google Photos URLs with the required URL modification.

## Key Features:

1.  **Google Maps Specific**: Only works on `https://www.google.com/maps/contrib/*` pages
2.  **Google Photos URL Detection**: Specifically looks for `lh3.googleusercontent.com`, `lh4.googleusercontent.com`, etc.
3.  **URL Conversion**: Automatically converts URLs like `=w1200-h969-p-k-no` to `=s2048-v1` for high-resolution downloads
4.  **Multiple Detection Methods**:
    -   IMG elements with Google Photos URLs
    -   Background images
    -   Data attributes (data-src, data-lazy-src, etc.)
    -   Page source scanning for URLs not yet in DOM

## How it works:

1.  **URL Pattern Recognition**: Detects Google Photos URLs with patterns like:
    -   `https://lh3.googleusercontent.com/gps-cs/[ID]=w1200-h969-p-k-no`
2.  **URL Transformation**: Converts them to high-resolution format:
    -   `https://lh3.googleusercontent.com/gps-cs/[ID]=s2048-v1`
    -   /geougc-cs/
3.  **Smart Scanning**:
    -   Scans visible images
    -   Checks data attributes for lazy-loaded images
    -   Searches page source for URLs that might not be loaded yet
    -   Waits 2 seconds during scan to catch lazy-loaded content
4.  **High-Quality Downloads**: Downloads images at `s2048-v1` resolution (2048px with version 1 quality)

## Usage:

1.  Install the script in Tampermonkey
2.  Go to any Google Maps contributor page (e.g., `https://www.google.com/maps/contrib/[USER_ID]`)
3.  Click "🔍 Scan for Google Photos Images"
4.  Select images you want (all selected by default)
5.  Click "📥 Download All" or "📥 Selected"

The script includes proper error handling, progress tracking, and generates meaningful filenames using the image IDs. All images will be downloaded in high resolution (`s2048-v1`) instead of the thumbnail resolution.

Created for [Best California Movers](https://bestcaliforniamovers.com/)
