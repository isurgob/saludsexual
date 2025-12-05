import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Container,
  Title,
  Text,
  Stack,
  Group,
  Button,
  Card,
  Badge,
  ActionIcon,
  Drawer,
  ScrollArea,
  TextInput,
  Chip,
  Flex,
  Modal,
  List,
  Divider,
  Anchor,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconMapPin,
  IconFilter,
  IconSearch,
  IconPhone,
  IconClock,
  IconMail,
  IconExternalLink,
  IconCurrentLocation,
  IconX,
  IconMap,
  IconLoader,
} from "@tabler/icons-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import classes from "./InteractiveMap.module.css";
import { useCentrosSalud } from "../../hooks/useCentrosSalud";
import { useServicios } from "../../hooks/useServicios";
import { useMapAnalytics } from "../../utils/analytics";

// Fix para los iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Iconos personalizados para diferentes tipos de servicios
const createCustomIcon = (color = "#4A90E2", center = null) => {
  // Determinar el color del borde
  let borderColor = "white"; // Borde blanco por defecto

  // Si el centro tiene servicios de testeo, usar borde rojo
  if (center && center.servicios && Array.isArray(center.servicios)) {
    const tieneTesteo = center.servicios.some((servicio) => {
      if (!servicio || typeof servicio !== "string") return false;
      return servicio.toLowerCase().includes("test");
    });

    if (tieneTesteo) {
      borderColor = "#d32f2f"; // Borde rojo para centros con testeo
    }
  }

  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      background-color: ${color};
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 3px solid ${borderColor};
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        width: 8px;
        height: 8px;
        background-color: white;
        border-radius: 50%;
      "></div>
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Componente para centrar el mapa en una ubicación
const MapController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
};

// Componente para restringir el mapa a Comodoro Rivadavia
const ComodoroBoundsController = () => {
  const map = useMap();

  useEffect(() => {
    // Configurar límites estrictos
    map.setMaxBounds(COMODORO_BOUNDS);
    map.options.maxBoundsViscosity = 1.0;

    // Evento que se ejecuta cuando el usuario intenta moverse fuera de los límites
    const onMoveEnd = () => {
      const center = map.getCenter();
      if (!isWithinComodoro(center.lat, center.lng)) {
        // Forzar regreso al centro de Comodoro
        map.setView(COMODORO_CENTER, 13);
      }
    };

    map.on("moveend", onMoveEnd);

    // Cleanup
    return () => {
      map.off("moveend", onMoveEnd);
    };
  }, [map]);

  return null;
};

const centerTypes = [
  { value: "Municipal", label: "Municipal" },
  { value: "Provincial", label: "Provincial" },
];

// Función para obtener color según el tipo de centro
const getTypeColor = (center) => {
  // Siempre usar colores base según el tipo, independientemente de si tiene testeo
  // El borde rojo se maneja en createCustomIcon

  // Si el centro tiene un color específico, usarlo
  if (center.color && center.color.trim() !== "") {
    return center.color;
  }

  // Colores por tipo (los centros con testeo tendrán borde rojo, pero el color base se mantiene)
  const colors = {
    Municipal: "#00C851", // Verde para CAPs municipales
    Provincial: "#ff6933", // Naranja para centros provinciales
  };

  // Log para centros con testeo (pero no cambiar el color base)
  if (
    center.servicios &&
    Array.isArray(center.servicios) &&
    center.servicios.length > 0
  ) {
    const tieneTesteo = center.servicios.some((servicio) => {
      if (!servicio || typeof servicio !== "string") return false;
      return servicio.toLowerCase().includes("test");
    });

  }

  return colors[center.tipo] || "#4A90E2";
};

// Esta función se moverá dentro del componente

// Coordenadas de Comodoro Rivadavia - LÍMITES MÁXIMOS EXPANDIDOS (igual que CompactMap)
const COMODORO_CENTER = [-45.8648, -67.4956];
const COMODORO_BOUNDS = [
  [-46.05, -67.75], // Suroeste (expansión final)
  [-45.7, -67.25], // Noreste (expansión final)
];

