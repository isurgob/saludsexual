import React, { useState, useEffect, forwardRef } from 'react';
import {
  Group,
  Button,
  Text,
  Popover,
  Stack,
  ActionIcon,
  Paper,
  Badge,
  Box,
  Loader
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { 
  IconCalendar, 
  IconX, 
  IconFilter,
} from '@tabler/icons-react';
import '@mantine/dates/styles.css';
import 'dayjs/locale/es';

const DateRangeFilter = forwardRef(({ 
  startDate, 
  endDate, 
  onDateChange, 
  onClear,
  disabled = false
}, ref) => {
  const [opened, setOpened] = useState(false);
  // Inicializar con fechas válidas
  const [tempStartDate, setTempStartDate] = useState(() => {
    if (!startDate) return null;
    return startDate instanceof Date ? startDate : new Date(startDate);
  });
  const [tempEndDate, setTempEndDate] = useState(() => {
    if (!endDate) return null;
    return endDate instanceof Date ? endDate : new Date(endDate);
  });

  // Sincronizar fechas temporales cuando cambien las props
  useEffect(() => {
    if (startDate) {
      const validStart = startDate instanceof Date ? startDate : new Date(startDate);
      if (!isNaN(validStart.getTime())) {
        setTempStartDate(validStart);
      }
    }
  }, [startDate]);

  useEffect(() => {
    if (endDate) {
      const validEnd = endDate instanceof Date ? endDate : new Date(endDate);
      if (!isNaN(validEnd.getTime())) {
        setTempEndDate(validEnd);
      }
    }
  }, [endDate]);

  const handleApply = () => {
    if (tempStartDate && tempEndDate) {
      // Asegurar que sean objetos Date válidos antes de enviarlos
      const start = tempStartDate instanceof Date ? tempStartDate : new Date(tempStartDate);
      const end = tempEndDate instanceof Date ? tempEndDate : new Date(tempEndDate);
      
      // Verificar que las fechas sean válidas
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        onDateChange(start, end);
        setOpened(false);
      } else {
        console.error('Invalid dates in handleApply:', { tempStartDate, tempEndDate });
      }
    }
  };

  const handleClear = () => {
    setTempStartDate(null);
    setTempEndDate(null);
    onClear();
    setOpened(false);
  };

  const formatDateRange = () => {
    if (!startDate || !endDate) return 'Seleccionar fechas';
    
    // Asegurar que sean objetos Date válidos
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    const end = endDate instanceof Date ? endDate : new Date(endDate);
    
    // Verificar que las fechas sean válidas
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 'Fechas inválidas';
    }
    
    const options = { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    };
    
    try {
      return `${start.toLocaleDateString('es-ES', options)} - ${end.toLocaleDateString('es-ES', options)}`;
    } catch (error) {
      console.error('Error formatting dates:', error, { startDate, endDate });
      return 'Error en fechas';
    }
  };

  const isActive = startDate && endDate;

  return (
    <Popover 
      width={400} 
      position="bottom-start" 
      withArrow 
      shadow="md"
      opened={opened}
      onChange={setOpened}
      closeOnClickOutside={true}
      closeOnEscape={true}
      trapFocus={false}
      returnFocus={true}
    >
      <Popover.Target>
        <Button
          ref={ref}
          variant={isActive ? 'filled' : 'light'}
          color={isActive ? 'blue' : 'gray'}
          leftSection={disabled ? <Loader size="xs" /> : <IconCalendar size={16} />}
          rightSection={
            !disabled && isActive && (
              <ActionIcon
                size="xs"
                color="white"
                variant="transparent"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
              >
                <IconX size={12} />
              </ActionIcon>
            )
          }
          onClick={() => {
            if (!disabled) {
              // Sincronizar fechas temporales con las actuales al abrir
              if (!opened) {
                const validStart = startDate instanceof Date ? startDate : (startDate ? new Date(startDate) : null);
                const validEnd = endDate instanceof Date ? endDate : (endDate ? new Date(endDate) : null);
                setTempStartDate(validStart);
                setTempEndDate(validEnd);
              }
              setOpened((o) => !o);
            }
          }}
          disabled={disabled}
          styles={{
            section: {
              marginLeft: isActive ? 8 : 0,
              marginRight: isActive ? 0 : 8
            }
          }}
        >
          {disabled ? 'Cargando...' : formatDateRange()}
        </Button>
      </Popover.Target>

      <Popover.Dropdown>
        <Paper p="md">
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={600} size="sm">
                <IconFilter size={16} style={{ marginRight: 8 }} />
                Filtrar por fechas
              </Text>
              {isActive && (
                <Badge variant="light" color="blue" size="xs">
                  Filtro activo
                </Badge>
              )}
            </Group>


 
            {/* Selectores de fecha personalizados */}
            <Stack gap="sm">
              <Text size="xs" c="dimmed">Rango personalizado:</Text>
              
              <DatePickerInput
                label="Fecha de inicio"
                placeholder="Seleccionar fecha de inicio"
                value={tempStartDate}
                onChange={(date) => {
                  setTempStartDate(date);
                  // No cerrar el popover automáticamente
                }}
                maxDate={tempEndDate || new Date()}
                size="sm"
                leftSection={<IconCalendar size={16} />}
                clearable
                disabled={disabled}
                dropdownType="popover"
                popoverProps={{ withinPortal: false }}
              />
              
              <DatePickerInput
                label="Fecha de fin"
                placeholder="Seleccionar fecha de fin"
                value={tempEndDate}
                onChange={(date) => {
                  setTempEndDate(date);
                  // No cerrar el popover automáticamente
                }}
                minDate={tempStartDate}
                maxDate={new Date()}
                size="sm"
                leftSection={<IconCalendar size={16} />}
                clearable
                disabled={disabled}
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
                onClick={handleClear}
                disabled={disabled}
              >
                Limpiar
              </Button>
              
              <Button
                size="sm"
                onClick={handleApply}
                disabled={disabled || !tempStartDate || !tempEndDate}
                loading={disabled}
              >
                Aplicar filtro
              </Button>
            </Group>
          </Stack>
        </Paper>
      </Popover.Dropdown>
    </Popover>
  );
});

DateRangeFilter.displayName = 'DateRangeFilter';

export default DateRangeFilter;