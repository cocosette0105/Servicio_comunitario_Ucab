import React, { useState } from 'react'; // Importa React y useState para manejar estado local
import { Home, Package, FileText, LogOut, User as UserIcon, Users, ArrowUpDown, Wrench } from 'lucide-react'; // Importa íconos para el menú lateral.
import { Menu, X } from 'lucide-react'; // Importa íconos para el menú hamburguesa
import { User } from '../models'; // Importa el tipo User desde los modelos.

interface SidebarProps { // Define las propiedades que recibe el componente Sidebar.
  user: User; // Usuario actual.
  activeView: string; // Vista activa del dashboard.
  onViewChange: (view: 'overview' | 'works' | 'reports' | 'users' | 'movements' | 'maintenance') => void; // Función para cambiar la vista activa.
  onLogout: () => void; // Función para cerrar sesión.
}

const Sidebar: React.FC<SidebarProps> = ({ user, activeView, onViewChange, onLogout }) => { // Componente funcional principal para el menú lateral.
  // Estado local para controlar la visibilidad del sidebar en dispositivos móviles
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Función para alternar la visibilidad del menú móvil
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Función para cerrar el menú móvil al seleccionar una opción
  const handleViewChange = (view: 'overview' | 'works' | 'reports' | 'users' | 'movements' | 'maintenance') => {
    onViewChange(view);
    setIsMobileMenuOpen(false); // Cierra el menú móvil después de seleccionar
  };

  const menuItems = [ // Define los ítems del menú lateral con su id, etiqueta e ícono.
    { id: 'overview', label: 'Panel Principal', icon: Home },
    { id: 'works', label: 'Gestión de Obras', icon: Package },
    { id: 'reports', label: 'Reportes de Obras', icon: FileText },
    { id: 'users', label: 'Gestión de Usuarios', icon: Users },
    { id: 'movements', label: 'Historial de Movimientos', icon: ArrowUpDown },
    { id: 'maintenance', label: 'Historial de Mantenimiento', icon: Wrench },
  ];

  return (
    <>
      {/* Botón hamburguesa para dispositivos móviles - Solo visible en pantallas pequeñas */}
      <button
        onClick={toggleMobileMenu}
        className="fixed top-4 left-4 z-50 lg:hidden bg-[#192d71] text-white p-3 rounded-xl shadow-lg hover:bg-[#1e3a8a] transition-all duration-200"
        aria-label="Abrir menú de navegación"
      >
        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Overlay para cerrar el menú en móviles - Solo visible cuando el menú está abierto */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-label="Cerrar menú"
        />
      )}

      {/* Sidebar principal - Responsive con diferentes comportamientos según el dispositivo */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-80 lg:w-64 xl:w-80 
        bg-gradient-to-b from-[#192d71] to-[#1e3a8a] 
        text-white flex flex-col shadow-2xl
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Contenedor principal del sidebar con fondo degradado y sombra */}
        <div className="p-4 lg:p-6 border-b border-white/20">
          {/* Encabezado con logo y nombre del museo - Responsive */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 lg:w-14 lg:h-14 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <img src="/foto logo2.jpg" alt="Logo Museo" className="w-8 h-8 lg:w-10 lg:h-10 object-contain" />
              </div>
              <div>
                <h1 className="text-base lg:text-lg font-bold text-white">Museo Carmelo</h1>
                <h2 className="text-base lg:text-lg font-bold text-white">Fernández</h2>
              </div>
            </div>
            
            {/* Botón cerrar para móviles - Solo visible en pantallas pequeñas */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden text-white hover:text-gray-300 p-2"
              aria-label="Cerrar menú"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          {/* Navegación principal del menú - Scrolleable en caso de muchos elementos */}
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon; // Obtiene el componente de ícono.
              const isActive = activeView === item.id; // Determina si el ítem está activo.
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleViewChange(item.id as any)} // Cambia la vista activa y cierra menú móvil
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm ${
                      isActive 
                        ? 'bg-gradient-to-r from-white/20 to-white/10 text-white shadow-lg transform scale-105 border border-white/30' 
                        : 'text-white/80 hover:bg-white/10 hover:text-white hover:transform hover:scale-102'
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" /> {/* Ícono del ítem */}
                    <span className="text-left truncate">{item.label}</span> {/* Etiqueta completa con truncate */}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-white/20">
          {/* Sección inferior con datos del usuario y botón de logout - Responsive */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
              <UserIcon className="h-5 w-5" /> {/* Ícono de usuario */}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p> {/* Nombre del usuario con truncate */}
              <p className="text-xs text-white/70 truncate">{user.role}</p> {/* Rol del usuario con truncate */}
            </div>
          </div>
          
          {/* Botón de logout responsive */}
          <button
            onClick={() => {
              onLogout(); // Ejecuta la función de logout
              setIsMobileMenuOpen(false); // Cierra el menú móvil
            }}
            className="w-full flex items-center justify-start space-x-3 px-4 py-3 text-white/80 hover:bg-white/10 hover:text-white rounded-xl transition-all duration-200 font-medium text-sm"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" /> {/* Ícono de logout */}
            <span>Cerrar Sesión</span> {/* Etiqueta del botón de logout */}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar; // Exporta el componente para su uso en otras partes