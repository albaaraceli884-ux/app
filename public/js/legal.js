// Muestra el aviso en el idioma del cliente (?lang=en o el que eligió en la tienda)
(function () {
  const params = new URLSearchParams(location.search);
  let idioma = params.get('lang');
  if (!idioma) { try { idioma = localStorage.getItem('idioma-sunshine'); } catch {} }
  if (idioma !== 'en') idioma = 'es';
  const boton = document.getElementById('cambiar-idioma');
  function mostrar() {
    document.documentElement.lang = idioma;
    document.querySelectorAll('[data-idioma]').forEach((el) => { el.hidden = el.dataset.idioma !== idioma; });
    boton.textContent = idioma === 'es' ? 'EN' : 'ES';
    boton.setAttribute('aria-label', idioma === 'es' ? 'English' : 'Español');
  }
  boton.addEventListener('click', () => { idioma = idioma === 'es' ? 'en' : 'es'; mostrar(); });
  mostrar();
})();
