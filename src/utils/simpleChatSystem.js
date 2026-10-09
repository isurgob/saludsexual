/**
 * CHATBOT SIMPLE - OPENAI RESPONSES API
 *
 * Consulta la información cargada en el vector store del asistente.
 * Migrado desde la Assistants API (threads/runs), que OpenAI apagó el 26/08/2026.
 */

import { WebChatService } from '../services/webChatService.js';
import { createConversation, askAssistant } from '../config/assistant.js';

/**
 * Sistema de chat simple - solo consulta al asistente
 */
export async function simpleChat(userMessage, sessionId) {
  try {
    // 🔍 LOG INICIAL - Estado de conversaciones en memoria (sessionId → conversationId)
    console.log('🌐 [CONVERSACIONES] Estado actual:', {
      totalConversaciones: Object.keys(global.chatThreads || {}).length,
      sessionId: sessionId,
      conversationForSession: global.chatThreads?.[sessionId] || 'NO_EXISTE'
    });

    // PASO 1: Detectar palabras de cortesía (se informan al frontend y se guardan en BD)
    const cleanQuestion = userMessage.toLowerCase().trim().replace(/[¿?¡!.,]/g, '');
    const courtesyWords = [
      'gracias', 'muchas gracias', 'gracias por la info', 'gracias por la información',
      'ok', 'okey', 'perfecto', 'entendido', 'muy bien', 'excelente',
      'hola', 'buenos días', 'buenas tardes', 'buenas noches',
      'chau', 'adiós', 'hasta luego', 'nos vemos',
      'si', 'sí', 'no', 'dale', 'está bien', 'de acuerdo'
    ];

    // Detectar saludos personalizados como "Hola Mara", "Buenos días Ana", etc.
    const personalGreetingPatterns = [
      /^hola\s+\w+$/,           // "hola mara", "hola ana"
      /^buenos\s+días\s+\w+$/,  // "buenos días mara"
      /^buenas\s+tardes\s+\w+$/, // "buenas tardes ana"
      /^buenas\s+noches\s+\w+$/, // "buenas noches juan"
      /^hi\s+\w+$/,             // "hi mara"
      /^hello\s+\w+$/           // "hello ana"
    ];

    const isPersonalGreeting = personalGreetingPatterns.some(pattern =>
      pattern.test(cleanQuestion)
    );

    const isCourtesyWord = courtesyWords.some(word =>
      cleanQuestion === word.toLowerCase() ||
      cleanQuestion === word.toLowerCase() + '!' ||
      cleanQuestion === word.toLowerCase() + '.'
    ) || isPersonalGreeting;

    // PASO 2: Obtener la conversación de esta sesión o crear una nueva
    let conversationId = global.chatThreads?.[sessionId];
    const usedContext = !!conversationId;

    if (!conversationId) {
      console.log('🆕 [CONVERSACIÓN] Creando nueva conversación para sessionId:', sessionId);
      conversationId = await createConversation();

      // Guardar conversación en memoria (en producción usarías BD)
      if (!global.chatThreads) global.chatThreads = {};
      global.chatThreads[sessionId] = conversationId;

      console.log('✅ [CONVERSACIÓN] Nueva conversación creada:', conversationId);
    } else {
      console.log('♻️ [CONVERSACIÓN] Reutilizando conversación existente:', conversationId);
    }

    // PASO 3: Consultar al asistente
    const result = await askAssistant(conversationId, userMessage);

    if (!result.text) {
      console.log('❌ [CONVERSACIÓN] Respuesta vacía del asistente. Estado:', result.status);
      return {
        success: true,
        response: `<h6>⚠️ Sistema Temporalmente Ocupado</h6>
<p>El sistema está procesando muchas consultas. Por favor:</p>
<ul>
<li><strong>🔄 Intenta de nuevo</strong> en unos momentos</li>
<li><strong>🗺️ Consulta el mapa:</strong> <a href="https://chatbot.isurgob.net/mapa">Ver centros de salud</a></li>
</ul>
<br>¿Puedo ayudarte con algo más?`,
        sessionId: sessionId,
        threadId: conversationId,
        source: 'fallback_busy'
      };
    }

    let responseText = result.text;

    // 🔧 CORRECCIÓN: Cambiar "asistente" por "chatbot" en las presentaciones
    responseText = responseText.replace(
      /Soy el asistente de salud pública/gi,
      'Soy el chatbot de salud pública'
    );
    responseText = responseText.replace(
      /asistente de salud/gi,
      'chatbot de salud'
    );
    responseText = responseText.replace(
      /como asistente/gi,
      'como chatbot'
    );
    responseText = responseText.replace(
      /tu asistente/gi,
      'tu chatbot'
    );

    // 📊 LOG FINAL - Resumen de la conversación
    console.log('📊 [RESUMEN CONVERSACIÓN]');
    console.log('   SessionId:', sessionId);
    console.log('   ConversationId:', conversationId);
    console.log('   Pregunta:', userMessage);
    console.log('   Se usó contexto:', usedContext);
    console.log('   Tokens usados:', result.tokensUsed);
    console.log('   Respuesta (primeros 100 chars):', responseText.substring(0, 100));

    // 💾 GUARDAR EN BASE DE DATOS - Pregunta y respuesta en una sola fila
    try {
      const metadata = {
        threadId: conversationId,
        tokensUsed: result.tokensUsed,
        functionsUsed: null, // No hay funciones en este caso
        additional: {
          originalQuestion: userMessage,
          isCourtesyWord: isCourtesyWord,
          usedContext: usedContext,
          source: 'openai_storage'
        }
      };

      const savedMessage = await WebChatService.saveMessage(
        sessionId,
        userMessage, // Pregunta original del usuario
        'inbound', // Mensaje entrante
        responseText, // Respuesta del asistente
        metadata
      );

      console.log('✅ [DB] Conversación guardada. ID:', savedMessage.id, '- Categoría:', savedMessage.category);

    } catch (dbError) {
      console.error('❌ [DB] Error guardando en base de datos:', dbError.message);
      // No fallar el chat si hay error de BD, solo logear
    }

    return {
      success: true,
      response: responseText,
      sessionId: sessionId,
      threadId: conversationId,
      source: 'openai_storage',
      originalQuestion: userMessage,
      improvedQuestion: userMessage,
      wasImproved: false,
      isCourtesyWord: isCourtesyWord,
      usedContext: usedContext
    };

  } catch (error) {
    console.error('❌ Error en chat simple:', error);
    return {
      success: false,
      error: error.message,
      response: 'Lo siento, hubo un error procesando tu consulta. Intentá de nuevo.'
    };
  }
}
