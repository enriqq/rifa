import { motion } from 'framer-motion';
import { Trophy, Wine } from 'lucide-react';
import { GOLD } from '../lib/constants';

interface PrizeCardProps {
  tier: number;
  name: string;
  description: string;
  imageUrl: string;
  ticketPrice: number;
  totalTickets: number;
  soldCount: number;
  onClick: () => void;
}

const tierLabels: Record<number, string> = {
  1: '1er Premio',
  2: '2do Premio',
  3: '3er Premio',
};

const tierGradients: Record<number, string> = {
  1: 'linear-gradient(135deg, #D4AF37 0%, #f0c850 50%, #D4AF37 100%)',
  2: 'linear-gradient(135deg, #9E9E9E 0%, #C0C0C0 50%, #9E9E9E 100%)',
  3: 'linear-gradient(135deg, #CD7F32 0%, #D4956A 50%, #CD7F32 100%)',
};

export default function PrizeCard({
  tier,
  name,
  description,
  imageUrl,
  ticketPrice,
  totalTickets,
  soldCount,
  onClick,
}: PrizeCardProps) {
  const pct = totalTickets > 0 ? (soldCount / totalTickets) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: tier * 0.15 }}
      whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(212,175,55,0.15)' }}
      onClick={onClick}
      className="cursor-pointer rounded-2xl overflow-hidden border border-gray-800"
      style={{ background: '#141414' }}
    >
      <div className="relative h-48 sm:h-56 overflow-hidden">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div
          className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
          style={{
            background: tierGradients[tier],
            color: '#101010',
          }}
        >
          {tierLabels[tier]}
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-xl font-bold text-white mb-1">{name}</h3>
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{description}</p>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Wine size={16} style={{ color: GOLD }} />
            <span className="text-sm font-semibold" style={{ color: GOLD }}>
              ${ticketPrice.toLocaleString()} CLP
            </span>
            <span className="text-gray-500 text-xs">/ ticket</span>
          </div>
          <div className="flex items-center gap-1">
            <Trophy size={14} className="text-gray-500" />
            <span className="text-xs text-gray-400">
              {soldCount}/{totalTickets}
            </span>
          </div>
        </div>

        <div className="w-full h-1.5 rounded-full bg-gray-800 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, delay: tier * 0.15 }}
            className="h-full rounded-full"
            style={{ background: tierGradients[tier] }}
          />
        </div>
      </div>
    </motion.div>
  );
}
