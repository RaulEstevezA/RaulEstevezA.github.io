/**
 * Chapter 3, "The Glass Gallery": the investigation reaches high society. Teaches CASE,
 * self joins, CTEs, date arithmetic and set operations (EXCEPT, UNION), and ends with
 * a dossier that turns a thief into the key witness.
 * The format of a chapter and of a mission is documented in `content/campaign.js`.
 */

import { bi } from '../core/localize.js';
import { fillerRows } from './world/noise.js';

/* Withdrawals: filler is local and small, so that it can never beat the real accounts. */
const withdrawalFiller = fillerRows(301, 36, (random) => ({
  account: random.pick(['A-2', 'B-7', 'C-3', 'D-9', 'E-5', 'F-1']),
  country: 'ES',
  amount: random.int(2, 9) * 10,
}));
const withdrawalEvidence = [
  { account: 'K-1', country: 'ES', amount: 300 },
  { account: 'K-1', country: 'PT', amount: 150 },
  { account: 'K-1', country: 'CH', amount: 400 },
  { account: 'M-8', country: 'ES', amount: 500 },
  { account: 'M-8', country: 'ES', amount: 180 },
  { account: 'Z-4', country: 'FR', amount: 280 },
  { account: 'Z-4', country: 'ES', amount: 100 },
];
const withdrawals = [...withdrawalFiller, ...withdrawalEvidence].map((row, index) => ({ id: index + 1, ...row }));
const foreignWithdrawals = withdrawals.filter((row) => row.country !== 'ES').length;

/* Gallery staff: Aina Puig, in Security, is the one who calls across departments. */
const galleryStaff = [
  { id: 1, name: 'Oriol Vent', department: 'Board', manager_id: null },
  { id: 2, name: 'Clara Ferrer', department: 'Board', manager_id: 1 },
  { id: 3, name: 'Aina Puig', department: 'Security', manager_id: 2 },
  { id: 4, name: 'Dani Prat', department: 'Security', manager_id: 3 },
  { id: 5, name: 'Sol Riba', department: 'Security', manager_id: 3 },
  { id: 6, name: 'Biel Roig', department: 'Conservation', manager_id: 2 },
  { id: 7, name: 'Cora Blai', department: 'Conservation', manager_id: 6 },
  { id: 8, name: 'Gina Lull', department: 'Events', manager_id: 2 },
  { id: 9, name: 'Eric Moll', department: 'Events', manager_id: 8 },
];
const galleryCalls = [
  { id: 62, caller_id: 7, receiver_id: 6, called_on: '1987-11-09', called_at: '11:20', seconds: 310 },
  { id: 63, caller_id: 4, receiver_id: 3, called_on: '1987-11-09', called_at: '13:05', seconds: 95 },
  { id: 64, caller_id: 9, receiver_id: 8, called_on: '1987-11-10', called_at: '10:12', seconds: 240 },
  { id: 65, caller_id: 2, receiver_id: 1, called_on: '1987-11-10', called_at: '18:40', seconds: 610 },
  { id: 66, caller_id: 5, receiver_id: 3, called_on: '1987-11-11', called_at: '09:15', seconds: 75 },
  { id: 67, caller_id: 8, receiver_id: 2, called_on: '1987-11-11', called_at: '16:30', seconds: 188 },
  { id: 68, caller_id: 3, receiver_id: 4, called_on: '1987-11-12', called_at: '18:02', seconds: 40 },
  { id: 69, caller_id: 7, receiver_id: 6, called_on: '1987-11-12', called_at: '19:10', seconds: 66 },
  { id: 70, caller_id: 3, receiver_id: 6, called_on: '1987-11-12', called_at: '19:32', seconds: 28 },
  { id: 71, caller_id: 9, receiver_id: 8, called_on: '1987-11-12', called_at: '20:00', seconds: 52 },
];

/* The gallery catalogue, its insurance policy and the differences between both. */
const artworks = [
  ['GG-001', 'Harbour at Dusk'], ['GG-002', 'Salt Merchants'], ['GG-003', 'The Rope Walk'],
  ['GG-004', 'Lighthouse, North Face'], ['GG-005', 'Portrait of a Pilot'], ['GG-006', 'The Drowned Bell'],
  ['GG-007', 'Fish Market, Morning'], ['GG-008', 'Two Tugs'], ['GG-009', 'Quay Number Six'],
  ['GG-010', 'The Customs Clerk'], ['GG-011', 'Study of Rain'], ['GG-012', 'Old Quarter Roofs'],
  ['GG-013', 'Night Crane'], ['GG-014', 'Chart Room'],
];
const catalogue = artworks.map(([code, title]) => ({ code, title }));
const ghostPieces = [
  { code: 'GG-901', title: 'Crystal Miniature of the Port', insured_value: 220000 },
  { code: 'GG-902', title: 'The Vent Altarpiece', insured_value: 180000 },
  { code: 'GG-903', title: 'Harbour Commission Silver', insured_value: 150000 },
];
const insuredItems = [
  ...artworks
    .filter(([code]) => !['GG-011', 'GG-014'].includes(code))
    .map(([code, title], index) => ({ code, title, insured_value: 12000 + index * 1500 })),
  ...ghostPieces,
];

