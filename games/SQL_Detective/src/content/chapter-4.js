/**
 * Chapter 4, "Altered Records": the crime scene is the database itself. Teaches string
 * cleaning, COALESCE, sqlite_master and window functions, and ends with the dossier that
 * names who has been deleting the archive from inside.
 * The format of a chapter and of a mission is documented in `content/campaign.js`.
 */

import { bi } from '../core/localize.js';
import { fillerRows, shuffleIntoLog } from './world/noise.js';

/* Harbour payments: one supplier spelled in many ways, with amounts sometimes missing. */
const naviera = [
  ['Naviera Vent S.A.', 4200, null], ['Naviera Vent S.A.', 3900, null], ['Naviera Vent S.A.', null, 4100],
  [' naviera vent s.a.', 5100, null], [' naviera vent s.a.', 4700, null],
  ['NAVIERA VENT SA', 6200, null], ['NAVIERA VENT SA', null, 5800],
  ['Naviera  Vent SA', 3300, null],
];
const payments = shuffleIntoLog(
  [
    ...naviera.map(([payee, amount, estimate]) => ({ payee, amount, estimate, paid_on: '1987-10-05' })),
    { payee: 'Ventanas Ruiz', amount: 740, estimate: null, paid_on: '1987-09-12' },
    { payee: 'Ventura Hermanos', amount: 1180, estimate: null, paid_on: '1987-10-19' },
    ...fillerRows(401, 30, (random) => ({
      payee: random.pick(['Lonja Municipal', 'Astilleros Cal', 'Trans Otero', 'Portes Lagos', 'Correos']),
      amount: random.int(20, 90) * 10,
      estimate: null,
      paid_on: `1987-${random.pick(['09', '10', '11'])}-${String(random.int(1, 28)).padStart(2, '0')}`,
    })),
  ],
  'paid_on',
);
const naviera_total = naviera.reduce((total, [, amount, estimate]) => total + (amount ?? estimate), 0);

/* Hidden tables of the burned index. Their names give nothing away, on purpose. */
const sessionDates = ['1987-09-22', '1987-10-13', '1987-10-27', '1987-11-10', '1987-11-17'];

/** Each file disappears on the Tuesday after its fire, so that nobody has time to read it. */
const deletedOn = { 1014: sessionDates[0], 1015: sessionDates[0], 1027: sessionDates[1], 1039: sessionDates[2], 1040: sessionDates[2], 1041: sessionDates[2], 1052: sessionDates[3] };
const zCustody = [
  ...Object.entries(deletedOn).map(([record_ref, deleted_on], index) => ({
    record_ref,
    deleted_by: 'OP-31',
    deleted_on,
    box: `B${index + 3}`,
  })),
  { record_ref: '0998', deleted_by: 'OP-07', deleted_on: '1986-11-02', box: 'B1' },
];

/* The case files: consecutive numbers, except for seven holes. */
const missingFiles = {
  1014: bi('Warehouse fire, Calle del Cordel: fire report', 'Incendio de almacén, Calle del Cordel: parte de bomberos'),
  1015: bi('Calle del Cordel: statement by witness', 'Calle del Cordel: declaración de testigo'),
  1027: bi('Warehouse fire, Plaza de la Sal: fire report', 'Incendio de almacén, Plaza de la Sal: parte de bomberos'),
  1039: bi('Warehouse fire, Paseo de la Red: fire report', 'Incendio de almacén, Paseo de la Red: parte de bomberos'),
  1040: bi('Paseo de la Red: arson analysis', 'Paseo de la Red: análisis de incendio provocado'),
  1041: bi('Paseo de la Red: anonymous complaint', 'Paseo de la Red: denuncia anónima'),
  1052: bi('Warehouse fire, Calle del Faro Viejo: death of a watchman', 'Incendio de almacén, Calle del Faro Viejo: muerte de un vigilante'),
};
const routineTitles = [bi('Stolen bicycle', 'Bicicleta robada'), bi('Noise complaint', 'Denuncia por ruido'), bi('Fishing licence dispute', 'Disputa por licencia de pesca'), bi('Lost wallet', 'Cartera perdida'), bi('Brawl at the union hall', 'Pelea en la sede del sindicato')];
const fileIds = Array.from({ length: 60 }, (_, index) => 1001 + index);
const routineTitle = (id) => routineTitles[id % routineTitles.length];
const openedOn = (id) => `1987-${String(1 + Math.floor((id - 1001) / 6)).padStart(2, '0')}-${String(1 + ((id - 1001) % 6) * 4).padStart(2, '0')}`;
const caseFiles = fileIds.filter((id) => !(id in missingFiles)).map((id) => ({ id, opened_on: openedOn(id), title: routineTitle(id) }));
const tapeIndex = fileIds.map((id) => ({ record_id: id, title: missingFiles[id] ?? routineTitle(id), tape: `T${1 + Math.floor((id - 1001) / 20)}` }));
const expectedMissing = Object.entries(missingFiles).map(([id, title]) => ({ record_id: Number(id), title }));

