// Supabase CDN SDK
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

const SUPABASE_URL = 'https://nxsposbreiggxxugbfdw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_xKDUvUg5qxl8n5CH473xqA_RqPE_wcl';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Auth Helpers
async function getCurrentUser() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return null;

    // Fetch profile for role - wrapping in try-catch to be resilient
    try {
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        return { ...user, role: profile?.role || 'user' };
    } catch (e) {
        console.warn("Profile fetch failed, defaulting to 'user' role:", e);
        return { ...user, role: 'user' };
    }
}

async function signOut() {
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
}

// Global Auth Guard for Admin
async function adminGuard() {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
        alert('관리자 권한이 필요합니다.');
        window.location.href = 'index.html';
    }
}
