import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';

const faqs = [
  { q: 'How do I book a ticket?', a: 'Browse events, click on one you like, and click "Book Ticket". You\'ll need to be signed in to complete the booking.' },
  { q: 'What is QR verification?', a: 'Each ticket comes with a unique QR code. Event staff can scan it to verify your ticket is genuine and hasn\'t been used yet.' },
  { q: 'How does wallet integration work?', a: 'Click "Connect Wallet" in the navbar to connect your MetaMask wallet. Your wallet address will be linked to your tickets for blockchain verification.' },
  { q: 'Can I get a refund?', a: 'Refund policies depend on the event organizer. Contact us for specific refund requests.' },
  { q: 'What is NFT ticketing?', a: 'NFT tickets are blockchain-verified digital tickets that prove ownership. This feature is being rolled out for select events.' },
  { q: 'How do I become an admin?', a: 'Admin roles are assigned by the platform administrator. Contact support if you need admin access for event management.' },
  { q: 'Is my data secure?', a: 'Yes, we use industry-standard encryption and secure authentication. Your wallet address and personal data are protected.' },
];

export default function Help() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="text-center mb-8 animate-fade-in">
        <HelpCircle className="h-12 w-12 mx-auto text-primary mb-4" />
        <h1 className="font-display text-3xl font-bold">Help Center</h1>
        <p className="text-muted-foreground mt-2">Frequently asked questions about Authentix</p>
      </div>

      <Accordion type="single" collapsible className="animate-fade-in">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger className="font-display text-left">{faq.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
