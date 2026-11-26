// Help centre, French translation of ../topics.tsx (same structure: see help-i18n.test.ts).
import Link from 'next/link';
import { PRICES, TRIAL_DAYS } from '@/lib/entitlements';
import legal from '../../privacy/privacy.module.css';
import s from '../help.module.css';
import { Callout, Faq, MAIL, MagLegend, Shot, Ui, usd } from '../help-parts';
import type { Hub, Topic } from '../topics';

export const HUB: Hub = {
  lead: 'Tout ce qu’il faut savoir pour utiliser sisma sur le site et dans l’app Android, avec des solutions aux problèmes les plus courants.',
  popularH: 'Populaires', allH: 'Toutes les rubriques', contactQ: 'Vous ne trouvez pas de réponse ?', contactP: 'Écrivez-nous, nous vous aiderons.',
  popular: [
    ['/help/account#password-reset', 'lock_reset', 'Réinitialiser un mot de passe oublié'],
    ['/help/felt', 'vibration', 'Signaler que vous avez ressenti un séisme'],
    ['/help/troubleshooting', 'notifications_off', 'Je ne reçois pas d’alertes'],
    ['/help/troubleshooting', 'credit_card', 'J’ai payé mais je suis toujours en formule gratuite'],
    ['/help/map#region-view', 'zoom_in_map', 'Voir la zone autour d’un séisme'],
    ['/help/share', 'ios_share', 'Partager un séisme avec du texte'],
  ],
};

