import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuthStore } from '@context/authContext';
import ErrorBoundary from '@components/ErrorBoundary';
import Navbar from '@components/Navbar';
import Dashboard from '@pages/Dashboard';
import PlayersClean from '@pages/PlayersClean';
import Teams from '@pages/Teams';
import Matches from '@pages/Matches';
import Login from '@pages/Login';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <ErrorBoundary>
      <Router>
        {isAuthenticated && <Navbar />}
        <Routes>
          {!isAuthenticated ? (
            <Route path="/" element={<Login />} />
          ) : (
            <>
              <Route path="/" element={<Dashboard />} />
              <Route path="/players" element={<PlayersClean />} />
              <Route path="/players/:id" element={<PlayersClean />} />
              <Route path="/teams" element={<Teams />} />
              <Route path="/teams/:id" element={<Teams />} />
              <Route path="/matches" element={<Matches />} />
              <Route path="/matches/:id" element={<Matches />} />
            </>
          )}
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
