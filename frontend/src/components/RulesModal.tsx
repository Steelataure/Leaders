import { useState } from 'react';
import { X, Target, PlayCircle, Trophy, Crown, Users, Info } from 'lucide-react';

type Tab = 'GOAL' | 'TURN' | 'END';

export default function RulesModal({ onClose }: { onClose: () => void }) {
    const [activeTab, setActiveTab] = useState<Tab>('GOAL');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            {/* Container */}
            <div
                className="
          w-full max-w-2xl bg-slate-900/95 border border-cyan-500/50 rounded-2xl 
          shadow-[0_0_50px_rgba(6,182,212,0.3)] overflow-hidden flex flex-col max-h-[85vh]
          animate-in zoom-in-95 duration-300
        "
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/30 bg-slate-950/50">
                    <div className="flex items-center gap-3">
                        <Info className="text-cyan-400" size={24} />
                        <h2 className="font-cyber text-xl font-bold text-white tracking-widest uppercase">
                            Guide Tactique
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10 bg-slate-900/50">
                    <button
                        onClick={() => setActiveTab('GOAL')}
                        className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-all
              ${activeTab === 'GOAL' ? 'text-cyan-400 border-b-2 border-cyan-500 bg-cyan-950/20' : 'text-slate-500 hover:text-slate-300'}
            `}
                    >
                        Objectif
                    </button>
                    <button
                        onClick={() => setActiveTab('TURN')}
                        className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-all
              ${activeTab === 'TURN' ? 'text-amber-400 border-b-2 border-amber-500 bg-amber-950/20' : 'text-slate-500 hover:text-slate-300'}
            `}
                    >
                        Tour de jeu
                    </button>
                    <button
                        onClick={() => setActiveTab('END')}
                        className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-all
              ${activeTab === 'END' ? 'text-rose-400 border-b-2 border-rose-500 bg-rose-950/20' : 'text-slate-500 hover:text-slate-300'}
            `}
                    >
                        Victoire
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800/20 via-slate-900/0 to-slate-900/0">

                    {activeTab === 'GOAL' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 fade-in">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                                    <Target className="text-cyan-400" size={32} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-cyan-100 mb-2">Ta mission</h3>
                                    <p className="text-slate-300 text-sm leading-relaxed">
                                        Compose ton équipe de <strong className="text-cyan-300">Personnages uniques</strong> et capture le <strong className="text-cyan-300">Leader adverse</strong>.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-slate-950/50 rounded-xl p-5 border border-cyan-500/20">
                                <h4 className="text-sm font-bold text-slate-400 uppercase mb-3 tracking-wider">Comment gagner ?</h4>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3">
                                        <Crown size={18} className="text-amber-400 mt-0.5 shrink-0" />
                                        <span className="text-sm text-slate-300">
                                            <strong className="text-cyan-300">Capture :</strong> Amène 2 de tes personnages sur des cases adjacentes au Leader ennemi.
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <Target size={18} className="text-rose-400 mt-0.5 shrink-0" />
                                        <span className="text-sm text-slate-300">
                                            <strong className="text-cyan-300">Encerclement :</strong> Bloque toutes les cases autour du Leader ennemi (même avec ses propres unités !).
                                        </span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {activeTab === 'TURN' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 fade-in">
                            <div className="flex items-center gap-2 mb-4">
                                <PlayCircle className="text-amber-400" size={24} />
                                <h3 className="text-lg font-bold text-amber-100">Déroulement d'un tour</h3>
                            </div>

                            <div className="relative pl-6 border-l-2 border-slate-700 space-y-8">
                                {/* Step 1 */}
                                <div className="relative">
                                    <span className="absolute -left-[31px] w-6 h-6 rounded-full bg-slate-800 border-2 border-amber-500 text-amber-500 flex items-center justify-center text-xs font-bold">1</span>
                                    <h4 className="text-sm font-bold text-white uppercase mb-2">Phase d'Actions</h4>
                                    <p className="text-sm text-slate-400 mb-2">Chaque personnage peut faire <strong className="text-white">UNE</strong> action :</p>
                                    <ul className="grid grid-cols-2 gap-2">
                                        <li className="bg-slate-800/50 p-2 rounded border border-white/5 text-xs text-slate-300 text-center">🏃 Se déplacer</li>
                                        <li className="bg-slate-800/50 p-2 rounded border border-white/5 text-xs text-slate-300 text-center">⚡ Utiliser Compétence</li>
                                    </ul>
                                </div>

                                {/* Step 2 */}
                                <div className="relative">
                                    <span className="absolute -left-[31px] w-6 h-6 rounded-full bg-slate-800 border-2 border-emerald-500 text-emerald-500 flex items-center justify-center text-xs font-bold">2</span>
                                    <h4 className="text-sm font-bold text-white uppercase mb-2">Phase de Recrutement</h4>
                                    <p className="text-sm text-slate-400">
                                        Si tu as moins de <strong>5 unités</strong>, choisis une carte dans la rivière et place-la sur une de tes cases de spawn.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'END' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 fade-in">
                            <div className="text-center mb-6">
                                <Trophy className="text-rose-500 mx-auto mb-3" size={40} />
                                <h3 className="text-lg font-bold text-rose-100">Fin de la partie</h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-rose-950/20 p-4 rounded-xl border border-rose-500/20 text-center">
                                    <Users className="text-rose-400 mx-auto mb-2" size={24} />
                                    <h4 className="text-rose-300 font-bold text-sm uppercase mb-1">Capture</h4>
                                    <p className="text-xs text-slate-400">2 ennemis au contact du Leader</p>
                                </div>
                                <div className="bg-rose-950/20 p-4 rounded-xl border border-rose-500/20 text-center">
                                    <Target className="text-rose-400 mx-auto mb-2" size={24} />
                                    <h4 className="text-rose-300 font-bold text-sm uppercase mb-1">Blocus</h4>
                                    <p className="text-xs text-slate-400">Leader totalement encerclé</p>
                                </div>
                            </div>

                            <div className="mt-6 bg-red-500/10 border border-red-500/30 p-3 rounded-lg flex gap-3">
                                <span className="text-xl">⛔</span>
                                <p className="text-xs text-red-200/80 leading-relaxed">
                                    <strong>Règle suicidaire :</strong> Tu ne peux pas faire une action qui mettrait ton propre Leader en situation de défaite immédiate à la fin de ton tour.
                                </p>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="bg-slate-950 p-4 border-t border-white/5 flex justify-center">
                    <p className="text-[10px] text-slate-500 font-mono">LEADERS - TACTICAL CARD GAME v1.0</p>
                </div>
            </div>
        </div>
    );
}
