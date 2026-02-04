import { useState } from 'react';
import { ChevronLeft, ChevronRight, Zap, Shield } from 'lucide-react';

interface Card {
    name: string;
    type: 'active' | 'passive' | 'special';
    description: string;
    image: string;
}

const cards: Card[] = [
    {
        name: "Acrobate",
        type: "active",
        description: "Saute en ligne droite par-dessus un Personnage adjacent. Peut effectuer jusqu'à deux sauts consécutifs.",
        image: "/src/utils/image/acrobate.png"
    },
    {
        name: "Cavalier",
        type: "active",
        description: "Se déplace de deux cases en ligne droite.",
        image: "/src/utils/image/cavalier.png"
    },
    {
        name: "Cogneur",
        type: "active",
        description: "Se déplace sur la case d'un ennemi adjacent et le pousse sur l'une des trois cases opposées de votre choix.",
        image: "/src/utils/image/cogneur.png"
    },
    {
        name: "Garde Royal",
        type: "active",
        description: "Se déplace, depuis n'importe quelle case, sur une case adjacente à votre Leader, puis peut ensuite se déplacer d'une case.",
        image: "/src/utils/image/garderoyal.png"
    },
    {
        name: "Illusioniste",
        type: "active",
        description: "Échange de position avec un Personnage visible en ligne droite et non-adjacent.",
        image: "/src/utils/image/illusioniste.png"
    },
    {
        name: "Lance-Grappin",
        type: "active",
        description: "Se déplace jusqu'à un Personnage visible en ligne droite ou l'attire jusqu'à lui.",
        image: "/src/utils/image/lance-grappin.png"
    },
    {
        name: "Manipulatrice",
        type: "active",
        description: "Déplace d'une case un ennemi visible en ligne droite et non-adjacent.",
        image: "/src/utils/image/manipulatrice.png"
    },
    {
        name: "Rôdeuse",
        type: "active",
        description: "Se déplace sur n'importe quelle case non-adjacente à un ennemi.",
        image: "/src/utils/image/rodeuse.png"
    },
    {
        name: "Tavernier",
        type: "active",
        description: "Déplace d'une case un allié adjacent.",
        image: "/src/utils/image/tavernier.png"
    },
    {
        name: "Archère",
        type: "passive",
        description: "Participe à la capture du Leader adverse à une distance de deux cases en ligne droite. Il n'est pas nécessaire que le Leader adverse soit visible. Ne participe pas à la capture s'il lui est adjacent.",
        image: "/src/utils/image/archere.png"
    },
    {
        name: "Assassin",
        type: "passive",
        description: "Capture le Leader adverse, même sans autre allié participant.",
        image: "/src/utils/image/assassin.png"
    },
    {
        name: "Geôlier",
        type: "passive",
        description: "Les ennemis adjacents ayant une compétence active ne peuvent pas l'utiliser.",
        image: "/src/utils/image/geolier.png"
    },
    {
        name: "Protecteur",
        type: "passive",
        description: "Les compétences des ennemis ne peuvent déplacer ni le Protecteur, ni ses alliés adjacents.",
        image: "/src/utils/image/protecteur.png"
    },
    {
        name: "Vizir",
        type: "passive",
        description: "Votre Leader peut se déplacer d'une case supplémentaire lors de son action.",
        image: "/src/utils/image/vizir.png"
    },
    {
        name: "Vieil Ours et Ourson",
        type: "special",
        description: "Quand vous les recrutez, prenez les deux et placez-les chacun sur une case de Recrutement vide. Ces deux Personnages comptent comme un seul pendant la phase de Recrutement. L'Ourson ne participe pas à la Capture du Leader adverse.",
        image: "/src/utils/image/vieilours&ourson.png"
    },
    {
        name: "Némésis",
        type: "special",
        description: "Ne peut pas faire d'actions pendant sa phase d'actions. À la fin d'une action qui déplace le Leader adverse, la Némésis DOIT se déplacer de deux cases.",
        image: "/src/utils/image/nemesis.png"
    }
];

