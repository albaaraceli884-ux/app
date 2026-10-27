// ---------------------------------------------------------------
// Ventas: lee los pedidos desde la API de Stripe, calcula el
// resumen para el panel y genera el archivo de Excel.
// Stripe es la fuente de verdad: no hay base de datos que perder.
// ---------------------------------------------------------------
const ExcelJS = require('exceljs');
const { NEGOCIO, MONEDA, ZONA_HORARIA, PRODUCTOS, CATEGORIAS, ENVIOS = {} } = require('./productos');

// Nombre de cada sucursal por id (para las ventas de PayPal)
const sucursales = Object.fromEntries(Object.values(ENVIOS).flatMap((e) => (e.sucursales || []).map((s) => [s.id, `${s.nombre} · ${s.ciudad}`])));

// Fecha local (YYYY-MM-DD) en la zona horaria del negocio
const diaLocal = (seg) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_HORARIA, year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(new Date(seg * 1000));

// Categoría de un artículo vendido, por su nombre (en español o inglés)
const categoriaDe = (nombre) => {
  const p = Object.values(PRODUCTOS).find((x) => x.nombre === nombre || x.en?.nombre === nombre);
  return p ? CATEGORIAS[p.categoria]?.nombre || p.categoria : 'Otros';
};

// Convierte transacciones de PayPal al mismo formato de pedido del panel
function pedidosPayPal(lista, nombresSucursal) {
  const centavos = (v) => Math.round(parseFloat(v || '0') * 100);
  return lista.map((tx) => {
    const ti = tx.transaction_info || {};
    const pago = tx.payer_info || {};
    const dir = tx.shipping_info?.address || {};
    const [pedido, , sucursalId] = String(ti.custom_field || '').split(';');
    const seg = Math.floor(new Date(ti.transaction_initiation_date).getTime() / 1000);
    const sucursal = sucursalId ? nombresSucursal[sucursalId] || sucursalId : '';
    return {
      id: ti.transaction_id,
      creado: seg,
      fecha: new Date(seg * 1000).toISOString(),
      dia: diaLocal(seg),
      estado: 'pagado',
      tipo: 'venta',
      metodo: 'paypal',
      pedido: pedido || ti.invoice_id || '',
      piId: null, // el envío de estas ventas se registra en PayPal
      envio: { estado: '', paqueteria: '', guia: '', costo: centavos(ti.shipping_amount?.value), tipo: sucursal ? 'sucursal' : 'domicilio', sucursal },
      apartado: '',
      cliente: pago.payer_name?.alternate_full_name || [pago.payer_name?.given_name, pago.payer_name?.surname].filter(Boolean).join(' '),
      email: pago.email_address || '',
      telefono: pago.phone_number?.national_number || '',
      direccion: sucursal ? `Recoger en sucursal: ${sucursal}` : [dir.line1, dir.line2, dir.city, dir.state, dir.postal_code, dir.country_code].filter(Boolean).join(', '),
      total: centavos(ti.transaction_amount?.value),
      reembolsado: 0,
      moneda: String(ti.transaction_amount?.currency_code || MONEDA).toLowerCase(),
      articulos: (tx.cart_info?.item_details || []).map((i) => ({
        nombre: i.item_name || 'Artículo',
        cantidad: parseInt(i.item_quantity, 10) || 1,
        subtotal: centavos(i.total_item_amount?.value || i.item_amount?.value),
      })),
    };
  });
}

// Pequeña caché para no consultar Stripe en cada clic (60 s)
const cache = new Map();
const VIGENCIA_MS = 60 * 1000;

