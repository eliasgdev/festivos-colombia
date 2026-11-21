// Festivos de Colombia y días hábiles. Sin dependencias.
//
// Reglas:
//  - Ley 51 de 1983 ("Ley Emiliani"): siete festivos de fecha fija y tres que dependen
//    de la Pascua se trasladan al lunes siguiente si no caen en lunes.
//  - Jueves y Viernes Santo no se trasladan.
//  - Las fechas se manejan como texto 'YYYY-MM-DD' (o Date, de la que se toman año, mes y día
//    locales), así que el resultado no depende de la zona horaria del servidor.

const DIA_MS = 86_400_000;

/** @typedef {{ fecha: string, nombre: string, original: string, trasladado: boolean }} Festivo */

const FIJOS = [
  { mes: 1, dia: 1, nombre: 'Año Nuevo' },
  { mes: 5, dia: 1, nombre: 'Día del Trabajo' },
  { mes: 7, dia: 20, nombre: 'Día de la Independencia' },
  { mes: 8, dia: 7, nombre: 'Batalla de Boyacá' },
  { mes: 12, dia: 8, nombre: 'Inmaculada Concepción' },
  { mes: 12, dia: 25, nombre: 'Navidad' },
];

const FIJOS_AL_LUNES = [
  { mes: 1, dia: 6, nombre: 'Día de los Reyes Magos' },
  { mes: 3, dia: 19, nombre: 'Día de San José' },
  { mes: 6, dia: 29, nombre: 'San Pedro y San Pablo' },
  { mes: 8, dia: 15, nombre: 'Asunción de la Virgen' },
  { mes: 10, dia: 12, nombre: 'Día de la Raza' },
  { mes: 11, dia: 1, nombre: 'Día de Todos los Santos' },
  { mes: 11, dia: 11, nombre: 'Independencia de Cartagena' },
];

// Días después del Domingo de Pascua.
const DE_PASCUA = [
  { dias: -3, nombre: 'Jueves Santo', alLunes: false },
  { dias: -2, nombre: 'Viernes Santo', alLunes: false },
  { dias: 39, nombre: 'Ascensión del Señor', alLunes: true },
  { dias: 60, nombre: 'Corpus Christi', alLunes: true },
  { dias: 68, nombre: 'Sagrado Corazón de Jesús', alLunes: true },
];

// La ley rige desde 1984; antes las reglas eran otras.
export const ANIO_MINIMO = 1984;
export const ANIO_MAXIMO = 9999;

// ---------- Fechas internas (UTC a mediodía para evitar saltos de horario) ----------

const utc = (a, m, d) => new Date(Date.UTC(a, m - 1, d, 12));
const aTexto = f => f.toISOString().slice(0, 10);
const sumar = (f, dias) => new Date(f.getTime() + dias * DIA_MS);

/**
 * Normaliza la entrada a 'YYYY-MM-DD'.
 * @param {string | Date} fecha
 * @returns {string}
 */
export function normalizar(fecha) {
  if (fecha instanceof Date) {
    if (Number.isNaN(fecha.getTime())) throw new TypeError('Fecha inválida.');
    return aTexto(utc(fecha.getFullYear(), fecha.getMonth() + 1, fecha.getDate()));
  }
  if (typeof fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    throw new TypeError(`Fecha inválida: ${String(fecha)}. Usa 'YYYY-MM-DD' o un Date.`);
  }
  const [a, m, d] = fecha.split('-').map(Number);
  const f = utc(a, m, d);
  if (aTexto(f) !== fecha) throw new TypeError(`La fecha ${fecha} no existe.`);
  return fecha;
}

const aFecha = texto => {
  const [a, m, d] = normalizar(texto).split('-').map(Number);
  return utc(a, m, d);
};

function validarAnio(anio) {
  if (!Number.isInteger(anio) || anio < ANIO_MINIMO || anio > ANIO_MAXIMO) {
    throw new RangeError(`Año fuera de rango: ${anio}. Se admiten de ${ANIO_MINIMO} a ${ANIO_MAXIMO}.`);
  }
}

/**
 * Domingo de Pascua (calendario gregoriano, algoritmo anónimo de Meeus/Jones/Butcher).
 * @param {number} anio
 * @returns {string}
 */
export function domingoDePascua(anio) {
  validarAnio(anio);
  const a = anio % 19;
  const b = Math.floor(anio / 100);
  const c = anio % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return aTexto(utc(anio, mes, dia));
}

function alLunes(f) {
  const dia = f.getUTCDay(); // 0 = domingo, 1 = lunes
  return dia === 1 ? f : sumar(f, (8 - dia) % 7);
}

const cache = new Map();

/**
 * Festivos del año en orden. Dos festivos pueden caer el mismo día (por ejemplo,
 * el 30 de junio de 2025), y en ese caso aparecen las dos entradas.
 * @param {number} anio
 * @returns {Festivo[]}
 */
