import React, { useState, useEffect } from "react";
import {
  Paper,
  Title,
  Text,
  Group,
  SimpleGrid,
  Card,
  ThemeIcon,
  Stack,
  RingProgress,
  Center,
  Progress,
  Badge,
  Divider,
  Box,
  Button,
  Alert,
} from "@mantine/core";
import LoadingScreen from "../LoadingScreen";
import {
  IconUsers,
  IconEye,
  IconDeviceDesktop,
  IconDeviceMobile,
  IconClock,
  IconTrendingUp,
  IconCalendarStats,
  IconWorld,
  IconInfoCircle,
  IconChartBar,
} from "@tabler/icons-react";
import { useRouter } from "next/router";

const SiteAnalytics = () => {
  const router = useRouter();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener datos de los últimos 30 días
      const response = await fetch("/api/analytics/page-visits?days=30");
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      // La API devuelve { success: true, data: {...} }
      setAnalytics(data.data || data);
    } catch (error) {
      console.error("Error loading analytics:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num?.toString() || "0";
  };

  const getDeviceData = () => {
    if (!analytics?.generalStats) {
      return [];
    }

    const generalStats = analytics.generalStats;
    
    // Convertir a números enteros para asegurar cálculos correctos
    const mobile_visits = parseInt(generalStats.mobile_visits) || 0;
    const desktop_visits = parseInt(generalStats.desktop_visits) || 0;
    const tablet_visits = parseInt(generalStats.tablet_visits) || 0;
    
    const total = mobile_visits + desktop_visits + tablet_visits;
    if (total === 0) {
      return [];
    }

    const result = [
      {
        label: "Celular",
        value: mobile_visits,
        percentage: Math.round((mobile_visits / total) * 100),
        color: "#fd7e14", // naranja para móvil
      },
      {
        label: "Computadora", 
        value: desktop_visits,
        percentage: Math.round((desktop_visits / total) * 100),
        color: "#1c7ed6", // azul para desktop
      },
      {
        label: "Tablet",
        value: tablet_visits,
        percentage: Math.round((tablet_visits / total) * 100),
        color: "#51cf66", // verde para tablet
      },
    ].filter((d) => d.value > 0);  
    
    return result;
  };

  const getTopPages = () => {
    if (!analytics?.popularPages) return [];
    return analytics.popularPages.slice(0, 5);
  };

  if (loading) {
    return (
      <Paper withBorder p="md" style={{ minHeight: 200 }}>
        <LoadingScreen
          message="Cargando métricas generales del sitio..."
          backHref={null}
          backText={null}
        />
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper withBorder p="md">
        <Alert
          icon={<IconInfoCircle size={16} />}
          title="Error al cargar las Métricas"
          color="red"
        >
          {error}
          <Button size="xs" variant="light" onClick={loadAnalytics} mt="sm">
            Reintentar
          </Button>
        </Alert>
      </Paper>
    );
  }

  const deviceData = getDeviceData();
  const topPages = getTopPages();
  const stats = analytics?.generalStats || {};

  return (
    <Paper withBorder p="md" className="dashboard-card">
      <Group justify="space-between" align="center" mb="lg">
        <Box>
          <Title order={3} size="h4" className="dashboard-section-title">
            📊 Métricas Generales
          </Title>
          <Text size="sm" className="dashboard-text-muted">
            {analytics?.period || "Últimos 30 días"} • Actualizado:{" "}
            {analytics?.lastUpdated
              ? new Date(analytics.lastUpdated).toLocaleDateString("es-ES")
              : "Ahora"}
          </Text>
        </Box>       
      </Group>

      {/* Métricas principales */}
      <SimpleGrid cols={{ base: 2, sm: 4 }} mb="xl">
        <Card withBorder p="lg" radius="md" className="dashboard-card">
          <Stack align="center" gap="md">
            <ThemeIcon size="xxl" variant="gradient" gradient={{ from: "#1b436b", to: "cyan" }}>
              <IconEye size={32} />
            </ThemeIcon>
            <Text 
              size="lg"
              ta="center" 
              fw={600}
              style={{ 
                background: "linear-gradient(135deg, #1b436b 0%, cyan 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text"
              }}
            >
              Visitas Totales
            </Text>
            <Text 
              size="3rem" 
              fw={800} 
              ta="center" 
              style={{ 
                lineHeight: 1.1,
                background: "linear-gradient(135deg, #1b436b 0%, cyan 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text"
              }}
            >
              {formatNumber(stats.total_visits)}
            </Text>
          </Stack>
        </Card>

        <Card withBorder p="lg" radius="md" className="dashboard-card">
          <Stack align="center" gap="md">
            <ThemeIcon size="xxl" variant="gradient" gradient={{ from: "#1b436b", to: "cyan" }}>
              <IconUsers size={32} />
            </ThemeIcon>
            <Text 
              size="lg"
              ta="center" 
              fw={600}
              style={{ 
                background: "linear-gradient(135deg, #1b436b 0%, cyan 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text"
              }}
            >
              Visitantes Únicos
            </Text>
            <Text
              size="3rem"
              fw={800}
              ta="center"
              style={{ 
                lineHeight: 1.1,
                background: "linear-gradient(135deg, #1b436b 0%, cyan 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text"
              }}
            >
              {formatNumber(stats.unique_visitors)}
            </Text>
          </Stack>
        </Card>

        <Card withBorder p="lg" radius="md" className="dashboard-card">
          <Stack align="center" gap="md">
            <ThemeIcon size="xxl" variant="gradient" gradient={{ from: "#1b436b", to: "cyan" }}>
              <IconCalendarStats size={32} />
            </ThemeIcon>
            <Text 
              size="lg"
              ta="center" 
              fw={600}
              style={{ 
                background: "linear-gradient(135deg, #1b436b 0%, cyan 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text"
              }}
            >
              Días Activos
            </Text>
            <Text 
              size="3rem" 
              fw={800} 
              ta="center" 
              style={{ 
                lineHeight: 1.1,
                background: "linear-gradient(135deg, #1b436b 0%, cyan 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text"
              }}
            >
              {stats.active_days || 0}
            </Text>
          </Stack>
        </Card>
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        {/* Distribución por dispositivos */}
        <Card withBorder p="md" radius="md" className="dashboard-card">
          <Group justify="space-between" mb="md">
            <Text fw={500} size="sm" className="dashboard-primary">
              Distribución por Dispositivos
            </Text>
            <ThemeIcon size="sm" variant="light" color="brand">
              <IconDeviceDesktop size={14} />
            </ThemeIcon>
          </Group>

          {deviceData.length > 0 ? (
            <Stack gap="md">
              <Center>
                <RingProgress
                  size={320}
                  thickness={52}
                  sections={deviceData.map((d) => ({
                    value: d.percentage,
                    color: d.color,
                    tooltip: `${d.label}: ${d.percentage}%`,
                  }))}
                  label={
                    <Stack align="center" gap="xs">
                      <Text size="xs" c="dimmed">
                        Total
                      </Text>
                      <Text size="sm" fw={700}>
                        {formatNumber(
                          deviceData.reduce((sum, d) => sum + d.value, 0)
                        )}
                      </Text>
                    </Stack>
                  }
                />
              </Center>

              <Stack gap="xs">
                {deviceData.map((device, index) => (
                  <Group key={index} justify="space-between">
                    <Group gap="xs">
                      <Box
                        w={12}
                        h={12}
                        style={{
                          backgroundColor: device.color,
                          borderRadius: "50%",
                        }}
                      />
                      <Text size="sm">{device.label}</Text>
                    </Group>
                    <Group gap="xs">
                      <Text size="sm" fw={500}>
                        {device.percentage}%
                      </Text>
                      <Text size="xs" c="dimmed">
                        ({device.value})
                      </Text>
                    </Group>
                  </Group>
                ))}
              </Stack>
            </Stack>
          ) : (
            <Text ta="center" c="dimmed" py="md">
              No hay datos de dispositivos
            </Text>
          )}
        </Card>

        {/* Páginas más visitadas */}
        <Card withBorder p="md" radius="md" className="dashboard-card">
          <Group justify="space-between" mb="md">
            <Text fw={500} size="sm" className="dashboard-primary">
              Páginas Más Visitadas
            </Text>
            <ThemeIcon size="sm" variant="light" color="brand">
              <IconTrendingUp size={14} />
            </ThemeIcon>
          </Group>

          {topPages.length > 0 ? (
            <Stack gap="md">
              {/* Gráfica de torta */}
              <Center>
                <RingProgress
                  size={320}
                  thickness={36}
                  sections={topPages.map((page, index) => ({
                    value: parseFloat(page.percentage) || 0,
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
                    tooltip: `${page.page_title || page.page_path}: ${
                      parseFloat(page.percentage)?.toFixed(1) || 0
                    }%`,
                  }))}
                  label={
                    <Stack align="center" gap="xs">
                      <Text size="xs" className="dashboard-text-muted">
                        Total
                      </Text>
                      <Text size="sm" fw={700} className="dashboard-primary">
                        {topPages
                          .reduce(
                            (sum, page) =>
                              sum + parseInt(page.visit_count || 0, 10),
                            0
                          )
                          .toLocaleString()}
                      </Text>
                      <Text size="xs" className="dashboard-text-muted">
                        visitas
                      </Text>
                    </Stack>
                  }
                />
              </Center>

              {/* Leyenda de la gráfica */}
              <Stack gap="xs">
                {topPages.map((page, index) => (
                  <Group key={index} justify="space-between" align="center">
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
                        <Text size="sm" fw={500} truncate>
                          {page.page_title || page.page_path}
                        </Text>
                        <Text
                          size="xs"
                          className="dashboard-text-muted"
                          truncate
                        >
                          {page.page_path}
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
                        {page.visit_count} visitas
                      </Badge>
                      <Text size="xs" fw={600} className="dashboard-primary">
                        {parseFloat(page.percentage)?.toFixed(1) || 0}%
                      </Text>
                    </Group>
                  </Group>
                ))}
              </Stack>
            </Stack>
          ) : (
            <Text ta="center" className="dashboard-text-muted" py="md">
              No hay datos de páginas
            </Text>
          )}
        </Card>
      </SimpleGrid>

      {/* Métricas adicionales */}
      <Divider my="lg" />

      <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="md">
        <Group gap="xs">
          <ThemeIcon size="md" variant="light" color="cyan">
            <IconClock size={16} />
          </ThemeIcon>
          <Stack gap={0}>
            <Text size="sm" fw={500}>
              {stats.avg_pages_per_session || 0}
            </Text>
            <Text size="xs" c="dimmed">
              Páginas/Sesión
            </Text>
          </Stack>
        </Group>
        <Group gap="xs">
          <ThemeIcon size="md" variant="light" color="teal">
            <IconChartBar size={16} />
          </ThemeIcon>
          <Stack gap={0}>
            <Text size="sm" fw={500}>
              {Math.round((stats.total_visits || 0) / (stats.active_days || 1))}
            </Text>
            <Text size="xs" c="dimmed">
              Visitas/Día
            </Text>
          </Stack>
        </Group>
      </SimpleGrid>

      {/* Botón de análisis detallado */}
      <Box mt="lg">
        <Divider mb="md" />
        <Group justify="center">
          <Button
            variant="gradient"
            gradient={{ from: "blue", to: "cyan" }}
            leftSection={<IconChartBar size={18} />}
            onClick={() => router.push("/admin/trafico-web-detallado")}
            size="md"
          >
            📊 Ver Análisis Detallado Completo
          </Button>
        </Group>
      </Box>
    </Paper>
  );
};

export default SiteAnalytics;
