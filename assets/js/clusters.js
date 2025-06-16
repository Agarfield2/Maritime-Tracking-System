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
  const data = await fetchJSON('api/predict_cluster.php');
  // data: [{id_bateau, lat, lon, cluster}]
  data.forEach(b=>{
    const color = COLORS[b.cluster % COLORS.length];
    new mapboxgl.Marker({color}).setLngLat([b.lon, b.lat]).setPopup(new mapboxgl.Popup().setText(`Bateau #${b.id_bateau}\nCluster ${b.cluster}`)).addTo(map);
  });
})();
