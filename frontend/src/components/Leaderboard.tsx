import { useEffect, useState } from "react";
import { authService } from "../services/auth.service";
import type { User } from "../types/auth.types";
import { Crown, Trophy, Medal } from "lucide-react";
import RankBadge from "./RankBadge";
import { CHARACTER_IMAGES } from "../constants/characters";

export default function Leaderboard() {
    const [leaders, setLeaders] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const data = await authService.getLeaderboard();
                setLeaders(data);
            } catch (err) {
                console.error("Failed to load leaderboard", err);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
        const interval = setInterval(fetchLeaderboard, 30000); // Mettre à jour toutes les 30s
        return () => clearInterval(interval);
    }, []);

    const getRankIcon = (index: number) => {
        if (index === 0) return <Crown className="w-5 h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />;
        if (index === 1) return <Trophy className="w-5 h-5 text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.6)]" />;
        if (index === 2) return <Medal className="w-5 h-5 text-amber-700 drop-shadow-[0_0_8px_rgba(180,83,9,0.6)]" />;
        return <span className="font-mono text-slate-500 w-5 text-center">#{index + 1}</span>;
    };

    return (
        <div className="bg-slate-900/40 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-5 shadow-[0_0_20px_rgba(0,0,0,0.3)] h-full flex flex-col">
            <h2 className="font-orbitron font-black italic text-xl text-white mb-4 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-cyan-400" />
                CLASSEMENT
            </h2>

            {loading ? (
                <div className="flex-1 flex items-center justify-center text-cyan-500/50 font-mono animate-pulse">
                    CHARGEMENT...
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto custom-scroll pr-2 space-y-2">
                    {leaders.map((user, index) => (
                        <div
                            key={user.id}
                            className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-300
                                ${index === 0 ? 'bg-amber-950/20 border-amber-500/30' : 'bg-slate-800/20 border-white/5 hover:bg-slate-700/30'}
                            `}
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 w-8 flex justify-center">
                                    {getRankIcon(index)}
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        {user.avatar && (
                                            <div className="w-5 h-5 rounded-full border border-cyan-500/30 overflow-hidden bg-slate-800">
                                                <img src={CHARACTER_IMAGES[user.avatar]} className="w-full h-full object-cover" alt="avatar" />
                                            </div>
                                        )}
                                        <span className={`font-rajdhani font-bold text-sm ${index === 0 ? 'text-amber-100' : 'text-slate-200'}`}>
                                            {user.username}
                                        </span>
                                    </div>
                                    <div className="scale-75 origin-left">
                                        <RankBadge elo={user.elo} size="sm" showElo={false} />
                                    </div>
                                </div>
                            </div>
                            <div className="font-mono font-bold text-cyan-400 text-sm">
                                {user.elo} <span className="text-[10px] text-slate-500">ELO</span>
                            </div>
                        </div>
                    ))}

                    {leaders.length === 0 && (
                        <div className="text-center text-slate-500 font-rajdhani italic py-10">
                            Aucun classement disponible
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
