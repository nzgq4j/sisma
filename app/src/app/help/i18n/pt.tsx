// Help centre, Brazilian Portuguese translation of ../topics.tsx (same structure: see help-i18n.test.ts).
import Link from 'next/link';
import { PRICES, TRIAL_DAYS } from '@/lib/entitlements';
import legal from '../../privacy/privacy.module.css';
import s from '../help.module.css';
import { Callout, Faq, MAIL, MagLegend, Shot, Ui, usd } from '../help-parts';
import type { Hub, Topic } from '../topics';

export const HUB: Hub = {
  lead: 'Tudo o que você precisa para usar o sisma no site e no app para Android, com soluções para os problemas mais comuns.',
  popularH: 'Mais procurados', allH: 'Todos os tópicos', contactQ: 'Não encontrou uma resposta?', contactP: 'Escreva para nós e vamos ajudar.',
  popular: [
    ['/help/account#password-reset', 'lock_reset', 'Redefinir uma senha esquecida'],
    ['/help/felt', 'vibration', 'Informar que você sentiu um terremoto'],
    ['/help/troubleshooting', 'notifications_off', 'Não estou recebendo alertas'],
    ['/help/troubleshooting', 'credit_card', 'Paguei, mas continuo no plano grátis'],
    ['/help/map#region-view', 'zoom_in_map', 'Ver a área em volta de um terremoto'],
    ['/help/share', 'ios_share', 'Compartilhar um terremoto com texto'],
  ],
};

