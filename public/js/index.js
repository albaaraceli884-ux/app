const $ = (id) => document.getElementById(id);

// ---------- Textos en español e inglés ----------
const T = {
  es: {
    region: 'Región', musica: 'Música', pausar: 'Pausar', miApartado: 'Mi apartado',
    destacados: 'Destacados', reproducir: 'Reproducir', anterior: 'Anterior', siguiente: 'Siguiente',
    ceja: 'Tienda en línea · México · Estados Unidos · Internacional',
    comprarAmazon: 'Comprar en Amazon', verCatalogo: 'Ver catálogo ↓',
    confianza: ['Marcas reconocidas', 'Para todas las edades', 'Pago seguro con Stripe', 'Aparta con anticipo'],
    envios: (n) => `Envíos a ${n} país${n === 1 ? '' : 'es'}`,
    todo: 'Todo', todasEdades: 'Todas las edades', buscar: 'Buscar producto o marca…',
    productos: (n) => `${n} producto${n === 1 ? '' : 's'}`, en: 'en',
    sinResultados: 'No encontramos productos con esa búsqueda.',
    agregar: 'Agregar al carrito', agregado: '✓ Agregado', agregadoAviso: (n) => `✓ ${n} agregado al carrito`,
    verAmazon: 'Ver en Amazon ↗', precioAmazon: 'Precio en Amazon',
    tuCarrito: 'Tu carrito', verOpciones: 'Ver opciones ▴', cerrar: 'Cerrar ▾',
    vacio: 'Aún no agregas nada. Elige un producto para empezar.', vaciar: 'Vaciar carrito',
    pagarTodo: 'Pagar todo', apartarCon: 'Apartar con', abriendo: 'Abriendo pago seguro…',
    notaApartar: (p, resto, dias) => `Pagas ${p}% hoy y liquidas ${resto} en un plazo de ${dias} días, en abonos o de una vez.`,
    notaApartarVacio: (p, dias) => `Aparta con ${p}% de anticipo y liquida en ${dias} días.`,
    notaPago: '🔒 El pago se procesa en Stripe. No guardamos los datos de tu tarjeta. Los productos de Amazon se compran directamente en Amazon.',
    pieStripe: 'Pagos procesados por Stripe', consultarApartado: 'Consultar mi apartado',
    avisoAfiliada: 'Como afiliada de Amazon, Sun Shine obtiene ingresos por las compras adscritas que cumplen los requisitos aplicables.',
    errorCatalogo: 'No se pudo cargar el catálogo. Recarga la página.', errorPago: 'No se pudo iniciar el pago.',
    cambioRegion: (r) => `Mostrando precios para ${r}`,
    saltar: 'Saltar al catálogo', cargando: 'Cargando productos…', privacidad: 'Aviso de privacidad', terminos: 'Términos de uso',
    cookies: 'Guardamos tu carrito, idioma y región en este navegador para que no se pierdan. No usamos cookies de publicidad. PayPal puede usar sus propias cookies al pagar.', entendido: 'Entendido',
    pagarTarjeta: 'Pagar con tarjeta', oPaga: 'o paga con', formaEntrega: 'Forma de entrega', eligeSucursal: 'Sucursal donde recogerás',
    eligeSucursalOpcion: 'Elige una sucursal…', faltaSucursal: 'Elige la sucursal donde recogerás tu pedido.',
    subtotal: 'Subtotal', entregaCorta: 'Entrega', gratis: 'Gratis', dias: (a, b) => `${a}–${b} días hábiles`,
    faltaGratis: (m) => `Te faltan ${m} para envío estándar gratis`, yaGratis: '¡Tu envío estándar a domicilio es gratis!',
    horario: 'Horario', precioTodos: 'Cualquier precio', hasta: (m) => `Hasta ${m}`,
    ordenRec: 'Recomendados', ordenMenor: 'Menor precio', ordenMayor: 'Mayor precio',
    comoComprar: 'Cómo comprar', formasPago: 'Formas de pago', notaFormas: 'Pagas con tarjeta en la página segura de Stripe o con tu cuenta de PayPal.',
    enviosEntregas: 'Envíos y entregas', rastreaTitulo: 'Rastrea tu pedido', rastrear: 'Rastrear mi pedido',
    rastreaTexto: 'Con tu número de pedido (SS-XXXXXX) y tu correo puedes ver si tu pedido ya se envió o está listo para recoger.',
    gratisDesde: (m) => `Envío estándar a domicilio gratis desde ${m}.`, sucursalesTitulo: 'Sucursales autorizadas',
    pasos: ['Elige tus productos por categoría o búsqueda', 'Agrégalos al carrito y revisa cantidades', 'Elige entrega a domicilio o recoger en sucursal', 'Paga con tarjeta, PayPal o aparta con anticipo', 'Recibe tu confirmación y rastrea tu pedido'],
    paypalError: 'No se pudo completar el pago con PayPal. Intenta de nuevo o paga con tarjeta.',
  },
  en: {
    region: 'Region', musica: 'Music', pausar: 'Pause', miApartado: 'My layaway',
    destacados: 'Featured', reproducir: 'Play', anterior: 'Previous', siguiente: 'Next',
    ceja: 'Online store · Mexico · United States · International',
    comprarAmazon: 'Shop on Amazon', verCatalogo: 'Browse catalog ↓',
    confianza: ['Trusted brands', 'For all ages', 'Secure checkout with Stripe', 'Layaway with a deposit'],
    envios: (n) => `Ships to ${n} countr${n === 1 ? 'y' : 'ies'}`,
    todo: 'All', todasEdades: 'All ages', buscar: 'Search products or brands…',
    productos: (n) => `${n} product${n === 1 ? '' : 's'}`, en: 'in',
    sinResultados: 'No products match your search.',
    agregar: 'Add to cart', agregado: '✓ Added', agregadoAviso: (n) => `✓ ${n} added to cart`,
    verAmazon: 'View on Amazon ↗', precioAmazon: 'Price on Amazon',
    tuCarrito: 'Your cart', verOpciones: 'See options ▴', cerrar: 'Close ▾',
    vacio: 'Your cart is empty. Pick a product to get started.', vaciar: 'Empty cart',
    pagarTodo: 'Pay in full', apartarCon: 'Reserve with', abriendo: 'Opening secure checkout…',
    notaApartar: (p, resto, dias) => `Pay ${p}% today and the remaining ${resto} within ${dias} days, in installments or all at once.`,
    notaApartarVacio: (p, dias) => `Reserve with a ${p}% deposit and pay the rest within ${dias} days.`,
    notaPago: '🔒 Payments are processed by Stripe. We never store your card details. Amazon products are bought directly on Amazon.',
    pieStripe: 'Payments processed by Stripe', consultarApartado: 'Check my layaway',
    avisoAfiliada: 'As an Amazon Associate, Sun Shine earns from qualifying purchases.',
    errorCatalogo: 'We could not load the catalog. Please reload the page.', errorPago: 'We could not start the payment.',
    cambioRegion: (r) => `Showing prices for ${r}`,
    saltar: 'Skip to catalog', cargando: 'Loading products…', privacidad: 'Privacy notice', terminos: 'Terms of use',
    cookies: 'We save your cart, language and region in this browser so they are not lost. We do not use advertising cookies. PayPal may use its own cookies when you pay.', entendido: 'Got it',
    pagarTarjeta: 'Pay by card', oPaga: 'or pay with', formaEntrega: 'Delivery method', eligeSucursal: 'Pickup location',
    eligeSucursalOpcion: 'Choose a location…', faltaSucursal: 'Choose the location where you will pick up your order.',
    subtotal: 'Subtotal', entregaCorta: 'Delivery', gratis: 'Free', dias: (a, b) => `${a}–${b} business days`,
    faltaGratis: (m) => `Add ${m} more for free standard shipping`, yaGratis: 'Your standard home delivery is free!',
    horario: 'Hours', precioTodos: 'Any price', hasta: (m) => `Up to ${m}`,
    ordenRec: 'Featured', ordenMenor: 'Price: low to high', ordenMayor: 'Price: high to low',
    comoComprar: 'How to buy', formasPago: 'Payment methods', notaFormas: 'Pay by card on the secure Stripe page or with your PayPal account.',
    enviosEntregas: 'Shipping and pickup', rastreaTitulo: 'Track your order', rastrear: 'Track my order',
    rastreaTexto: 'With your order number (SS-XXXXXX) and email you can see whether your order has shipped or is ready for pickup.',
    gratisDesde: (m) => `Free standard home delivery from ${m}.`, sucursalesTitulo: 'Authorized pickup locations',
    pasos: ['Browse products by category or search', 'Add them to your cart and check quantities', 'Choose home delivery or pickup at a location', 'Pay by card, PayPal or reserve with a deposit', 'Get your confirmation and track your order'],
    paypalError: 'We could not complete the PayPal payment. Try again or pay by card.',
  },
};

