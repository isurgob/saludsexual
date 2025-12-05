import { useState, useEffect, useCallback } from 'react';
import { useApiWithGlobalError } from './useApiWithGlobalError';

export function useCentrosSalud() {
  const [centros, setCentros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { executeApiCall } = useApiWithGlobalError();

  // Función para obtener centros de salud con manejo global de errores
  const fetchCentros = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const result = await executeApiCall(async () => {
      const response = await fetch('/api/centros-salud');
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error en la respuesta:', errorText);
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    });

    if (result.success) {
      setCentros(result.data);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  }, [executeApiCall]);

  useEffect(() => {
    fetchCentros();
  }, [fetchCentros]);

  return { centros, loading, error, refetch: fetchCentros };
}
