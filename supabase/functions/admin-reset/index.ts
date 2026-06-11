import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { oldEmail, newEmail, newPassword } = await req.json();
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // find user by old email
    let userId: string | null = null;
    let page = 1;
    while (!userId) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw error;
      const u = data.users.find((x) => x.email?.toLowerCase() === String(oldEmail).toLowerCase());
      if (u) userId = u.id;
      if (!data.users.length || data.users.length < 200) break;
      page++;
    }
    if (!userId) throw new Error("User not found: " + oldEmail);

    const { error: updErr } = await admin.auth.admin.updateUserById(userId, {
      email: newEmail,
      password: newPassword,
      email_confirm: true,
    });
    if (updErr) throw updErr;

    return new Response(JSON.stringify({ ok: true, userId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});