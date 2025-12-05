// Handler para ejecutar funciones llamadas por el OpenAI Assistant
import { getCentrosSalud } from '../services/centrosSaludService.js';
import { executeWebFunction } from './webHandler.js';
import { executePaginaFunction } from './paginasHandler.js';
import { executeNavegacionFunction } from './navegacionHandler.js';
import { executeIntegralSearch, searchHealthInfo } from './integralHandler.js';

/**
 * Ejecuta las funciones llamadas por el Assistant
 */
export async function executeFunctionCall(functionName, args) {
  
  try {
    switch (functionName) {
      case 'get_centros_salud':
        return await handleGetCentrosSalud(args);
        
      case 'get_todos_centros_salud':
        return await handleGetTodosCentrosSalud(args);
        
      case 'get_preservativos':
        return await handleGetPreservativos(args);
        
      case 'get_asesoramiento':
        return await handleGetAsesoramiento(args);
        
      case 'get_anticonceptivos':
        return await handleGetAnticonceptivos(args);
        
      case 'get_consultorio_inclusivo':
        return await handleGetConsultorioInclusivo(args);
        
      case 'get_testeo_vih':
        return await handleGetTesteoVIH(args);
        
      case 'get_prep_pep':
        return await handleGetPrepPep(args);
        
      case 'buscar_centros_cercanos':
        return await handleBuscarCentrosCercanos(args);
        
      case 'get_detalles_centro':
        return await handleGetDetallesCentro(args);
        
      // Funciones web - Nuestro sitio oficial
      case 'get_web_content':
      case 'get_sitio_oficial_info':
      case 'get_actualizaciones_sitio':
      case 'verificar_info_sitio':
        return await executeWebFunction(functionName, args);
        
      // Funciones de páginas específicas del sitio
      case 'get_info_pagina_salud':
      case 'get_info_inicio':
      case 'get_info_mapa':
      case 'get_info_proyecto':
      case 'buscar_contenido_sitio':
      case 'get_info_legal':
        return await executePaginaFunction(functionName, args);
        
      // Funciones de navegación mejorada
      case 'get_info_mapa_mejorado':
      case 'get_navegacion_sitio':
        return await executeNavegacionFunction(functionName, args);
        
      // Funciones integrales - Combinan web + base de datos + contenido
      case 'busqueda_integral':
      case 'search_all_sources':
        return await executeIntegralSearch(args.consulta || args.query, args);
        
      case 'get_health_info_complete':
      case 'buscar_info_salud_completa':
        return await searchHealthInfo(args.tema || args.topic, args.aspecto || args.aspect);
        
      default:
        throw new Error(`Función desconocida: ${functionName}`);
    }
  } catch (error) {
    console.error(`❌ Error ejecutando función ${functionName}:`, error);
    return {
      error: true,
      message: `Error ejecutando ${functionName}: ${error.message}`
    };
  }
}

/**
 * Obtener centros de salud con TODA la información completa
 */
