import { motion } from "framer-motion";
import { Play } from "lucide-react";

import { Rain } from "../components/Rain";
import { GlitchText } from "../components/GlitchText";

interface HomeProps {
    onStart: () => void;
}

function Home({ onStart }: HomeProps) {

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black text-white font-sans selection:bg-cyan-500/30 selection:text-cyan-100">

            {/* Background with lighter overlay */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 scale-105"
                style={{ backgroundImage: 'url("/bg.png")' }}
            >
                <div className="absolute inset-0 bg-black/30 backdrop-blur-[0px]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
            </div>

            {/* Rain Component */}
            <Rain />

            {/* Main Container */}
            <main className="relative z-10 flex flex-col items-center justify-center h-full px-4 w-full max-w-7xl mx-auto">

                {/* Logo Section */}
                <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="mb-16 relative"
                >
                    {/* Glowing background aura */}
                    <motion.div
                        className="absolute -inset-16 bg-cyan-500/25 blur-[150px] rounded-full pointer-events-none"
                        animate={{
                            opacity: [0.25, 0.4, 0.25],
                            scale: [1, 1.1, 1],
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.img
                        src="/logo.png"
                        alt="LEADERS"
                        className="w-full max-w-3xl object-contain"
                        animate={{
                            y: [0, -8, 0],
                            filter: [
                                "drop-shadow(0 0 20px rgba(0,255,255,0.3)) drop-shadow(0 0 40px rgba(0,255,255,0.15))",
                                "drop-shadow(0 0 35px rgba(0,255,255,0.5)) drop-shadow(0 0 60px rgba(0,255,255,0.25))",
                                "drop-shadow(0 0 20px rgba(0,255,255,0.3)) drop-shadow(0 0 40px rgba(0,255,255,0.15))"
                            ]
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                </motion.div>

                {/* CTA Button */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="relative"
                >
                    <button
                        onClick={onStart}
                        className="
              group relative overflow-hidden
              px-20 py-6
              bg-cyan-500/10 backdrop-blur-md
              border border-cyan-500/30
              text-cyan-50
              font-bold text-2xl tracking-[0.2em] uppercase
              transition-all duration-300
              hover:bg-cyan-500/20 hover:border-cyan-400 hover:shadow-[0_0_40px_rgba(34,211,238,0.4)]
              active:scale-95
              clip-path-button
            "
                        style={{ clipPath: 'polygon(15% 0, 100% 0, 100% 70%, 85% 100%, 0 100%, 0 30%)' }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                        <span className="flex items-center gap-3 drop-shadow-md">
                            <Play className="w-6 h-6 fill-current" />
                            Commencer
                        </span>

                        {/* Tech accents */}
                        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-400" />
                        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-400" />
                    </button>
                </motion.div>

                {/* Footer / Subtitle */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="mt-12 text-center"
                >
                    <GlitchText
                        text="PRÊT À DEVENIR LE PROCHAIN LEADER ?"
                        className="text-gray-400/80 text-base tracking-[0.3em] font-sans font-medium"
                    />
                </motion.div>

            </main>

            {/* Floating HUD Elements */}
            <div className="absolute top-8 left-8 text-cyan-500/30 font-mono text-xs tracking-widest pointer-events-none select-none">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-cyan-500/50 rounded-full animate-pulse" />
                    SYSTEM_ONLINE
                </div>
            </div>

            <div className="absolute bottom-8 right-8 text-cyan-500/30 font-mono text-xs tracking-widest pointer-events-none select-none">
                <div className="flex items-center gap-2">
                    V.1.0.4 [STABLE]
                    <div className="w-2 h-2 bg-cyan-500/50 rounded-full" />
                </div>
            </div>

            {/* Screen Effects */}
            <div className="absolute inset-0 pointer-events-none z-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
            <div className="absolute inset-0 pointer-events-none z-50 box-border border-[1px] border-cyan-500/10 rounded-lg m-4" />

        </div>
    );
}

export default Home;
