const $ = (id) => document.getElementById(id);
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let moneda = 'mxn';
const dinero = (c) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: moneda.toUpperCase() }).format(c / 100);
const dineroCorto = (c) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: moneda.toUpperCase(), notation: 'compact', maximumFractionDigits: 1 }).format(c / 100);
const fecha = (iso) => new Date(iso).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const etiquetaDia = (s) => { const [, m, d] = s.split('-'); return `${+d} ${MESES[+m - 1]}`; };
const etiquetaMes = (s) => { const [y, m] = s.split('-'); return `${MESES[+m - 1]} ${y.slice(2)}`; };

let clave = '';
try { clave = sessionStorage.getItem('clave-admin') || ''; } catch {}
let pedidos = [];
let visibles = 40;
let ultimoResumen = null;

// ---------- Periodo ----------
function aplicarPreset(p) {
  const hoy = new Date();
  let desde = new Date(hoy);
  if (p === '7') desde.setDate(hoy.getDate() - 6);
  else if (p === '30') desde.setDate(hoy.getDate() - 29);
  else if (p === 'mes') desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  else if (p === 'anio') desde = new Date(hoy.getFullYear(), 0, 1);
  $('desde').value = p === 'todo' ? '' : ymd(desde);
  $('hasta').value = p === 'todo' ? '' : ymd(hoy);
  document.querySelectorAll('#rapidos button').forEach(b => b.setAttribute('aria-pressed', b.dataset.p === p));
}
const consulta = () => new URLSearchParams(Object.entries({ desde: $('desde').value, hasta: $('hasta').value, moneda: $('moneda-panel').value }).filter(([, v]) => v)).toString();

// ---------- Datos ----------
async function cargar() {
  $('error').hidden = true;
  $('carga').textContent = 'Cargando ventas desde Stripe…';
  try {
    const r = await fetch('/api/admin/ventas?' + consulta(), { headers: { 'x-admin-password': clave } });
    const data = await r.json();
    if (!r.ok) { const e = new Error(data.error); e.status = r.status; throw e; }
    try { sessionStorage.setItem('clave-admin', clave); } catch {}
    $('acceso').hidden = true;
    $('panel').hidden = false;
    $('carga').textContent = `Actualizado ${new Date().toLocaleTimeString('es-MX', { timeStyle: 'short' })}`;
    moneda = data.resumen.moneda;
    ultimoResumen = data.resumen;
    pedidos = data.pedidos;
    visibles = 40;
    pintarKpis(data.resumen);
    graficaTiempo(data.resumen.porDia);
    barrasH($('g-categoria'), data.resumen.porCategoria.map(c => ({ nombre: c.categoria, ventas: c.ventas, piezas: c.piezas })));
    barrasH($('g-producto'), data.resumen.porProducto.map(p => ({ nombre: p.producto, ventas: p.ventas, piezas: p.piezas })));
    if (!Object.keys(paqueterias).length) await cargarPaqueterias();
    pintarPedidos();
    cargarApartados();
  } catch (err) {
    $('carga').textContent = '';
    if (err.status === 401 || err.status === 503 || err.status === 429) {
      try { sessionStorage.removeItem('clave-admin'); } catch {}
      $('acceso').hidden = false;
      $('panel').hidden = true;
    }
    $('error').textContent = err.message || 'No se pudieron cargar las ventas.';
    $('error').hidden = false;
  }
}