async function handleGetCentrosSalud(args = {}) {
  const { servicio, tipo, buscar_por_ubicacion = true } = args; // Por defecto incluir ubicación
  
  
  // Obtener todos los centros de la base de datos
  const centrosRaw = await getCentrosSalud();
  
  // Transformar al formato COMPLETO para el assistant
  let centros = centrosRaw.map(centro => {
    const centroCompleto = {
      id: centro.id,
      nombre: centro.nombre,
      direccion: centro.direccion,
      telefono: centro.telefono,
      whatsapp: centro.whatsapp || null,
      email: centro.email || null,
      horarios: centro.dias_horas,
      descripcion: centro.descripcion,
      tipo: centro.tipo_nombre,
      categoria: centro.categoria_nombre,
      servicios: centro.servicios ? centro.servicios.split(', ') : [],
      coordenadas: {
        latitud: parseFloat(centro.latitud),
        longitud: parseFloat(centro.longitud)
      },
      // Información adicional del mapa
      color: centro.color,
      fecha_creacion: centro.fecha_graba,
      // Información completa para el assistant
      informacion_completa: {
        direccion_completa: centro.direccion,
        telefono_contacto: centro.telefono,
        horarios_atencion: centro.dias_horas || 'Consultar horarios de atención',
        tipo_centro: centro.tipo_nombre,
        categoria: centro.categoria_nombre,
        servicios_disponibles: centro.servicios ? centro.servicios.split(', ') : [],
        ubicacion_exacta: `Latitud: ${centro.latitud}, Longitud: ${centro.longitud}`,
        como_llegar: `Ubicado en ${centro.direccion}, Comodoro Rivadavia`,
        contacto_adicional: centro.whatsapp ? `WhatsApp: ${centro.whatsapp}` : null,
        email_contacto: centro.email || null
      }
    };
    
    return centroCompleto;
  });
  
  // Filtrar por servicio si se especifica
  if (servicio) {
    centros = centros.filter(centro => 
      centro.servicios.some(s => {
        const servicioLower = s.toLowerCase();
        const filtroLower = servicio.toLowerCase();
        
        return servicioLower.includes(filtroLower) ||
               (servicio === 'testeo' && servicioLower.includes('test')) ||
               (servicio === 'preservativos' && (servicioLower.includes('preservativo') || servicioLower.includes('planificacion'))) ||
               (servicio === 'planificacion' && (servicioLower.includes('preservativo') || servicioLower.includes('planificacion') || servicioLower.includes('anticonceptivo')));
      })
    );
  }
  
  // Filtrar por tipo si se especifica
  if (tipo) {
    centros = centros.filter(centro => 
      centro.tipo && centro.tipo.toLowerCase().includes(tipo.toLowerCase())
    );
  }
  
  return {
    success: true,
    centros: centros,
    total: centros.length,
    filtros_aplicados: { servicio, tipo },
    mensaje: `Se encontraron ${centros.length} centros de salud en Comodoro Rivadavia${servicio ? ` con servicio de ${servicio}` : ''}${tipo ? ` del tipo ${tipo}` : ''}`
  };
}

/**
 * Obtener TODOS los centros de salud sin filtros (información completa)
 */
async function handleGetTodosCentrosSalud(args = {}) {
  // Usar la función base sin filtros
  const resultado = await handleGetCentrosSalud({});
  
  if (!resultado.success) {
    return resultado;
  }
  
  return {
    success: true,
    todos_los_centros: resultado.centros,
    total_centros: resultado.centros.length,
    resumen: {
      centros_municipales: resultado.centros.filter(c => c.tipo === 'Municipal').length,
      centros_provinciales: resultado.centros.filter(c => c.tipo === 'Provincial').length,
      servicios_disponibles: [...new Set(resultado.centros.flatMap(c => c.servicios))],
      ubicaciones: resultado.centros.map(c => ({ nombre: c.nombre, direccion: c.direccion }))
    },
    mensaje: `Información completa de todos los ${resultado.centros.length} centros de salud disponibles en Comodoro Rivadavia`
  };
}

/**
 * Buscar centros cercanos a una ubicación
 */
async function handleBuscarCentrosCercanos(args) {
  const { ubicacion, servicio } = args;
  
  // Obtener todos los centros
  const resultado = await handleGetCentrosSalud({ servicio, buscar_por_ubicacion: true });
  
  if (!resultado.success) {
    return resultado;
  }
  
  // Por ahora devolvemos todos los centros con información de ubicación
  // En el futuro podrías implementar geocoding para encontrar los más cercanos
  const centrosConDistancia = resultado.centros.map(centro => ({
    ...centro,
    ubicacion_buscada: ubicacion,
    nota: `Centro en ${centro.direccion} - Contactar al ${centro.telefono} para más información`
  }));
  
  return {
    success: true,
    ubicacion_buscada: ubicacion,
    centros_encontrados: centrosConDistancia,
    total: centrosConDistancia.length,
    mensaje: `Encontrados ${centrosConDistancia.length} centros de salud en Comodoro Rivadavia${servicio ? ` con servicio de ${servicio}` : ''}`
  };
}

/**
 * Obtener detalles específicos de un centro
 */
