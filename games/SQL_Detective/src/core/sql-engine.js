/**
 * Read-only SQL execution over the tables of a case.
 *
 * This module is part of the core: it knows nothing about the browser. The sql.js
 * module is received as a parameter, so the browser (see `platform/sql-runtime.js`)
 * and the Node tests run exactly the same code.
 */

/** Statements that would change the archive. REPLACE is handled apart: it is also a function. */
const FORBIDDEN_KEYWORDS = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|ATTACH|DETACH|PRAGMA|VACUUM|REINDEX|TRUNCATE)\b/i;

/** `REPLACE INTO` is a write, whereas `REPLACE(text, a, b)` is a useful string function. */
const REPLACE_STATEMENT = /\bREPLACE\b(?!\s*\()/i;

/** Error whose `code` the interface translates into a message for the player. */
export class QueryError extends Error {
  /**
   * @param {'EMPTY'|'READ_ONLY'|'ONE_STATEMENT'|'SQLITE'} code Kind of failure.
   * @param {string} [detail] Message from SQLite, shown as it comes.
   */
  constructor(code, detail = '') {
    super(detail || code);
    this.name = 'QueryError';
    this.code = code;
    this.detail = detail;
  }
}

/**
 * Removes comments and blanks the contents of string literals, so that the keyword
 * checks do not trip over a value such as `'DROP'` or a semicolon inside a string.
 *
 * @param {string} sql Text written by the player.
 * @returns {string} The same statement without literal contents.
 */
function maskLiterals(sql) {
  return sql
    .replace(/'(?:[^']|'')*'/g, "''")
    .replace(/"(?:[^"]|"")*"/g, '""')
    .replace(/--[^\n]*/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ');
}

/**
 * Checks that a text is one single query that cannot modify anything.
 *
 * @param {string} sql Text written by the player.
 * @returns {string} The trimmed query, ready to execute.
 * @throws {QueryError} With code `EMPTY`, `READ_ONLY` or `ONE_STATEMENT`.
 */
export function validateReadOnly(sql) {
  const query = sql.trim();
  const masked = maskLiterals(query).trim();
  if (!masked) throw new QueryError('EMPTY');
  if (!/^(SELECT|WITH)\b/i.test(masked)) throw new QueryError('READ_ONLY');
  if (FORBIDDEN_KEYWORDS.test(masked) || REPLACE_STATEMENT.test(masked)) throw new QueryError('READ_ONLY');
  const statements = masked.replace(/;\s*$/, '').split(';').filter((part) => part.trim());
  if (statements.length !== 1) throw new QueryError('ONE_STATEMENT');
  return query;
}

/** Quotes an identifier for SQLite. */
const quoteIdentifier = (name) => `"${String(name).replaceAll('"', '""')}"`;

/**
 * Chooses the column type from the values of a column.
 *
 * @param {unknown[]} values Every value of the column.
 * @returns {'INTEGER'|'REAL'|'TEXT'} The narrowest type that holds all of them.
 */
function columnType(values) {
  const present = values.filter((value) => value !== null && value !== undefined);
  if (present.every(Number.isInteger)) return 'INTEGER';
  if (present.every((value) => typeof value === 'number')) return 'REAL';
  return 'TEXT';
}

/**
 * Creates a table and fills it. The columns come from the first row, so every row of
 * a table must declare the same keys (`null` for a missing value).
 */
function createTable(database, name, rows) {
  const columns = Object.keys(rows[0]);
  const definition = columns
    .map((column) => `${quoteIdentifier(column)} ${columnType(rows.map((row) => row[column]))}`)
    .join(', ');
  database.run(`CREATE TABLE ${quoteIdentifier(name)} (${definition})`);

  const placeholders = columns.map(() => '?').join(', ');
  const statement = database.prepare(
    `INSERT INTO ${quoteIdentifier(name)} (${columns.map(quoteIdentifier).join(', ')}) VALUES (${placeholders})`,
  );
  try {
    for (const row of rows) statement.run(columns.map((column) => row[column] ?? null));
  } finally {
    statement.free();
  }
}

/**
 * Executes a query on a fresh in-memory database built from the tables of a case.
 * The result keeps columns and values apart because a query may repeat a column name.
 *
 * @param {object} SQL Initialised sql.js module.
 * @param {Record<string, object[]>} tables Tables of the case, already localized.
 * @param {string} sql Text written by the player.
 * @returns {{columns: string[], values: unknown[][]}} Result; empty arrays for no rows.
 * @throws {QueryError} When the query is not allowed or SQLite rejects it.
 */
export function executeQuery(SQL, tables, sql) {
  const query = validateReadOnly(sql);
  const database = new SQL.Database();
  try {
    for (const [name, rows] of Object.entries(tables)) {
      if (rows.length) createTable(database, name, rows);
    }
    const [result] = database.exec(query);
    return result ? { columns: result.columns, values: result.values } : { columns: [], values: [] };
  } catch (error) {
    if (error instanceof QueryError) throw error;
    throw new QueryError('SQLITE', error.message);
  } finally {
    database.close();
  }
}
