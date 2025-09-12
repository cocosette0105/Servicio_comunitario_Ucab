// frontend/src/components/InactivityWarning.tsx
import React, { useEffect } from 'react';
import { AlertTriangle, Clock, MousePointer } from 'lucide-react';

interface InactivityWarningProps {
  show: boolean;
  timeUntilExpiration: number;
  onExtendSession: () => Promise<boolean>;
  onDismiss: () => void;
}

const InactivityWarning: React.FC<InactivityWarningProps> = ({
  show,
  timeUntilExpiration,
  onExtendSession,
  onDismiss
}) => {
  // Detectar movimiento del mouse para extender sesión automáticamente
  useEffect(() => {
    if (!show) return;

    const handleMouseMove = async () => {
      console.log('Movimiento detectado - extendiendo sesión automáticamente');
      const success = await onExtendSession();
      if (success) {
        console.log('Sesión extendida exitosamente por movimiento del mouse');
      }
    };

    // Agregar listener para movimiento del mouse
    document.addEventListener('mousemove', handleMouseMove, { once: true });

    // Cleanup
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [show, onExtendSession]);

  if (!show) return null;

  const minutes = Math.max(0, Math.floor(timeUntilExpiration));
  const isUrgent = minutes <= 2;
  const isCritical = minutes <= 1;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className={`bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 border-2 transform transition-all duration-300 ${
          isCritical ? 'border-red-500 animate-pulse scale-105' : 
          isUrgent ? 'border-orange-500 scale-102' : 'border-amber-200 scale-100'
        }`}>
          
          {/* Header */}
          <div className={`text-white p-6 rounded-t-2xl ${
            isCritical ? 'bg-gradient-to-r from-red-500 to-red-600' :
            isUrgent ? 'bg-gradient-to-r from-orange-500 to-red-500' :
            'bg-gradient-to-r from-amber-500 to-orange-500'
          }`}>
            <div className="flex items-center space-x-3">
              <div className="bg-white bg-opacity-20 rounded-full p-2">
                <AlertTriangle className={`h-6 w-6 ${isCritical ? 'animate-bounce' : ''}`} />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {isCritical ? 'Sesión Expirando AHORA' : 
                   isUrgent ? 'Sesión por Expirar' : 
                   '¿Sigues ahí?'}
                </h2>
                <p className="text-white text-opacity-90 text-sm">
                  Has estado inactivo
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Countdown visual */}
            <div className="text-center mb-6">
              <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-4xl font-bold mb-3 border-4 ${
                isCritical ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' :
                isUrgent ? 'bg-orange-50 text-orange-600 border-orange-200' :
                'bg-amber-50 text-amber-600 border-amber-200'
              }`}>
                {minutes}
              </div>
              <p className={`text-sm font-semibold ${
                isCritical ? 'text-red-600' : isUrgent ? 'text-orange-600' : 'text-amber-600'
              }`}>
                {minutes === 1 ? 'minuto restante' : `minutos restantes`}
              </p>
            </div>

            {/* Mensaje principal */}
            <div className="flex items-start space-x-3 mb-6">
              <Clock className={`h-5 w-5 mt-0.5 ${
                isCritical ? 'text-red-600' : isUrgent ? 'text-orange-600' : 'text-amber-600'
              }`} />
              <div>
                <span className="text-gray-800 font-medium block">
                  Tu sesión se cerrará automáticamente por inactividad.
                </span>
              </div>
            </div>

            {/* Instrucción clara para el usuario */}
            <div className={`rounded-lg p-4 text-center ${
              isCritical ? 'bg-red-50 border-2 border-red-300' :
              isUrgent ? 'bg-orange-50 border-2 border-orange-300' :
              'bg-blue-50 border-2 border-blue-300'
            }`}>
              <MousePointer className={`h-8 w-8 mx-auto mb-2 ${
                isCritical ? 'text-red-600 animate-bounce' :
                isUrgent ? 'text-orange-600' :
                'text-blue-600'
              }`} />
              <p className={`font-bold text-lg ${
                isCritical ? 'text-red-700' :
                isUrgent ? 'text-orange-700' :
                'text-blue-700'
              }`}>
                Mueve el mouse para continuar
              </p>
              <p className={`text-sm mt-1 ${
                isCritical ? 'text-red-600' :
                isUrgent ? 'text-orange-600' :
                'text-blue-600'
              }`}>
                El movimiento del mouse extenderá tu sesión automáticamente
              </p>
            </div>

            {/* Footer informativo */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                {isCritical ? 
                  'Logout automático inminente - ¡mueve el mouse ahora!' :
                  'Tu sesión continuará activa al detectar actividad'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default InactivityWarning;