async function handleGetDetallesCentro(args) {
  const { nombre_centro } = args;
  
  const resultado = await handleGetCentrosSalud({ buscar_por_ubicacion: true });
  
  if (!resultado.success) {
    return resultado;
  }
  
  // Buscar el centro por nombre (búsqueda flexible)
  const centro = resultado.centros.find(c => 
    c.nombre.toLowerCase().includes(nombre_centro.toLowerCase()) ||
    nombre_centro.toLowerCase().includes(c.nombre.toLowerCase())
  );
  
  if (!centro) {
    return {
      success: false,
      mensaje: `No se encontró un centro con el nombre "${nombre_centro}". Centros disponibles: ${resultado.centros.map(c => c.nombre).join(', ')}`
    };
  }
  
  return {
    success: true,
    centro: {
      ...centro,
      informacion_adicional: {
        como_llegar: `El centro está ubicado en ${centro.direccion}`,
        horarios_atencion: centro.horarios || 'Contactar para confirmar horarios',
        telefono_contacto: centro.telefono,
        servicios_disponibles: centro.servicios,
        tipo_centro: centro.tipo
      }
    }
  };
}

/**
 * Obtener centros que ofrecen preservativos
 */
async function handleGetPreservativos(args = {}) {
  return await buscarPorServicio('Preservativos', 'preservativos', 'preservativo');
}

/**
 * Obtener centros que ofrecen asesoramiento
 */
async function handleGetAsesoramiento(args = {}) {
  return await buscarPorServicio('Asesoramiento', 'asesoramiento', 'asesoramiento');
}

/**
 * Obtener centros que ofrecen anticonceptivos
 */
async function handleGetAnticonceptivos(args = {}) {
  return await buscarPorServicio('Anticonceptivos', 'anticonceptivos', 'anticonceptivo');
}

/**
 * Obtener centros con consultorio inclusivo
 */
async function handleGetConsultorioInclusivo(args = {}) {
  return await buscarPorServicio('Consultorio Inclusivo', 'consultorio inclusivo', 'inclusivo');
}

/**
 * Obtener centros que realizan testeos de VIH
 */
async function handleGetTesteoVIH(args = {}) {
  return await buscarPorServicio('TESTEOS VIH y otras ITS', 'testeos', 'testeo', ['vih', 'sifilis', 'its']);
}

/**
 * Obtener centros que ofrecen PrEP y PEP
 */
async function handleGetPrepPep(args = {}) {
  return await buscarPorServicio('PrEP y PEP', 'prep y pep', 'prep', ['pep']);
}

/**
 * Función auxiliar para buscar centros por servicio específico
 */
async function buscarPorServicio(nombreServicio, descripcionServicio, palabraClave, palabrasAdicionales = []) {
  // Obtener todos los centros
  const resultado = await handleGetCentrosSalud({ buscar_por_ubicacion: true });
  
  if (!resultado.success) {
    return resultado;
  }
  
  // Filtrar centros que ofrecen el servicio específico
  const centrosFiltrados = resultado.centros.filter(centro => {
    const servicios = centro.servicios || [];
    return servicios.some(servicio => {
      const servicioLower = servicio.toLowerCase();
      const buscar = [palabraClave, ...palabrasAdicionales].map(p => p.toLowerCase());
      return buscar.some(palabra => servicioLower.includes(palabra));
    });
  });

  return {
    success: true,
    centros_encontrados: centrosFiltrados.length,
    servicio_buscado: nombreServicio,
    mensaje: `Encontré ${centrosFiltrados.length} centros de salud que ofrecen ${descripcionServicio} en Comodoro Rivadavia`,
    centros: centrosFiltrados.map(centro => ({
      ...centro,
      servicios_relacionados: centro.servicios.filter(servicio => {
        const servicioLower = servicio.toLowerCase();
        const buscar = [palabraClave, ...palabrasAdicionales].map(p => p.toLowerCase());
        return buscar.some(palabra => servicioLower.includes(palabra));
      }),
      informacion_servicio: {
        servicio: nombreServicio,
        direccion: centro.direccion,
        telefono: centro.telefono,
        horarios: centro.horarios || 'Consultar horarios',
        como_llegar: `Ubicado en ${centro.direccion}, Comodoro Rivadavia`,
        contacto: centro.whatsapp ? `WhatsApp: ${centro.whatsapp}` : null
      }
    })),
    informacion_adicional: {
      total_centros: centrosFiltrados.length,
      mensaje_usuario: `Estos centros de salud ofrecen ${descripcionServicio}. Te recomiendo llamar antes de ir para confirmar horarios y disponibilidad.`,
      servicios_disponibles: [...new Set(centrosFiltrados.flatMap(c => c.servicios_relacionados || []))]
    }
  };
}