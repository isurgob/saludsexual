import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  ActionIcon,
  Stack,
  Text,
  Button,
  ScrollArea,
  Avatar,
  Group,
  Paper,
  Textarea,
  Tooltip,
  Loader,
  Image,
} from "@mantine/core";
import {
  IconMessageCircle,
  IconSend,
  IconX,
  IconRefresh,
  IconRobot,
  IconUser,
  IconTrash,
} from "@tabler/icons-react";
import classes from "./FloatingChat.module.css";
import { setChatLoadingState } from "@/utils/chatUtils";

// Función para generar un sessionId único
const generateSessionId = () => {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Función para limpiar referencias de OpenAI
const cleanOpenAIReferences = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  let cleaned = text;
  
  // Patrones para referencias de OpenAI
  cleaned = cleaned.replace(/【[^】]*†[^】]*】/g, ''); // 【4:0†archivo.md】
  cleaned = cleaned.replace(/\[[^\]]*†[^\]]*\]/g, ''); // [4:0†archivo.md]
  cleaned = cleaned.replace(/【[^】]*】/g, ''); // 【cualquier cosa】
  cleaned = cleaned.replace(/\[[^\]]*\]/g, ''); // [referencias simples]
  
  return cleaned.trim();
};

// Función para normalizar espaciado
const normalizeSpacing = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  let normalized = text;
  
  // Reemplazar múltiples saltos de línea de manera ultra agresiva
  normalized = normalized.replace(/\n\s*\n\s*\n+/g, '\n'); // 3+ saltos = 1
  normalized = normalized.replace(/\n\s*\n/g, '\n');       // 2 saltos = 1
  
  // Limpiar espacios excesivos al inicio y final de líneas
  normalized = normalized.replace(/^\s+|\s+$/gm, '');
  
  // Reemplazar múltiples espacios con uno solo
  normalized = normalized.replace(/ {2,}/g, ' ');
  
  // Limpiar espacios después de emojis y caracteres especiales
  normalized = normalized.replace(/([📍📞⏰🏥🗺️🩺])\s+/g, '$1 ');
  
  // Compactar información repetitiva (múltiples espacios después de dos puntos)
  normalized = normalized.replace(/:\s+/g, ': ');
  
  // Compactar centros de salud (eliminar líneas vacías entre centros)
  normalized = normalized.replace(/\n\n(?=\w)/g, '\n');
  
  return normalized.trim();
};

