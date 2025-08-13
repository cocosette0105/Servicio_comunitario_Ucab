import React from 'react'; // Importa React para crear componentes.
import { Package, Users, MapPin, Calendar } from 'lucide-react'; // Importa íconos para mostrar en las tarjetas de estadísticas.
import { Work } from '../types'; // Importa el tipo Work para tipar las props.

interface OverviewProps { // Define las propiedades que recibe el componente Overview.
  works: Work[]; // Lista de obras gestionadas.
}

const Overview: React.FC<OverviewProps> = ({ works }) => { // Componente funcional principal para la vista general.
  const stats = { // Calcula estadísticas generales de las obras.
    totalWorks: works.length, // Total de obras registradas.
    uniqueArtists: new Set(works.map(work => work.artist)).size, // Número de artistas únicos.
    uniqueLocations: new Set(works.map(work => work.storageLocation)).size, // Número de ubicaciones únicas.
    // Filtra las obras ingresadas en el último año y cuenta cuántas hay.
recentWorks: works.filter(work => {
  const entryDate = new Date(work.collection?.entryDate ?? ''); // Obtiene la fecha de ingreso de la obra.
  if (isNaN(entryDate.getTime())) return false; // Si la fecha es inválida, no cuenta la obra.
  // Compara la fecha de ingreso con la fecha actual menos un año. 
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  return entryDate > oneYearAgo;
}).length

  };

  const recentWorks = works // Obtiene las 5 obras más recientemente ingresadas, ordenadas por fecha.
   .sort((a, b) =>
  new Date(b.collection?.entryDate ?? '').getTime() -
  new Date(a.collection?.entryDate ?? '').getTime()
)

    .slice(0, 5);

  return (
    <div className="p-8 space-y-8 bg-gradient-to-br from-[#192d71]/5 to-white min-h-screen">
      {/* Contenedor principal con fondo degradado y espaciado */}
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-[#192d71] to-[#1e3a8a] bg-clip-text text-transparent mb-3">Panel Principal</h1>
        {/* Título principal con efecto de gradiente */}
        <p className="text-[#192d71] text-lg">Bienvenido al sistema de gestión de la bóveda del Museo Carmelo Fernández</p>
        {/* Subtítulo de bienvenida */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Tarjetas de estadísticas generales */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-[#192d71]/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#192d71] mb-2">Total de Obras</p>
              <p className="text-3xl font-bold text-[#192d71]">{stats.totalWorks}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-[#192d71]/20 to-[#192d71]/30 rounded-2xl flex items-center justify-center shadow-lg">
              <Package className="h-7 w-7 text-[#192d71]" /> {/* Ícono de paquete */}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-[#192d71]/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#192d71] mb-2">Artistas</p>
              <p className="text-3xl font-bold text-[#192d71]">{stats.uniqueArtists}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-[#192d71]/20 to-[#192d71]/30 rounded-2xl flex items-center justify-center shadow-lg">
              <Users className="h-7 w-7 text-[#192d71]" /> {/* Ícono de usuarios */}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-[#192d71]/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#192d71] mb-2">Ubicaciones</p>
              <p className="text-3xl font-bold text-[#192d71]">{stats.uniqueLocations}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-[#192d71]/20 to-[#192d71]/30 rounded-2xl flex items-center justify-center shadow-lg">
              <MapPin className="h-7 w-7 text-[#192d71]" /> {/* Ícono de ubicación */}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-[#192d71]/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#192d71] mb-2">Ingresos Recientes</p>
              <p className="text-3xl font-bold text-[#192d71]">{stats.recentWorks}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-[#192d71]/20 to-[#192d71]/30 rounded-2xl flex items-center justify-center shadow-lg">
              <Calendar className="h-7 w-7 text-[#192d71]" /> {/* Ícono de calendario */}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-[#192d71]/20">
        {/* Sección de obras ingresadas recientemente */}
        <div className="p-8 border-b border-[#192d71]/20">
          <h2 className="text-2xl font-bold text-[#192d71]">Obras Ingresadas Recientemente</h2>
        </div>
        <div className="divide-y divide-[#192d71]/10">
          {recentWorks.map((work) => (
            <div key={work.id} className="p-8 hover:bg-gradient-to-r hover:from-[#192d71]/5 hover:to-white transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-[#192d71] text-lg">{work.name}</h3>
                  <p className="text-[#192d71]/80 font-medium">Por {work.artist}</p>
                  <p className="text-[#192d71]/60 mt-1">{work.storageLocation}</p>

                </div>
                <div className="text-right">
                 <p className="text-sm font-bold text-[#192d71]">
  {new Date(work.collection?.entryDate ?? '').toLocaleDateString('es-ES')}
</p>

                  <p className="text-xs text-[#192d71]/60 font-medium">Fecha de ingreso</p>
                </div>
              </div>
            </div>
          ))}
          {recentWorks.length === 0 && (
            <div className="p-8 text-center text-[#192d71]/60 font-medium">
              No hay obras registradas aún {/* Mensaje si no hay obras recientes */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Overview; // Exporta el componente para su uso en otras