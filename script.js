/**
 * Détecte le séparateur probable : ',' ou ';'
 */
function detectDelimiter(text) {
  const firstLines = text.split(/\r\n|\n|\r/).slice(0, 5); // quelques lignes
  let commaCount = 0;
  let semicolonCount = 0;

  firstLines.forEach((line) => {
    commaCount += (line.match(/,/g) || []).length;
    semicolonCount += (line.match(/;/g) || []).length;
  });

  // Par défaut, on considère ';' s'il est plus fréquent (courant en CSV FR/Excel)
  return semicolonCount > commaCount ? ';' : ',';
}

/**
 * Parse simple du CSV en tenant compte de quotes "..."
 * (gestion minimale des virgules/points-virgules dans les champs entre guillemets)
 */
function parseCSV(text, delimiter) {
  const lines = text.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
  const rows = [];

  for (const line of lines) {
    const cells = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const next = line[i + 1];

      if (char === '"') {
        // Double-quote -> échappement
        if (inQuotes && next === '"') {
          current += '"';
          i++; // skip next
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        cells.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    cells.push(current);
    rows.push(cells);
  }

  return rows;
}

/**
 * Construit un tableau Bootstrap à partir d'un array 2D
 */
function buildTable(rows) {
  const table = document.createElement('table');
  table.className = 'table table-striped table-bordered table-hover align-middle';

  if (rows.length === 0) return table;

  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  // En-tête
  const headerRow = document.createElement('tr');
  rows[0].forEach((cell) => {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = cell;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  // Corps
  for (let r = 1; r < rows.length; r++) {
    const tr = document.createElement('tr');
    rows[r].forEach((cell) => {
      const td = document.createElement('td');
      td.textContent = cell;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  }

  table.appendChild(thead);
  table.appendChild(tbody);
  return table;
}

/**
 * Affiche & sauvegarde
 */
function displayCSVAndSave(csvText) {
  const container = document.getElementById('tableContainer');
  container.innerHTML = '';

  const delimiter = detectDelimiter(csvText);
  const rows = parseCSV(csvText, delimiter);
  const table = buildTable(rows);
  container.appendChild(table);

  // Sauvegarde brute du CSV
  localStorage.setItem('storedCSV', csvText);
}

/**
 * Init au chargement
 */
window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('storedCSV');
  if (saved) {
    try {
      displayCSVAndSave(saved);
    } catch (e) {
      console.error('Erreur lors du chargement du CSV sauvegardé :', e);
    }
  }

  // Upload
  document.getElementById('csvFileInput').addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target.result;
      displayCSVAndSave(String(csvText));
    };
    reader.readAsText(file, 'utf-8');
  });

  // Effacer
  document.getElementById('clearStorage').addEventListener('click', () => {
    localStorage.removeItem('storedCSV');
    document.getElementById('tableContainer').innerHTML = '';
    alert('Données supprimées du localStorage.');
  });

  // Télécharger le CSV sauvegardé
  document.getElementById('downloadCsv').addEventListener('click', () => {
    const savedCsv = localStorage.getItem('storedCSV');
    if (!savedCsv) {
      alert('Aucun CSV sauvegardé.');
      return;
    }
    const blob = new Blob([savedCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'donnees.csv';
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  });
});
``