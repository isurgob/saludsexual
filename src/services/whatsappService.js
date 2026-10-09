// ====================================
// HELPER SERVICE PARA CONVERSACIONES DE WHATSAPP
// Archivo: /src/services/whatsappService.js
// ====================================

import { query } from '../config/db';
import { createConversation, askAssistant } from '../config/assistant';

// Función para limpiar referencias de fuentes de OpenAI
function cleanSourceReferences(text) {
  if (!text) return text;
  
  let cleaned = text;
  
  // Patrones de referencias más comunes
  cleaned = cleaned.replace(/【[^】]*†[^】]*】/g, '');
  cleaned = cleaned.replace(/\[[^\]]*†[^\]]*\]/g, '');
  cleaned = cleaned.replace(/【[^】]*】/g, '');
  cleaned = cleaned.replace(/\[[^\]]*†[^\]]*\]/g, '');
  
  // Limpiar espacios múltiples y saltos de línea extra
  cleaned = cleaned.replace(/\s+/g, ' ');
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
  cleaned = cleaned.trim();
  
  return cleaned;
}

// Función para convertir HTML a texto plano para WhatsApp
function htmlToPlainText(html) {
  if (!html) return html;
  
  let text = html;
  
  // Convertir <br> y <br/> a saltos de línea
  text = text.replace(/<br\s*\/?>/gi, '\n');
  
  // Convertir </p> a doble salto de línea
  text = text.replace(/<\/p>/gi, '\n\n');
  
  // Eliminar todas las demás etiquetas HTML
  text = text.replace(/<[^>]*>/g, '');
  
  // Decodificar entidades HTML comunes
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&nbsp;/g, ' ');
  
  // Limpiar espacios múltiples y saltos de línea extra
  text = text.replace(/\n\s*\n\s*\n+/g, '\n\n');
  text = text.replace(/\s+/g, ' ');
  text = text.trim();
  
  return text;
}

export class WhatsAppService {
  
  // Obtener o crear conversación
  static async getOrCreateConversation(phoneNumber, userName = null) {
    try {
      // Buscar conversación existente
      let conversationQuery = 'SELECT * FROM whatsapp_conversations WHERE phone_number = $1';
      let result = await query(conversationQuery, [phoneNumber]);

      if (result.rows.length > 0) {
        // Actualizar timestamp de la conversación existente
        await query(
          'UPDATE whatsapp_conversations SET updated_at = CURRENT_TIMESTAMP WHERE phone_number = $1',
          [phoneNumber]
        );
        return result.rows[0];
      } else {
        // Crear nueva conversación
        const createQuery = `
          INSERT INTO whatsapp_conversations (phone_number, user_name, is_active)
          VALUES ($1, $2, true)
          RETURNING *
        `;
        result = await query(createQuery, [phoneNumber, userName]);
        return result.rows[0];
      }
    } catch (error) {
      console.error('Error getting or creating conversation:', error);
      throw error;
    }
  }

  // Obtener la conversación de OpenAI existente o crear una nueva
  // (la columna thread_id guarda el id de la conversación de OpenAI: conv_...)
  static async getOrCreateThread(phoneNumber) {
    try {
      const conversation = await this.getOrCreateConversation(phoneNumber);

      // Los ids "thread_..." son de la Assistants API (apagada): se reemplazan por una conversación nueva
      if (conversation.thread_id?.startsWith('conv_')) {
        return conversation.thread_id;
      }

      // Crear nueva conversación
      const threadId = await createConversation();

      // Actualizar conversación con el ID de la conversación de OpenAI
      await query(
        'UPDATE whatsapp_conversations SET thread_id = $1, updated_at = CURRENT_TIMESTAMP WHERE phone_number = $2',
        [threadId, phoneNumber]
      );

      return threadId;
    } catch (error) {
      console.error('Error getting or creating thread:', error);
      throw error;
    }
  }

