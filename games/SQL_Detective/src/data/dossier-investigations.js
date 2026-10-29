const bi=(en,es)=>({en,es});

export const dossierInvestigations={
  'harbor-conspiracy':{
    story:bi('A sealed crate vanished from Pier 3 during the night shift. Reconstruct what happened and identify everyone responsible.','Una caja sellada desapareció del muelle 3 durante el turno de noche. Reconstruye lo ocurrido e identifica a todas las personas responsables.'),
    objective:bi('Identify who removed the crate from the harbor and who coordinated the operation.','Identifica quién sacó la caja del puerto y quién coordinó la operación.'),
    tables:{
      incident_reports:[
        {id:1,pier:2,reported_at:'21:40',detail:'A damaged seal was replaced before the night shift.'},
        {id:2,pier:3,reported_at:'22:24',detail:'Witness saw a blue van leave after the power dip.'},
        {id:3,pier:5,reported_at:'23:05',detail:'A forklift alarm sounded with no cargo movement.'}
      ],
      vans:[
        {id:1,plate:'HB-14',color:'white',driver_id:2},
        {id:2,plate:'NX-77',color:'blue',driver_id:4},
        {id:3,plate:'LV-09',color:'blue',driver_id:5},
        {id:4,plate:'CR-31',color:'red',driver_id:6}
      ],
      drivers:[
        {id:2,name:'Joel Serra'},
        {id:4,name:'Mina Costa'},
        {id:5,name:'Roc Vidal'},
        {id:6,name:'Sara Niu'}
      ],
      gate_logs:[
        {van_id:1,pier:3,left_at:'21:52'},
        {van_id:2,pier:3,left_at:'22:11'},
        {van_id:3,pier:5,left_at:'22:14'},
        {van_id:4,pier:3,left_at:'22:36'}
      ],
      people:[
        {id:8,name:'Oriol Vent'},
        {id:9,name:'Laia Nord'},
        {id:10,name:'Pau Roca'}
      ],
      calls:[
        {driver_id:4,person_id:8,duration:42,called_at:'22:13'},
        {driver_id:4,person_id:9,duration:184,called_at:'21:10'},
        {driver_id:2,person_id:8,duration:120,called_at:'21:56'},
        {driver_id:5,person_id:10,duration:35,called_at:'22:17'}
      ]
    },
    stages:[
      {title:bi('Start with the incident report','Empieza por el parte de incidencia'),briefing:bi('Find the report filed for Pier 3 after the crate disappeared. Return its detail.','Busca el parte presentado para el muelle 3 después de la desaparición. Devuelve su detalle.'),expected:[{detail:'Witness saw a blue van leave after the power dip.'}],clue:bi('A witness saw a blue van leaving Pier 3 after the power dip.','Un testigo vio una furgoneta azul saliendo del muelle 3 después del corte eléctrico.')},
      {title:bi('Trace the vehicle','Rastrea el vehículo'),briefing:bi('Use the witness statement and gate records to identify the relevant plate. Return plate only.','Usa el testimonio y los registros de salida para identificar la matrícula relevante. Devuelve solo plate.'),expected:[{plate:'NX-77'}],clue:bi('The blue van that left Pier 3 in the relevant window was NX-77.','La furgoneta azul que salió del muelle 3 en la franja relevante era la NX-77.')},
      {title:bi('Identify the driver','Identifica a quien conducía'),briefing:bi('Follow plate NX-77 to the driver registry. Return the driver name with the alias driver.','Sigue la matrícula NX-77 hasta el registro de conductores. Devuelve el nombre con el alias driver.'),expected:[{driver:'Mina Costa'}],clue:bi('Mina Costa was registered as the driver of NX-77.','Mina Costa figuraba como conductora de la NX-77.')},
      {title:bi('Find the coordinator','Encuentra a la persona coordinadora'),briefing:bi('Inspect the driver’s calls around the departure. A short confirmation call is the final link. Return the contact name as coordinator.','Examina las llamadas de la conductora cercanas a la salida. Una llamada breve de confirmación es el último vínculo. Devuelve el contacto como coordinator.'),expected:[{coordinator:'Oriol Vent'}],clue:bi('Two minutes after leaving, Mina Costa called Oriol Vent for 42 seconds.','Dos minutos después de salir, Mina Costa llamó a Oriol Vent durante 42 segundos.')}
    ],
    accusation:{fields:[
      {key:'driver',label:bi('Who drove the van?','¿Quién conducía la furgoneta?'),options:['Joel Serra','Mina Costa','Roc Vidal','Sara Niu']},
      {key:'coordinator',label:bi('Who coordinated the operation?','¿Quién coordinó la operación?'),options:['Oriol Vent','Laia Nord','Pau Roca']}
    ],answer:{driver:'Mina Costa',coordinator:'Oriol Vent'}}
  },
  'glass-gallery':{
    story:bi('A crystal miniature vanished during the museum gala. Reconstruct the visitor’s movements and identify the thief.','Una miniatura de cristal desapareció durante la gala del museo. Reconstruye los movimientos de los asistentes e identifica a la persona responsable.'),
    objective:bi('Identify who stole the miniature using the surviving museum records.','Identifica quién robó la miniatura utilizando los registros conservados por el museo.'),
    tables:{
      people:[{id:1,name:'Alba Grau'},{id:2,name:'Dani Prat'},{id:3,name:'Elia Font'},{id:4,name:'Félix Mar'},{id:5,name:'Nora Bell'}],
      camera_events:[
        {person_id:1,zone:'Restricted Gallery',seen_at:'20:05'},
        {person_id:1,zone:'Atrium',seen_at:'20:18'},
        {person_id:2,zone:'Restricted Gallery',seen_at:'20:07'},
        {person_id:2,zone:'Restricted Gallery',seen_at:'20:29'},
        {person_id:3,zone:'Restricted Gallery',seen_at:'20:11'},
        {person_id:3,zone:'Restricted Gallery',seen_at:'20:34'},
        {person_id:4,zone:'Restricted Gallery',seen_at:'20:13'},
        {person_id:4,zone:'Restricted Gallery',seen_at:'20:31'},
        {person_id:5,zone:'West Hall',seen_at:'20:22'}
      ],
      tickets:[{person_id:1,ticket:'G-101'},{person_id:2,ticket:'G-102'},{person_id:5,ticket:'G-105'}],
      coat_checks:[{person_id:2,item:'red scarf'},{person_id:3,item:'brass key'},{person_id:4,item:'leather gloves'},{person_id:5,item:'silver umbrella'}]
    },
    stages:[
      {title:bi('Reconstruct the movements','Reconstruye los movimientos'),briefing:bi('Find everyone recorded at least twice in the Restricted Gallery. Return name and a count called visits, ordered by name.','Encuentra a todas las personas registradas al menos dos veces en Restricted Gallery. Devuelve name y un recuento llamado visits, ordenado por nombre.'),expected:[{name:'Dani Prat',visits:2},{name:'Elia Font',visits:2},{name:'Félix Mar',visits:2}],clue:bi('Dani Prat, Elia Font and Félix Mar each entered the restricted gallery twice.','Dani Prat, Elia Font y Félix Mar entraron dos veces en la galería restringida.')},
      {title:bi('Check the guest list','Comprueba la lista de asistentes'),briefing:bi('Of the repeat visitors, find those with no gala ticket. Return their names ordered alphabetically.','Entre quienes repitieron visita, encuentra a quienes no tienen entrada para la gala. Devuelve sus nombres en orden alfabético.'),expected:[{name:'Elia Font'},{name:'Félix Mar'}],clue:bi('Elia Font and Félix Mar entered the gala without an official ticket.','Elia Font y Félix Mar entraron en la gala sin una entrada oficial.')},
      {title:bi('Examine the coat check','Examina la consigna'),briefing:bi('Cross-check the remaining suspects with the coat-check records. Return the name and item that provide the decisive link.','Cruza las personas restantes con los registros de consigna. Devuelve el nombre y el objeto que proporcionan el vínculo decisivo.'),expected:[{name:'Elia Font',item:'brass key'}],clue:bi('Elia Font checked a coat containing a brass key compatible with the display lock.','Elia Font dejó en consigna un abrigo con una llave de latón compatible con la vitrina.')}
    ],
    accusation:{fields:[
      {key:'suspect',label:bi('Who stole the miniature?','¿Quién robó la miniatura?'),options:['Alba Grau','Dani Prat','Elia Font','Félix Mar','Nora Bell']}
    ],answer:{suspect:'Elia Font'}}
  },
  'last-signal':{
    story:bi('A covert signal crossed the station network on two nights. The logs are fragmented and point to several employees. Determine who operated the relay and who prepared the equipment.','Una señal clandestina atravesó la red de la estación durante dos noches. Los registros están fragmentados y señalan a varias personas. Determina quién operó el repetidor y quién preparó el equipo.'),
    objective:bi('Reconstruct the two incidents, separate access coincidences from evidence and identify both members of the operation.','Reconstruye los dos incidentes, separa las coincidencias de acceso de las pruebas e identifica a los dos miembros de la operación.'),
    solution:bi('Inés Bosch was the final OPS sender on both nights and had repeated access to the Relay Room. Marc Alba had prepared terminal T-9, spoke with Inés immediately after both activations and never returned the portable signal bridge. Together, those independent records establish operator and accomplice.','Inés Bosch fue la última emisora de OPS en ambas noches y tuvo acceso repetido a Relay Room. Marc Alba había preparado el terminal T-9, habló con Inés inmediatamente después de las dos activaciones y nunca devolvió el puente de señal portátil. En conjunto, esos registros independientes demuestran quién fue la operadora y quién su cómplice.'),
    tables:{
      incident_reports:[
        {id:1,reported_at:'2026-10-20 20:15',system:'Camera',detail:'Brief image loss in the East Corridor.'},
        {id:2,reported_at:'2026-10-22 00:12',system:'Relay',detail:'Unknown signal with signature SIG-9 appeared on two consecutive nights.'},
        {id:3,reported_at:'2026-10-22 08:30',system:'Archive',detail:'Routine index mismatch; no data was removed.'}
      ],
      relay_events:[
        {id:1,day:'2026-10-20',terminal_id:9,activated_at:'23:56',signature:'SIG-9'},
        {id:2,day:'2026-10-21',terminal_id:9,activated_at:'23:59',signature:'SIG-9'},
        {id:3,day:'2026-10-20',terminal_id:6,activated_at:'19:12',signature:'SIG-4'},
        {id:4,day:'2026-10-21',terminal_id:3,activated_at:'21:08',signature:'SIG-2'}
      ],
      terminals:[
        {id:3,code:'A-3',room:'Archive',network:'internal'},
        {id:6,code:'C-6',room:'Control Room',network:'operations'},
        {id:9,code:'T-9',room:'Relay Room',network:'isolated'}
      ],
      operators:[{id:1,name:'Gael Mir',shift:'evening'},{id:2,name:'Inés Bosch',shift:'night'},{id:3,name:'Jan Ros',shift:'night'},{id:4,name:'Luz Serra',shift:'evening'}],
      transmissions:[
        {operator_id:1,day:'2026-10-20',sent_at:'23:40',terminal_id:6,channel:'OPS'},
        {operator_id:4,day:'2026-10-20',sent_at:'23:47',terminal_id:6,channel:'OPS'},
        {operator_id:2,day:'2026-10-20',sent_at:'23:55',terminal_id:6,channel:'OPS'},
        {operator_id:3,day:'2026-10-21',sent_at:'23:42',terminal_id:6,channel:'OPS'},
        {operator_id:4,day:'2026-10-21',sent_at:'23:50',terminal_id:6,channel:'OPS'},
        {operator_id:2,day:'2026-10-21',sent_at:'23:58',terminal_id:6,channel:'OPS'},
        {operator_id:3,day:'2026-10-20',sent_at:'23:57',terminal_id:3,channel:'ARCHIVE'},
        {operator_id:1,day:'2026-10-21',sent_at:'23:59',terminal_id:3,channel:'ARCHIVE'}
      ],
      badge_entries:[
        {operator_id:1,day:'2026-10-20',room:'Archive',entered_at:'22:10'},
        {operator_id:2,day:'2026-10-20',room:'Relay Room',entered_at:'23:31'},
        {operator_id:2,day:'2026-10-21',room:'Relay Room',entered_at:'23:33'},
        {operator_id:3,day:'2026-10-20',room:'Relay Room',entered_at:'20:15'},
        {operator_id:3,day:'2026-10-21',room:'Relay Room',entered_at:'21:04'},
        {operator_id:4,day:'2026-10-20',room:'Control Room',entered_at:'23:12'},
        {operator_id:4,day:'2026-10-21',room:'Control Room',entered_at:'23:18'}
      ],
      technicians:[{id:10,name:'Marc Alba'},{id:11,name:'Ada Sol'},{id:12,name:'Teo Lluc'}],
      maintenance_logs:[
        {technician_id:10,terminal_id:9,day:'2026-10-19',action:'Replaced signal bridge'},
        {technician_id:11,terminal_id:6,day:'2026-10-20',action:'Updated operations console'},
        {technician_id:12,terminal_id:9,day:'2026-09-12',action:'Routine inspection'},
        {technician_id:12,terminal_id:3,day:'2026-10-21',action:'Reindexed archive node'}
      ],
      calls:[
        {operator_id:2,technician_id:10,day:'2026-10-20',called_at:'23:58',duration:34},
        {operator_id:2,technician_id:10,day:'2026-10-21',called_at:'23:59',duration:28},
        {operator_id:3,technician_id:11,day:'2026-10-20',called_at:'21:20',duration:185},
        {operator_id:2,technician_id:11,day:'2026-10-18',called_at:'17:05',duration:241},
        {operator_id:4,technician_id:12,day:'2026-10-21',called_at:'22:10',duration:96}
      ],
      equipment_loans:[
        {technician_id:10,item:'portable signal bridge',loaned_at:'2026-10-19 16:40',returned_at:null},
        {technician_id:11,item:'spectrum analyzer',loaned_at:'2026-10-20 09:15',returned_at:'2026-10-20 18:00'},
        {technician_id:12,item:'access probe',loaned_at:'2026-10-21 08:05',returned_at:null}
      ]
    },
    stages:[
      {title:bi('Read the initial reports','Lee los informes iniciales'),briefing:bi('The alert is mixed with unrelated reports. Find the report for the Relay system and return only detail.','La alerta está mezclada con informes no relacionados. Encuentra el informe del sistema Relay y devuelve solo detail.'),expected:[{detail:'Unknown signal with signature SIG-9 appeared on two consecutive nights.'}],clue:bi('The relevant fingerprint is SIG-9, detected on two consecutive nights.','La huella relevante es SIG-9, detectada durante dos noches consecutivas.')},
      {title:bi('Isolate the matching events','Aísla los eventos coincidentes'),briefing:bi('Use the discovered signature to find its events. Return day, terminal_id and activated_at in chronological order.','Usa la firma descubierta para encontrar sus eventos. Devuelve day, terminal_id y activated_at en orden cronológico.'),expected:[{day:'2026-10-20',terminal_id:9,activated_at:'23:56'},{day:'2026-10-21',terminal_id:9,activated_at:'23:59'}],clue:bi('Both SIG-9 activations came from terminal 9, just before midnight.','Las dos activaciones SIG-9 salieron del terminal 9, poco antes de medianoche.')},
      {title:bi('Locate the origin','Localiza el origen'),briefing:bi('Join the matching relay events to the terminal inventory. Return the distinct code and room.','Une los eventos coincidentes con el inventario de terminales. Devuelve code y room sin duplicados.'),expected:[{code:'T-9',room:'Relay Room'}],clue:bi('The unauthorized signal originated at terminal T-9 in the Relay Room.','La señal no autorizada se originó en el terminal T-9 de Relay Room.')},
      {title:bi('Reconstruct the last traffic','Reconstruye el último tráfico'),briefing:bi('For each incident day, rank only OPS transmissions by time and identify the final sender. Return day and name ordered by day.','Para cada día del incidente, ordena solo las transmisiones OPS por hora e identifica a la última persona emisora. Devuelve day y name ordenados por día.'),expected:[{day:'2026-10-20',name:'Inés Bosch'},{day:'2026-10-21',name:'Inés Bosch'}],clue:bi('Inés Bosch closed OPS traffic immediately before both relay activations.','Inés Bosch cerró el tráfico OPS inmediatamente antes de las dos activaciones.')},
      {title:bi('Audit repeated access','Audita los accesos repetidos'),briefing:bi('Find every operator whose badge entered the Relay Room on both incident days. Return their names alphabetically.','Encuentra a todos los operadores cuya credencial entró en Relay Room durante los dos días del incidente. Devuelve sus nombres alfabéticamente.'),expected:[{name:'Inés Bosch'},{name:'Jan Ros'}],clue:bi('Access alone is inconclusive: both Inés Bosch and Jan Ros entered the room on both days.','El acceso por sí solo no es concluyente: Inés Bosch y Jan Ros entraron en la sala ambos días.')},
      {title:bi('Correlate traffic and access','Correlaciona tráfico y acceso'),briefing:bi('Intersect the repeated Relay Room visitors with the operator who was the final OPS sender on both days. Return only the name.','Cruza las visitas repetidas a Relay Room con el operador que fue la última persona emisora de OPS en ambos días. Devuelve solo name.'),expected:[{name:'Inés Bosch'}],clue:bi('Only Inés Bosch appears in both independent patterns. She is the relay operator.','Solo Inés Bosch aparece en ambos patrones independientes. Es la operadora del repetidor.')},
      {title:bi('Trace the terminal work','Rastrea el trabajo del terminal'),briefing:bi('Find the most recent maintenance performed on T-9 before the first incident. Return technician name and action.','Encuentra el mantenimiento más reciente realizado en T-9 antes del primer incidente. Devuelve el nombre del técnico y action.'),expected:[{name:'Marc Alba',action:'Replaced signal bridge'}],clue:bi('Marc Alba replaced T-9’s signal bridge the day before the first activation.','Marc Alba sustituyó el puente de señal de T-9 el día anterior a la primera activación.')},
      {title:bi('Compare the calls','Compara las llamadas'),briefing:bi('Look for an operator-technician pair with short calls on both incident days. Return operator, technician and the count as calls.','Busca una pareja operador-técnico con llamadas breves en los dos días del incidente. Devuelve operator, technician y el recuento como calls.'),expected:[{operator:'Inés Bosch',technician:'Marc Alba',calls:2}],clue:bi('Inés Bosch called Marc Alba for under a minute immediately after each activation.','Inés Bosch llamó a Marc Alba durante menos de un minuto inmediatamente después de cada activación.')},
      {title:bi('Find the missing component','Encuentra el componente desaparecido'),briefing:bi('Check the equipment loans for an unreturned item capable of bridging a signal. Return technician name and item.','Comprueba los préstamos de material para localizar un objeto no devuelto capaz de puentear una señal. Devuelve el nombre del técnico e item.'),expected:[{name:'Marc Alba',item:'portable signal bridge'}],clue:bi('Marc Alba still has the portable signal bridge borrowed before the incidents.','Marc Alba aún conserva el puente de señal portátil prestado antes de los incidentes.')}
    ],
    accusation:{fields:[
      {key:'operator',label:bi('Who controlled the relay?','¿Quién controlaba el repetidor?'),options:['Gael Mir','Inés Bosch','Jan Ros','Luz Serra']},
      {key:'accomplice',label:bi('Who prepared the equipment?','¿Quién preparó el equipo?'),options:['Marc Alba','Ada Sol','Teo Lluc']}
    ],answer:{operator:'Inés Bosch',accomplice:'Marc Alba'}}
  }
};
