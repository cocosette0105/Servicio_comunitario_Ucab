// frontend/src/views/LoginView.tsx
import React, { useState } from 'react';
import { Lock, User as UserIcon } from 'lucide-react';

interface LoginViewProps {
  onLogin: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await onLogin(username, password);
      
      if (!result.success) {
        setError(result.message || 'Credenciales incorrectas. Verifique su usuario y contraseña.');
      }
      // Si es exitoso, el componente padre manejará la navegación
    } catch (err: any) {
      setError(err.message || 'Error de conexión. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#192d71] via-[#1e3a8a] to-[#192d71] flex items-center justify-center p-4 relative overflow-hidden">
      <div className={`absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.03"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20`}></div>
      
      <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md relative z-10 border border-[#192d71]/20">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg border-2 border-[#192d71]/20">
              <img src="/foto logo.jpg" alt="Logo Museo Carmelo Fernández" className="w-16 h-16 object-contain" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#192d71] to-[#1e3a8a] bg-clip-text text-transparent mb-2">
            Museo Carmelo Fernández
          </h1>
          <p className="text-[#192d71] font-medium">Sistema de Gestión de Bóveda</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-amber-800 mb-3">
              Usuario
            </label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-4 h-5 w-5 text-[#192d71]" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71] placeholder-[#192d71]/60"
                placeholder="Ingrese su usuario"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-amber-800 mb-3">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-4 h-5 w-5 text-[#192d71]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71] placeholder-[#192d71]/60"
                placeholder="Ingrese su contraseña"
                required
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#192d71] to-[#1e3a8a] hover:from-[#1e3a8a] hover:to-[#192d71] text-white font-bold py-4 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Iniciando Sesión...</span>
              </div>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-[#192d71] bg-[#192d71]/5 rounded-lg py-2 px-4">
          <p className="text-xs text-gray-500">
            Tu sesión se mantendrá activa mientras uses la aplicación.
            <br />
            Se cerrará automáticamente después de 20 minutos de inactividad.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;