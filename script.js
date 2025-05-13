// Variables globales
let allData = [];
let selectedEntries = [];

// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', function() {
  loadData();
  
  // Configurar eventos
  document.getElementById('search-input').addEventListener('input', filterEntries);
  document.getElementById('type-filter').addEventListener('change', filterEntries);
  document.getElementById('defines-filter').addEventListener('change', filterEntries);
});

// Función para cargar datos
async function loadData() {
  try {
    const response = await fetch('responsiveness.json');
    if (!response.ok) {
      throw new Error('No se pudo cargar los datos');
    }
    
    allData = await response.json();
    
    // Actualizar estadísticas
    updateStats();
    
    // Mostrar entradas
    filterEntries();
    
  } catch (error) {
    console.error('Error:', error);
    document.querySelector('.entries-container').innerHTML = 
      '<div class="alert alert-danger">Error al cargar los datos. Por favor, intenta recargar la página.</div>';
  }
}

// Función para actualizar estadísticas
function updateStats() {
  const totalEntries = allData.length;
  const definesCount = allData.filter(item => item.defines === 'yes').length;
  const theoreticalCount = allData.filter(item => item.researchType === 'theoretical').length;
  const empiricalCount = allData.filter(item => item.researchType === 'empirical').length;
  
  const statsHTML = `
    <div class="col-md-3">
      <div class="stat-card">
        <div class="stat-number">${totalEntries}</div>
        <div class="stat-label">Total de Referencias</div>
      </div>
    </div>
    <div class="col-md-3">
      <div class="stat-card">
        <div class="stat-number">${definesCount}</div>
        <div class="stat-label">Definen el Concepto</div>
      </div>
    </div>
    <div class="col-md-3">
      <div class="stat-card">
        <div class="stat-number">${theoreticalCount}</div>
        <div class="stat-label">Teóricas</div>
      </div>
    </div>
    <div class="col-md-3">
      <div class="stat-card">
        <div class="stat-number">${empiricalCount}</div>
        <div class="stat-label">Empíricas</div>
      </div>
    </div>
  `;
  
  document.querySelector('.stats-container').innerHTML = statsHTML;
}

// Función para filtrar entradas
function filterEntries() {
  const searchTerm = document.getElementById('search-input').value.toLowerCase();
  const typeFilter = document.getElementById('type-filter').value;
  const definesOnly = document.getElementById('defines-filter').checked;
  
  const filteredData = allData.filter(item => {
    // Filtrar por término de búsqueda
    const matchesSearch = searchTerm === '' || 
      item.reference.toLowerCase().includes(searchTerm) ||
      (item.specificDef && item.specificDef.toLowerCase().includes(searchTerm)) ||
      (item.generalDef && item.generalDef.toLowerCase().includes(searchTerm));
    
    // Filtrar por tipo de investigación
    const matchesType = typeFilter === 'all' || item.researchType === typeFilter;
    
    // Filtrar por si define el concepto
    const matchesDefines = !definesOnly || item.defines === 'yes';
    
    return matchesSearch && matchesType && matchesDefines;
  });
  
  renderEntries(filteredData);
  renderComparison();
  renderTimeline(filteredData);
}

