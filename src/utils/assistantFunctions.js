// Funciones disponibles para el OpenAI Assistant
// Estas funciones permiten al asistente consultar información del sistema

/**
 * Función principal para consultar centros de salud con información completa
 */
export const getCentrosSaludFunction = {
  name: "get_centros_salud",
  description: "Obtiene información COMPLETA de centros de salud en Comodoro Rivadavia incluyendo: nombres, direcciones exactas, teléfonos, horarios, servicios disponibles, coordenadas GPS y detalles de contacto. Puede filtrar por servicios específicos o tipo de centro.",
  parameters: {
    type: "object",
    properties: {
      servicio: {
        type: "string",
        description: "Filtrar centros por servicio específico. Opciones: 'testeo' (para test de VIH, sífilis, etc.), 'vacunacion', 'consulta', 'planificacion' (planificación familiar y preservativos), 'prep', 'pep', 'atencion_general', 'preservativos' (para obtener preservativos gratuitos), 'anticonceptivos'. Si el usuario pregunta sobre preservativos, usar 'preservativos' o 'planificacion'.",
        enum: ["testeo", "vacunacion", "consulta", "planificacion", "prep", "pep", "atencion_general", "preservativos", "anticonceptivos"]
      },
      tipo: {
        type: "string", 
        description: "Filtrar por tipo de centro: 'Municipal' (CAPs municipales) o 'Provincial' (centros provinciales)",
        enum: ["Municipal", "Provincial"]
      },
      incluir_coordenadas: {
        type: "boolean",
        description: "Siempre true - incluye coordenadas GPS para ubicación exacta",
        default: true
      }
    },
    required: []
  }
};

/**
 * Función para buscar centros cercanos a una ubicación
 */
export const buscarCentrosCercanosFunction = {
  name: "buscar_centros_cercanos", 
  description: "Busca centros de salud cercanos a una dirección o barrio específico en Comodoro Rivadavia",
  parameters: {
    type: "object",
    properties: {
      ubicacion: {
        type: "string",
        description: "Dirección, barrio o zona de Comodoro Rivadavia para buscar centros cercanos"
      },
      servicio: {
        type: "string",
        description: "Tipo de servicio buscado",
        enum: ["testeo", "vacunacion", "consulta", "planificacion", "prep", "pep", "atencion_general"]
      }
    },
    required: ["ubicacion"]
  }
};

/**
 * Función para obtener información detallada de un centro específico
 */
export const getDetallesCentroFunction = {
  name: "get_detalles_centro",
  description: "Obtiene información detallada de un centro de salud específico incluyendo horarios, contacto y servicios",
  parameters: {
    type: "object", 
    properties: {
      nombre_centro: {
        type: "string",
        description: "Nombre del centro de salud del cual obtener detalles"
      }
    },
    required: ["nombre_centro"]
  }
};

/**
 * Función para obtener TODOS los centros de salud sin filtros
 */
export const getTodosCentrosSaludFunction = {
  name: "get_todos_centros_salud",
  description: "Obtiene información COMPLETA de TODOS los centros de salud disponibles en Comodoro Rivadavia. Incluye nombres, direcciones exactas, teléfonos, horarios, todos los servicios disponibles, coordenadas GPS y detalles de contacto. Usar cuando se necesite una vista completa de todos los centros.",
  parameters: {
    type: "object",
    properties: {},
    required: []
  }
};

/**
 * Función específica para buscar preservativos
 */
export const getPreservativosFunction = {
  name: "get_preservativos",
  description: "Encuentra centros de salud donde se pueden obtener preservativos gratuitos en Comodoro Rivadavia. Usar cuando el usuario pregunte específicamente sobre preservativos o condones.",
  parameters: {
    type: "object",
    properties: {},
    required: []
  }
};

/**
 * Función para servicios de asesoramiento
 */
export const getAsesoramientoFunction = {
  name: "get_asesoramiento",
  description: "Encuentra centros que ofrecen servicios de asesoramiento en salud sexual y reproductiva. Usar cuando el usuario pregunte sobre asesoramiento, consejería o orientación en salud sexual.",
  parameters: {
    type: "object",
    properties: {},
    required: []
  }
};

/**
 * Función para anticonceptivos
 */
export const getAnticonceptivosFunction = {
  name: "get_anticonceptivos", 
  description: "Encuentra centros que ofrecen anticonceptivos y métodos de planificación familiar. Usar cuando el usuario pregunte sobre anticonceptivos o métodos anticonceptivos.",
  parameters: {
    type: "object",
    properties: {},
    required: []
  }
};

/**
 * Función para consultorio inclusivo
 */
export const getConsultorioInclusivoFunction = {
  name: "get_consultorio_inclusivo",
  description: "Encuentra centros que tienen consultorios inclusivos para diversidad sexual y de género. Usar cuando el usuario pregunte sobre consultorio inclusivo, atención LGBTI+ o diversidad sexual.",
  parameters: {
    type: "object",
    properties: {},
    required: []
  }
};

/**
 * Función para testeos de VIH y otras ITS
 */
export const getTesteoVIHFunction = {
  name: "get_testeo_vih",
  description: "Encuentra centros que realizan testeos de VIH y otras ITS (Infecciones de Transmisión Sexual) incluyendo sífilis. Usar cuando el usuario pregunte sobre test de VIH, testeos, pruebas de VIH o ITS.",
  parameters: {
    type: "object",
    properties: {},
    required: []
  }
};