// ---------- Región e idioma del cliente ----------
// Se detectan por el idioma y la zona horaria del navegador; el cliente puede cambiarlos.
function detectarRegion() {
  const zona = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  const lengua = (navigator.language || 'es').toLowerCase();
  if (lengua.endsWith('-mx') || /^America\/(Mexico_City|Cancun|Merida|Monterrey|Matamoros|Chihuahua|Ciudad_Juarez|Ojinaga|Mazatlan|Bahia_Banderas|Hermosillo|Tijuana)$/.test(zona)) return 'mx';
  if (lengua === 'en-us' || /^(America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Boise|Puerto_Rico|Indiana\/.+|Kentucky\/.+|North_Dakota\/.+)|Pacific\/Honolulu)$/.test(zona)) return 'us';
  return 'intl';
}
const leer = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const escribir = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

let region = leer('region-sunshine') || detectarRegion();
let idioma = new URLSearchParams(location.search).get('lang') || leer('idioma-sunshine') || ((navigator.language || 'es').toLowerCase().startsWith('es') ? 'es' : 'en');
if (!T[idioma]) idioma = 'es';
const t = (k, ...a) => { const v = T[idioma][k]; return typeof v === 'function' ? v(...a) : v; };
const sinMovimiento = matchMedia('(prefers-reduced-motion: reduce)').matches;

