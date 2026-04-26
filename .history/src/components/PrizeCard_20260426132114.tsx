import { motion } from 'framer-motion';
import { Wine } from 'lucide-react';
import { GOLD } from '../lib/constants';
import Modal from '../components/Modal';

interface PrizeCardProps {
  tier: number;
  name: string;
  description: string;
  imageUrl: string;
  ticketPrice: number;
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


export default function PrizeCard({ tier, name, description, imageUrl, ticketPrice, onClick }: PrizeCardProps) {
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
        <img src={imageUrl} alt={name} className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = ''; }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
          style={{ background: tierGradients[tier], color: '#101010' }}>
          {tierLabels[tier]}
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-xl font-bold text-white mb-1">{name}</h3>
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{description}</p>
        <div className="flex items-center gap-1.5">
          <Wine size={16} style={{ color: GOLD }} />
          <span className="text-sm font-semibold" style={{ color: GOLD }}>
            ${ticketPrice.toLocaleString()} MXN
          </span>
          <span className="text-gray-500 text-xs">/ boleto</span>
        </div>
      </div>
    </motion.div>
  );
}

<Modal open={!!modalPrize} onClose={() => setModalPrize(null)}>
  {modalPrize && (
    <div className="text-center">
      <img src={modalPrize.image_url} alt={modalPrize.name} className="w-full h-48 object-cover rounded-xl mb-4" />
      <h2 className="text-2xl font-bold text-white mb-2">{modalPrize.name}</h2>
      <p className="text-gray-400 mb-4">{modalPrize.description}</p>
      <div className="text-lg font-semibold" style={{ color: GOLD }}>
        ${modalPrize.ticket_price.toLocaleString()} MXN <span className="text-sm text-gray-500">/ boleto</span>
      </div>
    </div>
  )}
</Modal>
