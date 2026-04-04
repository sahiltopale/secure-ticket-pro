import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { ticketId, action } = await req.json();

    if (!ticketId) {
      return new Response(
        JSON.stringify({ valid: false, message: "Missing ticketId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

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
    };

    // LOOKUP: just check status, don't mark as used
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

    // PERMIT: mark as used
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

    // DENY: also mark as used/invalid
    if (action === "deny") {
      await supabase.from("tickets").update({ is_used: true }).eq("id", ticket.id);
      return new Response(
        JSON.stringify({ valid: false, message: "Entry denied. Ticket invalidated.", ticket: ticketInfo }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Default legacy behavior: verify and mark
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
