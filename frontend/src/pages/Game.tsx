import HexBoard from "../components/HexBoard";
function Game() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900">
      <h1 className="text-white text-2xl font-bold mb-4">Leaders</h1>
      <HexBoard />
    </div>
  );
}

export default Game;
