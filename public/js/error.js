// Páginas 404 y 500: idioma del cliente y botón "Intentar de nuevo"
(function () {
  const params = new URLSearchParams(location.search);
  let idioma = params.get('lang');
  if (!idioma) { try { idioma = localStorage.getItem('idioma-sunshine'); } catch {} }
  if (!idioma) idioma = (navigator.language || 'es').toLowerCase().startsWith('es') ? 'es' : 'en';
  if (idioma !== 'en') idioma = 'es';

  const boton = document.getElementById('cambiar-idioma');
  const q = document.getElementById('q');
  function mostrar() {
    document.documentElement.lang = idioma;
    document.querySelectorAll('[data-idioma]').forEach((el) => { el.hidden = el.dataset.idioma !== idioma; });
    boton.textContent = idioma === 'es' ? 'EN' : 'ES';
    boton.setAttribute('aria-label', idioma === 'es' ? 'English' : 'Español');
    if (q) {
      q.placeholder = idioma === 'en' ? q.dataset.placeholderEn : 'Ej. licuadora, mochila, audífonos…';
      q.setAttribute('aria-label', idioma === 'en' ? 'Search the store' : 'Busca en la tienda');
    }
    document.title = (idioma === 'en'
      ? (document.querySelector('.codigo-error')?.textContent === '404' ? 'Page not found' : 'Something went wrong')
      : (document.querySelector('.codigo-error')?.textContent === '404' ? 'Página no encontrada' : 'Algo salió mal')) + ' — Sun Shine';
  }
  boton.addEventListener('click', () => { idioma = idioma === 'es' ? 'en' : 'es'; mostrar(); });

  // "Intentar de nuevo" recarga la misma dirección
  const reintentar = document.getElementById('reintentar');
  if (reintentar) {
    reintentar.href = location.href;
    reintentar.addEventListener('click', (e) => { e.preventDefault(); location.reload(); });
  }
  mostrar();
})();
