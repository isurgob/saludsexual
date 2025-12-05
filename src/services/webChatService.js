// ====================================
// SERVICIO PARA TRACKING DEL CHAT WEB
// Archivo: /src/services/webChatService.js
// ====================================

import { query } from '../config/db';
import { CategorizationService } from './categorizationService';

export class WebChatService {
  
  // Obtener o crear conversación web
  static async getOrCreateConversation(sessionId, metadata = {}) {
    try {
      // Buscar conversación existente
      let conversationQuery = 'SELECT * FROM web_conversations WHERE session_id = $1';
      let result = await query(conversationQuery, [sessionId]);

      if (result.rows.length > 0) {
        // Actualizar timestamp de la conversación existente
        await query(
          'UPDATE web_conversations SET updated_at = CURRENT_TIMESTAMP, last_activity = CURRENT_TIMESTAMP WHERE session_id = $1',
          [sessionId]
        );
        return result.rows[0];
      } else {
        // Crear nueva conversación
        const createQuery = `
          INSERT INTO web_conversations (
            session_id, thread_id, user_ip, user_agent, device_type, browser
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;
        result = await query(createQuery, [
          sessionId,
          metadata.threadId || null,
          metadata.userIp || null,
          metadata.userAgent || null,
          metadata.deviceType || null,
          metadata.browser || null
        ]);
        return result.rows[0];
      }
    } catch (error) {
      console.error('Error getting or creating web conversation:', error);
      throw error;
    }
  }

  // Guardar mensaje del chat web
  static async saveMessage(sessionId, messageText, direction, aiResponse = null, metadata = {}) {
    try {
      const startTime = Date.now();
      
      // Obtener o crear conversación
      const conversation = await this.getOrCreateConversation(sessionId, metadata);
      
      // Categorizar mensaje si es entrante
      let category = 'general';
      let confidenceScore = null;
      
      if (direction === 'inbound') {
        const categorization = await CategorizationService.categorizeMessage(messageText);
        category = categorization.category;
        confidenceScore = categorization.confidence;
      }

      const responseTime = Date.now() - startTime;

      // Guardar mensaje
      const saveQuery = `
        INSERT INTO web_messages (
          conversation_id, session_id, thread_id, message_text, ai_response,
          direction, category, confidence_score, response_time_ms, 
          tokens_used, functions_called, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;

      const result = await query(saveQuery, [
        conversation.id,
        sessionId,
        conversation.thread_id,
        messageText,
        aiResponse,
        direction,
        category,
        confidenceScore,
        responseTime,
        metadata.tokensUsed || null,
        metadata.functionsUsed || null,
        metadata.additional ? JSON.stringify(metadata.additional) : null
      ]);

      // Actualizar contador de mensajes en la conversación
      await query(
        'UPDATE web_conversations SET total_messages = total_messages + 1, last_activity = CURRENT_TIMESTAMP WHERE id = $1',
        [conversation.id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error saving web message:', error);
      throw error;
    }
  }

  // Obtener estadísticas del chat web
  static async getWebChatStats(days = 30) {
    try {
      const statsQuery = `
        SELECT 
          COUNT(DISTINCT wc.session_id) as total_conversations,
          COUNT(DISTINCT wc.session_id) as unique_users,
          COUNT(wm.id) as total_messages,
          COUNT(CASE WHEN wm.direction = 'inbound' THEN 1 END) as inbound_messages,
          COUNT(CASE WHEN wm.direction = 'outbound' THEN 1 END) as outbound_messages,
          AVG(CASE WHEN wm.direction = 'inbound' THEN LENGTH(wm.message_text) END) as avg_message_length,
          AVG(wm.response_time_ms) as avg_response_time,
          COUNT(CASE WHEN wc.device_type = 'mobile' THEN 1 END) as mobile_conversations,
          COUNT(CASE WHEN wc.device_type = 'desktop' THEN 1 END) as desktop_conversations,
          COUNT(CASE WHEN wc.device_type = 'tablet' THEN 1 END) as tablet_conversations
        FROM web_conversations wc
        LEFT JOIN web_messages wm ON wc.id = wm.conversation_id
        WHERE wc.created_at >= CURRENT_DATE - INTERVAL '${days} days'
      `;

      const result = await query(statsQuery);
      const stats = result.rows[0];

      // Obtener estadísticas por categoría
      const categoryStats = await CategorizationService.getCategoryStats(days, 'web');

      // Calcular métricas adicionales
      const totalConversations = parseInt(stats.total_conversations) || 0;
      const totalMessages = parseInt(stats.total_messages) || 0;
      const avgMessagesPerConversation = totalConversations > 0 
        ? Math.round((totalMessages / totalConversations) * 10) / 10 
        : 0;

      return {
        total_conversations: totalConversations,
        unique_users: parseInt(stats.unique_users) || 0,
        total_messages: totalMessages,
        inbound_messages: parseInt(stats.inbound_messages) || 0,
        outbound_messages: parseInt(stats.outbound_messages) || 0,
        avg_message_length: parseFloat(stats.avg_message_length) || 0,
        avg_response_time: parseFloat(stats.avg_response_time) || 0,
        avg_messages_per_conversation: avgMessagesPerConversation,
        device_distribution: {
          mobile: parseInt(stats.mobile_conversations) || 0,
          desktop: parseInt(stats.desktop_conversations) || 0,
          tablet: parseInt(stats.tablet_conversations) || 0
        },
        categories: categoryStats
      };

    } catch (error) {
      console.error('Error getting web chat stats:', error);
      throw error;
    }
  }

  // Obtener conversaciones recientes
  static async getRecentConversations(limit = 50) {
    try {
      const conversationsQuery = `
        SELECT 
          wc.*,
          wm.message_text as last_message,
          wm.created_at as last_message_time,
          wm.category as last_category
        FROM web_conversations wc
        LEFT JOIN LATERAL (
          SELECT message_text, created_at, category
          FROM web_messages
          WHERE conversation_id = wc.id
          ORDER BY created_at DESC
          LIMIT 1
        ) wm ON true
        ORDER BY wc.last_activity DESC
        LIMIT $1
      `;

      const result = await query(conversationsQuery, [limit]);
      return result.rows;
    } catch (error) {
      console.error('Error getting recent web conversations:', error);
      throw error;
    }
  }

  // Obtener historial de una conversación
  static async getConversationHistory(sessionId, limit = 100) {
    try {
      const historyQuery = `
        SELECT wm.*, wc.device_type, wc.browser
        FROM web_messages wm
        JOIN web_conversations wc ON wm.conversation_id = wc.id
        WHERE wm.session_id = $1
        ORDER BY wm.created_at ASC
        LIMIT $2
      `;

      const result = await query(historyQuery, [sessionId, limit]);
      return result.rows;
    } catch (error) {
      console.error('Error getting web conversation history:', error);
      throw error;
    }
  }

  // Análisis temporal
  static async getTemporalAnalysis(days = 30) {
    try {
      const hourlyQuery = `
        SELECT 
          EXTRACT(HOUR FROM created_at) as hour,
          COUNT(*) as message_count,
          COUNT(DISTINCT conversation_id) as conversation_count
        FROM web_messages 
        WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
        AND direction = 'inbound'
        GROUP BY EXTRACT(HOUR FROM created_at)
        ORDER BY hour
      `;

      const dailyQuery = `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as message_count,
          COUNT(DISTINCT conversation_id) as conversation_count
        FROM web_messages 
        WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
        AND direction = 'inbound'
        GROUP BY DATE(created_at)
        ORDER BY date
      `;

      const [hourlyResult, dailyResult] = await Promise.all([
        query(hourlyQuery),
        query(dailyQuery)
      ]);

      return {
        hourly_patterns: hourlyResult.rows,
        daily_trends: dailyResult.rows
      };
    } catch (error) {
      console.error('Error getting temporal analysis:', error);
      return { hourly_patterns: [], daily_trends: [] };
    }
  }
}