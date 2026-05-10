import React from "react";

const WINNING_NUMBERS = [
    18, 58, 27
];
const VIDEO_URL = "https://www.tu-servidor.com/video-rifa.mp4"; // O un enlace de YouTube

export default function WinnersPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black px-4 py-12">
            <div className="max-w-2xl w-full text-center">
                <h1 className="text-4xl font-bold text-yellow-400 mb-6">
                    ¡Ganadores de la Rifa!
                </h1>
                <p className="text-lg text-white mb-8">
                    Gracias a todos por participar. Aquí están los números ganadores:
                </p>
                <div className="flex justify-center gap-4 mb-8">
                    {WINNING_NUMBERS.map((num) => (
                        <span
                            key={num}
                            className="text-3xl font-bold bg-yellow-400 text-black rounded-full px-6 py-3 shadow-lg"
                        >
                            {num}
                        </span>
                    ))}
                </div>
                <h2 className="text-2xl text-white font-semibold mb-4">
                    Video de la rifa en vivo
                </h2>
                <div className="mb-8">
                    <video
                        src={VIDEO_URL}
                        controls
                        className="w-full max-w-xl mx-auto rounded-xl shadow-lg"
                    >
                        Tu navegador no soporta la reproducción de video.
                    </video>
                    {/* Si es un video de YouTube, usa un iframe:
          <iframe
            width="100%"
            height="360"
            src="https://www.youtube.com/embed/ID_DEL_VIDEO"
            title="Video de la rifa"
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen
            className="rounded-xl shadow-lg"
          ></iframe>
          */}
                </div>
                <p className="text-gray-400">
                    Si eres uno de los ganadores, revisa tu correo para reclamar tu
                    premio.
                </p>
            </div>
        </div>
    );
}
