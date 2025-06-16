// ships.js: gère l'ajout d'un navire ou les actions liées

async function postJSON(url, data) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

// formulaire d'ajout
const form = document.getElementById('shipForm');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(form));
    const resp = await postJSON('api/boats.php', body);
    if (resp.success) {
      alert('Navire ajouté');
      form.reset();
    } else {
      alert('Erreur: ' + resp.error);
    }
  });
}
