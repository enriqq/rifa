import { createClient } from 'npm:@supabase/supabase-js@2';
import { Resend } from "npm:resend";
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const client = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data: profile } = await adminClient
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.is_admin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { ticketId, action } = await req.json();

    if (!ticketId || !action) {
      return new Response(JSON.stringify({ error: "Missing ticketId or action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "approve") {
      const { data: ticket } = await adminClient
        .from("tickets")
        .select("reserved_by")
        .eq("id", ticketId)
        .maybeSingle();

      const { error } = await adminClient
        .from("tickets")
        .update({
          status: "sold",
          purchased_by: ticket?.reserved_by,
          purchased_at: new Date().toISOString(),
        })
        .eq("id", ticketId);

        // Busca el email del usuario
        const { data: ticket } = await adminClient
          .from("tickets")
          .select("reserved_by")
          .eq("id", ticketId)
          .maybeSingle();

        const { data: userData } = await adminClient.auth.admin.getUserById(ticket?.reserved_by);

        // Envía el correo
        await resend.emails.send({
          from: "RifandoAndo <no-reply@tudominio.com>",
          to: userData?.user?.email,
          subject: "¡Tu boleto ha sido aprobado!",
          html: `<p>¡Felicidades! Tu comprobante fue validado y tu boleto ya está confirmado.</p>`
        });

      if (error) throw error;
    } else if (action === "reject") {
      const { error } = await adminClient
        .from("tickets")
        .update({
          status: "available",
          reserved_by: null,
          reserved_at: null,
          reservation_expires_at: null,
        })
        .eq("id", ticketId);

        // Busca el email del usuario
        const { data: ticket } = await adminClient
          .from("tickets")
          .select("reserved_by")
          .eq("id", ticketId)
          .maybeSingle();

        const { data: userData } = await adminClient.auth.admin.getUserById(ticket?.reserved_by);

        // Envía el correo
        await resend.emails.send({
          from: "RifandoAndo <no-reply@tudominio.com>",
          to: userData?.user?.email,
          subject: "Tu comprobante fue rechazado",
          html: `<p>Tu comprobante fue rechazado. Por favor, revisa los datos y vuelve a intentarlo.</p>`
        });
      if (error) throw error;

      await adminClient
        .from("receipts")
        .delete()
        .eq("ticket_id", ticketId);
    } else {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
