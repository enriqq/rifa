import { motion } from 'framer-motion';
import { GOLD, CHARCOAL } from '../lib/constants';
import { playClick } from '../lib/audio';

export interface TicketData {
  id: string;
  ticket_number: number;
  status: 'available' | 'reserved' | 'pending' | 'sold';
  reserved_by: string | null;
  prize_id: string;
}

interface TicketGridProps {
  tickets: TicketData[];
  selectedTickets: string[];
  onToggle: (ticketId: string) => void;
  currentUserId: string | null;
}

const statusStyles: Record<string, { bg: string; border: string; text: string; cursor: string }> = {
  available: {
    bg: 'transparent',
    border: GOLD,
    text: GOLD,
    cursor: 'pointer',
  },
  reserved: {
    bg: 'rgba(255, 193, 7, 0.15)',
    border: '#FFC107',
    text: '#FFC107',
    cursor: 'default',
  },
  pending: {
    bg: 'rgba(255, 152, 0, 0.15)',
    border: '#FF9800',
    text: '#FF9800',
    cursor: 'default',
  },
  sold: {
    bg: 'rgba(244, 67, 54, 0.15)',
    border: '#F44336',
    text: '#F44336',
    cursor: 'not-allowed',
  },
};

export default function TicketGrid({ tickets, selectedTickets, onToggle, currentUserId }: TicketGridProps) {
  const handleClick = (ticket: TicketData) => {
    if (ticket.status === 'sold' || ticket.status === 'pending') return;
    if (ticket.status === 'reserved' && ticket.reserved_by !== currentUserId) return;
    playClick();
    onToggle(ticket.id);
  };

  return (
    <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
      {tickets.map((ticket, i) => {
        const style = statusStyles[ticket.status];
        const isSelected = selectedTickets.includes(ticket.id);
        const isOwnReserved = ticket.status === 'reserved' && ticket.reserved_by === currentUserId;
        const canClick = ticket.status === 'available' || isOwnReserved;

        return (
          <motion.button
            key={ticket.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.01, duration: 0.2 }}
            whileHover={canClick ? { scale: 1.12 } : {}}
            whileTap={canClick ? { scale: 0.95 } : {}}
            onClick={() => handleClick(ticket)}
            disabled={!canClick}
            className={`
              relative aspect-square rounded-lg text-xs sm:text-sm font-bold
              transition-all duration-200 border-2
              ${ticket.status === 'reserved' && !isOwnReserved ? 'animate-pulse' : ''}
              ${isSelected ? 'ring-2 ring-offset-1 ring-offset-transparent' : ''}
            `}
            style={{
              background: isSelected
                ? `linear-gradient(135deg, ${GOLD}, #b8941e)`
                : style.bg,
              borderColor: isSelected ? GOLD : style.border,
              color: isSelected ? CHARCOAL : style.text,
              cursor: style.cursor,
              boxShadow: isSelected ? `0 0 12px ${GOLD}40` : 'none',
            }}
          >
            {ticket.ticket_number}
            {ticket.status === 'sold' && (
              <span className="absolute inset-0 flex items-center justify-center text-lg opacity-60">✕</span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
