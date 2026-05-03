import { useEffect, useState } from "react";

function Countdown({ endTime }: { endTime: string }) {
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
        <div className="flex justify-center gap-4 text-2xl font-bold text-yellow-400 mb-4">
            <span>{timeLeft.days}d</span>
            <span>{timeLeft.hours}h</span>
            <span>{timeLeft.minutes}m</span>
            <span>{timeLeft.seconds}s</span>
        </div>
    );
}
