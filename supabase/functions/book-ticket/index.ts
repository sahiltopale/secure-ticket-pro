import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type BookTicketBody = {
  eventId?: string;
  seatNumber?: string;
  walletAddress?: string | null;
  nftTokenId?: string | null;
};

async function restoreAvailability(adminClient: any, eventId: string, ticketRowId: string) {
  await adminClient.from("tickets").delete().eq("id", ticketRowId);

  const { data: eventRow } = await adminClient
    .from("events")
    .select("available_seats")
    .eq("id", eventId)
    .single();

  if (eventRow) {
    await adminClient
      .from("events")
      .update({ available_seats: Number((eventRow as any).available_seats) + 1 })
      .eq("id", eventId);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { eventId, seatNumber, walletAddress, nftTokenId }: BookTicketBody = await req.json();

    if (!eventId || !seatNumber) {
      return new Response(JSON.stringify({ error: "Missing eventId or seatNumber" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data: existingSeat } = await adminClient
      .from("tickets")
      .select("id")
      .eq("event_id", eventId)
      .eq("seat_number", seatNumber)
      .maybeSingle();

    if (existingSeat) {
      return new Response(JSON.stringify({ error: "This seat is already booked." }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: ticketRowId, error: bookError } = await adminClient.rpc("book_ticket", {
      p_event_id: eventId,
      p_user_id: userId,
      p_wallet_address: walletAddress ?? undefined,
    });

    if (bookError || !ticketRowId) {
      return new Response(JSON.stringify({ error: bookError?.message || "Booking failed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const updatePayload: Record<string, string> = { seat_number: seatNumber };
    if (nftTokenId) updatePayload.nft_token_id = nftTokenId;

    const { error: updateError } = await adminClient
      .from("tickets")
      .update(updatePayload)
      .eq("id", ticketRowId);

    if (updateError) {
      const message = updateError.message.toLowerCase();

      if (message.includes("duplicate") || message.includes("unique")) {
        await restoreAvailability(adminClient, eventId, ticketRowId);

        return new Response(JSON.stringify({ error: "This seat is already booked." }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await restoreAvailability(adminClient, eventId, ticketRowId);

      return new Response(JSON.stringify({ error: "Could not save the booked seat." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ticketRowId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});