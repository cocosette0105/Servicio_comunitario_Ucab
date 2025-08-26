import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, UserCheck, UserX, Eye, EyeOff } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import Pagination from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import { UserController } from '../controllers/UserController';
import { AuthController } from '../controllers/AuthController';
import { User } from '../models';

// ---------------------- Tipos ----------------------

interface SystemUser {
  id: string | number;
  fullName: string;
  username: string;
  createdAt: string;
  isActive: boolean;
  role: 'administrador' | 'supervisor' | 'colaborador' | 'desarrollador';
}

interface ApiUser {
  usu_id: string | number;
  usu_nombre_completo: string;
  usu_nombre_usuario: string;
  usu_fecha_creacion: string;
  usu_activo: boolean;
  usu_rol: string;
  fullName?: string;
  username?: string;
  password?: string;
  role?: string;
}

interface UserFormData {
  fullName: string;
  username: string;
  password?: string;
  role: 'administrador' | 'supervisor' | 'colaborador' | 'desarrollador';
}

interface UserManagementViewProps {
  user: User;
  users: SystemUser[];
  onUpdateUsers: (users: SystemUser[]) => void;
}

// ---------------------- Funciones de mapeo ----------------------
const mapToSystemUser = (apiUser: ApiUser): SystemUser => ({
  id: apiUser.usu_id,
  fullName: apiUser.usu_nombre_completo,
  username: apiUser.usu_nombre_usuario,
  createdAt: apiUser.usu_fecha_creacion,
  isActive: apiUser.usu_activo,
  role: apiUser.usu_rol as SystemUser['role'],
});

const mapToApiData = (formData: UserFormData) => {
  const apiData: Partial<ApiUser> = {
    fullName: formData.fullName,
    username: formData.username,
    role: formData.role,
  };
  // Solo incluye la contraseña si está presente en el formulario
  if (formData.password) {
    apiData.password = formData.password;
  }
  return apiData;
};

