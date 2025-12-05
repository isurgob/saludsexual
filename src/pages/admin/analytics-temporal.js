import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import {
  Container,
  Title,
  Text,
  Paper,
  Grid,
  Card,
  Group,
  Stack,
  Button,
  Badge,
  Progress,
  Center,
  ThemeIcon,
  ActionIcon,
  SimpleGrid,
  Table,
  ScrollArea,
  Alert,
  Divider,
  Select,
  SegmentedControl,
  Tooltip,
  NumberFormatter
} from '@mantine/core';
import LoadingScreen from '../../components/LoadingScreen';
import {
  IconArrowLeft,
  IconClock,
  IconCalendarStats,
  IconTrendingUp,
  IconTrendingDown,
  IconRefresh,
  IconDownload,
  IconActivity,
  IconCalendar,
  IconChartLine,
  IconClockHour3,
  IconSun,
  IconMoon,
  IconCoffee,
  IconBriefcase,
  IconHome,
  IconAlertTriangle,
  IconInfoCircle,
  IconShare,
  IconEye
} from '@tabler/icons-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function AnalyticsTemporal() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30');
  const [viewType, setViewType] = useState('overview');

  // Verificar autenticación
  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (session?.user) {
      loadTemporalAnalytics();
    }
  }, [session, status, router, timeRange]);

  const loadTemporalAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/analytics/page-visits?days=${timeRange}`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setAnalytics(data.data);
    } catch (error) {
      console.error('Error loading temporal analytics:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getHourlyHeatmapData = () => {
    if (!analytics?.hourlyPatterns) return [];
    
    const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const heatmapData = [];
    
    // Crear matriz 7 días x 24 horas
    for (let day = 0; day < 7; day++) {
      const dayData = {
        day: daysOfWeek[day],
        dayIndex: day,
        hours: []
      };
      
      for (let hour = 0; hour < 24; hour++) {
        // Buscar datos reales o simular basado en patrones típicos
        const hourPattern = analytics.hourlyPatterns.find(h => h.hour_of_day === hour) || { visit_count: 0 };
        
        // Aplicar variaciones por día de la semana
        const dayMultiplier = day === 0 || day === 6 ? 0.7 : // Fin de semana
                             day === 1 || day === 2 ? 1.1 : // Lunes y Martes
                             day === 5 ? 0.9 : 1.0; // Viernes vs otros días
        
        const estimatedVisits = Math.round((hourPattern.visit_count || 0) * dayMultiplier);
        
        dayData.hours.push({
          hour,
          visits: estimatedVisits,
          intensity: getIntensityLevel(estimatedVisits, analytics.generalStats?.total_visits || 1000)
        });
      }
      
      heatmapData.push(dayData);
    }
    
    return heatmapData;
  };

  const getIntensityLevel = (visits, maxVisits) => {
    const percentage = (visits / maxVisits) * 100 * 24; // Normalizar para 24 horas
    if (percentage > 80) return 'very-high';
    if (percentage > 60) return 'high';
    if (percentage > 40) return 'medium';
    if (percentage > 20) return 'low';
    return 'very-low';
  };

  const getIntensityColor = (intensity) => {
    switch (intensity) {
      case 'very-high': return '#2563eb'; // Azul fuerte
      case 'high': return '#3b82f6';      // Azul
      case 'medium': return '#60a5fa';    // Azul medio
      case 'low': return '#93c5fd';       // Azul claro
      default: return '#e5e7eb';          // Gris muy claro
    }
  };

  const getTrendAnalysis = () => {
    if (!analytics?.weeklyPatterns) return null;
    
    const totalVisits = analytics.generalStats?.total_visits || 0;
    const avgDaily = Math.round(totalVisits / 30);
    const peakDay = analytics.weeklyPatterns.reduce((max, day) => 
      day.visit_count > max.visit_count ? day : max, analytics.weeklyPatterns[0]);
    
    return {
      avgDaily,
      peakDay,
      weekendTraffic: analytics.weeklyPatterns
        .filter(day => day.day_of_week === 0 || day.day_of_week === 6)
        .reduce((sum, day) => sum + day.visit_count, 0),
      weekdayTraffic: analytics.weeklyPatterns
        .filter(day => day.day_of_week >= 1 && day.day_of_week <= 5)
        .reduce((sum, day) => sum + day.visit_count, 0)
    };
  };

  const getHourlyTrends = () => {
    if (!analytics?.hourlyPatterns) return [];
    
    return analytics.hourlyPatterns.map(hour => ({
      hour: `${hour.hour_of_day.toString().padStart(2, '0')}:00`,
      visits: hour.visit_count || 0,
      hourOfDay: hour.hour_of_day
    })).sort((a, b) => a.hourOfDay - b.hourOfDay);
  };

  const getTimeInsights = () => {
    const trends = getTrendAnalysis();
    const heatmap = getHourlyHeatmapData();
    
    if (!trends) return [];
    
    const insights = [];
    
    // Insight sobre horario pico
    const peakHour = analytics?.hourlyPatterns?.reduce((max, hour) => 
      hour.visit_count > max.visit_count ? hour : max, analytics.hourlyPatterns[0]);
    
    if (peakHour) {
      insights.push({
        type: 'peak',
        title: 'Horario Pico Identificado',
        description: `Las ${peakHour.hour_of_day}:00 es tu hora de mayor tráfico con ${peakHour.visit_count} visitas`,
        icon: IconSun,
        color: 'orange'
      });
    }
    
    // Insight sobre fin de semana vs días laborales
    const weekendVsWeekday = trends.weekendTraffic / trends.weekdayTraffic;
    if (weekendVsWeekday > 1.2) {
      insights.push({
        type: 'weekend',
        title: 'Mayor Actividad en Fin de Semana',
        description: `Los fines de semana tienen ${Math.round((weekendVsWeekday - 1) * 100)}% más tráfico que días laborales`,
        icon: IconHome,
        color: 'green'
      });
    } else if (weekendVsWeekday < 0.8) {
      insights.push({
        type: 'weekday',
        title: 'Enfoque en Días Laborales',
        description: `Los días laborales concentran el ${Math.round((1 - weekendVsWeekday) * 100)}% del tráfico`,
        icon: IconBriefcase,
        color: 'blue'
      });
    }
    
    // Insight sobre crecimiento diario
    insights.push({
      type: 'growth',
      title: 'Promedio Diario Actual',
      description: `${trends.avgDaily} visitas promedio por día en los últimos ${timeRange} días`,
      icon: IconTrendingUp,
      color: 'cyan'
    });
    
    return insights;
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num?.toString() || '0';
  };

  if (loading) {
    return (
      <LoadingScreen
        message="Cargando análisis temporal avanzado..."
        backHref="/admin/dashboard"
        backText="Volver al Dashboard"
      />
    );
  }

  if (error) {
    return (
      <Container size="xl" py="xl">
        <Alert color="red" title="Error al cargar datos temporales" mb="lg">
          {error}
        </Alert>
        <Button leftSection={<IconRefresh size={16} />} onClick={loadTemporalAnalytics}>
          Reintentar
        </Button>
      </Container>
    );
  }

  const heatmapData = getHourlyHeatmapData();
  const hourlyTrends = getHourlyTrends();
  const trendAnalysis = getTrendAnalysis();
  const timeInsights = getTimeInsights();

  return (
    <Container size="xl" py="xl">
      {/* Header */}
      <Group justify="space-between" mb="xl">
        <Group>
          <ActionIcon 
            variant="subtle" 
            size="lg"
            onClick={() => router.back()}
          >
            <IconArrowLeft size={20} />
          </ActionIcon>
          <div>
            <Title order={1} size="h2" c="blue">
              ⏰ Análisis Temporal Avanzado
            </Title>
            <Text c="dimmed" size="lg">
              Patrones de tiempo, tendencias horarias y análisis de comportamiento temporal
            </Text>
          </div>
        </Group>
        
        <Group>
          <Select
            value={timeRange}
            onChange={setTimeRange}
            data={[
              { value: '7', label: '7 días' },
              { value: '30', label: '30 días' },
              { value: '90', label: '90 días' }
            ]}
            w={120}
          />
          <Button 
            variant="light" 
            leftSection={<IconRefresh size={16} />}
            onClick={loadTemporalAnalytics}
          >
            Actualizar
          </Button>
        </Group>
      </Group>

      {/* Controles de Vista */}
      <Paper withBorder p="md" mb="xl">
        <Group justify="space-between" align="center">
          <SegmentedControl
            value={viewType}
            onChange={setViewType}
            data={[
              { label: '📊 Resumen', value: 'overview' },
              { label: '🗓️ Mapa de Calor', value: 'heatmap' },
              { label: '📈 Tendencias', value: 'trends' }
            ]}
          />
          <Badge variant="light" color="blue" size="lg">
            Últimos {timeRange} días
          </Badge>
        </Group>
      </Paper>

      {/* Métricas Principales */}
      {viewType === 'overview' && (
        <Stack gap="xl">
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
            <Card shadow="md" p="lg" radius="md" withBorder bg="blue.0">
              <Group justify="space-between" mb="md">
                <ThemeIcon size="xl" color="blue" variant="light">
                  <IconCalendarStats size={28} />
                </ThemeIcon>
                <Badge variant="light" color="blue">Promedio diario</Badge>
              </Group>
              <Text size="xl" fw={700} c="blue">
                {formatNumber(trendAnalysis?.avgDaily || 0)}
              </Text>
              <Text size="sm" c="dimmed">visitas por día</Text>
              <Text size="xs" c="blue" mt="xs">
                Últimos {timeRange} días
              </Text>
            </Card>

            <Card shadow="md" p="lg" radius="md" withBorder bg="orange.0">
              <Group justify="space-between" mb="md">
                <ThemeIcon size="xl" color="orange" variant="light">
                  <IconSun size={28} />
                </ThemeIcon>
                <Badge variant="light" color="orange">Horario pico</Badge>
              </Group>
              <Text size="xl" fw={700} c="orange">
                {analytics?.hourlyPatterns?.reduce((max, hour) => 
                  hour.visit_count > max.visit_count ? hour : max, 
                  analytics.hourlyPatterns[0]
                )?.hour_of_day || 0}:00
              </Text>
              <Text size="sm" c="dimmed">hora de mayor tráfico</Text>
              <Text size="xs" c="orange" mt="xs">
                {analytics?.hourlyPatterns?.reduce((max, hour) => 
                  hour.visit_count > max.visit_count ? hour : max, 
                  analytics.hourlyPatterns[0]
                )?.visit_count || 0} visitas
              </Text>
            </Card>


            <Card shadow="md" p="lg" radius="md" withBorder bg="violet.0">
              <Group justify="space-between" mb="md">
                <ThemeIcon size="xl" color="violet" variant="light">
                  <IconActivity size={28} />
                </ThemeIcon>
                <Badge variant="light" color="violet">Actividad total</Badge>
              </Group>
              <Text size="xl" fw={700} c="violet">
                {formatNumber(analytics?.generalStats?.total_visits || 0)}
              </Text>
              <Text size="sm" c="dimmed">visitas en período</Text>
              <Text size="xs" c="violet" mt="xs">
                {analytics?.generalStats?.unique_visitors || 0} usuarios diferentes
              </Text>
            </Card>
          </SimpleGrid>

          {/* Gráfico de Tendencias Horarias */}
          <Paper withBorder p="lg">
            <Group justify="space-between" mb="md">
              <Title order={3} size="h4">📊 Distribución Horaria</Title>
              <Badge variant="light" color="blue">24 horas</Badge>
            </Group>
            <ScrollArea>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={hourlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <RechartsTooltip 
                    labelFormatter={(value) => `Hora: ${value}`}
                    formatter={(value) => [value, 'Visitas']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="visits" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.2} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ScrollArea>
          </Paper>
        </Stack>
      )}

      {/* Mapa de Calor */}
      {viewType === 'heatmap' && (
        <Paper withBorder p="lg">
          <Group justify="space-between" mb="md">
            <Title order={3} size="h4">🗓️ Mapa de Calor Semanal</Title>
            <Group>
              <Badge variant="light" color="blue">7 días x 24 horas</Badge>
              <Tooltip label="Intensidad basada en visitas por hora">
                <ActionIcon variant="subtle" size="sm">
                  <IconInfoCircle size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>

          <ScrollArea>
            <div style={{ minWidth: 800 }}>
              {/* Header de horas */}
              <Group gap={2} mb="xs" style={{ paddingLeft: 100 }}>
                {Array.from({ length: 24 }, (_, i) => (
                  <div
                    key={i}
                    style={{
                      width: 25,
                      textAlign: 'center',
                      fontSize: 11,
                      color: '#666'
                    }}
                  >
                    {i.toString().padStart(2, '0')}
                  </div>
                ))}
              </Group>

              {/* Filas de días */}
              {heatmapData.map((dayData) => (
                <Group gap={2} mb="xs" key={dayData.dayIndex} align="center">
                  <div style={{ width: 90, textAlign: 'right', fontSize: 13, fontWeight: 500 }}>
                    {dayData.day}
                  </div>
                  {dayData.hours.map((hour) => (
                    <Tooltip
                      key={hour.hour}
                      label={`${dayData.day} ${hour.hour}:00 - ${hour.visits} visitas`}
                    >
                      <div
                        style={{
                          width: 25,
                          height: 25,
                          backgroundColor: getIntensityColor(hour.intensity),
                          borderRadius: 4,
                          cursor: 'pointer'
                        }}
                      />
                    </Tooltip>
                  ))}
                </Group>
              ))}

              {/* Leyenda */}
              <Group justify="center" mt="lg" gap="lg">
                <Text size="sm" c="dimmed">Intensidad:</Text>
                {[
                  { level: 'very-low', label: 'Muy baja' },
                  { level: 'low', label: 'Baja' },
                  { level: 'medium', label: 'Media' },
                  { level: 'high', label: 'Alta' },
                  { level: 'very-high', label: 'Muy alta' }
                ].map(({ level, label }) => (
                  <Group key={level} gap="xs">
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        backgroundColor: getIntensityColor(level),
                        borderRadius: 2
                      }}
                    />
                    <Text size="xs">{label}</Text>
                  </Group>
                ))}
              </Group>
            </div>
          </ScrollArea>
        </Paper>
      )}

      {/* Análisis de Tendencias */}
      {viewType === 'trends' && (
        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Paper withBorder p="lg">
              <Title order={3} size="h4" mb="md">📈 Tendencias Temporales</Title>
              
              <Stack gap="lg">
                <Card withBorder p="md" radius="md">
                  <Group justify="space-between" mb="sm">
                    <Text fw={600} size="sm">Patrón Semanal</Text>
                    <Badge size="sm" variant="light" color="blue">7 días</Badge>
                  </Group>
                  <Stack gap="sm">
                    {analytics?.weeklyPatterns?.map((day, index) => {
                      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                      const dayShort = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
                      const maxVisits = Math.max(...analytics.weeklyPatterns.map(d => d.visit_count));
                      const percentage = (day.visit_count / maxVisits) * 100;
                      
                      return (
                        <div key={index}>
                          <Group justify="space-between" mb="xs">
                            <Group gap="xs">
                              <Text size="sm" fw={600} w={80}>
                                {dayShort[day.day_of_week] || dayShort[index]}
                              </Text>
                              <Badge 
                                size="xs" 
                                variant="light" 
                                color={percentage > 80 ? 'red' : percentage > 60 ? 'orange' : 'blue'}
                              >
                                {Math.round(percentage)}%
                              </Badge>
                            </Group>
                            <Text size="sm" fw={600} c="dimmed">
                              {day.visit_count.toLocaleString('es-ES')}
                            </Text>
                          </Group>
                          <Progress
                            value={percentage}
                            size="md"
                            color={percentage > 80 ? 'red' : percentage > 60 ? 'orange' : 'blue'}
                            style={{ width: '100%' }}
                          />
                        </div>
                      );
                    })}
                  </Stack>
                </Card>

              
              </Stack>
            </Paper>
          </Grid.Col>

        
        </Grid>
      )}
   
    </Container>
  );
}