import Swal from "sweetalert2";
import { supabase } from "../lib/supabase";
import { GOLD } from "../lib/constants";

export function useCancelReservation(
    user: { id: string } | null,
    onAfterCancel?: () => void,
) {
    const handleCancelReservation = async () => {
        if (!user) return;
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
        if (onAfterCancel) onAfterCancel();
        await Swal.fire({
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
    return handleCancelReservation;
}
