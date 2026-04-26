import { motion } from 'framer-motion';
import { GOLD } from '../lib/constants';

interface ProgressBarProps {
  sold: number;
  total: number;
}

export default function ProgressBar({ sold, total }: ProgressBarProps) {
  const pct = total > 0 ? (sold / total) * 100 : 0;

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-2">
        <div>
          <span className="text-2xl sm:text-3xl font-bold" style={{ color: GOLD }}>
            {sold}
          </span>
          <span className="text-gray-500 text-sm ml-1">vendidos</span>
        </div>
        <div className="text-right">
          <span className="text-2xl sm:text-3xl font-bold text-white">
            {total - sold}
          </span>
          <span className="text-gray-500 text-sm ml-1">disponibles</span>
        </div>
      </div>
      <div
        className="w-full h-4 rounded-full overflow-hidden"
        style={{ background: '#1a1a1a' }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${GOLD}, #f0c850)`,
            boxShadow: `0 0 12px ${GOLD}60`,
          }}
        />
      </div>
      <p className="text-center text-xs text-gray-500 mt-2">
        {pct.toFixed(1)}% completado
      </p>
    </div>
  );
}
