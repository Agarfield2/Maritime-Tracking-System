// Fonction pour vérifier l'état d'authentification
async function checkAuth() {
  try {
    const response = await fetch('api/check_auth.php', {
      credentials: 'same-origin'
    });
    
    const data = await response.json();
    
    if (data.authenticated) {
      // Mettre à jour l'interface pour un utilisateur connecté
      updateUIForAuthenticatedUser(data.user);
      return data.user;
    } else if (window.location.pathname.includes('admin.html')) {
      // Rediriger vers la page de connexion uniquement pour la page admin
      window.location.href = 'login.html?redirect=' + encodeURIComponent('/tpapache/Projet_web3/admin.html');
      return null;
    }
    
    return null;
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'authentification:', error);
    if (window.location.pathname.includes('admin.html')) {
      window.location.href = 'login.html?error=auth_check_failed';
    }
    return null;
  }
}

// Mettre à jour l'interface utilisateur pour un utilisateur authentifié
function updateUIForAuthenticatedUser(user) {
  const authSection = document.getElementById('auth-section');
  if (!authSection) return;

  // Cacher le lien de connexion s'il existe
  const loginLink = document.getElementById('login-link');
  if (loginLink) {
    loginLink.style.display = 'none';
  }

  authSection.innerHTML = `
    <li class="nav-item dropdown">
      <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" id="userDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
        <img src="assets/img/user-avatar.svg" alt="${user.username}" class="rounded-circle mr-2" style="width: 32px; height: 32px; object-fit: cover;">
        <span>${user.username}</span>
      </a>
      <div class="dropdown-menu dropdown-menu-right" aria-labelledby="userDropdown">
        <a class="dropdown-item" href="admin.html">
          <i class="fas fa-tachometer-alt mr-2"></i>Tableau de bord admin
        </a>
        <div class="dropdown-divider"></div>
        <a class="dropdown-item" href="#" id="logoutBtn">
          <i class="fas fa-sign-out-alt mr-2"></i>Déconnexion
        </a>
      </div>
    </li>`;

  // Ajouter un écouteur d'événement pour le bouton de déconnexion
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
}

// Gérer la déconnexion
async function handleLogout(e) {
  e.preventDefault();
  
  try {
    const response = await fetch('api/logout.php', {
      method: 'POST',
      credentials: 'same-origin'
    });
    
    if (response.ok) {
      // Rediriger vers la page de connexion avec un paramètre de déconnexion réussie
      window.location.href = 'login.html?logout=1';
    } else {
      throw new Error('Échec de la déconnexion');
    }
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    alert('Une erreur est survenue lors de la déconnexion. Veuillez réessayer.');
  }
}

// Initialiser l'authentification au chargement de la page
document.addEventListener('DOMContentLoaded', async function() {
  // Vérifier l'authentification sur toutes les pages sauf login.html
  if (!window.location.pathname.includes('login.html')) {
    await checkAuth();
  }
  
  // Initialiser les tooltips Bootstrap
  if (typeof $ !== 'undefined') {
    $('[data-toggle="tooltip"]').tooltip();
  }
});

// Gestionnaire d'erreur pour les requêtes AJAX non authentifiées
if (typeof $ !== 'undefined') {
  $(document).on('ajaxError', function(event, jqXHR) {
    if (jqXHR.status === 401) {
      // Non autorisé - rediriger vers la page de connexion
      window.location.href = 'login.html?session_expired=1';
    }
  });
}
