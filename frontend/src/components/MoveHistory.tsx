import { useRef, useEffect } from "react";
import type { GameFrontend } from "../api/gameApi";
import { CHARACTER_IMAGES, CHARACTER_NAMES } from "../constants/characters";

interface MoveHistoryProps {
    game: GameFrontend;
    onClose?: () => void;
    variant?: "modal" | "embedded";
}

export default function MoveHistory({ game, onClose, variant = "modal" }: MoveHistoryProps) {
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Scroll to top on mount (since newest is top)
        if (listRef.current) {
            listRef.current.scrollTop = 0;
        }
    }, [game.actions?.length]);

    const getActionDescription = (action: any) => {
        const player = game.players.find(p => p.playerIndex === action.playerIndex);
        const playerName = player?.username || `Joueur ${action.playerIndex + 1}`;
        const charName = action.characterId ? (CHARACTER_NAMES[action.characterId] || action.characterId) : "une unité";

        switch (action.actionType) {
            case "MOVE":
                return `${playerName} déplace ${charName} de (${action.fromQ},${action.fromR}) vers (${action.toQ},${action.toR})`;
            case "ATTACK":
                return `${playerName} attaque avec ${charName} vers (${action.toQ},${action.toR})`;
            case "ABILITY":
                return `${playerName} active la capacité de ${charName}`;
            case "RECRUIT":
                return `${playerName} recrute ${charName}`;
            case "BANISH":
                return `${playerName} bannit ${charName}`;
            default:
                return `${playerName} effectue une action ${action.actionType} avec ${charName}`;
        }
    };

    const content = (
        <div className={`bg-slate-900 border border-slate-700 rounded-2xl flex flex-col shadow-2xl ${variant === "embedded" ? "w-full h-full bg-slate-900/60 backdrop-blur-sm" : "w-full max-w-2xl max-h-[80vh]"}`}>
            {/* Header */}
            <div className={`border-b border-slate-700 flex justify-between items-center bg-slate-800/50 rounded-t-2xl ${variant === "embedded" ? "p-4" : "p-6"}`}>
                <h2 className={`font-bold text-white flex items-center gap-2 ${variant === "embedded" ? "text-lg" : "text-2xl"}`}>
                    <span>📜</span> Historique
                </h2>
                {variant === "modal" && onClose && (
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors text-2xl"
                    >
                        ×
                    </button>
                )}
            </div>

            {/* List */}
            <div ref={listRef} className={`flex-1 overflow-y-auto ${variant === "embedded" ? "p-3 space-y-3" : "p-6 space-y-4"}`}>
                {game.actions && game.actions.length > 0 ? (
                    [...game.actions].reverse().map((action, index) => (
                        <div
                            key={index}
                            className={`p-3 rounded-xl border flex gap-3 ${action.playerIndex === 0
                                ? "bg-indigo-900/20 border-indigo-500/30 ml-0 mr-4"
                                : "bg-rose-900/20 border-rose-500/30 ml-4 mr-0"
                                }`}
                        >
                            {/* Image Icon */}
                            <div className="flex-shrink-0">
                                <div className={`w-10 h-10 rounded-full border-2 ${action.playerIndex === 0 ? "border-indigo-400" : "border-rose-400"} overflow-hidden bg-slate-900/50`}>
                                    {action.characterId && (
                                        <img
                                            src={
                                                action.characterId === "LEADER"
                                                    ? (action.playerIndex === 0 ? CHARACTER_IMAGES.LEADER_BLUE : CHARACTER_IMAGES.LEADER_RED)
                                                    : (CHARACTER_IMAGES[action.characterId] || "")
                                            }
                                            alt={action.characterId}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    )}
                                    {!action.characterId && (
                                        <div className="w-full h-full flex items-center justify-center text-sm">
                                            ❓
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-0.5">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${action.playerIndex === 0 ? "text-indigo-400" : "text-rose-400"
                                        }`}>
                                        T{action.turnNumber} • {action.actionOrder || index + 1}
                                    </span>
                                </div>
                                <p className="text-slate-200 text-xs sm:text-sm truncate-2-lines">
                                    {getActionDescription(action)}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-slate-500 py-8 text-sm">
                        Aucune action enregistrée.
                    </div>
                )}
            </div>

            {/* Footer - Only for modal */}
            {variant === "modal" && onClose && (
                <div className="p-6 border-t border-slate-700 bg-slate-800/50 rounded-b-2xl text-center">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium"
                    >
                        Fermer
                    </button>
                </div>
            )}
        </div>
    );

    if (variant === "embedded") {
        return content;
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
            {content}
        </div>
    );
}
