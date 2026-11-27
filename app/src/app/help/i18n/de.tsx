// Help centre, German translation of ../topics.tsx (same structure: see help-i18n.test.ts).
import Link from 'next/link';
import { PRICES, TRIAL_DAYS } from '@/lib/entitlements';
import legal from '../../privacy/privacy.module.css';
import s from '../help.module.css';
import { Callout, Faq, MAIL, MagLegend, Shot, Ui, usd } from '../help-parts';
import type { Hub, Topic } from '../topics';

export const HUB: Hub = {
  lead: 'Alles, was du brauchst, um sisma auf der Website und in der Android-App zu nutzen – mit Lösungen für die häufigsten Probleme.',
  popularH: 'Beliebt', allH: 'Alle Themen', contactQ: 'Keine Antwort gefunden?', contactP: 'Schreib uns, wir helfen dir.',
  popular: [
    ['/help/account#password-reset', 'lock_reset', 'Vergessenes Passwort zurücksetzen'],
    ['/help/felt', 'vibration', 'Melden, dass du ein Erdbeben gespürt hast'],
    ['/help/troubleshooting', 'notifications_off', 'Keine Warnungen erhalten'],
    ['/help/troubleshooting', 'credit_card', 'Bezahlt, aber noch im kostenlosen Tarif'],
    ['/help/map#region-view', 'zoom_in_map', 'Die Umgebung eines Erdbebens ansehen'],
    ['/help/share', 'ios_share', 'Ein Erdbeben mit Text teilen'],
  ],
};

