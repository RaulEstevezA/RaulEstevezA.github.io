/**
 * Chapter 5, "The Last Signal": the end of the story. Teaches recursive CTEs, running
 * totals and date arithmetic, and closes with the final dossier and the decision that
 * selects one of the endings of `content/endings.js`.
 * The format of a chapter and of a mission is documented in `content/campaign.js`.
 */

import { bi } from '../core/localize.js';
import { fillerRows } from './world/noise.js';

/* Ownership chain from the brass plate up to the charity; two unrelated chains around it. */
const ownership = [
  { company: 'Faro Servicios', parent: 'Gestiones Bruma' },
  { company: 'Gestiones Bruma', parent: 'Holding Marea' },
  { company: 'Holding Marea', parent: 'Compañía del Estrecho' },
  { company: 'Compañía del Estrecho', parent: 'Fundación Nereida' },
  { company: 'Fundación Nereida', parent: null },
  { company: 'Lonja Municipal', parent: 'City Council' },
  { company: 'City Council', parent: null },
  { company: 'Trans Otero', parent: 'Otero Family' },
  { company: 'Portes Lagos', parent: 'Otero Family' },
  { company: 'Otero Family', parent: null },
  { company: 'Naviera Vent', parent: 'Fundación Nereida' },
];

/* Donations to the charity: the running total is calculated, not typed, to stay exact. */
const donations = [
  ['1987-01-14', 'Banco del Puerto', 180000], ['1987-02-20', 'Naviera Vent', 240000],
  ['1987-04-02', 'Astilleros Cal', 95000], ['1987-05-11', 'Naviera Vent', 210000],
  ['1987-06-30', 'Harbour Commission', 160000], ['1987-08-04', 'Naviera Vent', 305000],
  ['1987-09-18', 'Banco del Puerto', 120000], ['1987-10-23', 'Naviera Vent', 280000],
  ['1987-11-06', 'Harbour Commission', 90000],
].map(([given_on, donor, amount], index) => ({ id: index + 1, given_on, donor, amount }));
let accumulated = 0;
const runningTotals = donations.map(({ given_on, amount }) => {
  accumulated += amount;
  return { given_on, running: accumulated };
});
const millionReached = runningTotals.find((row) => row.running >= 1000000);
const millionDonor = donations.find((row) => row.given_on === millionReached.given_on).donor;

const fires = [
  { address: 'Calle del Cordel 4', fire_on: '1987-09-15', casualties: 0 },
  { address: 'Plaza de la Sal 11', fire_on: '1987-10-04', casualties: 0 },
  { address: 'Paseo de la Red 2', fire_on: '1987-10-22', casualties: 0 },
  { address: 'Calle del Faro Viejo 9', fire_on: '1987-11-03', casualties: 1 },
];
const landPurchases = [
  { address: 'Calle del Cordel 4', buyer: 'Gestiones Bruma', bought_on: '1987-09-29', price: 12000 },
  { address: 'Plaza de la Sal 11', buyer: 'Gestiones Bruma', bought_on: '1987-10-12', price: 9500 },
  { address: 'Paseo de la Red 2', buyer: 'Gestiones Bruma', bought_on: '1987-11-05', price: 15000 },
  { address: 'Calle del Faro Viejo 9', buyer: 'Gestiones Bruma', bought_on: '1987-11-10', price: 11000 },
  // Bought before the fire, or long after it: both are ordinary purchases.
  { address: 'Calle Mayor 30', buyer: 'Lonja Municipal', bought_on: '1987-03-02', price: 88000 },
  { address: 'Paseo de la Red 2', buyer: 'Trans Otero', bought_on: '1985-06-14', price: 40000 },
];

/* The tape of cabinet A-12: four independent sources, with people mentioned more than once. */
const tapeSources = {
  tape_manifests: ['Oriol Vent', 'Oriol Vent', 'Mina Costa', 'Joel Serra', 'Mina Costa'],
  tape_bank_records: ['Oriol Vent', 'Ricardo Salas', 'Alba Grau', 'Eva Sanz', 'Ricardo Salas'],
  tape_phone_taps: ['Oriol Vent', 'Ricardo Salas', 'Alba Grau', 'Joel Serra', 'Aina Puig'],
  tape_land_registry: ['Oriol Vent', 'Ricardo Salas', 'Alba Grau', 'Laia Nord'],
};
const tapeTables = Object.fromEntries(
  Object.entries(tapeSources).map(([table, names]) => [table, names.map((person, index) => ({ entry: index + 1, person }))]),
);

const meetingDates = {
  '1987-06-02': ['Oriol Vent', 'Ricardo Salas'],
  '1987-07-14': ['Oriol Vent', 'Alba Grau', 'Laia Nord'],
  '1987-08-30': ['Oriol Vent', 'Ricardo Salas', 'Alba Grau', 'Eva Sanz'],
  '1987-10-08': ['Ricardo Salas', 'Alba Grau'],
};
const meetings = Object.entries(meetingDates).flatMap(([met_on, people]) =>
  people.map((person) => ({ met_on, person, place: met_on === '1987-08-30' ? 'Glass Gallery' : 'Club Náutico' })),
);

