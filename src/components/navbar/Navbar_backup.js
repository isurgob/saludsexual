import React, { useState, useEffect } from 'react';
import {
  Text,
  Drawer,
  Stack,
  Box,
  ActionIcon,
  useMatches
} from '@mantine/core';
import {
  IconBrandFacebook, 
  IconBrandInstagram
} from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import classes from './Navbar.module.css';

const navigation = [
  
  { name: 'Inicio', href: '/' },
  
  { name: 'Nuestro Trabajo', href: '/proyecto' },
  { name: 'VIH', href: '/vih' },
  { name: 'ITS', href: '/its' },
  { name: 'Centros de atención y testeo', href: '/mapa' }
];

const Navbar = () => {
  const [opened, setOpened] = useState(false);
  const router = useRouter();

  // Usar useMatches de Mantine para responsividad con breakpoints más específicos
  const isMobile = useMatches({
    base: true,
    xs: true,
    sm: true,
    md: false,
    lg: false,
    xl: false,
  });

  const isTablet = useMatches({
    base: false,
    xs: false,
    sm: false,
    md: true,
    lg: false,
    xl: false,
  });

  const isDesktop = useMatches({
    base: false,
    xs: false,
    sm: false,
    md: false,
    lg: true,
    xl: true,
  });

  // Cerrar el drawer cuando cambie la ruta
  useEffect(() => {
    setOpened(false);
  }, [router.pathname]);

  return (
    <>
      <div 
        className={`${classes.header} navbar-header`}
        data-navbar-header="true"
        style={{
          backgroundColor: 'white',
          display: 'flex',
          alignItems: 'center',
          height: '60px',
          minHeight: '60px',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          width: '100vw',
          zIndex: 9999,
          borderBottom: '1px solid #e9ecef',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          visibility: 'visible',
          opacity: 1,
          // iOS Safari specific fixes
          WebkitTransform: 'translate3d(0, 0, 0)',
          transform: 'translate3d(0, 0, 0)',
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden',
          isolation: 'isolate',
          contain: 'layout style paint'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '100%',
            width: '100%',
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 1rem',
            backgroundColor: 'white',
            position: 'relative',
            zIndex: 10001
          }}
        >
          {/* Logo */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            flexShrink: 0,
            minWidth: 'fit-content',
            zIndex: 10002,
            position: 'relative',
            backgroundColor: 'white',
            padding: '5px'
          }}>
            <Link href="/" style={{ 
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img
                src="/logo_salud.png"
                alt="Logo de Salud"
                style={{
                  height: isMobile ? '45px' : '55px',
                  width: 'auto',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  display: 'block',
                  visibility: 'visible',
                  opacity: 1
                }}
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          {isDesktop && (
            <div style={{
              display: 'flex',
              gap: '1.5rem',
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 10001,
              position: 'relative',
              backgroundColor: 'white'
            }}>
              {navigation.map((item) => (
                <Link 
                  key={item.name} 
                  href={item.href} 
                  className={`${classes.link} ${router.pathname === item.href ? classes.linkActive : ''}`}
                  style={{
                    color: router.pathname === item.href ? '#1B436B' : '#495057',
                    textDecoration: 'none',
                    fontFamily: 'Montserrat, sans-serif',
                    fontWeight: 500,
                    fontSize: '0.95rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                    position: 'relative',
                    visibility: 'visible',
                    opacity: 1
                  }}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          )}

          {/* Tablet Navigation */}
          {isTablet && (
            <div style={{
              display: 'flex',
              flex: 1,
              margin: '0 1rem',
              overflowX: 'auto',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              zIndex: 10001,
              position: 'relative',
              backgroundColor: 'white'
            }}>
              <div style={{
                display: 'flex',
                minWidth: 'max-content',
                gap: '0.75rem',
                alignItems: 'center'
              }}>
                {navigation.map((item) => (
                  <Link 
                    key={item.name} 
                    href={item.href} 
                    style={{
                      color: router.pathname === item.href ? '#1B436B' : '#495057',
                      textDecoration: 'none',
                      fontFamily: 'Montserrat, sans-serif',
                      fontWeight: 500,
                      fontSize: '0.9rem',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      backgroundColor: router.pathname === item.href ? '#f8f9fa' : 'transparent',
                      visibility: 'visible',
                      opacity: 1
                    }}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Right Section */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.5rem',
            flexShrink: 0,
            minWidth: '60px',
            height: '60px',
            zIndex: 10002,
            position: 'relative',
            backgroundColor: 'white',
            padding: '5px'
          }}>
            {/* Social Icons - Solo visible en tablet y desktop */}
            {!isMobile && (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <a
                  href="https://www.facebook.com/mcrsecretariadesalud/?locale=es_LA"
                  style={{
                    color: '#6c757d',
                    padding: '8px',
                    borderRadius: '4px',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <IconBrandFacebook size={isTablet ? 16 : 20} />
                </a>
                <a
                  href="https://www.instagram.com/secretaria.de.salud.mcr/?hl=es"
                  style={{
                    color: '#6c757d',
                    padding: '8px',
                    borderRadius: '4px',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <IconBrandInstagram size={isTablet ? 16 : 20} />
                </a>
              </div>
            )}

            {/* Mobile Menu Button - Custom Hamburger */}
            {isMobile && (
              <button
                onClick={() => setOpened((o) => !o)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10003,
                  position: 'relative',
                  minWidth: '44px',
                  minHeight: '44px',
                  width: '44px',
                  height: '44px',
                  backgroundColor: 'white',
                  border: '2px solid #1B436B',
                  borderRadius: '8px',
                  padding: '0',
                  cursor: 'pointer',
                  visibility: 'visible',
                  opacity: 1,
                  // iOS specific optimizations
                  WebkitTapHighlightColor: 'rgba(27, 67, 107, 0.2)',
                  WebkitTouchCallout: 'none',
                  WebkitUserSelect: 'none',
                  userSelect: 'none',
                  touchAction: 'manipulation',
                  WebkitTransform: 'translate3d(0, 0, 0)',
                  transform: 'translate3d(0, 0, 0)'
                }}
              >
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '20px',
                  height: '20px',
                  gap: '3px'
                }}>
                  <div style={{
                    width: '20px',
                    height: '2px',
                    backgroundColor: '#1B436B',
                    borderRadius: '1px',
                    transition: 'all 0.3s ease',
                    transform: opened ? 'rotate(45deg) translate(5px, 5px)' : 'rotate(0deg)',
                    transformOrigin: 'center',
                    visibility: 'visible',
                    opacity: 1
                  }} />
                  <div style={{
                    width: '20px',
                    height: '2px',
                    backgroundColor: '#1B436B',
                    borderRadius: '1px',
                    transition: 'all 0.3s ease',
                    opacity: opened ? 0 : 1,
                    visibility: 'visible'
                  }} />
                  <div style={{
                    width: '20px',
                    height: '2px',
                    backgroundColor: '#1B436B',
                    borderRadius: '1px',
                    transition: 'all 0.3s ease',
                    transform: opened ? 'rotate(-45deg) translate(5px, -5px)' : 'rotate(0deg)',
                    transformOrigin: 'center',
                    visibility: 'visible',
                    opacity: 1
                  }} />
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer - Simplificado para evitar conflictos */}
      {isMobile && (
        <Drawer
          opened={opened}
          onClose={() => setOpened(false)}
          title={
            <Text size="lg" fw={600} c="#495057">
              Menú
            </Text>
          }
          size="70%"
          position="right"
          zIndex={20000}
          overlayProps={{ 
            backgroundOpacity: 0.4,
            zIndex: 19999,
            onClick: () => setOpened(false)
          }}
          styles={{
            inner: {
              zIndex: 20001
            },
            header: {
              background: 'white',
              borderBottom: '1px solid #e9ecef',
              zIndex: 20002
            },
            body: {
              padding: '1rem',
              background: 'white',
              zIndex: 20001
            },
            content: {
              zIndex: 20001
            }
          }}
        >
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.5rem',
            zIndex: 20001, 
            position: 'relative',
            backgroundColor: 'white',
            padding: '1rem'
          }}>
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setOpened(false)}
                style={{
                  display: 'block',
                  color: router.pathname === item.href ? '#1B436B' : '#495057',
                  textDecoration: 'none',
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 500,
                  fontSize: '0.95rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '6px',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  backgroundColor: router.pathname === item.href ? '#f8f9fa' : 'transparent',
                  position: 'relative',
                  zIndex: 20002,
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  visibility: 'visible',
                  opacity: 1
                }}
              >
                {item.name}
              </Link>
            ))}
            
            <div style={{ 
              marginTop: '2rem',
              paddingTop: '1rem',
              borderTop: '1px solid #e9ecef',
              zIndex: 20001,
              position: 'relative'
            }}>
              <Text size="sm" fw={500} mb="xs" c="dimmed">Síguenos</Text>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <a
                  href="https://www.facebook.com/mcrsecretariadesalud/?locale=es_LA"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    borderRadius: '4px',
                    backgroundColor: '#f8f9fa',
                    color: '#1B436B',
                    touchAction: 'manipulation',
                    zIndex: 20002
                  }}
                >
                  <IconBrandFacebook size={20} />
                </a>
                <a
                  href="https://www.instagram.com/secretaria.de.salud.mcr/?hl=es"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    borderRadius: '4px',
                    backgroundColor: '#f8f9fa',
                    color: '#1B436B',
                    touchAction: 'manipulation',
                    zIndex: 20002
                  }}
                >
                  <IconBrandInstagram size={20} />
                </a>
              </div>
            </div>
          </div>
        </Drawer>
      )}
    </>
  );
};

export default Navbar;
