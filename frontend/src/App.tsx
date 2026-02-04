import { useState } from "react";
import Home from "./pages/Home";
import Lobby from "./pages/Lobby";
import Game from "./pages/Game";
import Rules from "./pages/Rules";

function App() {
  const [step, setStep] = useState("home"); // "home", "lobby", ou "game"

  if (step === "game") {
    return <Game onBackToLobby={() => setStep("lobby")} />;
  }

  if (step === "lobby") {
    return <Lobby onStartGame={() => setStep("game")} onOpenRules={() => setStep("rules")} />;
  }

  if (step === "rules") {
    return <Rules onBack={() => setStep("lobby")} />;
  }

  return <Home onStart={() => setStep("lobby")} />;
}

export default App;
