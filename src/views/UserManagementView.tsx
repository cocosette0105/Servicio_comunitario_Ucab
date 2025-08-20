// VISTA DE GESTIÓN DE USUARIOS
// Vista de presentación para la administración de usuarios del sistema
// Permite crear, editar, eliminar y gestionar usuarios con diferentes roles

import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Eye, UserCheck, UserX, EyeOff } from 'lucide-react';
import { SystemUser } from '../models';

// Define las propiedades que recibe la vista de gestión de usuarios
interface UserManagementViewProps {
  users: SystemUser[]; // Lista de usuarios del sistema
  onUpdateUsers: (users: SystemUser[]) => void; // Función para actualizar la lista de usuarios
}

// Define la estructura de datos para el formulario de usuario
interface UserFormData {
  fullName: string; // Nombre completo del usuario
  username: string; // Nombre de usuario único
  password: string; // Contraseña del usuario
  role: SystemUser['role']; // Rol asignado al usuario
}

// Componente de vista para la gestión de usuarios
const UserManagementView: React.FC<UserManagementViewProps> = ({ users, onUpdateUsers }) => {
  // Estados locales para controlar la interfaz de usuario
  const [showForm, setShowForm] = useState(false); // Controla la visibilidad del formulario
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null); // Usuario en modo edición
  const [searchTerm, setSearchTerm] = useState(''); // Término de búsqueda
  const [showPasswords, setShowPasswords] = useState<{[key: string]: boolean}>({}); // Control de visibilidad de contraseñas
  
  // Estado para los datos del formulario
  const [formData, setFormData] = useState<UserFormData>({
    fullName: '',
    username: '',
    password: '',
    role: 'colaborador'
  });

  // Filtra los usuarios según el término de búsqueda
  const filteredUsers = users.filter(user =>
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Maneja el envío del formulario (crear o editar usuario)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingUser) {
      // Modo edición: actualiza el usuario existente
      const updatedUsers = users.map(user =>
        user.id === editingUser.id
          ? { ...user, ...formData }
          : user
      );
      onUpdateUsers(updatedUsers);
      setEditingUser(null);
    } else {
      // Modo creación: crea un nuevo usuario
      const newUser: SystemUser = {
        ...formData,
        id: Date.now().toString(), // Genera ID único
        createdAt: new Date().toISOString().split('T')[0], // Fecha actual
        isActive: true // Usuario activo por defecto
      };
      onUpdateUsers([...users, newUser]);
    }
    
    // Limpia el formulario y lo oculta
    setFormData({ fullName: '', username: '', password: '', role: 'colaborador' });
    setShowForm(false);
  };

  // Prepara el formulario para editar un usuario existente
  const handleEdit = (user: SystemUser) => {
    setFormData({
      fullName: user.fullName,
      username: user.username,
      password: user.password,
      role: user.role
    });
    setEditingUser(user);
    setShowForm(true);
  };

  // Maneja la eliminación de un usuario con confirmación
  const handleDelete = (userId: string) => {
    if (confirm('¿Está seguro de que desea eliminar este usuario?')) {
      const updatedUsers = users.filter(user => user.id !== userId);
      onUpdateUsers(updatedUsers);
    }
  };

  // Alterna el estado activo/inactivo de un usuario
  const toggleUserStatus = (userId: string) => {
    const updatedUsers = users.map(user =>
      user.id === userId
        ? { ...user, isActive: !user.isActive }
        : user
    );
    onUpdateUsers(updatedUsers);
  };

  // Alterna la visibilidad de la contraseña de un usuario específico
  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  // Configuración de etiquetas y colores para roles
  const roleLabels = {
    administrador: 'Administrador',
    supervisor: 'Supervisor',
    colaborador: 'Colaborador'
  };

  const roleColors = {
    administrador: 'bg-red-100 text-red-800',
    supervisor: 'bg-yellow-100 text-yellow-800',
    colaborador: 'bg-green-100 text-green-800'
  };

  // Renderizado de la vista de gestión de usuarios
  return (
    <div className="p-8 space-y-8 bg-gradient-to-br from-[#192d71]/5 to-white min-h-screen">
      {/* Encabezado con título y botón de agregar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#192d71] to-[#1e3a8a] bg-clip-text text-transparent mb-3">
            Gestión de Usuarios
          </h1>
          <p className="text-[#192d71] text-lg">Administre los usuarios del sistema del museo</p>
        </div>
        <button
          onClick={() => {
            setFormData({ fullName: '', username: '', password: '', role: 'colaborador' });
            setEditingUser(null);
            setShowForm(true);
          }}
          className="flex items-center space-x-3 bg-gradient-to-r from-[#192d71] to-[#1e3a8a] hover:from-[#1e3a8a] hover:to-[#192d71] text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
        >
          <Plus className="h-6 w-6" />
          <span>Agregar Usuario</span>
        </button>
      </div>

      {/* Formulario para crear o editar usuario (mostrado condicionalmente) */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-lg border border-[#192d71]/20 p-8">
          <h2 className="text-2xl font-bold text-[#192d71] mb-6">
            {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Campo nombre completo */}
            <div>
              <label className="block text-sm font-bold text-[#192d71] mb-3">Nombre Completo *</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                className="w-full px-5 py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71]"
                required
              />
            </div>
            {/* Campo nombre de usuario */}
            <div>
              <label className="block text-sm font-bold text-[#192d71] mb-3">Nombre de Usuario *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-5 py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71]"
                required
              />
            </div>
            {/* Campo contraseña */}
            <div>
              <label className="block text-sm font-bold text-[#192d71] mb-3">Contraseña *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-5 py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71]"
                required
              />
            </div>
            {/* Campo rol */}
            <div>
              <label className="block text-sm font-bold text-[#192d71] mb-3">Rol *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as SystemUser['role'] }))}
                className="w-full px-5 py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71]"
                required
              >
                {Object.entries(roleLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            {/* Botones de acción del formulario */}
            <div className="md:col-span-2 flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 text-[#192d71] bg-[#192d71]/10 hover:bg-[#192d71]/20 rounded-xl transition-all duration-200 font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-[#192d71] to-[#1e3a8a] hover:from-[#1e3a8a] hover:to-[#192d71] text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
              >
                {editingUser ? 'Actualizar' : 'Crear'} Usuario
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla de usuarios */}
      <div className="bg-white rounded-2xl shadow-lg border border-[#192d71]/20">
        {/* Barra de búsqueda */}
        <div className="p-8 border-b border-[#192d71]/20">
          <div className="relative">
            <Search className="absolute left-4 top-4 h-6 w-6 text-[#192d71]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, usuario o rol..."
              className="w-full pl-14 pr-6 py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71] placeholder-[#192d71]/60 text-lg"
            />
          </div>
        </div>

        {/* Tabla de usuarios */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-[#192d71]/10 to-[#192d71]/5">
              <tr>
                <th className="px-8 py-5 text-left text-sm font-bold text-[#192d71] uppercase tracking-wider">Usuario</th>
                <th className="px-8 py-5 text-left text-sm font-bold text-[#192d71] uppercase tracking-wider">Contraseña</th>
                <th className="px-8 py-5 text-left text-sm font-bold text-[#192d71] uppercase tracking-wider">Rol</th>
                <th className="px-8 py-5 text-left text-sm font-bold text-[#192d71] uppercase tracking-wider">Estado</th>
                <th className="px-8 py-5 text-left text-sm font-bold text-[#192d71] uppercase tracking-wider">Fecha Creación</th>
                <th className="px-8 py-5 text-left text-sm font-bold text-[#192d71] uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#192d71]/10">
              {/* Mapea cada usuario filtrado */}
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gradient-to-r hover:from-[#192d71]/5 hover:to-white transition-all duration-200">
                  <td className="px-8 py-6">
                    <div>
                      <p className="font-bold text-[#192d71] text-lg">{user.fullName}</p>
                      <p className="text-sm text-[#192d71]/70 font-medium">@{user.username}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm">
                        {showPasswords[user.id] ? user.password : '••••••••'}
                      </span>
                      <button
                        onClick={() => togglePasswordVisibility(user.id)}
                        className="p-1 text-[#192d71] hover:text-[#1e3a8a] transition-colors"
                      >
                        {showPasswords[user.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${roleColors[user.role]}`}>
                      {roleLabels[user.role]}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-[#192d71]/80 font-medium">
                    {new Date(user.createdAt).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-3">
                      {/* Botón activar/desactivar */}
                      <button
                        onClick={() => toggleUserStatus(user.id)}
                        className={`p-3 rounded-xl transition-all duration-200 hover:scale-110 ${
                          user.isActive ? 'text-red-700 hover:bg-red-100' : 'text-green-700 hover:bg-green-100'
                        }`}
                      >
                        {user.isActive ? <UserX className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
                      </button>
                      {/* Botón editar */}
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-3 text-green-700 hover:bg-green-100 rounded-xl transition-all duration-200 hover:scale-110"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      {/* Botón eliminar */}
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-3 text-red-700 hover:bg-red-100 rounded-xl transition-all duration-200 hover:scale-110"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mensaje cuando no hay usuarios */}
        {filteredUsers.length === 0 && (
          <div className="p-12 text-center text-[#192d71]/60 font-medium text-lg">
            {searchTerm ? 'No se encontraron usuarios que coincidan con la búsqueda' : 'No hay usuarios registrados'}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagementView;