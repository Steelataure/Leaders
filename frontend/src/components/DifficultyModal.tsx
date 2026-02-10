import { motion, AnimatePresence } from "framer-motion";
import { Brain, Zap } from "lucide-react";

interface DifficultyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (difficulty: "EASY" | "HARD") => void;
}

export function DifficultyModal({ isOpen, onClose, onSelect }: DifficultyModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-slate-900 border border-cyan-500/30 p-8 rounded-xl w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] relative"
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-slate-500 hover:text-white"
                    >
                        ✕
                    </button>

                    <h2 className="font-orbitron text-2xl md:text-3xl font-bold text-white mb-2 uppercase tracking-wider text-center">
                        Niveau de l'IA
                    </h2>
                    <p className="text-center text-slate-400 font-rajdhani mb-8">
                        Choisissez la difficulté de votre adversaire
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* EASY MODE */}
                        <button
                            onClick={() => onSelect("EASY")}
                            className="group relative flex flex-col items-center gap-4 p-6 rounded-lg border border-slate-700 hover:border-emerald-500 bg-slate-800/50 hover:bg-emerald-900/20 transition-all duration-300"
                        >
                            <div className="w-16 h-16 rounded-full bg-slate-700/50 group-hover:bg-emerald-500/20 flex items-center justify-center transition-colors">
                                <Brain className="w-8 h-8 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                            </div>
                            <div className="text-center">
                                <div className="font-orbitron font-bold text-xl text-slate-300 group-hover:text-emerald-400">
                                    STANDARD
                                </div>
                                <div className="text-xs text-slate-500 font-rajdhani mt-1 uppercase tracking-wide">
                                    Pour débutants
                                </div>
                            </div>
                        </button>

                        {/* HARD MODE */}
                        <button
                            onClick={() => onSelect("HARD")}
                            className="group relative flex flex-col items-center gap-4 p-6 rounded-lg border border-slate-700 hover:border-red-500 bg-slate-800/50 hover:bg-red-900/20 transition-all duration-300"
                        >
                            <div className="w-16 h-16 rounded-full bg-slate-700/50 group-hover:bg-red-500/20 flex items-center justify-center transition-colors">
                                <Zap className="w-8 h-8 text-slate-400 group-hover:text-red-400 transition-colors" />
                            </div>
                            <div className="text-center">
                                <div className="font-orbitron font-bold text-xl text-slate-300 group-hover:text-red-400">
                                    EXTRÊME
                                </div>
                                <div className="text-xs text-slate-500 font-rajdhani mt-1 uppercase tracking-wide">
                                    IA Stratégique
                                </div>
                            </div>

                            <div className="absolute top-3 right-3">
                                <span className="flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                            </div>
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
