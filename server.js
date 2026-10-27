// Sun Shine — tienda en línea con catálogo, cobro con Stripe y apartados.
// Vende en varias regiones (México, Estados Unidos, internacional), cada
// una con su moneda, su Amazon y sus países de envío.
// La llave secreta vive SOLO en el servidor (variables de entorno / .env).
require('dotenv').config();
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const { NEGOCIO, MONEDA, PRODUCTOS, CATEGORIAS, EDADES = {}, ZONA_HORARIA, APARTADO, REGIONES, REGION_PREDETERMINADA,
  ENVIOS = {}, PAGOS = {}, MESES_SIN_INTERESES = false } = require('./productos');
const { obtenerPedidos, resumir, generarExcel, limpiarCache } = require('./ventas');
const { ESTADOS_ENVIO, FORMATO_PEDIDO, PAQUETERIAS, nuevoPedido, opcionesEnvio, elegirEnvio, sucursalesDe, sucursalDe, opcionesStripe, enlaceRastreo } = require('./logistica');
const paypal = require('./paypal');
const { FORMATO_ID, nuevoId, hoyMas, codificar, anticipoDe, minimoDe, consultar, listarTodos } = require('./apartados');

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('Falta STRIPE_SECRET_KEY (en .env o en las variables de entorno del hosting).');
  process.exit(1);
}

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();
const PORT = process.env.PORT || 4242;
// Render define RENDER_EXTERNAL_URL automáticamente; DOMAIN tiene prioridad si lo pones.
const DOMAIN = (process.env.DOMAIN || process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
// Impuestos automáticos de Stripe (Stripe Tax). Actívalo solo después de configurarlo en tu Dashboard.
const IMPUESTOS = process.env.STRIPE_TAX === '1';

if (process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')) console.log('🧪 Modo PRUEBA de Stripe (sk_test_). No se cobra dinero real.');
if (process.env.STRIPE_SECRET_KEY.startsWith('sk_live_')) console.log('💳 Modo REAL de Stripe (sk_live_). Se cobra dinero real.');

app.set('trust proxy', 1); // Render/hosting pone un proxy HTTPS delante
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (req.secure) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  // Forzar HTTPS en producción
  if (process.env.RENDER_EXTERNAL_URL && !req.secure && req.path !== '/salud') {
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  }
  next();
});

// ---------------------------------------------------------------
// 1. Webhook. Va ANTES de express.json() porque Stripe necesita
//    el cuerpo crudo para verificar la firma.
// ---------------------------------------------------------------
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Firma de webhook inválida:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const s = event.data.object;
  switch (event.type) {
    case 'checkout.session.completed':
      if (s.payment_status === 'paid') {
        const tipo = { apartado: `🧡 Nuevo APARTADO ${s.metadata?.apartado}`, abono: `💰 Abono a ${s.metadata?.apartado}` }[s.metadata?.tipo] || '✅ Venta pagada';
        console.log(`${tipo} [${s.metadata?.region || '?'}]: ${s.customer_details?.email} — ${s.amount_total / 100} ${s.currency.toUpperCase()}`);
      } else {
        console.log(`⏳ Pedido pendiente de pago: ${s.id}`);
      }
      break;
    case 'checkout.session.async_payment_succeeded':
      console.log(`✅ Pago diferido confirmado: ${s.id}`);
      break;
    case 'checkout.session.async_payment_failed':
      console.log(`❌ Pago diferido fallido: ${s.id}`);
      break;
  }
  // Aquí puedes enviar correos, avisar por WhatsApp, etc.
  res.json({ received: true });
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/salud', (_req, res) => res.send('ok'));

// ---------------------------------------------------------------
// 2. Regiones, idioma y catálogo público
// ---------------------------------------------------------------
const regionDe = (id) => (Object.hasOwn(REGIONES, id) ? id : REGION_PREDETERMINADA);
const idiomaDe = (x) => (x === 'en' ? 'en' : 'es');
const textoDe = (p, idioma) => ({
  nombre: (idioma === 'en' && p.en?.nombre) || p.nombre,
  descripcion: (idioma === 'en' && p.en?.descripcion) || p.descripcion || '',
});
// Precio del producto en la moneda de la región (null = no se vende ahí)
const precioEn = (p, moneda) => {
  const v = p.precio && typeof p.precio === 'object' ? p.precio[moneda] : null;
  return Number.isInteger(v) && v > 0 ? v : null;
};

