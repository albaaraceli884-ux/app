# Sun Shine — Tienda en línea

Tienda en línea de **Sun Shine** con 8 categorías: **Hogar, Cocina, Electrodomésticos, Electrónicos, Oficina, Escolar, Jardinería y Limpieza**, para México, Estados Unidos y el mundo, en español e inglés.
Cobra con **Stripe** (pago completo o **apartado** con anticipo) y enlaza a **Amazon**.
Funciona en **laptop** y **celular**, y se puede **instalar como app** en el teléfono.

| Página | Para qué |
|---|---|
| `/` | **El catálogo** (página principal): categorías, buscador, carrito, Pagar o Apartar |
| `/#cocina` (o `#hogar`, `#jardineria`, `#limpieza`, `#electronicos`) | Abre el catálogo directo en esa categoría (para compartir en redes) |
| `/apartado.html` | **Mi apartado**: el cliente consulta su saldo y abona |
| `/pedido.html` | **Rastrear mi pedido**: con su número de pedido y correo |
| `/exito.html` · `/cancelado.html` | Después de pagar o si el cliente cancela |
| `/admin.html` | **Control de ventas**: gráficas, pedidos, apartados y Excel (con contraseña) |

## Ventas en México, Estados Unidos y el mundo

La tienda detecta la región del cliente por el idioma y la zona horaria de su navegador, y el cliente puede cambiarla arriba a la derecha:

| Región | Moneda | Amazon | Envíos | Código de afiliada |
|---|---|---|---|---|
| 🇲🇽 México | MXN | amazon.com.mx | México | `AMAZON_TAG_MX` |
| 🇺🇸 Estados Unidos | USD | amazon.com | EE. UU. y Puerto Rico | `AMAZON_TAG_US` |
| 🌎 Internacional | USD | amazon.com | 23 países (lista en `productos.js`) | `AMAZON_TAG_US` |

- **Idioma:** español o inglés (botón **EN / ES**). Cada producto lleva su nombre en inglés en `en: { nombre, descripcion }`.
- **Precios:** uno por moneda, en centavos: `precio: { mxn: 34900, usd: 1999 }`. Si un producto no tiene precio en una moneda, no se vende directo en esa región (su botón de Amazon sigue apareciendo).
- **Portada → Amazon:** el botón **Comprar en Amazon** lleva al Amazon del país del cliente. Si tienes tienda o escaparate en Amazon (Seller Central, Associates o productos en bodegas de Amazon/FBA), pon su enlace en `tiendaAmazon` de cada región. Para enlazar tus productos exactos, usa su **ASIN** (`amazon: { asin: 'B0...' }`).
- **Panel de ventas:** elige **MXN** o **USD** arriba; cada moneda se ve y se exporta a Excel por separado (no se suman pesos con dólares).
- **Impuestos:** para cobrar sales tax en EE. UU. o IVA, configura **Stripe Tax** en tu Dashboard y pon `STRIPE_TAX=1` en Render.
- **Envíos internacionales:** hoy el envío va incluido en el precio. Antes de vender fuera de México, define tus costos de envío (en Stripe: *Shipping rates*) y revisa aduanas e impuestos de importación de cada país.

## Formas de pago: tarjeta o PayPal

- **Tarjeta de crédito o débito** (Visa, Mastercard, American Express; en EE. UU. también Discover), por **Stripe**. Apple Pay y Google Pay aparecen solos porque usan la tarjeta. En México, **meses sin intereses** con tarjeta de crédito (`MESES_SIN_INTERESES` en `productos.js`; tu cuenta de Stripe debe tener activadas las mensualidades).
- **PayPal**, con el botón amarillo de PayPal en el carrito. Para activarlo:
  1. Entra a **developer.paypal.com** con tu cuenta PayPal Business → *Apps & Credentials* → crea una app.
  2. Copia el **Client ID** y el **Secret** a Render (`PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`). Empieza con `PAYPAL_MODO=sandbox` para probar con cuentas de prueba.
  3. Cuando funcione, crea la app en modo **Live**, cambia las dos llaves y pon `PAYPAL_MODO=live`.
  4. En la app de PayPal activa **Transaction Search** para que las ventas de PayPal aparezcan en tu panel (pueden tardar hasta 3 horas en verse).
