import { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Shield, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SecureQRProps {
  ticketId: string;
  size?: number;
}

export default function SecureQR({ ticketId, size = 160 }: SecureQRProps) {
  const [qrValue, setQrValue] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [loading, setLoading] = useState(true);
  const [isUsed, setIsUsed] = useState(false);

  const fetchToken = useCallback(async () => {
    if (isUsed) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-qr-token', {
        body: { ticketId },
      });
      if (data?.used) {
        setIsUsed(true);
        setQrValue('');
        setLoading(false);
        return;
      }
      if (error || !data?.token) {
        setQrValue(`${window.location.origin}/verify/${ticketId}`);
      } else {
        setQrValue(`${window.location.origin}/verify/${ticketId}?token=${data.token}&t=${data.timestamp}`);
      }
      setCountdown(30);
    } catch {
      setQrValue(`${window.location.origin}/verify/${ticketId}`);
    } finally {
      setLoading(false);
    }
  }, [ticketId, isUsed]);

  useEffect(() => {
    fetchToken();
    const interval = setInterval(fetchToken, 30000);
    return () => clearInterval(interval);
  }, [fetchToken]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => (prev <= 1 ? 30 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (isUsed) {
    return (
      <div className="flex flex-col items-center justify-center p-4 text-center" style={{ width: size, height: size }}>
        <Shield className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm font-medium text-muted-foreground">Ticket Already Used</p>
      </div>
    );
  }

  return (
    <div
      className="relative select-none"
      onContextMenu={(e) => e.preventDefault()}
      style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
    >
      <div className="relative bg-white p-3 rounded-lg">
        {loading ? (
          <div className="flex items-center justify-center" style={{ width: size, height: size }}>
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <QRCodeSVG value={qrValue} size={size} level="H" />
        )}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03]">
          <span className="text-black text-xs font-bold rotate-[-30deg] whitespace-nowrap">
            AUTHENTIX SECURE • DO NOT SHARE
          </span>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 justify-center text-xs text-muted-foreground">
        <Shield className="h-3 w-3 text-primary" />
        <span>Refreshes in {countdown}s</span>
        <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-1000"
            style={{ width: `${(countdown / 30) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
