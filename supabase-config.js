// === Supabase Configuratie ===
(function() {
    const SUPABASE_URL = 'https://knxdefuncbzzbrunhlxg.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtueGRlZnVuY2J6emJydW5obHhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMjM0NzIsImV4cCI6MjA4NTU5OTQ3Mn0.QRQ0uxK65s_9EaVZkqpFMGOGCvpH5GKisHqg1ZZay3Y';
    
    function initSupabase() {
        if (window.supabase && window.supabase.createClient) {
            try {
                window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                // Alias so pages can use `supabaseDb.from(...)` consistently
                window.supabaseDb = window.supabaseClient;
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
