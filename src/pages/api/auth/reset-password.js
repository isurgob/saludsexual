import crypto from 'crypto';
import { query } from '@/config/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { token, newPassword, hashOnBackend } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ 
      message: 'Token y nueva contraseña son requeridos' 
    });
  }

  // Validar longitud mínima de contraseña (igual que en tu función)
  if (newPassword.length < 6) {
    return res.status(400).json({ 
      message: 'La contraseña debe tener al menos 6 caracteres' 
    });
  }

  try {
    // Buscar el usuario con el token válido
    const userResult = await query(
      `SELECT id, correo, reset_token_expires 
       FROM usuarios 
       WHERE reset_token = $1 AND estado = 1`,
      [token]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ 
        message: 'Token de recuperación no válido' 
      });
    }

    const user = userResult.rows[0];

    // Verificar si el token no ha expirado
    const now = new Date();
    if (now > user.reset_token_expires) {
      // Limpiar token expirado
      await query(
        'UPDATE usuarios SET reset_token = NULL, reset_token_expires = NULL WHERE id = $1',
        [user.id]
      );
      
      return res.status(400).json({ 
        message: 'El token de recuperación ha expirado' 
      });
    }

    // Generar hash MD5 con el mismo método que tu función crear_usuario_moderador
    // Solo hashear si viene desde el frontend (hashOnBackend = true)
    let passwordHash;
    
    if (hashOnBackend) {
      // Hashear en el backend (para reset-password que necesita el email del token)
      passwordHash = crypto
        .createHash('md5')
        .update(newPassword + user.correo.toLowerCase() + 'isur_salt_2024')
        .digest('hex');
    } else {
      // La contraseña ya viene hasheada desde el frontend
      passwordHash = newPassword;
    }
    
    // Actualizar la contraseña y limpiar el token
    await query(
      `UPDATE usuarios 
       SET contraseña = $1, 
           reset_token = NULL, 
           reset_token_expires = NULL,
           fecha_actualizacion = NOW()
       WHERE id = $2`,
      [passwordHash, user.id]
    );
    
    res.status(200).json({ 
      message: 'Contraseña actualizada exitosamente' 
    });

  } catch (error) {
    console.error('Error actualizando contraseña:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor' 
    });
  }
}