import { createClient } from 'npm:@supabase/supabase-js@2';
import { Resend } from "npm:resend";
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

Deno.serve(async (_req: Request) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const adminClient = createClient(supabaseUrl, serviceKey);

  // Busca tickets pendientes
  const { data: tickets } = await adminClient
    .from("tickets")
    .select("ticket_number")
    .eq("status", "pending");

  if (tickets && tickets.length > 0) {
    await resend.emails.send({
      from: "RifandoAndo <onboarding@resend.dev>",
      to: "enriqueesmon@gmail.com",
      subject: "Hay boletos pendientes de validar",
      html: `<p>Hay <b>${tickets.length}</b> boletos pendientes de validación.</p>`
    });
  }

  return new Response(JSON.stringify({ success: true, pendientes: tickets?.length || 0 }), {
    headers: { "Content-Type": "application/json" }
  });
});