function pintarKpis(r) {
  $('k-ventas').textContent = dinero(r.ventas);
  $('k-pedidos').textContent = r.pedidosCobrados.toLocaleString('es-MX');
  $('k-ticket').textContent = dinero(r.ticketPromedio);
  $('k-piezas').textContent = r.piezas.toLocaleString('es-MX');
  const extra = [];
  if (r.devolucionesAbiertas) extra.push(`⚠ ${r.devolucionesAbiertas} devolución(es) por atender`);
  if (r.devolucionesEnSaldo || r.devolucionesReembolsadas || r.devolucionesCambio) extra.push(`Devoluciones: ${dinero(r.devolucionesReembolsadas)} reembolsado · ${dinero(r.devolucionesEnSaldo)} quedó en saldo a favor · ${r.devolucionesCambio} cambio(s)`);
  if (r.cobradoApartados) extra.push(`Incluye ${dinero(r.cobradoApartados)} cobrados en apartados (anticipos y abonos)`);
  if (r.reembolsos) extra.push(`Reembolsos: ${dinero(r.reembolsos)} (ya descontados)`);
  if (r.pendientes) extra.push(`${r.pendientes} pedido(s) pendientes de pago (OXXO/transferencia), no incluidos`);
  $('k-extra').textContent = extra.join(' · ');
}

// ---------- Gráficas (SVG propio, sin librerías) ----------
const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, padre) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (padre) padre.appendChild(n); return n; };

function escalaBonita(max) {
  if (max <= 0) return { tope: 100, paso: 25 };
  const crudo = max / 4, mag = 10 ** Math.floor(Math.log10(crudo));
  const paso = [1, 2, 2.5, 5, 10].map(f => f * mag).find(p => p >= crudo);
  return { tope: paso * Math.ceil(max / paso), paso };
}

function mostrarTooltip(ev, filas) {
  const t = $('tooltip');
  t.replaceChildren(...filas.map(([v, l], i) => {
    const d = document.createElement('div');
    if (i === 0) { d.className = 'tt-titulo'; d.textContent = v; return d; }
    const b = document.createElement('strong'); b.textContent = v;
    d.append(b, document.createTextNode(' ' + l));
    return d;
  }));
  t.hidden = false;
  const x = Math.min(ev.clientX + 14, innerWidth - t.offsetWidth - 8);
  const y = ev.clientY - t.offsetHeight - 12 < 8 ? ev.clientY + 18 : ev.clientY - t.offsetHeight - 12;
  t.style.left = x + 'px'; t.style.top = y + 'px';
}
const ocultarTooltip = () => { $('tooltip').hidden = true; };

