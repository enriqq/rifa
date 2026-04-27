import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import Swal from "sweetalert2";
import { GOLD } from "../lib/constants";

export default function ReservationBanner() {
  const { user } = useAuth();
  const [hasReservation, setHasReservation] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    (async () => {
      const { data } = await supabase
        .from("tickets")
        .select("id")
        .eq("reserved_by", user.id)
        .eq("status", "reserved")
        .limit(1);
      if (isMounted) {
        setHasReservation(!!data && data.length > 0);
        setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [user, location.pathname]);

  // No mostrar en checkout ni si no hay reserva ni si está cargando
  if (loading || !hasReservation || location.pathname === "/checkout")
    return null;

  const handleCancel = async () => {
    const result = await Swal.fire({
      title: "¿Cancelar reserva?",
      text: "¿Seguro que deseas cancelar tu reserva? Los boletos volverán a estar disponibles.",
      icon: "warning",
      background: "#181818",
      color: "#fff",
      iconColor: "#FFC107",
      showCancelButton: true,
      confirmButtonColor: "#d32f2f",
      cancelButtonColor: "#FFC107",
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "No",
      reverseButtons: true,
      customClass: {
        popup: "rounded-2xl",
        title: "font-bold",
        confirmButton: "font-semibold",
        cancelButton: "font-semibold",
      },
    });
    if (!result.isConfirmed) return;
    await supabase
      .from("tickets")
      .update({
        status: "available",
        reserved_by: null,
        reserved_at: null,
        reservation_expires_at: null,
      })
      .eq("reserved_by", user.id)
      .eq("status", "reserved");
    setHasReservation(false);
    Swal.fire({
      title: "Reserva cancelada",
      icon: "success",
      background: "#181818",
      color: "#fff",
      confirmButtonColor: "#FFC107",
      customClass: {
        popup: "rounded-2xl",
        title: "font-bold",
        confirmButton: "font-semibold",
      },
    });
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div
        className="flex items-center gap-4 px-6 py-3 rounded-xl shadow-lg"
        style={{ background: "#222", border: `1.5px solid ${GOLD}` }}
      >
        <span className="text-white font-semibold">
          Tienes boletos reservados sin completar.
        </span>
        <button
          onClick={() => navigate("/checkout")}
          className="px-4 py-2 rounded-lg font-semibold text-sm"
          style={{ background: GOLD, color: "#101010" }}
        >
          Completar reserva
        </button>
        <button
          onClick={handleCancel}
          className="px-4 py-2 rounded-lg font-semibold text-sm border border-red-500 text-red-400 bg-transparent"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
