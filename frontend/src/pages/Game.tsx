import { useState, useCallback, useEffect, useMemo } from "react";
import HexBoard from "../components/HexBoard";
import VictoryScreen from "../components/VictoryScreen";
import * as gameApi from "../api/gameApi";
import type {
  PieceFrontend,
  GameFrontend,
  RecruitmentCard,
} from "../api/gameApi";

import useSound from "use-sound";
import buttonClickSfx from "../sounds/buttonClick.mp3";
import buttonHoverSfx from "../sounds/buttonHover.mp3";
import characterSelectSfx from "../sounds/characterSelect.mp3";
import characterHoverSfx from "../sounds/characterHover.mp3";

import leaderImg from "/image/garderoyal.png";
import acrobatImg from "/image/acrobate.png";
import archerImg from "/image/archere.png";
import assassinImg from "/image/assassin.png";
import brawlerImg from "/image/cogneur.png";
import cavalryImg from "/image/cavalier.png";
import grapplerImg from "/image/lance-grappin.png";
import illusionistImg from "/image/illusioniste.png";
import innkeeperImg from "/image/tavernier.png";
import jailerImg from "/image/geolier.png";
import manipulatorImg from "/image/manipulatrice.png";
import nemesisImg from "/image/nemesis.png";
import oldBearImg from "/image/vieilours&ourson.png";
import protectorImg from "/image/protecteur.png";
import prowlerImg from "/image/rodeuse.png";
import royalGuardImg from "/image/garderoyal.png";
import vizierImg from "/image/vizir.png";

// === TYPES ===
export type GamePhase = "SETUP" | "ACTIONS" | "RECRUITMENT";

// === MAPPING IMAGES ===
const CHARACTER_IMAGES: Record<string, string> = {
  LEADER: leaderImg,
  ACROBAT: acrobatImg,
  ARCHER: archerImg,
  ASSASSIN: assassinImg,
  BRAWLER: brawlerImg,
  CAVALRY: cavalryImg,
  GRAPPLER: grapplerImg,
  ILLUSIONIST: illusionistImg,
  INNKEEPER: innkeeperImg,
  JAILER: jailerImg,
  MANIPULATOR: manipulatorImg,
  NEMESIS: nemesisImg,
  OLD_BEAR: oldBearImg,
  CUB: oldBearImg,
  PROTECTOR: protectorImg,
  PROWLER: prowlerImg,
  ROYAL_GUARD: royalGuardImg,
  VIZIER: vizierImg,
};

// Mapping des noms de personnages
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

// === COMPOSANTS UI ===

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

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      onMouseEnter={onMouseEnter}
      className={`
        group relative p-3 rounded-xl border transition-all duration-300
        ${
          disabled
            ? "bg-slate-900/40 border-slate-800 opacity-50 cursor-not-allowed"
            : "bg-slate-800/80 border-cyan-500/30 hover:border-cyan-400 hover:bg-slate-800 hover:shadow-[0_0_15px_rgba(0,245,255,0.2)] cursor-pointer"
        }
      `}
    >
      <div
        className={`absolute left-0 top-3 bottom-3 w-1 rounded-r bg-amber-400`}
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
                  {icons.ACTIVE}
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

interface CharacterCard {
  id: string;
  characterId: string;
  name: string;
  description?: string;
}

interface GameProps {
  gameId: string;
  onBackToLobby: () => void;
}

