// Configuration Template for Breastfeeding Monitor
// Copy this file to config.js and fill in your Supabase credentials

// Supabase Configuration
// Get these values from your Supabase dashboard: Settings > API
const SUPABASE_CONFIG = {
    // Your Supabase project URL
    // Example: 'https://your-project-id.supabase.co'
    url: 'YOUR_SUPABASE_URL_HERE',

    // Your Supabase anon/public key
    // Example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    anonKey: 'YOUR_SUPABASE_ANON_KEY_HERE'
};

// App Configuration
const APP_CONFIG = {
    // App name displayed in the interface
    appName: 'מוניטור הנקה',

    // Number of recent sessions to display
    recentSessionsCount: 3,

    // Enable/disable features
    features: {
        sharing: true,
        csvExport: true,
        statistics: true
    }
};

// Export configuration (for use in main script)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SUPABASE_CONFIG, APP_CONFIG };
}

// Instructions:
// 1. Copy this file to config.js
// 2. Replace YOUR_SUPABASE_URL_HERE with your actual Supabase URL
// 3. Replace YOUR_SUPABASE_ANON_KEY_HERE with your actual anon key
// 4. Save the file
// 5. Update script.js to use these configuration values 