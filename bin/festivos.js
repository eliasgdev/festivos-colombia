#!/usr/bin/env node
// Uso:
//   festivos-colombia [año]                 Lista los festivos del año (por defecto, el actual)
//   festivos-colombia es 2026-12-08         ¿Es festivo? (código de salida 0 = sí, 1 = no)
//   festivos-colombia sumar 2026-11-13 5    Suma días hábiles
//   festivos-colombia entre 2026-11-01 2026-11-30   Cuenta días hábiles
//   Agrega --json para salida en JSON y --sabados para contar los sábados como hábiles.
import { festivos, nombreFestivo, sumarDiasHabiles, diasHabilesEntre, siguienteFestivo } from '../src/index.js';

const args = process.argv.slice(2);
const json = args.includes('--json');
const opciones = { sabadoHabil: args.includes('--sabados') };
const [orden, ...resto] = args.filter(a => !a.startsWith('--'));

const salir = (texto, codigo = 0) => { console.log(texto); process.exit(codigo); };
const formato = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
const legible = f => formato.format(new Date(`${f}T12:00:00Z`));

try {
  if (orden === 'es') {
    const nombre = nombreFestivo(resto[0]);
    if (json) salir(JSON.stringify({ fecha: resto[0], festivo: !!nombre, nombre }), nombre ? 0 : 1);
    salir(nombre ? `Sí: ${nombre}` : 'No es festivo', nombre ? 0 : 1);
  }
  if (orden === 'sumar') {
    const r = sumarDiasHabiles(resto[0], Number(resto[1]), opciones);
    salir(json ? JSON.stringify({ resultado: r }) : `${r} (${legible(r)})`);
  }
  if (orden === 'entre') {
    const n = diasHabilesEntre(resto[0], resto[1], opciones);
    salir(json ? JSON.stringify({ diasHabiles: n }) : `${n} días hábiles`);
  }
  if (orden === 'siguiente') {
    const f = siguienteFestivo(resto[0]);
    salir(json ? JSON.stringify(f) : `${f.fecha}  ${f.nombre} (${legible(f.fecha)})`);
  }
  if (orden && !/^\d{4}$/.test(orden)) salir('Uso: festivos-colombia [año] | es <fecha> | sumar <fecha> <n> | entre <desde> <hasta> | siguiente [fecha]  [--json] [--sabados]', 2);
  const anio = orden ? Number(orden) : new Date().getFullYear();
  const lista = festivos(anio);
  if (json) salir(JSON.stringify(lista, null, 2));
  salir(lista.map(f => `${f.fecha}  ${legible(f.fecha).padEnd(24)} ${f.nombre}${f.trasladado ? '  (trasladado)' : ''}`).join('\n'));
} catch (err) {
  salir(`Error: ${err.message}`, 2);
}
