// /api/notify-admin.js
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { pendientes } = req.body;

  // Usa variables de entorno para seguridad
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER, // tu correo
      pass: process.env.MAIL_PASS  // tu app password
    }
  });

  try {
    await transporter.sendMail({
      from: '"RifandoAndo" <' + process.env.MAIL_USER + '>',
      to: process.env.ADMIN_EMAIL, // tu correo de admin
      subject: "¡Hay boletos pendientes de validar!",
      html: `<p>Hay <b>${pendientes}</b> boletos pendientes de validación.</p>`
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}