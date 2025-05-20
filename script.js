function renderTimelineGrouped(container, data) {
  const entriesByYear = {};
  
  data.forEach(item => {
    const year = getYearFromReference(item.reference);
    if (year) {
      if (!entriesByYear[year]) entriesByYear[year] = [];
      entriesByYear[year].push(item);
    }
  });
  
  if (Object.keys(entriesByYear).length === 0) {
    container.innerHTML = '<div class="alert alert-info">No hay datos suficientes para mostrar la línea de tiempo.</div>';
    return;
  }
  
  let html = '<div class="timeline-vertical">';
  
  Object.keys(entriesByYear)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .forEach(year => {
      html += `
        <div class="timeline-group">
          <div class="timeline-year">
            <span class="timeline-year-label">${year}</span>
          </div>
          <div class="timeline-items">
      `;
      
      entriesByYear[year].forEach((item, index) => {
        const authorYear = extractAuthorYear(item.reference);
        html += `
          <div class="timeline-item">
            <div class="timeline-marker"></div>
            <div class="timeline-content">
              <div class="timeline-card">
                <h6 class="mb-1">${authorYear}</h6>
                <div class="d-flex gap-2 mb-2">
                  <span class="badge ${item.researchType === 'theoretical' ? 'badge-theoretical' : 'badge-empirical'}">
                    ${item.researchType === 'theoretical' ? 'Teórico' : 'Empírico'}
                  </span>
                  ${item.defines === 'yes' ? '<span class="badge badge-defines">Define</span>' : ''}
                </div>
                ${item.generalDef ? 
                  `<p class="small mb-0">${truncateText(item.generalDef, 150)}</p>` : ''}
              </div>
            </div>
          </div>
        `;
      });
      
      html += '</div></div>';
    });
  
  html += '</div>';
  container.innerHTML = html;
}

function updateTimelineMode() {
  updateTimeline();
}

// Inicializar gráficos
function initializeCharts() {
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js no está cargado');
    return;
  }
  
  initTypeChart();
  initDecadeChart();
  initTrendsChart();
}

