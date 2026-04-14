import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, DollarSign, MapPin, Users, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from '@/hooks/use-toast';
import { buyTicketOnChain } from '@/services/blockchainService';
import SeatLayout from '@/components/SeatLayout';
import type { Tables } from '@/integrations/supabase/types';

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { walletAddress, connectWallet } = useWallet();
  const [event, setEvent] = useState<Tables<'events'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [booking, setBooking] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [bookingStep, setBookingStep] = useState<'confirm' | 'blockchain' | 'done'>('confirm');
  const [bookedSeats, setBookedSeats] = useState<string[]>([]);

  const fetchEventAndSeats = async () => {
    const [{ data: eventData }, { data: seatsData }] = await Promise.all([
      supabase.from('events').select('*').eq('id', id!).single(),
      supabase.from('tickets').select('seat_number').eq('event_id', id!).not('seat_number', 'is', null),
    ]);
    setEvent(eventData);
    setBookedSeats((seatsData || []).map((t: any) => t.seat_number));
    setLoading(false);
  };

  useEffect(() => { fetchEventAndSeats(); }, [id]);

  const handleBook = async () => {
    if (!user) { navigate('/auth'); return; }
    if (!selectedSeat) {
      toast({ title: 'Select a Seat', description: 'Please choose a seat before booking.', variant: 'destructive' });
      return;
    }
    setBooking(true);
    setBookingStep('confirm');

    try {
      // Step 1: If wallet connected, mint on-chain FIRST
      let nftTokenId: number | null = null;
      if (walletAddress && event) {
        setBookingStep('blockchain');
        try {
          nftTokenId = await buyTicketOnChain(event.title);
        } catch (chainErr: any) {
          console.error('Blockchain mint failed:', chainErr);
          const msg = chainErr?.message || chainErr?.reason || '';
          const isInsufficientFunds = msg.toLowerCase().includes('insufficient') || msg.includes('funds');
          toast({
            title: isInsufficientFunds ? 'Insufficient Gas Fees or Funds' : 'Blockchain Transaction Failed',
            description: isInsufficientFunds
              ? 'You do not have enough ETH in your wallet to pay for network fees. Please add funds and try again.'
              : (chainErr?.reason || chainErr?.message || 'Transaction was rejected or failed.'),
            variant: 'destructive',
          });
          setBooking(false);
          setBookingStep('confirm');
          return; // Do NOT book in database
        }
      }

      // Step 2: Book in database (only reached if chain mint succeeded or no wallet)
      setBookingStep('confirm');
      const { data, error } = await supabase.rpc('book_ticket', {
        p_event_id: id!,
        p_user_id: user.id,
        p_wallet_address: walletAddress || undefined,
      });
      if (error) throw error;

      // Update seat number
      if (data) {
        await supabase.from('tickets').update({ seat_number: selectedSeat } as any).eq('id', data);
      }

      // Save NFT token ID if minted
      if (data && nftTokenId) {
        await supabase.from('tickets').update({ nft_token_id: String(nftTokenId) }).eq('id', data);
        toast({ title: 'On-Chain Ticket Minted! ⛓️', description: `NFT Token #${nftTokenId} created on Sepolia.` });
      }

      setBookingStep('done');
      toast({ title: 'Ticket Booked! 🎉', description: `Seat ${selectedSeat} confirmed.${nftTokenId ? ` NFT #${nftTokenId}` : ''} Check My Tickets for your QR code.` });
      setBookingOpen(false);
      setSelectedSeat(null);
      await fetchEventAndSeats();
    } catch (err: any) {
      toast({ title: 'Booking Failed', description: err.message, variant: 'destructive' });
    } finally {
      setBooking(false);
      setBookingStep('confirm');
    }
  };

  if (loading) return <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">Loading...</div>;
  if (!event) return <div className="container mx-auto px-4 py-16 text-center">Event not found</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl animate-fade-in">
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

          {!walletAddress && (
            <Button variant="outline" className="w-full mb-3 gap-2" onClick={connectWallet}>
              🦊 Connect Wallet for On-Chain Ticket
            </Button>
          )}

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

      {/* Seat Selection Section */}
      <div className="mt-10">
        <h2 className="font-display text-2xl font-bold mb-4">Select Your Seat</h2>
        <Card>
          <CardContent className="p-6">
            <SeatLayout
              category={event.category}
              totalSeats={event.total_seats}
              availableSeats={event.available_seats}
              onSelect={setSelectedSeat}
              selectedSeat={selectedSeat}
              bookedSeats={bookedSeats}
            />
          </CardContent>
        </Card>
        {selectedSeat && (
          <div className="mt-4 text-center animate-fade-in">
            <Badge className="text-sm px-4 py-2">Selected: Seat {selectedSeat}</Badge>
          </div>
        )}
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
            {selectedSeat && <p className="text-sm"><strong>Seat:</strong> {selectedSeat}</p>}
            {walletAddress && (
              <>
                <p className="text-sm"><strong>Wallet:</strong> {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</p>
                <p className="text-xs text-primary">⛓️ This ticket will also be minted on-chain (Sepolia)</p>
              </>
            )}
            {!walletAddress && (
              <p className="text-xs text-muted-foreground">💡 Connect your wallet to also mint an on-chain NFT ticket</p>
            )}
          </div>
          {booking && bookingStep === 'blockchain' && (
            <div className="flex items-center gap-2 text-sm text-primary animate-pulse">
              <Loader2 className="h-4 w-4 animate-spin" />
              Minting on-chain... Confirm in MetaMask
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingOpen(false)} disabled={booking}>Cancel</Button>
            <Button onClick={handleBook} disabled={booking}>
              {booking ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {bookingStep === 'blockchain' ? 'Minting...' : 'Booking...'}
                </span>
              ) : 'Confirm Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
