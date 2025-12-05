// ====================================
// SERVICIO PARA CATEGORIZACIÓN AUTOMÁTICA DE MENSAJES
// Archivo: /src/services/categorizationService.js
// ====================================

import { query } from '../config/db';

export class CategorizationService {
  
  // Categorizar mensaje automáticamente
  static async categorizeMessage(messageText) {
    try {
      if (!messageText || typeof messageText !== 'string') {
        return { category: 'general', confidence: 0.5 };
      }

      const text = messageText.toLowerCase().trim();
      
      // Obtener categorías de la base de datos
      const categoriesResult = await query(`
        SELECT name, keywords, patterns, priority 
        FROM message_categories 
        WHERE is_active = $1
        ORDER BY priority DESC
      `, [true]);

      const categories = categoriesResult.rows;
      let bestMatch = { category: 'general', confidence: 0.0, priority: 0 };

      for (const cat of categories) {
        let score = 0;
        let matches = 0;

        // Parsear keywords (pueden ser array de PostgreSQL o JSON string de SQL Server)
        let keywords = [];
        if (cat.keywords) {
          try {
            keywords = Array.isArray(cat.keywords) ? cat.keywords : JSON.parse(cat.keywords);
          } catch (e) {
            console.warn('Error parseando keywords:', cat.keywords);
            keywords = [];
          }
        }

        // Parsear patterns (pueden ser array de PostgreSQL o JSON string de SQL Server)
        let patterns = [];
        if (cat.patterns) {
          try {
            patterns = Array.isArray(cat.patterns) ? cat.patterns : JSON.parse(cat.patterns);
          } catch (e) {
            console.warn('Error parseando patterns:', cat.patterns);
            patterns = [];
          }
        }

        // Verificar keywords
        if (keywords.length > 0) {
          for (const keyword of keywords) {
            if (text.includes(keyword.toLowerCase())) {
              score += 1;
              matches++;
            }
          }
        }

        // Verificar patrones regex
        if (patterns.length > 0) {
          for (const pattern of patterns) {
            try {
              const regex = new RegExp(pattern, 'i');
              if (regex.test(text)) {
                score += 2; // Los patrones valen más que keywords
                matches++;
              }
            } catch (e) {
              // Ignorar patrones regex inválidos
              console.warn('Patrón regex inválido:', pattern);
            }
          }
        }

        // Calcular confianza
        const confidence = matches > 0 ? Math.min(score / 5, 1.0) : 0;

        // Actualizar mejor match considerando prioridad y confianza
        if (confidence > bestMatch.confidence || 
           (confidence === bestMatch.confidence && cat.priority > bestMatch.priority)) {
          bestMatch = {
            category: cat.name,
            confidence: confidence,
            priority: cat.priority
          };
        }
      }

      // Si no hay match, usar heurísticas simples
      if (bestMatch.confidence < 0.3) {
        bestMatch = this.fallbackCategorization(text);
      }

      return {
        category: bestMatch.category,
        confidence: Math.round(bestMatch.confidence * 100) / 100
      };

    } catch (error) {
      console.error('Error en categorización:', error);
      return { category: 'general', confidence: 0.5 };
    }
  }

  // Categorización de fallback con heurísticas simples
  static fallbackCategorization(text) {
    const emergencyWords = ['emergencia', 'urgente', 'dolor', 'grave', 'accidente', 'ambulancia', 'ayuda'];
    const appointmentWords = ['cita', 'turno', 'consulta', 'médico', 'doctor', 'agendar'];
    const preventionWords = ['preservativo', 'condón', 'testeo', 'vih', 'its', 'vacuna'];

    if (emergencyWords.some(word => text.includes(word))) {
      return { category: 'emergency', confidence: 0.7, priority: 3 };
    }
    
    if (appointmentWords.some(word => text.includes(word))) {
      return { category: 'appointments', confidence: 0.6, priority: 2 };
    }
    
    if (preventionWords.some(word => text.includes(word))) {
      return { category: 'prevention', confidence: 0.6, priority: 2 };
    }

    return { category: 'general', confidence: 0.5, priority: 1 };
  }

  // Obtener estadísticas por categoría
  static async getCategoryStats(days = 30, platform = 'all') {
    try {
      let webQuery = '';
      let whatsappQuery = '';

      if (platform === 'all' || platform === 'web') {
        webQuery = `
          SELECT 
            category,
            COUNT(*) as count,
            AVG(confidence_score) as avg_confidence
          FROM web_messages 
          WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
          AND direction = 'inbound'
          GROUP BY category
        `;
      }

      if (platform === 'all' || platform === 'whatsapp') {
        whatsappQuery = `
          SELECT 
            category,
            COUNT(*) as count,
            AVG(confidence_score) as avg_confidence
          FROM whatsapp_messages 
          WHERE timestamp >= CURRENT_DATE - INTERVAL '${days} days'
          AND direction = 'inbound'
          GROUP BY category
        `;
      }

      const results = [];
      
      if (webQuery) {
        const webResult = await query(webQuery);
        results.push(...webResult.rows.map(r => ({ ...r, platform: 'web' })));
      }

      if (whatsappQuery) {
        const whatsappResult = await query(whatsappQuery);
        results.push(...whatsappResult.rows.map(r => ({ ...r, platform: 'whatsapp' })));
      }

      // Consolidar resultados
      const consolidated = {};
      results.forEach(row => {
        if (!consolidated[row.category]) {
          consolidated[row.category] = {
            category: row.category,
            total_count: 0,
            web_count: 0,
            whatsapp_count: 0,
            avg_confidence: 0,
            confidence_samples: 0
          };
        }

        const count = parseInt(row.count);
        const confidence = parseFloat(row.avg_confidence) || 0;

        consolidated[row.category].total_count += count;
        consolidated[row.category][`${row.platform}_count`] += count;
        
        if (confidence > 0) {
          consolidated[row.category].avg_confidence += confidence * count;
          consolidated[row.category].confidence_samples += count;
        }
      });

      // Calcular promedios finales
      Object.values(consolidated).forEach(cat => {
        if (cat.confidence_samples > 0) {
          cat.avg_confidence = Math.round((cat.avg_confidence / cat.confidence_samples) * 100) / 100;
        }
        delete cat.confidence_samples;
      });

      return Object.values(consolidated);

    } catch (error) {
      console.error('Error obteniendo estadísticas de categorías:', error);
      return [];
    }
  }

  // Actualizar categorías desde análisis de IA
  static async updateCategoriesFromAI(messages) {
    try {
      return { updated: false, reason: 'Función en desarrollo' };
    } catch (error) {
      console.error('Error en análisis con IA:', error);
      return { updated: false, error: error.message };
    }
  }
}