import type { GameFrontend, PieceFrontend } from "../api/gameApi";
import { gameApi } from "../api/gameApi";
import { authService } from "../services/auth.service";
import { webSocketService } from "../services/WebSocketService";
import RankBadge from "../components/RankBadge";
import HexBoard from "../components/HexBoard";
import GameBackground from "../components/GameBackground";
import RulesModal from "../components/RulesModal";
import { BookOpen, Volume2, VolumeX } from "lucide-react";


import VictoryScreen from "../components/VictoryScreen";
import useSound from "use-sound";

// Sons
import buttonClickSfx from "../sounds/buttonClick.mp3";
import characterSelectSfx from "../sounds/characterSelect.mp3";
import mainMusic from "../sounds/mainMenu.mp3";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";

const CHARACTER_IMAGES: Record<string, string> = {
  LEADER_RED: "/image/leaders/leader_red.png",
  LEADER_BLUE: "/image/leaders/leader_blue.png",
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
  NEMESIS: "/image/nemesis.png",
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
  GRAPPLER: { name: "Lance-Grappin", description: "S'accroche à une pièce et se déplace sur une case adjacente", type: "ACTIVE" },
  MANIPULATOR: { name: "Manipulatrice", description: "Déplace un ennemi visible d'une case", type: "ACTIVE" },
  INNKEEPER: { name: "Tavernier", description: "Déplace un allié adjacent d'une case", type: "ACTIVE" },
  JAILER: { name: "Geôlier", description: "Les ennemis adjacents ne peuvent utiliser leur compétence", type: "PASSIVE" },
  PROTECTOR: { name: "Protecteur", description: "Protège les alliés adjacents des compétences ennemies", type: "PASSIVE" },
  ASSASSIN: { name: "Assassin", description: "Capture le Leader adverse seul", type: "PASSIVE" },
  ROYAL_GUARD: { name: "Garde Royal", description: "Se déplace près du Leader puis d'une case", type: "ACTIVE" },
  VIZIER: { name: "Vizir", description: "Votre Leader peut se déplacer d'une case supplémentaire", type: "PASSIVE" },
  NEMESIS: { name: "Némésis", description: "Se déplace automatiquement quand le Leader adverse bouge", type: "SPECIAL" },
  OLD_BEAR: { name: "Vieil Ours", description: "Vient avec son Ourson (2 pièces)", type: "SPECIAL" },
  LEADER: { name: "Leader", description: "Votre champion. S'il est capturé ou encerclé, la partie est perdue.", type: "SPECIAL" },
};

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
        group relative w-full p-3 rounded-xl border-l-[6px] transition-all duration-300
        ${disabled
          ? "bg-slate-900/40 border-slate-800 opacity-50 cursor-not-allowed grayscale"
          : "bg-slate-900/80 border-cyan-500 hover:bg-slate-800 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] cursor-pointer hover:scale-[1.02]"
        }
      `}
    >
      {/* Background Tech Pattern */}
      {!disabled && (
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(6,182,212,0.05)_50%,transparent_75%)] bg-[length:250%_250%] animate-shine opacity-0 group-hover:opacity-100 transition-opacity" />
      )}

      {disabled && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
          <div className="bg-black/60 px-3 py-1 rounded text-[10px] font-bold tracking-widest text-slate-400 border border-slate-700 uppercase">
            Verrouillé
          </div>
        </div>
      )}

      <div className="flex gap-4 items-center relative z-0">
        {/* Avatar Image */}
        <div className={`
           w-20 h-20 shrink-0 rounded-lg overflow-hidden border-2 bg-slate-950 shadow-inner
           ${disabled ? "border-slate-700" : "border-cyan-500/50 group-hover:border-cyan-400"}
        `}>
          {CHARACTER_IMAGES[card.characterId] ? (
            <img
              src={CHARACTER_IMAGES[card.characterId]}
              alt={card.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-800 text-xl text-slate-600">
              {icons[charType]}
            </div>
          )}
        </div>

        {/* Content Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex justify-between items-baseline mb-1">
            <span className={`font-cyber text-lg font-bold truncate ${disabled ? "text-slate-500" : "text-white group-hover:text-cyan-300"}`}>
              {card.name}
            </span>
            <span className="text-[10px] text-slate-600 font-mono">
              {charType === "ACTIVE" ? "ACTIF" : "PASSIF"}
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-tight line-clamp-2 italic pr-2">
            "{card.description || "Information classifiée"}"
          </p>

          {!disabled && (
            <div className="mt-2 flex items-center gap-1">
              <div className="h-1 w-12 bg-cyan-900 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 w-2/3 animate-pulse" />
              </div>
              <span className="text-[8px] text-cyan-500 uppercase tracking-wider ml-2">DISPONIBLE</span>
            </div>
          )}
        </div>
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
  const [volume, setVolume] = useState(0.3); // 30% volume for music
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  // === GESTION DES MODES D'ACTION (Move vs Ability) ===
  const [actionMode, setActionMode] = useState<"MOVE" | "ABILITY">("MOVE");

  // === GESTION DU TIMER ===
  const [timeP0, setTimeP0] = useState<number>(300);
  const [timeP1, setTimeP1] = useState<number>(300);

  // Reset du mode quand on change de pièce
  useEffect(() => {
    setActionMode("MOVE");
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
  const playButtonHoverSfx = () => { if (sfxEnabled && (volume > 0)) { /* logic for hover if needed */ } };

  useEffect(() => {
    const currentUser = authService.getUser();
    setUser(currentUser);
  }, []);

  const updateGameState = useCallback((game: any) => {
    const mappedGame = gameApi.mapGameToFrontend(game);
    setGameState(mappedGame);
    setIsLoading(false);

    // Sync timers from backend
    if (game.remainingTimeP0 !== undefined) setTimeP0(game.remainingTimeP0);
    if (game.remainingTimeP1 !== undefined) setTimeP1(game.remainingTimeP1);

    if (mappedGame.players && mappedGame.players.length > 0) {
      const user = authService.getUser();
      if (user) {
        const localPlayer = mappedGame.players.find((p: any) => String(p.userId) === String(user.id));
        if (localPlayer !== undefined) {
          setLocalPlayerIndex(localPlayer.playerIndex);
        }
      }
    }
  }, []);

  // Countdown logic
  useEffect(() => {
    if (!gameState || gameState.status !== "IN_PROGRESS") return;

    const timer = setInterval(() => {
      if (gameState.currentPlayerIndex === 0) {
        setTimeP0(prev => Math.max(0, prev - 1));
      } else {
        setTimeP1(prev => Math.max(0, prev - 1));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState?.currentPlayerIndex, gameState?.status]);

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
    return spawnCells.filter(
      (cell) => !gameState.pieces.find((p) => p.q === cell.q && p.r === cell.r),
    );
  }, [gameState, spawnCells]);

  const currentPlayerPieceCount = useMemo(() => {
    if (!gameState) return 0;
    return gameState.pieces.filter((p) => p.ownerIndex === gameState.currentPlayerIndex).length;
  }, [gameState]);

  const allPiecesActed = useMemo(() => {
    if (!gameState || localPlayerIndex === null) return false;
    const myPieces = gameState.pieces.filter(p => p.ownerIndex === localPlayerIndex);
    if (myPieces.length === 0) return false;
    return myPieces.every(p => p.hasActed);
  }, [gameState?.pieces, localPlayerIndex]);

  const canRecruit = useMemo(() => {
    const piecesOk = currentPlayerPieceCount < 5;

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
      } catch (err) {
        console.error("Move error:", err);
      }
    },
    [gameId, gameState, updateGameState],
  );

  const handleAbilityUse = useCallback(
    async (pieceId: string, abilityId: string, targetId?: string, destination?: { q: number; r: number }) => {
      console.log("Game: handleAbilityUse called", { pieceId, abilityId, targetId, destination });
      try {
        await gameApi.useAbility(gameId, pieceId, abilityId, targetId, destination);
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
      } catch (err) {
        console.error("Ability error:", err);
        alert("Erreur lors de l'utilisation de la compétence: " + err);
      }
    },
    [gameId],
  );

  const handleSkipActions = useCallback(async () => {
    if (!gameId || !user?.id) return;
    try {
      await gameApi.skipActions(gameId, user.id);
      const game = await gameApi.getGameState(gameId);
      updateGameState(game);
    } catch (err: any) {
      alert(err.message);
    }
  }, [gameId, user?.id, updateGameState]);

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
    if (!gameState) return;

    // Vérification : Recrutement obligatoire si possible
    if (!gameState.hasRecruitedThisTurn) {
      const canRecruitResult = currentPlayerPieceCount < 5 && hasAvailableSpawnCells;

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
      <GameBackground />
      {/* Borders - preserved for UI framing */}
      <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-cyan-500 rounded-tl-lg pointer-events-none drop-shadow-[0_0_8px_rgba(0,245,255,0.8)] z-20" />
      <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-cyan-500 rounded-tr-lg pointer-events-none drop-shadow-[0_0_8px_rgba(0,245,255,0.8)] z-20" />
      <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-cyan-500 rounded-bl-lg pointer-events-none drop-shadow-[0_0_8px_rgba(0,245,255,0.8)] z-20" />
      <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-cyan-500 rounded-br-lg pointer-events-none drop-shadow-[0_0_8px_rgba(0,245,255,0.8)] z-20" />

      {/* TOP HEADER: PLAYERS & TIMERS */}
      <div className="absolute top-0 left-0 right-0 h-36 bg-slate-900/40 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-10 z-50">
        {/* Player 0 (Blue) */}
        <div className={`flex items-center gap-4 p-2 rounded-xl transition-all ${gameState.currentPlayerIndex === 0 ? "bg-cyan-500/10 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]" : "opacity-60"}`}>
          <div className="w-10 h-10 rounded-full border-2 border-cyan-500 bg-slate-800 flex items-center justify-center overflow-hidden">
            <img src="/image/garderoyal.png" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="text-[10px] text-cyan-400/60 font-mono uppercase tracking-[0.3em] mb-1">Commandant Tactique</div>
            <div className="flex items-center gap-6">
              <h2 className="font-cyber text-3xl font-black text-white tracking-wider bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(6,182,212,0.3)] uppercase italic">
                {gameState.players.find(p => p.playerIndex === 0)?.username || "Chargement..."}
              </h2>
              <RankBadge
                elo={gameState.players.find(p => p.playerIndex === 0)?.elo}
                size="md"
              />
            </div>
          </div>
          <div className={`ml-4 font-mono text-2xl font-bold px-3 py-1 rounded-lg ${timeP0 < 30 ? "text-rose-500 animate-pulse bg-rose-500/10" : "text-cyan-400 bg-cyan-500/10"}`}>
            {formatTime(timeP0)}
          </div>
        </div>

        {/* Turn indicator center */}
        <div className="flex flex-col items-center gap-4 min-w-[280px]">
          <div className={`
            relative group
            ${isMyTurn
              ? "text-cyan-400"
              : "text-rose-400"
            }
          `}>
            {/* Decorative corners */}
            <div className={`absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 transition-all duration-500 ${isMyTurn ? "border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" : "border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"}`} />
            <div className={`absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 transition-all duration-500 ${isMyTurn ? "border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" : "border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"}`} />
            <div className={`absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 transition-all duration-500 ${isMyTurn ? "border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" : "border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"}`} />
            <div className={`absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 transition-all duration-500 ${isMyTurn ? "border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" : "border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"}`} />

            <div className={`
              px-12 py-2 font-cyber text-2xl font-black tracking-[0.25em] uppercase transition-all duration-500
              bg-slate-950/60 backdrop-blur-sm border border-white/5
              ${isMyTurn ? "shadow-[inset_0_0_20px_rgba(6,182,212,0.1)] animate-pulse border-cyan-500/20" : "shadow-[inset_0_0_20px_rgba(244,63,94,0.1)] border-rose-500/20"}
            `}>
              {isMyTurn ? "VOTRE TOUR" : "TOUR ADVERSE"}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-slate-500/50" />
            <div className="text-[11px] text-slate-300 font-mono font-bold tracking-[0.3em] uppercase">
              TOUR n°{gameState.turnNumber}
            </div>
            <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-slate-500/50" />
          </div>
        </div>

        {/* Player 1 (Red) */}
        <div className={`flex items-center gap-4 p-2 rounded-xl transition-all flex-row-reverse ${gameState.currentPlayerIndex === 1 ? "bg-rose-500/10 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.2)]" : "opacity-60"}`}>
          <div className="w-10 h-10 rounded-full border-2 border-rose-500 bg-slate-800 flex items-center justify-center overflow-hidden">
            <img src="/image/garderoyal.png" className="w-full h-full object-cover grayscale" />
          </div>
          <div className="text-right">
            <div className="text-[10px] text-rose-400/60 font-mono uppercase tracking-[0.3em] mb-1">Opposant Désigné</div>
            <div className="flex items-center gap-6 flex-row-reverse">
              <h2 className="font-cyber text-3xl font-black text-white tracking-wider bg-gradient-to-l from-white via-rose-100 to-rose-400 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(244,63,94,0.3)] uppercase italic text-right">
                {gameState.players.find(p => p.playerIndex === 1)?.username || "Chargement..."}
              </h2>
              <RankBadge
                elo={gameState.players.find(p => p.playerIndex === 1)?.elo}
                size="md"
              />
            </div>
          </div>
          <div className={`mr-4 font-mono text-2xl font-bold px-3 py-1 rounded-lg ${timeP1 < 30 ? "text-rose-500 animate-pulse bg-rose-500/10" : "text-rose-400 bg-rose-500/10"}`}>
            {formatTime(timeP1)}
          </div>
        </div>
      </div>

      {/* Floating Buttons */}
      <div className="absolute top-40 left-10 flex flex-col gap-4 z-20">
        <button
          onClick={() => setShowRules(true)}
          className="w-12 h-12 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center text-cyan-400 hover:bg-cyan-500 hover:text-white transition-all shadow-lg group relative overflow-hidden"
          title="Règles du jeu"
        >
          <BookOpen size={24} />
          <div className="absolute inset-0 bg-cyan-400/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        <button
          onClick={toggleMusic}
          className={`w-12 h-12 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center transition-all shadow-lg group relative overflow-hidden ${isMusicPlaying ? "bg-purple-500/20 text-purple-400 hover:bg-purple-500 hover:text-white" : "bg-slate-900/80 text-slate-400 hover:bg-slate-700 hover:text-white"}`}
          title={isMusicPlaying ? "Couper la musique" : "Lancer la musique"}
        >
          {isMusicPlaying ? <Volume2 size={24} /> : <VolumeX size={24} />}
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
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

      {showRules && (
        <RulesModal onClose={() => setShowRules(false)} />
      )}

      {/* RIVIÈRE (Sidebar Gauche) */}
      <div className="absolute top-48 left-8 w-96 h-[calc(100vh-16rem)] flex flex-col gap-6 z-10 perspective-[1000px]">
        <div className="bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl border border-cyan-500/30 shadow-[0_0_20px_rgba(0,0,0,0.5)] transform -rotate-y-2 hover:rotate-0 transition-transform duration-500">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-cyber font-bold text-2xl text-white tracking-wider flex items-center gap-2">
              <span className="text-cyan-400 animate-pulse">◈</span> RIVIÈRE
            </h2>
            <div className="px-3 py-1 bg-slate-950 rounded text-[10px] font-mono text-cyan-500 border border-cyan-900">
              {availableSpawnCells.length} ZONE(S)
            </div>
          </div>

          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mb-3">
            <div
              className={`h-full transition-all duration-500 ${currentPlayerPieceCount >= 5 ? "bg-rose-500 w-full" : "bg-cyan-500"}`}
              style={{ width: `${(currentPlayerPieceCount / 5) * 100}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest flex justify-between">
            <span>Effectif: {currentPlayerPieceCount}/5</span>
            <span>{isMyTurn ? "SESSION ACTIVE" : "EN ATTENTE"}</span>
          </p>

          {isMyTurn && (
            <div className="mt-4 flex flex-col gap-2 bg-slate-950/50 p-3 rounded-lg border border-white/5">
              {(!canRecruit || !hasAvailableSpawnCells) ? (
                <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase">
                  <span className="animate-pulse">⛔</span> RECRUTEMENT INDISPONIBLE
                </div>
              ) : (
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase">
                  <span className="animate-pulse">🟢</span> RECRUTEMENT AUTORISÉ
                </div>
              )}
              {allPiecesActed ? (
                <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase">
                  <span>⏳</span> UNITÉS ÉPUISÉES
                </div>
              ) : (
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase">
                  <span>⚡</span> ACTIONS POSSIBLES
                </div>
              )}

              {!allPiecesActed && (
                <button
                  onClick={handleSkipActions}
                  className="relative group mt-4 w-full py-3 px-6 bg-slate-900 overflow-hidden rounded-sm border-l-4 border-indigo-500 transition-all active:scale-95 shadow-lg"
                >
                  {/* Glitch Overlay Effect */}
                  <div className="absolute inset-0 bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-[linear-gradient(45deg,transparent_25%,rgba(99,102,241,0.1)_50%,transparent_75%)] bg-[size:200%_200%] animate-scan-fast pointer-events-none" />

                  {/* Button Content */}
                  <div className="relative flex items-center justify-between pointer-events-none">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-indigo-500 animate-pulse rounded-full shadow-[0_0_8px_#6366f1]" />
                      <span className="font-cyber text-[10px] font-black tracking-[0.2em] text-white uppercase italic">
                        Phase d'Action
                      </span>
                    </div>
                    <span className="text-indigo-400 group-hover:text-white group-hover:translate-x-1 transition-all">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>

                  {/* Corner Decoration */}
                  <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-indigo-400 opacity-50" />
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-indigo-400 opacity-50" />

                  {/* Supplemental text below main label */}
                  <div className="absolute bottom-1 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[7px] font-mono text-indigo-300 uppercase tracking-tighter">Skip remaining pulses</span>
                  </div>
                </button>
              )}
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-cyan-600 scrollbar-track-slate-900/50 hover:scrollbar-thumb-cyan-400 transition-colors">
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
      <div className="flex-1 flex flex-col items-center justify-center relative p-20">
        {/* ACTION MODE TOGGLE */}
        {selectedPiece && hasActiveAbility && isMyTurn && !selectedPiece.hasActed && (
          <div className="absolute top-24 z-50 flex p-1.5 bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] left-1/2 transform -translate-x-1/2 scale-110">
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

      {/* TACTICAL SCANNER (Sidebar Droite) */}
      <div className="absolute top-40 right-10 w-80 z-10 perspective-[1000px]">
        <div className={`
          relative w-full transition-all duration-500 transform-style-3d
          ${selectedPiece ? "rotate-y-0 opacity-100" : "opacity-90"}
        `}>
          {selectedPiece ? (
            <div className={`
              bg-slate-900/90 backdrop-blur-xl border-2 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-colors duration-500
              ${selectedPiece.characterId === "LEADER"
                ? (selectedPiece.ownerIndex === 0 ? "border-cyan-500/50 shadow-cyan-500/20" : "border-red-500/50 shadow-red-500/20")
                : "border-amber-500/30 shadow-amber-500/10"
              }
            `}>
              <div className="relative w-full aspect-[4/5] bg-slate-950">
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

                {selectedPiece.hasActed && (
                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
                    <div className="bg-emerald-500 text-white px-4 py-1.5 rounded-full font-cyber font-bold text-sm tracking-widest shadow-[0_0_20px_rgba(34,197,94,0.5)] border border-white/20 animate-pulse">
                      VALIDÉ ✅
                    </div>
                  </div>
                )}

                {/* Tech Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-90" />
                <div className={`absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_30%,black_100%)]`} />
                <div className="absolute inset-0 bg-[linear-gradient(transparent_2px,rgba(255,255,255,0.03)_2px)] bg-[size:100%_4px] pointer-events-none" />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_2px,rgba(255,255,255,0.01)_2px)] bg-[size:4px_100%] pointer-events-none" />

                {/* Scanning Line */}
                <div className={`
                  absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(6,182,212,0.2)_50%,transparent_100%)] bg-[size:100%_200%] pointer-events-none animate-scan-fast
                  ${selectedPiece.characterId === "LEADER" ? (selectedPiece.ownerIndex === 0 ? "opacity-40" : "hue-rotate-[140deg] opacity-40") : "opacity-20"}
                `} />

                <div className="absolute bottom-4 left-4 right-4 z-10">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`h-1 w-8 rounded-full ${selectedPiece.characterId === "LEADER" ? (selectedPiece.ownerIndex === 0 ? "bg-cyan-400" : "bg-red-400") : "bg-amber-400"}`} />
                    <span className="text-[10px] font-mono text-white/40 tracking-[0.2em] uppercase">Tactical Link</span>
                  </div>
                  <h3 className="font-cyber text-3xl font-bold text-white tracking-wider drop-shadow-lg uppercase">
                    {CHARACTER_NAMES[selectedPiece.characterId] || selectedPiece.characterId}
                  </h3>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="bg-slate-950/50 p-3 rounded-xl border border-white/5">
                  <p className="text-sm text-slate-300 italic leading-relaxed text-center">
                    "{CHARACTER_DATA[selectedPiece.characterId]?.description || "Données inconnues..."}"
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800/40 p-2 rounded-lg border border-white/5 flex flex-col items-center">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">CAPACITÉ</span>
                      {selectedPiece.characterId === "LEADER" ? (
                        <span className="font-mono text-[9px] font-black px-2 py-0.5 rounded border bg-slate-500/10 border-slate-500/50 text-slate-400">
                          AUCUNE
                        </span>
                      ) : (
                        <span className={`font-mono text-[9px] font-black px-2 py-0.5 rounded border ${CHARACTER_DATA[selectedPiece.characterId]?.type === "ACTIVE" ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400" : "bg-purple-500/10 border-purple-500/50 text-purple-400"}`}>
                          {CHARACTER_DATA[selectedPiece.characterId]?.type || "SPÉCIAL"}
                        </span>
                      )}
                    </div>
                    <div className={`p-2 rounded-lg border flex flex-col items-center justify-center ${selectedPiece.hasActed ? "bg-rose-950/30 border-rose-500/30 text-rose-400" : "bg-emerald-950/30 border-emerald-500/30 text-emerald-400"}`}>
                      <span className="text-[10px] uppercase tracking-widest mb-1">ÉTAT</span>
                      <span className="font-bold text-xs">{selectedPiece.hasActed ? "ÉPUISÉ" : "OPÉRATIONNEL"}</span>
                    </div>
                  </div>
                  <div className="bg-slate-800/40 p-2 rounded-lg border border-white/5 flex items-center justify-between px-4">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">Coordonnées Tactiques</span>
                    <span className="font-mono text-amber-500 font-bold text-sm">
                      Q:{selectedPiece.q} R:{selectedPiece.r}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-96 flex flex-col items-center justify-center bg-slate-900/20 backdrop-blur-sm border border-white/10 rounded-2xl border-dashed">
              <div className="w-20 h-20 rounded-full border-2 border-cyan-500/20 flex items-center justify-center mb-4 animate-pulse">
                <span className="text-3xl grayscale opacity-50">⌖</span>
              </div>
              <p className="font-cyber text-sm tracking-[0.2em] text-cyan-500/40 uppercase">Scanner en attente</p>
              <p className="text-[10px] text-slate-600 mt-2">Sélectionnez une unité</p>
            </div>
          )}
        </div>
      </div>

      {/* ACTION BAR (Bottom) */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-20 flex gap-4">
        {isMyTurn && (
          <button
            onClick={handleEndTurn}
            className={`px-10 py-4 font-bold rounded-2xl shadow-xl transition-all uppercase tracking-widest text-lg border-2 ${allActionsCompleted ? "bg-amber-600 border-amber-400 text-white animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.4)] scale-110" : "bg-cyan-600 border-cyan-400/50 text-white hover:bg-cyan-500"}`}
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