export const TOPICS: Topic[] = [
  {
    slug: 'start', icon: 'rocket_launch', title: 'Primeiros passos', sub: 'O que é o sisma e como funciona',
    body: (
      <>
      <p>
        O sisma mostra terremotos no mundo todo conforme são informados por quatro agências sismológicas: <strong>USGS</strong> (Estados
        Unidos), <strong>EMSC</strong> (Europa e Mediterrâneo), <strong>GeoNet</strong> (Nova Zelândia) e <strong>JMA</strong> (Japão).
        Quando várias agências informam o mesmo terremoto, o sisma mostra ele uma vez só. A lista se atualiza sozinha a cada dois
        minutos, e você pode puxar a lista para baixo para atualizá-la na hora.
      </p>
      <p>Você pode usar o sisma de duas formas, com a mesma conta e a mesma assinatura do sisma+:</p>
      <ul>
        <li><strong>Na web</strong> em <a href="https://sisma.io/app">sisma.io/app</a>, em qualquer celular, tablet ou computador.</li>
        <li><strong>No app para Android</strong>, do Google Play, que acrescenta a tela de compartilhamento do sistema, o seletor de contas do Google e o faturamento do Google Play.</li>
      </ul>
      <p>O app tem cinco abas na parte de baixo (no computador, no menu à esquerda): <Ui>Lista</Ui>, <Ui>Mapa</Ui>, <Ui>Globo</Ui>, <Ui>Ciência</Ui> e <Ui>Perfil</Ui>.</p>
      <p>Você não precisa de conta para ver os terremotos. Uma conta guarda seus locais salvos e suas configurações, e é necessária para o sisma+ e os alertas.</p>
      <Callout kind="warn"><p><strong>O sisma não é um serviço oficial de alerta.</strong> As informações sobre terremotos podem atrasar, ser revisadas ou estar incompletas, e o sisma não emite alertas antecipados de terremoto. Em uma emergência, siga sempre as autoridades locais.</p></Callout>
      </>
    ),
  },
  {
    slug: 'feed', icon: 'format_list_bulleted', title: 'A lista', sub: 'Recentes, próximos e mais fortes',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>A aba <Ui>Lista</Ui> mostra os terremotos recentes. Use o seletor no topo para ordená-los:</p>
          <ul>
            <li><strong>Recentes</strong>: os mais novos primeiro.</li>
            <li><strong>Próximos</strong>: os mais perto da sua localização ou do local salvo escolhido primeiro.</li>
            <li><strong>Mais fortes</strong>: os de maior magnitude primeiro.</li>
          </ul>
          <p>Cada linha mostra a magnitude em um selo colorido, o local com a bandeira do país onde fica ou do qual está perto, há quanto tempo aconteceu, a que distância fica de você e a profundidade. Continue rolando e mais terremotos são adicionados ao chegar ao fim da lista.</p>
          <p>No computador, a lista fica na página <Ui>Visão geral</Ui>, a primeira do menu à esquerda, com um mapa ao lado. Escolha um terremoto na lista ou no mapa e o mapa se aproxima dele, com os nomes das cidades próximas. Ele fica ali quando você fecha o terremoto; <Ui>Redefinir visualização</Ui> mostra o mundo inteiro de novo. Escolha um país ou região em <Ui>Local</Ui>, no canto superior direito, ou toque em um em <Ui>Principais regiões</Ui>, e o mapa se aproxima dos seus terremotos; <Ui>Todos os locais</Ui> mostra o mundo inteiro de novo.</p>
          <h3>Cores de magnitude</h3>
          <p>As mesmas cores são usadas na lista, no mapa e no globo:</p>
          <MagLegend words={{ label: 'Cores de magnitude', magnitude: 'Magnitude {range}', orMore: '{n} ou mais', below: 'abaixo de {n}', to: '{a} a {b}' }} />
          <Callout><p>Abra <Ui>Filtros</Ui> na parte de baixo da lista para escolher o período e refinar a lista. Veja <Link href="/help/map">Mapa e filtros</Link>.</p></Callout>
        </div>
        <Shot src="feed" alt="A lista ordenada por recentes, com selos de magnitude, locais, horários, distâncias e profundidades" caption="A lista, os mais novos primeiro" />
      </div>
      </>
    ),
  },
  {
    slug: 'details', icon: 'info', title: 'Detalhes do terremoto', sub: 'Cada número explicado',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Toque em qualquer terremoto para abrir os detalhes:</p>
          <ul>
            <li><strong>Magnitude</strong> e o tipo dela (por exemplo <em>mww</em>, a magnitude de momento usada para terremotos maiores).</li>
            <li><strong>Profundidade</strong>: a que distância abaixo da superfície ele começou. Terremotos rasos costumam ser sentidos com mais força.</li>
            <li><strong>Data e hora</strong> no fuso horário do seu dispositivo.</li>
            <li><strong>Distância</strong> até você e o <strong>país</strong> (ou “perto de” um país, para eventos no mar).</li>
            <li><strong>Coordenadas</strong> do epicentro.</li>
            <li><strong>Estado da revisão</strong>: valores <em>Automático</em> vêm direto dos instrumentos e costumam mudar na primeira hora; <em>Revisado</em> significa que um sismólogo os conferiu.</li>
            <li><strong>Fonte</strong>: de qual agência são os números mostrados.</li>
          </ul>
          <p>Abaixo dos detalhes:</p>
          <ul>
            <li><Ui>Mostrar região</Ui> abre um mapa aproximado em volta do terremoto com os eventos próximos e, quando houver, o mapa de percepção.</li>
            <li><Ui>Compartilhar</Ui> abre o cartão de compartilhamento (veja <Link href="/help/share">Compartilhar</Link>).</li>
            <li>Se alguém relatou ter sentido o terremoto, você vê quantas pessoas.</li>
          </ul>
          <Callout kind="note"><p><strong>Tsunami:</strong> quando um centro de alerta de tsunami (PTWC, NTWC ou a JMA do Japão) emite uma mensagem oficial para um terremoto, o nível aparece como foi emitido, por exemplo <strong>Alerta de tsunami</strong> ou <strong>Aviso de tsunami</strong>, com o centro, o horário, as costas citadas e <Ui>Ler a mensagem oficial</Ui>. Alertas, ameaças, vigilâncias e avisos aparecem em cor e acrescentam um selo de onda ao marcador do terremoto e um ícone de onda colorido à sua linha; declarações informativas e previsões ficam em cinza. Uma mensagem marcada como <em>Cancelado</em> ou <em>Não está mais em vigor</em> foi retirada ou expirou. Sem mensagem oficial, um grande terremoto sob o mar mostra <em>Grande terremoto sob o mar: confira as informações oficiais sobre tsunami</em>. O sisma repassa essas mensagens e não é um serviço de alertas: siga sempre as autoridades locais.</p></Callout>
        </div>
        <Shot src="detail" alt="Detalhes do terremoto: magnitude, profundidade, data, hora, distância, país, coordenadas, estado da revisão, fonte, Mostrar região e Compartilhar" caption="Os detalhes de um terremoto" />
      </div>
      </>
    ),
  },
  {
    slug: 'map', icon: 'map', title: 'Mapa e filtros', sub: 'Zoom, visão da região, filtros',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>A aba <Ui>Mapa</Ui> mostra os terremotos recentes como alfinetes coloridos pela magnitude, centrados na sua parte do mundo.</p>
          <ul>
            <li><strong>Mova e aproxime</strong> com os dedos ou o mouse, ou com os botões <Ui>+</Ui> e <Ui>−</Ui>. O terceiro botão volta à visão inicial.</li>
            <li><strong>Minha localização</strong> (o quarto botão) aproxima o mapa de onde você está agora. Na primeira vez, o sisma pede acesso à sua localização. Um anel em volta do ponto marca sua posição quando outro local está escolhido em <Ui>Perfil</Ui>; essa escolha continua como está.</li>
            <li>Ao aproximar uma região, aparecem <strong>nomes de cidades</strong>, no seu idioma, para ajudar você a se localizar. As maiores cidades vêm primeiro; os nomes não cobrem os terremotos e dão lugar aos dos mapas de ruas.</li>
            <li>Aproxime bastante e os <strong>mapas de ruas</strong> do OpenStreetMap aparecem aos poucos, para você ver exatamente onde foi um evento.</li>
            <li><strong>Toque em um alfinete</strong> para ver um cartão de resumo e depois em <Ui>Detalhes</Ui> para ver tudo sobre ele.</li>
          </ul>
        </div>
        <Shot src="map" alt="Mapa-múndi com alfinetes de terremotos coloridos pela magnitude" caption="O mapa" />
      </div>
      <h3 id="region-view">Visão da região</h3>
      <div className={s.pair}>
        <div>
          <p><Ui>Mostrar região</Ui> em um terremoto abre uma visão aproximada de cerca de 800 km em volta dele, com um marcador pulsante no evento e rótulos nos terremotos próximos. Toque em <Ui>Voltar ao mapa-múndi</Ui> para voltar.</p>
          <p>A visão da região também é o que abre quando alguém segue um link que você compartilhou.</p>
        </div>
        <Shot src="region" alt="Visão da região: um mapa aproximado em volta de um terremoto com um marcador pulsante e um cartão de resumo" caption="Visão da região" />
      </div>
      <h3>Filtros, camadas e legenda</h3>
      <div className={s.pair}>
        <div>
          <p>Puxe para cima o painel <Ui>Filtros</Ui> na parte de baixo da Lista, do Mapa ou do Globo. Toque uma vez para abri-lo até a metade, outra vez para abri-lo por completo, ou arraste-o.</p>
          <ul>
            <li><strong>Período</strong>: 24 horas, 7 dias ou 30 dias. Um ano inteiro exige o sisma+.</li>
            <li><strong>Magnitude</strong> e <strong>Região</strong> (um país ou uma região oceânica) são filtros do sisma+, marcados com um cadeado no plano grátis.</li>
            <li><strong>Local</strong>: mostra só os terremotos perto de um dos seus locais salvos.</li>
            <li><Ui>Limpar filtros</Ui> volta tudo ao padrão.</li>
          </ul>
          <p>Em <strong>Camadas</strong> você pode mostrar os <strong>limites das placas</strong> tectônicas. O painel também mostra a legenda de magnitude.</p>
          <Callout><p>Escolher uma região também aproxima o mapa dela e gira o globo para mostrá-la de frente.</p></Callout>
        </div>
        <Shot src="filters" alt="Painel de filtros aberto: período, magnitude, região e local" caption="O painel de filtros" />
      </div>
      </>
    ),
  },
  {
    slug: 'globe', icon: 'public', title: 'Globo 3D', sub: 'Gire e veja a profundidade',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>A aba <Ui>Globo</Ui> mostra os mesmos terremotos em uma Terra 3D. Arraste para girar e faça o gesto de pinça ou role para aproximar. Toque em um alfinete para ver o resumo. <Ui>Minha localização</Ui>, abaixo do botão <Ui>−</Ui>, gira o globo até onde você está agora e aproxima (a rotação para, para você continuar à vista).</p>
          <p>Ao aproximar, aparecem <strong>nomes de cidades</strong> no seu idioma, como no mapa, no lado do globo voltado para você, sem cobrir os terremotos nem os botões.</p>
          <p>Nas camadas do painel <Ui>Filtros</Ui>:</p>
          <ul>
            <li><strong>Profundidade</strong> colore cada terremoto pela profundidade e traça uma linha até onde ele começou, para você ver os terremotos profundos sob as zonas de subducção.</li>
            <li><strong>Placas</strong> mostra os limites das placas.</li>
            <li><strong>Girar</strong> faz o globo girar devagar sozinho.</li>
          </ul>
        </div>
        <Shot src="globe" alt="Globo 3D com alfinetes de terremotos em volta do Pacífico" caption="O globo" />
      </div>
      </>
    ),
  },
  {
    slug: 'felt', icon: 'vibration', title: 'Eu senti', sub: 'Relatos e mapas de percepção',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Se você sentiu um terremoto, conte ao sisma. Os relatos ajudam a mostrar onde o tremor foi sentido e com que força.</p>
          <ol className={s.steps}>
            <li>Abra o terremoto. Por até <strong>6 horas</strong> depois que ele aconteceu, você vê <Ui>Eu senti</Ui>.</li>
            <li>Mova o controle deslizante até a força que você sentiu, de <em>Não sentido</em> a <em>Extremo</em>. O selo mostra o nível de intensidade correspondente (MMI).</li>
            <li>Se quiser, acrescente uma observação ou toque em <Ui>Adicionar detalhes</Ui> para dizer onde você estava, quanto tempo durou, o que se mexeu e se houve danos.</li>
            <li>Se aparecer <Ui>Mostrar no mapa</Ui>, deixe ativado para colocar seu relato no mapa, ou desative para que ele seja apenas contado. Ele usa a localização do seu dispositivo ou, se você não a compartilhou, o lugar escolhido em <Ui>Perfil</Ui>, e só aparece quando esse lugar está a menos de 3.000 km do terremoto.</li>
            <li>Toque em <Ui>Enviar relato</Ui>.</li>
          </ol>
          <p>Seu relato é guardado <strong>sem seu nome nem sua conta</strong>. No mapa, a posição é arredondada para cerca de 10 km.</p>
          <p>Os relatos aparecem na visualização da região (<Ui>Mostrar região</Ui>) como pequenos quadrados de cerca de 10 km. Junto com os relatos do USGS e do EMSC descritos abaixo, cada quadrado recebe a cor da intensidade média dos relatos que contém.</p>
          <p>Nos terremotos registrados pelo USGS, a visualização da região também mostra as respostas à pesquisa <strong>Did You Feel It?</strong> do USGS, como quadrados coloridos de cerca de 10 km, uma cor por nível de intensidade.</p>
          <p>Nos terremotos registrados pelo EMSC, também inclui os relatos enviados pelos sites do EMSC e pelo app LastQuake, nos mesmos quadrados. Os dados do EMSC são compartilhados sob a licença CC BY 4.0.</p>
          <p>Para mostrar ou ocultar todos os mapas de tremores de uma vez, toque no botão <Ui>Camadas</Ui> ao lado de <Ui>Voltar ao mapa-múndi</Ui> e use a chave <Ui>Mapas de tremores</Ui>. Sua escolha fica salva neste dispositivo. Em <Ui>Detalhes</Ui> do terremoto, a legenda de tremores mostra o número total de relatos e a maior intensidade, com a escala de cores de intensidade. Os quadrados cinza são áreas do mapa automático onde nenhum relato indica uma intensidade.</p>
          <h3>Mapas de percepção</h3>
          <p>Quando muitas pessoas abrem o sisma logo depois de um terremoto, esse movimento mostra onde ele provavelmente foi sentido. O sisma transforma isso em um <strong>mapa de percepção</strong> anônimo na visão da região. As posições são embaralhadas no seu dispositivo em até 500 m, não levam nenhum identificador de conta ou de dispositivo e só aparecem para áreas de cerca de 10 km com pelo menos 3 pessoas. Você pode desativar isso em <Ui>Perfil</Ui> → <Ui>Ajudar a mapear onde os tremores são sentidos</Ui>.</p>
        </div>
        <Shot src="felt" alt="Tela O que você sentiu? com um controle deslizante de intensidade, uma observação opcional, a chave Mostrar no mapa e Enviar relato" caption="Relatando o que você sentiu" />
      </div>
      </>
    ),
  },
  {
    slug: 'share', icon: 'ios_share', title: 'Compartilhar um terremoto', sub: 'Imagem, texto e texto alternativo',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Toque em <Ui>Compartilhar</Ui> em um terremoto para criar um cartão de compartilhamento: uma imagem com o mapa e os principais detalhes.</p>
          <p>O mapa do cartão também mostra <strong>nomes de cidades</strong> ao redor do terremoto, no seu idioma, como na visão da região, onde cabem sem cobrir os terremotos. Em alto-mar pode não haver nenhum.</p>
          <p>Onde as pessoas relataram ter sentido o terremoto, o mapa do cartão também mostra isso como na visualização da região: pequenos quadrados nas cores de intensidade (cinza quando a intensidade é desconhecida), com a escala de intensidade no canto inferior direito. A descrição de imagem sugerida também menciona isso. Se você desativou <Ui>Mapas de tremores</Ui> em <Ui>Camadas</Ui> na visualização da região, o cartão também não os mostra.</p>
          <p>Quando um centro de alerta de tsunami emitiu uma mensagem oficial para o terremoto, o cartão mostra o nível e o centro no canto superior esquerdo do mapa, por exemplo <strong>Alerta de tsunami · PTWC</strong>, em cor enquanto um alerta, ameaça, vigilância ou aviso estiver em vigor. O texto da publicação e a descrição da imagem também incluem essa informação.</p>
          <ul>
            <li>O <strong>texto da publicação</strong> já vem preenchido (magnitude, local, horário, profundidade e uma hashtag, com o link no final), e você pode editá-lo.</li>
            <li>A <strong>descrição da imagem (texto alternativo)</strong> descreve a imagem para quem usa leitor de tela. Ela já vem preenchida, e você pode editá-la.</li>
            <li><Ui>Partilhar imagem</Ui> abre a tela de compartilhamento do celular (no app para Android e nos navegadores compatíveis). Quando o navegador não consegue compartilhar imagens, ou a imagem não pôde ser criada, <Ui>Compartilhar link</Ui> compartilha o texto da publicação com o link. <Ui>Guardar imagem</Ui> baixa a imagem, e <Ui>Copiar texto</Ui> e <Ui>Copiar texto alternativo</Ui> copiam cada um dos campos.</li>
          </ul>
          <Callout><p>X, Facebook e Bluesky muitas vezes descartam o texto que acompanha uma imagem compartilhada, e nenhum deles recebe o texto alternativo dessa forma. <strong>Partilhar imagem também copia o texto</strong>, para você colar na publicação. Use <Ui>Copiar texto alternativo</Ui> e cole no campo de descrição da imagem do app. No iPhone, se o menu de partilha não abrir logo, toque de novo em <Ui>Partilhar imagem</Ui>: o texto já está copiado.</p></Callout>
        </div>
        <Shot src="share" alt="Tela de compartilhamento com a prévia do cartão, o texto da publicação editável e a descrição da imagem" caption="A tela de compartilhamento" />
      </div>
      </>
    ),
  },
  {
    slug: 'account', icon: 'person', title: 'Sua conta', sub: 'Entrar, senhas, excluir',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Vá em <Ui>Perfil</Ui> e toque em <Ui>Entrar</Ui>. Você pode usar o Google ou seu e-mail e uma senha.</p>
          <h3>Criar uma conta com e-mail</h3>
          <ol className={s.steps}>
            <li>Toque em <Ui>Criar uma conta</Ui> na parte de baixo da tela de entrada.</li>
            <li>Digite seu e-mail e uma senha: pelo menos 8 caracteres, com letras e números. Senhas encontradas em vazamentos de dados conhecidos são recusadas.</li>
            <li>Abra o e-mail de confirmação que enviamos e toque no link. Pronto, você já está conectado. Não chegou em um minuto? Confira a pasta de spam ou lixo eletrônico.</li>
          </ol>
          <h3>Entrar com o Google</h3>
          <p>Toque em <Ui>Continuar com o Google</Ui>. No app para Android, escolha sua conta do Google na lista que aparece. Se o seu e-mail do Google já tiver uma conta no sisma, o Google é adicionado a essa mesma conta.</p>
          <p>Ao criar uma conta, <Ui>Continuar com o Google</Ui> também aparece no topo: a conta é criada na hora, sem senha nem e-mail de confirmação.</p>
        </div>
        <Shot src="signin" alt="Tela de entrada: Continuar com o Google, e-mail e senha, Esqueceu a senha? e Criar uma conta" caption="Entrando" />
      </div>

      <h3 id="password-reset">Esqueceu a senha? Redefina</h3>
      <div className={s.pair}>
        <div>
          <ol className={s.steps}>
            <li>Em <Ui>Perfil</Ui>, toque em <Ui>Entrar</Ui> e digite seu endereço de e-mail.</li>
            <li>Toque em <Ui>Esqueceu a senha?</Ui>. Você vê <em>Confira seu e-mail</em>.</li>
            <li>Abra o e-mail e toque no link. O sisma abre e pede para você <em>Definir nova senha</em>.</li>
            <li>Digite a nova senha duas vezes e toque em <Ui>Salvar</Ui>. Você entra na conta.</li>
          </ol>
          <Callout kind="note"><p>Para proteger sua privacidade, o sisma sempre diz que enviou o link, mesmo que nenhuma conta use esse endereço. Se nada chegar em alguns minutos, confira a pasta de spam e verifique se digitou o endereço com que se cadastrou.</p></Callout>
        </div>
        <Shot src="forgot" alt="Confira seu e-mail: enviamos um link para redefinir a senha" caption="Depois de tocar em Esqueceu a senha?" />
      </div>

      <h3>Alterar a senha ou adicionar uma a uma conta do Google</h3>
      <div className={s.pair}>
        <div>
          <ol className={s.steps}>
            <li>Em <Ui>Perfil</Ui> → <Ui>Conta</Ui>, toque em <Ui>Definir ou alterar senha</Ui>.</li>
            <li>Digite a nova senha duas vezes e toque em <Ui>Salvar</Ui>.</li>
          </ol>
          <p>Se você se cadastrou com o Google, isso adiciona uma senha para você também poder entrar com seu e-mail. Se o sisma pedir que você entre de novo antes, é uma verificação de segurança: saia, entre novamente e tente outra vez.</p>
        </div>
        <Shot src="password" alt="Tela Definir nova senha com os campos de nova senha e confirmação" caption="Definindo uma nova senha" />
      </div>

      <h3>Outras tarefas da conta</h3>
      <div className={s.pair}>
        <div>
          <ul>
            <li><strong>Nome de exibição</strong>: <Ui>Perfil</Ui> → <Ui>Nome de exibição</Ui>. Deixe em branco para mostrar seu e-mail.</li>
            <li><strong>Sair</strong>: <Ui>Perfil</Ui> → <Ui>Sair</Ui>. Seus locais salvos continuam na sua conta.</li>
            <li><strong>Alterar seu endereço de e-mail</strong>: ainda não é possível no app. Escreva para <a href={`mailto:${MAIL}`}>{MAIL}</a> a partir do seu endereço atual.</li>
          </ul>
        </div>
        <Shot src="me" alt="Seção Conta em Perfil: nome de exibição, e-mail, senha, sair, ajuda e suporte, e excluir conta" caption="Conta, no fim de Perfil" />
      </div>

      <h3 id="delete-account">Excluir sua conta</h3>
      <div className={s.pair}>
        <div>
          <ol className={s.steps}>
            <li>Se você tem o sisma+, cancele primeiro (veja <Link href="/help/plus#cancel">Cancelar o sisma+</Link>). O sisma não exclui uma conta com uma assinatura que ainda está sendo renovada.</li>
            <li>Em <Ui>Perfil</Ui>, toque em <Ui>Excluir conta</Ui> e depois em <Ui>Excluir permanentemente</Ui>.</li>
          </ol>
          <p>Isso remove de forma permanente sua conta, seus locais salvos e suas configurações de alerta. Os relatos de percepção que você enviou são mantidos sem seu nome. Excluir a conta não remove o app para Android; desinstale-o separadamente se quiser. Nossa <Link href="/privacy#delete">política de privacidade</Link> explica o que acontece com seus dados.</p>
        </div>
        <Shot src="delete" alt="Tela Excluir sua conta? com Excluir permanentemente e Cancelar" caption="Excluindo uma conta" />
      </div>
      </>
    ),
  },
  {
    slug: 'locations', icon: 'location_on', title: 'Locais salvos', sub: 'Os lugares que importam para você',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Os locais salvos definem quais terremotos são os “próximos” e quais lugares seus alertas monitoram.</p>
          <ul>
            <li><strong>Minha localização</strong> usa a posição do seu dispositivo (o navegador ou o celular pede permissão antes).</li>
            <li><Ui>Adicionar local</Ui> permite buscar uma cidade e salvá-la.</li>
            <li>Toque em um local para usá-lo no cálculo das distâncias. Toque em <Ui>×</Ui> para removê-lo.</li>
            <li>Quando <strong>Minha localização</strong> está escolhida, o sisma usa sua posição sempre que o dispositivo consegue informá-la. Se não conseguir (localização desativada ou não permitida), ou se você escolheu um local salvo, o sisma usa esse local salvo: seu local padrão ou o primeiro que você salvou.</li>
            <li>Quando você está conectado, <strong>Minha localização</strong> também é usada nos seus alertas e alertas de tsunami: o sisma guarda a última posição do seu dispositivo, arredondada para cerca de 1 km, e a usa por 30 dias após a última atualização.</li>
          </ul>
          <p>O plano grátis tem <strong>1 local salvo</strong>, e o sisma+ tem <strong>até 10</strong>. Sem conta, os locais ficam guardados neste dispositivo e passam para sua conta quando você entra.</p>
        </div>
        <Shot src="addloc" alt="Tela Adicionar local com uma caixa de busca para uma cidade" caption="Adicionando um local" />
      </div>
      </>
    ),
  },
  {
    slug: 'plus', icon: 'workspace_premium', title: 'sisma+', sub: 'Teste, cobrança, cancelamento',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>O sisma é grátis. O sisma+ acrescenta:</p>
          <div className={legal.tableWrap}>
            <table style={{ minWidth: 0 }}>
              <thead><tr><th>Recurso</th><th>Grátis</th><th>sisma+</th></tr></thead>
              <tbody>
                <tr><td>Lista ao vivo, mapa, globo, ciência</td><td>✓</td><td>✓</td></tr>
                <tr><td>Alertas oficiais de tsunami</td><td>✓</td><td>✓</td></tr>
                <tr><td>Histórico de terremotos</td><td>30 dias</td><td>Histórico completo</td></tr>
                <tr><td>Locais salvos</td><td>1</td><td>Até 10</td></tr>
                <tr><td>Alertas push com suas próprias regras</td><td>–</td><td>Até 5 alertas</td></tr>
                <tr><td>Filtros de magnitude e região</td><td>–</td><td>✓</td></tr>
                <tr><td>Gráficos de dados sísmicos ao vivo</td><td>–</td><td>✓</td></tr>
              </tbody>
            </table>
          </div>
          <p>Preço: <strong>{usd(PRICES.yearly.usd)} por ano</strong>, um único plano. O Google Play mostra o preço na sua moeda local. Novos assinantes ganham um <strong>teste grátis de {TRIAL_DAYS} dias</strong>, uma vez por conta.</p>
        </div>
        <Shot src="paywall" alt={`Tela do sisma+ com os recursos, o preço anual e Começar teste grátis de ${TRIAL_DAYS} dias`} caption="Escolhendo um plano" />
      </div>

      <h3>Assinar</h3>
      <ul>
        <li><strong>No site</strong>: <Ui>Perfil</Ui> → <Ui>Começar teste grátis de {TRIAL_DAYS} dias</Ui> (ou <Ui>Assinar</Ui>) e depois pague na página de pagamento segura da Stripe. Se você criar uma conta antes, o pagamento abre quando você toca no link do e-mail de confirmação. Quando você volta, o sisma mostra <em>Ativando o sisma+…</em> por alguns segundos e depois <em>Boas-vindas ao sisma+</em>.</li>
        <li><strong>No app para Android</strong>: o mesmo botão abre a tela de pagamento do Google Play, onde você pode pagar com Google Pay, cartão ou outras formas de pagamento do Google Play.</li>
      </ul>
      <p>Você precisa estar conectado. Sua assinatura passa a valer em todo lugar onde você entrar nessa conta, na web e no app.</p>

      <h3>Gerenciar ou mudar de plano</h3>
      <div className={s.pair}>
        <div>
          <p>Vá em <Ui>Perfil</Ui> → <Ui>Gerenciar assinatura</Ui> para ver o status, o plano e a próxima data.</p>
          <ul>
            <li><strong>Comprado no site</strong>: <Ui>Gerenciar cobrança</Ui> abre a página da Stripe, onde você pode atualizar o cartão, ver faturas ou cancelar.</li>
            <li><strong>Comprado no app para Android</strong>: <Ui>Gerenciar no Google Play</Ui> abre sua assinatura no Google Play.</li>
          </ul>
          <p>Se o sisma deu o sisma+ de graça para sua conta, seu plano mostra <Ui>Cortesia</Ui>. Você não precisa de assinatura e pode cancelar a que começou sem perder o sisma+.</p>
        </div>
        <Shot src="subscription" alt="Página da assinatura: status, plano, data de renovação e Gerenciar no Google Play" caption="Sua assinatura" />
      </div>

      <h3 id="cancel">Cancelar o sisma+</h3>
      <ol className={s.steps}>
        <li>Abra <Ui>Perfil</Ui> → <Ui>Gerenciar assinatura</Ui>.</li>
        <li>Toque em <Ui>Gerenciar cobrança</Ui> (site) ou <Ui>Gerenciar no Google Play</Ui> (app) e cancele por lá. No Google Play, você também pode ir em <em>Pagamentos e assinaturas → Assinaturas</em>.</li>
      </ol>
      <p>Você continua com o sisma+ até o fim do período já pago. O cartão em <Ui>Perfil</Ui> passa a mostrar <em>Termina em</em> e a data, e depois dessa data você volta ao plano grátis. Se você cancelar um teste grátis antes do fim, não há cobrança.</p>
      <Callout kind="note"><p>Desinstalar o app ou excluir sua conta do sisma <strong>não</strong> cancela uma assinatura do Google Play. Cancele no Google Play.</p></Callout>

      <h3>Restaurar uma compra</h3>
      <p>Em um celular novo ou depois de reinstalar o app, entre na mesma conta do sisma. Se o sisma+ não aparecer, abra a tela do sisma+ e toque em <Ui>Restaurar compra</Ui>. Isso existe só no app para Android e encontra a assinatura do Google Play neste dispositivo.</p>

      <h3>Reembolsos</h3>
      <p>As compras no Google Play seguem as políticas de reembolso do Google Play, então peça o reembolso pelo Google Play. Para compras no site, escreva para <a href={`mailto:${MAIL}`}>{MAIL}</a>. Nossos <Link href="/terms">termos de serviço</Link> explicam os detalhes.</p>
      </>
    ),
  },
  {
    slug: 'alerts', icon: 'notifications_active', title: 'Alertas', sub: 'Notificações push do seu jeito',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Com o sisma+, o sisma envia uma notificação push quando um terremoto corresponde a um dos seus alertas.</p>
          <ol className={s.steps}>
            <li>Entre na sua conta e confirme que você tem o sisma+.</li>
            <li>Em <Ui>Perfil</Ui>, ative <Ui>Notificações push</Ui> ou abra <Ui>Regras de alerta</Ui> e ative os <em>Alertas de terremoto</em>.</li>
            <li>Em <em>Enviar por</em>, toque em <Ui>Ativar notificações neste dispositivo</Ui> e permita as notificações quando for solicitado.</li>
            <li>Toque em <Ui>Adicionar um alerta</Ui> e configure-o (veja abaixo). Você pode ter até 5.</li>
            <li>Toque em <Ui>Enviar alerta de teste</Ui> para verificar se este dispositivo os recebe.</li>
          </ol>
        </div>
        <Shot src="alerts" alt="Página de alertas com o botão de ativar e desativar, seus alertas (0 de 5), Adicionar um alerta e Enviar por" caption="A página de alertas" />
      </div>
      <h3>Configurar um alerta</h3>
      <ul>
        <li><strong>Nome</strong>: por exemplo <em>Perto de casa</em>.</li>
        <li><strong>Magnitude mínima</strong>: você recebe alertas para essa magnitude e para qualquer uma mais forte.</li>
        <li><strong>Monitorando</strong>: seus locais salvos dentro de uma distância que você escolhe (100, 250, 500 ou 1.000 km), ou qualquer lugar do mundo.</li>
        <li><strong>Outros locais</strong>: até 20 países ou regiões, em qualquer ponto dentro deles.</li>
        <li><strong>Horário de silêncio</strong>: nenhum alerta durante a noite, com a opção de ainda deixar passar terremotos fortes (magnitude 6 ou mais).</li>
        <li>Um gráfico mostra quantos terremotos dos últimos 30 dias teriam acionado o alerta, para você ajustá-lo.</li>
      </ul>
      <p><strong>Monitorando</strong> também inclui <strong>Minha localização</strong> quando seu dispositivo compartilha a posição: veja <Link href="/help/locations">Locais salvos</Link>.</p>
      <p>Os alertas que você recebeu nos últimos 30 dias aparecem em <em>Histórico de alertas</em>.</p>
      <h3>Alertas de tsunami</h3>
      <p>Os alertas de tsunami são grátis para quem está conectado. Em <Ui>Perfil</Ui>, ative <Ui>Alertas de tsunami</Ui> e toque em <Ui>Ativar notificações neste dispositivo</Ui>. Você recebe uma notificação quando um alerta, ameaça, vigilância ou aviso oficial de tsunami é emitido para um terremoto a até 1.000 km de um dos seus locais salvos. O horário de silêncio não se aplica, e cada nível é enviado uma única vez por terremoto. Minha localização também conta, como nos outros alertas.</p>
      <Callout kind="note"><p><strong>iPhone e iPad:</strong> as notificações da web só funcionam depois que você adiciona o sisma à Tela de Início (Compartilhar → Adicionar à Tela de Início) e o abre por lá. Na primeira vez que você abre o sisma no navegador de um iPhone ou iPad, uma janela mostra estas etapas; toque em <Ui>Agora não</Ui> para vê-la de novo em duas semanas ou em <Ui>Entendi</Ui> para ocultá-la.</p></Callout>
      </>
    ),
  },
  {
    slug: 'settings', icon: 'tune', title: 'Configurações', sub: 'Idioma, tema, unidades',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>Você encontra essas opções em <Ui>Perfil</Ui>, abaixo dos seus locais:</p>
          <ul>
            <li><strong>Idioma</strong>: English, Español, 日本語, Bahasa Indonesia, Türkçe, Italiano, Português, 中文, Français ou Deutsch. Você também pode tocar no botão de idioma no topo de qualquer aba.</li>
            <li><strong>Aparência</strong>: seguir o dispositivo (Sistema), Claro ou Escuro.</li>
            <li><strong>Unidades</strong>: quilômetros ou milhas.</li>
            <li><strong>Marcadores do mapa</strong>: alfinetes com a magnitude escrita dentro, ou círculos com tamanho conforme a magnitude. É aqui também que fica a legenda de cores.</li>
            <li><strong>Ajudar a mapear onde os tremores são sentidos</strong>: ativa ou desativa o compartilhamento anônimo para o mapa de percepção (veja <Link href="/help/felt">Eu senti</Link>).</li>
            <li><strong>Ver a introdução</strong> mostra de novo as etapas de boas-vindas.</li>
          </ul>
          <p>Quando você está conectado, seu idioma e sua aparência ficam salvos na sua conta.</p>
        </div>
        <Shot src="me_more" alt="Configurações: idioma, aparência, unidades, marcadores do mapa, botão do mapa de percepção, introdução e fontes de dados" caption="Configurações em Perfil" />
      </div>
      </>
    ),
  },
  {
    slug: 'science', icon: 'science', title: 'Ciência', sub: 'Como os terremotos funcionam',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>A aba <Ui>Ciência</Ui> tem oito guias curtos e ilustrados, cada um com um diagrama animado ou um gráfico ao vivo: tectônica de placas, tipos de falha, ondas sísmicas, magnitude e intensidade, profundidade e réplicas, tsunamis, como se preparar e o Círculo de Fogo, com um mapa ao vivo de quantos terremotos recentes atingiram a região em volta do Pacífico.</p>
          <p>Toque nos botões abaixo de um diagrama para mudar de visualização e no botão de pausa para parar a animação. Os guias seguem o seu idioma, como o resto do app. Toque em <Ui>Compartilhar</Ui> no topo de um guia para enviá-lo a alguém, com a imagem, um breve resumo e o link.</p>
          <p>Abaixo dos guias, <Ui>Em profundidade</Ui> traz artigos mais longos para quando você quiser ir além: por que os terremotos não podem ser previstos, tectônica de placas e subducção, falhas e tensão, o interior da Terra e as ondas sísmicas, réplicas e riscos sísmicos, por que um bairro sofre mais danos que o vizinho, e como funcionam as escalas de magnitude e por que o número muda depois de um terremoto. Cada um lista suas fontes e responde a perguntas comuns no final. Eles também estão no seu idioma; a lista de fontes continua em inglês.</p>
          <p>Em <Ui>Dados</Ui>, <Ui>Dados sísmicos</Ui> (sisma+) mostra em gráficos os terremotos de M4.5+ dos últimos 30 dias no mundo todo, segundo o USGS: quantos ocorreram, suas magnitudes e profundidades, as regiões atingidas, a energia liberada e o número de terremotos de M7+ por ano desde 1900. Cada gráfico tem uma breve explicação; toque em uma barra para ver o valor. Sem o sisma+, você vê as explicações e um botão para começar o teste gratuito. As cores têm significado: as magnitudes usam as cores dos marcadores do mapa, as profundidades as do modo Profundidade do globo, as regiões principalmente no Círculo de Fogo ficam destacadas e as barras acima da média aparecem em coral.</p>
        </div>
        <Shot src="science" alt="Artigo sobre ondas sísmicas com um diagrama animado de ondas P" caption="Um guia de ciência" />
      </div>
      </>
    ),
  },
  {
    slug: 'troubleshooting', icon: 'build', title: 'Solução de problemas', sub: 'Soluções para problemas comuns',
    body: (
      <>
      <div className={s.faq}>
        <p className={s.faqGroup}>Localização e dados</p>
        <Faq q="“Próximos” está vazio, ou minha localização não é encontrada">
          <p>O sisma precisa de permissão para usar sua localização, ou de um local salvo.</p>
          <ul>
            <li><strong>Navegador</strong>: toque no ícone ao lado do endereço do site, defina <em>Localização</em> como <em>Permitir</em> e recarregue a página.</li>
            <li><strong>App para Android</strong>: Configurações → Apps → sisma → Permissões → Localização → <em>Permitir apenas durante o uso do app</em>.</li>
            <li>Ou adicione um local em <Ui>Perfil</Ui> → <Ui>Adicionar local</Ui>.</li>
          </ul>
        </Faq>
        <Faq q="Um terremoto sumiu, ou a magnitude dele mudou">
          <p>As agências primeiro publicam números automáticos e depois os revisam, geralmente na primeira hora. A magnitude, a profundidade e o local podem mudar, e alguns eventos pequenos são apagados. Agências diferentes também podem informar valores um pouco diferentes; o sisma mostra os números da agência regional quando os tem (JMA no Japão, GeoNet na Nova Zelândia), senão os do USGS e, depois, os do EMSC. Terremotos muito pequenos (abaixo de cerca de magnitude 2,5 fora do Japão e da Nova Zelândia) não são incluídos.</p>
        </Faq>
        <Faq q="Os horários parecem errados">
          <p>Os horários aparecem no fuso horário do seu dispositivo. Confira as configurações de data, hora e fuso horário do dispositivo.</p>
        </Faq>
        <Faq q="O mapa fica em branco quando aproximo muito">
          <p>Os mapas de ruas vêm do OpenStreetMap e precisam de conexão com a internet. Se não carregarem, afaste um pouco; os alfinetes dos terremotos continuam funcionando.</p>
        </Faq>
        <Faq q="O app diz que estou off-line">
          <p>O sisma precisa de conexão para carregar os terremotos. Verifique o Wi-Fi ou os dados móveis e abra o app de novo.</p>
        </Faq>

        <p className={s.faqGroup}>Entrar na conta</p>
        <Faq q="“E-mail ou senha incorretos”">
          <p>Verifique se não há erros de digitação e depois use <Link href="/help/account#password-reset">Esqueceu a senha?</Link>. Se você criou sua conta com o Google, use <Ui>Continuar com o Google</Ui> ou adicione uma senha em <Ui>Perfil</Ui> → <Ui>Definir ou alterar senha</Ui> enquanto estiver conectado com o Google.</p>
        </Faq>
        <Faq q="“Confirme seu e-mail primeiro”">
          <p>Abra o e-mail de confirmação do sisma, toque no link e depois entre. Não encontrou? Confira a pasta de spam. Se ainda assim não estiver lá, escreva para <a href={`mailto:${MAIL}`}>{MAIL}</a> a partir desse endereço.</p>
        </Faq>
        <Faq q="O e-mail de redefinição ou de confirmação não chegou">
          <p>Espere alguns minutos e confira a pasta de spam ou de promoções. Verifique se digitou o endereço com que se cadastrou. Para proteger sua privacidade, o sisma diz que enviou um link de redefinição mesmo quando nenhuma conta usa esse endereço.</p>
        </Faq>
        <Faq q="Entrar com o Google não funciona">
          <p>No app para Android, verifique se há uma conta do Google conectada no celular (Configurações → Senhas e contas) e se o Google Play Services está atualizado. Na web, permita pop-ups e o login de terceiros para sisma.io. Você sempre pode entrar com o e-mail.</p>
        </Faq>
        <Faq q="“Por segurança, saia e entre novamente”">
          <p>Para alterar a senha, é preciso ter entrado recentemente. Toque em <Ui>Sair</Ui>, entre de novo e depois altere a senha.</p>
        </Faq>

        <p className={s.faqGroup}>sisma+ e cobrança</p>
        <Faq q="Paguei, mas ainda vejo o plano grátis">
          <ul>
            <li>Espere um minuto, depois feche e abra o sisma de novo. A ativação costuma ser imediata, mas pode levar alguns minutos.</li>
            <li>Verifique se você está conectado à conta com que assinou.</li>
            <li>App para Android: abra a tela do sisma+ e toque em <Ui>Restaurar compra</Ui>.</li>
            <li>Ainda não funcionou? Escreva para <a href={`mailto:${MAIL}`}>{MAIL}</a> com o e-mail da sua conta e, no caso do Google Play, o número do pedido (GPA.…) que está no recibo.</li>
          </ul>
        </Faq>
        <Faq q="“Esta assinatura do Google Play pertence a outra conta do sisma”">
          <p>A assinatura deste celular foi comprada com outra conta do sisma conectada. Saia e entre nessa outra conta.</p>
        </Faq>
        <Faq q="Não apareceu o teste grátis">
          <p>O teste é para contas que nunca assinaram. No app para Android, o Google Play também permite só um teste por conta do Google, mesmo em contas diferentes do sisma.</p>
        </Faq>
        <Faq q="“As assinaturas no app ainda não estão disponíveis” ou “O faturamento do Google Play não está disponível neste dispositivo”">
          <p>Atualize o sisma e o app da Google Play Store e verifique se você está conectado ao Google Play. Alguns dispositivos sem Google Play não conseguem fazer compras no app. Nesse caso, assine em <a href="https://sisma.io/app/me">sisma.io</a> e entre na mesma conta no app.</p>
        </Faq>
        <Faq q="Não consigo excluir minha conta">
          <p>Cancele o sisma+ primeiro. Assim que ele estiver programado para terminar, você pode excluir a conta. Veja <Link href="/help/account#delete-account">Excluir sua conta</Link>.</p>
        </Faq>

        <p className={s.faqGroup}>Alertas e notificações</p>
        <Faq q="Não estou recebendo alertas">
          <ol>
            <li>Verifique se você tem o sisma+ e está conectado.</li>
            <li>Em <Ui>Perfil</Ui> → <Ui>Regras de alerta</Ui>, verifique se os alertas estão ativados e se pelo menos um alerta está ativado e tem locais ou áreas.</li>
            <li>Em <em>Enviar por</em>, verifique se este dispositivo está ativado e toque em <Ui>Enviar alerta de teste</Ui>.</li>
            <li>Android: em Configurações → Apps → sisma → Notificações, as notificações precisam estar permitidas. As configurações de economia de bateria podem atrasar as notificações; defina o uso de bateria do sisma como <em>Sem restrições</em>.</li>
            <li>Navegador: as notificações precisam estar permitidas para sisma.io. No iPhone e no iPad, abra o sisma pela Tela de Início.</li>
            <li>O horário de silêncio segura os alertas à noite, a menos que você deixe passar os terremotos fortes.</li>
          </ol>
        </Faq>
        <Faq q="Recebo alertas demais">
          <p>Aumente a magnitude mínima, reduza a distância, remova regiões amplas ou defina um horário de silêncio. O gráfico de 30 dias em cada alerta mostra com que frequência ele teria disparado.</p>
        </Faq>

        <p className={s.faqGroup}>Compartilhamento e relatos</p>
        <Faq q="Não aparece o botão “Partilhar imagem”">
          <p>Seu navegador não consegue compartilhar arquivos. Use <Ui>Guardar imagem</Ui> e <Ui>Copiar texto</Ui> e depois publique você mesmo. No app para Android, atualize o sisma para ter a tela de compartilhamento do sistema.</p>
        </Faq>
        <Faq q="O texto não apareceu na minha publicação">
          <p>Muitos apps descartam o texto compartilhado junto com uma imagem. O sisma copiou o texto quando você tocou em <Ui>Partilhar imagem</Ui>, então é só colar na publicação.</p>
        </Faq>
        <Faq q="Não aparece o botão “Eu senti”">
          <p>Os relatos ficam abertos por 6 horas depois de um terremoto. Depois disso, o botão desaparece.</p>
        </Faq>
      </div>
      </>
    ),
  },
  {
    slug: 'contact', icon: 'support_agent', title: 'Falar com o suporte', sub: 'Ainda com dúvidas? Escreva para nós',
    body: (
      <>
      <div className={s.contact}>
        <span className="ms" aria-hidden="true">mail</span>
        <div style={{ flex: '1 1 260px' }}>
          <p style={{ margin: 0 }}><strong>Ainda precisa de ajuda?</strong> Escreva para nós e informe o e-mail da sua conta, seu dispositivo e a versão do navegador ou do app, e o que você já tentou. Uma captura de tela ajuda.</p>
        </div>
        <a className={s.mail} href={`mailto:${MAIL}?subject=${encodeURIComponent('sisma help')}`}>{MAIL}</a>
      </div>
      <p>Não envie senhas nem números completos de cartão. Nunca vamos pedir essas informações.</p>
      </>
    ),
  },
];
