// frontend/src/App.tsx

import { useState, useEffect, useCallback } from 'react';
import { LoginView, DashboardView } from './views';
import { User, Work, SystemUser, MovementRecord, MaintenanceRecord } from './models';
import { AuthController } from './controllers';
import { getWorks } from './services/workService';

function App() {
  // Estados para autenticación y vista
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'works' | 'reports' | 'users' | 'movements' | 'maintenance'>('overview');

  // Estados para los datos de la aplicación
  const [works, setWorks] = useState<Work[]>([]);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [movementRecords, setMovementRecords] = useState<MovementRecord[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);

  // Efecto para verificar la sesión al cargar la app
  useEffect(() => {
    const savedUser = AuthController.getUserSession();
    const savedToken = AuthController.getToken();
    if (savedUser && savedToken) {
      setUser(savedUser);
      setToken(savedToken);
    }
  }, []);

  // --- FUNCIÓN CENTRALIZADA PARA CARGAR Y MAPEAR OBRAS (CORREGIDA) ---
  // Se usa useCallback para evitar que la función se recree innecesariamente.
   const loadAndMapWorks = useCallback(async () => {
    try {
      const rawData: any[] = await getWorks(); 
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      // ✅ CORRECCIÓN CLAVE: El mapeo ahora coincide con el nuevo modelo.
      const mappedWorks: Work[] = rawData.map((obra: any) => ({
        id: obra.obr_id,
        inventoryNumber: obra.obr_mcf ?? '',
        previousNumbers: obra.obr_numeros_anteriores ?? '',
        name: obra.obr_titulo ?? '',
        artist: obra.artist_name ?? 'Desconocido',
        classification: obra.classification_name ?? '',
        realizationDate: obra.obr_fecha_realizacion ?? '',
        technique: obra.technique_str ?? '',
        materials: obra.materials_str ?? '',
        dimensions: {
          height: obra.obr_alto_cm ?? '',
          width: obra.obr_ancho_cm ?? '',
          depth: obra.obr_profundidad_cm ?? '',
          diameter: obra.obr_diametro_cm ?? ''
        },
        description: obra.obr_descripcion_formal ?? '',
        signatureDetails: obra.obr_detalles_firma ?? '',
        observations: obra.obr_observaciones ?? '',
         photoUrl: obra.obr_url_foto ?? '', // La imagen principal
        imageUrls: obra.image_urls ?? [], // El array de todas las imágenes
        conservationState: {
          condition: obra.obr_estado_condicion ?? '',
          integrity: obra.obr_estado_integridad ?? ''
        },
        // Se separan los datos técnicos del avalúo
        technicalData: {
          provenance: obra.obr_procedencia ?? '',
          culture: obra.obr_cultura_tradicion ?? '',
          eraStyle: obra.obr_epoca_estilo ?? '',
          originalOwner: obra.obr_propietario_original ?? ''
        },
        appraisal: {
            value: obra.obr_valor_avaluo ?? '',
            currency: obra.obr_moneda_avaluo ?? '',
            appraiser: obra.obr_responsable_avaluo ?? '',
            appraisalDate: obra.obr_fecha_avaluo ?? '',
        },
        references: {
          documents: obra.obr_documentos_relacionados ?? '',
          bibliography: obra.obr_bibliografia ?? '',
          exhibitions: obra.obr_exposiciones ?? '',
          treatments: obra.obr_tratamientos ?? ''
        },
        storageLocation: obra.location_name ?? 'Sin ubicación',
        collection: {
          acquisitionSource: obra.obr_fuente_adquisicion ?? '',
          acquisitionMethod: obra.obr_metodo_adquisicion ?? '',
          entryDate: obra.obr_fecha_ingreso ?? ''
        },
        responsibleEntity: {
          name: obra.obr_entidad_responsable ?? '',
    
address: obra.obr_direccion ?? '',
        },
        inventory: {
          responsible: obra.his_inv_responsable ?? '',
          date: obra.his_inv_fecha ?? '',
          supervisor: obra.his_inv_supervisor ?? '',
          supervisorDate: obra.his_inv_fecha_supervisor ?? ''
        }
      }));
      setWorks(mappedWorks);
    } catch (error) {
      console.error("Error al cargar y mapear las obras en App.tsx:", error);
    }
  }, []);
  // Efecto que carga los datos de las obras cuando el token de usuario está disponible
  useEffect(() => {
    if (token) {
      loadAndMapWorks();
    }
  }, [token, loadAndMapWorks]);

  // --- MANEJADORES DE ESTADO (CORREGIDOS) ---

  const handleLogin = (userData: User, userToken: string) => {
    setUser(userData);
    setToken(userToken);
    // CORRECCIÓN: Se asegura de guardar la sesión al iniciarla.
   // Línea 115 (corregida)
AuthController.saveSession(userData, userToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    AuthController.logout();
  };

  // El resto de funciones de actualización (si las necesitas para otras vistas)
  const updateSystemUsers = (newUsers: SystemUser[]) => setSystemUsers(newUsers);
  const updateMovementRecords = (newRecords: MovementRecord[]) => setMovementRecords(newRecords);
  const updateMaintenanceRecords = (newRecords: MaintenanceRecord[]) => setMaintenanceRecords(newRecords);

  // Si no hay usuario, muestra la vista de Login
  if (!user || !token) {
    return <LoginView onLogin={handleLogin} />;
  }

  // Si hay usuario, muestra el Dashboard principal
  return (
    <DashboardView
      user={user}
      token={token}
      works={works}
      onLogout={handleLogout}
      // CORRECCIÓN: Se pasa directamente la función 'loadAndMapWorks' para que los componentes hijos
      // puedan refrescar la lista de obras desde el servidor.
      onUpdateWorks={loadAndMapWorks}
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