// Completar el archivo script.js con las variables y funciones faltantes

// Variables globales
let allData = [];
let filteredData = [];
let currentPage = 1;
const itemsPerPage = 10;
let currentView = 'list';
let selectedEntries = [];

// Configuración de colores para gráficos
const chartColors = {
  primary: '#2563eb',
  secondary: '#7c3aed',
  success: '#16a34a',
  warning: '#ca8a04',
  danger: '#dc2626'
};

// Función principal de inicialización
document.addEventListener('DOMContentLoaded', function() {
  showLoading(true);
  loadData();
});

// Función para cargar datos
async function loadData() {
  try {
    const response = await fetch('responsiveness.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    allData = data;
    initializeFilters();
    updateStats();
    filterEntries();
    showLoading(false);
  } catch (error) {
    console.error('Error loading data:', error);
    showError('No se pudo cargar el archivo responsiveness.json. ' + error.message);
    showLoading(false);
  }
}

// Función para mostrar/ocultar loading
function showLoading(show) {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.style.display = show ? 'flex' : 'none';
  }
}

// Función para inicializar filtros
function initializeFilters() {
  const yearFilter = document.getElementById('year-filter');
  const decades = new Set();
  
  allData.forEach(item => {
    const year = getYearFromReference(item.reference);
    if (year) {
      const decade = Math.floor(year / 10) * 10;
      decades.add(decade);
    }
  });
  
  Array.from(decades).sort().forEach(decade => {
    const option = document.createElement('option');
    option.value = decade;
    option.textContent = `${decade}s`;
    yearFilter.appendChild(option);
  });
  
  // Event listeners para filtros
  document.getElementById('search-input').addEventListener('input', filterEntries);
  document.getElementById('type-filter').addEventListener('change', filterEntries);
  document.getElementById('year-filter').addEventListener('change', filterEntries);
  document.getElementById('defines-filter').addEventListener('change', filterEntries);
  document.getElementById('clear-search').addEventListener('click', clearSearch);
}

// Función para extraer año de la referencia
function getYearFromReference(reference) {
  const yearMatch = reference.match(/\b(19|20)\d{2}\b/);
  return yearMatch ? parseInt(yearMatch[0]) : null;
}

// Función para extraer autor y año
function extractAuthorYear(reference) {
  const match = reference.match(/^([^.]+).*?(\d{4})/);
  return match ? `${match[1].trim()} (${match[2]})` : reference;
}

// Función para truncar texto
function truncateText(text, maxLength) {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// Función para actualizar estadísticas
function updateStats() {
  const statsContainer = document.querySelector('.stats-container');
  if (!statsContainer) return;
  
  const data = filteredData.length > 0 ? filteredData : allData;
  const total = data.length;
  const theoretical = data.filter(item => item.researchType === 'theoretical').length;
  const empirical = data.filter(item => item.researchType === 'empirical').length;
  const withDefinition = data.filter(item => item.defines === 'yes').length;
  
  statsContainer.innerHTML = `
    <div class="col-6 col-md-3">
      <div class="card text-center stats-card">
        <div class="card-body">
          <h5 class="card-title">${total}</h5>
          <p class="card-text text-muted">Total de entradas</p>
        </div>
      </div>
    </div>
    <div class="col-6 col-md-3">
      <div class="card text-center stats-card">
        <div class="card-body">
          <h5 class="card-title">${theoretical}</h5>
          <p class="card-text text-muted">Teóricos</p>
        </div>
      </div>
    </div>
    <div class="col-6 col-md-3">
      <div class="card text-center stats-card">
        <div class="card-body">
          <h5 class="card-title">${empirical}</h5>
          <p class="card-text text-muted">Empíricos</p>
        </div>
      </div>
    </div>
    <div class="col-6 col-md-3">
      <div class="card text-center stats-card">
        <div class="card-body">
          <h5 class="card-title">${withDefinition}</h5>
          <p class="card-text text-muted">Con definición</p>
        </div>
      </div>
    </div>
  `;
}

// Función para filtrar entradas
function filterEntries() {
  const searchTerm = document.getElementById('search-input').value.toLowerCase();
  const typeFilter = document.getElementById('type-filter').value;
  const yearFilter = document.getElementById('year-filter').value;
  const definesFilter = document.getElementById('defines-filter').checked;
  
  filteredData = allData.filter(item => {
    // Filtro de búsqueda
    const searchMatch = !searchTerm || 
      item.reference.toLowerCase().includes(searchTerm) ||
      (item.generalDef && item.generalDef.toLowerCase().includes(searchTerm)) ||
      (item.specificDef && item.specificDef.toLowerCase().includes(searchTerm));
    
    // Filtro de tipo
    const typeMatch = typeFilter === 'all' || item.researchType === typeFilter;
    
    // Filtro de año
    let yearMatch = true;
    if (yearFilter !== 'all') {
      const itemYear = getYearFromReference(item.reference);
      if (itemYear) {
        const itemDecade = Math.floor(itemYear / 10) * 10;
        yearMatch = itemDecade === parseInt(yearFilter);
      } else {
        yearMatch = false;
      }
    }
    
    // Filtro de definiciones
    const definesMatch = !definesFilter || item.defines === 'yes';
    
    return searchMatch && typeMatch && yearMatch && definesMatch;
  });
  
  updateStats();
  updateResultsInfo();
  renderEntries();
  updatePagination();
}

// Función para limpiar búsqueda
function clearSearch() {
  document.getElementById('search-input').value = '';
  filterEntries();
}

// Función para actualizar información de resultados
function updateResultsInfo() {
  const resultsInfo = document.querySelector('.results-info');
  if (resultsInfo) {
    const total = filteredData.length;
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, total);
    
    resultsInfo.innerHTML = total > 0 
      ? `Mostrando <strong>${start}-${end}</strong> de <strong>${total}</strong> resultados`
      : 'No se encontraron resultados';
  }
}

