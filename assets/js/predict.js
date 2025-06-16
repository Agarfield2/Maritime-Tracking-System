// predict.js: affiche le type ou la trajectoire pour un navire
mapboxgl.accessToken = 'pk.eyJ1IjoiYWdhcmZpZWxkIiwiYSI6ImNtYnl4aXplMzAzY2Yya3NmcDRmNWV5OHcifQ.sPwU0gRwpupXyXkDIVvoRQ';

function getQuery(){
  return Object.fromEntries(new URLSearchParams(window.location.search));
}
async function fetchJSON(url){const r=await fetch(url);return r.json();}

(async()=>{
  const {mode,id}=getQuery();
  if(!mode||!id){document.getElementById('result').textContent='Paramètres manquants';return;}
  document.getElementById('title').textContent= mode==='type'?`Prédiction du type pour le navire #${id}`:`Prédiction de trajectoire pour le navire #${id}`;
  if(mode==='type'){
    const data=await fetchJSON(`api/predict_type.php?id_bateau=${id}`);
    document.getElementById('result').innerHTML=`<h4>Type prédit : ${data.predicted_type||JSON.stringify(data)}</h4>`;
  }else if(mode==='route'){
    const data=await fetchJSON(`api/predict_route.php?id_bateau=${id}`);
    if(data.error){document.getElementById('result').textContent=data.error;return;}
    document.getElementById('result').innerHTML='<h4>Trajectoire prédite (1h)</h4>';
    document.getElementById('map').classList.remove('d-none');
    const map=new mapboxgl.Map({container:'map',style:'mapbox://styles/mapbox/streets-v11',center:[data.predicted_positions[0].lon,data.predicted_positions[0].lat],zoom:5});
    const coords=data.predicted_positions.map(p=>[p.lon,p.lat]);
    map.on('load',()=>{
      map.addSource('route',{type:'geojson',data:{type:'Feature',geometry:{type:'LineString',coordinates:coords}}});
      map.addLayer({id:'route',type:'line',source:'route',paint:{'line-color':'#ff7e5f','line-width':4}});
      map.fitBounds(coords.reduce((b,c)=>b.extend(c),new mapboxgl.LngLatBounds(coords[0],coords[0])),{padding:20});
    });
  }
})();
