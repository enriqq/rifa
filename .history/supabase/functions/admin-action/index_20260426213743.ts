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
          html: `
  <div style="font-family: Arial, sans-serif; background: #101010; color: #fff; padding: 32px; border-radius: 16px; max-width: 480px; margin: 0 auto;">
    <h2 style="color: #FFD700; text-align: center; margin-bottom: 16px;">🎉 ¡Felicidades!</h2>
    <p style="font-size: 18px; text-align: center; margin-bottom: 24px;">
      Tu comprobante fue <b>validado</b> y tu boleto ya está <b>confirmado</b>.
    </p>
    <div style="background: #222; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;">
      <span style="font-size: 22px; color: #FFD700;">✔️</span>
      <p style="margin: 8px 0 0 0; color: #FFD700;">¡Ya participas en el sorteo!</p>
    </div>
    <p style="font-size: 15px; color: #bbb; text-align: center;">
      Puedes ver tus boletos y el estado de tu participación en tu panel de usuario.
    </p>
    <div style="text-align: center; margin-top: 32px;">
      <a href="https://tusitio.com/dashboard" style="background: #FFD700; color: #101010; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">Ver mis boletos</a>
    </div>
    <p style="font-size: 12px; color: #666; margin-top: 32px; text-align: center;">
      Si tienes dudas, responde a este correo o contáctanos por WhatsApp.
    </p>
  </div>
  `
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
          html: `
  <div style="font-family: Arial, sans-serif; background: #101010; color: #fff; padding: 32px; border-radius: 16px; max-width: 480px; margin: 0 auto;">
    <h2 style="color: #FF5252; text-align: center; margin-bottom: 16px;">❌ Comprobante rechazado</h2>
    <p style="font-size: 18px; text-align: center; margin-bottom: 24px;">
      Lamentablemente, tu comprobante <b>no pudo ser validado</b>.
    </p>
    <div style="background: #222; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;">
      <span style="font-size: 22px; color: #FF5252;">⚠️</span>
      <p style="margin: 8px 0 0 0; color: #FF5252;">Por favor, revisa los datos y vuelve a intentarlo.</p>
    </div>
    <p style="font-size: 15px; color: #bbb; text-align: center;">
      Si tienes dudas sobre el motivo del rechazo, contáctanos para más información.
    </p>
    <div style="text-align: center; margin-top: 32px;">
      <a href="https://tusitio.com/checkout" style="background: #FF5252; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">Subir nuevo comprobante</a>
    </div>
    <p style="font-size: 12px; color: #666; margin-top: 32px; text-align: center;">
      Si tienes dudas, responde a este correo o contáctanos por WhatsApp.
    </p>
  </div>
  `
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
