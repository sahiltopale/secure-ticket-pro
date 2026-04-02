import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ChatbotButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 transition-transform"
        aria-label="Chat"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 rounded-lg border bg-card shadow-xl animate-fade-in">
          <div className="p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
            <h3 className="font-display font-semibold">Authentix Assistant</h3>
            <p className="text-xs opacity-80">AI chatbot coming soon</p>
          </div>
          <div className="p-4 h-48 flex items-center justify-center text-muted-foreground text-sm">
            🤖 AI assistant is under development. Stay tuned!
          </div>
          <div className="p-3 border-t flex gap-2">
            <Input placeholder="Type a message..." disabled className="text-sm" />
            <Button size="icon" disabled><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </>
  );
}