let productos = [];
let negocio = { apartado: null, categorias: [], regiones: [] };
let categoria = 'todos';
let carrito = {}; // { id: cantidad } — se guarda en el navegador
try { carrito = JSON.parse(leer('carrito-sunshine') || '{}') || {}; } catch {}
$('anio').textContent = new Date().getFullYear();

const esc = (x) => String(x ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const regionActual = () => negocio.regiones.find(r => r.id === region) || negocio.regiones[0] || { moneda: 'mxn', bandera: '🇲🇽' };
const formato = (centavos, moneda = regionActual().moneda) =>
  new Intl.NumberFormat(idioma === 'en' ? 'en-US' : 'es-MX', { style: 'currency', currency: moneda.toUpperCase() }).format(centavos / 100);
const guardar = () => escribir('carrito-sunshine', JSON.stringify(carrito));
const enVenta = () => productos.filter(p => p.precio);
const sinAcentos = (x) => String(x).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const nombreCat = (c) => (idioma === 'en' && c.en) || c.nombre;
const nombreEdad = (k) => negocio.edades?.[k]?.[idioma] || '';
const nombreRegion = (r) => (idioma === 'en' ? r.nombre_en : r.nombre);

// ---------- Carga ----------
async function cargarNegocio() {
  negocio = await fetch('/api/negocio').then(r => r.json());
  if (!negocio.regiones.some(r => r.id === region)) region = negocio.regionPredeterminada;
}

async function cargarProductos() {
  productos = await fetch(`/api/productos?region=${encodeURIComponent(region)}&idioma=${idioma}`).then(r => r.json());
  // Quitar del carrito lo que no se vende en esta región
  for (const id of Object.keys(carrito)) if (!enVenta().some(p => p.id === id)) delete carrito[id];
  guardar();
}

async function iniciar() {
  try {
    await cargarNegocio();
    await cargarProductos();
    const h = location.hash.slice(1);
    if (negocio.categorias.some(c => c.id === h)) categoria = h;
    pintarTodo();
  } catch {
    mostrarError(t('errorCatalogo'));
  }
}

function pintarTodo() {
  document.documentElement.lang = idioma;
  document.querySelectorAll('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
  document.querySelectorAll('[data-t-placeholder]').forEach(el => { el.placeholder = t(el.dataset.tPlaceholder); });
  $('idioma').textContent = idioma === 'es' ? 'EN' : 'ES';
  $('idioma').setAttribute('aria-label', idioma === 'es' ? 'English' : 'Español');
  $('musica').querySelector('.etq').textContent = SunShineMusica.sonando ? t('pausar') : t('musica');
  $('pista').textContent = $('carrito').classList.contains('abierto') ? t('cerrar') : t('verOpciones');
  for (const a of [$('enlace-apartado'), $('pie-apartado')]) a.href = `/apartado.html?lang=${idioma}`;

  const n = negocio.en && idioma === 'en' ? { ...negocio, ...negocio.en } : negocio;
  $('marca').textContent = $('pie-marca').textContent = n.nombre;
  document.title = n.nombre;
  $('lema').textContent = n.lema;
  $('intro').textContent = n.intro;
  $('ceja').textContent = t('ceja');

  // Selector de región
  $('region').innerHTML = negocio.regiones.map(r =>
    `<option value="${esc(r.id)}"${r.id === region ? ' selected' : ''}>${r.bandera} ${esc(nombreRegion(r))} · ${r.moneda.toUpperCase()}</option>`).join('');
  const r = regionActual();
  $('cta-bandera').textContent = r.bandera;
  $('cta-amazon').href = r.amazonInicio || 'https://www.amazon.com';
  $('aviso-amazon').hidden = !r.afiliadaAmazon;
  $('moneda').textContent = r.moneda.toUpperCase();

  // Confianza
  const c = t('confianza');
  $('confianza').innerHTML = [c[0], c[1], t('envios', r.paises || 1), c[2], ...(negocio.apartado ? [c[3]] : [])].map(x => `<li>${esc(x)}</li>`).join('');

  // Filtro de edad
  $('edad').innerHTML = `<option value="">${esc(t('todasEdades'))}</option>` +
    Object.keys(negocio.edades || {}).filter(k => k !== 'familia').map(k => `<option value="${esc(k)}">${esc(nombreEdad(k))}</option>`).join('');

  pintarFiltrosPrecio();
  pintarInfoCompra();
  cargarPayPal();
  for (const a of [$('ir-rastreo'), $('pie-pedido')]) a.href = `/pedido.html?lang=${idioma}`;
  $('pie-privacidad').href = $('aviso-cookies-enlace').href = `/privacidad.html?lang=${idioma}`;
  $('pie-terminos').href = `/terminos.html?lang=${idioma}`;
  $('aviso-cookies-texto').firstChild.textContent = t('cookies') + ' ';
  $('aviso-cookies-enlace').textContent = t('privacidad');
  $('aviso-cookies-ok').textContent = t('entendido');
  pintarOrbita();
  pintarMosaico();
  pintarVitrina(0);
  programarVitrina();
  pintarCategorias();
  pintarCatalogo();
  dibujar();
}

// ---------- Precios accesibles: filtro por precio y orden ----------
// Topes por moneda (en centavos)
const TOPES = { mxn: [20000, 50000, 100000, 200000], usd: [1000, 2500, 5000, 10000] };
function pintarFiltrosPrecio() {
  const moneda = regionActual().moneda;
  const antes = $('precio-max').value;
  const topes = TOPES[moneda] || TOPES.usd;
  $('precio-max').innerHTML = `<option value="">${esc(t('precioTodos'))}</option>` +
    topes.map(c => `<option value="${c}"${String(c) === antes ? ' selected' : ''}>${esc(t('hasta', formato(c).replace(/\.00$/, '')))}</option>`).join('');
  const orden = $('orden').value;
  $('orden').innerHTML = [['', t('ordenRec')], ['menor', t('ordenMenor')], ['mayor', t('ordenMayor')]]
    .map(([v, l]) => `<option value="${v}"${v === orden ? ' selected' : ''}>${esc(l)}</option>`).join('');
}

// ---------- Cómo comprar, formas de pago y envíos ----------
function pintarInfoCompra() {
  const r = regionActual();
  $('pasos-compra').innerHTML = t('pasos').map(p => `<li>${esc(p)}</li>`).join('');
  $('lista-pagos').innerHTML = (r.pagos || []).map(p => `<li><span aria-hidden="true">${p.icono}</span> ${esc(p[idioma] || p.es)}</li>`).join('');
  const conf = r.envios;
  $('lista-envios').innerHTML = !conf ? '' : conf.opciones.map(o =>
    `<li><span>${(o.tipo || 'domicilio') === 'sucursal' ? '🏬' : '🏠'} ${esc(idioma === 'en' ? o.en : o.nombre)}<small>${esc(t('dias', o.dias[0], o.dias[1]))}</small></span><b>${o.monto ? formato(o.monto) : esc(t('gratis'))}</b></li>`).join('') +
    ((conf.sucursales || []).length ? `<li class="sucursales"><strong>${esc(t('sucursalesTitulo'))}</strong>${conf.sucursales.map(s => `<small>📍 ${esc(s.nombre)} — ${esc(s.direccion)}, ${esc(s.ciudad)} · ${esc(s.horario)}</small>`).join('')}</li>` : '');
  $('nota-envio-gratis').textContent = conf?.gratisDesde != null ? t('gratisDesde', formato(conf.gratisDesde)) : '';
}

// ---------- Portada ----------
function pintarOrbita() {
  const cats = negocio.categorias;
  $('orbita').innerHTML = cats.map((c, i) =>
    `<span style="--a:${(360 / cats.length) * i}deg"><b>${c.icono}</b></span>`).join('');
}
function pintarMosaico() {
  $('mosaico').innerHTML = negocio.categorias.map(c => {
    const n = productos.filter(p => p.categoria === c.id).length;
    return `<li><a href="#catalogo-inicio" data-ir="${esc(c.id)}" class="c-${esc(c.id)}"><span class="mosaico-icono" aria-hidden="true">${c.icono}</span><strong>${esc(nombreCat(c))}</strong><small>${esc(t('productos', n))}</small></a></li>`;
  }).join('');
}
$('mosaico').addEventListener('click', (e) => {
  const a = e.target.closest('[data-ir]'); if (!a) return;
  categoria = a.dataset.ir;
  pintarCategorias(); pintarCatalogo();
});

// ---------- Vitrina de destacados ----------
// Un producto por categoría (el primero de cada una). Avanza solo; con la
// música encendida cambia cada 8 tiempos para ir al ritmo.
let vIndice = 0, vPausada = sinMovimiento, vEncima = false, vTimer = null, vPulsos = 0;
const destacados = () => negocio.categorias.map(c => productos.find(p => p.categoria === c.id)).filter(Boolean);

function pintarVitrina(dir = 1) {
  const lista = destacados();
  $('vitrina').hidden = lista.length === 0;
  if (!lista.length) return;
  vIndice = (vIndice % lista.length + lista.length) % lista.length;
  const p = lista[vIndice];
  const c = negocio.categorias.find(x => x.id === p.categoria) || { icono: '📦', nombre: '' };
  const foto = p.imagen ? `<img src="/${esc(p.imagen)}" alt="">` : `<span>${c.icono}</span>`;
  const precio = p.precio ? `<p class="slide-precio">${formato(p.precio)}</p>` : `<p class="slide-precio amazon-precio">${esc(t('precioAmazon'))}</p>`;
  const botones = [
    p.precio ? `<button class="agregar" data-id="${esc(p.id)}">${esc(t('agregar'))}</button>` : '',
    p.amazon ? `<a class="ver-amazon${p.precio ? ' secundario' : ''}" href="${esc(p.amazon)}" target="_blank" rel="sponsored noopener">${esc(t('verAmazon'))}</a>` : '',
  ].join('');
  $('v-escenario').innerHTML = `<article class="slide c-${esc(p.categoria)}" style="--dir:${dir < 0 ? -1 : 1}" aria-roledescription="diapositiva" aria-label="${vIndice + 1} / ${lista.length}">
      <div class="slide-foto" aria-hidden="true">${foto}</div>
      <div class="slide-info">
        <span class="etiqueta-cat">${c.icono} ${esc(nombreCat(c))}${p.edad ? ` <span class="edad">${esc(nombreEdad(p.edad))}</span>` : ''}</span>
        <h3>${esc(p.nombre)}</h3>
        <p class="slide-desc">${esc(p.descripcion)}</p>
        ${precio}
        <div class="botones">${botones}</div>
      </div>
    </article>`;
  $('v-puntos').innerHTML = lista.map((x, i) =>
    `<button type="button" data-v="${i}" aria-label="${esc(x.nombre)}" aria-current="${i === vIndice}"></button>`).join('');
  $('v-pausa').textContent = vPausada ? t('reproducir') : t('pausar');
  $('v-pausa').setAttribute('aria-pressed', vPausada);
  $('v-ant').setAttribute('aria-label', t('anterior'));
  $('v-sig').setAttribute('aria-label', t('siguiente'));
}

function avanzar(d = 1) { vIndice += d; pintarVitrina(d); }

function programarVitrina() {
  clearInterval(vTimer);
  // Con música, el ritmo lo marca el evento de pulso; sin música, cada 4.5 s
  if (!vPausada && !SunShineMusica.sonando) vTimer = setInterval(() => { if (!vEncima) avanzar(1); }, 4500);
}

$('v-ant').addEventListener('click', () => { avanzar(-1); programarVitrina(); });
$('v-sig').addEventListener('click', () => { avanzar(1); programarVitrina(); });
$('v-pausa').addEventListener('click', () => { vPausada = !vPausada; pintarVitrina(1); programarVitrina(); });
$('v-puntos').addEventListener('click', (e) => {
  const b = e.target.closest('[data-v]'); if (!b) return;
  const i = +b.dataset.v; const d = i >= vIndice ? 1 : -1; vIndice = i; pintarVitrina(d); programarVitrina();
});
// Se detiene mientras el cliente la mira de cerca (cursor o teclado encima)
$('vitrina').addEventListener('mouseenter', () => (vEncima = true));
$('vitrina').addEventListener('mouseleave', () => (vEncima = false));
$('vitrina').addEventListener('focusin', () => (vEncima = true));
$('vitrina').addEventListener('focusout', () => (vEncima = false));
document.addEventListener('sunshine:pulso', () => {
  if (!vPausada && !vEncima && ++vPulsos % 8 === 0) avanzar(1);
});

// Las tarjetas del catálogo se animan al aparecer en pantalla (siempre visibles)
const observador = !sinMovimiento && 'IntersectionObserver' in window ? new IntersectionObserver((entradas) => {
  for (const e of entradas) if (e.isIntersecting) { e.target.classList.add('entra'); observador.unobserve(e.target); }
}, { threshold: 0.12 }) : null;

// ---------- Catálogo ----------
function pintarCategorias() {
  const cuenta = (id) => productos.filter(p => id === 'todos' || p.categoria === id).length;
  const lista = [{ id: 'todos', nombre: t('todo'), icono: '☀️' }, ...negocio.categorias];
  $('categorias').innerHTML = lista.map(c =>
    `<button type="button" data-cat="${esc(c.id)}" aria-pressed="${c.id === categoria}">${c.icono} ${esc(c.id === 'todos' ? c.nombre : nombreCat(c))}<span class="num">${cuenta(c.id)}</span></button>`
  ).join('');
}

function pintarCatalogo() {
  const q = sinAcentos($('buscar').value.trim());
  const edad = $('edad').value;
  const precioMax = parseInt($('precio-max').value, 10) || 0;
  const orden = $('orden').value;
  const cats = Object.fromEntries(negocio.categorias.map(c => [c.id, c]));
  const lista = productos.filter(p =>
    (categoria === 'todos' || p.categoria === categoria) &&
    (!edad || p.edad === edad || p.edad === 'familia') &&
    (!precioMax || (p.precio && p.precio <= precioMax)) &&
    (!q || sinAcentos(`${p.nombre} ${p.descripcion} ${nombreCat(cats[p.categoria] || {})}`).includes(q))
  );
  // Ordenar por precio (los de "Precio en Amazon" van al final)
  if (orden === 'menor') lista.sort((a, b) => (a.precio || Infinity) - (b.precio || Infinity));
  if (orden === 'mayor') lista.sort((a, b) => (b.precio || -1) - (a.precio || -1));
  $('sin-resultados').hidden = lista.length > 0;
  $('resultado').textContent = t('productos', lista.length) + (categoria !== 'todos' ? ` ${t('en')} ${nombreCat(cats[categoria])}` : '');

  $('catalogo').innerHTML = lista.map(p => {
    const c = cats[p.categoria] || { nombre: p.categoria, icono: '📦' };
    const foto = p.imagen ? `<img src="/${esc(p.imagen)}" alt="${esc(p.nombre)}" loading="lazy">` : `<span aria-hidden="true">${c.icono}</span>`;
    const precio = p.precio ? `<span class="precio">${formato(p.precio)}</span>` : `<span class="precio amazon-precio">${esc(t('precioAmazon'))}</span>`;
    const botones = [
      p.precio ? `<button class="agregar" data-id="${esc(p.id)}">${esc(t('agregar'))}</button>` : '',
      p.amazon ? `<a class="ver-amazon${p.precio ? ' secundario' : ''}" href="${esc(p.amazon)}" target="_blank" rel="sponsored noopener">${esc(t('verAmazon'))}</a>` : '',
    ].join('');
    return `<li class="tarjeta-producto">
      <div class="foto c-${esc(p.categoria)}">${foto}</div>
      <div class="info">
        <span class="etiqueta-cat">${c.icono} ${esc(nombreCat(c))}${p.edad ? ` <span class="edad">${esc(nombreEdad(p.edad))}</span>` : ''}</span>
        <h2>${esc(p.nombre)}</h2>
        <p>${esc(p.descripcion)}</p>
        ${precio}
        <div class="botones">${botones}</div>
      </div>
    </li>`;
  }).join('');
  if (observador) document.querySelectorAll('#catalogo .tarjeta-producto').forEach((el, i) => { el.style.setProperty('--i', i % 4); observador.observe(el); });
}

$('categorias').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  categoria = b.dataset.cat;
  try { history.replaceState(null, '', categoria === 'todos' ? location.pathname + location.search : '#' + categoria); } catch {}
  pintarCategorias();
  pintarCatalogo();
});
$('buscar').addEventListener('input', pintarCatalogo);
$('edad').addEventListener('change', pintarCatalogo);
$('precio-max').addEventListener('change', pintarCatalogo);
$('orden').addEventListener('change', pintarCatalogo);