- **Apartado con anticipo:** se paga con tarjeta.
- Sin las llaves de PayPal, la tienda funciona igual y solo muestra el pago con tarjeta.

## Entrega y logística

En el carrito el cliente elige cómo recibir su pedido (se configura por región en `ENVIOS` de `productos.js`):

- 🏠 **A domicilio:** estándar o express, con costo y días hábiles. El estándar sale **gratis** desde el monto `gratisDesde`, y el carrito avisa cuánto falta.
- 🏬 **Recoger en sucursal autorizada:** el cliente elige la sucursal de su país (no se le pide dirección). Pon tus sucursales reales en `sucursales` (nombre, dirección, ciudad, horario). Si en un país no ofreces entrega a domicilio, deja solo la opción de sucursal, y al revés.

Cada compra recibe un **número de pedido** (`SS-XXXXXX`) que aparece en la confirmación.

- **Tú, en el panel:** en cada pedido pagado con tarjeta eliges el estado (*Recibido → Preparando → Enviado / Listo para recoger → Entregado*), la paquetería y el número de guía, y pulsas **Guardar**. Los pedidos pagados con PayPal se registran en tu cuenta de PayPal (Actividad → el pago → *Agregar seguimiento*).
- **El cliente:** en **Rastrear mi pedido** (`/pedido.html`) escribe su número de pedido y su correo, y ve en qué paso va, la sucursal donde recoge o el enlace de rastreo de la paquetería (DHL, FedEx, UPS, USPS, Estafeta, Redpack, Correos de México).

## Devoluciones: buena atención sin poner en riesgo tu dinero

### Cómo funciona en la tienda

| Paso | Quién | Dónde | Qué pasa |
|---|---|---|---|
| 1. Solicitud | Cliente | **Rastrear mi pedido** → *Solicitar devolución o cambio* | Elige el motivo y qué prefiere: **cambio**, **saldo a favor (+10%)** o **reembolso**. Solo dentro de 30 días y para pedidos pagados. |
| 2. Revisión | Tú | Panel → el pedido con ↩️ | **Aprobar y pedir el producto** (le escribes con las instrucciones) o **Rechazar**. |
| 3. Recepción | Tú | Panel | Cuando el producto llega y lo revisas: **Ya recibí el producto**. |
| 4. Resolución | Tú | Panel | **Cambio** (envías otro), **Saldo a favor** (se crea un código `SF-XXXXXX` con 10% extra que el cliente usa al pagar con tarjeta) o **Reembolsar** (total o parcial; el dinero regresa a su tarjeta por Stripe). |
| ↺ Restaurar venta | Tú | Panel | Si el cliente se arrepiente o la devolución no procede, la cancelas y el pedido **vuelve a contar como venta normal**. No se puede usar si ya diste reembolso o saldo. |

El cliente ve en todo momento el estado en "Rastrear mi pedido". Las devoluciones de pedidos pagados con **PayPal** se resuelven en tu cuenta de PayPal (Actividad → el pago → *Reembolsar*), y las de productos de Amazon, con Amazon.

### Cómo proteger tu flujo de dinero sin descuidar al cliente

