// clusters.js: affiche les clusters sur une carte

mapboxgl.accessToken = 'pk.eyJ1IjoiYWdhcmZpZWxkIiwiYSI6ImNtYnl4aXplMzAzY2Yya3NmcDRmNWV5OHcifQ.sPwU0gRwpupXyXkDIVvoRQ';

async function fetchJSON(url){
  const res = await fetch(url);
  return res.json();
}

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v11',
  center: [0,0],
  zoom: 2
});

const COLORS = ['#e6194b','#3cb44b','#ffe119','#4363d8','#f58231','#911eb4','#46f0f0','#f032e6'];

(async()=>{
  let data = await fetchJSON('api/predict_cluster.php');
  if(typeof data === 'string'){
    try{data = JSON.parse(data);}catch(e){console.error('Invalid JSON',data);return;}
  }
  if(!Array.isArray(data)){console.error('Unexpected data',data);return;}
  const bounds = new mapboxgl.LngLatBounds();
  data.forEach(b=>{
    const color = COLORS[b.cluster % COLORS.length];
    const el = document.createElement('div');
    el.style.width='8px';
    el.style.height='8px';
    el.style.borderRadius='50%';
    el.style.backgroundColor=color;
    const marker = new mapboxgl.Marker(el)
      .setLngLat([b.lon, b.lat])
      .setPopup(new mapboxgl.Popup({offset:8})
        .setHTML(`Cluster: ${b.cluster}<br>`+
                 `MMSI: ${b.MMSI}<br>`+
                 `Horodatage: ${new Date(b.ts*1000).toLocaleString('fr-FR')}<br>`+
                 `Lat: ${b.lat.toFixed(5)} Lon: ${b.lon.toFixed(5)}<br>`+
                 `SOG: ${b.SOG} kn<br>`+
                 `COG: ${b.COG}°  Heading: ${b.heading}°<br>`+
                 `Nom: ${b.name || ''}<br>`+

                 `Longueur: ${b.Length||''} m  Largeur: ${b.Width||''} m  Tirant: ${b.Draft||''} m`));
    marker.addTo(map);
    bounds.extend([b.lon, b.lat]);
  });
  if(data.length) map.fitBounds(bounds,{padding:50});

  // Légende des clusters
  const legend = document.getElementById('legend');
  if(legend){
    legend.innerHTML='';
    const uniques=[...new Set(data.map(x=>x.cluster))].sort((a,b)=>a-b);
    uniques.forEach(c=>{
      const color=COLORS[c % COLORS.length];
      const item=document.createElement('div');
      item.className='legend-item d-flex align-items-center mr-3 mb-1';
      item.innerHTML=`<span class="legend-color" style="background:${color}"></span>Cluster ${c}`;
      legend.appendChild(item);
    });
  }
})();