function enlaceAmazon(a, region) {
  if (!a) return null;
  const r = REGIONES[region];
  const etiqueta = (process.env[r.tagEnv] || process.env.AMAZON_TAG || '').trim();
  const tag = etiqueta ? `tag=${encodeURIComponent(etiqueta)}` : '';
  if (a.asin && /^[A-Z0-9]{10}$/i.test(a.asin)) return `https://${r.amazon}/dp/${a.asin.toUpperCase()}${tag ? '?' + tag : ''}`;
  if (a.busqueda) return `https://${r.amazon}/s?k=${encodeURIComponent(a.busqueda)}${tag ? '&' + tag : ''}`;
  return null;
}

// Entrada a Amazon de la portada: tu tienda en Amazon si la configuraste, si no la página principal
function inicioAmazon(r) {
  if (r.tiendaAmazon && /^https:\/\/(www\.)?amazon\./i.test(r.tiendaAmazon)) return r.tiendaAmazon;
  const etiqueta = (process.env[r.tagEnv] || process.env.AMAZON_TAG || '').trim();
  return `https://${r.amazon}/${etiqueta ? '?tag=' + encodeURIComponent(etiqueta) : ''}`;
}

app.get('/api/negocio', (_req, res) => res.json({
  ...NEGOCIO,
  regiones: Object.entries(REGIONES).map(([id, r]) => ({
    id, nombre: r.nombre, nombre_en: r.nombre_en, bandera: r.bandera, idioma: r.idioma, moneda: r.moneda,
    afiliadaAmazon: Boolean(process.env[r.tagEnv] || process.env.AMAZON_TAG),
    amazonInicio: inicioAmazon(r),
    paises: r.paises.length,
    envios: ENVIOS[id] || null,
    pagos: PAGOS[id] || [],
    mesesSinIntereses: Boolean(MESES_SIN_INTERESES && r.moneda === 'mxn'),
  })),
  regionPredeterminada: REGION_PREDETERMINADA,
  // El client-id de PayPal es público (va en el navegador); el secreto nunca sale del servidor
  paypal: paypal.activo ? { clientId: paypal.ID } : null,
  categorias: Object.entries(CATEGORIAS).map(([id, c]) => ({ id, ...c })),
  edades: EDADES,
  apartado: APARTADO.activo ? { porcentaje: APARTADO.anticipoPorcentaje, plazoDias: APARTADO.plazoDias, abonoMinimo: APARTADO.abonoMinimo } : null,
}));

app.get('/api/productos', (req, res) => {
  const region = regionDe(req.query.region);
  const idioma = idiomaDe(req.query.idioma);
  const moneda = REGIONES[region].moneda;
  res.json(Object.entries(PRODUCTOS).map(([id, p]) => ({
    id,
    ...textoDe(p, idioma),
    categoria: p.categoria,
    edad: p.edad || null,
    imagen: p.imagen || null,
    precio: precioEn(p, moneda), // solo precios propios
    moneda,
    amazon: enlaceAmazon(p.amazon, region),
  })).filter((p) => p.precio || p.amazon));
});

// ---------------------------------------------------------------
// 3. Cobro. El navegador solo envía IDs, cantidades, región e idioma;
//    el servidor arma el cobro con sus propios precios.
//    modo 'completo' → paga todo ahora
//    modo 'apartado' → paga el anticipo y liquida después
// ---------------------------------------------------------------
function leerCarrito(items, moneda) {
  const lista = (Array.isArray(items) ? items : [])
    .filter((i) => i && Object.hasOwn(PRODUCTOS, i.id) && precioEn(PRODUCTOS[i.id], moneda))
    .map((i) => ({ id: i.id, cantidad: Math.min(Math.max(parseInt(i.cantidad, 10) || 1, 1), 20) }));
  const total = lista.reduce((s, i) => s + precioEn(PRODUCTOS[i.id], moneda) * i.cantidad, 0);
  return { lista, total };
}

const dinero = (c, moneda = MONEDA, idioma = 'es') =>
  new Intl.NumberFormat(idioma === 'en' ? 'en-US' : 'es-MX', { style: 'currency', currency: moneda.toUpperCase() }).format(c / 100);
const fechaTexto = (ymd, idioma) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString(idioma === 'en' ? 'en-US' : 'es-MX', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
};

// Forma de entrega que eligió el cliente en el carrito: domicilio (con su
// costo) o recoger en una sucursal autorizada de su país.
function prepararEntrega(body, region, subtotal, t) {
  const opcion = elegirEnvio(region, subtotal, body.envio);
  if (opcion.tipo !== 'sucursal') return { opcion, sucursal: null };
  const sucursal = sucursalDe(region, body.sucursal);
  if (!sucursal) return { error: t('Elige la sucursal donde recogerás tu pedido.', 'Choose the location where you will pick up your order.') };
  return { opcion, sucursal };
}

