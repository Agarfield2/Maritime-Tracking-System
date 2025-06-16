// map.js: dashboard interactions (table + Mapbox)

mapboxgl.accessToken = 'pk.eyJ1IjoiYWdhcmZpZWxkIiwiYSI6ImNtYnl4aXplMzAzY2Yya3NmcDRmNWV5OHcifQ.sPwU0gRwpupXyXkDIVvoRQ';

let selectedShipId = null;
let allShips = [];
let currentPage = 1;
const ROWS_PER_PAGE = 10;
let searchTerm = '';
let positionsClickAdded=false;

async function fetchJSON(url) {
  const res = await fetch(url);
  return res.json();
}

async function loadShips() {
  allShips = await fetchJSON('api/boats.php');
  const searchInput = document.getElementById('shipSearch');
  if(searchInput){
    const sugg=document.getElementById('searchSuggestions');
    searchInput.addEventListener('input', e=>{
      searchTerm=e.target.value.toLowerCase();currentPage=1;renderShips();
      // suggestions
      sugg.innerHTML='';
      if(searchTerm.length){
        const matches=allShips.filter(s=>{
          const name=String(s.VesselName||'').toLowerCase();
          const mmsi=String(s.MMSI||'');
          return name.includes(searchTerm)||mmsi.includes(searchTerm);
        }).slice(0,3);
        matches.forEach(m=>{
          const a=document.createElement('a');a.href='#';a.className='list-group-item list-group-item-action py-1 px-2 small';a.textContent=`${m.VesselName} (${m.MMSI})`;
          a.addEventListener('click',ev=>{ev.preventDefault();searchInput.value=m.VesselName;searchTerm=m.VesselName.toLowerCase();sugg.innerHTML='';currentPage=1;renderShips();});
          sugg.appendChild(a);
        });
      }
    });
    document.addEventListener('click',e=>{if(!searchInput.contains(e.target)) sugg.innerHTML='';});
  }
  renderShips();
}

function renderShips(){
  const tbodyEl = document.getElementById('shipsTable');
  if(!tbodyEl) return;
  const filtered = allShips.filter(s=>{
    const name=String(s.VesselName||'').toLowerCase();
    const mmsi=String(s.MMSI||'');
    return name.includes(searchTerm)||mmsi.includes(searchTerm);
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  if(currentPage>totalPages) currentPage=totalPages;
  const start = (currentPage-1)*ROWS_PER_PAGE;
  const pageShips = filtered.slice(start, start+ROWS_PER_PAGE);
  const rows = pageShips.map(s=>`<tr data-id="${s.id_bateau}"><td>${s.VesselName}</td><td>${s.MMSI}</td></tr>`).join('');
  tbodyEl.innerHTML = `<thead><tr><th>Nom</th><th>MMSI</th></tr></thead><tbody>${rows}</tbody>`;
  document.querySelectorAll('#shipsTable tbody tr').forEach(tr=>tr.addEventListener('click', ()=>{
    selectedShipId = tr.dataset.id;
    document.querySelectorAll('#shipsTable tr').forEach(r=>r.classList.remove('table-primary'));
    tr.classList.add('table-primary');
    loadPositions(selectedShipId);
    const bt=document.getElementById('btnType'); if(bt) bt.disabled=false;
    const br=document.getElementById('btnRoute'); if(br) br.disabled=false;
  }));
  buildPagination(totalPages);
}

function buildPagination(totalPages){
  const pagEl=document.getElementById('pagination');
  if(!pagEl) return;
  pagEl.innerHTML='';
  const addPage=(label,page,disabled=false,active=false)=>{
    const li=document.createElement('li');
    li.className='page-item'+(disabled?' disabled':'')+(active?' active':'');
    const a=document.createElement('a');a.className='page-link';a.href='#';a.textContent=label;li.appendChild(a);
    if(!disabled){li.addEventListener('click',e=>{e.preventDefault();currentPage=page;renderShips();});}
    pagEl.appendChild(li);
  };
  addPage('«',currentPage-1,currentPage===1);
  for(let p=1;p<=totalPages;p++) addPage(p,p,false,p===currentPage);
  addPage('»',currentPage+1,currentPage===totalPages);
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

  // ---- trace ligne ----
  const geo = {
    'type': 'Feature',
    'properties': {},
    'geometry': { 'type': 'LineString', 'coordinates': coords }
  };
  if (map.getSource('route')) {
    map.getSource('route').setData(geo);
  } else {
    map.addSource('route', { type: 'geojson', data: geo });
    map.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      paint: { 'line-color': '#ff7e5f', 'line-width': 4 }
    });
  }

  // ---- points (circle layer) ----
  const pointsGeo={
    type:'FeatureCollection',
    features: pos.map(p=>({type:'Feature',geometry:{type:'Point',coordinates:[p.LON,p.LAT]},properties:{json:JSON.stringify(p)}}))
  };
  if(map.getSource('positions')){
    map.getSource('positions').setData(pointsGeo);
  } else {
    map.addSource('positions',{type:'geojson',data:pointsGeo});
    map.addLayer({id:'positions',type:'circle',source:'positions',paint:{'circle-color':'#ff8800','circle-radius':4,'circle-stroke-width':0}});
  }
  if(!positionsClickAdded){
    positionsClickAdded=true;
    map.on('click','positions',e=>{
      const data=JSON.parse(e.features[0].properties.json);
      new mapboxgl.Popup({offset:10})
        .setLngLat(e.lngLat)
        .setHTML(buildPopup(data))
        .addTo(map);
    });
  }
}

function buildPopup(p){
  const date=new Date(p.BaseDateTime || p.timestamp || p.date || '').toLocaleString('fr-FR');
  return `
    <div style="font-size:0.85rem">
      <strong>MMSI:</strong> ${p.MMSI || ''}<br>
      <strong>Horodatage:</strong> ${date}<br>
      <strong>Lat/Lon:</strong> ${p.LAT}, ${p.LON}<br>
      <strong>SOG:</strong> ${p.SOG || ''} kn<br>
      <strong>COG:</strong> ${p.COG || ''}° – Cap réel: ${p.Heading || ''}°<br>
      <strong>Nom:</strong> ${p.VesselName || ''}<br>
      <strong>État:</strong> ${p.Etat || ''}<br>
      <strong>Dim:</strong> L=${p.Length || ''} m, l=${p.Width || ''} m, Tirant=${p.Draft || ''} m
    </div>`;
}

// (Boutons prédictions supprimés)

loadShips();
