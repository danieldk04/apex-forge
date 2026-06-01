// Supabase sync module for APEX FORGE
// Loaded after index.html sets up state

const SUPABASE_CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';

let supabaseClient = null;

async function initSupabase(url, key) {
  if (!url || !key) return false;
  return new Promise((resolve) => {
    if (window.supabase) {
      supabaseClient = window.supabase.createClient(url, key);
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = SUPABASE_CDN;
    script.onload = () => {
      supabaseClient = window.supabase.createClient(url, key);
      resolve(true);
    };
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

async function syncPush(userId, state) {
  if (!supabaseClient || !userId) return;
  try {
    await supabaseClient.from('forge_state').upsert({
      user_id: userId,
      state: state,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    updateSyncIndicator('synced');
  } catch (e) {
    updateSyncIndicator('error');
  }
}

async function syncPull(userId) {
  if (!supabaseClient || !userId) return null;
  try {
    const { data, error } = await supabaseClient
      .from('forge_state')
      .select('state, updated_at')
      .eq('user_id', userId)
      .single();
    if (error || !data) return null;
    return data.state;
  } catch (e) {
    return null;
  }
}

function updateSyncIndicator(status) {
  const el = document.getElementById('syncIndicator');
  if (!el) return;
  const map = {
    syncing: { text: 'Syncing...', color: '#ff9500' },
    synced: { text: '✓ Gesynchroniseerd', color: '#34c759' },
    error: { text: '⚠ Sync mislukt', color: '#ff3b30' },
    offline: { text: 'Offline', color: '#8e8e93' },
  };
  const s = map[status] || map.offline;
  el.textContent = s.text;
  el.style.color = s.color;
}
