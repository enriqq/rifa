import { useEffect, useState } from "react";

export default function Countdown({ endTime }: { endTime: string }) {
    const [timeLeft, setTimeLeft] = useState(getTimeLeft());

    function getTimeLeft() {
        const diff = new Date(endTime).getTime() - Date.now();
        if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        return { days, hours, minutes, seconds };
    }

    useEffect(() => {
        const timer = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
        return () => clearInterval(timer);
    }, [endTime]);

    return (
        <div className="flex justify-center gap-3 mb-6">
            adssd
            {[
                { label: "Días", value: timeLeft.days },
                { label: "Horas", value: timeLeft.hours },
                { label: "Min", value: timeLeft.minutes },
                { label: "Seg", value: timeLeft.seconds },
            ].map((item, i) => (
                <div
                    key={item.label}
                    className="flex flex-col items-center bg-yellow-500/10 border border-yellow-400/40 rounded-xl px-4 py-2 shadow-lg"
                    style={{
                        minWidth: 64,
                        animation: i === 3 ? "pulse 1s infinite" : undefined,
                    }}
                >
                    <span className="text-3xl font-extrabold text-yellow-400 drop-shadow">
                        {String(item.value).padStart(2, "0")}
                    </span>
                    <span className="text-xs font-semibold text-yellow-300 tracking-widest uppercase">
                        {item.label}
                    </span>
                </div>
            ))}
            <style>{`
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 #ffe08288; }
                    70% { box-shadow: 0 0 0 10px #ffe08200; }
                    100% { box-shadow: 0 0 0 0 #ffe08200; }
                }
            `}</style>
        </div>
    );
}
