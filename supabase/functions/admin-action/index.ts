import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendEmail(email: string, name: string, action: "delete" | "suspend") {
  const token = Deno.env.get("MAILTRAP_TOKEN");
  if (!token) return;

  const subject = action === "delete" ? "Tvoj SkillSwap račun je obrisan" : "Tvoj SkillSwap račun je suspendiran";
  const text = action === "delete"
    ? `Pozdrav ${name},\n\nTvoj SkillSwap račun je trajno obrisan od strane administratora zbog kršenja pravila korištenja.\n\nSkillSwap tim`
    : `Pozdrav ${name},\n\nTvoj SkillSwap račun je suspendiran od strane administratora. Ako smatraš da je ovo greška, kontaktiraj nas.\n\nSkillSwap tim`;

  await fetch("https://send.api.mailtrap.io/api/send", {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: { email: "noreply@skillswap.app", name: "SkillSwap" },
      to: [{ email, name }],
      subject,
      text,
    }),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Verify caller is admin
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !user) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

  const { data: callerProfile } = await supabaseAdmin.from("profiles").select("is_admin").eq("user_id", user.id).single();
  if (!(callerProfile as any)?.is_admin) return new Response("Forbidden", { status: 403, headers: corsHeaders });

  const { action, targetUserId } = await req.json();

  // Get target user info (email + name)
  const { data: targetAuthUser } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
  const { data: targetProfile } = await supabaseAdmin.from("profiles").select("name").eq("user_id", targetUserId).single();
  const targetEmail = targetAuthUser?.user?.email ?? "";
  const targetName = (targetProfile as any)?.name ?? "Korisnik";

  if (action === "delete") {
    await sendEmail(targetEmail, targetName, "delete");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });

  } else if (action === "suspend") {
    await supabaseAdmin.from("profiles").update({ is_suspended: true } as any).eq("user_id", targetUserId);
    await supabaseAdmin.auth.admin.updateUserById(targetUserId, { ban_duration: "876600h" });
    await sendEmail(targetEmail, targetName, "suspend");

  } else if (action === "unsuspend") {
    await supabaseAdmin.from("profiles").update({ is_suspended: false } as any).eq("user_id", targetUserId);
    await supabaseAdmin.auth.admin.updateUserById(targetUserId, { ban_duration: "none" });

  } else {
    return new Response("Unknown action", { status: 400, headers: corsHeaders });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
});