async function obtenerPedidos(stripe, { desde, hasta }, paypal = null) {
  const clave = `${desde || ''}|${hasta || ''}`;
  const guardado = cache.get(clave);
  if (guardado && Date.now() - guardado.hora < VIGENCIA_MS) return guardado.datos;

  const created = {};
  if (desde) created.gte = desde;
  if (hasta) created.lte = hasta;

  const sesiones = await stripe.checkout.sessions
    .list({
      limit: 100,
      ...(desde || hasta ? { created } : {}),
      expand: ['data.line_items', 'data.payment_intent.latest_charge'],
    })
    .autoPagingToArray({ limit: 10000 });

  const pedidos = [];
  for (const s of sesiones) {
    if (s.status !== 'complete') continue; // carritos abandonados o expirados no cuentan

    let articulos = s.line_items?.data || [];
    if (s.line_items?.has_more) {
      articulos = await stripe.checkout.sessions.listLineItems(s.id, { limit: 100 }).autoPagingToArray({ limit: 1000 });
    }

    const cargo = s.payment_intent && typeof s.payment_intent === 'object' ? s.payment_intent.latest_charge : null;
    const reembolsado = cargo && typeof cargo === 'object' ? cargo.amount_refunded || 0 : 0;
    const envio = s.collected_information?.shipping_details || s.shipping_details || null;
    const dir = envio?.address;

    const meta = (s.payment_intent && typeof s.payment_intent === 'object' ? s.payment_intent.metadata : null) || {};
    const sucursal = meta.envio_sucursal_nombre || '';

    pedidos.push({
      id: s.id,
      creado: s.created,
      fecha: new Date(s.created * 1000).toISOString(),
      dia: diaLocal(s.created),
      estado: s.payment_status === 'paid' ? (reembolsado >= s.amount_total && reembolsado > 0 ? 'reembolsado' : 'pagado') : 'pendiente',
      tipo: s.metadata?.tipo || 'venta', // venta | apartado (anticipo) | abono
      metodo: 'tarjeta',
      pedido: s.metadata?.pedido || '',
      piId: s.payment_intent && typeof s.payment_intent === 'object' ? s.payment_intent.id : (s.payment_intent || null),
      envio: {
        estado: meta.envio_estado || 'recibido', paqueteria: meta.envio_paqueteria || '', guia: meta.envio_guia || '',
        costo: s.shipping_cost?.amount_total || parseInt(s.metadata?.envio || '0', 10) || 0,
        tipo: meta.envio_tipo || 'domicilio', sucursal,
      },
      apartado: s.metadata?.apartado || '',
      cliente: s.customer_details?.name || '',
      email: s.customer_details?.email || '',
      telefono: s.customer_details?.phone || '',
      direccion: sucursal ? `Recoger en sucursal: ${sucursal}` : dir ? [dir.line1, dir.line2, dir.city, dir.state, dir.postal_code, dir.country].filter(Boolean).join(', ') : '',
      total: s.amount_total || 0, // centavos
      reembolsado, // centavos
      moneda: s.currency || MONEDA,
      articulos: articulos.map((a) => ({ nombre: a.description, cantidad: a.quantity || 0, subtotal: a.amount_total || 0 })),
    });
  }

  // Ventas cobradas con PayPal (si está configurado). Si PayPal falla, se
  // muestran igual las de Stripe y se avisa en el registro del servidor.
  if (paypal?.activo) {
    try {
      pedidos.push(...pedidosPayPal(await paypal.transacciones(desde, hasta), sucursales));
    } catch (err) {
      console.error('No se pudieron leer las ventas de PayPal:', err.message);
    }
  }
  pedidos.sort((a, b) => b.creado - a.creado);

  cache.set(clave, { hora: Date.now(), datos: pedidos });
  if (cache.size > 50) cache.delete(cache.keys().next().value);
  return pedidos;
}

