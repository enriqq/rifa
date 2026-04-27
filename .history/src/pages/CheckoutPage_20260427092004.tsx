import Swal from "sweetalert2";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Upload,
  MessageCircle,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import ReservationTimer from "../components/ReservationTimer";
import { BANK_DETAILS, WHATSAPP_NUMBER, GOLD } from "../lib/constants";
import { playSuccess } from "../lib/audio";

interface ReservedTicket {
  id: string;
  ticket_number: number;
  reservation_expires_at: string;
  raffle_id: string;
  raffles: { name: string; ticket_price: number };
}

export default function CheckoutPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [reservedTickets, setReservedTickets] = useState<ReservedTicket[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [whatsappSent, setWhatsappSent] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchReserved = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("tickets")
      .select(
        "id, ticket_number, reservation_expires_at, raffle_id, raffles(name, ticket_price)",
      )
      .eq("reserved_by", user.id)
      .eq("status", "reserved");
    if (data) setReservedTickets(data as unknown as ReservedTicket[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchReserved();
  }, [fetchReserved]);

  const earliestExpiry =
    reservedTickets.length > 0
      ? reservedTickets.reduce(
          (min, t) =>
            t.reservation_expires_at < min ? t.reservation_expires_at : min,
          reservedTickets[0].reservation_expires_at,
        )
      : null;

  const ticketPrice = reservedTickets[0]?.raffles?.ticket_price || 0;
  const totalAmount = reservedTickets.length * ticketPrice;
  const ticketNumbers = reservedTickets.map((t) => t.ticket_number).join(", ");
  const raffleName = reservedTickets[0]?.raffles?.name || "Sorteo Premium";

  const handleFileSelect = (file: File) => {
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (!validTypes.includes(file.type)) {
      setError("Formato invalido. Usa JPG, PNG, WebP o PDF.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("El archivo no puede superar 10MB.");
      return;
    }
    setError("");
    setReceiptFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setReceiptPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleUpload = async () => {
    if (!receiptFile || !user || reservedTickets.length === 0) return;
    setUploading(true);
    setError("");
    try {
      const fileExt = receiptFile.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(filePath, receiptFile);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from("receipts")
        .getPublicUrl(filePath);
      for (const ticket of reservedTickets) {
        await supabase.from("receipts").insert({
          ticket_id: ticket.id,
          user_id: user.id,
          file_url: urlData.publicUrl,
          file_name: receiptFile.name,
          file_type: receiptFile.type,
        });
      }
      const ticketIds = reservedTickets.map((t) => t.id);
      await supabase
        .from("tickets")
        .update({ status: "pending" })
        .in("id", ticketIds);
      playSuccess();
      setSuccess(true);
    } catch (err) {
      setError(
        "Error al subir comprobante. Intenta de nuevo." +
          (err as Error).message,
      );
    } finally {
      setUploading(false);
    }
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      `¡Hola! Mi nombre es ${profile?.full_name || user?.email}. Reservé los boletos #${ticketNumbers} para "${raffleName}". Adjunto mi comprobante de pago.`,
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
    setWhatsappSent(true);
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
    navigate("/");
  }, [user, navigate]);

  const handleCancelReservation = async () => {
    if (!user || reservedTickets.length === 0) return;
    const result = await Swal.fire({
      title: "¿Cancelar reserva?",
      text: "¿Seguro que deseas cancelar tu reserva? Los boletos volverán a estar disponibles.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "No",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    try {
      const ticketIds = reservedTickets.map((t) => t.id);
      await supabase
        .from("tickets")
        .update({
          status: "available",
          reserved_by: null,
          reserved_at: null,
          reservation_expires_at: null,
        })
        .in("id", ticketIds);
      navigate("/");
    } catch (err) {
      setError("No se pudo cancelar la reserva. Intenta de nuevo.");
    }
  };

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

  if (reservedTickets.length === 0 && !success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "#101010" }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <AlertCircle size={48} className="mx-auto mb-4 text-gray-600" />
          <h2 className="text-xl font-bold text-white mb-2">
            No tienes boletos reservados
          </h2>
          <p className="text-gray-500 mb-6">
            Selecciona boletos desde la página principal
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 rounded-xl font-semibold text-sm"
            style={{ background: GOLD, color: "#101010" }}
          >
            Volver al inicio
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pt-16 pb-20 px-4"
      style={{ background: "#101010" }}
    >
      <ReservationTimer expiresAt={earliestExpiry} onExpired={handleExpired} />
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-white mb-2">Resumen</h1>
          <p className="text-gray-500 mb-8">
            Completa tu pago para confirmar tus boletos
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-gray-800 p-8 text-center"
              style={{ background: "#141414" }}
            >
              <CheckCircle
                size={64}
                className="mx-auto mb-4"
                style={{ color: "#2E7D32" }}
              />
              <h2 className="text-2xl font-bold text-white mb-2">
                Comprobante enviado
              </h2>
              <p className="text-gray-400 mb-6">
                Tu comprobante está siendo validado. Recibirás la confirmación
                pronto.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="px-6 py-3 rounded-xl font-semibold text-sm"
                  style={{ background: GOLD, color: "#101010" }}
                >
                  Ver mis boletos
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="px-6 py-3 rounded-xl font-semibold text-sm border border-gray-700 text-gray-300"
                >
                  Volver al inicio
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="checkout"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div
                className="rounded-2xl border border-gray-800 p-6"
                style={{ background: "#141414" }}
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock size={18} style={{ color: GOLD }} /> Boletos reservados
                </h3>
                <div className="space-y-2">
                  {reservedTickets.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{ background: "#1a1a1a" }}
                    >
                      <span className="text-white font-semibold">
                        #{t.ticket_number}
                      </span>
                      <span className="font-semibold" style={{ color: GOLD }}>
                        ${ticketPrice.toLocaleString()} MXN
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between">
                  <span className="text-white font-bold">Total</span>
                  <span className="font-bold text-lg" style={{ color: GOLD }}>
                    ${totalAmount.toLocaleString()} MXN
                  </span>
                </div>
              </div>

              <div
                className="rounded-2xl border border-gray-800 p-6"
                style={{ background: "#141414" }}
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <CreditCard size={18} style={{ color: GOLD }} /> Datos
                  bancarios
                </h3>
                <div
                  className="space-y-3 p-4 rounded-xl"
                  style={{ background: "#1a1a1a" }}
                >
                  {([
                    ["Banco", BANK_DETAILS.bank],
                    ["Cuenta", BANK_DETAILS.accountNumber],
                    ["Titular", BANK_DETAILS.holderName],
                    ["Dimo®", BANK_DETAILS.dimo],
                    ["Email", BANK_DETAILS.email],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-gray-500 text-sm">{label}</span>
                      <span className="text-white text-sm font-medium">
                        {value}
                      </span>
                    </div>
                  )))
                }
                <p className="text-gray-500 text-xs mt-3">
                  Transfiere o deposita el monto exacto y sube tu comprobante a
                  continuación.
                </p>
              </div>

              <div
                className="rounded-2xl border border-gray-800 p-6"
                style={{ background: "#141414" }}
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Upload size={18} style={{ color: GOLD }} /> Subir comprobante
                </h3>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${dragOver ? "border-yellow-500 bg-yellow-500/5" : "border-gray-700 hover:border-gray-600"}`}
                  onClick={() => document.getElementById("file-input")?.click()}
                >
                  <input
                    id="file-input"
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                  />
                  {receiptFile ? (
                    <div className="space-y-3">
                      {receiptPreview ? (
                        <img
                          src={receiptPreview}
                          alt="Preview"
                          className="max-h-40 mx-auto rounded-lg"
                        />
                      ) : (
                        <FileText size={40} className="mx-auto text-gray-500" />
                      )}
                      <p className="text-white text-sm font-medium">
                        {receiptFile.name}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setReceiptFile(null);
                          setReceiptPreview(null);
                        }}
                        className="text-red-400 text-xs hover:underline"
                      >
                        <X size={14} className="inline mr-1" />
                        Eliminar
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <ImageIcon size={40} className="mx-auto text-gray-600" />
                      <p className="text-gray-400 text-sm">
                        Arrastra tu comprobante aqui o haz clic para seleccionar
                      </p>
                      <p className="text-gray-600 text-xs">
                        JPG, PNG, WebP o PDF (max 10MB)
                      </p>
                    </div>
                  )}
                </div>
                {error && (
                  <div className="flex items-center gap-2 mt-3 text-red-400 text-sm">
                    <AlertCircle size={14} />
                    {error}
                  </div>
                )}
                <button
                  onClick={handleUpload}
                  disabled={!receiptFile || uploading}
                  className="w-full mt-4 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                  style={{ background: "#2E7D32", color: "#fff" }}
                >
                  {uploading ? "Subiendo..." : "Subir comprobante"}
                </button>
                <button
                  onClick={handleCancelReservation}
                  className="w-full mt-4 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] border border-red-500 text-red-400 bg-transparent"
                >
                  Cancelar reserva
                </button>
              </div>

              <div
                className="rounded-2xl border border-gray-800 p-6"
                style={{ background: "#141414" }}
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <MessageCircle size={18} className="text-green-500" />{" "}
                  Confirmar por WhatsApp
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  También puedes enviar tu comprobante por WhatsApp para
                  validación más rápida.
                </p>
                <button
                  onClick={handleWhatsApp}
                  className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                  style={{ background: "#25D366", color: "#fff" }}
                >
                  <MessageCircle size={18} />
                  {whatsappSent
                    ? "Abrir WhatsApp de nuevo"
                    : "Enviar por WhatsApp"}
                </button>
                {whatsappSent && (
                  <p className="text-green-400 text-xs mt-2 text-center">
                    Mensaje preparado. No olvides adjuntar tu comprobante.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
