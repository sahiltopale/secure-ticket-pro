import { Msg, QuickReply } from './types';

export const WELCOME: Msg = {
  id: 'welcome',
  role: 'assistant',
  content:
    "👋 Hi! I'm the **Authentix Assistant**. I can help you with event ticketing, blockchain verification, and more!\n\nTry one of the quick actions below, or just type your question.",
  timestamp: new Date(),
};

export const QUICK_REPLIES: QuickReply[] = [
  { label: 'How to book tickets?', message: 'How do I book tickets on Authentix?', icon: '🎫' },
  { label: 'Connect wallet', message: 'How do I connect my MetaMask wallet?', icon: '🔗' },
  { label: 'Verify my ticket', message: 'How does QR code ticket verification work?', icon: '📱' },
  { label: 'Seat selection help', message: 'How does seat selection work?', icon: '💺' },
];

export const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
