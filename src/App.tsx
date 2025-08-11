// Importa funciones esenciales de React
import { useState, useEffect } from 'react';

// Importa el formulario de inicio de sesión
import LoginForm from './components/LoginForm';

// Importa el componente del panel principal
import Dashboard from './components/Dashboard';

// Importa los tipos utilizados en el estado de la aplicación
import { User, Work, SystemUser, MovementRecord, MaintenanceRecord } from './types';

function App() {
  // Estado para el usuario autenticado (null si no ha iniciado sesión)
  const [user, setUser] = useState<User | null>(null);

  // Estado que contiene las obras registradas en el museo
  const [works, setWorks] = useState<Work[]>([]);

  // Estado que contiene los usuarios registrados en el sistema
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);

  // Estado que contiene los registros de movimientos de obras
  const [movementRecords, setMovementRecords] = useState<MovementRecord[]>([]);

  // Estado que contiene los registros de mantenimiento realizados a las obras
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);

  // useEffect con dependencias vacías → se ejecuta una única vez al montar el componente
  useEffect(() => {
    // Verifica si hay un usuario previamente guardado en localStorage
    const savedUser = localStorage.getItem('museum_user');
    if (savedUser) {
      // Si existe, se carga al estado
      setUser(JSON.parse(savedUser));
    }

 //datos de ejemplo de obras, ya no coloca los del storage
    const sampleWorks: Work[] = [
  {
    inventoryNumber: "INV-001",
    name: "Retrato de Simón Bolívar",
    artist: "Martín Tovar y Tovar",
    classification: "Pintura al óleo",
    technique: "Óleo",
    materials: "Lienzo",
    realizationDate: "1883",
    dimensions: {
      height: 120,
      width: 90,
      depth: undefined,
      diameter: undefined,
    },
    description: "Retrato clásico del Libertador Simón Bolívar, representado con uniforme militar y mirada firme hacia el horizonte. Pintado con trazos suaves y detallados.",
    observations: "Obra en excelente estado, recientemente restaurada.",
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Mart%C3%ADn_Tovar_y_Tovar_-_Sim%C3%B3n_Bol%C3%ADvar_1883.jpg/800px-Mart%C3%ADn_Tovar_y_Tovar_-_Sim%C3%B3n_Bol%C3%ADvar_1883.jpg",
    conservationState: {
      condition: "Bueno",
      integrity: "Completo",
    },
    references: {
      documents: "Certificado de autenticidad emitido por el Museo Nacional.",
      bibliography: "Libro 'La pintura venezolana del siglo XIX', pág. 145.",
      exhibitions: "Expuesta en el Museo de Bellas Artes, 2019.",
      treatments: "Restauración superficial en 2022 para conservación del color.",
    },
    technicalData: {
      provenance: "Museo Nacional de Historia",
      culture: "Venezolana",
      value: "50000 USD",
      appraiser: "Ana Rodríguez",
      appraisalDate: "2023-11-15",
      originalOwner: "Colección privada de la familia Bolívar",
    },
    collection: {
      acquisitionSource: "Donación del Ministerio de Cultura",
      acquisitionMethod: "Donación",
      entryDate: "2023-12-01",
    },
    responsibleEntity: {
      name: "Museo Nacional de Historia",
      address: "Av. Universidad, Caracas, Venezuela",
    },
    inventory: {
      responsible: "Carlos Pérez",
      date: "2024-01-05",
      supervisor: "Laura Mendoza",
      supervisorDate: "2024-01-06",
    },
    storageLocation: "Depósito A - Estantería 4, Nivel 2",
    previousNumbers: "CAT-2005-021, REG-1987-045",
  },
  
];
      setWorks(sampleWorks); // Se asignan obras de ejemplo
      localStorage.setItem('museum_works', JSON.stringify(sampleWorks)); // Se guardan en localStorage
    


   //datos de ejemplo de usuarios, ya no coloca los del storage
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
        },
        
      ];
      setSystemUsers(sampleUsers); // Se asignan usuarios de ejemplo
      localStorage.setItem('museum_system_users', JSON.stringify(sampleUsers)); // Se guardan en localStorage
    //}

    //ejemplo para movimientos, ya no coloca los del storage
      const sampleMovements: MovementRecord[] = [
        {
          id: '1',
          workId: '1',
          workName: 'La Dama de Azul',
          date: '2024-01-20',
          type: 'salida',
          reason: 'Exposición temporal en Museo Nacional',
          notes: 'Préstamo por 3 meses',
          // Detalles de la obra - información expandida para mejor control
          workDetails: {
            author: 'Carmen Vásquez',
            title: 'La Dama de Azul',
            technique: 'Óleo sobre lienzo',
            dimensions: '80 x 60 cm',
            collection: 'Colección Permanente'
          },
          // Estado de conservación - campo crítico para movimientos
          conservationState: 'Excelente estado, sin daños visibles',
          // Información del receptor - necesaria para trazabilidad
          receiver: {
            name: 'Dr. Carlos Mendoza',
            idCard: '12.345.678',
            phone: '+58 212-555-0123'
          },
          // Información del entregador - responsabilidad institucional
          deliverer: {
            name: 'María González',
            idCard: '87.654.321',
            phone: '+58 212-555-0456'
          }
        }
      ];
      setMovementRecords(sampleMovements);
      localStorage.setItem('museum_movements', JSON.stringify(sampleMovements));
  

    /*// Verifica si hay registros de mantenimiento guardados, aqui iria BD
    const savedMaintenance = localStorage.getItem('museum_maintenance');
    if (savedMaintenance) {
      setMaintenanceRecords(JSON.parse(savedMaintenance)); // Se cargan los registros guardados
    } else {*/
      // Se inicializa con un mantenimiento de ejemplo
      const sampleMaintenance: MaintenanceRecord[] = [
        {
          id: '1',
          workId: 'INV-001',
          workName: 'Retrato de Simón Bolívar',
          workType: 'Pintura',
          author: 'Martín Tovar y Tovar',
          dimensions: '120 x 90 cm',
          technique: 'Óleo sobre lienzo',
          year: '1883',
          currentPrice: 'Bs. 150.000,00',
          maintenanceCategory: 'Conservación preventiva',
          interventionDescription: 'Se realizó limpieza superficial con técnicas especializadas y aplicación de barniz protector para preservar los colores originales.',
          date: '2024-01-25'
        }
      ];
      setMaintenanceRecords(sampleMaintenance); // Se asigna al estado
      localStorage.setItem('museum_maintenance', JSON.stringify(sampleMaintenance)); // Se guarda en localStorage
    //}
  }, []);

  // Función que gestiona el login, actualiza estado y guarda el usuario en localStorage
  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('museum_user', JSON.stringify(userData));
  };

  // Función para cerrar sesión y limpiar usuario en localStorage
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('museum_user');
  };

  // Función para actualizar obras y sincronizar con localStorage
  const updateWorks = (newWorks: Work[]) => {
    setWorks(newWorks);
    localStorage.setItem('museum_works', JSON.stringify(newWorks));
  };

  // Función para actualizar usuarios del sistema y sincronizar con localStorage
  const updateSystemUsers = (newUsers: SystemUser[]) => {
    setSystemUsers(newUsers);
    localStorage.setItem('museum_system_users', JSON.stringify(newUsers));
  };

  // Función para actualizar registros de movimiento y sincronizar con localStorage
  const updateMovementRecords = (newRecords: MovementRecord[]) => {
    setMovementRecords(newRecords);
    localStorage.setItem('museum_movements', JSON.stringify(newRecords));
  };

  // Función para actualizar registros de mantenimiento y sincronizar con localStorage
  const updateMaintenanceRecords = (newRecords: MaintenanceRecord[]) => {
    setMaintenanceRecords(newRecords);
    localStorage.setItem('museum_maintenance', JSON.stringify(newRecords));
  };

  // Si no hay usuario autenticado, se renderiza el formulario de login
  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  // Si hay usuario, se renderiza el dashboard principal con todas las propiedades necesarias
  return (
    <Dashboard 
      user={user} 
      works={works} 
      onLogout={handleLogout}
      onUpdateWorks={updateWorks}
      systemUsers={systemUsers}
      onUpdateSystemUsers={updateSystemUsers}
      movementRecords={movementRecords}
      onUpdateMovementRecords={updateMovementRecords}
      maintenanceRecords={maintenanceRecords}
      onUpdateMaintenanceRecords={updateMaintenanceRecords}
    />
  );
}

// Exporta el componente principal para ser usado en otras partes de la app
export default App;