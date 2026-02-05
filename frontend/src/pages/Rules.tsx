import { Settings, Target, PlayCircle, Trophy, Crown, Users } from 'lucide-react';
import CardCarousel from '../components/Caroussel';

const Rules = ({ onBack }: { onBack: () => void }) => {
    return (
        <div className="min-h-screen bg-[#0A0A0A] text-cyan-50">
            {/* Header */}
            <header className="border-b border-cyan-500/20 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto grid grid-cols-3 items-center px-6 py-4">
                    {/* Left: Logo */}
                    <div className="flex items-center">
                        <img
                            src="/image/logo.png"
                            alt="Leaders Logo"
                            className="h-12 md:h-14"
                        />
                    </div>
                    {/* Center: Glowing Play Button */}
                    <div className="flex justify-center">
                        <button
                            className="
                px-8 py-3
                font-bold text-lg uppercase tracking-wider
                rounded-full
                bg-cyan-500 text-slate-900
                hover:bg-cyan-400
                transition-all duration-300
                shadow-2xl shadow-cyan-500/50
                hover:shadow-cyan-400/60
                focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950
                active:scale-95
              "
                            onClick={onBack}
                        >
                            JOUER
                        </button>
                    </div>
                    {/* Right: Settings Icon */}
                    <div className="flex justify-end">
                        <button
                            className="
                p-3 rounded-full
                text-cyan-400 hover:text-cyan-300
                bg-slate-900/50 hover:bg-slate-800/50
                border border-cyan-500/30 hover:border-cyan-400/50
                transition-all duration-300
                shadow-lg shadow-cyan-500/20
                focus:outline-none focus:ring-2 focus:ring-cyan-400
                active:scale-95
              "
                        >
                            <Settings size={24} />
                        </button>
                    </div>
                </div>
            </header>
            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Page Title */}
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-bold text-cyan-400 mb-2 tracking-wide uppercase">
                        Règles du jeu
                    </h1>
                    <div className="h-1 w-32 mx-auto bg-gradient-to-r from-transparent via-cyan-500 to-transparent rounded-full shadow-lg shadow-cyan-500/50"></div>
                </div>
                {/* Main Grid - 3 columns on desktop */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

                    {/* Column 1: But du jeu */}
                    <div>
                        <div className="bg-slate-900/60 border border-cyan-500/40 rounded-3xl p-6 shadow-xl shadow-cyan-500/30 hover:shadow-cyan-500/40 transition-all duration-300 backdrop-blur-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-cyan-500/20 rounded-lg">
                                    <Target className="text-cyan-400" size={28} />
                                </div>
                                <h2 className="text-2xl font-bold text-cyan-400 uppercase tracking-wide">
                                    But du jeu
                                </h2>
                            </div>
                            <div className="space-y-4 text-cyan-100/80 leading-relaxed">
                                <p>
                                    Compose ton équipe de <strong className="text-cyan-300">Personnages uniques</strong> et capture le <strong className="text-cyan-300">Leader adverse</strong>.
                                </p>
                                <p>
                                    Tu gagnes en amenant <strong className="text-cyan-300">2 de tes Personnages adjacents</strong> au Leader ennemi, ou en le laissant <strong className="text-cyan-300">encerclé sans aucune case libre</strong> autour de lui.
                                </p>
                                <div className="bg-slate-950/50 rounded-xl p-4 border border-cyan-500/30 mt-4">
                                    <h3 className="text-lg font-semibold text-cyan-300 mb-2 flex items-center gap-2">
                                        <Crown size={20} />
                                        Conditions de victoire
                                    </h3>
                                    <ul className="space-y-2 text-sm">
                                        <li className="flex items-start gap-2">
                                            <span className="text-cyan-400 mt-1">▸</span>
                                            <span><strong className="text-cyan-300">Capture :</strong> 2 de tes Personnages sont adjacents au Leader ennemi</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-cyan-400 mt-1">▸</span>
                                            <span><strong className="text-cyan-300">Encerclement :</strong> Toutes les cases autour du Leader ennemi sont occupées</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Column 2: Tour de jeu */}
                    <div className="bg-slate-900/60 border border-cyan-500/40 rounded-3xl p-6 shadow-xl shadow-cyan-500/30 hover:shadow-cyan-500/40 transition-all duration-300 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-cyan-500/20 rounded-lg">
                                <PlayCircle className="text-cyan-400" size={28} />
                            </div>
                            <h2 className="text-2xl font-bold text-cyan-400 uppercase tracking-wide">
                                Tour de jeu
                            </h2>
                        </div>
                        <div className="space-y-6">
                            {/* Phase 1 */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold border border-cyan-500/50">
                                        1
                                    </div>
                                    <h3 className="text-xl font-semibold text-cyan-300 uppercase tracking-wide">
                                        Phase d'actions
                                    </h3>
                                </div>
                                <div className="pl-10 space-y-3 text-cyan-100/80 text-sm leading-relaxed">
                                    <p>
                                        Pour <strong className="text-cyan-300">chacun de tes Personnages</strong> (Leader inclus), tu peux faire <strong className="text-cyan-300">une seule action au choix</strong> :
                                    </p>
                                    <ul className="space-y-2">
                                        <li className="flex items-start gap-2">
                                            <span className="text-cyan-400 mt-1">▸</span>
                                            <span><strong className="text-cyan-300">Se déplacer</strong> sur une case adjacente vide</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="text-cyan-400">ou</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-cyan-400 mt-1">▸</span>
                                            <span><strong className="text-cyan-300">Utiliser sa compétence active</strong> (si le Personnage en possède une)</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            {/* Phase 2 */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold border border-cyan-500/50">
                                        2
                                    </div>
                                    <h3 className="text-xl font-semibold text-cyan-300 uppercase tracking-wide">
                                        Phase de recrutement
                                    </h3>
                                </div>
                                <div className="pl-10 space-y-3 text-cyan-100/80 text-sm leading-relaxed">
                                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-3">
                                        <p className="text-amber-200/90 text-xs">
                                            ⚠️ <strong>Attention :</strong> Si tu as déjà <strong>5 cartes Personnage</strong> devant toi (Leader inclus), tu ignores cette phase pour le reste de la partie.
                                        </p>
                                    </div>

                                    <p className="mb-2">Sinon :</p>
                                    <ol className="space-y-2">
                                        <li className="flex items-start gap-2">
                                            <span className="text-cyan-400 font-bold">1.</span>
                                            <span>Choisis <strong className="text-cyan-300">une des 3 cartes Personnage visibles</strong> et place-la devant toi</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-cyan-400 font-bold">2.</span>
                                            <span>Place le <strong className="text-cyan-300">personnage correspondant</strong> sur une case de Recrutement libre de TON côté</span>
                                        </li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Column 3: Fin de jeu */}
                    <div className="space-y-6">
                        <div className="bg-slate-900/60 border border-cyan-500/40 rounded-3xl p-6 shadow-xl shadow-cyan-500/30 hover:shadow-cyan-500/40 transition-all duration-300 backdrop-blur-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-cyan-500/20 rounded-lg">
                                    <Trophy className="text-cyan-400" size={28} />
                                </div>
                                <h2 className="text-2xl font-bold text-cyan-400 uppercase tracking-wide">
                                    Fin de jeu
                                </h2>
                            </div>
                            <div className="space-y-4 text-cyan-100/80 leading-relaxed">
                                <p className="text-base">
                                    La partie <strong className="text-cyan-300">se termine immédiatement</strong> dès qu'un Leader se retrouve :
                                </p>

                                <div className="space-y-3">
                                    <div className="bg-slate-950/50 rounded-xl p-4 border border-cyan-500/30">
                                        <h3 className="text-lg font-semibold text-cyan-300 mb-2 flex items-center gap-2">
                                            <Users size={20} />
                                            Capturé
                                        </h3>
                                        <p className="text-sm">
                                            Il a <strong className="text-cyan-300">2 Personnages ennemis adjacents</strong>
                                        </p>
                                    </div>
                                    <div className="bg-slate-950/50 rounded-xl p-4 border border-cyan-500/30">
                                        <h3 className="text-lg font-semibold text-cyan-300 mb-2 flex items-center gap-2">
                                            <Target size={20} />
                                            Encerclé
                                        </h3>
                                        <p className="text-sm">
                                            <strong className="text-cyan-300">Toutes les cases autour de lui</strong> sont occupées par des Personnages, quel que soit leur camp
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mt-4">
                                    <h3 className="text-red-300 font-semibold mb-2 text-sm uppercase tracking-wide">
                                        ⛔ Interdiction importante
                                    </h3>
                                    <p className="text-red-200/80 text-sm">
                                        Pendant ton propre tour, tu n'as pas le droit de jouer une action qui laisserait <strong className="text-red-300">TON Leader capturé ou encerclé</strong> à la fin de ton tour.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <CardCarousel />
            </main>
        </div>
    );
};
export default Rules;