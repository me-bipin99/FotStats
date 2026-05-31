import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuthStore } from '@context/authContext';
import Navbar from '@components/Navbar';
import Dashboard from '@pages/Dashboard';
import Players from '@pages/Players';
import Teams from '@pages/Teams';
import Matches from '@pages/Matches';
import Login from '@pages/Login';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Router>
      {isAuthenticated && <Navbar />}
      <Routes>
        {!isAuthenticated ? (
          <Route path="/" element={<Login />} />
        ) : (
          <>
            <Route path="/" element={<Dashboard />} />
            <Route path="/players" element={<Players />} />
            <Route path="/players/:id" element={<Players />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/teams/:id" element={<Teams />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/matches/:id" element={<Matches />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;
