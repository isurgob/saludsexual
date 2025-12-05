import {
  getCentrosSalud,
  createCentroSalud,
  updateCentroSalud,
  deleteCentroSalud,
  insertCentroServicio,
} from "../../services/centrosSaludService.js";

// API route para CRUD de centros de salud desde PostgreSQL
export default async function handler(req, res) {
  const { method } = req;

  try {
    switch (method) {
      case "GET":
        return await handleGet(req, res);

      case "POST":
        return await handlePost(req, res);

      default:
        return res.status(405).json({ message: "Método no permitido" });
    }
  } catch (error) {
    console.error("Error en API centros-salud:", error);
    res.status(500).json({
      message: "Error interno del servidor",
    });
  }
}

// Manejar GET - Obtener todos los centros
async function handleGet(req, res) {
  // Usar la función específica de la base de datos
  const centros = await getCentrosSalud();

  // Transformar los datos al formato que esperan tus componentes de mapa
  const centrosFormatted = centros.map((centro) => {
    const formatted = {
      id: centro.id,
      name: centro.nombre,
      address: centro.direccion,
      phone: centro.telefono,
      hours: centro.dias_horas,
      lat: parseFloat(centro.latitud),
      lng: parseFloat(centro.longitud),
      description: centro.descripcion,
      tipo: centro.tipo_nombre,
      categoria: centro.categoria_nombre,
      servicios: centro.servicios ? centro.servicios.split(", ") : [],
      // Campos adicionales para administración
      nombre: centro.nombre,
      direccion: centro.direccion,
      telefono: centro.telefono,
      whatsapp: centro.whatsapp,
      email: centro.email,
      horarios: centro.dias_horas,
      latitude: parseFloat(centro.latitud),
      longitude: parseFloat(centro.longitud),
      fecha_graba: centro.fecha_graba,
      tipo_id: centro.tipo_id,
      categoria_id: centro.categoria_id,
      servicios_ids: centro.servicios_ids || [],
      color: centro.color,
    };

    // Verificar si las coordenadas son válidas
    if (isNaN(formatted.lat) || isNaN(formatted.lng)) {
      console.warn(
        "⚠️ Centro con coordenadas inválidas:",
        centro.nombre,
        "lat:",
        centro.latitud,
        "lng:",
        centro.longitud
      );
    }

    return formatted;
  });

  // Filtrar centros con coordenadas válidas
  const centrosValid = centrosFormatted.filter(
    (centro) =>
      !isNaN(centro.lat) &&
      !isNaN(centro.lng) &&
      centro.lat !== 0 &&
      centro.lng !== 0
  );

  res.status(200).json(centrosValid);
}

// Manejar POST - Crear nuevo centro
async function handlePost(req, res) {
  const {
    nombre,
    direccion,
    telefono,
    descripcion,
    dias_horas,
    latitud,
    longitud,
    categoria_id,
    tipo_id,
    servicios_ids,
  } = req.body;

  // Validaciones estrictas - campos obligatorios
  const errores = [];

  if (!nombre || nombre.trim() === "") {
    errores.push("El nombre es requerido");
  }

  if (!direccion || direccion.trim() === "") {
    errores.push("La dirección es requerida");
  }

  if (!telefono || telefono.trim() === "") {
    errores.push("El teléfono es requerido");
  }

  if (!latitud || isNaN(parseFloat(latitud.toString()))) {
    errores.push("La latitud es requerida y debe ser un número válido");
  }

  if (!longitud || isNaN(parseFloat(longitud.toString()))) {
    errores.push("La longitud es requerida y debe ser un número válido");
  }

  if (!categoria_id || isNaN(parseInt(categoria_id))) {
    errores.push("La categoría es requerida");
  }

  if (!tipo_id || isNaN(parseInt(tipo_id))) {
    errores.push("El tipo es requerido");
  }

  if (
    !servicios_ids ||
    !Array.isArray(servicios_ids) ||
    servicios_ids.length === 0
  ) {
    errores.push("Debe seleccionar al menos un servicio");
  }

  if (errores.length > 0) {
    return res.status(400).json({
      message: "Errores de validación:",
      errores: errores,
    });
  }

  const nuevoCentro = await createCentroSalud({
    nombre: nombre.trim(),
    direccion: direccion.trim(),
    telefono: telefono.trim(),
    descripcion: descripcion ? descripcion.trim() : null,
    dias_horas: dias_horas ? dias_horas.trim() : null,
    latitud: latitud.toString(), // Mantener como string para preservar precisión
    longitud: longitud.toString(), // Mantener como string para preservar precisión
    categoria_id: parseInt(categoria_id),
    tipo_id: parseInt(tipo_id),
    servicios_ids: servicios_ids.map((id) => parseInt(id)),
  });

  // Después de crear el centro, asociar los servicios explícitamente
  if (
    servicios_ids &&
    Array.isArray(servicios_ids) &&
    servicios_ids.length > 0
  ) {
    try {
      for (const servicioId of servicios_ids) {
        await insertCentroServicio(nuevoCentro, parseInt(servicioId));
      }
    } catch (servicioError) {
      console.warn(
        "⚠️ Error asociando servicios, pero centro creado exitosamente:",
        servicioError.message
      );
    }
  }

  res.status(201).json({
    message: "Centro de salud creado exitosamente",
    centro: nuevoCentro,
  });
}