const metadataEntrega = ({ opcion, sucursal }) => ({
  envio_tipo: opcion.tipo,
  envio_opcion: opcion.id,
  ...(sucursal ? { envio_sucursal: sucursal.id, envio_sucursal_nombre: `${sucursal.nombre} · ${sucursal.ciudad}`.slice(0, 450) } : {}),
});

app.post('/api/checkout', async (req, res) => {
  const idioma = idiomaDe(req.body.idioma);
  const t = (es, en) => (idioma === 'en' ? en : es);
  try {
    const region = regionDe(req.body.region);
    const { moneda, paises } = REGIONES[region];
    const { lista, total } = leerCarrito(req.body.items, moneda);
    if (lista.length === 0) return res.status(400).json({ error: t('El carrito está vacío.', 'Your cart is empty.') });
    const modo = req.body.modo === 'apartado' ? 'apartado' : 'completo';
    if (modo === 'apartado' && !APARTADO.activo) return res.status(400).json({ error: t('Los apartados no están disponibles.', 'Layaway is not available.') });

    const entrega = prepararEntrega(req.body, region, total, t);
    if (entrega.error) return res.status(400).json({ error: entrega.error });
    const { opcion, sucursal } = entrega;
    const aDomicilio = opcion.tipo !== 'sucursal';
    const textoSucursal = sucursal ? t(`Recoger en: ${sucursal.nombre}, ${sucursal.direccion}, ${sucursal.ciudad}.`, `Pick up at: ${sucursal.nombre}, ${sucursal.direccion}, ${sucursal.ciudad}.`) : '';

    const comun = {
      mode: 'payment',
      payment_method_types: ['card'], // tarjetas de crédito y débito (Apple Pay / Google Pay incluidos); PayPal va por su propio botón
      // Solo se pide dirección si es entrega a domicilio
      ...(aDomicilio ? { shipping_address_collection: { allowed_countries: paises } } : {}),
      phone_number_collection: { enabled: true },
      billing_address_collection: 'auto',
      locale: idioma,
      ...(IMPUESTOS ? { automatic_tax: { enabled: true } } : {}),
      success_url: `${DOMAIN}/exito.html?session_id={CHECKOUT_SESSION_ID}&lang=${idioma}`,
      cancel_url: `${DOMAIN}/cancelado.html?lang=${idioma}`,
    };

    const pedido = nuevoPedido(); // número para que el cliente rastree su pedido
    let session;
    if (modo === 'completo') {
      const metadata = { tipo: 'venta', pedido, region, idioma, articulos: codificar(lista), envio_estado: 'recibido', ...metadataEntrega(entrega) };
      session = await stripe.checkout.sessions.create({
        ...comun,
        shipping_options: opcionesStripe(opcion, moneda, idioma),
        ...(sucursal ? { custom_text: { submit: { message: textoSucursal } } } : {}),
        // Meses sin intereses con tarjeta de crédito (México)
        ...(MESES_SIN_INTERESES && moneda === 'mxn' ? { payment_method_options: { card: { installments: { enabled: true } } } } : {}),
        line_items: lista.map((i) => {
          const p = PRODUCTOS[i.id];
          const txt = textoDe(p, idioma);
          return {
            quantity: i.cantidad,
            price_data: {
              currency: moneda,
              unit_amount: precioEn(p, moneda),
              ...(IMPUESTOS ? { tax_behavior: 'exclusive' } : {}),
              product_data: { name: txt.nombre, ...(txt.descripcion ? { description: txt.descripcion } : {}), metadata: { producto_id: i.id, categoria: p.categoria } },
            },
          };
        }),
        metadata,
        payment_intent_data: { metadata },
      });
    } else {
      // En el apartado, el costo de la entrega elegida se suma al total y se paga con el saldo
      const envio = opcion.monto;
      const totalConEnvio = total + envio;
      const id = nuevoId();
      const anticipo = anticipoDe(totalConEnvio, moneda);
      const vence = hoyMas(APARTADO.plazoDias);
      const nombreEntrega = idioma === 'en' ? opcion.en : opcion.nombre;
      const resumen = lista.map((i) => `${i.cantidad}× ${textoDe(PRODUCTOS[i.id], idioma).nombre}`).join(', ') +
        ` + ${nombreEntrega} ${envio ? dinero(envio, moneda, idioma) : t('(gratis)', '(free)')}`;
      const metadata = { tipo: 'apartado', apartado: id, pedido, region, idioma, total: String(totalConEnvio), envio: String(envio), vence, articulos: codificar(lista), envio_estado: 'recibido', ...metadataEntrega(entrega) };
      const enlace = `${DOMAIN}/apartado.html?id=${id}&lang=${idioma}`;
      session = await stripe.checkout.sessions.create({
        ...comun,
        customer_creation: 'always', // guarda al cliente para sus abonos
        line_items: [{
          quantity: 1,
          price_data: {
            currency: moneda,
            unit_amount: anticipo,
            product_data: {
              name: t(`Anticipo de apartado ${id}`, `Layaway deposit ${id}`),
              description: t(
                `${resumen}. Total ${dinero(totalConEnvio, moneda)} · Saldo ${dinero(totalConEnvio - anticipo, moneda)} a liquidar antes del ${fechaTexto(vence, 'es')}.`,
                `${resumen}. Total ${dinero(totalConEnvio, moneda, 'en')} · Balance ${dinero(totalConEnvio - anticipo, moneda, 'en')} due by ${fechaTexto(vence, 'en')}.`
              ).slice(0, 500),
            },
          },
        }],
        custom_text: { submit: { message: (t(
          `Apartas tus productos con ${dinero(anticipo, moneda)}. Liquida ${dinero(totalConEnvio - anticipo, moneda)} antes del ${fechaTexto(vence, 'es')} en ${DOMAIN}/apartado.html`,
          `You reserve your items with ${dinero(anticipo, moneda, 'en')}. Pay the ${dinero(totalConEnvio - anticipo, moneda, 'en')} balance by ${fechaTexto(vence, 'en')} at ${DOMAIN}/apartado.html`
        ) + (textoSucursal ? ' ' + textoSucursal : '')).slice(0, 1200) } },
        metadata,
        payment_intent_data: { metadata, description: t(`Apartado ${id} — consulta y abona en ${enlace}`, `Layaway ${id} — check and pay at ${enlace}`) },
      });
    }

    res.json({ url: session.url });
  } catch (err) {
    console.error('Error al crear la sesión:', err.message);
    res.status(500).json({ error: t('No se pudo iniciar el pago. Intenta de nuevo.', 'We could not start the payment. Please try again.') });
  }
});

