// CONTROLADOR DE USUARIOS DEL SISTEMA
// Maneja toda la lógica de negocio relacionada con los usuarios del sistema

import { SystemUser } from '../models';

export class UserController {
  /**
   * Obtiene todos los usuarios del localStorage
   * @returns Array de usuarios del sistema
   */
  static getAllUsers(): SystemUser[] {
    const savedUsers = localStorage.getItem('museum_system_users');
    if (savedUsers) {
      return JSON.parse(savedUsers);
    }
    return [];
  }

  /**
   * Guarda los usuarios en localStorage
   * @param users - Array de usuarios a guardar
   */
  static saveUsers(users: SystemUser[]): void {
    localStorage.setItem('museum_system_users', JSON.stringify(users));
  }

  /**
   * Busca un usuario por su ID
   * @param id - ID del usuario
   * @returns Usuario encontrado o undefined
   */
  static findUserById(id: string): SystemUser | undefined {
    const users = this.getAllUsers();
    return users.find(user => user.id === id);
  }

  /**
   * Busca un usuario por su nombre de usuario
   * @param username - Nombre de usuario
   * @returns Usuario encontrado o undefined
   */
  static findUserByUsername(username: string): SystemUser | undefined {
    const users = this.getAllUsers();
    return users.find(user => user.username === username);
  }

  /**
   * Agrega un nuevo usuario
   * @param user - Usuario a agregar
   * @returns true si se agregó exitosamente, false si ya existe
   */
  static addUser(user: SystemUser): boolean {
    const users = this.getAllUsers();
    const existingUser = users.find(u => u.id === user.id || u.username === user.username);
    
    if (existingUser) {
      return false; // Ya existe un usuario con este ID o username
    }
    
    users.push(user);
    this.saveUsers(users);
    return true;
  }

  /**
   * Actualiza un usuario existente
   * @param updatedUser - Usuario con los datos actualizados
   * @returns true si se actualizó exitosamente, false si no se encontró
   */
  static updateUser(updatedUser: SystemUser): boolean {
    const users = this.getAllUsers();
    const index = users.findIndex(user => user.id === updatedUser.id);
    
    if (index === -1) {
      return false; // No se encontró el usuario
    }
    
    users[index] = updatedUser;
    this.saveUsers(users);
    return true;
  }

  /**
   * Elimina un usuario por su ID
   * @param id - ID del usuario a eliminar
   * @returns true si se eliminó exitosamente, false si no se encontró
   */
  static deleteUser(id: string): boolean {
    const users = this.getAllUsers();
    const filteredUsers = users.filter(user => user.id !== id);
    
    if (filteredUsers.length === users.length) {
      return false; // No se encontró el usuario
    }
    
    this.saveUsers(filteredUsers);
    return true;
  }

  /**
   * Alterna el estado activo/inactivo de un usuario
   * @param id - ID del usuario
   * @returns true si se actualizó exitosamente, false si no se encontró
   */
  static toggleUserStatus(id: string): boolean {
    const users = this.getAllUsers();
    const user = users.find(u => u.id === id);
    
    if (!user) {
      return false; // No se encontró el usuario
    }
    
    user.isActive = !user.isActive;
    this.saveUsers(users);
    return true;
  }

  /**
   * Filtra usuarios según criterios de búsqueda
   * @param users - Array de usuarios a filtrar
   * @param searchTerm - Término de búsqueda
   * @returns Array de usuarios filtrados
   */
  static filterUsers(users: SystemUser[], searchTerm: string): SystemUser[] {
    if (!searchTerm) return users;
    
    const term = searchTerm.toLowerCase();
    return users.filter(user =>
      user.fullName.toLowerCase().includes(term) ||
      user.username.toLowerCase().includes(term) ||
      user.role.toLowerCase().includes(term)
    );
  }

  /**
   * Inicializa datos de ejemplo si no existen usuarios
   */
  static initializeSampleData(): void {
    const existingUsers = this.getAllUsers();
    if (existingUsers.length === 0) {
      const sampleUsers: SystemUser[] = [
        {
          id: '1',
          fullName: 'María González',
          username: 'mgonzalez',
          password: 'curador123',
          role: 'administrador',
          createdAt: '2024-01-15',
          isActive: true
        },
        {
          id: '2',
          fullName: 'Carlos Mendoza',
          username: 'cmendoza',
          password: 'mant456',
          role: 'colaborador',
          createdAt: '2024-02-10',
          isActive: true
        },
        {
          id: '3',
          fullName: 'Maria Mendoza',
          username: 'mmendoza',
          password: 'mant456',
          role: 'colaborador',
          createdAt: '2024-02-10',
          isActive: true
        }
      ];
      
      this.saveUsers(sampleUsers);
    }
  }
}