function graficaTiempo(porDia) {
  // Más de 62 días → agrupar por mes para que las barras sigan siendo legibles
  let datos = porDia.map(d => ({ clave: d.dia, etiqueta: etiquetaDia(d.dia), ventas: d.ventas, pedidos: d.pedidos }));
  let porMes = false;
  if (datos.length > 62) {
    porMes = true;
    const m = new Map();
    for (const d of porDia) {
      const k = d.dia.slice(0, 7);
      const x = m.get(k) || { clave: k, etiqueta: etiquetaMes(k), ventas: 0, pedidos: 0 };
      x.ventas += d.ventas; x.pedidos += d.pedidos; m.set(k, x);
    }
    datos = [...m.values()];
  }
  $('t-tiempo').textContent = porMes ? 'Ventas por mes' : 'Ventas por día';

  const cont = $('g-tiempo');
  cont.replaceChildren();
  if (!datos.length) { cont.innerHTML = '<p class="vacio">Sin ventas en este periodo.</p>'; $('tabla-tiempo').replaceChildren(); return; }

  const W = Math.max(cont.clientWidth, 280), H = 240, m = { t: 12, r: 8, b: 26, l: 56 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const { tope, paso } = escalaBonita(Math.max(...datos.map(d => d.ventas)));
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': `${$('t-tiempo').textContent}, ${datos.length} barras` }, cont);
  const y = (v) => m.t + ih - (v / tope) * ih;

  for (let v = 0; v <= tope + 1e-9; v += paso) {
    el('line', { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), class: v === 0 ? 'eje' : 'rejilla' }, svg);
    el('text', { x: m.l - 8, y: y(v) + 4, 'text-anchor': 'end', class: 'tick' }, svg).textContent = dineroCorto(v);
  }

  const banda = iw / datos.length;
  const gap = Math.max(2, Math.min(banda * 0.3, 10));
  const ancho = Math.max(banda - gap, 1);
  const cadaCuanto = Math.max(1, Math.ceil(datos.length / Math.max(1, Math.floor(iw / 52))));

  datos.forEach((d, i) => {
    const x = m.l + i * banda + gap / 2;
    const h = Math.max(ih - (y(d.ventas) - m.t), d.ventas > 0 ? 2 : 0);
    if (h > 0) {
      const r = Math.min(4, ancho / 2, h);
      // barra con esquinas redondeadas solo arriba, anclada a la base
      el('path', { class: 'barra', d: `M${x},${m.t + ih} V${m.t + ih - h + r} Q${x},${m.t + ih - h} ${x + r},${m.t + ih - h} H${x + ancho - r} Q${x + ancho},${m.t + ih - h} ${x + ancho},${m.t + ih - h + r} V${m.t + ih} Z` }, svg);
    }
    if (i % cadaCuanto === 0) el('text', { x: x + ancho / 2, y: H - 8, 'text-anchor': 'middle', class: 'tick' }, svg).textContent = d.etiqueta;
    // zona de hover más grande que la barra
    const zona = el('rect', { x: m.l + i * banda, y: m.t, width: banda, height: ih, class: 'zona', tabindex: 0, 'aria-label': `${d.etiqueta}: ${dinero(d.ventas)}, ${d.pedidos} pedidos` }, svg);
    const mostrar = (ev) => {
      const r = zona.getBoundingClientRect();
      mostrarTooltip(ev.clientX ? ev : { clientX: r.left + r.width / 2, clientY: r.top + 40 }, [[porMes ? d.etiqueta : `${d.etiqueta} ${d.clave.slice(0, 4)}`], [dinero(d.ventas), 'vendido'], [d.pedidos, d.pedidos === 1 ? 'pedido' : 'pedidos']]);
      zona.classList.add('activa');
    };
    zona.addEventListener('pointermove', mostrar);
    zona.addEventListener('focus', mostrar);
    zona.addEventListener('pointerleave', () => { ocultarTooltip(); zona.classList.remove('activa'); });
    zona.addEventListener('blur', () => { ocultarTooltip(); zona.classList.remove('activa'); });
  });

  // Vista de tabla (accesible y para revisar números exactos)
  $('tabla-tiempo').innerHTML = `<table><thead><tr><th>${porMes ? 'Mes' : 'Día'}</th><th class="num">Pedidos</th><th class="num">Ventas netas</th></tr></thead><tbody>${
    datos.map(d => `<tr><td>${esc(porMes ? d.etiqueta : d.clave)}</td><td class="num">${d.pedidos}</td><td class="num">${dinero(d.ventas)}</td></tr>`).join('')}</tbody></table>`;
}

// Barras horizontales (categoría y producto). Máximo 8 filas; el resto va en "Otros".
function barrasH(cont, lista) {
  cont.replaceChildren();
  if (!lista.length) { cont.innerHTML = '<p class="vacio">Sin ventas en este periodo.</p>'; return; }
  let filas = lista.slice(0, 8);
  if (lista.length > 8) {
    const resto = lista.slice(8);
    filas.push({ nombre: `Otros (${resto.length})`, piezas: resto.reduce((s, x) => s + x.piezas, 0), ventas: resto.reduce((s, x) => s + x.ventas, 0) });
  }
  const max = Math.max(...filas.map(f => f.ventas), 1);
  const total = filas.reduce((s, f) => s + f.ventas, 0) || 1;
  const ul = document.createElement('ul');
  ul.className = 'barras-h';
  for (const f of filas) {
    const li = document.createElement('li');
    li.tabIndex = 0;
    li.innerHTML = `<span class="bh-nombre">${esc(f.nombre)}</span>
      <span class="bh-pista"><span class="bh-barra" style="width:${Math.max((f.ventas / max) * 100, 0.5)}%"></span></span>
      <span class="bh-valor">${dinero(f.ventas)}</span>`;
    const mostrar = (ev) => {
      const r = li.getBoundingClientRect();
      mostrarTooltip(ev.clientX ? ev : { clientX: r.left + 40, clientY: r.top }, [[f.nombre], [dinero(f.ventas), 'vendido'], ...(f.piezas ? [[f.piezas, 'piezas']] : []), [`${((f.ventas / total) * 100).toFixed(1)}%`, 'del total']]);
    };
    li.addEventListener('pointermove', mostrar);
    li.addEventListener('focus', mostrar);
    li.addEventListener('pointerleave', ocultarTooltip);
    li.addEventListener('blur', ocultarTooltip);
    ul.appendChild(li);
  }
  cont.appendChild(ul);
}

