/**
 * API para consultar conversaciones guardadas en la base de datos
 * Útil para verificar que el guardado funciona correctamente
 */

import { WebChatService } from '@/services/webChatService';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { limit = 20, sessionId } = req.query;

        let result;

        if (sessionId) {
            // Obtener historial de una conversación específica
            result = await WebChatService.getConversationHistory(sessionId, parseInt(limit));
            
            return res.status(200).json({
                success: true,
                data: result,
                type: 'conversation_history',
                sessionId: sessionId,
                total: result.length
            });
        } else {
            // Obtener conversaciones recientes
            result = await WebChatService.getRecentConversations(parseInt(limit));
            
            return res.status(200).json({
                success: true,
                data: result,
                type: 'recent_conversations',
                total: result.length
            });
        }

    } catch (error) {
        console.error('❌ Error consultando conversaciones:', error);
        
        return res.status(500).json({
            success: false,
            error: error.message,
            message: 'Error consultando conversaciones'
        });
    }
}