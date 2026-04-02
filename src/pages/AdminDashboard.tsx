import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, BarChart3, Users, DollarSign, Ticket, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

const COLORS = ['hsl(243,75%,59%)', 'hsl(174,60%,45%)', 'hsl(30,90%,55%)', 'hsl(340,75%,55%)', 'hsl(200,70%,50%)'];

const defaultEvent = { title: '', description: '', date: '', price: '0', total_seats: '100', category: 'general', image_url: '' };

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const [events, setEvents] = useState<Tables<'events'>[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [profileCount, setProfileCount] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [form, setForm] = useState(defaultEvent);

  const fetchData = async () => {
    const [evRes, tkRes, prRes] = await Promise.all([
      supabase.from('events').select('*').order('date', { ascending: false }),
      supabase.from('tickets').select('*, events(title, price)'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
    ]);
    setEvents(evRes.data || []);
    setTickets(tkRes.data || []);
    setProfileCount(prRes.count || 0);
  };

  useEffect(() => { if (isAdmin) fetchData(); }, [isAdmin]);

  const totalRevenue = tickets.reduce((sum, t) => sum + (Number(t.events?.price) || 0), 0);
  const ticketsSold = tickets.length;

  const ticketsPerEvent = events.map(e => ({
    name: e.title.length > 15 ? e.title.slice(0, 15) + '...' : e.title,
    tickets: tickets.filter(t => t.event_id === e.id).length,
  }));

  const revenuePerEvent = events.map(e => ({
    name: e.title.length > 15 ? e.title.slice(0, 15) + '...' : e.title,
    revenue: tickets.filter(t => t.event_id === e.id).length * Number(e.price),
  })).filter(e => e.revenue > 0);

  const handleSaveEvent = async () => {
    const payload = {
      title: form.title,
      description: form.description,
      date: new Date(form.date).toISOString(),
      price: parseFloat(form.price),
      total_seats: parseInt(form.total_seats),
      available_seats: parseInt(form.total_seats),
      category: form.category,
      image_url: form.image_url || null,
      created_by: user!.id,
    };

    if (editingEvent) {
      const { error } = await supabase.from('events').update(payload).eq('id', editingEvent);
      if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Event Updated' });
    } else {
      const { error } = await supabase.from('events').insert(payload);
      if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Event Created! 🎉' });
    }
    setDialogOpen(false);
    setEditingEvent(null);
    setForm(defaultEvent);
    fetchData();
  };

  const handleEdit = (event: Tables<'events'>) => {
    setForm({
      title: event.title,
      description: event.description || '',
      date: event.date.slice(0, 16),
      price: String(event.price),
      total_seats: String(event.total_seats),
      category: event.category || 'general',
      image_url: event.image_url || '',
    });
    setEditingEvent(event.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Event Deleted' });
    fetchData();
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <AlertTriangle className="h-16 w-16 mx-auto text-destructive mb-4" />
        <h2 className="font-display text-2xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground">You need admin privileges to access this page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
        <Button onClick={() => { setForm(defaultEvent); setEditingEvent(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Create Event
        </Button>
      </div>

      {/* Fraud Detection Placeholder */}
      <div className="mb-6 p-3 rounded-lg bg-secondary/10 border border-secondary/20 animate-fade-in">
        <p className="text-sm text-secondary font-medium">🛡️ AI Fraud Detection — Monitoring ticket transactions for suspicious activity.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-primary' },
          { label: 'Tickets Sold', value: ticketsSold, icon: Ticket, color: 'text-secondary' },
          { label: 'Total Users', value: profileCount, icon: Users, color: 'text-primary' },
        ].map((stat, i) => (
          <Card key={i} className="hover-lift animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-lg bg-muted ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-display font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="animate-fade-in">
          <CardHeader><CardTitle className="font-display flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Tickets per Event</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={ticketsPerEvent}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="tickets" fill="hsl(243,75%,59%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardHeader><CardTitle className="font-display">Revenue per Event</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={revenuePerEvent} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {revenuePerEvent.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Events Table */}
      <Card className="animate-fade-in">
        <CardHeader><CardTitle className="font-display">Events</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Seats</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map(event => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.title}</TableCell>
                  <TableCell>{new Date(event.date).toLocaleDateString()}</TableCell>
                  <TableCell>${Number(event.price).toFixed(2)}</TableCell>
                  <TableCell>{event.available_seats}/{event.total_seats}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(event)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(event.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* All Bookings */}
      <Card className="mt-6 animate-fade-in">
        <CardHeader><CardTitle className="font-display">All Bookings</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket ID</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Booked</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map(ticket => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-mono text-xs">{ticket.ticket_id?.slice(0, 8)}...</TableCell>
                  <TableCell>{ticket.events?.title || 'N/A'}</TableCell>
                  <TableCell>{new Date(ticket.booking_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={ticket.is_used ? 'destructive' : 'default'}>
                      {ticket.is_used ? 'Used' : 'Valid'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Event Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Edit Event' : 'Create Event'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Event Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <Textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <Input type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" placeholder="Price" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
              <Input type="number" placeholder="Total Seats" value={form.total_seats} onChange={e => setForm({ ...form, total_seats: e.target.value })} />
            </div>
            <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="music">Music</SelectItem>
                <SelectItem value="tech">Tech</SelectItem>
                <SelectItem value="sports">Sports</SelectItem>
                <SelectItem value="art">Art</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Image URL (optional)" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEvent}>{editingEvent ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
