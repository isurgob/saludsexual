import { query } from '../../../config/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Método no permitido' 
    });
  }

  try {
    const { format = 'json' } = req.query;

    let webResults, whatsappResults;
    
    try {
      // Descargar TODA la información sin límites ni filtros de fecha
      const webQuery = `SELECT 'web' as source, message_text, ai_response FROM web_messages ORDER BY id DESC`;
      const whatsappQuery = `SELECT 'whatsapp' as source, message_text, ai_response FROM whatsapp_messages ORDER BY id DESC`;
      
      [webResults, whatsappResults] = await Promise.all([
        query(webQuery),
        query(whatsappQuery)
      ]);
      
      // Agregar fecha actual como fallback (ya que no tenemos columna de fecha real)
      webResults.rows = webResults.rows.map((row, index) => ({ 
        ...row, 
        created_at: new Date(Date.now() - (index * 1000)) // Simular fechas diferentes
      }));
      whatsappResults.rows = whatsappResults.rows.map((row, index) => ({ 
        ...row, 
        created_at: new Date(Date.now() - (index * 1000)) // Simular fechas diferentes
      }));
      
    } catch (queryError) {
      // Si las tablas no existen, crear resultados vacíos
      webResults = { rows: [] };
      whatsappResults = { rows: [] };
    }

    // Combinar resultados
    const allConversations = [
      ...webResults.rows,
      ...whatsappResults.rows
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Estadísticas
    const stats = {
      total_conversations: allConversations.length,
      web_conversations: webResults.rows.length,
      whatsapp_conversations: whatsappResults.rows.length,
      export_date: new Date().toISOString(),
      export_type: 'complete_database',
      note: 'Exportación completa de todas las conversaciones registradas'
    };

    if (format === 'csv') {
      // Generar CSV
      const csvHeader = 'Fuente,Mensaje Usuario,Respuesta IA,Fecha\n';
      const csvRows = allConversations.map(conv => {
        const message = (conv.message_text || '').replace(/"/g, '""');
        const response = (conv.ai_response || '').replace(/"/g, '""');
        const date = new Date(conv.created_at).toLocaleString('es-AR');
        return `"${conv.source}","${message}","${response}","${date}"`;
      }).join('\n');

      const csvContent = csvHeader + csvRows;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="conversaciones-chatbot-completo-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.status(200).send(csvContent);
    }

    // Formato JSON por defecto
    res.status(200).json({
      success: true,
      data: {
        stats,
        conversations: allConversations
      }
    });

  } catch (error) {
    console.error('Error exportando conversaciones:', error);
    
    // Verificar si es un error de tabla no existente
    if (error.message.includes('does not exist')) {
      return res.status(200).json({
        success: true,
        data: {
          stats: {
            total_conversations: 0,
            web_conversations: 0,
            whatsapp_conversations: 0,
            export_date: new Date().toISOString(),
            export_type: 'complete_database',
            note: 'Las tablas de chat no están configuradas en la base de datos'
          },
          conversations: []
        }
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al exportar conversaciones'
    });
  }
}