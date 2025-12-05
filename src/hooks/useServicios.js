import { useState, useEffect, useCallback } from 'react';

export function useServicios() {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para obtener servicios
  const fetchServicios = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/servicios');
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Hook: Error en la respuesta:', errorText);
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      setServicios(result.data);
    } catch (err) {
      console.error('❌ Hook: Error fetching servicios:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServicios();
  }, [fetchServicios]);

  return { 
    servicios, 
    loading, 
    error, 
    refetch: fetchServicios 
  };
}
