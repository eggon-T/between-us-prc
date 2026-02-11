import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Only create a real client if the URL is valid; otherwise, return a
// dummy that throws on first real operation.  This prevents the build
// from crashing when placeholder env vars are used for static analysis.
export const supabase =
    supabaseUrl.startsWith("http")
        ? createClient(supabaseUrl, supabaseAnonKey)
        : new Proxy(
            {},
            {
                get() {
                    return () => {
                        throw new Error(
                            "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
                        );
                    };
                },
            }
        );