// Función para renderizar entradas
function renderEntries() {
  const container = document.querySelector('.entries-container');
  if (!container) return;
  
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageEntries = filteredData.slice(start, end);
  
  if (pageEntries.length === 0) {
    container.innerHTML = '<div class="text-center text-muted">No hay entradas para mostrar</div>';
    return;
  }
  
  container.innerHTML = pageEntries.map(item => createEntryCard(item)).join('');
}

// Función para crear tarjeta de entrada
function createEntryCard(item) {
  const authorYear = extractAuthorYear(item.reference);
  
  return `
    <div class="card entry-card mb-4" data-id="${item.id}">
      <div class="card-body">
        <div class="entry-header">
          <h5 class="card-title">${authorYear}</h5>
          <div class="entry-badges">
            <span class="badge ${item.researchType === 'theoretical' ? 'badge-theoretical' : 'badge-empirical'}">
              ${item.researchType === 'theoretical' ? 'Teórico' : 'Empírico'}
            </span>
            ${item.defines === 'yes' ? '<span class="badge badge-defines">Define</span>' : ''}
          </div>
        </div>
        
        <div class="reference-text">
          <p class="text-muted small">${item.reference}</p>
        </div>
        
        ${item.generalDef ? `
          <div class="definitions-section">
            <h6><i class="fas fa-quote-left me-2"></i>Definición General</h6>
            <p>${item.generalDef}</p>
          </div>
        ` : ''}
        
        ${item.specificDef ? `
          <div class="definitions-section">
            <h6><i class="fas fa-quote-right me-2"></i>Definición Específica</h6>
            <p>${item.specificDef}</p>
          </div>
        ` : ''}
        
        ${item.additionalQuestions && item.additionalQuestions.length > 0 ? `
          <div class="additional-questions">
            <h6><i class="fas fa-question-circle me-2"></i>Preguntas Adicionales</h6>
            <div class="list-group">
              ${item.additionalQuestions.map(q => `
                <div class="list-group-item">
                  <strong>${q.question}</strong>
                  ${q.answer ? `<p class="mb-0 mt-2"><small>${q.answer}</small></p>` : ''}
                  ${q.detail ? `<p class="mb-0 mt-1"><small class="text-muted">${q.detail}</small></p>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// Función para actualizar paginación
function updatePagination() {
  const paginationContainer = document.getElementById('pagination');
  if (!paginationContainer) return;
  
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  
  if (totalPages <= 1) {
    paginationContainer.innerHTML = '';
    return;
  }
  
  let paginationHTML = '';
  
  // Botón anterior
  paginationHTML += `
    <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">
        <i class="fas fa-chevron-left"></i>
      </a>
    </li>
  `;
  
  // Páginas
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
      paginationHTML += `
        <li class="page-item ${i === currentPage ? 'active' : ''}">
          <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
        </li>
      `;
    } else if (i === currentPage - 3 || i === currentPage + 3) {
      paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    }
  }
  
  // Botón siguiente
  paginationHTML += `
    <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">
        <i class="fas fa-chevron-right"></i>
      </a>
    </li>
  `;
  
  paginationContainer.innerHTML = paginationHTML;
}

// Función para cambiar página
function changePage(page) {
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  if (page >= 1 && page <= totalPages) {
    currentPage = page;
    renderEntries();
    updatePagination();
    updateResultsInfo();
  }
}

// Función para cambiar vista
function changeView(view) {
  currentView = view;
  const listBtn = document.getElementById('list-view');
  const gridBtn = document.getElementById('grid-view');
  
  if (view === 'list') {
    listBtn.classList.add('active');
    gridBtn.classList.remove('active');
  } else {
    gridBtn.classList.add('active');
    listBtn.classList.remove('active');
  }
  
  renderEntries();
}

// Función para obtener datos de prueba
function getTestData() {
  return [
    {
      id: "test1",
      reference: "Doe, John. 2020. Test Article. Test Journal.",
      researchType: "theoretical",
      defines: "yes",
      generalDef: "Esta es una definición de prueba del concepto de responsiveness.",
      specificDef: "",
      additionalQuestions: []
    }
  ];
}

// Función para actualizar timeline
function updateTimeline() {
  const mode = document.getElementById('timeline-mode').value;
  const filter = document.getElementById('timeline-filter').value;
  const container = document.querySelector('.timeline-container');
  
  if (!container) return;
  
  let data = allData;
  if (filter !== 'all') {
    data = allData.filter(item => {
      switch (filter) {
        case 'defines': return item.defines === 'yes';
        case 'theoretical': return item.researchType === 'theoretical';
        case 'empirical': return item.researchType === 'empirical';
        default: return true;
      }
    });
  }
  
  if (mode === 'grouped') {
    renderTimelineGrouped(container, data);
  } else {
    renderTimelineChronological(container, data);
  }
}

// Función para renderizar timeline cronológico
function renderTimelineChronological(container, data) {
  container.innerHTML = '<div class="alert alert-info">Vista cronológica en desarrollo.</div>';
}

// Event listeners para pestañas
document.addEventListener('DOMContentLoaded', function() {
  const tabs = document.querySelectorAll('[data-bs-toggle="tab"]');
  tabs.forEach(tab => {
    tab.addEventListener('shown.bs.tab', function(e) {
      const targetId = e.target.getAttribute('data-bs-target');
      
      if (targetId === '#analytics' && typeof Chart !== 'undefined') {
        setTimeout(initializeCharts, 100);
      } else if (targetId === '#timeline') {
        updateTimeline();
      }
    });
  });
});