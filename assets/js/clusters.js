// clusters.js: affiche les clusters sur une carte

if (typeof mapboxgl !== 'undefined') {
  mapboxgl.accessToken = 'pk.eyJ1IjoiYWdhcmZpZWxkIiwiYSI6ImNtYnl4aXplMzAzY2Yya3NmcDRmNWV5OHcifQ.sPwU0gRwpupXyXkDIVvoRQ';
} else {
  console.warn('Mapbox GL JS n\'est pas chargé, clusters.js ne sera pas exécuté.');
}

let map;
const COLORS = ['#e6194b','#3cb44b','#ffe119','#4363d8','#f58231','#911eb4','#46f0f0','#f032e6'];
let markers = [];

// Fonction pour récupérer les données JSON
async function fetchJSON(url) {
    const res = await fetch(url);
    return res.json();
}

// Fonction pour initialiser la carte
function initMap() {
    if (typeof mapboxgl === 'undefined') return;
    if (map) return;
    
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [0, 0],
        zoom: 2
    });
    
    // Ajoute les contrôles de navigation
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
}

// Fonction pour effacer tous les marqueurs
function clearMarkers() {
    markers.forEach(marker => marker.remove());
    markers = [];
    
    // Efface la légende
    const legend = document.getElementById('legend');
    if (legend) legend.innerHTML = '';
}

// Fonction pour charger et afficher les clusters
async function loadClusters() {
    // Bouton calcul clusters
    const refreshBtn = document.getElementById('refresh-clusters');
    let originalBtnHTML;
    try {
        // Désactive le bouton et affiche un spinner
        if (refreshBtn) {
            originalBtnHTML = refreshBtn.innerHTML;
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Calcul en cours...';
        }
        // Affiche un indicateur de chargement
        const loadingDiv = document.getElementById('loading');
        if (loadingDiv) {
            loadingDiv.style.display = 'block';
            loadingDiv.textContent = 'Calcul des clusters en cours...';
        }
        
        // Efface les marqueurs existants
        clearMarkers();
        
        // Récupère les données des clusters
        let data = await fetchJSON('api/predict_cluster.php');
        
        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch (e) {
                console.error('Invalid JSON', data);
                throw new Error('Erreur lors de l\'analyse des données');
            }
        }
        
        if (!Array.isArray(data)) {
            console.error('Unexpected data', data);
            throw new Error('Format de données inattendu');
        }
        
        if (data.length === 0) {
            throw new Error('Aucune donnée de cluster disponible');
        }
        
        const bounds = new mapboxgl.LngLatBounds();
        
        // Ajoute chaque marqueur
        data.forEach(b => {
            const color = COLORS[b.cluster % COLORS.length];
            const el = document.createElement('div');
            el.style.width = '8px';
            el.style.height = '8px';
            el.style.borderRadius = '50%';
            el.style.backgroundColor = color;
            
            const marker = new mapboxgl.Marker(el)
                .setLngLat([b.lon, b.lat])
                .setPopup(new mapboxgl.Popup({ offset: 8 })
                    .setHTML(`Cluster: ${b.cluster}<br>` +
                             `MMSI: ${b.MMSI}<br>` +
                             `Horodatage: ${new Date(b.ts * 1000).toLocaleString('fr-FR')}<br>` +
                             `Lat: ${b.lat.toFixed(5)} Lon: ${b.lon.toFixed(5)}<br>` +
                             `SOG: ${b.SOG} kn<br>` +
                             `COG: ${b.COG}°  Heading: ${b.heading}°<br>` +
                             `Nom: ${b.name || ''}<br>` +
                             `Longueur: ${b.Length || ''} m  Largeur: ${b.Width || ''} m  Tirant: ${b.Draft || ''} m`));
            
            marker.addTo(map);
            markers.push(marker);
            bounds.extend([b.lon, b.lat]);
        });
        
        // Ajuste la vue pour voir tous les marqueurs
        if (data.length) {
            map.fitBounds(bounds, { padding: 50 });
        }
        
        // Met à jour la légende
        updateLegend(data);
        
    } catch (error) {
        console.error('Erreur lors du chargement des clusters:', error);
        alert('Erreur: ' + (error.message || 'Impossible de charger les clusters'));
    } finally {
        // Cache l'indicateur de chargement
        const loadingDiv = document.getElementById('loading');
        if (loadingDiv) loadingDiv.style.display = 'none';
        // Réactive le bouton et restaure son texte
        if (refreshBtn) {
            refreshBtn.disabled = false;
            if (originalBtnHTML) refreshBtn.innerHTML = originalBtnHTML;
        }
    }
}

// Fonction pour mettre à jour la légende
function updateLegend(data) {
    const legend = document.getElementById('legend');
    if (!legend) return;
    
    legend.innerHTML = '';
    const uniques = [...new Set(data.map(x => x.cluster))].sort((a, b) => a - b);
    
    uniques.forEach(c => {
        const color = COLORS[c % COLORS.length];
        const item = document.createElement('div');
        item.className = 'legend-item d-flex align-items-center mr-3 mb-1';
        item.innerHTML = `<span class="legend-color" style="background:${color}"></span>Cluster ${c}`;
        legend.appendChild(item);
    });
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    // Initialise la carte
    initMap();
    
    // Crée le conteneur du bouton avec style
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'text-center mb-4';
    
    // Ajoute un bouton pour rafraîchir les clusters
    const refreshButton = document.createElement('button');
    refreshButton.id = 'refresh-clusters';
    refreshButton.className = 'btn';
    refreshButton.style.background = 'linear-gradient(90deg, #232526 0%, #414345 100%)';
    refreshButton.style.color = '#fff';
    refreshButton.style.border = 'none';
    refreshButton.style.padding = '10px 24px';
    refreshButton.style.borderRadius = '8px';
    refreshButton.style.fontWeight = '500';
    refreshButton.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    refreshButton.style.transition = 'all 0.2s';
    refreshButton.innerHTML = '<i class="fas fa-project-diagram"></i> Calculer les clusters';
    refreshButton.onclick = loadClusters;
    
    // Style au survol
    refreshButton.onmouseover = () => {
        refreshButton.style.background = 'linear-gradient(90deg, #414345 0%, #232526 100%)';
        refreshButton.style.transform = 'translateY(-2px)';
        refreshButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    };
    refreshButton.onmouseout = () => {
        refreshButton.style.background = 'linear-gradient(90deg, #232526 0%, #414345 100%)';
        refreshButton.style.transform = 'translateY(0)';
        refreshButton.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    };
    
    // Ajoute le bouton dans le conteneur
    buttonContainer.appendChild(refreshButton);
    
    // Ajoute le conteneur avant la carte
    const mapContainer = document.getElementById('map');
    if (mapContainer && mapContainer.parentNode) {
        mapContainer.parentNode.insertBefore(buttonContainer, mapContainer);
    }
    

});
