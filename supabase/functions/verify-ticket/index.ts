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
    const { ticketId } = await req.json();

    if (!ticketId) {
      return new Response(
        JSON.stringify({ valid: false, message: "Missing ticketId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Find ticket by ticket_id field
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

    if (ticket.is_used) {
      return new Response(
        JSON.stringify({
          valid: false,
          message: "This ticket has already been used.",
          alreadyUsed: true,
          ticket: {
            ticketId: ticket.ticket_id,
            eventTitle: ticket.events?.title ?? "Unknown",
            eventDate: ticket.events?.date ?? null,
            eventCategory: ticket.events?.category ?? null,
            price: ticket.events?.price ?? 0,
            bookingDate: ticket.booking_date,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark as used
    await supabase
      .from("tickets")
      .update({ is_used: true })
      .eq("id", ticket.id);

    return new Response(
      JSON.stringify({
        valid: true,
        message: "Ticket verified successfully!",
        ticket: {
          ticketId: ticket.ticket_id,
          eventTitle: ticket.events?.title ?? "Unknown",
          eventDate: ticket.events?.date ?? null,
          eventCategory: ticket.events?.category ?? null,
          price: ticket.events?.price ?? 0,
          bookingDate: ticket.booking_date,
          walletAddress: ticket.wallet_address,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ valid: false, message: "Verification failed: " + err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
