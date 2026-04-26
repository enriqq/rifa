import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wine, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { GOLD } from '../lib/constants';

export default function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signUp(email, password, fullName);
      setRegistered(true); // Mostrar mensaje de confirmación
    } catch (err: any) {
      setError(
        err.message?.includes('already registered')
          ? 'Este email ya esta registrado'
          : 'Error al crear cuenta'
      );
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
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <Wine size={32} style={{ color: GOLD }} />
            <span className="text-2xl font-bold text-white">
              Rifando<span style={{ color: GOLD }}>Ando</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Crear cuenta</h1>
          <p className="text-gray-500 text-sm mt-1">Regístrate para participar en el sorteo</p>
        </div>

        {registered ? (
          <div className="text-center text-green-400 p-4 rounded-xl bg-green-900/20 border border-green-800/50">
            ¡Registro exitoso! Por favor revisa tu correo y confirma tu cuenta antes de iniciar sesión.
          </div>
        ) : (
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
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Nombre completo</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all focus:ring-2"
                style={{ background: '#1a1a1a', border: '1px solid #333' }}
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all focus:ring-2"
                style={{ background: '#1a1a1a', border: '1px solid #333' }}
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all focus:ring-2 pr-12"
                  style={{ background: '#1a1a1a', border: '1px solid #333' }}
                  placeholder="Minimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] disabled:opacity-50"
              style={{ background: GOLD, color: '#101010' }}
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>

            <p className="text-center text-sm text-gray-500">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="font-semibold hover:underline" style={{ color: GOLD }}>
                Inicia sesión
              </Link>
            </p>
          </form>
        )}
      </motion.div>
    </div>
  );
}
