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
    <div className="p-8 space-y-8 bg-gradient-to-br from-amber-50 to-white min-h-screen">
      {/* Contenedor principal con fondo degradado y espaciado */}
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-800 to-amber-900 bg-clip-text text-transparent mb-3">Panel Principal</h1>
        {/* Título principal con efecto de gradiente */}
        <p className="text-amber-700 text-lg">Bienvenido al sistema de gestión de la bóveda del Museo Carmelo Fernández</p>
        {/* Subtítulo de bienvenida */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Tarjetas de estadísticas generales */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-amber-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-700 mb-2">Total de Obras</p>
              <p className="text-3xl font-bold text-amber-900">{stats.totalWorks}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-amber-200 to-amber-300 rounded-2xl flex items-center justify-center shadow-lg">
              <Package className="h-7 w-7 text-amber-800" /> {/* Ícono de paquete */}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-amber-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-700 mb-2">Artistas</p>
              <p className="text-3xl font-bold text-amber-900">{stats.uniqueArtists}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-200 to-yellow-300 rounded-2xl flex items-center justify-center shadow-lg">
              <Users className="h-7 w-7 text-yellow-800" /> {/* Ícono de usuarios */}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-amber-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-700 mb-2">Ubicaciones</p>
              <p className="text-3xl font-bold text-amber-900">{stats.uniqueLocations}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-orange-200 to-orange-300 rounded-2xl flex items-center justify-center shadow-lg">
              <MapPin className="h-7 w-7 text-orange-800" /> {/* Ícono de ubicación */}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-amber-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-700 mb-2">Ingresos Recientes</p>
              <p className="text-3xl font-bold text-amber-900">{stats.recentWorks}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-red-200 to-red-300 rounded-2xl flex items-center justify-center shadow-lg">
              <Calendar className="h-7 w-7 text-red-800" /> {/* Ícono de calendario */}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-amber-200">
        {/* Sección de obras ingresadas recientemente */}
        <div className="p-8 border-b border-amber-200">
          <h2 className="text-2xl font-bold text-amber-900">Obras Ingresadas Recientemente</h2>
        </div>
        <div className="divide-y divide-amber-100">
          {recentWorks.map((work) => (
            <div key={work.id} className="p-8 hover:bg-gradient-to-r hover:from-amber-50 hover:to-white transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-amber-900 text-lg">{work.name}</h3>
                  <p className="text-amber-700 font-medium">Por {work.artist}</p>
                  <p className="text-amber-600 mt-1">{work.storageLocation}</p>

                </div>
                <div className="text-right">
                 <p className="text-sm font-bold text-amber-900">
  {new Date(work.collection?.entryDate ?? '').toLocaleDateString('es-ES')}
</p>

                  <p className="text-xs text-amber-600 font-medium">Fecha de ingreso</p>
                </div>
              </div>
            </div>
          ))}
          {recentWorks.length === 0 && (
            <div className="p-8 text-center text-amber-600 font-medium">
              No hay obras registradas aún {/* Mensaje si no hay obras recientes */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Overview; // Exporta el componente para su uso en otras