export function festivos(anio) {
  validarAnio(anio);
  if (!cache.has(anio)) {
    const lista = [];
    const agregar = (original, nombre, mover) => {
      const fecha = mover ? alLunes(original) : original;
      lista.push({ fecha: aTexto(fecha), nombre, original: aTexto(original), trasladado: fecha.getTime() !== original.getTime() });
    };
    for (const x of FIJOS) agregar(utc(anio, x.mes, x.dia), x.nombre, false);
    for (const x of FIJOS_AL_LUNES) agregar(utc(anio, x.mes, x.dia), x.nombre, true);
    const pascua = aFecha(domingoDePascua(anio));
    for (const x of DE_PASCUA) agregar(sumar(pascua, x.dias), x.nombre, x.alLunes);
    lista.sort((p, q) => p.fecha.localeCompare(q.fecha) || p.original.localeCompare(q.original));
    cache.set(anio, Object.freeze(lista.map(Object.freeze)));
  }
  return [...cache.get(anio)];
}

/**
 * Nombre(s) del festivo de esa fecha, o null si no es festivo.
 * @param {string | Date} fecha
 * @returns {string | null}
 */
export function nombreFestivo(fecha) {
  const f = normalizar(fecha);
  const del = festivos(Number(f.slice(0, 4))).filter(x => x.fecha === f);
  return del.length ? del.map(x => x.nombre).join(' y ') : null;
}

/** @param {string | Date} fecha */
export function esFestivo(fecha) {
  return nombreFestivo(fecha) !== null;
}

/**
 * @typedef {object} OpcionesHabiles
 * @property {boolean} [sabadoHabil=false] Cuenta los sábados como hábiles (comercio, algunas entidades).
 * @property {Iterable<string>} [extra] Fechas adicionales no hábiles ('YYYY-MM-DD'), por ejemplo días cívicos o cierres de la empresa.
 */

function crearRevisor({ sabadoHabil = false, extra = [] } = {}) {
  const extras = new Set([...extra].map(normalizar));
  return f => {
    const dia = f.getUTCDay();
    if (dia === 0 || (dia === 6 && !sabadoHabil)) return false;
    const t = aTexto(f);
    return !extras.has(t) && !esFestivo(t);
  };
}

/**
 * ¿Es día hábil? Por defecto, de lunes a viernes que no sean festivos.
 * @param {string | Date} fecha
 * @param {OpcionesHabiles} [opciones]
 */
export function esDiaHabil(fecha, opciones) {
  return crearRevisor(opciones)(aFecha(fecha));
}

/**
 * Suma (o resta, si n es negativo) días hábiles. Con n = 0 devuelve la misma fecha si es hábil,
 * o el siguiente día hábil si no lo es.
 * @param {string | Date} fecha
 * @param {number} n
 * @param {OpcionesHabiles} [opciones]
 * @returns {string}
 */
export function sumarDiasHabiles(fecha, n, opciones) {
  if (!Number.isInteger(n)) throw new TypeError('n debe ser un número entero.');
  if (Math.abs(n) > 100_000) throw new RangeError('n es demasiado grande.');
  const habil = crearRevisor(opciones);
  let f = aFecha(fecha);
  if (n === 0) {
    while (!habil(f)) f = sumar(f, 1);
    return aTexto(f);
  }
  const paso = Math.sign(n);
  let faltan = Math.abs(n);
  while (faltan > 0) {
    f = sumar(f, paso);
    if (habil(f)) faltan--;
  }
  return aTexto(f);
}

/**
 * Días hábiles entre dos fechas, contando ambas puntas. Si desde > hasta, el resultado es negativo.
 * @param {string | Date} desde
 * @param {string | Date} hasta
 * @param {OpcionesHabiles} [opciones]
 */
export function diasHabilesEntre(desde, hasta, opciones) {
  let a = aFecha(desde), b = aFecha(hasta), signo = 1;
  if (a > b) { [a, b] = [b, a]; signo = -1; }
  if ((b - a) / DIA_MS > 400_000) throw new RangeError('El rango es demasiado grande.');
  const habil = crearRevisor(opciones);
  let n = 0;
  for (let f = a; f <= b; f = sumar(f, 1)) if (habil(f)) n++;
  return n * signo;
}

/**
 * Próximo festivo desde la fecha dada (incluida).
 * @param {string | Date} [fecha] Por defecto, hoy.
 * @returns {Festivo}
 */
export function siguienteFestivo(fecha = new Date()) {
  const f = normalizar(fecha);
  const anio = Number(f.slice(0, 4));
  return festivos(anio).find(x => x.fecha >= f) ?? festivos(anio + 1)[0];
}

/**
 * Festivos entre dos fechas, incluidas.
 * @param {string | Date} desde
 * @param {string | Date} hasta
 * @returns {Festivo[]}
 */
export function festivosEntre(desde, hasta) {
  const a = normalizar(desde), b = normalizar(hasta);
  if (a > b) return [];
  const lista = [];
  for (let anio = Number(a.slice(0, 4)); anio <= Number(b.slice(0, 4)); anio++) {
    lista.push(...festivos(anio).filter(x => x.fecha >= a && x.fecha <= b));
  }
  return lista;
}
