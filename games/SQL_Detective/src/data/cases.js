import {advancedCases} from './advanced-cases.js';
import {caseLore} from './case-lore.js';
import {dossierInvestigations} from './dossier-investigations.js';

const caseDefinitions = [
  {
    id:'missing-key', difficulty:'rookie', rating:0, concepts:['SELECT','WHERE'],
    title:{en:'The missing archive key',es:'La llave perdida del archivo'},
    story:{en:'The archive key vanished during the evening shift. The access log contains every visit to the evidence room.',es:'La llave del archivo desapareció durante el turno de tarde. El registro de acceso contiene cada visita a la sala de pruebas.'},
    objective:{en:'Find the name and role of the person who entered room A-12 after 20:00.',es:'Encuentra el nombre y el cargo de la persona que entró en la sala A-12 después de las 20:00.'},
    hints:{en:['Start with SELECT name, role FROM access_log.','Filter rows with WHERE room = \'A-12\'.','Add AND time > \'20:00\'.'],es:['Empieza con SELECT name, role FROM access_log.','Filtra con WHERE room = \'A-12\'.','Añade AND time > \'20:00\'.']},
    example:"SELECT name, role\nFROM access_log;",
    tables:{access_log:[{id:1,name:'Iris Vega',role:'Archivist',room:'B-04',time:'19:40'},{id:2,name:'Leo Martín',role:'Analyst',room:'A-12',time:'19:55'},{id:3,name:'Nora Vidal',role:'Technician',room:'A-12',time:'20:17'},{id:4,name:'Omar Sol',role:'Guard',room:'C-02',time:'20:31'}]},
    expected:[{name:'Nora Vidal',role:'Technician'}],
    solution:{en:"The log places Nora Vidal in A-12 at 20:17. SELECT chooses the evidence columns and WHERE isolates the matching visit.",es:'El registro sitúa a Nora Vidal en A-12 a las 20:17. SELECT elige las columnas de prueba y WHERE aísla la visita correcta.'}
  },
  {
    id:'coded-message', difficulty:'field', rating:1, concepts:['ORDER BY','LIMIT'],
    title:{en:'The coded message',es:'El mensaje cifrado'},
    story:{en:'A transmitter sent several bursts before going silent. Investigators believe the latest high-priority burst contains the meeting point.',es:'Un transmisor envió varias ráfagas antes de quedar en silencio. La última ráfaga de prioridad alta contiene el punto de encuentro.'},
    objective:{en:'Return the location of the most recent message with priority 3.',es:'Devuelve la ubicación del mensaje más reciente con prioridad 3.'},
    hints:{en:['Filter messages with WHERE priority = 3.','Sort newest first using ORDER BY sent_at DESC.','Keep only the first row with LIMIT 1.'],es:['Filtra con WHERE priority = 3.','Ordena del más reciente al más antiguo con ORDER BY sent_at DESC.','Conserva solo la primera fila con LIMIT 1.']},
    example:'SELECT location, sent_at\nFROM messages\nORDER BY sent_at DESC;',
    tables:{messages:[{id:21,location:'North pier',priority:2,sent_at:'21:05'},{id:22,location:'Old station',priority:3,sent_at:'21:16'},{id:23,location:'Glasshouse',priority:1,sent_at:'21:31'},{id:24,location:'Harbor warehouse',priority:3,sent_at:'21:44'}]},
    expected:[{location:'Harbor warehouse'}],
    solution:{en:'Filtering priority 3 leaves two messages. Descending order puts 21:44 first and LIMIT 1 returns Harbor warehouse.',es:'Al filtrar la prioridad 3 quedan dos mensajes. El orden descendente coloca 21:44 primero y LIMIT 1 devuelve Harbor warehouse.'}
  },
  {
    id:'museum-alibi', difficulty:'inspector', rating:2, concepts:['JOIN','GROUP BY','COUNT'],
    title:{en:'The museum alibi',es:'La coartada del museo'},
    story:{en:'A rare map disappeared during a private viewing. One visitor appears on more camera records than anyone else in the restricted east wing.',es:'Un mapa raro desapareció durante una visita privada. Una persona aparece en más registros de cámara que nadie en el ala este restringida.'},
    objective:{en:'Find the visitor name with the most camera sightings in the East Wing. Return name and a count called sightings.',es:'Encuentra a la persona con más avistamientos de cámara en East Wing. Devuelve name y un recuento llamado sightings.'},
    hints:{en:['JOIN visitors and sightings using visitor_id.','Filter the joined rows to East Wing.','GROUP BY the visitor name, ORDER BY COUNT(*) DESC and LIMIT 1.'],es:['Une visitors y sightings mediante visitor_id.','Filtra las filas unidas por East Wing.','Agrupa por nombre, ordena por COUNT(*) DESC y usa LIMIT 1.']},
    example:'SELECT visitors.name, COUNT(*) AS sightings\nFROM visitors\nJOIN sightings ON visitors.id = sightings.visitor_id\nGROUP BY visitors.name;',
    tables:{visitors:[{id:1,name:'Ada Ríos',ticket:'V-104'},{id:2,name:'Bruno Paz',ticket:'V-108'},{id:3,name:'Celia Mar',ticket:'V-117'}],sightings:[{id:1,visitor_id:1,wing:'East Wing',time:'18:02'},{id:2,visitor_id:2,wing:'West Wing',time:'18:04'},{id:3,visitor_id:3,wing:'East Wing',time:'18:06'},{id:4,visitor_id:1,wing:'East Wing',time:'18:11'},{id:5,visitor_id:3,wing:'Atrium',time:'18:13'},{id:6,visitor_id:1,wing:'East Wing',time:'18:18'}]},
    expected:[{name:'Ada Ríos',sightings:3}],
    solution:{en:'The JOIN connects each sighting to a visitor. GROUP BY forms one group per name; COUNT(*) shows Ada Ríos has three East Wing sightings.',es:'JOIN conecta cada avistamiento con una persona. GROUP BY forma un grupo por nombre; COUNT(*) muestra que Ada Ríos tiene tres avistamientos en East Wing.'}
  },
  ...advancedCases
];

export const cases=caseDefinitions.map(item=>{
  const investigation=dossierInvestigations[item.id];
  return {...item,lore:caseLore[item.id],...(investigation?{...investigation,investigation}: {})};
});
