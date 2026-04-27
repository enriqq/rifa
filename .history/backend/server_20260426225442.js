// server.js
import express from "express";
import nodemailer from "nodemailer";

const app = express();
app.use(express.json());

const transporter = nodemailer.createTransport({
    service: "gmail", // o el servicio que uses
    auth: {
        user: "tu-correo@gmail.com",
        pass: "tu-contraseña-o-app-password"
    }
});

app.post("/notify-admin", async (req, res) => {
    const { pendientes } = req.body; // número de tickets pendientes o info relevante

    try {
        await transporter.sendMail({
            from: '"RifandoAndo" <tu-correo@gmail.com>',
            to: "admin@tucorreo.com",
            subject: "¡Hay boletos pendientes de validar!",
            html: `<p>Hay <b>${pendientes}</b> boletos pendientes de validación.</p>`
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(3001, () => console.log("Servidor escuchando en puerto 3001"));