// Cambiar región o idioma recarga precios y textos
$('region').addEventListener('change', async () => {
  region = $('region').value;
  escribir('region-sunshine', region);
  await cargarProductos();
  pintarTodo();
  avisar(t('cambioRegion', `${regionActual().bandera} ${nombreRegion(regionActual())}`));
});
$('idioma').addEventListener('click', async () => {
  idioma = idioma === 'es' ? 'en' : 'es';
  escribir('idioma-sunshine', idioma);
  await cargarProductos();
  pintarTodo();
});

// ---------- Carrito ----------
function avisar(msg) {
  const a = $('aviso');
  a.textContent = msg; a.hidden = false;
  clearTimeout(avisar.t); avisar.t = setTimeout(() => (a.hidden = true), 1800);
}

function cambiar(id, delta) {
  carrito[id] = Math.min((carrito[id] || 0) + delta, 20);
  if (carrito[id] <= 0) delete carrito[id];
  guardar();
  dibujar();
}

// ---------- Entrega: a domicilio o recoger en sucursal ----------
let envioId = leer('envio-sunshine') || '';
let sucursalId = leer('sucursal-sunshine') || '';

// Mismo cálculo que el servidor: la primera opción a domicilio sale gratis desde el monto configurado
function opcionesEntrega(subtotal) {
  const conf = regionActual().envios;
  if (!conf) return [];
  const gratis = conf.gratisDesde != null && subtotal >= conf.gratisDesde;
  const primera = conf.opciones.find(o => (o.tipo || 'domicilio') === 'domicilio');
  return conf.opciones.map(o => ({ ...o, tipo: o.tipo || 'domicilio', monto: gratis && o === primera ? 0 : o.monto }));
}
function entregaElegida(subtotal) {
  const lista = opcionesEntrega(subtotal);
  return lista.find(o => o.id === envioId) || lista[0] || null;
}

