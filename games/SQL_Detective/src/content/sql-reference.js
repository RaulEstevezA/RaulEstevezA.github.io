/**
 * The in-game SQL handbook, in the order the campaign introduces each concept. To add an
 * entry, add it to its group; the handbook screen renders whatever is here.
 */

import { bi } from '../core/localize.js';

export const sqlReference = [
  {
    group: bi('Reading', 'Leer'),
    items: [
      { name: 'SELECT', syntax: 'SELECT name, role FROM staff;', description: bi('Chooses columns from a table. * means all of them.', 'Elige columnas de una tabla. * significa todas.') },
      { name: 'DISTINCT', syntax: 'SELECT DISTINCT room FROM visits;', description: bi('Removes repeated rows from the result.', 'Elimina las filas repetidas del resultado.') },
      { name: 'AS', syntax: 'SELECT COUNT(*) AS total ...', description: bi('Gives a column another name. Leads often ask for one.', 'Da otro nombre a una columna. Las pistas lo piden a menudo.') },
      { name: '.tables', syntax: '.tables', description: bi('Terminal command: lists the tables of the case and how many rows they have.', 'Comando del terminal: enumera las tablas del caso y cuántas filas tienen.') },
    ],
  },
  {
    group: bi('Filtering', 'Filtrar'),
    items: [
      { name: 'WHERE', syntax: "WHERE room = 'A-12' AND hour > '20:00'", description: bi('Keeps the rows that meet a condition. Combine conditions with AND and OR.', 'Conserva las filas que cumplen una condición. Combina condiciones con AND y OR.') },
      { name: 'LIKE', syntax: "WHERE guest LIKE 'Vale%'", description: bi('Compares with a pattern. % is any text, _ is one character. It ignores case.', 'Compara con un patrón. % es cualquier texto, _ es un carácter. No distingue mayúsculas.') },
      { name: 'IN · BETWEEN', syntax: "WHERE id IN (1, 2) AND t BETWEEN '02:10' AND '02:25'", description: bi('Compares with a list or with a range, both ends included.', 'Compara con una lista o con un rango, ambos extremos incluidos.') },
      { name: 'IS NULL', syntax: 'WHERE contract_id IS NULL', description: bi('Finds missing values. = NULL never matches.', 'Encuentra valores ausentes. = NULL no coincide nunca.') },
    ],
  },
  {
    group: bi('Ordering', 'Ordenar'),
    items: [
      { name: 'ORDER BY', syntax: 'ORDER BY sent_at DESC', description: bi('Sorts the rows. ASC goes up, DESC goes down.', 'Ordena las filas. ASC sube, DESC baja.') },
      { name: 'LIMIT', syntax: 'LIMIT 1', description: bi('Returns only that many rows. It always goes last.', 'Devuelve solo esa cantidad de filas. Siempre va al final.') },
    ],
  },
  {
    group: bi('Counting and grouping', 'Contar y agrupar'),
    items: [
      { name: 'COUNT · SUM · AVG', syntax: 'COUNT(*), SUM(amount), AVG(amount)', description: bi('Count rows, add values or calculate an average. MIN and MAX work the same way.', 'Cuentan filas, suman valores o calculan una media. MIN y MAX funcionan igual.') },
      { name: 'GROUP BY', syntax: 'GROUP BY courier_id', description: bi('Makes one row per value, and the aggregates calculate one result for each.', 'Crea una fila por valor, y las agregaciones calculan un resultado para cada una.') },
      { name: 'HAVING', syntax: 'HAVING COUNT(*) >= 5', description: bi('Filters the groups. WHERE filters rows before grouping; HAVING, afterwards.', 'Filtra los grupos. WHERE filtra filas antes de agrupar; HAVING, después.') },
    ],
  },
  {
    group: bi('Joining tables', 'Relacionar tablas'),
    items: [
      { name: 'JOIN', syntax: 'FROM a JOIN b ON a.id = b.a_id', description: bi('Combines rows that match. Those that do not are discarded without warning.', 'Combina las filas que coinciden. Las que no, se descartan sin avisar.') },
      { name: 'LEFT JOIN', syntax: 'FROM a LEFT JOIN b ON a.id = b.a_id', description: bi('Keeps all of table a. Where b has no match, its columns are NULL.', 'Conserva toda la tabla a. Donde b no tiene pareja, sus columnas salen a NULL.') },
      { name: 'Self join', syntax: 'FROM staff e JOIN staff m ON e.manager_id = m.id', description: bi('The same table twice, with two aliases, for rows that point to rows.', 'La misma tabla dos veces, con dos alias, para filas que apuntan a filas.') },
    ],
  },
  {
    group: bi('Questions inside questions', 'Preguntas dentro de preguntas'),
    items: [
      { name: 'Subquery', syntax: 'WHERE amount > (SELECT AVG(amount) FROM t)', description: bi('Uses the result of a query as a value or as a list.', 'Usa el resultado de una consulta como un valor o una lista.') },
      { name: 'WITH (CTE)', syntax: 'WITH r AS (SELECT ...) SELECT * FROM r', description: bi('Gives a name to an intermediate result, to work in steps.', 'Da nombre a un resultado intermedio, para trabajar por pasos.') },
      { name: 'WITH RECURSIVE', syntax: 'WITH RECURSIVE c AS (SELECT ... UNION ALL SELECT ... FROM t JOIN c ...)', description: bi('A CTE that calls itself, to follow chains of unknown length.', 'Un CTE que se llama a sí mismo, para seguir cadenas de longitud desconocida.') },
      { name: 'UNION · EXCEPT', syntax: 'SELECT code FROM a EXCEPT SELECT code FROM b', description: bi('Stack two results, or subtract one from the other. Both need the same columns.', 'Apilan dos resultados, o restan uno del otro. Ambos necesitan las mismas columnas.') },
    ],
  },
  {
    group: bi('Transforming values', 'Transformar valores'),
    items: [
      { name: 'CASE', syntax: "CASE WHEN x > 1 THEN 'high' ELSE 'low' END", description: bi('Chooses a value depending on a condition, row by row.', 'Elige un valor según una condición, fila a fila.') },
      { name: 'TRIM · UPPER · REPLACE', syntax: "UPPER(TRIM(REPLACE(name, '.', '')))", description: bi('Clean text: remove spaces at the ends, change to capitals, swap characters.', 'Limpian texto: quitan espacios de los extremos, pasan a mayúsculas, cambian caracteres.') },
      { name: 'COALESCE', syntax: 'COALESCE(amount, estimate)', description: bi('Returns the first value that is not NULL.', 'Devuelve el primer valor que no es NULL.') },
      { name: 'strftime · julianday', syntax: "julianday(b) - julianday(a)", description: bi("Date arithmetic. strftime('%s', t) gives seconds; julianday, days.", "Aritmética de fechas. strftime('%s', t) da segundos; julianday, días.") },
    ],
  },
  {
    group: bi('Window functions', 'Funciones de ventana'),
    items: [
      { name: 'LAG', syntax: 'LAG(id) OVER (ORDER BY id)', description: bi('Lets a row read the value of the previous row.', 'Permite a una fila leer el valor de la fila anterior.') },
      { name: 'ROW_NUMBER', syntax: 'ROW_NUMBER() OVER (PARTITION BY day ORDER BY t DESC)', description: bi('Numbers the rows of each group without collapsing them. Filter it in an outer query.', 'Numera las filas de cada grupo sin colapsarlas. Se filtra en una consulta exterior.') },
      { name: 'SUM OVER', syntax: 'SUM(amount) OVER (ORDER BY day)', description: bi('A running total: each row adds up everything before it.', 'Un total acumulado: cada fila suma todo lo anterior.') },
    ],
  },
  {
    group: bi('Reading the database itself', 'Leer la propia base de datos'),
    items: [
      { name: 'sqlite_master', syntax: "SELECT name, sql FROM sqlite_master WHERE type = 'table'", description: bi('SQLite’s own catalogue: every table and the statement that created it.', 'El catálogo propio de SQLite: cada tabla y la instrucción que la creó.') },
    ],
  },
];
