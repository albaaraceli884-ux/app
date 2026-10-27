const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
let idioma = params.get('lang');
if (!idioma) { try { idioma = localStorage.getItem('idioma-sunshine'); } catch {} }
if (idioma !== 'en') idioma = 'es';
const locale = idioma === 'en' ? 'en-US' : 'es-MX';

const T = {
  es: {
    titulo: 'Rastrear mi pedido', irTienda: 'Ir a la tienda', instruccion: 'Escribe tu número de pedido y el correo con el que compraste.',
    correo: 'tu@correo.com', buscarBtn: 'Buscar', pedido: 'Pedido', productos: 'Productos', buscando: 'Buscando tu pedido…',
    paypalNota: '¿Pagaste con PayPal? El seguimiento de tu envío también aparece en tu cuenta de PayPal.',
    verRastreo: 'Ver rastreo en la paquetería ↗', verApartado: 'Ver mi apartado',
    pago: { pagado: 'Pagado', pendiente: 'Pago en proceso', no_pagado: 'Sin pagar' },
    pasosDomicilio: ['Recibido', 'Preparando', 'Enviado', 'Entregado'],
    pasosSucursal: ['Recibido', 'Preparando', 'Listo para recoger', 'Entregado'],
    fecha: (f) => `Fecha de compra: ${f}`,
    enviadoCon: (p, g) => `Enviado con ${p}${g ? ` · Guía ${g}` : ''}.`,
    recoger: (s) => `Recoges en: ${s.nombre} — ${s.direccion}, ${s.ciudad} · Horario: ${s.horario}. Lleva tu número de pedido y una identificación.`,
    domicilio: 'Entrega a domicilio a la dirección que diste al pagar.',
    error: 'No se pudo consultar el pedido.',
    devTitulo: 'Tu devolución', devPedir: '¿Necesitas devolver o cambiar algo?', devAbrir: 'Solicitar devolución o cambio',
    devMotivo: 'Motivo', devElige: 'Elige un motivo…', mDefectuoso: 'El producto tiene un defecto', mDanado: 'Llegó dañado',
    mDiferente: 'No es lo que pedí', mNoQuiero: 'Ya no lo quiero', mOtro: 'Otro motivo', devPrefiero: '¿Qué prefieres recibir?',
    pCambio: 'Cambio', pCambioTxt: 'Te enviamos el mismo producto u otro de igual precio.', pSaldo: (b) => `Saldo a favor (+${b}%)`,
    pSaldoTxt: 'Un código para tu próxima compra, con valor extra.', pReembolso: 'Reembolso',
    pReembolsoTxt: 'Regresamos el dinero a tu forma de pago al recibir y revisar el producto.',
    devComentario: 'Cuéntanos qué pasó (opcional)', devEnviar: 'Enviar solicitud', enviando: 'Enviando…',
    devPlazo: (d) => `Tienes ${d} días desde que recibes tu pedido. Revisa nuestros Términos de uso.`,
    devEstados: { solicitada: 'Recibimos tu solicitud. Te escribiremos en un máximo de 2 días hábiles con las instrucciones.', aprobada: 'Aprobada. Envía o lleva el producto con su empaque según las instrucciones que te enviamos por correo.', recibida: 'Recibimos el producto y lo estamos revisando (máximo 3 días hábiles).', resuelta: 'Resuelta.', rechazada: 'No fue posible aprobarla. Te escribimos con el motivo; si tienes dudas, contáctanos.', cancelada: 'Cancelada. Tu pedido sigue activo.' },
    devResol: { cambio: 'Te enviaremos tu cambio.', saldo: 'Tu saldo a favor:', reembolso: 'Reembolso hecho a tu forma de pago (puede tardar de 5 a 10 días hábiles en verse).', reembolso_parcial: 'Reembolso parcial hecho a tu forma de pago (puede tardar de 5 a 10 días hábiles en verse).' },
    usaCodigo: 'Escríbelo en el campo de código promocional al pagar con tarjeta.', devOk: '¡Listo! Recibimos tu solicitud.',
  },
  en: {
    titulo: 'Track my order', irTienda: 'Back to store', instruccion: 'Enter your order number and the email you used to buy.',
    correo: 'you@email.com', buscarBtn: 'Search', pedido: 'Order', productos: 'Items', buscando: 'Looking up your order…',
    paypalNota: 'Paid with PayPal? Your shipment tracking also appears in your PayPal account.',
    verRastreo: 'Track with the carrier ↗', verApartado: 'View my layaway',
    pago: { pagado: 'Paid', pendiente: 'Payment processing', no_pagado: 'Unpaid' },
    pasosDomicilio: ['Received', 'Preparing', 'Shipped', 'Delivered'],
    pasosSucursal: ['Received', 'Preparing', 'Ready for pickup', 'Picked up'],
    fecha: (f) => `Order date: ${f}`,
    enviadoCon: (p, g) => `Shipped with ${p}${g ? ` · Tracking ${g}` : ''}.`,
    recoger: (s) => `Pick up at: ${s.nombre} — ${s.direccion}, ${s.ciudad} · Hours: ${s.horario}. Bring your order number and an ID.`,
    domicilio: 'Home delivery to the address you gave at checkout.',
    error: 'We could not load the order.',
    devTitulo: 'Your return', devPedir: 'Need to return or exchange something?', devAbrir: 'Request a return or exchange',
    devMotivo: 'Reason', devElige: 'Choose a reason…', mDefectuoso: 'The item is defective', mDanado: 'It arrived damaged',
    mDiferente: 'Not what I ordered', mNoQuiero: 'I no longer want it', mOtro: 'Other reason', devPrefiero: 'What would you like?',
    pCambio: 'Exchange', pCambioTxt: 'We send you the same item or another one of equal price.', pSaldo: (b) => `Store credit (+${b}%)`,
    pSaldoTxt: 'A code for your next purchase, with extra value.', pReembolso: 'Refund',
    pReembolsoTxt: 'We return the money to your payment method once we receive and check the item.',
    devComentario: 'Tell us what happened (optional)', devEnviar: 'Send request', enviando: 'Sending…',
    devPlazo: (d) => `You have ${d} days from delivery. See our Terms of use.`,
    devEstados: { solicitada: 'We received your request. We will email you instructions within 2 business days.', aprobada: 'Approved. Send or drop off the item in its packaging following the instructions we emailed you.', recibida: 'We received the item and are checking it (up to 3 business days).', resuelta: 'Resolved.', rechazada: 'We could not approve it. We emailed you the reason; contact us with any questions.', cancelada: 'Canceled. Your order remains active.' },
    devResol: { cambio: 'We will ship your exchange.', saldo: 'Your store credit:', reembolso: 'Refunded to your payment method (it may take 5 to 10 business days to show).', reembolso_parcial: 'Partially refunded to your payment method (it may take 5 to 10 business days to show).' },
    usaCodigo: 'Enter it in the promotion code field when you pay by card.', devOk: 'Done! We received your request.',
  },
};
const t = (k, ...a) => { const v = T[idioma][k]; return typeof v === 'function' ? v(...a) : v; };
document.documentElement.lang = idioma;
document.querySelectorAll('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
document.querySelectorAll('[data-t-placeholder]').forEach(el => { el.placeholder = t(el.dataset.tPlaceholder); });
for (const a of [$('inicio'), $('ir-tienda')]) a.href = `/?lang=${idioma}`;
const esc = (x) => String(x ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Orden de los estados para la línea de tiempo
const ORDEN = { recibido: 0, preparando: 1, enviado: 2, listo: 2, entregado: 3 };

let ultimaBusqueda = null;
async function buscar(numero, email) {
  ultimaBusqueda = { numero, email };
  $('error').hidden = true;
  $('carga').textContent = t('buscando');
  try {
    const q = new URLSearchParams({ numero, email, idioma });
    const r = await fetch('/api/pedido?' + q);
    const d = await r.json();
    if (!r.ok) throw new Error(d.error);
    pintar(d);
    $('carga').textContent = '';
  } catch (err) {
    $('carga').textContent = '';
    $('detalle').hidden = true;
    $('error').textContent = err.message || t('error');
    $('error').hidden = false;
  }
}

function pintar(d) {
  $('detalle').hidden = false;
  $('d-numero').textContent = d.numero;
  $('d-pago').textContent = t('pago')[d.pago] || d.pago;
  $('d-pago').className = 'chip ' + (d.pago === 'pagado' ? 'pagado' : 'pendiente');
  $('d-fecha').textContent = t('fecha', new Date(d.fecha).toLocaleDateString(locale, { dateStyle: 'long' }));

  const sucursal = d.envio.tipo === 'sucursal';
  const pasos = sucursal ? t('pasosSucursal') : t('pasosDomicilio');
  const actual = ORDEN[d.envio.estado] ?? 0;
  $('d-pasos').innerHTML = pasos.map((p, i) => `<li class="${i < actual ? 'hecho' : i === actual ? 'actual' : ''}"${i === actual ? ' aria-current="step"' : ''}>${esc(p)}</li>`).join('');

  const partes = [];
  if (sucursal && d.envio.sucursal) partes.push(t('recoger', d.envio.sucursal));
  else if (!sucursal) partes.push(t('domicilio'));
  if (d.envio.paqueteria || d.envio.guia) partes.push(t('enviadoCon', d.envio.paqueteria || '', d.envio.guia));
  $('d-detalle-envio').textContent = partes.join(' ');
  $('d-rastreo').hidden = !d.envio.rastreo;
  if (d.envio.rastreo) $('d-rastreo-enlace').href = d.envio.rastreo;
  $('d-apartado').hidden = !d.apartado;
  if (d.apartado) $('d-apartado-enlace').href = `/apartado.html?id=${encodeURIComponent(d.apartado)}&lang=${idioma}`;

  $('d-articulos').innerHTML = d.articulos.map(a => `<li><span>${esc(a.nombre)}</span><span>× ${a.cantidad}</span></li>`).join('');
  pintarDevolucion(d);
}

$('buscar').addEventListener('submit', (e) => {
  e.preventDefault();
  buscar($('numero').value.trim().toUpperCase(), $('email').value.trim());
});
if (params.get('numero')) $('numero').value = params.get('numero');

// ---------- Devoluciones ----------
const dineroEn = (c, m) => new Intl.NumberFormat(locale, { style: 'currency', currency: (m || 'mxn').toUpperCase() }).format(c / 100);
function pintarDevolucion(d) {
  const dev = d.devolucion;
  $('dev-estado').hidden = !dev || dev.estado === 'cancelada';
  if (dev && dev.estado !== 'cancelada') {
    const partes = [esc(t('devEstados')[dev.estado] || dev.estado)];
    if (dev.estado === 'resuelta' && dev.resolucion) {
      partes.push(esc(t('devResol')[dev.resolucion] || ''));
      if (dev.resolucion === 'saldo' && dev.codigo) partes.push(`<span class="codigo">${esc(dev.codigo)}</span> · ${dineroEn(dev.monto, d.moneda)}<br><small>${esc(t('usaCodigo'))}</small>`);
      else if (dev.monto) partes.push(dineroEn(dev.monto, d.moneda));
    }
    $('dev-estado-texto').innerHTML = partes.join(' ');
  }
  $('dev-caja').hidden = !d.puedeDevolver;
  $('dev-form').hidden = true;
  $('dev-abrir').hidden = false;
  $('dev-plazo').textContent = t('devPlazo', d.diasDevolucion || 30);
  $('p-saldo').textContent = t('pSaldo', d.bonoSaldo || 10);
}
$('dev-abrir').addEventListener('click', () => { $('dev-form').hidden = false; $('dev-abrir').hidden = true; $('dev-motivo').focus(); });
$('dev-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!ultimaBusqueda) return;
  const boton = $('dev-enviar');
  boton.disabled = true; boton.textContent = t('enviando');
  $('error').hidden = true;
  try {
    const r = await fetch('/api/pedido/devolucion', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...ultimaBusqueda, idioma,
        motivo: $('dev-motivo').value,
        preferencia: document.querySelector('input[name="dev-pref"]:checked')?.value,
        comentario: $('dev-comentario').value.slice(0, 450),
      }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error);
    $('carga').textContent = t('devOk');
    await buscar(ultimaBusqueda.numero, ultimaBusqueda.email);
    $('carga').textContent = t('devOk');
  } catch (err) {
    $('error').textContent = err.message || t('error'); $('error').hidden = false;
  } finally {
    boton.disabled = false; boton.textContent = t('devEnviar');
  }
});
