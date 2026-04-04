import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Ticket, Calendar, Check, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';

type TicketWithEvent = Tables<'tickets'> & { events: Tables<'events'> | null };

export default function MyTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketWithEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('tickets')
        .select('*, events(*)')
        .eq('user_id', user.id)
        .order('booking_date', { ascending: false });
      setTickets((data as TicketWithEvent[]) || []);
      setLoading(false);
    };
    fetch();
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold mb-8 animate-fade-in">My Tickets</h1>

      {tickets.length === 0 ? (
        <div className="text-center py-16">
          <Ticket className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg text-muted-foreground">No tickets yet. Browse events to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tickets.map((ticket, idx) => (
            <Card
              key={ticket.id}
              className="overflow-hidden hover-lift animate-fade-in"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  {/* QR Code */}
                  <div className="flex items-center justify-center p-6 bg-card border-b sm:border-b-0 sm:border-r">
                    <div className="bg-white p-3 rounded-lg">
                      <QRCodeSVG
                        value={`${window.location.origin}/verify/${ticket.ticket_id}`}
                        size={120}
                        level="H"
                      />
                    </div>
                  </div>

                  {/* Ticket Info */}
                  <div className="flex-1 p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-display font-semibold text-lg">{ticket.events?.title || 'Event'}</h3>
                      <Badge variant={ticket.is_used ? 'destructive' : 'default'} className="gap-1">
                        {ticket.is_used ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                        {ticket.is_used ? 'Used' : 'Valid'}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {ticket.events?.date ? new Date(ticket.events.date).toLocaleDateString() : 'N/A'}
                      </p>
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
          ))}
        </div>
      )}
    </div>
  );
}
