// Gestion du thème global
document.addEventListener('DOMContentLoaded', function() {
  initTheme();
  
  // Gestion du toggle thème
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
});

// Gestion du thème
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  const themeToggle = document.getElementById('theme-toggle');
  
  // Appliquer le thème sur html ET body pour une meilleure spécificité
  document.documentElement.setAttribute('data-theme', savedTheme);
  document.body.setAttribute('data-theme', savedTheme);
  
  if (themeToggle) {
    themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  const themeToggle = document.getElementById('theme-toggle');
  
  // Appliquer le thème sur html ET body pour une meilleure spécificité
  document.documentElement.setAttribute('data-theme', newTheme);
  document.body.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  
  if (themeToggle) {
    themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
  }
}