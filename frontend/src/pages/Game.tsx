import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { GameFrontend, PieceFrontend } from "../api/gameApi";
import { gameApi } from "../api/gameApi";
import { authService } from "../services/auth.service";
import { webSocketService } from "../services/WebSocketService";
import HexBoard from "../components/HexBoard";
import VictoryScreen from "../components/VictoryScreen";
import useSound from "use-sound";

// Sons
import buttonClickSfx from "../sounds/buttonClick.mp3";
import characterSelectSfx from "../sounds/characterSelect.mp3";

const CHARACTER_IMAGES: Record<string, string> = {
  LEADER: "/image/garderoyal.png",
  ARCHER: "/image/archere.png",
  BRAWLER: "/image/cogneur.png",
  PROWLER: "/image/rodeuse.png",
  CAVALRY: "/image/cavalier.png",
  ACROBAT: "/image/acrobate.png",
  ILLUSIONIST: "/image/illusioniste.png",
  GRAPPLER: "/image/lance-grappin.png",
  MANIPULATOR: "/image/manipulatrice.png",
  INNKEEPER: "/image/tavernier.png",
  JAILER: "/image/geolier.png",
  PROTECTOR: "/image/protecteur.png",
  ASSASSIN: "/image/assassin.png",
  ROYAL_GUARD: "/image/garderoyal.png",
  VIZIER: "/image/vizir.png",
};

// mapping des noms de personnages
const CHARACTER_NAMES: Record<string, string> = {
  LEADER: "Leader",
  ACROBAT: "Acrobate",
  CAVALRY: "Cavalier",
  ILLUSIONIST: "Illusionniste",
  MANIPULATOR: "Manipulatrice",
  JAILER: "Geôlier",
  PROTECTOR: "Protecteur",
  BRAWLER: "Cogneur",
  GRAPPLER: "Lance-Grappin",
  NEMESIS: "Némésis",
  PROWLER: "Rôdeuse",
  INNKEEPER: "Tavernier",
  ARCHER: "Archère",
  ASSASSIN: "Assassin",
  ROYAL_GUARD: "Garde Royal",
  VIZIER: "Vizir",
  OLD_BEAR: "Vieil Ours",
  CUB: "Ourson",
};

// === CHARACTER DATA MAPPING ===
const CHARACTER_DATA: Record<string, { name: string; description: string; type: "ACTIVE" | "PASSIVE" | "SPECIAL" }> = {
  ARCHER: { name: "Archère", description: "Participe à la capture à 2 cases en ligne droite", type: "PASSIVE" },
  BRAWLER: { name: "Cogneur", description: "Pousse un ennemi adjacent vers l'opposé", type: "ACTIVE" },
  PROWLER: { name: "Rôdeuse", description: "Se déplace sur une case non-adjacente à un ennemi", type: "ACTIVE" },
  CAVALRY: { name: "Cavalier", description: "Se déplace de 2 cases en ligne droite", type: "ACTIVE" },
  ACROBAT: { name: "Acrobate", description: "Saute par-dessus un personnage adjacent", type: "ACTIVE" },
  ILLUSIONIST: { name: "Illusioniste", description: "Échange de position avec un personnage visible", type: "ACTIVE" },
  GRAPPLER: { name: "Lance-Grappin", description: "Se déplace jusqu'à un personnage visible", type: "ACTIVE" },
  MANIPULATOR: { name: "Manipulatrice", description: "Déplace un ennemi visible d'une case", type: "ACTIVE" },
  INNKEEPER: { name: "Tavernier", description: "Déplace un allié adjacent d'une case", type: "ACTIVE" },
  JAILER: { name: "Geôlier", description: "Les ennemis adjacents ne peuvent utiliser leur compétence", type: "PASSIVE" },
  PROTECTOR: { name: "Protecteur", description: "Protège les alliés adjacents des compétences ennemies", type: "PASSIVE" },
  ASSASSIN: { name: "Assassin", description: "Capture le Leader adverse seul", type: "PASSIVE" },
  ROYAL_GUARD: { name: "Garde Royal", description: "Se déplace près du Leader puis d'une case", type: "ACTIVE" },
  VIZIER: { name: "Vizir", description: "Votre Leader peut se déplacer d'une case supplémentaire", type: "PASSIVE" },
  NEMESIS: { name: "Némésis", description: "Se déplace automatiquement quand le Leader adverse bouge", type: "SPECIAL" },
  OLD_BEAR: { name: "Vieil Ours", description: "Vient avec son Ourson (2 pièces)", type: "SPECIAL" },
};

