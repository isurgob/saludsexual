/**
 * ASISTENTE MARA - OPENAI RESPONSES API
 *
 * Reemplaza a la Assistants API (threads/runs), que OpenAI apagó el 26/08/2026.
 * - El "Assistant" pasa a ser: modelo + instrucciones (assistantInstructions.js) + file_search
 * - Los "threads" pasan a ser "conversations" (guardan el historial del chat)
 * - Los documentos siguen en el mismo vector store de OpenAI
 */

import openai from './openai';
import { ASSISTANT_INSTRUCTIONS } from './assistantInstructions';

const MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const VECTOR_STORE_ID = process.env.OPENAI_VECTOR_STORE_ID;

/**
 * Crea una conversación nueva en OpenAI y devuelve su id (conv_...)
 */
export async function createConversation() {
  const conversation = await openai.conversations.create();
  return conversation.id;
}

/**
 * Envía un mensaje dentro de una conversación y devuelve la respuesta del asistente
 */
export async function askAssistant(conversationId, message) {
  if (!VECTOR_STORE_ID) {
    throw new Error('OPENAI_VECTOR_STORE_ID no está configurado');
  }

  const response = await openai.responses.create({
    model: MODEL,
    instructions: ASSISTANT_INSTRUCTIONS,
    conversation: conversationId,
    input: message,
    tools: [{ type: 'file_search', vector_store_ids: [VECTOR_STORE_ID] }],
  });

  return {
    text: response.output_text,
    status: response.status,
    tokensUsed: response.usage?.total_tokens ?? null,
  };
}
