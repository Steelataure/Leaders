import { useState, useCallback } from "react";
import HexBoard, { type Piece, type GamePhase } from "../components/HexBoard";
import { type CharacterCard } from "../components/River";
import VictoryScreen from "../components/VictoryScreen";

// === CONSTANTS & MOCKS ===
const INITIAL_PIECES: Piece[] = [
  { id: "p1", characterId: "LEADER", ownerIndex: 0, q: 0, r: 2, hasActed: false },
  { id: "p2", characterId: "LEADER", ownerIndex: 1, q: 0, r: -2, hasActed: false },
  { id: "p3", characterId: "ARCHER", ownerIndex: 0, q: 1, r: 1, hasActed: false },
  { id: "p4", characterId: "CAVALIER", ownerIndex: 1, q: -1, r: -1, hasActed: false },
];

const INITIAL_RIVER: CharacterCard[] = [
  { id: "c1", characterId: "COGNEUR", name: "Cogneur", description: "Pousse un ennemi adjacent vers l'opposé", type: "ACTIVE" },
  { id: "c2", characterId: "RODEUR", name: "Rôdeuse", description: "Se déplace sur une case non-adjacente", type: "ACTIVE" },
  { id: "c3", characterId: "ILLUSIONISTE", name: "Illusionniste", description: "Échange de position avec un personnage", type: "ACTIVE" },
  { id: "c4", characterId: "EMP", name: "EMP Strike", description: "Inflige des dégâts de zone", type: "SPECIAL" },
];

// === COMPOSANTS UI ===

