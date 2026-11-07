/**
 * Chapter 2, "Pier Three": the analyst follows the note of Inés Bosch out of the
 * basement and into the harbour. Teaches LEFT JOIN, HAVING, multiple joins and
 * subqueries, and ends with the first dossier with an accusation.
 * The format of a chapter and of a mission is documented in `content/campaign.js`.
 */

import { bi } from '../core/localize.js';
import { fillerRows, shuffleIntoLog } from './world/noise.js';

/* The Central Station lockers: all rented except the ones the case needs. */
const lockers = Array.from({ length: 24 }, (_, index) => ({
  id: index + 1,
  number: `L-${String(index + 1).padStart(2, '0')}`,
  active: [3, 7, 15].includes(index + 1) ? 0 : 1,
}));
const unrented = [7, 11, 19];
const lockerContracts = fillerRows(201, 24, (random, index) => ({
  id: 100 + index,
  locker_id: index + 1,
  renter: random.name(),
  signed_on: `1987-0${random.int(1, 9)}-${String(random.int(10, 28))}`,
})).filter((row) => !unrented.includes(row.locker_id));
const lockerInspections = [
  ...lockers
    .filter((locker) => ![11, 19].includes(locker.id))
    .map((locker) => ({ locker_id: locker.id, inspected_on: '1987-11-03', note: bi('Routine check. Nothing to report.', 'Revisión rutinaria. Sin novedad.') })),
  { locker_id: 19, inspected_on: '1987-11-03', note: bi('Empty. Door jammed since August.', 'Vacía. Puerta atascada desde agosto.') },
  { locker_id: 11, inspected_on: '1987-11-03', note: bi('Sealed envelope inside. Not opened: no contract, no authority.', 'Sobre sellado en el interior. Sin abrir: sin contrato, sin autorización.') },
];

/* Warehouse collections: evidence for Warehouse 9 hidden among ordinary traffic. */
const collectionFiller = fillerRows(202, 70, (random) => ({
  courier_id: random.int(1, 12),
  warehouse: `Warehouse ${random.int(1, 8)}`,
  collected_at: random.time('07:30', '20:30'),
  weight_kg: random.int(5, 120),
}));
const warehouseNine = [
  [6, '22:40', 310], [6, '23:05', 280], [6, '22:15', 340], [6, '23:50', 295], [6, '22:30', 325], [6, '14:10', 40],
  [9, '10:20', 60], [9, '11:45', 55], [9, '09:30', 70], [9, '12:05', 65], [9, '22:50', 45],
  [2, '16:00', 30], [3, '08:15', 25], [3, '13:40', 35],
].map(([courier_id, collected_at, weight_kg]) => ({ courier_id, warehouse: 'Warehouse 9', collected_at, weight_kg }));
const couriers = fillerRows(203, 12, (random, index) => ({
  id: index + 1,
  name: random.name(),
  company: random.pick(['Rápidos del Norte', 'Portes Lagos', 'Trans Otero']),
})).map((courier) => (courier.id === 6 ? { id: 6, name: 'Joel Serra', company: 'Faro Servicios' } : courier));

/* The vehicle register: three vehicles of Naviera Vent among those of the rest of the city. */
const registerPeople = [
  { id: 1, name: 'Roc Vidal' },
  { id: 2, name: 'Lina Fox' },
  { id: 3, name: 'Hugo Cal' },
  { id: 4, name: 'Mina Costa' },
  ...fillerRows(204, 26, (random, index) => ({ id: index + 5, name: random.name() })),
];
const registerVehicles = [
  { id: 1, plate: 'VX-204', model: 'Van', owner_id: 1 },
  { id: 2, plate: 'RT-110', model: 'Saloon', owner_id: 2 },
  { id: 3, plate: 'KM-318', model: 'Truck', owner_id: 3 },
  { id: 4, plate: 'NX-77', model: 'Van', owner_id: 4 },
  ...fillerRows(205, 22, (random, index) => ({
    id: index + 5,
    plate: `${random.pick(['AB', 'CD', 'EF', 'GH'])}-${random.int(100, 999)}`,
    model: random.pick(['Saloon', 'Motorcycle', 'Truck', 'Van']),
    owner_id: index + 5,
  })),
];
const registerPhones = registerPeople.map((person) => ({ person_id: person.id, phone: `555-${String(100 + person.id * 3).padStart(4, '0')}` }));
const registerEmployers = registerPeople.map((person, index) => ({
  person_id: person.id,
  company: [1, 3, 4].includes(person.id) ? 'Naviera Vent' : ['Lonja Municipal', 'Astilleros Cal', 'Correos', 'Banco del Puerto'][index % 4],
}));