const CardCarousel = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextCard = () => {
        setCurrentIndex((prev) => (prev + 1) % cards.length);
    };

    const prevCard = () => {
        setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    };

    const currentCard = cards[currentIndex];

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'active':
                return 'from-cyan-500 to-blue-500';
            case 'passive':
                return 'from-purple-500 to-pink-500';
            case 'special':
                return 'from-amber-500 to-orange-500';
            default:
                return 'from-cyan-500 to-blue-500';
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'active':
                return 'Compétence Active';
            case 'passive':
                return 'Compétence Passive';
            case 'special':
                return 'Compétence Spéciale';
            default:
                return 'Compétence';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'active':
                return <Zap size={20} />;
            case 'passive':
                return <Shield size={20} />;
            case 'special':
                return <span className="text-xl">✨</span>;
            default:
                return <Zap size={20} />;
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto">
            {/* Title */}
            <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold text-cyan-400 mb-2 tracking-wide uppercase">
                    Les Personnages
                </h2>
                <div className="h-1 w-24 mx-auto bg-gradient-to-r from-transparent via-cyan-500 to-transparent rounded-full shadow-lg shadow-cyan-500/50"></div>
            </div>

            {/* Carousel Container */}
            <div className="relative">
                {/* Main Card */}
                <div
                    className="bg-slate-900/60 border border-cyan-500/40 rounded-3xl p-8 shadow-2xl shadow-cyan-500/30 backdrop-blur-sm min-h-[400px] flex flex-col">
                    {/* Type Badge */}
                    <div className="flex justify-between items-start mb-6">
                        <div
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${getTypeColor(currentCard.type)} text-white text-sm font-semibold uppercase tracking-wider shadow-lg`}>
                            {getTypeIcon(currentCard.type)}
                            {getTypeLabel(currentCard.type)}
                        </div>

                        {/* Card Counter */}
                        <div className="text-cyan-400/60 text-sm font-mono">
                            {currentIndex + 1} / {cards.length}
                        </div>
                    </div>

                    {/* Card Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            <img
                                src={currentCard.image}
                                alt={currentCard.name}
                                className="w-64 h-auto rounded-2xl shadow-2xl shadow-cyan-500/30 border-2 border-cyan-500/40 object-cover"
                            />
                            {/* Glow effect behind image */}
                            <div
                                className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 blur-2xl -z-10 rounded-2xl"></div>
                        </div>
                    </div>


                    {/* Card Name */}
                    <h3 className="text-4xl font-bold text-center text-cyan-400 mb-6 uppercase tracking-wider">
                        {currentCard.name}
                    </h3>

                    {/* Card Description */}
                    <div className="flex-grow flex items-center">
                        <p className="text-cyan-100/80 text-center leading-relaxed text-lg px-4">
                            {currentCard.description}
                        </p>
                    </div>
                </div>

                {/* Navigation Buttons */}
                <button
                    onClick={prevCard}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-16 p-4 rounded-full bg-slate-900/80 border border-cyan-500/40 text-cyan-400 hover:bg-slate-800 hover:border-cyan-400 hover:text-cyan-300 transition-all duration-300 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 focus:outline-none focus:ring-2 focus:ring-cyan-400 active:scale-95"
                    aria-label="Carte précédente"
                >
                    <ChevronLeft size={32} />
                </button>

                <button
                    onClick={nextCard}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-16 p-4 rounded-full bg-slate-900/80 border border-cyan-500/40 text-cyan-400 hover:bg-slate-800 hover:border-cyan-400 hover:text-cyan-300 transition-all duration-300 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 focus:outline-none focus:ring-2 focus:ring-cyan-400 active:scale-95"
                    aria-label="Carte suivante"
                >
                    <ChevronRight size={32} />
                </button>
            </div>

            {/* Dots Navigation */}
            <div className="flex justify-center gap-2 mt-8">
                {cards.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            index === currentIndex
                                ? 'bg-cyan-400 w-8 shadow-lg shadow-cyan-400/50'
                                : 'bg-cyan-500/30 hover:bg-cyan-500/50'
                        }`}
                        aria-label={`Aller à la carte ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default CardCarousel;