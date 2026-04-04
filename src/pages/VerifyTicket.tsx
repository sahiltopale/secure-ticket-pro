import { useState, useEffect, useRef } from 'react';
import { Camera, CheckCircle, XCircle, RotateCcw, Calendar, Tag, CreditCard, Clock, Wallet, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

type TicketDetails = {
  ticketId: string;
  eventTitle: string;
  eventDate: string | null;
  eventCategory: string | null;
  price: number;
  bookingDate: string;
  walletAddress?: string | null;
};

type ScanResult = {
  status: 'idle' | 'valid' | 'invalid' | 'used';
  message: string;
  ticket?: TicketDetails;
};

export default function VerifyTicket() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult>({ status: 'idle', message: '' });
  const [loading, setLoading] = useState(false);
  const html5QrCodeRef = useRef<any>(null);

  const startScanner = async () => {
    setResult({ status: 'idle', message: '' });
    setScanning(true);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await scanner.stop();
          setScanning(false);
          await verifyTicket(decodedText);
        },
        () => {}
      );
    } catch (err) {
      console.error('Scanner error:', err);
      setScanning(false);
      setResult({ status: 'invalid', message: 'Could not access camera. Please allow camera permissions.' });
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try { await html5QrCodeRef.current.stop(); } catch {}
    }
    setScanning(false);
  };

  const verifyTicket = async (qrData: string) => {
    setLoading(true);
    try {
      let parsed: any;
      try { parsed = JSON.parse(qrData); } catch { parsed = { ticketId: qrData }; }

      const ticketId = parsed.ticketId || qrData;

      const { data, error } = await supabase.functions.invoke('verify-ticket', {
        body: { ticketId },
      });

      if (error) {
        setResult({ status: 'invalid', message: 'Verification failed. Please try again.' });
        return;
      }

      if (data.valid) {
        setResult({ status: 'valid', message: data.message, ticket: data.ticket });
      } else if (data.alreadyUsed) {
        setResult({ status: 'used', message: data.message, ticket: data.ticket });
      } else {
        setResult({ status: 'invalid', message: data.message });
      }
    } catch (err: any) {
      setResult({ status: 'invalid', message: 'Verification failed: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <h1 className="font-display text-3xl font-bold mb-8 text-center animate-fade-in">Verify Ticket</h1>

      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" /> QR Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div id="qr-reader" className="w-full rounded-lg overflow-hidden" />

          {!scanning && result.status === 'idle' && !loading && (
            <Button onClick={startScanner} className="w-full gap-2">
              <Camera className="h-4 w-4" /> Start Scanning
            </Button>
          )}

          {scanning && (
            <Button variant="destructive" onClick={stopScanner} className="w-full">
              Stop Scanner
            </Button>
          )}

          {loading && (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <span className="ml-3 text-muted-foreground">Verifying ticket...</span>
            </div>
          )}

          {/* VALID TICKET */}
          {result.status === 'valid' && result.ticket && (
            <div className="rounded-xl border-2 border-green-500 bg-green-500/10 overflow-hidden animate-fade-in">
              <div className="bg-green-500 px-4 py-3 flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-white" />
                <div>
                  <p className="font-bold text-white text-lg">✅ Valid Ticket</p>
                  <p className="text-green-100 text-sm">{result.message}</p>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <h3 className="font-semibold text-lg">{result.ticket.eventTitle}</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <DetailRow icon={<Calendar className="h-4 w-4" />} label="Event Date" value={formatDate(result.ticket.eventDate)} />
                  <DetailRow icon={<Tag className="h-4 w-4" />} label="Category" value={result.ticket.eventCategory || 'General'} />
                  <DetailRow icon={<CreditCard className="h-4 w-4" />} label="Price" value={`₹${result.ticket.price}`} />
                  <DetailRow icon={<Clock className="h-4 w-4" />} label="Booked On" value={formatDate(result.ticket.bookingDate)} />
                  <DetailRow icon={<Hash className="h-4 w-4" />} label="Ticket ID" value={result.ticket.ticketId.slice(0, 8) + '...'} />
                  {result.ticket.walletAddress && (
                    <DetailRow icon={<Wallet className="h-4 w-4" />} label="Wallet" value={result.ticket.walletAddress.slice(0, 6) + '...' + result.ticket.walletAddress.slice(-4)} />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ALREADY USED */}
          {result.status === 'used' && (
            <div className="rounded-xl border-2 border-yellow-500 bg-yellow-500/10 overflow-hidden animate-fade-in">
              <div className="bg-yellow-500 px-4 py-3 flex items-center gap-3">
                <XCircle className="h-6 w-6 text-white" />
                <div>
                  <p className="font-bold text-white text-lg">⚠️ Already Used</p>
                  <p className="text-yellow-100 text-sm">{result.message}</p>
                </div>
              </div>
              {result.ticket && (
                <div className="p-4 space-y-3">
                  <h3 className="font-semibold text-lg">{result.ticket.eventTitle}</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <DetailRow icon={<Calendar className="h-4 w-4" />} label="Event Date" value={formatDate(result.ticket.eventDate)} />
                    <DetailRow icon={<Tag className="h-4 w-4" />} label="Category" value={result.ticket.eventCategory || 'General'} />
                    <DetailRow icon={<CreditCard className="h-4 w-4" />} label="Price" value={`₹${result.ticket.price}`} />
                    <DetailRow icon={<Hash className="h-4 w-4" />} label="Ticket ID" value={result.ticket.ticketId.slice(0, 8) + '...'} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* INVALID */}
          {result.status === 'invalid' && (
            <div className="rounded-xl border-2 border-destructive bg-destructive/10 overflow-hidden animate-fade-in">
              <div className="bg-destructive px-4 py-3 flex items-center gap-3">
                <XCircle className="h-6 w-6 text-white" />
                <div>
                  <p className="font-bold text-white text-lg">❌ Invalid Ticket</p>
                  <p className="text-red-100 text-sm">{result.message}</p>
                </div>
              </div>
            </div>
          )}

          {result.status !== 'idle' && !loading && (
            <Button variant="outline" onClick={() => setResult({ status: 'idle', message: '' })} className="w-full gap-2">
              <RotateCcw className="h-4 w-4" /> Scan Another
            </Button>
          )}
        </CardContent>
      </Card>
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
