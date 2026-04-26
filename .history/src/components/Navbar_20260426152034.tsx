import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Wine, User, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    ...(user ? [{ to: '/dashboard', label: 'Mis Tickets' }] : []),
    ...(profile?.is_admin ? [{ to: '/admin-portal', label: 'Admin' }] : []),
  ];

  return (
    <nav
      className="sticky top-0 z-40 border-b border-gray-800"
      style={{ background: 'rgba(16,16,16,0.95)', backdropFilter: 'blur(12px)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Wine size={24} style={{ color: '#D4AF37' }} />
            <span className="text-lg font-bold text-white tracking-tight">
              Rifando<span style={{ color: '#D4AF37' }}>Ando</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.to)
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                style={isActive(link.to) ? { background: '#1a1a1a', color: '#D4AF37' } : {}}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
                >
                  <User size={16} />
                  <span>{profile?.name || user.email}</span>
                </Link>
                <button
                  onClick={signOut}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-400 transition-colors"
                >
                  <LogOut size={14} />
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: '#D4AF37',
                  color: '#101010',
                }}
              >
                Ingresar
              </Link>
            )}
          </div>

          <button
            className="md:hidden text-gray-400"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden border-t border-gray-800"
            style={{ background: '#101010' }}
          >
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive(link.to) ? 'text-white' : 'text-gray-400'
                  }`}
                  style={isActive(link.to) ? { background: '#1a1a1a', color: '#D4AF37' } : {}}
                >
                  {link.label}
                </Link>
              ))}
              {user ? (
                <button
                  onClick={() => { signOut(); setMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-red-400"
                >
                  Cerrar sesion
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-semibold"
                  style={{ color: '#D4AF37' }}
                >
                  Ingresar
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
