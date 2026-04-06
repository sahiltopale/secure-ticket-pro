import { useState } from 'react';
import { cn } from '@/lib/utils';

interface SeatLayoutProps {
  category: string | null;
  totalSeats: number;
  availableSeats: number;
  onSelect: (seat: string) => void;
  selectedSeat: string | null;
}

function generateSeats(category: string | null, total: number) {
  const cat = (category || 'general').toLowerCase();
  const seats: { id: string; row: string; number: number; type: 'standard' | 'vip' | 'premium' }[] = [];

  let cols: number;
  if (cat === 'concert' || cat === 'music') cols = 10;
  else if (cat === 'sports') cols = 12;
  else if (cat === 'conference' || cat === 'workshop') cols = 8;
  else cols = 8;

  const rows = Math.ceil(total / cols);
  let seatIndex = 0;

  for (let r = 0; r < rows; r++) {
    const rowLabel = String.fromCharCode(65 + r);
    for (let c = 0; c < cols && seatIndex < total; c++) {
      seatIndex++;
      const type = r === 0 ? 'vip' : r <= 2 ? 'premium' : 'standard';
      seats.push({ id: `${rowLabel}${c + 1}`, row: rowLabel, number: c + 1, type });
    }
  }
  return { seats, cols };
}

export default function SeatLayout({ category, totalSeats, availableSeats, onSelect, selectedSeat }: SeatLayoutProps) {
  const { seats, cols } = generateSeats(category, totalSeats);
  const bookedCount = totalSeats - availableSeats;
  // Simulate booked seats (first N seats are booked)
  const bookedSeats = new Set(seats.slice(0, bookedCount).map(s => s.id));

  return (
    <div className="space-y-4">
      {/* Stage / Screen */}
      <div className="mx-auto w-3/4 py-2 rounded-lg bg-primary/10 text-center text-sm font-medium text-primary border border-primary/20">
        {category?.toLowerCase() === 'sports' ? '🏟️ Field / Court' :
         category?.toLowerCase() === 'conference' || category?.toLowerCase() === 'workshop' ? '🎤 Stage' :
         '🎵 Stage'}
      </div>

      {/* Seats Grid */}
      <div className="overflow-x-auto">
        <div
          className="grid gap-1.5 mx-auto w-fit"
          style={{ gridTemplateColumns: `24px repeat(${cols}, 1fr)` }}
        >
          {Array.from(new Set(seats.map(s => s.row))).map(row => (
            <>
              <div key={`label-${row}`} className="flex items-center justify-center text-xs font-mono text-muted-foreground w-6">
                {row}
              </div>
              {seats.filter(s => s.row === row).map(seat => {
                const isBooked = bookedSeats.has(seat.id);
                const isSelected = selectedSeat === seat.id;
                return (
                  <button
                    key={seat.id}
                    disabled={isBooked}
                    onClick={() => onSelect(seat.id)}
                    title={`${seat.id} - ${seat.type.toUpperCase()}`}
                    className={cn(
                      'w-8 h-8 rounded-md text-[10px] font-medium transition-all duration-200 border',
                      isBooked && 'bg-muted text-muted-foreground/40 border-muted cursor-not-allowed',
                      !isBooked && !isSelected && seat.type === 'vip' && 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 hover:scale-110',
                      !isBooked && !isSelected && seat.type === 'premium' && 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50 hover:scale-110',
                      !isBooked && !isSelected && seat.type === 'standard' && 'bg-card border-border text-foreground hover:bg-accent hover:scale-110',
                      isSelected && 'bg-primary text-primary-foreground border-primary scale-110 ring-2 ring-primary/30',
                    )}
                  >
                    {seat.number}
                  </button>
                );
              })}
            </>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700" />
          <span>VIP</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700" />
          <span>Premium</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-card border border-border" />
          <span>Standard</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-muted border border-muted" />
          <span>Booked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-primary border border-primary" />
          <span>Selected</span>
        </div>
      </div>
    </div>
  );
}