interface CharacterCard {
  id: string;
  characterId: string;
  name: string;
  description?: string;
  type?: "ACTIVE" | "PASSIVE" | "SPECIAL";
}

// === COMPOSANTS UI ===

// Carte de la rivière (Sidebar gauche)
function SidebarCard({
  card,
  onClick,
  onMouseEnter,
  disabled,
}: {
  card: CharacterCard;
  onClick: () => void;
  onMouseEnter: () => void;
  disabled: boolean;
}) {
  const icons: Record<string, string> = {
    ACTIVE: "⚡",
    PASSIVE: "🛡️",
    SPECIAL: "✨",
  };

  const charType = card.type || "ACTIVE";

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      onMouseEnter={onMouseEnter}
      className={`
        group relative p - 3 rounded - xl border transition - all duration - 300
        ${disabled
          ? "bg-slate-900/40 border-slate-800 opacity-50 cursor-not-allowed grayscale shadow-none"
          : "bg-slate-800/80 border-cyan-500/30 hover:border-cyan-400 hover:bg-slate-800 hover:shadow-[0_0_15px_rgba(0,245,255,0.2)] cursor-pointer"
        }
`}
    >
      {disabled && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-xl border border-white/5">
          <div className="flex flex-col items-center gap-1 opacity-40">
            <span className="text-[14px]">🔒</span>
            <span className="text-slate-400 font-bold text-[7px] tracking-[0.2em] uppercase">VERROUILLÉ</span>
          </div>
        </div>
      )}
      <div
        className={`absolute left - 0 top - 3 bottom - 3 w - 1 rounded - r bg - amber - 400`}
      />

      <div className="pl-3">
        <div className="flex justify-between items-start mb-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 relative bg-slate-900/50">
              {CHARACTER_IMAGES[card.characterId] ? (
                <img
                  src={CHARACTER_IMAGES[card.characterId]}
                  alt={card.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-xs">
                  {icons[charType]}
                </div>
              )}
            </div>
            <span className="text-white font-bold text-sm tracking-wide">
              {card.name}
            </span>
          </div>
        </div>
        <p className="text-slate-500 text-[10px] leading-relaxed group-hover:text-slate-400">
          {card.description || "Personnage du scénario"}
        </p>
      </div>
    </div>
  );
}

