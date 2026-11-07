/**
 * Terminal commands that are not SQL, kept in a registry (Registry pattern). To add a
 * command, add an entry to `COMMANDS`; the terminal does not need to change.
 *
 * Every command returns the same shape as `executeQuery`, or throws `MetaCommandError`,
 * so the interface shows them exactly like a query.
 */

/** Error whose `code` the interface translates into a message for the player. */
export class MetaCommandError extends Error {
  /** @param {'INDEX_BURNED'} code Kind of failure. */
  constructor(code) {
    super(code);
    this.name = 'MetaCommandError';
    this.code = code;
  }
}

const COMMANDS = {
  /** Lists the tables of the case, unless its story has destroyed the index. */
  '.tables': ({ tables, hideSchema }) => {
    if (hideSchema) throw new MetaCommandError('INDEX_BURNED');
    const names = Object.keys(tables).sort();
    return { columns: ['table', 'rows'], values: names.map((name) => [name, tables[name].length]) };
  },
};

/**
 * Runs a terminal command when the input is one.
 *
 * @param {string} input Text written by the player.
 * @param {{tables: Record<string, object[]>, hideSchema?: boolean}} session Current case.
 * @returns {{columns: string[], values: unknown[][]}|null} The result, or `null` when
 *   the input is not a known command and must be treated as SQL.
 * @throws {MetaCommandError} When the case does not allow the command.
 */
export function runMetaCommand(input, session) {
  const command = COMMANDS[input.trim().replace(/;$/, '').toLowerCase()];
  return command ? command(session) : null;
}
