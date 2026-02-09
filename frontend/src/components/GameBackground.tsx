import { useEffect, useState, useCallback } from "react";

export default function GameBackground() {
    const [particles, setParticles] = useState<{ id: number; left: number; top: number; size: number; duration: number; delay: number; opacity: number; layer: 1 | 2 }[]>([]);
    const [shootingStar, setShootingStar] = useState<{ id: number; left: number; top: number } | null>(null);

    useEffect(() => {
        // Générer des particules statiques pour éviter des calculs JS constants, avec 2 calques (parallax)
        const newParticles = Array.from({ length: 80 }).map((_, i) => {
            const isLayer1 = Math.random() > 0.6; // 40% foreground (layer 1), 60% background (layer 2)
            return {
                id: i,
                left: Math.random() * 100,
                top: Math.random() * 100,
                size: isLayer1 ? Math.random() * 3 + 2 : Math.random() * 2 + 0.5, // Layer 1 plus gros
                duration: isLayer1 ? Math.random() * 20 + 15 : Math.random() * 40 + 30, // Layer 2 plus lent
                delay: Math.random() * -40,
                opacity: isLayer1 ? Math.random() * 0.5 + 0.3 : Math.random() * 0.3 + 0.1, // Layer 1 plus brillant
                layer: (isLayer1 ? 1 : 2) as 1 | 2,
            };
        });
        setParticles(newParticles);
    }, []);

    // Logique étoile filante
    const triggerShootingStar = useCallback(() => {
        const startLeft = Math.random() * 80 + 20; // Commence plutôt à droite
        const startTop = Math.random() * 40;       // Commence plutôt en haut
        setShootingStar({ id: Date.now(), left: startLeft, top: startTop });

        // Nettoyage après l'animation (2s)
        setTimeout(() => {
            setShootingStar(null);
        }, 2000);
    }, []);

    useEffect(() => {
        // Intervalle aléatoire pour les étoiles filantes
        const timeoutFn = () => {
            triggerShootingStar();
            const nextDelay = Math.random() * 5000 + 3000; // Entre 3 et 8 secondes
            timeoutId = window.setTimeout(timeoutFn, nextDelay);
        };

        let timeoutId = window.setTimeout(timeoutFn, 2000);

        return () => window.clearTimeout(timeoutId);
    }, [triggerShootingStar]);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {/* Fond sombre profond */}
            <div className="absolute inset-0 bg-[#020617]"></div>

            {/* Background Gradients (Intensified) */}
            <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-purple-900/40 rounded-full blur-[120px] animate-pulse-slow"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-blue-900/40 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>
            <div className="absolute top-[30%] left-[60%] w-[40%] h-[40%] bg-cyan-900/30 rounded-full blur-[100px] animate-pulse-slow delay-2000"></div>

            {/* Cyber Grid (Scanner effect base) */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,245,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(0,245,255,0.07)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_90%)]"></div>

            {/* Scanner Beam */}
            <div className="absolute left-0 right-0 h-[2px] bg-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.6)] animate-[scan_8s_ease-in-out_infinite]"></div>

            {/* Stars Parallax */}
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="absolute rounded-full bg-white"
                    style={{
                        left: `${p.left}%`,
                        top: `${p.top}%`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        animation: `float ${p.duration}s infinite linear`,
                        animationDelay: `${p.delay}s`,
                        opacity: p.opacity,
                        boxShadow: p.layer === 1 ? `0 0 ${p.size * 2}px rgba(255, 255, 255, ${p.opacity})` : 'none',
                    }}
                />
            ))}

            {/* Shooting Star */}
            {shootingStar && (
                <div
                    key={shootingStar.id}
                    className="absolute w-[200px] h-[2px] bg-gradient-to-r from-transparent via-cyan-100 to-transparent"
                    style={{
                        left: `${shootingStar.left}%`,
                        top: `${shootingStar.top}%`,
                        animation: 'shooting-star 1.5s linear forwards',
                        transformOrigin: 'left center',
                    }}
                />
            )}

            {/* Vignette / Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(transparent_30%,#020617_100%)]"></div>
        </div>
    );
}
