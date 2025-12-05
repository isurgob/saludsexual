import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  Container,
  Title,
  Text,
  Box,
  Group,
  Button,
  Paper,
  Alert,
  Stack,
  Menu,
  Avatar,
  UnstyledButton,
  Breadcrumbs,
  Anchor
} from '@mantine/core';
import {
  IconArticle,
  IconPlus,
  IconInfoCircle,
  IconArrowLeft,
  IconDashboard,
  IconLogout,
  IconChevronRight
} from '@tabler/icons-react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import LoadingScreen from '../../components/LoadingScreen';
import AdminArticles from '../../components/admin/AdminArticles';

export default function ArticlesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);

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
      <Head>
        <title>Gestión de Artículos - Panel Administrativo</title>
        <meta name="description" content="Administrar artículos dinámicos del sitio web" />
      </Head>

      {/* Header */}
      <Box bg="white" style={{ borderBottom: "1px solid #e9ecef" }}>
        <Container size="xl">
          <Group h={70} justify="space-between">
            <Group>
              <IconArticle size={28} color="#1B436B" />
              <div>
                <Text fw={700} size="lg" c="brand.5">
                  Gestión de Artículos
                </Text>
                <Text size="sm" c="dimmed">
                  Sistema dinámico de contenido
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
                    leftSection={<IconDashboard size={14} />}
                    component={Link}
                    href="/admin/dashboard"
                  >
                    Tablero
                  </Menu.Item>
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

      {/* Breadcrumbs */}
      <Box bg="gray.0" py="sm">
        <Container size="xl">
          <Breadcrumbs>
            <Anchor component={Link} href="/admin/dashboard" c="brand.5">
              Tablero
            </Anchor>
            <Text c="dimmed">Gestión de Artículos</Text>
          </Breadcrumbs>
        </Container>
      </Box>

      <Container
        size="xl"
        py="xl"
        style={{ backgroundColor: "#f8f9fa", minHeight: "calc(100vh - 120px)" }}
      >
        <Stack gap="xl">
          

          {/* Componente principal de gestión */}
          <Paper withBorder p="lg" style={{ backgroundColor: 'white' }}>
            <AdminArticles />
          </Paper>
        </Stack>
      </Container>
    </>
  );
}
