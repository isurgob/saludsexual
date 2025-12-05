// ====================================
// API PARA INICIALIZAR TABLAS DEL CHATBOT
// Archivo: /api/analytics/init-chatbot-tables.js
// ====================================

import { query } from '../../../config/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST method allowed' });
  }

  try {

    // 1. Tabla para conversaciones del chat web
    const createWebConversationsTable = `
      CREATE TABLE IF NOT EXISTS web_conversations (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) UNIQUE NOT NULL,
        thread_id VARCHAR(255),
        user_ip VARCHAR(45),
        user_agent TEXT,
        device_type VARCHAR(50),
        browser VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        total_messages INTEGER DEFAULT 0,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 2. Tabla para mensajes del chat web
    const createWebMessagesTable = `
      CREATE TABLE IF NOT EXISTS web_messages (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER REFERENCES web_conversations(id) ON DELETE CASCADE,
        session_id VARCHAR(255) NOT NULL,
        thread_id VARCHAR(255),
        message_text TEXT NOT NULL,
        ai_response TEXT,
        direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
        category VARCHAR(50) DEFAULT 'general',
        confidence_score DECIMAL(3,2),
        response_time_ms INTEGER,
        tokens_used INTEGER,
        functions_called TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB
      );
    `;

    // 3. Tabla para conversaciones de WhatsApp (actualizada)
    const createWhatsAppConversationsTable = `
      CREATE TABLE IF NOT EXISTS whatsapp_conversations (
        id SERIAL PRIMARY KEY,
        phone_number VARCHAR(20) UNIQUE NOT NULL,
        user_name VARCHAR(255),
        thread_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        total_messages INTEGER DEFAULT 0,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 4. Tabla para mensajes de WhatsApp (actualizada)
    const createWhatsAppMessagesTable = `
      CREATE TABLE IF NOT EXISTS whatsapp_messages (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
        phone_number VARCHAR(20) NOT NULL,
        message_id VARCHAR(255),
        thread_id VARCHAR(255),
        message_text TEXT NOT NULL,
        ai_response TEXT,
        direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
        category VARCHAR(50) DEFAULT 'general',
        confidence_score DECIMAL(3,2),
        status VARCHAR(20) DEFAULT 'pending',
        response_time_ms INTEGER,
        tokens_used INTEGER,
        functions_called TEXT[],
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB
      );
    `;

    // 5. Tabla para categorización automática
    const createCategoriesTable = `
      CREATE TABLE IF NOT EXISTS message_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        keywords TEXT[],
        patterns TEXT[],
        priority INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 6. Índices para optimizar consultas
    const createIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_web_conversations_session ON web_conversations(session_id);',
      'CREATE INDEX IF NOT EXISTS idx_web_conversations_created ON web_conversations(created_at);',
      'CREATE INDEX IF NOT EXISTS idx_web_messages_conversation ON web_messages(conversation_id);',
      'CREATE INDEX IF NOT EXISTS idx_web_messages_created ON web_messages(created_at);',
      'CREATE INDEX IF NOT EXISTS idx_web_messages_category ON web_messages(category);',
      'CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_phone ON whatsapp_conversations(phone_number);',
      'CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_created ON whatsapp_conversations(created_at);',
      'CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation ON whatsapp_messages(conversation_id);',
      'CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON whatsapp_messages(timestamp);',
      'CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_category ON whatsapp_messages(category);'
    ];

    // Ejecutar creación de tablas
    await query(createWebConversationsTable);
    
    await query(createWebMessagesTable);
    
    await query(createWhatsAppConversationsTable);
    
    await query(createWhatsAppMessagesTable);
    
    await query(createCategoriesTable);

    // Crear índices
    for (const indexQuery of createIndexes) {
      await query(indexQuery);
    }

    // Insertar categorías por defecto
    const defaultCategories = [
      {
        name: 'general',
        description: 'Consultas generales sobre servicios de salud',
        keywords: ['info', 'información', 'servicio', 'horario', 'ubicación', 'teléfono'],
        patterns: ['.*\\b(info|información|servicio|horario)\\b.*'],
        priority: 1
      },
      {
        name: 'emergency',
        description: 'Situaciones de emergencia médica',
        keywords: ['emergencia', 'urgente', 'dolor', 'accidente', 'grave', 'ambulancia'],
        patterns: ['.*\\b(emergencia|urgente|dolor|grave)\\b.*'],
        priority: 3
      },
      {
        name: 'appointments',
        description: 'Solicitudes de citas médicas',
        keywords: ['cita', 'turno', 'consulta', 'médico', 'doctor', 'agendar'],
        patterns: ['.*\\b(cita|turno|consulta|médico|agendar)\\b.*'],
        priority: 2
      },
      {
        name: 'prevention',
        description: 'Información sobre prevención y salud',
        keywords: ['prevención', 'vacuna', 'preservativo', 'testeo', 'VIH', 'its'],
        patterns: ['.*\\b(prevención|vacuna|preservativo|testeo|vih)\\b.*'],
        priority: 2
      },
      {
        name: 'navigation',
        description: 'Ayuda con navegación del sitio o mapa',
        keywords: ['mapa', 'navegación', 'buscar', 'encontrar', 'ubicar'],
        patterns: ['.*\\b(mapa|navegación|buscar|encontrar)\\b.*'],
        priority: 1
      }
    ];

    for (const category of defaultCategories) {
      await query(`
        INSERT INTO message_categories (name, description, keywords, patterns, priority)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (name) DO UPDATE SET
          description = EXCLUDED.description,
          keywords = EXCLUDED.keywords,
          patterns = EXCLUDED.patterns,
          priority = EXCLUDED.priority
      `, [
        category.name,
        category.description,
        category.keywords,
        category.patterns,
        category.priority
      ]);
    }

    // Verificar que las tablas se crearon correctamente
    const tablesCheck = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('web_conversations', 'web_messages', 'whatsapp_conversations', 'whatsapp_messages', 'message_categories')
      ORDER BY table_name;
    `);


    res.status(200).json({
      success: true,
      message: 'Tablas del chatbot creadas exitosamente',
      tables: tablesCheck.rows.map(r => r.table_name),
      categories: defaultCategories.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error creando tablas del chatbot:', error);
    res.status(500).json({
      success: false,
      error: 'Error creando tablas del chatbot',
      details: error.message
    });
  }
}