/* Audit trail. Record 1005 was deleted and restored: only its last action counts. */
const auditEvidence = [];
for (const id of Object.keys(missingFiles).map(Number)) {
  auditEvidence.push({ record_id: id, operator: 'OP-12', action: 'CREATE', logged_at: `${deletedOn[id]} 08:30` });
  auditEvidence.push({ record_id: id, operator: 'OP-18', action: 'EDIT', logged_at: `${deletedOn[id]} 12:15` });
  auditEvidence.push({ record_id: id, operator: 'OP-31', action: 'DELETE', logged_at: `${deletedOn[id]} 22:05` });
}
auditEvidence.push(
  { record_id: 1005, operator: 'OP-12', action: 'CREATE', logged_at: '1987-02-05 10:00' },
  { record_id: 1005, operator: 'OP-18', action: 'DELETE', logged_at: '1987-06-01 09:30' },
  { record_id: 1005, operator: 'OP-12', action: 'RESTORE', logged_at: '1987-06-01 09:45' },
);
const auditFiller = fileIds
  .filter((id) => !(id in missingFiles) && id !== 1005)
  .flatMap((id) => [
    { record_id: id, operator: 'OP-12', action: 'CREATE', logged_at: `1987-02-${String(1 + (id % 27)).padStart(2, '0')} 10:00` },
    { record_id: id, operator: id % 2 ? 'OP-18' : 'OP-22', action: 'EDIT', logged_at: `1987-04-${String(1 + (id % 27)).padStart(2, '0')} 11:30` },
  ]);
const auditLog = shuffleIntoLog([...auditEvidence, ...auditFiller], 'logged_at');

/* Who was in Basement Two during each night session of OP-31. */
const ghostSessions = sessionDates.map((date) => ({ operator: 'OP-31', terminal: 'B2-3', login_at: `${date} 21:40`, logout_at: `${date} 22:20` }));

/* Ordinary daytime work on the same days, so that the sessions of OP-31 must be filtered. */
const daytimeSessions = sessionDates.flatMap((date) => [
  { operator: 'OP-12', terminal: 'B2-1', login_at: `${date} 09:05`, logout_at: `${date} 13:30` },
  { operator: 'OP-22', terminal: 'B2-2', login_at: `${date} 10:15`, logout_at: `${date} 17:40` },
]);
const sessions = shuffleIntoLog([...ghostSessions, ...daytimeSessions], 'login_at');
const presentAt = {
  'Teo Ferrán': [1, 2, 3, 4, 5],
  'Marta Quiroga': [1, 2, 3, 4],
  'Iris Vega': [1, 3, 5],
  'Leo Martín': [2, 4],
  'Nora Vidal': [3],
};
const buildingLog = shuffleIntoLog(
  [
    ...Object.entries(presentAt).flatMap(([name, indexes]) =>
      indexes.map((index) => ({ name, zone: 'Basement Two', entered_at: `${sessionDates[index - 1]} 20:30`, left_at: `${sessionDates[index - 1]} 23:15` })),
    ),
    // She was there that day, but left long before the session began.
    { name: 'Marta Quiroga', zone: 'Basement Two', entered_at: '1987-11-17 18:00', left_at: '1987-11-17 20:10' },
    { name: 'Ricardo Salas', zone: 'Floor Five', entered_at: '1987-11-17 20:00', left_at: '1987-11-17 23:30' },
    { name: 'Ricardo Salas', zone: 'Floor Five', entered_at: '1987-10-13 20:00', left_at: '1987-10-13 23:30' },
  ],
  'entered_at',
);

