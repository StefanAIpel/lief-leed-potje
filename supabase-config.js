// === Supabase Configuratie ===
const SUPABASE_URL = 'https://knxdefuncbzzbrunhlxg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_secret_zRnqvJazz8zbkuTGsToUVA_7WPSo_gz';

let supabase;

function initSupabase() {
    if (typeof window !== 'undefined' && window.supabase) {
        try {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase connected');
            return supabase;
        } catch (error) {
            console.error('❌ Supabase connection failed:', error);
            return null;
        }
    } else {
        console.warn('⚠️ Supabase client not loaded');
        return null;
    }
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initSupabase, SUPABASE_URL, SUPABASE_ANON_KEY };
}
