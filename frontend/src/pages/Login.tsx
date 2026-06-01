import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@context/authContext';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@fotnep.com');
  const [password, setPassword] = useState('fotnep2025');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      setError(message);
      console.error('Login failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-dark-primary min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-text-primary mb-2">FotNep</h1>
            <p className="text-text-secondary text-sm">Nepali Football Analytics</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-semantic-loss/10 border border-semantic-loss text-semantic-loss rounded p-3 mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-text-secondary text-xs uppercase tracking-wider mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input w-full"
                placeholder="admin@fotnep.com"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-text-secondary text-xs uppercase tracking-wider mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input w-full"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-6">
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-dark-border">
            <p className="text-text-secondary text-xs mb-3">Demo Credentials</p>
            <div className="space-y-2 text-sm text-text-muted">
              <div>
                <p className="text-text-secondary text-xs">Email</p>
                <p className="font-mono">admin@fotnep.com</p>
              </div>
              <div>
                <p className="text-text-secondary text-xs">Password</p>
                <p className="font-mono">fotnep2025</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-text-muted text-xs">Nepali National Football Team Analytics Platform</p>
        </div>
      </div>
    </div>
  );
}
