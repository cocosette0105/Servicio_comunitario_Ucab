// Importa React y el hook useState para manejar el estado local
import React, { useState } from 'react';
// Importa los íconos usados en la interfaz de usuario
import { Plus, Search, Edit, Trash2, Eye, UserCheck, UserX, EyeOff } from 'lucide-react';
// Importa el tipo SystemUser para tipar los datos de usuario
import { SystemUser } from '../types';

// Define las props que recibe el componente: lista de usuarios y función para actualizarla
interface UserManagementProps {
  users: SystemUser[];
  onUpdateUsers: (users: SystemUser[]) => void;
}

// Define la estructura de los datos del formulario de usuario
interface UserFormData {
  fullName: string;
  username: string;
  password: string;
  role: SystemUser['role'];
}

// Componente principal para la gestión de usuarios del sistema
const UserManagement: React.FC<UserManagementProps> = ({ users, onUpdateUsers }) => {
  // Estado para mostrar/ocultar el formulario de usuario
  const [showForm, setShowForm] = useState(false);
  // Estado para almacenar el usuario que se está editando (si aplica)
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  // Estado para el término de búsqueda ingresado por el usuario
  const [searchTerm, setSearchTerm] = useState('');
  // Estado para mostrar/ocultar contraseñas por usuario
  const [showPasswords, setShowPasswords] = useState<{[key: string]: boolean}>({});
  // Estado para los datos del formulario de usuario
  const [formData, setFormData] = useState<UserFormData>({
    fullName: '',
    username: '',
    password: '',
    role: 'colaborador'
  });

  // Filtra los usuarios según el término de búsqueda (por nombre, usuario o rol)
  const filteredUsers = users.filter(user =>
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Maneja el envío del formulario de usuario (crear o editar)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Previene el comportamiento por defecto del formulario
    
    if (editingUser) {
      // Si se está editando un usuario, actualiza sus datos
      const updatedUsers = users.map(user =>
        user.id === editingUser.id
          ? { ...user, ...formData }
          : user
      );
      onUpdateUsers(updatedUsers);
      setEditingUser(null);
    } else {
      // Si es un nuevo usuario, lo crea con un ID único y fecha de creación
      const newUser: SystemUser = {
        ...formData,
        id: Date.now().toString(), // Genera un ID único usando la fecha actual
        createdAt: new Date().toISOString().split('T')[0], // Fecha de creación
        isActive: true // El usuario se crea como activo por defecto
      };
      onUpdateUsers([...users, newUser]);
    }
    
    // Limpia el formulario y oculta el formulario modal
    setFormData({ fullName: '', username: '', password: '', role: 'colaborador' });
    setShowForm(false);
  };

  // Maneja la edición de un usuario: carga sus datos en el formulario y muestra el modal
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

  // Maneja la eliminación de un usuario, solicita confirmación antes de eliminar
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

  // Etiquetas legibles para los roles de usuario
  const roleLabels = {
    administrador: 'Administrador',
  supervisor: 'Supervisor',
  colaborador: 'Colaborador'
  };

  // Colores de fondo y texto para cada rol
  const roleColors = {
     administrador: 'bg-red-100 text-red-800',
  supervisor: 'bg-yellow-100 text-yellow-800',
  colaborador: 'bg-green-100 text-green-800'
  };

  // Renderizado principal del componente
  return (
    <div className="p-8 space-y-8 bg-gradient-to-br from-yellow-50 to-white min-h-screen">
      {/* Encabezado y botón para agregar usuario */}
      <div className="flex items-center justify-between">
        <div>
          {/* Título principal */}
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-800 to-amber-900 bg-clip-text text-transparent mb-3">
            Gestión de Usuarios
          </h1>
          {/* Descripción */}
          <p className="text-amber-700 text-lg">Administre los usuarios del sistema del museo</p>
        </div>
        {/* Botón para mostrar el formulario de agregar usuario */}
        <button
          onClick={() => {
            setFormData({ fullName: '', username: '', password: '', role: 'colaborador' });
            setEditingUser(null);
            setShowForm(true);
          }}
          className="flex items-center space-x-3 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
        >
          <Plus className="h-6 w-6" />
          <span>Agregar Usuario</span>
        </button>
      </div>

      {/* Formulario para crear o editar usuario */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-lg border border-amber-200 p-8">
          <h2 className="text-2xl font-bold text-amber-900 mb-6">
            {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Campo para el nombre completo */}
            <div>
              <label className="block text-sm font-bold text-amber-800 mb-3">
                Nombre Completo *
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                className="w-full px-5 py-4 border-2 border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-amber-50/30 text-amber-900"
                required
              />
            </div>
            {/* Campo para el nombre de usuario */}
            <div>
              <label className="block text-sm font-bold text-amber-800 mb-3">
                Nombre de Usuario *
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-5 py-4 border-2 border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-amber-50/30 text-amber-900"
                required
              />
            </div>
            {/* Campo para la contraseña */}
            <div>
              <label className="block text-sm font-bold text-amber-800 mb-3">
                Contraseña *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-5 py-4 border-2 border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-amber-50/30 text-amber-900"
                required
              />
            </div>
            {/* Campo para el rol del usuario */}
            <div>
              <label className="block text-sm font-bold text-amber-800 mb-3">
                Rol *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as SystemUser['role'] }))}
                className="w-full px-5 py-4 border-2 border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-amber-50/30 text-amber-900"
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
                className="px-6 py-3 text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-xl transition-all duration-200 font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
              >
                {editingUser ? 'Actualizar' : 'Crear'} Usuario
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla de usuarios */}
      <div className="bg-white rounded-2xl shadow-lg border border-amber-200">
        {/* Barra de búsqueda */}
        <div className="p-8 border-b border-amber-200">
          <div className="relative">
            {/* Ícono de búsqueda */}
            <Search className="absolute left-4 top-4 h-6 w-6 text-amber-600" />
            {/* Input para buscar usuarios */}
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, usuario o rol..."
              className="w-full pl-14 pr-6 py-4 border-2 border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-amber-50/30 text-amber-900 placeholder-amber-600 text-lg"
            />
          </div>
        </div>

        {/* Contenedor de la tabla */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-amber-100 to-amber-50">
              <tr>
                {/* Encabezados de la tabla */}
                <th className="px-8 py-5 text-left text-sm font-bold text-amber-800 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-8 py-5 text-left text-sm font-bold text-amber-800 uppercase tracking-wider">
                  Contraseña
                </th>
                <th className="px-8 py-5 text-left text-sm font-bold text-amber-800 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-8 py-5 text-left text-sm font-bold text-amber-800 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-8 py-5 text-left text-sm font-bold text-amber-800 uppercase tracking-wider">
                  Fecha Creación
                </th>
                <th className="px-8 py-5 text-left text-sm font-bold text-amber-800 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              {/* Mapea y muestra cada usuario filtrado en una fila */}
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gradient-to-r hover:from-amber-50 hover:to-white transition-all duration-200">
                  {/* Columna nombre y usuario */}
                  <td className="px-8 py-6">
                    <div>
                      <p className="font-bold text-amber-900 text-lg">{user.fullName}</p>
                      <p className="text-sm text-amber-600 font-medium">@{user.username}</p>
                    </div>
                  </td>
                  {/* Columna contraseña (oculta o visible) */}
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm">
                        {showPasswords[user.id] ? user.password : '••••••••'}
                      </span>
                      {/* Botón para alternar visibilidad de la contraseña */}
                      <button
                        onClick={() => togglePasswordVisibility(user.id)}
                        className="p-1 text-amber-600 hover:text-amber-800 transition-colors"
                      >
                        {showPasswords[user.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </td>
                  {/* Columna rol */}
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${roleColors[user.role]}`}>
                      {roleLabels[user.role]}
                    </span>
                  </td>
                  {/* Columna estado activo/inactivo */}
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      user.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  {/* Columna fecha de creación */}
                  <td className="px-8 py-6 text-amber-700 font-medium">
                    {new Date(user.createdAt).toLocaleDateString('es-ES')}
                  </td>
                  {/* Columna de acciones (activar/desactivar, editar, eliminar) */}
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-3">
                      {/* Botón para activar/desactivar usuario */}
                      <button
                        onClick={() => toggleUserStatus(user.id)}
                        className={`p-3 rounded-xl transition-all duration-200 hover:scale-110 ${
                          user.isActive 
                            ? 'text-red-700 hover:bg-red-100' 
                            : 'text-green-700 hover:bg-green-100'
                        }`}
                      >
                        {user.isActive ? <UserX className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
                      </button>
                      {/* Botón para editar usuario */}
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-3 text-green-700 hover:bg-green-100 rounded-xl transition-all duration-200 hover:scale-110"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      {/* Botón para eliminar usuario */}
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

        {/* Mensaje si no hay usuarios que mostrar */}
        {filteredUsers.length === 0 && (
          <div className="p-12 text-center text-amber-600 font-medium text-lg">
            {searchTerm ? 'No se encontraron usuarios que coincidan con la búsqueda' : 'No hay usuarios registrados'}
          </div>
        )}
      </div>
    </div>
  );
}
// Exporta el componente para su uso en otras partes de la aplicación
export default UserManagement;