1. **Ofrece primero el cambio, luego el saldo a favor y al final el reembolso.** El formulario ya los presenta en ese orden, y el saldo lleva un 10% extra para que sea la opción más atractiva: el cliente gana más y el dinero se queda en tu tienda.
2. **Nunca reembolses antes de tener el producto en tus manos.** El panel solo permite resolver cuando la devolución está en *Producto recibido*.
3. **Revisa el producto:** que esté completo, sin uso y con empaque. Si llega usado o incompleto, usa el **reembolso parcial** (escribe el monto) o rechaza explicando el motivo por correo.
4. **Separa una reserva** de cada venta (por ejemplo 3–5%) para cubrir devoluciones; así un reembolso no te deja sin dinero para resurtir.
5. **Recuerda las comisiones:** al reembolsar, Stripe y PayPal normalmente **no te devuelven su comisión** del cobro original. Por eso el cambio o el saldo a favor te cuestan menos (confírmalo en las condiciones actuales de cada uno).
6. **Producto devuelto en buen estado = vuélvelo a vender.** Revísalo, re-empácalo y regrésalo a tu inventario. Si tiene detalles, véndelo como "caja abierta" con descuento o reclama al proveedor si es defecto de fábrica.
7. **Mide los motivos.** El Excel trae columnas *Devolución*, *Motivo*, *Resolución* y *Monto*. Si un producto se devuelve mucho por "defectuoso" o "no es lo que pedí", cambia de proveedor o mejora su descripción y fotos.
8. **Evita contracargos** (cuando el cliente reclama directo a su banco): responde rápido, guarda la guía de envío y la firma de entrega o la identificación en sucursal, y ofrece solución antes de que acudan al banco. Cada contracargo tiene una comisión.
9. **En México** respeta los derechos del consumidor (PROFECO): los productos con defecto siempre se cambian o reembolsan. Lo anterior aplica a devoluciones por cambio de opinión.

## Música y presentación de productos

- Botón **♪ Música** (arriba): melodía original generada en el navegador (sin canciones con derechos de autor). Nunca suena sola; el cliente la enciende.
- **Vitrina de destacados:** carrusel con un producto de cada categoría. Avanza solo; con música, cambia al ritmo. Se pausa con el botón **Pausar** o al poner el cursor encima.
- Con música encendida, el sol late al ritmo y suena una campanita al agregar al carrito.
- Quien tenga activado "reducir movimiento" en su teléfono o computadora ve la tienda sin animaciones.

## 1. Pon tus productos

Todo se edita en **`productos.js`**. Cada producto lleva:

```js
'hogar-1': {
  categoria: 'hogar',  // hogar | cocina | electrodomesticos | electronicos | oficina | escolar | jardineria | limpieza
  edad: 'familia',     // ninos | jovenes | adultos | familia
  en: { nombre: 'Towel set', descripcion: '3 cotton pieces' },
  nombre: 'Juego de toallas',
  descripcion: '3 piezas de algodón',
  precio: { mxn: 34900, usd: 1999 }, // venta directa: en CENTAVOS por moneda
  amazon: { asin: 'B0XXXXXXXX' },   // opcional: botón "Ver en Amazon"
  imagen: 'img/toallas.jpg',        // opcional: foto en public/img/
},
```

- **Con `precio`**: se vende en Sun Shine (carrito, Stripe y apartados).
- **Con `amazon`**: aparece el botón **Ver en Amazon**. Usa `{ asin: '...' }` para un producto exacto (el ASIN está en la página del producto en Amazon) o `{ busqueda: 'texto' }` para una búsqueda.
- **Con ambos**: el cliente elige dónde comprar.
- Los productos que vienen ahora son **ejemplos con precios inventados**: reemplázalos.

### Sobre los precios de Amazon

**No escribas precios de Amazon en `productos.js`.** Amazon cambia sus precios todo el tiempo, y sus reglas de afiliados solo permiten mostrar precios leídos en vivo de su API (la **Creators API**, que reemplazó a PA-API 5 en 2026). Para obtener acceso a esa API necesitas una cuenta de Amazon Associates con ventas recientes (según guías de terceros, 10 ventas calificadas en 30 días; confírmalo en Associates Central). Mientras tanto, el catálogo muestra **"Precio en Amazon"** y el botón lleva al producto.

