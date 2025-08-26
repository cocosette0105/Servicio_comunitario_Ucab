// COMPONENTE DE PAGINACIÓN RESPONSIVE
// Componente reutilizable que proporciona controles de navegación por páginas
// Diseñado para ser completamente responsive y accesible en todos los dispositivos

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

// Interface que define las propiedades del componente de paginación
interface PaginationProps {
  currentPage: number; // Página actual (empezando desde 1)
  totalPages: number; // Total de páginas disponibles
  totalItems: number; // Total de elementos en toda la colección
  itemsPerPage: number; // Cantidad de elementos por página
  onPageChange: (page: number) => void; // Función callback para cambiar de página
  className?: string; // Clases CSS adicionales opcionales
}

// Componente principal de paginación con diseño responsive
const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  className = ''
}) => {
  // Si no hay páginas o solo hay una página, no mostrar paginación
  if (totalPages <= 1) return null;

  // Calcula el rango de elementos mostrados en la página actual
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Función para generar los números de página a mostrar
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5; // Máximo de números de página visibles en desktop
    const maxVisiblePagesMobile = 3; // Máximo en móviles
    
    // En móviles, mostrar menos páginas para ahorrar espacio
    const isMobile = window.innerWidth < 768;
    const visiblePages = isMobile ? maxVisiblePagesMobile : maxVisiblePages;
    
    if (totalPages <= visiblePages) {
      // Si hay pocas páginas, mostrar todas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Lógica para mostrar páginas con puntos suspensivos
      const halfVisible = Math.floor(visiblePages / 2);
      
      if (currentPage <= halfVisible + 1) {
        // Mostrar páginas del inicio
        for (let i = 1; i <= visiblePages - 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - halfVisible) {
        // Mostrar páginas del final
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - visiblePages + 2; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Mostrar páginas del medio
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - halfVisible + 1; i <= currentPage + halfVisible - 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white border-t border-[#192d71]/20 ${className}`}>
      {/* Información de elementos mostrados - Responsive */}
      <div className="text-sm text-[#192d71]/70 font-medium order-2 sm:order-1">
        <span className="hidden sm:inline">
          Mostrando {startItem} a {endItem} de {totalItems} elementos
        </span>
        <span className="sm:hidden">
          {startItem}-{endItem} de {totalItems}
        </span>
      </div>

      {/* Controles de navegación - Responsive */}
      <div className="flex items-center space-x-1 sm:space-x-2 order-1 sm:order-2">
        {/* Botón: Primera página */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 sm:p-3 text-[#192d71] hover:bg-[#192d71]/10 disabled:text-[#192d71]/30 disabled:hover:bg-transparent rounded-lg transition-all duration-200 hover:scale-110 disabled:hover:scale-100"
          title="Primera página"
        >
          <ChevronsLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        {/* Botón: Página anterior */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 sm:p-3 text-[#192d71] hover:bg-[#192d71]/10 disabled:text-[#192d71]/30 disabled:hover:bg-transparent rounded-lg transition-all duration-200 hover:scale-110 disabled:hover:scale-100"
          title="Página anterior"
        >
          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        {/* Números de página - Responsive */}
        <div className="flex items-center space-x-1">
          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-2 sm:px-3 py-2 text-[#192d71]/50 text-sm sm:text-base">...</span>
              ) : (
                <button
                  onClick={() => onPageChange(page as number)}
                  className={`px-2 sm:px-3 py-2 text-sm sm:text-base font-semibold rounded-lg transition-all duration-200 hover:scale-110 ${
                    currentPage === page
                      ? 'bg-gradient-to-r from-[#192d71] to-[#1e3a8a] text-white shadow-lg'
                      : 'text-[#192d71] hover:bg-[#192d71]/10'
                  }`}
                  title={`Página ${page}`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Botón: Página siguiente */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 sm:p-3 text-[#192d71] hover:bg-[#192d71]/10 disabled:text-[#192d71]/30 disabled:hover:bg-transparent rounded-lg transition-all duration-200 hover:scale-110 disabled:hover:scale-100"
          title="Página siguiente"
        >
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        {/* Botón: Última página */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 sm:p-3 text-[#192d71] hover:bg-[#192d71]/10 disabled:text-[#192d71]/30 disabled:hover:bg-transparent rounded-lg transition-all duration-200 hover:scale-110 disabled:hover:scale-100"
          title="Última página"
        >
          <ChevronsRight className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;