export default function Game({ gameId, sessionId, onBackToLobby }: { gameId: string; sessionId: string; onBackToLobby: () => void }) {
  const [gameState, setGameState] = useState<GameFrontend | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<PieceFrontend | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localPlayerIndex, setLocalPlayerIndex] = useState<number | null>(null);
  const [user, setUser] = useState<any>(null);
  const isLeavingRef = useRef(false);

  // Audio settings
  const [volume, setVolume] = useState(0); // 0% by default as requested
  const [sfxEnabled, setSfxEnabled] = useState(false);

  // Heartbeat while in game
  useEffect(() => {
    if (!sessionId) return;

    const interval = setInterval(() => {
      fetch(`/ api / sessions / ${sessionId}/heartbeat`, { method: 'POST' })
        .catch(err => console.error("Game heartbeat failed", err));
    }, 5000);

    return () => clearInterval(interval);
  }, [sessionId]);

  // Handle page refresh/close cleanup
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionId && user?.id && !isLeavingRef.current) {
        const url = `/api/sessions/${sessionId}/leave?userId=${user.id}`;
        navigator.sendBeacon(url);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sessionId, user?.id]);

  // Steps
  const [isRecruiting, setIsRecruiting] = useState(false);
  const [placementMode, setPlacementMode] = useState<{
    cardId: string;
    cardName: string;
  } | null>(null);

  // Scenario-specific targeting states
  const [manipulatorTarget, setManipulatorTarget] = useState<PieceFrontend | null>(null);
  const [brawlerTarget, setBrawlerTarget] = useState<PieceFrontend | null>(null);
  const [grapplerTarget, setGrapplerTarget] = useState<PieceFrontend | null>(null);
  const [grapplerMode, setGrapplerMode] = useState<"PULL" | "MOVE" | null>(null);
  const [showGrapplerModal, setShowGrapplerModal] = useState(false);
  const [innkeeperTarget, setInnkeeperTarget] = useState<PieceFrontend | null>(null);

  // Check if it's the local player's turn
  const isMyTurn = gameState && localPlayerIndex !== null && gameState.currentPlayerIndex === localPlayerIndex;

  // Sons
  const [playClick] = useSound(buttonClickSfx, { volume: volume / 100 });
  const [playCharacterSelectSfx] = useSound(characterSelectSfx, { volume: volume / 100 });

  const playButtonClickSfx = () => { if (sfxEnabled) playClick(); };
  const playButtonHoverSfx = () => { if (sfxEnabled && (volume > 0)) { /* logic for hover if needed */ } };

  useEffect(() => {
    const currentUser = authService.getUser();
    setUser(currentUser);
  }, []);

  const updateGameState = useCallback((game: any) => {
    const mappedGame = gameApi.mapGameToFrontend(game);
    setGameState(mappedGame);
    setIsLoading(false);

    if (game.players && game.players.length > 0) {
      const user = authService.getUser();
      if (user) {
        const localPlayer = game.players.find((p: any) => String(p.userId) === String(user.id));
        if (localPlayer !== undefined) {
          setLocalPlayerIndex(localPlayer.playerIndex);
        }
      }
    }


  }, []);

  useEffect(() => {
    if (!gameId) return;

    const loadGame = async (retries = 5) => {
      try {
        const game = await gameApi.getGameState(gameId);
        updateGameState(game);
        setError(null);
      } catch (e) {
        console.error("Failed to load game", e);
        if (retries > 0) {
          setTimeout(() => loadGame(retries - 1), 1000);
        } else {
          setError("Impossible de charger la partie");
          setIsLoading(false);
        }
      }
    };

    loadGame();

    if (webSocketService.isConnected()) {
      webSocketService.subscribeToGame(gameId, (data) => {
        updateGameState(data);
      });
    }

    const interval = setInterval(async () => {
      try {
        const game = await gameApi.getGameState(gameId);
        updateGameState(game);
      } catch (e) {
        console.error("Polling error", e);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [gameId, updateGameState]);

  useEffect(() => {
    if (grapplerTarget && !grapplerMode) {
      setShowGrapplerModal(true);
    }
  }, [grapplerTarget, grapplerMode]);

  const spawnCells = useMemo(() => {
    if (!gameState) return [];
    // P0 (Bleu) est maintenant en BAS -> Spawn zones du BAS (q négatif, r positif)
    // P1 (Rouge) est maintenant en HAUT -> Spawn zones du HAUT (q positif, r négatif)
    return gameState.currentPlayerIndex === 0
      ? [{ q: -3, r: 2 }, { q: -2, r: 3 }, { q: -3, r: 3 }]
      : [{ q: 3, r: -2 }, { q: 2, r: -3 }, { q: 3, r: -3 }];
  }, [gameState?.currentPlayerIndex]);

  const availableSpawnCells = useMemo(() => {
    if (!gameState) return [];
    return spawnCells.filter(
      (cell) => !gameState.pieces.find((p) => p.q === cell.q && p.r === cell.r),
    );
  }, [gameState, spawnCells]);

  const currentPlayerPieceCount = useMemo(() => {
    if (!gameState) return 0;
    return gameState.pieces.filter((p) => p.ownerIndex === gameState.currentPlayerIndex).length;
  }, [gameState]);

  const canRecruit = useMemo(() => {
    const piecesOk = currentPlayerPieceCount < 5;

    // Si la propriété est absente (backend non redémarré), on utilise 'false' 
    // par défaut pour ne pas bloquer l'utilisateur.
    if (gameState && gameState.hasRecruitedThisTurn === undefined) {
      console.warn("DEBUG: gameState.hasRecruitedThisTurn is UNDEFINED. Make sure to restart the backend.");
    }

    const recruited = gameState?.hasRecruitedThisTurn === true;
    return piecesOk && !recruited;
  }, [currentPlayerPieceCount, gameState?.hasRecruitedThisTurn]);
  const hasAvailableSpawnCells = useMemo(() => availableSpawnCells.length > 0, [availableSpawnCells]);

  const allPiecesActed = useMemo(() => {
    if (!gameState || localPlayerIndex === null) return false;
    const myPieces = gameState.pieces.filter(p => p.ownerIndex === localPlayerIndex);
    if (myPieces.length === 0) return false;
    return myPieces.every(p => p.hasActed);
  }, [gameState?.pieces, localPlayerIndex]);

  const allActionsCompleted = useMemo(() => {
    return isMyTurn && allPiecesActed && (!canRecruit || !hasAvailableSpawnCells);
  }, [isMyTurn, allPiecesActed, canRecruit, hasAvailableSpawnCells]);

  const hexDistance = (q1: number, r1: number, q2: number, r2: number): number => {
    return (Math.abs(q1 - q2) + Math.abs(q1 + r1 - q2 - r2) + Math.abs(r1 - r2)) / 2;
  };

  const detectAbilityMove = (piece: PieceFrontend, toQ: number, toR: number): string | null => {
    const dist = hexDistance(piece.q, piece.r, toQ, toR);
    if (dist <= 1) return null;
    if (dist === 2) {
      if (piece.characterId === "ACROBAT") return "ACROBAT_JUMP";
      if (piece.characterId === "CAVALRY") return "CAVALRY_CHARGE";
    }
    if (piece.characterId === "PROWLER") return "PROWLER_STEALTH";
    return null;
  };

  const autoEndTurnIfNeeded = useCallback(
    async (updatedGame: GameFrontend) => {
      const currentPieces = updatedGame.pieces.filter((p) => p.ownerIndex === updatedGame.currentPlayerIndex);
      const piecesRemaining = currentPieces.filter((p) => !p.hasActed);

      if (piecesRemaining.length === 0) {
        // Automatically end turn if no pieces are left AND no recruitment is possible
        if (!canRecruit || !hasAvailableSpawnCells) {
          await gameApi.endTurn(gameId);
          const newGame = await gameApi.getGameState(gameId);
          updateGameState(newGame);
        }
      }
    },
    [gameId, updateGameState],
  );

  const handleMove = useCallback(
    async (pieceId: string, toQ: number, toR: number) => {
      try {
        const piece = gameState?.pieces.find((p) => p.id === pieceId);
        if (!piece) return;

        const abilityId = detectAbilityMove(piece, toQ, toR);
        if (abilityId) {
          let targetId: string | undefined = undefined;
          if (abilityId === "ACROBAT_JUMP") {
            const midQ = piece.q + (toQ - piece.q) / 2;
            const midR = piece.r + (toR - piece.r) / 2;
            const targetPiece = gameState?.pieces.find((p) => p.q === midQ && p.r === midR);
            if (!targetPiece) {
              alert("Impossible de sauter : aucune pièce à survoler !");
              return;
            }
            targetId = targetPiece.id;
          }
          await gameApi.useAbility(gameId, pieceId, abilityId, targetId, { q: toQ, r: toR });
        } else {
          await gameApi.movePiece(pieceId, toQ, toR);
        }

        const game = await gameApi.getGameState(gameId);
        updateGameState(game);
        setSelectedPiece(null);
        setManipulatorTarget(null);
        setBrawlerTarget(null);
        setGrapplerTarget(null);
        setGrapplerMode(null);
        setInnkeeperTarget(null);

        const mappedGame = gameApi.mapGameToFrontend(game);
        await autoEndTurnIfNeeded(mappedGame);
      } catch (err) {
        console.error("Move error:", err);
      }
    },
    [gameId, gameState, autoEndTurnIfNeeded, updateGameState],
  );

  const handleAbilityUse = useCallback(
    async (pieceId: string, abilityId: string, targetId?: string, destination?: { q: number; r: number }) => {
      try {
        await gameApi.useAbility(gameId, pieceId, abilityId, targetId, destination);
        const game = await gameApi.getGameState(gameId);
        const mappedGame = gameApi.mapGameToFrontend(game);
        setGameState(mappedGame);
        setSelectedPiece(null);
        setManipulatorTarget(null);
        setBrawlerTarget(null);
        setGrapplerTarget(null);
        setGrapplerMode(null);
        setInnkeeperTarget(null);
        await autoEndTurnIfNeeded(mappedGame);
      } catch (err) {
        console.error("Ability error:", err);
      }
    },
    [gameId, autoEndTurnIfNeeded],
  );

  const handleGrapplerModeChoice = (mode: "PULL" | "MOVE") => {
    setGrapplerMode(mode);
    setShowGrapplerModal(false);
    playButtonClickSfx();
  };

  const handleRecruit = useCallback(
    (cardId: string) => {
      if (!gameState) return;
      if (isRecruiting) return;
      if (gameState.hasRecruitedThisTurn) {
        alert("Action impossible: Vous avez déjà recruté une unité ce tour-ci.");
        return;
      }
      if (currentPlayerPieceCount >= 5) {
        alert("Limite atteinte: Vous ne pouvez pas avoir plus de 5 personnages");
        return;
      }
      if (!hasAvailableSpawnCells) {
        alert("Aucune case de spawn disponible !");
        return;
      }

      const card = gameState.river?.find((c) => c.id === cardId);
      if (!card) return;
      const cardName = CHARACTER_NAMES[card.characterId] || card.characterId;

      playCharacterSelectSfx();
      setPlacementMode({ cardId, cardName });
    },
    [gameState, isRecruiting, currentPlayerPieceCount, hasAvailableSpawnCells, playCharacterSelectSfx],
  );

  const confirmPlacement = useCallback(
    async (q: number, r: number) => {
      if (!gameState || !placementMode) return;
      try {
        setIsRecruiting(true);
        await gameApi.recruitCharacter(gameId, placementMode.cardId, [{ q, r }]);
        const game = await gameApi.getGameState(gameId);
        updateGameState(game);
      } catch (err) {
        console.error("Recruitment error:", err);
      } finally {
        setIsRecruiting(false);
        setPlacementMode(null);
      }
    },
    [gameState, gameId, placementMode, updateGameState],
  );

  const handleEndTurn = useCallback(async () => {
    try {
      playButtonClickSfx();
      await gameApi.endTurn(gameId);
      const game = await gameApi.getGameState(gameId);
      updateGameState(game);
    } catch (err) {
      console.error("End turn error:", err);
    }
  }, [playButtonClickSfx, canRecruit, hasAvailableSpawnCells, gameId, updateGameState]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-[#020617] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">⏳</div>
          <p className="text-xl font-orbitron tracking-wider">CHARGEMENT DE LA PARTIE...</p>
        </div>
      </div>
    );
  }

  if (error || !gameState) {
    return (
      <div className="h-screen w-screen bg-[#020617] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-xl text-red-500 mb-4">{error || "Partie introuvable"}</p>
          <button onClick={onBackToLobby} className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-bold">RETOUR AU LOBBY</button>
        </div>
      </div>
    );
  }

  if (gameState.status === "FINISHED_CAPTURE" || gameState.status === "FINISHED" || (gameState.winnerPlayerIndex !== undefined && gameState.winnerPlayerIndex !== null)) {
    const winnerIndex = gameState.winnerPlayerIndex ?? 0;
    const loserIndex = winnerIndex === 0 ? 1 : 0;
    const winnerPieces = gameState.pieces.filter((p) => p.ownerIndex === winnerIndex);
    const loserPieces = gameState.pieces.filter((p) => p.ownerIndex === loserIndex);
    const victoryType = gameState.winnerVictoryType || (gameState.status === "FINISHED_CAPTURE" ? "CAPTURE" : "ENCIRCLEMENT");

    return (
      <VictoryScreen
        winner={winnerIndex as 0 | 1}
        victoryType={victoryType as any}
        onPlayAgain={() => window.location.reload()}
        onBackToLobby={onBackToLobby}
        turnNumber={gameState.turnNumber}
        winnerPieceCount={winnerPieces.length}
        loserPieceCount={loserPieces.length}
      />
    );
  }

  const riverCards: CharacterCard[] = (gameState.river || [])
    .filter((c) => c.state === "VISIBLE")
    .filter((c) => c.characterId !== "LEADER")
    .sort((a, b) => (a.visibleSlot || 0) - (b.visibleSlot || 0))
    .map((c) => ({
      id: c.id,
      characterId: c.characterId,
      name: CHARACTER_NAMES[c.characterId] || c.characterId,
      description: CHARACTER_DATA[c.characterId]?.description,
      type: CHARACTER_DATA[c.characterId]?.type
    }));

  const activeTarget = manipulatorTarget || brawlerTarget || innkeeperTarget || (grapplerTarget && grapplerMode === "MOVE" ? grapplerTarget : null);
  const activeTargetName = activeTarget ? CHARACTER_NAMES[activeTarget.characterId] || activeTarget.characterId : "";

  return (
    <div className="h-screen w-screen bg-[#020617] text-white font-mono flex overflow-hidden relative selection:bg-cyan-500 selection:text-black">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/20 via-[#020617] to-[#020617] pointer-events-none" />
      <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-cyan-500 rounded-tl-lg pointer-events-none drop-shadow-[0_0_8px_rgba(0,245,255,0.8)]" />
      <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-cyan-500 rounded-tr-lg pointer-events-none drop-shadow-[0_0_8px_rgba(0,245,255,0.8)]" />
      <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-cyan-500 rounded-bl-lg pointer-events-none drop-shadow-[0_0_8px_rgba(0,245,255,0.8)]" />
      <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-cyan-500 rounded-br-lg pointer-events-none drop-shadow-[0_0_8px_rgba(0,245,255,0.8)]" />

      {/* HEADER */}
      <div className="absolute top-0 left-0 right-0 h-24 z-20 flex items-center justify-center pointer-events-none">
        <div className="relative flex items-center gap-8 bg-slate-950/80 backdrop-blur-xl px-16 py-4 rounded-b-[2rem] border-x border-b border-cyan-500/20 shadow-[0_0_40px_rgba(0,245,255,0.15)] pointer-events-auto">
          <div className="flex items-center gap-4">
            <span className="text-2xl">💠</span>
            <h1 className="font-cyber text-5xl font-bold italic tracking-[0.1em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-cyan-100 to-cyan-300">
              {isMyTurn ? "VOTRE TOUR" : "TOUR ADVERSE"}
            </h1>
          </div>
          <div className="flex items-center gap-6 text-xs font-bold uppercase tracking-widest">
            <span className="text-slate-500">TOUR <span className="text-cyan-50 text-base ml-1">{gameState.turnNumber}</span></span>
            <div className={`px-6 py-2 rounded-full border shadow-[0_0_15px_inset] transition-all duration-300 ${gameState.currentPlayerIndex === 0 ? "border-cyan-500 text-cyan-400 bg-cyan-950/30" : "border-rose-500 text-rose-400 bg-rose-950/30"}`}>
              JOUEUR {gameState.currentPlayerIndex + 1} {gameState.currentPlayerIndex === localPlayerIndex ? "(VOUS)" : ""}
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {placementMode && (
        <div className="absolute top-32 left-1/2 transform -translate-x-1/2 z-40 px-8 py-4 bg-amber-950/90 backdrop-blur-xl border-2 border-amber-500/50 rounded-2xl animate-pulse">
          <p className="text-amber-400 font-bold text-sm uppercase tracking-wider">📍 Placez {placementMode.cardName} sur une case dorée</p>
          <button onClick={() => setPlacementMode(null)} className="mt-3 w-full px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold">✖ ANNULER</button>
        </div>
      )}

      {activeTarget && !showGrapplerModal && (
        <div className="absolute top-32 left-1/2 transform -translate-x-1/2 z-40 px-8 py-4 bg-slate-900/90 backdrop-blur-xl border-2 border-cyan-500/50 rounded-2xl animate-pulse">
          <p className="text-cyan-400 font-bold text-sm uppercase tracking-wider">🎯 {activeTargetName}: Choisissez la destination</p>
          <button onClick={() => { setManipulatorTarget(null); setBrawlerTarget(null); setGrapplerTarget(null); setInnkeeperTarget(null); }} className="mt-3 w-full px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold">✖ ANNULER</button>
        </div>
      )}

      {showGrapplerModal && grapplerTarget && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900/95 border-2 border-cyan-500/50 rounded-2xl p-8 max-w-md">
            <h3 className="text-cyan-400 font-bold text-xl uppercase tracking-wider text-center mb-6">🪝 Lance-Grappin</h3>
            <div className="flex flex-col gap-4">
              <button onClick={() => handleGrapplerModeChoice("PULL")} className="px-6 py-4 bg-cyan-600/20 text-cyan-400 border border-cyan-500/50 rounded-xl hover:bg-cyan-500 hover:text-white transition-all font-bold">🎣 ATTIRER</button>
              <button onClick={() => handleGrapplerModeChoice("MOVE")} className="px-6 py-4 bg-emerald-600/20 text-emerald-400 border border-emerald-500/50 rounded-xl hover:bg-emerald-500 hover:text-white transition-all font-bold">🏃 SE DÉPLACER</button>
              <button onClick={() => { setShowGrapplerModal(false); setGrapplerTarget(null); }} className="px-6 py-3 bg-slate-800 rounded-xl font-bold">✖ ANNULER</button>
            </div>
          </div>
        </div>
      )}

      {/* RIVIÈRE */}
      <div className="absolute top-24 left-10 w-72 h-[calc(100vh-12rem)] flex flex-col gap-5 z-10">
        <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-white/5">
          <h2 className="font-cyber font-bold text-xl text-white mb-2 underline decoration-cyan-500 py-1">RIVIÈRE</h2>
          <p className="text-[10px] text-slate-500 uppercase">Unités: {currentPlayerPieceCount}/5 | Cases: {availableSpawnCells.length}/3</p>
          {isMyTurn && (
            <div className="mt-2 flex flex-col gap-1">
              {(!canRecruit || !hasAvailableSpawnCells) ? (
                <p className="text-[10px] text-rose-500 font-bold uppercase tracking-tighter shadow-sm">⚠️ RECRUTEMENT TERMINÉ</p>
              ) : (
                <p className="text-[10px] text-amber-500 animate-pulse uppercase tracking-tighter">UNITÉS DISPONIBLES</p>
              )}
              {allPiecesActed ? (
                <p className="text-[10px] text-rose-500 font-bold uppercase tracking-tighter shadow-sm">⚠️ MOUVEMENTS TERMINÉS</p>
              ) : (
                <p className="text-[10px] text-cyan-500 animate-pulse uppercase tracking-tighter">MOUVEMENTS DISPONIBLES</p>
              )}
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-cyan-500/20">
          {riverCards.map((card) => (
            <SidebarCard
              key={card.id}
              card={card}
              onClick={() => handleRecruit(card.id)}
              onMouseEnter={() => { }}
              disabled={!isMyTurn || isRecruiting || !!placementMode || !canRecruit || !hasAvailableSpawnCells}
            />
          ))}
        </div>
      </div>

      {/* HEXBOARD */}
      <div className="flex-1 flex items-center justify-center p-20">
        <HexBoard
          pieces={gameState.pieces}
          currentPlayer={gameState.currentPlayerIndex}
          phase={"ACTIONS" as "ACTIONS" | "RECRUITMENT"}
          turnNumber={gameState.turnNumber}
          onMove={handleMove}
          selectedPiece={selectedPiece}
          onSelectPiece={setSelectedPiece}
          placementMode={placementMode}
          availablePlacementCells={availableSpawnCells}
          onPlacementConfirm={confirmPlacement}
          onAbilityUse={handleAbilityUse}
          manipulatorTarget={manipulatorTarget}
          onManipulatorTargetSelect={setManipulatorTarget}
          brawlerTarget={brawlerTarget}
          onBrawlerTargetSelect={setBrawlerTarget}
          grapplerTarget={grapplerTarget}
          onGrapplerTargetSelect={setGrapplerTarget}
          grapplerMode={grapplerMode}
          onGrapplerModeSelect={setGrapplerMode}
          innkeeperTarget={innkeeperTarget}
          onInnkeeperTargetSelect={setInnkeeperTarget}
          isLocalTurn={!!isMyTurn}
          volume={volume}
        />
      </div>

      {/* SIDEBAR RIGHT: SCANNER */}
      <div className="absolute top-24 right-10 w-72 h-[72] z-10">
        <div className={`h-full w-full rounded-2xl border p-6 bg-slate-900/40 backdrop-blur-sm transition-all ${selectedPiece ? "border-amber-500/50" : "border-white/10"}`}>
          {selectedPiece ? (
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-amber-500/50 mb-4 bg-slate-900/80">
                {CHARACTER_IMAGES[selectedPiece.characterId] ? (
                  <img src={CHARACTER_IMAGES[selectedPiece.characterId]} alt={selectedPiece.characterId} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">{selectedPiece.characterId === "LEADER" ? "👑" : "⚔️"}</div>
                )}
              </div>
              <h3 className="font-cyber text-2xl font-bold text-amber-400 mb-2">{CHARACTER_NAMES[selectedPiece.characterId] || selectedPiece.characterId}</h3>
              <p className="text-[11px] text-slate-300 mb-3 text-center leading-tight px-2 italic">
                "{CHARACTER_DATA[selectedPiece.characterId]?.description || "Aucune description"}"
              </p>
              <p className="text-[10px] text-slate-500 mb-4 tracking-widest uppercase">COORD: [{selectedPiece.q}, {selectedPiece.r}]</p>
              <div className={`px-4 py-1 rounded-full border text-[10px] font-bold ${selectedPiece.hasActed ? "border-rose-500/30 text-rose-400" : "border-emerald-500/30 text-emerald-400"}`}>
                {selectedPiece.hasActed ? "ÉPUISÉ" : "PRÊT"}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full opacity-30">
              <span className="text-4xl mb-4">⌖</span>
              <p className="font-cyber text-xs tracking-widest">SCANNER ACTIF</p>
            </div>
          )}
        </div>
      </div>

      {/* ACTION BAR */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-20 flex gap-4">
        {isMyTurn && (
          <button
            onClick={handleEndTurn}
            className={`
              px-10 py-4 font-bold rounded-2xl shadow-xl transition-all uppercase tracking-widest text-lg border-2
              ${allActionsCompleted
                ? "bg-amber-600 border-amber-400 text-white animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.4)] scale-110"
                : "bg-cyan-600 border-cyan-400/50 text-white hover:bg-cyan-500"
              }
            `}
          >
            Terminer le tour
          </button>
        )}
        <button
          onClick={() => {
            isLeavingRef.current = true;
            onBackToLobby();
            playButtonClickSfx();
          }}
          className="px-8 py-3 bg-rose-900/40 border border-rose-500/50 text-rose-500 font-bold rounded-xl hover:bg-rose-500 hover:text-white transition-all uppercase tracking-widest"
        >
          Quitter
        </button>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@300;400;500;600;700&display=swap');
        .font-cyber { font-family: 'Chakra Petch', sans-serif; }
      `}</style>
    </div>
  );
}