const earlierFires = fillerRows(501, 3, (random, index) => ({
  address: `Calle ${random.pick(['Ancha', 'Baja', 'Nueva'])} ${index + 5}`,
  fire_on: `1986-0${index + 3}-1${index}`,
  casualties: 0,
}));

export const chapter5 = {
  id: 5,
  title: bi('The Last Signal', 'La última señal'),
  subtitle: bi('You know who was leaving the notes. Now you need to know who is at the top, and where she is.', 'Ya sabes quién te dejaba las notas. Falta saber quién manda arriba del todo, y dónde está ella.'),
  prologue: {
    signal: bi('PUERTO CENIZA · DECEMBER 1987 · THE RAIN STOPS', 'PUERTO CENIZA · DICIEMBRE DE 1987 · DEJA DE LLOVER'),
    title: bi('Who is at the top', 'Quién está arriba del todo'),
    paragraphs: bi(
      [
        'It stops raining on the first of December. People go out in the street and look up, suspicious. In the Old Quarter there are three more fences, and the model at City Hall has a new little lighthouse on it.',
        'You have a brass key, a strip of film, and a list of operators and dates written on the inside of your wrist. Teo has handed in his badge and sits at home, waiting for someone to come for him: the police or the others, whoever gets there first. Quiroga has read your page without saying a word, and has then asked the only question that matters: “Who is at the top?”',
        'A company that cleans buildings. A charity with a one-page report. A signal on an old frequency that nobody is authorised to use. Each of these is only a row, but you have learned by now how to put rows together. Nobody in the building does it better, and you think only one other person ever could.',
      ],
      [
        'Deja de llover el uno de diciembre. La gente sale a la calle y mira hacia arriba, con desconfianza. En el Barrio Viejo hay tres vallas más, y a la maqueta del Ayuntamiento le han puesto un farito nuevo.',
        'Tienes una llave de latón, una tira de película y una lista de operadores y fechas escrita en la cara interna de la muñeca. Teo ha entregado su credencial y está en casa, esperando a que vengan a por él: la policía o los otros, quien llegue antes. Quiroga ha leído tu hoja sin decir nada, y luego ha hecho la única pregunta que importa: "¿Quién está arriba del todo?".',
        'Una empresa que limpia edificios. Una entidad benéfica con una memoria de una página. Una señal en una frecuencia vieja que nadie está autorizado a usar. Cada una es solo una fila, pero ya sabes juntar filas. Nadie en el edificio lo hace mejor que tú, y crees que solo ha habido otra persona capaz.',
      ],
    ),
    speaker: bi('MARTA QUIROGA · INSPECTOR', 'MARTA QUIROGA · INSPECTORA'),
    quote: bi('“If you are right, I will have to arrest the man who signs my salary. So be right.”', '"Si tienes razón, tendré que detener al hombre que firma mi nómina. Así que ten razón."'),
    action: bi('Follow the chain', 'Seguir la cadena'),
  },
  missions: [
    {
      id: 'shell-companies',
      rating: 4,
      concepts: ['WITH RECURSIVE'],
      title: bi('The brass plate and what is behind it', 'La placa de latón y lo que hay detrás'),
      location: bi('Companies Registry · 10:00', 'Registro Mercantil · 10:00'),
      scene: bi(
        [
          'Faro Servicios, the company with the brass plate, belongs to another company, and that one to another. The Registry keeps it all in one simple table of two columns: a company and its parent. Whoever designed this chain counted on nobody having the patience to ask the same question four times.',
          'You, however, do not need patience. SQL has a form of query that calls itself: a recursive CTE starts from a row, finds the next one using the rows it has just found, and keeps going until there are no more. You will not need to know how long the chain is. You just start pulling the thread.',
        ],
        [
          'Faro Servicios, la empresa de la placa de latón, pertenece a otra empresa, y esa a otra. El Registro lo guarda todo en una tabla sencilla de dos columnas: una empresa y su matriz. Quien diseñó esta cadena contaba con que a nadie le quedara paciencia para hacer cuatro veces la misma pregunta.',
          'Tú no necesitas paciencia. SQL tiene una forma de consulta que se llama a sí misma: un CTE recursivo parte de una fila, encuentra la siguiente usando las filas que acaba de encontrar y sigue hasta que no quedan más. No hace falta saber cuánto mide la cadena. Basta con empezar a tirar del hilo.',
        ],
      ),
      tables: {
        ownership,
        foundation_board: [
          { foundation: 'Fundación Nereida', name: 'Oriol Vent', role: 'Treasurer' },
          { foundation: 'Fundación Nereida', name: 'Alba Grau', role: 'Secretary' },
          { foundation: 'Fundación Nereida', name: 'Ricardo Salas', role: 'Chair' },
          { foundation: 'Fundación Sol', name: 'Lupe Vera', role: 'Chair' },
        ],
      },
      stages: [
        {
          title: bi('One step up', 'Un paso hacia arriba'),
          briefing: bi('Start easy. Return the parent of Faro Servicios.', 'Empieza fácil. Devuelve el parent de Faro Servicios.'),
          expected: [{ parent: 'Gestiones Bruma' }],
          clue: bi('Faro Servicios is owned by Gestiones Bruma.', 'Faro Servicios es de Gestiones Bruma.'),
        },
        {
          title: bi('All the way up', 'Hasta arriba del todo'),
          briefing: bi('Follow the chain with a recursive CTE, from Faro Servicios to the end. Return company and its depth, starting at 0 for Faro Servicios, ordered by depth.', 'Sigue la cadena con un CTE recursivo, desde Faro Servicios hasta el final. Devuelve company y su depth, empezando en 0 para Faro Servicios, ordenado por depth.'),
          ordered: true,
          expected: [
            { company: 'Faro Servicios', depth: 0 },
            { company: 'Gestiones Bruma', depth: 1 },
            { company: 'Holding Marea', depth: 2 },
            { company: 'Compañía del Estrecho', depth: 3 },
            { company: 'Fundación Nereida', depth: 4 },
          ],
          hints: [bi("WITH RECURSIVE chain(company, parent, depth) AS (SELECT company, parent, 0 FROM ownership WHERE company = 'Faro Servicios' UNION ALL ...)", "WITH RECURSIVE chain(company, parent, depth) AS (SELECT company, parent, 0 FROM ownership WHERE company = 'Faro Servicios' UNION ALL ...)"), bi('The second part joins ownership with chain: SELECT o.company, o.parent, c.depth + 1 FROM ownership o JOIN chain c ON o.company = c.parent.', 'La segunda parte une ownership con chain: SELECT o.company, o.parent, c.depth + 1 FROM ownership o JOIN chain c ON o.company = c.parent.')],
          clue: bi('Four companies lead from a brass plate to Fundación Nereida: the owner of account K-1.', 'Cuatro empresas llevan de una placa de latón a la Fundación Nereida: la titular de la cuenta K-1.'),
        },
        {
          title: bi('Who chairs the foundation', 'Quién preside la fundación'),
          briefing: bi('Who chairs Fundación Nereida? Return name and role.', '¿Quién preside la Fundación Nereida? Devuelve name y role.'),
          expected: [{ name: 'Ricardo Salas', role: 'Chair' }],
          hints: [bi("Filter foundation_board by foundation and by role = 'Chair'.", "Filtra foundation_board por foundation y por role = 'Chair'.")],
          clue: bi('Commissioner Ricardo Salas chairs the foundation that owns the company of the arsonist.', 'El comisario Ricardo Salas preside la fundación propietaria de la empresa del pirómano.'),
        },
      ],
      closing: bi(
        [
          'Ricardo Salas. The man who ordered every ATLAS query to be logged “for reasons of efficiency”, and stamped CLOSED on the case of the Pier 3 crate. The man whose signature is on your assignment letter. In the same table, the Secretary of the foundation is Alba Grau, a judge of the provincial court. She has signed search warrants for you, twice.',
          'You read it out to Quiroga on the back stairs. She does not say anything for a whole minute. Then she takes out a cigarette and lights it, inside the building, right under the no-smoking sign. “Show me the money,” she says. “Names are for newspapers. To arrest anyone, I need the money.”',
        ],
        [
          'Ricardo Salas. El hombre que ordenó registrar todas las consultas de ATLAS "por razones de eficiencia" y selló ARCHIVADO en el caso de la caja del muelle 3. El hombre cuya firma está en tu orden de destino. En la misma tabla, la secretaria de la fundación es Alba Grau, jueza de la Audiencia Provincial. Te ha firmado dos órdenes de registro.',
          'Se lo lees a Quiroga en la escalera de atrás. No dice nada durante un minuto entero. Luego saca un cigarrillo y lo enciende, dentro del edificio, justo debajo del cartel de prohibido fumar. "Enséñame el dinero", dice. "Los nombres son para los periódicos. Para detener a alguien necesito el dinero."',
        ],
      ),
    },
    {
      id: 'follow-money',
      rating: 5,
      concepts: ['SUM OVER', 'julianday'],
      title: bi('A million in charity', 'Un millón en beneficencia'),
      location: bi('Back stairs of Headquarters · 18:40', 'Escalera de atrás de Jefatura · 18:40'),
      scene: bi(
        [
          'The charity’s bank records and the Land Registry are the last two tapes the compliance officer will ever get you. He has asked for a transfer to Almería, and a different name, if at all possible. Fundación Nereida has received money throughout the year. You want to see it grow, row by row, as if you were watching a tide come in.',
          'A window function can do more than look at a neighbour. SUM OVER adds the amount of each row to all of the previous ones, without merging them into a single figure. Then there are the dates: the question that matters is how many days pass between a fire and the sale of the burned land. julianday turns a date into a number, and numbers can be subtracted.',
        ],
        [
          'Los registros bancarios de la fundación y el Registro de la Propiedad son las dos últimas cintas que te conseguirá el jefe de control interno. Ha pedido traslado a Almería y, si es posible, otro nombre. La Fundación Nereida ha recibido dinero durante todo el año. Quieres verlo crecer, fila a fila, como quien ve subir la marea.',
          'Una función de ventana hace algo más que mirar la fila vecina. SUM OVER suma el importe de cada fila a todas las anteriores, sin juntarlas en una sola cifra. Luego están las fechas: la pregunta que importa es cuántos días pasan entre un incendio y la venta del terreno quemado. julianday convierte una fecha en un número, y los números se pueden restar.',
        ],
      ),
      tables: { donations, fires, land_purchases: landPurchases },
      stages: [
        {
          title: bi('The tide comes in', 'Sube la marea'),
          briefing: bi('Return given_on and the accumulated total of the donations up to that date, as running, in chronological order.', 'Devuelve given_on y el total acumulado de las donaciones hasta esa fecha, como running, por orden cronológico.'),
          ordered: true,
          expected: runningTotals,
          hints: [bi('SUM(amount) OVER (ORDER BY given_on) AS running', 'SUM(amount) OVER (ORDER BY given_on) AS running')],
          clue: bi(`Over the year the foundation received ${accumulated.toLocaleString('en-GB')}.`, `A lo largo del año, la fundación recibió ${accumulated.toLocaleString('es-ES')}.`),
        },
        {
          title: bi('The first million', 'El primer millón'),
          briefing: bi('Find the donation with which the running total first reached 1,000,000. Return given_on and donor, in one row.', 'Encuentra la donación con la que el total acumulado alcanzó por primera vez 1.000.000. Devuelve given_on y donor, en una fila.'),
          expected: [{ given_on: millionReached.given_on, donor: millionDonor }],
          hints: [bi('Put the window in a CTE, then filter WHERE running >= 1000000, sort by date and LIMIT 1.', 'Mete la ventana en un CTE, filtra después con WHERE running >= 1000000, ordena por fecha y LIMIT 1.')],
          clue: bi(`The foundation reached a million on 4 August 1987, with a donation from ${millionDonor}.`, `La fundación alcanzó el millón el 4 de agosto de 1987, con una donación de ${millionDonor}.`),
        },
        {
          title: bi('From ashes to deeds', 'De las cenizas a las escrituras'),
          briefing: bi('Find the land bought at the same address as a fire, within the 30 days after it. Return address, buyer and the whole days between them as days.', 'Encuentra los terrenos que ardieron y se compraron en los 30 días siguientes al incendio. Devuelve address, buyer y los días enteros transcurridos como days.'),
          expected: [
            { address: 'Calle del Cordel 4', buyer: 'Gestiones Bruma', days: 14 },
            { address: 'Plaza de la Sal 11', buyer: 'Gestiones Bruma', days: 8 },
            { address: 'Paseo de la Red 2', buyer: 'Gestiones Bruma', days: 14 },
            { address: 'Calle del Faro Viejo 9', buyer: 'Gestiones Bruma', days: 7 },
          ],
          hints: [bi('JOIN fires and land_purchases by address. julianday(bought_on) - julianday(fire_on) gives the days.', 'Une fires y land_purchases por address. julianday(bought_on) - julianday(fire_on) da los días.'), bi('Use BETWEEN 0 AND 30, so that purchases before the fire stay out.', 'Usa BETWEEN 0 AND 30, para dejar fuera las compras anteriores al incendio.')],
          clue: bi('Gestiones Bruma, of the Nereida chain, bought all four burned plots within two weeks.', 'Gestiones Bruma, de la cadena Nereida, compró los cuatro solares quemados en menos de dos semanas.'),
        },
      ],
      closing: bi(
        [
          'Fire, payment, purchase. Again and again. Naviera Vent and the Harbour Commission donate to a charity, and the charity controls a chain of companies. One of them pays Joel Serra, the guest who called himself Vale Stone, to burn down a building. Another then buys the plot for the price of a car. The land will be worth two hundred times that the moment Proyecto Faro is approved. The permit committee meets in January.',
          'You could take it to Quiroga now. But you keep thinking about what Teo said: that she is still broadcasting. You have not yet checked the most important thing of all: whether Inés Bosch is alive.',
        ],
        [
          'Incendio, pago, compra. Una y otra vez. Naviera Vent y la Comisión del Puerto donan a una fundación, y la fundación controla una cadena de empresas. Una de ellas paga a Joel Serra, el huésped que se hacía llamar Vale Stone, para que queme un edificio. Otra compra después el solar por el precio de un coche. El terreno valdrá doscientas veces más en cuanto se apruebe el Proyecto Faro. La comisión de licencias se reúne en enero.',
          'Podrías llevárselo ya a Quiroga. Pero no dejas de pensar en lo que dijo Teo: que ella sigue emitiendo. Aún no has comprobado lo más importante de todo: si Inés Bosch está viva.',
        ],
      ),
    },
    {
      id: 'last-signal',
      rating: 5,
      dossier: true,
      concepts: ['DOSSIER', 'ROW_NUMBER', 'CTE', 'HAVING'],
      title: bi('Dossier: The last signal', 'Expediente: La última señal'),
      location: bi('Coast Radio Station · 23:50', 'Radio Costera · 23:50'),
      scene: bi(
        [
          'The Coast Radio Station is a concrete block on the cliffs north of the city, and nobody there ever looks at its logs. For two consecutive nights, just before midnight, a signal with an unknown signature has gone out on an isolated network, through a terminal that is not connected to anything. Someone keeps trying to tell something to whoever knows how to listen.',
          'The station logs are fragments: reports, relays, terminals, shifts, badges, calls, loans. Everything is mixed with routine, and access by itself proves nothing. You want two people: whoever operated the signal and whoever prepared the equipment. There are no hints, and nobody else will help you now. And you already recognise this way of working. Follow the leads in order.',
        ],
        [
          'La Radio Costera es un bloque de hormigón en los acantilados al norte de la ciudad, y nadie allí mira nunca sus registros. Dos noches seguidas, poco antes de medianoche, ha salido una señal con una firma desconocida por una red aislada, a través de un terminal que no está conectado a nada. Alguien insiste en decirle algo a quien sepa escuchar.',
          'Los registros de la estación son fragmentos: partes, repetidores, terminales, turnos, credenciales, llamadas, préstamos. Todo mezclado con la rutina, y el acceso por sí solo no prueba nada. Quieres a dos personas: quien manejó la señal y quien preparó el equipo. No hay ayudas, y ya nadie más te va a echar una mano. Y esta forma de trabajar ya la reconoces. Sigue las pistas por orden.',
        ],
      ),
      tables: {
        incident_reports: [
          { id: 1, reported_at: '1987-12-02 20:15', system: 'Camera', detail: bi('Brief image loss in the East Corridor.', 'Breve pérdida de imagen en el pasillo este.') },
          { id: 2, reported_at: '1987-12-04 00:12', system: 'Relay', detail: bi('Unknown signal with signature SIG-9 appeared on two consecutive nights.', 'Señal desconocida con la firma SIG-9 durante dos noches consecutivas.') },
          { id: 3, reported_at: '1987-12-04 08:30', system: 'Archive', detail: bi('Routine index mismatch; no data was removed.', 'Discrepancia rutinaria del índice; no se eliminaron datos.') },
        ],
        relay_events: [
          { id: 1, day: '1987-12-02', terminal_id: 9, activated_at: '23:56', signature: 'SIG-9' },
          { id: 2, day: '1987-12-03', terminal_id: 9, activated_at: '23:59', signature: 'SIG-9' },
          { id: 3, day: '1987-12-02', terminal_id: 6, activated_at: '19:12', signature: 'SIG-4' },
          { id: 4, day: '1987-12-03', terminal_id: 3, activated_at: '21:08', signature: 'SIG-2' },
        ],
        terminals: [
          { id: 3, code: 'A-3', room: 'Archive', network: 'internal' },
          { id: 6, code: 'C-6', room: 'Control Room', network: 'operations' },
          { id: 9, code: 'T-9', room: 'Relay Room', network: 'isolated' },
        ],
        operators: [
          { id: 1, name: 'Gael Mir', shift: 'evening' },
          { id: 2, name: 'Inés Bosch', shift: 'night' },
          { id: 3, name: 'Jan Riu', shift: 'night' },
          { id: 4, name: 'Luz Serra', shift: 'evening' },
        ],
        transmissions: [
          { operator_id: 1, day: '1987-12-02', sent_at: '23:40', terminal_id: 6, channel: 'OPS' },
          { operator_id: 4, day: '1987-12-02', sent_at: '23:47', terminal_id: 6, channel: 'OPS' },
          { operator_id: 2, day: '1987-12-02', sent_at: '23:55', terminal_id: 6, channel: 'OPS' },
          { operator_id: 3, day: '1987-12-03', sent_at: '23:42', terminal_id: 6, channel: 'OPS' },
          { operator_id: 4, day: '1987-12-03', sent_at: '23:50', terminal_id: 6, channel: 'OPS' },
          { operator_id: 2, day: '1987-12-03', sent_at: '23:58', terminal_id: 6, channel: 'OPS' },
          { operator_id: 3, day: '1987-12-02', sent_at: '23:57', terminal_id: 3, channel: 'ARCHIVE' },
          { operator_id: 1, day: '1987-12-03', sent_at: '23:59', terminal_id: 3, channel: 'ARCHIVE' },
        ],
        badge_entries: [
          { operator_id: 1, day: '1987-12-02', room: 'Archive', entered_at: '22:10' },
          { operator_id: 2, day: '1987-12-02', room: 'Relay Room', entered_at: '23:31' },
          { operator_id: 2, day: '1987-12-03', room: 'Relay Room', entered_at: '23:33' },
          { operator_id: 3, day: '1987-12-02', room: 'Relay Room', entered_at: '20:15' },
          { operator_id: 3, day: '1987-12-03', room: 'Relay Room', entered_at: '21:04' },
          { operator_id: 4, day: '1987-12-02', room: 'Control Room', entered_at: '23:12' },
          { operator_id: 4, day: '1987-12-03', room: 'Control Room', entered_at: '23:18' },
        ],
        technicians: [
          { id: 10, name: 'Marc Alba' },
          { id: 11, name: 'Ada Sol' },
          { id: 12, name: 'Pol Lluc' },
        ],
        maintenance_logs: [
          { technician_id: 10, terminal_id: 9, day: '1987-12-01', action: bi('Replaced signal bridge', 'Sustituido puente de señal') },
          { technician_id: 11, terminal_id: 6, day: '1987-12-02', action: bi('Updated operations console', 'Actualizada consola de operaciones') },
          { technician_id: 12, terminal_id: 9, day: '1987-10-12', action: bi('Routine inspection', 'Inspección rutinaria') },
          { technician_id: 12, terminal_id: 3, day: '1987-12-03', action: bi('Reindexed archive node', 'Reindexado nodo de archivo') },
        ],
        calls: [
          { operator_id: 2, technician_id: 10, day: '1987-12-02', called_at: '23:58', duration: 34 },
          { operator_id: 2, technician_id: 10, day: '1987-12-03', called_at: '23:59', duration: 28 },
          { operator_id: 3, technician_id: 11, day: '1987-12-02', called_at: '21:20', duration: 185 },
          { operator_id: 2, technician_id: 11, day: '1987-11-30', called_at: '17:05', duration: 241 },
          { operator_id: 4, technician_id: 12, day: '1987-12-03', called_at: '22:10', duration: 96 },
        ],
        equipment_loans: [
          { technician_id: 10, item: bi('portable signal bridge', 'puente de señal portátil'), loaned_at: '1987-12-01 16:40', returned_at: null },
          { technician_id: 11, item: bi('spectrum analyzer', 'analizador de espectro'), loaned_at: '1987-12-02 09:15', returned_at: '1987-12-02 18:00' },
          { technician_id: 12, item: bi('access probe', 'sonda de acceso'), loaned_at: '1987-12-03 08:05', returned_at: null },
        ],
      },
      stages: [
        {
          title: bi('Read the reports', 'Lee los partes'),
          briefing: bi('Find the report for the Relay system. Return its detail.', 'Busca el parte del sistema Relay. Devuelve su detail.'),
          expected: [{ detail: bi('Unknown signal with signature SIG-9 appeared on two consecutive nights.', 'Señal desconocida con la firma SIG-9 durante dos noches consecutivas.') }],
          clue: bi('The relevant signature is SIG-9, on two consecutive nights.', 'La firma relevante es SIG-9, dos noches seguidas.'),
        },
        {
          title: bi('Isolate the events', 'Aísla los eventos'),
          briefing: bi('Return day, terminal_id and activated_at of the SIG-9 events in chronological order.', 'Devuelve day, terminal_id y activated_at de los eventos SIG-9 por orden cronológico.'),
          ordered: true,
          expected: [
            { day: '1987-12-02', terminal_id: 9, activated_at: '23:56' },
            { day: '1987-12-03', terminal_id: 9, activated_at: '23:59' },
          ],
          clue: bi('Both activations came from terminal 9, just before midnight.', 'Las dos activaciones salieron del terminal 9, poco antes de medianoche.'),
        },
        {
          title: bi('Locate the origin', 'Localiza el origen'),
          briefing: bi('Join those events with the terminals. Return code and room without repetition.', 'Une esos eventos con los terminales. Devuelve code y room sin repetir.'),
          expected: [{ code: 'T-9', room: 'Relay Room' }],
          clue: bi('The signal originated in terminal T-9, in the Relay Room.', 'La señal salió del terminal T-9, en Relay Room.'),
        },
        {
          title: bi('The last traffic', 'El último tráfico'),
          briefing: bi('For each incident day, rank only OPS transmissions by time and identify the final sender. Return day and name, ordered by day.', 'Para cada día del incidente, ordena solo las transmisiones OPS por hora e identifica a la última persona que emitió. Devuelve day y name, ordenados por día.'),
          ordered: true,
          expected: [{ day: '1987-12-02', name: 'Inés Bosch' }, { day: '1987-12-03', name: 'Inés Bosch' }],
          clue: bi('Inés Bosch closed OPS traffic on both nights. She is alive, and working under her own name.', 'Inés Bosch cerró el tráfico OPS las dos noches. Está viva, y trabaja con su propio nombre.'),
        },
        {
          title: bi('Repeated access', 'Accesos repetidos'),
          briefing: bi('Find the operators whose badge entered the Relay Room on both days. Return their names.', 'Encuentra a los operadores cuya credencial entró en Relay Room ambos días. Devuelve sus nombres.'),
          expected: [{ name: 'Inés Bosch' }, { name: 'Jan Riu' }],
          clue: bi('Access alone proves nothing: Jan Riu also entered on both days.', 'El acceso por sí solo no prueba nada: Jan Riu también entró los dos días.'),
        },
        {
          title: bi('Traffic and access', 'Tráfico y acceso'),
          briefing: bi('Intersect the operators with repeated access with the one who sent last on both days. Return only name.', 'Cruza a los operadores con accesos repetidos con quien emitió en último lugar ambos días. Devuelve solo name.'),
          expected: [{ name: 'Inés Bosch' }],
          clue: bi('Only Inés Bosch appears in both independent patterns.', 'Solo Inés Bosch aparece en ambos patrones independientes.'),
        },
        {
          title: bi('Who prepared the terminal?', '¿Quién preparó el terminal?'),
          briefing: bi('Find the most recent maintenance of T-9 before the first incident. Return the technician’s name and action.', 'Encuentra el mantenimiento más reciente de T-9 antes del primer incidente. Devuelve el name del técnico y action.'),
          expected: [{ name: 'Marc Alba', action: bi('Replaced signal bridge', 'Sustituido puente de señal') }],
          clue: bi('Marc Alba replaced the signal bridge of T-9 the day before the first signal.', 'Marc Alba sustituyó el puente de señal de T-9 el día antes de la primera emisión.'),
        },
        {
          title: bi('Compare the calls', 'Compara las llamadas'),
          briefing: bi('Look for an operator-technician pair with short calls, under a minute, on both days. Return operator, technician and the count as calls.', 'Busca una pareja operador-técnico con llamadas breves, de menos de un minuto, los dos días. Devuelve operator, technician y el recuento como calls.'),
          expected: [{ operator: 'Inés Bosch', technician: 'Marc Alba', calls: 2 }],
          clue: bi('Inés Bosch called Marc Alba for less than a minute after each signal.', 'Inés Bosch llamó a Marc Alba durante menos de un minuto tras cada señal.'),
        },
        {
          title: bi('The missing component', 'El componente que falta'),
          briefing: bi('Check the equipment loans for an unreturned item that bridges a signal. Return the technician’s name and item.', 'Comprueba los préstamos de material para localizar un objeto sin devolver que sirva para puentear una señal. Devuelve el name del técnico e item.'),
          expected: [{ name: 'Marc Alba', item: bi('portable signal bridge', 'puente de señal portátil') }],
          clue: bi('Marc Alba still has the portable signal bridge.', 'Marc Alba aún tiene el puente de señal portátil.'),
        },
      ],
      accusation: {
        intro: bi('You do not need a warrant for this one. You only need to be sure, before you tune in.', 'Para esto no necesitas una orden. Solo necesitas no tener ninguna duda antes de sintonizar.'),
        fields: [
          { key: 'operator', label: bi('Who controlled the relay?', '¿Quién controlaba el repetidor?'), options: ['Gael Mir', 'Inés Bosch', 'Jan Riu', 'Luz Serra'] },
          { key: 'accomplice', label: bi('Who prepared the equipment?', '¿Quién preparó el equipo?'), options: ['Marc Alba', 'Ada Sol', 'Pol Lluc'] },
        ],
        answer: { operator: 'Inés Bosch', accomplice: 'Marc Alba' },
      },
      closing: bi(
        [
          'You park on the cliff road with the lights off. At 23:56 you tune the car radio to the frequency of terminal T-9 and for a while you hear only the sea. Then a dry little woman’s voice, the voice of someone reading a list for the thousandth time, says a case number. And another. 1014. 1015. 1027. She reads all seven. She has been reading them night after night, adding one each time another file disappears, for whoever might be listening.',
          'You press the transmit button. It takes you a moment to know what to say, and in the end you say the truth: “This is the desk in Basement Two. You left your mug.”',
          'There is a very long silence. And then, on an open frequency, against every rule she ever taught anyone, somebody starts to laugh. “Took you long enough,” says Inés Bosch. “Do you have the key?”',
        ],
        [
          'Aparcas en la carretera del acantilado con las luces apagadas. A las 23:56 sintonizas la radio del coche en la frecuencia del terminal T-9 y durante un rato solo se oye el mar. Luego, una vocecita seca de mujer, la voz de alguien que lee una lista por milésima vez, dice un número de expediente. Y otro. 1014. 1015. 1027. Lee los siete. Lleva noche tras noche leyéndolos, añadiendo uno cada vez que desaparece otro expediente, para quien pudiera estar escuchando.',
          'Pulsas el botón de transmitir. Tardas un momento en saber qué decir, y al final dices la verdad: "Aquí la mesa del Sótano Dos. Te dejaste la taza".',
          'Hay un silencio larguísimo. Y luego, en una frecuencia abierta, contra todas las normas que enseñó jamás, alguien empieza a reírse. "Has tardado", dice Inés Bosch. "¿Tienes la llave?"',
        ],
      ),
    },
    {
      id: 'cabinet-a12',
      rating: 5,
      dossier: true,
      concepts: ['FINAL DOSSIER', 'UNION', 'CTE', 'HAVING'],
      title: bi('Final dossier: Cabinet A-12', 'Expediente final: El armario A-12'),
      location: bi('Room A-12 · Sunday · 04:00', 'Sala A-12 · Domingo · 04:00'),
      scene: bi(
        [
          'The brass key turns at the first try in the old lock of the cabinet from your first day. Inside there is a magnetic tape in a biscuit tin, with a label in careful handwriting: “Everything”. You load it into ATLAS at four in the morning with Inés Bosch on the other end of a portable radio. Quiroga watches the door with her coat on and one hand in her pocket.',
          'Four sources, gathered in one year by the woman who sat at your desk: cargo manifests, bank records, phone taps and land deeds. Anyone can be mentioned once in a record: this city is small. A prosecutor will only be able to use the people who appear in at least three independent sources. Then you will have to decide what to do with them, and who you can still hand it over to.',
        ],
        [
          'La llave de latón abre a la primera la vieja cerradura del armario de tu primer día. Dentro hay una cinta magnética en una lata de galletas, con una etiqueta de letra cuidadosa: "Todo". La cargas en ATLAS a las cuatro de la madrugada, con Inés Bosch al otro lado de una radio portátil. Quiroga vigila la puerta con el abrigo puesto y una mano en el bolsillo.',
          'Cuatro fuentes, reunidas durante un año por la mujer que se sentaba a tu mesa: manifiestos de carga, registros bancarios, escuchas y escrituras. Cualquiera puede aparecer una vez en un registro: la ciudad es pequeña. Un fiscal solo podrá usar a quienes aparezcan en al menos tres fuentes independientes. Después tendrás que decidir qué hacer con ellos y a quién puedes entregárselo todavía.',
        ],
      ),
      tables: { ...tapeTables, meetings, fires: [...earlierFires, ...fires] },
      stages: [
        {
          title: bi('At least three sources', 'Al menos tres fuentes'),
          briefing: bi('The four tape_ tables have a person column. A person can appear several times in one table, which counts as one source. Return person and the number of different sources as sources, only for those with at least three.', 'Las cuatro tablas tape_ tienen una columna person. Una persona puede aparecer varias veces en una tabla, y eso cuenta como una sola fuente. Devuelve person y el número de fuentes distintas como sources, solo de quienes tengan al menos tres.'),
          expected: [
            { person: 'Oriol Vent', sources: 4 },
            { person: 'Ricardo Salas', sources: 3 },
            { person: 'Alba Grau', sources: 3 },
          ],
          clue: bi('Three names resist every test: Oriol Vent, Ricardo Salas and Judge Alba Grau.', 'Tres nombres resisten todas las pruebas: Oriol Vent, Ricardo Salas y la jueza Alba Grau.'),
        },
        {
          title: bi('The night they agreed', 'La noche en que se pusieron de acuerdo'),
          briefing: bi('Those three must have met. In meetings, find the only date when the three of them were present. Return met_on and place, in one row.', 'Esos tres tienen que haberse reunido. En meetings, encuentra la única fecha en la que estuvieron los tres. Devuelve met_on y place, en una fila.'),
          expected: [{ met_on: '1987-08-30', place: 'Glass Gallery' }],
          clue: bi('On 30 August all three met at the Glass Gallery. Two weeks later, the first warehouse burned.', 'El 30 de agosto se reunieron los tres en la Galería de Cristal. Dos semanas después ardió el primer almacén.'),
        },
        {
          title: bi('What it cost', 'Lo que costó'),
          briefing: bi('Count the fires after that date and add up their casualties. Return fires and casualties, with those aliases.', 'Cuenta los incendios posteriores a esa fecha y suma sus víctimas. Devuelve fires y casualties, con esos alias.'),
          expected: [{ fires: 4, casualties: 1 }],
          clue: bi('Four fires and one death: Bernat Ros, sixty-three, who was never told.', 'Cuatro incendios y un muerto: Bernat Ros, sesenta y tres años, a quien nunca avisaron.'),
        },
      ],
      accusation: {
        intro: bi('Quiroga does not take her eyes off the door. “Say the names out loud. I want to hear them from someone who has checked.”', 'Quiroga no aparta la vista de la puerta. "Di los nombres en voz alta. Quiero oírlos de alguien que lo haya comprobado."'),
        fields: [
          { key: 'owner', label: bi('Who owned the plan?', '¿De quién era el plan?'), options: ['Oriol Vent', 'Eva Sanz', 'Laia Nord', 'Aina Puig'] },
          { key: 'protector', label: bi('Who protected it from the police?', '¿Quién lo protegía desde la policía?'), options: ['Marta Quiroga', 'Ricardo Salas', 'Teo Ferrán', 'Iris Vega'] },
          { key: 'court', label: bi('Who protected it from the courts?', '¿Quién lo protegía desde los tribunales?'), options: ['Alba Grau', 'Clara Ferrer', 'Mina Costa', 'Lupe Vera'] },
        ],
        answer: { owner: 'Oriol Vent', protector: 'Ricardo Salas', court: 'Alba Grau' },
      },
      decision: {
        title: bi('What do you do with the tape?', '¿Qué haces con la cinta?'),
        intro: bi('The judge who should receive this is on the list. The man who should act on it is on the list. It is five in the morning. There is one tape, and three ways out.', 'La jueza que debería recibirla está en la lista. El hombre que debería actuar está en la lista. Son las cinco de la mañana. Hay una cinta y tres salidas.'),
        options: [
          { id: 'press', label: bi('Give it to La Voz del Puerto', 'Dársela a La Voz del Puerto'), description: bi('Everything, on the front page, before anyone can stop it. Nothing can be buried afterwards, and much of it will never hold up in court.', 'Todo, en portada, antes de que nadie lo pueda parar. Después ya nada se podrá enterrar, y gran parte nunca se sostendrá en un juicio.') },
          { id: 'arrest', label: bi('Give it to Quiroga', 'Dársela a Quiroga'), description: bi('Arrests today, with the handful of officers she still trusts, and a prosecutor from the capital. By the book, and it might not be enough.', 'Detenciones hoy, con los pocos agentes de los que aún se fía, y un fiscal de la capital. Por el camino legal, y quizá no baste.') },
          { id: 'deal', label: bi('Accept the Commissioner’s offer', 'Aceptar la oferta del Comisario'), description: bi('He called an hour ago. He offers you the running of the new Bureau, a clean record for Teo, and nobody else getting hurt. All you have to do is forget where you put the tin.', 'Llamó hace una hora. Te ofrece dirigir el nuevo Archivo, limpiar el expediente de Teo y que nadie más salga herido. Solo tienes que olvidar dónde has dejado la lata.') },
        ],
      },
      closing: bi(
        ['You take the tape out of the machine. It is still warm.'],
        ['Sacas la cinta de la máquina. Aún está caliente.'],
      ),
    },
  ],
};