// Resumen para el panel: KPIs, ventas por día, por producto y por categoría
function resumir(pedidos, { desde, hasta }) {
  const cobrados = pedidos.filter((p) => p.estado !== 'pendiente');
  const neto = (p) => p.total - p.reembolsado;

  const ventas = cobrados.reduce((s, p) => s + neto(p), 0);
  const reembolsos = cobrados.reduce((s, p) => s + p.reembolsado, 0);
  const piezas = cobrados.filter((p) => p.tipo === 'venta').reduce((s, p) => s + p.articulos.reduce((t, a) => t + a.cantidad, 0), 0);

  // Ventas por día, incluyendo los días sin ventas (para que la gráfica no mienta)
  const porDia = new Map();
  if (desde && hasta && hasta - desde <= 400 * 86400) {
    for (let t = desde; t <= hasta; t += 86400) porDia.set(diaLocal(t), { dia: diaLocal(t), ventas: 0, pedidos: 0 });
    if (!porDia.has(diaLocal(hasta))) porDia.set(diaLocal(hasta), { dia: diaLocal(hasta), ventas: 0, pedidos: 0 });
  }
  for (const p of cobrados) {
    const d = porDia.get(p.dia) || { dia: p.dia, ventas: 0, pedidos: 0 };
    d.ventas += neto(p);
    if (p.tipo !== 'abono') d.pedidos += 1;
    porDia.set(p.dia, d);
  }

  // Por producto y categoría: ventas directas. Lo cobrado en apartados
  // (anticipos y abonos) va en su propio renglón para que el total cuadre.
  const porProducto = new Map();
  const porCategoria = new Map();
  let cobradoApartados = 0;
  for (const p of cobrados) {
    if (p.tipo !== 'venta') { cobradoApartados += neto(p); continue; }
    for (const a of p.articulos) {
      const x = porProducto.get(a.nombre) || { producto: a.nombre, categoria: categoriaDe(a.nombre), piezas: 0, ventas: 0 };
      x.piezas += a.cantidad;
      x.ventas += a.subtotal;
      porProducto.set(a.nombre, x);
      const c = porCategoria.get(x.categoria) || { categoria: x.categoria, piezas: 0, ventas: 0 };
      c.piezas += a.cantidad;
      c.ventas += a.subtotal;
      porCategoria.set(x.categoria, c);
    }
  }
  if (cobradoApartados) {
    porProducto.set('__apartados', { producto: 'Apartados (anticipos y abonos)', categoria: 'Apartados', piezas: 0, ventas: cobradoApartados });
    porCategoria.set('__apartados', { categoria: 'Apartados (anticipos y abonos)', piezas: 0, ventas: cobradoApartados });
  }

  // Abonos no son pedidos nuevos: cuentan como dinero, no como pedido
  const nuevos = cobrados.filter((p) => p.tipo !== 'abono');
  return {
    moneda: pedidos[0]?.moneda || MONEDA,
    ventas,
    reembolsos,
    cobradoApartados,
    pedidosCobrados: nuevos.length,
    apartadosNuevos: nuevos.filter((p) => p.tipo === 'apartado').length,
    pendientes: pedidos.length - cobrados.length,
    ticketPromedio: nuevos.length ? Math.round(ventas / nuevos.length) : 0,
    piezas,
    porDia: [...porDia.values()].sort((a, b) => a.dia.localeCompare(b.dia)),
    porProducto: [...porProducto.values()].sort((a, b) => b.ventas - a.ventas),
    porCategoria: [...porCategoria.values()].sort((a, b) => b.ventas - a.ventas),
  };
}

// ---------------------------------------------------------------
// Excel: los totales del Resumen son FÓRMULAS que leen la hoja
// Pedidos, así que si editas o filtras datos se recalculan.
// ---------------------------------------------------------------
const ESTADOS = { pagado: 'Pagado', reembolsado: 'Reembolsado', pendiente: 'Pendiente' };
const TIPOS = { venta: 'Venta', apartado: 'Anticipo apartado', abono: 'Abono' };
const ESTADOS_AP = { vigente: 'Vigente', vencido: 'Vencido', liquidado: 'Liquidado' };

