import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

interface GameNotificationProps {
    message: string | null;
    duration?: number; // 0 = infinite
    onClose: () => void;
}

export default function GameNotification({
    message,
    duration = 3000,
    onClose,
}: GameNotificationProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (message) {
            setVisible(true);
            if (duration > 0) {
                const timer = setTimeout(() => {
                    setVisible(false);
                    // Wait for animation to finish before clearing message
                    setTimeout(onClose, 300);
                }, duration);
                return () => clearTimeout(timer);
            }
        } else {
            setVisible(false);
        }
    }, [message, duration, onClose]);

    if (!message && !visible) return null;

    return (
        <div
            className={`
        fixed top-32 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none
        transition-all duration-300 ease-out
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}
`}
        >
            <div className="bg-slate-900/90 text-white px-8 py-4 rounded-xl border border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.3)] backdrop-blur-md flex items-center gap-4 min-w-[300px] justify-center relative overflow-hidden group">

                {/* Animated Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-cyan-500/10 opacity-50" />
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(6,182,212,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-shine" />

                {/* Icon & Text */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="bg-rose-500/20 p-2 rounded-full border border-rose-500/50 text-rose-400 animate-pulse">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs text-cyan-400 font-mono tracking-widest uppercase mb-1">Système</span>
                        <span className="font-bold text-lg text-white font-cyber tracking-wide shadow-black drop-shadow-md">
                            {message}
                        </span>
                    </div>
                </div>

                {/* Decorative Corners */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500" />
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-500" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500" />

            </div>
        </div>
    );
}
