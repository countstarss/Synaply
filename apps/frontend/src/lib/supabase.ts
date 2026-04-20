import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseRuntimeConfigIssue } from "@/lib/public-runtime-config";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const SUPABASE_AVATAR_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_AVATAR_BUCKET || "avatars";

function validatePublicSupabaseRuntimeConfig() {
  const issue = getSupabaseRuntimeConfigIssue();
  if (issue) {
    throw new Error(issue);
  }
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase URL or Anon Key environment variables.");
}

export type BrowserSupabaseClient = ReturnType<typeof createBrowserClient<Database>>;

let browserClient: BrowserSupabaseClient | null = null;

function createRealtimeDebugOptions() {
  return undefined;
}

// 复用同一个浏览器端实例，避免 OAuth 回调阶段多个 client 竞争同一份 PKCE 状态。
export const createClientComponentClient = () => {
  validatePublicSupabaseRuntimeConfig();

  if (typeof window === "undefined") {
    return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  }

  return (browserClient ??= createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      realtime: createRealtimeDebugOptions(),
    },
  ));
};

export function getSupabasePublicConfig() {
  return {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
  };
}

export async function removeAllRealtimeChannels(
  client: BrowserSupabaseClient = createClientComponentClient(),
) {
  await Promise.all(client.getChannels().map((channel) => client.removeChannel(channel)));
}
