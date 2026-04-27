import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
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

    const {
      data: { user },
    } = await client.auth.getUser();
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

    const { ticketIds, action } = await req.json();

    if (
      !ticketIds ||
      !Array.isArray(ticketIds) ||
      ticketIds.length === 0 ||
      !action
    ) {
      return new Response(
        JSON.stringify({ error: "Missing ticketIds or action" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Agrupa los tickets por usuario
    const userTicketsMap = new Map();
    for (const ticketId of ticketIds) {
      const { data: ticket } = await adminClient
        .from("tickets")
        .select("reserved_by")
        .eq("id", ticketId)
        .maybeSingle();
      if (!ticket?.reserved_by) continue;
      if (!userTicketsMap.has(ticket.reserved_by)) {
        userTicketsMap.set(ticket.reserved_by, []);
      }
      userTicketsMap.get(ticket.reserved_by).push(ticketId);
    }

    // Procesa por usuario
    for (const [reserved_by, userTicketIds] of userTicketsMap.entries()) {
      // Busca el email del usuario
      const { data: userData } = await adminClient.auth.admin.getUserById(
        reserved_by,
      );
      if (action === "approve") {
        // Actualiza todos los tickets de este usuario
        const { error } = await adminClient
          .from("tickets")
          .update({
            status: "sold",
            purchased_by: reserved_by,
            purchased_at: new Date().toISOString(),
          })
          .in("id", userTicketIds);

        // Envía un solo correo
        await fetch("https://rifa-zeta-opal.vercel.app/api/notify-admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: userData?.user?.email,
            subject: "¡Tus boletos han sido aprobados!",
            html: `
            <div style="font-family: Arial, sans-serif; background: #101010; color: #fff; padding: 32px; border-radius: 16px; max-width: 480px; margin: 0 auto;">
              <h2 style="color: #FFD700; text-align: center; margin-bottom: 16px;">🎉 ¡Felicidades!</h2>
              <p style="font-size: 18px; text-align: center; margin-bottom: 24px;">
                Tu comprobante fue <b>validado</b> y tus boletos ya están <b>confirmados</b>.
              </p>
              <div style="background: #222; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;">
                <span style="font-size: 22px; color: #FFD700;">✔️</span>
                <p style="margin: 8px 0 0 0; color: #FFD700;">¡Ya participas en la rifa!</p>
              </div>
              <p style="font-size: 15px; color: #bbb; text-align: center;">
                Puedes ver tus boletos y el estado de tu participación en tu panel de usuario.
              </p>
              <div style="text-align: center; margin-top: 32px;">
                <a href="https://rifa-zeta-opal.vercel.app" style="background: #FFD700; color: #101010; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">Ver mis boletos</a>
              </div>
              <p style="font-size: 12px; color: #666; margin-top: 32px; text-align: center;">
                Si tienes dudas, responde a este correo o contáctanos por WhatsApp.
              </p>
            </div>
          `,
          }),
        });
        if (error) throw error;
      } else if (action === "reject") {
        // Actualiza todos los tickets de este usuario
        const { error } = await adminClient
          .from("tickets")
          .update({
            status: "available",
            reserved_by: null,
            reserved_at: null,
            reservation_expires_at: null,
          })
          .in("id", userTicketIds);

        // Envía un solo correo
        await fetch("https://rifa-zeta-opal.vercel.app/api/notify-admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: userData?.user?.email,
            subject: "Tus comprobantes fueron rechazados",
            html: `
      <div style="font-family: Arial, sans-serif; background: #101010; color: #fff; padding: 32px; border-radius: 16px; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #FF5252; text-align: center; margin-bottom: 16px;">❌ Comprobante rechazado</h2>
        <p style="font-size: 18px; text-align: center; margin-bottom: 24px;">
          Lamentablemente, tus comprobantes <b>no pudieron ser validados</b>.
        </p>
        <div style="background: #222; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;">
          <span style="font-size: 22px; color: #FF5252;">⚠️</span>
          <p style="margin: 8px 0 0 0; color: #FF5252;">Por favor, revisa los datos y vuelve a intentarlo.</p>
        </div>
        <p style="font-size: 15px; color: #bbb; text-align: center;">
          Si tienes dudas sobre el motivo del rechazo, contáctanos para más información.
        </p>
        <div style="text-align: center; margin-top: 32px;">
          <a href="https://rifa-zeta-opal.vercel.app" style="background: #FF5252; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">Intentar de nuevo</a>
        </div>
        <p style="font-size: 12px; color: #666; margin-top: 32px; text-align: center;">
          Si tienes dudas, responde a este correo o contáctanos por WhatsApp.
        </p>
      </div>
    `,
      }),
    });
    if (error) throw error;

    // Borra los recibos de todos los tickets rechazados
    await adminClient.from("receipts").delete().in("ticket_id", userTicketIds);
  } else {
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
