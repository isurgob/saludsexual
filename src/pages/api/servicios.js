import { getServiciosUnicos } from '../../services/metadataService.js';

export default async function handler(req, res) {
  // Solo permitir método GET
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      message: 'Método no permitido. Solo se permite GET.' 
    });
  }

  try {
    // Obtener servicios desde la base de datos
    const servicios = await getServiciosUnicos();
    
    // Transformar datos para el frontend (agregar colores por defecto)
    const serviciosTransformados = servicios.map((servicio, index) => ({
      value: servicio.tipo,
      label: servicio.tipo,
      id: servicio.id,
      // Asignar colores rotativos para los badges
      color: getColorForService(index)
    }));

    // Respuesta exitosa
    res.status(200).json({
      success: true,
      count: serviciosTransformados.length,
      data: serviciosTransformados
    });

  } catch (error) {
    console.error('❌ API Error obteniendo servicios:', error.message);
    console.error('❌ Stack trace:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener servicios',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }
}

// Función auxiliar para asignar colores a los servicios
function getColorForService(index) {
  const colors = ['red', 'blue', 'green', 'orange', 'violet', 'pink', 'cyan', 'yellow'];
  return colors[index % colors.length];
}