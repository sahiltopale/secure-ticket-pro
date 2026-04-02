import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, DollarSign, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export default function EventsPage() {
  const [events, setEvents] = useState<Tables<'events'>[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      let query = supabase.from('events').select('*').order('date', { ascending: true });
      if (search) query = query.ilike('title', `%${search}%`);
      if (category !== 'all') query = query.eq('category', category);
      const { data } = await query;
      setEvents(data || []);
      setLoading(false);
    };
    fetchEvents();
  }, [search, category]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero */}
      <div className="text-center mb-10 animate-fade-in">
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
          Discover <span className="text-primary">Amazing Events</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Book tickets securely with blockchain-ready verification. Your ticket, your proof.
        </p>
      </div>

      {/* AI Recommendation Placeholder */}
      <div className="mb-8 p-4 rounded-lg bg-primary/5 border border-primary/20 animate-fade-in">
        <p className="text-sm text-primary font-medium">🤖 AI Recommendations coming soon — personalized event suggestions based on your interests.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="music">Music</SelectItem>
            <SelectItem value="tech">Tech</SelectItem>
            <SelectItem value="sports">Sports</SelectItem>
            <SelectItem value="art">Art</SelectItem>
            <SelectItem value="general">General</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-muted rounded-t-lg" />
              <CardContent className="p-4 space-y-2">
                <div className="h-5 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg">No events found. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event, idx) => (
            <Link key={event.id} to={`/event/${event.id}`}>
              <Card
                className="overflow-hidden hover-lift cursor-pointer group"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="h-48 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center overflow-hidden">
                  {event.image_url ? (
                    <img src={event.image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <span className="text-4xl">🎪</span>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="text-xs">{event.category || 'general'}</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(event.date).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-1 group-hover:text-primary transition-colors">{event.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-between items-center">
                  <span className="font-semibold text-primary flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />{Number(event.price).toFixed(2)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {event.available_seats}/{event.total_seats} seats
                  </span>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
