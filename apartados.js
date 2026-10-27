// ---------------------------------------------------------------
// Apartados: el cliente paga un anticipo y liquida el resto en
// abonos (o de una vez) antes de la fecha límite.
//
// Todo vive en Stripe, en la metadata de cada pago:
//   anticipo → { tipo: 'apartado', apartado: 'AP-…', total, vence, articulos }
//   abono    → { tipo: 'abono',    apartado: 'AP-…' }
// El saldo se calcula sumando los pagos con la Search API de Stripe.
// ---------------------------------------------------------------
const crypto = require('crypto');
const { MONEDA, PRODUCTOS, APARTADO, ZONA_HORARIA } = require('./productos');

const FORMATO_ID = /^AP-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/;

// Código difícil de adivinar: funciona como "llave" del apartado
function nuevoId() {
  const h = crypto.randomBytes(8).toString('hex').toUpperCase();
  return `AP-${h.slice(0, 4)}-${h.slice(4, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}`;
}

const hoyMas = (dias) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_HORARIA, year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(new Date(Date.now() + dias * 86400 * 1000));
const hoy = () => hoyMas(0);

// "hogar-1:2,jardin-3:1" ↔ [{ id, cantidad }]
const codificar = (items) => items.map((i) => `${i.id}:${i.cantidad}`).join(',');
const decodificar = (txt) =>
  String(txt || '').split(',').filter(Boolean).map((par) => {
    const [id, n] = par.split(':');
    return { id, cantidad: parseInt(n, 10) || 1, nombre: PRODUCTOS[id]?.nombre || id };
  });

// Abono mínimo según la moneda ($100 MXN, US$5, etc.)
const minimoDe = (moneda) => (typeof APARTADO.abonoMinimo === 'object' ? APARTADO.abonoMinimo[moneda] ?? 500 : APARTADO.abonoMinimo);
const anticipoDe = (total, moneda) => Math.max(Math.ceil((total * APARTADO.anticipoPorcentaje) / 100), Math.min(minimoDe(moneda), total));

// Busca todos los pagos exitosos de un apartado
async function pagosDe(stripe, id) {
  return stripe.paymentIntents
    .search({ query: `metadata['apartado']:'${id}' AND status:'succeeded'`, limit: 100, expand: ['data.customer'] })
    .autoPagingToArray({ limit: 500 });
}

function armarEstado(id, pagos) {
  const anticipo = pagos.find((p) => p.metadata?.tipo === 'apartado');
  if (!anticipo) return null;
  const total = parseInt(anticipo.metadata.total, 10) || 0;
  const pagado = pagos.reduce((s, p) => s + (p.amount_received || 0), 0);
  const saldo = Math.max(total - pagado, 0);
  const vence = anticipo.metadata.vence;
  const cliente = anticipo.customer && typeof anticipo.customer === 'object' ? anticipo.customer : null;
  return {
    id,
    moneda: anticipo.currency || MONEDA,
    total,
    pagado,
    saldo,
    vence,
    creado: new Date(anticipo.created * 1000).toISOString(),
    estado: saldo === 0 ? 'liquidado' : vence && hoy() > vence ? 'vencido' : 'vigente',
    articulos: decodificar(anticipo.metadata.articulos),
    cliente: cliente?.name || '',
    email: cliente?.email || anticipo.receipt_email || '',
    telefono: cliente?.phone || '',
    clienteId: cliente?.id || (typeof anticipo.customer === 'string' ? anticipo.customer : null), // uso interno
    abonoMinimo: Math.min(minimoDe(anticipo.currency || MONEDA), saldo),
    pagos: pagos
      .map((p) => ({ fecha: new Date(p.created * 1000).toISOString(), monto: p.amount_received, tipo: p.metadata?.tipo === 'apartado' ? 'Anticipo' : 'Abono' }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha)),
  };
}

// Estado del apartado. Si el cliente acaba de pagar, `sessionId` permite
// sumar ese pago aunque la búsqueda de Stripe aún no lo indexe (~1 min).
async function consultar(stripe, id, sessionId) {
  if (!FORMATO_ID.test(id)) return null;
  const pagos = await pagosDe(stripe, id);

  if (sessionId) {
    try {
      const s = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['payment_intent', 'payment_intent.customer'] });
      const pi = s.payment_intent;
      if (s.metadata?.apartado === id && s.payment_status === 'paid' && pi && typeof pi === 'object' && pi.status === 'succeeded' && !pagos.some((p) => p.id === pi.id)) {
        if (!pi.receipt_email && s.customer_details?.email) pi.receipt_email = s.customer_details.email;
        pagos.push(pi);
      }
    } catch { /* sesión inválida: se ignora */ }
  }
  return armarEstado(id, pagos);
}

// Todos los apartados (para el panel de ventas)
async function listarTodos(stripe) {
  const [anticipos, abonos] = await Promise.all([
    stripe.paymentIntents.search({ query: `metadata['tipo']:'apartado' AND status:'succeeded'`, limit: 100, expand: ['data.customer'] }).autoPagingToArray({ limit: 5000 }),
    stripe.paymentIntents.search({ query: `metadata['tipo']:'abono' AND status:'succeeded'`, limit: 100 }).autoPagingToArray({ limit: 10000 }),
  ]);
  const porId = new Map();
  for (const p of [...anticipos, ...abonos]) {
    const id = p.metadata?.apartado;
    if (!id) continue;
    if (!porId.has(id)) porId.set(id, []);
    porId.get(id).push(p);
  }
  const orden = { vencido: 0, vigente: 1, liquidado: 2 };
  return [...porId.entries()]
    .map(([id, pagos]) => armarEstado(id, pagos))
    .filter(Boolean)
    .sort((a, b) => orden[a.estado] - orden[b.estado] || String(a.vence).localeCompare(String(b.vence)));
}

module.exports = { FORMATO_ID, nuevoId, hoyMas, codificar, anticipoDe, minimoDe, consultar, listarTodos };
