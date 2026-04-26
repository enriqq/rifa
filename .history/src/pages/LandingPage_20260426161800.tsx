import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import PrizeCard from "../components/PrizeCard";
import ProgressBar from "../components/ProgressBar";
import TicketGrid from "../components/TicketGrid";
import ReservationTimer from "../components/ReservationTimer";
import { GOLD } from "../lib/constants";
import Modal from "../components/Modal";

interface Prize {
  id: string;
  name: string;
  description: string;
  image_url: string;
  tier: number;
}

interface Raffle {
  id: string;
  name: string;
  description: string;
  total_tickets: number;
  ticket_price: number;
  is_active: boolean;
}

interface Ticket {
  id: string;
  ticket_number: number;
  status: "available" | "reserved" | "pending" | "sold";
  reserved_by: string | null;
}

function stripHtml(html: string) {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

export default function LandingPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [soldCount, setSoldCount] = useState(0);
  const [reservationExpiry, setReservationExpiry] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [modalPrize, setModalPrize] = useState<Prize | null>(null);

  const fetchData = async () => {
    const { data: raffleData } = await supabase
      .from("raffles")
      .select("*")
      .eq("is_active", true)
      .maybeSingle();
    if (raffleData) {
      setRaffle(raffleData);
      const { data: prizeData } = await supabase
        .from("prizes")
        .select("*")
        .eq("raffle_id", raffleData.id)
        .order("tier");
      if (prizeData) setPrizes(prizeData);
      const { data: ticketData } = await supabase
        .from("tickets")
        .select("id, ticket_number, status, reserved_by")
        .eq("raffle_id", raffleData.id)
        .order("ticket_number");
      if (ticketData) {
        setTickets(ticketData as Ticket[]);
        setSoldCount(
          ticketData.filter(
            (t) => t.status === "sold" || t.status === "pending",
          ).length,
        );
      }
    }
    setLoading(false);
  };

  const fetchUserReservation = useCallback(async () => {
    if (!user) {
      setReservationExpiry(null);
      return;
    }
    const { data } = await supabase
      .from("tickets")
      .select("reservation_expires_at")
      .eq("reserved_by", user.id)
      .eq("status", "reserved")
      .order("reservation_expires_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setReservationExpiry(data?.reservation_expires_at ?? null);
  }, [user]);

  useEffect(() => {
    fetchData();
    fetchUserReservation();
  }, [fetchUserReservation]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
      fetchUserReservation();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchUserReservation]);

  const handleToggleTicket = (ticketId: string) => {
    setSelectedTickets((prev) =>
      prev.includes(ticketId)
        ? prev.filter((id) => id !== ticketId)
        : [...prev, ticketId],
    );
  };

  const handleReserve = async () => {
    if (!user || selectedTickets.length === 0 || !raffle) return;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from("tickets")
      .update({
        status: "reserved",
        reserved_by: user.id,
        reserved_at: new Date().toISOString(),
        reservation_expires_at: expiresAt,
      })
      .in("id", selectedTickets)
      .eq("status", "available");
    if (!error) {
      setSelectedTickets([]);
      await fetchData();
      await fetchUserReservation();
      navigate("/checkout");
    }
  };

  const handleExpired = useCallback(async () => {
    if (!user) return;
    await supabase
      .from("tickets")
      .update({
        status: "available",
        reserved_by: null,
        reserved_at: null,
        reservation_expires_at: null,
      })
      .eq("reserved_by", user.id)
      .eq("status", "reserved")
      .lt("reservation_expires_at", new Date().toISOString());
    await fetchData();
    await fetchUserReservation();
  }, [user, fetchUserReservation]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#101010" }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-2 border-t-transparent rounded-full"
          style={{ borderColor: GOLD, borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  const totalTickets = raffle?.total_tickets || 100;
  const ticketPrice = raffle?.ticket_price || 0;

  return (
    <div className="min-h-screen" style={{ background: "#101010" }}>
      <ReservationTimer
        expiresAt={reservationExpiry}
        onExpired={handleExpired}
      />

      <section className="relative pt-20 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl"
            style={{ background: `${GOLD}15` }}
          />
          <div
            className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-3xl"
            style={{ background: "#2E7D3215" }}
          />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
              style={{
                background: `${GOLD}15`,
                color: GOLD,
                border: `1px solid ${GOLD}30`,
              }}
            >
              <Sparkles size={14} /> Rifa en vivo
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">
              {raffle?.name || "Rifa de Licores"}
              <br />
              <span style={{ color: GOLD }}>Premium</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
              {raffle?.description ||
                "Participa por las mejores marcas. Selecciona tus numeros favoritos y gana."}
            </p>
          </motion.div>
          <div className="max-w-md mx-auto">
            <ProgressBar sold={soldCount} total={totalTickets} />
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-12">
        <h2 className="text-2xl font-bold text-white mb-6">Premios</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {prizes.map((prize) => (
            <PrizeCard
              key={prize.id}
              tier={prize.tier}
              name={prize.name}
              description={stripHtml(prize.description)}
              imageUrl={prize.image_url}
              ticketPrice={ticketPrice}
              onClick={() => setModalPrize(prize)}
            />
          ))}
        </div>
      </section>

      <section id="ticket-section" className="max-w-6xl mx-auto px-4 pb-20">
        <div
          className="rounded-2xl border border-gray-800 p-6 sm:p-8"
          style={{ background: "#141414" }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">
                Selecciona tus Boletos
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                ${ticketPrice.toLocaleString()} MXN por boleto - Haz clic en los
                numeros que deseas
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded border-2"
                  style={{ borderColor: GOLD }}
                />{" "}
                Disponible
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded"
                  style={{
                    background: "rgba(255,193,7,0.3)",
                    border: "2px solid #FFC107",
                  }}
                />{" "}
                Reservado
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded"
                  style={{
                    background: "rgba(255,152,0,0.3)",
                    border: "2px solid #FF9800",
                  }}
                />{" "}
                Pendiente
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded"
                  style={{
                    background: "rgba(244,67,54,0.3)",
                    border: "2px solid #F44336",
                  }}
                />{" "}
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

          {!profile?.is_admin && selectedTickets.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl"
              style={{ background: "#1a1a1a", border: `1px solid ${GOLD}30` }}
            >
              <div>
                <p className="text-white font-semibold">
                  {selectedTickets.length} boleto
                  {selectedTickets.length > 1 ? "s" : ""} seleccionado
                  {selectedTickets.length > 1 ? "s" : ""}
                </p>
                <p className="text-gray-400 text-sm">
                  Total: $
                  {(selectedTickets.length * ticketPrice).toLocaleString()} MXN
                </p>
              </div>
              {user ? (
                <button
                  onClick={handleReserve}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105"
                  style={{ background: "#2E7D32", color: "#fff" }}
                >
                  Reservar boletos <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  onClick={() => navigate("/login")}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105"
                  style={{ background: GOLD, color: "#101010" }}
                >
                  Inicia sesión para reservar <ArrowRight size={16} />
                </button>
              )}
            </motion.div>
          )}
        </div>
      </section>

      <Modal open={!!modalPrize} onClose={() => setModalPrize(null)}>
        {modalPrize && (
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-stretch text-left w-full">
            {/* Imagen a la izquierda */}
            <div className="md:w-1/2 w-full flex-shrink-0 flex items-center justify-center">
              <img
                src={modalPrize.image_url}
                alt={modalPrize.name}
                className="rounded-xl object-cover w-full max-h-60 md:max-h-[420px] bg-black"
                style={{ maxWidth: 320 }}
              />
            </div>
            {/* Descripción a la derecha */}
            <div className="md:w-1/2 w-full flex flex-col justify-between pr-12">
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  {modalPrize.name}
                </h2>
                <div
                  className="text-gray-300 mb-4 prose prose-invert prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: modalPrize.description }}
                />
              </div>
              <div
                className="text-lg font-semibold mt-4"
                style={{ color: GOLD }}
              >
                ${ticketPrice?.toLocaleString?.() ?? ""} MXN{" "}
                <span className="text-sm text-gray-500">/ boleto</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
