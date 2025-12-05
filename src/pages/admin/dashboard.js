import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  Container,
  Grid,
  Card,
  Title,
  Text,
  Stack,
  Group,
  Button,
  ThemeIcon,
  Badge,
  Box,
  SimpleGrid,
  ActionIcon,
  Menu,
  Avatar,
  Paper,
  UnstyledButton,
  Alert,
  RingProgress,
  Center,
} from "@mantine/core";
import {
  IconUsers,
  IconTrendingUp,
  IconClock,
  IconEye,
  IconChevronDown,
  IconLogout,
  IconArticle,
  IconMapPin,
  IconActivity,
  IconChevronRight,
  IconWorldWww,
  IconDeviceMobile,
  IconRefresh,
  IconAlertCircle,
  IconSearch,
  IconExternalLink,
  IconChartBar,
  IconGraph,
  IconFilter,
  IconMessageCircle,
  IconDeviceDesktop,
  IconBrandWhatsapp,
  IconPhone,
  IconCalendar,
  IconDownload,
} from "@tabler/icons-react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import LoadingScreen from "../../components/LoadingScreen";
import SiteAnalytics from "../../components/admin/SiteAnalytics";

export default function Dashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);

  // Estado para métricas del mapa
  const [mapStats, setMapStats] = useState(null);
  const [mapStatsLoading, setMapStatsLoading] = useState(true);
  const [mapError, setMapError] = useState(null);

  // Estado para métricas del chatbot
  const [chatStats, setChatStats] = useState(null);
  const [whatsappStats, setWhatsappStats] = useState(null);
  const [chatStatsLoading, setChatStatsLoading] = useState(true);
  const [chatError, setChatError] = useState(null);
  
  // Estado para descarga de conversaciones
  const [downloadLoading, setDownloadLoading] = useState(false);

  // Verificar autenticación con NextAuth
  useEffect(() => {
    if (status === "loading") return; // Aún cargando

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (session?.user) {

      // Verificar que sea admin o moderador
      if (session.user.role !== 1 && session.user.role !== 2) {
        router.push("/login?error=insufficient_permissions");
        return;
      }

      setLoading(false);
    }
  }, [session, status, router]);

  // Cargar métricas del mapa
  const loadMapStats = async () => {
    try {
      setMapStatsLoading(true);
      setMapError(null);

      const response = await fetch("/api/analytics/map-stats?days=30");

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        setMapStats(data.data);
      } else {
        throw new Error(data.error || "Error desconocido");
      }
    } catch (error) {
      console.error("Error cargando métricas del mapa:", error);
      setMapError(error.message);
      setMapStats(null);
    } finally {
      setMapStatsLoading(false);
    }
  };

  // Cargar métricas del chatbot
  const loadChatbotStats = async () => {
    try {
      setChatStatsLoading(true);
      setChatError(null);

      // Cargar stats del chat web y WhatsApp en paralelo
      const [chatResponse, whatsappResponse] = await Promise.all([
        fetch("/api/chat/stats?days=30"),
        fetch("/api/whatsapp/stats?days=30")
      ]);

      if (!chatResponse.ok) {
        throw new Error(`Error cargando chat stats: ${chatResponse.status}`);
      }

      if (!whatsappResponse.ok) {
        throw new Error(`Error cargando WhatsApp stats: ${whatsappResponse.status}`);
      }

      const chatData = await chatResponse.json();
      const whatsappData = await whatsappResponse.json();

      if (chatData.success && whatsappData.success) {
        setChatStats(chatData.data);
        setWhatsappStats(whatsappData.data);
      } else {
        throw new Error("Error obteniendo datos del servidor");
      }
    } catch (error) {
      console.error("Error cargando métricas del chatbot:", error);
      setChatError(error.message);
      setChatStats(null);
      setWhatsappStats(null);
    } finally {
      setChatStatsLoading(false);
    }
  };

  // Cargar métricas cuando el usuario esté autenticado
  useEffect(() => {
    if (session?.user && !loading) {
      loadMapStats();
      loadChatbotStats();
    }
  }, [session, loading]);

  // Función para descargar conversaciones
  const handleDownloadConversations = async (format = 'csv') => {
    try {
      setDownloadLoading(true);
      
      const response = await fetch(`/api/chat/export-conversations?format=${format}`);
      
      if (!response.ok) {
        throw new Error('Error al descargar el informe');
      }
      
      if (format === 'csv') {
        // Descargar CSV
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conversaciones-chatbot-completo-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // Para JSON, abrir en nueva ventana o mostrar datos
        const data = await response.json();
        if (data.success) {
          // Crear y descargar archivo JSON
          const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `conversaciones-chatbot-completo-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
      }
      
    } catch (error) {
      console.error('Error descargando conversaciones:', error);
      // Aquí podrías mostrar una notificación de error
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut({
      callbackUrl: "/login",
      redirect: true,
    });
  };

  // Mostrar loading mientras se verifica la sesión
  if (status === "loading" || loading) {
    return (
      <LoadingScreen
        message="Verificando autenticación..."
        backHref="/login"
        backText="Volver al login"
      />
    );
  }

  // Si no hay sesión, no mostrar nada (el useEffect redirigirá)
  if (!session) {
    return null;
  }

  return (
    <>
      

      <Box
        style={{
          minHeight: "100vh",
          backgroundColor: "var(--dashboard-bg-main)",
        }}
      >
        {/* Header del Dashboard */}
        <Box
          bg="white"
          style={{ borderBottom: "1px solid var(--border-light)" }}
          mb={"xl"}
        >
          <Container size="xl" mb={"xl"}>
            <Group h={70} justify="space-between">
              <Group>
                <IconActivity size={28} color="var(--dashboard-primary)" />
                <div>
                  <Text fw={700} size="lg" className="dashboard-primary">
                    Panel Administrativo
                  </Text>
                  <Text size="sm" className="dashboard-text-muted">
                    Chatbot Comodoro Salud
                  </Text>
                </div>
              </Group>

              <Group>
                <Menu shadow="md" width={200}>
                  <Menu.Target>
                    <UnstyledButton>
                      <Group gap={7}>
                        <Avatar
                          size={36}
                          radius="xl"
                          color="brand"
                          variant="filled"
                        >
                          {session.user.name
                            ? session.user.name.charAt(0).toUpperCase()
                            : "U"}
                        </Avatar>
                        <Box style={{ flex: 1 }}>
                          <Text size="sm" fw={500}>
                            {session.user.name} ({session.user.roleName})
                          </Text>
                          <Text size="xs" c="dimmed">
                            {session.user.email}
                          </Text>
                        </Box>
                        <IconChevronRight size={14} stroke={1.5} />
                      </Group>
                    </UnstyledButton>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item
                      leftSection={<IconMapPin size={14} />}
                      component={Link}
                      href="/admin/mapas"
                    >
                      Mapas
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconArticle size={14} />}
                      component={Link}
                      href="/admin/articles"
                    >
                      Artículos
                    </Menu.Item>
                    {session.user.role === 1 && (
                      <Menu.Item
                        leftSection={<IconUsers size={14} />}
                        component={Link}
                        href="/admin/users"
                      >
                        Usuarios
                      </Menu.Item>
                    )}

                    <Menu.Divider />
                    <Menu.Item
                      leftSection={<IconLogout size={14} />}
                      color="red"
                      onClick={handleLogout}
                    >
                      Cerrar Sesión
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>
            </Group>
          </Container>
        </Box>

        <Container size="xl" mb={"xl"}>
          <Stack gap="xl">
            {/* Acciones Rápidas */}
            <Paper withBorder p="md" className="dashboard-card">
              <Group justify="space-between" align="center">
                <Box>
                  <Title
                    order={3}
                    size="h4"
                    className="admin-panel-title"
                    style={{ 
                      fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                      color: "#2d3748",
                      fontWeight: 600
                    }}
                  >
                    Acciones Rápidas
                  </Title>
                  <Text size="sm" className="dashboard-text-muted">
                    Gestiona el contenido de la plataforma
                  </Text>
                </Box>
                <Group>
                  <Button
                    component={Link}
                    href="/admin/mapas"
                    leftSection={<IconMapPin size={16} />}
                    variant="filled"
                    color="brand"
                  >
                    Gestionar Mapas
                  </Button>
                  <Button
                    component={Link}
                    href="/admin/articles"
                    leftSection={<IconArticle size={16} />}
                    variant="filled"
                    color="blue"
                  >
                    Gestionar Artículos
                  </Button>
                  <Button
                    component={Link}
                    href="/admin/users"
                    leftSection={<IconUsers size={16} />}
                    variant="light"
                    color="brand"
                  >
                    Gestionar Usuarios
                  </Button>
                </Group>
              </Group>
            </Paper>

            {/* Analytics del Sitio Web */}
            <SiteAnalytics />

            {/* Métricas del Chatbot */}
            <Paper withBorder p="lg" className="dashboard-card">
              <Group justify="space-between" align="center" mb="lg">
                <Box>
                  <Title 
                    order={3} 
                    size="h4" 
                    className="admin-panel-title"
                    style={{ 
                      fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                      color: "#2d3748",
                      fontWeight: 600
                    }}
                  >
                    📱 Métricas del Chatbot
                  </Title>
                  <Text size="sm" className="dashboard-text-muted">
                    Estadísticas de uso y rendimiento del asistente virtual
                  </Text>
                </Box>
                <Group>
                  {chatStatsLoading && (
                    <Badge variant="light" color="blue">
                      Cargando...
                    </Badge>
                  )}
                  {!chatStatsLoading && !chatError && (
                    <>
                      <Badge variant="light" color="brand">
                        Datos en tiempo real
                      </Badge>
                      <Button
                        variant="gradient"
                        gradient={{ from: 'teal', to: 'cyan' }}
                        size="sm"
                        leftSection={<IconDownload size={16} />}
                        loading={downloadLoading}
                        onClick={() => handleDownloadConversations('csv')}
                      >
                        Descargar Informe
                      </Button>
                    </>
                  )}
                  {chatError && (
                    <Button
                      variant="light"
                      size="xs"
                      color="red"
                      onClick={loadChatbotStats}
                    >
                      Reintentar
                    </Button>
                  )}
                </Group>
              </Group>

              {/* Mostrar error si existe */}
              {chatError && (
                <Alert
                  icon={<IconAlertCircle size={16} />}
                  title="Error cargando métricas del chatbot"
                  color="red"
                  mb="lg"
                >
                  {chatError}
                </Alert>
              )}

              {/* Mostrar alerta solo si hay error en la nota del API */}
              {!chatStatsLoading && chatStats && chatStats.note && chatStats.note.includes('TABLAS') && (
                <Alert
                  icon={<IconAlertCircle size={16} />}
                  title="📊 Sistema de Chatbot sin configurar"
                  color="yellow"
                  mb="lg"
                >
                  <Stack gap="xs">
                    <Text size="sm">
                      Las tablas del sistema de chat no están creadas en la base de datos.
                    </Text>
                    <Text size="sm" fw={500}>
                      Para habilitar el tracking del chatbot:
                    </Text>
                    <Text size="sm" style={{ fontFamily: 'monospace', backgroundColor: '#f8f9fa', padding: '8px', borderRadius: '4px' }}>
                      Ejecuta: database/create_chat_tables.sql en PostgreSQL
                    </Text>
                  </Stack>
                </Alert>
              )}

              {/* Información sobre descarga de conversaciones */}
              {!chatStatsLoading && !chatError && (
                <Alert
                  icon={<IconDownload size={16} />}
                  title="📥 Informe Completo de Conversaciones"
                  color="teal"
                  mb="lg"
                  variant="light"
                >
                  <Text size="sm">
                    El botón &quot;Descargar Informe&quot; exporta TODAS las conversaciones registradas del chatbot (Web + WhatsApp) 
                    en formato Excel (CSV). La descarga puede tardar unos momentos si hay muchas conversaciones.
                  </Text>
                </Alert>
              )}

              {/* Estadísticas de mensajes */}
              <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg" mb="xl">
                <Card
                  shadow="xs"
                  p="md"
                  radius="md"
                  withBorder
                  className="dashboard-card"
                >
                  <Group justify="space-between" align="center">
                    <Group>
                      <ThemeIcon color="brand" variant="light" size="md">
                        <IconDeviceDesktop size={16} />
                      </ThemeIcon>
                      <Text fw={500} className="dashboard-primary">
                        Web Chat
                      </Text>
                    </Group>
                    <Text fw={700} size="lg" className="dashboard-primary">
                      {chatStatsLoading ? "..." : (chatStats?.stats?.total_messages?.toLocaleString() || "0")}
                    </Text>
                  </Group>
                  <Text size="xs" className="dashboard-text-muted" mt="xs">
                    {chatStatsLoading ? "Cargando..." : (() => {
                      const webTotal = chatStats?.stats?.total_messages || 0;
                      const whatsappTotal = whatsappStats?.stats?.total_messages || 0;
                      const totalMessages = webTotal + whatsappTotal;
                      
                      if (totalMessages === 0) {
                        return "Sin conversaciones registradas";
                      }
                      
                      const percentage = Math.round((webTotal / totalMessages) * 100);
                      return `${percentage}% del total de conversaciones`;
                    })()}
                  </Text>
                </Card>

                <Card
                  shadow="xs"
                  p="md"
                  radius="md"
                  withBorder
                  className="dashboard-card"
                >
                  <Group justify="space-between" align="center">
                    <Group>
                      <ThemeIcon
                        color="var(--analytics-success)"
                        variant="light"
                        size="md"
                      >
                        <IconBrandWhatsapp size={16} />
                      </ThemeIcon>
                      <Text fw={500} className="dashboard-primary">
                        WhatsApp
                      </Text>
                    </Group>
                    <Text
                      fw={700}
                      size="lg"
                      style={{ color: "var(--analytics-success)" }}
                    >
                      {chatStatsLoading ? "..." : (whatsappStats?.stats?.total_messages?.toLocaleString() || "0")}
                    </Text>
                  </Group>
                  <Text size="xs" className="dashboard-text-muted" mt="xs">
                    {chatStatsLoading ? "Cargando..." : (() => {
                      const webTotal = chatStats?.stats?.total_messages || 0;
                      const whatsappTotal = whatsappStats?.stats?.total_messages || 0;
                      const totalMessages = webTotal + whatsappTotal;
                      
                      if (totalMessages === 0) {
                        return "Sin conversaciones registradas";
                      }
                      
                      const percentage = Math.round((whatsappTotal / totalMessages) * 100);
                      return `${percentage}% del total de conversaciones`;
                    })()}
                  </Text>
                </Card>

                <Card
                  shadow="xs"
                  p="md"
                  radius="md"
                  withBorder
                  className="dashboard-card"
                >
                  <Group justify="space-between" align="center">
                    <Group>
                      <ThemeIcon
                        color="var(--analytics-warning)"
                        variant="light"
                        size="md"
                      >
                        <IconMessageCircle size={16} />
                      </ThemeIcon>
                      <Text fw={500} className="dashboard-primary">
                        Total Mensajes
                      </Text>
                    </Group>
                    <Text
                      fw={700}
                      size="lg"
                      style={{ color: "var(--analytics-warning)" }}
                    >
                      {chatStatsLoading ? "..." : (
                        ((chatStats?.stats?.total_messages || 0) + (whatsappStats?.stats?.total_messages || 0)).toLocaleString()
                      )}
                    </Text>
                  </Group>
                  <Text size="xs" className="dashboard-text-muted" mt="xs">
                    {chatStatsLoading ? "Cargando..." : (() => {
                      const webTotal = chatStats?.stats?.total_messages || 0;
                      const whatsappTotal = whatsappStats?.stats?.total_messages || 0;
                      const totalMessages = webTotal + whatsappTotal;
                      
                      if (totalMessages === 0) {
                        return "Sin datos en el período";
                      }
                      
                      return chatStats?.period || "Últimos 30 días";
                    })()}
                  </Text>
                </Card>
              </SimpleGrid>

              {/* Métricas de hoy */}
              <Title 
                order={4} 
                mb="md" 
                className="admin-panel-subtitle"
                style={{ 
                  fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                  color: "#2d3748",
                  fontWeight: 500
                }}
              >
                Actividad de Hoy
              </Title>
              <Group justify="center">
                <Card 
                  withBorder 
                  p="xl" 
                  radius="lg" 
                  shadow="md"
                  style={{ 
                    minWidth: "300px",
                    maxWidth: "400px"
                  }}
                >
                  <Stack align="center" gap="lg">
                    <ThemeIcon size="xxl" variant="gradient" gradient={{ from: "#1b436b", to: "cyan" }}>
                      <IconMessageCircle size={40} />
                    </ThemeIcon>
                    <Text 
                      size="xl"
                      ta="center" 
                      fw={700}
                      style={{ 
                        background: "linear-gradient(135deg, #1b436b 0%, cyan 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text"
                      }}
                    >
                      Consultas Generales de Hoy
                    </Text>
                    <Text 
                      size="4rem" 
                      fw={800} 
                      ta="center" 
                      style={{ 
                        lineHeight: 1,
                        background: "linear-gradient(135deg, #1b436b 0%, cyan 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text"
                      }}
                    >
                      {chatStatsLoading ? "..." : (
                        ((chatStats?.stats?.today?.general || 0) + (whatsappStats?.stats?.today?.general || 0))
                      )}
                    </Text>
                    <Text 
                      size="md" 
                      ta="center"
                      fw={500}
                      style={{ 
                        background: "linear-gradient(135deg, #1b436b 0%, cyan 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text"
                      }}
                    >
                      Web Chat + WhatsApp
                    </Text>
                  </Stack>
                </Card>
              </Group>
            </Paper>

            {/* Métricas del Mapa */}
            <Paper withBorder p="md" className="dashboard-card">
              <Group justify="space-between" align="center" mb="md">
                <Box>
                  <Title
                    order={3}
                    size="h4"
                    className="admin-panel-title"
                    style={{ 
                      fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                      color: "#2d3748",
                      fontWeight: 600
                    }}
                  >
                    Métricas del Mapa
                  </Title>
                  <Text size="sm" className="dashboard-text-muted">
                    Análisis de interacciones con el mapa de servicios (últimos
                    30 días)
                  </Text>
                </Box>
                {!mapStatsLoading && mapStats && (
                  <Badge variant="light" color="brand">
                    {mapStats.generalStats.unique_users} usuarios diferentes
                  </Badge>
                )}
              </Group>

              {mapStatsLoading ? (
                <LoadingScreen
                  message="Cargando métricas del mapa..."
                  size="sm"
                />
              ) : mapStats ? (
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
                  {/* Centro más clickeado */}
                  <Card
                    shadow="xs"
                    p="md"
                    radius="md"
                    withBorder
                    className="dashboard-card"
                  >
                    <Group justify="space-between" align="flex-start">
                      <Box style={{ flex: 1 }}>
                        <Group gap="xs" mb="xs">
                          <ThemeIcon color="brand" variant="light" size="sm">
                            <IconMapPin size={16} />
                          </ThemeIcon>
                          <Text
                            size="xs"
                            tt="uppercase"
                            fw={700}
                            className="dashboard-text-muted"
                          >
                            Centro Más Visitado
                          </Text>
                        </Group>
                        {mapStats.mostClickedCenters.length > 0 ? (
                          <>
                            <Text
                              fw={600}
                              size="sm"
                              mb="xs"
                              className="dashboard-primary"
                            >
                              {mapStats.mostClickedCenters[0].center_name}
                            </Text>
                            <Text
                              size="xs"
                              className="dashboard-text-muted"
                              mb="xs"
                            >
                              {mapStats.mostClickedCenters[0].center_type}
                            </Text>
                            <Badge size="xs" color="brand" variant="light">
                              {mapStats.mostClickedCenters[0].total_clicks}{" "}
                              clicks
                            </Badge>
                          </>
                        ) : (
                          <Text size="sm" className="dashboard-text-muted">
                            Sin datos
                          </Text>
                        )}
                      </Box>
                    </Group>
                  </Card>

                  {/* Búsqueda más frecuente */}
                  <Card
                    shadow="xs"
                    p="md"
                    radius="md"
                    withBorder
                    className="dashboard-card"
                  >
                    <Group justify="space-between" align="flex-start">
                      <Box style={{ flex: 1 }}>
                        <Group gap="xs" mb="xs">
                          <ThemeIcon
                            color="var(--analytics-info)"
                            variant="light"
                            size="sm"
                          >
                            <IconSearch size={16} />
                          </ThemeIcon>
                          <Text
                            size="xs"
                            tt="uppercase"
                            fw={700}
                            className="dashboard-text-muted"
                          >
                            Búsqueda Más Frecuente
                          </Text>
                        </Group>
                        {mapStats.topSearches.length > 0 ? (
                          <>
                            <Text
                              fw={600}
                              size="sm"
                              mb="xs"
                              className="dashboard-primary"
                            >
                              &quot;{mapStats.topSearches[0].search_query}&quot;
                            </Text>
                            <Badge size="xs" color="cyan" variant="light">
                              {mapStats.topSearches[0].search_count} búsquedas
                            </Badge>
                          </>
                        ) : (
                          <Text size="sm" className="dashboard-text-muted">
                            Sin datos
                          </Text>
                        )}
                      </Box>
                    </Group>
                  </Card>

                  {/* Direcciones más solicitadas */}
                  <Card
                    shadow="xs"
                    p="md"
                    radius="md"
                    withBorder
                    className="dashboard-card"
                  >
                    <Group justify="space-between" align="flex-start">
                      <Box style={{ flex: 1 }}>
                        <Group gap="xs" mb="xs">
                          <ThemeIcon
                            color="var(--analytics-success)"
                            variant="light"
                            size="sm"
                          >
                            <IconExternalLink size={16} />
                          </ThemeIcon>
                          <Text
                            size="xs"
                            tt="uppercase"
                            fw={700}
                            className="dashboard-text-muted"
                          >
                            Más Direcciones Pedidas
                          </Text>
                        </Group>
                        {mapStats.mostRequestedDirections.length > 0 ? (
                          <>
                            <Text
                              fw={600}
                              size="sm"
                              mb="xs"
                              className="dashboard-primary"
                            >
                              {mapStats.mostRequestedDirections[0].center_name}
                            </Text>
                            <Badge size="xs" color="teal" variant="light">
                              {
                                mapStats.mostRequestedDirections[0]
                                  .direction_requests
                              }{" "}
                              solicitudes
                            </Badge>
                          </>
                        ) : (
                          <Text size="sm" className="dashboard-text-muted">
                            Sin datos
                          </Text>
                        )}
                      </Box>
                    </Group>
                  </Card>

                  {/* Filtro más usado */}
                  <Card
                    shadow="xs"
                    p="md"
                    radius="md"
                    withBorder
                    className="dashboard-card"
                  >
                    <Group justify="space-between" align="flex-start">
                      <Box style={{ flex: 1 }}>
                        <Group gap="xs" mb="xs">
                          <ThemeIcon
                            color="var(--analytics-warning)"
                            variant="light"
                            size="sm"
                          >
                            <IconFilter size={16} />
                          </ThemeIcon>
                          <Text
                            size="xs"
                            tt="uppercase"
                            fw={700}
                            className="dashboard-text-muted"
                          >
                            Filtro Más Usado
                          </Text>
                        </Group>
                        {mapStats.popularFilters.length > 0 ? (
                          <>
                            <Text
                              fw={600}
                              size="sm"
                              mb="xs"
                              className="dashboard-primary"
                            >
                              {mapStats.popularFilters[0].filter_value}
                            </Text>
                            <Badge size="xs" color="orange" variant="light">
                              {mapStats.popularFilters[0].usage_count} usos
                            </Badge>
                          </>
                        ) : (
                          <Text size="sm" className="dashboard-text-muted">
                            Sin datos
                          </Text>
                        )}
                      </Box>
                    </Group>
                  </Card>
                </SimpleGrid>
              ) : (
                <Box ta="center" py="xl">
                  <Text className="analytics-warning">
                    Error cargando métricas del mapa
                  </Text>
                  <Button
                    variant="light"
                    size="xs"
                    mt="sm"
                    color="brand"
                    onClick={loadMapStats}
                  >
                    Reintentar
                  </Button>
                </Box>
              )}

              {/* Lista detallada de métricas */}
              {!mapStatsLoading && mapStats && (
                <Grid mt="lg">
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Card
                      shadow="xs"
                      p="md"
                      radius="md"
                      withBorder
                      className="dashboard-card"
                    >
                      <Title
                        order={5}
                        mb="md"
                        className="admin-panel-subtitle"
                        style={{ 
                          fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                          color: "#2d3748",
                          fontWeight: 500
                        }}
                      >
                        Top 5 Centros Más Visitados
                      </Title>

                      {mapStats.mostClickedCenters.length > 0 ? (
                        <Stack gap="md">
                          {/* Gráfica de centros */}
                          <Center>
                            <RingProgress
                              size={180}
                              thickness={14}
                              sections={mapStats.mostClickedCenters
                                .slice(0, 5)
                                .map((center, index) => {
                                  const total = mapStats.mostClickedCenters
                                    .slice(0, 5)
                                    .reduce(
                                      (sum, c) =>
                                        sum + parseInt(c.total_clicks || 0, 10),
                                      0
                                    );
                                  const percentage =
                                    total > 0
                                      ? (parseInt(
                                          center.total_clicks || 0,
                                          10
                                        ) /
                                          total) *
                                        100
                                      : 0;

                                  return {
                                    value: percentage,
                                    color:
                                      index === 0
                                        ? "brand"
                                        : index === 1
                                        ? "green"
                                        : index === 2
                                        ? "orange"
                                        : index === 3
                                        ? "cyan"
                                        : "gray",
                                    tooltip: `${center.center_name}: ${
                                      center.total_clicks
                                    } clicks (${percentage.toFixed(1)}%)`,
                                  };
                                })}
                              label={
                                <Stack align="center" gap="xs">
                                  <Text
                                    size="xs"
                                    className="dashboard-text-muted"
                                  >
                                    Total
                                  </Text>
                                  <Text
                                    size="sm"
                                    fw={700}
                                    className="dashboard-primary"
                                  >
                                    {mapStats.mostClickedCenters
                                      .slice(0, 5)
                                      .reduce(
                                        (sum, center) =>
                                          sum +
                                          parseInt(
                                            center.total_clicks || 0,
                                            10
                                          ),
                                        0
                                      )
                                      .toLocaleString()}
                                  </Text>
                                  <Text
                                    size="xs"
                                    className="dashboard-text-muted"
                                  >
                                    clicks
                                  </Text>
                                </Stack>
                              }
                            />
                          </Center>

                          {/* Leyenda de centros */}
                          <Stack gap="xs">
                            {mapStats.mostClickedCenters
                              .slice(0, 5)
                              .map((center, index) => {
                                const total = mapStats.mostClickedCenters
                                  .slice(0, 5)
                                  .reduce(
                                    (sum, c) =>
                                      sum + parseInt(c.total_clicks || 0, 10),
                                    0
                                  );
                                const percentage =
                                  total > 0
                                    ? (parseInt(center.total_clicks || 0, 10) /
                                        total) *
                                      100
                                    : 0;

                                return (
                                  <Group
                                    key={index}
                                    justify="space-between"
                                    align="center"
                                  >
                                    <Group gap="xs">
                                      <Box
                                        w={12}
                                        h={12}
                                        style={{
                                          backgroundColor:
                                            index === 0
                                              ? "var(--dashboard-primary)"
                                              : index === 1
                                              ? "var(--mantine-color-green-5)"
                                              : index === 2
                                              ? "var(--mantine-color-orange-5)"
                                              : index === 3
                                              ? "var(--mantine-color-cyan-5)"
                                              : "var(--mantine-color-gray-5)",
                                          borderRadius: "50%",
                                        }}
                                      />
                                      <Stack gap={0} style={{ flex: 1 }}>
                                        <Text
                                          size="sm"
                                          fw={500}
                                          className="dashboard-primary"
                                          truncate
                                        >
                                          {center.center_name}
                                        </Text>
                                        <Text
                                          size="xs"
                                          className="dashboard-text-muted"
                                          truncate
                                        >
                                          {center.center_type}
                                        </Text>
                                      </Stack>
                                    </Group>
                                    <Group gap="xs" align="center">
                                      <Badge
                                        size="sm"
                                        variant="light"
                                        color={
                                          index === 0
                                            ? "brand"
                                            : index === 1
                                            ? "green"
                                            : index === 2
                                            ? "orange"
                                            : index === 3
                                            ? "cyan"
                                            : "gray"
                                        }
                                      >
                                        {center.total_clicks} clicks
                                      </Badge>
                                      <Text
                                        size="xs"
                                        fw={600}
                                        className="dashboard-primary"
                                      >
                                        {percentage.toFixed(1)}%
                                      </Text>
                                    </Group>
                                  </Group>
                                );
                              })}
                          </Stack>
                        </Stack>
                      ) : (
                        <Text
                          size="sm"
                          className="dashboard-text-muted"
                          ta="center"
                          py="md"
                        >
                          No hay datos disponibles
                        </Text>
                      )}
                    </Card>
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Card shadow="xs" p="md" radius="md" withBorder>
                      <Title 
                        order={5} 
                        mb="md" 
                        className="admin-panel-subtitle"
                        style={{ 
                          fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                          color: "#2d3748",
                          fontWeight: 500
                        }}
                      >
                        Búsquedas Más Frecuentes
                      </Title>
                      <Stack gap="xs">
                        {mapStats.topSearches
                          .slice(0, 5)
                          .map((search, index) => (
                            <Group key={index} justify="space-between">
                              <Text size="sm" fw={500}>
                                &quot;{search.search_query}&quot;
                              </Text>
                              <Badge size="sm" variant="light">
                                {search.search_count}
                              </Badge>
                            </Group>
                          ))}
                        {mapStats.topSearches.length === 0 && (
                          <Text size="sm" c="dimmed" ta="center">
                            No hay búsquedas registradas
                          </Text>
                        )}
                      </Stack>
                    </Card>
                  </Grid.Col>
                </Grid>
              )}

              {/* Botón para ir a analytics detallado */}
              {!mapStatsLoading && mapStats && (
                <Group justify="center" mt="lg">
                  <Button
                    variant="gradient"
                    gradient={{ from: "blue", to: "cyan" }}
                    size="md"
                    leftSection={<IconChevronRight size={16} />}
                    onClick={() => router.push("/admin/mapas-analytics")}
                  >
                    Ver Métricas Completas del Mapa
                  </Button>
                </Group>
              )}
            </Paper>

            {/* Navegación a Analytics Detallados */}
            <Paper withBorder p="md" className="dashboard-card">
              <Group justify="space-between" align="center" mb="md">
                <Box>
                  <Title
                    order={3}
                    size="h4"
                    className="admin-panel-title"
                    style={{ 
                      fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                      color: "#2d3748",
                      fontWeight: 600
                    }}
                  >
                    Análisis Avanzados
                  </Title>
                  <Text size="sm" className="dashboard-text-muted">
                    Accede a métricas detalladas adicionales
                  </Text>
                </Box>
                <Badge variant="light" color="brand">
                  Herramientas avanzadas
                </Badge>
              </Group>

              {/* Botones de navegación */}
              <SimpleGrid cols={{ base: 1, md: 2, lg: 4 }} spacing="md">
                <Card
                  shadow="md"
                  p="lg"
                  radius="md"
                  withBorder
                  className="blue-gradient-card"
                  style={{
                    cursor: "pointer",
                    background:
                      "linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #1d4ed8 100%)",
                    color: "white",
                  }}
                  onClick={() => router.push("/admin/trafico-web-detallado")}
                >
                  <Group justify="space-between" mb="md">
                    <ThemeIcon
                      size="xl"
                      color="white"
                      variant="light"
                      style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                    >
                      <IconGraph size={28} color="white" />
                    </ThemeIcon>
                    <ActionIcon
                      variant="light"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.2)",
                        color: "white",
                      }}
                      size="sm"
                    >
                      <IconChevronRight size={16} />
                    </ActionIcon>
                  </Group>

                  <Title
                    order={4}
                    size="h5"
                    mb="xs"
                    style={{ color: "white !important", fontWeight: 600 }}
                  >
                    🌐 Análisis Detallado de Tráfico
                  </Title>
                  <Text
                    size="sm"
                    style={{ color: "rgba(255,255,255,0.8)" }}
                    mb="md"
                  >
                    Visualización completa: horarios pico, dispositivos,
                    navegación, tendencias temporales y métricas avanzadas
                  </Text>

                  <Group gap="xs">
                    <Badge
                      variant="light"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.2)",
                        color: "white",
                      }}
                      size="xs"
                    >
                      Visitas totales
                    </Badge>
                    <Badge
                      variant="light"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.2)",
                        color: "white",
                      }}
                      size="xs"
                    >
                      Dispositivos
                    </Badge>
                    <Badge
                      variant="light"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.2)",
                        color: "white",
                      }}
                      size="xs"
                    >
                      Horarios pico
                    </Badge>
                  </Group>
                </Card>

                <Card
                  shadow="md"
                  p="lg"
                  radius="md"
                  withBorder
                  className="blue-gradient-card"
                  style={{
                    cursor: "pointer",
                    background:
                      "linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #1d4ed8 100%)",
                    color: "white",
                  }}
                  onClick={() => router.push("/admin/analytics-secciones")}
                >
                  <Group justify="space-between" mb="md">
                    <ThemeIcon
                      size="xl"
                      color="white"
                      variant="light"
                      style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                    >
                      <IconWorldWww size={28} color="white" />
                    </ThemeIcon>
                    <ActionIcon
                      variant="light"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.2)",
                        color: "white",
                      }}
                      size="sm"
                    >
                      <IconChevronRight size={16} />
                    </ActionIcon>
                  </Group>

                  <Title
                    order={4}
                    size="h5"
                    mb="xs"
                    style={{ color: "white !important", fontWeight: 600 }}
                  >
                    📊 Secciones Más Visitadas
                  </Title>
                  <Text
                    size="sm"
                    style={{ color: "rgba(255,255,255,0.8)" }}
                    mb="md"
                  >
                    Descubre qué páginas generan más interés y cómo los usuarios
                    navegan por el sitio
                  </Text>

                  <Group gap="xs">
                    <Badge
                      variant="light"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.2)",
                        color: "white",
                      }}
                      size="xs"
                    >
                      Ranking páginas
                    </Badge>
                    <Badge
                      variant="light"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.2)",
                        color: "white",
                      }}
                      size="xs"
                    >
                      Rutas populares
                    </Badge>
                    <Badge
                      variant="light"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.2)",
                        color: "white",
                      }}
                      size="xs"
                    >
                      Comportamiento
                    </Badge>
                  </Group>
                </Card>

                <Card
                  shadow="md"
                  p="lg"
                  radius="md"
                  withBorder
                  className="blue-gradient-card"
                  style={{
                    cursor: "pointer",
                    background:
                      "linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #1d4ed8 100%)",
                    color: "white",
                  }}
                  onClick={() => router.push("/admin/analytics-mobile")}
                >
                  <Group justify="space-between" mb="md">
                    <ThemeIcon
                      size="xl"
                      color="white"
                      variant="light"
                      style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                    >
                      <IconDeviceMobile size={28} color="white" />
                    </ThemeIcon>
                    <ActionIcon
                      variant="light"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.2)",
                        color: "white",
                      }}
                      size="sm"
                    >
                      <IconChevronRight size={16} />
                    </ActionIcon>
                  </Group>

                  <Title
                    order={4}
                    size="h5"
                    mb="xs"
                    style={{ color: "white !important", fontWeight: 600 }}
                  >
                    📱 Comportamiento Móvil
                  </Title>
                  <Text
                    size="sm"
                    style={{ color: "rgba(255,255,255,0.8)" }}
                    mb="md"
                  >
                    Métricas específicas para usuarios móviles: patrones,
                    horarios y páginas más visitadas desde Celular
                  </Text>

                  <Group gap="xs">
                    <Badge
                      variant="light"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.2)",
                        color: "white",
                      }}
                      size="xs"
                    >
                      Móvil + Tablet
                    </Badge>
                    <Badge
                      variant="light"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.2)",
                        color: "white",
                      }}
                      size="xs"
                    >
                      Horarios pico
                    </Badge>
                    <Badge
                      variant="light"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.2)",
                        color: "white",
                      }}
                      size="xs"
                    >
                      UX móvil
                    </Badge>
                  </Group>
                </Card>

                <Card
                  shadow="md"
                  p="lg"
                  radius="md"
                  withBorder
                  className="blue-gradient-card"
                  style={{
                    cursor: "pointer",
                    background:
                      "linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #1d4ed8 100%)",
                    color: "white",
                  }}
                  onClick={() => router.push("/admin/analytics-temporal")}
                >
                  <Group justify="space-between" mb="md">
                    <ThemeIcon
                      size="xl"
                      color="white"
                      variant="light"
                      style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                    >
                      <IconClock size={28} color="white" />
                    </ThemeIcon>
                    <ActionIcon
                      variant="light"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.2)",
                        color: "white",
                      }}
                      size="sm"
                    >
                      <IconChevronRight size={16} />
                    </ActionIcon>
                  </Group>

                  <Title
                    order={4}
                    size="h5"
                    mb="xs"
                    style={{ color: "white !important", fontWeight: 600 }}
                  >
                    ⏰ Análisis Temporal
                  </Title>
                  <Text
                    size="sm"
                    style={{ color: "rgba(255,255,255,0.8)" }}
                    mb="md"
                  >
                    Patrones horarios, mapas de calor semanales, tendencias y
                    proyecciones temporales avanzadas
                  </Text>

                  <Group gap="xs">
                    <Badge
                      variant="light"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.2)",
                        color: "white",
                      }}
                      size="xs"
                    >
                      Mapa de calor
                    </Badge>
                    <Badge
                      variant="light"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.2)",
                        color: "white",
                      }}
                      size="xs"
                    >
                      Tendencias
                    </Badge>
                    <Badge
                      variant="light"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.2)",
                        color: "white",
                      }}
                      size="xs"
                    >
                      Proyecciones
                    </Badge>
                  </Group>
                </Card>
              </SimpleGrid>
            
            </Paper>
          </Stack>
        </Container>
      </Box>
    </>
  );
}
