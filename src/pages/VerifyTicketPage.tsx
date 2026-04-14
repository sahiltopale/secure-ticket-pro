import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Calendar, Tag, CreditCard, Clock, Hash, Wallet, ShieldCheck, ShieldX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

type TicketInfo = {
  ticketId: string;
  eventTitle: string;
  eventDate: string | null;
  eventCategory: string | null;
  price: number;
  bookingDate: string;
  walletAddress?: string | null;
  imageUrl?: string | null;
  seatNumber?: string | null;
  nftTokenId?: string | null;
};

type VerifyState =
  | { status: 'loading' }
  | { status: 'valid'; ticket: TicketInfo; message: string }
  | { status: 'used'; ticket: TicketInfo; message: string }
  | { status: 'invalid'; message: string }
  | { status: 'permitted'; ticket: TicketInfo }
  | { status: 'denied'; ticket: TicketInfo };

export default function VerifyTicketPage() {
  const [searchParams] = useSearchParams();
  const { ticketId } = useParams<{ ticketId: string }>();
  const [state, setState] = useState<VerifyState>({ status: 'loading' });
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (!ticketId) {
      setState({ status: 'invalid', message: 'No ticket ID provided.' });
      return;
    }
    lookupTicket(ticketId);
  }, [ticketId]);

  const lookupTicket = async (id: string) => {
    setState({ status: 'loading' });
    const token = searchParams.get('token');
    const t = searchParams.get('t');
    try {
      const { data, error } = await supabase.functions.invoke('verify-ticket', {
        body: { ticketId: id, action: 'lookup', token, t },
      });
      if (error || !data) {
        setState({ status: 'invalid', message: 'Could not verify ticket.' });
        return;
      }
      if (data.valid) {
        setState({ status: 'valid', ticket: data.ticket, message: data.message });
      } else if (data.alreadyUsed) {
        setState({ status: 'used', ticket: data.ticket, message: data.message });
      } else {
        setState({ status: 'invalid', message: data.message });
      }
    } catch {
      setState({ status: 'invalid', message: 'Verification failed.' });
    }
  };

  const handlePermit = async (allow: boolean) => {
    if (state.status !== 'valid') return;
    setActing(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-ticket', {
        body: { ticketId, action: allow ? 'permit' : 'deny' },
      });
      if (error) throw error;
      if (allow) {
        setState({ status: 'permitted', ticket: state.ticket });
      } else {
        setState({ status: 'denied', ticket: state.ticket });
      }
    } catch {
      // fallback
    } finally {
      setActing(false);
    }
  };

  const fmt = (d: string | null) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-US', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="font-display text-2xl font-bold">Authentix</h1>
          <p className="text-muted-foreground text-sm">Ticket Verification</p>
        </div>

        {state.status === 'loading' && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
              <p className="text-muted-foreground">Verifying ticket...</p>
            </CardContent>
          </Card>
        )}

        {state.status === 'valid' && (
          <div className="space-y-4 animate-fade-in">
            <div className="rounded-xl border-2 border-green-500 bg-green-500/10 overflow-hidden">
              <div className="bg-green-500 px-4 py-3 flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-white" />
                <div>
                  <p className="font-bold text-white text-lg">Valid Ticket</p>
                  <p className="text-green-100 text-sm">This ticket is authentic</p>
                </div>
              </div>
              <TicketDetails ticket={state.ticket} fmt={fmt} />
            </div>

            {/* Permit Entry */}
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold text-center mb-4">Permit Entry?</h3>
                <div className="flex gap-3">
                  <Button
                    onClick={() => handlePermit(true)}
                    disabled={acting}
                    className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    Yes, Allow
                  </Button>
                  <Button
                    onClick={() => handlePermit(false)}
                    disabled={acting}
                    variant="destructive"
                    className="flex-1 gap-2"
                  >
                    {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldX className="h-4 w-4" />}
                    No, Deny
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {state.status === 'used' && (
          <div className="rounded-xl border-2 border-yellow-500 bg-yellow-500/10 overflow-hidden animate-fade-in">
            <div className="bg-yellow-500 px-4 py-3 flex items-center gap-3">
              <XCircle className="h-6 w-6 text-white" />
              <div>
                <p className="font-bold text-white text-lg">Already Used</p>
                <p className="text-yellow-100 text-sm">{state.message}</p>
              </div>
            </div>
            <TicketDetails ticket={state.ticket} fmt={fmt} />
          </div>
        )}

        {state.status === 'invalid' && (
          <div className="rounded-xl border-2 border-destructive bg-destructive/10 overflow-hidden animate-fade-in">
            <div className="bg-destructive px-4 py-3 flex items-center gap-3">
              <XCircle className="h-6 w-6 text-white" />
              <div>
                <p className="font-bold text-white text-lg">Invalid Ticket</p>
                <p className="text-red-100 text-sm">{state.message}</p>
              </div>
            </div>
          </div>
        )}

        {state.status === 'permitted' && (
          <div className="rounded-xl border-2 border-green-500 bg-green-500/10 overflow-hidden animate-fade-in">
            <div className="bg-green-600 px-4 py-4 flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-white" />
              <div>
                <p className="font-bold text-white text-xl">Entry Granted ✅</p>
                <p className="text-green-100 text-sm">Ticket has been used successfully</p>
              </div>
            </div>
            <TicketDetails ticket={state.ticket} fmt={fmt} />
          </div>
        )}

        {state.status === 'denied' && (
          <div className="rounded-xl border-2 border-destructive bg-destructive/10 overflow-hidden animate-fade-in">
            <div className="bg-destructive px-4 py-4 flex items-center gap-3">
              <ShieldX className="h-8 w-8 text-white" />
              <div>
                <p className="font-bold text-white text-xl">Entry Denied ❌</p>
                <p className="text-red-100 text-sm">Ticket has been invalidated</p>
              </div>
            </div>
            <TicketDetails ticket={state.ticket} fmt={fmt} />
          </div>
        )}
      </div>
    </div>
  );
}

function TicketDetails({ ticket, fmt }: { ticket: TicketInfo; fmt: (d: string | null) => string }) {
  return (
    <div className="p-4 space-y-3">
      <h3 className="font-semibold text-lg">{ticket.eventTitle}</h3>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <DetailRow icon={<Calendar className="h-4 w-4" />} label="Event Date" value={fmt(ticket.eventDate)} />
        <DetailRow icon={<Tag className="h-4 w-4" />} label="Category" value={ticket.eventCategory || 'General'} />
        <DetailRow icon={<CreditCard className="h-4 w-4" />} label="Price" value={`₹${ticket.price}`} />
        <DetailRow icon={<Clock className="h-4 w-4" />} label="Booked On" value={fmt(ticket.bookingDate)} />
        <DetailRow icon={<Hash className="h-4 w-4" />} label="Ticket ID" value={ticket.ticketId.slice(0, 8) + '...'} />
        {ticket.seatNumber && (
          <DetailRow icon={<Hash className="h-4 w-4" />} label="Seat" value={ticket.seatNumber} />
        )}
        {ticket.walletAddress && (
          <DetailRow icon={<Wallet className="h-4 w-4" />} label="Wallet" value={ticket.walletAddress.slice(0, 6) + '...' + ticket.walletAddress.slice(-4)} />
        )}
        {ticket.nftTokenId && (
          <DetailRow icon={<Hash className="h-4 w-4" />} label="On-Chain NFT" value={`Token #${ticket.nftTokenId}`} />
        )}
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-muted-foreground mt-0.5">{icon}</span>
      <div>
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}
