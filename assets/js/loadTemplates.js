// Fonction pour charger un template
async function loadTemplate(templatePath, targetElementId) {
  try {
    const response = await fetch(templatePath);
    if (!response.ok) {
      console.error(`Erreur lors du chargement du template: ${templatePath}`);
      return;
    }
    const template = await response.text();
    const targetElement = document.getElementById(targetElementId);
    if (targetElement) {
      targetElement.outerHTML = template;
      
      // Mettre à jour la navigation active après le chargement du header
      if (targetElementId === 'template-header') {
        updateActiveNavItem();
      }
    }
  } catch (error) {
    console.error(`Erreur lors du chargement du template ${templatePath}:`, error);
  }
}

// Fonction pour mettre à jour l'élément de navigation actif
function updateActiveNavItem() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navItems = document.querySelectorAll('.navbar-nav .nav-link');
  
  navItems.forEach(item => {
    const href = item.getAttribute('href');
    if (href === currentPage || 
        (currentPage === '' && href === 'index.html') ||
        (currentPage.includes('add_ship') && href.includes('add_ship')) ||
        (currentPage.includes('dashboard') && href.includes('dashboard')) ||
        (currentPage.includes('clusters') && href.includes('clusters'))) {
      item.classList.add('active');
      item.setAttribute('aria-current', 'page');
    } else {
      item.classList.remove('active');
      item.removeAttribute('aria-current');
    }
  });
}

// Charger les templates au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
  // Charger le header
  loadTemplate('assets/templates/header.html', 'template-header');
  
  // Charger le footer
  loadTemplate('assets/templates/footer.html', 'template-footer');
  
  // Initialiser les tooltips Bootstrap après le chargement du header
  if (typeof $ !== 'undefined') {
    $(document).ready(function() {
      $('[data-toggle="tooltip"]').tooltip();
    });
  }
  
  // Mettre à jour la navigation active lorsque l'utilisateur navigue
  window.addEventListener('load', updateActiveNavItem);
  window.addEventListener('popstate', updateActiveNavItem);
});
