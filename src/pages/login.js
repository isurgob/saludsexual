import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Title,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Box,
  Alert,
  Group,
  ThemeIcon,
  Anchor
} from '@mantine/core';
import {
  IconUser,
  IconLock,
  IconLogin,
  IconShield,
  IconAlertCircle
} from '@tabler/icons-react';
import { useRouter } from 'next/router';
import { signIn, signOut, useSession } from 'next-auth/react';
import Head from 'next/head';
import { hashPassword, validatePassword } from '../utils/passwordUtils';

export default function Login() {
  const [credentials, setCredentials] = useState({
    correo: '',
    contrasena: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const router = useRouter();
  const { data: session, status } = useSession();

  // Mostrar errores de la URL (como permisos denegados)
  useEffect(() => {
    if (router.query.error === 'PermissionDenied') {
      setError('No tienes permisos para acceder a esa sección');
    }
  }, [router.query.error]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (loading) return; // Evitar doble submit
    
    setLoading(true);
    setError('');

    try {
      // Validar contraseña antes de procesar
      const passwordValidation = validatePassword(credentials.contrasena);
      if (!passwordValidation.isValid) {
        setError(passwordValidation.message);
        setLoading(false);
        return;
      }

      
      // SEGURIDAD: Hashear contraseña antes de enviar
      const hashedPassword = hashPassword(credentials.contrasena, credentials.correo);
      
      const result = await signIn('credentials', {
        correo: credentials.correo,
        contrasena: hashedPassword, // Enviar hash, no texto plano
        callbackUrl: '/admin/dashboard', // NextAuth redirigirá aquí automáticamente
      });

      // NextAuth maneja la redirección automáticamente
      // NO hacer redirección manual aquí
      
    } catch (error) {
      console.error('❌ Error en handleSubmit:', error);
      setError('Error de conexión. Intenta nuevamente.');
      setLoading(false);
    }
    // NO setLoading(false) aquí porque la página se redirigirá
  };
  const handleInputChange = (field, value) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };



  // Mostrar loading si NextAuth está resolviendo la sesión
  if (status === 'loading') {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Verificando sesión...</div>
      </div>
    );
  }

  // Si ya está autenticado, mostrar opción de ir al dashboard o cerrar sesión
  if (status === 'authenticated') {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        gap: '20px'
      }}>
        <div>Ya tienes una sesión activa como: {session?.user?.name}</div>
        <Group>
          <Button onClick={() => router.push('/admin/dashboard')}>
            Ir al Dashboard
          </Button>
          <Button variant="outline" onClick={() => signOut()}>
            Cerrar Sesión
          </Button>
        </Group>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Iniciar Sesión - Panel Administrativo</title>
        <meta name="description" content="Acceso al panel administrativo del chatbot" />
      </Head>



      <Box
        style={{
          minHeight: '70vh',
          backgroundColor: '#f8f9fa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
      >
        <Container size="xs">
          <Stack gap="xl">
            {/* Header */}
            <Box ta="center">
              <ThemeIcon size={60} radius="50%" variant="light" color="#4A90E2" mb="md">
                <IconShield size={32} />
              </ThemeIcon>
              <Title order={1} c="#2c3e50" mb="xs">
                Panel Administrativo
              </Title>
              <Text c="#6c757d" size="lg">
                Chatbot Comodoro Salud
              </Text>
            </Box>

            {/* Login Form */}
            <Paper shadow="xl" p="xl" radius="lg" withBorder bg="white">
              <Stack gap="md">
                <Box ta="center" mb="md">
                  <Title order={2} size="h3" mb="xs" c="#2c3e50">
                    Iniciar Sesión
                  </Title>
                  <Text size="sm" c="dimmed">
                    Accede al panel de administración
                  </Text>
                </Box>

                {error && (
                  <Alert 
                    icon={<IconAlertCircle size={16} />} 
                    color="red" 
                    variant="light"
                    radius="md"
                  >
                    {error}
                  </Alert>
                )}

                <form onSubmit={handleSubmit}>
                  <Stack gap="md">
                    <TextInput
                      label="Correo Electrónico"
                      placeholder="correo@ejemplo.com"
                      type="email"
                      value={credentials.correo}
                      onChange={(e) => handleInputChange('correo', e.target.value)}
                      leftSection={<IconUser size={16} />}
                      size="md"
                      required
                    />

                    <PasswordInput
                      label="Contraseña"
                      placeholder="Ingresa tu contraseña"
                      value={credentials.contrasena}
                      onChange={(e) => handleInputChange('contrasena', e.target.value)}
                      leftSection={<IconLock size={16} />}
                      size="md"
                      required
                    />

                    <Box ta="right">
                      <Button 
                        variant="subtle" 
                        size="sm"
                        onClick={() => router.push('/forgot-password')}
                        style={{ color: '#4A90E2', padding: 0, height: 'auto' }}
                      >
                        ¿Olvidaste tu contraseña?
                      </Button>
                    </Box>

                    <Button
                      type="submit"
                      loading={loading}
                      leftSection={<IconLogin size={16} />}
                      size="lg"
                      radius="md"
                      fullWidth
                      mt="md"
                      color="#4A90E2"
                      style={{
                        backgroundColor: '#4A90E2',
                        '&:hover': {
                          backgroundColor: '#357abd'
                        }
                      }}
                    >
                      {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </Button>
                  </Stack>
                </form>
              </Stack>
            </Paper>

           
          </Stack>
        </Container>
      </Box>
    </>
  );
}
