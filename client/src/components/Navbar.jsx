export default function Navbar({ account, onConnect }) {
  return (
    <nav className="flex justify-between items-center px-6 py-4 bg-gray-800 shadow-lg">
      <h1 className="text-2xl font-bold">🎰 Casino DApp</h1>
      {account ? (
        <p className="text-green-400 font-mono">
          {account.slice(0, 6)}...{account.slice(-4)}
        </p>
      ) : (
        <button
          onClick={onConnect}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
        >
          Connect Wallet
        </button>
      )}
    </nav>
  );
}
