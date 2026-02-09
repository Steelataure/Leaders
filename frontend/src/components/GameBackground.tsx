import { useEffect, useState } from "react";

export default function GameBackground() {
    const [particles, setParticles] = useState<{ id: number; left: number; top: number; size: number; duration: number; delay: number; opacity: number }[]>([]);

    useEffect(() => {
        // Générer des particules statiques pour éviter des calculs JS constants
        const newParticles = Array.from({ length: 50 }).map((_, i) => ({
            id: i,
            left: Math.random() * 100,
            top: Math.random() * 100,
            size: Math.random() * 4 + 2, // 2-6px pour être bien visible
            duration: Math.random() * 20 + 10,
            delay: Math.random() * -20,
            opacity: Math.random() * 0.6 + 0.3, // 0.3 à 0.9 opacité
        }));
        setParticles(newParticles);
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Fond sombre profond */}
            <div className="absolute inset-0 bg-[#020617] z-0"></div>

            {/* Nébuleuses / Lueurs d'ambiance */}
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-purple-900/30 rounded-full blur-[120px] animate-pulse-slow z-0"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-cyan-900/30 rounded-full blur-[120px] animate-pulse-slow delay-1000 z-0"></div>
            <div className="absolute top-[40%] left-[40%] w-[40%] h-[40%] bg-slate-800/20 rounded-full blur-[100px] animate-pulse-slow delay-2000 z-0"></div>

            {/* Grille Cyberpunk plus visible */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_90%)] z-0"></div>

            {/* Particules flottantes (Poussière d'étoiles) */}
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="absolute rounded-full bg-white z-0"
                    style={{
                        left: `${p.left}%`,
                        top: `${p.top}%`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        animation: `float ${p.duration}s infinite linear`,
                        animationDelay: `${p.delay}s`,
                        opacity: p.opacity,
                        boxShadow: `0 0 ${p.size * 2}px rgba(255, 255, 255, ${p.opacity})`
                    }}
                />
            ))}

            {/* Vignette pour focus central */}
            <div className="absolute inset-0 bg-[radial-gradient(transparent_0%,#020617_90%)] z-0"></div>
        </div>
    );
}
