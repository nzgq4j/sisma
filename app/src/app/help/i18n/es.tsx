// Help centre, Spanish translation of ../topics.tsx (same structure: see help-i18n.test.ts).
import Link from 'next/link';
import { PRICES, TRIAL_DAYS } from '@/lib/entitlements';
import legal from '../../privacy/privacy.module.css';
import s from '../help.module.css';
import { Callout, Faq, MAIL, MagLegend, Shot, Ui, usd } from '../help-parts';
import type { Hub, Topic } from '../topics';

export const HUB: Hub = {
  lead: 'Todo lo que necesitas para usar sisma en la web y en la app de Android, con soluciones a los problemas más comunes.',
  popularH: 'Lo más consultado', allH: 'Todos los temas', contactQ: '¿No encuentras la respuesta?', contactP: 'Escríbenos y te ayudamos.',
  popular: [
    ['/help/account#password-reset', 'lock_reset', 'Restablecer una contraseña olvidada'],
    ['/help/felt', 'vibration', 'Reportar que sentiste un sismo'],
    ['/help/troubleshooting', 'notifications_off', 'No me llegan las alertas'],
    ['/help/troubleshooting', 'credit_card', 'Pagué, pero sigo en el plan gratuito'],
    ['/help/map#region-view', 'zoom_in_map', 'Ver la zona alrededor de un sismo'],
    ['/help/share', 'ios_share', 'Compartir un sismo con texto'],
  ],
};