Si **eres afiliada**, pon tu código (por ejemplo `sunshine-20`) en la variable `AMAZON_TAG`. Los enlaces lo incluyen solos y el pie de página muestra el aviso de afiliada que Amazon exige.

## Cómo compra el cliente (todo automático)

1. **Elige por categoría** o busca. Toca **Agregar al carrito**. El carrito se guarda aunque cierre la página.
2. **Escoge cómo pagar** en el carrito:
   - **Pagar todo**: paga el total en la página segura de Stripe.
   - **Apartar con anticipo**: paga el % de anticipo hoy (30% por defecto) y recibe un **código de apartado** (`AP-XXXX-XXXX-XXXX-XXXX`).
3. **Liquida su apartado** en **Mi apartado**: ve su saldo, la barra de avance, la fecha límite y sus pagos, y puede **liquidar** o **abonar** lo que quiera (mínimo $100 por defecto).
4. Los productos de Amazon se compran **en Amazon**, con el botón **Ver en Amazon**.

Configura el anticipo, el plazo y el abono mínimo en `productos.js` → `APARTADO`. Para desactivar apartados: `activo: false`.

## 2. Publícala en internet (Render)

1. Crea una cuenta en **GitHub** y sube esta carpeta como repositorio nuevo (todo **excepto** `.env` si lo creaste).
2. Crea una cuenta en **https://render.com** (puedes entrar con GitHub).
3. En Render: **New → Blueprint** → elige tu repositorio. Render lee `render.yaml` solo.
4. Render te pedirá estas variables. **Escríbelas tú ahí, nunca en un chat:**
   - `STRIPE_SECRET_KEY` → Stripe Dashboard → Developers → API keys → *Secret key*
   - `STRIPE_PUBLISHABLE_KEY` → la *Publishable key*
   - `ADMIN_PASSWORD` → una contraseña larga para tu panel de ventas
   - `AMAZON_TAG_MX` y `AMAZON_TAG_US` → tus códigos de afiliada de Amazon (o vacíos)
   - `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` y `PAYPAL_MODO` → tus llaves de PayPal (ver "Formas de pago")
   - `STRIPE_WEBHOOK_SECRET` → déjala vacía por ahora (paso 3)
5. Pulsa **Apply**. En 2–3 minutos tendrás tu dirección, por ejemplo `https://sunshine-tienda.onrender.com`.