// ---------- Apartados ----------
let apartados = [];
let filtroAp = 'activos';
async function cargarApartados() {
  try {
    const r = await fetch('/api/admin/apartados', { headers: { 'x-admin-password': clave } });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error);
    apartados = data;
    $('ap-resumen').textContent = '';
  } catch (err) {
    apartados = [];
    $('ap-resumen').textContent = err.message || 'No se pudieron cargar los apartados.';
  }
  pintarApartados();
}
function pintarApartados() {
  const enMoneda = apartados.filter(a => a.moneda === $('moneda-panel').value);
  const porCobrar = enMoneda.filter(a => a.estado !== 'liquidado');
  const vencidos = enMoneda.filter(a => a.estado === 'vencido');
  $('ap-resumen').textContent = !enMoneda.length ? '' :
    `${porCobrar.length} por cobrar · saldo pendiente ${dinero(porCobrar.reduce((s, a) => s + a.saldo, 0))}` +
    (vencidos.length ? ` · ⚠ ${vencidos.length} vencido(s)` : '') + ` · ${enMoneda.length - porCobrar.length} liquidados`;
  const lista = enMoneda.filter(a => filtroAp === 'todos' || (filtroAp === 'activos' ? a.estado !== 'liquidado' : a.estado === filtroAp));
  $('ap-vacio').hidden = lista.length > 0;
  const ETQ = { vigente: 'Vigente', vencido: 'Vencido', liquidado: 'Liquidado' };
  $('apartados').innerHTML = lista.slice(0, 100).map(a => {
    const pct = a.total ? Math.round(a.pagado / a.total * 100) : 0;
    return `<li class="pedido">
      <div><span class="chip ${a.estado}">${ETQ[a.estado]}</span><br><span class="suave">Vence ${esc(a.vence)}</span><br><span class="suave">${esc(a.id)}</span></div>
      <div><strong>${esc(a.cliente) || 'Cliente'}</strong><br><span class="suave">${esc(a.email)}${a.telefono ? ' · ' + esc(a.telefono) : ''}</span><br>
        ${a.articulos.map(x => `${x.cantidad} × ${esc(x.nombre)}`).join('<br>')}</div>
      <div class="col-envio"><div class="progreso" style="margin:.3rem 0"><span style="width:${pct}%"></span></div>
        <span class="suave">Pagado ${dinero(a.pagado)} de ${dinero(a.total)} · ${a.pagos.length} pago(s)</span></div>
      <div class="monto">${a.saldo ? dinero(a.saldo) + '<br><span class="suave">saldo</span>' : '✓'}</div>
    </li>`;
  }).join('');
}
$('filtro-ap').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  filtroAp = b.dataset.f;
  document.querySelectorAll('#filtro-ap button').forEach(x => x.setAttribute('aria-pressed', x === b));
  pintarApartados();
});

