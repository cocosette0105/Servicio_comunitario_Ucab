import React, { useState } from 'react'; // Importa React y el hook useState para manejar el estado local del componente.
import { Lock, User as UserIcon } from 'lucide-react'; // Importa íconos desde la librería lucide-react para usarlos en el formulario.
import { User } from '../types'; // Importa el tipo User para tipar el usuario autenticado.

interface LoginFormProps { // Define las propiedades que recibe el componente LoginForm.
  onLogin: (user: User) => void; // Función que se ejecuta al iniciar sesión exitosamente.
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => { // Componente funcional para el formulario de login.
  const [username, setUsername] = useState(''); // Estado local para el nombre de usuario ingresado.
  const [password, setPassword] = useState(''); // Estado local para la contraseña ingresada.
  const [error, setError] = useState(''); // Estado local para mostrar mensajes de error.

  const handleSubmit = (e: React.FormEvent) => { // Función que maneja el envío del formulario.
    e.preventDefault(); // Previene el comportamiento por defecto del formulario (recargar la página).
    
    // Autenticación simple (en una app real, esto se haría en el backend)
    if (username === 'admin' && password === 'museo2024') { // Verifica si las credenciales son correctas.
      const user: User = { // Crea el objeto usuario con datos fijos.
        id: '1', // ID fijo para el usuario demo.
        username: 'admin', // Nombre de usuario demo.
        name: 'Administrador del Museo', // Nombre completo del usuario demo.
        role: 'Curador Principal' // Rol del usuario demo.
      };
      onLogin(user); // Llama a la función de login pasando el usuario autenticado.
    } else {
      setError('Credenciales incorrectas. Use admin/museo2024'); // Muestra mensaje de error si las credenciales no coinciden.
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#192d71] via-[#1e3a8a] to-[#192d71] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Contenedor principal con fondo degradado y centrado vertical/horizontal */}
      <div className={`absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.03"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20`}></div>
      {/* Fondo decorativo con patrón de círculos */}
      <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md relative z-10 border border-[#192d71]/20">
        {/* Tarjeta blanca con borde, sombra y padding */}
        <div className="text-center mb-8">
          {/* Encabezado del formulario */}
          <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg border-2 border-[#192d71]/20">
              <img src="/foto logo.jpg" alt="Logo Museo Carmelo Fernández" className="w-16 h-16 object-contain" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#192d71] to-[#1e3a8a] bg-clip-text text-transparent mb-2">Museo Carmelo Fernández</h1>
          {/* Título principal con efecto de gradiente */}
          <p className="text-[#192d71] font-medium">Sistema de Gestión de Bóveda</p>
          {/* Subtítulo */}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Formulario de login */}
          <div>
            <label className="block text-sm font-semibold text-amber-800 mb-3">
              Usuario
            </label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-4 h-5 w-5 text-[#192d71]" /> {/* Ícono de usuario */}
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)} // Actualiza el estado username al escribir.
                className="w-full pl-12 pr-4 py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71] placeholder-[#192d71]/60"
                placeholder="Ingrese su usuario"
                required // Campo obligatorio.
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-amber-800 mb-3">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-4 h-5 w-5 text-[#192d71]" /> {/* Ícono de candado */}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)} // Actualiza el estado password al escribir.
                className="w-full pl-12 pr-4 py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71] placeholder-[#192d71]/60"
                placeholder="Ingrese su contraseña"
                required // Campo obligatorio.
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
              {error} {/* Muestra el mensaje de error si existe */}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#192d71] to-[#1e3a8a] hover:from-[#1e3a8a] hover:to-[#192d71] text-white font-bold py-4 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Iniciar Sesión {/* Botón para enviar el formulario */}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-[#192d71] bg-[#192d71]/5 rounded-lg py-2 px-4">
          <p>Demo: admin / museo2024</p> {/* Mensaje informativo para pruebas */}
        </div>
      </div>
    </div>
  );
};

export default LoginForm; // Exporta el componente LoginForm para su uso en otras