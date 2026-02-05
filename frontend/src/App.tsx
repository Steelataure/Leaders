import { useState } from "react";
import Home from "./pages/Home";
import Lobby from "./pages/Lobby";
import Game from "./pages/Game";
import Rules from "./pages/Rules";

function App() {
  const [step, setStep] = useState("home"); // "home", "lobby", ou "game"
  const [gameId, setGameId] = useState<string | null>(null);

  if (step === "game") {
    return <Game gameId={gameId} onBackToLobby={() => setStep("lobby")} />;
  }

  if (step === "lobby") {
    return <Lobby
      onStartGame={(id) => {
        setGameId(id);
        setStep("game");
      }}
      onOpenRules={() => setStep("rules")}
    />;
  }

  if (step === "rules") {
    return <Rules onBack={() => setStep("lobby")} />;
  }

  return <Home onStart={() => setStep("lobby")} />;
}

export default App;
