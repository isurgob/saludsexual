# ISUR - Plataforma de Chatbot de Salud - Asistente Virtual de Salud

**Plataforma integral para información y asistencia en salud con chatbot potenciado por IA**

Sistema web que incluye chatbot inteligente con IA, mapa interactivo de centros de salud, integración con WhatsApp Business API y panel administrativo para gestión de contenidos.

## 📋 ¿Qué es este proyecto?

La Plataforma de Chatbot de Salud es una aplicación web que proporciona:

- **🤖 Chatbot con IA**: Asistente virtual que responde consultas de salud usando OpenAI
- **🗺️ Mapa Interactivo**: Localización en tiempo real de centros de salud y sitios de testeo
- **📱 Integración WhatsApp**: Soporte multicanal a través de WhatsApp Business API
- **📚 Artículos Dinámicos**: Sistema de contenido informativo con acordeones
- **👨‍💼 Panel Admin**: Gestión completa de usuarios, contenido y estadísticas
- **📊 Analytics**: Métricas de uso y seguimiento del comportamiento del usuario

## 🛠️ Tecnologías y Versiones

### **Frontend**
- **Next.js** `15.5.0` - Framework React con SSR/SSG
- **React** `19.1.0` - Biblioteca de UI
- **Mantine** `8.3.1` - Biblioteca de componentes UI
- **Leaflet** `1.9.4` + **React Leaflet** `5.0.0` - Mapas interactivos
- **Tabler Icons** `3.34.1` - Biblioteca de iconos

### **Backend y APIs**
- **Next.js API Routes** - Endpoints del backend
- **PostgreSQL** - Base de datos principal
- **OpenAI API** `5.19.1` - Inteligencia artificial
- **NextAuth.js** `4.24.11` - Autenticación

### **Editor y Contenido**
- **Tiptap** `3.3.1` - Editor WYSIWYG para el admin
- **Mantine Tiptap** - Integración del editor

### **Herramientas**
- **PM2** - Gestor de procesos (producción)
- **env-cmd** `10.1.0` - Gestión de variables de entorno

## 🔐 Variables de Entorno Requeridas

Copia los archivos de ejemplo y configura tus valores:

```bash
# Copiar archivos de ejemplo y configurar con tus valores
cp environments/.env.local.example environments/.env.local
cp environments/.env.dev.example environments/.env.dev  
cp environments/.env.prod.example environments/.env.prod
```

Variables requeridas (ver archivos de ejemplo para detalles):
- **Configuración OpenAI**: Clave API, ID del vector store y modelo
- **Base de Datos PostgreSQL**: Detalles de conexión
- **NextAuth.js**: Clave secreta y URL
- **WhatsApp Business API**: Tokens de acceso (opcional)
- **Configuración de Email**: Para recuperación de contraseñas (opcional)

## 🚀 Clonar y Ejecutar Localmente

### **1. Prerrequisitos**
```bash
# Verificar Node.js (requiere versión 18+)
node --version

# Verificar npm
npm --version
```

### **2. Clonar el repositorio**
```bash
git clone https://github.com/yourusername/health-chatbot-platform.git
cd saludsexual
```

### **3. Instalar dependencias**
```bash
npm install
```

### **4. Configurar variables de entorno**
```bash
# Copiar archivos de ejemplo y configurar con tus valores
cp environments/.env.local.example environments/.env.local
cp environments/.env.dev.example environments/.env.dev
cp environments/.env.prod.example environments/.env.prod
```

### **5. Configurar base de datos**
- Crear una base de datos PostgreSQL
- Las tablas se crean automáticamente desde el panel admin
- Puedes usar el endpoint `/api/whatsapp/init-tables` para inicializar

### **6. Ejecutar en desarrollo**
```bash
# Iniciar servidor de desarrollo
npm run local

# La aplicación estará disponible en:
# http://localhost:3003
```


## 📁 Estructura Principal

```
health-chatbot-platform/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── FloatingChat/   # Chatbot flotante
│   │   └── InteractiveMap/ # Mapa de centros de salud
│   ├── pages/              # Páginas y rutas API
│   │   ├── api/            # Endpoints del backend
│   │   └── admin/          # Panel administrativo
│   └── hooks/              # Custom React hooks
├── environments/           # Variables de entorno
├── public/                # Archivos estáticos
└── package.json           # Dependencias del proyecto
```

## 🎯 Scripts Disponibles

```bash
npm run local     # Desarrollo local (puerto 3003)
npm run dev       # Desarrollo (puerto 3008)
npm run build     # Build para producción
npm run start     # Producción (puerto 3010)
npm run lint      # Linter ESLint
```

## 📄 Licencia

Este proyecto es open source y está disponible bajo la [Licencia MIT](LICENSE).

## 🤝 Contribuir

¡Las contribuciones, issues y solicitudes de características son bienvenidas! Siéntete libre de revisar la [página de issues](../../issues).

## ⭐ Muestra tu apoyo

¡Dale una ⭐️ si este proyecto te ayudó!
