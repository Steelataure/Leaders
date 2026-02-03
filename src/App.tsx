import { useState } from "react";
import Lobby from "./pages/Lobby";
import Game from "./pages/Game";

function App() {
  const [inGame, setInGame] = useState(false);

  if (inGame) return <Game onBackToLobby={() => setInGame(false)} />;
  return <Lobby onStartGame={() => setInGame(true)} />;
}

export default App;