/* Transfers: the average and the suspicious rows are calculated, not typed, to stay exact. */
const transferFiller = fillerRows(206, 40, (random) => ({
  account: random.pick(['A-17', 'B-04', 'C-22', 'D-30', 'E-12']),
  amount: random.int(100, 300) * 10,
  made_on: `1987-${random.pick(['09', '10'])}-${String(random.int(1, 28)).padStart(2, '0')}`,
}));
const bigTransfers = [
  { account: 'X-91', amount: 41000, made_on: '1987-09-15' },
  { account: 'X-91', amount: 38500, made_on: '1987-10-04' },
  { account: 'X-91', amount: 44000, made_on: '1987-10-22' },
  { account: 'Y-12', amount: 16000, made_on: '1987-10-30' },
];
const transfers = shuffleIntoLog([...transferFiller, ...bigTransfers], 'made_on');
const averageTransfer = Math.round((transfers.reduce((total, row) => total + row.amount, 0) / transfers.length) * 100) / 100;
const suspiciousTransfers = transfers
  .filter((row) => row.amount > averageTransfer * 3)
  .map(({ account, amount }) => ({ account, amount }));

/* Harbour dossier. */
const harbourGateLogs = [
  { van_id: 1, pier: 3, left_at: '21:52' },
  { van_id: 2, pier: 3, left_at: '22:11' },
  { van_id: 3, pier: 5, left_at: '22:14' },
  { van_id: 4, pier: 3, left_at: '22:36' },
];