export const TOPICS: Topic[] = [
  {
    slug: 'start', icon: 'rocket_launch', title: 'Primeros pasos', sub: 'Qué es sisma y cómo funciona',
    body: (
      <>
      <p>
        sisma muestra los sismos de todo el mundo tal como los informan cuatro agencias sismológicas: <strong>USGS</strong> (Estados
        Unidos), <strong>EMSC</strong> (Europa y el Mediterráneo), <strong>GeoNet</strong> (Nueva Zelanda) y <strong>JMA</strong> (Japón).
        Cuando varias agencias informan del mismo sismo, sisma lo muestra una sola vez. La lista se actualiza sola cada dos
        minutos, y puedes deslizar hacia abajo en la lista para actualizarla al instante.
      </p>
      <p>Puedes usar sisma de dos formas, con la misma cuenta y la misma suscripción a sisma+:</p>
      <ul>
        <li><strong>En la web</strong>, en <a href="https://sisma.io/app">sisma.io/app</a>, desde cualquier teléfono, tableta o computadora.</li>
        <li><strong>En la app de Android</strong> de Google Play, que añade el menú para compartir del sistema, el selector de cuentas de Google y la facturación de Google Play.</li>
      </ul>
      <p>La app tiene cinco pestañas abajo (en una computadora, en el menú de la izquierda): <Ui>Lista</Ui>, <Ui>Mapa</Ui>, <Ui>Globo</Ui>, <Ui>Ciencia</Ui> y <Ui>Perfil</Ui>.</p>
      <p>No necesitas una cuenta para ver sismos. Una cuenta guarda tus ubicaciones y ajustes, y es necesaria para sisma+ y las alertas.</p>
      <Callout kind="warn"><p><strong>sisma no es un servicio oficial de alertas.</strong> La información sobre sismos puede llegar con retraso, revisarse o estar incompleta, y sisma no ofrece alerta temprana de sismos. En una emergencia, sigue siempre las indicaciones de las autoridades locales.</p></Callout>
      </>
    ),
  },
  {
    slug: 'feed', icon: 'format_list_bulleted', title: 'La lista', sub: 'Recientes, cercanos y más fuertes',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>La pestaña <Ui>Lista</Ui> muestra los sismos recientes. Usa el selector de arriba para ordenarlos:</p>
          <ul>
            <li><strong>Recientes</strong>: primero los más nuevos.</li>
            <li><strong>Cercanos</strong>: primero los más cercanos a tu ubicación o a la ubicación guardada que elegiste.</li>
            <li><strong>Más fuertes</strong>: primero los de mayor magnitud.</li>
          </ul>
          <p>Cada fila muestra la magnitud en una insignia de color, el lugar, hace cuánto ocurrió, a qué distancia está de ti y a qué profundidad fue.</p>
          <h3>Colores de magnitud</h3>
          <p>Los mismos colores se usan en la lista, en el mapa y en el globo:</p>
          <MagLegend words={{ label: 'Colores de magnitud', magnitude: 'Magnitud {range}', orMore: '{n} o más', below: 'menos de {n}', to: '{a} a {b}' }} />
          <Callout><p>Abre <Ui>Filtros</Ui> en la parte inferior de la lista para elegir el periodo y acotar la lista. Consulta <Link href="/help/map">Mapa y filtros</Link>.</p></Callout>
        </div>
        <Shot src="feed" alt="La lista ordenada por recientes, con insignias de magnitud, lugares, horas, distancias y profundidades" caption="La lista, primero los más nuevos" />
      </div>
      </>
    ),
  },
  {
    slug: 'details', icon: 'info', title: 'Detalles del sismo', sub: 'Cada dato, explicado',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Toca cualquier sismo para abrir sus detalles:</p>
          <ul>
            <li><strong>Magnitud</strong> y su tipo (por ejemplo <em>mww</em>, la magnitud de momento que se usa para los sismos más grandes).</li>
            <li><strong>Profundidad</strong>: a qué distancia bajo la superficie empezó. Los sismos poco profundos suelen sentirse con más fuerza.</li>
            <li><strong>Fecha y hora</strong> en la zona horaria de tu dispositivo.</li>
            <li><strong>Distancia</strong> a la que está de ti, y el <strong>país</strong> (o “cerca de” un país si ocurrió en el mar).</li>
            <li><strong>Coordenadas</strong> del epicentro.</li>
            <li><strong>Estado de revisión</strong>: los valores <em>Automático</em> vienen directamente de los instrumentos y suelen cambiar durante la primera hora; <em>Revisado</em> significa que un sismólogo los ha comprobado.</li>
            <li><strong>Fuente</strong>: de qué agencia son las cifras que se muestran.</li>
          </ul>
          <p>Debajo de los detalles:</p>
          <ul>
            <li><Ui>Mostrar región</Ui> abre un mapa de cerca alrededor del sismo con los eventos cercanos y, cuando está disponible, el mapa de percepción.</li>
            <li><Ui>Compartir</Ui> abre la tarjeta para compartir (consulta <Link href="/help/share">Compartir</Link>).</li>
            <li>Si hay personas que reportaron haberlo sentido, verás cuántas.</li>
          </ul>
          <Callout kind="note"><p>Aparece un aviso de <strong>Alerta de tsunami emitida</strong> cuando la agencia señala una posible actividad de tsunami. Sigue las alertas oficiales de tsunami de tu zona.</p></Callout>
        </div>
        <Shot src="detail" alt="Detalles del sismo: magnitud, profundidad, fecha, hora, distancia, país, coordenadas, estado de revisión, fuente, Mostrar región y Compartir" caption="Los detalles de un sismo" />
      </div>
      </>
    ),
  },
  {
    slug: 'map', icon: 'map', title: 'Mapa y filtros', sub: 'Zoom, vista de región, filtros',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>La pestaña <Ui>Mapa</Ui> muestra los sismos recientes como marcadores coloreados por magnitud, centrados en tu parte del mundo.</p>
          <ul>
            <li><strong>Mueve y haz zoom</strong> con los dedos o el ratón, o con los botones <Ui>+</Ui> y <Ui>−</Ui>. El tercer botón restablece la vista.</li>
            <li><strong>Mi ubicación</strong> (el cuarto botón) hace zoom hasta donde estás ahora. La primera vez, sisma te pide acceso a tu ubicación. Un anillo alrededor del punto marca tu posición cuando en <Ui>Perfil</Ui> tienes elegido otro lugar; esa elección no cambia.</li>
            <li>Si te acercas lo suficiente, aparecen <strong>mapas de calles</strong> de OpenStreetMap, para que veas exactamente dónde ocurrió un evento.</li>
            <li><strong>Toca un marcador</strong> para ver una tarjeta de resumen y luego <Ui>Detalles</Ui> para verlo todo.</li>
          </ul>
        </div>
        <Shot src="map" alt="Mapa del mundo con marcadores de sismos coloreados por magnitud" caption="El mapa" />
      </div>
      <h3 id="region-view">Vista de región</h3>
      <div className={s.pair}>
        <div>
          <p><Ui>Mostrar región</Ui> en un sismo abre una vista de cerca de unos 800 km de ancho a su alrededor, con un marcador que late sobre el evento y etiquetas en los sismos cercanos. Toca <Ui>Volver al mapa mundial</Ui> para regresar.</p>
          <p>La vista de región es también lo que se abre cuando alguien sigue un enlace que compartiste.</p>
        </div>
        <Shot src="region" alt="Vista de región: vista de cerca alrededor de un sismo con un marcador que late y una tarjeta de resumen" caption="Vista de región" />
      </div>
      <h3>Filtros, capas y leyenda</h3>
      <div className={s.pair}>
        <div>
          <p>Desliza hacia arriba el panel <Ui>Filtros</Ui> en la parte inferior de Lista, Mapa o Globo. Tócalo una vez para abrirlo a la mitad, otra vez para abrirlo del todo, o arrástralo.</p>
          <ul>
            <li><strong>Periodo</strong>: 24 horas, 7 días o 30 días. Un año completo requiere sisma+.</li>
            <li><strong>Magnitud</strong> y <strong>Región</strong> (un país o una región oceánica) son filtros de sisma+, marcados con un candado en el plan gratuito.</li>
            <li><strong>Lugar</strong>: muestra solo los sismos cerca de una de tus ubicaciones guardadas.</li>
            <li><Ui>Borrar filtros</Ui> lo deja todo como estaba.</li>
          </ul>
          <p>En <strong>Capas</strong> puedes mostrar los <strong>límites de las placas</strong> tectónicas. El panel también muestra la leyenda de magnitudes.</p>
          <Callout><p>Al elegir una región, el mapa también hace zoom hacia ella y el globo gira para mostrarla.</p></Callout>
        </div>
        <Shot src="filters" alt="Panel de filtros abierto: periodo, magnitud, región y lugar" caption="El panel de filtros" />
      </div>
      </>
    ),
  },
  {
    slug: 'globe', icon: 'public', title: 'Globo 3D', sub: 'Gíralo y mira la profundidad',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>La pestaña <Ui>Globo</Ui> muestra los mismos sismos sobre una Tierra en 3D. Arrastra para girarla y pellizca o usa la rueda para hacer zoom. Toca un marcador para ver su resumen. <Ui>Mi ubicación</Ui>, debajo del botón <Ui>−</Ui>, gira el globo hasta donde estás ahora y hace zoom (el giro se detiene para que sigas a la vista).</p>
          <p>En las capas del panel <Ui>Filtros</Ui>:</p>
          <ul>
            <li><strong>Profundidad</strong> colorea cada sismo según su profundidad y traza una línea hasta donde empezó, para que veas los sismos profundos bajo las zonas de subducción.</li>
            <li><strong>Placas</strong> muestra los límites de las placas.</li>
            <li><strong>Girar</strong> hace que el globo gire despacio por sí solo.</li>
          </ul>
        </div>
        <Shot src="globe" alt="Globo 3D con marcadores de sismos alrededor del Pacífico" caption="El globo" />
      </div>
      </>
    ),
  },
  {
    slug: 'felt', icon: 'vibration', title: 'Lo sentí', sub: 'Reportes y mapas de percepción',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Si sentiste un sismo, cuéntaselo a sisma. Los reportes ayudan a mostrar dónde se sintió el movimiento y con qué fuerza.</p>
          <ol className={s.steps}>
            <li>Abre el sismo. Durante las <strong>6 horas</strong> siguientes a que ocurriera, verás <Ui>Lo sentí</Ui>.</li>
            <li>Mueve el control deslizante según la fuerza con que lo sentiste, de <em>No sentido</em> a <em>Extremo</em>. La insignia muestra el nivel de intensidad correspondiente (MMI).</li>
            <li>Si quieres, añade una nota o toca <Ui>Añadir detalles</Ui> para indicar dónde estabas, cuánto duró, qué se movió y si hubo daños.</li>
            <li>Si aparece <Ui>Mostrar en el mapa</Ui>, déjalo activado para situar tu reporte en el mapa, o desactívalo para que solo se cuente. Usa la ubicación de tu dispositivo o, si no la has compartido, el lugar elegido en <Ui>Perfil</Ui>, y solo aparece cuando ese lugar está a menos de 3000 km del sismo.</li>
            <li>Toca <Ui>Enviar reporte</Ui>.</li>
          </ol>
          <p>Tu reporte se guarda <strong>sin tu nombre ni tu cuenta</strong>. En el mapa, su posición se redondea a unos 10 km.</p>
          <p>Los reportes aparecen en la vista de región (<Ui>Mostrar región</Ui>) como pequeños cuadrados de unos 10 km. Junto con los reportes del USGS y del EMSC descritos abajo, cada cuadrado tiene el color de la intensidad media de los reportes que contiene.</p>
          <p>En los sismos registrados por el USGS, la vista de región también muestra las respuestas a la encuesta <strong>Did You Feel It?</strong> del USGS, como cuadrados de color de unos 10 km, un color por nivel de intensidad.</p>
          <p>En los sismos registrados por el EMSC, también incluye los reportes enviados a través de los sitios web del EMSC y la aplicación LastQuake, en los mismos cuadrados. Los datos del EMSC se comparten con la licencia CC BY 4.0.</p>
          <p>Para mostrar u ocultar todos los mapas de percepción a la vez, toca el botón <Ui>Capas</Ui> junto a <Ui>Volver al mapa mundial</Ui> y usa el interruptor <Ui>Mapas de percepción</Ui>. Tu elección se guarda en este dispositivo. La leyenda superior indica el número total de reportes y la intensidad más alta, con la escala de colores de intensidad. Los cuadrados grises son zonas del mapa de percepción automático donde ningún reporte indica una intensidad.</p>
          <h3>Mapas de percepción</h3>
          <p>Cuando mucha gente abre sisma justo después de un sismo, ese aumento muestra dónde probablemente se sintió. sisma lo convierte en un <strong>mapa de percepción</strong> anónimo en la vista de región. Las posiciones se difuminan en tu dispositivo hasta 500 m, no llevan ningún identificador de cuenta ni de dispositivo, y solo se muestran para zonas de unos 10 km con al menos 3 personas. Puedes desactivarlo en <Ui>Perfil</Ui> → <Ui>Ayudar a mapear dónde se sienten los sismos</Ui>.</p>
        </div>
        <Shot src="felt" alt="Hoja ¿Qué sentiste? con un control deslizante de intensidad, una nota opcional, el interruptor Mostrar en el mapa y Enviar reporte" caption="Reportar lo que sentiste" />
      </div>
      </>
    ),
  },
  {
    slug: 'share', icon: 'ios_share', title: 'Compartir un sismo', sub: 'Imagen, texto y texto alternativo',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Toca <Ui>Compartir</Ui> en un sismo para crear una tarjeta para compartir: una imagen con el mapa y los datos principales.</p>
          <p>Donde la gente informó haber sentido el sismo, el mapa de la tarjeta también lo muestra como en la vista de región: pequeños cuadrados con el color de la intensidad (grises si se desconoce), con la escala de intensidad abajo a la derecha. La descripción de imagen sugerida también lo menciona.</p>
          <ul>
            <li>El <strong>texto de la publicación</strong> se rellena por ti (magnitud, lugar, hora, profundidad y una etiqueta, con el enlace al final), y puedes editarlo.</li>
            <li>La <strong>descripción de la imagen (texto alternativo)</strong> describe la imagen para quienes usan lectores de pantalla. Se rellena por ti, y puedes editarla.</li>
            <li><Ui>Compartir imagen</Ui> abre el menú para compartir de tu teléfono (en la app de Android y en los navegadores que lo admiten). Si un navegador no puede compartir imágenes, o no se pudo crear la imagen, <Ui>Compartir enlace</Ui> comparte en su lugar el texto de la publicación con su enlace. <Ui>Guardar imagen</Ui> descarga la imagen, y <Ui>Copiar texto</Ui> y <Ui>Copiar texto alternativo</Ui> copian cada campo.</li>
          </ul>
          <Callout><p>X, Facebook y Bluesky suelen descartar el texto que acompaña a una imagen compartida, y ninguno acepta texto alternativo de esta forma. <strong>Compartir imagen también copia el texto</strong>, para que puedas pegarlo en la publicación. Usa <Ui>Copiar texto alternativo</Ui> y pégalo en el campo de descripción de imagen de la app.</p></Callout>
        </div>
        <Shot src="share" alt="Hoja para compartir con la vista previa de la tarjeta, el texto de la publicación editable y la descripción de la imagen" caption="La hoja para compartir" />
      </div>
      </>
    ),
  },
  {
    slug: 'account', icon: 'person', title: 'Tu cuenta', sub: 'Inicio de sesión, contraseñas, eliminar',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Ve a <Ui>Perfil</Ui> y toca <Ui>Iniciar sesión</Ui>. Puedes usar Google o tu correo y una contraseña.</p>
          <h3>Crear una cuenta con correo</h3>
          <ol className={s.steps}>
            <li>Toca <Ui>Crear una cuenta</Ui> en la parte inferior de la hoja de inicio de sesión.</li>
            <li>Escribe tu correo y una contraseña: al menos 8 caracteres, con letras y números.</li>
            <li>Abre el correo de confirmación que te enviamos y toca el enlace. Así quedarás conectado.</li>
          </ol>
          <h3>Iniciar sesión con Google</h3>
          <p>Toca <Ui>Continuar con Google</Ui>. En la app de Android, elige tu cuenta de Google en la lista que aparece. Si tu correo de Google ya tiene una cuenta de sisma, Google se añade a esa misma cuenta.</p>
        </div>
        <Shot src="signin" alt="Hoja de inicio de sesión: Continuar con Google, correo y contraseña, ¿Olvidaste tu contraseña? y Crear una cuenta" caption="Iniciar sesión" />
      </div>

      <h3 id="password-reset">¿Olvidaste tu contraseña? Restablécela</h3>
      <div className={s.pair}>
        <div>
          <ol className={s.steps}>
            <li>En <Ui>Perfil</Ui>, toca <Ui>Iniciar sesión</Ui> y escribe tu dirección de correo.</li>
            <li>Toca <Ui>¿Olvidaste tu contraseña?</Ui>. Verás <em>Revisa tu correo</em>.</li>
            <li>Abre el correo y toca el enlace. sisma se abre y muestra <em>Elige una nueva contraseña</em>.</li>
            <li>Escribe la nueva contraseña dos veces y toca <Ui>Guardar</Ui>. Ya habrás iniciado sesión.</li>
          </ol>
          <Callout kind="note"><p>Para proteger tu privacidad, sisma siempre dice que envió el enlace, aunque ninguna cuenta use esa dirección. Si no te llega nada en unos minutos, revisa la carpeta de spam y asegúrate de haber escrito la dirección con la que te registraste.</p></Callout>
        </div>
        <Shot src="forgot" alt="Revisa tu correo: enviamos un enlace para restablecer la contraseña" caption="Después de tocar ¿Olvidaste tu contraseña?" />
      </div>

      <h3>Cambiar tu contraseña o añadir una a una cuenta de Google</h3>
      <div className={s.pair}>
        <div>
          <ol className={s.steps}>
            <li>En <Ui>Perfil</Ui> → <Ui>Cuenta</Ui>, toca <Ui>Crear o cambiar contraseña</Ui>.</li>
            <li>Escribe la nueva contraseña dos veces y toca <Ui>Guardar</Ui>.</li>
          </ol>
          <p>Si te registraste con Google, así añades una contraseña para poder entrar también con tu correo. Si sisma te pide que vuelvas a iniciar sesión primero, es una comprobación de seguridad: cierra sesión, vuelve a entrar e inténtalo otra vez.</p>
        </div>
        <Shot src="password" alt="Hoja Elige una nueva contraseña con los campos de nueva contraseña y confirmación" caption="Elegir una nueva contraseña" />
      </div>

      <h3>Otras tareas de la cuenta</h3>
      <div className={s.pair}>
        <div>
          <ul>
            <li><strong>Nombre visible</strong>: <Ui>Perfil</Ui> → <Ui>Nombre visible</Ui>. Déjalo vacío para mostrar tu correo.</li>
            <li><strong>Cerrar sesión</strong>: <Ui>Perfil</Ui> → <Ui>Cerrar sesión</Ui>. Tus ubicaciones guardadas se quedan en tu cuenta.</li>
            <li><strong>Cambiar tu dirección de correo</strong>: aún no se puede hacer en la app. Escribe a <a href={`mailto:${MAIL}`}>{MAIL}</a> desde tu dirección actual.</li>
          </ul>
        </div>
        <Shot src="me" alt="Sección Cuenta en Perfil: nombre visible, correo, contraseña, cerrar sesión, ayuda y soporte, y eliminar cuenta" caption="Cuenta, al final de Perfil" />
      </div>

      <h3 id="delete-account">Eliminar tu cuenta</h3>
      <div className={s.pair}>
        <div>
          <ol className={s.steps}>
            <li>Si tienes sisma+, cancélalo primero (consulta <Link href="/help/plus#cancel">Cancelar sisma+</Link>). sisma no elimina una cuenta con una suscripción que todavía se renueva.</li>
            <li>En <Ui>Perfil</Ui>, toca <Ui>Eliminar cuenta</Ui> y luego <Ui>Eliminar para siempre</Ui>.</li>
          </ol>
          <p>Esto elimina para siempre tu cuenta, tus ubicaciones guardadas y tus ajustes de alertas. Los reportes de sismos sentidos que enviaste se conservan sin tu nombre. Eliminar la cuenta no elimina la app de Android; desinstálala por separado si quieres. Nuestra <Link href="/privacy#delete">política de privacidad</Link> explica qué pasa con tus datos.</p>
        </div>
        <Shot src="delete" alt="Hoja ¿Eliminar tu cuenta? con Eliminar para siempre y Cancelar" caption="Eliminar una cuenta" />
      </div>
      </>
    ),
  },
  {
    slug: 'locations', icon: 'location_on', title: 'Ubicaciones guardadas', sub: 'Los lugares que te importan',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Las ubicaciones guardadas deciden qué sismos son los “cercanos” y qué lugares vigilan tus alertas.</p>
          <ul>
            <li><strong>Mi ubicación</strong> usa la posición de tu dispositivo (tu navegador o teléfono te pide permiso primero).</li>
            <li><Ui>Añadir ubicación</Ui> te permite buscar una ciudad o un pueblo y guardarlo.</li>
            <li>Toca una ubicación para que sea la que se usa para las distancias. Toca <Ui>×</Ui> para quitarla.</li>
            <li>Cuando está elegida <strong>Mi ubicación</strong>, sisma usa tu posición siempre que tu dispositivo pueda darla. Si no puede (ubicación desactivada o sin permiso), o si elegiste un lugar guardado, sisma usa ese lugar guardado: tu lugar predeterminado o el primero que guardaste.</li>
          </ul>
          <p>El plan gratuito incluye <strong>1 ubicación guardada</strong>, y sisma+ <strong>hasta 10</strong>. Sin cuenta, las ubicaciones se guardan en este dispositivo y pasan a tu cuenta cuando inicias sesión.</p>
        </div>
        <Shot src="addloc" alt="Hoja Añadir ubicación con un cuadro de búsqueda de ciudad o pueblo" caption="Añadir una ubicación" />
      </div>
      </>
    ),
  },
  {
    slug: 'plus', icon: 'workspace_premium', title: 'sisma+', sub: 'Prueba, pagos, cancelación',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>sisma es gratis. sisma+ añade:</p>
          <div className={legal.tableWrap}>
            <table style={{ minWidth: 0 }}>
              <thead><tr><th>Función</th><th>Gratis</th><th>sisma+</th></tr></thead>
              <tbody>
                <tr><td>Lista, mapa, globo y ciencia en directo</td><td>✓</td><td>✓</td></tr>
                <tr><td>Historial de sismos</td><td>30 días</td><td>Historial completo</td></tr>
                <tr><td>Ubicaciones guardadas</td><td>1</td><td>Hasta 10</td></tr>
                <tr><td>Alertas push con tus propias reglas</td><td>–</td><td>Hasta 5 alertas</td></tr>
                <tr><td>Filtros de magnitud y región</td><td>–</td><td>✓</td></tr>
              </tbody>
            </table>
          </div>
          <p>Precio: <strong>{usd(PRICES.yearly.usd)} al año</strong>, un único plan. Google Play muestra el precio en tu moneda local. Quienes se suscriben por primera vez tienen una <strong>prueba gratis de {TRIAL_DAYS} días</strong>, una vez por cuenta.</p>
        </div>
        <Shot src="paywall" alt={`Hoja de sisma+ con las funciones, el precio anual y Prueba gratis de ${TRIAL_DAYS} días`} caption="Elegir un plan" />
      </div>

      <h3>Suscribirse</h3>
      <ul>
        <li><strong>En la web</strong>: <Ui>Perfil</Ui> → <Ui>Prueba gratis de {TRIAL_DAYS} días</Ui> (o <Ui>Suscribirse</Ui>), y luego paga en la página de pago segura de Stripe. Si primero creas una cuenta, el pago se abre cuando tocas el enlace del correo de confirmación. Al volver, sisma muestra <em>Activando sisma+…</em> durante unos segundos y luego <em>Te damos la bienvenida a sisma+</em>.</li>
        <li><strong>En la app de Android</strong>: el mismo botón abre la hoja de pago de Google Play, donde puedes pagar con Google Pay, una tarjeta u otros métodos de pago de Google Play.</li>
      </ul>
      <p>Tienes que haber iniciado sesión. Después, tu suscripción funciona en todos los lugares donde inicies sesión con esa cuenta, en la web y en la app.</p>

      <h3>Gestionar o cambiar de plan</h3>
      <div className={s.pair}>
        <div>
          <p>Ve a <Ui>Perfil</Ui> → <Ui>Gestionar suscripción</Ui> para ver tu estado, tu plan y la próxima fecha.</p>
          <ul>
            <li><strong>Comprado en la web</strong>: <Ui>Gestionar facturación</Ui> abre la página de Stripe, donde puedes actualizar tu tarjeta, ver las facturas o cancelar.</li>
            <li><strong>Comprado en la app de Android</strong>: <Ui>Gestionar en Google Play</Ui> abre tu suscripción en Google Play.</li>
          </ul>
        </div>
        <Shot src="subscription" alt="Página de suscripción: estado, plan, fecha de renovación y Gestionar en Google Play" caption="Tu suscripción" />
      </div>

      <h3 id="cancel">Cancelar sisma+</h3>
      <ol className={s.steps}>
        <li>Abre <Ui>Perfil</Ui> → <Ui>Gestionar suscripción</Ui>.</li>
        <li>Toca <Ui>Gestionar facturación</Ui> (web) o <Ui>Gestionar en Google Play</Ui> (app) y cancela allí. En Google Play también puedes ir a <em>Pagos y suscripciones → Suscripciones</em>.</li>
      </ol>
      <p>Mantienes sisma+ hasta el final del periodo que pagaste. Entonces la tarjeta de <Ui>Perfil</Ui> muestra <em>Se cancela el</em> y la fecha, y después de esa fecha vuelves al plan gratuito. Si cancelas una prueba gratis antes de que termine, no se te cobra nada.</p>
      <Callout kind="note"><p>Desinstalar la app o eliminar tu cuenta de sisma <strong>no</strong> cancela una suscripción de Google Play. Cancélala en Google Play.</p></Callout>

      <h3>Restaurar una compra</h3>
      <p>En un teléfono nuevo o después de reinstalar la app, inicia sesión con la misma cuenta de sisma. Si sisma+ no aparece, abre la hoja de sisma+ y toca <Ui>Restaurar compra</Ui>. Esto solo está en la app de Android y busca la suscripción de Google Play en este dispositivo.</p>

      <h3>Reembolsos</h3>
      <p>Las compras en Google Play siguen las políticas de reembolso de Google Play, así que solicita el reembolso a través de Google Play. Para compras en la web, escribe a <a href={`mailto:${MAIL}`}>{MAIL}</a>. Nuestros <Link href="/terms">términos del servicio</Link> explican los detalles.</p>
      </>
    ),
  },
  {
    slug: 'alerts', icon: 'notifications_active', title: 'Alertas', sub: 'Notificaciones push a tu medida',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Con sisma+, sisma te envía una notificación push cuando un sismo coincide con una de tus alertas.</p>
          <ol className={s.steps}>
            <li>Inicia sesión y comprueba que tienes sisma+.</li>
            <li>En <Ui>Perfil</Ui>, activa <Ui>Alertas push</Ui>, o abre <Ui>Reglas de alerta</Ui> y activa las <em>alertas de terremotos</em>.</li>
            <li>En <em>Enviar por</em>, toca <Ui>Activar notificaciones en este dispositivo</Ui> y permite las notificaciones cuando se te pida.</li>
            <li>Toca <Ui>Añadir una alerta</Ui> y configúrala (ver abajo). Puedes tener hasta 5.</li>
            <li>Toca <Ui>Enviar alerta de prueba</Ui> para comprobar que este dispositivo las recibe.</li>
          </ol>
        </div>
        <Shot src="alerts" alt="Página de alertas con el interruptor de activación, tus alertas (0 de 5), Añadir una alerta y Enviar por" caption="La página de alertas" />
      </div>
      <h3>Configurar una alerta</h3>
      <ul>
        <li><strong>Nombre</strong>: por ejemplo <em>Cerca de casa</em>.</li>
        <li><strong>Magnitud mínima</strong>: recibes alertas de esta magnitud y superiores.</li>
        <li><strong>Vigilando</strong>: tus lugares guardados dentro de la distancia que elijas (100, 250, 500 o 1000 km), o en cualquier parte del mundo.</li>
        <li><strong>Otras ubicaciones</strong>: hasta 20 países o regiones, en cualquier punto dentro de ellos.</li>
        <li><strong>Horas de silencio</strong>: sin alertas por la noche, con la opción de dejar pasar igualmente los sismos fuertes (magnitud 6 o más).</li>
        <li>Un gráfico muestra cuántos sismos de los últimos 30 días habrían activado la alerta, para que puedas ajustarla.</li>
      </ul>
      <p>Las alertas que recibiste en los últimos 30 días aparecen en <em>Historial de alertas</em>.</p>
      <Callout kind="note"><p><strong>iPhone y iPad:</strong> las notificaciones web solo funcionan después de añadir sisma a la pantalla de inicio (Compartir → Añadir a pantalla de inicio) y abrirlo desde allí. La primera vez que abres sisma en el navegador de un iPhone o iPad, una ventana muestra estos pasos; toca <Ui>Ahora no</Ui> para volver a verla en dos semanas o <Ui>Entendido</Ui> para ocultarla.</p></Callout>
      </>
    ),
  },
  {
    slug: 'settings', icon: 'tune', title: 'Ajustes', sub: 'Idioma, tema, unidades',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Los encontrarás en <Ui>Perfil</Ui>, debajo de tus ubicaciones:</p>
          <ul>
            <li><strong>Idioma</strong>: English, Español, 日本語, Bahasa Indonesia, Türkçe, Italiano, Português, 中文, Français o Deutsch. También puedes tocar el botón de idioma en la parte superior de cualquier pestaña.</li>
            <li><strong>Apariencia</strong>: seguir a tu dispositivo (Sistema), Claro u Oscuro.</li>
            <li><strong>Unidades</strong>: kilómetros o millas.</li>
            <li><strong>Marcadores del mapa</strong>: chinchetas con la magnitud escrita dentro, o círculos con un tamaño según la magnitud. Aquí también encontrarás la leyenda de colores.</li>
            <li><strong>Ayudar a mapear dónde se sienten los sismos</strong>: activa o desactiva el envío anónimo para el mapa de percepción (consulta <Link href="/help/felt">Lo sentí</Link>).</li>
            <li><strong>Ver la introducción</strong> vuelve a mostrar los pasos de bienvenida.</li>
          </ul>
          <p>Si has iniciado sesión, tu idioma y tu apariencia se guardan en tu cuenta.</p>
        </div>
        <Shot src="me_more" alt="Ajustes: idioma, apariencia, unidades, marcadores del mapa, interruptor del mapa de percepción, introducción y fuentes de datos" caption="Ajustes en Perfil" />
      </div>
      </>
    ),
  },
  {
    slug: 'science', icon: 'science', title: 'Ciencia', sub: 'Cómo funcionan los sismos',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>La pestaña <Ui>Ciencia</Ui> tiene ocho guías breves e ilustradas, cada una con un diagrama animado o un gráfico en directo: tectónica de placas, tipos de fallas, ondas sísmicas, magnitud e intensidad, profundidad y réplicas, tsunamis, cómo prepararse y el Anillo de Fuego, con un mapa en directo de cuántos sismos recientes ocurrieron alrededor del Pacífico.</p>
          <p>Toca los botones debajo de un diagrama para cambiar de vista, y el botón de pausa para detener la animación. Las guías siguen tu idioma, como el resto de la app. Toca <Ui>Compartir</Ui> en la parte superior de una guía para enviarla a alguien, con su imagen, un breve resumen y el enlace.</p>
          <p>Debajo de las guías, <Ui>En profundidad</Ui> tiene artículos más largos para cuando quieras ir más allá: por qué no se pueden predecir los sismos, tectónica de placas y subducción, fallas y esfuerzos, el interior de la Tierra y las ondas sísmicas, las réplicas y el peligro sísmico, por qué un barrio sufre más daños que el de al lado, y cómo funcionan las escalas de magnitud y por qué cambia la cifra después de un sismo. Cada uno incluye sus fuentes y responde preguntas frecuentes al final. También están en tu idioma; la lista de fuentes se mantiene en inglés.</p>
        </div>
        <Shot src="science" alt="Artículo sobre ondas sísmicas con un diagrama animado de ondas P" caption="Una guía de ciencia" />
      </div>
      </>
    ),
  },
  {
    slug: 'troubleshooting', icon: 'build', title: 'Solución de problemas', sub: 'Soluciones a problemas comunes',
    body: (
      <>
      <div className={s.faq}>
        <p className={s.faqGroup}>Ubicación y datos</p>
        <Faq q="“Cercanos” está vacío, o no se encuentra mi ubicación">
          <p>sisma necesita permiso para usar tu ubicación, o una ubicación guardada.</p>
          <ul>
            <li><strong>Navegador</strong>: toca el icono junto a la dirección web, pon <em>Ubicación</em> en <em>Permitir</em> y vuelve a cargar la página.</li>
            <li><strong>App de Android</strong>: Ajustes → Aplicaciones → sisma → Permisos → Ubicación → <em>Permitir solo mientras se usa la aplicación</em>.</li>
            <li>O añade un lugar en <Ui>Perfil</Ui> → <Ui>Añadir ubicación</Ui>.</li>
          </ul>
        </Faq>
        <Faq q="Falta un sismo, o su magnitud cambió">
          <p>Las agencias publican primero cifras automáticas y luego las revisan, normalmente durante la primera hora. La magnitud, la profundidad y el lugar pueden cambiar, y algunos eventos pequeños se eliminan. Distintas agencias también pueden informar valores algo diferentes; sisma muestra las cifras de la agencia regional cuando las tiene (JMA en Japón, GeoNet en Nueva Zelanda), si no las de USGS y después las de EMSC. Los sismos muy pequeños (por debajo de una magnitud de 2,5 aproximadamente fuera de Japón y Nueva Zelanda) no se incluyen.</p>
        </Faq>
        <Faq q="Las horas parecen incorrectas">
          <p>Las horas se muestran en la zona horaria de tu dispositivo. Revisa los ajustes de fecha, hora y zona horaria de tu dispositivo.</p>
        </Faq>
        <Faq q="El mapa se queda en blanco cuando me acerco mucho">
          <p>Los mapas a nivel de calle vienen de OpenStreetMap y necesitan conexión a internet. Si no cargan, aléjate un poco; los marcadores de sismos siguen funcionando.</p>
        </Faq>
        <Faq q="La app dice que no tengo conexión">
          <p>sisma necesita conexión para cargar los sismos. Revisa el wifi o los datos móviles y vuelve a abrir la app.</p>
        </Faq>

        <p className={s.faqGroup}>Inicio de sesión</p>
        <Faq q="“El correo o la contraseña no son correctos”">
          <p>Revisa si hay errores de escritura y luego usa <Link href="/help/account#password-reset">¿Olvidaste tu contraseña?</Link>. Si creaste tu cuenta con Google, usa <Ui>Continuar con Google</Ui>, o añade una contraseña en <Ui>Perfil</Ui> → <Ui>Crear o cambiar contraseña</Ui> mientras tienes la sesión iniciada con Google.</p>
        </Faq>
        <Faq q="“Primero confirma tu correo”">
          <p>Abre el correo de confirmación de sisma y toca el enlace; después inicia sesión. ¿No lo encuentras? Revisa la carpeta de spam. Si sigue sin aparecer, escribe a <a href={`mailto:${MAIL}`}>{MAIL}</a> desde esa dirección.</p>
        </Faq>
        <Faq q="No me llegó el correo para restablecer o confirmar">
          <p>Espera unos minutos y revisa la carpeta de spam o de promociones. Asegúrate de haber escrito la dirección con la que te registraste. Para proteger tu privacidad, sisma dice que envió un enlace para restablecer aunque ninguna cuenta use esa dirección.</p>
        </Faq>
        <Faq q="El inicio de sesión con Google no funciona">
          <p>En la app de Android, asegúrate de haber iniciado sesión con una cuenta de Google en el teléfono (Ajustes → Contraseñas y cuentas) y de que los servicios de Google Play estén actualizados. En la web, permite las ventanas emergentes y el inicio de sesión de terceros para sisma.io. Siempre puedes iniciar sesión con tu correo.</p>
        </Faq>
        <Faq q="“Por seguridad, cierra sesión y vuelve a entrar”">
          <p>Para cambiar la contraseña hace falta haber iniciado sesión hace poco. Toca <Ui>Cerrar sesión</Ui>, vuelve a entrar y luego cámbiala.</p>
        </Faq>

        <p className={s.faqGroup}>sisma+ y pagos</p>
        <Faq q="Pagué, pero sigo viendo el plan gratuito">
          <ul>
            <li>Espera un minuto y luego cierra y vuelve a abrir sisma. La activación suele ser inmediata, pero puede tardar unos minutos.</li>
            <li>Asegúrate de haber iniciado sesión con la cuenta con la que te suscribiste.</li>
            <li>App de Android: abre la hoja de sisma+ y toca <Ui>Restaurar compra</Ui>.</li>
            <li>¿Sigue sin funcionar? Escribe a <a href={`mailto:${MAIL}`}>{MAIL}</a> con el correo de tu cuenta y, para Google Play, el número de pedido (GPA.…) de tu recibo.</li>
          </ul>
        </Faq>
        <Faq q="“Esta suscripción de Google Play pertenece a otra cuenta de sisma”">
          <p>La suscripción de este teléfono se compró con la sesión iniciada en otra cuenta de sisma. Cierra sesión e inicia sesión con esa cuenta.</p>
        </Faq>
        <Faq q="No se me ofreció la prueba gratis">
          <p>La prueba es para cuentas que nunca se han suscrito. En la app de Android, Google Play además solo permite una prueba por cuenta de Google, incluso con distintas cuentas de sisma.</p>
        </Faq>
        <Faq q="“Las suscripciones en la app aún no están disponibles” o “La facturación de Google Play no está disponible en este dispositivo”">
          <p>Actualiza sisma y la app Google Play Store, y asegúrate de haber iniciado sesión en Google Play. Algunos dispositivos sin Google Play no pueden comprar en la app. En ese caso, suscríbete en <a href="https://sisma.io/app/me">sisma.io</a> e inicia sesión con la misma cuenta en la app.</p>
        </Faq>
        <Faq q="No puedo eliminar mi cuenta">
          <p>Primero cancela sisma+. Cuando esté configurado para terminar, podrás eliminar la cuenta. Consulta <Link href="/help/account#delete-account">Eliminar tu cuenta</Link>.</p>
        </Faq>

        <p className={s.faqGroup}>Alertas y notificaciones</p>
        <Faq q="No me llegan las alertas">
          <ol>
            <li>Comprueba que tienes sisma+ y que has iniciado sesión.</li>
            <li>En <Ui>Perfil</Ui> → <Ui>Reglas de alerta</Ui>, comprueba que las alertas están activadas y que al menos una alerta está activada y tiene lugares o zonas.</li>
            <li>En <em>Enviar por</em>, comprueba que este dispositivo está activado y luego toca <Ui>Enviar alerta de prueba</Ui>.</li>
            <li>Android: en Ajustes → Aplicaciones → sisma → Notificaciones deben estar permitidas. Los ajustes de ahorro de batería pueden retrasar las notificaciones; pon el uso de batería de sisma en <em>Sin restricciones</em>.</li>
            <li>Navegador: las notificaciones deben estar permitidas para sisma.io. En iPhone y iPad, abre sisma desde la pantalla de inicio.</li>
            <li>Las horas de silencio retienen las alertas por la noche, a menos que dejes pasar los sismos fuertes.</li>
          </ol>
        </Faq>
        <Faq q="Recibo demasiadas alertas">
          <p>Sube la magnitud mínima, reduce la distancia, quita regiones amplias o configura horas de silencio. El gráfico de 30 días de cada alerta muestra con qué frecuencia se habría activado.</p>
        </Faq>

        <p className={s.faqGroup}>Compartir y reportes</p>
        <Faq q="No aparece el botón “Compartir imagen”">
          <p>Tu navegador no puede compartir archivos. Usa <Ui>Guardar imagen</Ui> y <Ui>Copiar texto</Ui>, y publícalos tú. En la app de Android, actualiza sisma para tener el menú para compartir del sistema.</p>
        </Faq>
        <Faq q="El texto no apareció en mi publicación">
          <p>Muchas apps descartan el texto que se comparte con una imagen. sisma lo copió cuando tocaste <Ui>Compartir imagen</Ui>, así que pégalo en la publicación.</p>
        </Faq>
        <Faq q="No aparece el botón “Lo sentí”">
          <p>Los reportes están abiertos durante 6 horas después de un sismo. Pasado ese tiempo, el botón desaparece.</p>
        </Faq>
      </div>
      </>
    ),
  },
  {
    slug: 'contact', icon: 'support_agent', title: 'Contactar con soporte', sub: '¿Sigues con problemas? Escríbenos',
    body: (
      <>
      <div className={s.contact}>
        <span className="ms" aria-hidden="true">mail</span>
        <div style={{ flex: '1 1 260px' }}>
          <p style={{ margin: 0 }}><strong>¿Todavía necesitas ayuda?</strong> Escríbenos e incluye el correo de tu cuenta, tu dispositivo y la versión del navegador o de la app, y lo que ya probaste. Una captura de pantalla ayuda.</p>
        </div>
        <a className={s.mail} href={`mailto:${MAIL}?subject=${encodeURIComponent('sisma help')}`}>{MAIL}</a>
      </div>
      <p>Por favor, no envíes contraseñas ni números completos de tarjeta. Nunca te los pediremos.</p>
      </>
    ),
  },
];
