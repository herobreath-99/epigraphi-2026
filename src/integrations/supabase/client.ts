import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { brokeredPreviewStorage } from './previewAuthStorage';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith('sb_publishable_') || value.startsWith('sb_secret_');
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    // New Supabase API keys are opaque strings, not bearer JWTs.
    if (isNewSupabaseApiKey(supabaseKey) && headers.get('Authorization') === `Bearer ${supabaseKey}`) {
      headers.delete('Authorization');
    }

    headers.set('apikey', supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

type MockRow = Record<string, unknown>;
type MockSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: Record<string, unknown>;
};

// Local fallback mock client when Supabase env vars are not configured in AI Studio
function createMockSupabaseClient(): SupabaseClient<Database> {
  console.warn('[AI Studio] Supabase env vars not configured — using local mock client');

  const STORAGE_KEYS = {
    session: 'epigraphi_mock_session',
    scans: 'epigraphi_mock_scans',
    profiles: 'epigraphi_mock_profiles',
  };

  type AuthListener = (event: string, session: MockSession | null) => void;
  const listeners = new Set<AuthListener>();

  const readJson = <T,>(key: string, fallback: T): T => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  };

  const writeJson = (key: string, value: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore storage quota errors
    }
  };

  const notifyAuth = (event: string, session: MockSession | null) => {
    listeners.forEach((cb) => {
      try {
        cb(event, session);
      } catch {
        // ignore listener errors
      }
    });
  };

  const buildSession = (email: string, fullName?: string): MockSession => {
    const userId = 'local-user-' + btoa(email.toLowerCase()).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
    const now = new Date().toISOString();
    const user = {
      id: userId,
      aud: 'authenticated',
      role: 'authenticated',
      email,
      email_confirmed_at: now,
      created_at: now,
      updated_at: now,
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: { full_name: fullName || email.split('@')[0] },
    };
    return {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      token_type: 'bearer',
      user,
    };
  };

  const getTableKey = (table: string) =>
    table === 'profiles' ? STORAGE_KEYS.profiles : STORAGE_KEYS.scans;

  const createQueryBuilder = (table: string) => {
    let rows = readJson<MockRow[]>(getTableKey(table), []);
    const filters: Array<(row: MockRow) => boolean> = [];
    let orderBy: { col: string; ascending: boolean } | null = null;
    let limitCount: number | null = null;
    let selectOpts: { count?: string; head?: boolean } = {};
    let mode: 'select' | 'insert' | 'upsert' | 'delete' = 'select';
    let payload: MockRow | MockRow[] | null = null;
    let upsertOnConflict: string | null = null;

    const execute = async () => {
      rows = readJson<MockRow[]>(getTableKey(table), []);
      if (mode === 'insert' && payload) {
        const items = Array.isArray(payload) ? payload : [payload];
        const inserted = items.map((item) => ({
          id: item.id || crypto.randomUUID?.() || String(Date.now()),
          created_at: item.created_at || new Date().toISOString(),
          ...item,
        }));
        const next = [...inserted, ...rows];
        writeJson(getTableKey(table), next);
        return { data: inserted, error: null, count: inserted.length };
      }

      if (mode === 'upsert' && payload) {
        const items = Array.isArray(payload) ? payload : [payload];
        const keyCol = upsertOnConflict || 'id';
        const next = [...rows];
        for (const item of items) {
          const idx = next.findIndex((r) => r[keyCol] === item[keyCol]);
          if (idx >= 0) {
            next[idx] = { ...next[idx], ...item };
          } else {
            next.unshift({
              id: item.id || crypto.randomUUID?.() || String(Date.now()),
              created_at: item.created_at || new Date().toISOString(),
              ...item,
            });
          }
        }
        writeJson(getTableKey(table), next);
        return { data: items, error: null, count: items.length };
      }

      if (mode === 'delete') {
        const remaining = rows.filter((r) => !filters.every((fn) => fn(r)));
        writeJson(getTableKey(table), remaining);
        return { data: null, error: null, count: rows.length - remaining.length };
      }

      let result = rows.filter((r) => filters.every((fn) => fn(r)));
      if (orderBy) {
        const { col, ascending } = orderBy;
        result = [...result].sort((a, b) => {
          const av = String(a?.[col] ?? '');
          const bv = String(b?.[col] ?? '');
          return ascending ? (av > bv ? 1 : av < bv ? -1 : 0) : (av < bv ? 1 : av > bv ? -1 : 0);
        });
      }
      const total = result.length;
      if (limitCount !== null) {
        result = result.slice(0, limitCount);
      }
      if (selectOpts.head) {
        return { data: null, error: null, count: total };
      }
      return { data: result, error: null, count: total };
    };

    const builder = {
      select(_cols?: string, opts?: { count?: string; head?: boolean }) {
        mode = 'select';
        selectOpts = opts || {};
        return builder;
      },
      insert(data: MockRow | MockRow[]) {
        mode = 'insert';
        payload = data;
        return builder;
      },
      upsert(data: MockRow | MockRow[], opts?: { onConflict?: string }) {
        mode = 'upsert';
        payload = data;
        upsertOnConflict = opts?.onConflict || null;
        return builder;
      },
      delete() {
        mode = 'delete';
        return builder;
      },
      eq(col: string, val: unknown) {
        filters.push((r) => r?.[col] === val);
        return builder;
      },
      order(col: string, opts?: { ascending?: boolean }) {
        orderBy = { col, ascending: opts?.ascending !== false };
        return builder;
      },
      limit(n: number) {
        limitCount = n;
        return builder;
      },
      async maybeSingle() {
        const res = await execute();
        const first = Array.isArray(res.data) ? res.data[0] ?? null : res.data ?? null;
        return { data: first, error: res.error };
      },
      async single() {
        const res = await execute();
        const first = Array.isArray(res.data) ? res.data[0] ?? null : res.data ?? null;
        return { data: first, error: res.error };
      },
      then<TResult1 = unknown, TResult2 = never>(
        resolve?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null,
        reject?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
      ) {
        return execute().then(resolve, reject);
      },
    };
    return builder;
  };

  const mock = {
    auth: {
      onAuthStateChange(callback: AuthListener) {
        listeners.add(callback);
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                listeners.delete(callback);
              },
            },
          },
        };
      },
      async getSession() {
        const session = readJson<MockSession | null>(STORAGE_KEYS.session, null);
        return { data: { session }, error: null };
      },
      async signUp({
        email,
        options,
      }: {
        email: string;
        password: string;
        options?: { data?: { full_name?: string } };
      }) {
        const session = buildSession(email, options?.data?.full_name);
        writeJson(STORAGE_KEYS.session, session);
        notifyAuth('SIGNED_IN', session);
        return { data: { user: session.user, session }, error: null };
      },
      async signInWithPassword({ email }: { email: string; password: string }) {
        const session = buildSession(email);
        writeJson(STORAGE_KEYS.session, session);
        notifyAuth('SIGNED_IN', session);
        return { data: { user: session.user, session }, error: null };
      },
      async signOut() {
        localStorage.removeItem(STORAGE_KEYS.session);
        notifyAuth('SIGNED_OUT', null);
        return { error: null };
      },
      async resetPasswordForEmail(_email: string) {
        return { data: {}, error: null };
      },
      async updateUser(_attrs: Record<string, unknown>) {
        const session = readJson<MockSession | null>(STORAGE_KEYS.session, null);
        return { data: { user: session?.user ?? null }, error: null };
      },
      async setSession(tokens: Partial<MockSession>) {
        const session = tokens?.user
          ? (tokens as MockSession)
          : buildSession('researcher@epigraphi.dz', 'Archaeology Researcher');
        writeJson(STORAGE_KEYS.session, session);
        notifyAuth('SIGNED_IN', session);
        return { data: { session }, error: null };
      },
    },
    from(table: string) {
      return createQueryBuilder(table);
    },
    functions: {
      async invoke(name: string, options?: { body?: { imageHash?: string } }) {
        if (name === 'enhance-image') {
          return { data: { fallback: true }, error: null };
        }
        if (name === 'analyze-inscription') {
          const imageHash = options?.body?.imageHash || 'FRAG-DEMO-001';
          return {
            data: {
              source: 'AI',
              matchConfidence: 0.91,
              analysis: {
                fragmentId: imageHash,
                region: 'Numidia (Algeria)',
                site: 'Timgad (Thamugadi)',
                scriptType: 'Latin',
                diplomatic: {
                  content: 'D · M · S\nL · CAECILIVS · OPTATVS\nVIX · ANN · LXII\nH · S · E',
                  confidence: 92,
                  note: 'Sample epigraphic analysis (connect Supabase backend for live AI vision analysis).',
                },
                normalized: {
                  content: 'D(is) M(anibus) s(acrum) / L(ucius) Caecilius Optatus / vix(it) ann(is) LXII / h(ic) s(itus) e(st)',
                  confidence: 94,
                },
                expanded: {
                  content: 'Dis Manibus sacrum. Lucius Caecilius Optatus vixit annis LXII. Hic situs est.',
                  confidence: 94,
                  highlight: 'Dis Manibus sacrum',
                },
                translation: {
                  ar: 'مكرّس لأرواح الأسلاف. لوكيوس كايكيليوس أوبتاتوس، عاش اثنتين وستين سنة. هنا يرقد.',
                  fr: 'Consacré aux dieux Mânes. Lucius Caecilius Optatus a vécu soixante-deux ans. Il repose ici.',
                  en: 'Sacred to the Spirits of the Departed. Lucius Caecilius Optatus lived sixty-two years. Here he lies.',
                },
                translationSources: ['CIL VIII 2394 (Demo)', 'ILAlg II/3'],
                aiCommentary:
                  'نقيشة جنائزية لاتينية نموذجية من العصر الروماني في نوميديا (تيمقاد)، تبدأ بالصيغة الجنائزية الشهيرة D.M.S (Dis Manibus Sacrum) وتختتم بصيغة H.S.E (Hic Situs Est). هذا تحليل تجريبي محلي؛ اربط خادم Supabase لتفعيل التحليل المباشر بالذكاء الاصطناعي.',
                references: ['CIL VIII 2394', 'ILAlg II/3 7683 — مرجع نموذجي'],
                confidenceHeatmap: {
                  highConfidence: 'D M S · L CAECILIVS · VIX ANN',
                  mediumConfidence: 'OPTATVS · LXII',
                  lowConfidence: 'H S E',
                },
                resolvedSource: 'AI',
                matchConfidence: 0.91,
              },
            },
            error: null,
          };
        }
        return { data: null, error: new Error(`Mock edge function not implemented: ${name}`) };
      },
    },
  };

  return mock as unknown as SupabaseClient<Database>;
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase: SupabaseClient<Database> = isSupabaseConfigured
  ? createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      global: {
        fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY),
      },
      auth: {
        storage: brokeredPreviewStorage(),
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : createMockSupabaseClient();
