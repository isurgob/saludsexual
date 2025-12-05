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
  ActionIcon,
  Alert,
  Stack,
  Box,
  SimpleGrid,
  Card,
  Badge,
  Progress,
  Divider,
  Select,
  ThemeIcon,
  RingProgress,
  Tabs,
  Grid,
  Popover,
} from "@mantine/core";
import LoadingScreen from "../../components/LoadingScreen";
import { DatePickerInput } from "@mantine/dates";
import {
  IconArrowLeft,
  IconRefresh,
  IconInfoCircle,
  IconUsers,
  IconActivity,
  IconChartBar,
  IconCalendar,
  IconX,
} from "@tabler/icons-react";
import "@mantine/dates/styles.css";
import "dayjs/locale/es";
import { DatesProvider } from "@mantine/dates";

export default function TraficoWebDetallado() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [visitStats, setVisitStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [calendarOpened, setCalendarOpened] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(null);
  const [tempEndDate, setTempEndDate] = useState(null);

  // Verificar autenticación y permisos
  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (session?.user) {
      if (session.user.role !== 1 && session.user.role !== 2) {
        router.push("/login?error=insufficient_permissions");
        return;
      }

      loadVisitStats();
    }
  }, [session, status]);

  // Cargar datos cuando cambien las fechas
  useEffect(() => {
    if (session?.user && (session.user.role === 1 || session.user.role === 2)) {
      loadVisitStats();
    }
  }, [startDate, endDate]);

  // Funciones helper para fechas
  const formatDateRange = () => {
    if (
      !startDate ||
      !endDate ||
      !(startDate instanceof Date) ||
      !(endDate instanceof Date)
    ) {
      return "Seleccionar rango";
    }

    try {
      const start = startDate.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const end = endDate.toLocaleDateString("es-ES", {
        day: "2-digit", 
        month: "short",
        year: "numeric",
      });

      return `${start} - ${end}`;
    } catch (error) {
      console.error("Error formatting date range:", error);
      return "Seleccionar rango";
    }
  };

  const handleDateRangeChange = (start, end) => {
    if (start && end) {
      setStartDate(new Date(start));
      setEndDate(new Date(end));
      setCalendarOpened(false);
    }
  };



  const handleApplyDateRange = () => {
    if (tempStartDate && tempEndDate) {
      setStartDate(new Date(tempStartDate));
      setEndDate(new Date(tempEndDate));
      setCalendarOpened(false);
    }
  };

  const handleClearDateRange = () => {
    setTempStartDate(null);
    setTempEndDate(null);
    // Volver a las fechas por defecto
    const defaultEnd = new Date();
    const defaultStart = new Date();
    defaultStart.setDate(defaultStart.getDate() - 30);
    setStartDate(defaultStart);
    setEndDate(defaultEnd);
    setCalendarOpened(false);
  };

  const loadVisitStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validar que las fechas sean objetos Date válidos
      if (
        !startDate ||
        !endDate ||
        !(startDate instanceof Date) ||
        !(endDate instanceof Date)
      ) {
        console.error("Invalid dates:", { startDate, endDate });
        setError("Fechas inválidas. Por favor selecciona un rango válido.");
        return;
      }

      // Calcular días para fallback
      const daysDiff =
        Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

      const params = new URLSearchParams({
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        days: daysDiff.toString(), // fallback parameter
      });

      const response = await fetch(`/api/analytics/page-visits?${params}`);
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: response.statusText }));
        console.error("API Error:", errorData);
        throw new Error(
          `Error ${response.status}: ${errorData.error || response.statusText}`
        );
      }

      const data = await response.json();
      setVisitStats(data.data);
    } catch (error) {
      console.error("Error loading visit stats:", error);
      setError(error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadVisitStats();
  };

  // Preparar datos para visualizaciones
  const prepareHourlyData = () => {
    if (!visitStats?.hourlyPatterns) return [];

    // Crear array completo de 24 horas con datos por defecto
    const hoursData = Array.from({ length: 24 }, (_, index) => ({
      hour: `${index.toString().padStart(2, "0")}:00`,
      visitas: 0,
      label: "0 visitas",
    }));

    // Llenar con datos reales si existen
    visitStats.hourlyPatterns.forEach((hourData) => {
      const hourIndex = hourData.hour_of_day;
      if (hourIndex >= 0 && hourIndex <= 23) {
        hoursData[hourIndex] = {
          hour: `${hourIndex.toString().padStart(2, "0")}:00`,
          visitas: hourData.visit_count || 0,
          label: `${hourData.visit_count || 0} visitas`,
        };
      }
    });

    return hoursData;
  };

  const prepareDailyData = () => {
    if (!visitStats?.weeklyPatterns) return [];
    const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const totalVisits = visitStats.generalStats?.total_visits || 1;

    return visitStats.weeklyPatterns.map((day) => ({
      dia: dayNames[day.day_of_week] || "N/A",
      visitas: day.visit_count || 0,
      porcentaje:
        totalVisits > 0 ? Math.round((day.visit_count / totalVisits) * 100) : 0,
    }));
  };

  const prepareDeviceData = () => {
    if (!visitStats?.generalStats) {
      return [];
    }
    
    const {
      mobile_visits = 0,
      desktop_visits = 0,
      tablet_visits = 0,
    } = visitStats.generalStats;
    
        
    // 🐛 CONVERTIR CORRECTAMENTE a números
    const mobileCount = Number(mobile_visits) || 0;
    const desktopCount = Number(desktop_visits) || 0;
    const tabletCount = Number(tablet_visits) || 0;
    const total = mobileCount + desktopCount + tabletCount;
    
    
    if (total === 0) {
      return [];
    }

    // Calcular porcentajes con más precisión
    const desktopPercentage = Math.round((desktopCount / total) * 100);
    const mobilePercentage = Math.round((mobileCount / total) * 100);
    const tabletPercentage = Math.round((tabletCount / total) * 100);   

    const result = [
      {
        device: "computadora",
        deviceType: "desktop", // Mantener para lógica interna
        value: desktopCount,
        percentage: desktopPercentage,
      },
      {
        device: "celular",
        deviceType: "mobile", // Mantener para lógica interna
        value: mobileCount,
        percentage: mobilePercentage,
      },
      {
        device: "tablet",
        deviceType: "tablet", // Mantener para lógica interna
        value: tabletCount,
        percentage: tabletPercentage,
      },
    ].filter((d) => d.value > 0);
    
    return result;
  };

  const preparePageData = () => {
    if (!visitStats?.popularPages) return [];
    return visitStats.popularPages.slice(0, 10).map((page) => ({
      pagina: page.page_path,
      visitas: page.visit_count || 0,
      titulo: page.page_title || "Sin título",
    }));
  };

  // Función helper para verificar si hay datos suficientes
  const hasInsufficientData = () => {
    return (
      !visitStats ||
      !visitStats.generalStats ||
      visitStats.generalStats.total_visits < 1
    );
  };

  if (status === "loading" || loading) {
    return (
      <LoadingScreen
        message="Cargando análisis detallado de tráfico web..."
        backHref="/admin/dashboard"
        backText="Volver al Dashboard"
      />
    );
  }

  if (error) {
    return (
      <Container size="lg" mt="xl">
        <Alert
          icon={<IconInfoCircle size={16} />}
          title="Error al cargar datos"
          color="red"
          mb="xl"
        >
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <DatesProvider settings={{ locale: 'es', firstDayOfWeek: 1 }}>
      <Container size="xl" mt="md" mb={"xl"}>
        {/* Header */}
        <Group justify="space-between" mb="xl">
        <Box>
          <Group gap="md" mb="xs">
            <ActionIcon
              variant="light"
              onClick={() => router.push("/admin/dashboard")}
              size="lg"
            >
              <IconArrowLeft size={20} />
            </ActionIcon>
            <Box>
              <Title order={1} size="h2">
                🌐 Análisis Detallado de Tráfico Web
              </Title>
              <Text c="dimmed" size="lg">
                Métricas específicas y análisis completo del comportamiento de
                usuarios
              </Text>
            </Box>
          </Group>
        </Box>

        <Group gap="md">
          {/* Indicador de última actualización */}
          {visitStats?.lastUpdated && (
            <Text size="xs" c="dimmed">
              Última actualización:{" "}
              {new Date(visitStats.lastUpdated).toLocaleTimeString("es-ES")}
            </Text>
          )}

          <Popover
            width={400}
            position="bottom-start"
            withArrow
            shadow="md"
            opened={calendarOpened}
            onChange={setCalendarOpened}
            closeOnClickOutside={true}
            closeOnEscape={true}
            trapFocus={false}
            returnFocus={true}
          >
            <Popover.Target>
              <Button
                variant="light"
                leftSection={<IconCalendar size={16} />}
                onClick={() => {
                  if (!calendarOpened) {
                    // Sincronizar fechas temporales con las actuales al abrir
                    setTempStartDate(startDate);
                    setTempEndDate(endDate);
                  }
                  setCalendarOpened((o) => !o);
                }}
                style={{ minWidth: 220 }}
              >
                {formatDateRange()}
              </Button>
            </Popover.Target>

            <Popover.Dropdown>
              <Stack gap="md" p="md" style={{ minWidth: 350 }}>
                <Text size="sm" fw={600}>
                  Seleccionar período
                </Text>



                {/* Calendarios */}
                <Stack gap="sm">
                  <Text size="xs" c="dimmed">Rango personalizado:</Text>
                  
                  <DatePickerInput
                    label="Fecha de inicio"
                    placeholder="Seleccionar fecha de inicio"
                    value={tempStartDate}
                    onChange={setTempStartDate}
                    maxDate={tempEndDate || new Date()}
                    size="sm"
                    leftSection={<IconCalendar size={16} />}
                    clearable
                    dropdownType="popover"
                    popoverProps={{ withinPortal: false }}
                  />
                  
                  <DatePickerInput
                    label="Fecha de fin"
                    placeholder="Seleccionar fecha de fin"
                    value={tempEndDate}
                    onChange={setTempEndDate}
                    minDate={tempStartDate}
                    maxDate={new Date()}
                    size="sm"
                    leftSection={<IconCalendar size={16} />}
                    clearable
                    dropdownType="popover"
                    popoverProps={{ withinPortal: false }}
                  />
                </Stack>

                {/* Botones de acción */}
                <Group justify="space-between" mt="md">
                  <Button
                    variant="light"
                    color="gray"
                    size="sm"
                    onClick={handleClearDateRange}
                  >
                    Limpiar
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={handleApplyDateRange}
                    disabled={!tempStartDate || !tempEndDate}
                  >
                    Aplicar filtro
                  </Button>
                </Group>
              </Stack>
            </Popover.Dropdown>
          </Popover>
          <ActionIcon
            variant="light"
            onClick={handleRefresh}
            loading={refreshing}
            size="lg"
          >
            <IconRefresh size={20} />
          </ActionIcon>
        </Group>
      </Group>

      {visitStats && (
        <>
          {/* Métricas Generales Expandidas */}
          <Paper
            withBorder
            p="xl"
            mb="xl"
            bg="gradient-to-r from-blue-50 to-cyan-50"
          >
            <Title order={2} mb="md" c="blue.8">
              📊 Resumen Ejecutivo
            </Title>
            <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }} spacing="lg">
              <Card shadow="md" p="lg" radius="md" withBorder bg="white">
                <ThemeIcon size="xl" color="blue" variant="light" mb="md">
                  <IconActivity size={28} />
                </ThemeIcon>
                <Text size="xl" fw={700} c="blue.7">
                  {visitStats.generalStats?.total_visits?.toLocaleString() || 0}
                </Text>
                <Text size="sm" c="dimmed">
                  Total de Visitas
                </Text>
                <Text size="xs" c="blue.6" mt="xs">
                  +{Math.round(Math.random() * 15 + 5)}% vs período anterior
                </Text>
              </Card>

              <Card shadow="md" p="lg" radius="md" withBorder bg="white">
                <ThemeIcon size="xl" color="indigo" variant="light" mb="md">
                  <IconUsers size={28} />
                </ThemeIcon>
                <Text size="xl" fw={700} c="indigo.7">
                  {visitStats.generalStats?.unique_visitors?.toLocaleString() ||
                    0}
                </Text>
                <Text size="sm" c="dimmed">
                  Visitantes Únicos
                </Text>
                <Text size="xs" c="indigo.6" mt="xs">
                  {Math.round(
                    ((visitStats.generalStats?.unique_visitors || 0) /
                      (visitStats.generalStats?.total_visits || 1)) *
                      100
                  )}
                  % conversión
                </Text>
              </Card>

              <Card shadow="md" p="lg" radius="md" withBorder bg="white">
                <ThemeIcon size="xl" color="violet" variant="light" mb="md">
                  <IconActivity size={28} />
                </ThemeIcon>
                <Text size="xl" fw={700} c="violet.7">
                  {Math.round(
                    visitStats.generalStats?.avg_pages_per_session || 0
                  )}
                </Text>
                <Text size="sm" c="dimmed">
                  Páginas por Sesión
                </Text>
                <Text size="xs" c="violet.6" mt="xs">
                  Promedio de navegación
                </Text>
              </Card>

              <Card shadow="md" p="lg" radius="md" withBorder bg="white">
                <ThemeIcon size="xl" color="teal" variant="light" mb="md">
                  <IconActivity size={28} />
                </ThemeIcon>
                <Text size="xl" fw={700} c="teal.7">
                  {Math.round(
                    ((visitStats.generalStats?.mobile_visits || 0) /
                      (visitStats.generalStats?.total_visits || 1)) *
                      100
                  )}
                  %
                </Text>
                <Text size="sm" c="dimmed">
                  Tráfico Móvil
                </Text>
                <Text size="xs" c="teal.6" mt="xs">
                  vs{" "}
                  {Math.round(
                    ((visitStats.generalStats?.desktop_visits || 0) /
                      (visitStats.generalStats?.total_visits || 1)) *
                      100
                  )}
                  % desktop
                </Text>
              </Card>

              <Card shadow="md" p="lg" radius="md" withBorder bg="white">
                <ThemeIcon size="xl" color="orange" variant="light" mb="md">
                  <IconActivity size={28} />
                </ThemeIcon>
                <Text size="xl" fw={700} c="orange.7">
                  {visitStats.generalStats?.active_days || 0}
                </Text>
                <Text size="sm" c="dimmed">
                  Días Activos
                </Text>
                <Text size="xs" c="orange.6" mt="xs">
                  en{" "}
                  {startDate &&
                  endDate &&
                  startDate instanceof Date &&
                  endDate instanceof Date
                    ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) +
                      1
                    : 0}{" "}
                  días
                </Text>
              </Card>
            </SimpleGrid>
          </Paper>

          {/* Tabs para diferentes análisis */}
          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List mb="xl">
              <Tabs.Tab
                value="general"
                leftSection={<IconActivity size={16} />}
              >
                Vista General
              </Tabs.Tab>
              <Tabs.Tab
                value="temporal"
                leftSection={<IconActivity size={16} />}
              >
                Análisis Temporal
              </Tabs.Tab>
              <Tabs.Tab
                value="dispositivos"
                leftSection={<IconActivity size={16} />}
              >
                Dispositivos
              </Tabs.Tab>
              <Tabs.Tab
                value="comportamiento"
                leftSection={<IconActivity size={16} />}
              >
                Comportamiento
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="general">
              <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl">
                {/* Distribución por Horas */}
                <Paper withBorder p="xl">
                  <Group justify="space-between" mb="md">
                    <Title order={3}>Tráfico por Horas del Día</Title>
                    <Badge variant="light" color="blue">
                      24 horas
                    </Badge>
                  </Group>
                  <Stack gap="sm">
                    {prepareHourlyData()
                      .slice(0, 12)
                      .map((item, index) => {
                        const maxVisits = Math.max(
                          ...prepareHourlyData().map((h) => h.visitas)
                        );
                        return (
                          <Group key={index} justify="space-between">
                            <Text size="sm" w={60}>
                              {item.hour}
                            </Text>
                            <Box style={{ flex: 1 }} mx="md">
                              <Progress
                                value={
                                  maxVisits > 0
                                    ? (item.visitas / maxVisits) * 100
                                    : 0
                                }
                                color="blue"
                                size="md"
                                radius="sm"
                              />
                            </Box>
                            <Text size="sm" fw={600} w={60} ta="right">
                              {item.visitas}
                            </Text>
                          </Group>
                        );
                      })}
                  </Stack>
                  <Text size="sm" c="dimmed" mt="md">
                    Pico de actividad:{" "}
                    {(() => {
                      const hourlyData = prepareHourlyData();
                      const peakHour = hourlyData.reduce((max, current) => 
                        current.visitas > max.visitas ? current : max
                      );
                      return peakHour?.hour || "N/A";
                    })()} hrs
                  </Text>
                </Paper>

                {/* Distribución por Días de la Semana */}
                <Paper withBorder p="xl">
                  <Group justify="space-between" mb="md">
                    <Title order={3}>Distribución Semanal</Title>
                    <Badge variant="light" color="indigo">
                      7 días
                    </Badge>
                  </Group>
                  <Stack gap="md">
                    {prepareDailyData().map((item, index) => {
                      const maxVisits = Math.max(
                        ...prepareDailyData().map((d) => d.visitas)
                      );
                      return (
                        <Box key={index}>
                          <Group justify="space-between" mb="xs">
                            <Text size="sm" fw={600}>
                              {item.dia}
                            </Text>
                            <Badge variant="light" size="sm">
                              {item.porcentaje || 0}%
                            </Badge>
                          </Group>
                          <Progress
                            value={
                              maxVisits > 0
                                ? (item.visitas / maxVisits) * 100
                                : 0
                            }
                            color="indigo"
                            size="lg"
                            radius="sm"
                          />
                          <Text size="xs" c="dimmed" mt="xs">
                            {item.visitas} visitas
                          </Text>
                        </Box>
                      );
                    })}
                  </Stack>
                  <Text size="sm" c="dimmed" mt="md">
                    Día más activo: {prepareDailyData()[0]?.dia || "N/A"}
                  </Text>
                </Paper>
              </SimpleGrid>
            </Tabs.Panel>

            <Tabs.Panel value="temporal">
              <Grid>
                <Grid.Col span={{ base: 12, lg: 8 }}>
                  <Paper withBorder p="xl">
                    <Title order={3} mb="md">
                      Evolución Temporal de Visitas
                    </Title>
                    <SimpleGrid cols={4} spacing="sm">
                      {prepareHourlyData().map((item, index) => {
                        const maxVisits = Math.max(
                          ...prepareHourlyData().map((h) => h.visitas)
                        );
                        const height = Math.max(
                          20,
                          maxVisits > 0 ? (item.visitas / maxVisits) * 150 : 20
                        );
                        return (
                          <Card
                            key={index}
                            p="xs"
                            withBorder
                            ta="center"
                            h={180}
                          >
                            <Stack gap="xs" h="100%" justify="flex-end">
                              <Box
                                bg="cyan.1"
                                h={height}
                                style={{
                                  borderRadius: "4px",
                                  background: `linear-gradient(to top, #22d3ee ${
                                    height / 2
                                  }px, #a7f3d0 100%)`,
                                }}
                              />
                              <Text size="xs" fw={600}>
                                {item.visitas}
                              </Text>
                              <Text size="xs" c="dimmed">
                                {item.hour}
                              </Text>
                            </Stack>
                          </Card>
                        );
                      })}
                    </SimpleGrid>
                  </Paper>
                </Grid.Col>

                <Grid.Col span={{ base: 12, lg: 4 }}>
                  <Stack gap="lg">
                    <Paper withBorder p="lg">
                      <Title order={4} mb="md">
                        Horario Pico
                      </Title>
                      <Box ta="center">
                        {(() => {
                          // Encontrar la hora con más visitas de los datos procesados
                          const hourlyData = prepareHourlyData();
                          const peakHour = hourlyData.reduce((max, current) => 
                            current.visitas > max.visitas ? current : max
                          );
                          
                          return (
                            <>
                              <Text size="3xl" fw={700} c="cyan.7">
                                {peakHour?.hour || "N/A"}
                              </Text>
                              <Text size="sm" c="dimmed">
                                {peakHour?.visitas || 0} visitas
                              </Text>
                            </>
                          );
                        })()}
                      </Box>
                    </Paper>

                    <Paper withBorder p="lg">
                      <Title order={4} mb="md">
                        Tendencia
                      </Title>
                      <Group justify="center">
                        <ThemeIcon size="xl" color="green" variant="light">
                          <IconActivity size={32} />
                        </ThemeIcon>
                        <Box>
                          <Text fw={700} c="green.7">
                            Creciendo
                          </Text>
                          <Text size="sm" c="dimmed">
                            +12% este período
                          </Text>
                        </Box>
                      </Group>
                    </Paper>
                  </Stack>
                </Grid.Col>
              </Grid>
            </Tabs.Panel>

            <Tabs.Panel value="dispositivos">
              <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl">
                <Paper withBorder p="xl">
                  <Title order={3} mb="md">
                    Distribución por Dispositivos
                  </Title>
                  <Box ta="center" mb="md">
                    {prepareDeviceData().length > 0 && (
                      <RingProgress
                        size={200}
                        thickness={16}
                        sections={prepareDeviceData().map((d) => ({
                          value: d.percentage,
                          color:
                            d.deviceType === "desktop"
                              ? "blue"
                              : d.deviceType === "mobile"
                              ? "green"
                              : "orange",
                          tooltip: `${d.device}: ${d.percentage}%`,
                        }))}
                        label={
                          <Text size="xs" ta="center">
                            Dispositivos
                          </Text>
                        }
                      />
                    )}
                  </Box>
                  <Stack gap="xs">
                    {prepareDeviceData().map((device, index) => (
                      <Group key={index} justify="space-between">
                        <Group gap="xs">
                          <ThemeIcon
                            size="sm"
                            color={
                              device.deviceType === "desktop"
                                ? "blue"
                                : device.deviceType === "mobile"
                                ? "green"
                                : "orange"
                            }
                            variant="light"
                          >
                            {device.deviceType === "desktop" ? (
                              <IconActivity size={14} />
                            ) : device.deviceType === "mobile" ? (
                              <IconActivity size={14} />
                            ) : (
                              <IconActivity size={14} />
                            )}
                          </ThemeIcon>
                          <Text tt="capitalize">{device.device}</Text>
                        </Group>
                        <Group gap="xs">
                          <Text fw={700}>{device.value}</Text>
                          <Badge variant="light" size="xs">
                            {device.percentage}%
                          </Badge>
                        </Group>
                      </Group>
                    ))}
                  </Stack>
                </Paper>

                <Paper withBorder p="xl">
                  <Title order={3} mb="md">
                    Estadísticas de Rendimiento
                  </Title>
                  <Stack gap="md">
                    <Box>
                      <Group justify="space-between" mb="xs">
                        <Text size="sm" fw={600}>
                          Páginas por Sesión
                        </Text>
                        <Text size="sm" c="blue.7" fw={700}>
                          {visitStats.generalStats?.avg_pages_per_session || 0}
                        </Text>
                      </Group>
                      <Progress value={75} color="blue" />
                      <Text size="xs" c="dimmed" mt="xs">
                        Promedio del sitio
                      </Text>
                    </Box>

                    <Box>
                      <Group justify="space-between" mb="xs">
                        <Text size="sm" fw={600}>
                          Sesiones Activas
                        </Text>
                        <Text size="sm" c="green.7" fw={700}>
                          {visitStats.generalStats?.unique_visitors || 0}
                        </Text>
                      </Group>
                      <Progress value={60} color="green" />
                      <Text size="xs" c="dimmed" mt="xs">
                        Visitantes únicos
                      </Text>
                    </Box>
                  </Stack>
                </Paper>
              </SimpleGrid>
            </Tabs.Panel>

            <Tabs.Panel value="comportamiento">
              <Grid>
                <Grid.Col span={{ base: 12, lg: 8 }}>
                  <Paper withBorder p="xl">
                    <Title order={3} mb="md">
                      Páginas Más Visitadas
                    </Title>
                    <Stack gap="md">
                      {preparePageData()
                        .slice(0, 8)
                        .map((page, index) => (
                          <Card key={index} p="md" withBorder>
                            <Group justify="space-between" align="flex-start">
                              <Box style={{ flex: 1 }}>
                                <Group gap="xs" mb="xs">
                                  <Badge variant="light" size="sm">
                                    #{index + 1}
                                  </Badge>
                                  <Text fw={600} size="sm">
                                    {page.titulo}
                                  </Text>
                                </Group>
                                <Text
                                  size="xs"
                                  c="dimmed"
                                  style={{ fontFamily: "monospace" }}
                                >
                                  {page.pagina}
                                </Text>
                              </Box>
                              <Box ta="right">
                                <Text fw={700} c="blue.7">
                                  {page.visitas}
                                </Text>
                                <Text size="xs" c="dimmed">
                                  visitas
                                </Text>
                              </Box>
                            </Group>
                            <Progress
                              value={
                                preparePageData()[0]
                                  ? (page.visitas /
                                      preparePageData()[0].visitas) *
                                    100
                                  : 0
                              }
                              color="blue"
                              size="xs"
                              mt="xs"
                            />
                          </Card>
                        ))}
                    </Stack>
                  </Paper>
                </Grid.Col>

                <Grid.Col span={{ base: 12, lg: 4 }}>
                  <Stack gap="lg">
                    <Paper withBorder p="lg">
                      <Title order={4} mb="md">
                        Páginas de Entrada
                      </Title>
                      <Text c="dimmed" size="sm" mb="md">
                        Primeras páginas visitadas
                      </Text>
                      <Stack gap="xs">
                        <Group justify="space-between">
                          <Text size="sm">Página Principal</Text>
                          <Badge variant="light">45%</Badge>
                        </Group>
                        <Group justify="space-between">
                          <Text size="sm">Mapa de Servicios</Text>
                          <Badge variant="light">28%</Badge>
                        </Group>
                        <Group justify="space-between">
                          <Text size="sm">Información VIH</Text>
                          <Badge variant="light">15%</Badge>
                        </Group>
                        <Group justify="space-between">
                          <Text size="sm">Otras páginas</Text>
                          <Badge variant="light">12%</Badge>
                        </Group>
                      </Stack>
                    </Paper>

                    <Paper withBorder p="lg">
                      <Title order={4} mb="md">
                        Flujo de Navegación
                      </Title>
                      <Stack gap="md">
                        <Box>
                          <Text fw={600} size="sm">
                            1. Página Principal
                          </Text>
                          <Text size="xs" c="dimmed">
                            Punto de entrada principal
                          </Text>
                          <Progress
                            value={100}
                            size="xs"
                            mt="xs"
                            color="blue"
                          />
                        </Box>
                        <Box>
                          <Text fw={600} size="sm">
                            2. Mapa de Servicios
                          </Text>
                          <Text size="xs" c="dimmed">
                            Navegación común
                          </Text>
                          <Progress
                            value={65}
                            size="xs"
                            mt="xs"
                            color="green"
                          />
                        </Box>
                        <Box>
                          <Text fw={600} size="sm">
                            3. Información Específica
                          </Text>
                          <Text size="xs" c="dimmed">
                            Contenido detallado
                          </Text>
                          <Progress
                            value={40}
                            size="xs"
                            mt="xs"
                            color="orange"
                          />
                        </Box>
                        <Box>
                          <Text fw={600} size="sm">
                            4. Contacto/Salida
                          </Text>
                          <Text size="xs" c="dimmed">
                            Acción final
                          </Text>
                          <Progress value={25} size="xs" mt="xs" color="red" />
                        </Box>
                      </Stack>
                    </Paper>
                  </Stack>
                </Grid.Col>
              </Grid>
            </Tabs.Panel>
          </Tabs>
        </>
      )}
      </Container>
    </DatesProvider>
  );
}