// ---------------------------------------------------------------
// 3b. PayPal (pago completo). El navegador muestra el botón de PayPal;
//     el servidor crea la orden con sus precios y la cobra al aprobarse.
// ---------------------------------------------------------------
app.post('/api/paypal/orden', async (req, res) => {
  const idioma = idiomaDe(req.body.idioma);
  const t = (es, en) => (idioma === 'en' ? en : es);
  if (!paypal.activo) return res.status(503).json({ error: t('PayPal no está disponible.', 'PayPal is not available.') });
  try {
    const region = regionDe(req.body.region);
    const { moneda } = REGIONES[region];
    const { lista, total } = leerCarrito(req.body.items, moneda);
    if (lista.length === 0) return res.status(400).json({ error: t('El carrito está vacío.', 'Your cart is empty.') });
    const entrega = prepararEntrega(req.body, region, total, t);
    if (entrega.error) return res.status(400).json({ error: entrega.error });

    const pedido = nuevoPedido();
    const orden = await paypal.crearOrden({
      pedido, moneda, idioma, marca: NEGOCIO.nombre,
      envio: entrega.opcion,
      articulos: lista.map((i) => ({ id: i.id, cantidad: i.cantidad, precio: precioEn(PRODUCTOS[i.id], moneda), nombre: textoDe(PRODUCTOS[i.id], idioma).nombre })),
      sucursal: entrega.sucursal,
    });
    // Recordar la entrega elegida hasta que se cobre (la orden vive pocas horas)
    ordenesPayPal.set(orden.id, { region, idioma, pedido, articulos: codificar(lista), ...metadataEntrega(entrega), creada: Date.now() });
    res.json({ id: orden.id });
  } catch (err) {
    console.error('Error al crear orden PayPal:', err.message);
    res.status(500).json({ error: t('No se pudo iniciar el pago con PayPal.', 'We could not start the PayPal payment.') });
  }
});

const ordenesPayPal = new Map(); // id de orden → datos de la entrega (memoria corta)
setInterval(() => { for (const [k, v] of ordenesPayPal) if (Date.now() - v.creada > 6 * 3600 * 1000) ordenesPayPal.delete(k); }, 3600 * 1000).unref();

