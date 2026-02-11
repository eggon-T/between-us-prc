// scripts/stress_test.js
// Usage: node scripts/stress_test.js
// Prerequisite: Set TEST_USER_A_TOKEN and TEST_USER_B_TOKEN in .env.local (or hardcode here for testing)
// This script simulates a race condition where A and B select each other simultaneously.

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("❌ Missing Supabase URL or Anon Key in .env.local");
    process.exit(1);
}

// Helper to create authenticated client
const createAuthClient = (token) => {
    return createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
    });
};

/* 
   ⚠️ CRITICAL: You need two valid JWTs to run this test.
   Login manually in the app, open DevTools -> Application -> Local Storage,
   and copy the `access_token` for two different users.
*/
const TOKEN_A = process.env.TEST_USER_A_TOKEN || "REPLACE_WITH_TOKEN_A";
const TOKEN_B = process.env.TEST_USER_B_TOKEN || "REPLACE_WITH_TOKEN_B";

// Mock User IDs (replace with real UUIDs matching the tokens)
const USER_A_ID = "REPLACE_WITH_UUID_A";
const USER_B_ID = "REPLACE_WITH_UUID_B";

async function runRaceConditionTest() {
    console.log("🚀 Starting Race Condition Stress Test...");

    if (TOKEN_A.includes("REPLACE") || TOKEN_B.includes("REPLACE")) {
        console.error("❌ Please provide valid JWT tokens for User A and User B in the script or .env");
        return;
    }

    const clientA = createAuthClient(TOKEN_A);
    const clientB = createAuthClient(TOKEN_B);

    // 1. Reset State (Deselect each other first)
    console.log("🧹 Resetting state...");
    await Promise.all([
        clientA.rpc('deselect_user', { target_id: USER_B_ID }),
        clientB.rpc('deselect_user', { target_id: USER_A_ID })
    ]);

    // Wait a moment for consistency
    await new Promise(r => setTimeout(r, 1000));

    console.log("💥 firing simultaneous requests...");

    // 2. Fire requests simultaneously
    const results = await Promise.allSettled([
        clientA.rpc('select_user', { target_id: USER_B_ID }),
        clientB.rpc('select_user', { target_id: USER_A_ID })
    ]);

    console.log("✅ Requests finished. Analyzing results...");
    results.forEach((res, i) => console.log(`Req ${i + 1}: ${res.status}`));

    // 3. Verify Database State (Manual Query or via Admin client if available)
    // Here we just check if *we* can query the match from one of the users
    const { data: matchesA } = await clientA.from('matches').select('*').or(`user1.eq.${USER_A_ID},user2.eq.${USER_A_ID}`);
    const { data: likesA } = await clientA.from('likes').select('*').eq('from_user', USER_A_ID).eq('to_user', USER_B_ID);

    const { data: matchesB } = await clientB.from('matches').select('*').or(`user1.eq.${USER_B_ID},user2.eq.${USER_B_ID}`);
    const { data: likesB } = await clientB.from('likes').select('*').eq('from_user', USER_B_ID).eq('to_user', USER_A_ID);

    console.log("\n--- Verification ---");
    console.log(`User A sees matches: ${matchesA?.length}`);
    console.log(`User A sees likes (pending): ${likesA?.length}`);
    console.log(`User B sees matches: ${matchesB?.length}`);

    if (matchesA?.length === 1 && matchesB?.length === 1 && likesA?.length === 0 && likesB?.length === 0) {
        console.log("🎉 SUCCESS: Race condition handled. 1 Match, 0 Likes.");
    } else if (matchesA?.length === 0 && likesA?.length > 0 && likesB?.length > 0) {
        console.log("❌ FAILURE: Both likes stored, no match created (Race condition hit!)");
    } else {
        console.log("⚠️ UNDEFINED STATE: Check database manually.");
    }
}

runRaceConditionTest();
