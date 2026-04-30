import { createClient } from 'npm:@supabase/supabase-js@2';

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
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const client = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data: profile } = await adminClient
      .from("profiles").select("is_admin").eq("id", user.id).maybeSingle();

    if (!profile?.is_admin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: tickets, error: ticketsError } = await adminClient
      .from("tickets")
      .select("id, ticket_number, raffle_id, reserved_by, raffles!inner(name, ticket_price), receipts(file_url, file_name, file_type, created_at)")
      .eq("status", "pending")
      .order("ticket_number");

    if (ticketsError) {
      console.error("Query error:", ticketsError);
      throw ticketsError;
    }

    // console.log("Tickets encontrados:", tickets);

    const enriched = await Promise.all(
      (tickets || []).map(async (t: any) => {
        // Busca el nombre en profiles usando reserved_by
        const { data: profileData } = await adminClient
          .from("profiles")
          .select("full_name")
          .eq("id", t.reserved_by)
          .maybeSingle();

        // Busca el email en auth
        const { data: userData } = await adminClient.auth.admin.getUserById(t.reserved_by);

        return {
          ...t,
          profiles: {
            full_name: profileData?.full_name || "",
            email: userData?.user?.email || "",
          },
        };
      })
    );

    return new Response(JSON.stringify({ data: enriched }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message, details: err }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
