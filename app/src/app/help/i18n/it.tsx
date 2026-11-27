// Help centre, Italian translation of ../topics.tsx (same structure: see help-i18n.test.ts).
import Link from 'next/link';
import { PRICES, TRIAL_DAYS } from '@/lib/entitlements';
import legal from '../../privacy/privacy.module.css';
import s from '../help.module.css';
import { Callout, Faq, MAIL, MagLegend, Shot, Ui, usd } from '../help-parts';
import type { Hub, Topic } from '../topics';

export const HUB: Hub = {
  lead: 'Tutto ciò che ti serve per usare sisma sul sito e nell’app Android, con le soluzioni ai problemi più comuni.',
  popularH: 'Più consultati', allH: 'Tutti gli argomenti', contactQ: 'Non trovi una risposta?', contactP: 'Scrivici e ti aiuteremo.',
  popular: [
    ['/help/account#password-reset', 'lock_reset', 'Reimpostare una password dimenticata'],
    ['/help/felt', 'vibration', 'Segnalare di aver sentito un terremoto'],
    ['/help/troubleshooting', 'notifications_off', 'Non ricevo gli avvisi'],
    ['/help/troubleshooting', 'credit_card', 'Ho pagato ma ho ancora il piano gratuito'],
    ['/help/map#region-view', 'zoom_in_map', 'Vedere la zona intorno a un terremoto'],
    ['/help/share', 'ios_share', 'Condividere un terremoto con un testo'],
  ],
};

