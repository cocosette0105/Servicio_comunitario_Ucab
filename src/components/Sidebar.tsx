import React from 'react';
import { Home, Package, FileText, LogOut, User as UserIcon, Users, ArrowUpDown, Wrench } from 'lucide-react';
import { User } from '../models';

interface SidebarProps {
  user: User;
  activeView: string;
  onViewChange: (view: 'overview' | 'works' | 'reports' | 'users' | 'movements' | 'maintenance') => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, activeView, onViewChange, onLogout }) => {
  const menuItems = [
    { id: 'overview', label: 'Panel Principal', icon: Home, roles: ['administrador', 'supervisor', 'colaborador', 'desarrollador'] },
    { id: 'works', label: 'Gestión de Obras', icon: Package, roles: ['administrador', 'supervisor', 'colaborador', 'desarrollador'] },
    { id: 'reports', label: 'Reportes de Obras', icon: FileText, roles: ['administrador', 'supervisor', 'desarrollador'] },
    { id: 'users', label: 'Gestión de Usuarios', icon: Users, roles: ['administrador', 'desarrollador'] }, // Solo el administrador y el desarrollador puede ver esta opción
    { id: 'movements', label: 'Historial de Movimientos', icon: ArrowUpDown, roles: ['administrador', 'supervisor', 'colaborador', 'desarrollador'] },
    { id: 'maintenance', label: 'Historial de Mantenimiento', icon: Wrench, roles: ['administrador', 'supervisor', 'desarrollador', 'colaborador'] }, // Por ejemplo, solo el administrador y el supervisor
  ];

  return (
    <div className="w-80 bg-gradient-to-b from-[#192d71] to-[#1e3a8a] text-white flex flex-col shadow-2xl">
      <div className="p-6 border-b border-white/20">
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
        <ul className="space-y-2">
          {menuItems.map((item) => {
            // Verifica si el rol del usuario está incluido en los roles permitidos para el ítem del menú
            if (!item.roles.includes(user.role)) {
              return null; // Si no tiene permiso, no renderiza el ítem
            }

            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id as any)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm ${
                    isActive 
                      ? 'bg-gradient-to-r from-white/20 to-white/10 text-white shadow-lg transform scale-105 border border-white/30' 
                      : 'text-white/80 hover:bg-white/10 hover:text-white hover:transform hover:scale-102'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="text-left">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-white/20">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shadow-lg">
            <UserIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{user.name}</p>
            <p className="text-xs text-white/70">{user.role}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-white/80 hover:bg-white/10 hover:text-white rounded-xl transition-all duration-200 font-medium"
        >
          <LogOut className="h-5 w-5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