app.post('/api/paypal/capturar', async (req, res) => {
  const idioma = idiomaDe(req.body.idioma);
  const t = (es, en) => (idioma === 'en' ? en : es);
  if (!paypal.activo) return res.status(503).json({ error: t('PayPal no está disponible.', 'PayPal is not available.') });
  try {
    const id = String(req.body.id || '');
    if (!/^[A-Z0-9]{10,40}$/.test(id)) return res.status(400).json({ error: t('Orden no válida.', 'Invalid order.') });
    const datos = ordenesPayPal.get(id);
    const orden = await paypal.verOrden(id);
    const unidad = orden.purchase_units?.[0] || {};
    const [numeroPedido, , sucursalId] = String(unidad.custom_id || '').split(';');
    if (!FORMATO_PEDIDO.test(numeroPedido || '')) return res.status(400).json({ error: t('Orden no válida.', 'Invalid order.') });

    // Entrega a domicilio: el país de la dirección elegida en PayPal debe estar entre los países de envío de la región
    const region = regionDe(datos?.region);
    const pais = unidad.shipping?.address?.country_code;
    if (!sucursalId && pais && !REGIONES[region].paises.includes(pais)) {
      return res.status(400).json({ error: t(`Por ahora no enviamos a ${pais} desde esta región. Elige otra región o recoge en sucursal.`, `We do not ship to ${pais} from this region yet. Choose another region or pick up at a location.`) });
    }

    const cobro = await paypal.capturar(id);
    if (cobro.status !== 'COMPLETED') return res.status(402).json({ error: t('PayPal no completó el pago.', 'PayPal did not complete the payment.') });
    console.log(`✅ Venta pagada con PayPal [${region}]: ${cobro.payer?.email_address} — ${unidad.amount?.value} ${unidad.amount?.currency_code} · ${numeroPedido}${sucursalId ? ' · recoger en ' + sucursalId : ''}`);
    if (datos) ordenesPayPal.delete(id);
    res.json({ ok: true, pedido: numeroPedido });
  } catch (err) {
    console.error('Error al cobrar con PayPal:', err.message);
    res.status(500).json({ error: t('No se pudo completar el pago con PayPal.', 'We could not complete the PayPal payment.') });
  }
});

// Resumen de una orden de PayPal para la página de éxito
app.get('/api/paypal/resumen/:id', async (req, res) => {
  if (!paypal.activo) return res.status(404).json({ error: 'PayPal no está activo.' });
  try {
    const o = await paypal.verOrden(String(req.params.id));
    const u = o.purchase_units?.[0] || {};
    res.json({
      estado: o.status === 'COMPLETED' ? 'paid' : 'unpaid',
      total: Math.round(parseFloat(u.amount?.value || '0') * 100),
      moneda: (u.amount?.currency_code || 'MXN').toLowerCase(),
      email: o.payer?.email_address || null,
      nombre: o.payer?.name?.given_name || null,
      tipo: 'venta',
      pedido: String(u.custom_id || '').split(';')[0] || null,
      metodo: 'paypal',
    });
  } catch {
    res.status(404).json({ error: 'Orden no encontrada / Order not found.' });
  }
});

// Datos para la página de éxito
app.get('/api/sesion/:id', async (req, res) => {
  try {
    const s = await stripe.checkout.sessions.retrieve(req.params.id);
    const esApartado = s.metadata?.tipo === 'apartado';
    res.json({
      estado: s.payment_status,
      total: s.amount_total,
      moneda: s.currency,
      email: s.customer_details?.email || null,
      nombre: s.customer_details?.name || null,
      tipo: s.metadata?.tipo || 'venta',
      apartado: esApartado ? s.metadata.apartado : null,
      totalApartado: esApartado ? parseInt(s.metadata.total, 10) : null,
      vence: esApartado ? s.metadata.vence : null,
      pedido: s.metadata?.pedido || null,
    });
  } catch {
    res.status(404).json({ error: 'Sesión no encontrada / Session not found.' });
  }
});

// ---------------------------------------------------------------
// Rastreo de pedido: el cliente escribe su número (SS-XXXXXX) y el
// correo con el que compró. Sin el correo correcto no se muestra nada.
// ---------------------------------------------------------------
const consultasPedido = new Map(); // ip -> { n, desde } para frenar búsquedas a ciegas