function pintarEntrega(subtotal, hay) {
  const conf = regionActual().envios;
  const lista = opcionesEntrega(subtotal);
  $('entrega').hidden = !hay || !lista.length;
  if (!lista.length) return;
  const elegida = entregaElegida(subtotal);
  $('opciones-entrega').innerHTML = lista.map(o => `<label class="opcion-entrega">
      <input type="radio" name="envio" value="${esc(o.id)}"${o.id === elegida.id ? ' checked' : ''}>
      <span><strong>${o.tipo === 'sucursal' ? '🏬' : '🏠'} ${esc(idioma === 'en' ? o.en : o.nombre)}</strong><small>${esc(t('dias', o.dias[0], o.dias[1]))}</small></span>
      <b>${o.monto ? formato(o.monto) : esc(t('gratis'))}</b>
    </label>`).join('');

  // Sucursal (solo si eligió recoger)
  const sucursales = conf.sucursales || [];
  const recoge = elegida.tipo === 'sucursal';
  $('elige-sucursal').hidden = !recoge;
  if (recoge) {
    $('sucursal').innerHTML = `<option value="">${esc(t('eligeSucursalOpcion'))}</option>` +
      sucursales.map(s => `<option value="${esc(s.id)}"${s.id === sucursalId ? ' selected' : ''}>${esc(s.nombre)} · ${esc(s.ciudad)}</option>`).join('');
  }
  const s = recoge ? sucursales.find(x => x.id === sucursalId) : null;
  $('nota-sucursal').hidden = !s;
  if (s) $('nota-sucursal').textContent = `📍 ${s.direccion}, ${s.ciudad} · ${t('horario')}: ${s.horario}`;

  // Aviso de envío gratis (solo aplica a domicilio)
  const meta = conf.gratisDesde;
  $('envio-carrito').hidden = !hay || meta == null || recoge;
  if (meta != null) {
    $('envio-texto').textContent = subtotal >= meta ? t('yaGratis') : t('faltaGratis', formato(meta - subtotal));
    $('envio-barra').style.width = Math.min(100, Math.round(subtotal / meta * 100)) + '%';
  }
}

