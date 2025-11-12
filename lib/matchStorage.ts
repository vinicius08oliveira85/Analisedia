import type { MatchDetails } from '../types';
import type { ProcessedMatch } from './matchParser';
import { getSupabaseClient, isSupabaseConfigured } from './supabase';

export interface MatchRow {
  match_id: string;
  match_date: string;
  event_start: string | null;
  payload: MatchDetails;
  raw_event?: unknown;
  source_url?: string | null;
  updated_at: string;
}

export interface PersistResult {
  inserted: number;
}

export interface PersistOptions {
  tableName?: string;
  timezone?: string;
  sourceUrl?: string;
}

export interface FetchResult {
  date: string;
  rows: MatchRow[];
  matches: MatchDetails[];
}

const DEFAULT_TIMEZONE = process.env.MATCHES_TIMEZONE ?? 'America/Sao_Paulo';
const DEFAULT_TABLE_NAME = process.env.SUPABASE_MATCHES_TABLE ?? 'daily_matches';

export function formatDateKey(date: Date, timezone: string = DEFAULT_TIMEZONE): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(date);
}

export function normalizeDateInput(input: string | undefined, timezone: string = DEFAULT_TIMEZONE): string {
  if (!input) {
    return formatDateKey(new Date(), timezone);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return input;
  }

  const parsed = new Date(input);
  if (!Number.isNaN(parsed.valueOf())) {
    return formatDateKey(parsed, timezone);
  }

  return formatDateKey(new Date(), timezone);
}

export async function fetchMatchesByDate(
  dateInput: string | undefined,
  options?: { tableName?: string; timezone?: string }
): Promise<FetchResult> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase não configurado');
  }

  const tableName = options?.tableName ?? DEFAULT_TABLE_NAME;
  const timezone = options?.timezone ?? DEFAULT_TIMEZONE;
  const targetDate = normalizeDateInput(dateInput, timezone);

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(tableName)
    .select('match_id, match_date, event_start, payload, raw_event, source_url, updated_at')
    .eq('match_date', targetDate)
    .order('event_start', { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar jogos no Supabase: ${error.message}`);
  }

  const rows = (data ?? []) as MatchRow[];
  const matches = rows.map(row => row.payload);

  return { date: targetDate, rows, matches };
}

export async function persistProcessedMatches(
  processedMatches: ProcessedMatch[],
  options?: PersistOptions
): Promise<PersistResult> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase não configurado');
  }

  if (!processedMatches.length) {
    return { inserted: 0 };
  }

  const tableName = options?.tableName ?? DEFAULT_TABLE_NAME;
  const timezone = options?.timezone ?? DEFAULT_TIMEZONE;
  const fallbackSourceUrl = options?.sourceUrl ?? null;
  const supabase = getSupabaseClient();
  const nowIso = new Date().toISOString();

  const records = processedMatches
    .map(({ event, match }) => {
      if (!match?.id) return null;
      const startDate = event?.startDate ? new Date(event.startDate) : null;
      const matchDate = startDate ? formatDateKey(startDate, timezone) : formatDateKey(new Date(), timezone);

      return {
        match_id: match.id,
        match_date: matchDate,
        event_start: startDate ? startDate.toISOString() : null,
        payload: match,
        raw_event: event ?? null,
        source_url: fallbackSourceUrl ?? event?.url ?? null,
        updated_at: nowIso
      };
    })
    .filter(Boolean);

  if (!records.length) {
    return { inserted: 0 };
  }

  const { data, error } = await supabase
    .from(tableName)
    .upsert(records, { onConflict: 'match_id,match_date' })
    .select('match_id');

  if (error) {
    throw new Error(`Erro ao salvar jogos no Supabase: ${error.message}`);
  }

  return { inserted: data?.length ?? 0 };
}

