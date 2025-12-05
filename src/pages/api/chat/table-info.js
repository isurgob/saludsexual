import { query } from '../../../config/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Método no permitido' 
    });
  }

  const { table = 'web_messages' } = req.query;

  try {
    // Consultar las columnas de la tabla
    const columnsQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = $1 
      ORDER BY ordinal_position
    `;
    
    const result = await query(columnsQuery, [table]);
    
    res.status(200).json({
      success: true,
      table: table,
      columns: result.rows
    });

  } catch (error) {
    console.error('Error obteniendo columnas:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error obteniendo información de columnas: ' + error.message
    });
  }
}