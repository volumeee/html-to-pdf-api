/**
 * Table Generation & Auto-Pagination Service
 */

/**
 * Generate a styled HTML table from data
 *
 * @param {Array} data - Array of objects or arrays
 * @param {object} options - Columns, headers, styles
 * @returns {string} HTML table string
 */
function generateTableHtml(data, options = {}) {
  const columns =
    options.columns || (data.length > 0 ? Object.keys(data[0]) : []);
  const headers = options.headers || columns;
  const tableClass = options.tableClass || "pdf-table";
  const zebra = options.zebra !== false;

  let html = `
    <style>
      .${tableClass} { border-collapse: collapse; width: 100%; font-family: sans-serif; }
      .${tableClass} th, .${tableClass} td { border: 1px solid #ddd; padding: 12px 8px; text-align: left; }
      .${tableClass} th { background-color: #f2f2f2; font-weight: bold; position: sticky; top: 0; }
      ${zebra ? `.${tableClass} tr:nth-child(even) { background-color: #f9f9f9; }` : ""}
      .${tableClass} tr:hover { background-color: #f1f1f1; }
      @media print {
        .${tableClass} thead { display: table-header-group; }
        .${tableClass} tr { page-break-inside: avoid; }
      }
    </style>
    <table class="${tableClass}">
      <thead>
        <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
      </thead>
      <tbody>
  `;

  data.forEach((row) => {
    html += "<tr>";
    columns.forEach((col) => {
      const val = Array.isArray(row) ? row[columns.indexOf(col)] : row[col];
      html += `<td>${val === undefined || val === null ? "" : val}</td>`;
    });
    html += "</tr>";
  });

  html += `
      </tbody>
    </table>
  `;

  return html;
}

module.exports = { generateTableHtml };