export const TOPICS: Topic[] = [
  {
    slug: 'start', icon: 'rocket_launch', title: 'Bien démarrer', sub: 'Ce qu’est sisma et comment il fonctionne',
    body: (
      <>
      <p>
        sisma affiche les séismes du monde entier tels que les signalent quatre agences sismologiques : <strong>USGS</strong>
        (États-Unis), <strong>EMSC</strong> (Europe et Méditerranée), <strong>GeoNet</strong> (Nouvelle-Zélande) et <strong>JMA</strong> (Japon).
        Quand plusieurs agences signalent le même séisme, sisma ne l’affiche qu’une fois. La liste s’actualise d’elle-même toutes les deux
        minutes, et vous pouvez tirer le fil vers le bas pour l’actualiser tout de suite.
      </p>
      <p>Vous pouvez utiliser sisma de deux façons, avec le même compte et le même abonnement sisma+ :</p>
      <ul>
        <li><strong>Sur le web</strong> à l’adresse <a href="https://sisma.io/app">sisma.io/app</a>, sur n’importe quel téléphone, tablette ou ordinateur.</li>
        <li><strong>Dans l’app Android</strong> sur Google Play, qui ajoute la feuille de partage du système, le sélecteur de compte Google et la facturation Google Play.</li>
      </ul>
      <p>L’app comporte cinq onglets en bas de l’écran (sur ordinateur, dans le menu de gauche) : <Ui>Fil</Ui>, <Ui>Carte</Ui>, <Ui>Globe</Ui>, <Ui>Science</Ui> et <Ui>Profil</Ui>.</p>
      <p>Pas besoin de compte pour consulter les séismes. Un compte conserve vos lieux enregistrés et vos réglages, et il est nécessaire pour sisma+ et les alertes.</p>
      <Callout kind="warn"><p><strong>sisma n’est pas un service d’alerte officiel.</strong> Les informations sur les séismes peuvent être retardées, révisées ou incomplètes, et sisma ne fournit pas d’alerte précoce. En cas d’urgence, suivez toujours les consignes des autorités locales.</p></Callout>
      </>
    ),
  },
  {
    slug: 'feed', icon: 'format_list_bulleted', title: 'Le fil', sub: 'Récents, proches et plus forts',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>L’onglet <Ui>Fil</Ui> liste les séismes récents. Utilisez le sélecteur en haut pour les trier :</p>
          <ul>
            <li><strong>Récents</strong> : les plus récents d’abord.</li>
            <li><strong>Proches</strong> : les plus proches de votre position ou du lieu enregistré choisi d’abord.</li>
            <li><strong>Plus forts</strong> : la magnitude la plus élevée d’abord.</li>
          </ul>
          <p>Chaque ligne indique la magnitude dans une pastille colorée, le lieu avec le drapeau du pays où il se trouve ou dont il est proche, la distance et la direction depuis une localité proche, il y a combien de temps le séisme s’est produit, à quelle distance de vous et à quelle profondeur. Continuez à faire défiler : d’autres séismes s’ajoutent quand vous arrivez en bas de la liste.</p>
          <p>Sur un ordinateur, le fil se trouve sur la page <Ui>{"Vue d'ensemble"}</Ui>, la première du menu de gauche, avec une carte à côté de la liste. Choisissez un séisme dans la liste ou sur la carte et la carte zoome dessus, avec le nom des villes proches. Elle reste là quand vous fermez le séisme ; <Ui>Réinitialiser la vue</Ui> affiche à nouveau le monde entier. Choisissez un pays ou une région dans <Ui>Lieu</Ui>, en haut à droite, ou touchez-en un dans <Ui>Principales régions</Ui>, et la carte zoome sur ses séismes ; <Ui>Tous les lieux</Ui> affiche à nouveau le monde entier.</p>
          <h3>Couleurs des magnitudes</h3>
          <p>Les mêmes couleurs sont utilisées dans le fil, sur la carte et sur le globe :</p>
          <MagLegend words={{ label: 'Couleurs des magnitudes', magnitude: 'Magnitude {range}', orMore: '{n} ou plus', below: 'moins de {n}', to: '{a} à {b}' }} />
          <Callout><p>Ouvrez <Ui>Filtres</Ui> en bas du fil pour choisir la période et affiner la liste. Voir <Link href="/help/map">Carte et filtres</Link>.</p></Callout>
        </div>
        <Shot src="feed" alt="Le fil trié par séismes récents, avec les pastilles de magnitude, les lieux, les heures, les distances et les profondeurs" caption="Le fil, les plus récents d’abord" />
      </div>
      </>
    ),
  },
  {
    slug: 'details', icon: 'info', title: 'Détails d’un séisme', sub: 'Chaque valeur expliquée',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Touchez un séisme pour ouvrir ses détails :</p>
          <ul>
            <li><strong>Magnitude</strong> et son type (par exemple <em>mww</em>, la magnitude de moment utilisée pour les séismes plus importants).</li>
            <li><strong>Profondeur</strong> : la profondeur sous la surface à laquelle il a commencé. Les séismes superficiels sont généralement ressentis plus fortement.</li>
            <li><strong>Date et heure</strong> dans le fuseau horaire de votre appareil.</li>
            <li><strong>Distance</strong> par rapport à vous, et le <strong>pays</strong> (ou « Près de » un pays pour les événements en mer).</li>
            <li><strong>Coordonnées</strong> de l’épicentre.</li>
            <li><strong>Statut de révision</strong> : les valeurs <em>Automatique</em> viennent directement des instruments et changent souvent pendant la première heure ; <em>Révisé</em> signifie qu’un sismologue les a vérifiées.</li>
            <li><strong>Source</strong> : l’agence dont les chiffres sont affichés.</li>
          </ul>
          <p>Sous les détails :</p>
          <ul>
            <li><Ui>Afficher la région</Ui> ouvre une carte rapprochée autour du séisme avec les événements voisins et, si elle est disponible, la carte des ressentis.</li>
            <li><Ui>Partager</Ui> ouvre la carte de partage (voir <Link href="/help/share">Partage</Link>).</li>
            <li>Si des personnes l’ont ressenti, vous verrez combien.</li>
          </ul>
          <Callout kind="note"><p><strong>Tsunami :</strong> quand un centre d’alerte aux tsunamis (PTWC, NTWC ou la JMA japonaise) émet un message officiel pour un séisme, son niveau s’affiche tel quel, par exemple <strong>Alerte au tsunami</strong> ou <strong>Avis de tsunami</strong>, avec le centre, l’heure, les côtes citées et <Ui>Lire le message officiel</Ui>. Les alertes, menaces, veilles et avis sont en couleur et ajoutent un badge vague au repère du séisme et une icône vague colorée à sa ligne ; les messages d’information et les prévisions restent en gris. Un message marqué <em>Annulé</em> ou <em>N’est plus en vigueur</em> a été retiré ou a expiré. Sans message officiel, un fort séisme sous la mer affiche <em>Fort séisme sous la mer : consultez les informations officielles sur les tsunamis</em>. sisma relaie ces messages et n’est pas un service d’alerte : suivez toujours les consignes des autorités locales.</p></Callout>
        </div>
        <Shot src="detail" alt="Détails d’un séisme : magnitude, profondeur, date, heure, distance, pays, coordonnées, statut de révision, source, Afficher la région et Partager" caption="Les détails d’un séisme" />
      </div>
      </>
    ),
  },
  {
    slug: 'map', icon: 'map', title: 'Carte et filtres', sub: 'Zoom, vue régionale, filtres',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>L’onglet <Ui>Carte</Ui> affiche les séismes récents sous forme d’épingles colorées selon la magnitude, centrées sur votre partie du monde.</p>
          <ul>
            <li><strong>Déplacez et zoomez</strong> avec les doigts ou la souris, ou avec les boutons <Ui>+</Ui> et <Ui>−</Ui>. Le troisième bouton réinitialise la vue.</li>
            <li><strong>Ma position</strong> (le quatrième bouton) zoome sur l’endroit où vous êtes. La première fois, sisma demande l’accès à votre position. Un anneau autour du point marque votre position quand un autre lieu est choisi dans <Ui>Profil</Ui> ; ce choix reste inchangé.</li>
            <li>En zoomant sur une région, des <strong>noms de villes</strong> apparaissent, dans votre langue, pour vous repérer. Les plus grandes villes d’abord ; les noms évitent les séismes et laissent la place à ceux des plans de rues.</li>
            <li>Zoomez suffisamment et les <strong>plans de rues</strong> d’OpenStreetMap apparaissent en fondu, pour voir exactement où un événement s’est produit.</li>
            <li><strong>Touchez une épingle</strong> pour afficher une fiche résumée, puis <Ui>Détails</Ui> pour tout savoir sur le séisme.</li>
          </ul>
        </div>
        <Shot src="map" alt="Carte du monde avec des épingles de séismes colorées selon la magnitude" caption="La carte" />
      </div>
      <h3 id="region-view">Vue régionale</h3>
      <div className={s.pair}>
        <div>
          <p><Ui>Afficher la région</Ui> sur un séisme ouvre une vue rapprochée d’environ 800 km de large autour de lui, avec un repère pulsant sur l’événement et des étiquettes sur les séismes voisins. Touchez <Ui>Retour à la carte du monde</Ui> pour revenir.</p>
          <p>C’est aussi la vue régionale qui s’ouvre quand quelqu’un suit un lien que vous avez partagé.</p>
        </div>
        <Shot src="region" alt="Vue régionale : une vue rapprochée autour d’un séisme avec un repère pulsant et une fiche résumée" caption="Vue régionale" />
      </div>
      <h3>Filtres, calques et légende</h3>
      <div className={s.pair}>
        <div>
          <p>Faites remonter le panneau <Ui>Filtres</Ui> en bas du Fil, de la Carte ou du Globe. Touchez-le une fois pour l’ouvrir à moitié, une seconde fois pour l’ouvrir entièrement, ou faites-le glisser.</p>
          <ul>
            <li><strong>Période</strong> : 24 heures, 7 jours ou 30 jours. Une année complète nécessite sisma+.</li>
            <li><strong>Magnitude</strong> et <strong>Région</strong> (un pays ou une région océanique) sont des filtres sisma+, marqués d’un cadenas en formule gratuite.</li>
            <li><strong>Lieu</strong> : n’afficher que les séismes proches d’un de vos lieux enregistrés.</li>
            <li><Ui>Effacer les filtres</Ui> rétablit tout.</li>
          </ul>
          <p>Sous <strong>Calques</strong>, vous pouvez afficher les <strong>limites des plaques</strong> tectoniques. Le panneau affiche aussi la légende des magnitudes.</p>
          <Callout><p>Choisir une région zoome aussi la carte sur elle et tourne le globe pour lui faire face.</p></Callout>
        </div>
        <Shot src="filters" alt="Panneau des filtres ouvert : période, magnitude, région et lieu" caption="Le panneau des filtres" />
      </div>
      </>
    ),
  },
  {
    slug: 'globe', icon: 'public', title: 'Globe 3D', sub: 'Faites-le tourner, voyez la profondeur',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>L’onglet <Ui>Globe</Ui> affiche les mêmes séismes sur une Terre en 3D. Faites glisser pour la tourner et pincez ou faites défiler pour zoomer. Touchez une épingle pour afficher son résumé. <Ui>Ma position</Ui>, sous le bouton <Ui>−</Ui>, tourne le globe vers l’endroit où vous êtes et zoome (la rotation s’arrête pour que vous restiez à l’écran).</p>
          <p>En zoomant, des <strong>noms de villes</strong> apparaissent dans votre langue, comme sur la carte, sur la face du globe tournée vers vous, sans masquer les séismes ni les boutons.</p>
          <p>Dans les calques du panneau <Ui>Filtres</Ui> :</p>
          <ul>
            <li><strong>Profondeur</strong> colore chaque séisme selon sa profondeur et trace une ligne jusqu’à son point de départ, pour voir les séismes profonds sous les zones de subduction.</li>
            <li><strong>Plaques</strong> affiche les limites des plaques.</li>
            <li><strong>Rotation</strong> fait tourner le globe lentement tout seul.</li>
          </ul>
        </div>
        <Shot src="globe" alt="Globe 3D avec des épingles de séismes autour du Pacifique" caption="Le globe" />
      </div>
      </>
    ),
  },
  {
    slug: 'felt', icon: 'vibration', title: 'Je l’ai ressenti', sub: 'Témoignages et cartes des ressentis',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Si vous avez ressenti un séisme, dites-le à sisma. Les témoignages aident à montrer où les secousses ont été ressenties et avec quelle force.</p>
          <ol className={s.steps}>
            <li>Ouvrez le séisme. Pendant <strong>6 heures</strong> au maximum après qu’il s’est produit, vous verrez <Ui>Je l’ai ressenti</Ui>.</li>
            <li>Placez le curseur selon la force ressentie, de <em>Non ressenti</em> à <em>Extrême</em>. La pastille indique le niveau d’intensité correspondant (MMI).</li>
            <li>Ajoutez une note si vous le souhaitez, ou touchez <Ui>Ajouter des détails</Ui> pour indiquer où vous étiez, combien de temps cela a duré, ce qui a bougé et les éventuels dégâts.</li>
            <li>Si <Ui>Afficher sur la carte</Ui> apparaît, laissez-le activé pour placer votre témoignage sur la carte, ou désactivez-le pour qu’il soit seulement compté. Il utilise la position de votre appareil ou, si vous ne l’avez pas partagée, le lieu choisi dans <Ui>Profil</Ui>, et n’apparaît que si ce lieu est à moins de 3 000 km du séisme.</li>
            <li>Touchez <Ui>Envoyer</Ui>.</li>
          </ol>
          <p>Votre témoignage est enregistré <strong>sans votre nom ni votre compte</strong>. Sur la carte, sa position est arrondie à environ 10 km.</p>
          <p>Les témoignages apparaissent dans la vue de la région (<Ui>Afficher la région</Ui>) sous forme de petits carrés d’environ 10 km. Avec les témoignages de l’USGS et de l’EMSC décrits plus bas, chaque carré prend la couleur de l’intensité moyenne des témoignages qu’il contient.</p>
          <p>Pour les séismes enregistrés par l’USGS, la vue de la région montre aussi les réponses à l’enquête <strong>Did You Feel It?</strong> de l’USGS, sous forme de carrés colorés d’environ 10 km, une couleur par niveau d’intensité.</p>
          <p>Pour les séismes enregistrés par l’EMSC, elle inclut aussi les témoignages envoyés via les sites de l’EMSC et l’application LastQuake, dans les mêmes carrés. Les données de l’EMSC sont diffusées sous licence CC BY 4.0.</p>
          <p>Pour afficher ou masquer toutes les cartes des secousses à la fois, touchez le bouton <Ui>Couches</Ui> à côté de <Ui>Retour à la carte du monde</Ui> et utilisez l’interrupteur <Ui>Cartes des secousses</Ui>. Votre choix est gardé sur cet appareil. Dans <Ui>Détails</Ui> du séisme, la légende des secousses indique le nombre total de témoignages et l’intensité la plus forte, avec l’échelle de couleurs d’intensité. Les carrés gris sont des zones de la carte automatique où aucun témoignage ne donne d’intensité.</p>
          <h3>Cartes des ressentis</h3>
          <p>Quand beaucoup de personnes ouvrent sisma juste après un séisme, cet afflux montre où il a probablement été ressenti. sisma en fait une <strong>carte des ressentis</strong> anonyme dans la vue régionale. Les positions sont floutées sur votre appareil jusqu’à 500 m, ne portent aucun identifiant de compte ni d’appareil, et ne sont affichées que pour des zones d’environ 10 km comptant au moins 3 personnes. Vous pouvez désactiver cette fonction dans <Ui>Profil</Ui> → <Ui>Aider à cartographier où les séismes sont ressentis</Ui>.</p>
        </div>
        <Shot src="felt" alt="Fiche Qu’avez-vous ressenti ? avec un curseur d’intensité, une note facultative, l’interrupteur Afficher sur la carte et Envoyer" caption="Signaler ce que vous avez ressenti" />
      </div>
      </>
    ),
  },
  {
    slug: 'share', icon: 'ios_share', title: 'Partager un séisme', sub: 'Image, texte et texte alternatif',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Touchez <Ui>Partager</Ui> sur un séisme pour créer une carte de partage : une image avec la carte et les principaux détails.</p>
          <p>La carte de l’image indique aussi des <strong>noms de villes</strong> autour du séisme, dans votre langue, comme dans la vue régionale, là où ils tiennent sans masquer les séismes. En pleine mer, il peut n’y en avoir aucun.</p>
          <p>Là où des personnes ont signalé l’avoir ressenti, la carte de l’image le montre aussi comme dans la vue de la région : de petits carrés aux couleurs d’intensité (gris si l’intensité est inconnue), avec l’échelle d’intensité en bas à droite. La description d’image proposée le mentionne aussi. Si vous avez désactivé <Ui>Cartes des secousses</Ui> dans <Ui>Couches</Ui> de la vue de la région, la carte ne les montre pas non plus.</p>
          <p>Quand un centre d’alerte aux tsunamis a émis un message officiel pour le séisme, l’image affiche son niveau et le centre en haut à gauche de la carte, par exemple <strong>Alerte au tsunami · PTWC</strong>, en couleur tant qu’une alerte, une menace, une veille ou un avis est en vigueur. Le texte de la publication et la description de l’image le mentionnent aussi.</p>
          <ul>
            <li>Le <strong>Texte de la publication</strong> est rempli pour vous (magnitude, lieu, heure, profondeur et un hashtag, avec le lien à la fin), et vous pouvez le modifier.</li>
            <li>La <strong>Description de l&apos;image (texte alternatif)</strong> décrit l’image pour les personnes qui utilisent un lecteur d’écran. Elle est remplie pour vous, et vous pouvez la modifier.</li>
            <li><Ui>Partager l&apos;image</Ui> ouvre la feuille de partage de votre téléphone (dans l’app Android et dans les navigateurs compatibles). Si un navigateur ne peut pas partager d’images, ou si l’image n’a pas pu être créée, <Ui>Partager le lien</Ui> partage à la place le texte de la publication avec son lien. <Ui>Enregistrer l&apos;image</Ui> télécharge l’image, et <Ui>Copier le texte</Ui> et <Ui>Copier le texte alternatif</Ui> copient l’un ou l’autre champ.</li>
          </ul>
          <Callout><p>X, Facebook et Bluesky suppriment souvent le texte qui accompagne une image partagée, et aucun d’eux ne reprend le texte alternatif de cette façon. <strong>Partager l&apos;image copie aussi le texte</strong>, pour que vous puissiez le coller dans la publication. Utilisez <Ui>Copier le texte alternatif</Ui> et collez-le dans le champ de description d’image de l’app. Sur iPhone, si le menu de partage ne s’ouvre pas tout de suite, touchez à nouveau <Ui>Partager l&apos;image</Ui> : le texte est déjà copié.</p></Callout>
        </div>
        <Shot src="share" alt="Fiche de partage avec l’aperçu de la carte de partage, le texte de la publication modifiable et la description de l’image" caption="La fiche de partage" />
      </div>
      </>
    ),
  },
  {
    slug: 'account', icon: 'person', title: 'Votre compte', sub: 'Connexion, mots de passe, suppression',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Allez dans <Ui>Profil</Ui> et touchez <Ui>Se connecter</Ui>. Vous pouvez utiliser Google ou votre e-mail et un mot de passe.</p>
          <h3>Créer un compte avec un e-mail</h3>
          <ol className={s.steps}>
            <li>Touchez <Ui>Créer un compte</Ui> en bas de la fiche de connexion.</li>
            <li>Saisissez votre e-mail et un mot de passe : au moins 8 caractères, avec des lettres et des chiffres. Les mots de passe trouvés dans des fuites de données connues sont refusés.</li>
            <li>Ouvrez l’e-mail de confirmation que nous vous envoyons et touchez le lien. Vous êtes alors connecté. Rien au bout d’une minute ? Regardez dans vos courriers indésirables (spam).</li>
          </ol>
          <h3>Se connecter avec Google</h3>
          <p>Touchez <Ui>Continuer avec Google</Ui>. Dans l’app Android, choisissez votre compte Google dans la liste qui s’affiche. Si votre adresse Google a déjà un compte sisma, Google est ajouté à ce même compte.</p>
          <p>Quand vous créez un compte, <Ui>Continuer avec Google</Ui> est aussi en haut : le compte est créé tout de suite, sans mot de passe ni e-mail de confirmation.</p>
        </div>
        <Shot src="signin" alt="Fiche de connexion : Continuer avec Google, e-mail et mot de passe, Mot de passe oublié ? et Créer un compte" caption="Se connecter" />
      </div>

      <h3 id="password-reset">Mot de passe oublié ? Réinitialisez-le</h3>
      <div className={s.pair}>
        <div>
          <ol className={s.steps}>
            <li>Dans <Ui>Profil</Ui>, touchez <Ui>Se connecter</Ui> et saisissez votre adresse e-mail.</li>
            <li>Touchez <Ui>Mot de passe oublié ?</Ui>. Vous verrez <em>Consultez vos e-mails</em>.</li>
            <li>Ouvrez l’e-mail et touchez le lien. sisma s’ouvre et vous invite à <em>Définir un nouveau mot de passe</em>.</li>
            <li>Saisissez deux fois le nouveau mot de passe et touchez <Ui>Enregistrer</Ui>. Vous êtes connecté.</li>
          </ol>
          <Callout kind="note"><p>Pour protéger votre vie privée, sisma indique toujours avoir envoyé le lien, même si aucun compte n’utilise cette adresse. Si rien n’arrive au bout de quelques minutes, vérifiez vos spams et assurez-vous d’avoir saisi l’adresse utilisée lors de l’inscription.</p></Callout>
        </div>
        <Shot src="forgot" alt="Consultez vos e-mails : nous avons envoyé un lien pour réinitialiser le mot de passe" caption="Après avoir touché Mot de passe oublié ?" />
      </div>

      <h3>Changer votre mot de passe, ou en ajouter un à un compte Google</h3>
      <div className={s.pair}>
        <div>
          <ol className={s.steps}>
            <li>Dans <Ui>Profil</Ui> → <Ui>Compte</Ui>, touchez <Ui>Définir ou changer le mot de passe</Ui>.</li>
            <li>Saisissez deux fois le nouveau mot de passe et touchez <Ui>Enregistrer</Ui>.</li>
          </ol>
          <p>Si vous vous êtes inscrit avec Google, cela ajoute un mot de passe pour que vous puissiez aussi vous connecter avec votre e-mail. Si sisma vous demande d’abord de vous reconnecter, c’est une vérification de sécurité : déconnectez-vous, reconnectez-vous et réessayez.</p>
        </div>
        <Shot src="password" alt="Fiche Définir un nouveau mot de passe avec les champs nouveau mot de passe et confirmation" caption="Définir un nouveau mot de passe" />
      </div>

      <h3>Autres actions sur le compte</h3>
      <div className={s.pair}>
        <div>
          <ul>
            <li><strong>Nom affiché</strong> : <Ui>Profil</Ui> → <Ui>Nom affiché</Ui>. Laissez-le vide pour afficher votre e-mail.</li>
            <li><strong>Se déconnecter</strong> : <Ui>Profil</Ui> → <Ui>Se déconnecter</Ui>. Vos lieux enregistrés restent dans votre compte.</li>
            <li><strong>Changer d’adresse e-mail</strong> : ce n’est pas encore possible dans l’app. Écrivez à <a href={`mailto:${MAIL}`}>{MAIL}</a> depuis votre adresse actuelle.</li>
          </ul>
        </div>
        <Shot src="me" alt="Section Compte dans Profil : aide et assistance, nom affiché, e-mail, mot de passe et déconnexion, avec la suppression du compte dans une carte à part, bordée de rouge" caption="Le compte, en bas de Profil" />
      </div>

      <h3 id="delete-account">Supprimer votre compte</h3>
      <div className={s.pair}>
        <div>
          <ol className={s.steps}>
            <li>Si vous avez sisma+, résiliez-le d’abord (voir <Link href="/help/plus#cancel">Résilier sisma+</Link>). sisma ne supprime pas un compte dont l’abonnement se renouvelle encore.</li>
            <li>Dans <Ui>Profil</Ui>, touchez <Ui>Supprimer le compte</Ui>, puis <Ui>Supprimer définitivement</Ui>.</li>
          </ol>
          <p>Cela supprime définitivement votre compte, vos lieux enregistrés et vos réglages d’alerte. Les témoignages de ressenti que vous avez envoyés sont conservés sans votre nom. Supprimer le compte ne supprime pas l’app Android ; désinstallez-la séparément si vous le souhaitez. Notre <Link href="/privacy#delete">politique de confidentialité</Link> explique ce qu’il advient de vos données.</p>
        </div>
        <Shot src="delete" alt="Fiche Supprimer votre compte ? avec Supprimer définitivement et Annuler" caption="Supprimer un compte" />
      </div>
      </>
    ),
  },
  {
    slug: 'locations', icon: 'location_on', title: 'Lieux enregistrés', sub: 'Les endroits qui comptent pour vous',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Les lieux enregistrés déterminent quels séismes sont les « Proches » et quels endroits vos alertes surveillent.</p>
          <ul>
            <li><strong>Ma position</strong> utilise la position de votre appareil (votre navigateur ou votre téléphone demande d’abord l’autorisation).</li>
            <li><Ui>Ajouter un lieu</Ui> vous permet de rechercher une ville ou un village et de l’enregistrer.</li>
            <li>Touchez un lieu pour l’utiliser pour les distances. Touchez <Ui>×</Ui> pour le supprimer.</li>
            <li>Quand <strong>Ma position</strong> est choisie, sisma utilise votre position chaque fois que votre appareil peut la fournir. S’il ne le peut pas (localisation désactivée ou non autorisée), ou si vous avez choisi un lieu enregistré, sisma utilise ce lieu enregistré : votre lieu par défaut, ou le premier que vous avez enregistré.</li>
            <li>Quand vous êtes connecté, <strong>Ma position</strong> sert aussi pour vos alertes et vos alertes tsunami : sisma garde la dernière position de votre appareil, arrondie à environ 1 km, et l’utilise pendant 30 jours après sa dernière mise à jour.</li>
          </ul>
          <p>La formule gratuite comprend <strong>1 lieu enregistré</strong>, et sisma+ <strong>jusqu’à 10</strong>. Sans compte, les lieux sont conservés sur cet appareil et passent dans votre compte quand vous vous connectez.</p>
        </div>
        <Shot src="addloc" alt="Fiche Ajouter un lieu avec un champ de recherche pour une ville ou un village" caption="Ajouter un lieu" />
      </div>
      </>
    ),
  },
  {
    slug: 'plus', icon: 'workspace_premium', title: 'sisma+', sub: 'Essai, facturation, résiliation',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>sisma est gratuit. sisma+ ajoute :</p>
          <div className={legal.tableWrap}>
            <table style={{ minWidth: 0 }}>
              <thead><tr><th>Fonctionnalité</th><th>Gratuit</th><th>sisma+</th></tr></thead>
              <tbody>
                <tr><td>Fil en direct, carte, globe, science</td><td>✓</td><td>✓</td></tr>
                <tr><td>Alertes officielles de tsunami</td><td>✓</td><td>✓</td></tr>
                <tr><td>Historique des séismes</td><td>30 jours</td><td>Historique complet</td></tr>
                <tr><td>Lieux enregistrés</td><td>1</td><td>Jusqu’à 10</td></tr>
                <tr><td>Alertes push avec vos propres règles</td><td>–</td><td>Jusqu’à 5 alertes</td></tr>
                <tr><td>Filtres de magnitude et de région</td><td>–</td><td>✓</td></tr>
                <tr><td>Graphiques de données sismiques en direct</td><td>–</td><td>✓</td></tr>
                <tr><td>Ruban de feu du Pacifique</td><td>–</td><td>✓</td></tr>
              </tbody>
            </table>
          </div>
          <p>Prix : <strong>{usd(PRICES.yearly.usd)} par an</strong>, une seule formule. Google Play affiche le prix dans votre devise locale. Les nouveaux abonnés bénéficient d’un <strong>essai gratuit de {TRIAL_DAYS} jours</strong>, une fois par compte.</p>
        </div>
        <Shot src="paywall" alt={`Fiche sisma+ avec les fonctionnalités, le prix annuel et Essai gratuit de ${TRIAL_DAYS} jours`} caption="Choisir une formule" />
      </div>

      <h3>S’abonner</h3>
      <ul>
        <li><strong>Sur le site</strong> : <Ui>Profil</Ui> → <Ui>Essai gratuit de {TRIAL_DAYS} jours</Ui> (ou <Ui>S’abonner</Ui>), puis payez sur la page de paiement sécurisée de Stripe. Si vous créez d’abord un compte, le paiement s’ouvre quand vous touchez le lien de l’e-mail de confirmation. À votre retour, sisma affiche <em>Activation de sisma+…</em> pendant quelques secondes, puis <em>Bienvenue dans sisma+</em>.</li>
        <li><strong>Dans l’app Android</strong> : le même bouton ouvre la fiche de paiement de Google Play, où vous pouvez payer avec Google Pay, une carte ou d’autres moyens de paiement Google Play.</li>
      </ul>
      <p>Vous devez être connecté. Votre abonnement fonctionne ensuite partout où vous vous connectez à ce compte, sur le web et dans l’app.</p>

      <h3>Gérer ou changer de formule</h3>
      <div className={s.pair}>
        <div>
          <p>Allez dans <Ui>Profil</Ui> → <Ui>Gérer l’abonnement</Ui> pour voir votre statut, votre formule et la prochaine échéance.</p>
          <ul>
            <li><strong>Acheté sur le site</strong> : <Ui>Gérer la facturation</Ui> ouvre la page de Stripe, où vous pouvez mettre à jour votre carte, consulter vos factures ou résilier.</li>
            <li><strong>Acheté dans l’app Android</strong> : <Ui>Gérer dans Google Play</Ui> ouvre votre abonnement dans Google Play.</li>
          </ul>
          <p>Si sisma a offert sisma+ à votre compte, votre formule indique <Ui>Offert</Ui>. Vous n’avez pas besoin d’abonnement, et vous pouvez résilier celui que vous avez commencé sans perdre sisma+.</p>
        </div>
        <Shot src="subscription" alt="Page de l’abonnement : statut, formule, date de renouvellement et Gérer dans Google Play" caption="Votre abonnement" />
      </div>

      <h3 id="cancel">Résilier sisma+</h3>
      <ol className={s.steps}>
        <li>Ouvrez <Ui>Profil</Ui> → <Ui>Gérer l’abonnement</Ui>.</li>
        <li>Touchez <Ui>Gérer la facturation</Ui> (site) ou <Ui>Gérer dans Google Play</Ui> (app), et résiliez à cet endroit. Dans Google Play, vous pouvez aussi aller dans <em>Paiements et abonnements → Abonnements</em>.</li>
      </ol>
      <p>Vous gardez sisma+ jusqu’à la fin de la période payée. La carte <Ui>Profil</Ui> affiche alors <em>Prend fin le</em> et la date, et après cette date vous repassez en formule gratuite. Si vous résiliez un essai gratuit avant sa fin, vous n’êtes pas débité.</p>
      <Callout kind="note"><p>Désinstaller l’app ou supprimer votre compte sisma ne résilie <strong>pas</strong> un abonnement Google Play. Résiliez-le dans Google Play.</p></Callout>

      <h3>Restaurer un achat</h3>
      <p>Sur un nouveau téléphone ou après avoir réinstallé l’app, connectez-vous au même compte sisma. Si sisma+ n’apparaît pas, ouvrez la fiche sisma+ et touchez <Ui>Restaurer l’achat</Ui>. Cette option n’existe que dans l’app Android et retrouve l’abonnement Google Play sur cet appareil.</p>

      <h3>Remboursements</h3>
      <p>Les achats Google Play suivent les règles de remboursement de Google Play : demandez donc un remboursement via Google Play. Pour les achats sur le site, écrivez à <a href={`mailto:${MAIL}`}>{MAIL}</a>. Nos <Link href="/terms">conditions d’utilisation</Link> donnent le détail.</p>
      </>
    ),
  },
  {
    slug: 'alerts', icon: 'notifications_active', title: 'Alertes', sub: 'Des notifications push sur mesure',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Avec sisma+, sisma envoie une notification push quand un séisme correspond à l’une de vos alertes.</p>
          <ol className={s.steps}>
            <li>Connectez-vous et vérifiez que vous avez sisma+.</li>
            <li>Dans <Ui>Profil</Ui>, activez <Ui>Notifications push</Ui>, ou ouvrez <Ui>Règles d’alerte</Ui> et activez les <em>alertes séisme</em>.</li>
            <li>Sous <em>Envoyer par</em>, touchez <Ui>Activer les notifications sur cet appareil</Ui> et autorisez les notifications quand on vous le demande.</li>
            <li>Touchez <Ui>Ajouter une alerte</Ui> et configurez-la (voir ci-dessous). Vous pouvez en avoir jusqu’à 5.</li>
            <li>Touchez <Ui>Envoyer une alerte de test</Ui> pour vérifier que cet appareil les reçoit.</li>
          </ol>
        </div>
        <Shot src="alerts" alt="Page des alertes avec l’interrupteur, vos alertes (0 sur 5), Ajouter une alerte et Envoyer par" caption="La page des alertes" />
      </div>
      <h3>Configurer une alerte</h3>
      <ul>
        <li><strong>Nom</strong> : par exemple <em>Près de chez moi</em>.</li>
        <li><strong>Magnitude minimale</strong> : vous recevez des alertes pour cette magnitude et tout ce qui est plus fort.</li>
        <li><strong>Surveillance</strong> : vos lieux enregistrés dans un rayon que vous choisissez (100, 250, 500 ou 1 000 km), ou partout dans le monde.</li>
        <li><strong>Autres lieux</strong> : jusqu’à 20 pays ou régions, n’importe où à l’intérieur.</li>
        <li><strong>Heures calmes</strong> : pas d’alertes la nuit, avec la possibilité de laisser passer quand même les séismes forts (magnitude 6 ou plus).</li>
        <li>Un graphique montre combien de séismes des 30 derniers jours auraient déclenché l’alerte, pour vous aider à la régler.</li>
      </ul>
      <p><strong>Surveillance</strong> inclut aussi <strong>Ma position</strong> quand votre appareil partage sa position : voir <Link href="/help/locations">Lieux enregistrés</Link>.</p>
      <p>Les alertes reçues au cours des 30 derniers jours sont listées sous <em>Historique des alertes</em>.</p>
      <h3>Alertes tsunami</h3>
      <p>Les alertes tsunami sont gratuites pour toute personne connectée. Dans <Ui>Profil</Ui>, activez <Ui>Alertes tsunami</Ui> et touchez <Ui>Activer les notifications sur cet appareil</Ui>. Vous recevez une notification quand une alerte, une menace, une veille ou un avis officiel de tsunami est émis pour un séisme à moins de 1 000 km de l’un de vos lieux enregistrés. Les heures calmes ne s’appliquent pas, et chaque niveau n’est envoyé qu’une fois par séisme. Ma position compte aussi, comme pour les autres alertes.</p>
      <Callout kind="note"><p><strong>iPhone et iPad :</strong> les notifications web ne fonctionnent qu’après avoir ajouté sisma à l’écran d’accueil (Partager → Sur l’écran d’accueil) et l’avoir ouvert depuis celui-ci. La première fois que vous ouvrez sisma dans le navigateur d’un iPhone ou d’un iPad, une fenêtre affiche ces étapes ; touchez <Ui>Plus tard</Ui> pour la revoir dans deux semaines ou <Ui>Compris</Ui> pour la masquer.</p></Callout>
      </>
    ),
  },
  {
    slug: 'settings', icon: 'tune', title: 'Réglages', sub: 'Langue, thème, unités',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Vous les trouverez dans <Ui>Profil</Ui>, sous vos lieux :</p>
          <ul>
            <li><strong>Langue</strong> : English, Español, 日本語, Bahasa Indonesia, Türkçe, Italiano, Português, 中文, Français ou Deutsch. Vous pouvez aussi toucher le bouton de langue en haut de n’importe quel onglet.</li>
            <li><strong>Apparence</strong> : suivre votre appareil (Système), Clair ou Sombre.</li>
            <li><strong>Unités</strong> : kilomètres ou miles.</li>
            <li><strong>Marqueurs de la carte</strong> : des épingles avec la magnitude inscrite à l’intérieur, ou des cercles dont la taille dépend de la magnitude. C’est aussi là que se trouve la légende des couleurs.</li>
            <li><strong>Aider à cartographier où les séismes sont ressentis</strong> : active ou désactive le partage anonyme pour la carte des ressentis (voir <Link href="/help/felt">Je l’ai ressenti</Link>).</li>
            <li><strong>Revoir la présentation</strong> relance les étapes d’accueil.</li>
          </ul>
          <p>Quand vous êtes connecté, votre langue et votre apparence sont enregistrées dans votre compte.</p>
        </div>
        <Shot src="me_more" alt="Réglages : langue, apparence, unités, marqueurs de la carte, interrupteur de la carte des ressentis, présentation et sources de données" caption="Les réglages dans Profil" />
      </div>
      </>
    ),
  },
  {
    slug: 'science', icon: 'science', title: 'Science', sub: 'Comment fonctionnent les séismes',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>L’onglet <Ui>Science</Ui> propose huit courts guides illustrés, chacun avec un schéma animé ou un graphique en direct : la tectonique des plaques, les types de failles, les ondes sismiques, la magnitude et l’intensité, la profondeur et les répliques, les tsunamis, comment se préparer, et la ceinture de feu, avec une carte en direct du nombre de séismes récents autour du Pacifique.</p>
          <p>Touchez les boutons sous un schéma pour changer de vue, et le bouton pause pour arrêter l’animation. Les guides suivent votre langue, comme le reste de l’app. Touchez <Ui>Partager</Ui> en haut d’un guide pour l’envoyer à quelqu’un, avec son image, un court résumé et le lien.</p>
          <p>Sous les guides, <Ui>En profondeur</Ui> propose des articles plus longs pour aller plus loin : pourquoi on ne peut pas prédire les séismes, la tectonique des plaques et les failles, l’intérieur de la Terre et les ondes sismiques, les répliques, la magnitude, les séismes profonds, les volcans, les séismes en Italie et le tsunami de 2004 qui a atteint Phuket. Chacun s’ouvre sur une image de son sujet sous le titre, liste ses sources et répond aux questions fréquentes à la fin. Ils sont eux aussi dans votre langue ; la liste des sources reste en anglais.</p>
          <p>Dans <Ui>Données</Ui>, <Ui>Données sismiques</Ui> (sisma+) présente en graphiques les séismes de M4.5+ des 30 derniers jours dans le monde, d’après l’USGS : leur nombre, leurs magnitudes et profondeurs, les régions touchées, l’énergie libérée et le nombre de séismes de M7+ par an depuis 1900. Chaque graphique est accompagné d’une courte explication ; touchez une barre pour lire sa valeur. Sans sisma+, vous voyez les explications et un bouton pour commencer l’essai gratuit. Les couleurs ont un sens : les magnitudes reprennent les couleurs des repères de la carte, les profondeurs celles du mode Profondeur du globe, les régions surtout situées sur la Ceinture de feu sont mises en évidence, et les barres au-dessus de la moyenne sont en corail.</p>
          <p><Ui>Ruban de feu du Pacifique</Ui> (sisma+) déroule la ceinture de feu en une longue bande, de la pointe sud des Andes à la Nouvelle-Zélande, et place les séismes de l’USGS des dernières 24 heures, 7 jours ou 30 jours selon leur distance le long des arcs volcaniques (horizontalement) et leur profondeur (verticalement). Faites défiler latéralement ou zoomez pour le parcourir, choisissez une région pour y aller et touchez un point pour voir le détail du séisme. La couleur des points indique la profondeur et leur taille, la magnitude. Les nouveaux séismes sont recherchés une fois par heure, et la date de publication des données est indiquée. Les triangles au-dessus de la ligne sont des volcans du catalogue du Smithsonian, colorés selon le rapport hebdomadaire d’activité volcanique Smithsonian / USGS (rouge : éruption en cours, orange : nouvelle activité éruptive, ambre : nouvelle agitation) ; touchez-en un pour voir son détail et le rapport. Un triangle blanc indique seulement que le volcan ne figure pas dans le rapport de la semaine, qui ne liste pas tous les volcans actifs. <Ui>Afficher</Ui> active ou masque les séismes et les volcans.</p>
        </div>
        <Shot src="science" alt="Article sur les ondes sismiques avec un schéma animé des ondes P" caption="Un guide scientifique" />
      </div>
      </>
    ),
  },
  {
    slug: 'troubleshooting', icon: 'build', title: 'Dépannage', sub: 'Solutions aux problèmes courants',
    body: (
      <>
      <div className={s.faq}>
        <p className={s.faqGroup}>Position et données</p>
        <Faq q="« Proches » est vide, ou ma position est introuvable">
          <p>sisma a besoin de l’autorisation d’utiliser votre position, ou d’un lieu enregistré.</p>
          <ul>
            <li><strong>Navigateur</strong> : touchez l’icône à côté de l’adresse web, réglez <em>Position</em> sur <em>Autoriser</em>, puis rechargez la page.</li>
            <li><strong>App Android</strong> : Paramètres → Applications → sisma → Autorisations → Position → <em>Autoriser seulement si l’appli est en cours d’utilisation</em>.</li>
            <li>Ou ajoutez un lieu dans <Ui>Profil</Ui> → <Ui>Ajouter un lieu</Ui>.</li>
          </ul>
        </Faq>
        <Faq q="Un séisme manque, ou sa magnitude a changé">
          <p>Les agences publient d’abord des chiffres automatiques, puis les révisent, généralement pendant la première heure. La magnitude, la profondeur et le lieu peuvent tous changer, et certains petits événements sont supprimés. Différentes agences peuvent aussi indiquer des valeurs légèrement différentes ; sisma affiche les chiffres de l’agence régionale quand il les a (JMA au Japon, GeoNet en Nouvelle-Zélande), sinon ceux de l’USGS, puis de l’EMSC. Les très petits séismes (en dessous d’environ magnitude 2,5 hors du Japon et de la Nouvelle-Zélande) ne sont pas inclus.</p>
        </Faq>
        <Faq q="Les heures semblent fausses">
          <p>Les heures sont affichées dans le fuseau horaire de votre appareil. Vérifiez les réglages de date, d’heure et de fuseau horaire de votre appareil.</p>
        </Faq>
        <Faq q="La carte est vide quand je zoome au maximum">
          <p>Les plans au niveau de la rue viennent d’OpenStreetMap et nécessitent une connexion internet. S’ils ne se chargent pas, dézoomez un peu ; les épingles des séismes fonctionnent toujours.</p>
        </Faq>
        <Faq q="L’app indique que je suis hors ligne">
          <p>sisma a besoin d’une connexion pour charger les séismes. Vérifiez le Wi-Fi ou les données mobiles, puis rouvrez l’app.</p>
        </Faq>

        <p className={s.faqGroup}>Connexion</p>
        <Faq q="« E-mail ou mot de passe incorrect. »">
          <p>Vérifiez les fautes de frappe, puis utilisez <Link href="/help/account#password-reset">Mot de passe oublié ?</Link>. Si vous avez créé votre compte avec Google, utilisez <Ui>Continuer avec Google</Ui>, ou ajoutez un mot de passe dans <Ui>Profil</Ui> → <Ui>Définir ou changer le mot de passe</Ui> en étant connecté avec Google.</p>
        </Faq>
        <Faq q="« Confirmez d’abord votre e-mail »">
          <p>Ouvrez l’e-mail de confirmation de sisma et touchez le lien, puis connectez-vous. Vous ne le trouvez pas ? Vérifiez vos spams. S’il n’y est toujours pas, écrivez à <a href={`mailto:${MAIL}`}>{MAIL}</a> depuis cette adresse.</p>
        </Faq>
        <Faq q="L’e-mail de réinitialisation ou de confirmation n’est pas arrivé">
          <p>Attendez quelques minutes et vérifiez vos dossiers spam ou promotions. Assurez-vous d’avoir saisi l’adresse utilisée lors de l’inscription. Pour protéger votre vie privée, sisma indique avoir envoyé un lien de réinitialisation même quand aucun compte n’utilise cette adresse.</p>
        </Faq>
        <Faq q="La connexion avec Google ne fonctionne pas">
          <p>Dans l’app Android, vérifiez que vous êtes connecté à un compte Google sur le téléphone (Paramètres → Mots de passe et comptes) et que les services Google Play sont à jour. Sur le web, autorisez les fenêtres pop-up et la connexion tierce pour sisma.io. Vous pouvez toujours vous connecter avec votre e-mail à la place.</p>
        </Faq>
        <Faq q="« Par sécurité, déconnectez-vous puis reconnectez-vous »">
          <p>Changer de mot de passe nécessite une connexion récente. Touchez <Ui>Se déconnecter</Ui>, reconnectez-vous, puis changez-le.</p>
        </Faq>

        <p className={s.faqGroup}>sisma+ et facturation</p>
        <Faq q="J’ai payé, mais je vois toujours la formule gratuite">
          <ul>
            <li>Attendez une minute, puis fermez et rouvrez sisma. L’activation est généralement immédiate, mais peut prendre quelques minutes.</li>
            <li>Vérifiez que vous êtes connecté au compte avec lequel vous vous êtes abonné.</li>
            <li>App Android : ouvrez la fiche sisma+ et touchez <Ui>Restaurer l’achat</Ui>.</li>
            <li>Ça ne marche toujours pas ? Écrivez à <a href={`mailto:${MAIL}`}>{MAIL}</a> en indiquant l’e-mail de votre compte et, pour Google Play, le numéro de commande (GPA.…) figurant sur votre reçu.</li>
          </ul>
        </Faq>
        <Faq q="« Cet abonnement Google Play appartient à un autre compte sisma. »">
          <p>L’abonnement de ce téléphone a été acheté en étant connecté à un autre compte sisma. Déconnectez-vous et connectez-vous à ce compte-là.</p>
        </Faq>
        <Faq q="Aucun essai gratuit ne m’a été proposé">
          <p>L’essai est réservé aux comptes qui ne se sont jamais abonnés. Dans l’app Android, Google Play n’autorise en outre qu’un essai par compte Google, même avec des comptes sisma différents.</p>
        </Faq>
        <Faq q="« Les abonnements dans l’app ne sont pas encore disponibles » ou « La facturation Google Play n’est pas disponible sur cet appareil »">
          <p>Mettez à jour sisma et l’app Google Play Store, et vérifiez que vous êtes connecté à Google Play. Certains appareils sans Google Play ne permettent pas d’acheter dans l’app. Abonnez-vous plutôt sur <a href="https://sisma.io/app/me">sisma.io</a>, puis connectez-vous au même compte dans l’app.</p>
        </Faq>
        <Faq q="Je n’arrive pas à supprimer mon compte">
          <p>Résiliez d’abord sisma+. Une fois sa fin programmée, vous pouvez supprimer le compte. Voir <Link href="/help/account#delete-account">Supprimer votre compte</Link>.</p>
        </Faq>

        <p className={s.faqGroup}>Alertes et notifications</p>
        <Faq q="Je ne reçois pas d’alertes">
          <ol>
            <li>Vérifiez que vous avez sisma+ et que vous êtes connecté.</li>
            <li>Dans <Ui>Profil</Ui> → <Ui>Règles d’alerte</Ui>, vérifiez que les alertes sont activées et qu’au moins une alerte est activée et comporte des lieux ou des zones.</li>
            <li>Sous <em>Envoyer par</em>, vérifiez que cet appareil est activé, puis touchez <Ui>Envoyer une alerte de test</Ui>.</li>
            <li>Android : Paramètres → Applications → sisma → Notifications doit être autorisé. Les réglages d’économie de batterie peuvent retarder les notifications ; réglez l’utilisation de la batterie de sisma sur <em>Non restreinte</em>.</li>
            <li>Navigateur : les notifications doivent être autorisées pour sisma.io. Sur iPhone et iPad, ouvrez sisma depuis l’écran d’accueil.</li>
            <li>Les heures calmes retiennent les alertes la nuit, sauf si vous laissez passer les séismes forts.</li>
          </ol>
        </Faq>
        <Faq q="Je reçois trop d’alertes">
          <p>Augmentez la magnitude minimale, réduisez la distance, retirez les régions trop larges ou définissez des heures calmes. Le graphique sur 30 jours de chaque alerte montre à quelle fréquence elle se serait déclenchée.</p>
        </Faq>

        <p className={s.faqGroup}>Partage et témoignages</p>
        <Faq q="Il n’y a pas de bouton « Partager l'image »">
          <p>Votre navigateur ne peut pas partager de fichiers. Utilisez <Ui>Enregistrer l&apos;image</Ui> et <Ui>Copier le texte</Ui>, puis publiez-les vous-même. Dans l’app Android, mettez sisma à jour pour obtenir la feuille de partage du système.</p>
        </Faq>
        <Faq q="Le texte n’apparaît pas dans ma publication">
          <p>Beaucoup d’apps suppriment le texte partagé avec une image. sisma l’a copié quand vous avez touché <Ui>Partager l&apos;image</Ui> : collez-le dans la publication.</p>
        </Faq>
        <Faq q="Il n’y a pas de bouton « Je l’ai ressenti »">
          <p>Les témoignages sont ouverts pendant 6 heures après un séisme. Ensuite, le bouton disparaît.</p>
        </Faq>
      </div>
      </>
    ),
  },
  {
    slug: 'contact', icon: 'support_agent', title: 'Contacter l’assistance', sub: 'Toujours bloqué ? Écrivez-nous',
    body: (
      <>
      <div className={s.contact}>
        <span className="ms" aria-hidden="true">mail</span>
        <div style={{ flex: '1 1 260px' }}>
          <p style={{ margin: 0 }}><strong>Besoin d’aide ?</strong> Écrivez-nous en indiquant l’e-mail de votre compte, votre appareil et la version de votre navigateur ou de l’app, et ce que vous avez essayé. Une capture d’écran aide.</p>
        </div>
        <a className={s.mail} href={`mailto:${MAIL}?subject=${encodeURIComponent('sisma help')}`}>{MAIL}</a>
      </div>
      <p>N’envoyez jamais de mot de passe ni de numéro de carte complet. Nous ne vous les demanderons jamais.</p>
      </>
    ),
  },
];
