// HOOK PERSONALIZADO PARA PAGINACIÓN
// Hook reutilizable que encapsula toda la lógica de paginación
// Proporciona funciones y estados necesarios para implementar paginación en cualquier vista

import { useState, useMemo, useCallback, useEffect } from 'react';

// Interface que define las opciones de configuración del hook
interface UsePaginationOptions {
  itemsPerPage?: number; // Cantidad de elementos por página (por defecto 10)
  initialPage?: number; // Página inicial (por defecto 1)
}

// Interface que define el valor de retorno del hook
interface UsePaginationReturn<T> {
  // Estados actuales
  currentPage: number; // Página actual
  totalPages: number; // Total de páginas
  paginatedItems: T[]; // Elementos de la página actual
  
  // Información adicional
  startIndex: number; // Índice del primer elemento de la página
  endIndex: number; // Índice del último elemento de la página
  hasNextPage: boolean; // Si existe página siguiente
  hasPrevPage: boolean; // Si existe página anterior
  
  // Funciones de navegación
  goToPage: (page: number) => void; // Ir a página específica
  nextPage: () => void; // Ir a página siguiente
  prevPage: () => void; // Ir a página anterior
  goToFirstPage: () => void; // Ir a primera página
  goToLastPage: () => void; // Ir a última página
  setItemsPerPage: (items: number) => void; // Cambiar elementos por página
}

// Hook personalizado para manejar paginación
export function usePagination<T>(
  items: T[], // Array de elementos a paginar
  options: UsePaginationOptions = {} // Opciones de configuración
): UsePaginationReturn<T> {
  // Extrae opciones con valores por defecto
  const { itemsPerPage: defaultItemsPerPage = 10, initialPage = 1 } = options;
  
  // Estados locales del hook
  const [currentPage, setCurrentPage] = useState(initialPage); // Página actual
  const [itemsPerPage, setItemsPerPageState] = useState(defaultItemsPerPage); // Elementos por página

  // Efecto para resetear a página 1 cuando cambian los elementos
  // Esto previene errores cuando se aplican filtros que reducen el total de elementos
  useEffect(() => {
    setCurrentPage(1);
  }, [items.length]);

  // Cálculos memoizados para optimizar rendimiento
  const paginationData = useMemo(() => {
    // Calcula el total de páginas necesarias
    const totalPages = Math.ceil(items.length / itemsPerPage);
    
    // Calcula índices de inicio y fin para la página actual
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, items.length);
    
    // Extrae los elementos de la página actual
    const paginatedItems = items.slice(startIndex, endIndex);
    
    return {
      totalPages,
      startIndex,
      endIndex,
      paginatedItems,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1
    };
  }, [items, currentPage, itemsPerPage]);

  // Función para ir a una página específica con validación
  const goToPage = useCallback((page: number) => {
    const { totalPages } = paginationData;
    
    // Valida que la página esté en el rango válido
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [paginationData]);

  // Función para ir a la página siguiente
  const nextPage = useCallback(() => {
    if (paginationData.hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [paginationData.hasNextPage]);

  // Función para ir a la página anterior
  const prevPage = useCallback(() => {
    if (paginationData.hasPrevPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [paginationData.hasPrevPage]);

  // Función para ir a la primera página
  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  // Función para ir a la última página
  const goToLastPage = useCallback(() => {
    setCurrentPage(paginationData.totalPages);
  }, [paginationData.totalPages]);

  // Función para cambiar la cantidad de elementos por página
  const setItemsPerPage = useCallback((items: number) => {
    setItemsPerPageState(items);
    setCurrentPage(1); // Resetea a página 1 cuando cambia la cantidad
  }, []);

  // Retorna todos los valores y funciones necesarios
  return {
    currentPage,
    totalPages: paginationData.totalPages,
    paginatedItems: paginationData.paginatedItems,
    startIndex: paginationData.startIndex,
    endIndex: paginationData.endIndex,
    hasNextPage: paginationData.hasNextPage,
    hasPrevPage: paginationData.hasPrevPage,
    goToPage,
    nextPage,
    prevPage,
    goToFirstPage,
    goToLastPage,
    setItemsPerPage
  };
}