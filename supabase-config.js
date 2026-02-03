// === Supabase Configuratie ===
(function() {
    const SUPABASE_URL = 'https://knxdefuncbzzbrunhlxg.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_WWpCcDyRZB-nzELswn3MGw_QHCdohNh';
    
    function initSupabase() {
        if (window.supabase && window.supabase.createClient) {
            try {
                window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                console.log('✅ Supabase connected');
                return window.supabaseClient;
            } catch (error) {
                console.error('❌ Supabase connection failed:', error);
                return null;
            }
        }
        return null;
    }
    
    // Try immediately
    if (!initSupabase()) {
        // Retry after a short delay (CDN might still be loading)
        setTimeout(initSupabase, 100);
    }
    
    // Make initSupabase available globally
    window.initSupabase = initSupabase;
})();
