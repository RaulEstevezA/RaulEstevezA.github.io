/**
 * The endings of the story, in a registry keyed by the options of the decision in the
 * final case (`content/chapter-5.js`). To add an ending, add an option to that decision
 * and an entry here. Art for each ending is declared in `content/art.js`.
 */

import { bi } from '../core/localize.js';

export const endings = {
  press: {
    signal: bi('LA VOZ DEL PUERTO · SPECIAL EDITION · 06:30', 'LA VOZ DEL PUERTO · EDICIÓN ESPECIAL · 06:30'),
    title: bi('The whole city reads it', 'La ciudad entera lo lee'),
    paragraphs: bi(
      [
        'The presses start at half past five, and by seven you can read the headline from across the square. People stop on their way to work, in the first dry morning in a month, holding the paper with both hands. By nine the Mayor has cancelled Proyecto Faro. By ten Oriol Vent’s yacht has left the harbour, and it will not be coming back.',
        'Half the case collapses in court. The evidence was obtained illegally, the defence says, and they are right. Ricardo Salas retires on medical grounds with a full pension. Judge Grau is transferred. But nobody will build on the Old Quarter now, and a street there has been renamed after a night watchman, and that is not nothing.',
        'A postcard arrives at Basement Two in the spring, with a foreign stamp and no signature. The handwriting is small and careful: “You should see the sea from here. I hear they are looking for someone to run the archive. Keep the mug.”',
      ],
      [
        'Las rotativas arrancan a las cinco y media, y a las siete el titular se lee desde el otro lado de la plaza. La gente se para camino del trabajo, en la primera mañana seca en un mes, sujetando el periódico con las dos manos. A las nueve, la alcaldesa ha cancelado el Proyecto Faro. A las diez, el yate de Oriol Vent ha salido del puerto, y no va a volver.',
        'La mitad del caso se hunde en los tribunales. Las pruebas se obtuvieron ilegalmente, dice la defensa, y tiene razón. Ricardo Salas se jubila por motivos médicos con la pensión completa. A la jueza Grau la trasladan. Pero ya nadie construirá en el Barrio Viejo, y una calle lleva ahora el nombre de un vigilante nocturno, y eso no es poco.',
        'En primavera llega al Sótano Dos una postal con sello extranjero y sin firmar. La letra es pequeña y cuidadosa: "Tendrías que ver el mar desde aquí. He oído que buscan a alguien para dirigir el archivo. Quédate la taza".',
      ],
    ),
  },
  arrest: {
    signal: bi('HEADQUARTERS · FLOOR FIVE · 07:15', 'JEFATURA · QUINTA PLANTA · 07:15'),
    title: bi('By the book', 'Por el camino legal'),
    paragraphs: bi(
      [
        'Quiroga goes up to the fifth floor with four officers and a prosecutor who has come on the night train, and she has you carry the tin yourself. Salas is at his desk with a cup of coffee, and looks up without surprise. “You know this will not hold,” he says. “Commissioner,” says Quiroga. “You have the right to remain silent. I recommend you try it. Nobody here ever has.”',
        'The trial lasts three years. Witnesses change their minds, one disappears, and a defence lawyer makes you spend nine days on the stand explaining what a JOIN is to a jury. But every number holds. You made sure of that, one query at a time. Oriol Vent gets nineteen years. Salas, eleven. Judge Grau, the worst of them, gets six and writes a book.',
        'Teo Ferrán testifies for the prosecution with his glasses in his hand, and serves fourteen months. When he comes out, there is a chair waiting for him at your desk, with the crossword already open. In the second chair there is a small woman with her glasses on her head, who has come back from somewhere with a tan. She looks at you. “Your queries are terrible,” she says. “Sit down. I will show you.”',
      ],
      [
        'Quiroga sube a la quinta planta con cuatro agentes y un fiscal que ha venido en el tren de noche, y te hace llevar la lata en persona. Salas está en su mesa con una taza de café y levanta la vista sin sorpresa. "Sabes que esto no se va a sostener", dice. "Comisario", dice Quiroga. "Tiene derecho a guardar silencio. Se lo recomiendo. Aquí nunca lo ha probado nadie."',
        'El juicio dura tres años. Hay testigos que cambian de opinión, uno que desaparece y un abogado que te hace pasar nueve días en el estrado explicándole a un jurado qué es un JOIN. Pero todas las cifras se sostienen. Te encargaste tú, consulta a consulta. Oriol Vent recibe diecinueve años. Salas, once. La jueza Grau, la peor de todos, seis, y escribe un libro.',
        'Teo Ferrán declara para la acusación con las gafas en la mano y cumple catorce meses. Cuando sale, le espera una silla junto a tu mesa, con el crucigrama ya abierto. En la segunda silla hay una mujer menuda con las gafas en la cabeza, que ha vuelto de algún sitio con la cara morena. Te mira. "Tus consultas son espantosas", dice. "Siéntate. Te enseño."',
      ],
    ),
  },
  deal: {
    signal: bi('RECORDS BUREAU · NEW OFFICE · ONE YEAR LATER', 'ARCHIVO CENTRAL · DESPACHO NUEVO · UN AÑO DESPUÉS'),
    title: bi('It never rains in the model', 'En la maqueta nunca llueve'),
    paragraphs: bi(
      [
        'The new office has a window. It looks out on the new waterfront, which is very beautiful, especially at night, when you cannot make out the fences. Your name is on the door, in brass. Teo’s record is clean; he died in his bed last winter, and at the funeral the Commissioner gave a very moving speech. Quiroga did not come, and you were relieved. She took early retirement in the spring and does not answer the phone.',
        'ATLAS has been upgraded. There is a nice young analyst downstairs now, in Basement Two, very quick. You have told them not to worry if the numbering skips. It is an old system. It does that.',
        'Some nights you work late, and before you go home you turn on the radio in the car, on a frequency that nobody is authorised to use. For a long time there was somebody reading a list out there. It has been silent since April. You keep listening to the sea for a few minutes anyway. Then you turn it off, and check that nobody has moved your mug.',
      ],
      [
        'El despacho nuevo tiene ventana. Da al nuevo paseo marítimo, que es muy bonito, sobre todo de noche, cuando no se distinguen las vallas. Tu nombre está en la puerta, en latón. El expediente de Teo está limpio; murió en su cama el invierno pasado, y en el funeral el Comisario pronunció un discurso muy emotivo. Quiroga no fue, y te alivió. Se prejubiló en primavera y no contesta al teléfono.',
        'Han actualizado ATLAS. Ahora hay abajo, en el Sótano Dos, alguien joven, muy rápido, muy amable. Le has dicho que no se preocupe si la numeración da saltos. Es un sistema viejo. A veces hace esas cosas.',
        'Algunas noches trabajas hasta tarde, y antes de volver a casa enciendes la radio del coche, en una frecuencia que nadie está autorizado a usar. Durante mucho tiempo hubo alguien allí leyendo una lista. Desde abril hay silencio. Sigues escuchando el mar unos minutos de todos modos. Luego la apagas y compruebas que nadie te ha movido la taza.',
      ],
    ),
  },
};