export const chapter4 = {
  id: 4,
  title: bi('Altered Records', 'Registros alterados'),
  subtitle: bi('The table never lies, she wrote. But someone has been editing the table.', 'La tabla nunca miente, escribió. Pero alguien está editando la tabla.'),
  prologue: {
    signal: bi('BASEMENT TWO · NOVEMBER 1987 · 03:15', 'SÓTANO DOS · NOVIEMBRE DE 1987 · 03:15'),
    title: bi('The crime scene is the machine', 'La escena del crimen es la máquina'),
    paragraphs: bi(
      [
        'For weeks you have been trusting ATLAS the way people trust a notary. Now you have a strip of film with case numbers that ATLAS swears never existed, and you go back through your own queries with the feeling that someone has been laughing at you.',
        'Everything you have looked at might have been altered before you saw it. There were files on the fires, the witnesses and the arson analysis, and now they are gone, with nothing to show at first sight that they ever existed. To do that you need a password, a key to the building and a lot of patience.',
        'There are six people with access to Basement Two. You have been drinking coffee with them for weeks. You start bringing your own thermos, and you stop saying what you are working on out loud.',
      ],
      [
        'Llevas semanas fiándote de ATLAS como quien se fía de un notario. Ahora tienes una tira de película con números de expediente que ATLAS jura que nunca existieron, y repasas tus propias consultas con la sensación de que alguien se ha estado riendo de ti.',
        'Todo lo que has consultado puede haberse alterado antes de que lo vieras. Había expedientes sobre los incendios, los testigos y los análisis, y ya no están, sin que a simple vista se note que existieron. Para eso hacen falta una contraseña, una llave del edificio y mucha paciencia.',
        'Hay seis personas con acceso al Sótano Dos. Llevas semanas tomando café con ellas. Empiezas a traer tu propio termo y dejas de decir en voz alta en qué estás trabajando.',
      ],
    ),
    speaker: bi('NOTE UNDER THE KEYBOARD · I.B.', 'NOTA BAJO EL TECLADO · I.B.'),
    quote: bi('“Do not look for what is in the table. Look for what should be there and is not.”', '"No busques lo que hay en la tabla. Busca lo que debería estar y no está."'),
    action: bi('Stop trusting the archive', 'Dejar de fiarte del archivo'),
  },
  missions: [
    {
      id: 'dirty-ledger',
      rating: 3,
      concepts: ['TRIM', 'UPPER', 'REPLACE', 'COALESCE'],
      title: bi('Four ways to write one name', 'Cuatro formas de escribir un nombre'),
      location: bi('Harbour Accounts Office · 11:20', 'Contabilidad del Puerto · 11:20'),
      scene: bi(
        [
          'The Harbour Commission has handed over its supplier ledger with a smile, because anyone looking for payments to Naviera Vent will find only a handful. The clerks were not told to hide anything. They were only told, over a number of years, not to worry too much about how they typed things.',
          'Real data is dirty, and sometimes dirty on purpose. Extra spaces, lowercase, dots here and not there, and a supplier, Ventanas Ruiz, that sells windows and has nothing to do with this. A few payments do not even have an amount: only an estimate in another column. Before you can add anything up you will have to clean it.',
        ],
        [
          'La Comisión del Puerto ha entregado su libro de proveedores con una sonrisa, porque quien busque pagos a Naviera Vent solo encontrará un puñado. A los administrativos no les dijeron que escondieran nada. Solo les dijeron, a lo largo de años, que no se preocuparan mucho de cómo tecleaban las cosas.',
          'Los datos reales están sucios, y a veces sucios a propósito. Espacios de más, minúsculas, puntos aquí sí y allí no, y un proveedor, Ventanas Ruiz, que vende ventanas y no tiene nada que ver. Algunos pagos ni siquiera tienen importe: solo una estimación en otra columna. Antes de sumar nada tendrás que limpiarlo.',
        ],
      ),
      tables: { payments },
      stages: [
        {
          title: bi('How many spellings?', '¿Cuántas grafías?'),
          briefing: bi('Count the different ways of writing the shipping company, searching for payees containing “naviera”. Return the count as spellings.', 'Cuenta las distintas formas de escribir la naviera, buscando los payee que contienen "naviera". Devuelve el recuento como spellings.'),
          expected: [{ spellings: 4 }],
          hints: [bi("COUNT(DISTINCT payee) counts different values. In SQLite, LIKE ignores case: LIKE '%naviera%'.", "COUNT(DISTINCT payee) cuenta valores distintos. En SQLite, LIKE no distingue mayúsculas: LIKE '%naviera%'.")],
          clue: bi('The same company appears written in four ways, so an exact search will never find them all.', 'La misma empresa aparece escrita de cuatro formas, y una búsqueda exacta nunca las encontrará todas.'),
        },
        {
          title: bi('One name', 'Un solo nombre'),
          briefing: bi('Clean the name: remove the dots, turn double spaces into one, trim the ends and put it in capitals. Return that value as clean and the count as payments, grouped.', 'Limpia el nombre: quita los puntos, convierte los espacios dobles en uno, recorta los extremos y pásalo a mayúsculas. Devuelve ese valor como clean y el recuento como payments, agrupados.'),
          expected: [{ clean: 'NAVIERA VENT SA', payments: 8 }],
          hints: [bi("Functions can be nested: UPPER(TRIM(REPLACE(REPLACE(payee, '.', ''), '  ', ' '))).", "Las funciones se pueden anidar: UPPER(TRIM(REPLACE(REPLACE(payee, '.', ''), '  ', ' ')))."), bi('Keep the WHERE on “naviera” so that the other suppliers stay out.', 'Conserva el WHERE con "naviera" para dejar fuera a los demás proveedores.')],
          clue: bi('Once cleaned, there are eight payments to a single company: NAVIERA VENT SA.', 'Una vez limpios, son ocho pagos a una sola empresa: NAVIERA VENT SA.'),
        },
        {
          title: bi('The real total', 'El total real'),
          briefing: bi('Add up the eight payments. If amount is missing, use estimate instead. Return it as total.', 'Suma los ocho pagos. Si amount no existe, usa estimate en su lugar. Devuélvelo como total.'),
          expected: [{ total: naviera_total }],
          hints: [bi('COALESCE(amount, estimate) returns the first value that is not NULL. SUM on its own would ignore the missing amounts.', 'COALESCE(amount, estimate) devuelve el primer valor que no es NULL. SUM a secas ignoraría los importes ausentes.')],
          clue: bi(`The Commission paid Naviera Vent ${naviera_total.toLocaleString('en-GB')}: nearly three times what its report admits.`, `La Comisión pagó a Naviera Vent ${naviera_total.toLocaleString('es-ES')}: casi el triple de lo que admite su memoria.`),
        },
      ],
      closing: bi(
        [
          'Quiroga takes the total up to the Commissioner’s office and comes back with something else. “The Commissioner is thrilled with your initiative,” she says. “He wants a list of everything you have consulted this month, for reasons of efficiency.” She drops a piece of paper on your desk. It is a blank log. “Fill it in. Make it boring.”',
          'As she leaves she stops next to the mug of Inés Bosch. “She was the best we ever had down here, and she got too close to something, and one Friday she was just gone, with a transfer order and everything. I signed for her desk. I have thought about that every day since.” Then she leaves, without waiting to see how you take it.',
        ],
        [
          'Quiroga sube el total al despacho del Comisario y vuelve con otra cosa. "El Comisario está encantado con tu iniciativa", dice. "Quiere una lista de todo lo que has consultado este mes, por razones de eficiencia." Deja un papel en tu mesa. Es un registro en blanco. "Rellénalo. Que sea aburrido."',
          'Al marcharse se para junto a la taza de Inés Bosch. "Fue la mejor que hemos tenido aquí abajo, y se acercó demasiado a algo, y un viernes ya no estaba, con su orden de traslado y todo. Firmé yo la entrega de su mesa. Desde entonces lo pienso todos los días." Y se va sin esperar a ver cómo te lo tomas.',
        ],
      ),
    },
    {
      id: 'burned-index',
      rating: 4,
      hideSchema: true,
      concepts: ['sqlite_master'],
      title: bi('The burned index', 'El índice quemado'),
      location: bi('Basement Two, Backup Partition · 01:40', 'Sótano Dos, partición de copias · 01:40'),
      scene: bi(
        [
          'Elia’s film gives you the name of a backup partition that does not appear in any manual. You connect at one in the morning, with the lights off and your thermos on the desk. ATLAS accepts the connection, and then it shows you nothing at all. The catalogue of this partition has been wiped: no list of tables, no columns, not even .tables will answer.',
          'Whoever wiped it does not know databases as well as they think. A catalogue can be hidden from a menu, but a database has to know what it contains in order to work, and SQLite keeps that knowledge in a table of its own, called sqlite_master. It is always there, and nobody thinks of touching it.',
        ],
        [
          'La película de Elia te da el nombre de una partición de copias de seguridad que no aparece en ningún manual. Te conectas a la una de la mañana, con las luces apagadas y el termo en la mesa. ATLAS acepta la conexión y después no te enseña absolutamente nada. Han borrado el catálogo de esta partición: ni lista de tablas, ni columnas, ni siquiera .tables contesta.',
          'Quien lo borró no conoce las bases de datos tanto como cree. Un catálogo se puede esconder de los menús, pero una base de datos necesita saber qué contiene para funcionar, y SQLite guarda eso en una tabla propia, llamada sqlite_master. Siempre está ahí, y a nadie se le ocurre tocarla.',
        ],
      ),
      tables: {
        k7_shadow: fillerRows(402, 20, (random, index) => ({ ref: `K7-${100 + index}`, amount: random.int(10, 90) * 100 })),
        tmp_0419: fillerRows(403, 12, (random) => ({ a: random.int(1, 9), b: random.int(1, 9) })),
        z_custody: zCustody,
      },
      stages: [
        {
          title: bi('Ask the database about itself', 'Pregúntale a la base de datos qué contiene'),
          briefing: bi('Return the name of every table in the partition, in alphabetical order, from sqlite_master.', 'Devuelve el name de cada tabla de la partición, en orden alfabético, a partir de sqlite_master.'),
          ordered: true,
          expected: [{ name: 'k7_shadow' }, { name: 'tmp_0419' }, { name: 'z_custody' }],
          hints: [bi("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name;", "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name;")],
          clue: bi('The partition hides three tables with names designed to be overlooked.', 'La partición esconde tres tablas con nombres pensados para pasar inadvertidos.'),
        },
        {
          title: bi('Read the blueprints', 'Lee los planos'),
          briefing: bi('sqlite_master keeps in its sql column the statement that created each table. One table has a column called deleted_by. Return its name.', 'sqlite_master guarda en su columna sql la instrucción que creó cada tabla. Una de ellas tiene una columna llamada deleted_by. Devuelve su name.'),
          expected: [{ name: 'z_custody' }],
          hints: [bi("WHERE sql LIKE '%deleted_by%'", "WHERE sql LIKE '%deleted_by%'")],
          clue: bi('z_custody records who deleted what. Somebody could not resist keeping count.', 'z_custody registra quién borró qué. Alguien no pudo resistirse a llevar la cuenta.'),
        },
        {
          title: bi('Who has been deleting?', '¿Quién ha estado borrando?'),
          briefing: bi('Inspect z_custody. Return the operator with the most deletions, in deleted_by, and the count as records, in one row.', 'Examina z_custody. Devuelve el operador con más borrados, en deleted_by, y el recuento como records, en una fila.'),
          expected: [{ deleted_by: 'OP-31', records: 7 }],
          hints: [bi('Now that you know its name, it is a normal table: SELECT * FROM z_custody LIMIT 5.', 'Ahora que sabes su nombre, es una tabla normal: SELECT * FROM z_custody LIMIT 5.')],
          clue: bi('Operator OP-31 deleted seven case files, always on a Tuesday, days after each fire.', 'El operador OP-31 borró siete expedientes, siempre un martes, días después de cada incendio.'),
        },
      ],
      closing: bi(
        [
          'Seven records, one operator. In a building with one machine, a login is as good as a fingerprint. You print nothing, and write OP-31 on the inside of your wrist in ballpoint like a schoolchild.',
          'Each deletion has a box next to it: B3, B4, B5. So the paper was never destroyed. Someone took the trouble to delete the record from the machine, and to keep the original in a box. You sit with that for a while. Nobody who only wants to destroy evidence bothers to keep it.',
        ],
        [
          'Siete registros, un operador. En un edificio con una sola máquina, un inicio de sesión vale lo que una huella. No imprimes nada, y te escribes OP-31 con bolígrafo en la cara interna de la muñeca, como en el colegio.',
          'Cada borrado tiene al lado una caja: B3, B4, B5. Así que el papel nunca se destruyó. Alguien se tomó la molestia de borrar el registro de la máquina y conservar el original en una caja. Te quedas un rato pensándolo. Quien solo quiere destruir pruebas no se molesta en guardarlas.',
        ],
      ),
    },
    {
      id: 'missing-numbers',
      rating: 4,
      concepts: ['WINDOW', 'LAG', 'NOT IN'],
      title: bi('What should be there and is not', 'Lo que debería estar y no está'),
      location: bi('Records Bureau · 03:05', 'Archivo Central · 03:05'),
      scene: bi(
        [
          'Case numbers are assigned by ATLAS and never reused: 1001, 1002, 1003. A clean sequence is proof that nothing has been touched, which is why nobody has ever looked at it. Now you want to compare each row with the one before it, and a normal query cannot do that: each row only knows about itself.',
          'That is what window functions are for. They let a row look at its neighbours without merging them into a group. LAG gives you the previous value in whatever order you ask for. Where the gap between neighbours is bigger than one, somebody has deleted files.',
        ],
        [
          'ATLAS asigna los números de expediente y no los reutiliza nunca: 1001, 1002, 1003. Una secuencia limpia es la prueba de que nadie ha tocado nada, y por eso nadie la ha mirado jamás. Ahora quieres comparar cada fila con la anterior, y una consulta normal no puede: cada fila solo sabe de sí misma.',
          'Para eso están las funciones de ventana. Permiten que una fila mire a sus vecinas sin fundirse con ellas en un grupo. LAG te da el valor anterior en el orden que pidas. Donde el salto entre vecinas sea mayor que uno, alguien ha borrado expedientes.',
        ],
      ),
      tables: { case_files: caseFiles, tape_index: tapeIndex },
      stages: [
        {
          title: bi('Find the jumps', 'Encuentra los saltos'),
          briefing: bi('Return previous_id and next_id for each place in case_files where the numbering jumps by more than one.', 'Devuelve previous_id y next_id de cada punto de case_files donde la numeración salta más de uno.'),
          expected: [
            { previous_id: 1013, next_id: 1016 },
            { previous_id: 1026, next_id: 1028 },
            { previous_id: 1038, next_id: 1042 },
            { previous_id: 1051, next_id: 1053 },
          ],
          hints: [bi('LAG(id) OVER (ORDER BY id) gives the id of the previous row.', 'LAG(id) OVER (ORDER BY id) da el id de la fila anterior.'), bi('A window function cannot go in a WHERE. Calculate it in a CTE, then filter: WHERE next_id - previous_id > 1.', 'Una función de ventana no puede ir en un WHERE. Calcúlala en un CTE y filtra después: WHERE next_id - previous_id > 1.')],
          clue: bi('There are four holes in the sequence of case files.', 'Hay cuatro agujeros en la secuencia de expedientes.'),
        },
        {
          title: bi('How many are gone?', '¿Cuántos faltan?'),
          briefing: bi('Calculate how many case numbers have disappeared in total. Return it as missing.', 'Calcula cuántos números de expediente han desaparecido en total. Devuélvelo como missing.'),
          expected: [{ missing: 7 }],
          hints: [bi('From the previous step, each jump hides next_id - previous_id - 1 numbers. SUM them.', 'A partir del paso anterior, cada salto oculta next_id - previous_id - 1 números. Súmalos.')],
          clue: bi('Seven case files are missing: the same number as in z_custody.', 'Faltan siete expedientes: el mismo número que en z_custody.'),
        },
        {
          title: bi('Read the tape', 'Lee la cinta'),
          briefing: bi('The backup tape index still lists every title. Return record_id and title of the records of tape_index that are not in case_files, in order of number.', 'El índice de la cinta de copias aún lista todos los títulos. Devuelve record_id y title de los registros de tape_index que no están en case_files, por orden de número.'),
          ordered: true,
          expected: expectedMissing,
          hints: [bi('WHERE record_id NOT IN (SELECT id FROM case_files)', 'WHERE record_id NOT IN (SELECT id FROM case_files)')],
          clue: bi('All seven missing files are about the four fires, including the death of Bernat Ros.', 'Los siete expedientes desaparecidos son de los cuatro incendios, incluida la muerte de Bernat Ros.'),
        },
      ],
      closing: bi(
        [
          'Fire report, witness, arson analysis, anonymous complaint, the death of a watchman. There it is, everything the city was told had never happened, one title per line. You read the names of the streets. You have walked down them. On two of them there is already a fence with the logo of Proyecto Faro.',
          'You do not sleep. At eight you go upstairs and ask, in the most boring voice you can manage, who has the operator code OP-31. The clerk looks it up without curiosity, then frowns. “That is odd,” she says.',
        ],
        [
          'Parte de bomberos, testigo, análisis del incendio, denuncia anónima, la muerte de un vigilante. Ahí está todo lo que le dijeron a la ciudad que nunca había pasado, un título por línea. Lees los nombres de las calles. Has pasado por ellas. En dos ya hay una valla con el logo del Proyecto Faro.',
          'No duermes. A las ocho subes y preguntas, con la voz más aburrida que puedes, quién tiene el código de operador OP-31. La administrativa lo busca sin curiosidad y luego frunce el ceño. "Qué raro", dice.',
        ],
      ),
    },
    {
      id: 'audit-trail',
      rating: 4,
      concepts: ['ROW_NUMBER', 'PARTITION BY'],
      title: bi('The last hand on the file', 'La última mano sobre el expediente'),
      location: bi('Personnel Office · 08:30', 'Oficina de Personal · 08:30'),
      scene: bi(
        [
          'ATLAS has an audit log. It was installed by someone conscientious, and nobody who has used the system since has ever read it. It has a line for each action on each record: who created it, who edited it, who deleted it. And sometimes, who deleted it and thought better of it: record 1005 was removed by mistake last June and restored fifteen minutes later.',
          'So you cannot just search for DELETE. You need only the last action on each record, and that requires numbering the rows of each record separately, starting from the most recent. PARTITION BY groups like GROUP BY, but without merging the rows into one.',
        ],
        [
          'ATLAS tiene un registro de auditoría. Lo instaló alguien concienzudo, y nadie de los que han usado el sistema desde entonces lo ha leído jamás. Tiene una línea por cada acción sobre cada registro: quién lo creó, quién lo editó, quién lo borró. Y a veces, quién lo borró y se lo pensó mejor: el 1005 se eliminó por error el pasado junio y se restauró quince minutos después.',
          'Así que no basta con buscar DELETE. Necesitas solo la última acción de cada registro, y eso exige numerar las filas de cada registro por separado, empezando por la más reciente. PARTITION BY agrupa como GROUP BY, pero sin fundir las filas en una.',
        ],
      ),
      tables: {
        audit_log: auditLog,
        operator_registry: [
          { operator: 'OP-07', holder: 'Pere Costa', status: 'RETIRED', left_on: '1986-12-31' },
          { operator: 'OP-12', holder: 'Iris Vega', status: 'ACTIVE', left_on: null },
          { operator: 'OP-18', holder: 'Teo Ferrán', status: 'ACTIVE', left_on: null },
          { operator: 'OP-22', holder: 'Leo Martín', status: 'ACTIVE', left_on: null },
          { operator: 'OP-31', holder: 'Inés Bosch', status: 'TRANSFERRED', left_on: '1986-12-19' },
        ],
      },
      stages: [
        {
          title: bi('The last action on each record', 'La última acción de cada registro'),
          briefing: bi('Find the records whose very last action was DELETE. Return record_id and operator.', 'Encuentra los registros cuya última acción fue DELETE. Devuelve record_id y operator.'),
          expected: Object.keys(missingFiles).map((id) => ({ record_id: Number(id), operator: 'OP-31' })),
          hints: [bi('ROW_NUMBER() OVER (PARTITION BY record_id ORDER BY logged_at DESC) AS position gives 1 to the latest action of each record.', 'ROW_NUMBER() OVER (PARTITION BY record_id ORDER BY logged_at DESC) AS position da un 1 a la última acción de cada registro.'), bi("Calculate it in a CTE, and then filter with position = 1 AND action = 'DELETE'.", "Calcúlalo en un CTE y filtra después con position = 1 AND action = 'DELETE'.")],
          clue: bi('Seven records end in a deletion. Record 1005 does not: it was restored.', 'Siete registros terminan en un borrado. El 1005 no: lo restauraron.'),
        },
        {
          title: bi('One operator', 'Un operador'),
          briefing: bi('Count those final deletions per operator. Return operator and the count as deletions.', 'Cuenta esos borrados finales por operador. Devuelve operator y el recuento como deletions.'),
          expected: [{ operator: 'OP-31', deletions: 7 }],
          hints: [bi('The same CTE, ending with GROUP BY operator.', 'El mismo CTE, terminando con GROUP BY operator.')],
          clue: bi('All seven definitive deletions are by OP-31.', 'Los siete borrados definitivos son de OP-31.'),
        },
        {
          title: bi('Who holds the code?', '¿Quién tiene el código?'),
          briefing: bi('Look up OP-31. Return holder, status and left_on.', 'Busca OP-31. Devuelve holder, status y left_on.'),
          expected: [{ holder: 'Inés Bosch', status: 'TRANSFERRED', left_on: '1986-12-19' }],
          clue: bi('OP-31 belongs to Inés Bosch, who left on 19 December 1986. Her credentials deleted files in the autumn of 1987.', 'OP-31 es de Inés Bosch, que se fue el 19 de diciembre de 1986. Sus credenciales borraron expedientes en otoño de 1987.'),
        },
      ],
      closing: bi(
        [
          'You look at the screen for some time. The notes, the envelope, the handwriting: and now her code on every deletion. Has it been her all along? Is the person leaving you the notes the same one who deletes the evidence? It is possible. You have seen stranger things in this basement.',
          'But something does not add up: Inés Bosch left eleven months ago. A code can be used by anyone who knows the password, but someone had to type it here, in Basement Two, on five specific nights, in a building that logs who comes through the door. You do not know where Inés Bosch was on those nights. But you know how to find out who was here.',
        ],
        [
          'Miras la pantalla un buen rato. Las notas, el sobre, la letra: y ahora su código en cada borrado. ¿Ha sido ella todo este tiempo? ¿La persona que te deja las notas es la misma que borra las pruebas? Es posible. Cosas más raras se han visto en este sótano.',
          'Pero hay algo que no cuadra: Inés Bosch se fue hace once meses. Un código puede usarlo cualquiera que conozca la contraseña, pero alguien tuvo que teclearla aquí, en el Sótano Dos, cinco noches concretas, en un edificio que registra quién entra por la puerta. No sabes dónde estaba Inés Bosch esas noches. Pero sabes cómo averiguar quién estaba aquí.',
        ],
      ),
    },
    {
      id: 'inside-man',
      rating: 5,
      dossier: true,
      concepts: ['DOSSIER', 'JOIN ON RANGES', 'HAVING', 'SUBQUERY'],
      title: bi('Dossier: The hands on the keyboard', 'Expediente: Las manos sobre el teclado'),
      location: bi('Basement Two · The last night of November', 'Sótano Dos · La última noche de noviembre'),
      scene: bi(
        [
          'Five night sessions under the name of OP-31, on terminal B2-3, each of them at about ten at night. And a door log that records who entered Basement Two and who left. If someone was typing, someone was in the room. It is that simple, and nobody has ever checked, because the only person whose job it is to check these things is you. Before you, it was her.',
          'A person who is in the building one night means nothing. Quiroga herself was here on most of them. You need the one person who was there every single night, for the whole session. You are aware of who you are probably about to find. You make the query anyway. That is the job.',
        ],
        [
          'Cinco sesiones nocturnas a nombre de OP-31, en el terminal B2-3, todas hacia las diez de la noche. Y un registro de puerta que anota quién entró y quién salió del Sótano Dos. Si alguien tecleaba, alguien estaba en la sala. Es así de sencillo, y nunca lo ha comprobado nadie, porque la única persona cuyo trabajo es comprobar estas cosas eres tú. Antes que tú, era ella.',
          'Que alguien estuviera una noche en el edificio no significa nada. La propia Quiroga estuvo la mayoría. Necesitas a la única persona que estuvo todas y cada una de las noches, durante toda la sesión. Sabes a quién vas a encontrar, probablemente. Haces la consulta de todos modos. Ese es el trabajo.',
        ],
      ),
      tables: {
        terminal_sessions: sessions,
        building_log: buildingLog,
        terminal_assignments: [
          { terminal: 'B2-1', assigned_to: 'Iris Vega' },
          { terminal: 'B2-2', assigned_to: 'Leo Martín' },
          { terminal: 'B2-3', assigned_to: 'Teo Ferrán' },
          { terminal: 'B2-4', assigned_to: 'Inés Bosch' },
        ],
      },
      stages: [
        {
          title: bi('The sessions of the ghost', 'Las sesiones del fantasma'),
          briefing: bi('Return login_at and logout_at of the sessions of OP-31, in chronological order.', 'Devuelve login_at y logout_at de las sesiones de OP-31, por orden cronológico.'),
          ordered: true,
          expected: ghostSessions.map(({ login_at, logout_at }) => ({ login_at, logout_at })),
          clue: bi('OP-31 logged in on five Tuesday nights, for forty minutes each time.', 'OP-31 entró cinco martes por la noche, cuarenta minutos cada vez.'),
        },
        {
          title: bi('One night, one room', 'Una noche, una sala'),
          briefing: bi('Take the last session, the one on 1987-11-17. Who was in Basement Two during the whole of it? Return name. Careful: being in the log that day is not the same as being there at that time.', 'Coge la última sesión, la del 1987-11-17. ¿Quién estuvo en Basement Two durante toda ella? Devuelve name. Cuidado: aparecer ese día no es lo mismo que estar a esa hora.'),
          expected: [{ name: 'Teo Ferrán' }, { name: 'Iris Vega' }],
          clue: bi('On 17 November, only two people were present: Teo Ferrán and Iris Vega. Quiroga had left at 20:10.', 'El 17 de noviembre solo había dos personas: Teo Ferrán e Iris Vega. Quiroga se había ido a las 20:10.'),
        },
        {
          title: bi('Every single night', 'Todas y cada una de las noches'),
          briefing: bi('Repeat it for all five sessions. Return name and the number of sessions covered as nights, only for whoever was present at all of them.', 'Repítelo con las cinco sesiones. Devuelve name y el número de sesiones cubiertas como nights, solo de quien estuvo en todas.'),
          expected: [{ name: 'Teo Ferrán', nights: 5 }],
          clue: bi('Only one person was in Basement Two for all five sessions: Teo Ferrán.', 'Solo una persona estuvo en el Sótano Dos durante las cinco sesiones: Teo Ferrán.'),
        },
        {
          title: bi('The machine', 'La máquina'),
          briefing: bi('Inés Bosch had her own terminal. Who was terminal B2-3 assigned to? Return assigned_to.', 'Inés Bosch tenía su propio terminal. ¿A quién estaba asignado el B2-3? Devuelve assigned_to.'),
          expected: [{ assigned_to: 'Teo Ferrán' }],
          clue: bi('The code was hers. The terminal, and the hands, were his.', 'El código era de ella. El terminal, y las manos, eran de él.'),
        },
      ],
      accusation: {
        intro: bi('Put a name on the page, even if you hoped it would be a different one.', 'Pon un nombre en la hoja, aunque habrías preferido que saliera otro.'),
        fields: [{ key: 'insider', label: bi('Who has been deleting the archive?', '¿Quién ha estado borrando el archivo?'), options: ['Inés Bosch', 'Iris Vega', 'Leo Martín', 'Marta Quiroga', 'Ricardo Salas', 'Teo Ferrán'] }],
        answer: { insider: 'Teo Ferrán' },
      },
      closing: bi(
        [
          'You do not take it to Quiroga, not yet. You wait until the basement is empty and you sit down across from Teo, in the chair he pushed towards you with his bad leg in your first week. He looks at the paper for a while. He takes off his glasses. Without them he looks very old.',
          '“My wife’s treatment was at Vent’s clinic,” he says. “Then one day I was told how it would continue being paid for. I only had to delete a few records, on certain Tuesdays. You would be surprised how quickly a man gets used to it.” He rubs his eyes. “Inés found out, of course. She was better than all of us. They wanted her in the harbour, and the only thing I have done in thirty-one years that was worth anything was to forge a transfer order and put her on a boat before they got to her. I signed it with her own code. And I have used that code ever since, because nobody can ask questions of a woman who is no longer here.”',
          '“I kept the paper. Every page they told me to destroy. Boxes B1 to B9. She wrote those notes before she left, for whoever came next, and I was the one who put them in your way, kid. I needed somebody who could get this far.” He opens his drawer and puts something on the table between you. Brass. Stamped A-12. “I took it the day you arrived. It opens the cabinet where the tape is, and I am too much of a coward to use it. She is still broadcasting from the coast, on the old frequencies. Go on. Ask the machine.”',
        ],
        [
          'No se lo llevas a Quiroga, todavía no. Esperas a que el sótano esté vacío y te sientas frente a Teo, en la silla que empujó hacia ti con la pierna mala en tu primera semana. Mira el papel un rato. Se quita las gafas. Sin ellas parece muy viejo.',
          '"El tratamiento de mi mujer era en la clínica de Vent", dice. "Un día me explicaron cómo iba a seguir pagándose. Bastaba con borrar unos pocos registros, ciertos martes. Te sorprendería lo rápido que se acostumbra uno." Se frota los ojos. "Inés se dio cuenta, claro. Era mejor que todos nosotros. La querían en el fondo del puerto, y lo único que he hecho en treinta y un años que haya valido algo fue falsificar una orden de traslado y subir a Inés a un barco antes de que la encontraran. La firmé con su propio código. Y desde entonces borro con él, porque a una mujer que ya no está nadie puede preguntarle nada."',
          '"Guardé el papel. Cada hoja que me dijeron que destruyera. Cajas de la B1 a la B9. Esas notas las escribió ella antes de irse, para quien viniera después, y fui yo quien las puso en tu camino. Necesitaba a alguien capaz de llegar hasta aquí." Abre el cajón y deja algo sobre la mesa, entre los dos. Latón. Con A-12 grabado. "La cogí el día que llegaste. Abre el armario donde está la cinta. Yo soy demasiado cobarde para usarla. Ella sigue emitiendo desde la costa, en las frecuencias viejas. Venga. Pregúntale a la máquina."',
        ],
      ),
    },
  ],
};