// ---------------------- Confirmación custom ----------------------
const showConfirmation = (message: string) => {
  return new Promise<boolean>((resolve) => {
    const customConfirm = (
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <p className="text-gray-800 mb-4">{message}</p>
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => {
              toast.dismiss();
              resolve(false);
            }}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              toast.dismiss();
              resolve(true);
            }}
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

// ---------------------- Componente principal ----------------------

const UserManagementView: React.FC<UserManagementViewProps> = ({ user, users, onUpdateUsers }) => {
  const [localUsers, setLocalUsers] = useState<SystemUser[]>(users);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<UserFormData>({
    fullName: '',
    username: '',
    password: '',
    role: 'colaborador',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Nuevo estado para alternar visibilidad de contraseña

  useEffect(() => {
    setLocalUsers(users);
  }, [users]);

  // Filtrado de usuarios basado en el término de búsqueda
  // Busca coincidencias en nombre completo, nombre de usuario y rol
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const token = AuthController.getToken();
      if (!token) throw new Error('No se encontró el token de autenticación.');
      const data: ApiUser[] = await UserController.getAllUsers(token);
      const mappedUsers = data.map(mapToSystemUser);
      onUpdateUsers(mappedUsers);
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (users.length === 0) {
      fetchUsers();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = AuthController.getToken();
      if (!token) throw new Error('No se encontró el token de autenticación.');

      const apiData = mapToApiData(formData);

      if (editingUser) {
        // Validación de permisos para editar
        // Un administrador no puede editar a un desarrollador. Solo el desarrollador puede editar a otros desarrolladores.
        if (editingUser.role === 'desarrollador' && user.role !== 'desarrollador') {
          throw new Error('Solo los desarrolladores pueden editar a otros desarrolladores.');
        }
        await UserController.updateUser(String(editingUser.id), apiData, token);
        toast.success('Usuario actualizado con éxito!');
      } else {
        if (!formData.password) {
          toast.error('La contraseña es obligatoria para nuevos usuarios.');
          setIsLoading(false);
          return;
        }
        // Validación de permisos para crear
        // Un administrador no puede crear un desarrollador.
        if (formData.role === 'desarrollador' && user.role !== 'desarrollador') {
          throw new Error('Solo los desarrolladores pueden crear otros desarrolladores.');
        }
        await UserController.createUser(apiData, token);
        toast.success('Usuario creado con éxito!');
      }

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

  const handleEdit = (selectedUser: SystemUser) => {
    // Si el usuario a editar es un desarrollador y el usuario actual no lo es, se deniega el permiso
    if (selectedUser.role === 'desarrollador' && user.role !== 'desarrollador') {
      toast.error('No tiene permiso para editar a este usuario.');
      return;
    }
    setFormData({
      fullName: selectedUser.fullName,
      username: selectedUser.username,
      // La contraseña se deja vacía para que el usuario pueda escribir una nueva si lo desea
      password: '',
      role: selectedUser.role as UserFormData['role'],
    });
    setEditingUser(selectedUser);
    setShowForm(true);
  };

  const handleDelete = async (selectedUser: SystemUser) => {
    // Si el usuario a eliminar es un desarrollador y el usuario actual no lo es, se deniega el permiso
    if (selectedUser.role === 'desarrollador' && user.role !== 'desarrollador') {
      toast.error('No tiene permiso para eliminar a este usuario.');
      return;
    }

    const isConfirmed = await showConfirmation('¿Está seguro de que desea eliminar este usuario?');
    if (!isConfirmed) return;
    setIsLoading(true);
    try {
      const token = AuthController.getToken();
      if (!token) throw new Error('No se encontró el token de autenticación.');
      await UserController.deleteUser(String(selectedUser.id), token);
      toast.success('Usuario eliminado con éxito!');
      fetchUsers();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleUserStatus = async (selectedUser: SystemUser) => {
    // Si el usuario a editar es un desarrollador y el usuario actual no lo es, se deniega el permiso
    if (selectedUser.role === 'desarrollador' && user.role !== 'desarrollador') {
      toast.error('No tiene permiso para modificar el estado de este usuario.');
      return;
    }
    setIsLoading(true);
    try {
      const token = AuthController.getToken();
      if (!token) throw new Error('No se encontró el token de autenticación.');
      await UserController.toggleUserStatus(String(selectedUser.id), !selectedUser.isActive, token);
      toast.success(`Usuario ${selectedUser.isActive ? 'desactivado' : 'activado'} con éxito!`);
      fetchUsers();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = localUsers.filter(u =>
    (u.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (u.username?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (u.role?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  // Implementación del hook de paginación para usuarios
  // Configurado para mostrar 6 usuarios por página con diseño responsive
  const {
    currentPage,
    totalPages,
    paginatedItems: paginatedUsers,
    startIndex,
    endIndex,
    hasNextPage,
    hasPrevPage,
    goToPage,
    nextPage,
    prevPage,
    goToFirstPage,
    goToLastPage,
    setItemsPerPage
  } = usePagination(filteredUsers, {
    itemsPerPage: 6, // Número de usuarios por página optimizado para diseño responsive
    initialPage: 1
  });
  const roleLabels = {
    desarrollador: 'Desarrollador',
    administrador: 'Administrador',
    supervisor: 'Supervisor',
    colaborador: 'Colaborador',
  };

  const roleColors = {
    desarrollador: 'bg-blue-100 text-blue-800',
    administrador: 'bg-red-100 text-red-800',
    supervisor: 'bg-yellow-100 text-yellow-800',
    colaborador: 'bg-green-100 text-green-800',
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 bg-gradient-to-br from-[#192d71]/5 to-white min-h-screen">
      <Toaster position="top-center" reverseOrder={false} />
      {/* Encabezado responsive con título y botón de agregar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#192d71] to-[#1e3a8a] bg-clip-text text-transparent mb-2 sm:mb-3">
            Gestión de Usuarios
          </h1>
          <p className="text-[#192d71] text-sm sm:text-base lg:text-lg">Administre los usuarios del sistema del museo</p>
        </div>
        {/* Lógica de renderización del botón "Agregar Usuario" */}
        {(user.role === 'desarrollador' || user.role === 'administrador') && (
          <button
            onClick={() => {
              setFormData({ fullName: '', username: '', password: '', role: 'colaborador' });
              setEditingUser(null);
              setShowForm(true);
            }}
            className="flex items-center space-x-2 sm:space-x-3 bg-gradient-to-r from-[#192d71] to-[#1e3a8a] hover:from-[#1e3a8a] hover:to-[#192d71] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start"
          >
            <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
            <span>Agregar Usuario</span>
          </button>
        )}
      </div>

      {/* Formulario de creación/edición de usuarios - Responsive */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-lg border border-[#192d71]/20 p-4 sm:p-6 lg:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-[#192d71] mb-4 sm:mb-6">
            {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-bold text-[#192d71] mb-2 sm:mb-3">Nombre Completo *</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71] text-sm sm:text-base"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#192d71] mb-2 sm:mb-3">Nombre de Usuario *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71] text-sm sm:text-base"
                required
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-bold text-[#192d71] mb-2 sm:mb-3">Contraseña</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71] pr-12 text-sm sm:text-base"
                // La contraseña es opcional al editar, pero requerida al crear un nuevo usuario
                required={!editingUser}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 sm:right-4 top-1/2 mt-2 transform -translate-y-1/2 text-[#192d71]/60 hover:text-[#192d71]"
              >
                {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
              </button>
            </div>
            <div>
              <label className="block text-sm font-bold text-[#192d71] mb-2 sm:mb-3">Rol *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserFormData['role'] }))}
                className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71] text-sm sm:text-base"
                required
              >
                {/* Lógica para restringir la selección del rol 'desarrollador' */}
                {Object.entries(roleLabels).map(([value, label]) => {
                  if (value === 'desarrollador' && user.role !== 'desarrollador') {
                    return null;
                  }
                  return <option key={value} value={value}>{label}</option>;
                })}
              </select>
            </div>
            {/* Botones del formulario - Responsive */}
            <div className="md:col-span-2 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingUser(null);
                  setFormData({ fullName: '', username: '', password: '', role: 'colaborador' });
                }}
                className="px-4 sm:px-6 py-2 sm:py-3 text-[#192d71] bg-[#192d71]/10 hover:bg-[#192d71]/20 rounded-xl transition-all duration-200 font-semibold text-sm sm:text-base"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-[#192d71] to-[#1e3a8a] hover:from-[#1e3a8a] hover:to-[#192d71] text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold text-sm sm:text-base"
                disabled={isLoading}
              >
                {isLoading ? 'Cargando...' : editingUser ? 'Actualizar' : 'Crear'} Usuario
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla de usuarios con búsqueda y paginación - Responsive */}
      <div className="bg-white rounded-2xl shadow-lg border border-[#192d71]/20">
        <div className="p-4 sm:p-6 lg:p-8 border-b border-[#192d71]/20">
          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-3 sm:top-4 h-5 w-5 sm:h-6 sm:w-6 text-[#192d71]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, usuario o rol..."
              className="w-full pl-10 sm:pl-14 pr-4 sm:pr-6 py-3 sm:py-4 border-2 border-[#192d71]/20 rounded-xl focus:ring-2 focus:ring-[#192d71] focus:border-[#192d71] transition-all bg-[#192d71]/5 text-[#192d71] placeholder-[#192d71]/60 text-sm sm:text-base lg:text-lg"
            />
          </div>
        </div>

        {/* Tabla responsive de usuarios */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-[#192d71]/10 to-[#192d71]/5">
              <tr>
                <th className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 text-left text-xs sm:text-sm font-bold text-[#192d71] uppercase tracking-wider">Usuario</th>
                <th className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 text-left text-xs sm:text-sm font-bold text-[#192d71] uppercase tracking-wider hidden sm:table-cell">Rol</th>
                <th className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 text-left text-xs sm:text-sm font-bold text-[#192d71] uppercase tracking-wider hidden md:table-cell">Estado</th>
                <th className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 text-left text-xs sm:text-sm font-bold text-[#192d71] uppercase tracking-wider hidden lg:table-cell">Fecha Creación</th>
                <th className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 text-left text-xs sm:text-sm font-bold text-[#192d71] uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#192d71]/10">
              {/* Renderizado de usuarios paginados con diseño responsive */}
              {paginatedUsers.map((u, index) => (
                <tr
                  key={u.id || `user-${index}`}
                  className="hover:bg-gradient-to-r hover:from-[#192d71]/5 hover:to-white transition-all duration-200"
                >
                  <td className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
                    <div>
                      <p className="font-bold text-[#192d71] text-sm sm:text-base lg:text-lg">{u.fullName}</p>
                      <p className="text-xs sm:text-sm text-[#192d71]/70 font-medium">@{u.username}</p>
                      {/* Información adicional visible solo en móviles */}
                      <div className="sm:hidden mt-1 space-y-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${roleColors[u.role]}`}>
                          {roleLabels[u.role]}
                        </span>
                        <p className="text-xs text-[#192d71]/60">
                          {u.isActive ? 'Activo' : 'Inactivo'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 hidden sm:table-cell">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${roleColors[u.role]}`}>
                      {roleLabels[u.role]}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 hidden md:table-cell">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {u.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 text-[#192d71]/80 font-medium hidden lg:table-cell">
                    {new Date(u.createdAt).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
                    {/* Botones de acción responsive */}
                    <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
                      {/* Lógica de renderización de botones */}
                      {user.role === 'desarrollador' || (user.role === 'administrador' && u.role !== 'desarrollador') ? (
                        <>
                          <button
                            onClick={() => toggleUserStatus(u)}
                            className={`p-3 rounded-xl transition-all duration-200 hover:scale-110 ${
                              u.isActive ? 'text-red-700 hover:bg-red-100' : 'text-green-700 hover:bg-green-100'
                            }`}
                            title={u.isActive ? "Desactivar usuario" : "Activar usuario"}
                          >
                            {u.isActive ? <UserX className="h-4 w-4 sm:h-5 sm:w-5" /> : <UserCheck className="h-4 w-4 sm:h-5 sm:w-5" />}
                          </button>
                          <button
                            onClick={() => handleEdit(u)}
                            className="p-3 text-green-700 hover:bg-green-100 rounded-xl transition-all duration-200 hover:scale-110"
                            title="Editar usuario"
                          >
                            <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(u)}
                            className="p-3 text-red-700 hover:bg-red-100 rounded-xl transition-all duration-200 hover:scale-110"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                        </>
                      ) : (
                        <span className="text-gray-500 text-xs sm:text-sm">Sin permisos</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mensaje cuando no hay usuarios - Responsive */}
        {filteredUsers.length === 0 && (
          <div className="p-6 sm:p-8 lg:p-12 text-center text-[#192d71]/60 font-medium text-sm sm:text-base lg:text-lg">
            {isLoading ? 'Cargando usuarios...' : searchTerm ? 'No se encontraron usuarios que coincidan con la búsqueda' : 'No hay usuarios registrados'}
          </div>
        )}

        {/* Componente de paginación responsive para usuarios */}
        {filteredUsers.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredUsers.length}
            itemsPerPage={6}
            onPageChange={goToPage}
            className="border-t border-[#192d71]/20"
          />
        )}
      </div>
    </div>
  );
};

export default UserManagementView;