function initTypeChart() {
  const ctx = document.getElementById('typeChart');
  if (!ctx) return;
  
  const data = filteredData.length > 0 ? filteredData : allData;
  const theoretical = data.filter(item => item.researchType === 'theoretical').length;
  const empirical = data.filter(item => item.researchType === 'empirical').length;
  
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Teórico', 'Empírico'],
      datasets: [{
        data: [theoretical, empirical],
        backgroundColor: [chartColors.primary, chartColors.secondary],
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const count = context.raw;
              const total = theoretical + empirical;
              const percentage = ((count / total) * 100).toFixed(1);
              return `${label}: ${count} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

function initDecadeChart() {
  const ctx = document.getElementById('decadeChart');
  if (!ctx) return;
  
  const data = filteredData.length > 0 ? filteredData : allData;
  const decadeCounts = {};
  
  data.forEach(item => {
    const year = getYearFromReference(item.reference);
    if (year) {
      const decade = Math.floor(year / 10) * 10;
      decadeCounts[decade] = (decadeCounts[decade] || 0) + 1;
    }
  });
  
  const decades = Object.keys(decadeCounts).sort();
  const counts = decades.map(decade => decadeCounts[decade]);
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: decades.map(d => `${d}s`),
      datasets: [{
        label: 'Publicaciones',
        data: counts,
        backgroundColor: chartColors.primary,
        borderColor: chartColors.primary,
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
}

function initTrendsChart() {
  const ctx = document.getElementById('trendsChart');
  if (!ctx) return;
  
  const data = filteredData.length > 0 ? filteredData : allData;
  const yearCounts = {};
  const yearDefines = {};
  
  data.forEach(item => {
    const year = getYearFromReference(item.reference);
    if (year) {
      yearCounts[year] = (yearCounts[year] || 0) + 1;
      if (item.defines === 'yes') {
        yearDefines[year] = (yearDefines[year] || 0) + 1;
      }
    }
  });
  
  const years = Object.keys(yearCounts).sort();
  const totalCounts = years.map(year => yearCounts[year]);
  const definesCounts = years.map(year => yearDefines[year] || 0);
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: years,
      datasets: [
        {
          label: 'Total de publicaciones',
          data: totalCounts,
          borderColor: chartColors.primary,
          backgroundColor: chartColors.primary + '20',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Con definición',
          data: definesCounts,
          borderColor: chartColors.success,
          backgroundColor: chartColors.success + '20',
          fill: true,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    }
  });
}

// Función para toggle de tema oscuro
function toggleDarkMode() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  
  // Reinicializar gráficos si están visibles
  if (document.getElementById('analytics-tab').classList.contains('active')) {
    setTimeout(initializeCharts, 100);
  }
}

// Cargar tema guardado
document.addEventListener('DOMContentLoaded', function() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
});

// Exportar datos
function exportData() {
  const dataToExport = filteredData.length > 0 ? filteredData : allData;
  const csvContent = convertToCSV(dataToExport);
  downloadCSV(csvContent, 'responsiveness_data.csv');
}

function exportComparison() {
  const selectedData = allData.filter(item => selectedEntries.includes(item.id));
  const csvContent = convertToCSV(selectedData);
  downloadCSV(csvContent, 'responsiveness_comparison.csv');
}

function convertToCSV(data) {
  const headers = [
    'ID',
    'Referencia',
    'Tipo de Investigación',
    'Define Concepto',
    'Definición General',
    'Definición Específica',
    'Preguntas Adicionales'
  ];
  
  const rows = data.map(item => [
    item.id,
    `"${item.reference.replace(/"/g, '""')}"`,
    item.researchType,
    item.defines,
    `"${(item.generalDef || '').replace(/"/g, '""')}"`,
    `"${(item.specificDef || '').replace(/"/g, '""')}"`,
    `"${item.additionalQuestions ? item.additionalQuestions.map(q => q.question).join('; ').replace(/"/g, '""') : ''}"`
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Función para mostrar errores mejorada
function showError(message) {
  const container = document.querySelector('.entries-container') || document.querySelector('.card-body');
  
  if (container) {
    container.innerHTML = `
      <div class="alert alert-danger">
        <div class="d-flex align-items-center">
          <i class="fas fa-exclamation-triangle me-2"></i>
          <div class="flex-grow-1">
            <strong>Error:</strong> ${message}
          </div>
        </div>
        <hr>
        <div class="mt-3">
          <h6>Posibles soluciones:</h6>
          <ul class="mb-3">
            <li>Verifica que el archivo <code>responsiveness.json</code> esté en la misma carpeta que <code>index.html</code></li>
            <li>Si estás ejecutando desde archivo local, usa un servidor web:
              <ul>
                <li>Python: <code>python -m http.server</code></li>
                <li>Node.js: <code>npx serve .</code></li>
                <li>VS Code: instala la extensión "Live Server"</li>
              </ul>
            </li>
            <li>Abre la consola del navegador (F12) para más detalles</li>
          </ul>
          <div class="d-flex gap-2">
            <button class="btn btn-primary" onclick="location.reload()">
              <i class="fas fa-sync-alt me-1"></i>Reintentar
            </button>
            <button class="btn btn-outline-primary" onclick="loadTestData()">
              <i class="fas fa-flask me-1"></i>Usar datos de prueba
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

// Función para cargar datos de prueba manualmente
function loadTestData() {
  allData = getTestData();
  initializeFilters();
  updateStats();
  filterEntries();
  showLoading(false);
  
  const container = document.querySelector('.entries-container');
  if (container && container.previousElementSibling) {
    const alert = container.previousElementSibling;
    if (alert.classList.contains('alert')) {
      alert.remove();
    }
  }
}

// Event listeners adicionales una vez que el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
  // Manejar enlaces de navegación smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
  
  // Keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + K para focus en búsqueda
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('search-input').focus();
    }
    
    // Escape para limpiar búsqueda
    if (e.key === 'Escape') {
      const searchInput = document.getElementById('search-input');
      if (searchInput === document.activeElement) {
        searchInput.value = '';
        filterEntries();
        searchInput.blur();
      }
    }
  });
  
  // Mejorar accesibilidad
  document.addEventListener('focusin', function(e) {
    if (e.target.matches('.entry-card')) {
      e.target.classList.add('focused');
    }
  });
  
  document.addEventListener('focusout', function(e) {
    if (e.target.matches('.entry-card')) {
      e.target.classList.remove('focused');
    }
  });
});