import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock } from 'lucide-react';

interface ReservationTimerProps {
  expiresAt: string | null;
  onExpired: () => void;
}

export default function ReservationTimer({ expiresAt, onExpired }: ReservationTimerProps) {
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    if (!expiresAt) {
      setRemaining(0);
      return;
    }

    const calc = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      return Math.max(0, Math.floor(diff / 1000));
    };

    setRemaining(calc());
    const interval = setInterval(() => {
      const r = calc();
      setRemaining(r);
      if (r <= 0) {
        clearInterval(interval);
        onExpired();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isUrgent = remaining > 0 && remaining < 120;

  return (
    <AnimatePresence>
      {remaining > 0 && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold"
          style={{
            background: isUrgent
              ? 'linear-gradient(135deg, #b71c1c, #e65100)'
              : 'linear-gradient(135deg, #101010, #1a1a1a)',
            color: isUrgent ? '#fff' : '#D4AF37',
            borderBottom: `2px solid ${isUrgent ? '#e65100' : '#D4AF37'}`,
          }}
        >
          <Clock size={16} className={isUrgent ? 'animate-pulse' : ''} />
          <span>
            Reserva activa: {String(minutes).padStart(2, '0')}:
            {String(seconds).padStart(2, '0')}
          </span>
          <span className="hidden sm:inline text-xs opacity-70 ml-2">
            | Completa tu pago antes de que expire
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