app.get('/api/pedido', async (req, res) => {
  const idioma = idiomaDe(req.query.idioma);
  const t = (es, en) => (idioma === 'en' ? en : es);
  const noEncontrado = () => res.status(404).json({ error: t('No encontramos un pedido con ese número y correo. Revisa los datos de tu correo de confirmación.', 'We could not find an order with that number and email. Check your confirmation email.') });

  const reg = consultasPedido.get(req.ip);
  const ahora = Date.now();
  if (reg && reg.n >= 20 && ahora - reg.desde < 15 * 60 * 1000) return res.status(429).json({ error: t('Demasiados intentos. Espera 15 minutos.', 'Too many attempts. Please wait 15 minutes.') });
  consultasPedido.set(req.ip, reg && ahora - reg.desde < 15 * 60 * 1000 ? { ...reg, n: reg.n + 1 } : { n: 1, desde: ahora });

  try {
    const numero = String(req.query.numero || '').toUpperCase().trim();
    const email = String(req.query.email || '').toLowerCase().trim();
    if (!FORMATO_PEDIDO.test(numero) || !email.includes('@')) return noEncontrado();

    const [pi] = await stripe.paymentIntents
      .search({ query: `metadata['pedido']:'${numero}'`, limit: 1, expand: ['data.latest_charge', 'data.customer'] })
      .autoPagingToArray({ limit: 1 });
    if (!pi) return noEncontrado();
    const cargo = pi.latest_charge && typeof pi.latest_charge === 'object' ? pi.latest_charge : null;
    const correos = [pi.receipt_email, cargo?.billing_details?.email, pi.customer?.email].filter(Boolean).map((x) => x.toLowerCase());
    if (!correos.includes(email)) return noEncontrado();

    const m = pi.metadata || {};
    const articulos = String(m.articulos || '').split(',').filter(Boolean).map((par) => {
      const [id, n] = par.split(':');
      return { nombre: PRODUCTOS[id] ? textoDe(PRODUCTOS[id], idioma).nombre : id, cantidad: parseInt(n, 10) || 1 };
    });
    const pagado = pi.status === 'succeeded';
    res.json({
      numero,
      fecha: new Date(pi.created * 1000).toISOString(),
      tipo: m.tipo || 'venta',
      apartado: m.tipo === 'apartado' ? m.apartado : null,
      pago: pagado ? 'pagado' : pi.status === 'processing' || pi.status === 'requires_action' ? 'pendiente' : 'no_pagado',
      moneda: pi.currency,
      monto: pi.amount_received || pi.amount,
      articulos,
      envio: {
        estado: ESTADOS_ENVIO.includes(m.envio_estado) ? m.envio_estado : 'recibido',
        paqueteria: PAQUETERIAS[m.envio_paqueteria] || null,
        guia: m.envio_guia || null,
        rastreo: enlaceRastreo(m.envio_paqueteria, m.envio_guia),
        tipo: m.envio_tipo === 'sucursal' ? 'sucursal' : 'domicilio',
        sucursal: m.envio_tipo === 'sucursal' ? sucursalDe(regionDe(m.region), m.envio_sucursal) : null,
        fecha: m.envio_fecha || null,
      },
    });
  } catch (err) {
    console.error('Error al consultar pedido:', err.message);
    res.status(500).json({ error: t('No se pudo consultar el pedido.', 'We could not load the order.') });
  }
});

// ---------------------------------------------------------------
// 4. Apartados: consulta con el código y abonos del cliente.
// ---------------------------------------------------------------
const publico = (a, idioma) => ({
  id: a.id, moneda: a.moneda, total: a.total, pagado: a.pagado, saldo: a.saldo, vence: a.vence,
  estado: a.estado, pagos: a.pagos, abonoMinimo: a.abonoMinimo,
  articulos: a.articulos.map((x) => ({ ...x, nombre: PRODUCTOS[x.id] ? textoDe(PRODUCTOS[x.id], idioma).nombre : x.nombre })),
  cliente: (a.cliente || '').split(' ')[0],
});

app.get('/api/apartado/:id', async (req, res) => {
  const idioma = idiomaDe(req.query.idioma);
  const t = (es, en) => (idioma === 'en' ? en : es);
  try {
    const id = String(req.params.id).toUpperCase().trim();
    if (!FORMATO_ID.test(id)) return res.status(400).json({ error: t('El código no es válido. Revisa que esté completo (AP-XXXX-XXXX-XXXX-XXXX).', 'Invalid code. Check that it is complete (AP-XXXX-XXXX-XXXX-XXXX).') });
    const a = await consultar(stripe, id, typeof req.query.session_id === 'string' ? req.query.session_id : null);
    if (!a) return res.status(404).json({ error: t('No encontramos ese apartado. Si acabas de pagar, espera un minuto y vuelve a intentar.', 'We could not find that layaway. If you just paid, wait a minute and try again.') });
    res.json(publico(a, idioma));
  } catch (err) {
    console.error('Error al consultar apartado:', err.message);
    res.status(500).json({ error: t('No se pudo consultar el apartado.', 'We could not load the layaway.') });
  }
});