async function generarExcel(pedidos, resumen, { etiqueta, apartados = [] }) {
  const libro = new ExcelJS.Workbook();
  libro.creator = NEGOCIO.nombre;
  libro.created = new Date();
  // La hoja Resumen se crea primero (para que abra al inicio) y se llena al final
  const hs = libro.addWorksheet('Resumen', { views: [{ showGridLines: false }] });

  const fmtDinero = `"$"#,##0.00`;
  const encabezado = (hoja) => {
    const fila = hoja.getRow(1);
    fila.font = { bold: true, color: { argb: 'FF2A1E12' } };
    fila.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5A524' } };
    fila.alignment = { vertical: 'middle' };
    fila.height = 22;
    hoja.views = [{ state: 'frozen', ySplit: 1 }];
    hoja.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: hoja.columnCount } };
  };
  const fechaExcel = (seg) => new Date(seg * 1000);

  // --- Pedidos --- (las fórmulas usan C=Estado, H=Total, I=Reembolsado, J=Neto, N=Tipo)
  const hp = libro.addWorksheet('Pedidos');
  hp.columns = [
    { header: 'Fecha', key: 'fecha', width: 19, style: { numFmt: 'dd/mm/yyyy hh:mm' } },
    { header: 'Día', key: 'dia', width: 12 },
    { header: 'Estado', key: 'estado', width: 13 },
    { header: 'Cliente', key: 'cliente', width: 24 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Teléfono', key: 'telefono', width: 16 },
    { header: 'Dirección de envío', key: 'direccion', width: 45 },
    { header: 'Total', key: 'total', width: 13, style: { numFmt: fmtDinero } },
    { header: 'Reembolsado', key: 'reembolsado', width: 13, style: { numFmt: fmtDinero } },
    { header: 'Neto', key: 'neto', width: 13, style: { numFmt: fmtDinero } },
    { header: 'Moneda', key: 'moneda', width: 8 },
    { header: 'Artículos', key: 'articulos', width: 40 },
    { header: 'ID Stripe', key: 'id', width: 30 },
    { header: 'Tipo', key: 'tipo', width: 17 },
    { header: 'Apartado', key: 'apartado', width: 24 },
    { header: 'No. de pedido', key: 'pedido', width: 13 },
    { header: 'Envío', key: 'envioEstado', width: 12 },
    { header: 'Paquetería', key: 'paqueteria', width: 12 },
    { header: 'Guía', key: 'guia', width: 22 },
    { header: 'Costo de envío', key: 'costoEnvio', width: 14, style: { numFmt: fmtDinero } },
    { header: 'Método de pago', key: 'metodo', width: 14 },
    { header: 'Entrega', key: 'entrega', width: 30 },
  ];
  pedidos.forEach((p, i) => {
    const r = i + 2;
    hp.addRow({
      fecha: fechaExcel(p.creado),
      dia: p.dia,
      estado: ESTADOS[p.estado],
      cliente: p.cliente,
      email: p.email,
      telefono: p.telefono,
      direccion: p.direccion,
      total: p.total / 100,
      reembolsado: p.reembolsado / 100,
      neto: { formula: `IF(C${r}="Pendiente",0,H${r}-I${r})`, result: p.estado === 'pendiente' ? 0 : (p.total - p.reembolsado) / 100 },
      moneda: p.moneda.toUpperCase(),
      articulos: p.articulos.map((a) => `${a.cantidad} × ${a.nombre}`).join('; '),
      id: p.id,
      tipo: TIPOS[p.tipo] || p.tipo,
      apartado: p.apartado,
      pedido: p.pedido,
      envioEstado: p.envio?.estado || '',
      paqueteria: p.envio?.paqueteria || '',
      guia: p.envio?.guia || '',
      costoEnvio: (p.envio?.costo || 0) / 100,
      metodo: p.metodo === 'paypal' ? 'PayPal' : 'Tarjeta',
      entrega: p.envio?.tipo === 'sucursal' ? `Recoger: ${p.envio.sucursal}` : 'A domicilio',
    });
  });
  encabezado(hp);
  const ultima = Math.max(pedidos.length + 1, 2);

  // --- Artículos (una fila por producto vendido) --- (D=Cantidad, F=Estado, I=Tipo)
  const ha = libro.addWorksheet('Artículos');
  ha.columns = [
    { header: 'Fecha', key: 'fecha', width: 19, style: { numFmt: 'dd/mm/yyyy hh:mm' } },
    { header: 'Día', key: 'dia', width: 12 },
    { header: 'Producto', key: 'producto', width: 30 },
    { header: 'Cantidad', key: 'cantidad', width: 10 },
    { header: 'Subtotal', key: 'subtotal', width: 13, style: { numFmt: fmtDinero } },
    { header: 'Estado', key: 'estado', width: 13 },
    { header: 'Cliente', key: 'cliente', width: 24 },
    { header: 'ID Stripe', key: 'id', width: 30 },
    { header: 'Tipo', key: 'tipo', width: 17 },
    { header: 'Categoría', key: 'categoria', width: 15 },
  ];
  for (const p of pedidos) {
    for (const a of p.articulos) {
      ha.addRow({
        fecha: fechaExcel(p.creado), dia: p.dia, producto: a.nombre, cantidad: a.cantidad, subtotal: a.subtotal / 100,
        estado: ESTADOS[p.estado], cliente: p.cliente, id: p.id, tipo: TIPOS[p.tipo] || p.tipo,
        categoria: p.tipo === 'venta' ? categoriaDe(a.nombre) : 'Apartados',
      });
    }
  }
  encabezado(ha);
  const ultimaArt = Math.max(ha.rowCount, 2);

  // --- Ventas por día ---
  const hd = libro.addWorksheet('Ventas por día');
  hd.columns = [
    { header: 'Día', key: 'dia', width: 12 },
    { header: 'Pedidos', key: 'pedidos', width: 10 },
    { header: 'Ventas netas', key: 'ventas', width: 15, style: { numFmt: fmtDinero } },
  ];
  resumen.porDia.forEach((d) => hd.addRow({ dia: d.dia, pedidos: d.pedidos, ventas: d.ventas / 100 }));
  encabezado(hd);

  // --- Ventas por categoría y por producto ---
  const conPorcentaje = (hoja, filas, claveNombre, titulo) => {
    hoja.columns = [
      { header: titulo, key: 'nombre', width: 32 },
      ...(titulo === 'Producto' ? [{ header: 'Categoría', key: 'categoria', width: 15 }] : []),
      { header: 'Piezas', key: 'piezas', width: 10 },
      { header: 'Ventas', key: 'ventas', width: 15, style: { numFmt: fmtDinero } },
      { header: '% del total', key: 'pct', width: 12, style: { numFmt: '0.0%' } },
    ];
    const col = titulo === 'Producto' ? 'D' : 'C';
    const n = filas.length;
    const total = filas.reduce((s, x) => s + x.ventas, 0);
    filas.forEach((x, i) => {
      const r = i + 2;
      hoja.addRow({
        nombre: x[claveNombre], categoria: x.categoria, piezas: x.piezas, ventas: x.ventas / 100,
        pct: { formula: `IF(SUM(${col}$2:${col}$${n + 1})=0,0,${col}${r}/SUM(${col}$2:${col}$${n + 1}))`, result: total ? x.ventas / total : 0 },
      });
    });
    encabezado(hoja);
  };
  conPorcentaje(libro.addWorksheet('Ventas por categoría'), resumen.porCategoria, 'categoria', 'Categoría');
  conPorcentaje(libro.addWorksheet('Ventas por producto'), resumen.porProducto, 'producto', 'Producto');

  // --- Apartados (todos, sin importar el periodo) --- (B=Estado, F=Saldo)
  const hap = libro.addWorksheet('Apartados');
  hap.columns = [
    { header: 'Código', key: 'id', width: 24 },
    { header: 'Estado', key: 'estado', width: 11 },
    { header: 'Vence', key: 'vence', width: 12 },
    { header: 'Total', key: 'total', width: 13, style: { numFmt: fmtDinero } },
    { header: 'Pagado', key: 'pagado', width: 13, style: { numFmt: fmtDinero } },
    { header: 'Saldo', key: 'saldo', width: 13, style: { numFmt: fmtDinero } },
    { header: 'Cliente', key: 'cliente', width: 24 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Teléfono', key: 'telefono', width: 16 },
    { header: 'Productos', key: 'articulos', width: 40 },
    { header: 'Pagos', key: 'pagos', width: 8 },
    { header: 'Creado', key: 'creado', width: 19, style: { numFmt: 'dd/mm/yyyy hh:mm' } },
  ];
  apartados.forEach((a, i) => {
    const r = i + 2;
    hap.addRow({
      id: a.id, estado: ESTADOS_AP[a.estado], vence: a.vence, total: a.total / 100, pagado: a.pagado / 100,
      saldo: { formula: `MAX(D${r}-E${r},0)`, result: a.saldo / 100 },
      cliente: a.cliente, email: a.email, telefono: a.telefono,
      articulos: a.articulos.map((x) => `${x.cantidad} × ${x.nombre}`).join('; '),
      pagos: a.pagos.length, creado: new Date(a.creado),
    });
  });
  encabezado(hap);
  const ultimaAp = Math.max(apartados.length + 1, 2);

  // --- Resumen (primera hoja) ---
  hs.getColumn(1).width = 34;
  hs.getColumn(2).width = 22;
  hs.getCell('A1').value = NEGOCIO.nombre;
  hs.getCell('A1').font = { bold: true, size: 18 };
  hs.getCell('A2').value = `Reporte de ventas · ${etiqueta}`;
  hs.getCell('A2').font = { color: { argb: 'FF6E5C49' } };
  hs.getCell('A3').value = `Generado: ${new Date().toLocaleString('es-MX', { timeZone: ZONA_HORARIA })}`;
  hs.getCell('A3').font = { color: { argb: 'FF6E5C49' }, size: 9 };

  const P = 'Pedidos!';
  const A = "'Artículos'!";
  const porCobrar = apartados.filter((a) => a.estado !== 'liquidado').reduce((s, a) => s + a.saldo, 0);
  const filas = [
    ['Ventas netas', { formula: `SUM(${P}J2:J${ultima})`, result: resumen.ventas / 100 }, fmtDinero],
    ['Pedidos cobrados', { formula: `COUNTIFS(${P}C2:C${ultima},"<>Pendiente",${P}N2:N${ultima},"<>Abono")`, result: resumen.pedidosCobrados }, '0'],
    ['Ticket promedio', { formula: 'IFERROR(B5/B6,0)', result: resumen.ticketPromedio / 100 }, fmtDinero],
    ['Piezas vendidas (ventas directas)', { formula: `SUMIFS(${A}D2:D${ultimaArt},${A}F2:F${ultimaArt},"<>Pendiente",${A}I2:I${ultimaArt},"Venta")`, result: resumen.piezas }, '0'],
    ['Cobrado en apartados', { formula: `SUMIFS(${P}J2:J${ultima},${P}N2:N${ultima},"<>Venta")`, result: resumen.cobradoApartados / 100 }, fmtDinero],
    ['Reembolsos', { formula: `SUM(${P}I2:I${ultima})`, result: resumen.reembolsos / 100 }, fmtDinero],
    ['Pendientes de pago', { formula: `COUNTIF(${P}C2:C${ultima},"Pendiente")`, result: resumen.pendientes }, '0'],
    ['Saldo por cobrar en apartados (todos)', { formula: `SUMIFS(Apartados!F2:F${ultimaAp},Apartados!B2:B${ultimaAp},"<>Liquidado")`, result: porCobrar / 100 }, fmtDinero],
  ];
  filas.forEach(([nombre, valor, fmt], i) => {
    const r = 5 + i;
    hs.getCell(`A${r}`).value = nombre;
    hs.getCell(`A${r}`).font = { color: { argb: 'FF6E5C49' } };
    const c = hs.getCell(`B${r}`);
    c.value = valor;
    c.numFmt = fmt;
    c.font = { bold: true, size: 14 };
    c.border = { bottom: { style: 'thin', color: { argb: 'FFEADBC4' } } };
  });
  hs.getCell('B5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF1D6' } };
  hs.getCell('A14').value = 'Detalle en las hojas: Pedidos, Artículos, Ventas por día, por categoría, por producto y Apartados.';
  hs.getCell('A14').font = { italic: true, size: 9, color: { argb: 'FF6E5C49' } };

  return libro.xlsx.writeBuffer();
}

// Borra la caché (después de actualizar un envío, para ver el cambio al momento)
const limpiarCache = () => cache.clear();

module.exports = { obtenerPedidos, resumir, generarExcel, limpiarCache };
