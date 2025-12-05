import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import {
  Container,
  Title,
  Text,
  Paper,
  Group,
  Button,
  SimpleGrid,
  Card,
  Badge,
  Stack,
  Box,
  Progress,
  Divider,
  Select,
  ActionIcon,
  Alert,
  Grid,
  ThemeIcon,
  Table,
  ScrollArea,
} from "@mantine/core";
import LoadingScreen from "../../components/LoadingScreen";
import DateRangeFilter from "../../components/admin/DateRangeFilter";
import {
  IconArrowLeft,
  IconRefresh,
  IconEye,
  IconUsers,
  IconDevices,
  IconClock,
  IconCalendar,
  IconWorldWww,
  IconTrendingUp,
  IconTrendingDown,
  IconEqual,
  IconDownload,
  IconFilter,
  IconInfoCircle,
  IconChartBar,
  IconDeviceDesktop,
  IconDeviceMobile,
  IconDeviceTablet,
  IconActivity,
  IconLink,
  IconExternalLink,
  IconRoute,
  IconBrowser,
  IconStar,
} from "@tabler/icons-react";

export default function AnalyticsSecciones() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [visitStats, setVisitStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("30");
  const [refreshing, setRefreshing] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isDateRangeActive, setIsDateRangeActive] = useState(false);

  // Verificar autenticación y permisos
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

      // Usuario válido, cargar datos
      loadVisitStats();
    }
  }, [session, status]);

  // Cargar datos cuando cambie el rango de tiempo o las fechas personalizadas
  useEffect(() => {
    if (session?.user && (session.user.role === 1 || session.user.role === 2)) {
      loadVisitStats();
    }
  }, [timeRange, isDateRangeActive, startDate, endDate]);

  const loadVisitStats = async () => {
    try {
      setLoading(true);
      setError(null);

      let url = "/api/analytics/page-visits";
      const params = new URLSearchParams();

      if (isDateRangeActive && startDate && endDate) {
        // Usar fechas personalizadas
        params.append("startDate", startDate.toISOString().split("T")[0]);
        params.append("endDate", endDate.toISOString().split("T")[0]);
      } else {
        // Usar rango predefinido
        params.append("days", timeRange);
      }

      url += "?" + params.toString();

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // La API devuelve { success: true, data: {...} }
      if (result.success && result.data) {
        setVisitStats(result.data);
      } else {
        throw new Error("Invalid API response format");
      }
    } catch (error) {
      console.error("Error loading visit stats:", error);
      setError(error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadVisitStats();
  };

  // Manejar cambio de rango de fechas personalizadas
  const handleDateRangeChange = (start, end) => {
    setStartDate(start);
    setEndDate(end);
    setIsDateRangeActive(true);
    // Desactivar timeRange cuando se usa rango personalizado
    setTimeRange("");
  };

  // Limpiar filtro de fechas
  const handleClearDateRange = () => {
    setStartDate(null);
    setEndDate(null);
    setIsDateRangeActive(false);
    // Volver al timeRange por defecto
    setTimeRange("30");
  };

  if (status === "loading" || loading) {
    return (
      <LoadingScreen
        message="Cargando métricas de secciones más visitadas..."
        backHref="/admin/dashboard"
        backText="Volver al Dashboard"
      />
    );
  }

  if (error) {
    return (
      <Container size="lg" py="xl">
        <Alert
          icon={<IconInfoCircle size={16} />}
          title="Error al cargar datos"
          color="red"
          variant="light"
        >
          {error}
          <Group mt="md">
            <Button size="sm" onClick={loadVisitStats}>
              Reintentar
            </Button>
            <Button
              variant="light"
              size="sm"
              onClick={() => router.push("/admin/dashboard")}
            >
              Volver al Tablero
            </Button>
          </Group>
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" py="md">
      {/* Header */}
      <Paper withBorder p="lg" mb="md">
        <Group justify="space-between" align="center">
          <Group gap="md">
            <ActionIcon
              variant="light"
              size="lg"
              onClick={() => router.push("/admin/dashboard")}
            >
              <IconArrowLeft size={18} />
            </ActionIcon>
            <Box>
              <Title order={1} size="h2">
                Secciones Más Visitadas
              </Title>
              <Text c="dimmed" size="sm">
                Análisis detallado de páginas populares y patrones de navegación
              </Text>
            </Box>
          </Group>

          <Group gap="sm">
            <Select
              data={[
                { value: "7", label: "Últimos 7 días" },
                { value: "30", label: "Últimos 30 días" },
                { value: "90", label: "Últimos 90 días" },
              ]}
              value={timeRange}
              onChange={(value) => {
                if (value) {
                  // Primero limpiar las fechas personalizadas
                  setStartDate(null);
                  setEndDate(null);
                  setIsDateRangeActive(false);
                  // Luego aplicar el nuevo timeframe
                  setTimeRange(value);
                }
              }}
              size="sm"
              leftSection={<IconFilter size={16} />}
              disabled={isDateRangeActive}
            />
            
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onDateChange={handleDateRangeChange}
              onClear={handleClearDateRange}
              disabled={loading}
            />
            
            <ActionIcon
              variant="light"
              loading={refreshing}
              onClick={refreshData}
              size="lg"
            >
              <IconRefresh size={18} />
            </ActionIcon>
          </Group>
        </Group>
      </Paper>

      {visitStats && visitStats.popularPages && (
        <>
          {/* Resumen de Páginas */}
          <Paper withBorder p="lg" mb="md">
            <Title order={2} size="h3" mb="md">
              Resumen de Páginas Populares
            </Title>
            <SimpleGrid cols={{ base: 2, md: 4 }} spacing="lg">
              <Card shadow="sm" p="lg" radius="md" withBorder bg="grape.0">
                <Group justify="space-between" mb="xs">
                  <Text size="sm" fw={600} c="grape">
                    Total de Páginas
                  </Text>
                  <ThemeIcon variant="light" color="grape" size="sm">
                    <IconWorldWww size={16} />
                  </ThemeIcon>
                </Group>
                <Text fw={700} size="xl">
                  {visitStats.popularPages.length}
                </Text>
                <Text size="xs" c="dimmed">
                  Páginas con tráfico
                </Text>
              </Card>

              <Card shadow="sm" p="lg" radius="md" withBorder bg="blue.0">
                <Group justify="space-between" mb="xs">
                  <Text size="sm" fw={600} c="blue">
                    Página #1
                  </Text>
                  <ThemeIcon variant="light" color="blue" size="sm">
                    <IconStar size={16} />
                  </ThemeIcon>
                </Group>
                <Text fw={700} size="lg" lineClamp={1}>
                  {visitStats.popularPages[0]?.page_title || "N/A"}
                </Text>
                <Text size="xs" c="dimmed">
                  {visitStats.popularPages[0]?.visit_count.toLocaleString() ||
                    "0"}{" "}
                  visitas
                </Text>
              </Card>

              <Card shadow="sm" p="lg" radius="md" withBorder bg="green.0">
                <Group justify="space-between" mb="xs">
                  <Text size="sm" fw={600} c="green">
                    Concentración Top 3
                  </Text>
                  <ThemeIcon variant="light" color="green" size="sm">
                    <IconChartBar size={16} />
                  </ThemeIcon>
                </Group>
                <Text fw={700} size="xl">
                  {visitStats.popularPages
                    .slice(0, 3)
                    .reduce(
                      (acc, page) => acc + parseFloat(page.percentage || 0),
                      0
                    )
                    .toFixed(1)}
                  %
                </Text>
                <Text size="xs" c="dimmed">
                  Del tráfico total
                </Text>
              </Card>

              <Card shadow="sm" p="lg" radius="md" withBorder bg="orange.0">
                <Group justify="space-between" mb="xs">
                  <Text size="sm" fw={600} c="orange">
                    Diversidad
                  </Text>
                  <ThemeIcon variant="light" color="orange" size="sm">
                    <IconActivity size={16} />
                  </ThemeIcon>
                </Group>
                <Text fw={700} size="xl">
                  {
                    visitStats.popularPages.filter(
                      (page) => parseFloat(page.percentage) > 5
                    ).length
                  }
                </Text>
                <Text size="xs" c="dimmed">
                  Páginas con &gt;5% tráfico
                </Text>
              </Card>
            </SimpleGrid>
          </Paper>

          {/* Tabla Completa de Páginas */}
          <Paper withBorder p="lg" mb="md">
            <Group justify="space-between" mb="md">
              <Title order={2} size="h3">
                Listado Completo de Páginas
              </Title>
              <Badge variant="light" color="blue">
                {visitStats.popularPages.length} páginas totales
              </Badge>
            </Group>

            <ScrollArea>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Ranking</Table.Th>
                    <Table.Th>Página</Table.Th>
                    <Table.Th>Ruta</Table.Th>
                    <Table.Th>Visitas</Table.Th>
                    <Table.Th>Únicos</Table.Th>
                    <Table.Th>%</Table.Th>
                    <Table.Th>Móvil</Table.Th>
                    <Table.Th>Escritorio</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {visitStats.popularPages.map((page, index) => (
                    <Table.Tr key={index}>
                      <Table.Td>
                        <Badge
                          size="sm"
                          variant={index < 3 ? "filled" : "light"}
                          color={
                            index === 0
                              ? "yellow"
                              : index === 1
                              ? "gray"
                              : index === 2
                              ? "orange"
                              : "grape"
                          }
                        >
                          #{index + 1}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={500} lineClamp={1}>
                          {page.page_title || "Sin título"}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Text size="xs" ff="monospace" c="dimmed">
                            {page.page_path}
                          </Text>
                          <ActionIcon
                            variant="subtle"
                            color="grape"
                            size="xs"
                            onClick={() =>
                              window.open(page.page_path, "_blank")
                            }
                          >
                            <IconExternalLink size={10} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={500}>
                          {page.visit_count.toLocaleString()}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{page.unique_visitors}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge size="sm" color="grape" variant="light">
                          {page.percentage}%
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="orange">
                          {page.mobile_visits || 0}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="blue">
                          {page.desktop_visits || 0}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Paper>

          {/* Análisis de Comportamiento */}
          <Paper withBorder p="lg">
            <Title order={2} size="h3" mb="md">
              Análisis de Comportamiento
            </Title>
            <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
              
              <Card shadow="sm" p="md" radius="md" withBorder>
                <Title order={4} size="h5" mb="md" c="green">
                  Páginas Públicas
                </Title>
                <Stack gap="sm">
                  {visitStats.popularPages
                    .filter(
                      (page) =>
                        !page.page_path.includes("/admin") &&
                        !page.page_path.includes("/api")
                    )
                    .slice(0, 5)
                    .map((page, index) => (
                      <Group key={index} justify="space-between">
                        <Text size="sm" lineClamp={1}>
                          {page.page_title || page.page_path}
                        </Text>
                        <Badge size="xs" color="green">
                          {page.visit_count}
                        </Badge>
                      </Group>
                    ))}
                </Stack>
              </Card>

              <Card shadow="sm" p="md" radius="md" withBorder>
                <Title order={4} size="h5" mb="md" c="orange">
                  Estadísticas Clave
                </Title>
                <Stack gap="md">
                  <Box>
                    <Text size="xs" c="dimmed" mb="xs">
                      PÁGINAS CON MÁS DE 10% TRÁFICO
                    </Text>
                    <Text fw={700} size="lg" c="orange">
                      {
                        visitStats.popularPages.filter(
                          (page) => parseFloat(page.percentage) > 10
                        ).length
                      }
                    </Text>
                  </Box>

                  <Box>
                    <Text size="xs" c="dimmed" mb="xs">
                      PROMEDIO VISITAS/PÁGINA
                    </Text>
                    <Text fw={700} size="lg" c="orange">
                      {visitStats.generalStats?.total_visits && visitStats.generalStats?.unique_pages
                        ? Math.round(
                            parseInt(visitStats.generalStats.total_visits) / 
                            parseInt(visitStats.generalStats.unique_pages)
                          )
                        : 0}
                    </Text>
                  </Box>

                  <Box>
                    <Text size="xs" c="dimmed" mb="xs">
                      TASA DE CONCENTRACIÓN
                    </Text>
                    <Text fw={700} size="lg" c="orange">
                      {visitStats.popularPages.length > 0
                        ? `${(
                            ((visitStats.popularPages[0]?.percentage || 0) /
                              100) *
                            visitStats.popularPages.length
                          ).toFixed(1)}x`
                        : "0x"}
                    </Text>
                  </Box>
                </Stack>
              </Card>
            </SimpleGrid>
          </Paper>
        </>
      )}
    </Container>
  );
}
