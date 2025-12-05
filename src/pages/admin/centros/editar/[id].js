import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  Container,
  Paper,
  Title,
  Text,
  TextInput,
  Select,
  MultiSelect,
  Textarea,
  NumberInput,
  Button,
  Group,
  Stack,
  Alert,
  Anchor,
  Divider,
  Loader,
  Breadcrumbs,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/router";
import {
  IconArrowLeft,
  IconCheck,
  IconX,
  IconDeviceFloppy,
  IconHome,
  IconSettings,
} from "@tabler/icons-react";
import LoadingScreen from "../../../../components/LoadingScreen";

const EditarCentro = () => {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession();

  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState(
    "Cargando datos del centro de salud..."
  );
  const [overlayState, setOverlayState] = useState({
    show: false,
    type: "loading",
    message: "",
  });
  const [centro, setCentro] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [servicios, setServicios] = useState([]);

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
        router.push("/admin/dashboard?error=insufficient_permissions");
        return;
      }

      setAuthLoading(false);
    }
  }, [session, status, router]);

  // Configurar formulario con validaciones (solo campos que tenemos)
  const form = useForm({
    initialValues: {
      nombre: "",
      direccion: "",
      telefono: "",
      descripcion: "",
      dias_horas: "",
      latitud: "",
      longitud: "",
      categoria_id: "",
      tipo_id: "",
      servicios_ids: [],
    },
    validate: {
      nombre: (value) => {
        if (!value || value.trim() === "") return "El nombre es requerido";
        if (value.trim().length < 3)
          return "El nombre debe tener al menos 3 caracteres";
        return null;
      },
      direccion: (value) => {
        if (!value || value.trim() === "") return "La dirección es requerida";
        if (value.trim().length < 5)
          return "La dirección debe tener al menos 5 caracteres";
        return null;
      },
      telefono: (value) => {
        if (!value || value.trim() === "") return "El teléfono es requerido";
        return null;
      },
      categoria_id: (value) => (!value ? "La categoría es requerida" : null),
      tipo_id: (value) => (!value ? "El tipo es requerido" : null),
      servicios_ids: (value) => {
        if (!value || !Array.isArray(value) || value.length === 0) {
          return "Debe seleccionar al menos un servicio";
        }
        return null;
      },
      latitud: (value) => {
        if (!value) return "La latitud es requerida";
        // Normalizar comas a puntos para la validación
        const normalizedValue = value.toString().replace(",", ".");
        const lat = parseFloat(normalizedValue);
        if (isNaN(lat) || lat < -90 || lat > 90)
          return "La latitud debe estar entre -90 y 90";
        return null;
      },
      longitud: (value) => {
        if (!value) return "La longitud es requerida";
        // Normalizar comas a puntos para la validación
        const normalizedValue = value.toString().replace(",", ".");
        const lng = parseFloat(normalizedValue);
        if (isNaN(lng) || lng < -180 || lng > 180)
          return "La longitud debe estar entre -180 y 180";
        return null;
      },
    },
  });

  // Cargar datos cuando el ID esté disponible
  useEffect(() => {
    if (!id || authLoading || status === "loading") return;

    const loadData = async () => {
      try {
        setLoadingMessage("Conectando con el servidor...");

        const [centroRes, categoriasRes, tiposRes, serviciosRes] =
          await Promise.all([
            fetch(`/api/centros-salud/${id}`),
            fetch("/api/categorias"),
            fetch("/api/tipos"),
            fetch("/api/servicios"),
          ]);

        setLoadingMessage("Procesando datos del centro...");

        if (!centroRes.ok) {
          const errorText = await centroRes.text();
          console.error("Error al obtener centro:", errorText);

          // Si el centro no existe, redirigir directamente a 404
          if (centroRes.status === 404) {
            router.push("/404");
            return;
          } else if (centroRes.status === 403) {
            throw new Error("SIN_PERMISOS");
          } else if (centroRes.status >= 500) {
            throw new Error("ERROR_SERVIDOR");
          } else {
            throw new Error("ERROR_GENERAL");
          }
        }

        if (!categoriasRes.ok) {
          console.error("Error al obtener categorías:", categoriasRes.status);
          throw new Error(
            `Error al obtener categorías: ${categoriasRes.status}`
          );
        }

        if (!tiposRes.ok) {
          console.error("Error al obtener tipos:", tiposRes.status);
          throw new Error(`Error al obtener tipos: ${tiposRes.status}`);
        }

        if (!serviciosRes.ok) {
          console.error("Error al obtener servicios:", serviciosRes.status);
          throw new Error(`Error al obtener servicios: ${serviciosRes.status}`);
        }

        setLoadingMessage("Preparando formulario...");

        const [centroData, categoriasData, tiposData, serviciosResponse] =
          await Promise.all([
            centroRes.json(),
            categoriasRes.json(),
            tiposRes.json(),
            serviciosRes.json(),
          ]);

        setCentro(centroData);
        setCategorias(categoriasData || []);
        setTipos(tiposData || []);
        // La API de servicios retorna { data: [...] } o un array directo
        setServicios(serviciosResponse?.data || serviciosResponse || []);

        // Llenar el formulario con los datos del centro
        const formData = {
          nombre: centroData.nombre || "",
          direccion: centroData.direccion || "",
          telefono: centroData.telefono || "",
          descripcion: centroData.descripcion || "",
          dias_horas: centroData.dias_horas || centroData.horarios || "",
          latitud: centroData.latitud
            ? centroData.latitud.toString()
            : centroData.latitude
            ? centroData.latitude.toString()
            : "",
          longitud: centroData.longitud
            ? centroData.longitud.toString()
            : centroData.longitude
            ? centroData.longitude.toString()
            : "",
          categoria_id: centroData.categoria_id
            ? centroData.categoria_id.toString()
            : "",
          tipo_id: centroData.tipo_id ? centroData.tipo_id.toString() : "",
          servicios_ids: Array.isArray(centroData.servicios_ids)
            ? centroData.servicios_ids
                .map((id) => (typeof id === "number" ? id.toString() : id))
                .filter(Boolean)
            : [],
        };

        form.setValues(formData);

        setLoadingMessage("Finalizando carga...");
        // Pequeña pausa para mostrar el mensaje final
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (error) {
        console.error("❌ Error cargando datos:", error);

        let errorTitle = "❌ Error al Cargar";
        let errorMessage = "No se pudieron cargar los datos";

        // Errores específicos sin exponer detalles internos
        if (error.message === "SIN_PERMISOS") {
          errorTitle = "❌ Sin Permisos";
          errorMessage = "No tiene permisos para acceder a este centro";
        } else if (error.message === "ERROR_SERVIDOR") {
          errorTitle = "❌ Error del Sistema";
          errorMessage = "Error interno del sistema. Inténtelo más tarde";
        } else if (
          error.name === "TypeError" &&
          error.message.includes("fetch")
        ) {
          errorTitle = "❌ Sin Conexión";
          errorMessage = "No se pudo conectar al servidor";
        } else if (error.message.includes("404")) {
          errorTitle = "❌ No Encontrado";
          errorMessage = "El elemento solicitado no existe";
        } else if (error.message.includes("500")) {
          errorTitle = "❌ Error del Sistema";
          errorMessage = "Error interno del sistema";
        } else {
          errorMessage = "Error al cargar los datos. Inténtelo nuevamente";
        }

        notifications.show({
          title: errorTitle,
          message: errorMessage,
          color: "red",
          icon: <IconX size={18} />,
          autoClose: 8000,
          withBorder: true,
        });
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [id, authLoading, status]);

  // Manejar envío del formulario
  const handleSubmit = async (values) => {
    // Validación adicional antes de enviar
    const erroresValidacion = [];

    // Validar campos requeridos
    if (!values.nombre?.trim())
      erroresValidacion.push("El nombre es requerido");
    if (!values.direccion?.trim())
      erroresValidacion.push("La dirección es requerida");
    if (!values.telefono?.trim())
      erroresValidacion.push("El teléfono es requerido");
    if (!values.categoria_id)
      erroresValidacion.push("La categoría es requerida");
    if (!values.tipo_id) erroresValidacion.push("El tipo es requerido");
    if (!values.servicios_ids || values.servicios_ids.length === 0) {
      erroresValidacion.push("Debe seleccionar al menos un servicio");
    }

    // Validar coordenadas
    if (!values.latitud) {
      erroresValidacion.push("La latitud es requerida");
    } else {
      const latNormalizada = values.latitud.toString().replace(",", ".");
      const lat = parseFloat(latNormalizada);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        erroresValidacion.push("La latitud debe estar entre -90 y 90");
      }
    }

    if (!values.longitud) {
      erroresValidacion.push("La longitud es requerida");
    } else {
      const lngNormalizada = values.longitud.toString().replace(",", ".");
      const lng = parseFloat(lngNormalizada);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        erroresValidacion.push("La longitud debe estar entre -180 y 180");
      }
    }

    // Si hay errores de validación, mostrarlos y no enviar
    if (erroresValidacion.length > 0) {
      notifications.show({
        title: "❌ Errores de Validación",
        message:
          "Corrija los siguientes errores:\n• " +
          erroresValidacion.join("\n• "),
        color: "red",
        icon: <IconX size={18} />,
        autoClose: 8000,
        withBorder: true,
      });
      return;
    }

    setLoading(true);
    setOverlayState({
      show: true,
      type: "loading",
      message: "Guardando cambios...",
    });

    try {
      // Normalizar coordenadas: reemplazar comas por puntos para el servidor
      const normalizedValues = {
        ...values,
        latitud: values.latitud.toString().replace(",", "."),
        longitud: values.longitud.toString().replace(",", "."),
      };

      const response = await fetch(`/api/centros-salud/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(normalizedValues),
      });

      if (response.ok) {
        const responseData = await response.json();

        // Mostrar estado de éxito
        setOverlayState({
          show: true,
          type: "success",
          message: "Centro actualizado correctamente",
        });

        // Redirigir después de mostrar el éxito
        setTimeout(() => {
          router.push("/admin/mapas");
        }, 2000);
      } else {
        // Manejar diferentes tipos de errores HTTP con mensajes genéricos
        let errorMessage = "Error al procesar la solicitud";
        let errorTitle = "Error";

        try {
          const errorData = await response.json();
          console.error("❌ Error del servidor:", errorData);

          // Determinar el tipo de error basado en el status - mensajes genéricos
          switch (response.status) {
            case 400:
              errorTitle = "❌ Datos Inválidos";
              if (errorData.errores && Array.isArray(errorData.errores)) {
                // Solo mostrar errores de validación de campos, no errores internos
                const erroresValidacion = errorData.errores.filter(
                  (error) =>
                    !error.toLowerCase().includes("database") &&
                    !error.toLowerCase().includes("sql") &&
                    !error.toLowerCase().includes("postgres") &&
                    !error.toLowerCase().includes("function")
                );
                if (erroresValidacion.length > 0) {
                  errorMessage =
                    "Se encontraron errores en los datos:\n• " +
                    erroresValidacion.join("\n• ");
                } else {
                  errorMessage =
                    "Los datos enviados no son válidos. Por favor revise la información";
                }
              } else {
                errorMessage =
                  "Los datos enviados no son válidos. Por favor revise la información";
              }
              break;

            case 404:
              errorTitle = "❌ No Encontrado";
              errorMessage = "El elemento solicitado no existe";
              break;

            case 500:
              errorTitle = "❌ Error del Sistema";
              errorMessage =
                "Error interno del sistema. Por favor, inténtelo más tarde";
              break;

            default:
              errorTitle = "❌ Error";
              errorMessage =
                "Error al procesar la solicitud. Por favor, inténtelo nuevamente";
          }
        } catch (parseError) {
          console.error(
            "❌ Error parseando respuesta del servidor:",
            parseError
          );
          errorTitle = "❌ Error de Comunicación";
          errorMessage = "Error de comunicación con el servidor";
        }

        // Mostrar error con overlay
        setOverlayState({
          show: true,
          type: "error",
          message: errorMessage,
        });

        // Cerrar overlay después de un tiempo
        setTimeout(() => {
          setOverlayState({ show: false, type: "", message: "" });
        }, 4000);
      }
    } catch (error) {
      console.error("❌ Error de conexión:", error);

      // Errores de conexión - mensajes genéricos sin detalles técnicos
      let errorMessage = "Error de conexión";
      let errorTitle = "❌ Error de Conexión";

      if (error.name === "TypeError" && error.message.includes("fetch")) {
        errorTitle = "❌ Sin Conexión";
        errorMessage = "No se pudo conectar al servidor. Verifique su conexión";
      } else if (error.name === "AbortError") {
        errorTitle = "❌ Tiempo Agotado";
        errorMessage =
          "La operación tardó demasiado tiempo. Inténtelo nuevamente";
      } else {
        errorMessage = "Error al procesar la solicitud. Inténtelo nuevamente";
      }

      // Mostrar error de conexión con overlay
      setOverlayState({
        show: true,
        type: "error",
        message: errorMessage,
      });

      // Cerrar overlay después de un tiempo
      setTimeout(() => {
        setOverlayState({ show: false, type: "", message: "" });
      }, 4000);
    } finally {
      setLoading(false);
    }
  };

  // Preparar datos para los selects
  const categoriasData = Array.isArray(categorias)
    ? categorias.map((categoria) => ({
        value: categoria.id?.toString() || "",
        label: categoria.categoria || "",
      }))
    : [];

  const tiposData = Array.isArray(tipos)
    ? tipos.map((tipo) => ({
        value: tipo.id?.toString() || "",
        label: tipo.tipo || "",
      }))
    : [];

  const serviciosData = Array.isArray(servicios)
    ? servicios
        .map((servicio) => {
          // Asegurar que tenemos un ID válido para el servicio
          const id = servicio.id || servicio.value;
          const label = servicio.tipo || servicio.label;

          return {
            value: id ? id.toString() : "",
            label: label || "",
          };
        })
        .filter((item) => item.value && item.label)
    : [];

  if (status === "loading" || authLoading || loadingData) {
    return (
      <LoadingScreen
        message={authLoading ? "Verificando autenticación..." : loadingMessage}
        showBackButton={true}
        backHref="/admin/mapas"
        backText="Volver a Gestión de Mapas"
      />
    );
  }

  // Si no hay sesión, no mostrar nada (el useEffect redirigirá)
  if (!session) {
    return null;
  }

  if (!centro) {
    return (
      <Container size="md" py="xl">
        <Paper p="xl" withBorder>
          <Stack align="center" spacing="lg">
            <Title order={3} color="red">
              Centro de Salud No Encontrado
            </Title>
            <Text size="md" color="dimmed" ta="center">
              El centro de salud que intenta editar no existe o ha sido
              eliminado.
            </Text>
            <Group spacing="md">
              <Button
                variant="light"
                onClick={() => router.push("/admin/mapas")}
                leftIcon={<IconArrowLeft size={16} />}
              >
                Volver a Gestión de Mapas
              </Button>
              <Button
                onClick={() => router.push("/admin/dashboard")}
                leftIcon={<IconHome size={16} />}
              >
                Ir al Dashboard
              </Button>
            </Group>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <>
      {/* Overlay de carga/éxito/error durante procesos */}
      {overlayState.show && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Paper
            p="xl"
            withBorder
            style={{ maxWidth: "400px", textAlign: "center" }}
          >
            <Stack spacing="md" align="center">
              {overlayState.type === "loading" && (
                <>
                  <Loader size="lg" color="#FF0048" />
                  <Title order={4}>{overlayState.message}</Title>
                  <Text size="sm" color="dimmed">
                    Por favor espere mientras se actualiza la información del
                    centro de salud
                  </Text>
                </>
              )}
              {overlayState.type === "success" && (
                <>
                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "50%",
                      backgroundColor: "#28a745",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "32px",
                      color: "white",
                    }}
                  >
                    ✓
                  </div>
                  <Title order={4} color="green">
                    {overlayState.message}
                  </Title>
                  <Text size="sm" color="dimmed">
                    Redirigiendo a la gestión de mapas...
                  </Text>
                </>
              )}
              {overlayState.type === "error" && (
                <>
                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "50%",
                      backgroundColor: "#dc3545",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "32px",
                      color: "white",
                    }}
                  >
                    ✕
                  </div>
                  <Title order={4} color="red">
                    Error al actualizar
                  </Title>
                  <Text size="sm" color="dimmed">
                    {overlayState.message}
                  </Text>
                </>
              )}
            </Stack>
          </Paper>
        </div>
      )}

      <Container size="md" py="xl">
        {/* Breadcrumb de navegación */}
        <Breadcrumbs mb="md">
          <Anchor
            onClick={() => router.push("/admin/dashboard")}
            style={{ cursor: "pointer" }}
          >
            <Group spacing={5}>
              <IconHome size={16} />
              <span>Admin Dashboard</span>
            </Group>
          </Anchor>
          <Anchor
            onClick={() => router.push("/admin/mapas")}
            style={{ cursor: "pointer" }}
          >
            <Group spacing={5}>
              <IconSettings size={16} />
              <span>Gestión de Mapas</span>
            </Group>
          </Anchor>
          <Text>Editar Centro</Text>
        </Breadcrumbs>

        <Paper p="xl" withBorder>
          <Stack spacing="md">
            {/* Header */}
            <Group justify="space-between" w="100%">
              <Stack spacing={5}>
                <Title order={2}>Editar Centro de Salud</Title>
                <Text size="sm" color="dimmed">
                  Modifique la información del centro: {centro?.nombre}
                </Text>
              </Stack>
              <Button
                variant="light"
                color="blue"
                leftIcon={<IconArrowLeft size={16} />}
                onClick={() => router.push("/admin/mapas")}
                size="md"
              >
                Volver
              </Button>
            </Group>

            <Divider />

            {/* Formulario */}
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack spacing="md">
                {/* Información básica */}
                <Title order={4}>Información Básica</Title>

                <TextInput
                  label="Nombre del Centro"
                  placeholder="Ingrese el nombre del centro"
                  required
                  {...form.getInputProps("nombre")}
                />

                <TextInput
                  label="Dirección"
                  placeholder="Ingrese la dirección completa"
                  required
                  {...form.getInputProps("direccion")}
                />

                <Group grow>
                  <Select
                    label="Categoría"
                    placeholder="Seleccione una categoría"
                    data={categoriasData}
                    required
                    searchable
                    {...form.getInputProps("categoria_id")}
                  />

                  <Select
                    label="Tipo"
                    placeholder="Seleccione un tipo"
                    data={tiposData}
                    required
                    searchable
                    {...form.getInputProps("tipo_id")}
                  />
                </Group>

                <MultiSelect
                  label="Servicios"
                  placeholder="Seleccione los servicios disponibles"
                  data={serviciosData}
                  searchable
                  required
                  {...form.getInputProps("servicios_ids")}
                />

                <Divider />

                {/* Información de contacto */}
                <Title order={4}>Información de Contacto</Title>

                <TextInput
                  label="Teléfono"
                  placeholder="Ej: +595 21 123456"
                  required
                  {...form.getInputProps("telefono")}
                />

                <Textarea
                  label="Descripción"
                  placeholder="Descripción del centro de salud"
                  minRows={2}
                  {...form.getInputProps("descripcion")}
                />

                <Textarea
                  label="Días y Horarios"
                  placeholder="Ej: Lunes a Viernes: 7:00 - 17:00"
                  minRows={2}
                  {...form.getInputProps("dias_horas")}
                />

                <Divider />

                {/* Ubicación */}
                <Title order={4}>Ubicación</Title>

                <Alert color="blue" variant="light">
                  <Text size="sm">
                    <strong>Coordenadas GPS:</strong> Puede obtener las
                    coordenadas exactas desde Google Maps haciendo clic derecho
                    en la ubicación. Las coordenadas pueden ser negativas (ej:
                    -44.0000, -65.0000). Formato: Latitud entre -90 y 90,
                    Longitud entre -180 y 180.
                  </Text>
                </Alert>

                <Group grow>
                  <TextInput
                    label="Latitud"
                    placeholder="Ej: -25,2637 o -45,851511100"
                    required
                    {...form.getInputProps("latitud")}
                    rightSection={
                      form.values.latitud &&
                      (isNaN(
                        parseFloat(
                          form.values.latitud.toString().replace(",", ".")
                        )
                      ) ||
                        parseFloat(
                          form.values.latitud.toString().replace(",", ".")
                        ) < -90 ||
                        parseFloat(
                          form.values.latitud.toString().replace(",", ".")
                        ) > 90) ? (
                        <IconX size={16} color="red" />
                      ) : form.values.latitud ? (
                        <IconCheck size={16} color="green" />
                      ) : null
                    }
                  />

                  <TextInput
                    label="Longitud"
                    placeholder="Ej: -57,5759 o -65,000000000"
                    required
                    {...form.getInputProps("longitud")}
                    rightSection={
                      form.values.longitud &&
                      (isNaN(
                        parseFloat(
                          form.values.longitud.toString().replace(",", ".")
                        )
                      ) ||
                        parseFloat(
                          form.values.longitud.toString().replace(",", ".")
                        ) < -180 ||
                        parseFloat(
                          form.values.longitud.toString().replace(",", ".")
                        ) > 180) ? (
                        <IconX size={16} color="red" />
                      ) : form.values.longitud ? (
                        <IconCheck size={16} color="green" />
                      ) : null
                    }
                  />
                </Group>

                {/* Botones de acción */}
                <Group position="right" spacing="md" mt="xl">
                  <Button
                    variant="outline"
                    color="gray"
                    onClick={() => router.push("/admin/mapas")}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    loading={loading}
                    leftIcon={<IconDeviceFloppy size={16} />}
                    color="green"
                  >
                    Guardar Cambios
                  </Button>
                </Group>
              </Stack>
            </form>
          </Stack>
        </Paper>
      </Container>
    </>
  );
};

export default EditarCentro;