// Función para renderizar entradas
function renderEntries(entries) {
  const container = document.querySelector('.entries-container');
  
  if (entries.length === 0) {
    container.innerHTML = '<div class="alert alert-info">No se encontraron resultados con los filtros actuales.</div>';
    return;
  }
  
  let html = `<div class="mb-2 text-muted small">Mostrando ${entries.length} de ${allData.length} entradas</div>`;
  
  entries.forEach(item => {
    const authorYear = item.reference.split('.')[0];
    
    html += `
      <div class="entry-card" data-id="${item.id}">
        <div class="d-flex justify-content-between align-items-start">
          <h3 class="h5 mb-1">${authorYear}</h3>
          <div>
            <span class="badge ${item.researchType === 'theoretical' ? 'badge-theoretical' : 'badge-empirical'} me-1">
              ${item.researchType === 'theoretical' ? 'Teórico' : 'Empírico'}
            </span>
            <span class="badge ${item.defines === 'yes' ? 'badge-defines' : 'badge-no-defines'} me-1">
              ${item.defines === 'yes' ? 'Define' : 'No define'}
            </span>
            <button 
              class="btn btn-sm ${selectedEntries.includes(item.id) ? 'btn-primary' : 'btn-outline-primary'}" 
              onclick="toggleSelection('${item.id}')"
            >
              ${selectedEntries.includes(item.id) ? 'Seleccionado' : 'Seleccionar'}
            </button>
          </div>
        </div>
        <p class="small text-muted">${item.reference}</p>
        
        ${item.defines === 'yes' ? `
          <div class="mt-2">
            ${item.generalDef ? `
              <div class="mb-2">
                <h4 class="h6 mb-1">Definición General:</h4>
                <div class="definition-block">${item.generalDef}</div>
              </div>
            ` : ''}
            
            ${item.specificDef ? `
              <div>
                <h4 class="h6 mb-1">Definición Específica:</h4>
                <div class="definition-block">${item.specificDef}</div>
              </div>
            ` : ''}
          </div>
        ` : ''}
        
        ${item.additionalQuestions && item.additionalQuestions.length > 0 ? `
          <div class="mt-3">
            <h4 class="h6 mb-1">Preguntas adicionales:</h4>
            <ul class="list-group">
              ${item.additionalQuestions.map(q => `
                <li class="list-group-item">
                  <span class="fw-medium">${q.question}</span>
                  ${q.answer === 'yes' ? '<span class="ms-2 text-success">Sí</span>' : ''}
                  ${q.detail ? `<p class="small text-muted mt-1">${q.detail}</p>` : ''}
                </li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// Función para alternar selección
function toggleSelection(id) {
  if (selectedEntries.includes(id)) {
    selectedEntries = selectedEntries.filter(entryId => entryId !== id);
  } else {
    selectedEntries.push(id);
  }
  
  // Re-renderizar para actualizar botones y comparación
  filterEntries();
}

// Función para renderizar comparación
function renderComparison() {
  const container = document.querySelector('.comparison-container');
  
  if (selectedEntries.length === 0) {
    container.innerHTML = `
      <div class="alert alert-info">
        Selecciona definiciones para comparar usando el botón "Seleccionar" en la vista de Definiciones.
      </div>
    `;
    return;
  }
  
  const selectedData = allData.filter(item => selectedEntries.includes(item.id));
  
  let html = `
    <div class="table-responsive">
      <table class="table table-bordered">
        <thead class="table-light">
          <tr>
            <th>Autor y Año</th>
            <th>Tipo</th>
            <th>Definición General</th>
            <th>Definición Específica</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  selectedData.forEach(item => {
    const authorYear = item.reference.split('.')[0];
    
    html += `
      <tr>
        <td class="fw-medium">${authorYear}</td>
        <td>
          <span class="badge ${item.researchType === 'theoretical' ? 'badge-theoretical' : 'badge-empirical'}">
            ${item.researchType === 'theoretical' ? 'Teórico' : 'Empírico'}
          </span>
        </td>
        <td>${item.generalDef || '<span class="text-muted">No especificada</span>'}</td>
        <td>${item.specificDef || '<span class="text-muted">No especificada</span>'}</td>
      </tr>
    `;
  });
  
  html += `
        </tbody>
      </table>
    </div>
  `;
  
  container.innerHTML = html;
}

// Función para extraer año de la referencia
function getYearFromReference(reference) {
  const match = reference.match(/\d{4}/);
  return match ? parseInt(match[0]) : null;
}

// Función para renderizar línea de tiempo
function renderTimeline(entries) {
  const container = document.querySelector('.timeline-container');
  
  // Extraer años y ordenar entradas por año
  const entriesWithYears = entries
    .map(item => ({
      ...item,
      year: getYearFromReference(item.reference)
    }))
    .filter(item => item.year !== null)
    .sort((a, b) => a.year - b.year);
  
  if (entriesWithYears.length === 0) {
    container.innerHTML = '<div class="alert alert-info">No hay suficientes datos para mostrar la línea de tiempo.</div>';
    return;
  }
  
  // Obtener años únicos para la escala
  const uniqueYears = [...new Set(entriesWithYears.map(item => item.year))];
  
  let html = `
    <div class="timeline-line"></div>
  `;
  
  // Añadir marcas de años
  uniqueYears.forEach((year, index) => {
    const position = (index / (uniqueYears.length - 1)) * 100;
    
    html += `
      <div class="timeline-dot" style="left: ${position}%"></div>
      <div class="small text-muted" style="position: absolute; left: ${position}%; transform: translateX(-50%); top: 52%;">
        ${year}
      </div>
    `;
  });
  
  // Añadir entradas
  entriesWithYears.forEach((item, index) => {
    const yearIndex = uniqueYears.indexOf(item.year);
    const position = (yearIndex / (uniqueYears.length - 1)) * 100;
    const isTop = index % 2 === 0;
    const authorYear = item.reference.split('.')[0];
    
    html += `
      <div class="timeline-entry ${isTop ? 'top' : 'bottom'}" style="left: ${position}%">
        <div class="timeline-connector ${isTop ? 'top' : 'bottom'}"></div>
        <div class="card ${item.defines === 'yes' ? 'border-success' : ''}">
          <div class="card-body p-2">
            <p class="mb-1 fw-medium small">${authorYear}</p>
            ${item.defines === 'yes' ? '<p class="mb-0 text-success small">Define el concepto</p>' : ''}
          </div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}