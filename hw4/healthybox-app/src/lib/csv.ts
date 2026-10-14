const BOM = '﻿';
const DELIMITER = ';';

type Cell = string | number;

/**
 * Escapes one CSV cell. Text that a spreadsheet could run as a formula (starts with
 * = + - @) is prefixed with an apostrophe; cells with delimiters, quotes or line breaks are quoted.
 */
export function escapeCell(value: Cell): string {
  let text = String(value);
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[;"\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Builds CSV text for Excel (UTF-8 BOM, `;` delimiter as in the Russian locale, CRLF rows). */
export function toCsv(rows: ReadonlyArray<ReadonlyArray<Cell>>): string {
  return BOM + rows.map((row) => row.map(escapeCell).join(DELIMITER)).join('\r\n');
}
