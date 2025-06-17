// Variables globales
let allBateaux = [];
let filteredBateaux = [];
let currentPage = 1;
const rowsPerPage = 10;

// Chargement initial des bateaux
document.addEventListener('DOMContentLoaded', () => {
  chargerBateaux();
  setupEventListeners();
});

// Configuration des écouteurs d'événements
function setupEventListeners() {
  // Barre de recherche
  const searchInput = document.getElementById('searchInput');
  const searchSuggestions = document.getElementById('searchSuggestions');
  
  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
  }
  
  if (searchSuggestions) {
    searchSuggestions.addEventListener('mousedown', handleSuggestionClick);
  }
  
  // Gestion du formulaire d'ajout
  const addForm = document.getElementById('addForm');
  if (addForm) {
    addForm.onsubmit = handleAddSubmit;
  }
  
  // Gestion du formulaire d'édition
  const editForm = document.getElementById('editForm');
  if (editForm) {
    editForm.onsubmit = handleEditSubmit;
  }
  
  // Fermeture des suggestions lors d'un clic ailleurs
  document.addEventListener('click', (e) => {
    if (searchSuggestions && e.target !== searchInput) {
      searchSuggestions.innerHTML = '';
    }
  });
}

// Gestion de la recherche
function handleSearch() {
  const q = this.value.toLowerCase();
  if (!q) {
    filteredBateaux = [...allBateaux];
    afficherBateaux();
    document.getElementById('searchSuggestions').innerHTML = '';
    return;
  }
  
  filteredBateaux = allBateaux.filter(b =>
    (b.MMSI && b.MMSI.toString().includes(q)) ||
    (b.VesselName && b.VesselName.toLowerCase().includes(q))
  );
  
  afficherBateaux();
  
  // Affichage des suggestions
  const suggestions = filteredBateaux.slice(0, 6).map(b =>
    `<button type='button' class='list-group-item list-group-item-action' data-mmsi='${b.MMSI}'>${b.MMSI} - ${b.VesselName || ''}</button>`
  ).join('');
  
  document.getElementById('searchSuggestions').innerHTML = suggestions;
}

// Gestion du clic sur une suggestion
function handleSuggestionClick(e) {
  if (e.target && e.target.matches('button[data-mmsi]')) {
    const mmsi = e.target.getAttribute('data-mmsi');
    const bateau = allBateaux.find(b => b.MMSI == mmsi);
    if (bateau) {
      document.getElementById('searchInput').value = bateau.MMSI + (bateau.VesselName ? ' - ' + bateau.VesselName : '');
      filteredBateaux = [bateau];
      afficherBateaux();
      document.getElementById('searchSuggestions').innerHTML = '';
    }
  }
}

// Chargement des bateaux depuis l'API
async function chargerBateaux() {
  try {
    const res = await fetch('api/boats.php');
    allBateaux = await res.json();
    filteredBateaux = [...allBateaux];
    afficherBateaux();
  } catch (error) {
    console.error('Erreur lors du chargement des bateaux:', error);
    showAlert('Erreur lors du chargement des bateaux', 'danger');
  }
}

// Affichage des bateaux dans le tableau
function afficherBateaux() {
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  let html = '';
  
  filteredBateaux.slice(start, end).forEach(b => {
    html += `
      <tr>
        <td>${b.MMSI}</td>
        <td>${b.IMO || ''}</td>
        <td>${b.CallSign || ''}</td>
        <td>${b.VesselName || ''}</td>
        <td>${b.VesselType || ''}</td>
        <td>${b.Length || ''}</td>
        <td>${b.Width || ''}</td>
        <td>${b.Draft || ''}</td>
        <td>${b.Cargo || ''}</td>
        <td>${b.TransceiverClass || ''}</td>
        <td>
          <button class='btn btn-sm btn-warning' onclick='editBateau(${b.MMSI})'>Modifier</button>
          <button class='btn btn-sm btn-danger' onclick='deleteBateau(${b.MMSI})'>Supprimer</button>
        </td>
      </tr>`;
  });
  
  document.querySelector('#table-bateaux tbody').innerHTML = html || '<tr><td colspan="11" class="text-center">Aucun navire trouvé</td></tr>';
  afficherPagination();
}

// Gestion de la pagination
function afficherPagination() {
  const totalPages = Math.ceil(filteredBateaux.length / rowsPerPage) || 1;
  let html = '';
  
  for (let i = 1; i <= totalPages; i++) {
    html += `<li class="page-item${i === currentPage ? ' active' : ''}">
      <a class="page-link" href="#" onclick="gotoPage(${i});return false;">${i}</a>
    </li>`;
  }
  
  const pagination = document.getElementById('pagination');
  if (pagination) {
    pagination.innerHTML = html;
  }
}

