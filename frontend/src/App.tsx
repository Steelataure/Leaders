import { useState } from "react";
import Home from "./pages/Home";
import Lobby from "./pages/Lobby";
import Game from "./pages/Game";
import Rules from "./pages/Rules";
import { AudioProvider } from "./context/AudioContext";

function App() {
  const [step, setStep] = useState("home"); // "home", "lobby", ou "game"

  if (step === "game") {
    return <AudioProvider>
      <Game onBackToLobby={() => setStep("lobby")} />
    </AudioProvider>;
  }

  if (step === "lobby") {
    return <AudioProvider>
      <Lobby onStartGame={() => setStep("game")} onOpenRules={() => setStep("rules")} />    
      </AudioProvider>;
  }

  if (step === "rules") {
    return <AudioProvider>
      <Rules onBack={() => setStep("lobby")} />     
      </AudioProvider>;
  }

  return <AudioProvider>
    <Home onStart={() => setStep("lobby")} />
    </AudioProvider>;
}

export default App;
