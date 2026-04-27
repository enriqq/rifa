import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  CheckCircle,
  XCircle,
  User,
  FileText,
  Image as ImageIcon,
  RefreshCw,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { GOLD } from "../lib/constants";

interface PendingTicket {
  id: string;
  ticket_number: number;
  raffle_id: string;
  reserved_by: string;
  raffles: { name: string; ticket_price: number };
  profiles: { full_name: string; email: string };
  receipts: {
    file_url: string;
    file_name: string;
    file_type: string;
    created_at: string;
  }[];
}

interface SoldTicket {
  id: string;
  ticket_number: number;
  purchased_at: string;
  purchased_by: string;
  profiles: { full_name: string; email: string } | null;
}

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export default function AdminDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [pendingTickets, setPendingTickets] = useState<PendingTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [soldTickets, setSoldTickets] = useState<SoldTicket[]>([]);
  const [soldLoading, setSoldLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/admin-login");
      return;
    }
    if (profile && !profile.is_admin) {
      navigate("/");
      return;
    }
  }, [user, profile, navigate]);

  const fetchPending = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const res = await fetch(`${FUNCTION_URL}/admin-pending`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const json = await res.json();
        setPendingTickets(json.data || []);
      } else {
        const errText = await res.text();
        console.error("admin-pending error:", res.status, errText);
        setPendingTickets([]);
      }
    } catch (err) {
      console.error("admin-pending fetch failed:", err);
      setPendingTickets([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!profile?.is_admin) return;

    fetchPending();
    const interval = setInterval(fetchPending, 5000);

    return () => clearInterval(interval);
  }, [profile?.is_admin, fetchPending]);

  const handleAction = useCallback(
    async (
      ticketIds: string[],
      action: "approve" | "reject",
    ) => {
      setActionLoading(ticketIds.join(","));
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      await fetch(`${FUNCTION_URL}/admin-action`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ticketIds, action }),
      });

      setPendingTickets((prev) => prev.filter((t) => !ticketIds.includes(t.id)));
      setActionLoading(null);
    },
    [],
  );

  const fetchSold = useCallback(async () => {
    setSoldLoading(true);
    const { data, error } = await supabase
      .from("tickets")
      .select(`
        id, ticket_number, purchased_at, purchased_by,
        profiles(full_name, email)
        `)
      .eq("status", "sold");
console.log("sold data", data, "error", error);
    setSoldTickets(
      (data || []).map((t: unknown) => {
        const ticket = t as SoldTicket & {
          profiles: SoldTicket["profiles"] | SoldTicket["profiles"][];
        };
        return {
          ...ticket,
          profiles: Array.isArray(ticket.profiles)
            ? ticket.profiles[0]
            : ticket.profiles,
        };
      }),
    );
    setSoldLoading(false);
  }, []);

  useEffect(() => {
    if (!profile?.is_admin) return;
    fetchSold();
  }, [profile?.is_admin, fetchSold]);

  if (!profile?.is_admin) return null;

  // Agrupa los tickets por usuario
  const grouped = Object.values(
    pendingTickets.reduce(
      (acc, ticket) => {
        const key = ticket.reserved_by;
        if (!acc[key]) {
          acc[key] = {
            reserved_by: key,
            profile: ticket.profiles,
            tickets: [],
            receipts: [],
            raffle: ticket.raffles,
          };
        }
        acc[key].tickets.push(ticket);
        acc[key].receipts.push(...(ticket.receipts || []));
        return acc;
      },
      {} as Record<
        string,
        {
          reserved_by: string;
          profile: PendingTicket["profiles"];
          tickets: PendingTicket[];
          receipts: PendingTicket["receipts"];
          raffle: PendingTicket["raffles"];
        }
      >,
    ),
  );

  type SoldGroup = {
    profile: SoldTicket["profiles"];
    tickets: SoldTicket[];
  };

  const soldGrouped: SoldGroup[] = Object.values(
    soldTickets.reduce(
      (acc, ticket) => {
        const key = ticket.purchased_by;
        if (!acc[key]) {
          acc[key] = {
            profile: ticket.profiles,
            tickets: [],
          };
        }
        acc[key].tickets.push(ticket);
        return acc;
      },
      {} as Record<string, SoldGroup>,
    ),
  );

  return (
    <div
      className="min-h-screen pt-20 pb-20 px-4"
      style={{ background: "#101010" }}
    >
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Shield size={24} style={{ color: GOLD }} />
            <h1 className="text-3xl font-bold text-white">
              Panel de administración
            </h1>
            <button
              onClick={() => {
                setLoading(true);
                fetchPending();
              }}
              className="ml-4 px-3 py-1.5 rounded-lg text-sm font-semibold bg-gray-800 text-gray-200 hover:bg-gray-700 transition"
              disabled={loading}
              title="Refrescar"
              type="button"
            >
              {loading ? (
                "..."
              ) : (
                <RefreshCw size={18} className="inline mr-1" />
              )}
            </button>
          </div>
          <p className="text-gray-500 mb-8">
            {pendingTickets.length} boleto
            {pendingTickets.length !== 1 ? "s" : ""} pendiente
            {pendingTickets.length !== 1 ? "s" : ""} de validación
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-16">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-8 h-8 border-2 border-t-transparent rounded-full"
              style={{ borderColor: GOLD, borderTopColor: "transparent" }}
            />
          </div>
        ) : pendingTickets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <CheckCircle size={48} className="mx-auto mb-4 text-green-600" />
            <h2 className="text-xl font-bold text-white mb-2">Todo al día</h2>
            <p className="text-gray-500">
              No hay boletos pendientes de validación
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {grouped.map((group, i) => (
                <motion.div
                  key={group.reserved_by}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl border border-gray-800 overflow-hidden"
                  style={{ background: "#141414" }}
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold text-white">
                            {group.tickets
                              .map((t) => `#${t.ticket_number}`)
                              .join(", ")}
                          </span>
                          <span
                            className="text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={{
                              color: "#FF9800",
                              background: "#FF980015",
                            }}
                          >
                            Pendiente
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm">
                          {group.raffle?.name}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <User size={14} />
                          <span>
                            {group.profile?.full_name || "Sin nombre"}
                          </span>
                          <span className="text-gray-700">|</span>
                          <span>{group.profile?.email}</span>
                        </div>
                        {group.receipts && group.receipts.length > 0 && (
                          <div className="mt-3">
                            <p className="text-gray-500 text-xs mb-2 flex items-center gap-1">
                              <FileText size={12} /> Comprobante subido:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {Array.from(
                                new Map(
                                  group.receipts.map((r) => [r.file_url, r]),
                                ).values(),
                              ).map((receipt, ri) => (
                                <button
                                  key={ri}
                                  onClick={() =>
                                    setPreviewUrl(receipt.file_url)
                                  }
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                  style={{
                                    background: "#1a1a1a",
                                    color: GOLD,
                                    border: "1px solid #333",
                                  }}
                                >
                                  {receipt.file_type?.startsWith("image/") ? (
                                    <ImageIcon size={12} />
                                  ) : (
                                    <FileText size={12} />
                                  )}
                                  {receipt.file_name || "Ver comprobante"}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex sm:flex-col gap-2">
                        <button
                          onClick={() =>
                            handleAction(
                              group.tickets.map((t) => t.id),
                              "approve",
                            )
                          }
                          disabled={actionLoading === group.reserved_by}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 disabled:opacity-50"
                          style={{ background: "#2E7D32", color: "#fff" }}
                        >
                          <CheckCircle size={16} /> Aprobar todos
                        </button>
                        <button
                          onClick={() =>
                            handleAction(
                              group.tickets.map((t) => t.id),
                              "reject",
                            )
                          }
                          disabled={actionLoading === group.reserved_by}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 disabled:opacity-50 border border-red-800/50 text-red-400 hover:bg-red-900/20"
                        >
                          <XCircle size={16} /> Rechazar todos
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <CheckCircle size={22} className="text-green-500" />
            Boletos vendidos
          </h2>
          {soldLoading ? (
            <div className="text-gray-400 py-8">Cargando...</div>
          ) : (
            <>
              <div className="text-gray-400 mb-4">
                Total vendidos:{" "}
                <span className="font-bold text-green-400">
                  {soldTickets.length}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-gray-200 bg-[#181818] rounded-xl overflow-hidden">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left">Usuario</th>
                      <th className="px-4 py-2 text-left">Email</th>
                      <th className="px-4 py-2 text-center"># Boletos</th>
                      <th className="px-4 py-2 text-center">Números</th>
                      <th className="px-4 py-2 text-center">Última compra</th>
                    </tr>
                  </thead>
                  <tbody>
                    {soldGrouped.map((group, i) => (
                      <tr key={i} className="border-t border-gray-800">
                        <td className="px-4 py-2">
                          {group.profile?.full_name || "Sin nombre"}
                        </td>
                        <td className="px-4 py-2">{group.profile?.email}</td>
                        <td className="px-4 py-2 text-center">
                          {group.tickets.length}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {group.tickets
                            .map((t: SoldTicket) => `#${t.ticket_number}`)
                            .join(", ")}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {group.tickets
                            .map((t: SoldTicket) => t.purchased_at)
                            .sort()
                            .reverse()[0]
                            ?.replace("T", " ")
                            .slice(0, 16) || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {previewUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.9)" }}
            onClick={() => setPreviewUrl(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="max-w-3xl max-h-[80vh] overflow-auto rounded-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {previewUrl.endsWith(".pdf") ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-[80vh] rounded-xl"
                  title="Receipt"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Receipt"
                  className="max-w-full max-h-[80vh] rounded-xl"
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
