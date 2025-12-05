/**
 * CHATBOT SIMPLE - SOLO OPENAI ASSISTANT STORAGE
 * 
 * Sistema completamente nuevo que consulta directamente
 * la información cargada en el storage del Assistant
 */

import OpenAI from 'openai';
import { WebChatService } from '../services/webChatService.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ID de tu Assistant (necesitarás reemplazar esto con tu ID real)
const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;

// Configuración para habilitar/deshabilitar reformulación de preguntas
// DESHABILITADO: Causa problemas al reformular mal las preguntas (ej: "Hola Mara" → "anticonceptivos")
const ENABLE_QUESTION_REFORMULATION = false;

/**
 * Reformula y mejora la pregunta del usuario para obtener mejores respuestas
 * AHORA CON CONTEXTO: Usa el historial de la conversación
 */
async function reformulateQuestion(originalQuestion, threadId = null) {
  try {
    console.log('🔄 [REFORMULACIÓN] Iniciando reformulación de pregunta');
    console.log('🔄 [REFORMULACIÓN] Pregunta original:', originalQuestion);
    console.log('🔄 [REFORMULACIÓN] ThreadId para contexto:', threadId);

    // OBTENER CONTEXTO DEL THREAD SI EXISTE
    let conversationContext = '';
    if (threadId) {
      try {
        console.log('📚 [REFORMULACIÓN] Obteniendo contexto de thread:', threadId);
        const messages = await openai.beta.threads.messages.list(threadId, {
          limit: 10, // Más mensajes para mejor contexto
          order: 'desc'
        });
        
        if (messages.data && messages.data.length > 0) {
          console.log('📚 [REFORMULACIÓN] Total mensajes obtenidos:', messages.data.length);
          
          // Construir contexto de los últimos mensajes de forma más inteligente
          const contextMessages = messages.data
            .reverse() // Poner en orden cronológico
            .slice(-8) // Últimos 8 mensajes (4 pares usuario-asistente)
            .map((msg, index) => {
              const role = msg.role === 'user' ? 'Usuario' : 'Asistente';
              const content = msg.content[0]?.text?.value || '';
              
              // Para el usuario, incluir mensaje completo si es corto
              // Para el asistente, incluir solo el título o primeras líneas
              let displayContent;
              if (msg.role === 'user') {
                displayContent = content.length <= 100 ? content : content.substring(0, 100) + '...';
              } else {
                // Extraer título del HTML si existe
                const titleMatch = content.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/);
                if (titleMatch) {
                  displayContent = titleMatch[1];
                } else {
                  displayContent = content.substring(0, 80) + '...';
                }
              }
              
              return `${role}: ${displayContent}`;
            });
          
          conversationContext = contextMessages.join('\n');
          
          console.log('📚 [REFORMULACIÓN] Contexto construido:');
          console.log(conversationContext);
          
          // Buscar específicamente palabras clave relevantes
          const contextLower = conversationContext.toLowerCase();
          const keywordMatches = [];
          
          const healthKeywords = ['hepatitis', 'vih', 'its', 'sífilis', 'gonorrea', 'preservativo', 'anticonceptivo', 'testeo', 'vacuna'];
          for (const keyword of healthKeywords) {
            if (contextLower.includes(keyword)) {
              keywordMatches.push(keyword);
            }
          }
          
          if (keywordMatches.length > 0) {
            console.log('🔍 [REFORMULACIÓN] Palabras clave encontradas en contexto:', keywordMatches);
          }
          
        } else {
          console.log('📚 [REFORMULACIÓN] No hay mensajes previos en el thread');
        }
      } catch (contextError) {
        console.error('❌ [REFORMULACIÓN] Error obteniendo contexto:', contextError.message);
        conversationContext = '';
      }
    } else {
      console.log('📚 [REFORMULACIÓN] No hay threadId, reformulación sin contexto');
    }

    // Detectar si es una palabra clave simple que necesita explicación básica
    const singleKeywords = [
      // ITS y VIH
      'vih', 'its', 'sífilis', 'sifilis', 'gonorrea', 'clamidia', 'herpes', 'hepatitis', 'hpv', 'papiloma',
      // Métodos de prevención
      'preservativo', 'preservativos', 'condón', 'condones', 'forro', 'forros', 'profiláctico',
      'anticonceptivo', 'anticonceptivos', 'pastilla', 'pastillas', 'inyección', 'diu',
      'prep', 'pep', 'profilaxis',
      // Testeos y diagnóstico
      'testeo', 'testeos', 'test', 'prueba', 'pruebas', 'análisis', 'examen',
      // Vacunas
      'vacuna', 'vacunas', 'vacunación', 'vacunacion', 'inmunización',
      // Salud reproductiva
      'embarazo', 'lactancia', 'menstruación', 'ovulación',
      // Apoyo y soporte
      'apoyo', 'apoyo vih', 'soporte', 'ayuda vih',
      // Otros términos comunes
      'dolor', 'síntomas', 'tratamiento', 'medicamento', 'consulta'
    ];
    
    const cleanQuestion = originalQuestion.toLowerCase().trim().replace(/[¿?¡!.,]/g, '');
    
    const isSimpleKeyword = singleKeywords.some(keyword => {
      return cleanQuestion === keyword || 
             cleanQuestion === keyword + 's' || 
             (keyword.endsWith('s') && cleanQuestion === keyword.slice(0, -1)) ||
             cleanQuestion.split(' ').length <= 2 && cleanQuestion.includes(keyword);
    });



    // Detectar preguntas muy vagas que necesitan guía
    const vaguePatterns = [
      'tengo dudas', 'quiero saber', 'necesito información', 'ayuda', 'no se',
      'que hago', 'qué hago', 'estoy preocupado', 'estoy preocupada', 'tengo miedo'
    ];
    
    const isVagueQuestion = vaguePatterns.some(pattern => 
      cleanQuestion.includes(pattern.toLowerCase())
    ) && cleanQuestion.split(' ').length <= 4;

    let reformulationPrompt;

    if (isSimpleKeyword) {
      // Para palabras clave simples: explicar QUÉ ES primero
      reformulationPrompt = `Eres un experto en salud sexual integral. El usuario escribió una palabra clave simple y necesita una explicación completa y educativa.

${conversationContext ? `CONTEXTO DE LA CONVERSACIÓN:
${conversationContext}

Considera este contexto para reformular apropiadamente.` : 'Esta es la primera pregunta de la conversación.'}

REFORMULA la pregunta para obtener una respuesta INTEGRAL que incluya:

1. QUÉ ES (definición clara y simple)
2. PARA QUIÉN ES (todas las personas, sin distinción de género)  
3. INFORMACIÓN BÁSICA (cómo funciona, para qué sirve)
4. DÓNDE CONSEGUIR o cómo acceder

EJEMPLOS:
Usuario: "preservativo" o "forro"
Reformulación: "¿Qué es un preservativo o forro?"

Usuario: "VIH" 
Reformulación: "¿Qué es el VIH?"

Usuario: "ITS"
Reformulación: "¿Qué son las ITS?"

Usuario: "anticonceptivos"
Reformulación: "¿Qué son los métodos anticonceptivos?"

Usuario: "testeo"
Reformulación: "¿Qué es un testeo de ITS?"

REGLAS:
- Pregunta SOLO por la definición básica: "¿Qué es X?"
- UNA sola oración simple
- El asistente se encargará de ofrecer opciones adicionales
- Enfoque: QUÉ ES, no cómo usar o dónde conseguir

Palabra clave: "${originalQuestion}"

Pregunta reformulada:`;
    } else if (isVagueQuestion) {
      // Para preguntas vagas: ofrecer guía y opciones
      reformulationPrompt = `Eres un experto en salud sexual integral. El usuario hizo una pregunta muy general y necesita orientación sobre qué temas puede consultar.

${conversationContext ? `CONTEXTO DE LA CONVERSACIÓN:
${conversationContext}

Considera este contexto para reformular apropiadamente.` : 'Esta es la primera pregunta de la conversación.'}

REFORMULA para ofrecer una pregunta que abra las opciones disponibles de información:

EJEMPLO:
Usuario: "tengo dudas"
Reformulación: "¿Sobre qué tema de salud necesitás información?"

Usuario: "ayuda"
Reformulación: "¿Qué tema de salud te interesa consultar?"

REGLAS:
- Una sola pregunta simple
- El asistente ofrecerá las opciones disponibles
- Usa el lenguaje del sistema de salud de Comodoro

Pregunta vaga: "${originalQuestion}"

Pregunta reformulada:`;
    } else {
      // Para preguntas más elaboradas: mejorar especificidad CON CONTEXTO
      reformulationPrompt = `Eres un experto en reformular preguntas sobre salud sexual integral para obtener respuestas más precisas y útiles.

${conversationContext ? `CONTEXTO DE LA CONVERSACIÓN:
${conversationContext}

INSTRUCCIONES ESPECÍFICAS:
- Analiza el contexto cuidadosamente para entender el tema principal
- Si la pregunta actual es una continuación (como "que es la a", "y cómo se previene", "donde conseguir"), incluye la referencia específica del contexto
- Ejemplos:
  * Si se habló de "hepatitis" y pregunta "que es la a" → reformular como "¿Qué es la hepatitis A?"
  * Si se habló de "VIH" y pregunta "como se previene" → reformular como "¿Cómo se previene el VIH?"
  * Si se habló de "preservativos" y pregunta "donde conseguir" → reformular como "¿Dónde conseguir preservativos?"

IMPORTANTE: Prioriza las palabras clave de salud mencionadas recientemente en el contexto.` : 'Esta es la primera pregunta de la conversación.'}

Tu tarea es mejorar la pregunta manteniendo su intención original pero haciéndola más clara, específica y completa.

REGLAS IMPORTANTES:
1. Mantén la pregunta concisa y directa
2. Compatible con respuestas de máximo 80 palabras
3. Si es muy general, hacela más específica usando el CONTEXTO
4. Si ya está bien formulada, devuélvela igual
5. Una oración principal máximo
6. Enfoque en información factual de salud pública
7. USA EL CONTEXTO para identificar el tema específico

Pregunta original: "${originalQuestion}"

Pregunta reformulada:`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: reformulationPrompt
        }
      ],
      max_tokens: 250,
      temperature: 0.2
    });

    const reformulatedQuestion = response.choices[0].message.content.trim();
    
    // 🔄 TESTING LOG - Reformulación de pregunta
    const reformulationType = isSimpleKeyword ? 'palabra_clave_simple' : 
                             isVagueQuestion ? 'pregunta_vaga' : 'pregunta_elaborada';
    
    console.log('✅ [REFORMULACIÓN] Pregunta reformulada:', reformulatedQuestion);
    console.log('🏷️ [REFORMULACIÓN] Tipo:', reformulationType);
    console.log('🔄 [REFORMULACIÓN] Usó contexto:', !!conversationContext);
    
    return reformulatedQuestion;

  } catch (error) {
    console.error('❌ [REFORMULACIÓN] Error:', error.message);
    console.log('🔄 [REFORMULACIÓN] Usando pregunta original como fallback');
    return originalQuestion;
  }
}

