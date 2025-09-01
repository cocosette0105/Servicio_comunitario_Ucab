import { useState, useEffect } from 'react';
import { LoginView, DashboardView } from './views';
import { User, Work, SystemUser, MovementRecord, MaintenanceRecord } from './models';
import { AuthController, WorkController, MovementController, MaintenanceController } from './controllers';
// --- NUEVO: Importar el servicio de obras ---
import { getWorks } from './services/workService';

function App() {
  // Estado para el usuario autenticado
  const [user, setUser] = useState<User | null>(null);
  
  // Estado para el token de autenticación
  const [token, setToken] = useState<string | null>(null);
    
  // Estado para la vista activa del dashboard
  const [activeView, setActiveView] = useState<'overview' | 'works' | 'reports' | 'users' | 'movements' | 'maintenance'>('overview');

  // Estados para los datos de la aplicación
  const [works, setWorks] = useState<Work[]>([]);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [movementRecords, setMovementRecords] = useState<MovementRecord[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);

  // Se ejecuta una vez al montar para verificar si hay una sesión guardada
  useEffect(() => {
    const savedUser = AuthController.getUserSession();
    const savedToken = AuthController.getToken();

    if (savedUser && savedToken) {
      setUser(savedUser);
      setToken(savedToken);
    }
  }, []);
  
  // --- NUEVO: useEffect para cargar las obras cuando el token está disponible ---
 useEffect(() => {
    if (!token) return;

    const loadAndMapWorks = async () => {
      try {
        const rawData: any[] = await getWorks();

        const mappedWorks: Work[] = rawData.map((obra: any) => ({
          id: obra.obr_id,
          inventoryNumber: obra.obr_mcf ?? '',
          previousNumbers: obra.obr_numeros_anteriores ?? '',
          name: obra.obr_titulo ?? '',
          artist: obra.artist_name ?? 'Desconocido',
          classification: obra.classification_name ?? '',
          realizationDate: obra.obr_fecha_realizacion ?? '',
          technique: obra.technique ?? '', // Viene como string del backend
          materials: obra.materials ?? '', // Viene como string del backend
          dimensions: {
            height: obra.obr_alto_cm ?? '',
            width: obra.obr_ancho_cm ?? '',
            depth: obra.obr_profundidad_cm ?? '',
            diameter: obra.obr_diametro_cm ?? ''
          },
          description: obra.obr_descripcion_formal ?? '',
          signatureDetails: obra.obr_detalles_firma ?? '',
          observations: obra.obr_observaciones ?? '',
          // ¡CLAVE PARA LA FOTO! Construimos la URL completa.
          photoUrl: obra.obr_url_foto ? `http://localhost:5000/${obra.obr_url_foto}` : '',
          conservationState: {
            condition: obra.obr_estado_condicion ?? '',
            integrity: obra.obr_estado_integridad ?? ''
          },
          technicalData: {
            provenance: obra.obr_procedencia ?? '',
            culture: obra.obr_cultura_tradicion ?? '',
            eraStyle: obra.obr_epoca_estilo ?? '',
            value: obra.obr_valor_avaluo ?? '',
            currency: obra.obr_moneda_avaluo ?? '',
            appraiser: obra.obr_responsable_avaluo ?? '',
            appraisalDate: obra.obr_fecha_avaluo ?? '',
            originalOwner: obra.obr_propietario_original ?? ''
          },
          references: {
             documents: obra.obr_documentos_relacionados ?? '',
             bibliography: obra.obr_bibliografia ?? '',
             exhibitions: '', // Añade si tienes esta columna
             treatments: '' // Añade si tienes esta columna
          },
          storageLocation: obra.location_name ?? 'Sin ubicación',
          collection: {
            acquisitionSource: obra.obr_fuente_adquisicion ?? '',
            acquisitionMethod: obra.obr_metodo_adquisicion ?? '',
            entryDate: obra.obr_fecha_ingreso ?? ''
          },
          responsibleEntity: {
             name: obra.obr_entidad_responsable ?? ''
          },
          inventory: {
             responsible: '', // Añade si tienes esta columna
             date: '', // Añade si tienes esta columna
             supervisor: '', // Añade si tienes esta columna
             supervisorDate: '' // Añade si tienes esta columna
          }
        }));
        setWorks(mappedWorks);
      } catch (error) {
        console.error("Error al cargar y mapear las obras en App.tsx:", error);
      }
    };
    loadAndMapWorks();
}, [token]);

  const handleLogin = (userData: User, userToken: string) => {
    setUser(userData);
    setToken(userToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    AuthController.logout();
  };

  const updateWorks = (newWorks: Work[]) => {
    setWorks(newWorks);
    WorkController.saveWorks(newWorks);
  };

  const updateSystemUsers = (newUsers: SystemUser[]) => {
    setSystemUsers(newUsers);
  };

  const updateMovementRecords = (newRecords: MovementRecord[]) => {
    setMovementRecords(newRecords);
  };

  const updateMaintenanceRecords = (newRecords: MaintenanceRecord[]) => {
    setMaintenanceRecords(newRecords);
  };

  if (!user || !token) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <DashboardView 
      user={user} 
      token={token}
      works={works} // 'works' ya contendrá los datos cargados.
      onLogout={handleLogout}
      onUpdateWorks={updateWorks}
      systemUsers={systemUsers}
      onUpdateSystemUsers={updateSystemUsers}
      movementRecords={movementRecords}
      onUpdateMovementRecords={updateMovementRecords}
      maintenanceRecords={maintenanceRecords}
      onUpdateMaintenanceRecords={updateMaintenanceRecords}
      activeView={activeView}
      onViewChange={setActiveView}
    />
  );
}

export default App;