export const chapter3 = {
  id: 3,
  title: bi('The Glass Gallery', 'La Galería de Cristal'),
  subtitle: bi('The people who burn warehouses do not smell of smoke. They smell of very good cologne.', 'La gente que quema almacenes no huele a humo. Huele a muy buena colonia.'),
  prologue: {
    signal: bi('VENT FOUNDATION · 12 NOVEMBER 1987 · INVITATION ONLY', 'FUNDACIÓN VENT · 12 DE NOVIEMBRE DE 1987 · SOLO CON INVITACIÓN'),
    title: bi('A party for the people who own the city', 'Una fiesta para los dueños de la ciudad'),
    paragraphs: bi(
      [
        'The Glass Gallery stands on the only hill in Puerto Ceniza: a greenhouse of steel and crystal built by the first Vent with the profits of the first shipping fraud anyone remembers. Once a year the family opens it for a charity gala. Everyone is there: the Mayor, the Commissioner, the judges, the bishop, and the bankers who lend to all of them.',
        'You will not be there. People from the basement do not get invited, and Quiroga has made it clear that she would rather have you bored than dead. But a gala produces bookings, invoices, insurance policies, taxis, phone calls and coat-check tickets, and all of it, sooner or later, ends up on a tape.',
        'From down here, in the records, you can see all those people much better than from the dance floor. You are beginning to enjoy this work, and that worries you.',
      ],
      [
        'La Galería de Cristal se alza en la única colina de Puerto Ceniza: un invernadero de acero y cristal construido por el primer Vent con los beneficios del primer fraude naviero del que se tiene memoria. Una vez al año la familia lo abre para una gala benéfica. Va todo el mundo: la alcaldesa, el Comisario, los jueces, el obispo y los banqueros que les prestan a todos.',
        'Tú no irás. A la gente del sótano no la invitan, y Quiroga ha dejado claro que te prefiere con vida, aunque te aburras. Pero una gala produce reservas, facturas, pólizas, taxis, llamadas y resguardos de guardarropa, y todo eso, tarde o temprano, acaba en una cinta.',
        'Desde aquí abajo, en los registros, se ve a toda esa gente mucho mejor que desde la pista de baile. Este trabajo empieza a gustarte, y eso te preocupa.',
      ],
    ),
    speaker: bi('TEO FERRÁN · ARCHIVIST', 'TEO FERRÁN · ARCHIVERO'),
    quote: bi('“I went to one of those galas, in ‘71. Carrying boxes. You know what rich people leave behind when they think nobody is looking? Paper. A lot of paper.”', '"Yo fui a una de esas galas, en el 71. Cargando cajas. ¿Sabes qué deja la gente rica cuando cree que nadie mira? Papeles. Muchos papeles."'),
    action: bi('Start looking', 'Empezar a buscar'),
  },
  missions: [
    {
      id: 'coded-risk',
      rating: 3,
      concepts: ['CASE', 'SUM'],
      title: bi('The money that travels', 'El dinero que viaja'),
      location: bi('Banco del Puerto, Fraud Desk · 13:00', 'Banco del Puerto, Sección de Fraude · 13:00'),
      scene: bi(
        [
          'Quiroga’s compliance officer has come back with a fresh tape, looking ten years older. In the weeks before the gala, someone has been withdrawing money in small amounts, some of it abroad. Under one of the bank’s own rules, written down but never applied, foreign withdrawals count double.',
          '“Do the arithmetic the bank did not want to do,” Quiroga says. A rule like this cannot be written with WHERE, because you do not want to discard the domestic withdrawals. You want each row to count differently. The answer belongs in the SELECT itself.',
        ],
        [
          'El jefe de control interno vuelve con una cinta nueva y cara de haber envejecido diez años. En las semanas previas a la gala, alguien ha ido retirando dinero en cantidades pequeñas, parte en el extranjero. Según una norma del propio banco, que está por escrito pero nunca se ha aplicado, las retiradas en el extranjero cuentan el doble.',
          '"Haz las cuentas que el banco no quiso hacer", dice Quiroga. Una regla así no se escribe con WHERE, porque no quieres descartar las retiradas nacionales. Quieres que cada fila cuente de forma distinta. La respuesta va en el propio SELECT.',
        ],
      ),
      tables: {
        withdrawals,
        account_holders: [
          { account: 'K-1', holder: 'Fundación Nereida' },
          { account: 'M-8', holder: 'Parish of Saint Elm' },
          { account: 'Z-4', holder: 'Consulate Services' },
        ],
      },
      stages: [
        {
          title: bi('Label each withdrawal', 'Etiqueta cada retirada'),
          briefing: bi("Domestic withdrawals have country 'ES'. Use CASE to create a column scope with the values 'domestic' or 'foreign', and return scope and the count as total for each one.", "Las retiradas nacionales tienen country 'ES'. Usa CASE para crear una columna scope con los valores 'domestic' o 'foreign', y devuelve scope y el recuento como total de cada uno."),
          expected: [{ scope: 'domestic', total: withdrawals.length - foreignWithdrawals }, { scope: 'foreign', total: foreignWithdrawals }],
          hints: [bi("CASE WHEN country = 'ES' THEN 'domestic' ELSE 'foreign' END AS scope", "CASE WHEN country = 'ES' THEN 'domestic' ELSE 'foreign' END AS scope"), bi('You can GROUP BY the alias: GROUP BY scope.', 'Se puede agrupar por el alias: GROUP BY scope.')],
          clue: bi(`Only ${foreignWithdrawals} withdrawals were made abroad, from just two accounts: K-1 and Z-4.`, `Solo ${foreignWithdrawals} retiradas se hicieron en el extranjero, desde solo dos cuentas: K-1 y Z-4.`),
        },
        {
          title: bi('The weighted total', 'El total ponderado'),
          briefing: bi('Calculate a risk for each account: domestic amounts count once, foreign amounts count twice. Return account and risk of the highest one, in one row.', 'Calcula el riesgo de cada cuenta: los importes nacionales cuentan una vez y los extranjeros, dos. Devuelve account y risk de la más alta, en una fila.'),
          expected: [{ account: 'K-1', risk: 1400 }],
          hints: [bi("CASE can go inside SUM: SUM(CASE WHEN country <> 'ES' THEN amount * 2 ELSE amount END).", "CASE puede ir dentro de SUM: SUM(CASE WHEN country <> 'ES' THEN amount * 2 ELSE amount END).")],
          clue: bi('Account K-1 has the highest risk: 1,400.', 'La cuenta K-1 tiene el riesgo más alto: 1.400.'),
        },
        {
          title: bi('A very charitable name', 'Un nombre muy benéfico'),
          briefing: bi('Return the holder of account K-1.', 'Devuelve el holder de la cuenta K-1.'),
          expected: [{ holder: 'Fundación Nereida' }],
          clue: bi('K-1 belongs to Fundación Nereida, a charity nobody has heard of.', 'K-1 es de la Fundación Nereida, una entidad benéfica de la que nadie ha oído hablar.'),
        },
      ],
      closing: bi(
        [
          'Fundación Nereida has a registered address at a notary’s office, an annual report of one page, and no visible charitable activity apart from withdrawing money in Geneva and Lisbon. You note the name down and keep going. It does not seem important yet.',
          'That night you find someone has been through your desk. Nothing is missing, and everything has been put back very nearly in its place. Inés Bosch’s mug has been rotated a quarter turn, with the handle now on the left. You put it back as it was. You tell nobody. And then you realise that you no longer trust anyone.',
        ],
        [
          'La Fundación Nereida tiene domicilio en una notaría, una memoria anual de una página y ninguna actividad benéfica visible aparte de retirar dinero en Ginebra y Lisboa. Apuntas el nombre y sigues. Aún no parece importante.',
          'Esa noche descubres que alguien ha estado en tu mesa. No falta nada y todo está casi exactamente en su sitio. La taza de Inés Bosch ha girado un cuarto de vuelta y ahora tiene el asa a la izquierda. La vuelves a dejar como estaba. No se lo cuentas a nadie. Y entonces te das cuenta de que ya no te fías de nadie.',
        ],
      ),
    },
    {
      id: 'inside-contact',
      rating: 3,
      concepts: ['SELF JOIN'],
      title: bi('The phone call that should not exist', 'La llamada que no debería existir'),
      location: bi('Glass Gallery · Gala night · 19:32', 'Galería de Cristal · Noche de gala · 19:32'),
      scene: bi(
        [
          'It is the night of the gala. At 19:32 the switchboard records a call of twenty-eight seconds inside the gallery. Staff telephones log everything because Oriol Vent has never trusted his staff, and he is about to be proved right. A contact at the telephone company passes the log to Quiroga, no questions asked.',
          'Both ends of a call point to the same table: staff. A row in calls has a caller_id and a receiver_id, and each needs a name. Each employee’s manager is also a number pointing to another row of that same table. You will have to join the table to itself, as if it were two different tables.',
        ],
        [
          'Es la noche de la gala. A las 19:32 la centralita registra una llamada de veintiocho segundos dentro de la galería. Los teléfonos del personal lo anotan todo, porque Oriol Vent nunca se ha fiado de su personal, y esta noche va a tener razón. Un contacto en la telefónica le pasa el registro a Quiroga, sin hacer preguntas.',
          'Los dos extremos de una llamada apuntan a la misma tabla: staff. Una fila de calls tiene caller_id y receiver_id, y cada uno necesita un nombre. Además, el jefe de cada empleado es un número que apunta a otra fila de esa misma tabla. Tendrás que unir la tabla consigo misma, como si fueran dos tablas distintas.',
        ],
      ),
      tables: { staff: galleryStaff, calls: galleryCalls },
      stages: [
        {
          title: bi('Who called whom', 'Quién llamó a quién'),
          briefing: bi('Return the two names of call 70, with the aliases caller and receiver.', 'Devuelve los dos nombres de la llamada 70, con los alias caller y receiver.'),
          expected: [{ caller: 'Aina Puig', receiver: 'Biel Roig' }],
          hints: [bi('Join staff twice, giving it a different alias each time: JOIN staff AS c ON calls.caller_id = c.id JOIN staff AS r ON calls.receiver_id = r.id.', 'Une staff dos veces, con un alias distinto cada vez: JOIN staff AS c ON calls.caller_id = c.id JOIN staff AS r ON calls.receiver_id = r.id.'), bi('Then select c.name AS caller, r.name AS receiver.', 'Después selecciona c.name AS caller, r.name AS receiver.')],
          clue: bi('At 19:32 Aina Puig called Biel Roig.', 'A las 19:32 Aina Puig llamó a Biel Roig.'),
        },
        {
          title: bi('Each person and their boss', 'Cada persona y su jefe'),
          briefing: bi('The same trick works with the hierarchy. For everyone in Security return employee and manager, with those aliases.', 'El mismo truco sirve con la jerarquía. De todo el personal de Security, devuelve employee y manager, con esos alias.'),
          expected: [
            { employee: 'Aina Puig', manager: 'Clara Ferrer' },
            { employee: 'Dani Prat', manager: 'Aina Puig' },
            { employee: 'Sol Riba', manager: 'Aina Puig' },
          ],
          hints: [bi('FROM staff AS e JOIN staff AS m ON e.manager_id = m.id. The WHERE looks at e.department.', 'FROM staff AS e JOIN staff AS m ON e.manager_id = m.id. El WHERE mira e.department.')],
          clue: bi('Aina Puig runs Security at the gallery and reports only to the board.', 'Aina Puig dirige la seguridad de la galería y solo responde ante la junta.'),
          reaction: bi('Quiroga: Head of Security phoning a picture restorer, on the only night of the year when she has better things to do. Find me out whether it was a habit.', 'Quiroga: La jefa de seguridad llamando a un restaurador, la única noche del año en la que tiene cosas mejores que hacer. Averíguame si era costumbre.'),
        },
        {
          title: bi('The call that crossed departments', 'La llamada que cruzó departamentos'),
          briefing: bi('Staff almost never phone other departments unless they are calling the board. List the calls of 1987-11-12 between people of different departments: return caller, receiver and called_at.', 'El personal casi nunca llama a otro departamento salvo a la junta. Enumera las llamadas del 1987-11-12 entre personas de departamentos distintos: devuelve caller, receiver y called_at.'),
          expected: [{ caller: 'Aina Puig', receiver: 'Biel Roig', called_at: '19:32' }],
          hints: [bi('Join staff twice as before, and compare both departments with <>.', 'Une staff dos veces como antes y compara ambos departamentos con <>.')],
          clue: bi('The only call across departments on gala night: Security to Conservation, 28 seconds, half an hour before the theft.', 'La única llamada entre departamentos en la noche de la gala: de Seguridad a Conservación, 28 segundos, media hora antes del robo.'),
        },
      ],
      closing: bi(
        [
          'At 20:04 the display case of the Crystal Miniature of the Port, the centrepiece of the evening, is found empty. Nobody heard anything. The Mayor went on with her speech. Oriol Vent smiled like a man who is thinking about something else.',
          'Biel Roig, the conservator, had been told by the Head of Security to disconnect the sensor on that case “for cleaning”. He thought it was a strange moment for it. But he has three children and a mortgage with Banco del Puerto, so he did it.',
        ],
        [
          'A las 20:04 aparece vacía la vitrina de la Miniatura de Cristal del Puerto, la pieza central de la velada. Nadie oyó nada. La alcaldesa siguió con su discurso. Oriol Vent sonreía como quien está pensando en otra cosa.',
          'A Biel Roig, el restaurador, la jefa de seguridad le había dicho que desconectara el sensor de esa vitrina "para limpiarla". Le pareció un momento raro. Pero tiene tres hijos y una hipoteca con el Banco del Puerto, así que lo hizo.',
        ],
      ),
    },
    {
      id: 'night-route',
      rating: 3,
      concepts: ['CTE', 'strftime'],
      title: bi('The last train from the capital', 'El último tren de la capital'),
      location: bi('Central Station · Gala night · 23:10', 'Estación Central · Noche de gala · 23:10'),
      scene: bi(
        [
          'After the theft a guest arrived whom nobody expected: someone who came all the way from the capital on the last train to examine an empty display case. The taxi drivers’ cooperative logs each pick-up, and the station logs each arrival. Crossing the two logs may turn up a name.',
          'This question has too many steps to write in one go. A WITH clause lets you give a name to an intermediate result and work from there, the way Teo fills in the easy words of a crossword first. Times are stored as text, but strftime can turn them into seconds, and seconds can be subtracted.',
        ],
        [
          'Después del robo llegó alguien a quien nadie esperaba: una persona que vino desde la capital en el último tren para examinar una vitrina vacía. La cooperativa de taxis anota cada recogida y la estación, cada llegada. Al cruzar los dos registros puede salir un nombre.',
          'Esta pregunta tiene demasiados pasos para escribirla de una vez. La cláusula WITH permite poner nombre a un resultado intermedio y seguir desde ahí, igual que Teo rellena primero las palabras fáciles del crucigrama. Las horas se guardan como texto, pero strftime las convierte en segundos, y los segundos se pueden restar.',
        ],
      ),
      tables: {
        passengers: [
          { id: 1, name: 'Eva Sanz' },
          { id: 2, name: 'Hugo Rey' },
          { id: 3, name: 'Noa Cid' },
          { id: 4, name: 'Pere Alsina' },
          { id: 5, name: 'Sol Riba' },
          { id: 6, name: 'Lupe Vera' },
        ],
        train_arrivals: [
          { passenger_id: 1, train: 'N7', arrived_at: '23:10' },
          { passenger_id: 2, train: 'N7', arrived_at: '23:10' },
          { passenger_id: 3, train: 'N7', arrived_at: '23:10' },
          { passenger_id: 4, train: 'N7', arrived_at: '23:10' },
          { passenger_id: 5, train: 'D2', arrived_at: '22:40' },
          { passenger_id: 6, train: 'D2', arrived_at: '22:40' },
        ],
        taxi_rides: [
          { passenger_id: 1, picked_up_at: '23:22', destination: 'Glass Gallery' },
          { passenger_id: 2, picked_up_at: '23:44', destination: 'Glass Gallery' },
          { passenger_id: 3, picked_up_at: '23:18', destination: 'North pier' },
          { passenger_id: 4, picked_up_at: '23:25', destination: 'Hotel Miramar' },
          { passenger_id: 5, picked_up_at: '23:00', destination: 'Glass Gallery' },
        ],
      },
      stages: [
        {
          title: bi('The wait of each passenger', 'La espera de cada pasajero'),
          briefing: bi('Using a CTE, calculate how many minutes passed between arrival and taxi for the passengers of train N7. Return name and minutes.', 'Usando un CTE, calcula cuántos minutos pasaron entre la llegada y el taxi para los pasajeros del tren N7. Devuelve name y minutes.'),
          expected: [
            { name: 'Eva Sanz', minutes: 12 },
            { name: 'Hugo Rey', minutes: 34 },
            { name: 'Noa Cid', minutes: 8 },
            { name: 'Pere Alsina', minutes: 15 },
          ],
          hints: [bi("strftime('%s', '23:22') gives seconds. Subtract the two and divide by 60.", "strftime('%s', '23:22') da segundos. Resta los dos y divide entre 60."), bi('WITH route AS (SELECT ... FROM train_arrivals JOIN taxi_rides ...) SELECT ... FROM route JOIN passengers ...', 'WITH route AS (SELECT ... FROM train_arrivals JOIN taxi_rides ...) SELECT ... FROM route JOIN passengers ...')],
          clue: bi('Four N7 passengers took a taxi. Waits: 8, 12, 15 and 34 minutes.', 'Cuatro pasajeros del N7 cogieron taxi. Esperas: 8, 12, 15 y 34 minutos.'),
        },
        {
          title: bi('Someone in a hurry', 'Alguien con prisa'),
          briefing: bi('Someone who knows where they are going does not wait. Find whoever took at most 20 minutes to get a taxi to Glass Gallery. Return name and minutes.', 'Quien sabe adónde va no espera. Busca a quien tardó como mucho 20 minutos en coger un taxi a Glass Gallery. Devuelve name y minutes.'),
          expected: [{ name: 'Eva Sanz', minutes: 12 }],
          hints: [bi('Hugo Rey waited too long and Sol Riba did not come on the N7. Add both filters to the final SELECT, keeping the destination in the CTE.', 'Hugo Rey esperó demasiado y Sol Riba no vino en el N7. Añade los dos filtros al SELECT final, conservando destination en el CTE.')],
          clue: bi('Eva Sanz went straight from the N7 to the Glass Gallery, in twelve minutes.', 'Eva Sanz fue directa del N7 a la Galería de Cristal, en doce minutos.'),
        },
      ],
      closing: bi(
        [
          'Eva Sanz is an art appraiser, one of the most respected in the country. Her signature is on the insurance valuation of the Crystal Miniature. An insurer usually sends somebody to look at a loss after a few weeks. She got here in four hours, carrying the claim forms already filled in, except for the date.',
          'Quiroga puts down the page. “She was already on the train when the case was emptied. You do not take the last train because something has been stolen. You take it because you know it is going to be.”',
        ],
        [
          'Eva Sanz es tasadora de arte, de las más respetadas del país. Su firma aparece en la valoración de seguro de la Miniatura de Cristal. Una aseguradora suele mandar a alguien a mirar un siniestro al cabo de unas semanas. Ella llegó en cuatro horas, con los formularios del parte ya rellenos, salvo la fecha.',
          'Quiroga deja la hoja. "Ya iba en el tren cuando vaciaron la vitrina. No se coge el último tren porque han robado algo. Se coge porque sabes que lo van a robar."',
        ],
      ),
    },
    {
      id: 'double-books',
      rating: 4,
      concepts: ['EXCEPT', 'UNION'],
      title: bi('Works that do not exist', 'Obras que no existen'),
      location: bi('Records Bureau · 02:30', 'Archivo Central · 02:30'),
      scene: bi(
        [
          'The crate from Pier 3 had the policy of the gallery inside. The public catalogue of the gallery is printed on heavy paper and sold in the shop. Between one list and the other there should be no difference. By now you know what that kind of sentence is worth in this city.',
          'A JOIN compares row by row. This calls for a different tool: take a whole list, subtract another whole list and see what is left. Teo has left a cold coffee on your desk and gone home. He has never left before you did. You try not to think about it.',
        ],
        [
          'La caja del muelle 3 traía dentro la póliza de la galería. El catálogo público se imprime en papel grueso y se vende en la tienda. Entre una lista y otra no debería haber ninguna diferencia. A estas alturas ya sabes lo que vale una frase así en esta ciudad.',
          'Un JOIN compara fila a fila. Esto pide otra herramienta: coger una lista entera, restarle otra lista entera y ver qué queda. Teo te ha dejado un café frío en la mesa y se ha ido a casa. Nunca se había ido antes que tú. Intentas no darle vueltas.',
        ],
      ),
      tables: { catalogue, insured_items: insuredItems },
      stages: [
        {
          title: bi('Insured but never exhibited', 'Aseguradas y nunca expuestas'),
          briefing: bi('Return the code of the pieces in insured_items that do not appear in the catalogue.', 'Devuelve el code de las piezas de insured_items que no aparecen en catalogue.'),
          expected: [{ code: 'GG-901' }, { code: 'GG-902' }, { code: 'GG-903' }],
          hints: [bi('SELECT code FROM insured_items EXCEPT SELECT code FROM catalogue. Both sides need the same columns.', 'SELECT code FROM insured_items EXCEPT SELECT code FROM catalogue. Los dos lados necesitan las mismas columnas.')],
          clue: bi('Three pieces are insured but appear in no catalogue: GG-901, GG-902 and GG-903.', 'Tres piezas están aseguradas pero no figuran en ningún catálogo: GG-901, GG-902 y GG-903.'),
        },
        {
          title: bi('How much is nothing worth?', '¿Cuánto vale la nada?'),
          briefing: bi('Calculate how much those three pieces are insured for. Return it as total.', 'Calcula en cuánto están aseguradas esas tres piezas. Devuélvelo como total.'),
          expected: [{ total: 550000 }],
          hints: [bi('Put the EXCEPT inside a subquery: WHERE code IN (SELECT code FROM insured_items EXCEPT SELECT code FROM catalogue).', 'Mete el EXCEPT en una subconsulta: WHERE code IN (SELECT code FROM insured_items EXCEPT SELECT code FROM catalogue).')],
          clue: bi('550,000 are insured against the loss of pieces that have never been on show.', 'Hay 550.000 asegurados contra la pérdida de piezas que nunca se han expuesto.'),
        },
        {
          title: bi('The full list of anomalies', 'La lista completa de anomalías'),
          briefing: bi("Quiroga wants a single list. Return code and a column status: 'ghost' for pieces insured and not catalogued, 'uninsured' for pieces catalogued and not insured.", "Quiroga quiere una sola lista. Devuelve code y una columna status: 'ghost' para las aseguradas sin catálogo y 'uninsured' para las catalogadas sin seguro."),
          expected: [
            { code: 'GG-901', status: 'ghost' },
            { code: 'GG-902', status: 'ghost' },
            { code: 'GG-903', status: 'ghost' },
            { code: 'GG-011', status: 'uninsured' },
            { code: 'GG-014', status: 'uninsured' },
          ],
          hints: [bi("UNION stacks two results with the same columns. A fixed value is allowed: SELECT code, 'ghost' AS status FROM ...", "UNION apila dos resultados con las mismas columnas. Se permite un valor fijo: SELECT code, 'ghost' AS status FROM ...")],
          clue: bi('The gallery insures what it does not own and does not bother to insure what it does.', 'La galería asegura lo que no tiene y no se molesta en asegurar lo que tiene.'),
        },
      ],
      closing: bi(
        [
          'GG-901 is the Crystal Miniature of the Port. It is a piece which, according to the gallery’s own catalogue, has never existed. It nevertheless spent the whole of gala night in a lit case in the middle of the room, with half the city admiring it, and now 220,000 are about to be paid out for the theft of it.',
          'So the theft was the plan: an inside job, a disconnected sensor, an appraiser on the train. There is only one problem, and you see it at around three in the morning. If the theft was the plan, the gallery should have the miniature. But its Head of Security has just reported that she does not know where it is, and for the first time she looks truly frightened.',
          'Somebody got there before them.',
        ],
        [
          'La GG-901 es la Miniatura de Cristal del Puerto. Una pieza que, según el catálogo de la propia galería, no ha existido nunca. Aun así pasó la noche de la gala en una vitrina iluminada en mitad de la sala, con media ciudad admirándola, y ahora están a punto de pagar 220.000 por su robo.',
          'Así que el robo era el plan: un trabajo desde dentro, un sensor desconectado, una tasadora en el tren. Solo hay un problema, y lo ves hacia las tres de la madrugada. Si el robo era el plan, la miniatura debería tenerla la galería. Pero su jefa de seguridad acaba de denunciar que no sabe dónde está, y por primera vez parece asustada de verdad.',
          'Alguien se les adelantó.',
        ],
      ),
    },
    {
      id: 'glass-gallery',
      rating: 4,
      dossier: true,
      concepts: ['DOSSIER', 'CTE', 'HAVING', 'LEFT JOIN'],
      title: bi('Dossier: The real thief', 'Expediente: La verdadera ladrona'),
      location: bi('Glass Gallery · The morning after', 'Galería de Cristal · La mañana siguiente'),
      scene: bi(
        [
          'The gallery wanted to fake a theft, and it has been robbed for real. Five people were close to the restricted room during the critical half hour. Someone got ahead of the corrupt security team and took a “piece that does not exist” with a key that should not exist either.',
          'The surviving records are the cameras, the ticket list and the coat-check. You will get no hints from here on: Quiroga is at the Commissioner’s office, trying to stop this case being taken away too, and Teo has called in sick for the first time in thirty-one years.',
        ],
        [
          'La galería quería fingir un robo, y la han robado de verdad. Cinco personas estuvieron cerca de la sala restringida durante la media hora crítica. Alguien se adelantó al equipo de seguridad corrupto y se llevó una "pieza que no existe" con una llave que tampoco debería existir.',
          'Quedan las cámaras, la lista de entradas y el guardarropa. A partir de aquí no habrá ayudas: Quiroga está en el despacho del Comisario, intentando que no le quiten también este caso, y Teo ha llamado para decir que está enfermo por primera vez en treinta y un años.',
        ],
      ),
      tables: {
        people: [
          { id: 1, name: 'Alba Grau' },
          { id: 2, name: 'Dani Prat' },
          { id: 3, name: 'Elia Font' },
          { id: 4, name: 'Félix Mar' },
          { id: 5, name: 'Nora Bell' },
        ],
        camera_events: [
          { person_id: 1, zone: 'Restricted Gallery', seen_at: '20:05' },
          { person_id: 1, zone: 'Atrium', seen_at: '20:18' },
          { person_id: 2, zone: 'Restricted Gallery', seen_at: '19:47' },
          { person_id: 2, zone: 'Restricted Gallery', seen_at: '20:29' },
          { person_id: 3, zone: 'Restricted Gallery', seen_at: '19:41' },
          { person_id: 3, zone: 'Restricted Gallery', seen_at: '19:58' },
          { person_id: 4, zone: 'Restricted Gallery', seen_at: '19:43' },
          { person_id: 4, zone: 'Restricted Gallery', seen_at: '20:31' },
          { person_id: 5, zone: 'West Hall', seen_at: '20:22' },
        ],
        tickets: [
          { person_id: 1, ticket: 'G-101' },
          { person_id: 2, ticket: 'G-102' },
          { person_id: 5, ticket: 'G-105' },
        ],
        coat_checks: [
          { person_id: 2, item: bi('red scarf', 'bufanda roja') },
          { person_id: 3, item: bi('brass key', 'llave de latón') },
          { person_id: 4, item: bi('leather gloves', 'guantes de cuero') },
          { person_id: 5, item: bi('silver umbrella', 'paraguas plateado') },
        ],
      },
      stages: [
        {
          title: bi('Reconstruct the movements', 'Reconstruye los movimientos'),
          briefing: bi('Find everyone recorded at least twice in the Restricted Gallery. Return name and the count as visits.', 'Encuentra a quienes aparecen al menos dos veces en Restricted Gallery. Devuelve name y el recuento como visits.'),
          expected: [{ name: 'Dani Prat', visits: 2 }, { name: 'Elia Font', visits: 2 }, { name: 'Félix Mar', visits: 2 }],
          clue: bi('Dani Prat, Elia Font and Félix Mar returned to the restricted room.', 'Dani Prat, Elia Font y Félix Mar volvieron a la sala restringida.'),
        },
        {
          title: bi('Check the guest list', 'Comprueba la lista de invitados'),
          briefing: bi('Of those repeat visitors, keep the ones with no gala ticket. Return their names.', 'De quienes repitieron, conserva a quienes no tienen entrada para la gala. Devuelve sus nombres.'),
          expected: [{ name: 'Elia Font' }, { name: 'Félix Mar' }],
          clue: bi('Elia Font and Félix Mar got into the gala without a ticket.', 'Elia Font y Félix Mar entraron en la gala sin entrada.'),
        },
        {
          title: bi('Examine the coat-check', 'Examina el guardarropa'),
          briefing: bi('Cross the two remaining names with the coat-check. Return the name and item of both.', 'Cruza los dos nombres restantes con el guardarropa. Devuelve name e item de ambos.'),
          expected: [{ name: 'Elia Font', item: bi('brass key', 'llave de latón') }, { name: 'Félix Mar', item: bi('leather gloves', 'guantes de cuero') }],
          clue: bi('Elia Font checked in a brass key. A very strange thing to leave there.', 'Elia Font dejó en el guardarropa una llave de latón. Un objeto muy raro para dejarlo allí.'),
        },
        {
          title: bi('Before the theft', 'Antes del robo'),
          briefing: bi('The case was found empty at 20:04, and the sensor was cut from 19:32. Which of the two was recorded twice in the Restricted Gallery before 20:04? Return the name.', 'La vitrina apareció vacía a las 20:04 y el sensor estaba cortado desde las 19:32. ¿Cuál de los dos aparece dos veces en Restricted Gallery antes de las 20:04? Devuelve el name.'),
          expected: [{ name: 'Elia Font' }],
          clue: bi('Elia Font was in the room twice before the theft was discovered. Félix Mar came back only afterwards.', 'Elia Font estuvo dos veces en la sala antes de descubrirse el robo. Félix Mar solo volvió después.'),
        },
      ],
      accusation: {
        intro: bi('Quiroga calls from a phone booth, keeping her voice low. “Give me a name today, or the Commissioner will pick whichever suits him.”', 'Quiroga llama desde una cabina, en voz baja. "Dame un nombre hoy, o el Comisario pondrá el que le convenga."'),
        fields: [{ key: 'suspect', label: bi('Who stole the miniature?', '¿Quién robó la miniatura?'), options: ['Alba Grau', 'Dani Prat', 'Elia Font', 'Félix Mar', 'Nora Bell'] }],
        answer: { suspect: 'Elia Font' },
      },
      closing: bi(
        [
          'You find her at the Hotel Miramar, in room 7, with her feet on the table, eating oranges. Elia Font: forty years old, three convictions, one of the best thieves in the south. She does not look surprised. “It took you long enough,” she says. “Sit down. Not you, Inspector, I do not like you. I mean the one from the basement.”',
          'The Miniature is on the bedspread. Elia presses the base with her thumb and it opens. It is hollow, and inside there is a strip of microfilm. “Somebody paid me to get this out before they could destroy it to collect the insurance. In advance, in cash, last month. They told me which night, and left me a brass key at a left-luggage office, with a note. Small handwriting. Careful.”',
          'Under the lamp, the film shows row after row of case numbers, with a date at the top of each column. Numbers from ATLAS. Numbers that, when you get back to your desk and search for them, do not exist. Someone is removing cases from the archive, and doing it from inside Basement Two.',
        ],
        [
          'La encontráis en el Hotel Miramar, en la habitación 7, con los pies sobre la mesa, comiendo naranjas. Elia Font: cuarenta años, tres condenas, una de las mejores ladronas del sur. No parece sorprendida. "Habéis tardado", dice. "Siéntate. Tú no, inspectora, tú no me caes bien. Me refiero a quien viene del sótano."',
          'La Miniatura está sobre la colcha. Elia aprieta la base con el pulgar y se abre. Está hueca, y dentro hay una tira de microfilm. "Me pagaron para sacarla antes de que la destruyeran para cobrar el seguro. Por adelantado, en efectivo, el mes pasado. Me dijeron qué noche y me dejaron una llave de latón en una consigna, con una nota. Letra pequeña. Cuidadosa."',
          'Bajo la lámpara, la película muestra fila tras fila de números de expediente, con una fecha encima de cada columna. Números de ATLAS. Números que, cuando vuelves a tu mesa y los buscas, no existen. Alguien está borrando casos del archivo, y lo hace desde dentro del Sótano Dos.',
        ],
      ),
    },
  ],
};

