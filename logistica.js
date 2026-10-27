// ---------------------------------------------------------------
// Logística: costos de envío, número de pedido y seguimiento.
//
// El estado del envío se guarda en la metadata del pago en Stripe:
//   envio_estado: recibido | preparando | enviado | listo (para recoger) | entregado
//   envio_tipo: domicilio | sucursal, envio_sucursal: id de la sucursal
//   envio_paqueteria, envio_guia, envio_fecha
// Así no hace falta base de datos y nada se pierde si el servidor
// se reinicia.
// ---------------------------------------------------------------
const crypto = require('crypto');
const { ENVIOS = {} } = require('./productos');

// 'listo' = listo para recoger en sucursal
const ESTADOS_ENVIO = ['recibido', 'preparando', 'enviado', 'listo', 'entregado'];
const FORMATO_PEDIDO = /^SS-[A-HJ-NP-Z2-9]{6}$/;

// Número de pedido corto y fácil de dictar (sin 0/O ni 1/I)
function nuevoPedido() {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const b = crypto.randomBytes(6);
  return 'SS-' + [...b].map((x) => letras[x % letras.length]).join('');
}

// Opciones de entrega de la región para un subtotal dado (centavos).
// La primera opción a domicilio sale gratis desde el monto configurado.
function opcionesEnvio(region, subtotal) {
  const conf = ENVIOS[region];
  if (!conf) return [];
  const gratis = conf.gratisDesde != null && subtotal >= conf.gratisDesde;
  const primeraDomicilio = conf.opciones.find((o) => (o.tipo || 'domicilio') === 'domicilio');
  return conf.opciones.map((o) => ({ ...o, tipo: o.tipo || 'domicilio', monto: gratis && o === primeraDomicilio ? 0 : o.monto }));
}

// La opción que eligió el cliente (o la primera si no eligió una válida)
function elegirEnvio(region, subtotal, envioId) {
  const lista = opcionesEnvio(region, subtotal);
  return lista.find((o) => o.id === envioId) || lista[0] || { id: 'sin-envio', tipo: 'domicilio', nombre: 'Envío', en: 'Shipping', monto: 0, dias: [3, 7] };
}

const sucursalesDe = (region) => ENVIOS[region]?.sucursales || [];
const sucursalDe = (region, id) => sucursalesDe(region).find((s) => s.id === id) || null;

// Formato que pide Stripe Checkout (shipping_options) para la opción elegida
function opcionesStripe(opcion, moneda, idioma) {
  return [{
    shipping_rate_data: {
      type: 'fixed_amount',
      fixed_amount: { amount: opcion.monto, currency: moneda },
      display_name: ((idioma === 'en' ? opcion.en : opcion.nombre) + (opcion.monto === 0 ? (idioma === 'en' ? ' (free)' : ' (gratis)') : '')).slice(0, 100),
      delivery_estimate: {
        minimum: { unit: 'business_day', value: opcion.dias[0] },
        maximum: { unit: 'business_day', value: opcion.dias[1] },
      },
      metadata: { envio: opcion.id },
    },
  }];
}

// Enlace de rastreo según la paquetería
const RASTREO = {
  dhl: (g) => `https://www.dhl.com/mx-es/home/tracking.html?tracking-id=${encodeURIComponent(g)}`,
  fedex: (g) => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(g)}`,
  ups: (g) => `https://www.ups.com/track?tracknum=${encodeURIComponent(g)}`,
  usps: (g) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(g)}`,
  estafeta: () => 'https://www.estafeta.com/Herramientas/Rastreo',
  redpack: () => 'https://www.redpack.com.mx/es/rastreo/',
  correos: () => 'https://www.correosdemexico.gob.mx/SSLServicios/SeguimientoEnvio/Seguimiento.aspx',
};
const PAQUETERIAS = { dhl: 'DHL', fedex: 'FedEx', ups: 'UPS', usps: 'USPS', estafeta: 'Estafeta', redpack: 'Redpack', correos: 'Correos de México', otra: 'Otra' };
const enlaceRastreo = (paqueteria, guia) => (guia && RASTREO[paqueteria] ? RASTREO[paqueteria](guia) : null);

module.exports = { ESTADOS_ENVIO, FORMATO_PEDIDO, PAQUETERIAS, nuevoPedido, opcionesEnvio, elegirEnvio, sucursalesDe, sucursalDe, opcionesStripe, enlaceRastreo };