/**
 * Función para PrEP y PEP
 */
export const getPrepPepFunction = {
  name: "get_prep_pep",
  description: "Encuentra centros que ofrecen PrEP (Profilaxis Pre-Exposición) y PEP (Profilaxis Post-Exposición) para prevención de VIH. Usar cuando el usuario pregunte sobre PrEP, PEP o medicamentos preventivos para VIH.",
  parameters: {
    type: "object",
    properties: {},
    required: []
  }
};

/**
 * FUNCIÓN INTEGRAL - Búsqueda completa en todas las fuentes
 */
export const busquedaIntegralFunction = {
  name: "busqueda_integral",
  description: "Realiza una búsqueda COMPLETA e INTEGRAL que combina TODAS las fuentes de información disponibles: contenido web del sitio, base de datos de centros de salud, páginas específicas e información de navegación. Usar esta función cuando se necesite información COMPLETA sobre cualquier tema de salud sexual o cuando las respuestas simples no sean suficientes.",
  parameters: {
    type: "object",
    properties: {
      consulta: {
        type: "string",
        description: "La consulta o pregunta del usuario para buscar en todas las fuentes de información"
      },
      incluir_centros: {
        type: "boolean",
        description: "Incluir búsqueda en base de datos de centros de salud",
        default: true
      },
      incluir_web: {
        type: "boolean", 
        description: "Incluir búsqueda en contenido web del sitio",
        default: true
      },
      incluir_paginas: {
        type: "boolean",
        description: "Incluir búsqueda en páginas específicas del sitio",
        default: true
      }
    },
    required: ["consulta"]
  }
};

/**
 * FUNCIÓN ESPECIALIZADA - Información completa de salud sexual
 */
export const getHealthInfoCompleteFunction = {
  name: "get_health_info_complete",
  description: "Obtiene información COMPLETA y ESPECIALIZADA sobre temas específicos de salud sexual, combinando contenido del sitio web, centros de salud relevantes, información de prevención, testeos y tratamiento. Usar para preguntas específicas sobre VIH, sífilis, gonorrea, hepatitis, preservativos, anticonceptivos, PrEP, PEP, etc.",
  parameters: {
    type: "object",
    properties: {
      tema: {
        type: "string",
        description: "Tema principal de salud sexual",
        enum: ["vih", "sifilis", "gonorrea", "hepatitis", "its", "preservativos", "anticonceptivos", "prep", "pep", "testeos", "vacunacion", "embarazo", "lactancia"]
      },
      aspecto: {
        type: "string",
        description: "Aspecto específico del tema (opcional)",
        enum: ["prevencion", "sintomas", "tratamiento", "testeo", "donde-conseguir", "como-usar", "efectos-secundarios", "cuando-usar"]
      }
    },
    required: ["tema"]
  }
};

/**
 * FUNCIÓN DE BÚSQUEDA WEB - Contenido del sitio web
 */
export const getWebContentFunction = {
  name: "get_web_content", 
  description: "Busca información específica en el contenido web del sitio oficial. Usar cuando se necesite información actualizada del sitio web o para verificar información oficial.",
  parameters: {
    type: "object",
    properties: {
      consulta: {
        type: "string",
        description: "Término o frase a buscar en el contenido web"
      },
      tipo: {
        type: "string",
        description: "Tipo de búsqueda web",
        enum: ["busqueda_completa", "informacion_actualizada", "verificacion"]
      }
    },
    required: ["consulta"]
  }
};

/**
 * FUNCIÓN DE PÁGINAS ESPECÍFICAS - Información detallada de páginas
 */
export const buscarContenidoSitioFunction = {
  name: "buscar_contenido_sitio",
  description: "Busca información específica en las páginas del sitio web (VIH, preservativos, testeos, ITS, etc.). Usar cuando se necesite información detallada de páginas específicas del sitio.",
  parameters: {
    type: "object",
    properties: {
      consulta: {
        type: "string", 
        description: "Término a buscar en las páginas del sitio"
      },
      categoria: {
        type: "string",
        description: "Categoría de páginas donde buscar",
        enum: ["salud-sexual", "prevencion", "testeos", "tratamiento", "derechos", "servicios", "general"]
      }
    },
    required: ["consulta"]
  }
};

/**
 * FUNCIÓN DE INFORMACIÓN DE PÁGINAS DE SALUD
 */
export const getInfoPaginaSaludFunction = {
  name: "get_info_pagina_salud",
  description: "Obtiene información específica de páginas dedicadas a temas de salud sexual en el sitio web.",
  parameters: {
    type: "object",
    properties: {
      tema: {
        type: "string",
        description: "Tema de la página de salud",
        enum: ["vih", "preservativos", "testeos", "its", "prevencion-combinada", "embarazo-lactancia", "apoyo-vih", "conoce-tus-derechos", "vacunacion", "vih-dinamico"]
      },
      seccion: {
        type: "string",
        description: "Sección específica de la página (opcional)",
        enum: ["introduccion", "sintomas", "prevencion", "tratamiento", "donde-ir", "derechos"]
      }
    },
    required: ["tema"]
  }
};