import React from "react";

const WINNING_NUMBERS = [18, 58, 27];
//const VIDEO_URL = "https://youtu.be/oHXXqTH4-jc"; // O un enlace de YouTube
const WINNERS = [
    {
        number: 18,
        name: "Valeria García",
        prize: "Tequila Maestro Dobel Diamante 700 ml",
        image: "https://m.media-amazon.com/images/I/91SY-fD+yzL.jpg",
    },
    {
        number: 58,
        name: "María López",
        prize: "Tequila Don Julio 70",
        image:
            "https://www.donjulio.com/sites/g/files/seuoyk221/files/2021-03/DonJulio70.png", // ejemplo
    },
    {
        number: 27,
        name: "Carlos Ruiz",
        prize: "Ron Zacapa 23",
        image:
            "https://www.ronzacapa.com/sites/g/files/seuoyk221/files/2021-03/Zacapa23.png", // ejemplo
    },
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
                    {WINNERS.map((winner, idx) => {
                        const styles = [
                            {
                                bg: "bg-gradient-to-br from-yellow-400 to-yellow-600",
                                text: "text-black",
                                border: "border-4 border-yellow-300",
                                label: "1er lugar",
                                shadow: "shadow-yellow-400/60",
                                animate: "animate-bounce",
                            },
                            {
                                bg: "bg-gradient-to-br from-gray-300 to-gray-500",
                                text: "text-black",
                                border: "border-4 border-gray-300",
                                label: "2do lugar",
                                shadow: "shadow-gray-400/60",
                                animate: "animate-pulse",
                            },
                            {
                                bg: "bg-gradient-to-br from-yellow-900 to-yellow-700",
                                text: "text-white",
                                border: "border-4 border-yellow-800",
                                label: "3er lugar",
                                shadow: "shadow-yellow-900/60",
                                animate: "animate-pulse",
                            },
                        ][idx];

                        return (
                            <div
                                key={winner.number}
                                className={`flex flex-col items-center rounded-2xl p-6 ${styles.bg} ${styles.text} ${styles.border} ${styles.shadow} transition-transform hover:scale-105 ${styles.animate}`}
                                style={{ minWidth: 220, maxWidth: 260 }}
                            >
                                <span className="text-xs uppercase font-bold tracking-wider mb-2">
                                    {styles.label}
                                </span>
                                <span
                                    className={`${idx === 0 ? "text-5xl" : "text-3xl"} font-extrabold mb-2`}
                                >
                                    {winner.number}
                                </span>
                                <img
                                    src={winner.image}
                                    alt={winner.prize}
                                    className="w-24 h-24 object-contain rounded-xl mb-2 shadow-lg bg-white"
                                    style={{ border: "2px solid #fff" }}
                                />
                                <span className="text-lg font-bold mb-1">{winner.name}</span>
                                <span className="text-sm text-yellow-100 text-center">
                                    {winner.prize}
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
            </div>
        </div>
    );
}
