// /api/notify-admin.js
import nodemailer from "nodemailer";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    // Caso 1: Notificación de pendientes
    if ("pendientes" in req.body) {
        const { pendientes } = req.body;
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        });

        try {
            await transporter.sendMail({
                from: '"RifandoAndo" <' + process.env.MAIL_USER + ">",
                to: process.env.ADMIN_EMAIL,
                subject: "🔔 Boletos pendientes de validar",
                html: `
        <div style="background:#181818;padding:32px 24px;border-radius:12px;font-family:sans-serif;max-width:480px;margin:auto;">
        <h2 style="color:#FFC107;margin-bottom:16px;">¡Tienes boletos pendientes de validación!</h2>
        <p style="color:#fff;font-size:16px;margin-bottom:24px;">
            Hay <b style="color:#FFC107;font-size:20px;">${pendientes}</b> boleto${pendientes > 1 ? "s" : ""} pendiente${pendientes > 1 ? "s" : ""} de validación en la plataforma.
        </p>
        <a href="https://rifa-zeta-opal.vercel.app/admin-portal" 
            style="display:inline-block;padding:12px 28px;background:#FFC107;color:#181818;font-weight:bold;border-radius:8px;text-decoration:none;font-size:16px;">
            Ir al panel de administración
        </a>
        <p style="color:#888;font-size:12px;margin-top:32px;">
            Este es un aviso automático de RifandoAndo.
        </p>
        </div>
    `,
            });
            return res.json({ success: true });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    // Caso 2: Correo personalizado (aprobado/rechazado)
    const { to, subject, html } = req.body;
    if (!to || !subject || !html) {
        return res
            .status(400)
            .json({ error: "Faltan campos para correo personalizado" });
    }

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
        },
    });

    try {
        await transporter.sendMail({
            from: '"RifandoAndo" <' + process.env.MAIL_USER + ">",
            to,
            subject,
            html,
        });
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

const handleMercadoPago = async () => {
    // Llama a tu endpoint que crea la preference
    const res = await fetch('/api/mercadopago', {
        method: 'POST',
        body: JSON.stringify({
            amount: totalAmount,
            description: `Boletos #${ticketNumbers} para ${raffleName}`,
            userId: user.id,
            // ...otros datos necesarios
        }),
        headers: { 'Content-Type': 'application/json' }
    });
    const { init_point } = await res.json();
    window.location.href = init_point; // Redirige al checkout de Mercado Pago
};
