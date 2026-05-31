import { Link } from 'react-router-dom';
import { useAuthStore } from '@context/authContext';

export default function Navbar() {
  const { logout } = useAuthStore();

  return (
    <nav className="bg-slate-900 text-white px-6 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">
          FotNep ⚽
        </Link>
        <ul className="flex gap-6">
          <li><Link to="/" className="hover:text-blue-400">Dashboard</Link></li>
          <li><Link to="/players" className="hover:text-blue-400">Players</Link></li>
          <li><Link to="/teams" className="hover:text-blue-400">Teams</Link></li>
          <li><Link to="/matches" className="hover:text-blue-400">Matches</Link></li>
          <li>
            <button
              onClick={logout}
              className="bg-red-600 px-4 py-2 rounded hover:bg-red-700"
            >
              Logout
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
