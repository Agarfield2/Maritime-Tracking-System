// predict.js (recréé)
// Affiche la trajectoire réelle d'un navire et une trajectoire prédite fixe (temporaire)
// Utilisation : predict.html?id=<id_bateau>

mapboxgl.accessToken = 'pk.eyJ1IjoiYWdhcmZpZWxkIiwiYSI6ImNtYnl4aXplMzAzY2Yya3NmcDRmNWV5OHcifQ.sPwU0gRwpupXyXkDIVvoRQ';

function getQuery() {
    return Object.fromEntries(new URLSearchParams(window.location.search));
}

async function fetchJSON(url) {
    const res = await fetch(url);
    let data = null;
    try {
        data = await res.json();
    } catch (_) {
        // not JSON
    }
    if (!res.ok) {
        const msg = data && data.error ? data.error : `HTTP ${res.status}`;
        const details = data && data.details ? JSON.stringify(data.details) : '';
        throw new Error(msg + (details ? ' – ' + details : ''));
    }
    return data;
}

(async () => {
    const { id, mode } = getQuery();
    const predictionMode = mode === 'type' ? 'type' : 'route'; 
    const result = document.getElementById('result');
    const shipDiv = document.getElementById('shipInfo');
    if (!id) { result.textContent = 'Paramètre id manquant'; return; }

    // Récupère les infos du navire et le MMSI
    let mmsi = null;
    try {
        const ships = await fetchJSON('api/boats.php');
        const boat = ships.find(b => b.id_bateau == id);
        if (boat) {
            mmsi = boat.MMSI;
            shipDiv.textContent = `${boat.VesselName || 'Navire inconnu'} – MMSI ${mmsi || '?'}`;
        } else {
            console.warn('Aucun navire trouvé avec l\'ID:', id);
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des informations du navire:', error);
    }

    if(predictionMode==='route')
        result.innerHTML = '<h4>Chargement des trajectoires...</h4>';
    else
        result.innerHTML = '<h4>Chargement...</h4>';
    if(predictionMode==='route')
        document.getElementById('map').classList.remove('d-none');

    // --- HORIZON buttons setup ---
    if(predictionMode==='route'){
        // Récupère ou crée dynamiquement le conteneur de boutons
        let btnGrp = document.getElementById('horizonBtns');
        if(!btnGrp){
            btnGrp = document.createElement('div');
            btnGrp.id = 'horizonBtns';
            btnGrp.className = 'mb-2';
            // Insère avant la carte si possible sinon en haut du body
            const mapElem = document.getElementById('map');
            if(mapElem && mapElem.parentNode){
                mapElem.parentNode.insertBefore(btnGrp, mapElem);
            }else{
                document.body.insertBefore(btnGrp, document.body.firstChild);
            }
        }
        const horizons=[{h:5,color:'primary'},{h:10,color:'warning'},{h:15,color:'danger'}];
        btnGrp.innerHTML='';
        horizons.forEach(({h,color})=>{
            const b=document.createElement('button');
            b.className=`btn btn-${color} mr-2`;
            b.textContent=`${h} min`;
            b.addEventListener('click',()=>loadHorizon(h));
            btnGrp.appendChild(b);
        });
    }

    async function waitForMapReady() {
        if (!window._predMap) return;
        
        if (!window._predMap.isStyleLoaded()) {
            return new Promise((resolve) => {
                window._predMap.once('load', resolve);
            });
        }
        return Promise.resolve();
    }

    async function loadHorizon(h) {
        // Affiche l'indicateur de chargement
        const loadingHtml = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>Calcul de la prédiction ${h}min en cours...</p>
                <small class="text-muted">Cela peut prendre 10-15 secondes</small>
            </div>`;
            
        result.innerHTML = loadingHtml;
        
        // Désactive les boutons pendant le chargement
        const buttons = document.querySelectorAll('#horizonBtns button');
        buttons.forEach(btn => btn.disabled = true);
        
        try {
            const startTime = Date.now();
            
            if (!mmsi) {
                throw new Error('Impossible de récupérer le MMSI du navire');
            }
            
            // Attend que la carte soit prête
            await waitForMapReady();
            
            // Ajoute un timestamp pour éviter le cache
            const data = await fetchJSON(`api/predict_horizon.php?mmsi=${mmsi}&horizon=${h}&_=${Date.now()}`);
            const duration = (Date.now() - startTime) / 1000;
            
            if (!data.predictions || data.predictions.length === 0) {
                throw new Error('Aucune prédiction retournée');
            }
            
            // Dessine la prédiction sur la carte
            await drawPrediction(data.predictions, h);
            
            // Affiche le message de succès
            result.innerHTML = `
                <div class="alert alert-success">
                    <h4 class="alert-heading">Prédiction chargée</h4>
                    <p>Horizon: ${h} minutes | Points: ${data.predictions.length} | Durée: ${duration.toFixed(1)}s</p>
                </div>`;
                
        } catch (error) {
            console.error('Erreur lors du chargement:', error);
            
            // Affiche un message d'erreur détaillé
            const errorMessage = error.message || 'Voir la console pour plus de détails';
            result.innerHTML = `
                <div class="alert alert-danger">
                    <h4 class="alert-heading">Erreur lors du chargement</h4>
                    <p>${errorMessage}</p>
                    <hr>
                    <p class="mb-0">Veuillez réessayer ou contacter le support si le problème persiste.</p>
                </div>`;
                
            // Affiche plus de détails en mode développement
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.error('Détails de l\'erreur:', {
                    error: error,
                    stack: error.stack,
                    response: error.response
                });
            }
        } finally {
            // Réactive les boutons
            buttons.forEach(btn => btn.disabled = false);
        }
    }

    async function drawPrediction(points, h) {
        // Initialise la carte si ce n'est pas fait
        let mapElem = document.getElementById('map');
        if (mapElem.classList.contains('d-none')) mapElem.classList.remove('d-none');
        
        // Couleurs pour chaque horizon
        const colors = {
            5: '#007bff',  // Bleu
            10: '#fd7e14', // Orange
            15: '#dc3545'  // Rouge
        };
        
        // Crée la carte si elle n'existe pas
        if (!window._predMap) {
            window._predMap = new mapboxgl.Map({
                container: 'map',
                style: 'mapbox://styles/mapbox/streets-v11',
                center: [points[0].lon, points[0].lat],
                zoom: 10,
                attributionControl: false
            });
            
            // Ajoute les contrôles de navigation
            window._predMap.addControl(new mapboxgl.NavigationControl(), 'top-right');
            
            // Ajoute l'échelle
            window._predMap.addControl(new mapboxgl.ScaleControl({
                maxWidth: 100,
                unit: 'metric'
            }));
            
            // Attend que la carte soit complètement chargée
            await new Promise((resolve) => {
                window._predMap.once('load', resolve);
            });
            
            // Charge le trajet réel si disponible
            await loadRealRoute();
        } else {
            // Si la carte existe déjà, on s'assure qu'elle est chargée
            await waitForMapReady();
        }
        
        const map = window._predMap;
        const coords = points.map(p => [p.lon, p.lat]);
        const srcId = 'pred' + h;
        
        // Supprime la couche existante si elle existe
        if (map.getLayer(srcId)) map.removeLayer(srcId);
        if (map.getSource(srcId)) map.removeSource(srcId);
        
        // Ajoute la source et la couche pour cette prédiction
        map.addSource(srcId, {
            type: 'geojson',
            data: {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: coords
                }
            }
        });
        
        map.addLayer({
            id: srcId,
            type: 'line',
            source: srcId,
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': colors[h] || '#000000',
                'line-width': 4,
                'line-opacity': 0.8
            }
        });
        
        // Ajuste la vue pour voir toute la trajectoire
        const bounds = coords.reduce((bounds, coord) => {
            return bounds.extend(coord);
        }, new mapboxgl.LngLatBounds(coords[0], coords[0]));
        
        // Si on a un trajet réel, on l'inclut dans les limites
        if (window._realRouteBounds) {
            bounds.extend(window._realRouteBounds.getNorthWest());
            bounds.extend(window._realRouteBounds.getSouthEast());
        }
        
        map.fitBounds(bounds, {
            padding: 50,
            maxZoom: 15
        });
        
        // Ajoute un marqueur au point de départ
        if (map.getLayer('start-point')) map.removeLayer('start-point');
        if (map.getSource('start-point')) map.removeSource('start-point');
        
        map.addSource('start-point', {
            type: 'geojson',
            data: {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: coords[0]
                },
                properties: {
                    title: 'Départ',
                    description: 'Point de départ de la prédiction'
                }
            }
        });
        
        map.addLayer({
            id: 'start-point',
            type: 'circle',
            source: 'start-point',
            paint: {
                'circle-radius': 8,
                'circle-color': colors[h] || '#000000',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff'
            }
        });
    }

    // Charge le trajet réel
    async function loadRealRoute() {
        if (!window._predMap) return;
        
        // Attend que la carte soit complètement chargée
        if (!window._predMap.isStyleLoaded()) {
            return new Promise((resolve) => {
                window._predMap.once('load', () => {
                    loadRealRoute().then(resolve);
                });
            });
        }
        
        try {
            const response = await fetch(`api/route.php?id=${id}`);
            const data = await response.json();
            
            if (!data || !data.coordinates || data.coordinates.length < 2) return;
            
            const coords = data.coordinates.map(coord => [coord.lon, coord.lat]);
            
            // Stocke les limites du trajet réel pour le zoom
            window._realRouteBounds = coords.reduce((bounds, coord) => {
                return bounds.extend(coord);
            }, new mapboxgl.LngLatBounds(coords[0], coords[0]));
            
            // Fonction pour ajouter ou mettre à jour la source et la couche
            const updateRealRoute = () => {
                if (!window._predMap) return;
                
                try {
                    if (window._predMap.getSource('real-route')) {
                        window._predMap.getSource('real-route').setData({
                            type: 'Feature',
                            geometry: {
                                type: 'LineString',
                                coordinates: coords
                            }
                        });
                    } else {
                        window._predMap.addSource('real-route', {
                            type: 'geojson',
                            data: {
                                type: 'Feature',
                                geometry: {
                                    type: 'LineString',
                                    coordinates: coords
                                }
                            }
                        });
                        
                        window._predMap.addLayer({
                            id: 'real-route',
                            type: 'line',
                            source: 'real-route',
                            layout: {
                                'line-join': 'round',
                                'line-cap': 'round'
                            },
                            paint: {
                                'line-color': '#555',
                                'line-width': 2,
                                'line-dasharray': [2, 2]
                            }
                        });
                    }
                } catch (e) {
                    console.error('Erreur lors de la mise à jour du trajet réel:', e);
                }
            };
            
            // Si la carte est prête, on met à jour immédiatement
            if (window._predMap.isStyleLoaded()) {
                updateRealRoute();
            } else {
                // Sinon, on attend qu'elle soit prête
                window._predMap.once('load', updateRealRoute);
            }
            
        } catch (error) {
            console.error('Erreur lors du chargement du trajet réel:', error);
        }
    }
    
    // --- TYPE prediction branch ---
    if(predictionMode==='type'){
        try{
            // Récupère les dernières positions pour extraire les caractéristiques nécessaires
            const positions = await fetchJSON(`api/positions.php?id_bateau=${id}`);
            if(!Array.isArray(positions) || positions.length===0){
                throw new Error('Aucune donnée de position disponible');
            }
            const last = positions[positions.length-1];
            const urlParams = new URLSearchParams({
                SOG: last.SOG,
                COG: last.COG,
                Heading: last.Heading ?? last.heading ?? 0,
                Length: last.Length,
                Width: last.Width,
                Draft: last.Draft
            });
            const typeResp = await fetchJSON(`api/predict_type.php?${urlParams.toString()}`);
            let predictedType = typeResp.type ?? 'Inconnu';
            // Map AIS codes 60,70,80 → Passager, Cargo, Tanker
            const aisMap = { '60':'Passager', '70':'Cargo', '80':'Tanker' };
            if(typeof predictedType === 'number' || /^[0-9]+$/.test(predictedType)){
                predictedType = aisMap[String(predictedType)] || predictedType;
            }
            result.innerHTML = `<h4>Type prédit : <span class="badge badge-info">${predictedType}</span></h4>`;
        }catch(err){
            console.error(err);
            result.innerHTML='<p class="text-danger">Erreur lors de la prédiction du type</p>';
            return;
        }
        document.getElementById('title').textContent=`Prédiction du type pour le navire #${id}`;
        return;
    }

    // --- ROUTE prediction branch ---
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