export const chapter2 = {
  id: 2,
  title: bi('Pier Three', 'Muelle Tres'),
  subtitle: bi('A note from a woman who no longer works here takes you somewhere nobody sent you.', 'La nota de una mujer que ya no trabaja aquí te lleva a un sitio al que nadie te ha mandado.'),
  prologue: {
    signal: bi('HARBOUR DISTRICT · NOVEMBER 1987 · 23:40', 'DISTRITO DEL PUERTO · NOVIEMBRE DE 1987 · 23:40'),
    title: bi('Everyone in this city works for the same man', 'En esta ciudad todos trabajan para el mismo hombre'),
    paragraphs: bi(
      [
        'For the first time you take an ATLAS printout out of the building, folded inside a newspaper, and go to the Central Station on your own time. Anyone who has been in the police longer than you would call that a very bad idea, and that means everyone.',
        'At the piers the cranes never stop, and they carry the same name you saw on the crate lid: VENT. So do the tugs, the warehouses and the union hall. Oriol Vent has a new project too: Proyecto Faro, a shining new waterfront where the Old Quarter stands now. The model is on display at City Hall. In the model it never rains.',
        'And then there are the fires. Nobody at headquarters connects them. It is not that they have looked and found nothing. Nobody has been asked to look.',
      ],
      [
        'Por primera vez sacas del edificio un listado de ATLAS, doblado dentro de un periódico, y vas a la Estación Central fuera de tu horario. A cualquiera que lleve en la policía más tiempo que tú le parecería muy mala idea, y eso es todo el mundo.',
        'En los muelles las grúas no paran, y llevan pintado el mismo nombre que viste en la tapa de la caja: VENT. También los remolcadores, los almacenes y la sede del sindicato. Oriol Vent tiene además un proyecto: el Proyecto Faro, un paseo marítimo reluciente justo donde hoy está el Barrio Viejo. La maqueta se expone en el Ayuntamiento. En la maqueta nunca llueve.',
        'Y luego están los incendios. En Jefatura nadie los relaciona. No es que hayan mirado y no hayan encontrado nada. Es que a nadie le han pedido que mire.',
      ],
    ),
    speaker: bi('MARTA QUIROGA · INSPECTOR', 'MARTA QUIROGA · INSPECTORA'),
    quote: bi('“I have not asked you to do this. If anyone asks, I told you to go home. Now tell me what you found.”', '"Yo no te he pedido esto. Si alguien pregunta, te dije que te fueras a casa. Ahora, cuéntame qué has encontrado."'),
    action: bi('Go down to the harbour', 'Bajar al puerto'),
  },
  missions: [
    {
      id: 'unclaimed-locker',
      rating: 2,
      concepts: ['LEFT JOIN', 'IS NULL'],
      title: bi('The locker nobody rents', 'La taquilla que nadie alquila'),
      location: bi('Central Station · Saturday · 06:20', 'Estación Central · Sábado · 06:20'),
      scene: bi(
        [
          'At dawn the Central Station holds only cleaners, pigeons and a man asleep on a suitcase. The locker rental office lets you consult its records over an old line to ATLAS, as long as you do not ask why it has that line.',
          'Inés Bosch wrote: the active locker that nobody rents. A plain JOIN will not help: as you saw at the museum, a JOIN throws away whatever has no match, and “no match” is precisely what you are looking for this time.',
        ],
        [
          'Al amanecer, en la Estación Central solo hay limpiadoras, palomas y un hombre dormido sobre una maleta. La oficina de alquiler de taquillas te deja consultar sus registros por una vieja línea conectada a ATLAS, siempre que no preguntes por qué la tiene.',
          'Inés Bosch escribió: la taquilla activa que nadie alquila. Un JOIN normal no sirve: como viste en el museo, un JOIN descarta las filas sin pareja, y esta vez "sin pareja" es precisamente lo que buscas.',
        ],
      ),
      tables: { lockers, contracts: lockerContracts, inspections: shuffleIntoLog(lockerInspections, 'locker_id') },
      stages: [
        {
          title: bi('Active and without a contract', 'Activas y sin contrato'),
          briefing: bi('Return the number of each active locker with no rental contract.', 'Devuelve el number de cada taquilla activa sin contrato de alquiler.'),
          expected: [{ number: 'L-11' }, { number: 'L-19' }],
          hints: [bi('LEFT JOIN keeps every locker; where there is no contract, the contract columns come out as NULL.', 'LEFT JOIN conserva todas las taquillas; donde no hay contrato, las columnas de contracts salen a NULL.'), bi('Filter with WHERE contracts.id IS NULL. Do not write = NULL: it never matches. Remember active = 1.', 'Filtra con WHERE contracts.id IS NULL. No escribas = NULL: nunca coincide. Recuerda active = 1.')],
          clue: bi('Two active lockers have no contract: L-11 and L-19.', 'Dos taquillas activas no tienen contrato: L-11 y L-19.'),
        },
        {
          title: bi('What the inspector saw', 'Lo que vio el inspector'),
          briefing: bi('Return the number and the inspection note of those two lockers, using the inspections table.', 'Devuelve number y la note de inspección de esas dos taquillas, usando la tabla inspections.'),
          expected: [
            { number: 'L-11', note: bi('Sealed envelope inside. Not opened: no contract, no authority.', 'Sobre sellado en el interior. Sin abrir: sin contrato, sin autorización.') },
            { number: 'L-19', note: bi('Empty. Door jammed since August.', 'Vacía. Puerta atascada desde agosto.') },
          ],
          hints: [bi("JOIN lockers with inspections through locker_id, and filter with number IN ('L-11', 'L-19').", "Une lockers con inspections por locker_id y filtra con number IN ('L-11', 'L-19').")],
          clue: bi('L-11 holds a sealed envelope that the inspector had no authority to open.', 'L-11 guarda un sobre sellado que el inspector no tenía autoridad para abrir.'),
        },
      ],
      closing: bi(
        [
          'The door of L-11 opens with the master key the cleaner lends you for a cigarette. The envelope is addressed to “The next one”. Inside there is a carbon copy of a manifest for Warehouse 9, a list of courier numbers and a line in that careful hand: “Count how many times they come. Honest people do not work at night with heavy boxes.”',
          'There is also an old photograph of the Records Bureau staff, Christmas 1985. Inés Bosch is a small woman with her glasses on her head, laughing at something. Next to her, a Teo Ferrán who smiles far more than the one you know is raising a paper cup in a toast.',
        ],
        [
          'La puerta de L-11 se abre con la llave maestra que la limpiadora te presta a cambio de un cigarrillo. El sobre va dirigido a "Quien venga después". Dentro hay una copia en papel carbón de un manifiesto del Almacén 9, una lista de números de mensajero y una línea con esa letra cuidadosa: "Cuenta cuántas veces vienen. La gente honrada no trabaja de noche con cajas pesadas".',
          'También hay una foto antigua del personal del Archivo, Navidad de 1985. Inés Bosch es una mujer menuda con las gafas en la cabeza, riéndose de algo. A su lado, un Teo Ferrán mucho más sonriente que el que conoces brinda con un vaso de papel.',
        ],
      ),
    },
    {
      id: 'warehouse-pattern',
      rating: 3,
      concepts: ['GROUP BY', 'HAVING', 'SUM'],
      title: bi('Honest people do not work at night', 'La gente honrada no trabaja de noche'),
      location: bi('Warehouse 9 · Sunday · 16:00', 'Almacén 9 · Domingo · 16:00'),
      scene: bi(
        [
          'The harbour keeps a record of each collection from its warehouses, because the harbour charges for each collection. Eighty-odd rows, a dozen courier accounts, mostly invoices and fish. You could read them one at a time, but it would take all night, and you would still miss something.',
          'WHERE filters rows before they are grouped. There is another clause that filters afterwards, when you already have the counts in your hands. It is the difference between asking “who came at night?” and “who keeps coming?”. Tonight you need to ask both.',
        ],
        [
          'El puerto lleva registro de cada recogida en sus almacenes, porque las cobra todas. Unas ochenta filas, una docena de cuentas de mensajero, casi todo facturas y pescado. Podrías leerlas una a una, pero tardarías toda la noche y aun así se te escaparía algo.',
          'WHERE filtra las filas antes de agruparlas. Hay otra cláusula que filtra después, cuando ya tienes los recuentos en la mano. Es la diferencia entre preguntar "¿quién vino de noche?" y "¿quién vuelve siempre?". Esta noche necesitas las dos.',
        ],
      ),
      tables: { collections: shuffleIntoLog([...collectionFiller, ...warehouseNine], 'collected_at'), couriers },
      stages: [
        {
          title: bi('The regulars of Warehouse 9', 'Los habituales del Almacén 9'),
          briefing: bi('Return courier_id and the count as visits for couriers with at least five collections from Warehouse 9.', 'Devuelve courier_id y el recuento como visits de los mensajeros con al menos cinco recogidas en Warehouse 9.'),
          expected: [{ courier_id: 6, visits: 6 }, { courier_id: 9, visits: 5 }],
          hints: [bi("Filter the warehouse with WHERE, group with GROUP BY courier_id, and filter the groups with HAVING COUNT(*) >= 5.", "Filtra el almacén con WHERE, agrupa con GROUP BY courier_id y filtra los grupos con HAVING COUNT(*) >= 5.")],
          clue: bi('Two accounts visit Warehouse 9 far more than the rest: 6 and 9.', 'Dos cuentas visitan el Almacén 9 mucho más que las demás: la 6 y la 9.'),
          reaction: bi('Teo, reading over your shoulder: Nine is the fish merchant; everyone knows him. The question is who six is.', 'Teo, leyendo por encima de tu hombro: La nueve es el pescadero de la lonja; la conoce todo el mundo. La pregunta es de quién es la seis.'),
        },
        {
          title: bi('Night and weight', 'Noche y peso'),
          briefing: bi('Consider only collections from Warehouse 9 from 22:00 onwards. Return courier_id, visits and the total weight as total_kg, for couriers with at least three.', 'Considera solo las recogidas en Warehouse 9 a partir de las 22:00. Devuelve courier_id, visits y el peso total como total_kg, de los mensajeros con al menos tres.'),
          expected: [{ courier_id: 6, visits: 5, total_kg: 1550 }],
          hints: [bi("Add collected_at >= '22:00' to the WHERE, not to the HAVING: it applies to rows, not to groups.", "Añade collected_at >= '22:00' al WHERE, no al HAVING: se aplica a filas, no a grupos."), bi('SUM(weight_kg) AS total_kg can sit next to COUNT(*) in the same SELECT.', 'SUM(weight_kg) AS total_kg puede ir junto a COUNT(*) en el mismo SELECT.')],
          clue: bi('Account 6 took out 1,550 kg from Warehouse 9 in five night collections.', 'La cuenta 6 sacó 1.550 kg del Almacén 9 en cinco recogidas nocturnas.'),
        },
        {
          title: bi('Whose account?', '¿De quién es la cuenta?'),
          briefing: bi('Return the name and company of courier 6.', 'Devuelve name y company del mensajero 6.'),
          expected: [{ name: 'Joel Serra', company: 'Faro Servicios' }],
          hints: [bi('A simple query on couriers. Do you recognise the name?', 'Una consulta sencilla sobre couriers. ¿Te suena el nombre?')],
          clue: bi('Account 6 is Joel Serra, of Faro Servicios: the man whose badge entered the laboratory during the blackout.', 'La cuenta 6 es Joel Serra, de Faro Servicios: el hombre cuya credencial entró en el laboratorio durante el apagón.'),
        },
      ],
      closing: bi(
        [
          'A ton and a half in five nights. What kind of contraband weighs that and needs a man who can also enter a forensic laboratory? You go through the manifest from the envelope again. The boxes are declared as “archival paper, for destruction”.',
          'You reread it twice. It takes you a moment to understand what bothers you. Headquarters has not sent any paper for destruction since ATLAS arrived. Every page was supposed to be digitised and kept. So whose paper has been leaving the port at night, one ton at a time?',
        ],
        [
          'Tonelada y media en cinco noches. ¿Qué tipo de contrabando pesa eso y necesita a un hombre que además puede entrar en un laboratorio forense? Vuelves al manifiesto del sobre. Las cajas están declaradas como "papel de archivo, para destrucción".',
          'Lo relees dos veces. Tardas un momento en entender qué te molesta. Jefatura no manda papel a destruir desde que llegó ATLAS. Cada hoja debía digitalizarse y conservarse. Entonces, ¿de quién es el papel que sale de noche del puerto, tonelada a tonelada?',
        ],
      ),
    },
    {
      id: 'three-way-trail',
      rating: 3,
      concepts: ['MULTIPLE JOIN'],
      title: bi('The van on the napkin', 'La furgoneta de la servilleta'),
      location: bi('Traffic Registry · Monday · 09:40', 'Registro de Tráfico · Lunes · 09:40'),
      scene: bi(
        [
          'A customs officer on his way to retirement has given Quiroga a plate on a napkin: VX-204, a van he has seen too often at the Warehouse 9 gate, at hours when no van should have business there. He has not put it in his report. “I have grandchildren,” he says, and in this city that explains everything.',
          'A plate is not a person, and a person is not a phone. The registry stores each thing in its own table so as not to repeat anything. That is good design, and it means you will have to walk the whole way: from the plate to the owner, from the owner to the phone, from the owner to the company.',
        ],
        [
          'Un aduanero a punto de jubilarse ha dado a Quiroga una matrícula en una servilleta: VX-204, una furgoneta que ha visto demasiadas veces en la puerta del Almacén 9, a horas en las que ninguna furgoneta pinta nada allí. No la ha puesto en su informe. "Tengo nietos", dice, y en esta ciudad eso lo explica todo.',
          'Una matrícula no es una persona y una persona no es un teléfono. El registro guarda cada cosa en su tabla para no repetir nada. Es buen diseño, y significa que tendrás que recorrer el camino entero: de la matrícula al dueño, del dueño al teléfono, del dueño a la empresa.',
        ],
      ),
      tables: { vehicles: registerVehicles, people: registerPeople, phones: registerPhones, employers: registerEmployers },
      stages: [
        {
          title: bi('From the plate to the person', 'De la matrícula a la persona'),
          briefing: bi('Return the name of the owner of plate VX-204.', 'Devuelve el name del propietario de la matrícula VX-204.'),
          expected: [{ name: 'Roc Vidal' }],
          hints: [bi('JOIN vehicles and people through owner_id.', 'Une vehicles y people mediante owner_id.')],
          clue: bi('VX-204 is registered to Roc Vidal.', 'La VX-204 está a nombre de Roc Vidal.'),
        },
        {
          title: bi('A number to call', 'Un número al que llamar'),
          briefing: bi('Add one more link: return name and phone of the owner of VX-204.', 'Añade un eslabón más: devuelve name y phone del propietario de la VX-204.'),
          expected: [{ name: 'Roc Vidal', phone: '555-0103' }],
          hints: [bi('You can chain joins: FROM a JOIN b ON ... JOIN c ON ... Each one adds its table to the row.', 'Se pueden encadenar joins: FROM a JOIN b ON ... JOIN c ON ... Cada uno añade su tabla a la fila.')],
          clue: bi('Roc Vidal, phone 555-0103.', 'Roc Vidal, teléfono 555-0103.'),
        },
        {
          title: bi('Everyone with the same employer', 'Todos con el mismo patrón'),
          briefing: bi('Roc works for Naviera Vent. List every vehicle registered to a Naviera Vent employee: return plate and name.', 'Roc trabaja para Naviera Vent. Enumera todos los vehículos a nombre de empleados de Naviera Vent: devuelve plate y name.'),
          expected: [
            { plate: 'VX-204', name: 'Roc Vidal' },
            { plate: 'KM-318', name: 'Hugo Cal' },
            { plate: 'NX-77', name: 'Mina Costa' },
          ],
          hints: [bi("Three tables this time: vehicles, people and employers, with WHERE company = 'Naviera Vent'.", "Tres tablas esta vez: vehicles, people y employers, con WHERE company = 'Naviera Vent'.")],
          clue: bi('Naviera Vent has three vehicles in play: VX-204, KM-318 and NX-77 (Mina Costa).', 'Naviera Vent tiene tres vehículos en juego: VX-204, KM-318 y NX-77 (Mina Costa).'),
        },
      ],
      closing: bi(
        [
          'You dial 555-0103 from a phone booth, just to hear who answers. A man says “Vidal” in the voice of someone who has been told to expect a call. You hang up. A minute later the booth starts to ring. You do not pick it up. You walk home the long way, through the Old Quarter, where fewer windows are lit every month.',
          'The next morning there is a new memo on the board upstairs: all ATLAS queries must be logged by operator, “for reasons of efficiency”, by order of Commissioner Ricardo Salas. Teo pins it up himself, whistling. He does not look at you. “Efficiency,” he says.',
        ],
        [
          'Marcas el 555-0103 desde una cabina, solo por oír quién contesta. Un hombre dice "Vidal" con la voz de alguien a quien han avisado de que llamarían. Cuelgas. Un minuto después la cabina empieza a sonar. No la coges. Vuelves a casa dando un rodeo por el Barrio Viejo, donde cada mes quedan menos ventanas encendidas.',
          'A la mañana siguiente hay una circular nueva en el tablón de arriba: todas las consultas de ATLAS se registrarán por operador, "por razones de eficiencia", por orden del comisario Ricardo Salas. La clava el propio Teo, silbando. No te mira. "Eficiencia", dice.',
        ],
      ),
    },
    {
      id: 'above-average-transfer',
      rating: 3,
      concepts: ['AVG', 'SUBQUERY'],
      title: bi('Above suspicion', 'Por encima de toda sospecha'),
      location: bi('Banco del Puerto · Tuesday · 13:15', 'Banco del Puerto · Martes · 13:15'),
      scene: bi(
        [
          'Quiroga knows somebody at the Banco del Puerto: a compliance officer who has owed her a favour since 1979, and neither of them talks about it. It gets you one night with the autumn transfers of Naviera Vent suppliers, on the condition that nobody ever knows and that the tape goes back before the morning shift.',
          'The trouble with big amounts is that “big” is an opinion. You need something a judge cannot argue with, such as “more than three times the average”. And you do not need to work out the average on paper and type it in: ATLAS can calculate it inside the same query.',
        ],
        [
          'Quiroga conoce a alguien en el Banco del Puerto: un jefe de control interno que le debe un favor desde 1979, y ninguno de los dos habla de ello. Eso te da una noche con las transferencias de otoño de los proveedores de Naviera Vent, con la condición de que nadie lo sepa nunca y de que la cinta vuelva antes del turno de mañana.',
          'El problema de los importes grandes es que "grande" es una opinión. Necesitas algo que un juez no pueda discutir, como "más de tres veces la media". Y no hace falta calcular la media en papel y teclearla: ATLAS puede hacerlo dentro de la misma consulta.',
        ],
      ),
      tables: {
        transfers,
        accounts: [
          { code: 'A-17', holder: 'Lonja Municipal' },
          { code: 'B-04', holder: 'Astilleros Cal' },
          { code: 'C-22', holder: 'Trans Otero' },
          { code: 'D-30', holder: 'Portes Lagos' },
          { code: 'E-12', holder: 'Rápidos del Norte' },
          { code: 'X-91', holder: 'Faro Servicios' },
          { code: 'Y-12', holder: 'Harbour Dues Office' },
        ],
      },
      stages: [
        {
          title: bi('What is normal?', '¿Qué es lo normal?'),
          briefing: bi('Calculate the average amount of all transfers. Return it with the name average.', 'Calcula el importe medio de todas las transferencias. Devuélvelo con el nombre average.'),
          expected: [{ average: averageTransfer }],
          hints: [bi('SELECT AVG(amount) AS average FROM transfers;', 'SELECT AVG(amount) AS average FROM transfers;')],
          clue: bi(`The average transfer is ${averageTransfer.toLocaleString('en-GB', { useGrouping: 'always' })}.`, `La transferencia media es de ${averageTransfer.toLocaleString('es-ES', { useGrouping: 'always' })}.`),
        },
        {
          title: bi('Three times normal', 'Tres veces lo normal'),
          briefing: bi('Without typing the average yourself, return account and amount of every transfer above three times the average.', 'Sin teclear la media a mano, devuelve account y amount de cada transferencia superior a tres veces la media.'),
          expected: suspiciousTransfers,
          hints: [bi('A subquery in brackets can be used as a value: amount > 3 * (SELECT AVG(amount) FROM transfers).', 'Una subconsulta entre paréntesis se puede usar como un valor: amount > 3 * (SELECT AVG(amount) FROM transfers).')],
          clue: bi('Four transfers stand out: three to X-91 and one to Y-12.', 'Destacan cuatro transferencias: tres a X-91 y una a Y-12.'),
        },
        {
          title: bi('The one that repeats', 'La que se repite'),
          briefing: bi('A single large payment can be innocent. Return the holder of the account with more than one of those transfers, and how many as times.', 'Un pago grande aislado puede ser inocente. Devuelve el holder de la cuenta con más de una de esas transferencias, y cuántas como times.'),
          expected: [{ holder: 'Faro Servicios', times: 3 }],
          hints: [bi('JOIN accounts, keep the same WHERE with the subquery, GROUP BY the holder, and finish with HAVING COUNT(*) > 1.', 'Une accounts, conserva el mismo WHERE con la subconsulta, agrupa por holder y termina con HAVING COUNT(*) > 1.')],
          clue: bi('Faro Servicios received three huge payments, each one the day after a Vale Stone check-in.', 'Faro Servicios recibió tres pagos enormes, cada uno al día siguiente de una entrada de Vale Stone.'),
        },
      ],
      closing: bi(
        [
          'The dates catch your eye before the amounts do. 15 September, 4 October, 22 October. You take out the sticky note with Vale Stone’s nights at the Miramar: 14 September, 3 October, 21 October. Each night at the Miramar is followed by a fire and, on that same day, by a payment to Faro Servicios, the company with the brass plate.',
          'The fourth date is 2 November. There is no transfer yet. The fourth warehouse burned on the 3rd, and a watchman named Bernat Ros, sixty-three, did not get out. Nobody warned him. Nobody thought it mattered.',
          'Quiroga reads it in silence and then asks you, quite gently, whether you have told anybody at home where you work.',
        ],
        [
          'Las fechas te saltan a la vista antes que los importes. 15 de septiembre, 4 de octubre, 22 de octubre. Sacas el papel con las noches de Vale Stone en el Miramar: 14 de septiembre, 3 de octubre, 21 de octubre. Cada noche en el Miramar va seguida de un incendio y, ese mismo día, de un pago a Faro Servicios, la empresa de la placa de latón.',
          'La cuarta fecha es el 2 de noviembre. Aún no hay transferencia. El cuarto almacén ardió el día 3, y un vigilante llamado Bernat Ros, de sesenta y tres años, no salió de allí. Nadie le avisó. A nadie le pareció importante.',
          'Quiroga lo lee en silencio y luego te pregunta, con bastante suavidad, si le has contado a alguien en casa dónde trabajas.',
        ],
      ),
    },
    {
      id: 'harbor-conspiracy',
      rating: 3,
      dossier: true,
      concepts: ['DOSSIER', 'JOIN', 'SUBQUERY'],
      title: bi('Dossier: The Pier Three crate', 'Expediente: La caja del Muelle 3'),
      location: bi('Pier 3 · Wednesday · 22:24', 'Muelle 3 · Miércoles · 22:24'),
      scene: bi(
        [
          'Tonight you finally got ahead of them. Quiroga has a man on Pier 3 and at 22:05 the power fails across the whole dock, for four minutes, as it has been doing lately without anyone being able to explain why. When the lights come back a crate marked for destruction has gone from the customs cage, and the seal is lying on the concrete.',
          'This time there are no second chances. By morning, the Commissioner’s office will want the file. You have one night to reconstruct the operation from what the port has recorded: the incident reports, the gate, the vans, the phones. There is more than one blue van in this city, and more than one driver making calls at odd hours. Answer one lead at a time. Do not guess.',
        ],
        [
          'Esta noche por fin vais por delante. Quiroga tiene a un hombre en el muelle 3 y a las 22:05 se va la luz en todo el dique, durante cuatro minutos, como viene pasando últimamente sin que nadie sepa explicar por qué. Cuando vuelve la luz, una caja marcada para destrucción ha desaparecido de la jaula de aduanas, y el precinto está en el suelo.',
          'Esta vez no hay segundas oportunidades. Por la mañana, el despacho del Comisario querrá el expediente. Tienes una noche para reconstruir la operación con lo que ha registrado el puerto: partes de incidencia, salidas, furgonetas, teléfonos. En esta ciudad hay más de una furgoneta azul, y más de un conductor que hace llamadas a horas raras. Una pista cada vez. No adivines.',
        ],
      ),
      tables: {
        incident_reports: [
          { id: 1, pier: 2, reported_at: '21:40', detail: bi('A damaged seal was replaced before the night shift.', 'Se sustituyó un precinto dañado antes del turno de noche.') },
          { id: 2, pier: 3, reported_at: '22:24', detail: bi('Witness saw a blue van leave after the power dip.', 'Un testigo vio salir una furgoneta azul después del corte de luz.') },
          { id: 3, pier: 5, reported_at: '23:05', detail: bi('A forklift alarm sounded with no cargo movement.', 'Sonó la alarma de una carretilla sin movimiento de carga.') },
        ],
        vans: [
          { id: 1, plate: 'HB-14', color: 'white', driver_id: 2 },
          { id: 2, plate: 'NX-77', color: 'blue', driver_id: 4 },
          { id: 3, plate: 'LV-09', color: 'blue', driver_id: 5 },
          { id: 4, plate: 'CR-31', color: 'red', driver_id: 6 },
        ],
        drivers: [
          { id: 2, name: 'Joel Serra' },
          { id: 4, name: 'Mina Costa' },
          { id: 5, name: 'Roc Vidal' },
          { id: 6, name: 'Sara Niu' },
        ],
        gate_logs: harbourGateLogs,
        people: [
          { id: 8, name: 'Oriol Vent' },
          { id: 9, name: 'Laia Nord' },
          { id: 10, name: 'Pau Roca' },
        ],
        calls: [
          { driver_id: 4, person_id: 8, duration: 42, called_at: '22:13' },
          { driver_id: 4, person_id: 9, duration: 184, called_at: '21:10' },
          { driver_id: 2, person_id: 8, duration: 120, called_at: '21:56' },
          { driver_id: 5, person_id: 10, duration: 35, called_at: '22:17' },
        ],
      },
      stages: [
        {
          title: bi('Start with the report', 'Empieza por el parte'),
          briefing: bi('Find the report filed for Pier 3. Return its detail.', 'Busca el parte presentado para el muelle 3. Devuelve su detail.'),
          expected: [{ detail: bi('Witness saw a blue van leave after the power dip.', 'Un testigo vio salir una furgoneta azul después del corte de luz.') }],
          clue: bi('A witness saw a blue van leave Pier 3 after the power dip.', 'Un testigo vio una furgoneta azul salir del muelle 3 después del corte.'),
        },
        {
          title: bi('Trace the vehicle', 'Rastrea el vehículo'),
          briefing: bi('Two blue vans drove out that night. Use the gate log to find the one that left Pier 3. Return plate.', 'Dos furgonetas azules salieron esa noche. Usa las salidas para encontrar la que dejó el muelle 3. Devuelve plate.'),
          expected: [{ plate: 'NX-77' }],
          clue: bi('The blue van that left Pier 3, at 22:11, was NX-77.', 'La furgoneta azul que salió del muelle 3, a las 22:11, era la NX-77.'),
        },
        {
          title: bi('The driver', 'Quien conducía'),
          briefing: bi('Follow NX-77 to the drivers. Return the name with the alias driver.', 'Sigue la NX-77 hasta drivers. Devuelve el nombre con el alias driver.'),
          expected: [{ driver: 'Mina Costa' }],
          clue: bi('Mina Costa was at the wheel of NX-77.', 'Mina Costa iba al volante de la NX-77.'),
        },
        {
          title: bi('The call', 'La llamada'),
          briefing: bi('Immediately after leaving, the driver called someone to confirm. Return that person’s name as coordinator: look for a short call, under a minute, made after 22:11.', 'Justo después de salir, la conductora llamó a alguien para confirmar. Devuelve el nombre de esa persona como coordinator: busca una llamada breve, de menos de un minuto, posterior a las 22:11.'),
          expected: [{ coordinator: 'Oriol Vent' }],
          clue: bi('At 22:13, Mina Costa called Oriol Vent for 42 seconds.', 'A las 22:13, Mina Costa llamó a Oriol Vent durante 42 segundos.'),
        },
      ],
      accusation: {
        intro: bi('Quiroga can sign one arrest warrant before the Commissioner’s office opens. If you are wrong, more than your job is at stake.', 'Quiroga puede firmar una sola orden de detención antes de que abra el despacho del Comisario. Si te equivocas, no solo te juegas el puesto.'),
        fields: [
          { key: 'driver', label: bi('Who drove the van?', '¿Quién conducía la furgoneta?'), options: ['Joel Serra', 'Mina Costa', 'Roc Vidal', 'Sara Niu'] },
          { key: 'coordinator', label: bi('Who coordinated the operation?', '¿Quién coordinó la operación?'), options: ['Oriol Vent', 'Laia Nord', 'Pau Roca'] },
        ],
        answer: { driver: 'Mina Costa', coordinator: 'Oriol Vent' },
      },
      closing: bi(
        [
          'Mina Costa is arrested at the customs bridge at six in the morning. By eleven she is out. Her lawyer costs more than the van. At noon the file on the Pier 3 crate goes up to the Commissioner’s office, and at one it comes back down with a stamp: CLOSED BY ORDER OF THE COMMISSIONER. Oriol Vent gives an interview about the future of the waterfront, standing in front of the model, where it never rains.',
          'But that night they only took one crate, and another one with the same seal was left in the cage. Quiroga opens it on your desk. It is not contraband. It is old insurance files from the Glass Gallery: the Vent family’s private museum, the place that will host this year’s charity gala. On the top page someone has circled a single line in pencil. The stroke is small and careful, like the handwriting of Inés Bosch.',
          '“I did not see that,” Teo says, going past with the coffee. “And I did not tell you the gala is on the 12th.”',
        ],
        [
          'Detienen a Mina Costa en el puente de aduanas a las seis de la mañana. A las once ya está fuera. Su abogado vale más que la furgoneta. A mediodía el expediente de la caja del muelle 3 sube al despacho del Comisario, y a la una vuelve a bajar con un sello: ARCHIVADO POR ORDEN DEL COMISARIO. Oriol Vent da una entrevista sobre el futuro del paseo marítimo, de pie delante de la maqueta, donde nunca llueve.',
          'Pero esa noche solo se llevaron una caja, y en la jaula quedó otra con el mismo precinto. Quiroga la abre en tu mesa. No es contrabando. Son viejos expedientes de seguros de la Galería de Cristal: el museo privado de la familia Vent, el lugar que acogerá la gala benéfica de este año. En la primera hoja, alguien ha rodeado a lápiz una sola línea. El trazo es pequeño y cuidadoso, como la letra de Inés Bosch.',
          '"Yo eso no lo he visto", dice Teo, pasando con el café. "Y tampoco te he dicho que la gala es el día 12."',
        ],
      ),
    },
  ],
};