## 3. Conecta el webhook de Stripe

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**.
2. URL: `https://TU-DIRECCION.onrender.com/webhook`
3. Eventos: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`.
4. Copia el **Signing secret** (`whsec_…`) y pégalo en Render → tu servicio → **Environment** → `STRIPE_WEBHOOK_SECRET`.

**Activa los recibos por correo:** Stripe Dashboard → Settings → **Customer emails** → *Successful payments*. El recibo de cada apartado incluye el enlace para consultarlo y abonar.

## 4. Prueba un pago

Con llaves `sk_test_`: tarjeta `4242 4242 4242 4242`, cualquier fecha futura y cualquier CVC. Rechazo: `4000 0000 0000 0002`.
Prueba **Pagar todo** y también **Apartar**, luego abona desde **Mi apartado** y revisa todo en `/admin.html`.

## 5. Instalar la app en el celular

- **Android (Chrome):** abre tu tienda → menú ⋮ → *Instalar app*.
- **iPhone (Safari):** botón Compartir → *Agregar a inicio*.

## Control de ventas (`/admin.html`)

Entra con tu `ADMIN_PASSWORD`. Los datos vienen **en vivo de la API de Stripe**.

- **Periodo:** Hoy, 7 días, 30 días, Este mes, Este año, Todo, o fechas personalizadas.
- **Indicadores:** ventas netas (sin reembolsos), pedidos cobrados, ticket promedio y piezas vendidas.
- **Gráficas:** ventas por día (por mes si eliges más de 2 meses), **ventas por categoría** y ventas por producto. "Ver tabla" muestra los números exactos.
- **Apartados:** por cobrar, vencidos y liquidados, con saldo y avance.
- **Pedidos:** lista con buscador y estado Pagado / Pendiente / Reembolsado.
- **⬇ Descargar Excel** con 7 hojas: **Resumen** (con fórmulas), **Pedidos**, **Artículos** (con categoría), **Ventas por día**, **Ventas por categoría**, **Ventas por producto** y **Apartados**.

Las ventas de Amazon **no** aparecen aquí: esas las ves en tu cuenta de Amazon (Associates o Seller Central).

## 6. Pasar a cobros reales

1. Activa tu cuenta en Stripe (datos del negocio y cuenta bancaria).
2. En Render cambia `STRIPE_SECRET_KEY` y `STRIPE_PUBLISHABLE_KEY` por las `sk_live_` / `pk_live_`.
3. Crea el webhook también en modo *live* y usa su `whsec_` nuevo.
4. Métodos de pago extra (OXXO, Apple Pay, Google Pay…): Stripe Dashboard → Settings → Payment methods.

## Probar en tu computadora

Requiere Node.js 18+.

```bash
npm install
npm run auditar      # revisa vulnerabilidades de las dependencias
cp .env.example .env   # y edítalo con tus llaves de prueba
npm start              # http://localhost:4242
```

## Seguridad y calidad (lista de 20 puntos)

| # | Punto | Cómo lo cumple la tienda |
|---|---|---|
| 1 | Secretos protegidos | Todas las llaves (Stripe, PayPal, contraseña del panel, Amazon) van en variables de entorno. `.env` está en `.gitignore`. El navegador solo recibe el Client ID público de PayPal. |
| 2 | Validación en el servidor | El servidor recalcula precios, envío y anticipo con sus propios datos; valida IDs de producto, cantidades (1–20), región, forma de entrega, sucursal, códigos `AP-…`/`SS-…`, IDs de Stripe y PayPal, correo y montos de abono. |
| 3 | Límites máximos | Peticiones de máx. 20 KB; máx. 50 productos distintos y 20 piezas de cada uno por compra; buscador y guía de envío limitados; consultas a Stripe y PayPal con tope de registros. No hay subida de archivos. |
| 4 | XSS y CSP | Todo texto se escapa antes de mostrarse (`esc()`), y el código de las páginas está en `/public/js` (sin scripts dentro del HTML). El servidor envía una **Content-Security-Policy** que solo permite scripts de este sitio y de PayPal. |
| 5 | Inyección SQL | No hay base de datos SQL. Las búsquedas en Stripe solo usan códigos que antes pasan una validación estricta. |
| 6 | Autenticación y permisos | El panel `/admin.html` y todas sus rutas piden `ADMIN_PASSWORD` (comparación segura). Un cliente solo ve su apartado con su código secreto, o su pedido con número **y** correo. |
| 7 | Rate limiting | 300 peticiones / 5 min por IP en la API, 30 / 10 min en pagos, 10 intentos de contraseña del panel / 15 min y 20 búsquedas de pedido / 15 min. |
| 8 | HTTPS y encabezados | Redirección a HTTPS en Render, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy y CSP. |
| 9 | CORS | No se envían encabezados CORS (ningún otro dominio puede leer la API) y los POST de otros sitios se rechazan con 403. |
| 10 | Dependencias | `npm run auditar` revisa vulnerabilidades y `npm run reparar` las corrige. **Córrelo después de instalar y antes de cada publicación.** |
| 11 | Página 404 | `/404.html`: buscador, accesos a las 8 categorías, rastreo de pedido y enlace al inicio, en español e inglés. |
| 12 | Página 500 | `/500.html`: sin detalles técnicos; muestra un número de referencia que también queda en el registro del servidor. La API responde errores genéricos. |
| 13 | Estados de carga, vacío y error | Catálogo ("Cargando productos…", "No encontramos productos", error de carga), carrito vacío, panel, apartado, rastreo y página de éxito. |
| 14 | Enlaces | Revisados: no hay `href="#"` ni enlaces `javascript:`; todas las páginas enlazadas existen. |
| 15 | Responsive | Probado en celular (375 px) y computadora; en tableta usa el diseño de una columna. |
| 16 | Accesibilidad | Textos alternativos, etiquetas en formularios, contraste alto, foco visible, enlace "Saltar al catálogo", navegación con teclado y sin animaciones si el sistema pide reducir movimiento. |
| 17 | Rendimiento | Compresión, caché de archivos, carga diferida de imágenes, íconos ligeros, sin librerías pesadas. |
| 18 | SEO y metadatos | Título, descripción, favicon, URL canónica, imagen para redes 1200×630 (`og-sunshine.png`), `robots.txt` y `sitemap.xml`. |
| 19 | Legal | `/privacidad.html` y `/terminos.html` (español e inglés) y aviso de almacenamiento. **Llena tus datos en `productos.js` → `NEGOCIO.legal`.** Te recomendamos que un abogado los revise. |
| 20 | Registros y respaldo | Todos los errores y ventas quedan en el registro del servidor (Render → **Logs**). No hay base de datos que respaldar: las ventas viven en Stripe y PayPal, y el **Excel del panel** sirve como respaldo descargable. |

## Seguridad (resumen)

- La llave secreta vive **solo** en las variables del servidor. Nunca en el HTML, GitHub ni chats.
- Los precios se calculan en el servidor; nadie puede alterarlos desde el navegador.
- Los pedidos y apartados se leen de Stripe, así no se pierden aunque el servidor se reinicie.
- El plan gratis de Render "duerme" tras 15 min sin visitas; la primera carga tarda ~30 s. El plan Starter lo evita.

## Lista antes de abrir al público

- [ ] Productos reales con fotos, descripciones y precios en `productos.js` (quitar los de ejemplo)
- [ ] Enlaces de Amazon con el ASIN correcto de cada producto
- [ ] Si eres afiliada: `AMAZON_TAG_MX` y `AMAZON_TAG_US` en Render (el aviso de afiliada aparece solo)
- [ ] Enlace de tu tienda en Amazon en `tiendaAmazon` de cada región (si tienes una)
- [ ] Precios en MXN y USD para cada producto de venta directa
- [ ] Costos de envío reales por región (`ENVIOS`) y reglas de aduana revisadas antes de vender fuera de México
- [ ] Tus sucursales autorizadas reales (o quitar la opción de sucursal donde no tengas)
- [ ] PayPal: app Live, llaves en Render, `PAYPAL_MODO=live` y Transaction Search activado
- [ ] Stripe Tax configurado (`STRIPE_TAX=1`) si cobrarás impuestos en EE. UU. u otros países
- [ ] Cuenta de Stripe **activada** y llaves `sk_live_`/`pk_live_` en Render
- [ ] Webhook en modo *live* con su `whsec_` en Render
- [ ] Recibos por correo activados en Stripe (Settings → Customer emails)
- [ ] Un pago real pequeño de prueba y su reembolso desde Stripe
- [ ] `ADMIN_PASSWORD` larga y que solo tú conozcas
- [ ] Tus datos en `productos.js` → `NEGOCIO.legal` (razón social, domicilio, correo, teléfono): aparecen en el aviso de privacidad, los términos y las páginas de error
- [ ] Aviso de privacidad y términos revisados (idealmente por un abogado)
- [ ] `npm run auditar` sin vulnerabilidades altas
- [ ] Facturación: si emites facturas (CFDI en México), conecta tu sistema de facturación aparte
- [ ] Plan **Starter** de Render (sin "dormir") y dominio propio
