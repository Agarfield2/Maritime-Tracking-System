// predict.js (recréé)
// Affiche la trajectoire réelle d'un navire et une trajectoire prédite fixe (temporaire)
// Utilisation : predict.html?id=<id_bateau>

mapboxgl.accessToken = 'pk.eyJ1IjoiYWdhcmZpZWxkIiwiYSI6ImNtYnl4aXplMzAzY2Yya3NmcDRmNWV5OHcifQ.sPwU0gRwpupXyXkDIVvoRQ';

function getQuery() {
    return Object.fromEntries(new URLSearchParams(window.location.search));
}

async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

(async () => {
    const { id } = getQuery();
    const result = document.getElementById('result');
    const shipDiv = document.getElementById('shipInfo');
    if (!id) { result.textContent = 'Paramètre id manquant'; return; }

    // Infos navire (facultatif)
    try {
        const ships = await fetchJSON('api/boats.php');
        const boat = ships.find(b => b.id_bateau == id);
        if (boat) {
            shipDiv.textContent = `${boat.VesselName || 'Navire inconnu'} – MMSI ${boat.MMSI || '?'}`;
        }
    } catch (_) {}

    result.innerHTML = '<h4>Chargement des trajectoires...</h4>';
    document.getElementById('map').classList.remove('d-none');

    let actual = [];
    try {
        actual = await fetchJSON(`api/positions.php?id_bateau=${id}`);
    } catch (err) {
        result.innerHTML = '<p class="text-danger">Impossible de charger la trajectoire réelle</p>';
        console.error(err);
        return;
    }

    if (actual.length < 2) {
        result.innerHTML = '<p class="text-danger">Trajectoire réelle insuffisante</p>';
        return;
    }

    // Trajectoire prédite TEMPORAIRE : 5 points décalés de +0.2° lat/lon à partir du dernier point réel
    const last = actual[actual.length - 1];
    const predicted = Array.from({ length: 5 }, (_, i) => ({
        lat: last.LAT + 0.2 * (i + 1),
        lon: last.LON + 0.2 * (i + 1)
    }));

    result.innerHTML = '<h4>Trajectoire réelle (noir) vs prédite (bleu)</h4>';

    // Affichage Mapbox
    const center = [actual[0].LON, actual[0].LAT];
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: center,
        zoom: 5
    });

    map.on('load', () => {
        const actualCoords = actual.map(p => [p.LON, p.LAT]);
        map.addSource('actual', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: actualCoords } } });
        map.addLayer({ id: 'actual', type: 'line', source: 'actual', paint: { 'line-color': '#000', 'line-width': 3, 'line-dasharray': [2, 2] } });

        const predCoords = predicted.map(p => [p.lon, p.lat]);
        map.addSource('pred', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: predCoords } } });
        map.addLayer({ id: 'pred', type: 'line', source: 'pred', paint: { 'line-color': '#007bff', 'line-width': 4 } });

        const all = [...actualCoords, ...predCoords];
        const bounds = all.reduce((b, c) => b.extend(c), new mapboxgl.LngLatBounds(all[0], all[0]));
        map.fitBounds(bounds, { padding: 40 });
    });
})();
