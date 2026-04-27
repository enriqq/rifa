// /api/notify-admin.js
import nodemailer from "nodemailer";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { to, subject, html } = req.body;

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
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}