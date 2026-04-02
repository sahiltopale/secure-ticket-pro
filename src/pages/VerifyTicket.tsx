import { useState, useEffect, useRef } from 'react';
import { Camera, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

type ScanResult = { status: 'idle' | 'valid' | 'invalid' | 'used'; message: string };

export default function VerifyTicket() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult>({ status: 'idle', message: '' });
  const scannerRef = useRef<HTMLDivElement>(null);
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
    try {
      let parsed: any;
      try { parsed = JSON.parse(qrData); } catch { parsed = { ticketId: qrData }; }

      const { data: ticket, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('ticket_id', parsed.ticketId || '')
        .single();

      if (error || !ticket) {
        setResult({ status: 'invalid', message: 'Ticket not found. This QR code is invalid.' });
        return;
      }

      if (ticket.is_used) {
        setResult({ status: 'used', message: 'This ticket has already been used.' });
        return;
      }

      // Mark as used
      await supabase.from('tickets').update({ is_used: true }).eq('id', ticket.id);
      setResult({ status: 'valid', message: `Ticket verified! Event: ${parsed.eventId || 'N/A'}` });
    } catch (err: any) {
      setResult({ status: 'invalid', message: 'Verification failed: ' + err.message });
    }
  };

  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

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
          <div id="qr-reader" ref={scannerRef} className="w-full rounded-lg overflow-hidden" />

          {!scanning && result.status === 'idle' && (
            <Button onClick={startScanner} className="w-full gap-2">
              <Camera className="h-4 w-4" /> Start Scanning
            </Button>
          )}

          {scanning && (
            <Button variant="destructive" onClick={stopScanner} className="w-full">
              Stop Scanner
            </Button>
          )}

          {result.status !== 'idle' && (
            <div className={`p-4 rounded-lg flex items-center gap-3 ${
              result.status === 'valid' ? 'bg-secondary/10 text-secondary' :
              result.status === 'used' ? 'bg-yellow-500/10 text-yellow-600' :
              'bg-destructive/10 text-destructive'
            }`}>
              {result.status === 'valid' ? <CheckCircle className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
              <div>
                <p className="font-semibold">
                  {result.status === 'valid' ? '✅ Valid Ticket' : result.status === 'used' ? '⚠️ Already Used' : '❌ Invalid Ticket'}
                </p>
                <p className="text-sm">{result.message}</p>
              </div>
            </div>
          )}

          {result.status !== 'idle' && (
            <Button variant="outline" onClick={() => { setResult({ status: 'idle', message: '' }); }} className="w-full gap-2">
              <RotateCcw className="h-4 w-4" /> Scan Another
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