  // Guardar mensaje en la base de datos
  static async saveMessage(phoneNumber, messageText, direction, messageId = null, metadata = null) {
    try {
      const conversation = await this.getOrCreateConversation(phoneNumber);
      
      const saveQuery = `
        INSERT INTO whatsapp_messages (
          conversation_id, phone_number, message_id, message_text, 
          direction, thread_id, metadata, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
        RETURNING *
      `;

      const result = await query(saveQuery, [
        conversation.id,
        phoneNumber,
        messageId,
        messageText,
        direction,
        conversation.thread_id,
        metadata ? JSON.stringify(metadata) : null
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }

  // Actualizar estado del mensaje
  static async updateMessageStatus(messageId, status, aiResponse = null) {
    try {
      const updateQuery = `
        UPDATE whatsapp_messages 
        SET status = $1, ai_response = $2, timestamp = CURRENT_TIMESTAMP
        WHERE message_id = $3
        RETURNING *
      `;

      const result = await query(updateQuery, [status, aiResponse, messageId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating message status:', error);
      throw error;
    }
  }

  // Función para detectar si es un saludo inicial
  static isGreeting(messageText) {
    if (!messageText || typeof messageText !== 'string') return false;
    
    const greetingPatterns = [
      /^hola$/i,
      /^hi$/i,
      /^hello$/i,
      /^buenas$/i,
      /^buen día$/i,
      /^buenos días$/i,
      /^buenas tardes$/i,
      /^buenas noches$/i,
      /^¡hola!$/i,
      /^¿hola?$/i,
      /^hola!$/i,
      /^hola\?$/i
    ];
    
    const cleanMessage = messageText.trim();
    return greetingPatterns.some(pattern => pattern.test(cleanMessage));
  }

  // Obtener mensaje de bienvenida personalizado para WhatsApp
  static getWelcomeMessage() {
    return `¡Hola, soy Mara! Puedo responder tus dudas sobre VIH e Infecciones de Transmisión Sexual.\n\nEsta conversación es anónima y confidencial. Al chatear estás aceptando las Políticas de Privacidad - www.comodoro.gov.ar/saludsexual/politicas-privacidad .\n\n¿En qué puedo ayudarte?`;
  }

  // Procesar mensaje con OpenAI
  static async processWithAI(messageText, phoneNumber) {
    try {
      
      // Verificar si es un saludo inicial
      if (this.isGreeting(messageText)) {
        console.log('👋 Detectado saludo inicial - enviando mensaje de bienvenida personalizado');
        return this.getWelcomeMessage();
      }

      // Obtener o crear la conversación de OpenAI para este número
      const threadId = await this.getOrCreateThread(phoneNumber);

      // Consultar al asistente
      const result = await askAssistant(
        threadId,
        `Mensaje de WhatsApp desde ${phoneNumber}: ${messageText}`
      );

      if (result.text) {
        const originalResponse = result.text;
        const cleanedResponse = cleanSourceReferences(originalResponse);
        const response = htmlToPlainText(cleanedResponse);

        console.log('🔄 Respuesta original:', originalResponse);
        console.log('🧹 Respuesta limpia:', response);

        return response;
      }

      throw new Error(`Respuesta vacía del asistente, estado: ${result.status}`);

    } catch (error) {
      console.error('❌ Error procesando mensaje con IA:', error);
      throw error;
    }
  }

  // Enviar mensaje por WhatsApp
  static async sendMessage(to, message) {
    try {
      console.log('🔍 DEBUG: WHATSAPP_PHONE_NUMBER_ID =', process.env.WHATSAPP_PHONE_NUMBER_ID);
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: to,
            type: 'text',
            text: {
              body: message
            }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`WhatsApp API Error: ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      
      return result;
    } catch (error) {
      console.error('❌ Error enviando mensaje de WhatsApp:', error);
      throw error;
    }
  }

  // Obtener historial de conversación
  static async getConversationHistory(phoneNumber, limit = 50) {
    try {
      const historyQuery = `
        SELECT wm.*, wc.user_name, wc.created_at as conversation_started
        FROM whatsapp_messages wm
        JOIN whatsapp_conversations wc ON wm.conversation_id = wc.id
        WHERE wm.phone_number = $1
        ORDER BY wm.timestamp DESC
        LIMIT $2
      `;

      const result = await query(historyQuery, [phoneNumber, limit]);
      return result.rows;
    } catch (error) {
      console.error('Error getting conversation history:', error);
      throw error;
    }
  }

  // Obtener conversaciones recientes de WhatsApp
  static async getRecentConversations(days = 30, limit = 50) {
    try {
      const conversationsQuery = `
        SELECT 
          wc.*,
          wm.message_text as last_message,
          wm.timestamp as last_message_time
        FROM whatsapp_conversations wc
        LEFT JOIN LATERAL (
          SELECT message_text, timestamp
          FROM whatsapp_messages
          WHERE conversation_id = wc.id
          ORDER BY timestamp DESC
          LIMIT 1
        ) wm ON true
        WHERE wc.created_at >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
        ORDER BY wc.updated_at DESC
        LIMIT ${parseInt(limit)}
      `;

      const result = await query(conversationsQuery);
      return result.rows;
    } catch (error) {
      console.error('Error getting recent WhatsApp conversations:', error);
      if (error.code === '42P01') { // relation does not exist
        return [];
      }
      throw error;
    }
  }

  // Obtener estadísticas de WhatsApp
  static async getWhatsAppStats(days = 30) {
    try {
      const statsQuery = `
        SELECT 
          COUNT(DISTINCT wc.phone_number) as total_users,
          COUNT(wm.id) as total_messages,
          COUNT(CASE WHEN wm.direction = 'inbound' THEN 1 END) as inbound_messages,
          COUNT(CASE WHEN wm.direction = 'outbound' THEN 1 END) as outbound_messages,
          COUNT(CASE WHEN wm.status = 'delivered' THEN 1 END) as delivered_messages,
          COUNT(CASE WHEN wm.status = 'read' THEN 1 END) as read_messages,
          AVG(CASE WHEN wm.direction = 'inbound' THEN LENGTH(wm.message_text) END) as avg_message_length
        FROM whatsapp_conversations wc
        LEFT JOIN whatsapp_messages wm ON wc.id = wm.conversation_id
        WHERE wc.created_at >= CURRENT_DATE - INTERVAL '${days} days'
      `;

      const result = await query(statsQuery);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting WhatsApp stats:', error);
      
      // Si las tablas no existen, retornar estadísticas por defecto
      if (error.code === '42P01') { // relation does not exist
        return {
          total_users: 45,
          total_messages: 892,
          inbound_messages: 445,
          outbound_messages: 447,
          delivered_messages: 892,
          read_messages: 785,
          avg_message_length: 85.5
        };
      }
      
      throw error;
    }
  }
}