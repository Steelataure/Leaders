import { Shield, Medal, Trophy, Crown, Zap } from "lucide-react";

interface RankBadgeProps {
    elo: number | null | undefined;
    size?: "sm" | "md" | "lg";
    showElo?: boolean;
}

const RANK_CONFIG = [
    { min: 0, max: 1099, label: "NOVICE", color: "text-slate-400", bg: "bg-slate-400/10", border: "border-slate-400/20", icon: Medal, glow: "shadow-slate-500/10" },
    { min: 1100, max: 1299, label: "TACTICIEN", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30", icon: Shield, glow: "shadow-emerald-500/20" },
    { min: 1300, max: 1499, label: "COMMANDANT", color: "text-cyan-400", bg: "bg-cyan-400/10", border: "border-cyan-400/30", icon: Zap, glow: "shadow-cyan-500/20" },
    { min: 1500, max: 1699, label: "STRATÈGE", color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/30", icon: Trophy, glow: "shadow-purple-500/20" },
    { min: 1700, max: 9999, label: "GRAND MAÎTRE", color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/40", icon: Crown, glow: "shadow-amber-500/30" },
];

export default function RankBadge({ elo, size = "md", showElo = true }: RankBadgeProps) {
    const score = elo ?? 0;
    const config = RANK_CONFIG.find(r => score >= r.min && score <= r.max) || RANK_CONFIG[0];
    const Icon = config.icon;

    const sizeClasses = {
        sm: { container: "px-2 py-0.5", icon: 12, text: "text-[9px]", elo: "text-[8px]" },
        md: { container: "px-3 py-1", icon: 14, text: "text-[10px]", elo: "text-[9px]" },
        lg: { container: "px-6 py-2.5", icon: 20, text: "text-sm", elo: "text-xs" },
    };

    const currentSize = sizeClasses[size];

    return (
        <div className={`
      relative group flex flex-col items-center gap-1
    `}>
            {/* Premium Container */}
            <div className={`
        flex items-center gap-2 rounded-sm font-cyber font-black tracking-[0.2em] uppercase italic
        backdrop-blur-md border border-white/5 transition-all duration-500
        ${config.bg} ${config.border} ${config.color} ${currentSize.container}
        group-hover:scale-105 group-hover:border-white/20
        shadow-[0_0_15px_rgba(0,0,0,0.3)] ${config.glow}
      `}>
                {/* Animated Corner Decorations (Only on lg/md) */}
                {size !== "sm" && (
                    <>
                        <div className={`absolute -top-[1px] -left-[1px] w-1.5 h-1.5 border-t border-l opacity-50 group-hover:opacity-100 transition-opacity ${config.border.replace("border-", "border-t-")}`} />
                        <div className={`absolute -bottom-[1px] -right-[1px] w-1.5 h-1.5 border-b border-r opacity-50 group-hover:opacity-100 transition-opacity ${config.border.replace("border-", "border-b-")}`} />
                    </>
                )}

                <Icon size={currentSize.icon} className="animate-pulse" />
                <span className={currentSize.text}>{config.label}</span>
            </div>

            {/* ELO Overlay/Subtext */}
            {showElo && (
                <div className={`
          flex items-center gap-1 font-mono font-bold
          ${currentSize.elo} opacity-60 group-hover:opacity-100 transition-all duration-500
          text-slate-400
        `}>
                    <span className="text-[7px] tracking-tighter uppercase opacity-50">Score Tactical</span>
                    <span className={config.color}>{score}</span>
                </div>
            )}

            {/* Scanning effect on hover */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
            </div>
        </div>
    );
}
