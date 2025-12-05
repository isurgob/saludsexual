import {
  Container,
  Grid,
  Loader,
  Title,
  Text,
  Box,
  Stack,
  Button,
  Group,
  Card,
  SimpleGrid,
  ThemeIcon,
  ActionIcon,
  ScrollArea,
} from "@mantine/core";
import {
  IconHeartHandshake,
  IconMessageCircle,
  IconQuestionMark,
  IconPhone,
  IconChevronLeft,
  IconChevronRight,
  IconMap,
} from "@tabler/icons-react";
import Link from "next/link";
import Head from "next/head";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRef } from "react";
import {
  HivIcon,
  VacunaIcon,
  TestIcon,
  LaboratorioIcon,
  PreservativoIcon,
  VirusIcon,
  BalanzaIcon,
  EmbarazoIcon,
  ApoyoIcon,
  MapaIcon,
  HospitalPinIcon,
  PrevencionCombinadaIcon,
} from "../components/icons";
// Importar el mapa compacto dinámicamente para evitar problemas de SSR
const CompactMap = dynamic(
  () => import("@/components/InteractiveMap/CompactMap"),
  {
    ssr: false,
    loading: () => (
      <Box
        h={400}
        bg="gray.1"
        radius="md"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Stack align="center" ta="center">
          <Loader size="lg" />
          <Text size="lg" fw={500} c="gray.6">
            Cargando mapa...
          </Text>
        </Stack>
      </Box>
    ),
  }
);

const features = [
  {
    icon: HivIcon,
    title: "VIH",
    description: "Prevención, diagnóstico y tratamiento del VIH",
    color: "violet",
    href: "/vih",
  },
  {
    icon: VirusIcon,
    title: "ITS",
    description:
      "Infecciones de transmisión sexual: sífilis, gonorrea, clamidia, HPV",
    color: "red",
    href: "/its",
  },
  {
    icon: HospitalPinIcon,
    title: "Centros de Atención y Testeo",
    description:
      "Centros de atención y testeos en Comodoro Rivadavia",
    color: "red",
    href: "/mapa",
  },
  {
    icon: BalanzaIcon,
    title: "Conocé tus derechos",
    description: "Derechos y marco legal en salud sexual y reproductiva",
    color: "blue",
    href: "/conoce-tus-derechos",
  },
  {
    icon: PrevencionCombinadaIcon,
    title: "Prevención combinada",
    description: "Prevención combinada: estrategias y métodos",
    color: "blue",
    href: "/prevencion-combinada",
  },
  {
    icon: VacunaIcon,
    title: "Vacunación",
    description: "Vacunación específica",
    color: "green",
    href: "/vacunacion",
  },
  {
    icon: TestIcon,
    title: "Testeos",
    description: "Tests rápidos y dónde realizarlos",
    color: "orange",
    href: "/testeos",
  },
  {
    icon: EmbarazoIcon,
    title: "Embarazo y lactancia",
    description: "Cuidados, controles y prevención durante el embarazo",
    color: "purple",
    href: "/embarazo-lactancia",
  },
  {
    icon: ApoyoIcon,
    title: "Si tenés VIH, te acompañamos",
    description: "Información útil para personas con VIH - No estás sol@",
    color: "teal",
    href: "/apoyo-vih",
  },
  {
    icon: PreservativoIcon,
    title: "Preservativos",
    description: "Uso correcto, tipos y consejos para una protección efectiva",
    color: "indigo",
    href: "/preservativos",
  },
];

