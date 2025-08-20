import React from 'react'; // Importa React para crear componentes funcionales.
import { Home, Package, FileText, LogOut, User as UserIcon, Users, ArrowUpDown, Wrench } from 'lucide-react'; // Importa íconos para el menú lateral.
import { User } from '../models'; // Importa el tipo User desde los modelos.

interface SidebarProps { // Define las propiedades que recibe el componente Sidebar.
  user: User; // Usuario actual.
  activeView: string; // Vista activa del dashboard.
  onViewChange: (view: 'overview' | 'works' | 'reports' | 'users' | 'movements' | 'maintenance') => void; // Función para cambiar la vista activa.
  onLogout: () => void; // Función para cerrar sesión.
}

const Sidebar: React.FC<SidebarProps> = ({ user, activeView, onViewChange, onLogout }) => { // Componente funcional principal para el menú lateral.
  const menuItems = [ // Define los ítems del menú lateral con su id, etiqueta e ícono.
    { id: 'overview', label: 'Panel Principal', icon: Home },
    { id: 'works', label: 'Gestión de Obras', icon: Package },
    { id: 'reports', label: 'Reportes de Obras', icon: FileText },
    { id: 'users', label: 'Gestión de Usuarios', icon: Users },
    { id: 'movements', label: 'Historial de Movimientos', icon: ArrowUpDown },
    { id: 'maintenance', label: 'Historial de Mantenimiento', icon: Wrench },
  ];

  return (
    <div className="w-80 bg-gradient-to-b from-[#192d71] to-[#1e3a8a] text-white flex flex-col shadow-2xl">
      {/* Contenedor principal del sidebar con fondo degradado y sombra */}
      <div className="p-6 border-b border-white/20">
        {/* Encabezado con logo y nombre del museo */}
        <div className="flex items-center space-x-3">
          <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <img src="/foto logo2.jpg" alt="Logo Museo" className="w-10 h-10 object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Museo Carmelo</h1>
            <h2 className="text-lg font-bold text-white">Fernández</h2>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        {/* Navegación principal del menú */}
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon; // Obtiene el componente de ícono.
            const isActive = activeView === item.id; // Determina si el ítem está activo.
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id as any)} // Cambia la vista activa al hacer clic.
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm ${
                    isActive 
                      ? 'bg-gradient-to-r from-white/20 to-white/10 text-white shadow-lg transform scale-105 border border-white/30' 
                      : 'text-white/80 hover:bg-white/10 hover:text-white hover:transform hover:scale-102'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" /> {/* Ícono del ítem */}
                  <span className="text-left">{item.label}</span> {/* Etiqueta del ítem */}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-white/20">
        {/* Sección inferior con datos del usuario y botón de logout */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shadow-lg">
            <UserIcon className="h-5 w-5" /> {/* Ícono de usuario */}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{user.name}</p> {/* Nombre del usuario */}
            <p className="text-xs text-white/70">{user.role}</p> {/* Rol del usuario */}
          </div>
        </div>
        <button
          onClick={onLogout} // Ejecuta la función de logout al hacer clic.
          className="w-full flex items-center space-x-3 px-4 py-3 text-white/80 hover:bg-white/10 hover:text-white rounded-xl transition-all duration-200 font-medium"
        >
          <LogOut className="h-5 w-5" /> {/* Ícono de logout */}
          <span>Cerrar Sesión</span> {/* Etiqueta del botón de logout */}
        </button>
      </div>
    </div>
  );
};

export default Sidebar; // Exporta el componente para su uso en otras partes