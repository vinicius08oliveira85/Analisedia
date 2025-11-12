import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

function getConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Variáveis de ambiente do Supabase ausentes. Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  return { url, serviceKey };
}

export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) return supabaseClient;

  const { url, serviceKey } = getConfig();
  supabaseClient = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  return supabaseClient;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