// Carte de la rivière (Sidebar gauche)
function SidebarCard({ card, onClick, disabled }: { card: CharacterCard; onClick: () => void; disabled: boolean }) {
  const icons: Record<string, string> = { ACTIVE: "⚡", PASSIVE: "🛡️", SPECIAL: "✨" };
  const cost = 3; // Mock cost

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`
        group relative p-3 rounded-xl border transition-all duration-300
        ${disabled
          ? 'bg-slate-900/40 border-slate-800 opacity-50 cursor-not-allowed'
          : 'bg-slate-800/80 border-cyan-500/30 hover:border-cyan-400 hover:bg-slate-800 hover:shadow-[0_0_15px_rgba(0,245,255,0.2)] cursor-pointer'
        }
      `}
    >
      {/* Barre latérale colorée */}
      <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r ${card.type === 'ACTIVE' ? 'bg-amber-400' : 'bg-purple-400'}`} />

      <div className="pl-3">
        <div className="flex justify-between items-start mb-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">{icons[card.type]}</span>
            <span className="text-white font-bold text-sm tracking-wide">{card.name}</span>
          </div>
          <span className="text-cyan-400 font-bold text-xs">⚡ {cost}</span>
        </div>
        <p className="text-slate-500 text-[10px] leading-relaxed group-hover:text-slate-400">
          {card.description}
        </p>
      </div>
    </div>
  );
}

export default function Game({ onBackToLobby }: { onBackToLobby: () => void }) {
  const [pieces, setPieces] = useState<Piece[]>(INITIAL_PIECES);
  const [currentPlayer, setCurrentPlayer] = useState<0 | 1>(0);
  const [phase, setPhase] = useState<GamePhase>("ACTIONS");
  const [turnNumber, setTurnNumber] = useState(1);
  const [deck, setDeck] = useState<CharacterCard[]>([
    { id: "c5", characterId: "MANIPULATRICE", name: "Manipulatrice", description: "Déplace un ennemi visible d'une case", type: "ACTIVE" },
    { id: "c6", characterId: "TAVERNIER", name: "Tavernier", description: "Déplace un allié adjacent d'une case", type: "ACTIVE" },
    { id: "c7", characterId: "GARDE", name: "Garde Royal", description: "Protège le leader adjacent", type: "PASSIVE" }
  ]);
  const [river, setRiver] = useState<CharacterCard[]>(INITIAL_RIVER);
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
  const [victory, setVictory] = useState<{ winner: 0 | 1; type: "CAPTURE" | "ENCIRCLEMENT" } | null>(null);

  // === LOGIC ===
  const endTurn = useCallback(() => {
    const nextPlayer = currentPlayer === 0 ? 1 : 0;
    setCurrentPlayer(nextPlayer);
    setPhase("ACTIONS");
    if (nextPlayer === 0) setTurnNumber((t) => t + 1);
    setPieces((prev) => prev.map((p) => ({ ...p, hasActed: false })));
    setSelectedPiece(null);
  }, [currentPlayer]);

  const handlePass = useCallback(() => {
    if (phase === "ACTIONS") setPhase("RECRUITMENT");
    else endTurn();
  }, [phase, endTurn]);

  // Handle Recruitment
  const handleRecruit = useCallback((cardId: string) => {
    if (phase !== "RECRUITMENT") return;

    // 1. Check limit (max 5 pieces/player mock)
    const playerPieces = pieces.filter(p => p.ownerIndex === currentPlayer);
    if (playerPieces.length >= 6) {
      alert("Maximum d'unités atteint !");
      return;
    }

    // 2. Find Card
    const card = river.find(c => c.id === cardId);
    if (!card) return;

    // 3. Find Free Spawn Spot (Official spawn points)
    // P1 (Bottom): (-3,3), (-2,3), (-1,2), (-1,3)
    // P2 (Top): (3,-3), (2,-3), (1,-2), (1,-3)
    const spawnPoints = currentPlayer === 0
      ? [{ q: -3, r: 3 }, { q: -2, r: 3 }, { q: -1, r: 2 }, { q: -1, r: 3 }] // Bottom
      : [{ q: 3, r: -3 }, { q: 2, r: -3 }, { q: 1, r: -2 }, { q: 1, r: -3 }]; // Top

    const freeSpot = spawnPoints.find(spot =>
      !pieces.some(p => p.q === spot.q && p.r === spot.r)
    );

    if (!freeSpot) {
      alert("Aucune case de recrutement libre ! Déplacez vos unités.");
      return;
    }

    // 4. Create Piece
    const newPiece: Piece = {
      id: `u-${Date.now()}`,
      characterId: card.characterId,
      ownerIndex: currentPlayer,
      q: freeSpot.q,
      r: freeSpot.r,
      hasActed: true // New recruits cannot act immediately (usually)
    };

    // 5. Update State
    setPieces(prev => [...prev, newPiece]);

    // Cycle River
    const nextCard = deck[0];
    const newDeck = deck.slice(1);
    const newRiver = river.map(c => c.id === cardId ? nextCard || c : c); // Replace recruited card, or keep if no next card

    // In strict rules, river slides. simplified here: replace slot.
    setRiver(newRiver);
    if (nextCard) setDeck(newDeck);

    // End Turn
    endTurn();

  }, [phase, pieces, river, deck, currentPlayer, endTurn]);

  const handleMove = useCallback((pieceId: string, toQ: number, toR: number) => {
    setPieces((prev) => {
      const updated = prev.map((p) =>
        p.id === pieceId ? { ...p, q: toQ, r: toR, hasActed: true } : p
      );
      // Auto-transition logic
      const playerPieces = updated.filter((p) => p.ownerIndex === currentPlayer);
      if (playerPieces.every((p) => p.hasActed)) {
        setTimeout(() => setPhase("RECRUITMENT"), 500);
      }
      return updated;
    });
  }, [currentPlayer]);

  if (victory) {
    return (
      <VictoryScreen
        winner={victory.winner}
        victoryType={victory.type}
        onPlayAgain={() => { /* reset */ }}
        onBackToLobby={onBackToLobby}
      />
    );
  }

  return (
    <div className="h-screen w-screen bg-[#05101a] text-white font-mono flex overflow-hidden relative">
      {/* Background Grid */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#00f5ff 1px, transparent 1px), linear-gradient(90deg, #00f5ff 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Corner Brackets */}
      <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-cyan-500/30 rounded-tl-xl pointer-events-none" />
      <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-cyan-500/30 rounded-tr-xl pointer-events-none" />
      <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-cyan-500/30 rounded-bl-xl pointer-events-none" />
      <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-cyan-500/30 rounded-br-xl pointer-events-none" />

      {/* === HEADER === */}
      <div className="absolute top-0 left-0 right-0 h-20 z-20 flex items-center justify-center pointer-events-none">
        <div className="flex items-center gap-8 bg-slate-900/80 backdrop-blur-md px-12 py-3 rounded-b-3xl border-x border-b border-cyan-500/30 shadow-[0_0_30px_rgba(0,245,255,0.1)] pointer-events-auto">
          <div className="flex items-center gap-3">
            <span className="text-2xl text-yellow-400">⚔️</span>
            <h1 className="text-2xl font-black italic tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 filter drop-shadow-[0_0_10px_rgba(0,245,255,0.5)]">
              PHASE_{phase}
            </h1>
          </div>

          <div className="w-px h-8 bg-slate-700" />

          <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
            <span className="text-slate-400">TOUR <span className="text-white text-base">{turnNumber}</span></span>
            <div className={`px-4 py-1.5 rounded-full border ${currentPlayer === 0 ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10' : 'border-red-500 text-red-400 bg-red-500/10'}`}>
              J{currentPlayer + 1} EN LIGNE
            </div>
          </div>
        </div>
      </div>

      {/* Quit Button (Top Right) */}
      <button
        onClick={onBackToLobby}
        className="absolute top-6 right-8 z-30 flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 rounded hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all uppercase text-xs font-bold tracking-widest"
      >
        <span>↪ Quitter</span>
      </button>

      {/* === MAIN LAYOUT (3 COLUMNS) === */}
      <div className="flex-1 flex items-center justify-between px-8 pt-20 pb-8 w-full z-10">

        {/* LEFT: RIVIÈRE */}
        <div className="w-72 h-full flex flex-col gap-4">
          {/* River Header */}
          <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-cyan-500/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-xl">🌊</div>
              <div>
                <h2 className="font-bold text-cyan-50">Rivière</h2>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Terminez vos actions</p>
              </div>
            </div>

            <button
              onClick={handlePass}
              className={`w-full py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest transition-all
                ${phase === "RECRUITMENT"
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black shadow-lg shadow-cyan-500/25 animate-pulse'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 hover:border-slate-500'
                }
              `}
            >
              {phase === "ACTIONS" ? "⌛ Phase Actions" : "⚡ Recruter / Passer"}
            </button>
          </div>

          {/* Cards List */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {river.map((card) => (
              <SidebarCard
                key={card.id}
                card={card}
                onClick={() => handleRecruit(card.id)}
                disabled={phase !== "RECRUITMENT"}
              />
            ))}
          </div>
        </div>

        {/* CENTER: HEXBOARD */}
        <div className="flex-1 flex items-center justify-center relative">
          {/* Decorative frame around board */}
          <div className="relative p-10">
            <div className="absolute inset-0 border border-slate-700/50 rounded-[3rem]" />

            {/* Board Render */}
            <div className="scale-90 xl:scale-100 transition-transform duration-500">
              <HexBoard
                pieces={pieces}
                currentPlayer={currentPlayer}
                phase={phase}
                turnNumber={turnNumber}
                onMove={handleMove}
                selectedPiece={selectedPiece}
                onSelectPiece={setSelectedPiece}
              />
            </div>
          </div>
        </div>

        {/* RIGHT: SCANNER */}
        <div className="w-72 h-64">
          <div className={`
             h-full w-full rounded-2xl border-2 border-dashed transition-all duration-300 relative overflow-hidden group
             ${selectedPiece ? 'border-amber-500/50 bg-amber-500/5' : 'border-cyan-500/30 bg-cyan-900/5'}
           `}>
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-current rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-current rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-current rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-current rounded-br-lg" />

            {selectedPiece ? (
              <div className="p-6 h-full flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 mb-4 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(251,191,36,0.3)]">
                  {selectedPiece.characterId === 'LEADER' ? '👑' : '⚔️'}
                </div>
                <h3 className="text-xl font-black text-amber-400 tracking-wider mb-2">{selectedPiece.characterId}</h3>
                <div className="text-xs text-slate-400 font-mono space-y-1">
                  <p>POS: Q{selectedPiece.q} / R{selectedPiece.r}</p>
                  <p className={selectedPiece.hasActed ? "text-red-400" : "text-green-400"}>
                    STATUS: {selectedPiece.hasActed ? "ÉPUISÉ" : "PRÊT"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-cyan-500/40">
                <div className="w-16 h-16 border-2 border-dashed border-current rounded-lg mb-4 flex items-center justify-center text-2xl animate-pulse">
                  Target
                </div>
                <p className="font-bold tracking-[0.2em] uppercase text-xs">Scanner en</p>
                <p className="font-bold tracking-[0.2em] uppercase text-xs">attente...</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
