import React from "react";

const WINNING_NUMBERS = [18, 58, 27];
const VIDEO_URL = "https://youtu.be/oHXXqTH4-jc"; // O un enlace de YouTube
const WINNERS = [
  { number: 18, name: "Juan Pérez", prize: "Whisky Johnnie Walker Black Label" },
  { number: 58, name: "María López", prize: "Tequila Don Julio 70" },
  { number: 27, name: "Carlos Ruiz", prize: "Ron Zacapa 23" },
];

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
                <div className="flex flex-col sm:flex-row justify-center gap-8 mb-8">
                    {WINNING_NUMBERS.map((num, idx) => {
                        // Colores y textos para cada lugar
                        const styles = [
                            {
                                bg: "bg-gradient-to-br from-yellow-400 to-yellow-600",
                                text: "text-black",
                                border: "border-4 border-yellow-300",
                                label: "1er lugar",
                            },
                            {
                                bg: "bg-gradient-to-br from-gray-300 to-gray-500",
                                text: "text-black",
                                border: "border-4 border-gray-300",
                                label: "2do lugar",
                            },
                            {
                                bg: "bg-gradient-to-br from-yellow-900 to-yellow-700",
                                text: "text-white",
                                border: "border-4 border-yellow-800",
                                label: "3er lugar",
                            },
                        ][idx] || {
                            bg: "bg-yellow-400",
                            text: "text-black",
                            border: "border-2 border-yellow-400",
                            label: "",
                        };

                        return (
                            <div key={num} className="flex flex-col items-center">
                                <span
                                    className={`${
                                        idx === 0 ? "text-5xl" : "text-3xl"
                                    } font-extrabold rounded-full px-8 py-6 shadow-xl mb-2 ${styles.bg} ${styles.text} ${styles.border}`}
                                    style={idx === 0 ? { minWidth: 120 } : { minWidth: 90 }}
                                >
                                    {num}
                                </span>
                                <span
                                    className={`uppercase text-xs font-bold tracking-wider ${
                                        idx === 0
                                            ? "text-yellow-300"
                                            : idx === 1
                                            ? "text-gray-400"
                                            : "text-yellow-800"
                                    }`}
                                >
                                    {styles.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
                <h2 className="text-2xl text-white font-semibold mb-4">
                    Video de la rifa en vivo
                </h2>
                <div className="mb-8">
                    {/*
                    <video
                        src={VIDEO_URL}
                        controls
                        className="w-full max-w-xl mx-auto rounded-xl shadow-lg"
                    >
                        Tu navegador no soporta la reproducción de video.
                    </video>
                    */}
                    <iframe
                        width="100%"
                        height="360"
                        src="https://www.youtube.com/embed/oHXXqTH4-jc"
                        title="Video de la rifa"
                        frameBorder="0"
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                        className="rounded-xl shadow-lg"
                    ></iframe>
                </div>
                <p className="text-gray-400">
                    Si eres uno de los ganadores, revisa tu correo para reclamar tu
                    premio.
                </p>
                <h3 className="text-2xl text-white font-semibold mb-4">
                    Ganadores de la rifa:
                </h3>
                <div className="flex flex-col sm:flex-row gap-8 mb-8">
                    {WINNERS.map((winner, idx) => (
                        <div key={winner.number} className="flex flex-col items-center">
                            <span className="text-3xl font-bold text-white">
                                {winner.number}
                            </span>
                            <span className="text-lg text-white">
                                {winner.name}
                            </span>
                            <span className="text-lg text-white">
                                {winner.prize}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
