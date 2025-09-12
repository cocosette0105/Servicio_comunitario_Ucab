// frontend/src/App.tsx

import { useState, useEffect, useCallback } from 'react';
import { LoginView, DashboardView } from './views';
import { User, Work, SystemUser, MovementRecord, MaintenanceRecord } from './models';
import { getWorks } from './services/workService';
import { useSessionManager } from './controllers/SessionManager';
import InactivityWarning from './components/InactivityWarning';

function App() {
  // Hook personalizado para gestión de sesión
  const {
    user,
    token,
    isAuthenticated,
    loading,
    showInactivityWarning,
    timeUntilExpiration,
    login,
    logout,
    extendSession,
    dismissWarning
  } = useSessionManager();

  // Estado para la vista activa
  const [activeView, setActiveView] = useState<'overview' | 'works' | 'reports' | 'users' | 'movements' | 'maintenance'>('overview');

  // Estados para los datos de la aplicación
  const [works, setWorks] = useState<Work[]>([]);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [movementRecords, setMovementRecords] = useState<MovementRecord[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);

  // --- FUNCIÓN CENTRALIZADA PARA CARGAR Y MAPEAR OBRAS (SIN CAMBIOS) ---
  const loadAndMapWorks = useCallback(async () => {
    try {
      const rawData: any[] = await getWorks(); 
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      
      // Mapeo de datos (mantienes tu lógica existente)
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
        photoUrl: obra.obr_url_foto ?? '',
        imageUrls: obra.image_urls ?? [],
        conservationState: {
          condition: obra.obr_estado_condicion ?? '',
          integrity: obra.obr_estado_integridad ?? ''
        },
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

  // Efecto que carga los datos cuando hay token
  useEffect(() => {
    if (token) {
      loadAndMapWorks();
    }
  }, [token, loadAndMapWorks]);

  // --- MANEJADORES SIMPLIFICADOS ---
  const handleLogin = async (username: string, password: string) => {
    return await login(username, password);
  };

  const handleLogout = () => {
    logout();
  };

  // Funciones de actualización para otros datos
  const updateSystemUsers = (newUsers: SystemUser[]) => setSystemUsers(newUsers);
  const updateMovementRecords = (newRecords: MovementRecord[]) => setMovementRecords(newRecords);
  const updateMaintenanceRecords = (newRecords: MaintenanceRecord[]) => setMaintenanceRecords(newRecords);

  // Mostrar loading mientras se verifica la sesión
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#192d71] via-[#1e3a8a] to-[#192d71] flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-10 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#192d71] mx-auto mb-4"></div>
          <p className="text-[#192d71] font-semibold">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario autenticado, mostrar login
  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} />;
  }

  // Si hay usuario autenticado, mostrar dashboard
  return (
    <>
      <DashboardView
        user={user!}
        token={token!}
        works={works}
        onLogout={handleLogout}
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
      
      {/* Componente de advertencia de inactividad */}
      <InactivityWarning
        show={showInactivityWarning}
        timeUntilExpiration={timeUntilExpiration}
        onExtendSession={extendSession}
        onDismiss={dismissWarning}
      />
    </>
  );
}

export default App;