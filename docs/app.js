import {
  festivos, siguienteFestivo, sumarDiasHabiles, diasHabilesEntre, ANIO_MINIMO, ANIO_MAXIMO, normalizar,
} from './src/index.js';

const $ = id => document.getElementById(id);
const hoy = normalizar(new Date());
const fmt = (f, op) => new Intl.DateTimeFormat('es-CO', { timeZone: 'UTC', ...op }).format(new Date(`${f}T12:00:00Z`));
const largo = f => fmt(f, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const params = new URLSearchParams(location.search);
let anio = Number(params.get('anio')) || Number(hoy.slice(0, 4));
if (anio < ANIO_MINIMO || anio > ANIO_MAXIMO) anio = Number(hoy.slice(0, 4));

function el(tag, clase, texto) {
  const n = document.createElement(tag);
  if (clase) n.className = clase;
  if (texto != null) n.textContent = texto;
  return n;
}

function diasHasta(f) {
  return Math.round((new Date(`${f}T12:00:00Z`) - new Date(`${hoy}T12:00:00Z`)) / 86_400_000);
}

function pintarAnio() {
  $('anio').textContent = anio;
  document.title = `Festivos de Colombia ${anio} y calculadora de días hábiles`;
  $('anterior').disabled = anio <= ANIO_MINIMO;
  $('siguiente').disabled = anio >= ANIO_MAXIMO;

  const prox = siguienteFestivo(hoy);
  const d = diasHasta(prox.fecha);
  const cuando = d === 0 ? 'hoy' : d === 1 ? 'mañana' : `en ${d} días`;
  $('proximo').replaceChildren(
    el('span', 'tenue', 'Próximo festivo '),
    el('strong', null, `${cuando}: ${fmt(prox.fecha, { weekday: 'long', day: 'numeric', month: 'long' })}`),
    el('span', 'tenue', ` · ${prox.nombre}`),
  );

  // Agrupa los que caen el mismo día (por ejemplo, 30 de junio de 2025).
  const porFecha = new Map();
  for (const f of festivos(anio)) porFecha.set(f.fecha, [...(porFecha.get(f.fecha) ?? []), f]);

  $('lista').replaceChildren(...[...porFecha].map(([fecha, del]) => {
    const li = el('li', `festivo${fecha < hoy ? ' pasado' : ''}${fecha === prox.fecha ? ' proximo-item' : ''}`);
    const dia = el('div', 'festivo-dia');
    dia.append(el('span', 'festivo-num', fmt(fecha, { day: 'numeric' })), el('span', 'festivo-mes', fmt(fecha, { month: 'short' }).replace('.', '')));
    const texto = el('div', 'festivo-texto');
    texto.append(el('strong', null, del.map(x => x.nombre).join(' y ')));
    const detalle = [fmt(fecha, { weekday: 'long' })];
    for (const x of del) if (x.trasladado) detalle.push(`se corrió del ${fmt(x.original, { day: 'numeric', month: 'long' })}`);
    texto.append(el('span', 'tenue', detalle.join(' · ')));
    li.append(dia, texto);
    return li;
  }));
}

function cambiarAnio(n) {
  anio = Math.min(ANIO_MAXIMO, Math.max(ANIO_MINIMO, anio + n));
  const url = new URL(location.href);
  url.searchParams.set('anio', anio);
  history.replaceState(null, '', url);
  pintarAnio();
}

const opciones = () => ({ sabadoHabil: $('sabados').checked });

function calcular() {
  try {
    const n = Number($('n').value);
    if (!$('desdeSumar').value || !Number.isInteger(n) || Math.abs(n) > 3650) throw new Error('Escribe una fecha y un número entero (máximo 3650).');
    const r = sumarDiasHabiles($('desdeSumar').value, n, opciones());
    $('resSumar').replaceChildren(el('strong', null, largo(r)));
  } catch (err) {
    $('resSumar').replaceChildren(el('span', 'error', err.message));
  }
  try {
    const a = $('desdeEntre').value, b = $('hastaEntre').value;
    if (!a || !b) throw new Error('Elige las dos fechas.');
    if (Math.abs(diasHasta(b) - diasHasta(a)) > 36_500) throw new Error('El rango máximo es de 100 años.');
    const n = diasHabilesEntre(a, b, opciones());
    const total = Math.abs(diasHasta(b) - diasHasta(a)) + 1;
    $('resEntre').replaceChildren(
      el('strong', null, `${Math.abs(n)} ${Math.abs(n) === 1 ? 'día hábil' : 'días hábiles'}`),
      el('span', 'tenue', ` de ${total} ${total === 1 ? 'día' : 'días'} en total, contando ambas fechas`),
    );
  } catch (err) {
    $('resEntre').replaceChildren(el('span', 'error', err.message));
  }
}

$('anterior').addEventListener('click', () => cambiarAnio(-1));
$('siguiente').addEventListener('click', () => cambiarAnio(1));
$('desdeSumar').value = hoy;
$('desdeEntre').value = hoy;
$('hastaEntre').value = `${hoy.slice(0, 4)}-12-31`;
for (const id of ['desdeSumar', 'n', 'desdeEntre', 'hastaEntre', 'sabados']) $(id).addEventListener('input', calcular);
for (const id of ['formSumar', 'formEntre']) $(id).addEventListener('submit', e => e.preventDefault());

pintarAnio();
calcular();
