import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, DollarSign, MapPin, Users, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { walletAddress } = useWallet();
  const [event, setEvent] = useState<Tables<'events'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('events').select('*').eq('id', id!).single();
      setEvent(data);
      setLoading(false);
    };
    fetch();
  }, [id]);

  const handleBook = async () => {
    if (!user) { navigate('/auth'); return; }
    setBooking(true);
    try {
      const { data, error } = await supabase.rpc('book_ticket', {
        p_event_id: id!,
        p_user_id: user.id,
        p_wallet_address: walletAddress || undefined,
      });
      if (error) throw error;
      toast({ title: 'Ticket Booked! 🎉', description: 'Check My Tickets for your QR code.' });
      setBookingOpen(false);
      // Refresh event data
      const { data: updated } = await supabase.from('events').select('*').eq('id', id!).single();
      setEvent(updated);
    } catch (err: any) {
      toast({ title: 'Booking Failed', description: err.message, variant: 'destructive' });
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">Loading...</div>;
  if (!event) return <div className="container mx-auto px-4 py-16 text-center">Event not found</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl animate-fade-in">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 gap-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="h-64 md:h-full rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center overflow-hidden">
          {event.image_url ? (
            <img src={event.image_url} alt={event.title} className="w-full h-full object-cover rounded-lg" />
          ) : (
            <span className="text-6xl">🎪</span>
          )}
        </div>

        <div>
          <Badge variant="secondary" className="mb-2">{event.category || 'general'}</Badge>
          <h1 className="font-display text-3xl font-bold mb-4">{event.title}</h1>
          <p className="text-muted-foreground mb-6">{event.description}</p>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-primary" />
              <span>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="font-semibold text-lg">${Number(event.price).toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Users className="h-4 w-4 text-primary" />
              <span>{event.available_seats} of {event.total_seats} seats available</span>
            </div>
          </div>

          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Availability</p>
                  <div className="w-48 h-2 bg-muted rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${(event.available_seats / event.total_seats) * 100}%` }}
                    />
                  </div>
                </div>
                <span className={`text-sm font-medium ${event.available_seats > 0 ? 'text-secondary' : 'text-destructive'}`}>
                  {event.available_seats > 0 ? 'Available' : 'Sold Out'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Button
            size="lg"
            className="w-full"
            disabled={event.available_seats <= 0}
            onClick={() => setBookingOpen(true)}
          >
            {event.available_seats > 0 ? 'Book Ticket' : 'Sold Out'}
          </Button>
        </div>
      </div>

      {/* Booking Modal */}
      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Booking</DialogTitle>
            <DialogDescription>You are about to book a ticket for {event.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <p className="text-sm"><strong>Event:</strong> {event.title}</p>
            <p className="text-sm"><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
            <p className="text-sm"><strong>Price:</strong> ${Number(event.price).toFixed(2)}</p>
            {walletAddress && <p className="text-sm"><strong>Wallet:</strong> {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingOpen(false)}>Cancel</Button>
            <Button onClick={handleBook} disabled={booking}>
              {booking ? 'Booking...' : 'Confirm Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
