import { Shield, Medal, Trophy, Crown, Zap } from "lucide-react";

interface RankBadgeProps {
    elo: number | null | undefined;
    size?: "sm" | "md" | "lg";
    showElo?: boolean;
}

const RANK_CONFIG = [
    { min: 0, max: 1099, label: "BRONZE", color: "text-orange-400", bg: "bg-orange-900/40", border: "border-orange-500/40", icon: Shield, glow: "shadow-orange-500/20" },
    { min: 1100, max: 1299, label: "ARGENT", color: "text-slate-300", bg: "bg-slate-400/20", border: "border-slate-300/40", icon: Medal, glow: "shadow-slate-500/20" },
    { min: 1300, max: 1499, label: "OR", color: "text-amber-400", bg: "bg-amber-400/20", border: "border-amber-400/50", icon: Trophy, glow: "shadow-amber-500/40" },
    { min: 1500, max: 1699, label: "PLATINE", color: "text-cyan-400", bg: "bg-cyan-400/20", border: "border-cyan-400/40", icon: Zap, glow: "shadow-cyan-500/30" },
    { min: 1700, max: 1899, label: "DIAMANT", color: "text-purple-400", bg: "bg-purple-400/20", border: "border-purple-400/40", icon: Crown, glow: "shadow-purple-500/40" },
    { min: 1900, max: 9999, label: "MASTER", color: "text-red-500", bg: "bg-red-500/20", border: "border-red-500/50", icon: Crown, glow: "shadow-red-500/50" },
];

export default function RankBadge({ elo, size = "md", showElo = true }: RankBadgeProps) {
    const score = elo ?? 0;
    const config = RANK_CONFIG.find(r => score >= r.min && score <= r.max) || RANK_CONFIG[0];
    const Icon = config.icon;

    const sizeClasses = {
        sm: { container: "px-3 py-1", icon: 14, text: "text-[12px]", elo: "text-[14px]" },
        md: { container: "px-4 py-1.5", icon: 18, text: "text-[14px]", elo: "text-[18px]" },
        lg: { container: "px-8 py-3", icon: 24, text: "text-lg", elo: "text-2xl" },
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
          flex items-center gap-2 font-mono font-black
          ${currentSize.elo} transition-all duration-500
          text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.6)]
        `}>
                    <span className="text-[10px] tracking-widest uppercase opacity-70 text-slate-400">SCORE</span>
                    <span className={`${config.color} scale-110 origin-left`}>{score}</span>
                </div>
            )}

            {/* Scanning effect on hover */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
            </div>
        </div>
    );
}
