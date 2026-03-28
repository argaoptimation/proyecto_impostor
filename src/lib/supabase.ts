import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getServerTimeOffset(): Promise<number> {
  try {
    const t0 = Date.now();
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      headers: { apikey: supabaseAnonKey }
    });
    const dateHeader = res.headers.get('date');
    if (dateHeader) {
      const serverTime = new Date(dateHeader).getTime();
      const t1 = Date.now();
      const latency = (t1 - t0) / 2;
      return (serverTime + latency) - Date.now();
    }
  } catch (e) {
    console.warn('Failed to fetch server time offset, using local time');
  }
  return 0;
}
