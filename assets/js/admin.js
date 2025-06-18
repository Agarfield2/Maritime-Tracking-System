// Variables globales
let allBateaux = [];
let filteredBateaux = [];
let currentPage = 1;
const rowsPerPage = 10;
// Variables pour positions
let posData = [];
let currentPosPage = 1;
const posRowsPerPage = 10;
let posTotal = 0;
// Références globales pour la recherche positions
let posSearchInputEl = null;
let posSearchSuggestionsEl = null;

// Vérifier l'authentification admin
async function checkAdminAuth() {
  try {
    const response = await fetch('api/admin_auth.php', {
      credentials: 'same-origin'
    });
    
    if (!response.ok) {
      // Rediriger vers la page non autorisée si l'utilisateur n'est pas admin
      window.location.href = 'unauthorized.html';
      return false;
    }
    
    const data = await response.json();
    if (!data.authenticated || !data.user.is_admin) {
      window.location.href = 'unauthorized.html';
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la vérification des droits admin:', error);
    window.location.href = 'unauthorized.html';
    return false;
  }
}

// Chargement initial des bateaux
document.addEventListener('DOMContentLoaded', async () => {
  const isAdmin = await checkAdminAuth();
  if (isAdmin) {
    chargerBateaux();
    setupEventListeners();
  }
});

// Configuration des écouteurs d'événements
function setupEventListeners() {
  // Onglets Navires / Positions
  const tabNavireBtn   = document.getElementById('tabNavire');
  const tabPositionBtn = document.getElementById('tabPosition');
  const navireSection  = document.getElementById('navireSection');
  const positionSection = document.getElementById('positionSection');

  if (tabNavireBtn && tabPositionBtn) {
    tabNavireBtn.addEventListener('click', () => {
      tabNavireBtn.classList.replace('btn-outline-primary', 'btn-primary');
      tabPositionBtn.classList.replace('btn-primary', 'btn-outline-primary');
      navireSection.classList.remove('d-none');
      positionSection.classList.add('d-none');
    });

    tabPositionBtn.addEventListener('click', async () => {
      tabPositionBtn.classList.replace('btn-outline-primary', 'btn-primary');
      tabNavireBtn.classList.replace('btn-primary', 'btn-outline-primary');
      navireSection.classList.add('d-none');
      positionSection.classList.remove('d-none');
      // Charger les positions uniquement au premier affichage
      if (!posData.length) {
        await loadPositions(1);
      }
    });
  }
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
  
  // Barre de recherche positions
  posSearchInputEl = document.getElementById('posSearchInput');
  posSearchSuggestionsEl = document.getElementById('posSearchSuggestions');
  if (posSearchInputEl) {
    posSearchInputEl.addEventListener('input', handlePosSearch);
  }
  if (posSearchSuggestionsEl) {
    posSearchSuggestionsEl.addEventListener('mousedown', handlePosSuggestionClick);
  }

  // Bouton Go page
  const posPageGo = document.getElementById('posPageGo');
  const posPageInput = document.getElementById('posPageInput');
  if (posPageGo && posPageInput) {
    posPageGo.addEventListener('click', async ()=>{
      const page = parseInt(posPageInput.value);
      if (page>0 && page<=Math.ceil(posTotal/posRowsPerPage)) {
        await loadPositions(page, currentSearchIdBateau);
      }
    });
  }

  // Pagination positions - délégation de clic
  const posPagination = document.getElementById('posPagination');
  if (posPagination) {
    posPagination.addEventListener('click', async (e) => {
      e.preventDefault();
      const link = e.target.closest('a[data-page]');
      if (!link) return;
      
      const key = link.getAttribute('data-page');
      const totalPages = Math.ceil(posTotal / posRowsPerPage) || 1;
      let page;
      if (key === 'first') page = 1;
      else if (key === 'prev') page = Math.max(1, currentPosPage - 1);
      else if (key === 'next') page = Math.min(totalPages, currentPosPage + 1);
      else if (key === 'last') page = totalPages;
      else page = parseInt(key, 10);

      if (page && page !== currentPosPage) {
        await loadPositions(page, currentSearchIdBateau);
        document.documentElement.scrollTop = 0;
      }
    });
  }

  // Fermeture des suggestions lors d'un clic ailleurs
  document.addEventListener('click', (e) => {
    if (searchSuggestions && e.target !== searchInput) {
      searchSuggestions.innerHTML = '';
    }
  });
}

// ------------------ Recherche positions ------------------
async function handlePosSearch() {
  if (!posSearchSuggestionsEl) return;
  const q = this.value.toLowerCase();
  if (!q) { posSearchSuggestionsEl.innerHTML = ''; return; }
  try {
    const res = await fetch('api/ship_names.php');
    const names = await res.json();
    const matches = names.filter(n => n.name.toLowerCase().includes(q)).slice(0, 6);
    posSearchSuggestionsEl.innerHTML = matches.map(n =>
      `<button type='button' class='list-group-item list-group-item-action' data-id='${n.id}'>${n.name}</button>`
    ).join('');
  } catch (err) { console.error(err); }
}

function handlePosSuggestionClick(e) {
  if (!posSearchInputEl || !posSearchSuggestionsEl) return;
  const btn = e.target.closest('button[data-id]');
  if (btn) {
    const id = btn.getAttribute('data-id');
    posSearchInputEl.value = btn.textContent;
    posSearchSuggestionsEl.innerHTML = '';
    loadPositions(1, id);
  }
}


// ---- handlers actions positions ----
async function handleDeletePosition(e){
  const id = e.currentTarget.getAttribute('data-id');
  if(!confirm('Supprimer cette position ?')) return;
  try{
    const res = await fetch('api/positions_crud.php',{
      method:'DELETE',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({id_position:id})
    });
    const json = await res.json();
    if(json.success){
      showAlert('Position supprimée','success');
      loadPositions(currentPosPage,currentSearchIdBateau);
    }else throw new Error(json.error||'Erreur');
  }catch(err){showAlert(err.message,'danger');console.error(err);}
}

function handleEditPosition(e){
  const id = e.currentTarget.getAttribute('data-id');
  openPositionModal(id);
}

function toDatetimeLocal(sqlDateTime){
  if(!sqlDateTime) return '';
  // sqlDateTime: 'YYYY-MM-DD HH:MM:SS' or 'YYYY-MM-DD'
  return sqlDateTime.replace(' ','T').slice(0,16);
}

function openPositionModal(id=null){
  const modal = $('#posModal');
  const titleEl = modal.find('.modal-title');
  const form = document.getElementById('posModalForm');
  form.reset();
  form.classList.remove('was-validated');
  form.dataset.id = id||'';
  titleEl.text(id? 'Modifier la position':'Ajouter une position');
  // Préremplir navires list
  populateModalShips().then(()=>{
    if(id){
      const pos = posData.find(p=>p.id_position==id);
      if(pos){
        document.getElementById('modalShipInput').value = pos.VesselName;
        document.getElementById('modalDateTime').value = toDatetimeLocal(pos.BaseDateTime);
        document.getElementById('modalLat').value = pos.LAT;
        document.getElementById('modalLon').value = pos.LON;
        document.getElementById('modalSog').value = pos.SOG;
        document.getElementById('modalCog').value = pos.COG;
        document.getElementById('modalHeading').value = pos.Heading;
        // need statut mapping
        document.getElementById('modalStatut').value = pos.id_statut||0;
      }
    }
    modal.modal('show');
  });
}

async function populateModalShips(){
  const dl = document.getElementById('modalShips');
  if(dl.options && dl.options.length>0) return; // already loaded
  const list = await fetch('api/ship_names.php').then(r=>r.json());
  list.forEach(s=>{
    const opt=document.createElement('option');
    opt.value=s.name;
    opt.dataset.id=s.id;
    dl.appendChild(opt);
  });
}

// bouton ajouter
const addPosBtn=document.getElementById('addPosBtn');
addPosBtn && addPosBtn.addEventListener('click',()=>openPositionModal());

// submit modal form
const posModalForm=document.getElementById('posModalForm');
posModalForm && posModalForm.addEventListener('submit',async function(e){
  e.preventDefault();
  if(!this.checkValidity()){
    e.stopPropagation();
    this.classList.add('was-validated');
    return;
  }
  const shipName=document.getElementById('modalShipInput').value.trim();
  const opt=[...document.querySelectorAll('#modalShips option')].find(o=>o.value===shipName);
  if(!opt){
    document.getElementById('modalShipInput').classList.add('is-invalid');
    return;
  }
  let dtVal=document.getElementById('modalDateTime').value;
  // si format sans secondes, ajouter :00 pour normaliser
  if(dtVal && dtVal.length===16){ dtVal += ':00'; }
  const payload={
    id_bateau: opt.dataset.id,
    BaseDateTime: dtVal,
    LAT: parseFloat(document.getElementById('modalLat').value),
    LON: parseFloat(document.getElementById('modalLon').value),
    SOG: parseFloat(document.getElementById('modalSog').value),
    COG: parseFloat(document.getElementById('modalCog').value),
    Heading: parseFloat(document.getElementById('modalHeading').value),
    id_statut: parseInt(document.getElementById('modalStatut').value)
  };
  const id=this.dataset.id;
  let method='POST';
  if(id){
    payload.id_position=id;
    method='PUT';
  }
  try{
    const res=await fetch('api/positions_crud.php',{
      method,
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    const json=await res.json();
    if(json.success){
      $('#posModal').modal('hide');
      showAlert(id?'Position mise à jour':'Position ajoutée','success');
      loadPositions(currentPosPage,currentSearchIdBateau);
    }else throw new Error(json.error||'Erreur');
  }catch(err){showAlert(err.message,'danger');console.error(err);} 
});

// ------------------ POSITIONS ------------------
let currentSearchIdBateau = null;
async function loadPositions(page = 1, id_bateau = null) {
  currentSearchIdBateau = id_bateau;
  try {
    const url = new URL('api/position_pages.php', window.location.origin);
    url.searchParams.set('page', page);
    url.searchParams.set('limit', posRowsPerPage);
    if (id_bateau) url.searchParams.set('id_bateau', id_bateau);
    const res = await fetch(url);
    const json = await res.json();

    posData = json.positions || [];
    posTotal = json.total || 0;
    currentPosPage = page;
    renderPositions();
  } catch (err) {
    console.error('Erreur chargement positions:', err);
    showAlert('Erreur lors du chargement des positions', 'danger');
  }
}


function renderPositions() {
  const tbody = document.querySelector('#positionsTable tbody');
  if (!tbody) return;
  let html = '';
  posData.forEach(p => {
    html += `<tr>
      <td>${p.VesselName || ''}</td>
      <td>${p.BaseDateTime}</td>
      <td>${p.LAT}</td>
      <td>${p.LON}</td>
      <td>${p.SOG}</td>
      <td>${p.COG}</td>
      <td>${p.Heading}</td>
      <td>${p.Statut ?? ''}</td>
      <td>
        <button class='btn btn-sm btn-outline-primary edit-pos' data-id='${p.id_position}' title='Modifier'><i class='fas fa-edit'></i></button>
        <button class='btn btn-sm btn-outline-danger delete-pos' data-id='${p.id_position}' title='Supprimer'><i class='fas fa-trash'></i></button>
      </td>
    </tr>`;
  });
  tbody.innerHTML = html;
  // attacher events
  tbody.querySelectorAll('.delete-pos').forEach(btn=>btn.addEventListener('click', handleDeletePosition));
  tbody.querySelectorAll('.edit-pos').forEach(btn=>btn.addEventListener('click', handleEditPosition));
  renderPosPagination();
  posPageInput && (posPageInput.value = currentPosPage);
}

function renderPosPagination() {
  const totalPages = Math.ceil(posTotal / posRowsPerPage) || 1;
  const ul = document.getElementById('posPagination');
  if (!ul) return;
  ul.innerHTML = `
    <li class="page-item${currentPosPage===1?' disabled':''}"><a class="page-link" href="#" data-page="first">«</a></li>
    <li class="page-item${currentPosPage===1?' disabled':''}"><a class="page-link" href="#" data-page="prev">‹</a></li>
    <li class="page-item disabled"><span class="page-link">${currentPosPage} / ${totalPages}</span></li>
    <li class="page-item${currentPosPage===totalPages?' disabled':''}"><a class="page-link" href="#" data-page="next">›</a></li>
    <li class="page-item${currentPosPage===totalPages?' disabled':''}"><a class="page-link" href="#" data-page="last">»</a></li>`;
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
  document.documentElement.scrollTop = 0;
}
// Gestion de l'ajout d'un bateau
async function handleAddSubmit(e) {
  
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
