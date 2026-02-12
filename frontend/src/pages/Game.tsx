import type { GameFrontend, PieceFrontend } from "../api/gameApi";
import { gameApi } from "../api/gameApi";
import ChatPanel from '../components/ChatPanel';
import { authService } from "../services/auth.service";
import { webSocketService } from "../services/WebSocketService";
import RankBadge from "../components/RankBadge";
import HexBoard from "../components/HexBoard";
import GameBackground from "../components/GameBackground";
import RulesModal from "../components/RulesModal";
import { BookOpen, Volume2, VolumeX } from "lucide-react";


import VictoryScreen from "../components/VictoryScreen";
import MoveHistory from "../components/MoveHistory";
import useSound from "use-sound";

// Sons
import buttonClickSfx from "../sounds/buttonClick.mp3";
import characterSelectSfx from "../sounds/characterSelect.mp3";
import mainMusic from "../sounds/mainMenu.mp3";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";


import { CHARACTER_IMAGES, CHARACTER_NAMES, CHARACTER_DATA } from "../constants/characters";

interface CharacterCard {
  id: string;
  characterId: string;
  name: string;
  description?: string;
  type?: "ACTIVE" | "PASSIVE" | "SPECIAL";
}

// === COMPOSANTS UI ===

// Carte de la rivière (Sidebar gauche) - Redesign "Data Slate"
function SidebarCard({
  card,
  onClick,
  onMouseEnter,
  disabled,
  mini = false,
}: {
  card: CharacterCard;
  onClick: () => void;
  onMouseEnter: () => void;
  disabled: boolean;
  mini?: boolean;
}) {
  const charType = card.type || "ACTIVE";

  const charTypeLabel = {
    ACTIVE: "ACTIVE",
    PASSIVE: "PASSIVE",
    SPECIAL: "SPÉCIAL"
  }[charType] || charType;

  const theme = {
    ACTIVE: { accent: "cyan", text: "text-cyan-400", border: "border-cyan-500/50", badge: "bg-cyan-500/20", icon: "⚡" },
    PASSIVE: { accent: "amber", text: "text-amber-400", border: "border-amber-500/50", badge: "bg-amber-500/20", icon: "🛡️" },
    SPECIAL: { accent: "purple", text: "text-purple-400", border: "border-purple-500/50", badge: "bg-purple-500/20", icon: "✨" }
  }[charType];

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      onMouseEnter={onMouseEnter}
      className={`
        relative transition-all duration-200 
        ${mini
          ? "w-16 h-18 p-1 bg-slate-900 border-l-2"
          : "w-full p-3 bg-slate-950/90 border-t border-b border-r border-white/5 border-l-4"
        }
        ${disabled
          ? "border-slate-800 opacity-30 cursor-not-allowed grayscale bg-slate-900/40"
          : `${theme.border} cursor-pointer hover:bg-slate-900 shadow-xl group`
        }
      `}
    >
      {/* Static Diagonal Hatch for Locked */}
      {disabled && (
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000, #000 2px, transparent 2px, transparent 10px)' }} />
      )}

      {/* Content */}
      <div className={`flex ${mini ? "flex-col items-center" : "gap-5 items-center"} relative z-10`}>
        {/* Avatar Section */}
        <div className={`
           relative shrink-0 border-2 bg-slate-950 shadow-inner
           ${mini ? "w-10 h-10 mb-1 rounded" : "w-14 h-14 md:w-20 md:h-20 rounded"}
           ${disabled ? "border-slate-800" : "border-white/10 group-hover:border-white/30"}
        `}>
          {CHARACTER_IMAGES[card.characterId] ? (
            <img
              src={CHARACTER_IMAGES[card.characterId]}
              alt={card.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center bg-slate-900 text-xl text-slate-700`}>
              {theme.icon}
            </div>
          )}

          {/* Static Corner Ornament */}
          {!disabled && !mini && (
            <div className={`absolute top-0 right-0 w-3 h-3 ${theme.badge} border-b border-l border-white/20`} />
          )}
        </div>

        {/* Text Section */}
        {!mini ? (
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex justify-between items-start mb-1">
              <h3 className={`font-cyber text-lg font-black uppercase tracking-wider transition-colors ${disabled ? "text-slate-600" : "text-white group-hover:" + theme.text}`}>
                {card.name}
              </h3>
              <div className={`px-2 py-0.5 rounded text-[7px] font-mono font-bold tracking-widest border ${disabled ? "border-slate-800 text-slate-700" : theme.border + " " + theme.text}`}>
                {charTypeLabel}
              </div>
            </div>

            <p className="text-[10px] text-slate-500 font-medium leading-tight font-mono line-clamp-2 italic uppercase opacity-70">
              // {card.description || "DONNÉES_CHIFFRÉES"}
            </p>

            {/* Industrial Data Bar */}
            {!disabled && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-0.5 bg-slate-900 flex gap-0.5">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className={`h-full flex-1 ${i < 2 ? 'bg-cyan-500/40' : 'bg-slate-800'}`} />
                  ))}
                </div>
                <span className="text-[6px] font-mono text-slate-700">PRÊT</span>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full text-center">
            <span className={`text-[8px] font-black font-cyber ${disabled ? "text-slate-700" : "text-white"} uppercase truncate block`}>
              {card.name}
            </span>
          </div>
        )}
      </div>

      {/* Industrial Rivets (Decorative) */}
      {!mini && (
        <>
          <div className="absolute top-2 left-2 w-1 h-1 rounded-full bg-white/5 shadow-inner" />
          <div className="absolute bottom-2 right-2 w-1 h-1 rounded-full bg-white/5 shadow-inner" />
        </>
      )}
    </div>
  );
}


export default function Game({ gameId, sessionId: propSessionId, onBackToLobby }: { gameId: string; sessionId?: string; onBackToLobby: () => void }) {
  const sessionId = propSessionId || gameId;
  const [gameState, setGameState] = useState<GameFrontend | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<PieceFrontend | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSurrenderModal, setShowSurrenderModal] = useState(false);
  const [showVictoryScreen, setShowVictoryScreen] = useState(false); // 🆕 Delay state
  const [error, setError] = useState<string | null>(null);
  const [localPlayerIndex, setLocalPlayerIndex] = useState<number | null>(null);
  const [user, setUser] = useState<any>(null);
  const isLeavingRef = useRef(false);

  // Audio settings
  const [volume] = useState(0.3); // 30% volume for music
  const [sfxEnabled] = useState(true);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  // === GESTION DES MODES D'ACTION (Move vs Ability) ===
  const [actionMode, setActionMode] = useState<"MOVE" | "ABILITY">("MOVE");

  // === GESTION DU TIMER ===
  const [timeP0, setTimeP0] = useState<number>(300);
  const [timeP1, setTimeP1] = useState<number>(300);

  // Reset du mode et des cibles quand on change de pièce (Bug Fix Sync UI)
  useEffect(() => {
    setActionMode("MOVE");
    setManipulatorTarget(null);
    setBrawlerTarget(null);
    setGrapplerTarget(null);
    setGrapplerMode(null);
    setInnkeeperTarget(null);
    setShowGrapplerModal(false);
  }, [selectedPiece]);

  // Détermine si la pièce sélectionnée a une capacité ACTIVE qui nécessite un ciblage
  const hasActiveAbility = useMemo(() => {
    if (!selectedPiece) return false;
    const charId = selectedPiece.characterId;
    return ["BRAWLER", "MANIPULATOR", "GRAPPLER", "INNKEEPER", "ILLUSIONIST", "ACROBAT", "CAVALRY", "PROWLER", "ROYAL_GUARD"].includes(charId);
  }, [selectedPiece]);

  // Music Hook
  const [playMusic, { stop: stopMusic }] = useSound(mainMusic, {
    volume: volume,
    loop: true,
    interrupt: false,
  });

  // Toggle Music
  const toggleMusic = () => {
    if (isMusicPlaying) {
      stopMusic();
      setIsMusicPlaying(false);
    } else {
      playMusic();
      setIsMusicPlaying(true);
    }
    playButtonClickSfx();
  };

  // Start music automatically (if interaction allowed, otherwise user must toggle)
  useEffect(() => {
    // Optional: Auto-start if desired, but often blocked by browser. 
    // We'll let the user decide or start if they interacted previously.
    // For now, let's keep it manual or try auto-play with catch.
    // playMusic(); setIsMusicPlaying(true); // Commented out to be safe
  }, [playMusic]);

  // Heartbeat while in game
  useEffect(() => {
    if (!sessionId) return;

    const interval = setInterval(() => {
      fetch(`/api/sessions/${sessionId}/heartbeat`, { method: "POST" })
        .catch((err) => console.warn("Game heartbeat failed", err));
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
    placements: { q: number; r: number }[];
    characterId?: string;
  } | null>(null);

  // Scenario-specific targeting states
  const [manipulatorTarget, setManipulatorTarget] = useState<PieceFrontend | null>(null);
  const [brawlerTarget, setBrawlerTarget] = useState<PieceFrontend | null>(null);
  const [grapplerTarget, setGrapplerTarget] = useState<PieceFrontend | null>(null);
  const [grapplerMode, setGrapplerMode] = useState<"PULL" | "MOVE" | null>(null);
  const [showGrapplerModal, setShowGrapplerModal] = useState(false);
  const [innkeeperTarget, setInnkeeperTarget] = useState<PieceFrontend | null>(null);
  const [showRules, setShowRules] = useState(false);

  // Check if it's the local player's turn
  const isMyTurn = gameState && localPlayerIndex !== null && gameState.currentPlayerIndex === localPlayerIndex;

  // Sons
  const [playClick] = useSound(buttonClickSfx, { volume: volume / 100 });
  const [playCharacterSelectSfx] = useSound(characterSelectSfx, { volume: volume / 100 });

  const playButtonClickSfx = () => { if (sfxEnabled) playClick(); };

  useEffect(() => {
    const currentUser = authService.getUser();
    setUser(currentUser);
  }, []);

  // Game Over Delay Logic
  useEffect(() => {
    if (gameState?.status === "FINISHED" || gameState?.status === "FINISHED_CAPTURE" || (gameState?.winnerPlayerIndex !== undefined && gameState?.winnerPlayerIndex !== null)) {
      const timer = setTimeout(() => {
        setShowVictoryScreen(true);
      }, 1000); // 1 second delay
      return () => clearTimeout(timer);
    } else {
      setShowVictoryScreen(false);
    }
  }, [gameState?.status, gameState?.winnerPlayerIndex]);

  const updateGameState = useCallback((game: any) => {
    const mappedGame = gameApi.mapGameToFrontend(game);
    setGameState(mappedGame);
    setIsLoading(false);

    // Sync timers from backend
    if (game.remainingTimeP0 !== undefined) setTimeP0(game.remainingTimeP0);
    if (game.remainingTimeP1 !== undefined) setTimeP1(game.remainingTimeP1);

    if (mappedGame.players && mappedGame.players.length > 0) {
      const u = authService.getUser();
      if (u) {
        const localPlayer = mappedGame.players.find((p: any) => String(p.userId) === String(u.id));
        if (localPlayer !== undefined) {
          setLocalPlayerIndex(localPlayer.playerIndex);
        }
      }
    }
  }, []);

  // Countdown logic
  useEffect(() => {
    if (!gameState || gameState.status !== "IN_PROGRESS") return;

    // 🛑 Désactiver le timer pour les parties VS AI
    const isAiGame = gameState.players.some(p => p.userId === "00000000-0000-0000-0000-000000000000" || !p.userId);
    if (isAiGame) return;

    const timer = setInterval(() => {
      if (gameState.currentPlayerIndex === 0) {
        setTimeP0(prev => Math.max(0, prev - 1));
      } else {
        setTimeP1(prev => Math.max(0, prev - 1));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState?.currentPlayerIndex, gameState?.status, gameState?.players]);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

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

  const handleSurrender = async () => {
    // On récupère l'ID joueur. Priorité au user object (auth/guest).
    const currentUser = user || authService.getUser();
    const playerId = currentUser?.id || sessionId;

    if (!playerId) {
      console.error("Surrender aborted: No playerId found");
      return;
    }

    try {
      // isLeavingRef.current = true; // 🛑 Don't set leaving=true on surrender, we want to see the defeat screen
      await gameApi.surrender(gameId, playerId);
      setShowSurrenderModal(false);
      // onBackToLobby(); // 🛑 Don't redirect immediately. Wait for gameState update -> FINISHED -> VictoryScreen
    } catch (e) {
      console.error("Surrender failed", e);
      setError("Échec de l'abandon (Vérifiez votre connexion)");
    }
  };

  useEffect(() => {
    if (grapplerTarget && !grapplerMode) {
      setShowGrapplerModal(true);
    }
  }, [grapplerTarget, grapplerMode]);

  const spawnCells = useMemo(() => {
    if (!gameState) return [];

    // Définition : Les 2 bordures qui se rejoignent au spawn du leader (V-shape, 7 cases)
    // P0 (Bas/Bleu) : Leader (0,3). Bordures r=3 (q in 0..-3) et q+r=3 (q in 0..3)
    // P1 (Haut/Rouge) : Leader (0,-3). Bordures r=-3 (q in 0..3) et q+r=-3 (q in 0..-3)

    if (gameState.currentPlayerIndex === 0) {
      return [
        { q: 0, r: 3 }, { q: -1, r: 3 }, { q: -2, r: 3 }, { q: -3, r: 3 },
        { q: 1, r: 2 }, { q: 2, r: 1 }, { q: 3, r: 0 }
      ];
    } else {
      return [
        { q: 0, r: -3 }, { q: 1, r: -3 }, { q: 2, r: -3 }, { q: 3, r: -3 },
        { q: -1, r: -2 }, { q: -2, r: -1 }, { q: -3, r: 0 }
      ];
    }
  }, [gameState?.currentPlayerIndex]);

  const availableSpawnCells = useMemo(() => {
    if (!gameState) return [];

    // Filter out occupied cells
    let available = spawnCells.filter(
      (cell) => !gameState.pieces.find((p) => p.q === cell.q && p.r === cell.r),
    );

    // If placing 2nd unit of OLD_BEAR, calculate available based on remaining
    if (placementMode?.characterId === "OLD_BEAR" && placementMode.placements.length > 0) {
      // Filter out the first placed cell too
      available = available.filter(cell =>
        !placementMode.placements.some(p => p.q === cell.q && p.r === cell.r)
      );
    }

    return available;
  }, [gameState, spawnCells, placementMode]);

  const currentPlayerPieceCount = useMemo(() => {
    if (!gameState || localPlayerIndex === null) return 0;
    return gameState.pieces.filter(
      (p) => p.ownerIndex === localPlayerIndex &&
        p.characterId !== "LEADER" &&
        p.characterId !== "CUB"
    ).length;
  }, [gameState, localPlayerIndex]);


  const allPiecesActed = useMemo(() => {
    if (!gameState || localPlayerIndex === null) return false;
    const myPieces = gameState.pieces.filter(p => p.ownerIndex === localPlayerIndex && p.characterId !== "NEMESIS");
    if (myPieces.length === 0) return true;

    // Règle Spéciale : Duo Ours/Ourson
    const bears = myPieces.filter(p => p.characterId === "OLD_BEAR" || p.characterId === "CUB");
    const others = myPieces.filter(p => p.characterId !== "OLD_BEAR" && p.characterId !== "CUB");

    const othersActed = others.every(p => p.hasActed);
    if (bears.length > 0) {
      // Au moins l'un des deux doit avoir agi
      return othersActed && bears.some(p => p.hasActed);
    }

    return othersActed;
  }, [gameState?.pieces, localPlayerIndex]);

  const canRecruit = useMemo(() => {
    const piecesOk = currentPlayerPieceCount < 4;

    // Si la propriété est absente (backend non redémarré), on utilise 'false' 
    // par défaut pour ne pas bloquer l'utilisateur.
    if (gameState && gameState.hasRecruitedThisTurn === undefined) {
      console.warn("DEBUG: gameState.hasRecruitedThisTurn is UNDEFINED. Make sure to restart the backend.");
    }

    const recruited = gameState?.hasRecruitedThisTurn === true;
    return piecesOk && !recruited && allPiecesActed;
  }, [currentPlayerPieceCount, gameState?.hasRecruitedThisTurn, allPiecesActed]);

  const hasAvailableSpawnCells = useMemo(() => availableSpawnCells.length > 0, [availableSpawnCells]);

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



  const handleMove = useCallback(
    async (pieceId: string, toQ: number, toR: number) => {
      const currentUser = user || authService.getUser();
      const playerId = currentUser?.id || sessionId;
      try {
        if (gameState?.status !== "IN_PROGRESS") return;
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
          await gameApi.useAbility(gameId, pieceId, abilityId, targetId, { q: toQ, r: toR }, undefined, playerId);
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
      } catch (err: any) {
        console.error("Move error:", err);
        alert("Erreur de déplacement: " + (err.message || err));
      }
    },
    [gameId, gameState, updateGameState],
  );

  const handleAbilityUse = useCallback(
    async (pieceId: string, abilityId: string, targetId?: string, destination?: { q: number; r: number }, secondaryDest?: { q: number; r: number }) => {
      console.log("Game: handleAbilityUse called", { pieceId, abilityId, targetId, destination, secondaryDest });
      const currentUser = user || authService.getUser();
      const playerId = currentUser?.id || sessionId;
      try {
        if (gameState?.status !== "IN_PROGRESS") {
          console.warn("Ability usage blocked: Game not IN_PROGRESS", gameState?.status);
          return;
        }
        await gameApi.useAbility(gameId, pieceId, abilityId, targetId, destination, secondaryDest, playerId);
        console.log("Game: Ability API call success");
        const game = await gameApi.getGameState(gameId);
        const mappedGame = gameApi.mapGameToFrontend(game);
        setGameState(mappedGame);
        setSelectedPiece(null);
        setManipulatorTarget(null);
        setBrawlerTarget(null);
        setGrapplerTarget(null);
        setGrapplerMode(null);
        setInnkeeperTarget(null);
      } catch (err: any) {
        console.error("Ability error details:", err);
        console.error("Ability error message:", err.message);
        console.error("Ability error stack:", err.stack);
        alert("Erreur compétence: " + (err.message || JSON.stringify(err)));
      }
    },
    [gameId, gameState, user, sessionId],
  );

  const handleSkipActions = useCallback(async () => {
    const currentUser = user || authService.getUser();
    const playerId = currentUser?.id || sessionId;

    if (!gameId || !playerId || gameState?.status !== "IN_PROGRESS") {
      console.warn("Skip action blocked:", { gameId, hasPlayerId: !!playerId, status: gameState?.status });
      return;
    }
    try {
      await gameApi.skipActions(gameId, playerId);
      const game = await gameApi.getGameState(gameId);
      updateGameState(game);
    } catch (err: any) {
      console.error("Skip action error:", err);
      alert(err.message);
    }
  }, [gameId, user, sessionId, gameState?.status, updateGameState]);

  // Filtrage des interactions du plateau selon le mode
  const handleBoardAbilityUse = (pid: string, aid: string, tid: string, dest?: { q: number; r: number }) => {
    // On ne permet l'usage de compétence que si on est en mode ABILITY
    if (actionMode === "ABILITY") {
      handleAbilityUse(pid, aid, tid, dest);
    }
  };

  const handleBoardMove = (pid: string, q: number, r: number) => {
    // On ne permet le mouvement que si on est en mode MOVE
    if (actionMode === "MOVE") {
      handleMove(pid, q, r);
    }
  };

  const handleGrapplerModeChoice = (mode: "PULL" | "MOVE") => {
    if (mode === "PULL") {
      if (selectedPiece && grapplerTarget) {
        handleAbilityUse(selectedPiece.id, "GRAPPLE_HOOK", grapplerTarget.id);
      }
    } else {
      setGrapplerMode(mode);
    }
    setShowGrapplerModal(false);
    playButtonClickSfx();
  };

  const handleRecruit = useCallback(
    (cardId: string) => {
      if (!gameState || gameState.status !== "IN_PROGRESS") return;
      if (isRecruiting) return;
      if (gameState.hasRecruitedThisTurn) {
        alert("Action impossible: Vous avez déjà recruté une unité ce tour-ci.");
        return;
      }
      if (currentPlayerPieceCount >= 4) {
        alert("Limite atteinte: Vous ne pouvez pas avoir plus de 4 personnages");
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
      setPlacementMode({ cardId, cardName, placements: [], characterId: card.characterId });
    },
    [gameState, isRecruiting, currentPlayerPieceCount, hasAvailableSpawnCells, playCharacterSelectSfx],
  );

  const confirmPlacement = useCallback(
    async (q: number, r: number) => {
      if (!gameState || !placementMode || gameState.status !== "IN_PROGRESS") return;

      const newPlacements = [...placementMode.placements, { q, r }];

      // Cas Spécial: OLD_BEAR (nécessite 2 placements)
      if (placementMode.characterId === "OLD_BEAR") {
        if (newPlacements.length < 2) {
          // On stocke le premier placement et on attend le second
          setPlacementMode({ ...placementMode, placements: newPlacements });
          return;
        }
      }

      // Si on a atteint le nombre requis de placements (2 pour Bear, 1 pour autres)
      try {
        if (isRecruiting) return; // Guard against rapid duplicate clicks (race condition)
        setIsRecruiting(true);
        await gameApi.recruitCharacter(gameId, placementMode.cardId, newPlacements);
        const game = await gameApi.getGameState(gameId);
        updateGameState(game);
      } catch (err: any) {
        console.error("Recruitment error:", err);
        alert(err.message || "Erreur lors du recrutement.");
      } finally {
        setIsRecruiting(false);
        setPlacementMode(null);
      }
    },
    [gameState, gameId, placementMode, updateGameState],
  );

  const handleEndTurn = useCallback(async () => {
    if (!gameState) return;

    // Vérification : Recrutement obligatoire si possible
    if (!gameState.hasRecruitedThisTurn) {
      const canRecruitResult = currentPlayerPieceCount < 4 && hasAvailableSpawnCells;

      if (canRecruitResult) {
        alert("Action impossible : Vous devez recruter une unité avant de terminer votre tour !");
        return;
      }
    }

    try {
      playButtonClickSfx();
      await gameApi.endTurn(gameId);
      const game = await gameApi.getGameState(gameId);
      updateGameState(game);
    } catch (err) {
      console.error("End turn error:", err);
    }
  }, [playButtonClickSfx, currentPlayerPieceCount, hasAvailableSpawnCells, gameId, gameState, updateGameState]);

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

  const renderVictoryScreen = () => {
    // Check showVictoryScreen state (delayed) instead of raw status
    if (showVictoryScreen && !isLeavingRef.current && (gameState.status === "FINISHED_CAPTURE" || gameState.status === "FINISHED" || (gameState.winnerPlayerIndex !== undefined && gameState.winnerPlayerIndex !== null))) {
      const winnerIndex = gameState.winnerPlayerIndex ?? 0;
      // Removed unused scores calculation

      const winnerPieces = gameState.pieces.filter((p) => p.ownerIndex === winnerIndex);
      const loserIndex = winnerIndex === 0 ? 1 : 0;
      const loserPieces = gameState.pieces.filter((p) => p.ownerIndex === loserIndex);
      const victoryType = gameState.winnerVictoryType || (gameState.status === "FINISHED_CAPTURE" ? "CAPTURE" : "ENCIRCLEMENT");
      const winnerPlayer = gameState.players.find((p) => p.playerIndex === winnerIndex);

      // Determine if local player is winner
      // If localPlayerIndex is undefined (spectator?), default to viewing as is
      const isLocalPlayerWinner = localPlayerIndex === winnerIndex;

      return (
        <VictoryScreen
          winner={winnerIndex as 0 | 1}
          victoryType={victoryType as any}
          onPlayAgain={() => window.location.reload()}
          onBackToLobby={onBackToLobby}
          turnNumber={gameState.turnNumber}
          winnerPieceCount={winnerPieces.length}
          loserPieceCount={loserPieces.length}
          winnerEloChange={winnerIndex === 0 ? gameState.eloChangeP0 : gameState.eloChangeP1}
          isLocalPlayerWinner={isLocalPlayerWinner}
          winnerName={winnerPlayer?.username || "Joueur"}
          reason={
            (victoryType as string) === "RESIGNATION"
              ? (isLocalPlayerWinner ? "Abandon de l'adversaire" : "Vous avez abandonné")
              : (victoryType === "CAPTURE" ? "Leader capturé" : "Encerclement")
          }
        />
      );
    }
    return null;
  };

  // We no longer return early here, so the board renders underneath

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
    <div className="h-[100dvh] w-screen bg-[#020617] text-white font-mono flex overflow-hidden relative selection:bg-cyan-500 selection:text-black">
      <GameBackground />
      {/* Borders - preserved for UI framing */}
      <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-cyan-500 rounded-tl-lg pointer-events-none drop-shadow-[0_0_8px_rgba(0,245,255,0.8)] z-20" />
      <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-cyan-500 rounded-tr-lg pointer-events-none drop-shadow-[0_0_8px_rgba(0,245,255,0.8)] z-20" />
      <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-cyan-500 rounded-bl-lg pointer-events-none drop-shadow-[0_0_8px_rgba(0,245,255,0.8)] z-20" />
      <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-cyan-500 rounded-br-lg pointer-events-none drop-shadow-[0_0_8px_rgba(0,245,255,0.8)] z-20" />

      {/* TOP HEADER: RESPONSIVE (Rich on Desktop, Minimal on Mobile) */}
      <div className="absolute top-0 left-0 right-0 h-10 md:h-36 bg-slate-900/40 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-2 md:px-10 z-50">
        {/* P0 (Blue) */}
        <div className={`flex items-center gap-1 md:gap-4 transition-all ${gameState.currentPlayerIndex === 0 ? "opacity-100" : "opacity-40"}`}>
          <div className="w-6 h-6 md:w-16 md:h-16 rounded-full border border-cyan-500 bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <img src="/image/garderoyal.png" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <h2 className="hidden md:block font-cyber text-xl lg:text-3xl font-black text-white tracking-wider bg-gradient-to-r from-white to-cyan-400 bg-clip-text text-transparent uppercase italic truncate max-w-[150px]">
              {gameState.players.find(p => p.playerIndex === 0)?.username}
            </h2>
            <div className="flex items-center gap-2">
              <div className={`font-mono text-[10px] md:text-2xl font-bold px-1.5 md:px-3 py-0.5 rounded ${timeP0 < 30 && !gameState.players.some(p => !p.userId || p.userId === "00000000-0000-0000-0000-000000000000") ? "text-rose-500 animate-pulse bg-rose-500/10" : "text-cyan-400 bg-cyan-500/10"}`}>
                {gameState.players.some(p => !p.userId || p.userId === "00000000-0000-0000-0000-000000000000") ? "--:--" : formatTime(timeP0)}
              </div>
              <div className="scale-[0.6] md:scale-75 origin-left">
                <RankBadge elo={gameState.players.find(p => p.playerIndex === 0)?.elo} size="sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Turn indicator - center */}
        <div className="flex flex-col items-center">
          <div className={`
            px-3 md:px-12 py-0.5 md:py-3 font-cyber text-[10px] md:text-2xl font-black tracking-[0.1em] md:tracking-[0.3em] uppercase transition-all duration-500
            ${isMyTurn ? "text-cyan-400 scale-100" : "text-rose-400 scale-90"}
          `}>
            {isMyTurn ? "VOTRE TOUR" : "ADVERSAIRE"}
          </div>
          <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-500 font-mono font-bold tracking-[0.2em] uppercase">
            <span>TOUR {gameState.turnNumber}</span>
          </div>
        </div>

        {/* P1 (Red) */}
        <div className={`flex flex-row-reverse items-center gap-1 md:gap-4 transition-all ${gameState.currentPlayerIndex === 1 ? "opacity-100" : "opacity-40"}`}>
          <div className="w-6 h-6 md:w-16 md:h-16 rounded-full border border-rose-500 bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
            <img src="/image/garderoyal.png" className="w-full h-full object-cover grayscale" />
          </div>
          <div className="flex flex-col items-end">
            <h2 className="hidden md:block font-cyber text-xl lg:text-3xl font-black text-white tracking-wider bg-gradient-to-l from-white to-rose-400 bg-clip-text text-transparent uppercase italic truncate max-w-[150px] text-right">
              {gameState.players.find(p => p.playerIndex === 1)?.username}
            </h2>
            <div className="flex items-center gap-2">
              <div className="scale-[0.6] md:scale-75 origin-right">
                <RankBadge elo={gameState.players.find(p => p.playerIndex === 1)?.elo} size="sm" />
              </div>
              <div className={`font-mono text-[10px] md:text-2xl font-bold px-1.5 md:px-3 py-0.5 rounded ${timeP1 < 30 && !gameState.players.some(p => !p.userId || p.userId === "00000000-0000-0000-0000-000000000000") ? "text-rose-500 animate-pulse bg-rose-500/10" : "text-rose-400 bg-rose-500/10"}`}>
                {gameState.players.some(p => !p.userId || p.userId === "00000000-0000-0000-0000-000000000000") ? "--:--" : formatTime(timeP1)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* UTILITY MODALS & OVERLAYS move below or kept here */}

      {/* MODALS */}
      {placementMode && (
        <div className="absolute top-24 md:top-32 left-1/2 transform -translate-x-1/2 z-40 px-4 md:px-8 py-3 md:py-4 bg-amber-950/90 backdrop-blur-xl border-2 border-amber-500/50 rounded-2xl animate-pulse w-[90%] md:w-auto text-center">
          <p className="text-amber-400 font-bold text-xs md:text-sm uppercase tracking-wider">
            {placementMode.characterId === "OLD_BEAR" && placementMode.placements.length === 1
              ? "📍 Placez l'Ourson (2/2)"
              : `📍 Placez ${placementMode.cardName} sur une case dorée`
            }
          </p>
          <button onClick={() => setPlacementMode(null)} className="mt-3 w-full px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-[10px] md:text-xs font-bold">✖ ANNULER</button>
        </div>
      )}

      {activeTarget && !showGrapplerModal && (
        <div className="absolute top-24 md:top-32 left-1/2 transform -translate-x-1/2 z-40 px-4 md:px-8 py-3 md:py-4 bg-slate-900/90 backdrop-blur-xl border-2 border-cyan-500/50 rounded-2xl animate-pulse w-[90%] md:w-auto text-center">
          <p className="text-cyan-400 font-bold text-xs md:text-sm uppercase tracking-wider">
            🎯 {activeTargetName}: Choisissez la destination
          </p>
          <button onClick={() => { setManipulatorTarget(null); setBrawlerTarget(null); setGrapplerTarget(null); setInnkeeperTarget(null); }} className="mt-3 w-full px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-[10px] md:text-xs font-bold">✖ ANNULER</button>
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

      {showRules && (
        <RulesModal onClose={() => setShowRules(false)} />
      )}

      {/* RIVIÈRE: RESPONSIVE */}
      {/* MOBILE COMPACT RIVIÈRE */}
      {isMyTurn && (
        <div className="md:hidden absolute bottom-16 left-0 right-0 z-50 p-2 bg-slate-950/90 border-t border-white/20 shadow-[0_-10px_30px_rgba(0,0,0,0.6)]">
          <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-1">
            <div className="flex gap-2 py-1 px-1">
              {riverCards.map((card) => (
                <SidebarCard
                  key={card.id}
                  card={card}
                  onClick={() => handleRecruit(card.id)}
                  onMouseEnter={() => { }}
                  disabled={!isMyTurn || isRecruiting || !!placementMode || !canRecruit || !hasAvailableSpawnCells}
                  mini={true}
                />
              ))}
            </div>

            {!allPiecesActed && (
              <button
                onClick={handleSkipActions}
                className="shrink-0 bg-indigo-600/30 text-[9px] text-white px-4 py-3 rounded font-black tracking-widest uppercase border border-indigo-500/40 flex flex-col items-center justify-center h-[80px]"
              >
                <span className="opacity-60">FINI</span>
                <span className="text-xs">⚡</span>
              </button>
            )}
          </div>
          {/* Mobile Population Indicator */}
          <div className="flex gap-1 h-1.5 mt-1 px-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`flex-1 ${i < currentPlayerPieceCount ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]' : 'bg-slate-800'}`} />
            ))}
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR RIVIÈRE */}
      <div className="hidden md:flex absolute top-48 left-8 w-96 h-[calc(100vh-16rem)] flex-col gap-4 z-10">
        {/* Utility Bar (Sound & Rules) */}
        <div className="flex justify-end gap-2 mb-1">
          <button
            onClick={() => setShowRules(true)}
            className="w-8 h-8 bg-slate-950 border border-white/10 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-all"
            title="Règles du jeu"
          >
            <BookOpen className="w-4 h-4" />
          </button>
          <button
            onClick={toggleMusic}
            className={`w-8 h-8 bg-slate-950 border border-white/10 flex items-center justify-center transition-all ${isMusicPlaying ? "text-cyan-400 border-cyan-500/50" : "text-slate-500 hover:text-white"}`}
            title={isMusicPlaying ? "Couper la musique" : "Lancer la musique"}
          >
            {isMusicPlaying ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {/* Modular Command Panel - Compact & Solid */}
        <div className="relative bg-slate-950/95 border-l-4 border-cyan-500 shadow-[20px_0_50px_rgba(0,0,0,0.8)]">
          {/* Header Section */}
          <div className="p-4 border-b border-white/5">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="font-cyber font-black text-2xl text-white tracking-[0.1em] uppercase">
                  RECRUTEMENT
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-1.5 h-1.5 bg-cyan-500" />
                  <span className="text-[9px] font-mono text-slate-400 tracking-widest uppercase">PROTOCOLE_ACTIF // v4.2.1</span>
                </div>
              </div>
              <div className="text-right">
                <div className="px-2 py-0.5 bg-cyan-500/10 text-cyan-500 text-[9px] font-bold border border-cyan-500/30">
                  CONNECTÉ
                </div>
              </div>
            </div>
          </div>

          {/* Data Section */}
          <div className="p-4 space-y-4">
            {/* Population Grid */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-[9px] font-cyber font-bold text-slate-500 tracking-widest uppercase">Effectif Global</span>
                <span className="font-mono text-base font-black text-white">{currentPlayerPieceCount}<span className="text-slate-700">/4</span></span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-3 border ${i < currentPlayerPieceCount
                      ? 'bg-cyan-500/30 border-cyan-400 shadow-[inset_0_0_10px_rgba(6,182,212,0.3)]'
                      : 'bg-black/40 border-slate-800'}`}
                  />
                ))}
              </div>
            </div>

            {isMyTurn ? (
              <div className="space-y-3">
                <div className="p-2 bg-black/40 border-l-2 border-slate-700 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${canRecruit && hasAvailableSpawnCells ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                    <span className={`text-[9px] font-black tracking-widest uppercase ${canRecruit && hasAvailableSpawnCells ? 'text-white' : 'text-slate-600'}`}>
                      {canRecruit && hasAvailableSpawnCells ? 'ACCÈS : AUTORISÉ' : 'ACCÈS : REFUSÉ'}
                    </span>
                  </div>
                  <div className="text-[8px] font-mono text-slate-700">SPW.{availableSpawnCells.length}</div>
                </div>

                {!allPiecesActed && (
                  <button
                    onClick={handleSkipActions}
                    className="w-full py-3 bg-slate-900 text-cyan-400 hover:bg-cyan-500 hover:text-black font-cyber text-[10px] font-black tracking-[0.3em] uppercase transition-all duration-200 border border-cyan-500/20 hover:border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.1)]"
                  >
                    Terminer le Tour
                  </button>
                )}
              </div>
            ) : (
              <div className="py-4 text-center border-t border-white/5 mt-2">
                <span className="text-slate-600 font-mono text-[9px] tracking-[0.4em] uppercase">SYNCHRONISATION...</span>
              </div>
            )}
          </div>

          {/* Corner Rivet Details (Static) */}
          <div className="absolute top-2 right-2 w-1 h-1 bg-white/10" />
          <div className="absolute bottom-2 right-2 w-1 h-1 bg-white/10" />
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-2 scrollbar-thin">
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

      {/* HEXBOARD (Centre) */}
      <div className="flex-1 flex flex-col items-center justify-center relative p-1 md:p-36 lg:p-48 overflow-hidden">
        {/* ACTION MODE TOGGLE */}
        {selectedPiece && hasActiveAbility && isMyTurn && !selectedPiece.hasActed && (
          <div className="absolute top-10 md:top-24 z-50 flex p-1 bg-slate-900/90 backdrop-blur-xl rounded-xl md:rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] left-1/2 transform -translate-x-1/2 scale-90 md:scale-110">
            <button
              onClick={() => { setActionMode("MOVE"); playButtonClickSfx(); }}
              className={`
                relative flex items-center gap-2 px-6 py-2.5 rounded-xl font-cyber font-bold transition-all duration-300
                ${actionMode === "MOVE"
                  ? "bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                  : "text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10"
                }
              `}
            >
              <span className="text-xs">🧭</span>
              <span>DÉPLACEMENT</span>
              {actionMode === "MOVE" && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-cyan-300 rounded-full" />
              )}
            </button>
            <button
              onClick={() => { setActionMode("ABILITY"); playButtonClickSfx(); }}
              className={`
                relative flex items-center gap-2 px-6 py-2.5 rounded-xl font-cyber font-bold transition-all duration-300
                ${actionMode === "ABILITY"
                  ? "bg-purple-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] border border-purple-400/30"
                  : "text-slate-400 hover:text-purple-400 hover:bg-purple-500/10"
                }
              `}
            >
              <span className="text-xs">⚡</span>
              <span>COMPÉTENCE</span>
              {actionMode === "ABILITY" && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-purple-300 rounded-full" />
              )}
            </button>
          </div>
        )}

        <HexBoard
          pieces={gameState.pieces}
          currentPlayer={gameState.currentPlayerIndex}
          phase={"ACTIONS" as "ACTIONS" | "RECRUITMENT"}
          turnNumber={gameState.turnNumber}
          onMove={handleBoardMove}
          selectedPiece={selectedPiece}
          onSelectPiece={setSelectedPiece}
          placementMode={placementMode}
          availablePlacementCells={availableSpawnCells}
          onPlacementConfirm={confirmPlacement}
          onAbilityUse={handleBoardAbilityUse}
          manipulatorTarget={actionMode === "ABILITY" ? manipulatorTarget : null}
          onManipulatorTargetSelect={actionMode === "ABILITY" ? setManipulatorTarget : undefined}
          brawlerTarget={actionMode === "ABILITY" ? brawlerTarget : null}
          onBrawlerTargetSelect={actionMode === "ABILITY" ? setBrawlerTarget : undefined}
          grapplerTarget={actionMode === "ABILITY" ? grapplerTarget : null}
          onGrapplerTargetSelect={actionMode === "ABILITY" ? setGrapplerTarget : undefined}
          grapplerMode={grapplerMode}
          onGrapplerModeSelect={setGrapplerMode}
          innkeeperTarget={actionMode === "ABILITY" ? innkeeperTarget : null}
          onInnkeeperTargetSelect={actionMode === "ABILITY" ? setInnkeeperTarget : undefined}
          isLocalTurn={!!isMyTurn}
          volume={volume}
          actionMode={actionMode}
        />
      </div>

      {/* TACTICAL SCANNER: MOBILE MINI-BAR */}
      {selectedPiece && (
        <div className="md:hidden absolute top-12 left-0 right-0 z-40 px-2 pointer-events-none">
          <div className={`
             flex items-center gap-3 p-1.5 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl pointer-events-auto animate-in slide-in-from-top-4 duration-300
             ${selectedPiece.ownerIndex === 0 ? "border-l-4 border-l-cyan-500" : "border-l-4 border-l-rose-500"}
          `}>
            <div className="w-8 h-8 rounded border border-white/10 overflow-hidden shrink-0">
              {selectedPiece.characterId === "LEADER" ? (
                <img src={selectedPiece.ownerIndex === 0 ? CHARACTER_IMAGES.LEADER_BLUE : CHARACTER_IMAGES.LEADER_RED} className="w-full h-full object-cover" />
              ) : (
                <img src={CHARACTER_IMAGES[selectedPiece.characterId]} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-cyber text-[10px] font-bold text-white uppercase italic truncate">
                  {CHARACTER_NAMES[selectedPiece.characterId]}
                </span>
                <span className={`text-[8px] font-mono px-1 rounded ${selectedPiece.hasActed ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                  {selectedPiece.hasActed ? "WAIT" : "READY"}
                </span>
              </div>
              <p className="text-[8px] text-slate-400 truncate italic">"{CHARACTER_DATA[selectedPiece.characterId]?.description}"</p>
            </div>
            <button onClick={() => setSelectedPiece(null)} className="p-2 text-slate-500">✕</button>
          </div>
        </div>
      )}

      {/* MOVE HISTORY (Sidebar Droite - DESKTOP ONLY - Behind Scanner) */}
      {/* MOVE HISTORY (Sidebar Droite - DESKTOP ONLY - Behind Scanner) */}
      <div className="hidden md:block absolute top-48 right-8 w-80 bottom-32 z-0 pointer-events-auto opacity-80 hover:opacity-100 transition-opacity">
        {gameState && gameState.status === "FINISHED" && (
          <div className="h-full w-full flex flex-col">
            <div className="bg-slate-950/80 backdrop-blur border-l-4 border-slate-700 p-2 mb-2 rounded-r-xl">
              <h3 className="font-cyber text-slate-400 text-xs tracking-widest uppercase">JOURNAL DE COMBAT</h3>
            </div>
            <div className="flex-1 overflow-hidden rounded-xl border border-white/5 bg-slate-900/50">
              <MoveHistory game={gameState} variant="embedded" />
            </div>
          </div>
        )}
      </div>

      {/* TACTICAL SCANNER (Sidebar Droite - DESKTOP ONLY) */}
      <div className={`
        hidden md:block absolute top-40 right-10 w-80 z-10 perspective-[1000px]
        transition-all duration-300 pointer-events-auto
        ${selectedPiece ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
      `}>
        <div className={`
          relative w-full transition-all duration-500 transform-style-3d pointer-events-auto
          ${selectedPiece ? "rotate-y-0 opacity-100" : "opacity-90"}
        `}>
          {selectedPiece && (
            <div className={`
              bg-slate-900/95 md:bg-slate-900/90 backdrop-blur-xl border-2 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-colors duration-500
              ${selectedPiece.characterId === "LEADER"
                ? (selectedPiece.ownerIndex === 0 ? "border-cyan-500/50 shadow-cyan-500/20" : "border-red-500/50 shadow-red-500/20")
                : "border-amber-500/30 shadow-amber-500/10"
              }
            `}>
              <div className="relative w-full aspect-[4/5] md:aspect-[4/5] bg-slate-950">
                <button onClick={() => setSelectedPiece(null)} className="md:hidden absolute top-2 right-2 z-30 p-2 bg-black/40 rounded-full text-white">✕</button>
                {selectedPiece.characterId === "LEADER" ? (
                  <img
                    src={selectedPiece.ownerIndex === 0 ? CHARACTER_IMAGES.LEADER_BLUE : CHARACTER_IMAGES.LEADER_RED}
                    alt="Leader"
                    className="w-full h-full object-cover object-center"
                  />
                ) : CHARACTER_IMAGES[selectedPiece.characterId] ? (
                  <img src={CHARACTER_IMAGES[selectedPiece.characterId]} alt={selectedPiece.characterId} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl text-slate-700">?</div>
                )}
                {/* ... (rest of scanner UI remains mostly same but with some responsiveness) ... */}
                {selectedPiece.hasActed && (
                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
                    <div className="bg-emerald-500 text-white px-4 py-1.5 rounded-full font-cyber font-bold text-sm tracking-widest shadow-[0_0_20px_rgba(34,197,94,0.5)] border border-white/20 animate-pulse">
                      VALIDÉ ✅
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-90" />
                <div className="absolute bottom-4 left-4 right-4 z-10">
                  <h3 className="font-cyber text-lg md:text-3xl font-bold text-white tracking-wider drop-shadow-lg uppercase">
                    {CHARACTER_NAMES[selectedPiece.characterId] || selectedPiece.characterId}
                  </h3>
                </div>
              </div>
              <div className="p-3 md:p-5 space-y-2 md:space-y-4">
                <p className="text-[10px] md:text-sm text-slate-300 italic leading-snug md:leading-relaxed text-center">
                  "{CHARACTER_DATA[selectedPiece.characterId]?.description || "Données inconnues..."}"
                </p>
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className="bg-slate-800/40 p-1.5 md:p-2 rounded-lg border border-white/5 flex flex-col items-center">
                    <span className="text-[8px] md:text-[10px] text-slate-500 uppercase tracking-widest mb-1">TYPE</span>
                    <span className={`font-mono text-[8px] md:text-[9px] font-black px-1.5 py-0.5 rounded border ${CHARACTER_DATA[selectedPiece.characterId]?.type === "ACTIVE" ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400" : "bg-purple-500/10 border-purple-500/50 text-purple-400"}`}>
                      {CHARACTER_DATA[selectedPiece.characterId]?.type || "SPÉCIAL"}
                    </span>
                  </div>
                  <div className={`p-1.5 md:p-2 rounded-lg border flex flex-col items-center justify-center ${selectedPiece.hasActed ? "bg-rose-950/30 border-rose-500/30 text-rose-400" : "bg-emerald-950/30 border-emerald-500/30 text-emerald-400"}`}>
                    <span className="text-[8px] md:text-[10px] uppercase tracking-widest mb-1">ÉTAT</span>
                    <span className="font-bold text-[10px] md:text-xs">{selectedPiece.hasActed ? "ÉPUISÉ" : "READY"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ACTION BAR (Bottom) */}
      <div className="absolute bottom-4 md:bottom-10 left-1/2 transform -translate-x-1/2 z-20 flex gap-2 md:gap-8 w-full md:w-auto px-4 md:px-0 justify-center">
        {isMyTurn && gameState.status === "IN_PROGRESS" && (
          <button
            onClick={handleEndTurn}
            className={`flex-1 md:flex-none px-6 md:px-16 py-3 md:py-5 font-black rounded-xl md:rounded-2xl shadow-xl transition-all uppercase tracking-widest text-sm md:text-xl border-2 ${allActionsCompleted ? "bg-amber-600 border-amber-400 text-white animate-pulse shadow-[0_0_30px_rgba(245,158,11,0.5)] scale-105 md:scale-110" : "bg-cyan-600 border-cyan-400/50 text-white hover:bg-cyan-500 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]"}`}
          >
            {allActionsCompleted ? "TERMINER" : "FIN DU TOUR"}
          </button>
        )}
        <button
          onClick={() => {
            if (gameState.status === "IN_PROGRESS") {
              setShowSurrenderModal(true);
            } else {
              isLeavingRef.current = true;
              onBackToLobby();
            }
            playButtonClickSfx();
          }}
          className="px-4 md:px-10 py-3 bg-rose-900/40 border border-rose-500/50 text-rose-500 font-bold rounded-xl hover:bg-rose-500 hover:text-white transition-all uppercase tracking-widest text-[10px] md:text-sm"
        >
          {gameState.status === "IN_PROGRESS" ? "ABANDON" : "QUITTER"}
        </button>
      </div>

      {/* SURRENDER CONFIRMATION MODAL */}
      {showSurrenderModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#0f172a] border-2 border-rose-500/30 p-8 rounded-3xl max-w-md w-full shadow-[0_0_50px_rgba(244,63,94,0.2)] animate-in zoom-in-95 duration-300">
            <div className="text-center">
              <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
                <span className="text-4xl">⚠️</span>
              </div>
              <h3 className="font-cyber text-2xl font-black text-white mb-2 tracking-wider uppercase italic">ABANDONNER ?</h3>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Êtes-vous sûr de vouloir quitter la partie ? Ce sera considéré comme un <span className="text-rose-400 font-bold uppercase">abandon</span> et vous perdrez des <span className="text-amber-400 font-bold">points de rang</span>.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    handleSurrender();
                    playButtonClickSfx();
                  }}
                  className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-2xl transition-all uppercase tracking-[0.2em] shadow-lg shadow-rose-900/20"
                >
                  Confirmer l'abandon
                </button>
                <button
                  onClick={() => {
                    setShowSurrenderModal(false);
                    playButtonClickSfx();
                  }}
                  className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl transition-all uppercase tracking-[0.2em] border border-white/5"
                >
                  Rester et se battre
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* MULTIPLAYER CHAT */}
      <ChatPanel sessionId={sessionId} user={user} isMyTurn={!!isMyTurn} />

      {/* VICTORY OVERLAY */}
      {renderVictoryScreen()}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@300;400;500;600;700&display=swap');
        .font-cyber { font-family: 'Chakra Petch', sans-serif; }
      `}</style>
    </div>
  );
}