// ---------- Lista de pedidos ----------
const ESTADO = { pagado: ['Pagado', 'pagado'], reembolsado: ['Reembolsado', 'reembolsado'], pendiente: ['Pendiente', 'pendiente'] };
const TIPO = { apartado: 'Anticipo de apartado', abono: 'Abono' };
const ESTADO_ENVIO = { recibido: 'Recibido', preparando: 'Preparando', enviado: 'Enviado', listo: 'Listo para recoger', entregado: 'Entregado' };
let paqueterias = {};
async function cargarPaqueterias() {
  try { const r = await fetch('/api/admin/monedas', { headers: { 'x-admin-password': clave } }); if (r.ok) paqueterias = (await r.json()).paqueterias || {}; } catch {}
}

// Controles de envío: solo para ventas pagadas y anticipos de apartado (los abonos no se envían)
// ---------- Devoluciones ----------
const MOTIVO_DEV = { defectuoso: 'Defectuoso', danado: 'Llegó dañado', diferente: 'No es lo que pedí', no_quiero: 'Ya no lo quiere', otro: 'Otro' };
const PREF_DEV = { cambio: 'Cambio', saldo: 'Saldo a favor', reembolso: 'Reembolso' };
const ESTADO_DEV = { solicitada: 'Solicitada', aprobada: 'Aprobada: esperando el producto', recibida: 'Producto recibido', resuelta: 'Resuelta', rechazada: 'Rechazada', cancelada: 'Cancelada (venta restaurada)' };
const RESOL_DEV = { cambio: 'Cambio por otro producto', saldo: 'Saldo a favor', reembolso: 'Reembolso total', reembolso_parcial: 'Reembolso parcial' };

function controlDevolucion(p) {
  const d = p.devolucion;
  if (!d || !p.piId) return '';
  const abierta = ['solicitada', 'aprobada', 'recibida'].includes(d.estado);
  const botones = [];
  if (d.estado === 'solicitada') botones.push(['aprobar', 'Aprobar y pedir el producto'], ['rechazar', 'Rechazar']);
  if (d.estado === 'aprobada') botones.push(['recibida', 'Ya recibí el producto'], ['rechazar', 'Rechazar']);
  if (d.estado === 'recibida') botones.push(['cambio', 'Resolver con cambio'], ['saldo', 'Dar saldo a favor (+bono)'], ['reembolso', 'Reembolsar']);
  if (abierta || d.estado === 'rechazada' || (d.estado === 'resuelta' && d.resolucion === 'cambio')) botones.push(['restaurar', '↺ Restaurar venta']);
  return `<div class="devolucion-caja" data-pi="${esc(p.piId)}">
      <p><strong>↩️ Devolución: ${esc(ESTADO_DEV[d.estado] || d.estado)}</strong> · ${esc(d.fecha)}<br>
        <span class="suave">Motivo: ${esc(MOTIVO_DEV[d.motivo] || d.motivo || '—')} · El cliente prefiere: ${esc(PREF_DEV[d.preferencia] || '—')}${d.comentario ? ` · “${esc(d.comentario)}”` : ''}</span>
        ${d.resolucion ? `<br>Resolución: <strong>${esc(RESOL_DEV[d.resolucion] || d.resolucion)}</strong>${d.monto ? ` · ${dinero(d.monto)}` : ''}${d.codigo ? ` · código <span class="codigo">${esc(d.codigo)}</span>` : ''}` : ''}</p>
      ${d.estado === 'recibida' ? `<label class="suave">Monto (vacío = todo lo pagado) <input type="number" min="0" step="0.01" class="dev-monto" inputmode="decimal"></label>` : ''}
      ${botones.length ? `<div class="dev-botones">${botones.map(([a, l]) => `<button type="button" data-dev="${a}"${a === 'reembolso' || a === 'rechazar' ? ' class="secundario"' : ''}>${l}</button>`).join('')}</div>` : ''}
    </div>`;
}

