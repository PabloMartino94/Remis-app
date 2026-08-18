import { useState, useCallback } from 'react';

interface Position {
  latitude: number;
  longitude: number;
}

interface UseCurrentPositionReturn {
  position: Position | null;
  isLoading: boolean;
  error: string | null;
  getPosition: () => Promise<Position | null>;
}

export function useCurrentPosition(): UseCurrentPositionReturn {
  const [position, setPosition] = useState<Position | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPosition = useCallback(async (): Promise<Position | null> => {
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización');
      return null;
    }

    setIsLoading(true);
    setError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPosition = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          setPosition(newPosition);
          setIsLoading(false);
          resolve(newPosition);
        },
        (err) => {
          let errorMessage = 'Error al obtener ubicación';
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage = 'Permiso de ubicación denegado';
              break;
            case err.POSITION_UNAVAILABLE:
              errorMessage = 'Ubicación no disponible';
              break;
            case err.TIMEOUT:
              errorMessage = 'Tiempo de espera agotado';
              break;
          }
          setError(errorMessage);
          setIsLoading(false);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  }, []);

  return {
    position,
    isLoading,
    error,
    getPosition,
  };
}
