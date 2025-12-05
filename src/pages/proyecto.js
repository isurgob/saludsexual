import {
  Container,
  Title,
  Text,
  Box,
  Stack,
  Group,
  Image,
  Paper,
  SimpleGrid,
  Button,
} from "@mantine/core";
import Link from "next/link";

export default function Proyecto() {
  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Box ta="center">
          <Title order={1} size="h1" mb="md" className="page-title">
            Nuestro Trabajo
          </Title>
        </Box>

        <Box>
          <Text size="lg" lh={1.6} mb="xl">
            En julio de 2024, Comodoro Rivadavia se convirtió en el primer municipio de la Patagonia en adherir a la <strong>Declaración de París</strong>, una iniciativa impulsada por ONUSIDA que convoca a gobiernos locales de todo el mundo a unir esfuerzos para poner fin a la epidemia de VIH para el año 2030, promoviendo la equidad, la inclusión y el respeto por los derechos humanos.
          </Text>

          <Text size="lg" lh={1.6} mb="xl">
            La adhesión representa un compromiso político y social del Municipio para fortalecer la prevención, detección temprana y acompañamiento de las personas que conviven con VIH y otras infecciones de transmisión sexual.
          </Text>

          <Text size="lg" lh={1.6} mb="xl">
            Como parte de las acciones locales que se desprenden de este compromiso, desde la <strong>Secretaría de Salud Municipal</strong> junto a la <strong>Agencia Comodoro Conocimiento</strong>, con el apoyo del <strong>Programa de las Naciones Unidas para el Desarrollo (PNUD) en Argentina</strong>, se impulsó esta plataforma digital que reúne información confiable y facilita el acceso a los servicios de salud del Municipio de Comodoro Rivadavia mediante un mapa georreferenciado y un chatbot interactivo disponible en la web y en WhatsApp.
          </Text>

          <Text size="lg" lh={1.6} mb="xl">
            Esta herramienta digital busca acercar información confiable, orientación y recursos a toda la comunidad, fortaleciendo el acceso al cuidado de la salud sexual y reproductiva desde una perspectiva de derechos.
          </Text>

          <Text size="lg" lh={1.6} mb="xl">
            Es una plataforma de código abierto, disponible en: <Text component="a" href="https://github.com/ChatBot-Comodoro/saludsexual" target="_blank" rel="noopener noreferrer" style={{ color: '#FF0048', textDecoration: 'underline' }}>https://github.com/ChatBot-Comodoro/saludsexual</Text>.
          </Text>

          <Text size="lg" lh={1.6} mb="md">
            Al recorrer y utilizar esta plataforma estás aceptando nuestras políticas de privacidad.
          </Text>

          <Group justify="center" mt="md">
            <Button 
              component={Link} 
              href="/politicas-privacidad"
              variant="outline"
              color="#FF0048"
              size="md"
            >
              Ver Políticas de Privacidad
            </Button>
          </Group>
        </Box>

        {/* Sección de Organizaciones Participantes */}
        

        {/* Texto informativo */}
        <Box style={{ borderTop: "2px solid #FFF2F6" }}>
          <Text size="sm" ta="start" c="dimmed" lh={1.5} >
            Esta iniciativa de Soluciones Digitales en Salud fue apoyada en su diseño y desarrollo por el <strong>Programa de las Naciones Unidas para el Desarrollo (PNUD)</strong>. Corresponde al <strong>Municipio de Comodoro Rivadavia</strong> la actualización de los contenidos. Las opiniones, designaciones y recomendaciones que se presentan en esta web, el ChatBot y las herramientas derivadas de este desarrollo y solución digital no reflejan necesariamente la posición oficial de PNUD.
          </Text>
          <Text size="xs" ta="center" c="dimmed" mt="md" fw={600}>
            OCTUBRE DE 2025
          </Text>
        </Box>
      </Stack>
    </Container>
  );
}