const CONFIRMAR_DEV = {
  reembolso: '¿Reembolsar este pago? El dinero regresa a la tarjeta del cliente y no se puede deshacer.',
  saldo: '¿Dar saldo a favor? Se creará un código que el cliente usará en su próxima compra.',
  rechazar: '¿Rechazar esta devolución?',
  restaurar: '¿Restaurar la venta? La devolución se cancela y el pedido vuelve a contar como venta normal.',
};
$('pedidos').addEventListener('click', async (e) => {
  const b = e.target.closest('[data-dev]'); if (!b) return;
  const caja = b.closest('.devolucion-caja');
  const accion = b.dataset.dev;
  if (CONFIRMAR_DEV[accion] && !confirm(CONFIRMAR_DEV[accion])) return;
  const montoTxt = caja.querySelector('.dev-monto')?.value;
  const monto = montoTxt ? Math.round(parseFloat(montoTxt) * 100) : undefined;
  b.disabled = true; const texto = b.textContent; b.textContent = 'Procesando…';
  try {
    const r = await fetch('/api/admin/devolucion', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-password': clave },
      body: JSON.stringify({ pi: caja.dataset.pi, accion, monto }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error);
    await cargar(); // recarga para ver el nuevo estado (y el código de saldo, si lo hay)
  } catch (err) {
    b.disabled = false; b.textContent = texto;
    $('error').textContent = err.message || 'No se pudo completar la acción.'; $('error').hidden = false;
  }
});

function controlEnvio(p) {
  if (p.metodo === 'paypal') return `<p class="envio-form suave" style="margin:0">Pedido ${esc(p.pedido || '—')} · Pagado con PayPal: registra la paquetería y la guía en tu cuenta de PayPal (Actividad → el pago → Agregar seguimiento).</p>`;
  if (!p.piId || p.estado !== 'pagado' || p.tipo === 'abono') return '';
  const e = p.envio || {};
  return `<form class="envio-form" data-pi="${esc(p.piId)}">
      <span class="suave">Pedido ${esc(p.pedido || '—')}</span>
      <select name="estado" aria-label="Estado del envío">${Object.entries(ESTADO_ENVIO).map(([k, v]) => `<option value="${k}"${k === e.estado ? ' selected' : ''}>📦 ${v}</option>`).join('')}</select>
      <select name="paqueteria" aria-label="Paquetería"><option value="">Paquetería…</option>${Object.entries(paqueterias).map(([k, v]) => `<option value="${k}"${k === e.paqueteria ? ' selected' : ''}>${esc(v)}</option>`).join('')}</select>
      <input name="guia" value="${esc(e.guia || '')}" placeholder="Número de guía" aria-label="Número de guía">
      <button type="submit">Guardar</button>
    </form>`;
}

function pintarPedidos() {
  const q = $('buscar').value.trim().toLowerCase();
  const lista = q ? pedidos.filter(p => [p.cliente, p.email, p.telefono, p.apartado, p.pedido, ...p.articulos.map(a => a.nombre)].join(' ').toLowerCase().includes(q)) : pedidos;
  $('vacio').hidden = lista.length > 0;
  $('pedidos').innerHTML = lista.slice(0, visibles).map(p => `<li class="pedido">
      <div><span class="suave">${fecha(p.fecha)}</span><br><span class="chip ${ESTADO[p.estado][1]}">${ESTADO[p.estado][0]}</span> <span class="chip">${p.metodo === 'paypal' ? '🅿️ PayPal' : '💳 Tarjeta'}</span>${p.envio?.tipo === 'sucursal' ? ' <span class="chip vigente">🏬 Recoge</span>' : ''}
        ${p.tipo && p.tipo !== 'venta' ? `<br><span class="chip vigente">${TIPO[p.tipo] || esc(p.tipo)}</span><br><span class="suave">${esc(p.apartado)}</span>` : ''}</div>
      <div><strong>${esc(p.cliente) || 'Cliente'}</strong><br><span class="suave">${esc(p.email)}${p.telefono ? ' · ' + esc(p.telefono) : ''}</span><br>
        ${p.articulos.map(a => `${a.cantidad} × ${esc(a.nombre)}`).join('<br>')}</div>
      <div class="col-envio suave">${esc(p.direccion) || 'Sin dirección'}${p.envio?.costo ? `<br>Envío cobrado: ${dinero(p.envio.costo)}` : ''}</div>
      <div class="monto">${dinero(p.total)}${p.reembolsado ? `<br><span class="suave">−${dinero(p.reembolsado)}</span>` : ''}</div>
      ${controlEnvio(p)}
      ${controlDevolucion(p)}
    </li>`).join('');
  $('mas').innerHTML = lista.length > visibles ? `Mostrando ${visibles} de ${lista.length}. <button type="button" class="enlace" id="ver-mas">Ver más</button> · El Excel incluye todos.` : '';
  $('ver-mas')?.addEventListener('click', () => { visibles += 40; pintarPedidos(); });
}

// Guardar el envío de un pedido en Stripe
$('pedidos').addEventListener('submit', async (e) => {
  const f = e.target.closest('.envio-form'); if (!f) return;
  e.preventDefault();
  const b = f.querySelector('button');
  b.disabled = true; b.textContent = 'Guardando…';
  try {
    const r = await fetch('/api/admin/envio', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-password': clave },
      body: JSON.stringify({ pi: f.dataset.pi, estado: f.estado.value, paqueteria: f.paqueteria.value, guia: f.guia.value }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error);
    const p = pedidos.find(x => x.piId === f.dataset.pi);
    if (p) p.envio = { ...(p.envio || {}), estado: f.estado.value, paqueteria: f.paqueteria.value, guia: f.guia.value };
    b.textContent = '✓ Guardado';
    setTimeout(() => { b.textContent = 'Guardar'; b.disabled = false; }, 1500);
  } catch (err) {
    b.textContent = 'Guardar'; b.disabled = false;
    $('error').textContent = err.message || 'No se pudo guardar el envío.'; $('error').hidden = false;
  }
});

// ---------- Excel ----------
$('excel').addEventListener('click', async () => {
  const b = $('excel');
  b.disabled = true; b.textContent = 'Generando Excel…';
  try {
    const r = await fetch('/api/admin/excel?' + consulta(), { headers: { 'x-admin-password': clave } });
    if (!r.ok) throw new Error((await r.json()).error);
    const blob = await r.blob();
    const nombre = /filename="([^"]+)"/.exec(r.headers.get('Content-Disposition') || '')?.[1] || 'ventas.xlsx';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = nombre;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  } catch (err) {
    $('error').textContent = err.message || 'No se pudo descargar el Excel.'; $('error').hidden = false;
  } finally {
    b.disabled = false; b.textContent = '⬇ Descargar Excel';
  }
});

// ---------- Eventos ----------
$('acceso').addEventListener('submit', (e) => { e.preventDefault(); clave = $('clave').value; cargar(); });
$('rapidos').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { aplicarPreset(b.dataset.p); cargar(); } });
['desde', 'hasta'].forEach(id => $(id).addEventListener('change', () => {
  document.querySelectorAll('#rapidos button').forEach(b => b.setAttribute('aria-pressed', 'false'));
  cargar();
}));
$('buscar').addEventListener('input', () => { visibles = 40; pintarPedidos(); });
$('moneda-panel').addEventListener('change', () => { moneda = $('moneda-panel').value; cargar(); });
document.querySelectorAll('.ver-tabla').forEach(b => b.addEventListener('click', () => {
  const t = $(b.dataset.tabla); t.hidden = !t.hidden;
  b.setAttribute('aria-expanded', !t.hidden); b.textContent = t.hidden ? 'Ver tabla' : 'Ocultar tabla';
}));
let redimension;
addEventListener('resize', () => { clearTimeout(redimension); redimension = setTimeout(() => { if (ultimoResumen && !$('panel').hidden) graficaTiempo(ultimoResumen.porDia); }, 250); });

aplicarPreset('30');
if (clave) cargar();
