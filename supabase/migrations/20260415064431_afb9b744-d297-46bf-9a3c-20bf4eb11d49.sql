
CREATE OR REPLACE FUNCTION public.get_booked_seats(p_event_id uuid)
RETURNS TEXT[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(seat_number), '{}')
  FROM public.tickets
  WHERE event_id = p_event_id
    AND seat_number IS NOT NULL;
$$;