app.post('/api/apartado/:id/abonar', async (req, res) => {
  const idioma = idiomaDe(req.body.idioma);
  const t = (es, en) => (idioma === 'en' ? en : es);
  try {
    const id = String(req.params.id).toUpperCase().trim();
    const sid = typeof req.body.session_id === 'string' ? req.body.session_id : null; // pago recién hecho
    const a = FORMATO_ID.test(id) ? await consultar(stripe, id, sid) : null;
    if (!a) return res.status(404).json({ error: t('Apartado no encontrado.', 'Layaway not found.') });
    if (a.saldo <= 0) return res.status(400).json({ error: t('Este apartado ya está liquidado. ¡Gracias!', 'This layaway is fully paid. Thank you!') });

    let monto = req.body.liquidar ? a.saldo : Math.round(Number(req.body.monto) || 0);
    if (monto < a.abonoMinimo) return res.status(400).json({ error: t(`El abono mínimo es ${dinero(a.abonoMinimo, a.moneda)}.`, `The minimum payment is ${dinero(a.abonoMinimo, a.moneda, 'en')}.`) });
    monto = Math.min(monto, a.saldo);
    const liquida = monto === a.saldo;

    const metadata = { tipo: 'abono', apartado: id, idioma };
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      locale: idioma,
      ...(a.clienteId ? { customer: a.clienteId } : {}),
      line_items: [{
        quantity: 1,
        price_data: {
          currency: a.moneda,
          unit_amount: monto,
          product_data: {
            name: liquida ? t(`Liquidación de apartado ${id}`, `Final layaway payment ${id}`) : t(`Abono a apartado ${id}`, `Layaway payment ${id}`),
            description: t(
              `Saldo antes de este pago: ${dinero(a.saldo, a.moneda)}. Saldo después: ${dinero(a.saldo - monto, a.moneda)}.`,
              `Balance before this payment: ${dinero(a.saldo, a.moneda, 'en')}. Balance after: ${dinero(a.saldo - monto, a.moneda, 'en')}.`
            ),
          },
        },
      }],
      metadata,
      payment_intent_data: { metadata, description: `${liquida ? t('Liquidación', 'Final payment') : t('Abono', 'Payment')} ${id}` },
      success_url: `${DOMAIN}/apartado.html?id=${id}&lang=${idioma}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${DOMAIN}/apartado.html?id=${id}&lang=${idioma}`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Error al crear abono:', err.message);
    res.status(500).json({ error: t('No se pudo iniciar el pago. Intenta de nuevo.', 'We could not start the payment. Please try again.') });
  }
});

// ---------------------------------------------------------------
// 5. Panel de ventas (/admin.html): pedidos, apartados, gráficas y Excel.
//    Los datos se leen de la API de Stripe, así no se pierden
//    aunque el servidor se reinicie. Protegido con ADMIN_PASSWORD.
//    Cada moneda se ve por separado (no se suman pesos con dólares).
// ---------------------------------------------------------------
const intentos = new Map(); // ip -> { n, desde } para frenar adivinanzas de contraseña

function soloAdmin(req, res, next) {
  const clave = process.env.ADMIN_PASSWORD;
  if (!clave) return res.status(503).json({ error: 'Define ADMIN_PASSWORD en el servidor para usar el panel.' });

  const ip = req.ip;
  const reg = intentos.get(ip);
  if (reg && reg.n >= 10 && Date.now() - reg.desde < 15 * 60 * 1000) {
    return res.status(429).json({ error: 'Demasiados intentos. Espera 15 minutos.' });
  }

  const enviada = Buffer.from(String(req.headers['x-admin-password'] || ''));
  const real = Buffer.from(clave);
  if (enviada.length !== real.length || !crypto.timingSafeEqual(enviada, real)) {
    const r = reg && Date.now() - reg.desde < 15 * 60 * 1000 ? reg : { n: 0, desde: Date.now() };
    r.n += 1;
    intentos.set(ip, r);
    return res.status(401).json({ error: 'Contraseña incorrecta.' });
  }
  intentos.delete(ip);
  next();
}

