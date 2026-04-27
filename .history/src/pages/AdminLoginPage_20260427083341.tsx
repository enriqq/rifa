import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { GOLD } from '../lib/constants';

export default function AdminLoginPage() {
  const { signIn, profile, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && profile) {
      if (profile.is_admin) {
        navigate('/admin-portal');
      } else {
        setError('Esta cuenta no tiene permisos de administrador.');
      }
    }
  }, [user, profile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
    } catch {
      setError('Credenciales invalidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#101010' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Shield size={48} className="mx-auto mb-4" style={{ color: GOLD }} />
          <h1 className="text-2xl font-bold text-white">Portal de administración</h1>
          <p className="text-gray-500 text-sm mt-1">Acceso exclusivo para administradores</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-gray-800 p-6 sm:p-8 space-y-5"
          style={{ background: '#141414' }}
        >
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-900/20 border border-red-800/50 text-red-400 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Admin</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
              style={{ background: '#1a1a1a', border: '1px solid #333' }}
              placeholder="admin@sorteospremium.cl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Contrasena</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
              style={{ background: '#1a1a1a', border: '1px solid #333' }}
              placeholder="********"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] disabled:opacity-50"
            style={{ background: GOLD, color: '#101010' }}
          >
            {loading ? 'Verificando...' : 'Ingresar como Admin'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