/**
 * Sistema de chat simple - solo consulta al Assistant
 */
export async function simpleChat(userMessage, sessionId) {
  try {
    // 🔍 LOG INICIAL - Estado de threads globales
    console.log('🌐 [THREADS GLOBALES] Estado actual:', {
      totalThreads: Object.keys(global.chatThreads || {}).length,
      threadIds: Object.keys(global.chatThreads || {}),
      sessionId: sessionId,
      threadForSession: global.chatThreads?.[sessionId] || 'NO_EXISTE'
    });
    
    // PASO 1: Verificar si es una palabra de cortesía que NO necesita reformulación
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

    // PASO 2: Obtener threadId existente ANTES de reformular (para usar contexto)
    let existingThreadId = global.chatThreads?.[sessionId];
    console.log('🔍 [CONTEXTO] ThreadId existente para reformulación:', existingThreadId || 'NO_EXISTE');
    
    // PASO 3: Reformular la pregunta para obtener mejores respuestas (si está habilitado y NO es cortesía)
    let improvedQuestion = userMessage;
    
    if (ENABLE_QUESTION_REFORMULATION && !isCourtesyWord) {
      console.log('🔄 [CONTEXTO] Reformulando pregunta CON contexto del thread');
      improvedQuestion = await reformulateQuestion(userMessage, existingThreadId);
    }
    
    console.log('🔄 [THREAD DEBUG] SessionId:', sessionId);
    console.log('🔄 [THREAD DEBUG] Thread existente en memoria:', global.chatThreads?.[sessionId] || 'NO_EXISTE');
    
    // PASO 4: Crear thread si no existe para esta sesión
    let threadId = existingThreadId; // Usar el que ya obtuvimos antes
    
    if (!threadId) {
      console.log('🆕 [THREAD DEBUG] Creando nuevo thread para sessionId:', sessionId);
      const thread = await openai.beta.threads.create();
      threadId = thread.id;
      
      // Guardar thread en memoria (en producción usarías BD)
      if (!global.chatThreads) global.chatThreads = {};
      global.chatThreads[sessionId] = threadId;
      
      console.log('✅ [THREAD DEBUG] Nuevo thread creado:', threadId);
      console.log('📝 [THREAD DEBUG] Threads en memoria:', Object.keys(global.chatThreads || {}));
    } else {
      console.log('♻️ [THREAD DEBUG] Reutilizando thread existente:', threadId);
    }
    
    // Verificar si hay runs activos y cancelarlos
    try {
      const existingRuns = await openai.beta.threads.runs.list(threadId, {
        limit: 5
      });
      
      for (const run of existingRuns.data) {
        if (run.status === 'in_progress' || run.status === 'queued') {
          try {
            await openai.beta.threads.runs.cancel(threadId, run.id);
          } catch (cancelError) {
          }
        }
      }
      
      // Esperar un momento para que se cancele
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (listError) {
      console.error('❌ Error listando runs existentes:', listError.message);
    }
    
    // Agregar mensaje del usuario al thread (usando la pregunta mejorada)
    console.log('💬 [THREAD DEBUG] Agregando mensaje al thread:', threadId);
    console.log('💬 [THREAD DEBUG] Mensaje:', improvedQuestion);
    
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: improvedQuestion
    });
    
    console.log('📨 [THREAD DEBUG] Mensaje agregado exitosamente al thread');
    
    // Ejecutar el Assistant
    let run;
    try {
      run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: ASSISTANT_ID,
      });
    } catch (runError) {
      console.error('❌ Error creando el run del Assistant:', runError);
      return {
        success: false,
        error: runError.message || 'Error creando el run del Assistant',
        response: 'Lo siento, hubo un error procesando tu consulta. Intentá de nuevo.'
      };
    }

    // Si el run no tiene id, devolver error
    if (!run?.id) {
      return {
        success: false,
        error: 'No se pudo crear el run del Assistant (id indefinido)',
        response: 'Lo siento, hubo un error procesando tu consulta. Intentá de nuevo.'
      };
    }

    // Validar que tenemos threadId válido
    if (!threadId) {
      return {
        success: false,
        error: 'ThreadId inválido',
        response: 'Lo siento, hubo un error procesando tu consulta. Intentá de nuevo.'
      };
    }


    // Estrategia alternativa: usar list en lugar de retrieve
    const localThreadId = String(threadId);
    const localRunId = String(run.id);
    
    
    let runStatus;
    try {
      // Usar list en lugar de retrieve para evitar el bug
      const runs = await openai.beta.threads.runs.list(localThreadId, { limit: 1 });
      runStatus = runs.data.find(r => r.id === localRunId) || run;
    } catch (listError) {
      console.error('❌ Error listando runs:', listError);
      // Fallback: usar el run original
      runStatus = run;
    }
    
    let attempts = 0;
    const maxAttempts = 30; // 30 segundos máximo
    
    while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        // Usar list en lugar de retrieve para evitar el bug
        const runs = await openai.beta.threads.runs.list(localThreadId, { limit: 5 });
        const currentRun = runs.data.find(r => r.id === localRunId);
        if (currentRun) {
          runStatus = currentRun;
        }
      } catch (listError) {
        return {
          success: false,
          error: listError.message || 'Error en polling del run',
          response: 'Lo siento, hubo un error procesando tu consulta. Intentá de nuevo.'
        };
      }
      
      attempts++;
      
      if (attempts >= maxAttempts) {
        return {
          success: false,
          error: 'Timeout esperando respuesta del Assistant',
          response: 'Lo siento, la consulta tardó demasiado. Intentá de nuevo.'
        };
      }
      
      if (attempts % 5 === 0) {
      }
    }
    
    if (runStatus.status === 'completed') {
      // Obtener la respuesta
      console.log('✅ [THREAD DEBUG] Run completado, obteniendo mensajes del thread:', localThreadId);
      const messages = await openai.beta.threads.messages.list(localThreadId);
      console.log('📋 [THREAD DEBUG] Total de mensajes en thread:', messages.data.length);
      
      const assistantMessage = messages.data.find(msg => msg.role === 'assistant');
      
      if (assistantMessage) {
        let responseText = assistantMessage.content[0].text.value;
        
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
        
        console.log('🤖 [THREAD DEBUG] Respuesta del asistente obtenida (primeros 100 chars):', responseText.substring(0, 100));
        console.log('🔗 [THREAD DEBUG] ThreadId que se devuelve al frontend:', threadId);
        
        // 📊 LOG FINAL - Resumen de la conversación
        console.log('📊 [RESUMEN CONVERSACIÓN]');
        console.log('   SessionId:', sessionId);
        console.log('   ThreadId:', threadId);
        console.log('   Pregunta original:', userMessage);
        console.log('   Pregunta reformulada:', improvedQuestion);
        console.log('   Se usó contexto:', !!existingThreadId);
        console.log('   Total mensajes en thread:', messages.data.length);
        console.log('   Respuesta (primeros 100 chars):', responseText.substring(0, 100));
        
        // 💾 GUARDAR EN BASE DE DATOS - Pregunta y respuesta en una sola fila
        try {
          console.log('💾 [DB] Guardando conversación en base de datos...');
          
          const metadata = {
            threadId: threadId,
            tokensUsed: null, // OpenAI Assistant no proporciona esta info directamente
            functionsUsed: null, // No hay funciones en este caso
            additional: {
              originalQuestion: userMessage,
              improvedQuestion: improvedQuestion,
              wasImproved: ENABLE_QUESTION_REFORMULATION && !isCourtesyWord && (userMessage !== improvedQuestion),
              isCourtesyWord: isCourtesyWord,
              usedContext: !!existingThreadId,
              threadMessageCount: messages.data.length,
              source: 'openai_storage'
            }
          };
          
          // Guardar en una sola fila: pregunta del usuario + respuesta del asistente
          const savedMessage = await WebChatService.saveMessage(
            sessionId,
            userMessage, // Pregunta original del usuario
            'inbound', // Mensaje entrante
            responseText, // Respuesta del asistente
            metadata
          );
          
          console.log('✅ [DB] Conversación guardada exitosamente en base de datos');
          console.log('💾 [DB] ID del mensaje guardado:', savedMessage.id);
          console.log('💾 [DB] Categoría asignada:', savedMessage.category);
          console.log('💾 [DB] Confianza:', savedMessage.confidence_score);
          
        } catch (dbError) {
          console.error('❌ [DB] Error guardando en base de datos:', dbError.message);
          // No fallar el chat si hay error de BD, solo logear
        }
        
        return {
          success: true,
          response: responseText,
          sessionId: sessionId,
          threadId: threadId,
          source: 'openai_storage',
          originalQuestion: userMessage,
          improvedQuestion: improvedQuestion,
          wasImproved: ENABLE_QUESTION_REFORMULATION && !isCourtesyWord && (userMessage !== improvedQuestion),
          isCourtesyWord: isCourtesyWord,
          usedContext: !!existingThreadId,
          threadMessageCount: messages.data.length
        };
      } else {
        console.log('❌ [THREAD DEBUG] No se encontró mensaje del asistente en el thread');
      }
    } else if (runStatus.status === 'requires_action') {
      
      try {
        // Cancelar el run que requiere funciones
        await openai.beta.threads.runs.cancel(localThreadId, localRunId);
        
        // 🔄 TESTING LOG - Respuesta de fallback por requires_action
        const fallbackResponse = `<h6>🏥 Hospital Regional de Comodoro Rivadavia</h6>
<p>Para obtener información específica sobre ubicación, horarios y servicios del Hospital Regional, te recomiendo:</p>
<ul>
<li><strong>📞 Contactar directamente</strong> al hospital</li>
<li><strong>🗺️ Consultar el mapa</strong>: <a href="https://chatbot.isurgob.net/mapa">Ver centros de salud</a></li>
<li><strong>📍 Buscar</strong> "Hospital Regional Comodoro Rivadavia" en Google Maps</li>
</ul>
<br>¿Necesitás información sobre algún otro tema de salud?`;

        // 💾 GUARDAR FALLBACK EN BD
        try {
          await WebChatService.saveMessage(
            sessionId,
            userMessage,
            'inbound',
            fallbackResponse,
            { 
              threadId: threadId,
              additional: { 
                source: 'fallback_simple',
                reason: 'requires_action_cancelled'
              }
            }
          );
          console.log('✅ [DB] Respuesta fallback guardada en BD');
        } catch (dbError) {
          console.error('❌ [DB] Error guardando fallback:', dbError.message);
        }

        // Respuesta de fallback
        return {
          success: true,
          response: fallbackResponse,
          sessionId: sessionId,
          threadId: threadId,
          source: 'fallback_simple'
        };
        
      } catch (cancelError) {
        console.error('❌ Error cancelando run:', cancelError);
        
        // Respuesta de fallback si no se puede cancelar
        return {
          success: true,
          response: `<h6>🏥 Información de Salud</h6>
<p>Actualmente estoy procesando tu consulta. Para información sobre el Hospital Regional y otros centros de salud:</p>
<p><strong>🗺️ Consulta el mapa:</strong> <a href="https://chatbot.isurgob.net/mapa">https://chatbot.isurgob.net/mapa</a></p>
<br>¿Hay algo más en lo que pueda ayudarte?`,
          sessionId: sessionId,
          threadId: threadId,
          source: 'fallback_error'
        };
      }
    }
    
    // Para otros estados (failed, cancelled, etc.)
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
      threadId: threadId,
      source: 'fallback_busy'
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