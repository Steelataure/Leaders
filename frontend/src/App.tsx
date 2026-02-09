import { useState } from "react";
import Home from "./pages/Home";
import Lobby from "./pages/Lobby";
import Game from "./pages/Game";
import Rules from "./pages/Rules";

function App() {
  const [step, setStep] = useState("home"); // "home", "lobby", ou "game"
  const [gameId, setGameId] = useState<string | null>(null);

  const handleStartGame = (id: string) => {
    setGameId(id);
    setStep("game");
  };

  const handleBackToLobby = () => {
    setGameId(null);
    setStep("lobby");
  };

  if (step === "game" && gameId) {
    return <Game gameId={gameId} sessionId={gameId} onBackToLobby={handleBackToLobby} />;
  }

  if (step === "lobby") {
    return (
      <Lobby
        onStartGame={handleStartGame}
        onOpenRules={() => setStep("rules")}
      />
    );
  }

  if (step === "rules") {
    return <Rules onBack={() => setStep("lobby")} />;
  }

  return <Home onStart={() => setStep("lobby")} />;
}

export default App;