export const TOPICS: Topic[] = [
  {
    slug: 'start', icon: 'rocket_launch', title: 'Erste Schritte', sub: 'Was sisma ist und wie es funktioniert',
    body: (
      <>
      <p>
        sisma zeigt Erdbeben weltweit so, wie sie von vier seismologischen Diensten gemeldet werden: <strong>USGS</strong> (Vereinigte
        Staaten), <strong>EMSC</strong> (Europa und Mittelmeerraum), <strong>GeoNet</strong> (Neuseeland) und <strong>JMA</strong> (Japan).
        Melden mehrere Dienste dasselbe Erdbeben, zeigt sisma es nur einmal. Die Liste aktualisiert sich alle zwei Minuten
        von selbst, und du kannst sie herunterziehen, um sie sofort zu aktualisieren.
      </p>
      <p>Du kannst sisma auf zwei Arten nutzen, mit demselben Konto und demselben sisma+-Abo:</p>
      <ul>
        <li><strong>Im Web</strong> unter <a href="https://sisma.io/app">sisma.io/app</a>, auf jedem Smartphone, Tablet oder Computer.</li>
        <li><strong>In der Android-App</strong> aus Google Play, mit dem Teilen-Menü des Systems, der Google-Kontoauswahl und der Abrechnung über Google Play.</li>
      </ul>
      <p>Die App hat unten fünf Tabs (am Computer im Menü links): <Ui>Liste</Ui>, <Ui>Karte</Ui>, <Ui>Globus</Ui>, <Ui>Wissen</Ui> und <Ui>Profil</Ui>.</p>
      <p>Um Erdbeben anzusehen, brauchst du kein Konto. Ein Konto speichert deine Orte und Einstellungen und ist für sisma+ und Warnungen nötig.</p>
      <Callout kind="warn"><p><strong>sisma ist kein offizieller Warndienst.</strong> Erdbebeninformationen können verzögert, korrigiert oder unvollständig sein, und sisma gibt keine Erdbebenfrühwarnungen. Folge im Notfall immer den Anweisungen deiner örtlichen Behörden.</p></Callout>
      </>
    ),
  },
  {
    slug: 'feed', icon: 'format_list_bulleted', title: 'Die Liste', sub: 'Neueste, nächste und stärkste',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Der Tab <Ui>Liste</Ui> zeigt aktuelle Erdbeben. Mit dem Schalter oben sortierst du sie:</p>
          <ul>
            <li><strong>Neueste</strong>: die jüngsten zuerst.</li>
            <li><strong>Nächste</strong>: die zu deinem Standort oder deinem gewählten gespeicherten Ort nächstgelegenen zuerst.</li>
            <li><strong>Stärkste</strong>: die mit der höchsten Magnitude zuerst.</li>
          </ul>
          <p>Jede Zeile zeigt die Magnitude in einem farbigen Kennzeichen, den Ort mit der Flagge des Landes, in dem oder nahe dem er liegt, Entfernung und Richtung von einem nahen Ort, wie lange es her ist, wie weit es von dir entfernt ist und wie tief es war. Scrolle weiter: Am Ende der Liste kommen weitere Erdbeben dazu.</p>
          <p>Auf einem Computer steht die Liste auf der Seite <Ui>Übersicht</Ui>, dem ersten Eintrag im Menü links, mit einer Karte daneben. Wählst du ein Erdbeben in der Liste oder auf der Karte, zoomt die Karte dorthin, mit den Namen naher Städte. Sie bleibt dort, wenn du das Erdbeben schließt; <Ui>Ansicht zurücksetzen</Ui> zeigt wieder die ganze Welt. Wählen Sie oben rechts unter <Ui>Ort</Ui> ein Land oder eine Region oder tippen Sie auf einen Eintrag unter <Ui>Häufigste Regionen</Ui>, und die Karte zoomt auf dessen Erdbeben; <Ui>Alle Orte</Ui> zeigt wieder die ganze Welt.</p>
          <h3>Magnitudenfarben</h3>
          <p>Dieselben Farben gelten in der Liste, auf der Karte und auf dem Globus:</p>
          <MagLegend words={{ label: 'Magnitudenfarben', magnitude: 'Magnitude {range}', orMore: '{n} oder mehr', below: 'unter {n}', to: '{a} bis {b}' }} />
          <Callout><p>Öffne <Ui>Filter</Ui> unten in der Liste, um den Zeitraum zu wählen und die Liste einzugrenzen. Siehe <Link href="/help/map">Karte und Filter</Link>.</p></Callout>
        </div>
        <Shot src="feed" alt="Die Liste nach Neueste sortiert, mit Magnitudenkennzeichen, Orten, Zeiten, Entfernungen und Tiefen" caption="Die Liste, neueste zuerst" />
      </div>
      </>
    ),
  },
  {
    slug: 'details', icon: 'info', title: 'Erdbebendetails', sub: 'Jede Zahl erklärt',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Tippe auf ein Erdbeben, um seine Details zu öffnen:</p>
          <ul>
            <li><strong>Magnitude</strong> und ihr Typ (zum Beispiel <em>mww</em>, die Momenten-Magnitude für größere Beben).</li>
            <li><strong>Tiefe</strong>: wie weit unter der Oberfläche es begann. Flache Erdbeben werden meist stärker gespürt.</li>
            <li><strong>Datum und Uhrzeit</strong> in der Zeitzone deines Geräts.</li>
            <li><strong>Entfernung</strong> von dir und das <strong>Land</strong> (oder „nahe“ einem Land bei Ereignissen vor der Küste).</li>
            <li><strong>Koordinaten</strong> des Epizentrums.</li>
            <li><strong>Prüfstatus</strong>: <em>Automatisch</em> bedeutet, die Werte kommen direkt von den Messgeräten und ändern sich oft in der ersten Stunde; <em>Geprüft</em> bedeutet, ein Seismologe hat sie kontrolliert.</li>
            <li><strong>Quelle</strong>: von welchem Dienst die angezeigten Werte stammen.</li>
          </ul>
          <p>Unter den Details:</p>
          <ul>
            <li><Ui>Region zeigen</Ui> öffnet eine Nahansicht der Karte rund um das Erdbeben mit Beben in der Nähe und, falls vorhanden, der Spürkarte.</li>
            <li><Ui>Teilen</Ui> öffnet die Teilen-Karte (siehe <Link href="/help/share">Teilen</Link>).</li>
            <li>Wenn Menschen gemeldet haben, dass sie es gespürt haben, siehst du, wie viele.</li>
          </ul>
          <Callout kind="note"><p><strong>Tsunami:</strong> Wenn ein Tsunami-Warnzentrum (PTWC, NTWC oder der japanische Wetterdienst JMA) eine offizielle Meldung zu einem Erdbeben herausgibt, wird ihre Stufe wie herausgegeben angezeigt, zum Beispiel <strong>Tsunamiwarnung</strong> oder <strong>Tsunamihinweis</strong>, mit dem Zentrum, der Uhrzeit, den genannten Küsten und <Ui>Offizielle Meldung lesen</Ui>. Warnungen, Gefahrenmeldungen, Vorwarnungen und Hinweise sind farbig und versehen die Markierung des Erdbebens mit einem Wellen-Symbol und seine Zeile mit einem farbigen Wellen-Icon; Informationsmeldungen und Vorhersagen bleiben grau. Eine Meldung mit <em>Aufgehoben</em> oder <em>Nicht mehr gültig</em> wurde zurückgezogen oder ist abgelaufen. Ohne offizielle Meldung zeigt ein starkes Erdbeben unter dem Meer <em>Starkes Erdbeben unter dem Meer: offizielle Tsunami-Informationen prüfen</em>. sisma gibt diese Meldungen weiter und ist kein Warndienst: Folge immer den örtlichen Behörden.</p></Callout>
        </div>
        <Shot src="detail" alt="Erdbebendetails: Magnitude, Tiefe, Datum, Uhrzeit, Entfernung, Land, Koordinaten, Prüfstatus, Quelle, Region zeigen und Teilen" caption="Die Details eines Erdbebens" />
      </div>
      </>
    ),
  },
  {
    slug: 'map', icon: 'map', title: 'Karte und Filter', sub: 'Zoom, Regionsansicht, Filter',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Der Tab <Ui>Karte</Ui> zeigt aktuelle Erdbeben als nach Magnitude gefärbte Markierungen, zentriert auf deinen Teil der Welt.</p>
          <ul>
            <li><strong>Verschieben und zoomen</strong> mit den Fingern oder der Maus oder mit den Tasten <Ui>+</Ui> und <Ui>−</Ui>. Die dritte Taste setzt die Ansicht zurück.</li>
            <li><strong>Mein Standort</strong> (die vierte Taste) zoomt dorthin, wo du gerade bist. Beim ersten Mal fragt sisma nach Zugriff auf deinen Standort. Ein Ring um den Punkt markiert deine Position, wenn unter <Ui>Profil</Ui> ein anderer Ort gewählt ist; diese Auswahl bleibt, wie sie ist.</li>
            <li>Zoomst du auf eine Region, erscheinen <strong>Städtenamen</strong> in deiner Sprache, damit du dich orientieren kannst. Größere Städte zuerst; die Namen verdecken keine Erdbeben und weichen den Namen der Straßenkarten.</li>
            <li>Wenn du weit genug hineinzoomst, werden <strong>Straßenkarten</strong> von OpenStreetMap eingeblendet, sodass du genau siehst, wo ein Ereignis war.</li>
            <li><strong>Tippe auf eine Markierung</strong>, um eine Übersichtskarte zu sehen, dann auf <Ui>Details</Ui> für alles Weitere.</li>
          </ul>
        </div>
        <Shot src="map" alt="Weltkarte mit nach Magnitude gefärbten Erdbebenmarkierungen" caption="Die Karte" />
      </div>
      <h3 id="region-view">Regionsansicht</h3>
      <div className={s.pair}>
        <div>
          <p><Ui>Region zeigen</Ui> bei einem Erdbeben öffnet eine Nahansicht von etwa 800 km Breite rund um das Beben, mit einer pulsierenden Markierung am Ereignis und Beschriftungen an Erdbeben in der Nähe. Tippe auf <Ui>Zurück zur Weltkarte</Ui>, um zurückzukehren.</p>
          <p>Die Regionsansicht öffnet sich auch, wenn jemand einem Link folgt, den du geteilt hast.</p>
        </div>
        <Shot src="region" alt="Regionsansicht: eine Nahansicht rund um ein Erdbeben mit pulsierender Markierung und Übersichtskarte" caption="Regionsansicht" />
      </div>
      <h3>Filter, Ebenen und Legende</h3>
      <div className={s.pair}>
        <div>
          <p>Zieh das Feld <Ui>Filter</Ui> unten in Liste, Karte oder Globus nach oben. Tippe einmal darauf, um es zur Hälfte zu öffnen, noch einmal, um es ganz zu öffnen, oder zieh es.</p>
          <ul>
            <li><strong>Zeitraum</strong>: 24 Stunden, 7 Tage oder 30 Tage. Ein ganzes Jahr braucht sisma+.</li>
            <li><strong>Magnitude</strong> und <strong>Region</strong> (ein Land oder eine Meeresregion) sind sisma+-Filter und im kostenlosen Tarif mit einem Schloss markiert.</li>
            <li><strong>Ort</strong>: nur Erdbeben in der Nähe eines deiner gespeicherten Orte zeigen.</li>
            <li><Ui>Filter zurücksetzen</Ui> stellt alles wieder her.</li>
          </ul>
          <p>Unter <strong>Ebenen</strong> kannst du tektonische <strong>Plattengrenzen</strong> einblenden. Das Feld zeigt außerdem die Magnitudenlegende.</p>
          <Callout><p>Wenn du eine Region wählst, zoomt die Karte auch dorthin und der Globus dreht sich zu ihr.</p></Callout>
        </div>
        <Shot src="filters" alt="Geöffnetes Filterfeld: Zeitraum, Magnitude, Region und Ort" caption="Das Filterfeld" />
      </div>
      </>
    ),
  },
  {
    slug: 'globe', icon: 'public', title: '3D-Globus', sub: 'Drehen, Tiefe sehen',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Der Tab <Ui>Globus</Ui> zeigt dieselben Erdbeben auf einer 3D-Erde. Zieh, um ihn zu drehen, und zoome mit zwei Fingern oder dem Mausrad. Tippe auf eine Markierung für ihre Übersicht. <Ui>Mein Standort</Ui> unter der Taste <Ui>−</Ui> dreht den Globus dorthin, wo du gerade bist, und zoomt hinein (die Drehung stoppt, damit du im Blick bleibst).</p>
          <p>Zoomst du hinein, erscheinen <strong>Städtenamen</strong> in deiner Sprache, wie auf der Karte, auf der dir zugewandten Seite des Globus, ohne Erdbeben oder Schaltflächen zu verdecken.</p>
          <p>In den Ebenen des Felds <Ui>Filter</Ui>:</p>
          <ul>
            <li><strong>Tiefe</strong> färbt jedes Erdbeben nach seiner Tiefe und zeichnet eine Linie hinunter bis zu seinem Ursprung, sodass du tiefe Erdbeben unter Subduktionszonen siehst.</li>
            <li><strong>Platten</strong> zeigt die Plattengrenzen.</li>
            <li><strong>Drehen</strong> lässt den Globus langsam von selbst rotieren.</li>
          </ul>
        </div>
        <Shot src="globe" alt="3D-Globus mit Erdbebenmarkierungen rund um den Pazifik" caption="Der Globus" />
      </div>
      </>
    ),
  },
  {
    slug: 'felt', icon: 'vibration', title: 'Ich habe es gespürt', sub: 'Meldungen und Spürkarten',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Wenn du ein Erdbeben gespürt hast, sag es sisma. Meldungen helfen zu zeigen, wo und wie stark die Erschütterung gespürt wurde.</p>
          <ol className={s.steps}>
            <li>Öffne das Erdbeben. Bis zu <strong>6 Stunden</strong> danach siehst du <Ui>Ich habe es gespürt</Ui>.</li>
            <li>Stell den Schieberegler darauf ein, wie stark es sich angefühlt hat, von <em>Nicht gespürt</em> bis <em>Extrem</em>. Das Kennzeichen zeigt die passende Intensitätsstufe (MMI).</li>
            <li>Füge bei Bedarf eine Notiz hinzu oder tippe auf <Ui>Details hinzufügen</Ui> für deinen Aufenthaltsort, die Dauer, was sich bewegt hat und eventuelle Schäden.</li>
            <li>Wenn <Ui>Auf der Karte zeigen</Ui> erscheint, lass es eingeschaltet, um deine Meldung auf die Karte zu setzen, oder schalte es aus, damit sie nur gezählt wird. Verwendet wird der Standort deines Geräts oder, falls du ihn nicht freigegeben hast, der in <Ui>Profil</Ui> gewählte Ort. Die Option erscheint nur, wenn dieser Ort weniger als 3.000 km vom Erdbeben entfernt ist.</li>
            <li>Tippe auf <Ui>Meldung senden</Ui>.</li>
          </ol>
          <p>Deine Meldung wird <strong>ohne deinen Namen und ohne dein Konto</strong> gespeichert. Auf der Karte wird ihre Position auf etwa 10 km gerundet.</p>
          <p>Meldungen erscheinen in der Regionsansicht (<Ui>Region zeigen</Ui>) als kleine Quadrate von etwa 10 km. Zusammen mit den Meldungen von USGS und EMSC (siehe unten) erhält jedes Quadrat die Farbe der mittleren Intensität der Meldungen darin.</p>
          <p>Bei Erdbeben, die der USGS erfasst, zeigt die Regionsansicht auch die Antworten auf die USGS-Umfrage <strong>Did You Feel It?</strong> als farbige Quadrate von etwa 10 km, eine Farbe pro Intensitätsstufe.</p>
          <p>Bei Erdbeben, die das EMSC erfasst, fließen außerdem Meldungen über die EMSC-Websites und die App LastQuake in dieselben Quadrate ein. Die Daten des EMSC stehen unter der Lizenz CC BY 4.0.</p>
          <p>Um alle Spürkarten auf einmal ein- oder auszublenden, tippe auf die Schaltfläche <Ui>Ebenen</Ui> neben <Ui>Zurück zur Weltkarte</Ui> und nutze den Schalter <Ui>Spürkarten</Ui>. Deine Auswahl bleibt auf diesem Gerät gespeichert. Unter <Ui>Details</Ui> des Erdbebens nennt die Spürkarten-Legende die Gesamtzahl der Meldungen und die höchste Intensität, mit der Farbskala der Intensität. Graue Quadrate sind Gebiete der automatischen Spürkarte, für die keine Meldung eine Intensität angibt.</p>
          <h3>Spürkarten</h3>
          <p>Wenn viele Menschen sisma direkt nach einem Erdbeben öffnen, zeigt dieser Ansturm, wo es wahrscheinlich gespürt wurde. sisma macht daraus eine anonyme <strong>Spürkarte</strong> in der Regionsansicht. Positionen werden auf deinem Gerät um bis zu 500 m verschoben, enthalten keine Konto- oder Gerätekennung und werden nur für Gebiete von etwa 10 km mit mindestens 3 Personen angezeigt. Du kannst das unter <Ui>Profil</Ui> → <Ui>Helfen, Spürkarten zu erstellen</Ui> ausschalten.</p>
        </div>
        <Shot src="felt" alt="Fenster „Was hast du gespürt?“ mit Intensitätsregler, optionaler Notiz, dem Schalter Auf der Karte zeigen und Meldung senden" caption="Melden, was du gespürt hast" />
      </div>
      </>
    ),
  },
  {
    slug: 'share', icon: 'ios_share', title: 'Ein Erdbeben teilen', sub: 'Bild, Text und Alt-Text',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Tippe bei einem Erdbeben auf <Ui>Teilen</Ui>, um eine Teilen-Karte zu erstellen: ein Bild mit der Karte und den wichtigsten Details.</p>
          <p>Die Karte auf dem Bild zeigt auch <strong>Städtenamen</strong> rund um das Erdbeben in deiner Sprache, wie in der Regionsansicht, überall dort, wo sie Platz haben, ohne Erdbeben zu verdecken. Weit draußen auf dem Meer gibt es eventuell keine.</p>
          <p>Wo Menschen das Erdbeben gemeldet haben, zeigt die Karte im Bild es auch wie in der Regionsansicht: kleine Quadrate in Intensitätsfarben (grau, wenn die Intensität unbekannt ist), mit der Intensitätsskala unten rechts. Die vorgeschlagene Bildbeschreibung erwähnt das ebenfalls. Wenn du <Ui>Spürkarten</Ui> unter <Ui>Ebenen</Ui> in der Regionsansicht ausgeschaltet hast, lässt das Bild sie ebenfalls weg.</p>
          <p>Hat ein Tsunami-Warnzentrum eine offizielle Meldung zu dem Erdbeben herausgegeben, zeigt das Bild ihre Stufe und das Zentrum oben links auf der Karte, zum Beispiel <strong>Tsunamiwarnung · PTWC</strong>, farbig, solange eine Warnung, Gefahrenmeldung, Vorwarnung oder ein Hinweis gilt. Auch der Beitragstext und die Bildbeschreibung nennen sie.</p>
          <ul>
            <li>Der <strong>Beitragstext</strong> ist schon ausgefüllt (Magnitude, Ort, Zeit, Tiefe und ein Hashtag, der Link am Schluss), und du kannst ihn bearbeiten.</li>
            <li>Die <strong>Bildbeschreibung (Alt-Text)</strong> beschreibt das Bild für Menschen, die einen Screenreader nutzen. Sie ist schon ausgefüllt, und du kannst sie bearbeiten.</li>
            <li><Ui>Bild teilen</Ui> öffnet das Teilen-Menü deines Smartphones (in der Android-App und in Browsern, die das unterstützen). Wo ein Browser keine Bilder teilen kann oder das Bild nicht erstellt werden konnte, teilt <Ui>Link teilen</Ui> stattdessen den Beitragstext mit seinem Link. <Ui>Bild speichern</Ui> lädt das Bild herunter, und <Ui>Text kopieren</Ui> und <Ui>Alt-Text kopieren</Ui> kopieren das jeweilige Feld.</li>
          </ul>
          <Callout><p>X, Facebook und Bluesky verwerfen oft den Text, der mit einem geteilten Bild kommt, und keine dieser Apps übernimmt auf diesem Weg den Alt-Text. <strong>„Bild teilen“ kopiert auch den Text</strong>, sodass du ihn in den Beitrag einfügen kannst. Nutze <Ui>Alt-Text kopieren</Ui> und füge ihn in das Feld für die Bildbeschreibung der App ein. Wenn sich auf dem iPhone das Teilen-Menü nicht sofort öffnet, tippe noch einmal auf <Ui>Bild teilen</Ui>: Der Text ist schon kopiert.</p></Callout>
        </div>
        <Shot src="share" alt="Teilen-Fenster mit Vorschau der Teilen-Karte, bearbeitbarem Beitragstext und Bildbeschreibung" caption="Das Teilen-Fenster" />
      </div>
      </>
    ),
  },
  {
    slug: 'account', icon: 'person', title: 'Dein Konto', sub: 'Anmelden, Passwörter, Löschen',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Geh zu <Ui>Profil</Ui> und tippe auf <Ui>Anmelden</Ui>. Du kannst Google oder deine E-Mail und ein Passwort verwenden.</p>
          <h3>Konto mit E-Mail erstellen</h3>
          <ol className={s.steps}>
            <li>Tippe unten im Anmeldefenster auf <Ui>Konto erstellen</Ui>.</li>
            <li>Gib deine E-Mail und ein Passwort ein: mindestens 8 Zeichen, mit Buchstaben und Zahlen. Passwörter, die in bekannten Datenlecks vorkommen, werden abgelehnt.</li>
            <li>Öffne die Bestätigungs-E-Mail, die wir dir schicken, und tippe auf den Link. Danach bist du angemeldet. Nach einer Minute noch nichts da? Sieh im Spam- oder Junk-Ordner nach.</li>
          </ol>
          <h3>Mit Google anmelden</h3>
          <p>Tippe auf <Ui>Weiter mit Google</Ui>. Wähle in der Android-App dein Google-Konto aus der angezeigten Liste. Gibt es zu deiner Google-E-Mail schon ein sisma-Konto, wird Google genau diesem Konto hinzugefügt.</p>
          <p>Wenn du ein Konto erstellst, steht <Ui>Weiter mit Google</Ui> ebenfalls oben: Das Konto wird sofort erstellt, ohne Passwort und ohne Bestätigungs-E-Mail.</p>
        </div>
        <Shot src="signin" alt="Anmeldefenster: Weiter mit Google, E-Mail und Passwort, Passwort vergessen? und Konto erstellen" caption="Anmelden" />
      </div>

      <h3 id="password-reset">Passwort vergessen? So setzt du es zurück</h3>
      <div className={s.pair}>
        <div>
          <ol className={s.steps}>
            <li>Tippe unter <Ui>Profil</Ui> auf <Ui>Anmelden</Ui> und gib deine E-Mail-Adresse ein.</li>
            <li>Tippe auf <Ui>Passwort vergessen?</Ui>. Du siehst <em>Prüfe deine E-Mails</em>.</li>
            <li>Öffne die E-Mail und tippe auf den Link. sisma öffnet sich und bittet dich: <em>Neues Passwort festlegen</em>.</li>
            <li>Gib das neue Passwort zweimal ein und tippe auf <Ui>Speichern</Ui>. Du bist angemeldet.</li>
          </ol>
          <Callout kind="note"><p>Zum Schutz deiner Privatsphäre meldet sisma immer, dass der Link gesendet wurde, auch wenn kein Konto diese Adresse verwendet. Wenn nach ein paar Minuten nichts ankommt, sieh in deinem Spam-Ordner nach und prüfe, ob du die Adresse eingegeben hast, mit der du dich registriert hast.</p></Callout>
        </div>
        <Shot src="forgot" alt="Prüfe deine E-Mails: Wir haben einen Link zum Zurücksetzen des Passworts gesendet" caption="Nach dem Tippen auf „Passwort vergessen?“" />
      </div>

      <h3>Passwort ändern oder einem Google-Konto hinzufügen</h3>
      <div className={s.pair}>
        <div>
          <ol className={s.steps}>
            <li>Tippe unter <Ui>Profil</Ui> → <Ui>Konto</Ui> auf <Ui>Passwort festlegen oder ändern</Ui>.</li>
            <li>Gib das neue Passwort zweimal ein und tippe auf <Ui>Speichern</Ui>.</li>
          </ol>
          <p>Wenn du dich mit Google registriert hast, fügt das ein Passwort hinzu, damit du dich auch mit deiner E-Mail anmelden kannst. Bittet sisma dich, dich zuerst erneut anzumelden, ist das eine Sicherheitsprüfung: Melde dich ab, wieder an und versuche es noch einmal.</p>
        </div>
        <Shot src="password" alt="Fenster „Neues Passwort festlegen“ mit Feldern für neues Passwort und Bestätigung" caption="Ein neues Passwort festlegen" />
      </div>

      <h3>Weitere Kontoaufgaben</h3>
      <div className={s.pair}>
        <div>
          <ul>
            <li><strong>Anzeigename</strong>: <Ui>Profil</Ui> → <Ui>Anzeigename</Ui>. Lass ihn leer, um deine E-Mail anzuzeigen.</li>
            <li><strong>Abmelden</strong>: <Ui>Profil</Ui> → <Ui>Abmelden</Ui>. Deine gespeicherten Orte bleiben in deinem Konto.</li>
            <li><strong>E-Mail-Adresse ändern</strong>: Das ist in der App noch nicht möglich. Schreib von deiner aktuellen Adresse an <a href={`mailto:${MAIL}`}>{MAIL}</a>.</li>
          </ul>
        </div>
        <Shot src="me" alt="Kontobereich unter Profil: Hilfe & Support, Anzeigename, E-Mail, Passwort und Abmelden, darunter Konto löschen in einer eigenen, rot umrandeten Karte" caption="Konto, ganz unten unter Profil" />
      </div>

      <h3 id="delete-account">Konto löschen</h3>
      <div className={s.pair}>
        <div>
          <ol className={s.steps}>
            <li>Wenn du sisma+ hast, kündige es zuerst (siehe <Link href="/help/plus#cancel">sisma+ kündigen</Link>). sisma löscht kein Konto mit einem Abo, das sich noch verlängert.</li>
            <li>Tippe unter <Ui>Profil</Ui> auf <Ui>Konto löschen</Ui> und dann auf <Ui>Endgültig löschen</Ui>.</li>
          </ol>
          <p>Dadurch werden dein Konto, deine gespeicherten Orte und Warneinstellungen dauerhaft gelöscht. Gesendete Spürmeldungen bleiben ohne deinen Namen erhalten. Das Löschen des Kontos entfernt nicht die Android-App; deinstalliere sie bei Bedarf separat. Unsere <Link href="/privacy#delete">Datenschutzerklärung</Link> erklärt, was mit deinen Daten passiert.</p>
        </div>
        <Shot src="delete" alt="Fenster „Konto löschen?“ mit Endgültig löschen und Abbrechen" caption="Ein Konto löschen" />
      </div>
      </>
    ),
  },
  {
    slug: 'locations', icon: 'location_on', title: 'Gespeicherte Orte', sub: 'Orte, die dir wichtig sind',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Gespeicherte Orte bestimmen, welche Erdbeben als „nächste“ gelten und welche Orte deine Warnungen überwachen.</p>
          <ul>
            <li><strong>Mein Standort</strong> verwendet die Position deines Geräts (dein Browser oder Smartphone fragt zuerst um Erlaubnis).</li>
            <li>Mit <Ui>Ort hinzufügen</Ui> suchst du eine Stadt oder einen Ort und speicherst ihn.</li>
            <li>Tippe auf einen Ort, um ihn für Entfernungen zu verwenden. Tippe auf <Ui>×</Ui>, um ihn zu entfernen.</li>
            <li>Wenn <strong>Mein Standort</strong> gewählt ist, verwendet sisma deine Position, sobald dein Gerät sie liefern kann. Wenn nicht (Standort ausgeschaltet oder nicht erlaubt) oder wenn du einen gespeicherten Ort gewählt hast, verwendet sisma diesen gespeicherten Ort: deinen Standardort oder den ersten, den du gespeichert hast.</li>
            <li>Wenn du angemeldet bist, wird <strong>Mein Standort</strong> auch für deine Alarme und Tsunami-Benachrichtigungen verwendet: sisma speichert die letzte Position deines Geräts, auf etwa 1 km gerundet, und nutzt sie 30 Tage nach der letzten Aktualisierung.</li>
          </ul>
          <p>Der kostenlose Tarif hat <strong>1 gespeicherten Ort</strong>, sisma+ <strong>bis zu 10</strong>. Ohne Konto werden Orte auf diesem Gerät gespeichert und beim Anmelden in dein Konto übernommen.</p>
        </div>
        <Shot src="addloc" alt="Fenster „Ort hinzufügen“ mit einem Suchfeld für eine Stadt oder einen Ort" caption="Einen Ort hinzufügen" />
      </div>
      </>
    ),
  },
  {
    slug: 'plus', icon: 'workspace_premium', title: 'sisma+', sub: 'Test, Zahlung, Kündigung',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>sisma ist kostenlos nutzbar. sisma+ bietet zusätzlich:</p>
          <div className={legal.tableWrap}>
            <table style={{ minWidth: 0 }}>
              <thead><tr><th>Funktion</th><th>Kostenlos</th><th>sisma+</th></tr></thead>
              <tbody>
                <tr><td>Live-Liste, Karte, Globus, Wissen</td><td>✓</td><td>✓</td></tr>
                <tr><td>Offizielle Tsunami-Benachrichtigungen</td><td>✓</td><td>✓</td></tr>
                <tr><td>Erdbebenverlauf</td><td>30 Tage</td><td>Gesamter Verlauf</td></tr>
                <tr><td>Gespeicherte Orte</td><td>1</td><td>Bis zu 10</td></tr>
                <tr><td>Push-Benachrichtigungen mit eigenen Regeln</td><td>–</td><td>Bis zu 5 Warnungen</td></tr>
                <tr><td>Magnituden- und Regionsfilter</td><td>–</td><td>✓</td></tr>
                <tr><td>Live-Diagramme mit Erdbebendaten</td><td>–</td><td>✓</td></tr>
                <tr><td>Pazifisches Feuerband</td><td>–</td><td>✓</td></tr>
              </tbody>
            </table>
          </div>
          <p>Preis: <strong>{usd(PRICES.yearly.usd)} pro Jahr</strong>, ein einziger Tarif. Google Play zeigt den Preis in deiner Landeswährung. Neue Abonnenten können sisma+ <strong>{TRIAL_DAYS} Tage kostenlos testen</strong>, einmal pro Konto.</p>
        </div>
        <Shot src="paywall" alt={`sisma+-Fenster mit den Funktionen, dem Jahrespreis und ${TRIAL_DAYS} Tage kostenlos testen`} caption="Einen Tarif wählen" />
      </div>

      <h3>Abonnieren</h3>
      <ul>
        <li><strong>Auf der Website</strong>: <Ui>Profil</Ui> → <Ui>{TRIAL_DAYS} Tage kostenlos testen</Ui> (oder <Ui>Abonnieren</Ui>), dann auf der sicheren Bezahlseite von Stripe bezahlen. Wenn du zuerst ein Konto erstellst, öffnet sich die Bezahlseite, sobald du auf den Link in der Bestätigungs-E-Mail tippst. Wenn du zurückkommst, zeigt sisma ein paar Sekunden lang <em>sisma+ wird aktiviert…</em> und dann <em>Willkommen bei sisma+</em>.</li>
        <li><strong>In der Android-App</strong>: Dieselbe Taste öffnet das Zahlungsfenster von Google Play, wo du mit Google Pay, einer Karte oder anderen Zahlungsmethoden von Google Play bezahlen kannst.</li>
      </ul>
      <p>Du musst angemeldet sein. Dein Abo gilt dann überall, wo du dich mit diesem Konto anmeldest, im Web und in der App.</p>

      <h3>Abo verwalten oder wechseln</h3>
      <div className={s.pair}>
        <div>
          <p>Geh zu <Ui>Profil</Ui> → <Ui>Abo verwalten</Ui>, um Status, Tarif und nächstes Datum zu sehen.</p>
          <ul>
            <li><strong>Auf der Website gekauft</strong>: <Ui>Zahlung verwalten</Ui> öffnet die Seite von Stripe, wo du deine Karte aktualisieren, Rechnungen einsehen oder kündigen kannst.</li>
            <li><strong>In der Android-App gekauft</strong>: <Ui>In Google Play verwalten</Ui> öffnet dein Abo in Google Play.</li>
          </ul>
          <p>Hat sisma deinem Konto sisma+ geschenkt, zeigt dein Tarif <Ui>Geschenkt</Ui>. Du brauchst kein Abo und kannst ein begonnenes Abo kündigen, ohne sisma+ zu verlieren.</p>
        </div>
        <Shot src="subscription" alt="Abo-Seite: Status, Tarif, Verlängerungsdatum und In Google Play verwalten" caption="Dein Abo" />
      </div>

      <h3 id="cancel">sisma+ kündigen</h3>
      <ol className={s.steps}>
        <li>Öffne <Ui>Profil</Ui> → <Ui>Abo verwalten</Ui>.</li>
        <li>Tippe auf <Ui>Zahlung verwalten</Ui> (Website) oder <Ui>In Google Play verwalten</Ui> (App) und kündige dort. In Google Play kannst du auch zu <em>Zahlungen und Abos → Abos</em> gehen.</li>
      </ol>
      <p>Du behältst sisma+ bis zum Ende des bezahlten Zeitraums. Die Karte unter <Ui>Profil</Ui> zeigt dann <em>Endet am</em> mit dem Datum, und danach bist du wieder im kostenlosen Tarif. Kündigst du einen kostenlosen Test vor seinem Ende, wird dir nichts berechnet.</p>
      <Callout kind="note"><p>Das Deinstallieren der App oder das Löschen deines sisma-Kontos kündigt ein Google Play-Abo <strong>nicht</strong>. Kündige es in Google Play.</p></Callout>

      <h3>Kauf wiederherstellen</h3>
      <p>Melde dich auf einem neuen Smartphone oder nach einer Neuinstallation der App mit demselben sisma-Konto an. Wenn sisma+ nicht erscheint, öffne das sisma+-Fenster und tippe auf <Ui>Kauf wiederherstellen</Ui>. Das gibt es nur in der Android-App; es findet das Google Play-Abo auf diesem Gerät.</p>

      <h3>Erstattungen</h3>
      <p>Für Käufe über Google Play gelten die Erstattungsrichtlinien von Google Play; beantrage eine Erstattung daher über Google Play. Für Käufe auf der Website schreib an <a href={`mailto:${MAIL}`}>{MAIL}</a>. Unsere <Link href="/terms">Nutzungsbedingungen</Link> erklären die Einzelheiten.</p>
      </>
    ),
  },
  {
    slug: 'alerts', icon: 'notifications_active', title: 'Warnungen', sub: 'Push-Benachrichtigungen, die zu dir passen',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Mit sisma+ sendet sisma eine Push-Benachrichtigung, wenn ein Erdbeben zu einer deiner Warnungen passt.</p>
          <ol className={s.steps}>
            <li>Melde dich an und stell sicher, dass du sisma+ hast.</li>
            <li>Schalte unter <Ui>Profil</Ui> <Ui>Push-Benachrichtigungen</Ui> ein, oder öffne <Ui>Warnregeln</Ui> und schalte <em>Erdbebenwarnungen</em> ein.</li>
            <li>Tippe unter <em>Zustellen per</em> auf <Ui>Mitteilungen auf diesem Gerät einschalten</Ui> und erlaube Mitteilungen, wenn du gefragt wirst.</li>
            <li>Tippe auf <Ui>Warnung hinzufügen</Ui> und richte sie ein (siehe unten). Du kannst bis zu 5 haben.</li>
            <li>Tippe auf <Ui>Testalarm senden</Ui>, um zu prüfen, ob dieses Gerät sie empfängt.</li>
          </ol>
        </div>
        <Shot src="alerts" alt="Warnungsseite mit dem Ein/Aus-Schalter, deinen Warnungen (0 von 5), Warnung hinzufügen und Zustellen per" caption="Die Warnungsseite" />
      </div>
      <h3>Eine Warnung einrichten</h3>
      <ul>
        <li><strong>Name</strong>: zum Beispiel <em>Zuhause</em>.</li>
        <li><strong>Mindestmagnitude</strong>: Du wirst bei dieser Magnitude und allem Stärkeren gewarnt.</li>
        <li><strong>Überwacht</strong>: deine gespeicherten Orte innerhalb einer Entfernung deiner Wahl (100, 250, 500 oder 1.000 km) oder die ganze Welt.</li>
        <li><strong>Weitere Orte</strong>: bis zu 20 Länder oder Regionen, überall darin.</li>
        <li><strong>Ruhezeiten</strong>: keine Warnungen über Nacht, mit der Möglichkeit, starke Erdbeben (Magnitude 6 oder mehr) trotzdem durchzulassen.</li>
        <li>Ein Diagramm zeigt, wie viele Erdbeben der letzten 30 Tage die Warnung ausgelöst hätten, damit du sie anpassen kannst.</li>
      </ul>
      <p><strong>Überwacht</strong> umfasst auch <strong>Mein Standort</strong>, wenn dein Gerät seine Position teilt: siehe <Link href="/help/locations">Gespeicherte Orte</Link>.</p>
      <p>Warnungen, die du in den letzten 30 Tagen erhalten hast, stehen unter <em>Warnverlauf</em>.</p>
      <h3>Tsunami-Benachrichtigungen</h3>
      <p>Tsunami-Benachrichtigungen sind für alle Angemeldeten kostenlos. Schalte unter <Ui>Profil</Ui> <Ui>Tsunami-Benachrichtigungen</Ui> ein und tippe auf <Ui>Mitteilungen auf diesem Gerät einschalten</Ui>. Du wirst benachrichtigt, wenn eine offizielle Tsunamiwarnung, -gefahr, -vorwarnung oder ein -hinweis für ein Erdbeben im Umkreis von 1.000 km um einen deiner gespeicherten Orte herausgegeben wird. Ruhezeiten gelten dafür nicht, und jede Stufe wird pro Erdbeben nur einmal gesendet. Mein Standort zählt auch, wie bei den anderen Alarmen.</p>
      <Callout kind="note"><p><strong>iPhone und iPad:</strong> Web-Mitteilungen funktionieren erst, wenn du sisma zum Home-Bildschirm hinzufügst (Teilen → Zum Home-Bildschirm) und es von dort öffnest. Wenn du sisma zum ersten Mal im Browser auf einem iPhone oder iPad öffnest, zeigt ein Fenster diese Schritte; tippe auf <Ui>Nicht jetzt</Ui>, um es in zwei Wochen wiederzusehen, oder auf <Ui>Verstanden</Ui>, um es auszublenden.</p></Callout>
      </>
    ),
  },
  {
    slug: 'settings', icon: 'tune', title: 'Einstellungen', sub: 'Sprache, Darstellung, Einheiten',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Du findest sie unter <Ui>Profil</Ui>, unterhalb deiner Orte:</p>
          <ul>
            <li><strong>Sprache</strong>: English, Español, 日本語, Bahasa Indonesia, Türkçe, Italiano, Português, 中文, Français oder Deutsch. Du kannst auch oben in jedem Tab auf die Sprachtaste tippen.</li>
            <li><strong>Darstellung</strong>: wie dein Gerät (System), Hell oder Dunkel.</li>
            <li><strong>Einheiten</strong>: Kilometer oder Meilen.</li>
            <li><strong>Kartenmarkierungen</strong>: Pins mit der Magnitude darin oder Kreise, deren Größe der Magnitude entspricht. Hier findest du auch die Farblegende.</li>
            <li><strong>Helfen, Spürkarten zu erstellen</strong>: schaltet das anonyme Teilen für Spürkarten ein oder aus (siehe <Link href="/help/felt">Ich habe es gespürt</Link>).</li>
            <li><strong>Einführung anzeigen</strong> spielt die Willkommensschritte noch einmal ab.</li>
          </ul>
          <p>Wenn du angemeldet bist, werden deine Sprache und Darstellung in deinem Konto gespeichert.</p>
        </div>
        <Shot src="me_more" alt="Einstellungen: Sprache, Darstellung, Einheiten, Kartenmarkierungen, Schalter für Spürkarten, Einführung und Datenquellen" caption="Einstellungen unter Profil" />
      </div>
      </>
    ),
  },
  {
    slug: 'science', icon: 'science', title: 'Wissen', sub: 'Wie Erdbeben entstehen',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Der Tab <Ui>Wissen</Ui> enthält acht kurze, illustrierte Anleitungen, jede mit einer animierten Grafik oder einem Live-Diagramm: Plattentektonik, Verwerfungstypen, seismische Wellen, Magnitude und Intensität, Tiefe und Nachbeben, Tsunamis, Vorsorge und der Feuerring, mit einer Live-Karte, wie viele aktuelle Erdbeben rund um den Pazifik aufgetreten sind.</p>
          <p>Tippe auf die Tasten unter einer Grafik, um die Ansicht zu wechseln, und auf die Pausentaste, um die Animation anzuhalten. Die Anleitungen folgen deiner Sprache, wie der Rest der App. Tippe oben in einer Anleitung auf <Ui>Teilen</Ui>, um sie jemandem zu schicken, mit Bild, kurzer Zusammenfassung und Link.</p>
          <p>Unter den Anleitungen findest du in <Ui>Im Detail</Ui> längere Artikel, wenn du tiefer einsteigen willst: warum sich Erdbeben nicht vorhersagen lassen, Plattentektonik und Verwerfungen, das Erdinnere und seismische Wellen, Nachbeben, Magnitude, Tiefherdbeben, Vulkane, die Erdbeben Italiens und der Tsunami von 2004, der Phuket erreichte. Jeder Artikel beginnt mit einem Bild seines Themas unter dem Titel, nennt seine Quellen und beantwortet am Ende häufige Fragen. Auch sie sind in deiner Sprache; die Quellenliste bleibt auf Englisch.</p>
          <p>Unter <Ui>Daten</Ui> zeigt <Ui>Erdbebendaten</Ui> (sisma+) die Erdbeben ab M4.5 der letzten 30 Tage weltweit nach Daten des USGS: wie viele es gab, ihre Magnituden und Tiefen, die Regionen, in denen sie auftraten, die freigesetzte Energie und die Zahl der Beben ab M7 pro Jahr seit 1900. Zu jedem Diagramm gibt es eine kurze Erklärung; tippe auf einen Balken, um seinen Wert zu sehen. Ohne sisma+ siehst du die Erklärungen und eine Schaltfläche, um die kostenlose Testphase zu starten. Die Farben haben eine Bedeutung: Magnituden verwenden die Farben der Kartenmarkierungen, Tiefen die Farben des Tiefenmodus des Globus, Regionen überwiegend am Feuerring sind hervorgehoben, und Balken über dem Durchschnitt sind korallenrot.</p>
          <p><Ui>Pazifisches Feuerband</Ui> (sisma+) rollt den Feuerring zu einem langen Streifen aus, von der Südspitze der Anden bis Neuseeland, und zeigt die USGS-Erdbeben der letzten 24 Stunden, 7 Tage oder 30 Tage nach ihrer Entfernung entlang der Vulkanbögen (waagerecht) und ihrer Tiefe (senkrecht). Scrolle seitwärts oder zoome, um dich daran entlangzubewegen, wähle eine Region, um dorthin zu springen, und tippe auf einen Punkt für die Details des Erdbebens. Die Farbe zeigt die Tiefe, die Größe die Magnitude. Einmal pro Stunde wird nach neuen Erdbeben gesucht, und es wird angezeigt, wann die Daten veröffentlicht wurden. Dreiecke über der Linie sind Vulkane aus dem Smithsonian-Katalog, eingefärbt nach dem wöchentlichen Vulkanaktivitätsbericht von Smithsonian / USGS (rot: andauernde Eruption, orange: neue Eruptionstätigkeit, gelb: neue Unruhe); tippe auf eines für Details und den Bericht. Ein weißes Dreieck heißt nur, dass der Vulkan nicht im Bericht dieser Woche steht – der Bericht nennt nicht jeden aktiven Vulkan. Mit <Ui>Zeigen</Ui> blendest du Erdbeben, Vulkane oder Gelände ein und aus. Das Gelände stammt aus dem Reliefmodell ETOPO 2022 der NOAA: Braun ist das höchste Gelände nahe der Route, Blau der tiefste Meeresboden bis 400 km, wo sich die Tiefseegräben zeigen. <Ui>Überhöht ×10</Ui> streckt die Höhen, damit Berge und Gräben sichtbar werden; <Ui>Maßstabsgetreu</Ui> nutzt denselben Maßstab wie die Erdbebentiefen. Erdbebentiefen werden nie überhöht. <Ui>3D</Ui> zeigt einen Abschnitt des Bands als Block, den man drehen kann: oben das Gelände, darunter die Erdbeben in ihrer Tiefe, alles im selben Maßstab. Wähle <Ui>Schräg</Ui>, <Ui>Querschnitt</Ui> (Blick entlang der Route) oder <Ui>Von oben</Ui>, bewege dich mit den Pfeilen entlang der Route und tippe auf einen Punkt oder ein Dreieck für Details. Das Gelände ist in 3D über Quadrate von 10 km gemittelt und wirkt daher glatter als im Profil. Ein Kompass zeigt Norden in der Mitte des Abschnitts. <Ui>1 Stunde</Ui> zeigt die letzte Stunde. <Ui>Verlauf</Ui> spielt die letzten 90 Tage, das letzte Jahr oder selbst gewählte Daten aus dem USGS-Katalog ab: Drücke auf Abspielen, um die Erdbeben zu ihrer erfassten Zeit erscheinen zu sehen, ziehe die Zeitleiste, ändere Geschwindigkeit und Spur und filtere nach Tiefe oder Region. Der Verlauf ist bernsteinfarben umrahmt, damit er nie mit Live-Daten verwechselt wird; längere Zeiträume brauchen einen höheren Magnitudenfilter. Unter dem Band zeigt eine Karte des Pazifiks die Route, den gerade gezeigten Abschnitt (bernsteinfarben) und dieselben Erdbeben und Vulkane; tippe auf der Karte auf einen davon, um ihn auch auf dem Band auszuwählen. Die Suche findet Vulkane nach Namen und Erdbeben nach Ort oder Magnitude, und die Vollbildtaste gibt Band und Karte den ganzen Bildschirm. <Ui>Teilen</Ui> erstellt ein Bild des ganzen Bands für den gewählten Zeitraum, mit einem Beitragstext und einer Bildbeschreibung, die du vor dem Teilen bearbeiten kannst.</p>
        </div>
        <Shot src="science" alt="Artikel über seismische Wellen mit einer animierten Grafik von P-Wellen" caption="Eine Wissensanleitung" />
      </div>
      </>
    ),
  },
  {
    slug: 'troubleshooting', icon: 'build', title: 'Fehlerbehebung', sub: 'Lösungen für häufige Probleme',
    body: (
      <>
      <div className={s.faq}>
        <p className={s.faqGroup}>Standort und Daten</p>
        <Faq q="„Nächste“ ist leer oder mein Standort wird nicht gefunden">
          <p>sisma braucht die Erlaubnis, deinen Standort zu verwenden, oder einen gespeicherten Ort.</p>
          <ul>
            <li><strong>Browser</strong>: Tippe auf das Symbol neben der Webadresse, stell <em>Standort</em> auf <em>Zulassen</em> und lade die Seite neu.</li>
            <li><strong>Android-App</strong>: Einstellungen → Apps → sisma → Berechtigungen → Standort → <em>Nur während der Nutzung der App zulassen</em>.</li>
            <li>Oder füge unter <Ui>Profil</Ui> → <Ui>Ort hinzufügen</Ui> einen Ort hinzu.</li>
          </ul>
        </Faq>
        <Faq q="Ein Erdbeben fehlt oder seine Magnitude hat sich geändert">
          <p>Die Dienste veröffentlichen zuerst automatische Werte und korrigieren sie dann, meist innerhalb der ersten Stunde. Magnitude, Tiefe und Ort können sich ändern, und manche kleinen Ereignisse werden gelöscht. Verschiedene Dienste können auch leicht unterschiedliche Werte melden; sisma zeigt die Werte des regionalen Dienstes, wo es sie gibt (JMA in Japan, GeoNet in Neuseeland), sonst USGS, dann EMSC. Sehr kleine Erdbeben (unter etwa Magnitude 2,5 außerhalb Japans und Neuseelands) sind nicht enthalten.</p>
        </Faq>
        <Faq q="Die Uhrzeiten scheinen falsch">
          <p>Uhrzeiten werden in der Zeitzone deines Geräts angezeigt. Prüfe die Einstellungen für Datum, Uhrzeit und Zeitzone auf deinem Gerät.</p>
        </Faq>
        <Faq q="Die Karte ist leer, wenn ich ganz hineinzoome">
          <p>Straßenkarten kommen von OpenStreetMap und brauchen eine Internetverbindung. Wenn sie nicht laden, zoome etwas heraus; die Erdbebenmarkierungen funktionieren weiterhin.</p>
        </Faq>
        <Faq q="Die App meldet, dass ich offline bin">
          <p>sisma braucht eine Verbindung, um Erdbeben zu laden. Prüfe WLAN oder mobile Daten und öffne die App dann erneut.</p>
        </Faq>

        <p className={s.faqGroup}>Anmelden</p>
        <Faq q="„E-Mail oder Passwort ist falsch.“">
          <p>Prüfe auf Tippfehler und nutze dann <Link href="/help/account#password-reset">Passwort vergessen?</Link>. Wenn du dein Konto mit Google erstellt hast, nutze <Ui>Weiter mit Google</Ui> oder füge unter <Ui>Profil</Ui> → <Ui>Passwort festlegen oder ändern</Ui> ein Passwort hinzu, während du mit Google angemeldet bist.</p>
        </Faq>
        <Faq q="„Bitte bestätige zuerst deine E-Mail“">
          <p>Öffne die Bestätigungs-E-Mail von sisma, tippe auf den Link und melde dich dann an. Du findest sie nicht? Sieh in deinem Spam-Ordner nach. Wenn sie immer noch nicht da ist, schreib von dieser Adresse an <a href={`mailto:${MAIL}`}>{MAIL}</a>.</p>
        </Faq>
        <Faq q="Die E-Mail zum Zurücksetzen oder Bestätigen ist nicht angekommen">
          <p>Warte ein paar Minuten und sieh in deinem Spam- oder Werbung-Ordner nach. Prüfe, ob du die Adresse eingegeben hast, mit der du dich registriert hast. Zum Schutz deiner Privatsphäre meldet sisma, dass ein Link gesendet wurde, auch wenn kein Konto diese Adresse verwendet.</p>
        </Faq>
        <Faq q="Die Anmeldung mit Google funktioniert nicht">
          <p>Stell in der Android-App sicher, dass du auf dem Smartphone in einem Google-Konto angemeldet bist (Einstellungen → Passwörter und Konten) und dass die Google Play-Dienste aktuell sind. Erlaube im Web Pop-ups und Anmeldungen über Drittanbieter für sisma.io. Du kannst dich jederzeit stattdessen mit E-Mail anmelden.</p>
        </Faq>
        <Faq q="„Melde dich zur Sicherheit ab und wieder an“">
          <p>Zum Ändern eines Passworts brauchst du eine kürzliche Anmeldung. Tippe auf <Ui>Abmelden</Ui>, melde dich wieder an und ändere es dann.</p>
        </Faq>

        <p className={s.faqGroup}>sisma+ und Zahlung</p>
        <Faq q="Ich habe bezahlt, sehe aber noch den kostenlosen Tarif">
          <ul>
            <li>Warte eine Minute, schließe sisma und öffne es erneut. Die Aktivierung erfolgt meist sofort, kann aber ein paar Minuten dauern.</li>
            <li>Stell sicher, dass du mit dem Konto angemeldet bist, mit dem du abonniert hast.</li>
            <li>Android-App: Öffne das sisma+-Fenster und tippe auf <Ui>Kauf wiederherstellen</Ui>.</li>
            <li>Klappt es immer noch nicht? Schreib an <a href={`mailto:${MAIL}`}>{MAIL}</a> mit der E-Mail deines Kontos und, bei Google Play, der Bestellnummer (GPA.…) aus deinem Beleg.</li>
          </ul>
        </Faq>
        <Faq q="„Dieses Google Play-Abo gehört zu einem anderen sisma-Konto.“">
          <p>Das Abo auf diesem Smartphone wurde gekauft, während du mit einem anderen sisma-Konto angemeldet warst. Melde dich ab und mit diesem Konto an.</p>
        </Faq>
        <Faq q="Mir wurde kein kostenloser Test angeboten">
          <p>Der Test ist für Konten, die noch nie ein Abo hatten. In der Android-App erlaubt Google Play außerdem nur einen Test pro Google-Konto, auch über verschiedene sisma-Konten hinweg.</p>
        </Faq>
        <Faq q="„Abos in der App sind noch nicht verfügbar“ oder „Google Play-Abrechnung ist auf diesem Gerät nicht verfügbar“">
          <p>Aktualisiere sisma und die Google Play Store-App und stell sicher, dass du in Google Play angemeldet bist. Auf manchen Geräten ohne Google Play ist kein Kauf in der App möglich. Schließ das Abo stattdessen auf <a href="https://sisma.io/app/me">sisma.io</a> ab und melde dich in der App mit demselben Konto an.</p>
        </Faq>
        <Faq q="Ich kann mein Konto nicht löschen">
          <p>Kündige zuerst sisma+. Sobald es zum Ende des Zeitraums ausläuft, kannst du das Konto löschen. Siehe <Link href="/help/account#delete-account">Konto löschen</Link>.</p>
        </Faq>

        <p className={s.faqGroup}>Warnungen und Mitteilungen</p>
        <Faq q="Ich bekomme keine Warnungen">
          <ol>
            <li>Prüfe, ob du sisma+ hast und angemeldet bist.</li>
            <li>Prüfe unter <Ui>Profil</Ui> → <Ui>Warnregeln</Ui>, ob Warnungen eingeschaltet sind und mindestens eine Warnung aktiv ist und Orte oder Gebiete hat.</li>
            <li>Prüfe unter <em>Zustellen per</em>, ob dieses Gerät eingeschaltet ist, und tippe dann auf <Ui>Testalarm senden</Ui>.</li>
            <li>Android: Unter Einstellungen → Apps → sisma → Benachrichtigungen müssen Benachrichtigungen erlaubt sein. Energiespareinstellungen können Benachrichtigungen verzögern; stell die Akkunutzung von sisma auf <em>Uneingeschränkt</em>.</li>
            <li>Browser: Mitteilungen müssen für sisma.io erlaubt sein. Öffne sisma auf iPhone und iPad vom Home-Bildschirm aus.</li>
            <li>Ruhezeiten halten Warnungen nachts zurück, außer du lässt starke Erdbeben durch.</li>
          </ol>
        </Faq>
        <Faq q="Ich bekomme zu viele Warnungen">
          <p>Erhöhe die Mindestmagnitude, verringere die Entfernung, entferne große Regionen oder richte Ruhezeiten ein. Das 30-Tage-Diagramm in jeder Warnung zeigt, wie oft sie ausgelöst hätte.</p>
        </Faq>

        <p className={s.faqGroup}>Teilen und Meldungen</p>
        <Faq q="Es gibt keine Taste „Bild teilen“">
          <p>Dein Browser kann keine Dateien teilen. Nutze <Ui>Bild speichern</Ui> und <Ui>Text kopieren</Ui> und poste beides selbst. Aktualisiere sisma in der Android-App, um das Teilen-Menü des Systems zu bekommen.</p>
        </Faq>
        <Faq q="Der Text ist nicht in meinem Beitrag erschienen">
          <p>Viele Apps verwerfen Text, der zusammen mit einem Bild geteilt wird. sisma hat ihn kopiert, als du auf <Ui>Bild teilen</Ui> getippt hast, also füge ihn in den Beitrag ein.</p>
        </Faq>
        <Faq q="Es gibt keine Taste „Ich habe es gespürt“">
          <p>Meldungen sind bis 6 Stunden nach einem Erdbeben möglich. Danach verschwindet die Taste.</p>
        </Faq>
      </div>
      </>
    ),
  },
  {
    slug: 'contact', icon: 'support_agent', title: 'Support kontaktieren', sub: 'Kommst du nicht weiter? Schreib uns',
    body: (
      <>
      <div className={s.contact}>
        <span className="ms" aria-hidden="true">mail</span>
        <div style={{ flex: '1 1 260px' }}>
          <p style={{ margin: 0 }}><strong>Brauchst du noch Hilfe?</strong> Schreib uns und nenne die E-Mail deines Kontos, dein Gerät und die Browser- oder App-Version und was du schon versucht hast. Ein Screenshot hilft.</p>
        </div>
        <a className={s.mail} href={`mailto:${MAIL}?subject=${encodeURIComponent('sisma help')}`}>{MAIL}</a>
      </div>
      <p>Bitte schick keine Passwörter oder vollständigen Kartennummern. Wir werden nie danach fragen.</p>
      </>
    ),
  },
];
