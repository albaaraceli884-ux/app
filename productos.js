// ---------------------------------------------------------------
// Catálogo y configuración de la tienda Sun Shine.
// Edita SOLO este archivo para cambiar productos, precios, regiones
// y categorías.
//
// Cada producto puede venderse de dos formas (o ambas):
//   precio  → venta directa en Sun Shine (Stripe y apartados), un precio
//             por moneda, en CENTAVOS: { mxn: 34900, usd: 1999 }
//             = $349.00 MXN en México y US$19.99 en EE. UU./internacional.
//             Si falta la moneda de una región, no se vende ahí.
//   amazon  → botón "Ver en Amazon" en el Amazon de la región del cliente.
//             { asin: 'B0XXXXXXXX' } producto exacto, { busqueda: 'texto' }
//             búsqueda. El precio de Amazon NO va aquí: Amazon solo permite
//             mostrar precios leídos en vivo de su API.
//   en      → nombre y descripción en inglés.
//   imagen (opcional) → archivo en public/img/, p. ej. 'img/toallas.jpg'
// ---------------------------------------------------------------
module.exports = {
  NEGOCIO: {
    nombre: 'Sun Shine',
    // Datos del negocio para el Aviso de privacidad y los Términos de uso.
    // ⚠️ Llénalos antes de abrir al público (aparecen resaltados mientras estén vacíos).
    legal: {
      razonSocial: '', // p. ej. 'Nombre Apellido' (persona física) o 'Sun Shine S.A. de C.V.'
      domicilio: '',   // calle, número, colonia, ciudad, estado, C.P.
      correo: '',      // correo de atención a clientes
      telefono: '',    // teléfono o WhatsApp de atención
    },
    lema: 'Todo para tu casa, tu oficina, la escuela y tu día a día.',
    intro: 'Hogar, cocina, electrodomésticos, electrónicos, oficina, escolar, jardinería y limpieza, con marcas reconocidas para todas las edades.',
    en: {
      lema: 'Everything for your home, office, school and everyday life.',
      intro: 'Home, kitchen, appliances, electronics, office, school, garden and cleaning, with trusted brands for all ages.',
    },
  },

  // Moneda principal del negocio (para el panel de ventas)
  MONEDA: 'mxn',
  ZONA_HORARIA: 'America/Mexico_City', // para agrupar ventas por día

  // ---------------------------------------------------------------
  // Regiones: la tienda elige una según el idioma y la zona horaria del
  // cliente, y el cliente puede cambiarla. Cada región define moneda,
  // Amazon y países de envío. El código de afiliada de cada Amazon va en
  // las variables de entorno AMAZON_TAG_MX y AMAZON_TAG_US.
  // tiendaAmazon (opcional): el enlace de tu tienda o escaparate en Amazon
  // (p. ej. 'https://www.amazon.com.mx/stores/...'). Es a donde lleva el
  // botón "Comprar en Amazon" de la portada; sin él, va a la página de Amazon.
  // ---------------------------------------------------------------
  REGIONES: {
    mx: { nombre: 'México', nombre_en: 'Mexico', bandera: '🇲🇽', idioma: 'es', moneda: 'mxn',
          amazon: 'www.amazon.com.mx', tagEnv: 'AMAZON_TAG_MX', paises: ['MX'] },
    us: { nombre: 'Estados Unidos', nombre_en: 'United States', bandera: '🇺🇸', idioma: 'en', moneda: 'usd',
          amazon: 'www.amazon.com', tagEnv: 'AMAZON_TAG_US', paises: ['US', 'PR'] },
    intl: { nombre: 'Internacional', nombre_en: 'International', bandera: '🌎', idioma: 'en', moneda: 'usd',
          amazon: 'www.amazon.com', tagEnv: 'AMAZON_TAG_US',
          paises: ['CA', 'GT', 'SV', 'HN', 'CR', 'PA', 'DO', 'CO', 'EC', 'PE', 'CL', 'AR', 'UY', 'BR',
                   'ES', 'GB', 'FR', 'DE', 'IT', 'PT', 'NL', 'AU', 'JP'] },
  },
  REGION_PREDETERMINADA: 'mx',

  // ---------------------------------------------------------------
  // Envíos por región. Dos formas de entrega:
  //   tipo 'domicilio' → se pide la dirección del cliente
  //   tipo 'sucursal'  → el cliente recoge en una sucursal autorizada
  //                      (no se pide dirección; elige la sucursal)
  // Deja en cada región solo las formas que de verdad ofreces ahí.
  // Montos en CENTAVOS de la moneda de la región. dias: [mín, máx] hábiles.
  // gratisDesde: compras desde ese monto no pagan la PRIMERA opción a
  // domicilio (null = nunca gratis).
  // ⚠️ Montos y sucursales de EJEMPLO: pon los tuyos.
  // ---------------------------------------------------------------
  ENVIOS: {
    mx: {
      gratisDesde: 99900, // $999 MXN
      opciones: [
        { id: 'estandar', tipo: 'domicilio', nombre: 'Envío estándar a domicilio', en: 'Standard home delivery', monto: 9900, dias: [3, 7] },
        { id: 'express', tipo: 'domicilio', nombre: 'Envío express a domicilio', en: 'Express home delivery', monto: 19900, dias: [1, 3] },
        { id: 'sucursal', tipo: 'sucursal', nombre: 'Recoger en sucursal autorizada', en: 'Pick up at an authorized location', monto: 0, dias: [2, 5] },
      ],
      sucursales: [
        { id: 'mx-1', nombre: 'Sucursal de ejemplo Centro', direccion: 'Calle Ejemplo 123, Centro', ciudad: 'Ciudad de México', horario: 'Lun–Sáb 10:00–19:00' },
        { id: 'mx-2', nombre: 'Sucursal de ejemplo Norte', direccion: 'Av. Ejemplo 456', ciudad: 'Monterrey, N.L.', horario: 'Lun–Vie 9:00–18:00' },
      ],
    },
    us: {
      gratisDesde: 7500, // US$75
      opciones: [
        { id: 'estandar', tipo: 'domicilio', nombre: 'Envío estándar a domicilio', en: 'Standard home delivery', monto: 799, dias: [5, 8] },
        { id: 'express', tipo: 'domicilio', nombre: 'Envío express a domicilio', en: 'Express home delivery', monto: 1999, dias: [2, 3] },
        { id: 'sucursal', tipo: 'sucursal', nombre: 'Recoger en sucursal autorizada', en: 'Pick up at an authorized location', monto: 0, dias: [3, 6] },
      ],
      sucursales: [
        { id: 'us-1', nombre: 'Sample pickup point Houston', direccion: '123 Sample St', ciudad: 'Houston, TX', horario: 'Mon–Sat 10am–7pm' },
      ],
    },
    intl: {
      gratisDesde: null,
      opciones: [
        { id: 'estandar', tipo: 'domicilio', nombre: 'Envío internacional a domicilio', en: 'International home delivery', monto: 2499, dias: [10, 20] },
      ],
      sucursales: [],
    },
  },

  // ---------------------------------------------------------------
  // Formas de pago que se MUESTRAN en la tienda para cada región.
  //  - Tarjetas de crédito y débito (Visa, Mastercard, American Express,
  //    y Apple Pay / Google Pay, que usan la tarjeta) → por Stripe.
  //  - PayPal → por PayPal (variables PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET).
  // ---------------------------------------------------------------
  PAGOS: {
    mx: [
      { es: 'Tarjeta de crédito o débito (Visa, Mastercard, American Express)', en: 'Credit or debit card (Visa, Mastercard, American Express)', icono: '💳' },
      { es: 'Meses sin intereses con tarjeta de crédito', en: 'Monthly installments with credit card', icono: '📅' },
      { es: 'PayPal', en: 'PayPal', icono: '🅿️' },
      { es: 'Apple Pay y Google Pay', en: 'Apple Pay and Google Pay', icono: '📱' },
      { es: 'Apartado con anticipo (con tarjeta)', en: 'Layaway with a deposit (by card)', icono: '🧡' },
    ],
    us: [
      { es: 'Tarjeta de crédito o débito (Visa, Mastercard, American Express, Discover)', en: 'Credit or debit card (Visa, Mastercard, American Express, Discover)', icono: '💳' },
      { es: 'PayPal', en: 'PayPal', icono: '🅿️' },
      { es: 'Apple Pay y Google Pay', en: 'Apple Pay and Google Pay', icono: '📱' },
      { es: 'Apartado con anticipo (con tarjeta)', en: 'Layaway with a deposit (by card)', icono: '🧡' },
    ],
    intl: [
      { es: 'Tarjeta de crédito o débito', en: 'Credit or debit card', icono: '💳' },
      { es: 'PayPal', en: 'PayPal', icono: '🅿️' },
      { es: 'Apartado con anticipo (con tarjeta)', en: 'Layaway with a deposit (by card)', icono: '🧡' },
    ],
  },

  // Meses sin intereses con tarjeta (solo México, pago completo). Requiere
  // que tu cuenta de Stripe en México tenga activadas las mensualidades.
  MESES_SIN_INTERESES: true,

  // Devoluciones: plazo para pedirlas, bono del saldo a favor y su vigencia
  DEVOLUCIONES: {
    diasParaSolicitar: 30,   // días desde la entrega (o la compra) para pedir devolución en línea
    bonoSaldoPorcentaje: 10, // si el cliente elige saldo a favor, recibe 10% más
    vigenciaSaldoDias: 180,  // el código de saldo a favor vence a los 6 meses
  },

  // Apartados: el cliente paga un anticipo y liquida el resto después
  APARTADO: {
    activo: true,
    anticipoPorcentaje: 30,                 // % del total que se paga al apartar
    plazoDias: 30,                          // días para liquidar
    abonoMinimo: { mxn: 10000, usd: 500 },  // abono mínimo en centavos ($100 MXN / US$5)
  },

  // Categorías del catálogo (el orden es el de las pestañas)
  CATEGORIAS: {
    hogar:             { nombre: 'Hogar',             en: 'Home',        icono: '🏠' },
    cocina:            { nombre: 'Cocina',            en: 'Kitchen',     icono: '🍳' },
    electrodomesticos: { nombre: 'Electrodomésticos', en: 'Appliances',  icono: '🔌' },
    electronicos:      { nombre: 'Electrónicos',      en: 'Electronics', icono: '🎧' },
    oficina:           { nombre: 'Oficina',           en: 'Office',      icono: '📎' },
    escolar:           { nombre: 'Escolar',           en: 'School',      icono: '🎒' },
    jardineria:        { nombre: 'Jardinería',        en: 'Garden',      icono: '🌱' },
    limpieza:          { nombre: 'Limpieza',          en: 'Cleaning',    icono: '🧽' },
  },

  // Para quién es cada producto (campo `edad` de cada producto)
  EDADES: {
    ninos:   { es: 'Niños', en: 'Kids' },
    jovenes: { es: 'Jóvenes', en: 'Teens' },
    adultos: { es: 'Adultos', en: 'Adults' },
    familia: { es: 'Toda la familia', en: 'Whole family' },
  },

  // ⚠️ PRODUCTOS DE EJEMPLO: reemplázalos por los tuyos.
  // - Los de venta directa tienen precios INVENTADOS: pon tus precios reales.
  // - Los de marca enlazan a una búsqueda de esa marca en Amazon. Cuando
  //   tengas el producto exacto, cambia { busqueda } por { asin }.
  PRODUCTOS: {
    // --- Hogar ---
    'hogar-1': { categoria: 'hogar', edad: 'familia', nombre: 'Juego de toallas', descripcion: 'Ejemplo · 3 piezas de algodón',
      en: { nombre: 'Towel set', descripcion: 'Sample · 3 cotton pieces' }, precio: { mxn: 34900, usd: 1999 } },
    'hogar-2': { categoria: 'hogar', edad: 'familia', nombre: 'Cojines decorativos (2 pzas)', descripcion: 'Ejemplo · funda lavable con cierre',
      en: { nombre: 'Throw pillows (2 pcs)', descripcion: 'Sample · washable zip cover' }, precio: { mxn: 27900, usd: 1599 } },
    'hogar-3': { categoria: 'hogar', edad: 'adultos', nombre: 'Lámpara de mesa', descripcion: 'Varios estilos',
      en: { nombre: 'Table lamp', descripcion: 'Several styles' }, amazon: { busqueda: 'lampara de mesa' } },

    // --- Cocina ---
    'cocina-1': { categoria: 'cocina', edad: 'adultos', nombre: 'Juego de sartenes antiadherentes', descripcion: 'Ejemplo · 3 piezas: 20, 24 y 28 cm',
      en: { nombre: 'Nonstick frying pan set', descripcion: 'Sample · 3 pieces: 8, 9.5 and 11 in' }, precio: { mxn: 79900, usd: 4499 } },
    'cocina-2': { categoria: 'cocina', edad: 'familia', nombre: 'Organizador de cocina', descripcion: 'Ejemplo · para alacena o cajón',
      en: { nombre: 'Kitchen organizer', descripcion: 'Sample · for pantry or drawer' }, precio: { mxn: 21900, usd: 1299 } },
    'cocina-3': { categoria: 'cocina', edad: 'adultos', nombre: 'Set de utensilios de silicón', descripcion: 'Ejemplo · 6 piezas, resistentes al calor',
      en: { nombre: 'Silicone utensil set', descripcion: 'Sample · 6 heat-resistant pieces' }, precio: { mxn: 22900, usd: 1299 } },
    'cocina-4': { categoria: 'cocina', edad: 'adultos', nombre: 'Batería de cocina T-fal', descripcion: 'Marca T-fal · varios juegos',
      en: { nombre: 'T-fal cookware set', descripcion: 'T-fal brand · several sets' }, amazon: { busqueda: 'T-fal cookware set' } },
    'cocina-5': { categoria: 'cocina', edad: 'adultos', nombre: 'Juego de cuchillos con base', descripcion: 'Ejemplo · 6 cuchillos de acero inoxidable',
      en: { nombre: 'Knife block set', descripcion: 'Sample · 6 stainless steel knives' }, precio: { mxn: 69900, usd: 3999 } },
    'cocina-6': { categoria: 'cocina', edad: 'familia', nombre: 'Tablas para picar (2 pzas)', descripcion: 'Ejemplo · bambú, chica y grande',
      en: { nombre: 'Cutting boards (2 pcs)', descripcion: 'Sample · bamboo, small and large' }, precio: { mxn: 24900, usd: 1499 } },
    'cocina-7': { categoria: 'cocina', edad: 'familia', nombre: 'Tazas y cucharas medidoras', descripcion: 'Ejemplo · 10 piezas de acero',
      en: { nombre: 'Measuring cups and spoons', descripcion: 'Sample · 10 steel pieces' }, precio: { mxn: 17900, usd: 999 } },
    'cocina-8': { categoria: 'cocina', edad: 'adultos', nombre: 'Utensilios OXO Good Grips', descripcion: 'Marca OXO · espátulas, pinzas y batidores',
      en: { nombre: 'OXO Good Grips utensils', descripcion: 'OXO brand · spatulas, tongs and whisks' }, amazon: { busqueda: 'OXO Good Grips kitchen utensils' } },
    'cocina-9': { categoria: 'cocina', edad: 'adultos', nombre: 'Recipientes Pyrex', descripcion: 'Marca Pyrex · vidrio con tapa',
      en: { nombre: 'Pyrex food storage', descripcion: 'Pyrex brand · glass with lids' }, amazon: { busqueda: 'Pyrex glass food storage containers' } },
    'cocina-10': { categoria: 'cocina', edad: 'adultos', nombre: 'Rallador y pelador', descripcion: 'Ejemplo · acero inoxidable, 2 piezas',
      en: { nombre: 'Grater and peeler', descripcion: 'Sample · stainless steel, 2 pieces' }, precio: { mxn: 14900, usd: 899 } },

    // --- Electrodomésticos ---
    'electrod-1': { categoria: 'electrodomesticos', edad: 'adultos', nombre: 'Licuadora Oster', descripcion: 'Marca Oster · varias potencias',
      en: { nombre: 'Oster blender', descripcion: 'Oster brand · several power levels' }, amazon: { busqueda: 'Oster blender' } },
    'electrod-2': { categoria: 'electrodomesticos', edad: 'adultos', nombre: 'Cafetera Hamilton Beach', descripcion: 'Marca Hamilton Beach · de goteo',
      en: { nombre: 'Hamilton Beach coffee maker', descripcion: 'Hamilton Beach brand · drip' }, amazon: { busqueda: 'Hamilton Beach coffee maker' } },
    'electrod-3': { categoria: 'electrodomesticos', edad: 'adultos', nombre: 'Horno de microondas Samsung', descripcion: 'Marca Samsung · varias capacidades',
      en: { nombre: 'Samsung microwave oven', descripcion: 'Samsung brand · several sizes' }, amazon: { busqueda: 'Samsung microwave' } },
    'electrod-4': { categoria: 'electrodomesticos', edad: 'adultos', nombre: 'Plancha de vapor Black+Decker', descripcion: 'Marca Black+Decker',
      en: { nombre: 'Black+Decker steam iron', descripcion: 'Black+Decker brand' }, amazon: { busqueda: 'Black+Decker steam iron' } },
    'electrod-5': { categoria: 'electrodomesticos', edad: 'familia', nombre: 'Freidora de aire', descripcion: 'Ejemplo · 4 litros, sin aceite',
      en: { nombre: 'Air fryer', descripcion: 'Sample · 4 quarts, oil-free' }, precio: { mxn: 129900, usd: 6999 } },

    // --- Electrónicos ---
    'electro-1': { categoria: 'electronicos', edad: 'jovenes', nombre: 'Audífonos inalámbricos', descripcion: 'Ejemplo · Bluetooth con estuche de carga',
      en: { nombre: 'Wireless earbuds', descripcion: 'Sample · Bluetooth with charging case' }, precio: { mxn: 59900, usd: 3499 } },
    'electro-2': { categoria: 'electronicos', edad: 'familia', nombre: 'Cargador rápido USB-C', descripcion: 'Ejemplo · 20 W',
      en: { nombre: 'USB-C fast charger', descripcion: 'Sample · 20 W' }, precio: { mxn: 24900, usd: 1499 } },
    'electro-3': { categoria: 'electronicos', edad: 'jovenes', nombre: 'Bocina portátil JBL', descripcion: 'Marca JBL · Bluetooth',
      en: { nombre: 'JBL portable speaker', descripcion: 'JBL brand · Bluetooth' }, amazon: { busqueda: 'JBL portable speaker' } },
    'electro-4': { categoria: 'electronicos', edad: 'familia', nombre: 'Tableta Samsung Galaxy Tab', descripcion: 'Marca Samsung · varios modelos',
      en: { nombre: 'Samsung Galaxy Tab tablet', descripcion: 'Samsung brand · several models' }, amazon: { busqueda: 'Samsung Galaxy Tab' } },
    'electro-5': { categoria: 'electronicos', edad: 'ninos', nombre: 'Audífonos para niños', descripcion: 'Ejemplo · volumen limitado para oídos pequeños',
      en: { nombre: 'Kids headphones', descripcion: 'Sample · volume-limited for little ears' }, precio: { mxn: 34900, usd: 1999 } },

    // --- Oficina ---
    'oficina-1': { categoria: 'oficina', edad: 'adultos', nombre: 'Mouse inalámbrico Logitech', descripcion: 'Marca Logitech',
      en: { nombre: 'Logitech wireless mouse', descripcion: 'Logitech brand' }, amazon: { busqueda: 'Logitech wireless mouse' } },
    'oficina-2': { categoria: 'oficina', edad: 'adultos', nombre: 'Impresora multifuncional HP', descripcion: 'Marca HP · imprime, copia y escanea',
      en: { nombre: 'HP all-in-one printer', descripcion: 'HP brand · print, copy and scan' }, amazon: { busqueda: 'HP all-in-one printer' } },
    'oficina-3': { categoria: 'oficina', edad: 'adultos', nombre: 'Organizador de escritorio', descripcion: 'Ejemplo · 5 compartimentos',
      en: { nombre: 'Desk organizer', descripcion: 'Sample · 5 compartments' }, precio: { mxn: 19900, usd: 1199 } },
    'oficina-4': { categoria: 'oficina', edad: 'adultos', nombre: 'Hojas tamaño carta (500)', descripcion: 'Ejemplo · paquete de 500 hojas blancas',
      en: { nombre: 'Letter-size paper (500)', descripcion: 'Sample · ream of 500 white sheets' }, precio: { mxn: 12900, usd: 899 } },
    'oficina-5': { categoria: 'oficina', edad: 'adultos', nombre: 'Plumas BIC (paquete)', descripcion: 'Marca BIC · tinta azul y negra',
      en: { nombre: 'BIC pens (pack)', descripcion: 'BIC brand · blue and black ink' }, amazon: { busqueda: 'BIC pens pack' } },

    // --- Escolar ---
    'escolar-1': { categoria: 'escolar', edad: 'ninos', nombre: 'Colores Crayola', descripcion: 'Marca Crayola · caja de 24',
      en: { nombre: 'Crayola colored pencils', descripcion: 'Crayola brand · box of 24' }, amazon: { busqueda: 'Crayola colored pencils 24' } },
    'escolar-2': { categoria: 'escolar', edad: 'jovenes', nombre: 'Cuadernos Scribe', descripcion: 'Marca Scribe · paquete',
      en: { nombre: 'Scribe notebooks', descripcion: 'Scribe brand · pack' }, amazon: { busqueda: 'cuadernos scribe' } },
    'escolar-3': { categoria: 'escolar', edad: 'jovenes', nombre: 'Calculadora científica Casio', descripcion: 'Marca Casio',
      en: { nombre: 'Casio scientific calculator', descripcion: 'Casio brand' }, amazon: { busqueda: 'Casio scientific calculator' } },
    'escolar-4': { categoria: 'escolar', edad: 'ninos', nombre: 'Juego de geometría Maped', descripcion: 'Marca Maped',
      en: { nombre: 'Maped geometry set', descripcion: 'Maped brand' }, amazon: { busqueda: 'Maped geometry set' } },
    'escolar-5': { categoria: 'escolar', edad: 'ninos', nombre: 'Mochila escolar', descripcion: 'Ejemplo · con compartimento acolchado',
      en: { nombre: 'School backpack', descripcion: 'Sample · with padded compartment' }, precio: { mxn: 39900, usd: 2299 } },
    'escolar-6': { categoria: 'escolar', edad: 'ninos', nombre: 'Lonchera infantil', descripcion: 'Ejemplo · térmica, fácil de limpiar',
      en: { nombre: 'Kids lunch box', descripcion: 'Sample · insulated, easy to clean' }, precio: { mxn: 24900, usd: 1499 } },

    // --- Jardinería ---
    'jardin-1': { categoria: 'jardineria', edad: 'adultos', nombre: 'Kit de herramientas de jardín', descripcion: 'Ejemplo · pala, rastrillo y tijeras',
      en: { nombre: 'Garden tool kit', descripcion: 'Sample · trowel, rake and pruners' }, precio: { mxn: 45900, usd: 2699 } },
    'jardin-2': { categoria: 'jardineria', edad: 'familia', nombre: 'Macetas de barro (3 pzas)', descripcion: 'Ejemplo · tamaños chico, mediano y grande',
      en: { nombre: 'Clay pots (3 pcs)', descripcion: 'Sample · small, medium and large' }, precio: { mxn: 18900, usd: 1099 } },
    'jardin-3': { categoria: 'jardineria', edad: 'adultos', nombre: 'Manguera extensible', descripcion: 'Varias medidas',
      en: { nombre: 'Expandable garden hose', descripcion: 'Several lengths' }, amazon: { busqueda: 'expandable garden hose' } },

    // --- Limpieza ---
    'limpieza-1': { categoria: 'limpieza', edad: 'adultos', nombre: 'Kit de limpieza para baño', descripcion: 'Ejemplo · cepillos y paños de microfibra',
      en: { nombre: 'Bathroom cleaning kit', descripcion: 'Sample · brushes and microfiber cloths' }, precio: { mxn: 15900, usd: 999 } },
    'limpieza-2': { categoria: 'limpieza', edad: 'adultos', nombre: 'Trapeador giratorio', descripcion: 'Ejemplo · con cubeta escurridora',
      en: { nombre: 'Spin mop', descripcion: 'Sample · with wringer bucket' }, precio: { mxn: 39900, usd: 2299 } },
    'limpieza-3': { categoria: 'limpieza', edad: 'adultos', nombre: 'Paños de microfibra (12 pzas)', descripcion: 'Varias presentaciones',
      en: { nombre: 'Microfiber cloths (12 pcs)', descripcion: 'Several pack sizes' }, amazon: { busqueda: 'microfiber cleaning cloths' } },
  },
};
