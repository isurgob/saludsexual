import React from "react";
import {
  Box,
  Text,
  Container,
  Stack,
  Flex,
  Image,
  Group,
  Anchor,
} from "@mantine/core";
import {
  IconHeart,
  IconMapPin,
  IconTestPipe,
  IconStethoscope,
  IconPhone,
} from "@tabler/icons-react";
import Link from "next/link";
import styles from "./Footer.module.css";

const Footer = () => {
  return (
    <Box className={styles.footer}>
      <Container size="xl" py="xl">
        {/* Información de Contacto Institucional */}
        <Stack gap="sm" mb="xl" align="center">
          <Text size="sm" fw={600} c="white" mb="sm">
            Contactos Institucionales
          </Text>
          
          <Group 
            justify={{ base: "flex-start", md: "space-between" }} 
            gap="xl" 
            wrap="wrap" 
            w="100%"
            align="flex-start"
          >
            {/* Columna 1 - Responsive: izquierda en mobile, izquierda en desktop */}
            <Stack 
              gap="sm" 
              align={{ base: "flex-start", md: "flex-start" }} 
              miw={300} 
              style={{ flex: 1 }}
            >
              {/* NUEVO: Secretaría de Salud - PRIMERO */}
              <Stack gap={2} align="flex-start">
                <Text size="xs" c="white" fw={500} ta="left">
                  <IconPhone size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  Secretaría de Salud
                </Text>
                <Text size="xs" c="white" opacity={0.9} ta="left">Sarmiento 680 - Tel. 4461151</Text>
              </Stack>
              
              <Stack gap={2} align="flex-start">
                <Text size="xs" c="white" fw={500} ta="left">Secretaría de la Mujer</Text>
                <Text size="xs" c="white" opacity={0.9} ta="left">Tel. 4063157</Text>
              </Stack>
              
              <Stack gap={2} align="flex-start">
                <Text size="xs" c="white" fw={500} ta="left">Dir. Gral. de Protección Integral de Derechos de la Mujer, Género, Juventud y Diversidad</Text>
                <Text size="xs" c="white" opacity={0.9} ta="left">Tel. 297155370262</Text>
              </Stack>
            </Stack>
            
            {/* Columna 2 - Responsive: izquierda en mobile, derecha en desktop */}
            <Stack 
              gap="sm" 
              align={{ base: "flex-start", md: "flex-end" }} 
              miw={300} 
              style={{ flex: 1 }}
            >
              <Stack gap={2} align={{ base: "flex-start", md: "flex-end" }}>
                <Text size="xs" c="white" fw={500} ta={{ base: "left", md: "right" }}>Guardia Secretaría de la Mujer, Género, Juventud y Diversidad</Text>
                <Text size="xs" c="white" opacity={0.9} ta={{ base: "left", md: "right" }}>Tel. 297154130813</Text>
              </Stack>
              
              <Stack gap={2} align={{ base: "flex-start", md: "flex-end" }}>
                <Text size="xs" c="white" fw={500} ta={{ base: "left", md: "right" }}>Dir. de Diversidad LGBTIQ+ y Nuevas Mayorías</Text>
                <Text size="xs" c="white" opacity={0.9} ta={{ base: "left", md: "right" }}>Tel. 4486950</Text>
              </Stack>
            </Stack>
          </Group>
        </Stack>

        {/* Divisor */}
        <Box className={styles.divider} />

        {/* Logos institucionales */}
        <Flex justify="center" align="center" direction="column" mb="xl">
          <Group 
            justify="center" 
            align="center" 
            gap={{ base: "md", sm: "lg", md: "xl" }}
            wrap="wrap"
            w="100%"
          >
            <Image
              src="/logo_footer.png"
              alt="Escudo Municipal"
              className={styles.footerImage}
              fit="contain"
              w={{ base: "auto", xs: "auto", sm: "auto" }}
              maw={{ base: 180, xs: 200, sm: 220, md: 240 }}
              style={{ height: 'auto' }}
            />
            <Image
              src="/logo_salud.png"
              alt="Logo Salud"
              className={styles.footerImage}
              fit="contain"
              w={{ base: "auto", xs: "auto", sm: "auto" }}
              maw={{ base: 110, xs: 130, sm: 150, md: 170 }}
              style={{ height: 'auto' }}
            />          
            <Image
              src="/comodoro-conocimiento.png"
              alt="Agencia Comodoro Conocimiento Logo"
              className={styles.footerImage}
              fit="contain"
              w={{ base: "auto", xs: "auto", sm: "auto" }}
              maw={{ base: 140, xs: 160, sm: 180, md: 200 }}
              style={{ height: 'auto' }}
            />
          </Group>
        </Flex>

        {/* Footer inferior */}
        <Box pt="md" className={styles.footerBottom}>
          <Stack gap="xs" align="center">
            <Text size="xs" c="white" ta="center" opacity={0.8}>
              © {new Date().getFullYear()} Municipalidad de Comodoro Rivadavia.
              Todos los derechos reservados.
            </Text>
            <Group gap={4} justify="center">
              <Text size="xs" c="white" opacity={0.7}>
                Hecho con
              </Text>
              <IconHeart size={12} color="#e74c3c" className={styles.heart} />
              <Text size="xs" c="white" opacity={0.7}>
                por iSUR
              </Text>
            </Group>
            
            {/* Logo de ISUR */}
            <Box mt="xs" w="100%" ta="center">
              <Image
                src="/isur.png"
                alt="ISUR Logo"
                className={styles.isurLogo}
                fit="contain"
                w="auto"
                maw={{ base: 120, xs: 140, sm: 160, md: 180 }}
                style={{ height: 'auto' }}
              />
            </Box>
          </Stack> 
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
