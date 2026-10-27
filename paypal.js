// ---------------------------------------------------------------
// PayPal (Orders API v2). Se usa para el pago completo con PayPal;
// las tarjetas y los apartados van por Stripe.
//
// Variables de entorno:
//   PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET  → de developer.paypal.com
//   PAYPAL_MODO = sandbox (pruebas) | live (cobros reales)
// La llave secreta vive SOLO en el servidor.
// ---------------------------------------------------------------
const ID = (process.env.PAYPAL_CLIENT_ID || '').trim();
const SECRETO = (process.env.PAYPAL_CLIENT_SECRET || '').trim();
const BASE = process.env.PAYPAL_MODO === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
const activo = Boolean(ID && SECRETO);

let token = null, vence = 0;
async function obtenerToken() {
  if (token && Date.now() < vence) return token;
  const r = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: 'Basic ' + Buffer.from(`${ID}:${SECRETO}`).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  const d = await r.json();
  if (!r.ok) throw new Error(`PayPal token: ${d.error_description || r.status}`);
  token = d.access_token;
  vence = Date.now() + (d.expires_in - 60) * 1000;
  return token;
}

async function llamar(metodo, ruta, cuerpo) {
  const r = await fetch(BASE + ruta, {
    method: metodo,
    headers: { Authorization: `Bearer ${await obtenerToken()}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    ...(cuerpo ? { body: JSON.stringify(cuerpo) } : {}),
  });
  const d = r.status === 204 ? {} : await r.json();
  if (!r.ok) {
    const e = new Error(`PayPal ${ruta}: ${d.message || d.name || r.status}`);
    e.detalle = d;
    throw e;
  }
  return d;
}

const valor = (centavos) => (centavos / 100).toFixed(2);

// Crea la orden con los precios del servidor (nunca los del navegador)
// custom_id guarda: número de pedido; forma de entrega; sucursal (si recoge)
function crearOrden({ pedido, moneda, articulos, envio, idioma, marca, sucursal = null }) {
  const cur = moneda.toUpperCase();
  const subtotal = articulos.reduce((s, a) => s + a.precio * a.cantidad, 0);
  return llamar('POST', '/v2/checkout/orders', {
    intent: 'CAPTURE',
    purchase_units: [{
      reference_id: pedido,
      custom_id: [pedido, envio.id, sucursal?.id || ''].join(';').slice(0, 127),
      invoice_id: pedido,
      description: `${marca} · ${pedido}${sucursal ? (idioma === 'en' ? ' · Pick up: ' : ' · Recoger: ') + sucursal.nombre : ''}`.slice(0, 127),
      amount: {
        currency_code: cur,
        value: valor(subtotal + envio.monto),
        breakdown: { item_total: { currency_code: cur, value: valor(subtotal) }, shipping: { currency_code: cur, value: valor(envio.monto) } },
      },
      items: articulos.map((a) => ({
        name: a.nombre.slice(0, 127), sku: a.id.slice(0, 127), quantity: String(a.cantidad), category: 'PHYSICAL_GOODS',
        unit_amount: { currency_code: cur, value: valor(a.precio) },
      })),
    }],
    application_context: {
      brand_name: marca,
      locale: idioma === 'en' ? 'en-US' : 'es-MX',
      // A domicilio: el cliente elige su dirección en PayPal. En sucursal: no se pide dirección
      shipping_preference: sucursal ? 'NO_SHIPPING' : 'GET_FROM_FILE',
      user_action: 'PAY_NOW',
    },
  });
}

const verOrden = (id) => llamar('GET', `/v2/checkout/orders/${encodeURIComponent(id)}`);
const capturar = (id) => llamar('POST', `/v2/checkout/orders/${encodeURIComponent(id)}/capture`, {});

// Ventas cobradas con PayPal en un rango (para el panel y el Excel).
// Usa la API de búsqueda de transacciones: los cobros pueden tardar
// hasta 3 horas en aparecer, y cada consulta cubre como máximo 31 días.
async function transacciones(desdeSeg, hastaSeg) {
  const fin = hastaSeg ? hastaSeg * 1000 : Date.now();
  let inicio = desdeSeg ? desdeSeg * 1000 : fin - 365 * 86400 * 1000; // "Todo": último año
  const lista = [];
  while (inicio < fin) {
    const corte = Math.min(inicio + 31 * 86400 * 1000 - 1000, fin);
    let pagina = 1, total = 1;
    do {
      const q = new URLSearchParams({
        start_date: new Date(inicio).toISOString().replace(/\.\d{3}Z$/, 'Z'),
        end_date: new Date(corte).toISOString().replace(/\.\d{3}Z$/, 'Z'),
        fields: 'transaction_info,payer_info,shipping_info,cart_info',
        page_size: '500', page: String(pagina),
      });
      const d = await llamar('GET', `/v1/reporting/transactions?${q}`);
      lista.push(...(d.transaction_details || []));
      total = d.total_pages || 1;
      pagina++;
    } while (pagina <= total);
    inicio = corte + 1000;
  }
  // Solo cobros recibidos (códigos T00xx) que estén completados
  return lista.filter((t) => /^T00/.test(t.transaction_info?.transaction_event_code || '') && t.transaction_info?.transaction_status === 'S');
}

module.exports = { activo, ID, MODO: BASE.includes('sandbox') ? 'sandbox' : 'live', crearOrden, verOrden, capturar, transacciones };