// Convierte 'YYYY-MM-DD' (día local del negocio) a segundos Unix
function inicioDelDia(fecha) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha || '')) return null;
  const [y, m, d] = fecha.split('-').map(Number);
  const utc = Date.UTC(y, m - 1, d);
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: ZONA_HORARIA, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
      .formatToParts(new Date(utc)).map((p) => [p.type, p.value])
  );
  const comoUTC = Date.UTC(+partes.year, +partes.month - 1, +partes.day, +partes.hour, +partes.minute, +partes.second);
  return Math.floor((utc - (comoUTC - utc)) / 1000);
}

const MONEDAS = [...new Set(Object.values(REGIONES).map((r) => r.moneda))];

function rango(req) {
  const desde = inicioDelDia(req.query.desde);
  const finDia = inicioDelDia(req.query.hasta);
  const hasta = finDia != null ? finDia + 86400 - 1 : null;
  const moneda = MONEDAS.includes(req.query.moneda) ? req.query.moneda : MONEDA;
  const etiqueta = (req.query.desde || req.query.hasta ? `${req.query.desde || 'inicio'} a ${req.query.hasta || 'hoy'}` : 'Todo el historial') + ` · ${moneda.toUpperCase()}`;
  return { desde, hasta, moneda, etiqueta };
}

app.get('/api/admin/monedas', soloAdmin, (_req, res) => res.json({ monedas: MONEDAS, principal: MONEDA, paqueterias: PAQUETERIAS, estadosEnvio: ESTADOS_ENVIO }));

// Actualizar el envío de un pedido (estado, paquetería y número de guía).
// Se guarda en la metadata del pago en Stripe; el cliente lo ve en "Rastrear mi pedido".
app.post('/api/admin/envio', soloAdmin, async (req, res) => {
  try {
    const { pi, estado, paqueteria = '', guia = '' } = req.body || {};
    if (typeof pi !== 'string' || !/^pi_[A-Za-z0-9]+$/.test(pi)) return res.status(400).json({ error: 'Pago no válido.' });
    if (!ESTADOS_ENVIO.includes(estado)) return res.status(400).json({ error: 'Estado de envío no válido.' });
    if (paqueteria && !Object.hasOwn(PAQUETERIAS, paqueteria)) return res.status(400).json({ error: 'Paquetería no válida.' });
    const g = String(guia).trim().slice(0, 60);
    await stripe.paymentIntents.update(pi, {
      metadata: {
        envio_estado: estado,
        envio_paqueteria: paqueteria || '',
        envio_guia: g,
        envio_fecha: new Date().toISOString().slice(0, 10),
      },
    });
    limpiarCache();
    console.log(`📦 Envío actualizado ${pi}: ${estado}${g ? ` · ${PAQUETERIAS[paqueteria] || ''} ${g}` : ''}`);
    res.json({ ok: true });
  } catch (err) {
    console.error('Error al actualizar envío:', err.message);
    res.status(500).json({ error: 'No se pudo guardar el envío en Stripe.' });
  }
});

app.get('/api/admin/ventas', soloAdmin, async (req, res) => {
  try {
    const r = rango(req);
    const pedidos = (await obtenerPedidos(stripe, r, paypal)).filter((p) => p.moneda === r.moneda);
    res.json({ resumen: resumir(pedidos, r), pedidos });
  } catch (err) {
    console.error('Error al leer ventas:', err.message);
    res.status(500).json({ error: 'No se pudieron cargar las ventas desde Stripe.' });
  }
});

app.get('/api/admin/apartados', soloAdmin, async (_req, res) => {
  try {
    const lista = await listarTodos(stripe);
    res.json(lista.map(({ clienteId, ...a }) => a));
  } catch (err) {
    console.error('Error al leer apartados:', err.message);
    res.status(500).json({ error: 'No se pudieron cargar los apartados desde Stripe.' });
  }
});

app.get('/api/admin/excel', soloAdmin, async (req, res) => {
  try {
    const r = rango(req);
    const pedidos = (await obtenerPedidos(stripe, r, paypal)).filter((p) => p.moneda === r.moneda);
    const apartados = (await listarTodos(stripe)).filter((a) => a.moneda === r.moneda).map(({ clienteId, ...a }) => a);
    const buffer = await generarExcel(pedidos, resumir(pedidos, r), { ...r, apartados });
    const nombre = `ventas-sunshine-${r.moneda}-${req.query.desde || 'inicio'}-a-${req.query.hasta || 'hoy'}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${nombre}"`);
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('Error al generar Excel:', err.message);
    res.status(500).json({ error: 'No se pudo generar el archivo de Excel.' });
  }
});

app.listen(PORT, () => console.log(`${NEGOCIO.nombre} lista en ${DOMAIN} · regiones: ${Object.keys(REGIONES).join(', ')}`));