// Función para verificar si una coordenada está dentro de Comodoro Rivadavia
const isWithinComodoro = (lat, lng) => {
  return (
    lat >= COMODORO_BOUNDS[0][0] &&
    lat <= COMODORO_BOUNDS[1][0] &&
    lng >= COMODORO_BOUNDS[0][1] &&
    lng <= COMODORO_BOUNDS[1][1]
  );
};

const InteractiveMap = () => {
  // Usar hooks para obtener datos de la base de datos
  const { centros: healthCenters, loading, error } = useCentrosSalud();
  const {
    servicios: serviceTypes,
    loading: serviciosLoading,
    error: serviciosError,
  } = useServicios();

  const [filteredCenters, setFilteredCenters] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedType, setSelectedType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [searchedLocation, setSearchedLocation] = useState(null);
  const [searchType, setSearchType] = useState("center"); // "center" o "address"
  const mapRef = useRef(null);

  // Hook para analytics del mapa
  const analytics = useMapAnalytics();

  // Función para geocodificar direcciones (convertir dirección a coordenadas)
  const geocodeAddress = async (address) => {
    
    try {
      // Agregar "Comodoro Rivadavia, Argentina" para mejorar la precisión
      const searchQuery = `${address}, Comodoro Rivadavia, Chubut, Argentina`;
      
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&bounded=1&viewbox=${COMODORO_BOUNDS[0][1]},${COMODORO_BOUNDS[1][0]},${COMODORO_BOUNDS[1][1]},${COMODORO_BOUNDS[0][0]}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'ISur-Comodoro-Health-Map/1.0',
          'Accept': 'application/json',
        },
        // Agregar timeout
        signal: AbortSignal.timeout(10000) // 10 segundos timeout
      });
      
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.length > 0) {
        // Filtrar solo resultados dentro de Comodoro Rivadavia
        const validResults = data.filter(result => {
          const lat = parseFloat(result.lat);
          const lng = parseFloat(result.lon);
          const isValid = isWithinComodoro(lat, lng);
          return isValid;
        });


        if (validResults.length > 0) {
          const bestResult = validResults[0];
          const geocodedLocation = {
            lat: parseFloat(bestResult.lat),
            lng: parseFloat(bestResult.lon),
            display_name: bestResult.display_name,
            searchTerm: address // Guardar el término original de búsqueda
          };
          return geocodedLocation;
        }
      }
      
      return null;
    } catch (error) {
      
      if (error.name === 'AbortError') {
        console.error('⏱️ Timeout: La búsqueda tardó demasiado');
      } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        console.error('🌐 Error de red: Verifica tu conexión a internet o CORS');
      }
      
      return null;
    }
  };



  // SIMPLIFICADO - Solo mostrar TODOS los CAPs sin filtrar nada
  useEffect(() => {
    
    if (!healthCenters || healthCenters.length === 0) {
      setFilteredCenters([]);
      return;
    }

    // Primero filtrar solo los centros que están dentro de Comodoro
    let filtered = healthCenters.filter((center) =>
      isWithinComodoro(center.lat, center.lng)
    );


    // Aplicar filtro de servicios - Lógica AND (debe tener TODOS los servicios seleccionados)
    if (selectedServices.length > 0) {
      filtered = filtered.filter((center) =>
        selectedServices.every(
          (service) => center.servicios && center.servicios.includes(service)
        )
      );
    }

    // Aplicar filtro de tipo
    if (selectedType) {
      filtered = filtered.filter((center) => center.tipo === selectedType);
    }

    // Aplicar filtro de búsqueda por nombre/dirección
    if (searchQuery) {
      filtered = filtered.filter(
        (center) =>
          center.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          center.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredCenters(filtered);
  }, [healthCenters, selectedServices, selectedType, searchQuery]);

  // Efecto para trackear búsquedas
  useEffect(() => {
    if (searchQuery && searchQuery.length > 2) {
      analytics.trackSearch(searchQuery, filteredCenters.length);
    }
  }, [searchQuery, filteredCenters.length, analytics]);

  // Obtener ubicación del usuario (solo si está en Comodoro Rivadavia)
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          // Verificar si la ubicación está dentro de los límites estrictos de Comodoro Rivadavia
          if (isWithinComodoro(lat, lng)) {
            setUserLocation({ lat, lng });
          } else {
            // Mostrar mensaje y centrar en Comodoro
            notifications.show({
              title: 'Ubicación fuera del área',
              message: 'Tu ubicación está fuera de Comodoro Rivadavia. El mapa se centrará en la ciudad para mostrarte los servicios disponibles.',
              color: 'orange',
              icon: '📍',
              autoClose: 5000
            });
            // No establecer userLocation para forzar el uso del centro de Comodoro
          }
        },
        (error) => {
          // En caso de error, centrar en Comodoro
          notifications.show({
            title: 'Error de geolocalización',
            message: 'No se pudo obtener tu ubicación. El mapa se centrará en Comodoro Rivadavia.',
            color: 'yellow',
            icon: '⚠️',
            autoClose: 4000
          });
        }
      );
    } else {
      notifications.show({
        title: 'Geolocalización no disponible',
        message: 'Tu navegador no soporta geolocalización. El mapa se centrará en Comodoro Rivadavia.',
        color: 'blue',
        icon: 'ℹ️',
        autoClose: 4000
      });
    }
  };

  const handleServiceFilter = (service) => {
    const wasSelected = selectedServices.includes(service);
    const action = wasSelected ? "remove" : "add";

    // Track filter usage
    analytics.trackFilter("service", service, action);

    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };

  const clearFilters = () => {
    
    // Track clear filters action
    analytics.trackFilter("all", "clear_filters", "clear");

    setSelectedServices([]);
    setSelectedType("");
    setSearchQuery("");
    setSearchedLocation(null);
    
    // Restaurar todos los CAPs
    if (healthCenters && healthCenters.length > 0) {
      const todosLosCentros = healthCenters.filter((center) =>
        isWithinComodoro(center.lat, center.lng)
      );
      
      setFilteredCenters(todosLosCentros);
    }
  };

  // BÚSQUEDA DESHABILITADA TEMPORALMENTE - Solo mostrar CAPs
  const handleSmartSearch = async () => {
    
    if (!searchQuery.trim()) {
      return;
    }

    setIsGeocoding(true);
    
    try {
      const location = await geocodeAddress(searchQuery);
      
      if (location) {
     
        
        setSearchedLocation(location);
        setSearchType("address");
        
        // Filtrar centros cercanos (dentro de ~2km)
        const nearbyRadius = 0.02; // aproximadamente 2km
        const nearbyCenters = healthCenters.filter(center => {
          const distance = Math.sqrt(
            Math.pow(center.lat - location.lat, 2) + 
            Math.pow(center.lng - location.lng, 2)
          );
          return distance <= nearbyRadius && isWithinComodoro(center.lat, center.lng);
        });
        
        
        setFilteredCenters(nearbyCenters);
        
        if (nearbyCenters.length === 0) {
          notifications.show({
            title: 'No hay centros cercanos',
            message: `No se encontraron centros de salud cerca de "${location.display_name.split(',')[0]}". Mostrando todos los centros disponibles.`,
            color: 'blue',
            icon: '📍',
            autoClose: 6000
          });
          // Si no hay centros cercanos, mostrar todos
          const todosLosCentros = healthCenters.filter((center) =>
            isWithinComodoro(center.lat, center.lng)
          );
          setFilteredCenters(todosLosCentros);
        }
      } else {
        setSearchType("center");
        
        // Buscar por nombre de centro
        const matchingCenters = healthCenters.filter(center => {
          const matchesName = center.name.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesAddress = center.address.toLowerCase().includes(searchQuery.toLowerCase());
          const isValid = isWithinComodoro(center.lat, center.lng);
          
          
          
          return (matchesName || matchesAddress) && isValid;
        });
        
        
        setFilteredCenters(matchingCenters);
        setSearchedLocation(null);
        
        if (matchingCenters.length === 0) {
          notifications.show({
            title: 'Sin resultados',
            message: `No se encontraron centros que coincidan con "${searchQuery}". Intenta con otro término de búsqueda.`,
            color: 'yellow',
            icon: '🔍',
            autoClose: 5000
          });
        }
      }
    } catch (error) {
      console.error('❌ ERROR EN BÚSQUEDA:', error);
      
      // Mensaje de error más específico
      let errorMessage = 'Error en la búsqueda.';
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        errorMessage = 'Error de conexión. Verifica tu internet e intenta de nuevo.';
      } else if (error.name === 'AbortError') {
        errorMessage = 'La búsqueda tardó demasiado. Intenta de nuevo.';
      }
      
      notifications.show({
        title: 'Error en la búsqueda',
        message: errorMessage,
        color: 'red',
        icon: '❌',
        autoClose: 5000
      });
      
      // En caso de error, buscar por nombre como fallback
      const matchingCenters = healthCenters.filter(center => {
        const matchesName = center.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesAddress = center.address.toLowerCase().includes(searchQuery.toLowerCase());
        const isValid = isWithinComodoro(center.lat, center.lng);
        
        return (matchesName || matchesAddress) && isValid;
      });
      
      if (matchingCenters.length > 0) {
        setFilteredCenters(matchingCenters);
        setSearchedLocation(null);
      }
    } finally {
      setIsGeocoding(false);
    }
  };

  // Función para limpiar toda la búsqueda
  const clearAllSearch = () => {
    setSearchQuery("");
    setSearchedLocation(null);
    setIsGeocoding(false);
    
    // Restaurar todos los CAPs
    if (healthCenters && healthCenters.length > 0) {
      const todosLosCentros = healthCenters.filter((center) =>
        isWithinComodoro(center.lat, center.lng)
      );
      
      setFilteredCenters(todosLosCentros);
    }
  };

  const openCenterDetails = (center) => {
    // Track center details view
    analytics.trackCenterDetails(center);

    setSelectedCenter(center);
    setDetailsOpen(true);
  };

  const getDirections = (center) => {
    // Track directions request
    analytics.trackDirections(center);

    const url = `https://www.google.com/maps/dir/?api=1&destination=${center.lat},${center.lng}`;
    window.open(url, "_blank");
  };

  // Manejar click en marcador del mapa
  const handleMarkerClick = (center) => {
    // Track center click
    analytics.trackCenterClick(center);
  };

  // Función para abrir direcciones en Google Maps con tracking de analytics
  const openDirections = (center) => {
    // Verificar que el centro esté dentro de Comodoro antes de abrir direcciones
    if (!isWithinComodoro(center.lat, center.lng)) {
      notifications.show({
        title: 'Ubicación fuera del área',
        message: 'Esta ubicación está fuera de Comodoro Rivadavia.',
        color: 'orange',
        icon: '📍',
        autoClose: 4000
      });
      return;
    }

    // Registrar solicitud de direcciones en analytics
    analytics.trackDirections(center);

    // Abrir Google Maps con direcciones
    const url = `https://www.google.com/maps/dir/?api=1&destination=${center.lat},${center.lng}&destination_place_id=ChIJg3wQdMYXdL0Rsqyg4w2O&travelmode=driving`;
    window.open(url, "_blank");
  };

  // Manejar cambio de tipo de centro
  const handleTypeChange = (newType) => {
    if (newType) {
      analytics.trackFilter("center_type", newType, "add");
    } else if (selectedType) {
      analytics.trackFilter("center_type", selectedType, "remove");
    }
    setSelectedType(newType);
  };

  // Manejar click en limpiar tipo
  const handleClearType = () => {
    if (selectedType) {
      analytics.trackFilter("center_type", selectedType, "remove");
    }
    setSelectedType("");
  };

  // Si está cargando centros o servicios, mostrar loader
  if (loading || serviciosLoading) {
    return (
      <Container size="xl" py="xl" className={classes.container}>
        <Stack align="center" gap="md" style={{ minHeight: "400px" }}>
          <Text>Cargando {loading ? "centros de salud" : "servicios"}...</Text>
        </Stack>
      </Container>
    );
  }

  // Si hay error en centros o servicios, mostrar error
  if (error || serviciosError) {
    return (
      <Container size="xl" py="xl" className={classes.container}>
        <Stack align="center" gap="md" style={{ minHeight: "400px" }}>
          <Text color="red">
            Error al cargar los datos: {error || serviciosError}
          </Text>
        </Stack>
      </Container>
    );
  }

 

  return (
    <Container size="xl" py="md" className={classes.container}>
      <Stack gap="sm">
        {/* Search and Filters */}
        <Card shadow="sm" padding="sm" radius="md" withBorder className={classes.searchContainer}>
          <Stack gap="xs">
            <div className={classes.searchGroup}>
              <TextInput
                className={classes.searchInput}
                placeholder="Poné tu ubicación y encontrá el Centro de Atención más cercano"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftSection={<IconSearch size={16} />}
                radius="lg"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !isGeocoding) {
                    handleSmartSearch();
                  }
                }}
              />
              <div className={classes.searchActions}>
                <Button
                  variant="filled"
                  onClick={handleSmartSearch}
                  disabled={!searchQuery.trim() || isGeocoding}
                  loading={isGeocoding}
                  radius="lg"
                  size="sm"
                  style={{ minHeight: '36px' }}
                >
                  {isGeocoding ? 'Buscando...' : 'Buscar'}
                </Button>
                <Button
                  variant="outline"
                  leftSection={<IconFilter size={16} />}
                  onClick={() => setFiltersOpen(true)}
                  radius="lg"
                  size="sm"
                  className={classes.filterButton}
                  style={{ minHeight: '36px' }}
                >
                  <span className={classes.hideOnMobile}>¿Qué servicio estás buscando?</span>
                  <span className={classes.showOnMobile}>Filtros</span>
                </Button>
              {/*   <ActionIcon
                  variant="outline"
                  size="lg"
                  onClick={getUserLocation}
                  radius="lg"
                  title="Mi ubicación"
                >
                  <IconCurrentLocation size={18} />
                </ActionIcon> */}
                {(searchQuery || searchedLocation) && (
                  <ActionIcon
                    variant="outline"
                    size="36"
                    onClick={clearAllSearch}
                    radius="lg"
                    title="Limpiar búsqueda"
                    style={{ minHeight: '36px', minWidth: '36px' }}
                  >
                    <IconX size={16} />
                  </ActionIcon>
                )}
              </div>
            </div>

            {/* Searched Location Info */}
            {searchedLocation && (
              <Group gap="xs">
                <Text size="sm" fw={500} style={{ color: '#0074f5' }}>
                  📍 Ubicación encontrada:
                </Text>
                <Badge style={{ backgroundColor: '#0074f5', color: 'white' }} variant="filled">
                  {searchedLocation.searchTerm || searchedLocation.display_name.split(',')[0]}
                </Badge>
              </Group>
            )}

            {/* Active Filters */}
            {(selectedServices.length > 0 || selectedType) && (
              <Group gap="xs">
                <Text size="sm" fw={500}>
                  Filtros activos:
                </Text>
                {selectedServices.map((service) => {
                  const serviceInfo = serviceTypes.find(
                    (s) => s.value === service
                  );
                  return (
                    <Badge
                      key={service}
                      color={serviceInfo?.color}
                      variant="light"
                      rightSection={
                        <ActionIcon
                          size="xs"
                          color={serviceInfo?.color}
                          radius="xl"
                          variant="transparent"
                          onClick={() => handleServiceFilter(service)}
                        >
                          <IconX size={10} />
                        </ActionIcon>
                      }
                    >
                      {serviceInfo?.label}
                    </Badge>
                  );
                })}
                {selectedType && (
                  <Badge
                    color="gray"
                    variant="light"
                    rightSection={
                      <ActionIcon
                        size="xs"
                        color="gray"
                        radius="xl"
                        variant="transparent"
                        onClick={handleClearType}
                      >
                        <IconX size={10} />
                      </ActionIcon>
                    }
                  >
                    {centerTypes.find((t) => t.value === selectedType)?.label}
                  </Badge>
                )}
                <Button
                  variant="subtle"
                  size="xs"
                  onClick={clearFilters}
                  color="gray"
                >
                  Limpiar todo
                </Button>
              </Group>
            )}
          </Stack>
        </Card>

        {/* Leyenda del Mapa */}
        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Group justify="space-between" align="center">
            <Text fw={600} size="sm" c="dimmed">
              <IconMap
                size={16}
                style={{ marginRight: "8px", verticalAlign: "middle" }}
              />
              ¿Qué podés encontrar en el mapa?
            </Text>
            <Group gap="xs" wrap="wrap">
              <Group gap="xs" align="center">
                <Box
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    backgroundColor: "#00C851",
                    border: "2px solid white",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  }}
                />
                <Text size="sm" c="dimmed">
                  CAPs Municipales
                </Text>
              </Group>
              <Group gap="xs" align="center">
                <Box
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    backgroundColor: "#00C851",
                    border: "2px solid #d32f2f",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  }}
                />
                <Text size="sm" c="dimmed">
                  CAPs Municipales con Testeo
                </Text>
              </Group>
              <Group gap="xs" align="center">
                <Box
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    backgroundColor: "#ff6933",
                    border: "2px solid white",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  }}
                />
                <Text size="sm" c="dimmed">
                  CAPs Provinciales
                </Text>
              </Group>
              {(userLocation || searchedLocation) && (
                <>
                  {userLocation && (
                    <Group gap="xs" align="center">
                      <Box
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          backgroundColor: "#E53E3E",
                          border: "2px solid white",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                        }}
                      />
                      <Text size="sm" c="dimmed">
                        Tu ubicación
                      </Text>
                    </Group>
                  )}
                  {searchedLocation && (
                    <Group gap="xs" align="center">
                      <Box
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          backgroundColor: "#0074f5",
                          border: "2px solid white",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                        }}
                      />
                      <Text size="sm" c="dimmed">
                        Tu ubicación
                      </Text>
                    </Group>
                  )}
                </>
              )}
            </Group>
          </Group>
        </Card>

        {/* Map Container */}
        <Card
          shadow="sm"
          padding={0}
          radius="md"
          withBorder
          className={classes.mapContainer}
        >
          <Box className={classes.mapWrapper}>
            <MapContainer
              center={userLocation || COMODORO_CENTER}
              zoom={userLocation ? 15 : 13}
              style={{
                height: "500px",
                width: "100%",
                borderRadius: "12px",
                zIndex: 1,
                position: "relative",
              }}
              scrollWheelZoom={true}
              maxBounds={COMODORO_BOUNDS}
              maxBoundsViscosity={1.0}
              minZoom={12}
              maxZoom={18}
              doubleClickZoom={true}
              dragging={true}
              keyboard={false}
              attributionControl={true}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapController
                center={searchedLocation || userLocation || COMODORO_CENTER}
                zoom={searchedLocation || userLocation ? 15 : 13}
              />

              <ComodoroBoundsController />

              {/* Marcador de ubicación del usuario */}
              {userLocation && (
                <Marker
                  position={userLocation}
                  icon={createCustomIcon("#E53E3E", null)}
                >
                  <Popup>
                    <Box p="xs">
                      <Text fw={500} size="sm">
                        Tu ubicación
                      </Text>
                      <Text size="xs" c="dimmed">
                        Ubicación actual detectada
                      </Text>
                    </Box>
                  </Popup>
                </Marker>
              )}

              {/* Marcador de ubicación buscada */}
              {searchedLocation && (
                <Marker
                  position={[searchedLocation.lat, searchedLocation.lng]}
                  icon={createCustomIcon("#0074f5", null)}
                >
                  <Popup>
                    <Box p="xs">
                      <Text fw={500} size="sm">
                        Tu ubicación
                      </Text>
                      <Text size="xs" c="dimmed" fw={500}>
                        📍 {searchedLocation.searchTerm || "Ubicación encontrada"}
                      </Text>
                      <Text size="xs" c="dimmed" mt="xs">
                        {searchedLocation.display_name.split(',').slice(0, 2).join(', ')}
                      </Text>
                    </Box>
                  </Popup>
                </Marker>
              )}

              {/* Marcadores de centros de salud */}
              {filteredCenters.map((center) => {
                return (
                <Marker
                  key={center.id}
                  position={[center.lat, center.lng]}
                  icon={createCustomIcon(getTypeColor(center), center)}
                  eventHandlers={{
                    click: () => handleMarkerClick(center),
                  }}
                >
                  <Popup>
                    <Box p="sm" style={{ minWidth: "200px" }}>
                      <Text fw={600} size="sm" mb="xs">
                        {center.name}
                      </Text>
                      <Text size="xs" c="dimmed" mb="xs">
                        {center.address}
                      </Text>

                      {/* Detectar si es provincial basándose en la categoría */}
                      {center.categoria === "Provincial" ? (
                        // Card simplificada para provinciales - solo nombre, dirección, link y botón direcciones
                        <Stack gap="sm" mt="sm">
                          <Button
                            size="xs"
                            variant="light"
                            color="orange"
                            leftSection={<IconExternalLink size={14} />}
                            onClick={() =>
                              window.open(
                                "https://secretariadesalud.chubut.gov.ar/",
                                "_blank"
                              )
                            }
                            fullWidth
                          >
                            Más Información
                          </Button>
                          <Button
                            size="xs"
                            variant="light"
                            color="teal"
                            leftSection={<IconExternalLink size={14} />}
                            onClick={() => openDirections(center)}
                            fullWidth
                          >
                            Obtener Direcciones
                          </Button>
                        </Stack>
                      ) : (
                        // Card completa para municipales
                        <>
                          <Group gap="xs" mb="xs">
                            {center.servicios &&
                              center.servicios.map((service) => (
                                <Badge key={service} size="xs" variant="light">
                                  {service}
                                </Badge>
                              ))}
                          </Group>

                          <Stack gap={4}>
                            <Group gap="xs">
                              <IconPhone size={12} />
                              <Text size="xs">{center.phone}</Text>
                            </Group>
                            <Group gap="xs">
                              <IconClock size={12} />
                              <Text size="xs">{center.hours}</Text>
                            </Group>
                          </Stack>

                          <Group mt="md" gap="xs" justify="stretch">
                            <Button
                              size="xs"
                              variant="light"
                              color="teal"
                              leftSection={<IconExternalLink size={14} />}
                              onClick={() => openDirections(center)}
                              fullWidth
                            >
                              Obtener Direcciones
                            </Button>
                          </Group>
                        </>
                      )}
                    </Box>
                  </Popup>
                </Marker>
              );
              })}
            </MapContainer>
          </Box>
        </Card>

        {/* Results List */}
        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Stack gap="xs">
            <Group justify="space-between">
              <Title order={3} className="section-title">
                Centros encontrados ({filteredCenters.length})
              </Title>
            </Group>

            <ScrollArea h={400}>
              <Stack gap="sm">
                {filteredCenters.map((center) => (
                  <Card
                    key={center.id}
                    shadow="xs"
                    padding="md"
                    radius="md"
                    withBorder
                    className={classes.centerCard}
                    onClick={() => openCenterDetails(center)}
                    style={{ cursor: "pointer" }}
                  >
                    <Group justify="space-between" align="flex-start">
                      <Box style={{ flex: 1 }}>
                        <Group gap="xs" mb="xs">
                          <Text fw={600} size="md">
                            {center.name}
                          </Text>
                          <Badge
                            size="xs"
                            color={
                              center.tipo === "Municipal"
                                ? "blue"
                                : center.tipo === "Provincial"
                                ? "cyan"
                                : center.tipo === "Privado"
                                ? "orange"
                                : "green"
                            }
                            variant="light"
                          >
                            {center.tipo}
                          </Badge>
                        </Group>

                        <Text size="sm" c="dimmed" mb="xs">
                          <IconMapPin
                            size={14}
                            style={{ verticalAlign: "text-bottom" }}
                          />{" "}
                          {center.address}
                        </Text>

                        <Flex gap="xs" wrap="wrap" mb="xs">
                          {center.servicios &&
                            center.servicios.map((service) => {
                              const serviceInfo = serviceTypes.find(
                                (s) => s.value === service
                              );
                              return (
                                <Badge
                                  key={service}
                                  size="xs"
                                  color={serviceInfo?.color}
                                  variant="dot"
                                >
                                  {serviceInfo?.label}
                                </Badge>
                              );
                            })}
                        </Flex>

                        <Text size="xs" c="dimmed">
                          <IconClock
                            size={12}
                            style={{ verticalAlign: "text-bottom" }}
                          />{" "}
                          {center.hours}
                        </Text>
                      </Box>

                      <ActionIcon
                        variant="light"
                        color="blue"
                        onClick={(e) => {
                          e.stopPropagation();
                          getDirections(center);
                        }}
                      >
                        <IconExternalLink size={16} />
                      </ActionIcon>
                    </Group>
                  </Card>
                ))}

                {filteredCenters.length === 0 && (
                  <Box ta="center" py="xl">
                    <Text c="dimmed">
                      No se encontraron centros de salud con los filtros
                      seleccionados.
                    </Text>
                    <Button variant="light" mt="sm" onClick={clearFilters}>
                      Limpiar filtros
                    </Button>
                  </Box>
                )}
              </Stack>
            </ScrollArea>
          </Stack>
        </Card>
      </Stack>

      {/* Filters Drawer */}
      <Drawer
        opened={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="¿Qué servicio estás buscando?"
        position="right"
        size="sm"
        zIndex={1001}
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
          zIndex: 1000,
        }}
      >
        <Stack gap="sm">
          <Box>
            <Text size="sm" fw={500} mb="xs">
              Tipo de servicios
            </Text>
            <Stack gap="xs">
              {serviceTypes.map((service) => (
                <Chip
                  key={service.value}
                  checked={selectedServices.includes(service.value)}
                  onChange={() => handleServiceFilter(service.value)}
                  color={service.color}
                  variant="light"
                >
                  {service.label}
                </Chip>
              ))}
            </Stack>
          </Box>

          

          <Button onClick={() => setFiltersOpen(false)} fullWidth>
            Aplicar filtros
          </Button>
        </Stack>
      </Drawer>

      {/* Center Details Modal */}
      <Modal
        opened={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title={selectedCenter?.name}
        size="md"
        centered
        zIndex={3000}
        overlayProps={{
          backgroundOpacity: 0.65,
          blur: 4,
          zIndex: 2999,
        }}
        styles={{
          content: { zIndex: 3000 },
          header: { zIndex: 3001 },
          body: { zIndex: 3000 },
        }}
      >
        {selectedCenter && (
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              {selectedCenter.description}
            </Text>

            <Divider />

            <Box>
              <Text size="sm" fw={500} mb="xs">
                Información de contacto
              </Text>
              <List spacing="xs" size="sm">
                <List.Item icon={<IconMapPin size={16} />}>
                  {selectedCenter.address}
                </List.Item>
                <List.Item icon={<IconPhone size={16} />}>
                  <Anchor href={`tel:${selectedCenter.phone}`}>
                    {selectedCenter.phone}
                  </Anchor>
                </List.Item>
                <List.Item icon={<IconMail size={16} />}>
                  <Anchor href={`mailto:${selectedCenter.email}`}>
                    {selectedCenter.email}
                  </Anchor>
                </List.Item>
                {selectedCenter.website && (
                  <List.Item icon={<IconExternalLink size={16} />}>
                    <Anchor
                      href={`https://${selectedCenter.website}`}
                      target="_blank"
                    >
                      {selectedCenter.website}
                    </Anchor>
                  </List.Item>
                )}
              </List>
            </Box>

            <Box>
              <Text size="sm" fw={500} mb="xs">
                Horarios de atención
              </Text>
              <Text size="sm">
                {selectedCenter.hours || "Horarios no disponibles"}
              </Text>
            </Box>

            <Box>
              <Text size="sm" fw={500} mb="xs">
                Servicios disponibles
              </Text>
              <Flex gap="xs" wrap="wrap">
                {selectedCenter.servicios &&
                selectedCenter.servicios.length > 0 ? (
                  selectedCenter.servicios.map((service, index) => {
                    const serviceInfo = serviceTypes.find(
                      (s) => s.value === service
                    );
                    return (
                      <Badge
                        key={index}
                        color={serviceInfo?.color || "blue"}
                        variant="light"
                      >
                        {serviceInfo?.label || service}
                      </Badge>
                    );
                  })
                ) : (
                  <Text size="sm" c="dimmed">
                    No hay servicios disponibles
                  </Text>
                )}
              </Flex>
            </Box>

            <Group justify="space-between" mt="md">
              <Button
                variant="outline"
                onClick={() => getDirections(selectedCenter)}
                leftSection={<IconExternalLink size={16} />}
              >
                Cómo llegar
              </Button>
              <Button onClick={() => setDetailsOpen(false)}>Cerrar</Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Container>
  );
};

export default InteractiveMap;
