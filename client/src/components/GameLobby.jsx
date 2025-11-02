export default function GameLobby({ onCreate, onJoin }) {
  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
      <h3 className="text-2xl font-bold mb-4">🎮 Game Lobby</h3>
      <p className="text-gray-400 mb-4">Create or join a room to start playing.</p>

      <div className="flex gap-4">
        <button
          onClick={onCreate}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
        >
          Create Lobby
        </button>
        <button
          onClick={onJoin}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
        >
          Join Lobby
        </button>
      </div>
    </div>
  );
}
