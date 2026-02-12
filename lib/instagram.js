/**
 * Extract Instagram username from various input formats
 * @param {string} usernameOrUrl - Instagram username or URL
 * @returns {string} - Extracted username
 */
export function extractInstagramUsername(usernameOrUrl) {
    if (!usernameOrUrl) return '';

    try {
        // Extract username from URL
        if (usernameOrUrl.includes('instagram.com/')) {
            const urlParts = usernameOrUrl.split('instagram.com/')[1];
            return urlParts.split('/')[0].split('?')[0];
        }

        // Handle @username or plain username
        return usernameOrUrl.replace('@', '').trim();
    } catch (e) {
        console.error('Error parsing Instagram username:', e);
        return usernameOrUrl;
    }
}

/**
 * Open Instagram profile with platform-specific deep linking
 * @param {string} usernameOrUrl - Instagram username or URL
 */
export function openInstagramProfile(usernameOrUrl) {
    const username = extractInstagramUsername(usernameOrUrl);
    if (!username) return;

    const isAndroid = /Android/i.test(navigator.userAgent);

    if (isAndroid) {
        // Use Android intent URL for better app detection
        const intentUrl = `intent://instagram.com/_u/${username}`;
        window.location.href = intentUrl;

        // Fallback to web if app not installed
        setTimeout(() => {
            window.location.href = `https://www.instagram.com/_u/${username}/`;
        }, 1500);
    } else {
        // iOS and desktop: use HTTPS URL (iOS will open app automatically)
        window.location.href = `https://www.instagram.com/_u/${username}/`;
    }
}

/**
 * Get Instagram URL for href attribute
 * Returns # to prevent default navigation (use onClick with openInstagramProfile instead)
 * @param {string} usernameOrUrl - Instagram username or URL
 * @returns {string} - URL for href attribute
 */
export function getInstagramUrl(usernameOrUrl) {
    const username = extractInstagramUsername(usernameOrUrl);
    if (!username) return '#';

    // Return _u format for better deep linking
    return `https://www.instagram.com/_u/${username}/`;
}
