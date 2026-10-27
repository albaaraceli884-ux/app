(async () => {
  const $ = (x) => document.getElementById(x);
  const params = new URLSearchParams(location.search);
  const idioma = params.get('lang') === 'en' ? 'en' : 'es';
  const locale = idioma === 'en' ? 'en-US' : 'es-MX';
  const T = {
    es: {
      verificando: 'Verificando tu pago…', momento: 'Un momento', volver: 'Volver a la tienda',
      apartadoOk: 'Apartado confirmado', listo: (n) => `¡Listo${n}! Tus productos están apartados`,
      anticipo: (m, e) => `Pagaste un anticipo de ${m}. Enviamos el recibo a ${e}.`, codigo: 'Tu código de apartado — guárdalo:',
      saldo: (m) => `Saldo: ${m}`, liquida: (f) => `Liquida antes del ${f}, en abonos o de una vez.`, verApartado: 'Ver mi apartado y abonar',
      correo: 'También te llegará por correo. Puedes consultarlo cuando quieras en “Mi apartado”, en la tienda.',
      recibido: 'Pago recibido', gracias: (n) => `¡Gracias${n}!`, cobramos: (m, e) => `Cobramos ${m}. Enviamos la confirmación a ${e}.`,
      proceso: 'Pago en proceso', registrado: 'Tu pedido está registrado', avisaremos: 'Te avisaremos por correo cuando se confirme el pago.',
      noVerificado: 'No pudimos verificar el pago', revisa: 'Revisa tu correo', titulo: 'Pago recibido — Sun Shine',
      tuPedido: 'Tu número de pedido:', rastrear: 'Rastrear mi pedido →',
    },
    en: {
      verificando: 'Checking your payment…', momento: 'One moment', volver: 'Back to store',
      apartadoOk: 'Layaway confirmed', listo: (n) => `All set${n}! Your items are reserved`,
      anticipo: (m, e) => `You paid a ${m} deposit. We sent the receipt to ${e}.`, codigo: 'Your layaway code — keep it:',
      saldo: (m) => `Balance: ${m}`, liquida: (f) => `Pay it off by ${f}, in installments or all at once.`, verApartado: 'View my layaway and pay',
      correo: 'You will also get it by email. You can check it anytime under “My layaway” in the store.',
      recibido: 'Payment received', gracias: (n) => `Thank you${n}!`, cobramos: (m, e) => `We charged ${m}. We sent the confirmation to ${e}.`,
      proceso: 'Payment processing', registrado: 'Your order is registered', avisaremos: 'We will email you when the payment is confirmed.',
      noVerificado: 'We could not verify the payment', revisa: 'Check your email', titulo: 'Payment received — Sun Shine',
      tuPedido: 'Your order number:', rastrear: 'Track my order →',
    },
  };
  const t = (k, ...a) => { const v = T[idioma][k]; return typeof v === 'function' ? v(...a) : v; };
  document.documentElement.lang = idioma;
  document.title = t('titulo');
  $('estado').textContent = t('verificando');
  $('titulo').textContent = t('momento');
  $('volver').textContent = t('volver');
  $('volver').href = `/?lang=${idioma}`;

  const id = params.get('session_id');
  const paypalId = params.get('paypal');
  if (!id && !paypalId) return;
  try {
    const s = await (await fetch(paypalId ? '/api/paypal/resumen/' + encodeURIComponent(paypalId) : '/api/sesion/' + encodeURIComponent(id))).json();
    if (s.pedido) {
      $('t-pedido').textContent = t('tuPedido');
      $('num-pedido').textContent = s.pedido;
      $('ir-pedido').textContent = t('rastrear');
      $('ir-pedido').href = `/pedido.html?numero=${encodeURIComponent(s.pedido)}&lang=${idioma}`;
      $('caja-pedido').hidden = false;
    }
    const dinero = (c) => new Intl.NumberFormat(locale, { style: 'currency', currency: s.moneda.toUpperCase() }).format(c / 100);
    const nombre = s.nombre ? ', ' + s.nombre.split(' ')[0] : '';
    if (s.estado === 'paid') {
      try { localStorage.removeItem('carrito-sunshine'); } catch {}
      if (s.tipo === 'apartado') {
        $('estado').textContent = t('apartadoOk');
        $('titulo').textContent = t('listo', nombre);
        $('detalle').textContent = t('anticipo', dinero(s.total), s.email);
        $('t-codigo').textContent = t('codigo');
        $('codigo').textContent = s.apartado;
        $('saldo').textContent = t('saldo', dinero(s.totalApartado - s.total));
        const [y, m, d] = s.vence.split('-').map(Number);
        $('vence').textContent = t('liquida', new Date(y, m - 1, d).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }));
        $('ir-apartado').textContent = t('verApartado');
        $('ir-apartado').href = `/apartado.html?id=${encodeURIComponent(s.apartado)}&lang=${idioma}&session_id=${encodeURIComponent(id)}`;
        $('t-correo').textContent = t('correo');
        $('caja-apartado').hidden = false;
        try { localStorage.setItem('ultimo-apartado', s.apartado); } catch {}
      } else {
        $('estado').textContent = t('recibido');
        $('titulo').textContent = t('gracias', nombre);
        $('detalle').textContent = t('cobramos', dinero(s.total), s.email);
      }
    } else {
      $('estado').textContent = t('proceso');
      $('titulo').textContent = t('registrado');
      $('detalle').textContent = t('avisaremos');
    }
  } catch {
    $('estado').textContent = t('noVerificado');
    $('titulo').textContent = t('revisa');
  }
})();