export const TOPICS: Topic[] = [
  {
    slug: 'start', icon: 'rocket_launch', title: 'Per iniziare', sub: 'Cos’è sisma e come funziona',
    body: (
      <>
      <p>
        sisma mostra i terremoti di tutto il mondo così come vengono segnalati da quattro agenzie sismiche: <strong>USGS</strong> (Stati
        Uniti), <strong>EMSC</strong> (Europa e Mediterraneo), <strong>GeoNet</strong> (Nuova Zelanda) e <strong>JMA</strong> (Giappone).
        Quando più agenzie segnalano lo stesso terremoto, sisma lo mostra una sola volta. L’elenco si aggiorna da solo ogni due
        minuti, e puoi trascinarlo verso il basso per aggiornarlo subito.
      </p>
      <p>Puoi usare sisma in due modi, con lo stesso account e lo stesso abbonamento sisma+:</p>
      <ul>
        <li><strong>Sul web</strong> su <a href="https://sisma.io/app">sisma.io/app</a>, da qualsiasi telefono, tablet o computer.</li>
        <li><strong>Nell’app Android</strong> da Google Play, che aggiunge il menu di condivisione del sistema, la scelta dell’account Google e la fatturazione di Google Play.</li>
      </ul>
      <p>L’app ha cinque schede in basso (sul computer, nel menu a sinistra): <Ui>Elenco</Ui>, <Ui>Mappa</Ui>, <Ui>Globo</Ui>, <Ui>Scienza</Ui> e <Ui>Profilo</Ui>.</p>
      <p>Non ti serve un account per consultare i terremoti. Un account conserva i tuoi luoghi salvati e le impostazioni, ed è necessario per sisma+ e per gli avvisi.</p>
      <Callout kind="warn"><p><strong>sisma non è un servizio di allerta ufficiale.</strong> Le informazioni sui terremoti possono arrivare in ritardo, essere riviste o essere incomplete, e sisma non fornisce allerte sismiche precoci. In caso di emergenza, segui sempre le indicazioni delle autorità locali.</p></Callout>
      </>
    ),
  },
  {
    slug: 'feed', icon: 'format_list_bulleted', title: 'L’elenco', sub: 'Recenti, vicini e più forti',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>La scheda <Ui>Elenco</Ui> mostra i terremoti recenti. Usa il selettore in alto per ordinarli:</p>
          <ul>
            <li><strong>Recenti</strong>: prima i più nuovi.</li>
            <li><strong>Vicini</strong>: prima i più vicini alla tua posizione o al luogo salvato che hai scelto.</li>
            <li><strong>Più forti</strong>: prima quelli di magnitudo più alta.</li>
          </ul>
          <p>Ogni riga mostra la magnitudo in un badge colorato, il luogo con la bandiera del paese in cui si trova o a cui è vicino, distanza e direzione da un centro vicino, quanto tempo fa è avvenuto, quanto dista da te e a che profondità. Continua a scorrere: altri terremoti vengono aggiunti quando arrivi in fondo all’elenco.</p>
          <p>Su un computer, l’elenco si trova nella pagina <Ui>Panoramica</Ui>, la prima del menu a sinistra, con una mappa accanto. Scegli un terremoto nell’elenco o sulla mappa e la mappa si ingrandisce su di esso, con i nomi delle città vicine. Resta lì quando chiudi il terremoto; <Ui>Ripristina vista</Ui> mostra di nuovo tutto il mondo. Scegli un paese o una regione in <Ui>Luogo</Ui>, in alto a destra, oppure toccane uno in <Ui>Regioni principali</Ui>, e la mappa si avvicina ai suoi terremoti; <Ui>Tutti i luoghi</Ui> mostra di nuovo tutto il mondo.</p>
          <h3>Colori della magnitudo</h3>
          <p>Gli stessi colori sono usati nell’elenco, sulla mappa e sul globo:</p>
          <MagLegend words={{ label: 'Colori della magnitudo', magnitude: 'Magnitudo {range}', orMore: '{n} o superiore', below: 'inferiore a {n}', to: 'da {a} a {b}' }} />
          <Callout><p>Apri <Ui>Filtri</Ui> in fondo all’elenco per scegliere il periodo e restringere l’elenco. Vedi <Link href="/help/map">Mappa e filtri</Link>.</p></Callout>
        </div>
        <Shot src="feed" alt="L’elenco ordinato per i più recenti, con badge di magnitudo, luoghi, orari, distanze e profondità" caption="L’elenco, prima i più nuovi" />
      </div>
      </>
    ),
  },
  {
    slug: 'details', icon: 'info', title: 'Dettagli del terremoto', sub: 'Ogni numero spiegato',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Tocca un terremoto per aprirne i dettagli:</p>
          <ul>
            <li><strong>Magnitudo</strong> e il suo tipo (per esempio <em>mww</em>, la magnitudo momento usata per i terremoti più grandi).</li>
            <li><strong>Profondità</strong>: a che profondità sotto la superficie è iniziato. I terremoti superficiali di solito si avvertono di più.</li>
            <li><strong>Data e ora</strong> nel fuso orario del tuo dispositivo.</li>
            <li><strong>Distanza</strong> da te e il <strong>paese</strong> (oppure “vicino a” un paese per gli eventi in mare).</li>
            <li><strong>Coordinate</strong> dell’epicentro.</li>
            <li><strong>Stato di revisione</strong>: i valori <em>Automatico</em> arrivano direttamente dagli strumenti e spesso cambiano nella prima ora; <em>Rivisto</em> significa che un sismologo li ha controllati.</li>
            <li><strong>Fonte</strong>: di quale agenzia sono i dati mostrati.</li>
          </ul>
          <p>Sotto i dettagli:</p>
          <ul>
            <li><Ui>Mostra zona</Ui> apre una mappa ravvicinata intorno al terremoto con gli eventi vicini e, se disponibile, la mappa del risentimento.</li>
            <li><Ui>Condividi</Ui> apre la scheda di condivisione (vedi <Link href="/help/share">Condivisione</Link>).</li>
            <li>Se qualcuno ha segnalato di averlo sentito, vedrai quante persone.</li>
          </ul>
          <Callout kind="note"><p><strong>Tsunami:</strong> quando un centro di allerta tsunami (PTWC, NTWC o la JMA giapponese) emette un messaggio ufficiale per un terremoto, il suo livello viene mostrato così com’è, per esempio <strong>Allerta tsunami</strong> o <strong>Avviso di tsunami</strong>, con il centro, l’ora, le coste indicate e <Ui>Leggi il messaggio ufficiale</Ui>. Allerte, minacce, sorveglianze e avvisi sono colorati e aggiungono un badge onda al segnaposto del terremoto e un’icona onda colorata alla sua riga; i messaggi informativi e le previsioni restano grigi. Un messaggio segnato come <em>Annullato</em> o <em>Non più in vigore</em> è stato ritirato o è scaduto. Senza un messaggio ufficiale, un forte terremoto sotto il mare mostra <em>Forte terremoto sotto il mare: controlla le informazioni ufficiali sugli tsunami</em>. sisma riporta questi messaggi e non è un servizio di allerta: segui sempre le autorità locali.</p></Callout>
        </div>
        <Shot src="detail" alt="Dettagli del terremoto: magnitudo, profondità, data, ora, distanza, paese, coordinate, stato di revisione, fonte, Mostra zona e Condividi" caption="I dettagli di un terremoto" />
      </div>
      </>
    ),
  },
  {
    slug: 'map', icon: 'map', title: 'Mappa e filtri', sub: 'Zoom, vista della zona, filtri',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>La scheda <Ui>Mappa</Ui> mostra i terremoti recenti come segnaposto colorati in base alla magnitudo, centrati sulla tua parte del mondo.</p>
          <ul>
            <li><strong>Spostati e fai zoom</strong> con le dita o con il mouse, oppure con i pulsanti <Ui>+</Ui> e <Ui>−</Ui>. Il terzo pulsante ripristina la vista.</li>
            <li><strong>La mia posizione</strong> (il quarto pulsante) fa zoom su dove ti trovi ora. La prima volta, sisma ti chiede l’accesso alla tua posizione. Un anello intorno al punto indica la tua posizione quando in <Ui>Profilo</Ui> è scelto un altro luogo; quella scelta resta invariata.</li>
            <li>Ingrandendo una regione compaiono i <strong>nomi delle città</strong>, nella tua lingua, per aiutarti a orientarti. Prima le città più grandi; i nomi non coprono i terremoti e lasciano il posto a quelli delle mappe stradali.</li>
            <li>Se fai abbastanza zoom compaiono le <strong>mappe stradali</strong> di OpenStreetMap, così puoi vedere esattamente dove è avvenuto un evento.</li>
            <li><strong>Tocca un segnaposto</strong> per vedere una scheda di riepilogo, poi <Ui>Dettagli</Ui> per sapere tutto.</li>
          </ul>
        </div>
        <Shot src="map" alt="Mappa del mondo con segnaposto dei terremoti colorati in base alla magnitudo" caption="La mappa" />
      </div>
      <h3 id="region-view">Vista della zona</h3>
      <div className={s.pair}>
        <div>
          <p><Ui>Mostra zona</Ui> su un terremoto apre una vista ravvicinata di circa 800 km intorno all’evento, con un indicatore pulsante sull’evento ed etichette sui terremoti vicini. Tocca <Ui>Torna alla mappa del mondo</Ui> per tornare indietro.</p>
          <p>La vista della zona è anche ciò che si apre quando qualcuno segue un link che hai condiviso.</p>
        </div>
        <Shot src="region" alt="Vista della zona: un primo piano intorno a un terremoto con un indicatore pulsante e una scheda di riepilogo" caption="Vista della zona" />
      </div>
      <h3>Filtri, livelli e legenda</h3>
      <div className={s.pair}>
        <div>
          <p>Trascina verso l’alto il pannello <Ui>Filtri</Ui> in fondo a Elenco, Mappa o Globo. Toccalo una volta per aprirlo a metà, di nuovo per aprirlo del tutto, oppure trascinalo.</p>
          <ul>
            <li><strong>Periodo</strong>: 24 ore, 7 giorni o 30 giorni. Un anno intero richiede sisma+.</li>
            <li><strong>Magnitudo</strong> e <strong>Regione</strong> (un paese o una regione oceanica) sono filtri di sisma+, segnati con un lucchetto nel piano gratuito.</li>
            <li><strong>Luogo</strong>: mostra solo i terremoti vicini a uno dei tuoi luoghi salvati.</li>
            <li><Ui>Cancella filtri</Ui> ripristina tutto.</li>
          </ul>
          <p>In <strong>Livelli</strong> puoi mostrare i <strong>confini delle placche</strong> tettoniche. Il pannello mostra anche la legenda della magnitudo.</p>
          <Callout><p>Scegliere una regione fa anche zoom della mappa su di essa e gira il globo verso di essa.</p></Callout>
        </div>
        <Shot src="filters" alt="Pannello dei filtri aperto: periodo, magnitudo, regione e luogo" caption="Il pannello dei filtri" />
      </div>
      </>
    ),
  },
  {
    slug: 'globe', icon: 'public', title: 'Globo 3D', sub: 'Fallo girare, guarda la profondità',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>La scheda <Ui>Globo</Ui> mostra gli stessi terremoti su una Terra in 3D. Trascina per ruotarla e avvicina le dita o scorri per fare zoom. Tocca un segnaposto per il suo riepilogo. <Ui>La mia posizione</Ui>, sotto il pulsante <Ui>−</Ui>, gira il globo verso dove ti trovi ora e fa zoom (la rotazione si ferma così resti inquadrato).</p>
          <p>Ingrandendo compaiono i <strong>nomi delle città</strong> nella tua lingua, come sulla mappa, sul lato del globo rivolto verso di te, senza coprire i terremoti né i pulsanti.</p>
          <p>Nei livelli del pannello <Ui>Filtri</Ui>:</p>
          <ul>
            <li><strong>Profondità</strong> colora ogni terremoto in base alla profondità e traccia una linea fino al punto in cui è iniziato, così puoi vedere i terremoti profondi sotto le zone di subduzione.</li>
            <li><strong>Placche</strong> mostra i confini delle placche.</li>
            <li><strong>Ruota</strong> fa girare lentamente il globo da solo.</li>
          </ul>
        </div>
        <Shot src="globe" alt="Globo 3D con segnaposto dei terremoti intorno al Pacifico" caption="Il globo" />
      </div>
      </>
    ),
  },
  {
    slug: 'felt', icon: 'vibration', title: 'L’ho sentito', sub: 'Segnalazioni e mappe del risentimento',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Se hai sentito un terremoto, dillo a sisma. Le segnalazioni aiutano a mostrare dove la scossa è stata avvertita e con quale forza.</p>
          <ol className={s.steps}>
            <li>Apri il terremoto. Fino a <strong>6 ore</strong> dopo l’evento vedrai <Ui>L’ho sentito</Ui>.</li>
            <li>Sposta il cursore in base a quanto è stato forte, da <em>Non avvertito</em> a <em>Estremo</em>. Il badge mostra il livello di intensità corrispondente (MMI).</li>
            <li>Se vuoi, aggiungi una nota, oppure tocca <Ui>Aggiungi dettagli</Ui> per indicare dove ti trovavi, quanto è durato, cosa si è mosso ed eventuali danni.</li>
            <li>Se compare <Ui>Mostra sulla mappa</Ui>, lascialo attivo per collocare la tua segnalazione sulla mappa, oppure disattivalo perché venga solo conteggiata. Usa la posizione del dispositivo o, se non l’hai condivisa, il luogo scelto in <Ui>Profilo</Ui>, e compare solo quando quel luogo è entro 3.000 km dal terremoto.</li>
            <li>Tocca <Ui>Invia segnalazione</Ui>.</li>
          </ol>
          <p>La tua segnalazione viene salvata <strong>senza il tuo nome né il tuo account</strong>. Sulla mappa, la sua posizione viene arrotondata a circa 10 km.</p>
          <p>Le segnalazioni compaiono nella vista della zona (<Ui>Mostra zona</Ui>) come piccoli quadrati di circa 10 km. Insieme alle segnalazioni di USGS ed EMSC descritte sotto, ogni quadrato ha il colore dell’intensità media delle segnalazioni che contiene.</p>
          <p>Per i terremoti registrati dall’USGS, la vista della zona mostra anche le risposte al sondaggio <strong>Did You Feel It?</strong> dell’USGS, come quadrati colorati di circa 10 km, un colore per ogni livello di intensità.</p>
          <p>Per i terremoti registrati dall’EMSC, include anche le segnalazioni inviate tramite i siti dell’EMSC e l’app LastQuake, negli stessi quadrati. I dati dell’EMSC sono condivisi con licenza CC BY 4.0.</p>
          <p>Per mostrare o nascondere tutte le mappe del risentimento insieme, tocca il pulsante <Ui>Livelli</Ui> accanto a <Ui>Torna alla mappa del mondo</Ui> e usa l’interruttore <Ui>Mappe del risentimento</Ui>. La tua scelta resta su questo dispositivo. In <Ui>Dettagli</Ui> del terremoto, la legenda del risentimento indica il numero totale di segnalazioni e l’intensità più alta, con la scala dei colori dell’intensità. I quadrati grigi sono aree della mappa automatica in cui nessuna segnalazione indica un’intensità.</p>
          <h3>Mappe del risentimento</h3>
          <p>Quando molte persone aprono sisma subito dopo un terremoto, quell’afflusso mostra dove probabilmente è stato avvertito. sisma lo trasforma in una <strong>mappa del risentimento</strong> anonima nella vista della zona. Le posizioni vengono sfocate sul tuo dispositivo fino a 500 m, non contengono alcun identificativo di account o dispositivo e vengono mostrate solo per aree di circa 10 km con almeno 3 persone. Puoi disattivare questa funzione in <Ui>Profilo</Ui> → <Ui>Aiuta a mappare dove si avvertono i terremoti</Ui>.</p>
        </div>
        <Shot src="felt" alt="Scheda Cosa hai sentito? con un cursore dell’intensità, una nota facoltativa, l’interruttore Mostra sulla mappa e Invia segnalazione" caption="Segnalare cosa hai sentito" />
      </div>
      </>
    ),
  },
  {
    slug: 'share', icon: 'ios_share', title: 'Condividere un terremoto', sub: 'Immagine, testo e testo alternativo',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Tocca <Ui>Condividi</Ui> su un terremoto per creare una scheda da condividere: un’immagine con la mappa e i dettagli principali.</p>
          <p>La mappa della scheda mostra anche i <strong>nomi delle città</strong> intorno al terremoto, nella tua lingua, come nella vista della zona, dove c’è spazio senza coprire i terremoti. In mare aperto potrebbero non essercene.</p>
          <p>Dove le persone hanno segnalato di averlo avvertito, la mappa della scheda lo mostra anche come nella vista della zona: piccoli quadrati nei colori dell’intensità (grigi se l’intensità è sconosciuta), con la scala dell’intensità in basso a destra. Anche la descrizione dell’immagine proposta lo menziona. Se hai disattivato <Ui>Mappe del risentimento</Ui> in <Ui>Livelli</Ui> nella vista della zona, anche la scheda non li mostra.</p>
          <p>Quando un centro di allerta tsunami ha emesso un messaggio ufficiale per il terremoto, la scheda ne mostra il livello e il centro in alto a sinistra sulla mappa, per esempio <strong>Allerta tsunami · PTWC</strong>, a colori finché è in vigore un’allerta, una minaccia, una sorveglianza o un avviso. Anche il testo del post e la descrizione dell’immagine lo riportano.</p>
          <ul>
            <li>Il <strong>testo del post</strong> viene compilato per te (magnitudo, luogo, ora, profondità e un hashtag, con il link alla fine), e puoi modificarlo.</li>
            <li>La <strong>descrizione dell’immagine (testo alternativo)</strong> descrive l’immagine per chi usa un lettore di schermo. Viene compilata per te, e puoi modificarla.</li>
            <li><Ui>Condividi immagine</Ui> apre il menu di condivisione del telefono (nell’app Android e nei browser che lo supportano). Se un browser non può condividere immagini, o se l’immagine non è stata creata, <Ui>Condividi link</Ui> condivide invece il testo del post con il suo link. <Ui>Salva immagine</Ui> scarica l’immagine, e <Ui>Copia testo</Ui> e <Ui>Copia testo alternativo</Ui> copiano l’uno o l’altro campo.</li>
          </ul>
          <Callout><p>X, Facebook e Bluesky spesso eliminano il testo che accompagna un’immagine condivisa, e nessuno di loro accetta il testo alternativo in questo modo. <strong>Condividi immagine copia anche il testo</strong>, così puoi incollarlo nel post. Usa <Ui>Copia testo alternativo</Ui> e incollalo nel campo per la descrizione dell’immagine dell’app. Su iPhone, se il menu di condivisione non si apre subito, tocca di nuovo <Ui>Condividi immagine</Ui>: il testo è già copiato.</p></Callout>
        </div>
        <Shot src="share" alt="Scheda di condivisione con l’anteprima dell’immagine, il testo del post modificabile e la descrizione dell’immagine" caption="La scheda di condivisione" />
      </div>
      </>
    ),
  },
  {
    slug: 'account', icon: 'person', title: 'Il tuo account', sub: 'Accesso, password, eliminazione',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Vai in <Ui>Profilo</Ui> e tocca <Ui>Accedi</Ui>. Puoi usare Google oppure la tua email e una password.</p>
          <h3>Crea un account con l’email</h3>
          <ol className={s.steps}>
            <li>Tocca <Ui>Crea un account</Ui> in fondo alla scheda di accesso.</li>
            <li>Inserisci la tua email e una password: almeno 8 caratteri, con lettere e numeri. Le password comparse in violazioni di dati note vengono rifiutate.</li>
            <li>Apri l’email di conferma che ti inviamo e tocca il link. A quel punto hai effettuato l’accesso. Non arriva entro un minuto? Controlla la cartella spam o posta indesiderata.</li>
          </ol>
          <h3>Accedi con Google</h3>
          <p>Tocca <Ui>Continua con Google</Ui>. Nell’app Android, scegli il tuo account Google dall’elenco che compare. Se alla tua email Google corrisponde già un account sisma, Google viene aggiunto a quello stesso account.</p>
          <p>Quando crei un account, anche <Ui>Continua con Google</Ui> è in alto: crea subito l’account, senza password né email di conferma.</p>
        </div>
        <Shot src="signin" alt="Scheda di accesso: Continua con Google, email e password, Password dimenticata? e Crea un account" caption="Accedere" />
      </div>

      <h3 id="password-reset">Hai dimenticato la password? Reimpostala</h3>
      <div className={s.pair}>
        <div>
          <ol className={s.steps}>
            <li>In <Ui>Profilo</Ui>, tocca <Ui>Accedi</Ui> e scrivi il tuo indirizzo email.</li>
            <li>Tocca <Ui>Password dimenticata?</Ui>. Vedrai <em>Controlla la tua email</em>.</li>
            <li>Apri l’email e tocca il link. sisma si apre e ti chiede di impostare una nuova password (<em>Imposta una nuova password</em>).</li>
            <li>Inserisci due volte la nuova password e tocca <Ui>Salva</Ui>. Hai effettuato l’accesso.</li>
          </ol>
          <Callout kind="note"><p>Per tutelare la tua privacy, sisma dice sempre di aver inviato il link, anche se nessun account usa quell’indirizzo. Se non arriva nulla entro qualche minuto, controlla la cartella spam e assicurati di aver scritto l’indirizzo con cui ti sei registrato.</p></Callout>
        </div>
        <Shot src="forgot" alt="Controlla la tua email: abbiamo inviato un link per reimpostare la password" caption="Dopo aver toccato Password dimenticata?" />
      </div>

      <h3>Cambia la password, o aggiungila a un account Google</h3>
      <div className={s.pair}>
        <div>
          <ol className={s.steps}>
            <li>In <Ui>Profilo</Ui> → <Ui>Account</Ui>, tocca <Ui>Imposta o cambia password</Ui>.</li>
            <li>Inserisci due volte la nuova password e tocca <Ui>Salva</Ui>.</li>
          </ol>
          <p>Se ti sei registrato con Google, questo aggiunge una password così puoi accedere anche con la tua email. Se sisma ti chiede prima di accedere di nuovo, si tratta di un controllo di sicurezza: esci, accedi di nuovo e riprova.</p>
        </div>
        <Shot src="password" alt="Scheda Imposta una nuova password con i campi nuova password e conferma" caption="Impostare una nuova password" />
      </div>

      <h3>Altre operazioni sull’account</h3>
      <div className={s.pair}>
        <div>
          <ul>
            <li><strong>Nome visualizzato</strong>: <Ui>Profilo</Ui> → <Ui>Nome visualizzato</Ui>. Lascialo vuoto per mostrare la tua email.</li>
            <li><strong>Esci</strong>: <Ui>Profilo</Ui> → <Ui>Esci</Ui>. I tuoi luoghi salvati restano nel tuo account.</li>
            <li><strong>Cambiare indirizzo email</strong>: non è ancora possibile nell’app. Scrivi a <a href={`mailto:${MAIL}`}>{MAIL}</a> dal tuo indirizzo attuale.</li>
          </ul>
        </div>
        <Shot src="me" alt="Sezione Account in Profilo: aiuto e supporto, nome visualizzato, email, password ed esci, con elimina account in una scheda a parte bordata di rosso" caption="Account, in fondo a Profilo" />
      </div>

      <h3 id="delete-account">Elimina il tuo account</h3>
      <div className={s.pair}>
        <div>
          <ol className={s.steps}>
            <li>Se hai sisma+, annullalo prima (vedi <Link href="/help/plus#cancel">Annullare sisma+</Link>). sisma non elimina un account con un abbonamento che si sta ancora rinnovando.</li>
            <li>In <Ui>Profilo</Ui>, tocca <Ui>Elimina account</Ui>, poi <Ui>Elimina definitivamente</Ui>.</li>
          </ol>
          <p>Questo rimuove definitivamente il tuo account, i luoghi salvati e le impostazioni degli avvisi. Le segnalazioni di risentimento che hai inviato vengono conservate senza il tuo nome. Eliminare l’account non elimina l’app Android; disinstallala a parte se vuoi. La nostra <Link href="/privacy#delete">informativa sulla privacy</Link> spiega cosa succede ai tuoi dati.</p>
        </div>
        <Shot src="delete" alt="Scheda Eliminare il tuo account? con Elimina definitivamente e Annulla" caption="Eliminare un account" />
      </div>
      </>
    ),
  },
  {
    slug: 'locations', icon: 'location_on', title: 'Luoghi salvati', sub: 'I posti che ti interessano',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>I luoghi salvati determinano quali terremoti sono i “più vicini” e quali posti tengono d’occhio i tuoi avvisi.</p>
          <ul>
            <li><strong>La mia posizione</strong> usa la posizione del tuo dispositivo (il browser o il telefono ti chiede prima il permesso).</li>
            <li><Ui>Aggiungi luogo</Ui> ti permette di cercare una città o un paese e salvarlo.</li>
            <li>Tocca un luogo per usarlo per le distanze. Tocca <Ui>×</Ui> per rimuoverlo.</li>
            <li>Quando è scelta <strong>La mia posizione</strong>, sisma usa la tua posizione ogni volta che il dispositivo può fornirla. Se non può (localizzazione disattivata o non consentita), o se hai scelto un luogo salvato, sisma usa quel luogo salvato: il tuo luogo predefinito, oppure il primo che hai salvato.</li>
            <li>Quando hai effettuato l’accesso, <strong>La mia posizione</strong> si usa anche per i tuoi avvisi e le allerte tsunami: sisma conserva l’ultima posizione del tuo dispositivo, arrotondata a circa 1 km, e la usa per 30 giorni dall’ultimo aggiornamento.</li>
          </ul>
          <p>Il piano gratuito include <strong>1 luogo salvato</strong>, e sisma+ <strong>fino a 10</strong>. Senza un account, i luoghi vengono conservati su questo dispositivo e passano nel tuo account quando accedi.</p>
        </div>
        <Shot src="addloc" alt="Scheda Aggiungi luogo con una casella di ricerca per una città o un paese" caption="Aggiungere un luogo" />
      </div>
      </>
    ),
  },
  {
    slug: 'plus', icon: 'workspace_premium', title: 'sisma+', sub: 'Prova, fatturazione, annullamento',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>sisma è gratuito. sisma+ aggiunge:</p>
          <div className={legal.tableWrap}>
            <table style={{ minWidth: 0 }}>
              <thead><tr><th>Funzione</th><th>Gratis</th><th>sisma+</th></tr></thead>
              <tbody>
                <tr><td>Elenco in diretta, mappa, globo, scienza</td><td>✓</td><td>✓</td></tr>
                <tr><td>Allerte ufficiali di tsunami</td><td>✓</td><td>✓</td></tr>
                <tr><td>Storico dei terremoti</td><td>30 giorni</td><td>Storico completo</td></tr>
                <tr><td>Luoghi salvati</td><td>1</td><td>Fino a 10</td></tr>
                <tr><td>Notifiche push con le tue regole</td><td>–</td><td>Fino a 5 avvisi</td></tr>
                <tr><td>Filtri per magnitudo e regione</td><td>–</td><td>✓</td></tr>
                <tr><td>Grafici dei dati sismici in tempo reale</td><td>–</td><td>✓</td></tr>
                <tr><td>Nastro di fuoco del Pacifico</td><td>–</td><td>✓</td></tr>
              </tbody>
            </table>
          </div>
          <p>Prezzo: <strong>{usd(PRICES.yearly.usd)} all’anno</strong>, un solo piano. Google Play mostra il prezzo nella tua valuta locale. I nuovi abbonati hanno una <strong>prova gratuita di {TRIAL_DAYS} giorni</strong>, una sola volta per account.</p>
        </div>
        <Shot src="paywall" alt={`Scheda sisma+ con le funzioni, il prezzo annuale e Inizia la prova gratuita di ${TRIAL_DAYS} giorni`} caption="Scegliere un piano" />
      </div>

      <h3>Abbonarsi</h3>
      <ul>
        <li><strong>Sul sito</strong>: <Ui>Profilo</Ui> → <Ui>Inizia la prova gratuita di {TRIAL_DAYS} giorni</Ui> (o <Ui>Abbonati</Ui>), poi paga sulla pagina di pagamento sicura di Stripe. Se prima crei un account, il pagamento si apre quando tocchi il link nell’email di conferma. Quando torni, sisma mostra <em>Attivazione di sisma+…</em> per qualche secondo, poi <em>Benvenuto in sisma+</em>.</li>
        <li><strong>Nell’app Android</strong>: lo stesso pulsante apre la schermata di pagamento di Google Play, dove puoi pagare con Google Pay, una carta o altri metodi di pagamento di Google Play.</li>
      </ul>
      <p>Devi aver effettuato l’accesso. Il tuo abbonamento funziona poi ovunque accedi con quell’account, sul web e nell’app.</p>

      <h3>Gestire o cambiare piano</h3>
      <div className={s.pair}>
        <div>
          <p>Vai in <Ui>Profilo</Ui> → <Ui>Gestisci abbonamento</Ui> per vedere stato, piano e prossima data.</p>
          <ul>
            <li><strong>Acquistato sul sito</strong>: <Ui>Gestisci fatturazione</Ui> apre la pagina di Stripe, dove puoi aggiornare la carta, vedere le fatture o annullare.</li>
            <li><strong>Acquistato nell’app Android</strong>: <Ui>Gestisci in Google Play</Ui> apre il tuo abbonamento in Google Play.</li>
          </ul>
          <p>Se sisma ha regalato sisma+ al tuo account, il tuo piano mostra <Ui>Omaggio</Ui>. Non ti serve un abbonamento e puoi annullare quello che hai iniziato senza perdere sisma+.</p>
        </div>
        <Shot src="subscription" alt="Pagina dell’abbonamento: stato, piano, data di rinnovo e Gestisci in Google Play" caption="Il tuo abbonamento" />
      </div>

      <h3 id="cancel">Annullare sisma+</h3>
      <ol className={s.steps}>
        <li>Apri <Ui>Profilo</Ui> → <Ui>Gestisci abbonamento</Ui>.</li>
        <li>Tocca <Ui>Gestisci fatturazione</Ui> (sito) o <Ui>Gestisci in Google Play</Ui> (app), e annulla lì. In Google Play puoi anche andare su <em>Pagamenti e abbonamenti → Abbonamenti</em>.</li>
      </ol>
      <p>Mantieni sisma+ fino alla fine del periodo che hai pagato. La scheda in <Ui>Profilo</Ui> mostra quindi <em>Termina il</em> e la data, e dopo quella data torni al piano gratuito. Se annulli una prova gratuita prima che finisca, non ti viene addebitato nulla.</p>
      <Callout kind="note"><p>Disinstallare l’app o eliminare il tuo account sisma <strong>non</strong> annulla un abbonamento Google Play. Annullalo in Google Play.</p></Callout>

      <h3>Ripristinare un acquisto</h3>
      <p>Su un nuovo telefono o dopo aver reinstallato l’app, accedi allo stesso account sisma. Se sisma+ non compare, apri la scheda sisma+ e tocca <Ui>Ripristina acquisto</Ui>. È disponibile solo nell’app Android e trova l’abbonamento Google Play su questo dispositivo.</p>

      <h3>Rimborsi</h3>
      <p>Gli acquisti su Google Play seguono le norme di rimborso di Google Play, quindi chiedi il rimborso tramite Google Play. Per gli acquisti sul sito, scrivi a <a href={`mailto:${MAIL}`}>{MAIL}</a>. I nostri <Link href="/terms">termini di servizio</Link> spiegano i dettagli.</p>
      </>
    ),
  },
  {
    slug: 'alerts', icon: 'notifications_active', title: 'Avvisi', sub: 'Notifiche push su misura per te',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Con sisma+, sisma invia una notifica push quando un terremoto corrisponde a uno dei tuoi avvisi.</p>
          <ol className={s.steps}>
            <li>Accedi e assicurati di avere sisma+.</li>
            <li>In <Ui>Profilo</Ui>, attiva <Ui>Notifiche push</Ui>, oppure apri <Ui>Regole di avviso</Ui> e attiva gli <em>avvisi di terremoto</em>.</li>
            <li>In <em>Invia tramite</em>, tocca <Ui>Attiva le notifiche su questo dispositivo</Ui> e consenti le notifiche quando richiesto.</li>
            <li>Tocca <Ui>Aggiungi un avviso</Ui> e configuralo (vedi sotto). Puoi averne fino a 5.</li>
            <li>Tocca <Ui>Invia un avviso di prova</Ui> per verificare che questo dispositivo li riceva.</li>
          </ol>
        </div>
        <Shot src="alerts" alt="Pagina degli avvisi con l’interruttore, i tuoi avvisi (0 di 5), Aggiungi un avviso e Invia tramite" caption="La pagina degli avvisi" />
      </div>
      <h3>Configurare un avviso</h3>
      <ul>
        <li><strong>Nome</strong>: per esempio <em>Vicino a casa</em>.</li>
        <li><strong>Magnitudo minima</strong>: ricevi avvisi per questa magnitudo e per quelle più forti.</li>
        <li><strong>Monitoraggio</strong>: i tuoi luoghi salvati entro una distanza a tua scelta (100, 250, 500 o 1.000 km), oppure ovunque nel mondo.</li>
        <li><strong>Altri luoghi</strong>: fino a 20 paesi o regioni, in qualsiasi punto al loro interno.</li>
        <li><strong>Ore di silenzio</strong>: nessun avviso durante la notte, con la possibilità di lasciar passare comunque i terremoti forti (magnitudo 6 o superiore).</li>
        <li>Un grafico mostra quanti terremoti degli ultimi 30 giorni avrebbero attivato l’avviso, così puoi regolarlo.</li>
      </ul>
      <p><strong>Monitoraggio</strong> include anche <strong>La mia posizione</strong> quando il dispositivo condivide la sua posizione: vedi <Link href="/help/locations">Luoghi salvati</Link>.</p>
      <p>Gli avvisi ricevuti negli ultimi 30 giorni sono elencati in <em>Cronologia avvisi</em>.</p>
      <h3>Allerte tsunami</h3>
      <p>Le allerte tsunami sono gratuite per chi ha effettuato l’accesso. In <Ui>Profilo</Ui>, attiva <Ui>Allerte tsunami</Ui> e tocca <Ui>Attiva le notifiche su questo dispositivo</Ui>. Ricevi una notifica quando viene emessa un’allerta, una minaccia, una sorveglianza o un avviso ufficiale di tsunami per un terremoto entro 1.000 km da uno dei tuoi luoghi salvati. Le ore di silenzio non si applicano e ogni livello viene inviato una sola volta per terremoto. Conta anche La mia posizione, come per gli altri avvisi.</p>
      <Callout kind="note"><p><strong>iPhone e iPad:</strong> le notifiche web funzionano solo dopo aver aggiunto sisma alla schermata Home (Condividi → Aggiungi alla schermata Home) e averlo aperto da lì. La prima volta che apri sisma nel browser di un iPhone o iPad, una finestra mostra questi passaggi; tocca <Ui>Non ora</Ui> per rivederla tra due settimane o <Ui>Ho capito</Ui> per nasconderla.</p></Callout>
      </>
    ),
  },
  {
    slug: 'settings', icon: 'tune', title: 'Impostazioni', sub: 'Lingua, tema, unità',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Le trovi in <Ui>Profilo</Ui>, sotto i tuoi luoghi:</p>
          <ul>
            <li><strong>Lingua</strong>: English, Español, 日本語, Bahasa Indonesia, Türkçe, Italiano, Português, 中文, Français o Deutsch. Puoi anche toccare il pulsante della lingua in alto in qualsiasi scheda.</li>
            <li><strong>Aspetto</strong>: segui il dispositivo (Sistema), Chiaro o Scuro.</li>
            <li><strong>Unità</strong>: chilometri o miglia.</li>
            <li><strong>Indicatori della mappa</strong>: segnaposto con la magnitudo scritta all’interno, oppure cerchi dimensionati in base alla magnitudo. Qui trovi anche la legenda dei colori.</li>
            <li><strong>Aiuta a mappare dove si avvertono i terremoti</strong>: attiva o disattiva la condivisione anonima per la mappa del risentimento (vedi <Link href="/help/felt">L’ho sentito</Link>).</li>
            <li><strong>Mostra l’introduzione</strong> ripropone i passaggi di benvenuto.</li>
          </ul>
          <p>Quando hai effettuato l’accesso, la lingua e l’aspetto vengono salvati nel tuo account.</p>
        </div>
        <Shot src="me_more" alt="Impostazioni: lingua, aspetto, unità, indicatori della mappa, interruttore della mappa del risentimento, introduzione e fonti dei dati" caption="Impostazioni in Profilo" />
      </div>
      </>
    ),
  },
  {
    slug: 'science', icon: 'science', title: 'Scienza', sub: 'Come funzionano i terremoti',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>La scheda <Ui>Scienza</Ui> contiene otto brevi guide illustrate, ognuna con un diagramma animato o un grafico in diretta: tettonica delle placche, tipi di faglia, onde sismiche, magnitudo e intensità, profondità e repliche, tsunami, come prepararsi e la Cintura di fuoco, con una mappa in diretta di quanti terremoti recenti hanno colpito intorno al Pacifico.</p>
          <p>Tocca i pulsanti sotto un diagramma per cambiare vista, e il pulsante di pausa per fermare l’animazione. Le guide seguono la tua lingua, come il resto dell’app. Tocca <Ui>Condividi</Ui> in cima a una guida per inviarla a qualcuno, con la sua immagine, un breve riassunto e il link.</p>
          <p>Sotto le guide, <Ui>Approfondimenti</Ui> contiene articoli più lunghi per quando vuoi andare oltre: perché i terremoti non si possono prevedere, tettonica delle placche e faglie, l’interno della Terra e le onde sismiche, le repliche, la magnitudo, i terremoti profondi, i vulcani, i terremoti in Italia e lo tsunami del 2004 che ha raggiunto Phuket. Ognuno si apre con un’immagine del suo soggetto sotto il titolo, elenca le sue fonti e risponde alle domande più comuni alla fine. Anche questi sono nella tua lingua; l’elenco delle fonti resta in inglese.</p>
          <p>In <Ui>Dati</Ui>, <Ui>Dati sismici</Ui> (sisma+) mostra in grafici i terremoti di M4.5+ degli ultimi 30 giorni in tutto il mondo, secondo l’USGS: quanti sono stati, magnitudo e profondità, le regioni colpite, l’energia rilasciata e il numero di terremoti di M7+ all’anno dal 1900. Ogni grafico ha una breve spiegazione; tocca una barra per leggerne il valore. Senza sisma+ vedi le spiegazioni e un pulsante per iniziare la prova gratuita. I colori hanno un significato: le magnitudo usano i colori dei segnaposto della mappa, le profondità quelli della modalità Profondità del globo, le regioni per lo più sull’Anello di Fuoco sono evidenziate e le barre sopra la media sono color corallo.</p>
          <p><Ui>Nastro di fuoco del Pacifico</Ui> (sisma+) srotola la Cintura di fuoco in un’unica lunga striscia, dalla punta meridionale delle Ande alla Nuova Zelanda, e mostra i terremoti USGS delle ultime 24 ore, 7 giorni o 30 giorni in base alla distanza lungo gli archi vulcanici (in orizzontale) e alla profondità (in verticale). Scorri lateralmente o ingrandisci per percorrerlo, scegli una regione per andarci e tocca un punto per i dettagli del terremoto. Il colore dei punti indica la profondità, la dimensione la magnitudo. I nuovi terremoti vengono cercati una volta all’ora ed è indicato quando i dati sono stati pubblicati. I triangoli sopra la linea sono vulcani del catalogo Smithsonian, colorati secondo il rapporto settimanale sull’attività vulcanica Smithsonian / USGS (rosso: eruzione in corso, arancione: nuova attività eruttiva, ambra: nuova irrequietezza); toccane uno per i dettagli e il rapporto. Un triangolo bianco indica solo che il vulcano non compare nel rapporto della settimana, che non elenca tutti i vulcani attivi. <Ui>Mostra</Ui> attiva o disattiva terremoti, vulcani o rilievo. Il rilievo proviene dal modello ETOPO 2022 della NOAA: il marrone è il terreno più alto vicino al percorso e il blu il fondale più profondo entro 400 km, dove si vedono le fosse oceaniche. <Ui>Esagerato ×10</Ui> allunga le quote per rendere visibili montagne e fosse; <Ui>Scala reale</Ui> usa la stessa scala delle profondità dei terremoti. Le profondità dei terremoti non vengono mai esagerate. <Ui>3D</Ui> mostra un tratto del nastro come un blocco da ruotare: il rilievo sopra, i terremoti alla loro profondità sotto, tutto alla stessa scala. Scegli <Ui>Obliqua</Ui>, <Ui>Sezione</Ui> (guardando lungo il percorso) o <Ui>Dall’alto</Ui>, usa le frecce per spostarti lungo il percorso e tocca un punto o un triangolo per i dettagli. In 3D il rilievo è mediato su quadrati di 10 km, quindi appare più smussato che nel profilo. Una bussola indica il nord al centro del tratto. <Ui>1 ora</Ui> mostra l’ultima ora. <Ui>Storico</Ui> riproduce gli ultimi 90 giorni, l’ultimo anno o le date che scegli dal catalogo USGS: premi Riproduci per vedere i terremoti comparire all’ora registrata, trascina la cronologia, cambia velocità e scia e filtra per profondità o regione. Lo storico ha una cornice ambra perché non venga mai confuso con i dati in diretta; gli intervalli più lunghi richiedono un filtro di magnitudo più alto. Sotto il nastro, una mappa del Pacifico mostra il percorso, il tratto che stai guardando (in ambra) e gli stessi terremoti e vulcani; toccane uno sulla mappa per selezionarlo anche sul nastro. La ricerca trova i vulcani per nome e i terremoti per luogo o magnitudo, e il pulsante a schermo intero dà a nastro e mappa tutto lo schermo. <Ui>Condividi</Ui> crea un’immagine dell’intero nastro per il periodo scelto, con un testo da pubblicare e una descrizione dell’immagine che puoi modificare prima di condividere.</p>
        </div>
        <Shot src="science" alt="Articolo sulle onde sismiche con un diagramma animato delle onde P" caption="Una guida scientifica" />
      </div>
      </>
    ),
  },
  {
    slug: 'troubleshooting', icon: 'build', title: 'Risoluzione dei problemi', sub: 'Soluzioni ai problemi comuni',
    body: (
      <>
      <div className={s.faq}>
        <p className={s.faqGroup}>Posizione e dati</p>
        <Faq q="“Vicini” è vuoto, oppure la mia posizione non viene trovata">
          <p>sisma ha bisogno del permesso di usare la tua posizione, oppure di un luogo salvato.</p>
          <ul>
            <li><strong>Browser</strong>: tocca l’icona accanto all’indirizzo web, imposta <em>Posizione</em> su <em>Consenti</em>, poi ricarica la pagina.</li>
            <li><strong>App Android</strong>: Impostazioni → App → sisma → Autorizzazioni → Posizione → <em>Consenti solo mentre l’app è in uso</em>.</li>
            <li>Oppure aggiungi un luogo in <Ui>Profilo</Ui> → <Ui>Aggiungi luogo</Ui>.</li>
          </ul>
        </Faq>
        <Faq q="Manca un terremoto, oppure la sua magnitudo è cambiata">
          <p>Le agenzie pubblicano prima dei valori automatici e poi li rivedono, di solito entro la prima ora. Magnitudo, profondità e luogo possono cambiare, e alcuni piccoli eventi vengono eliminati. Agenzie diverse possono anche riportare valori leggermente diversi; sisma mostra i dati dell’agenzia regionale quando li ha (JMA in Giappone, GeoNet in Nuova Zelanda), altrimenti USGS, poi EMSC. I terremoti molto piccoli (sotto circa magnitudo 2,5 fuori da Giappone e Nuova Zelanda) non sono inclusi.</p>
        </Faq>
        <Faq q="Gli orari sembrano sbagliati">
          <p>Gli orari sono mostrati nel fuso orario del tuo dispositivo. Controlla le impostazioni di data, ora e fuso orario del dispositivo.</p>
        </Faq>
        <Faq q="La mappa è vuota quando faccio molto zoom">
          <p>Le mappe stradali provengono da OpenStreetMap e richiedono una connessione a internet. Se non si caricano, riduci un po’ lo zoom; i segnaposto dei terremoti funzionano comunque.</p>
        </Faq>
        <Faq q="L’app dice che sono offline">
          <p>sisma ha bisogno di una connessione per caricare i terremoti. Controlla il Wi-Fi o i dati mobili, poi riapri l’app.</p>
        </Faq>

        <p className={s.faqGroup}>Accesso</p>
        <Faq q="“Email o password non corretta”">
          <p>Controlla di non aver fatto errori di battitura, poi usa <Link href="/help/account#password-reset">Password dimenticata?</Link>. Se hai creato l’account con Google, usa <Ui>Continua con Google</Ui>, oppure aggiungi una password in <Ui>Profilo</Ui> → <Ui>Imposta o cambia password</Ui> mentre hai effettuato l’accesso con Google.</p>
        </Faq>
        <Faq q="“Conferma prima la tua email”">
          <p>Apri l’email di conferma di sisma e tocca il link, poi accedi. Non la trovi? Controlla la cartella spam. Se ancora non c’è, scrivi a <a href={`mailto:${MAIL}`}>{MAIL}</a> da quell’indirizzo.</p>
        </Faq>
        <Faq q="L’email di reimpostazione o di conferma non è arrivata">
          <p>Attendi qualche minuto e controlla la cartella spam o promozioni. Assicurati di aver scritto l’indirizzo con cui ti sei registrato. Per tutelare la tua privacy, sisma dice di aver inviato un link di reimpostazione anche quando nessun account usa quell’indirizzo.</p>
        </Faq>
        <Faq q="L’accesso con Google non funziona">
          <p>Nell’app Android, assicurati di aver effettuato l’accesso a un account Google sul telefono (Impostazioni → Password e account) e che Google Play Services sia aggiornato. Sul web, consenti i pop-up e l’accesso di terze parti per sisma.io. Puoi sempre accedere con l’email.</p>
        </Faq>
        <Faq q="“Per sicurezza, esci e accedi di nuovo”">
          <p>Per cambiare la password serve un accesso recente. Tocca <Ui>Esci</Ui>, accedi di nuovo, poi cambiala.</p>
        </Faq>

        <p className={s.faqGroup}>sisma+ e fatturazione</p>
        <Faq q="Ho pagato, ma vedo ancora il piano gratuito">
          <ul>
            <li>Attendi un minuto, poi chiudi e riapri sisma. L’attivazione di solito è immediata, ma può richiedere qualche minuto.</li>
            <li>Assicurati di aver effettuato l’accesso con l’account con cui ti sei abbonato.</li>
            <li>App Android: apri la scheda sisma+ e tocca <Ui>Ripristina acquisto</Ui>.</li>
            <li>Ancora non funziona? Scrivi a <a href={`mailto:${MAIL}`}>{MAIL}</a> indicando l’email del tuo account e, per Google Play, il numero d’ordine (GPA.…) della ricevuta.</li>
          </ul>
        </Faq>
        <Faq q="“Questo abbonamento Google Play appartiene a un altro account sisma”">
          <p>L’abbonamento su questo telefono è stato acquistato mentre era attivo l’accesso a un altro account sisma. Esci e accedi a quell’account.</p>
        </Faq>
        <Faq q="Non mi è stata offerta la prova gratuita">
          <p>La prova è per gli account che non si sono mai abbonati. Nell’app Android, Google Play consente inoltre una sola prova per account Google, anche tra account sisma diversi.</p>
        </Faq>
        <Faq q="“Gli abbonamenti nell’app non sono ancora disponibili” o “La fatturazione di Google Play non è disponibile su questo dispositivo”">
          <p>Aggiorna sisma e l’app Google Play Store, e assicurati di aver effettuato l’accesso a Google Play. Alcuni dispositivi senza Google Play non possono effettuare acquisti nell’app. Abbonati invece su <a href="https://sisma.io/app/me">sisma.io</a> e accedi allo stesso account nell’app.</p>
        </Faq>
        <Faq q="Non riesco a eliminare il mio account">
          <p>Annulla prima sisma+. Una volta impostata la sua scadenza, puoi eliminare l’account. Vedi <Link href="/help/account#delete-account">Elimina il tuo account</Link>.</p>
        </Faq>

        <p className={s.faqGroup}>Avvisi e notifiche</p>
        <Faq q="Non ricevo gli avvisi">
          <ol>
            <li>Verifica di avere sisma+ e di aver effettuato l’accesso.</li>
            <li>In <Ui>Profilo</Ui> → <Ui>Regole di avviso</Ui>, verifica che gli avvisi siano attivi e che almeno un avviso sia attivo e abbia luoghi o aree.</li>
            <li>In <em>Invia tramite</em>, verifica che questo dispositivo sia attivo, poi tocca <Ui>Invia un avviso di prova</Ui>.</li>
            <li>Android: in Impostazioni → App → sisma → Notifiche le notifiche devono essere consentite. Le impostazioni di risparmio energetico possono ritardare le notifiche; imposta l’utilizzo della batteria di sisma su <em>Senza restrizioni</em>.</li>
            <li>Browser: le notifiche devono essere consentite per sisma.io. Su iPhone e iPad, apri sisma dalla schermata Home.</li>
            <li>Le ore di silenzio trattengono gli avvisi di notte, a meno che tu non lasci passare i terremoti forti.</li>
          </ol>
        </Faq>
        <Faq q="Ricevo troppi avvisi">
          <p>Alza la magnitudo minima, riduci la distanza, rimuovi le regioni troppo ampie o imposta le ore di silenzio. Il grafico dei 30 giorni in ogni avviso mostra quanto spesso sarebbe scattato.</p>
        </Faq>

        <p className={s.faqGroup}>Condivisione e segnalazioni</p>
        <Faq q="Non c’è il pulsante “Condividi immagine”">
          <p>Il tuo browser non può condividere file. Usa <Ui>Salva immagine</Ui> e <Ui>Copia testo</Ui>, poi pubblicali tu. Nell’app Android, aggiorna sisma per avere il menu di condivisione del sistema.</p>
        </Faq>
        <Faq q="Il testo non è comparso nel mio post">
          <p>Molte app eliminano il testo condiviso insieme a un’immagine. sisma lo ha copiato quando hai toccato <Ui>Condividi immagine</Ui>, quindi incollalo nel post.</p>
        </Faq>
        <Faq q="Non c’è il pulsante “L’ho sentito”">
          <p>Le segnalazioni sono aperte per 6 ore dopo un terremoto. Dopo, il pulsante scompare.</p>
        </Faq>
      </div>
      </>
    ),
  },
  {
    slug: 'contact', icon: 'support_agent', title: 'Contatta l’assistenza', sub: 'Ancora bloccato? Scrivici',
    body: (
      <>
      <div className={s.contact}>
        <span className="ms" aria-hidden="true">mail</span>
        <div style={{ flex: '1 1 260px' }}>
          <p style={{ margin: 0 }}><strong>Hai ancora bisogno di aiuto?</strong> Scrivici indicando l’email del tuo account, il tuo dispositivo e la versione del browser o dell’app, e cosa hai già provato. Uno screenshot aiuta.</p>
        </div>
        <a className={s.mail} href={`mailto:${MAIL}?subject=${encodeURIComponent('sisma help')}`}>{MAIL}</a>
      </div>
      <p>Non inviarci password o numeri di carta completi. Non te li chiederemo mai.</p>
      </>
    ),
  },
];
