import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (_req: Request) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const adminClient = createClient(supabaseUrl, serviceKey);

  // Busca tickets pendientes
  const { data: tickets } = await adminClient
    .from("tickets")
    .select("ticket_number")
    .eq("status", "pending");

  // Si hay pendientes, llama a tu endpoint de Vercel
  if (tickets && tickets.length > 0) {
    await fetch("https://tu-proyecto.vercel.app/api/notify-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pendientes: tickets.length })
    });
  }

  return new Response(JSON.stringify({ success: true, pendientes: tickets?.length || 0 }), {
    headers: { "Content-Type": "application/json" }
  });
});