$('opciones-entrega').addEventListener('change', (e) => {
  if (e.target.name !== 'envio') return;
  envioId = e.target.value; escribir('envio-sunshine', envioId);
  dibujar();
});
$('sucursal').addEventListener('change', () => {
  sucursalId = $('sucursal').value; escribir('sucursal-sunshine', sucursalId);
  $('error').hidden = true;
  dibujar();
});

// Datos de entrega que se mandan al servidor (que recalcula todo)
function datosEntrega() {
  const subtotal = subtotalCarrito();
  const e = entregaElegida(subtotal);
  return { envio: e?.id || '', sucursal: e?.tipo === 'sucursal' ? sucursalId : '' };
}
function faltaSucursal() {
  const e = entregaElegida(subtotalCarrito());
  return e?.tipo === 'sucursal' && !(regionActual().envios?.sucursales || []).some(s => s.id === sucursalId);
}

const idsEnCarrito = () => Object.keys(carrito).filter(id => enVenta().some(p => p.id === id));
const subtotalCarrito = () => idsEnCarrito().reduce((s, id) => s + productos.find(x => x.id === id).precio * carrito[id], 0);

function dibujar() {
  const ids = idsEnCarrito();
  const hay = ids.length > 0;
  $('vacio').hidden = hay;
  $('vaciar').hidden = !hay;
  $('pagar').disabled = !hay;
  let subtotal = 0, piezas = 0;
  $('lineas').innerHTML = ids.map(id => {
    const p = productos.find(x => x.id === id);
    subtotal += p.precio * carrito[id];
    piezas += carrito[id];
    return `<li class="linea">
      <span>${esc(p.nombre)}<br><small>${formato(p.precio * carrito[id])}</small></span>
      <span class="cantidad">
        <button data-menos="${esc(id)}" aria-label="−1 ${esc(p.nombre)}">−</button>
        <span>${carrito[id]}</span>
        <button data-mas="${esc(id)}" aria-label="+1 ${esc(p.nombre)}">+</button>
      </span></li>`;
  }).join('');
  $('cuenta').hidden = piezas === 0;
  $('cuenta').textContent = piezas;
  $('pista').hidden = !hay;

  // Entrega y total con envío
  pintarEntrega(subtotal, hay);
  const envio = hay ? (entregaElegida(subtotal)?.monto || 0) : 0;
  const total = subtotal + envio;
  $('desglose').hidden = !hay;
  $('d-subtotal').textContent = formato(subtotal);
  $('d-envio').textContent = envio ? formato(envio) : t('gratis');
  $('total').firstChild.textContent = formato(total) + ' ';

  // PayPal: visible si está configurado y hay productos
  $('opcion-paypal').hidden = !negocio.paypal || !hay;

  // Opción de apartar: mismo cálculo que el servidor (el envío se suma al total)
  const ap = negocio.apartado;
  $('opcion-apartar').hidden = !ap;
  if (ap) {
    const moneda = regionActual().moneda;
    const minimo = typeof ap.abonoMinimo === 'object' ? (ap.abonoMinimo[moneda] ?? 500) : ap.abonoMinimo;
    const anticipo = Math.max(Math.ceil(total * ap.porcentaje / 100), Math.min(minimo, total));
    $('apartar').disabled = !hay;
    $('monto-anticipo').textContent = formato(anticipo);
    $('nota-apartar').textContent = hay ? t('notaApartar', ap.porcentaje, formato(total - anticipo), ap.plazoDias) : t('notaApartarVacio', ap.porcentaje, ap.plazoDias);
  }
}

// ---------- PayPal ----------
// El SDK de PayPal se carga con la moneda de la región; al cambiar de región se vuelve a cargar.
let paypalCargado = '';
function cargarPayPal() {
  if (!negocio.paypal) return;
  const moneda = regionActual().moneda.toUpperCase();
  const clave = `${moneda}-${idioma}`;
  if (paypalCargado === clave) return;
  paypalCargado = clave;
  const ns = `paypal_${moneda.toLowerCase()}_${idioma}`;
  const pintar = () => {
    $('paypal-botones').innerHTML = '';
    window[ns].Buttons({
      style: { layout: 'horizontal', tagline: false, height: 44, label: 'paypal' },
      onClick: (_d, actions) => {
        if (!idsEnCarrito().length) return actions.reject();
        if (faltaSucursal()) { mostrarError(t('faltaSucursal')); $('sucursal').focus(); return actions.reject(); }
        $('error').hidden = true;
        return actions.resolve();
      },
      createOrder: async () => {
        const items = Object.entries(carrito).map(([id, cantidad]) => ({ id, cantidad }));
        const r = await fetch('/api/paypal/orden', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items, region, idioma, ...datosEntrega() }),
        });
        const d = await r.json();
        if (!r.ok) { mostrarError(d.error); throw new Error(d.error); }
        return d.id;
      },
      onApprove: async (data) => {
        const r = await fetch('/api/paypal/capturar', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: data.orderID, idioma }),
        });
        const d = await r.json();
        if (!r.ok) { mostrarError(d.error || t('paypalError')); return; }
        location.href = `/exito.html?paypal=${encodeURIComponent(data.orderID)}&lang=${idioma}`;
      },
      onError: () => mostrarError(t('paypalError')),
    }).render('#paypal-botones');
  };
  if (window[ns]) return pintar();
  const s = document.createElement('script');
  s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(negocio.paypal.clientId)}&currency=${moneda}&intent=capture&disable-funding=card,credit&locale=${idioma === 'en' ? 'en_US' : 'es_MX'}`;
  s.dataset.namespace = ns;
  s.onload = pintar;
  s.onerror = () => { $('opcion-paypal').hidden = true; };
  document.head.appendChild(s);
}

function mostrarError(msg) { $('error').textContent = msg; $('error').hidden = false; }

// En el celular el carrito se despliega desde abajo
$('abrir').addEventListener('click', () => {
  const abierto = $('carrito').classList.toggle('abierto');
  $('abrir').setAttribute('aria-expanded', abierto);
  $('pista').textContent = abierto ? t('cerrar') : t('verOpciones');
});

document.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.id) {
    cambiar(b.dataset.id, 1);
    const p = productos.find(x => x.id === b.dataset.id);
    avisar(t('agregadoAviso', p.nombre));
    SunShineMusica.campanita();
    if (!sinMovimiento) { $('cuenta').classList.remove('salta'); void $('cuenta').offsetWidth; $('cuenta').classList.add('salta'); }
    b.textContent = t('agregado');
    setTimeout(() => (b.textContent = t('agregar')), 1200);
  }
  if (b.dataset.mas) cambiar(b.dataset.mas, 1);
  if (b.dataset.menos) cambiar(b.dataset.menos, -1);
});

$('vaciar').addEventListener('click', () => { carrito = {}; guardar(); dibujar(); });

async function irAPagar(modo, boton) {
  if (faltaSucursal()) { mostrarError(t('faltaSucursal')); $('carrito').classList.add('abierto'); $('sucursal').focus(); return; }
  $('error').hidden = true;
  const textoOriginal = boton.innerHTML;
  $('pagar').disabled = $('apartar').disabled = true;
  boton.textContent = t('abriendo');
  try {
    const items = Object.entries(carrito).map(([id, cantidad]) => ({ id, cantidad }));
    const r = await fetch('/api/checkout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, modo, region, idioma, ...datosEntrega() })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error);
    window.location.href = data.url; // redirige a Stripe Checkout
  } catch (err) {
    mostrarError(err.message || t('errorPago'));
    boton.innerHTML = textoOriginal;
    dibujar();
  }
}
$('pagar').addEventListener('click', () => irAPagar('completo', $('pagar')));
$('apartar').addEventListener('click', () => irAPagar('apartado', $('apartar')));

// ---------- Música y animaciones ----------
$('musica').addEventListener('click', () => SunShineMusica.alternar());
document.addEventListener('sunshine:musica', (e) => {
  programarVitrina();
  $('musica').setAttribute('aria-pressed', e.detail.sonando);
  $('musica').querySelector('.etq').textContent = e.detail.sonando ? t('pausar') : t('musica');
});
// El sol de la portada y el de la marca laten con la música
document.addEventListener('sunshine:pulso', () => {
  if (sinMovimiento) return;
  for (const [sel, escala] of [['.barra-superior .sol', 1.25], ['.portada-sol .nucleo', 1.06]]) {
    const el = document.querySelector(sel);
    if (el?.animate) el.animate([{ transform: `scale(${escala})` }, { transform: 'scale(1)' }], { duration: 300, easing: 'ease-out' });
  }
});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
iniciar();

// ---------- Búsqueda desde la dirección (/?q=licuadora), p. ej. desde la página 404 ----------
(function () {
  const q = new URLSearchParams(location.search).get('q');
  if (q) $('buscar').value = q.slice(0, 60);
})();

// ---------- Aviso de almacenamiento (se muestra una vez) ----------
if (leer('aviso-cookies-sunshine') !== 'ok') $('aviso-cookies').hidden = false;
$('aviso-cookies-ok').addEventListener('click', () => {
  escribir('aviso-cookies-sunshine', 'ok');
  $('aviso-cookies').hidden = true;
});