export default function Game({ gameId, onBackToLobby }: GameProps) {
  const [gameState, setGameState] = useState<GameFrontend | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<PieceFrontend | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // États locaux pour gérer les phases
  const [localPhase, setLocalPhase] = useState<GamePhase>("ACTIONS");
  const [recruitmentCount, setRecruitmentCount] = useState(0);
  const [isRecruiting, setIsRecruiting] = useState(false);
  const [placementMode, setPlacementMode] = useState<{
    cardId: string;
    cardName: string;
  } | null>(null);

  // === ÉTATS POUR LES CAPACITÉS À PLUSIEURS ÉTAPES ===

  // Scénario 2: Manipulatrice (sélection cible puis destination)
  const [manipulatorTarget, setManipulatorTarget] =
    useState<PieceFrontend | null>(null);

  // Scénario 4: Cogneur (sélection cible puis destination de poussée)
  const [brawlerTarget, setBrawlerTarget] = useState<PieceFrontend | null>(
    null,
  );

  // Scénario 4: Lance-Grappin (choix du mode + sélection pour MOVE)
  const [grapplerTarget, setGrapplerTarget] = useState<PieceFrontend | null>(
    null,
  );
  const [grapplerMode, setGrapplerMode] = useState<"PULL" | "MOVE" | null>(
    null,
  );
  const [showGrapplerModal, setShowGrapplerModal] = useState(false);

  // Scénario 6: Tavernier (sélection allié puis destination)
  const [innkeeperTarget, setInnkeeperTarget] = useState<PieceFrontend | null>(
    null,
  );

  // Sons
  const [playButtonClickSfx] = useSound(buttonClickSfx);
  const [playButtonHoverSfx] = useSound(buttonHoverSfx);
  const [playCharacterHoverSfx] = useSound(characterHoverSfx);
  const [playCharacterSelectSfx] = useSound(characterSelectSfx);

  // === POLLING ===
  useEffect(() => {
    const fetchGameState = async () => {
      try {
        const game = await gameApi.getGameState(gameId);
        const mappedGame = gameApi.mapGameToFrontend(game);
        setGameState(mappedGame);
        setIsLoading(false);
        setError(null);
      } catch (err) {
        console.error("Erreur lors de la récupération du jeu:", err);
        setError("Impossible de se connecter au serveur");
        setIsLoading(false);
      }
    };

    fetchGameState();
    const interval = setInterval(fetchGameState, 2000);
    return () => clearInterval(interval);
  }, [gameId]);

  // === Effet pour afficher le modal du Grappler ===
  useEffect(() => {
    if (grapplerTarget && !grapplerMode) {
      setShowGrapplerModal(true);
    }
  }, [grapplerTarget, grapplerMode]);

  // === CALCULS MÉMORISÉS ===

  // Cases de spawn selon le joueur actuel
  const spawnCells = useMemo(() => {
    if (!gameState) return [];
    return gameState.currentPlayerIndex === 0
      ? [
          { q: 3, r: -2 },
          { q: 2, r: -3 },
          { q: 3, r: -3 },
        ]
      : [
          { q: -3, r: 2 },
          { q: -2, r: 3 },
          { q: -3, r: 3 },
        ];
  }, [gameState?.currentPlayerIndex]);

  // Cases de spawn LIBRES (non occupées)
  const availableSpawnCells = useMemo(() => {
    if (!gameState) return [];
    return spawnCells.filter(
      (cell) => !gameState.pieces.find((p) => p.q === cell.q && p.r === cell.r),
    );
  }, [gameState, spawnCells]);

  // Nombre de pièces du joueur actuel
  const currentPlayerPieceCount = useMemo(() => {
    if (!gameState) return 0;
    return gameState.pieces.filter(
      (p) => p.ownerIndex === gameState.currentPlayerIndex,
    ).length;
  }, [gameState]);

  // Peut recruter ?
  const canRecruit = useMemo(() => {
    return currentPlayerPieceCount < 5;
  }, [currentPlayerPieceCount]);

  // A des cases de spawn libres ?
  const hasAvailableSpawnCells = useMemo(() => {
    return availableSpawnCells.length > 0;
  }, [availableSpawnCells]);

  // === LOGIC ===

  const hexDistance = (
    q1: number,
    r1: number,
    q2: number,
    r2: number,
  ): number => {
    return (
      (Math.abs(q1 - q2) + Math.abs(q1 + r1 - q2 - r2) + Math.abs(r1 - r2)) / 2
    );
  };

  const detectAbilityMove = (
    piece: PieceFrontend,
    toQ: number,
    toR: number,
  ): string | null => {
    const dist = hexDistance(piece.q, piece.r, toQ, toR);

    if (dist <= 1) return null;

    if (dist === 2) {
      // Scénario 1: Acrobate et Cavalier
      if (piece.characterId === "ACROBAT") return "ACROBAT_JUMP";
      if (piece.characterId === "CAVALRY") return "CAVALRY_CHARGE";
    }

    // Scénario 6: Rôdeuse (téléportation sur distance > 1)
    if (piece.characterId === "PROWLER") return "PROWLER_STEALTH";

    return null;
  };

  // === FIN DE TOUR AUTOMATIQUE ===
  const autoEndTurnIfNeeded = useCallback(
    async (updatedGame: GameFrontend) => {
      const currentPieces = updatedGame.pieces.filter(
        (p) => p.ownerIndex === updatedGame.currentPlayerIndex,
      );
      const piecesRemaining = currentPieces.filter((p) => !p.hasActed);
      const pieceCount = currentPieces.length;

      console.log(
        `🔍 Auto-check: ${piecesRemaining.length} pièces restantes, ${pieceCount}/5 unités`,
      );

      // Tous les pions ont agi
      if (piecesRemaining.length === 0 && localPhase === "ACTIONS") {
        // Peut recruter ET a des cases libres ?
        if (pieceCount < 5) {
          // Vérifier s'il y a des cases de spawn libres
          const playerSpawnCells =
            updatedGame.currentPlayerIndex === 0
              ? [
                  { q: 3, r: -2 },
                  { q: 2, r: -3 },
                  { q: 3, r: -3 },
                ]
              : [
                  { q: -3, r: 2 },
                  { q: -2, r: 3 },
                  { q: -3, r: 3 },
                ];

          const freeSpawnCells = playerSpawnCells.filter(
            (cell) =>
              !updatedGame.pieces.find((p) => p.q === cell.q && p.r === cell.r),
          );

          if (freeSpawnCells.length > 0) {
            console.log("🔄 Passage automatique en RECRUITMENT");
            setLocalPhase("RECRUITMENT");
          } else {
            console.log("⚠️ Pas de case de spawn libre - Fin de tour forcée");
            await gameApi.endTurn(gameId);
            const newGame = await gameApi.getGameState(gameId);
            setGameState(gameApi.mapGameToFrontend(newGame));
            setLocalPhase("ACTIONS");
          }
        } else {
          // 5 unités = fin de tour automatique
          console.log("🔄 Limite 5 atteinte → Fin de tour automatique");
          await gameApi.endTurn(gameId);
          const newGame = await gameApi.getGameState(gameId);
          setGameState(gameApi.mapGameToFrontend(newGame));
          setLocalPhase("ACTIONS");
        }
      }
    },
    [gameId, localPhase],
  );

  const handleMove = useCallback(
    async (pieceId: string, toQ: number, toR: number) => {
      try {
        const piece = gameState?.pieces.find((p) => p.id === pieceId);
        if (!piece) {
          console.error("❌ Pièce non trouvée:", pieceId);
          return;
        }

        console.log("🎯 handleMove appelé:", {
          pieceId,
          toQ,
          toR,
          characterId: piece.characterId,
        });

        const abilityId = detectAbilityMove(piece, toQ, toR);

        if (abilityId) {
          console.log(`⚡ Capacité détectée: ${abilityId}`);

          let targetId: string | undefined = undefined;

          // Scénario 1: Acrobate - besoin de la pièce intermédiaire
          if (abilityId === "ACROBAT_JUMP") {
            const midQ = piece.q + (toQ - piece.q) / 2;
            const midR = piece.r + (toR - piece.r) / 2;

            const targetPiece = gameState?.pieces.find(
              (p) => p.q === midQ && p.r === midR,
            );

            if (!targetPiece) {
              console.error(
                `❌ ACROBAT_JUMP: Pas de pièce intermédiaire sur (${midQ}, ${midR})`,
              );
              alert("Impossible de sauter : aucune pièce à survoler !");
              return;
            }

            targetId = targetPiece.id;
            console.log(
              `🎯 ACROBAT_JUMP: Saut par-dessus ${targetPiece.characterId} (${targetId}) sur (${midQ}, ${midR})`,
            );
          }

          await gameApi.useAbility(gameId, pieceId, abilityId, targetId, {
            q: toQ,
            r: toR,
          });
          console.log(`✅ Capacité ${abilityId} envoyée au backend`);
        } else {
          await gameApi.movePiece(pieceId, toQ, toR);
          console.log("✅ Mouvement normal envoyé au backend");
        }

        // Récupérer le nouvel état
        const game = await gameApi.getGameState(gameId);
        const mappedGame = gameApi.mapGameToFrontend(game);
        setGameState(mappedGame);
        console.log(
          "✅ État synchronisé - Joueur:",
          mappedGame.currentPlayerIndex,
        );

        // Reset toutes les sélections
        setSelectedPiece(null);
        setManipulatorTarget(null);
        setBrawlerTarget(null);
        setGrapplerTarget(null);
        setGrapplerMode(null);
        setInnkeeperTarget(null);

        // 🔧 FIX: Utiliser le NOUVEL état (mappedGame) pour vérifier la fin de tour
        await autoEndTurnIfNeeded(mappedGame);
      } catch (err) {
        console.error("❌ Erreur lors du déplacement:", err);
        alert(
          "Impossible de déplacer la pièce. Vérifiez que le mouvement est valide.",
        );
      }
    },
    [gameId, gameState, autoEndTurnIfNeeded],
  );

  // Handler pour les capacités ciblant des personnages
  const handleAbilityUse = useCallback(
    async (
      abilityId: string,
      targetId: string,
      destination?: { q: number; r: number },
    ) => {
      if (!gameState || !selectedPiece) return;

      try {
        console.log(
          `⚡ Capacité ${abilityId} sur cible ${targetId}`,
          destination,
        );

        await gameApi.useAbility(
          gameId,
          selectedPiece.id,
          abilityId,
          targetId,
          destination || undefined,
        );

        console.log(`✅ ${abilityId} exécuté`);

        // Récupérer le nouvel état
        const game = await gameApi.getGameState(gameId);
        const mappedGame = gameApi.mapGameToFrontend(game);
        setGameState(mappedGame);

        // Reset toutes les sélections
        setSelectedPiece(null);
        setManipulatorTarget(null);
        setBrawlerTarget(null);
        setGrapplerTarget(null);
        setGrapplerMode(null);
        setInnkeeperTarget(null);

        // 🔧 FIX: Utiliser le NOUVEL état (mappedGame) pour vérifier la fin de tour
        await autoEndTurnIfNeeded(mappedGame);
      } catch (err) {
        console.error(`❌ Erreur ${abilityId}:`, err);
        alert(`Impossible d'utiliser ${abilityId}`);
      }
    },
    [gameId, gameState, selectedPiece, autoEndTurnIfNeeded],
  );

  // Handler spécifique pour le choix de mode du Grappler (Scénario 4)
  const handleGrapplerModeChoice = useCallback(
    async (mode: "PULL" | "MOVE") => {
      setShowGrapplerModal(false);

      if (mode === "PULL") {
        // PULL: exécute directement l'attraction
        if (grapplerTarget && selectedPiece) {
          await handleAbilityUse("GRAPPLE_HOOK", grapplerTarget.id, undefined);
        }
      } else {
        // MOVE: passe en mode sélection de destination
        setGrapplerMode("MOVE");
      }
    },
    [grapplerTarget, selectedPiece, handleAbilityUse],
  );

  const handleRecruit = useCallback(
    (cardId: string) => {
      if (!gameState) return;

      if (isRecruiting) {
        console.log("⚠️ Recrutement déjà en cours, action ignorée");
        return;
      }

      // 🔧 FIX: Vérifier la limite de 5 unités
      if (currentPlayerPieceCount >= 5) {
        alert(
          "❌ Limite atteinte: Vous ne pouvez pas avoir plus de 5 personnages (Leader inclus)",
        );
        return;
      }

      // 🔧 FIX: Vérifier qu'il y a des cases de spawn libres
      if (!hasAvailableSpawnCells) {
        alert(
          "❌ Aucune case de spawn disponible ! Déplacez vos unités des cases dorées avant de recruter.",
        );
        return;
      }

      const card = gameState.river?.find((c) => c.id === cardId);
      if (!card) return;
      const cardName = CHARACTER_NAMES[card.characterId] || card.characterId;

      playCharacterSelectSfx();

      setPlacementMode({ cardId, cardName });
      console.log(`📍 Mode placement activé pour: ${cardName}`);
    },
    [
      gameState,
      isRecruiting,
      currentPlayerPieceCount,
      hasAvailableSpawnCells,
      playCharacterSelectSfx,
    ],
  );

  const confirmPlacement = useCallback(
    async (q: number, r: number) => {
      if (!gameState || !placementMode) return;

      try {
        setIsRecruiting(true);

        const isValidCell = spawnCells.some(
          (cell) => cell.q === q && cell.r === r,
        );

        if (!isValidCell) {
          console.error(
            `❌ TENTATIVE DE PLACEMENT INVALIDE: (${q}, ${r}) pour joueur ${gameState.currentPlayerIndex}`,
          );
          alert(
            `❌ Erreur: Cette case n'est pas dans votre zone de recrutement!`,
          );
          return;
        }

        console.log(
          `🎴 Placement confirmé: ${placementMode.cardName} sur (${q}, ${r}) pour Joueur ${gameState.currentPlayerIndex + 1}`,
        );

        await gameApi.recruitCharacter(gameId, placementMode.cardId, [
          { q, r },
        ]);
        console.log("✅ Recrutement envoyé au backend");

        const game = await gameApi.getGameState(gameId);
        const mappedGame = gameApi.mapGameToFrontend(game);
        setGameState(mappedGame);

        const isPlayer2 = gameState.currentPlayerIndex === 1;
        const isTurn1 = gameState.turnNumber === 1;

        if (isPlayer2 && isTurn1) {
          const newCount = recruitmentCount + 1;
          setRecruitmentCount(newCount);
          console.log(`🎴 J2 Tour 1 - Recrutement ${newCount}/2`);

          if (newCount >= 2) {
            await gameApi.endTurn(gameId);
            console.log("✅ J2 Tour 1 - Fin de tour après 2 recrutements");

            setRecruitmentCount(0);
            setLocalPhase("ACTIONS");

            const updatedGame = await gameApi.getGameState(gameId);
            const updatedMappedGame = gameApi.mapGameToFrontend(updatedGame);
            setGameState(updatedMappedGame);
          }
        } else {
          await gameApi.endTurn(gameId);
          console.log("✅ Fin de tour après recrutement");

          setRecruitmentCount(0);
          setLocalPhase("ACTIONS");

          const updatedGame = await gameApi.getGameState(gameId);
          const updatedMappedGame = gameApi.mapGameToFrontend(updatedGame);
          setGameState(updatedMappedGame);
          console.log(
            "✅ Phase locale réinitialisée → ACTIONS | Joueur:",
            updatedMappedGame.currentPlayerIndex,
          );
        }
      } catch (err) {
        console.error("❌ Erreur lors du recrutement:", err);
        alert("Impossible de recruter ce personnage");
      } finally {
        setIsRecruiting(false);
        setPlacementMode(null);
      }
    },
    [gameState, gameId, placementMode, recruitmentCount, spawnCells],
  );

  const handleEndTurn = useCallback(async () => {
    try {
      console.log("⏭️ Bouton fin de tour cliqué");
      playButtonClickSfx();

      // 🔧 FIX: Si 5 unités OU pas de case de spawn libre → Fin de tour directe
      if (!canRecruit || !hasAvailableSpawnCells) {
        console.log("🔄 Fin de tour directe (5 unités ou pas de case libre)");
        await gameApi.endTurn(gameId);

        const game = await gameApi.getGameState(gameId);
        const mappedGame = gameApi.mapGameToFrontend(game);
        setGameState(mappedGame);
        setLocalPhase("ACTIONS");
        console.log("✅ Tour terminé | Joueur:", mappedGame.currentPlayerIndex);
      } else {
        // Peut recruter → Passer en phase recrutement
        setLocalPhase("RECRUITMENT");
        console.log("✅ Phase locale changée → RECRUITMENT");
      }
    } catch (err) {
      console.error("❌ Erreur:", err);
    }
  }, [playButtonClickSfx, canRecruit, hasAvailableSpawnCells, gameId]);

  // === RENDER CONDITIONNEL ===
  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-[#020617] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">⏳</div>
          <p className="text-xl font-orbitron tracking-wider">
            CHARGEMENT DE LA PARTIE...
          </p>
        </div>
      </div>
    );
  }

  if (error || !gameState) {
    return (
      <div className="h-screen w-screen bg-[#020617] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-xl font-orbitron tracking-wider text-red-500 mb-4">
            {error || "Partie introuvable"}
          </p>
          <button
            onClick={onBackToLobby}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-orbitron font-bold"
          >
            RETOUR AU LOBBY
          </button>
        </div>
      </div>
    );
  }

  const isGameFinished =
    gameState.status === "FINISHED_CAPTURE" || gameState.status === "FINISHED";
  if (
    isGameFinished ||
    (gameState.winnerPlayerIndex !== undefined &&
      gameState.winnerPlayerIndex !== null)
  ) {
    const victoryType: "CAPTURE" | "ENCIRCLEMENT" =
      gameState.winnerVictoryType ||
      (gameState.status === "FINISHED_CAPTURE" ? "CAPTURE" : "ENCIRCLEMENT");

    // 🆕 Calculer les stats dynamiques
    const winnerIndex = gameState.winnerPlayerIndex ?? 0;
    const loserIndex = winnerIndex === 0 ? 1 : 0;
    const winnerPieces = gameState.pieces.filter(
      (p) => p.ownerIndex === winnerIndex,
    );
    const loserPieces = gameState.pieces.filter(
      (p) => p.ownerIndex === loserIndex,
    );

    return (
      <VictoryScreen
        winner={winnerIndex as 0 | 1}
        victoryType={victoryType}
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
      description: undefined,
    }));

  const currentPlayerPieces = gameState.pieces.filter(
    (p) => p.ownerIndex === gameState.currentPlayerIndex,
  );
  const piecesReadyToMove = currentPlayerPieces.filter((p) => !p.hasActed);

  // Déterminer quel mode est actif pour l'indicateur
  const activeTarget =
    manipulatorTarget ||
    brawlerTarget ||
    innkeeperTarget ||
    (grapplerTarget && grapplerMode === "MOVE" ? grapplerTarget : null);
  const activeTargetName = activeTarget
    ? CHARACTER_NAMES[activeTarget.characterId] || activeTarget.characterId
    : "";

  let activeModeLabel = "";
  let activeModeColor = "purple";
  let activeModeIcon = "🎯";

  if (manipulatorTarget) {
    activeModeLabel = "Manipulatrice";
    activeModeColor = "purple";
    activeModeIcon = "🎯";
  } else if (brawlerTarget) {
    activeModeLabel = "Cogneur";
    activeModeColor = "orange";
    activeModeIcon = "💥";
  } else if (innkeeperTarget) {
    activeModeLabel = "Tavernier";
    activeModeColor = "yellow";
    activeModeIcon = "🍺";
  } else if (grapplerTarget && grapplerMode === "MOVE") {
    activeModeLabel = "Lance-Grappin";
    activeModeColor = "cyan";
    activeModeIcon = "🏃";
  }

  // 🔧 FIX: Message pour le bouton selon l'état
  let endTurnButtonLabel = "⏭️ PASSER AUX RENFORTS";
  let endTurnButtonEnabled = true;

  if (!canRecruit) {
    endTurnButtonLabel = "⏭️ TERMINER LE TOUR";
  } else if (!hasAvailableSpawnCells) {
    endTurnButtonLabel = "⚠️ LIBÉREZ UNE CASE DE SPAWN";
  }

  return (
    <div className="h-screen w-screen bg-[#020617] text-white font-mono flex overflow-hidden relative selection:bg-cyan-500 selection:text-black">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/20 via-[#020617] to-[#020617] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 245, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 245, 255, 0.1) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
          maskImage:
            "radial-gradient(circle at center, black 40%, transparent 100%)",
        }}
      />

      {/* Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[128px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px] pointer-events-none animate-pulse delay-1000" />

      {/* Cyber UI Corners */}
      <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-cyan-500 rounded-tl-lg pointer-events-none drop-shadow-[0_0_8px_rgba(0,245,255,0.8)]" />
      <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-cyan-500 rounded-tr-lg pointer-events-none drop-shadow-[0_0_8px_rgba(0,245,255,0.8)]" />
      <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-cyan-500 rounded-bl-lg pointer-events-none drop-shadow-[0_0_8px_rgba(0,245,255,0.8)]" />
      <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-cyan-500 rounded-br-lg pointer-events-none drop-shadow-[0_0_8px_rgba(0,245,255,0.8)]" />

      {/* === HEADER === */}
      <div className="absolute top-0 left-0 right-0 h-24 z-20 flex items-center justify-center pointer-events-none">
        <div className="relative flex items-center gap-8 bg-slate-950/80 backdrop-blur-xl px-16 py-4 rounded-b-[2rem] border-x border-b border-cyan-500/20 shadow-[0_0_40px_rgba(0,245,255,0.15)] pointer-events-auto overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

          <div className="flex items-center gap-4">
            <span className="text-2xl animate-spin-slow">💠</span>
            <h1 className="font-cyber text-5xl font-bold italic tracking-[0.1em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-cyan-100 to-cyan-300 drop-shadow-[0_0_10px_rgba(0,245,255,0.4)]">
              {localPhase === "RECRUITMENT" ? "RENFORTS" : "COMBAT"}
            </h1>
          </div>

          <div className="w-px h-10 bg-gradient-to-b from-transparent via-slate-700 to-transparent" />

          <div className="flex items-center gap-6 text-xs font-bold uppercase tracking-widest">
            <span className="text-slate-500">
              TOUR{" "}
              <span className="text-cyan-50 text-base ml-1">
                {gameState.turnNumber}
              </span>
            </span>
            <div
              className={`
              px-6 py-2 rounded-full border shadow-[0_0_15px_inset] transition-all duration-300
              ${
                gameState.currentPlayerIndex === 0
                  ? "border-cyan-500 text-cyan-400 bg-cyan-950/30 shadow-cyan-500/20"
                  : "border-rose-500 text-rose-400 bg-rose-950/30 shadow-rose-500/20"
              }
            `}
            >
              JOUEUR {gameState.currentPlayerIndex + 1} EN LIGNE
            </div>
          </div>
        </div>
      </div>

      {/* === MODALS ET INDICATEURS === */}

      {/* Placement Mode Indicator */}
      {placementMode && (
        <div className="absolute top-32 left-1/2 transform -translate-x-1/2 z-40 px-8 py-4 bg-amber-950/90 backdrop-blur-xl border-2 border-amber-500/50 rounded-2xl shadow-[0_0_30px_rgba(251,191,36,0.3)] animate-pulse">
          <p className="text-amber-400 font-bold text-sm uppercase tracking-wider text-center">
            📍 Placez {placementMode.cardName} sur une case dorée
          </p>
          <button
            onClick={() => {
              setPlacementMode(null);
              playButtonClickSfx();
            }}
            className="mt-3 w-full px-4 py-2 bg-slate-800 text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-700 hover:text-white transition-all text-xs font-bold"
          >
            ✖ ANNULER
          </button>
        </div>
      )}

      {/* Ability Target Mode Indicator */}
      {activeTarget && !showGrapplerModal && (
        <div
          className={`absolute top-32 left-1/2 transform -translate-x-1/2 z-40 px-8 py-4 backdrop-blur-xl border-2 rounded-2xl shadow-[0_0_30px] animate-pulse
          ${activeModeColor === "purple" ? "bg-purple-950/90 border-purple-500/50 shadow-purple-500/30" : ""}
          ${activeModeColor === "orange" ? "bg-orange-950/90 border-orange-500/50 shadow-orange-500/30" : ""}
          ${activeModeColor === "yellow" ? "bg-yellow-950/90 border-yellow-500/50 shadow-yellow-500/30" : ""}
          ${activeModeColor === "cyan" ? "bg-cyan-950/90 border-cyan-500/50 shadow-cyan-500/30" : ""}
        `}
        >
          <p
            className={`font-bold text-sm uppercase tracking-wider text-center
            ${activeModeColor === "purple" ? "text-purple-400" : ""}
            ${activeModeColor === "orange" ? "text-orange-400" : ""}
            ${activeModeColor === "yellow" ? "text-yellow-400" : ""}
            ${activeModeColor === "cyan" ? "text-cyan-400" : ""}
          `}
          >
            {activeModeIcon} {activeModeLabel}: Choisissez où déplacer{" "}
            {activeTargetName}
          </p>
          <button
            onClick={() => {
              setManipulatorTarget(null);
              setBrawlerTarget(null);
              setGrapplerTarget(null);
              setGrapplerMode(null);
              setInnkeeperTarget(null);
              playButtonClickSfx();
            }}
            className="mt-3 w-full px-4 py-2 bg-slate-800 text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-700 hover:text-white transition-all text-xs font-bold"
          >
            ✖ ANNULER
          </button>
        </div>
      )}

      {/* Grappler Mode Selection Modal */}
      {showGrapplerModal && grapplerTarget && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900/95 border-2 border-cyan-500/50 rounded-2xl p-8 shadow-[0_0_50px_rgba(6,182,212,0.3)] max-w-md">
            <h3 className="text-cyan-400 font-bold text-xl uppercase tracking-wider text-center mb-6">
              🪝 Lance-Grappin
            </h3>
            <p className="text-slate-300 text-center mb-6">
              Que voulez-vous faire avec{" "}
              <span className="text-cyan-400 font-bold">
                {CHARACTER_NAMES[grapplerTarget.characterId]}
              </span>{" "}
              ?
            </p>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => handleGrapplerModeChoice("PULL")}
                className="px-6 py-4 bg-cyan-600/20 text-cyan-400 border border-cyan-500/50 rounded-xl hover:bg-cyan-500 hover:text-white transition-all font-bold flex items-center justify-center gap-3"
              >
                <span className="text-2xl">🎣</span>
                <div className="text-left">
                  <div>ATTIRER</div>
                  <div className="text-xs opacity-70">
                    Ramener la cible vers moi
                  </div>
                </div>
              </button>
              <button
                onClick={() => handleGrapplerModeChoice("MOVE")}
                className="px-6 py-4 bg-emerald-600/20 text-emerald-400 border border-emerald-500/50 rounded-xl hover:bg-emerald-500 hover:text-white transition-all font-bold flex items-center justify-center gap-3"
              >
                <span className="text-2xl">🏃</span>
                <div className="text-left">
                  <div>SE DÉPLACER</div>
                  <div className="text-xs opacity-70">Aller vers la cible</div>
                </div>
              </button>
              <button
                onClick={() => {
                  setShowGrapplerModal(false);
                  setGrapplerTarget(null);
                  playButtonClickSfx();
                }}
                className="px-6 py-3 bg-slate-800 text-slate-400 border border-slate-600 rounded-xl hover:bg-slate-700 hover:text-white transition-all font-bold"
              >
                ✖ ANNULER
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Turn / Recruitment Button */}
      {localPhase === "ACTIONS" &&
        !placementMode &&
        !activeTarget &&
        !showGrapplerModal && (
          <div className="absolute top-8 left-10 z-30 flex flex-col gap-2">
            {piecesReadyToMove.length > 0 && (
              <div className="px-4 py-2 bg-slate-900/80 border border-emerald-500/30 rounded-lg text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                🎯 {piecesReadyToMove.length} unité
                {piecesReadyToMove.length > 1 ? "s" : ""} disponible
                {piecesReadyToMove.length > 1 ? "s" : ""}
              </div>
            )}

            {/* 🔧 FIX: Affichage dynamique selon l'état */}
            {canRecruit && hasAvailableSpawnCells ? (
              <button
                onClick={handleEndTurn}
                onMouseEnter={() => playButtonHoverSfx()}
                className="flex items-center gap-2 px-5 py-2.5 bg-cyan-950/20 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500 hover:text-white hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all uppercase text-[10px] font-bold tracking-[0.2em]"
              >
                <span>⏭️ PASSER AUX RENFORTS</span>
              </button>
            ) : canRecruit && !hasAvailableSpawnCells ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 px-5 py-2.5 bg-amber-950/20 text-amber-400 border border-amber-500/30 rounded-lg uppercase text-[10px] font-bold tracking-[0.2em]">
                  <span>⚠️ LIBÉREZ UNE CASE DORÉE</span>
                </div>
                <button
                  onClick={handleEndTurn}
                  onMouseEnter={() => playButtonHoverSfx()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-800/50 text-slate-400 border border-slate-600/30 rounded-lg hover:bg-slate-700 hover:text-white transition-all uppercase text-[10px] font-bold tracking-[0.2em]"
                >
                  <span>⏭️ PASSER SANS RECRUTER</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleEndTurn}
                onMouseEnter={() => playButtonHoverSfx()}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-950/20 text-rose-400 border border-rose-500/30 rounded-lg hover:bg-rose-500 hover:text-white hover:shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all uppercase text-[10px] font-bold tracking-[0.2em]"
              >
                <span>⏭️ TERMINER LE TOUR (5/5)</span>
              </button>
            )}
          </div>
        )}

      {/* Quit Button */}
      <button
        onClick={() => {
          onBackToLobby();
          playButtonClickSfx();
        }}
        onMouseEnter={() => playButtonHoverSfx()}
        className="absolute top-8 right-10 z-30 flex items-center gap-2 px-5 py-2.5 bg-rose-950/20 text-rose-500 border border-rose-500/30 rounded-lg hover:bg-rose-500 hover:text-white hover:shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all uppercase text-[10px] font-bold tracking-[0.2em]"
      >
        <span>↪ QUITTER</span>
      </button>

      {/* === MAIN LAYOUT === */}
      <div className="flex-1 flex items-center justify-between px-10 pt-24 pb-10 w-full z-10 gap-10">
        {/* LEFT: RIVIÈRE */}
        <div className="w-80 h-full flex flex-col gap-5 animate-in slide-in-from-left duration-500 fade-in">
          <div className="relative overflow-hidden bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-white/5 shadow-2xl group">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(8,145,178,0.5)]">
                🌊
              </div>
              <div>
                <h2 className="font-cyber font-bold text-xl text-white tracking-wide">
                  RIVIÈRE
                </h2>
                <p className="text-[10px] text-cyan-400 uppercase tracking-widest font-semibold">
                  Renforts Tactiques
                </p>
              </div>
            </div>

            <button
              disabled
              className={`relative w-full py-3 rounded-xl font-bold text-xs uppercase tracking-[0.15em] transition-all overflow-hidden cursor-default
                ${
                  localPhase === "RECRUITMENT" &&
                  canRecruit &&
                  hasAvailableSpawnCells
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)] animate-pulse"
                    : localPhase === "RECRUITMENT" &&
                        canRecruit &&
                        !hasAvailableSpawnCells
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/50"
                      : localPhase === "RECRUITMENT" && !canRecruit
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/50"
                        : "bg-slate-800/50 text-slate-600 border border-slate-800"
                }
              `}
            >
              <div className="absolute inset-0 bg-cyan-500/5 translate-y-full transition-transform duration-300" />
              <span className="relative z-10">
                {localPhase === "RECRUITMENT" &&
                canRecruit &&
                hasAvailableSpawnCells
                  ? "⚠️ RECRUTEMENT REQUIS"
                  : localPhase === "RECRUITMENT" &&
                      canRecruit &&
                      !hasAvailableSpawnCells
                    ? "⚠️ LIBÉREZ UNE CASE DORÉE"
                    : localPhase === "RECRUITMENT" && !canRecruit
                      ? "🚫 LIMITE 5 ATTEINTE"
                      : "🔒 RIVIÈRE VERROUILLÉE"}
              </span>
            </button>
            <p className="text-[10px] text-slate-500 mt-2 text-center">
              Unités: {currentPlayerPieceCount}/5 | Cases libres:{" "}
              {availableSpawnCells.length}/3
            </p>
          </div>

          <div className="flex-1 overflow-y-auto pr-3 space-y-3 custom-scrollbar">
            {riverCards.map((card) => (
              <SidebarCard
                key={card.id}
                card={card}
                onClick={() => handleRecruit(card.id)}
                onMouseEnter={() => {
                  if (
                    localPhase === "RECRUITMENT" &&
                    !isRecruiting &&
                    canRecruit &&
                    hasAvailableSpawnCells
                  ) {
                    playCharacterHoverSfx();
                  }
                }}
                disabled={
                  localPhase !== "RECRUITMENT" ||
                  isRecruiting ||
                  !canRecruit ||
                  !hasAvailableSpawnCells
                }
              />
            ))}
          </div>
        </div>

        {/* CENTER: HEXBOARD */}
        <div className="flex-1 flex items-center justify-center relative z-0">
          <div className="relative p-14 group">
            <div className="absolute inset-0 border border-cyan-500/20 rounded-full animate-[spin_20s_linear_infinite]" />
            <div className="absolute inset-8 border border-dashed border-cyan-500/20 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
            <div className="absolute inset-0 bg-cyan-500/5 blur-3xl rounded-full" />

            <div className="relative scale-90 xl:scale-105 transition-transform duration-500 filter drop-shadow-[0_0_40px_rgba(6,182,212,0.2)]">
              <HexBoard
                pieces={gameState.pieces}
                currentPlayer={gameState.currentPlayerIndex}
                phase={localPhase as "ACTIONS" | "RECRUITMENT"}
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
              />
            </div>
          </div>
        </div>

        {/* RIGHT: SCANNER */}
        <div className="w-80 h-72 animate-in slide-in-from-right duration-500 fade-in">
          <div
            className={`
             h-full w-full rounded-2xl border transition-all duration-300 relative overflow-hidden group bg-slate-900/40 backdrop-blur-sm
             ${
               selectedPiece
                 ? "border-amber-500/50 shadow-[0_0_30px_inset_rgba(245,158,11,0.1)]"
                 : "border-white/10 border-dashed hover:border-cyan-500/30"
             }
           `}
          >
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-1/4 animate-[scan_2s_linear_infinite] opacity-30 pointer-events-none" />

            {selectedPiece ? (
              <div className="relative z-10 p-8 h-full flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-amber-500/50 mb-4 shadow-[0_0_25px_rgba(251,191,36,0.5)] relative bg-slate-900/80">
                  {CHARACTER_IMAGES[selectedPiece.characterId] ? (
                    <img
                      src={CHARACTER_IMAGES[selectedPiece.characterId]}
                      alt={selectedPiece.characterId}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-amber-400 to-orange-600">
                      {selectedPiece.characterId === "LEADER" ? "👑" : "⚔️"}
                    </div>
                  )}
                </div>
                <h3 className="font-cyber text-3xl font-bold text-amber-400 tracking-wider mb-2 drop-shadow-md">
                  {CHARACTER_NAMES[selectedPiece.characterId] ||
                    selectedPiece.characterId}
                </h3>

                <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent my-3" />

                <div className="text-xs font-mono space-y-1.5 uppercase tracking-wide">
                  <p className="text-slate-400">
                    COORD :{" "}
                    <span className="text-white font-bold ml-1">
                      [{selectedPiece.q}, {selectedPiece.r}]
                    </span>
                  </p>
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded border overflow-hidden relative ${selectedPiece.hasActed ? "border-rose-500/30 text-rose-400" : "border-emerald-500/30 text-emerald-400"}`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full animate-pulse ${selectedPiece.hasActed ? "bg-rose-500" : "bg-emerald-500"}`}
                    />
                    {selectedPiece.hasActed
                      ? "SYSTÈME : ÉPUISÉ"
                      : "SYSTÈME : PRÊT"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 border border-dashed border-cyan-500/30 rounded-xl mb-6 flex items-center justify-center text-3xl text-cyan-500/30 animate-pulse">
                  ⌖
                </div>
                <p className="font-cyber text-cyan-400 font-bold tracking-[0.3em] uppercase text-xs animate-pulse">
                  ANALYSE MATRICE
                </p>
                <p className="text-slate-600 text-[10px] mt-2 uppercase tracking-widest">
                  ATTENTE SÉLECTION CIBLE...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Status */}
      <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none">
        <div className="flex justify-center items-center gap-6 opacity-60">
          <span className="h-px w-32 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
            <p className="font-cyber text-[10px] font-medium text-cyan-400 tracking-[0.4em] uppercase drop-shadow-[0_0_5px_rgba(0,245,255,0.8)]">
              CONNEXION SÉCURISÉE ÉTABLIE
            </p>
            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
          </div>
          <span className="h-px w-32 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@300;400;500;600;700&display=swap');

        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(400%); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(6,182,212,0.3); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(6,182,212,0.6); }
        .text-shadow-glow { text-shadow: 0 0 10px rgba(6,182,212,0.5); }

        .font-cyber {
          font-family: 'Chakra Petch', sans-serif;
          font-feature-settings: "smcp", "c2sc";
        }
      `}</style>
    </div>
  );
}
