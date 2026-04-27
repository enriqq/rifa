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
                pass: process.env.MAIL_PASS
            }
        });

        try {
            await transporter.sendMail({
                from: '"RifandoAndo" <' + process.env.MAIL_USER + '>',
                to: process.env.ADMIN_EMAIL,
                subject: "¡Hay boletos pendientes de validar!",
                html: `<p>Hay <b>${pendientes}</b> boletos pendientes de validación.</p>`
            });
            return res.json({ success: true });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    // Caso 2: Correo personalizado (aprobado/rechazado)
    const { to, subject, html } = req.body;
    if (!to || !subject || !html) {
        return res.status(400).json({ error: "Faltan campos para correo personalizado" });
    }

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS
        }
    });

    try {
        await transporter.sendMail({
            from: '"RifandoAndo" <' + process.env.MAIL_USER + '>',
            to,
            subject,
            html
        });
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}