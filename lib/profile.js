/**
 * Check if a user profile is complete
 * @param {Object} profile - The user profile object
 * @returns {boolean} - True if all required fields are filled
 */
export function isProfileComplete(profile) {
    if (!profile) return false;

    const requiredFields = ['full_name', 'department', 'year', 'gender', 'instagram_url'];

    return requiredFields.every(field => {
        const value = profile[field];
        // Check if value exists and is not empty
        return value !== null && value !== undefined && value !== '';
    });
}

/**
 * Get list of missing required fields
 * @param {Object} profile - The user profile object
 * @returns {string[]} - Array of missing field names
 */
export function getMissingFields(profile) {
    if (!profile) return ['full_name', 'department', 'year', 'gender', 'instagram_url'];

    const requiredFields = ['full_name', 'department', 'year', 'gender', 'instagram_url'];

    return requiredFields.filter(field => {
        const value = profile[field];
        return value === null || value === undefined || value === '';
    });
}
