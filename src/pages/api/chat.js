/**
 * API Handler SIMPLE - Solo consulta Storage del OpenAI Assistant
 * Sistema completamente nuevo sin funciones complejas
 */

import { simpleChat } from '@/utils/simpleChatSystem';


export default async function handler(req, res) {
    // Solo permitir POST
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            error: 'Método no permitido',
            allowed: ['POST']
        });
    }

    const startTime = Date.now();

    try {
        // Validar datos de entrada
        const { message, sessionId } = req.body;
        
        console.log('📥 [API DEBUG] Solicitud recibida:');
        console.log('📥 [API DEBUG] SessionId:', sessionId || 'NO_PRESENTE');
        console.log('📥 [API DEBUG] Mensaje:', message?.substring(0, 50) || 'VACIO');
        
        if (!message?.trim()) {
            return res.status(400).json({
                success: false,
                error: 'El mensaje no puede estar vacío',
                processing_time_ms: Date.now() - startTime
            });
        }

        if (!sessionId?.trim()) {
            return res.status(400).json({
                success: false,
                error: 'SessionId es requerido',
                processing_time_ms: Date.now() - startTime
            });
        }

        // Consultar directamente al Assistant
        console.log('🤖 [API DEBUG] Llamando a simpleChat con sessionId:', sessionId);
        console.log('🧠 [API DEBUG] Estado actual de threads globales:', Object.keys(global.chatThreads || {}));
        
        const result = await simpleChat(message, sessionId);
        
        const processingTime = Date.now() - startTime;
        
        if (result.success) {
            console.log('🚀 [API DEBUG] Respuesta exitosa - enviando al frontend:');
            console.log('🚀 [API DEBUG] SessionId:', sessionId);
            console.log('🚀 [API DEBUG] ThreadId:', result.threadId || 'NO_PRESENTE');
            console.log('🚀 [API DEBUG] Source:', result.source);

            return res.status(200).json({
                success: true,
                message: result.response,
                sessionId: sessionId,
                threadId: result.threadId,
                timestamp: new Date().toISOString(),
                processing_time_ms: processingTime,
                status: 'completed',
                source: result.source || 'openai_storage',
                originalQuestion: result.originalQuestion,
                improvedQuestion: result.improvedQuestion,
                wasImproved: result.wasImproved,
                isCourtesyWord: result.isCourtesyWord
            });
            
        } else {
            throw new Error(result.error || 'Error desconocido');
        }

    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error('❌ Error en chat simple:', {
            error: error.message,
            processing_time_ms: processingTime,
            timestamp: new Date().toISOString()
        });

        return res.status(500).json({
            success: false,
            error: error.message,
            message: 'Lo siento, hubo un error procesando tu consulta. Por favor intentá de nuevo.',
            timestamp: new Date().toISOString(),
            processing_time_ms: processingTime,
            status: 'error'
        });
    }
}