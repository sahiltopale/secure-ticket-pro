
-- Add seat_number to tickets
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS seat_number text;

-- Enable realtime for tickets table
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
