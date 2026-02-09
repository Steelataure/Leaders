import { ArrowLeft } from "lucide-react";
import RankBadge from "../components/RankBadge";
import { Rain } from "../components/Rain";

const RANKS = [
    { min: 0, max: 1099, label: "BRONZE", color: "text-orange-400", desc: "Le début de votre ascension." },
    { min: 1100, max: 1299, label: "ARGENT", color: "text-slate-300", desc: "Vous commencez à maîtriser les bases." },
    { min: 1300, max: 1499, label: "OR", color: "text-amber-400", desc: "Un commandant respecté sur le terrain." },
    { min: 1500, max: 1699, label: "PLATINE", color: "text-cyan-400", desc: "L'élite tactique, craint par ses ennemis." },
    { min: 1700, max: 1899, label: "DIAMANT", color: "text-purple-400", desc: "Une légende vivante de la stratégie." },
    { min: 1900, max: 9999, label: "MASTER", color: "text-red-500", desc: "Le sommet absolu. Seuls les dieux siègent ici." },
];

export default function RankInfo({ onBack }: { onBack: () => void }) {
    return (
        <div className="min-h-screen w-full bg-slate-950 text-slate-200 font-sans relative overflow-hidden flex flex-col items-center justify-center p-6 bg-cover bg-center" style={{ backgroundImage: 'url("/bg.png")' }}>
            <div className="fixed inset-0 z-0 bg-gradient-to-t from-black via-slate-950/90 to-slate-900/80" />
            <Rain />

            <div className="relative z-10 w-full max-w-5xl animate-in fade-in slide-in-from-bottom-8 duration-700 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl">

                <div className="flex items-center gap-6 mb-8 border-b border-white/10 pb-6">
                    <button
                        onClick={onBack}
                        className="p-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 hover:border-cyan-500/50 transition-all group shadow-lg"
                    >
                        <ArrowLeft className="w-6 h-6 text-slate-400 group-hover:text-cyan-400" />
                    </button>
                    <div>
                        <h1 className="font-orbitron font-black text-4xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-white drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                            SYSTÈME DE CLASSEMENT
                        </h1>
                        <p className="font-rajdhani text-slate-400 text-lg">Échelle de progression des officiers</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {RANKS.map((rank) => (
                        <div
                            key={rank.label}
                            className="bg-slate-900/40 border border-white/5 rounded-xl p-5 flex flex-col items-center gap-4 hover:border-cyan-500/30 transition-all hover:bg-slate-800/40 hover:scale-[1.02] group relative overflow-hidden shadow-lg"
                        >
                            {/* Top decorative bar */}
                            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent`} />

                            <div className="scale-125 my-2 drop-shadow-2xl">
                                <RankBadge elo={rank.min} size="lg" showElo={false} />
                            </div>

                            <div className="text-center w-full">
                                <h3 className={`font-orbitron font-bold text-2xl tracking-widest ${rank.color} drop-shadow-[0_0_10px_rgba(0,0,0,0.5)] mb-2`}>
                                    {rank.label}
                                </h3>

                                <div className="font-mono text-white/90 font-bold text-sm bg-black/60 px-4 py-1.5 rounded-full inline-block border border-white/10 shadow-inner mb-3">
                                    {rank.min} - {rank.max === 9999 ? "+" : rank.max} <span className="text-slate-500 text-xs">ELO</span>
                                </div>

                                <p className="text-sm font-rajdhani text-slate-400 leading-tight opacity-80 border-t border-white/5 pt-3 mt-1">
                                    {rank.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}
