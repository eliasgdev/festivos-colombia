import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  festivos, esFestivo, nombreFestivo, domingoDePascua, esDiaHabil, sumarDiasHabiles,
  diasHabilesEntre, siguienteFestivo, festivosEntre, normalizar,
} from '../src/index.js';

const fechas = anio => festivos(anio).map(f => f.fecha);

// Calendarios oficiales publicados para cada año.
test('festivos de 2024', () => {
  assert.deepEqual(fechas(2024), [
    '2024-01-01', '2024-01-08', '2024-03-25', '2024-03-28', '2024-03-29', '2024-05-01',
    '2024-05-13', '2024-06-03', '2024-06-10', '2024-07-01', '2024-07-20', '2024-08-07',
    '2024-08-19', '2024-10-14', '2024-11-04', '2024-11-11', '2024-12-08', '2024-12-25',
  ]);
});

test('festivos de 2025: San Pedro y Sagrado Corazón caen el mismo lunes', () => {
  const f = fechas(2025);
  assert.deepEqual(f, [
    '2025-01-01', '2025-01-06', '2025-03-24', '2025-04-17', '2025-04-18', '2025-05-01',
    '2025-06-02', '2025-06-23', '2025-06-30', '2025-06-30', '2025-07-20', '2025-08-07',
    '2025-08-18', '2025-10-13', '2025-11-03', '2025-11-17', '2025-12-08', '2025-12-25',
  ]);
  assert.equal(nombreFestivo('2025-06-30'), 'Sagrado Corazón de Jesús y San Pedro y San Pablo');
});

test('festivos de 2026', () => {
  assert.deepEqual(fechas(2026), [
    '2026-01-01', '2026-01-12', '2026-03-23', '2026-04-02', '2026-04-03', '2026-05-01',
    '2026-05-18', '2026-06-08', '2026-06-15', '2026-06-29', '2026-07-20', '2026-08-07',
    '2026-08-17', '2026-10-12', '2026-11-02', '2026-11-16', '2026-12-08', '2026-12-25',
  ]);
});

test('siempre son 18 festivos y los trasladables caen en lunes', () => {
  for (let anio = 1984; anio <= 2100; anio++) {
    const lista = festivos(anio);
    assert.equal(lista.length, 18, `año ${anio}`);
    for (const f of lista.filter(x => x.trasladado)) {
      assert.equal(new Date(`${f.fecha}T12:00:00Z`).getUTCDay(), 1, `${f.nombre} ${anio}`);
      assert.ok(f.fecha > f.original);
    }
  }
});

test('Domingo de Pascua en años conocidos', () => {
  assert.equal(domingoDePascua(2019), '2019-04-21');
  assert.equal(domingoDePascua(2024), '2024-03-31');
  assert.equal(domingoDePascua(2025), '2025-04-20');
  assert.equal(domingoDePascua(2038), '2038-04-25');
  assert.equal(domingoDePascua(2285), '2285-03-22');
});

test('trasladado y original', () => {
  const reyes = festivos(2026).find(f => f.nombre === 'Día de los Reyes Magos');
  assert.deepEqual(reyes, { fecha: '2026-01-12', nombre: 'Día de los Reyes Magos', original: '2026-01-06', trasladado: true });
  const sanPedro = festivos(2026).find(f => f.nombre === 'San Pedro y San Pablo');
  assert.equal(sanPedro.trasladado, false);
});

test('esFestivo acepta texto y Date', () => {
  assert.equal(esFestivo('2026-07-20'), true);
  assert.equal(esFestivo('2026-01-06'), false); // se trasladó al 12
  assert.equal(esFestivo(new Date(2026, 11, 25, 23, 59)), true);
  assert.equal(nombreFestivo('2026-04-03'), 'Viernes Santo');
  assert.equal(nombreFestivo('2026-04-06'), null);
});

test('la lista devuelta no altera la interna', () => {
  const l = festivos(2026);
  l.pop();
  assert.equal(festivos(2026).length, 18);
  assert.throws(() => { festivos(2026)[0].fecha = 'x'; }, TypeError);
});

test('días hábiles', () => {
  assert.equal(esDiaHabil('2026-11-16'), false); // festivo
  assert.equal(esDiaHabil('2026-11-21'), false); // sábado
  assert.equal(esDiaHabil('2026-11-21', { sabadoHabil: true }), true);
  assert.equal(esDiaHabil('2026-11-20'), true);
  assert.equal(esDiaHabil('2026-11-20', { extra: ['2026-11-20'] }), false);
});

test('sumar días hábiles salta fines de semana y festivos', () => {
  // Viernes 13 nov 2026 + 1 → lunes 16 es festivo → martes 17
  assert.equal(sumarDiasHabiles('2026-11-13', 1), '2026-11-17');
  // Semana Santa 2026: miércoles 1 abr + 1 → lunes 6
  assert.equal(sumarDiasHabiles('2026-04-01', 1), '2026-04-06');
  assert.equal(sumarDiasHabiles('2026-04-06', -1), '2026-04-01');
  // Jueves 24 dic + 5: salta Navidad (viernes) y Año Nuevo (viernes)
  assert.equal(sumarDiasHabiles('2026-12-24', 5), '2027-01-04');
  assert.equal(sumarDiasHabiles('2026-11-21', 0), '2026-11-23');
  assert.equal(sumarDiasHabiles('2026-11-20', 0), '2026-11-20');
  assert.throws(() => sumarDiasHabiles('2026-11-20', 1.5), TypeError);
});

test('días hábiles entre dos fechas', () => {
  assert.equal(diasHabilesEntre('2026-11-01', '2026-11-30'), 19); // 21 laborables - 2 festivos
  assert.equal(diasHabilesEntre('2026-11-30', '2026-11-01'), -19);
  assert.equal(diasHabilesEntre('2026-11-20', '2026-11-20'), 1);
  assert.equal(diasHabilesEntre('2026-01-01', '2026-12-31'), 243);
});

test('siguiente festivo y festivos entre fechas', () => {
  assert.equal(siguienteFestivo('2026-11-20').fecha, '2026-12-08');
  assert.equal(siguienteFestivo('2026-12-26').fecha, '2027-01-01');
  assert.equal(siguienteFestivo('2026-12-25').nombre, 'Navidad');
  assert.deepEqual(festivosEntre('2026-12-01', '2027-01-15').map(f => f.fecha), ['2026-12-08', '2026-12-25', '2027-01-01', '2027-01-11']);
  assert.deepEqual(festivosEntre('2027-01-01', '2026-01-01'), []);
});

test('entradas inválidas', () => {
  assert.throws(() => normalizar('2026-02-30'), TypeError);
  assert.throws(() => normalizar('20/11/2026'), TypeError);
  assert.throws(() => normalizar(new Date('x')), TypeError);
  assert.throws(() => festivos(1950), RangeError);
  assert.throws(() => festivos(2026.5), RangeError);
});
