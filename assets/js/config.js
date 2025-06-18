// Configuration de l'application
if (typeof window.APP_CONFIG === 'undefined') {
const APP_CONFIG = {
  // URL de l'API
  API_BASE_URL: 'api/',
  
  // Chemins des templates
  TEMPLATES: {
    HEADER: 'assets/templates/header.html',
    FOOTER: 'assets/templates/footer.html'
  },
  
  // Chemins des scripts
  SCRIPTS: {
    AUTH: 'assets/js/auth.js',
    TEMPLATES: 'assets/js/loadTemplates.js'
  },
  
  // Chemins des ressources
  ASSETS: {
    IMAGES: 'assets/img/'
  }
};
window.APP_CONFIG = APP_CONFIG;
}
