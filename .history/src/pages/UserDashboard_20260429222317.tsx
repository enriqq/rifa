import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Ticket, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { GOLD } from '../lib/constants';

interface UserTicket {
  id: string;
  ticket_number: number;
  status: 'available' | 'reserved' | 'pending' | 'sold';
  reservation_expires_at: string | null;
  raffles: { name: string; ticket_price: number };
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  reserved: { label: 'Reservado', color: '#FFC107', icon: Clock },
  pending: { label: 'Pendiente', color: '#FF9800', icon: AlertCircle },
  sold: { label: 'Aprobado', color: '#2E7D32', icon: CheckCircle },
};

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<UserTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchTickets = async () => {
      const { data } = await supabase
        .from('tickets')
        .select('id, ticket_number, status, reservation_expires_at, raffles(name, ticket_price)')
        .or(`reserved_by.eq.${user.id},purchased_by.eq.${user.id}`)
        .in('status', ['reserved', 'pending', 'sold'])
        .order('ticket_number');
      if (data) setTickets(data as unknown as UserTicket[]);
      setLoading(false);
    };
    fetchTickets();
    const interval = setInterval(fetchTickets, 10000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#101010' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-8 h-8 border-2 border-t-transparent rounded-full"
          style={{ borderColor: GOLD, borderTopColor: 'transparent' }} />
      </div>
    );
  }

  const raffleName = tickets[0]?.raffles?.name || 'Sorteo Premium';
  const ticketPrice = tickets[0]?.raffles?.ticket_price || 0;

  return (
    <div className="min-h-screen pt-20 pb-20 px-4" style={{ background: '#101010' }}>
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-white mb-2">Mis boletos</h1>
          <p className="text-gray-500 mb-8">Estado en tiempo real de tus boletos</p>
        </motion.div>

        {tickets.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <Ticket size={48} className="mx-auto mb-4 text-gray-700" />
            <h2 className="text-xl font-bold text-white mb-2">No tienes boletos</h2>
            <p className="text-gray-500 mb-6">Selecciona boletos desde la pagina principal</p>
            <button onClick={() => navigate('/')} className="px-6 py-3 rounded-xl font-semibold text-sm"
              style={{ background: GOLD, color: '#101010' }}>Ver rifa</button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-800 overflow-hidden" style={{ background: '#141414' }}>
              <div className="p-5 border-b border-gray-800">
                <h3 className="text-lg font-semibold text-white">{raffleName}</h3>
                <p className="text-gray-500 text-sm">${ticketPrice.toLocaleString()} MXN por boleto</p>
              </div>
              <div className="divide-y divide-gray-800/50">
                {tickets.map((ticket, i) => {
                  const config = statusConfig[ticket.status];
                  const Icon = config?.icon || XCircle;
                  return (
                    <motion.div key={ticket.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-white">#{ticket.ticket_number}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon size={14} style={{ color: config?.color }} />
                        <span className="text-sm font-medium px-2.5 py-1 rounded-full"
                          style={{ color: config?.color, background: `${config?.color}15` }}>
                          {config?.label}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
            {tickets.some((t) => t.status === 'reserved') && (
              <div className="text-center">
                <button onClick={() => navigate('/checkout')} className="px-6 py-3 rounded-xl font-semibold text-sm"
                  style={{ background: '#2E7D32', color: '#fff' }}>Completar pago</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