// Fonction de navigation entre les pages
window.gotoPage = function(page) {
  currentPage = page;
  afficherBateaux();
  document.body.scrollTop = document.documentElement.scrollTop = 0;
}

// Gestion de l'ajout d'un bateau
async function handleAddSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const data = {};
  
  // Récupération des données du formulaire
  for (let el of form.elements) {
    if (el.name) data[el.name] = el.value;
  }
  
  try {
    const res = await fetch('api/boats.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const json = await res.json();
    
    if (res.ok && json.success) {
      form.reset();
      showAlert('Navire ajouté avec succès', 'success');
      await chargerBateaux(); // Recharger la liste
    } else {
      throw new Error(json.error || 'Erreur lors de l\'ajout');
    }
  } catch (error) {
    console.error('Erreur:', error);
    showAlert(error.message, 'danger');
  }
}

// Gestion de la suppression d'un bateau
window.deleteBateau = async function(mmsi) {
  if (!mmsi) {
    showAlert('Erreur : MMSI invalide', 'danger');
    return;
  }
  
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce navire ?')) return;
  
  try {
    const res = await fetch('api/boats.php', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ MMSI: mmsi })
    });
    
    const json = await res.json();
    
    if (res.ok && json.success) {
      // Mise à jour des données locales
      allBateaux = allBateaux.filter(b => b.MMSI != mmsi);
      filteredBateaux = filteredBateaux.filter(b => b.MMSI != mmsi);
      
      // Ajustement de la pagination si nécessaire
      const totalPages = Math.ceil(filteredBateaux.length / rowsPerPage);
      if (currentPage > totalPages && totalPages > 0) {
        currentPage = totalPages;
      } else if (totalPages === 0) {
        currentPage = 1;
      }
      
      afficherBateaux();
      showAlert('Navire supprimé avec succès', 'success');
    } else {
      throw new Error(json.error || 'Erreur lors de la suppression');
    }
  } catch (error) {
    console.error('Erreur:', error);
    showAlert(error.message, 'danger');
  }
}

// Gestion de l'édition d'un bateau
window.editBateau = function(mmsi) {
  const bateau = allBateaux.find(b => b.MMSI == mmsi);
  if (!bateau) return;
  
  // Remplissage du formulaire
  document.getElementById('edit-MMSI').value = bateau.MMSI;
  document.getElementById('edit-MMSI-view').value = bateau.MMSI;
  document.getElementById('edit-IMO').value = bateau.IMO || '';
  document.getElementById('edit-CallSign').value = bateau.CallSign || '';
  document.getElementById('edit-VesselName').value = bateau.VesselName || '';
  document.getElementById('edit-VesselType').value = bateau.VesselType || '';
  document.getElementById('edit-Length').value = bateau.Length || '';
  document.getElementById('edit-Width').value = bateau.Width || '';
  document.getElementById('edit-Draft').value = bateau.Draft || '';
  document.getElementById('edit-Cargo').value = bateau.Cargo || '';
  document.getElementById('edit-TransceiverClass').value = bateau.TransceiverClass || '';
  
  // Affichage de la modale
  $('#editModal').modal('show');
}

// Gestion de la soumission du formulaire d'édition
async function handleEditSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const data = {};
  
  // Récupération des données du formulaire
  for (let el of form.elements) {
    if (el.name) data[el.name] = el.value;
  }
  
  try {
    const res = await fetch('api/boats.php', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const json = await res.json();
    
    if (res.ok && json.success) {
      $('#editModal').modal('hide');
      showAlert('Navire modifié avec succès', 'success');
      await chargerBateaux(); // Recharger la liste
    } else {
      throw new Error(json.error || 'Erreur lors de la modification');
    }
  } catch (error) {
    console.error('Erreur:', error);
    showAlert(error.message, 'danger');
  }
}

// Affichage d'une alerte
function showAlert(message, type = 'info') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show mt-3`;
  alertDiv.role = 'alert';
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
      <span aria-hidden="true">&times;</span>
    </button>
  `;
  
  const container = document.querySelector('.admin-container');
  if (container) {
    container.insertBefore(alertDiv, container.firstChild);
    
    // Suppression automatique après 5 secondes
    setTimeout(() => {
      const alert = document.querySelector('.alert');
      if (alert) alert.remove();
    }, 5000);
  }
}
