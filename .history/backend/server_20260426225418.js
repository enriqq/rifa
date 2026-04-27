// server.js
import express from "express";
import nodemailer from "nodemailer";

const app = express();
app.use(express.json());

const transporter = nodemailer.createTransport({
  service: "gmail", // o el servicio SMTP que uses
  auth: {
    user: "tu-correo@gmail.com",
    pass: "tu-app-password"
  }
});

app.post("/enviar-correo", async (req, res) => {
  const { to, subject, html } = req.body;
  try {
    await transporter.sendMail({
      from: '"RifandoAndo" <tu-correo@gmail.com>',
      to,
      subject,
      html
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => console.log("Servidor escuchando en puerto 3001"));