// Función para convertir Markdown básico a HTML
const markdownToHTML = (text) => {
  if (!text || typeof text !== 'string') return '';

  // Limpiar referencias de OpenAI primero
  let cleaned = cleanOpenAIReferences(text);
  
  // Normalizar espaciado
  cleaned = normalizeSpacing(cleaned);

  let html = cleaned;

  // PASO 1: Preservar links válidos existentes y limpiar HTML roto
  // Primero extraer y guardar links válidos existentes
  const validLinks = [];
  html = html.replace(/<a\s+[^>]*href=['"][^'"]*['"][^>]*>.*?<\/a>/gi, (match) => {
    const placeholder = `__VALID_LINK_${validLinks.length}__`;
    validLinks.push(match);
    return placeholder;
  });

  // Limpiar HTML entities rotos
  html = html.replace(/&lt;/g, '<');
  html = html.replace(/&gt;/g, '>');
  html = html.replace(/&quot;/g, '"');

  // PASO 2: Extraer URLs limpias y convertirlas a links (solo URLs completas)
  html = html.replace(
    /(https?:\/\/[^\s<>"'\)\]]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #FF0048; text-decoration: underline; font-weight: 500;">$1</a>'
  );

  // PASO 3: Restaurar links válidos preservados
  validLinks.forEach((link, index) => {
    html = html.replace(`__VALID_LINK_${index}__`, link);
  });

  // **texto** -> <strong>texto</strong>
  html = html.replace(
    /\*\*(.*?)\*\*/g,
    '<strong style="font-weight: 600; color: #2c2e33;">$1</strong>'
  );

  // *texto* -> <em>texto</em>
  html = html.replace(/\*(.*?)\*/g, '<em style="font-style: italic;">$1</em>');

  // __texto__ -> <strong>texto</strong>
  html = html.replace(
    /__(.*?)__/g,
    '<strong style="font-weight: 600; color: #2c2e33;">$1</strong>'
  );

  // _texto_ -> <em>texto</em>
  html = html.replace(/_(.*?)_/g, '<em style="font-style: italic;">$1</em>');

  // Listas con viñetas - ### -> •
  html = html.replace(
    /^- (.+)$/gm,
    '<span style="display: block; margin: 4px 0;"><span style="color: #FF0048; font-weight: bold; margin-right: 8px;">•</span>$1</span>'
  );

  // Emojis con espacio para mejorar legibilidad
  html = html.replace(
    /(👉|📍|📞|🏥|⚕️|🩺|💊|🔍|ℹ️|✅|❌|⚠️|📋|🗺️|📍)/g,
    '<span style="margin-right: 4px;">$1</span>'
  );

  // Procesar saltos de línea de manera ultra compacta
  // Eliminar saltos múltiples que pudieron quedar
  html = html.replace(/\n+/g, '\n');
  html = html.replace(/\n/g, '<br style="line-height: 1.1; margin: 0; padding: 0;">');
  
  // Limpiar <br> consecutivos
  html = html.replace(/(<br[^>]*>)\s*(<br[^>]*>)/g, '$1');
  
  // Envolver todo en un div ultra compacto
  html = '<div style="line-height: 1.2; margin: 0; padding: 0; font-size: 13px;">' + html + '</div>';

  // Texto entre ** al inicio de línea (para títulos)
  html = html.replace(
    /^\*\*([^*]+)\*\*/gm,
    '<div style="font-weight: 700; color: #2c2e33; margin: 4px 0 2px 0; font-size: 14px;">$1</div>'
  );

  // Compactar formato de centros de salud (emojis + info)
  html = html.replace(
    /(📍|📞|⏰)\s*([^<\n]+)/g,
    '<div style="margin: 1px 0; padding: 0; line-height: 1.2;"><span style="margin-right: 4px;">$1</span><span style="font-size: 13px;">$2</span></div>'
  );

  return html;
};

// Función para sanitizar HTML básico
const sanitizeHTML = (html) => {
  // Validar input
  if (!html || typeof html !== 'string') {
    console.warn('⚠️ sanitizeHTML recibió input inválido:', html);
    return '<p>⚠️ Error procesando respuesta</p>';
  }

  // Primero convertir Markdown a HTML
  let processed = markdownToHTML(html);
  
  // Validar que markdownToHTML devolvió algo válido
  if (!processed || typeof processed !== 'string') {
    console.warn('⚠️ markdownToHTML devolvió input inválido:', processed);
    return '<p>' + String(html) + '</p>';
  }

  // Permitir etiquetas seguras y básicas
  const allowedTags = [
    "p",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "strong",
    "b",
    "em",
    "i",
    "br",
    "ul",
    "ol",
    "li",
    "div",
    "span",
    "a",
  ];

  // Lista de atributos permitidos por etiqueta
  const allowedAttributes = {
    a: ["href", "target", "rel", "style"],
    span: ["style"],
    div: ["style"],
    strong: ["style"],
    em: ["style"],
    br: ["style"],
  };

  // Regex mejorada que preserva atributos permitidos
  const tagRegex = /<\/?([a-zA-Z]+)(\s[^>]*)?>/gi;

  processed = processed.replace(tagRegex, (match, tagName, attributes) => {
    const lowerTagName = tagName.toLowerCase();

    if (!allowedTags.includes(lowerTagName)) {
      return ""; // Remover etiquetas no permitidas
    }

    // Si es una etiqueta de cierre, permitirla
    if (match.startsWith("</")) {
      return match;
    }

    // Para etiquetas con atributos, filtrar solo los permitidos
    if (attributes && allowedAttributes[lowerTagName]) {
      const allowedAttrs = allowedAttributes[lowerTagName];
      const cleanedAttributes = attributes.replace(
        /\s*([^=\s]+)=["']([^"']*)["']/g,
        (attrMatch, attrName, attrValue) => {
          if (allowedAttrs.includes(attrName.toLowerCase())) {
            return ` ${attrName}="${attrValue}"`;
          }
          return "";
        }
      );
      return `<${tagName}${cleanedAttributes}>`;
    }

    return match;
  });

  return processed;
};

const FloatingChat = () => {
  const [opened, setOpened] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // SessionId persistente para toda la sesión del chat
  const [sessionId] = useState(() => generateSessionId());
  
  // Inicializar threadId desde sessionStorage (se borra al cerrar pestaña)
  const [threadId, setThreadId] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedThreadId = sessionStorage.getItem('chatThreadId') || null;
      console.log('🔄 [FRONTEND INIT] ThreadId desde sessionStorage:', savedThreadId || 'NO_GUARDADO');
      return savedThreadId;
    }
    return null;
  });
  const [lastBotMessageId, setLastBotMessageId] = useState(null);

  // Efecto para manejar threadId en sessionStorage
  useEffect(() => {
    if (threadId) {
      console.log('💾 [FRONTEND DEBUG] Guardando threadId en sessionStorage:', threadId);
      // Guardar threadId en sessionStorage (se borra al cerrar pestaña)
      sessionStorage.setItem('chatThreadId', threadId);
    } else {
      console.log('🗑️ [FRONTEND DEBUG] Limpiando threadId de sessionStorage');
      // Limpiar sessionStorage si threadId es null
      sessionStorage.removeItem('chatThreadId');
    }
  }, [threadId]);

  // Referencia para el scroll del chat
  const scrollAreaRef = useRef(null);

  // Función para cerrar el chat y limpiar el threadId (nueva conversación)
  const handleCloseChat = () => {
    setOpened(false);
    // Limpiar threadId para comenzar nueva conversación
    setThreadId(null);
    // También limpiar sessionStorage
    sessionStorage.removeItem('chatThreadId');
  };

  // Funciones eliminadas - ya no usamos localStorage

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    // Siempre iniciar con mensaje de bienvenida - sin cargar del localStorage
    const initialMessage = {
      id: Date.now(),
      sender: "bot",
      text: "¡Hola, soy Mara! Puedo responder tus dudas sobre VIH e Infecciones de Transmisión Sexual.\n\nEsta conversación es anónima, confidencial y se eliminará cuando cierres esta página. Al chatear estás aceptando las <a href='/politicas-privacidad' target='_blank' style='color: #FF0048; text-decoration: underline;'>Políticas de Privacidad</a>.\n\n¿En qué puedo ayudarte?",
      timestamp: new Date(),
    };

    setMessages([initialMessage]);
    setLastBotMessageId(initialMessage.id);

    // Listener para abrir el chat externamente
    const handleOpenChat = async (event) => {
      setOpened(true);

      // Verificar si hay un tema específico en sessionStorage
      const topic = sessionStorage.getItem("chatTopic");

      if (topic) {
        // Primero agregar el mensaje del usuario
        const userMessage = {
          id: Date.now(),
          sender: "user",
          text: `Me interesa ${topic}`,
          timestamp: new Date(),
          fromTopic: true,
        };

        setMessages((prev) => [...prev, userMessage]);

        // Mostrar indicador de carga
        setIsLoading(true);
        setChatLoadingState(true);

        // Pequeño delay para que se vea el mensaje del usuario primero
        setTimeout(async () => {
          try {
            // Preguntas simples para cada tema - el sistema de reformulación las mejorará
            const topicQuestions = {
              Sífilis: "Sífilis",
              VIH: "VIH", 
              Preservativos: "Preservativo",
              Anticonceptivos: "Anticonceptivos",
              Testeos: "Testeo",
              ITS: "ITS",
              Vacunación: "Vacunación",
              Hepatitis: "Hepatitis",
              Gonorrea: "Gonorrea",
              PrEP: "PrEP",
              PEP: "PEP",
              "Embarazo y Lactancia": "Embarazo",
              "Apoyo VIH": "Apoyo VIH",
            };

            const questionToAsk = topicQuestions[topic] || topic;


            // Enviar la pregunta al asistente
            const apiResponse = await sendMessageToAPI(questionToAsk, threadId);

            

            // Guardar el threadId si es nuevo
            if (apiResponse.threadId && apiResponse.threadId !== threadId) {
              setThreadId(apiResponse.threadId);
            }

            // Agregar la respuesta del asistente
            const assistantMessage = {
              id: Date.now() + Math.random(),
              sender: "bot",
              text: apiResponse.message || apiResponse.response || 'Sin respuesta',
              timestamp: new Date(),
              fromTopic: true,
            };

            setMessages((prev) => [...prev, assistantMessage]);
          } catch (error) {
            console.error("Error enviando consulta del tema:", error);

            // Mostrar mensaje de error
            const errorMessage = {
              id: Date.now() + Math.random(),
              sender: "bot",
              text: "Lo siento, hubo un error al obtener la información. Por favor, intenta nuevamente o escribe tu consulta manualmente.",
              timestamp: new Date(),
              isError: true,
            };

            setMessages((prev) => [...prev, errorMessage]);
          } finally {
            setIsLoading(false);
            setChatLoadingState(false);
          }
        }, 500); // Delay de 500ms para que se vea el mensaje del usuario

        // Limpiar el sessionStorage después de usar
        sessionStorage.removeItem("chatTopic");
      }
    };

    window.addEventListener("openFloatingChat", handleOpenChat);

    return () => {
      window.removeEventListener("resize", checkScreenSize);
      window.removeEventListener("openFloatingChat", handleOpenChat);
    };
  }, []);

  // useEffect eliminado - ya no guardamos mensajes en localStorage

  // Función para hacer scroll al final del chat
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const viewport =
        scrollAreaRef.current.querySelector(
          "[data-radix-scroll-area-viewport]"
        ) ||
        scrollAreaRef.current.querySelector(".mantine-ScrollArea-viewport") ||
        scrollAreaRef.current.querySelector(
          "[data-mantine-scroll-area-viewport]"
        );

      if (viewport) {
        setTimeout(() => {
          viewport.scrollTop = viewport.scrollHeight;
        }, 50);
      }
    }
  };

  // Función para hacer scroll al inicio de la última respuesta del bot
  const scrollToBotResponse = () => {
    if (scrollAreaRef.current) {
      const viewport =
        scrollAreaRef.current.querySelector(
          "[data-radix-scroll-area-viewport]"
        ) ||
        scrollAreaRef.current.querySelector(".mantine-ScrollArea-viewport") ||
        scrollAreaRef.current.querySelector(
          "[data-mantine-scroll-area-viewport]"
        );

      if (viewport) {
        setTimeout(() => {
          // Buscar todos los mensajes
          const messageElements =
            viewport.querySelectorAll("[data-message-id]");
          if (messageElements.length > 0) {
            // Encontrar el último mensaje del bot
            let lastBotMessage = null;
            for (let i = messageElements.length - 1; i >= 0; i--) {
              const element = messageElements[i];
              if (element.getAttribute("data-is-bot") === "true") {
                lastBotMessage = element;
                break;
              }
            }

            if (lastBotMessage) {
              // Hacer scroll al inicio del mensaje del bot
              const offsetTop = lastBotMessage.offsetTop - 20; // 20px de padding superior
              viewport.scrollTop = offsetTop;
            } else {
              // Si no encuentra mensaje del bot, scroll al final
              viewport.scrollTop = viewport.scrollHeight;
            }
          }
        }, 100);
      }
    }
  };

  // Efecto para hacer scroll al final cuando cambian los mensajes
  useEffect(() => {
    if (opened && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];

      if (lastMessage.sender === "bot" && lastMessage.id !== lastBotMessageId) {
        // Es una nueva respuesta del bot - scroll al inicio de la respuesta
        setLastBotMessageId(lastMessage.id);

        // Si es un mensaje automático, hacer scroll al final en lugar del inicio
        if (lastMessage.isAutomatic) {
          const timers = [
            setTimeout(scrollToBottom, 100),
            setTimeout(scrollToBottom, 300),
            setTimeout(scrollToBottom, 500),
          ];
          return () => timers.forEach((timer) => clearTimeout(timer));
        } else {
          const timers = [
            setTimeout(scrollToBotResponse, 100),
            setTimeout(scrollToBotResponse, 300),
            setTimeout(scrollToBotResponse, 500),
          ];
          return () => timers.forEach((timer) => clearTimeout(timer));
        }
      } else if (lastMessage.sender === "user") {
        // Es un mensaje del usuario - scroll al final
        const timers = [
          setTimeout(scrollToBottom, 50),
          setTimeout(scrollToBottom, 150),
        ];
        return () => timers.forEach((timer) => clearTimeout(timer));
      }
    }
  }, [messages, opened, lastBotMessageId]);

  // Efecto para hacer scroll al final cuando se abre el chat
  useEffect(() => {
    if (opened) {
      // Múltiples intentos para asegurar que el scroll funcione
      const timers = [
        setTimeout(scrollToBottom, 100),
        setTimeout(scrollToBottom, 300),
        setTimeout(scrollToBottom, 500),
      ];
      return () => timers.forEach((timer) => clearTimeout(timer));
    }
  }, [opened]);

  const sendMessageToAPI = async (message, currentThreadId) => {
    try {
      console.log('🔄 [FRONTEND DEBUG] Enviando mensaje a API');
      console.log('🔄 [FRONTEND DEBUG] SessionId:', sessionId);
      console.log('🔄 [FRONTEND DEBUG] ThreadId actual en frontend:', currentThreadId || 'NO_DEFINIDO');

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message,
          sessionId: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('📨 [FRONTEND DEBUG] Respuesta de API recibida');
      console.log('📨 [FRONTEND DEBUG] ThreadId en respuesta:', data.threadId || 'NO_PRESENTE');
      console.log('📨 [FRONTEND DEBUG] Success:', data.success);

      return data;
    } catch (error) {
      console.error("Error calling API:", error);  
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessageText = inputValue.trim();
    setInputValue("");
    setIsLoading(true);
    setChatLoadingState(true);
    
    // Add user message immediately
    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: userMessageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      // Call API
      const apiResponse = await sendMessageToAPI(userMessageText, threadId);

      console.log('🔗 [FRONTEND DEBUG] Comparando ThreadIds:');
      console.log('🔗 [FRONTEND DEBUG] ThreadId actual:', threadId || 'NO_DEFINIDO');
      console.log('🔗 [FRONTEND DEBUG] ThreadId de respuesta:', apiResponse.threadId || 'NO_PRESENTE');

      // Guardar el threadId solo en memoria (no en localStorage)
      if (apiResponse.threadId && apiResponse.threadId !== threadId) {
        console.log('🆕 [FRONTEND DEBUG] Actualizando threadId en frontend:', apiResponse.threadId);
        setThreadId(apiResponse.threadId);
      } else if (apiResponse.threadId === threadId) {
        console.log('♻️ [FRONTEND DEBUG] ThreadId sin cambios, mantener conversación');
      } else {
        console.log('⚠️ [FRONTEND DEBUG] No hay threadId en respuesta');
      }

      // Add bot response
      const botMessage = {
        id: Date.now() + 1,
        sender: "bot",
        text: apiResponse.message || apiResponse.response || 'Sin respuesta',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);


      // Add error message
      const errorMessage = {
        id: Date.now() + 1,
        sender: "bot",
        text: "Lo siento, hubo un error al procesar tu consulta. Por favor, intenta nuevamente.",
        timestamp: new Date(),
        isError: true,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setChatLoadingState(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter" && !event.shiftKey && !isLoading) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // Funciones de localStorage eliminadas - cada sesión es nueva

  return (
    <>
      {/* Floating Button */}
      <Tooltip label="Chat Salud Comodoro" position="left">
        <ActionIcon
          size={isMobile ? 60 : 70}
          radius="50%"
          className={`${classes.floatingButton} floating-chat-button`}
          onClick={() => setOpened(!opened)}
          color="#FF0048"
          variant="filled"
          data-floating-chat-button="true"
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            zIndex: 999,
            backgroundColor: "#FF0048",
            boxShadow: "0 4px 20px rgba(255, 0, 72, 0.4)",
            border: "3px solid white",
            padding: "8px",
            transform: "translate3d(0, 0, 0)",
          }}
        >
          <Image
            src="/mara.png"
            alt="Chat Mara"
            width={isMobile ? 44 : 54}
            height={isMobile ? 44 : 54}
            fit="contain"
          />
        </ActionIcon>
      </Tooltip>

      {/* Chat Widget */}
      {opened && (
        <Box
          className={classes.chatWidget}
          style={{
            position: "fixed",
            bottom: isMobile ? "90px" : "105px",
            left: isMobile ? "5vw" : "auto",
            right: isMobile ? "5vw" : "20px",
            width: isMobile ? "90vw" : "350px",
            maxWidth: isMobile ? "90vw" : "350px",
            height: isMobile ? "65vh" : "500px",
            maxHeight: isMobile ? "65vh" : "500px",
            backgroundColor: "white",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            border: "1px solid #e9ecef",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <Group
            justify="space-between"
            p={isMobile ? "8px" : "md"}
            style={{
              borderBottom: "1px solid #FFF2F6",
              background: "linear-gradient(135deg, #FF0048 0%, #FF1E5E 100%)",
              borderTopLeftRadius: "12px",
              borderTopRightRadius: "12px",
              height: isMobile ? "50px" : "72px",
              flexShrink: 0,
              alignItems: "center",
            }}
          >
            <Group gap="8px" style={{ flexShrink: 0, overflow: "hidden", flex: 1 }}>
              <Box
                style={{
                  width: isMobile ? "30px" : "40px",
                  height: isMobile ? "30px" : "40px",
                  borderRadius: "50%",
                  backgroundColor: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "2px",
                  flexShrink: 0,
                }}
              >
                <Image
                  src="/mara.png"
                  alt="Logo Salud Comodoro"
                  width={isMobile ? 30 : 40}
                  height={isMobile ? 30 : 40}
                  fit="contain"
                />
              </Box>
              <Box style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
                <Text 
                  size={isMobile ? "12px" : "sm"} 
                  fw={600} 
                  c="white" 
                  truncate
                  style={{ lineHeight: 1.2 }}
                >
                  Mara
                </Text>
                <Text 
                  c="rgba(255,255,255,0.8)" 
                  truncate 
                  style={{ 
                    fontSize: isMobile ? "10px" : "12px",
                    lineHeight: 1.1
                  }}
                >
                  {isLoading ? "Escribiendo..." : "Chatbot"}
                </Text>
              </Box>
            </Group>
            <Group gap="4px" style={{ flexShrink: 0 }}>
              {threadId && (
                <ActionIcon
                  variant="subtle"
                  color="white"
                  onClick={() => {
                    setThreadId(null);
                    sessionStorage.removeItem('chatThreadId');
                  }}
                  style={{ 
                    color: "white", 
                    width: isMobile ? "32px" : "36px",
                    height: isMobile ? "32px" : "36px",
                    minWidth: isMobile ? "32px" : "36px"
                  }}
                  title="Nueva conversación"
                >
                  <IconRefresh size={isMobile ? 14 : 16} />
                </ActionIcon>
              )}
              <ActionIcon
                variant="subtle"
                color="white"
                onClick={handleCloseChat}
                style={{ 
                  color: "white", 
                  width: isMobile ? "32px" : "36px",
                  height: isMobile ? "32px" : "36px",
                  minWidth: isMobile ? "32px" : "36px"
                }}
                title="Cerrar chat"
              >
                <IconX size={isMobile ? 14 : 16} />
              </ActionIcon>
            </Group>
          </Group>
          {/* Content */}
          <Stack
            gap={isMobile ? "xs" : "xs"}
            style={{ flex: 1, overflow: "hidden" }}
            p={0}
          >
            {/* Messages Area */}
            <ScrollArea
              ref={scrollAreaRef}
              type="scroll"
              scrollbars="y"
              styles={{
                root: {
                  flex: 1,
                  margin: isMobile ? "4px 8px" : "8px 12px",
                  overflow: "hidden",
                  minHeight: "200px",
                },
                viewport: { 
                  paddingBottom: "0 !important",
                  overflowX: "hidden !important",
                },
              }}
            >
              <Stack gap="sm" mt={isMobile ? 5 : 5}>
                {messages.map((message) => (
                  <Group
                    key={message.id}
                    align="flex-start"
                    gap="sm"
                    justify={
                      message.sender === "bot" ? "flex-start" : "flex-end"
                    }
                    data-message-id={message.id}
                    data-is-bot={message.sender === "bot"}
                  >
                    {message.sender === "bot" && (
                      <Box
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "4px",
                          minWidth: 32,
                        }}
                      >
                        <Image
                          src="/mara-entera.png"
                          alt="Logo Salud Comodoro"
                          width={120}
                          height={120}
                          fit="contain"
                        />
                      </Box>
                    )}

                    <Paper
                      p={isMobile ? "xs" : "sm"}
                      radius="lg"
                      bg={
                        message.sender === "bot"
                          ? message.isError
                            ? "red.0"
                            : "white"
                          : "#FF0048"
                      }
                      c={
                        message.sender === "bot"
                          ? message.isError
                            ? "red.8"
                            : "black"
                          : "white"
                      }
                      maw={isMobile ? "85%" : "80%"}
                      style={{
                        border:
                          message.sender === "bot"
                            ? "1px solid #e9ecef"
                            : "none",
                        wordWrap: "break-word",
                        overflowWrap: "break-word",
                        wordBreak: "break-word",
                      }}
                    >
                      {message.sender === "bot" ? (
                        <div
                          className={classes.botMessageContent}
                          style={{
                            fontSize: isMobile ? "15px" : "16px",
                            lineHeight: "1.5",
                            color: message.isError ? "#d63384" : "black",
                          }}
                          dangerouslySetInnerHTML={{
                            __html: (() => {
                              const processed = sanitizeHTML(message.text);
                              return processed;
                            })(),
                          }}
                        />
                      ) : (
                        <Text
                          size="sm"
                          style={{ 
                            fontSize: isMobile ? "15px" : "16px", 
                            lineHeight: "1.5" 
                          }}
                        >
                          {message.text}
                        </Text>
                      )}
                    </Paper>
                  </Group>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <Group align="flex-start" gap="sm" justify="flex-start">
                    <Box
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "4px",
                        minWidth: 32,
                      }}
                    >
                      <Image
                        src="/mara-entera.png"
                        alt="Logo Salud Comodoro"
                        width={120}
                        height={120}
                        fit="contain"
                      />
                    </Box>
                    <Paper
                      p="sm"
                      radius="lg"
                      bg="white"
                      style={{ border: "1px solid #e9ecef" }}
                    >
                      <Group gap="xs">
                        <Loader size="xs" color="#FF0048" />
                        <Text 
                          size="sm" 
                          c="black"
                          style={{ 
                            fontSize: isMobile ? "15px" : "16px" 
                          }}
                        >
                          Escribiendo...
                        </Text>
                      </Group>
                    </Paper>
                  </Group>
                )}
              </Stack>
            </ScrollArea>

            {/* Input Area */}
            <Group
              gap="8px"
              p={isMobile ? "8px" : "12px"}
              style={{ flexShrink: 0 }}
            >
              <Textarea
                placeholder={
                  isLoading
                    ? "Esperando..."
                    : "Escribe tu consulta..."
                }
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                autosize
                minRows={1}
                maxRows={2}
                style={{ 
                  flex: 1, 
                  fontSize: isMobile ? "15px" : "16px"
                }}
                radius="md"
                disabled={isLoading}
                size="sm"
              />
              <ActionIcon
                style={{ 
                  backgroundColor: "#FF0048", 
                  color: "white",
                  flexShrink: 0,
                  width: "36px",
                  height: "36px",
                  minWidth: "36px"
                }}
                radius="md"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                loading={isLoading}
              >
                <IconSend size={14} />
              </ActionIcon>
            </Group>

            {/* Status and Disclaimer */}
            <Box
              px={isMobile ? "8px" : "12px"}
              pb={isMobile ? "6px" : "8px"}
              style={{ flexShrink: 0 }}
            >
              <Text 
                c="dimmed" 
                ta="center" 
                style={{ 
                  fontSize: isMobile ? "11px" : "12px",
                  lineHeight: 1.3
                }}
              >
                {isMobile ? "Herramienta informativa" : "Esta herramienta es informativa y no reemplaza la consulta médica."}
              </Text>
            </Box>
          </Stack>
        </Box>
      )}
    </>
  );
};

export default FloatingChat;
