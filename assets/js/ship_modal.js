// Gestion du bouton "Ajouter un navire" et de la modale associée

document.addEventListener('DOMContentLoaded', () => {
  const addShipBtn = document.getElementById('addShipBtn');
  if (addShipBtn) {
    addShipBtn.addEventListener('click', openShipModal);
  }

  const shipModalForm = document.getElementById('shipModalForm');
  if (shipModalForm) {
    shipModalForm.addEventListener('submit', handleShipModalSubmit);
  }
});

// Ouvre la modale d'ajout de navire
function openShipModal() {
  const modal = $('#shipModal');
  const form = document.getElementById('shipModalForm');
  if (form) {
    form.reset();
    form.classList.remove('was-validated');
  }
  modal.modal('show');
}

// Soumission du formulaire dans la modale
async function handleShipModalSubmit(e) {
  e.preventDefault();
  const form = e.target;

  if (!form.checkValidity()) {
    e.stopPropagation();
    form.classList.add('was-validated');
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn ? submitBtn.innerHTML : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Traitement...';
  }

  const data = Object.fromEntries(new FormData(form).entries());

  try {
    const res = await fetch('api/boats.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();

    if (res.ok && json.success) {
      $('#shipModal').modal('hide');
      if (typeof showAlert === 'function') {
        showAlert('Navire ajouté avec succès', 'success');
      }
      if (typeof chargerBateaux === 'function') {
        await chargerBateaux();
      }
    } else {
      throw new Error(json.error || 'Erreur lors de l\'ajout');
    }
  } catch (err) {
    console.error('Erreur:', err);
    if (typeof showAlert === 'function') {
      showAlert(err.message, 'danger');
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  }
}
