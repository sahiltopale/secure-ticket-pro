import { Mail, MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

export default function Contact() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: 'Message Sent! ✉️', description: 'We\'ll get back to you soon.' });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="font-display text-3xl font-bold text-center mb-8 animate-fade-in">Contact Us</h1>
      <div className="grid md:grid-cols-2 gap-8">
        <Card className="animate-fade-in">
          <CardHeader><CardTitle className="font-display">Send a Message</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input placeholder="Your Name" required />
              <Input type="email" placeholder="Your Email" required />
              <Input placeholder="Subject" required />
              <Textarea placeholder="Your Message" rows={5} required />
              <Button type="submit" className="w-full">Send Message</Button>
            </form>
          </CardContent>
        </Card>
        <div className="space-y-6 animate-fade-in" style={{ animationDelay: '150ms' }}>
          {[
            { icon: Mail, label: 'Email', value: 'support@authentix.io' },
            { icon: Phone, label: 'Phone', value: '+1 (555) 123-4567' },
            { icon: MapPin, label: 'Address', value: '123 Blockchain Ave, Web3 City' },
          ].map((item, i) => (
            <Card key={i} className="hover-lift">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="font-medium">{item.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
