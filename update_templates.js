const fs = require('fs');
const path = require('path');

// Liste des fichiers HTML à mettre à jour
const htmlFiles = [
  'add_ship.html',
  'admin.html',
  'clusters.html',
  'conditions.html',
  'confidentialite.html',
  'contact.html',
  'dashboard.html',
  'index.html',
  'login.html',
  'mentions.html',
  'predict.html'
];

// Fonction pour nettoyer le contenu HTML
function cleanHtmlContent(content) {
  // Supprimer les anciens templates s'ils existent
  content = content.replace(/<!-- Template Header -->[\s\S]*?<\/div>\s*<!-- \/Template Header -->/g, '');
  content = content.replace(/<!-- Template Footer -->[\s\S]*?<\/div>\s*<!-- \/Template Footer -->/g, '');
  
  // Supprimer les anciens scripts communs
  const scriptsToRemove = [
    'assets/js/config.js',
    'assets/js/loadTemplates.js',
    'assets/js/auth.js'
  ];
  
  scriptsToRemove.forEach(script => {
    const regex = new RegExp(`<script[^>]*src=["']${script}["'][^>]*>.*?<\/script>`, 'gi');
    content = content.replace(regex, '');
  });
  
  // Supprimer les anciens liens de style
  const stylesToRemove = [
    'assets/css/common.css'
  ];
  
  stylesToRemove.forEach(style => {
    const regex = new RegExp(`<link[^>]*href=["']${style}["'][^>]*>`, 'gi');
    content = content.replace(regex, '');
  });
  
  // Supprimer les anciens headers et footers natifs
  content = content.replace(/<header[\s\S]*?<\/header>/gi, '');
  content = content.replace(/<nav[\s\S]*?<\/nav>/gi, '');
  content = content.replace(/<footer[\s\S]*?<\/footer>/gi, '');
  
  return content;
}

// Fonction pour insérer le header
function insertHeader(content) {
  const headerContent = `
  <!-- Template Header -->
  <div id="template-header">
    <!-- Le contenu du header sera chargé dynamiquement -->
  </div>
  <!-- /Template Header -->`;

  const bodyOpenTag = content.indexOf('<body');
  if (bodyOpenTag === -1) return content;
  
  const bodyCloseBracket = content.indexOf('>', bodyOpenTag) + 1;
  
  // Vérifier si le header est déjà présent
  if (content.includes('id="template-header"')) {
    return content;
  }
  
  return content.slice(0, bodyCloseBracket) + '\n' + headerContent + content.slice(bodyCloseBracket);
}

// Fonction pour insérer le footer
function insertFooter(content) {
  const footerContent = `
  <!-- Template Footer -->
  <div id="template-footer">
    <!-- Le contenu du footer sera chargé dynamiquement -->
  </div>
  <!-- /Template Footer -->`;

  const bodyCloseTag = content.lastIndexOf('</body>');
  if (bodyCloseTag === -1) return content;
  
  // Vérifier si le footer est déjà présent
  if (content.includes('id="template-footer"')) {
    return content;
  }
  
  return content.slice(0, bodyCloseTag) + '\n' + footerContent + '\n' + content.slice(bodyCloseTag);
}

// Fonction pour insérer les scripts communs
function insertCommonScripts(content) {
  const commonScripts = `
  <!-- Scripts communs -->
  <script src="assets/js/config.js"></script>
  <script src="assets/js/loadTemplates.js"></script>
  <script src="assets/js/auth.js"></script>`;

  const bodyCloseTag = content.lastIndexOf('</body>');
  if (bodyCloseTag === -1) return content;
  
  // Vérifier si les scripts sont déjà présents
  if (content.includes('assets/js/auth.js')) {
    return content;
  }
  
  return content.slice(0, bodyCloseTag) + '\n' + commonScripts + '\n' + content.slice(bodyCloseTag);
}

// Fonction pour insérer les styles communs
function insertCommonStyles(content) {
  const styleLink = '  <link rel="stylesheet" href="assets/css/common.css">';
  
  const headCloseTag = content.indexOf('</head>');
  if (headCloseTag === -1) return content;
  
  // Vérifier si le style est déjà présent
  if (content.includes('assets/css/common.css')) {
    return content;
  }
  
  return content.slice(0, headCloseTag) + '\n' + styleLink + '\n' + content.slice(headCloseTag);
}

// Mettre à jour chaque fichier HTML
htmlFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  try {
    // Vérifier si le fichier existe
    if (!fs.existsSync(filePath)) {
      console.log(`❌ Le fichier ${file} n'existe pas, il sera ignoré.`);
      return;
    }
    
    // Lire le contenu du fichier
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Sauvegarder la longueur originale pour détecter les changements
    const originalLength = content.length;
    
    // Nettoyer le contenu
    content = cleanHtmlContent(content);
    
    // Insérer les éléments nécessaires
    content = insertHeader(content);
    content = insertFooter(content);
    content = insertCommonScripts(content);
    content = insertCommonStyles(content);
    
    // Écrire le contenu mis à jour uniquement s'il y a des changements
    if (content.length !== originalLength) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ ${file} a été mis à jour avec succès.`);
    } else {
      console.log(`ℹ️ ${file} est déjà à jour.`);
    }
  } catch (error) {
    console.error(`❌ Erreur lors de la mise à jour de ${file}:`, error.message);
  }
});

console.log('\nMise à jour des templates terminée. ✅');
