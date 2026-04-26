import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import PrizeCard from '../components/PrizeCard';
import ProgressBar from '../components/ProgressBar';
import TicketGrid from '../components/TicketGrid';
import ReservationTimer from '../components/ReservationTimer';
import { GOLD } from '../lib/constants';

interface Prize {
  id: string;
  name: string;
  description: string;
  image_url: string;
  tier: number;
  total_tickets: number;
  ticket_price: number;
}

interface Ticket {
  id: string;
  ticket_number: number;
  status: 'available' | 'reserved' | 'pending' | 'sold';
  reserved_by: string | null;
  prize_id: string;
}

const PRIZE_IMAGES: Record<number, string> = {
  1: 'https://images.pexels.com/photos/6050441/pexels-photo-6050441.jpeg?auto=compress&cs=tinysrgb&w=600',
  2: 'https://images.pexels.com/photos/2912128/pexels-photo-2912128.jpeg?auto=compress&cs=tinysrgb&w=600',
  3: 'https://images.pexels.com/photos/2718164/pexels-photo-2718164.jpeg?auto=compress&cs=tinysrgb&w=600',
};

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [selectedPrize, setSelectedPrize] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [soldCounts, setSoldCounts] = useState<Record<string, number>>({});
  const [reservationExpiry, setReservationExpiry] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPrizes = async () => {
    const { data } = await supabase.from('prizes').select('*').order('tier');
    if (data && data.length > 0) {
      setPrizes(data);
      if (!selectedPrize) setSelectedPrize(data[0].id);
    } else {
      // Seed prizes if empty
      await seedPrizes();
    }
  };

  const seedPrizes = async () => {
    const seed = [
      { name: 'Johnnie Walker Blue Label', description: 'La experiencia definitiva en whisky. Edicion limitada con notas de roble, chocolate oscuro y frutas secas.', image_url: PRIZE_IMAGES[1], tier: 1, total_tickets: 100, ticket_price: 5000 },
      { name: 'Macallan 12 Anos', description: 'Single malt escoces madurado en barricas de jerez. Notas de vainilla, canela y frutas rojas.', image_url: PRIZE_IMAGES[2], tier: 2, total_tickets: 80, ticket_price: 3000 },
      { name: 'Hendricks Gin Premium', description: 'Gin artesanal infusionado con pepino y petalos de rosa. Fresco, elegante y sofisticado.', image_url: PRIZE_IMAGES[3], tier: 3, total_tickets: 60, ticket_price: 2000 },
    ];
    const { data: inserted } = await supabase.from('prizes').insert(seed).select();
    if (inserted) {
      setPrizes(inserted);
      setSelectedPrize(inserted[0].id);
      // Create tickets for each prize
      for (const prize of inserted) {
        const ticketRows = Array.from({ length: prize.total_tickets }, (_, i) => ({
          prize_id: prize.id,
          ticket_number: i + 1,
          status: 'available',
        }));
        await supabase.from('tickets').insert(ticketRows);
      }
    }
  };

  const fetchTickets = async (prizeId: string) => {
    const { data } = await supabase
      .from('tickets')
      .select('id, ticket_number, status, reserved_by, prize_id')
      .eq('prize_id', prizeId)
      .order('ticket_number');
    if (data) setTickets(data as Ticket[]);
  };

  const fetchSoldCounts = async () => {
    const { data } = await supabase
      .from('tickets')
      .select('prize_id, status');
    if (data) {
      const counts: Record<string, number> = {};
      for (const t of data) {
        if (t.status === 'sold' || t.status === 'pending') {
          counts[t.prize_id] = (counts[t.prize_id] || 0) + 1;
        }
      }
      setSoldCounts(counts);
    }
  };

  const fetchUserReservation = useCallback(async () => {
    if (!user) { setReservationExpiry(null); return; }
    const { data } = await supabase
      .from('tickets')
      .select('reservation_expires_at')
      .eq('reserved_by', user.id)
      .eq('status', 'reserved')
      .order('reservation_expires_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setReservationExpiry(data?.reservation_expires_at ?? null);
  }, [user]);

  useEffect(() => {
    fetchPrizes();
    fetchSoldCounts();
  }, []);

  useEffect(() => {
    if (selectedPrize) fetchTickets(selectedPrize);
  }, [selectedPrize]);

  useEffect(() => {
    fetchUserReservation();
    const interval = setInterval(() => {
      if (selectedPrize) fetchTickets(selectedPrize);
      fetchSoldCounts();
      fetchUserReservation();
    }, 10000);
    return () => clearInterval(interval);
  }, [selectedPrize, fetchUserReservation]);

  useEffect(() => { setLoading(false); }, [prizes]);

  const handleToggleTicket = (ticketId: string) => {
    setSelectedTickets((prev) =>
      prev.includes(ticketId) ? prev.filter((id) => id !== ticketId) : [...prev, ticketId]
    );
  };

  const handleReserve = async () => {
    if (!user || selectedTickets.length === 0) return;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from('tickets')
      .update({
        status: 'reserved',
        reserved_by: user.id,
        reserved_at: new Date().toISOString(),
        reservation_expires_at: expiresAt,
      })
      .in('id', selectedTickets)
      .eq('status', 'available');

    if (!error) {
      setSelectedTickets([]);
      await fetchTickets(selectedPrize!);
      await fetchSoldCounts();
      await fetchUserReservation();
      navigate('/checkout');
    }
  };

  const handleExpired = useCallback(async () => {
    if (!user) return;
    await supabase
      .from('tickets')
      .update({ status: 'available', reserved_by: null, reserved_at: null, reservation_expires_at: null })
      .eq('reserved_by', user.id)
      .eq('status', 'reserved')
      .lt('reservation_expires_at', new Date().toISOString());
    await fetchTickets(selectedPrize!);
    await fetchSoldCounts();
    await fetchUserReservation();
  }, [user, selectedPrize, fetchUserReservation]);

  const totalAll = prizes.reduce((s, p) => s + p.total_tickets, 0);
  const soldAll = prizes.reduce((s, p) => s + (soldCounts[p.id] || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#101010' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-8 h-8 border-2 border-t-transparent rounded-full"
          style={{ borderColor: GOLD, borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#101010' }}>
      <ReservationTimer expiresAt={reservationExpiry} onExpired={handleExpired} />

      {/* Hero */}
      <section className="relative pt-20 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl"
            style={{ background: `${GOLD}15` }}
          />
          <div
            className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-3xl"
            style={{ background: '#2E7D3215' }}
          />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
              style={{ background: `${GOLD}15`, color: GOLD, border: `1px solid ${GOLD}30` }}
            >
              <Sparkles size={14} />
              Sorteo en vivo
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">
              Sorteo de Licores<br />
              <span style={{ color: GOLD }}>Premium</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
              Participa por las mejores marcas de licores premium. Selecciona tus numeros favoritos y gana.
            </p>
          </motion.div>

          <div className="max-w-md mx-auto">
            <ProgressBar sold={soldAll} total={totalAll} />
          </div>
        </div>
      </section>

      {/* Prizes */}
      <section className="max-w-6xl mx-auto px-4 pb-12">
        <h2 className="text-2xl font-bold text-white mb-6">Premios</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {prizes.map((prize) => (
            <PrizeCard
              key={prize.id}
              tier={prize.tier}
              name={prize.name}
              description={prize.description}
              imageUrl={prize.image_url}
              ticketPrice={prize.ticket_price}
              totalTickets={prize.total_tickets}
              soldCount={soldCounts[prize.id] || 0}
              onClick={() => setSelectedPrize(prize.id)}
            />
          ))}
        </div>
      </section>

      {/* Ticket Selection */}
      {selectedPrize && (
        <section className="max-w-6xl mx-auto px-4 pb-20">
          <div className="rounded-2xl border border-gray-800 p-6 sm:p-8" style={{ background: '#141414' }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Selecciona tus Tickets
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  {prizes.find((p) => p.id === selectedPrize)?.name} - Haz clic en los numeros que deseas
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded border-2" style={{ borderColor: GOLD }} />
                  Disponible
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded" style={{ background: 'rgba(255,193,7,0.3)', border: '2px solid #FFC107' }} />
                  Reservado
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded" style={{ background: 'rgba(255,152,0,0.3)', border: '2px solid #FF9800' }} />
                  Pendiente
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded" style={{ background: 'rgba(244,67,54,0.3)', border: '2px solid #F44336' }} />
                  Vendido
                </span>
              </div>
            </div>

            <TicketGrid
              tickets={tickets}
              selectedTickets={selectedTickets}
              onToggle={handleToggleTicket}
              currentUserId={user?.id ?? null}
            />

            {selectedTickets.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl"
                style={{ background: '#1a1a1a', border: `1px solid ${GOLD}30` }}
              >
                <div>
                  <p className="text-white font-semibold">
                    {selectedTickets.length} ticket{selectedTickets.length > 1 ? 's' : ''} seleccionado{selectedTickets.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-gray-400 text-sm">
                    Total: $
                    {(
                      selectedTickets.length *
                      (prizes.find((p) => p.id === selectedPrize)?.ticket_price || 0)
                    ).toLocaleString()}{' '}
                    CLP
                  </p>
                </div>
                {user ? (
                  <button
                    onClick={handleReserve}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105"
                    style={{ background: '#2E7D32', color: '#fff' }}
                  >
                    Reservar Tickets
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/login')}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105"
                    style={{ background: GOLD, color: '#101010' }}
                  >
                    Inicia sesion para reservar
                    <ArrowRight size={16} />
                  </button>
                )}
              </motion.div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
