import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function hmacVerify(key: string, message: string, signature: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = await crypto.subtle.importKey(
    "raw", encoder.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", keyData, encoder.encode(message));
  const expected = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
  return expected === signature;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { ticketId, action, token, t } = await req.json();

    if (!ticketId) {
      return new Response(
        JSON.stringify({ valid: false, message: "Missing ticketId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Validate token if provided (secure QR flow)
    if (token && t) {
      const timestamp = parseInt(t);
      const currentWindow = Math.floor(Math.floor(Date.now() / 1000) / 30);
      const tokenWindow = Math.floor(timestamp / 30);
      // Allow current window and previous window (60s grace)
      let valid = false;
      for (let w = currentWindow - 1; w <= currentWindow; w++) {
        if (await hmacVerify(serviceKey, `${ticketId}:${w}`, token)) {
          valid = true;
          break;
        }
      }
      if (!valid) {
        return new Response(
          JSON.stringify({ valid: false, message: "QR code expired or invalid. Please use a live QR code from the ticket holder's device." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const { data: ticket, error } = await supabase
      .from("tickets")
      .select("*, events(title, date, price, category, image_url)")
      .eq("ticket_id", ticketId)
      .single();

    if (error || !ticket) {
      return new Response(
        JSON.stringify({ valid: false, message: "Ticket not found. This QR code is invalid." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ticketInfo = {
      ticketId: ticket.ticket_id,
      eventTitle: ticket.events?.title ?? "Unknown",
      eventDate: ticket.events?.date ?? null,
      eventCategory: ticket.events?.category ?? null,
      price: ticket.events?.price ?? 0,
      bookingDate: ticket.booking_date,
      walletAddress: ticket.wallet_address,
      imageUrl: ticket.events?.image_url ?? null,
      seatNumber: ticket.seat_number ?? null,
    };

    if (action === "lookup") {
      if (ticket.is_used) {
        return new Response(
          JSON.stringify({ valid: false, alreadyUsed: true, message: "This ticket has already been used.", ticket: ticketInfo }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ valid: true, message: "Ticket is valid and ready for entry.", ticket: ticketInfo }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "permit") {
      if (ticket.is_used) {
        return new Response(
          JSON.stringify({ valid: false, alreadyUsed: true, message: "Ticket was already used.", ticket: ticketInfo }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      await supabase.from("tickets").update({ is_used: true }).eq("id", ticket.id);
      return new Response(
        JSON.stringify({ valid: true, message: "Entry permitted. Ticket marked as used.", ticket: ticketInfo }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "deny") {
      await supabase.from("tickets").update({ is_used: true }).eq("id", ticket.id);
      return new Response(
        JSON.stringify({ valid: false, message: "Entry denied. Ticket invalidated.", ticket: ticketInfo }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Default legacy
    if (ticket.is_used) {
      return new Response(
        JSON.stringify({ valid: false, alreadyUsed: true, message: "This ticket has already been used.", ticket: ticketInfo }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    await supabase.from("tickets").update({ is_used: true }).eq("id", ticket.id);
    return new Response(
      JSON.stringify({ valid: true, message: "Ticket verified successfully!", ticket: ticketInfo }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ valid: false, message: "Verification failed: " + err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
