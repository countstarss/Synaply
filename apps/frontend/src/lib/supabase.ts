import { createBrowserClient } from "@supabase/ssr";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const SUPABASE_AVATAR_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_AVATAR_BUCKET || "avatars";

function isLocalHostname(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".local")
  );
}

function validatePublicSupabaseRuntimeConfig() {
  if (typeof window === "undefined") {
    return;
  }

  const currentHostname = window.location.hostname;
  if (isLocalHostname(currentHostname)) {
    return;
  }

  let configuredHostname: string;

  try {
    configuredHostname = new URL(supabaseUrl).hostname;
  } catch {
    throw new Error(
      "Invalid NEXT_PUBLIC_SUPABASE_URL. Expected a full Supabase project URL.",
    );
  }

  if (isLocalHostname(configuredHostname)) {
    throw new Error(
      [
        "Invalid production Supabase configuration.",
        "NEXT_PUBLIC_SUPABASE_URL points to a local Supabase instance, but the app is running on a public hostname.",
        "Update your deployed frontend env vars to use the hosted Supabase project URL instead of localhost/127.0.0.1.",
      ].join(" "),
    );
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
