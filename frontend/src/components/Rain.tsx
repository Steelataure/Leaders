import { useEffect, useState } from "react";

export const Rain = () => {
    const [drops, setDrops] = useState<{ id: number; left: number; delay: number; duration: number }[]>([]);

    useEffect(() => {
        // Generate static rain drops on mount to avoid hydration mismatch
        const dropCount = 100;
        const newDrops = Array.from({ length: dropCount }).map((_, i) => ({
            id: i,
            left: Math.random() * 100,
            delay: Math.random() * 2,
            duration: 0.5 + Math.random() * 0.5,
        }));
        setDrops(newDrops);
    }, []);

    return (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            <style>{`
                @keyframes rain {
                    0% { transform: translateY(-100vh); opacity: 0; }
                    10% { opacity: 0.4; }
                    90% { opacity: 0.4; }
                    100% { transform: translateY(100vh); opacity: 0; }
                }
            `}</style>
            {drops.map((drop) => (
                <div
                    key={drop.id}
                    className="absolute top-0 w-[1px] h-[30vh] bg-gradient-to-b from-transparent via-cyan-400/50 to-transparent"
                    style={{
                        left: `${drop.left}%`,
                        animation: `rain ${drop.duration}s linear infinite`,
                        animationDelay: `${drop.delay}s`,
                        opacity: 0.4,
                    }}
                />
            ))}
        </div>
    );
};
