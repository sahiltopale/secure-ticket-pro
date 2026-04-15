import { useState, useEffect } from 'react';
import { Ticket, Calendar, Check, X, Clock, History } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import SecureQR from '@/components/SecureQR';
import type { Tables } from '@/integrations/supabase/types';

type TicketWithEvent = Tables<'tickets'> & { events: Tables<'events'> | null };

export default function MyTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketWithEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('tickets')
      .select('*, events(*)')
      .eq('user_id', user.id)
      .order('booking_date', { ascending: false });
    setTickets((data as TicketWithEvent[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    fetchTickets();

    // Realtime subscription for ticket updates
    const channel = supabase
      .channel('my-tickets')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tickets' },
        () => { fetchTickets(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Ticket className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="font-display text-2xl font-bold mb-2">Sign in to view your tickets</h2>
        <p className="text-muted-foreground">Log in to access your booked event tickets.</p>
      </div>
    );
  }

  if (loading) return <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">Loading tickets...</div>;

  const activeTickets = tickets.filter(t => !t.is_used);
  const pastTickets = tickets.filter(t => t.is_used);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold mb-8 animate-fade-in">My Tickets</h1>

      {tickets.length === 0 ? (
        <div className="text-center py-16">
          <Ticket className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg text-muted-foreground">No tickets yet. Browse events to get started!</p>
        </div>
      ) : (
        <Tabs defaultValue="active" className="animate-fade-in">
          <TabsList className="mb-6">
            <TabsTrigger value="active" className="gap-2">
              <Clock className="h-4 w-4" />
              Active ({activeTickets.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="gap-2">
              <History className="h-4 w-4" />
              Past Events ({pastTickets.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {activeTickets.length === 0 ? (
              <div className="text-center py-12">
                <Check className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No active tickets. All caught up!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeTickets.map((ticket, idx) => (
                  <TicketCard key={ticket.id} ticket={ticket} idx={idx} active />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past">
            {pastTickets.length === 0 ? (
              <div className="text-center py-12">
                <History className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No past events yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pastTickets.map((ticket, idx) => (
                  <TicketCard key={ticket.id} ticket={ticket} idx={idx} active={false} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function TicketCard({ ticket, idx, active }: { ticket: TicketWithEvent; idx: number; active: boolean }) {
  return (
    <Card
      className={`overflow-hidden hover-lift animate-fade-in ${!active ? 'opacity-75' : ''}`}
      style={{ animationDelay: `${idx * 100}ms` }}
    >
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* QR Code */}
          <div className="flex items-center justify-center p-6 bg-card border-b sm:border-b-0 sm:border-r">
            {active ? (
              <SecureQR ticketId={ticket.ticket_id} size={120} />
            ) : (
              <div className="bg-muted p-3 rounded-lg relative">
                <div className="w-[120px] h-[120px] bg-muted-foreground/10 rounded flex items-center justify-center">
                  <X className="h-10 w-10 text-muted-foreground/40" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Badge variant="destructive" className="text-xs">USED</Badge>
                </div>
              </div>
            )}
          </div>

          {/* Ticket Info */}
          <div className="flex-1 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display font-semibold text-lg">{ticket.events?.title || 'Event'}</h3>
              <Badge variant={active ? 'default' : 'destructive'} className="gap-1">
                {active ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                {active ? 'Active' : 'Past'}
              </Badge>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                {ticket.events?.date ? new Date(ticket.events.date).toLocaleDateString() : 'N/A'}
              </p>
              {(ticket as any).seat_number && (
                <p className="text-xs font-medium text-primary">🪑 Seat: {(ticket as any).seat_number}</p>
              )}
              <p className="font-mono text-xs">ID: {ticket.ticket_id.slice(0, 8)}...</p>
              {ticket.wallet_address && (
                <p className="font-mono text-xs">Wallet: {ticket.wallet_address.slice(0, 6)}...{ticket.wallet_address.slice(-4)}</p>
              )}
              {ticket.nft_token_id && (
                <p className="text-xs text-primary">NFT: #{ticket.nft_token_id}</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
