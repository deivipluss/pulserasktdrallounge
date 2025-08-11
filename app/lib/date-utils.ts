'use client';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Extendiendo dayjs con los plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// Configurando timezone por defecto a America/Lima
dayjs.tz.setDefault('America/Lima');

export const dateUtils = {
  /**
   * Formatea una fecha según el formato especificado
   * @param date Fecha a formatear
   * @param format Formato de salida (por defecto: YYYY-MM-DD)
   * @returns Fecha formateada
   */
  format: (date: Date | string | number, format = 'YYYY-MM-DD'): string => {
    return dayjs(date).format(format);
  },

  /**
   * Convierte una fecha a la zona horaria de America/Lima
   * @param date Fecha a convertir
   * @returns Fecha en zona horaria de America/Lima
   */
  toLima: (date: Date | string | number): dayjs.Dayjs => {
    return dayjs(date).tz('America/Lima');
  },

  /**
   * Verifica si una fecha es válida
   * @param date Fecha a validar
   * @returns true si la fecha es válida
   */
  isValid: (date: any): boolean => {
    return dayjs(date).isValid();
  },

  /**
   * Obtiene la fecha y hora actual en America/Lima
   * @returns Fecha y hora actual en America/Lima
   */
  nowInLima: (): dayjs.Dayjs => {
    return dayjs().tz('America/Lima');
  },

  /**
   * Calcula la diferencia entre dos fechas
   * @param date1 Primera fecha
   * @param date2 Segunda fecha
   * @param unit Unidad de tiempo para la diferencia (día, mes, año, etc.)
   * @returns Diferencia entre las fechas en la unidad especificada
   */
  diff: (
    date1: Date | string | number,
    date2: Date | string | number,
    unit: 'day' | 'month' | 'year' | 'hour' | 'minute' | 'second' = 'day'
  ): number => {
    return dayjs(date1).diff(dayjs(date2), unit);
  },
};

export default dateUtils;
