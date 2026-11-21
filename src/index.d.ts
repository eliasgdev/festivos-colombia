export interface Festivo {
  /** Día en que se celebra, 'YYYY-MM-DD'. */
  readonly fecha: string;
  readonly nombre: string;
  /** Fecha original antes del traslado al lunes. */
  readonly original: string;
  readonly trasladado: boolean;
}

export interface OpcionesHabiles {
  /** Cuenta los sábados como hábiles. Por defecto, false. */
  sabadoHabil?: boolean;
  /** Fechas adicionales no hábiles ('YYYY-MM-DD'). */
  extra?: Iterable<string>;
}

export type Fecha = string | Date;

export const ANIO_MINIMO: number;
export const ANIO_MAXIMO: number;

export function normalizar(fecha: Fecha): string;
export function domingoDePascua(anio: number): string;
export function festivos(anio: number): Festivo[];
export function festivosEntre(desde: Fecha, hasta: Fecha): Festivo[];
export function nombreFestivo(fecha: Fecha): string | null;
export function esFestivo(fecha: Fecha): boolean;
export function esDiaHabil(fecha: Fecha, opciones?: OpcionesHabiles): boolean;
export function sumarDiasHabiles(fecha: Fecha, n: number, opciones?: OpcionesHabiles): string;
export function diasHabilesEntre(desde: Fecha, hasta: Fecha, opciones?: OpcionesHabiles): number;
export function siguienteFestivo(fecha?: Fecha): Festivo;
