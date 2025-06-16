// map.js: dashboard interactions (table + Mapbox)

mapboxgl.accessToken = 'pk.eyJ1IjoiYWdhcmZpZWxkIiwiYSI6ImNtYnl4aXplMzAzY2Yya3NmcDRmNWV5OHcifQ.sPwU0gRwpupXyXkDIVvoRQ';

let selectedShipId = null;

async function fetchJSON(url) {
  const res = await fetch(url);
  return res.json();
}

async function loadShips() {
  const ships = await fetchJSON('api/boats.php');
  const tbody = ships.map(s => `<tr data-id="${s.id_bateau}"><td>${s.VesselName}</td><td>${s.MMSI}</td></tr>`).join('');
  document.getElementById('shipsTable').innerHTML = `<thead><tr><th>Nom</th><th>MMSI</th></tr></thead><tbody>${tbody}</tbody>`;
  document.querySelectorAll('#shipsTable tbody tr').forEach(tr => tr.addEventListener('click', () => {
      selectedShipId = tr.dataset.id;
      document.querySelectorAll('#shipsTable tr').forEach(r=>r.classList.remove('table-primary'));
      tr.classList.add('table-primary');
      loadPositions(selectedShipId);
      document.getElementById('btnType').disabled = false;
      document.getElementById('btnRoute').disabled = false;
  }));
}

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v11',
  center: [0,0],
  zoom: 2
});

async function loadPositions(id) {
  const pos = await fetchJSON('api/positions.php?id_bateau=' + id);
  if (!pos.length) return;
  // trace sur la carte
  const coords = pos.map(p => [p.LON, p.LAT]);
  // ajuster la vue
  const bounds = coords.reduce((b, c) => b.extend(c), new mapboxgl.LngLatBounds(coords[0], coords[0]));
  map.fitBounds(bounds, {padding: 20});

  if (map.getSource('route')) map.removeLayer('route') || map.removeSource('route');

  map.addSource('route', {
    'type': 'geojson',
    'data': {
      'type': 'Feature',
      'properties': {},
      'geometry': {
        'type': 'LineString',
        'coordinates': coords
      }
    }
  });
  map.addLayer({
    'id': 'route',
    'type': 'line',
    'source': 'route',
    'paint': {
      'line-color': '#ff7e5f',
      'line-width': 4
    }
  });
}

// Boutons prédictions

document.getElementById('btnCluster').addEventListener('click', () => {
  window.location.href = 'clusters.html';
});

document.getElementById('btnType').addEventListener('click', () => {
  if (!selectedShipId) return;
  window.location.href = 'predict.html?mode=type&id=' + selectedShipId;
});

document.getElementById('btnRoute').addEventListener('click', () => {
  if (!selectedShipId) return;
  window.location.href = 'predict.html?mode=route&id=' + selectedShipId;
});

loadShips();
