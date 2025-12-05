// Utilidades para el chat
let isChatLoading = false;

// Estados globales del chat
export const getChatLoadingState = () => isChatLoading;
export const setChatLoadingState = (loading) => {
  isChatLoading = loading;
  // Disparar evento para notificar cambio de estado
  const event = new CustomEvent('chatLoadingStateChanged', {
    detail: { loading }
  });
  window.dispatchEvent(event);
};

export const openFloatingChat = () => {
  // Limpiar cualquier tema previo
  sessionStorage.removeItem('chatTopic');
  // Disparar evento personalizado para abrir el chat flotante
  const event = new CustomEvent('openFloatingChat');
  window.dispatchEvent(event);
};

export const openFloatingChatWithTopic = (topic) => {
  // Si ya hay una consulta en proceso, no hacer nada
  if (isChatLoading) {
    return;
  }

  // Guardar solo el tema en sessionStorage - el chat manejará el resto
  sessionStorage.setItem('chatTopic', topic);
  
  // Disparar evento personalizado para abrir el chat flotante
  const event = new CustomEvent('openFloatingChat', {
    detail: {
      hasTopic: true,
      topic: topic
    }
  });
  window.dispatchEvent(event);
};
