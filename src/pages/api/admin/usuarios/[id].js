import pool from '../../../../config/db';
import { withAuth } from '../../../../lib/authMiddleware';

async function handler(req, res) {
  const { id } = req.query;
  
  // Validar que el ID sea un número
  const usuarioId = parseInt(id);
  if (isNaN(usuarioId)) {
    return res.status(400).json({
      success: false,
      message: 'ID de usuario inválido',
      error_code: 'INVALID_USER_ID'
    });
  }

  // Solo permitir métodos PUT y DELETE
  if (!['PUT', 'DELETE'].includes(req.method)) {
    return res.status(405).json({
      success: false,
      message: 'Método no permitido',
      error_code: 'METHOD_NOT_ALLOWED'
    });
  }

  try {
    switch (req.method) {
      case 'PUT':
        return await cambiarEstadoUsuario(req, res, usuarioId);
      case 'DELETE':
        return await eliminarUsuario(req, res, usuarioId);
      default:
        return res.status(405).json({
          success: false,
          message: 'Método no permitido',
          error_code: 'METHOD_NOT_ALLOWED'
        });
    }
  } catch (error) {
    console.error('❌ Error en endpoint usuarios/[id]:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error_code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// PUT - Cambiar estado de usuario
async function cambiarEstadoUsuario(req, res, usuarioId) {
  try {
    const { estado, admin_id } = req.body;


    // Validaciones básicas
    if (!estado || !admin_id) {
      return res.status(400).json({
        success: false,
        message: 'Estado y admin_id son obligatorios',
        error_code: 'REQUIRED_FIELDS'
      });
    }

    // Validar que el estado sea un número
    const nuevoEstado = parseInt(estado);
    const adminId = parseInt(admin_id);
    
    if (isNaN(nuevoEstado) || isNaN(adminId)) {
      return res.status(400).json({
        success: false,
        message: 'Estado y admin_id deben ser números válidos',
        error_code: 'INVALID_PARAMETERS'
      });
    }

    const client = await pool.connect();
    
    try {
      // Llamar a la función PostgreSQL
      const result = await client.query(
        'SELECT cambiar_estado_usuario($1, $2, $3)',
        [usuarioId, nuevoEstado, adminId]
      );
      
      const response = result.rows[0].cambiar_estado_usuario;
      
      if (response.success) {
        return res.status(200).json(response);
      } else {
        // Determinar el código de estado basado en el error
        let statusCode = 400;
        if (response.error_code === 'UNAUTHORIZED') {
          statusCode = 403; // Forbidden
        } else if (response.error_code === 'USER_NOT_FOUND') {
          statusCode = 404; // Not Found
        } else if (response.error_code === 'INTERNAL_ERROR') {
          statusCode = 500;
        }
        
        return res.status(statusCode).json(response);
      }
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Error cambiando estado usuario:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al cambiar estado del usuario',
      error_code: 'DATABASE_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// DELETE - Eliminar usuario
async function eliminarUsuario(req, res, usuarioId) {
  try {
    const { admin_id } = req.body;
    // Validaciones básicas
    if (!admin_id) {
      return res.status(400).json({
        success: false,
        message: 'admin_id es obligatorio',
        error_code: 'REQUIRED_FIELDS'
      });
    }

    // Validar que el admin_id sea un número
    const adminId = parseInt(admin_id);
    
    if (isNaN(adminId)) {
      return res.status(400).json({
        success: false,
        message: 'admin_id debe ser un número válido',
        error_code: 'INVALID_PARAMETERS'
      });
    }

    const client = await pool.connect();
    
    try {
      // Llamar a la función PostgreSQL
      const result = await client.query(
        'SELECT eliminar_usuario($1, $2)',
        [usuarioId, adminId]
      );
      
      const response = result.rows[0].eliminar_usuario;
      
      if (response.success) {
        return res.status(200).json(response);
      } else {
        // Determinar el código de estado basado en el error
        let statusCode = 400;
        if (response.error_code === 'UNAUTHORIZED') {
          statusCode = 403; // Forbidden
        } else if (response.error_code === 'USER_NOT_FOUND') {
          statusCode = 404; // Not Found
        } else if (response.error_code === 'SELF_DELETION' || response.error_code === 'ADMIN_DELETION') {
          statusCode = 403; // Forbidden
        } else if (response.error_code === 'INTERNAL_ERROR') {
          statusCode = 500;
        }
        
        return res.status(statusCode).json(response);
      }
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Error eliminando usuario:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario',
      error_code: 'DATABASE_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Exportar el handler protegido con autenticación (solo admin)
export default withAuth(handler, true);