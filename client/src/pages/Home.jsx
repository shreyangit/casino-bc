import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-[80vh] text-center">
      <h2 className="text-4xl font-bold mb-6">Welcome to the Decentralized Casino 🎲</h2>
      <p className="text-gray-300 mb-10 max-w-lg">
        Play, bet, and win — fully decentralized, no middleman, and verified on blockchain.
      </p>

      <div className="flex gap-4">
        <Link
          to="/play"
          className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold"
        >
          Join a Game
        </Link>
        <Link
          to="/profile"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
        >
          View Profile
        </Link>
      </div>
    </div>
  );
}
