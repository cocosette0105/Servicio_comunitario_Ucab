import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, UserCheck, UserX, EyeOff } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast'; // Asegúrate de tener instalado 'react-hot-toast'
import { UserController } from '../controllers/UserController';
import { SystemUser } from '../models'; // Importa SystemUser desde el modelo

// Estructura de datos para el formulario de usuario
interface UserFormData {
  fullName: string;
  username: string;
  password?: string;
  role: SystemUser['role'];
}

// Función para mostrar mensajes de confirmación personalizados (sin usar confirm())
const showConfirmation = (message: string) => {
  return new Promise<boolean>((resolve) => {
    const customConfirm = (
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <p className="text-gray-800 mb-4">{message}</p>
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => resolve(false)}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => resolve(true)}
            className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            Confirmar
          </button>
        </div>
      </div>
    );
    toast.custom(customConfirm);
  });
};

// Componente principal de la vista de gestión de usuarios
const UserManagementView: React.FC = () => {
  // Estados para la gestión de la interfaz y los datos
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPasswords, setShowPasswords] = useState<{[key: string]: boolean}>({});
  const [formData, setFormData] = useState<UserFormData>({
    fullName: '',
    username: '',
    password: '',
    role: 'colaborador'
  });
  const [isLoading, setIsLoading] = useState(false);

  // Maneja la visibilidad de las contraseñas
  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  // Función para obtener los usuarios desde el controlador
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await UserController.getAllUsers();
      setUsers(data);
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Carga los usuarios al montar el componente
  useEffect(() => {
    fetchUsers();
  }, []);

  // Maneja el envío del formulario (crear o editar usuario)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingUser) {
        await UserController.updateUser(editingUser.id, formData);
        toast.success('Usuario actualizado con éxito!');
      } else {
        // Corrección del tipo de dato para createUser, omitiendo los campos generados por el backend.
        // Además, asegúrate de que 'password' no sea undefined antes de pasarlo al controlador si es un campo obligatorio.
        if (!formData.password) {
            toast.error('La contraseña es obligatoria para nuevos usuarios.');
            setIsLoading(false);
            return;
        }
        
        await UserController.createUser(formData as Omit<SystemUser, 'id' | 'createdAt' | 'isActive'>);
        toast.success('Usuario creado con éxito!');
      }
      
      // Resetea el formulario y actualiza la lista
      setFormData({ fullName: '', username: '', password: '', role: 'colaborador' });
      setShowForm(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Prepara el formulario para editar un usuario existente
  const handleEdit = (user: SystemUser) => {
    setFormData({
      fullName: user.fullName,
      username: user.username,
      password: '', // No cargamos la contraseña para editar
      role: user.role
    });
    setEditingUser(user);
    setShowForm(true);
  };

  // Maneja la eliminación de un usuario con confirmación
  const handleDelete = async (userId: string) => {
    const isConfirmed = await showConfirmation('¿Está seguro de que desea eliminar este usuario?');
    if (!isConfirmed) return;

    setIsLoading(true);
    try {
      await UserController.deleteUser(userId);
      toast.success('Usuario eliminado con éxito!');
      fetchUsers();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Alterna el estado activo/inactivo de un usuario
  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    setIsLoading(true);
    try {
      await UserController.toggleUserStatus(userId, !isActive);
      toast.success(`Usuario ${isActive ? 'desactivado' : 'activado'} con éxito!`);
      fetchUsers();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtra los usuarios según el término de búsqueda
  const filteredUsers = users.filter(user =>
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="p-8 space-y-8 bg-gradient-to-br from-[#192d71]/5 to-white min-h-screen">
      <Toaster position="top-center" reverseOrder={false} />
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
                required={!editingUser}
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
                disabled={isLoading}
              >
                {isLoading ? 'Cargando...' : editingUser ? 'Actualizar' : 'Crear'} Usuario
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
                        {showPasswords[user.id] ? user.password || 'N/A' : '••••••••'}
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
                        onClick={() => toggleUserStatus(user.id, user.isActive)}
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
            {isLoading ? 'Cargando usuarios...' : searchTerm ? 'No se encontraron usuarios que coincidan con la búsqueda' : 'No hay usuarios registrados'}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagementView;