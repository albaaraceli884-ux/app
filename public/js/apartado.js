const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
let idioma = params.get('lang');
if (!idioma) { try { idioma = localStorage.getItem('idioma-sunshine'); } catch {} }
if (idioma !== 'en') idioma = 'es';
const locale = idioma === 'en' ? 'en-US' : 'es-MX';

const T = {
  es: {
    titulo: 'Mi apartado', irTienda: 'Ir a la tienda', instruccion: 'Escribe el código de tu apartado (viene en tu correo de confirmación)',
    consultar: 'Consultar', gracias: '¡Gracias! Tu pago se registró correctamente.', codigo: 'Código', copiar: 'Copiar enlace', copiado: '¡Enlace copiado!',
    abonaLibre: 'O abona la cantidad que quieras', abonar: 'Abonar', productosApartados: 'Productos apartados', tusPagos: 'Tus pagos',
    notaPagos: 'Cada pago te llega con su recibo por correo. Si acabas de pagar y no aparece, espera un minuto y recarga.',
    buscando: 'Buscando tu apartado…', estados: { vigente: 'Vigente', vencido: 'Vencido', liquidado: 'Liquidado ✓' },
    saldoPor: (n) => `Saldo por pagar${n ? ', ' + n : ''}`, liquidadoTitulo: '¡Apartado liquidado!',
    pagado: (m, p) => `Pagado: ${m} (${p}%)`, total: (m) => `Total: ${m}`,
    yaPagaste: 'Ya pagaste todo. Prepararemos tu envío y te avisaremos por correo.',
    vencido: (f) => `La fecha límite era el ${f}. Aún puedes pagar; si tienes dudas, contáctanos.`,
    limite: (f) => `Fecha límite para liquidar: ${f}.`, liquidar: (m) => `Liquidar ${m} ahora`, minimo: (m) => `Mínimo ${m}`,
    abonoMinimo: (m) => `El abono mínimo es ${m}.`, abriendo: 'Abriendo pago seguro…', anticipo: 'Anticipo', abono: 'Abono',
    errorConsulta: 'No se pudo consultar el apartado.', errorPago: 'No se pudo iniciar el pago.', avance: 'Avance de pago',
  },
  en: {
    titulo: 'My layaway', irTienda: 'Back to store', instruccion: 'Enter your layaway code (it is in your confirmation email)',
    consultar: 'Look up', gracias: 'Thank you! Your payment was recorded.', codigo: 'Code', copiar: 'Copy link', copiado: 'Link copied!',
    abonaLibre: 'Or pay any amount you like', abonar: 'Pay', productosApartados: 'Reserved items', tusPagos: 'Your payments',
    notaPagos: 'Each payment comes with an email receipt. If you just paid and it is not listed yet, wait a minute and reload.',
    buscando: 'Looking up your layaway…', estados: { vigente: 'Active', vencido: 'Overdue', liquidado: 'Paid in full ✓' },
    saldoPor: (n) => `Balance due${n ? ', ' + n : ''}`, liquidadoTitulo: 'Layaway paid in full!',
    pagado: (m, p) => `Paid: ${m} (${p}%)`, total: (m) => `Total: ${m}`,
    yaPagaste: 'You have paid everything. We will prepare your shipment and email you.',
    vencido: (f) => `The due date was ${f}. You can still pay; contact us if you have questions.`,
    limite: (f) => `Pay off by: ${f}.`, liquidar: (m) => `Pay ${m} now`, minimo: (m) => `Minimum ${m}`,
    abonoMinimo: (m) => `The minimum payment is ${m}.`, abriendo: 'Opening secure checkout…', anticipo: 'Deposit', abono: 'Payment',
    errorConsulta: 'We could not load the layaway.', errorPago: 'We could not start the payment.', avance: 'Payment progress',
  },
};
const t = (k, ...a) => { const v = T[idioma][k]; return typeof v === 'function' ? v(...a) : v; };
document.documentElement.lang = idioma;
document.querySelectorAll('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
$('d-barra-cont').setAttribute('aria-label', t('avance'));
for (const a of [$('inicio'), $('ir-tienda')]) a.href = `/?lang=${idioma}`;

const esc = (x) => String(x ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let ap = null;
const dinero = (c) => new Intl.NumberFormat(locale, { style: 'currency', currency: (ap?.moneda || 'mxn').toUpperCase() }).format(c / 100);
const fechaLarga = (ymd) => { const [y, m, d] = ymd.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }); };

async function consultar(id, sessionId) {
  $('error').hidden = true;
  $('carga').textContent = t('buscando');
  try {
    const q = `?idioma=${idioma}` + (sessionId ? '&session_id=' + encodeURIComponent(sessionId) : '');
    const r = await fetch('/api/apartado/' + encodeURIComponent(id) + q);
    const data = await r.json();
    if (!r.ok) throw new Error(data.error);
    ap = data;
    pintar();
    try { history.replaceState(null, '', `/apartado.html?id=${encodeURIComponent(ap.id)}&lang=${idioma}` + (sessionId ? '&session_id=' + encodeURIComponent(sessionId) : '')); } catch {}
    try { localStorage.setItem('ultimo-apartado', ap.id); } catch {}
    $('carga').textContent = '';
  } catch (err) {
    $('carga').textContent = '';
    $('detalle').hidden = true;
    $('error').textContent = err.message || t('errorConsulta');
    $('error').hidden = false;
  }
}

function pintar() {
  $('detalle').hidden = false;
  $('buscar').hidden = true;
  $('d-codigo').textContent = ap.id;
  $('d-estado').textContent = t('estados')[ap.estado];
  $('d-estado').className = 'chip ' + ap.estado;
  $('d-saldo').textContent = dinero(ap.saldo);
  $('d-saldo-titulo').textContent = ap.saldo ? t('saldoPor', ap.cliente) : t('liquidadoTitulo');
  const pct = ap.total ? Math.min(100, Math.round(ap.pagado / ap.total * 100)) : 0;
  $('d-barra').style.width = pct + '%';
  $('d-barra-cont').setAttribute('aria-valuenow', pct);
  $('d-pagado').textContent = t('pagado', dinero(ap.pagado), pct);
  $('d-total').textContent = t('total', dinero(ap.total));
  $('d-vence').textContent = ap.estado === 'liquidado' ? t('yaPagaste') : ap.estado === 'vencido' ? t('vencido', fechaLarga(ap.vence)) : t('limite', fechaLarga(ap.vence));

  $('acciones').hidden = ap.saldo <= 0;
  $('liquidar').textContent = t('liquidar', dinero(ap.saldo));
  $('monto').min = (ap.abonoMinimo / 100).toFixed(2);
  $('monto').max = (ap.saldo / 100).toFixed(2);
  $('monto').placeholder = t('minimo', (ap.abonoMinimo / 100).toFixed(2));
  // Si el saldo es menor o igual al mínimo, solo tiene sentido liquidar
  $('abonar').hidden = ap.saldo <= ap.abonoMinimo;

  $('d-articulos').innerHTML = ap.articulos.map(a => `<li><span>${esc(a.nombre)}</span><span>× ${a.cantidad}</span></li>`).join('');
  $('d-pagos').innerHTML = ap.pagos.map(p => `<li><span>${new Date(p.fecha).toLocaleDateString(locale, { dateStyle: 'medium' })} · ${esc(p.tipo === 'Anticipo' ? t('anticipo') : t('abono'))}</span><span>${dinero(p.monto)}</span></li>`).join('');
}

async function pagar(cuerpo, boton) {
  $('error').hidden = true;
  const texto = boton.textContent;
  boton.disabled = true; boton.textContent = t('abriendo');
  try {
    const r = await fetch(`/api/apartado/${encodeURIComponent(ap.id)}/abonar`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...cuerpo, idioma, session_id: params.get('session_id') || undefined })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error);
    location.href = data.url;
  } catch (err) {
    $('error').textContent = err.message || t('errorPago'); $('error').hidden = false;
    boton.disabled = false; boton.textContent = texto;
  }
}

$('liquidar').addEventListener('click', () => pagar({ liquidar: true }, $('liquidar')));
$('abonar').addEventListener('submit', (e) => {
  e.preventDefault();
  const monto = Math.round(parseFloat($('monto').value) * 100);
  if (!monto || monto < ap.abonoMinimo) { $('error').textContent = t('abonoMinimo', dinero(ap.abonoMinimo)); $('error').hidden = false; return; }
  pagar({ monto: Math.min(monto, ap.saldo) }, $('btn-abonar'));
});
$('buscar').addEventListener('submit', (e) => { e.preventDefault(); consultar($('codigo').value.trim().toUpperCase()); });
$('copiar').addEventListener('click', async () => {
  const url = `${location.origin}/apartado.html?id=${ap.id}&lang=${idioma}`;
  try { await navigator.clipboard.writeText(url); $('copiar').textContent = t('copiado'); }
  catch { prompt(t('copiar'), url); }
});

const id = params.get('id');
if (params.get('session_id')) $('gracias').hidden = false;
if (id) consultar(id, params.get('session_id'));
else { try { const u = localStorage.getItem('ultimo-apartado'); if (u) $('codigo').value = u; } catch {} }