export default function Home() {
  const scrollRef = useRef(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      // Buscar el viewport del ScrollArea
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
   
      
      if (viewport) {
        // Usar scrollTo para mayor compatibilidad
        const currentScrollLeft = viewport.scrollLeft;
        viewport.scrollTo({
          left: currentScrollLeft - 300,
          behavior: 'smooth'
        });
      } else {
        // Fallback: buscar cualquier elemento con scroll
        const scrollableElement = scrollRef.current.querySelector('div[style*="overflow"]') || scrollRef.current;
        if (scrollableElement) {
          scrollableElement.scrollLeft -= 300;
        }
      }
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      // Buscar el viewport del ScrollArea
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      
      if (viewport) {
        // Usar scrollTo para mayor compatibilidad
        const currentScrollLeft = viewport.scrollLeft;
        viewport.scrollTo({
          left: currentScrollLeft + 300,
          behavior: 'smooth'
        });
      } else {
        // Fallback: buscar cualquier elemento con scroll
        const scrollableElement = scrollRef.current.querySelector('div[style*="overflow"]') || scrollRef.current;
        if (scrollableElement) {
          scrollableElement.scrollLeft += 300;
        }
      }
    }
  };

  return (
    <>
      <Head>
        <title>Comodoro Salud </title>
        <meta
          name="description"
          content="Sitio web sobre salud sexual con un chatbot de Salud Sexual del Municipio de Comodoro Rivadavia. Información sobre salud, VIH, ITS, anticonceptivos, embarazo y más."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Container size="md" py="sm">
        <Stack gap="md">
          {/* Hero Section with Banner */}
          <Box ta="center" pt={0} pb="sm">
            <Box
              mb="sm"
              style={{
                width: "100%",
                maxWidth: "1200px",
                margin: "0 auto",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              }}
            >
              <Image
                src="/bannerfinalsalud.png"
                alt="Banner Salud Comodoro"
                width={800}
                height={400}
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                  maxHeight: "400px",
                  objectFit: "cover",
                }}
                priority
              />
            </Box>

            <Title
              order={1}
              size="2.5rem"
              mb="md"
              mt={30}
              className="page-title"
            >
              ¡Sacate todas tus dudas sobre salud sexual!
            </Title>
            <Text size="lg" c="dimmed" maw={600} mx="auto" mb="xl" mt={10}>
              Chateá con nuestro chatbot de forma anónima y confidencial.
              Encontrá información confiable sobre temas de salud sexual.
            </Text>
            <Group justify="center" gap="md">
              <Button
                component={Link}
                href="/chat"
                size="lg"
                variant="outline"
                leftSection={<IconMessageCircle size={20} />}
                radius="xl"
              >
                Conocé más sobre el chat
              </Button>
              {/*  <Text size="sm" c="dimmed">
              comenzá a chatear con el botón flotante 💬 en la esquina inferior derecha
            </Text> */}
            </Group>
              <Group justify="center" gap="md" pt={10}>
            <Button
              component={Link}
              href="/mapa"
              size="lg"
              variant="outline"
              leftSection={<IconMap size={20} />}
              radius="xl"
            >
              Quiero testearme
            </Button>
          </Group>
          
          </Box>

          {/* Topics Section */}
          <Box>
            <Title order={2} ta="center" mb="xl">
              Explorá información sobre distintos temas
            </Title>

            {/* Indicador para móviles */}
            <Text size="sm" c="dimmed" ta="center" mb="md" hiddenFrom="sm">
              👆 Desliza horizontalmente para ver más temas
            </Text>

            {/* Carrusel Container con ScrollArea y Flechas */}
            <Box pos="relative">
              {/* Botón Izquierdo */}
              <ActionIcon
                variant="filled"
                size="lg"
                radius="xl"
                color="pink"
                pos="absolute"
                left={-10}
                top="50%"
                style={{
                  transform: "translateY(-50%)",
                  zIndex: 10,
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                }}
                onClick={scrollLeft}
                visibleFrom="sm"
              >
                <IconChevronLeft size={20} />
              </ActionIcon>

              {/* ScrollArea horizontal de Mantine */}
              <ScrollArea 
                ref={scrollRef}
                w="100%"
                type="always"
                offsetScrollbars
                scrollbarSize={12}
                scrollHideDelay={0}
                styles={{
                  scrollbar: {
                    '&[data-orientation="vertical"]': {
                      display: 'none !important',
                    },
                  },
                }}
              >
                <Box style={{ display: 'flex', gap: '16px', padding: '16px 40px' }}>
                  {features.map((feature, index) => (
                    <Card
                      key={index}
                      component={Link}
                      href={feature.href}
                      shadow="sm"
                      padding="lg"
                      radius="md"
                      withBorder
                      style={{
                        cursor: "pointer",
                        transition: "transform 0.2s",
                        textDecoration: "none",
                        color: "inherit",
                        minWidth: "220px",
                        width: "220px",
                        flexShrink: 0,
                      }}
                      className="hover-card"
                    >
                      <Stack align="center" ta="center" gap="sm">
                        <ThemeIcon
                          size={90}
                          radius="50%"
                          variant="filled"
                          style={{ backgroundColor: "#FFF2F6" }}
                        >
                          <feature.icon size={64} />
                        </ThemeIcon>
                        <Title order={4} size="1.1rem">
                          {feature.title}
                        </Title>
                        <Text size="sm" c="dimmed">
                          {feature.description}
                        </Text>
                      </Stack>
                    </Card>
                  ))}
                </Box>
              </ScrollArea>

              {/* Botón Derecho */}
              <ActionIcon
                variant="filled"
                size="lg"
                radius="xl"
                color="pink"
                pos="absolute"
                right={-10}
                top="50%"
                style={{
                  transform: "translateY(-50%)",
                  zIndex: 10,
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                }}
                onClick={scrollRight}
                visibleFrom="sm"
              >
                <IconChevronRight size={20} />
              </ActionIcon>
            </Box>
          </Box>

        
        </Stack>

        <style jsx global>{`
          .hover-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
          }

          /* Personalización de ScrollArea - Solo horizontal con color rosa original */
          .mantine-ScrollArea-scrollbar {
            background-color: #f1f3f4 !important;
            border-radius: 6px;
            opacity: 1 !important;
          }
          
          .mantine-ScrollArea-thumb {
            background: linear-gradient(90deg, #e64980, #f06595) !important;
            border-radius: 6px;
            opacity: 1 !important;
          }
          
          .mantine-ScrollArea-scrollbar:hover .mantine-ScrollArea-thumb {
            background: linear-gradient(90deg, #d63384, #e64980) !important;
          }
          
          /* Asegurar que la scrollbar siempre esté visible */
          .mantine-ScrollArea-scrollbar[data-state="visible"],
          .mantine-ScrollArea-scrollbar[data-state="hidden"] {
            opacity: 1 !important;
          }
          
          /* Solo ocultar scrollbar vertical */
          .mantine-ScrollArea-scrollbar[data-orientation="vertical"] {
            display: none !important;
          }
        `}</style>
      </Container>
    </>
  );
}
