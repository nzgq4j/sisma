// Help centre, Simplified Chinese translation of ../topics.tsx (same structure: see help-i18n.test.ts).
import Link from 'next/link';
import { PRICES, TRIAL_DAYS } from '@/lib/entitlements';
import legal from '../../privacy/privacy.module.css';
import s from '../help.module.css';
import { Callout, Faq, MAIL, MagLegend, Shot, Ui, usd } from '../help-parts';
import type { Hub, Topic } from '../topics';

export const HUB: Hub = {
  lead: '在网站和 Android 应用中使用 sisma 所需的一切，以及最常见问题的解决方法。',
  popularH: '热门', allH: '全部主题', contactQ: '没找到答案？', contactP: '给我们写信，我们会帮你。',
  popular: [
    ['/help/account#password-reset', 'lock_reset', '重置忘记的密码'],
    ['/help/felt', 'vibration', '报告你感觉到了地震'],
    ['/help/troubleshooting', 'notifications_off', '收不到提醒'],
    ['/help/troubleshooting', 'credit_card', '已付款但仍是免费版'],
    ['/help/map#region-view', 'zoom_in_map', '查看地震周边区域'],
    ['/help/share', 'ios_share', '分享地震并附上文字'],
  ],
};

export const TOPICS: Topic[] = [
  {
    slug: 'start', icon: 'rocket_launch', title: '入门', sub: 'sisma 是什么，如何使用',
    body: (
      <>
      <p>
        sisma 显示全球各地的地震，数据来自四家地震机构：<strong>USGS</strong>（美国）、<strong>EMSC</strong>（欧洲和地中海）、
        <strong>GeoNet</strong>（新西兰）和 <strong>JMA</strong>（日本）。
        当多家机构报告同一次地震时，sisma 只显示一次。列表每两分钟自动刷新，
        你也可以在列表上下拉立即刷新。
      </p>
      <p>你可以通过两种方式使用 sisma，账户和 sisma+ 订阅通用：</p>
      <ul>
        <li><strong>网页版</strong>：访问 <a href="https://sisma.io/app">sisma.io/app</a>，可在任何手机、平板或电脑上使用。</li>
        <li><strong>Android 应用</strong>：从 Google Play 下载，额外支持系统分享面板、Google 账户选择器和 Google Play 结算。</li>
      </ul>
      <p>应用底部有五个标签页（在电脑上位于左侧菜单）：<Ui>列表</Ui>、<Ui>地图</Ui>、<Ui>地球</Ui>、<Ui>科普</Ui>和<Ui>我的</Ui>。</p>
      <p>查看地震无需账户。账户可以保存你的地点和设置，使用 sisma+ 和提醒也需要账户。</p>
      <Callout kind="warn"><p><strong>sisma 不是官方预警服务。</strong>地震信息可能延迟、修订或不完整，sisma 也不提供地震预警。遇到紧急情况，请始终听从当地政府部门的指示。</p></Callout>
      </>
    ),
  },
  {
    slug: 'feed', icon: 'format_list_bulleted', title: '地震列表', sub: '最新、最近和最强',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p><Ui>列表</Ui>标签页列出近期地震。使用顶部的切换按钮排序：</p>
          <ul>
            <li><strong>最新</strong>：最新的排在前面。</li>
            <li><strong>最近</strong>：离你的位置或你选择的已保存地点最近的排在前面。</li>
            <li><strong>最强</strong>：震级最高的排在前面。</li>
          </ul>
          <p>每一行显示彩色徽章中的震级、地点（附所在国家或邻近国家的国旗）、发生在多久以前、离你多远以及震源深度。继续向下滚动，到达列表末尾时会加载更多地震。</p>
          <p>在电脑上，列表位于左侧菜单第一项<Ui>概览</Ui>页面，旁边有一张地图。在列表或地图上选择一次地震，地图就会放大到该地震，并显示附近城市的名称。关闭地震后地图保持不变；<Ui>重置视图</Ui>可重新显示整个世界。在右上角的<Ui>地点</Ui>中选择一个国家或地区，或点按<Ui>主要地区</Ui>中的一项，地图就会缩放到该处的地震；选择<Ui>所有地点</Ui>可重新显示整个世界。</p>
          <h3>震级颜色</h3>
          <p>列表、地图和地球使用相同的颜色：</p>
          <MagLegend words={{ label: '震级颜色', magnitude: '震级 {range}', orMore: '{n} 及以上', below: '低于 {n}', to: '{a} 至 {b}' }} />
          <Callout><p>打开列表底部的<Ui>筛选</Ui>，选择时间范围并缩小列表范围。请参阅<Link href="/help/map">地图和筛选</Link>。</p></Callout>
        </div>
        <Shot src="feed" alt="按最新排序的地震列表，含震级徽章、地点、时间、距离和深度" caption="地震列表，最新的在前" />
      </div>
      </>
    ),
  },
  {
    slug: 'details', icon: 'info', title: '地震详情', sub: '每个数字的含义',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>点按任意地震即可打开详情：</p>
          <ul>
            <li><strong>震级</strong>及其类型（例如 <em>mww</em>，即用于较大地震的矩震级）。</li>
            <li><strong>深度</strong>：地震在地表以下多深处发生。浅源地震的震感通常更强。</li>
            <li><strong>日期和时间</strong>，按你设备的时区显示。</li>
            <li>离你的<strong>距离</strong>，以及<strong>国家/地区</strong>（海上地震显示为某国“附近”）。</li>
            <li>震中的<strong>坐标</strong>。</li>
            <li><strong>审核状态</strong>：<em>自动</em>数值直接来自仪器，在第一个小时内经常变化；<em>已审核</em>表示已由地震学家核查。</li>
            <li><strong>来源</strong>：显示的是哪家机构的数据。</li>
          </ul>
          <p>详情下方：</p>
          <ul>
            <li><Ui>显示区域</Ui>会打开地震周边的近景地图，显示附近的地震，并在有数据时显示有感地图。</li>
            <li><Ui>分享</Ui>会打开分享卡片（请参阅<Link href="/help/share">分享</Link>）。</li>
            <li>如果有人报告感觉到了这次地震，你会看到人数。</li>
          </ul>
          <Callout kind="note"><p><strong>海啸：</strong>当海啸预警中心（PTWC、NTWC 或日本气象厅 JMA）为某次地震发布官方信息时，会按发布内容显示其级别，例如<strong>海啸警报</strong>或<strong>海啸注意报</strong>，并显示发布中心、时间、涉及的海岸以及<Ui>阅读官方信息</Ui>。警报、威胁、监视和注意报以颜色显示，并在地震的标记上加波浪标记、在列表行中显示彩色波浪图标；信息声明和预报保持灰色。标有<em>已取消</em>或<em>已解除</em>的信息已被撤回或已过期。没有官方信息时，海底的大地震会显示<em>海底发生强烈地震：请查看官方海啸信息</em>。sisma 只是转发这些信息，并非预警服务：请始终听从当地有关部门的指示。</p></Callout>
        </div>
        <Shot src="detail" alt="地震详情：震级、深度、日期、时间、距离、国家/地区、坐标、审核状态、来源、显示区域和分享" caption="一次地震的详情" />
      </div>
      </>
    ),
  },
  {
    slug: 'map', icon: 'map', title: '地图和筛选', sub: '缩放、区域视图、筛选',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p><Ui>地图</Ui>标签页以按震级着色的图钉显示近期地震，并以你所在的地区为中心。</p>
          <ul>
            <li>用手指或鼠标<strong>移动和缩放</strong>，或使用 <Ui>+</Ui> 和 <Ui>−</Ui> 按钮。第三个按钮可重置视图。</li>
            <li><strong>我的位置</strong>（第四个按钮）会缩放到你当前所在的位置。第一次使用时，sisma 会请求访问你的位置。当你在<Ui>我的</Ui>中选择了其他地点时，带圆环的点标记你的位置；你选择的地点保持不变。</li>
            <li>放大到某个地区时，会以你的语言显示<strong>城市名称</strong>，帮助你辨认方位。较大的城市优先显示，名称不会遮挡地震标记，切换到街道地图后改用街道地图上的地名。</li>
            <li>放大到足够程度后，会渐显来自 OpenStreetMap 的<strong>街道地图</strong>，让你看清地震的确切位置。</li>
            <li><strong>点按图钉</strong>查看摘要卡片，再点<Ui>详情</Ui>查看全部信息。</li>
          </ul>
        </div>
        <Shot src="map" alt="世界地图，地震图钉按震级着色" caption="地图" />
      </div>
      <h3 id="region-view">区域视图</h3>
      <div className={s.pair}>
        <div>
          <p>在地震上点按<Ui>显示区域</Ui>，会打开以它为中心、宽约 800 公里的近景地图，地震位置有一个跳动的标记，附近的地震带有标签。点按<Ui>返回世界地图</Ui>即可返回。</p>
          <p>别人打开你分享的链接时，看到的也是区域视图。</p>
        </div>
        <Shot src="region" alt="区域视图：地震周边的近景，带跳动标记和摘要卡片" caption="区域视图" />
      </div>
      <h3>筛选、图层和图例</h3>
      <div className={s.pair}>
        <div>
          <p>在列表、地图或地球底部上拉<Ui>筛选</Ui>面板。点按一次打开一半，再点一次完全打开，也可以拖动。</p>
          <ul>
            <li><strong>时间范围</strong>：24 小时、7 天或 30 天。查看一整年需要 sisma+。</li>
            <li><strong>震级</strong>和<strong>地区</strong>（国家或海洋区域）是 sisma+ 筛选项，在免费版中带有锁形标记。</li>
            <li><strong>地点</strong>：只显示你某个已保存地点附近的地震。</li>
            <li><Ui>清除筛选</Ui>会恢复所有设置。</li>
          </ul>
          <p>在<strong>图层</strong>中可以显示构造<strong>板块边界</strong>。面板中还显示震级图例。</p>
          <Callout><p>选择一个地区后，地图也会缩放到该地区，地球也会转向它。</p></Callout>
        </div>
        <Shot src="filters" alt="打开的筛选面板：时间范围、震级、地区和地点" caption="筛选面板" />
      </div>
      </>
    ),
  },
  {
    slug: 'globe', icon: 'public', title: '3D 地球', sub: '旋转它，查看深度',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p><Ui>地球</Ui>标签页在 3D 地球上显示同样的地震。拖动可旋转，双指捏合或滚动可缩放。点按图钉查看摘要。<Ui>−</Ui> 按钮下方的<Ui>我的位置</Ui>会把地球转到你当前所在的位置并放大（自动旋转会停止，让你保持在视野中）。</p>
          <p>放大后，会像地图一样，在朝向你的一面以你的语言显示<strong>城市名称</strong>，不会遮挡地震标记和按钮。</p>
          <p>在<Ui>筛选</Ui>面板的图层中：</p>
          <ul>
            <li><strong>深度</strong>按深度为每次地震着色，并画一条线向下延伸到震源，让你看到俯冲带下方的深源地震。</li>
            <li><strong>板块</strong>显示板块边界。</li>
            <li><strong>旋转</strong>让地球自己慢慢转动。</li>
          </ul>
        </div>
        <Shot src="globe" alt="3D 地球，太平洋周围有地震图钉" caption="地球" />
      </div>
      </>
    ),
  },
  {
    slug: 'felt', icon: 'vibration', title: '我感觉到了', sub: '报告和有感地图',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>如果你感觉到了地震，请告诉 sisma。报告有助于显示哪里感觉到了震动以及震动有多强。</p>
          <ol className={s.steps}>
            <li>打开这次地震。在地震发生后最多 <strong>6 小时</strong>内，你会看到<Ui>我感觉到了</Ui>。</li>
            <li>移动滑块选择你感觉到的强度，从<em>无感</em>到<em>极端</em>。徽章会显示对应的烈度等级（MMI）。</li>
            <li>可以选择添加备注，或点按<Ui>添加更多细节</Ui>，填写你当时在哪里、持续了多久、什么东西晃动了以及有无破坏。</li>
            <li>如果出现<Ui>在地图上显示</Ui>，保持开启即可把你的报告放到地图上，关闭则只计入数量。它使用你设备的位置；如果你没有共享位置，则使用你在<Ui>我的</Ui>中选择的地点。只有当该地点距离地震 3,000 公里以内时才会出现。</li>
            <li>点按<Ui>提交报告</Ui>。</li>
          </ol>
          <p>你的报告在存储时<strong>不含你的姓名或账户</strong>。在地图上，其位置会被取整到约 10 公里。</p>
          <p>报告会在区域视图（<Ui>显示区域</Ui>）中显示为约 10 公里的小方块。连同下文的 USGS 和 EMSC 报告，每个方块按其中报告的平均烈度着色。</p>
          <p>对于 USGS 记录的地震，区域视图还会以约 10 公里的彩色方块（每个烈度等级一种颜色）显示人们对 USGS<strong>Did You Feel It?</strong>调查的回答。</p>
          <p>对于 EMSC 记录的地震，通过 EMSC 网站和 LastQuake 应用提交的有感报告也计入同样的方块。EMSC 数据以 CC BY 4.0 许可共享。</p>
          <p>要一次显示或隐藏所有震感地图，请点按<Ui>返回世界地图</Ui>旁边的<Ui>图层</Ui>按钮并使用<Ui>震感地图</Ui>开关。你的选择会保存在此设备上。地震的<Ui>详情</Ui>中的震感图例显示报告总数和最高烈度，以及烈度颜色刻度。灰色方块是自动震感地图中没有报告给出烈度的区域。</p>
          <h3>有感地图</h3>
          <p>地震刚发生后，如果很多人同时打开 sisma，这股使用激增就能显示地震可能在哪里被感知到。sisma 会据此在区域视图中生成匿名的<strong>有感地图</strong>。位置会在你的设备上模糊处理，偏移最多 500 米，不带任何账户或设备标识，并且只在约 10 公里范围内至少有 3 人时才会显示。你可以在<Ui>我的</Ui> → <Ui>帮助绘制地震有感地图</Ui>中关闭此功能。</p>
        </div>
        <Shot src="felt" alt="“你感觉到了什么？”面板，含烈度滑块、可选备注、在地图上显示开关和提交报告" caption="报告你的感受" />
      </div>
      </>
    ),
  },
  {
    slug: 'share', icon: 'ios_share', title: '分享地震', sub: '图片、文字和替代文字',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>在地震上点按<Ui>分享</Ui>即可生成分享卡片：一张包含地图和主要信息的图片。</p>
          <p>与区域视图一样，卡片上的地图也会以你的语言标出地震周围的<strong>城市名称</strong>，只显示在不遮挡地震标记的位置。远在海上时可能一个也没有。</p>
          <p>在有人报告有感的地方，卡片上的地图也会像区域视图一样以烈度颜色的小方块显示（烈度未知处为灰色），右下角有烈度刻度。建议的图片描述也会提到。如果你在区域视图的<Ui>图层</Ui>中关闭了<Ui>震感地图</Ui>，卡片上也不会显示。</p>
          <p>如果海啸预警中心已为该地震发布官方信息，卡片地图的左上角会显示其级别和发布中心，例如<strong>海啸警报 · PTWC</strong>；在警报、威胁、监视或注意报有效期间以颜色显示。帖子文字和图片描述中也会包含这一信息。</p>
          <ul>
            <li><strong>帖子文字</strong>已自动填好（震级、地点、时间、深度和一个话题标签，链接放在最后），你可以修改。</li>
            <li><strong>图片描述（替代文字）</strong>为使用屏幕阅读器的人描述图片。它已自动填好，你可以修改。</li>
            <li><Ui>分享图片</Ui>会打开手机的分享面板（在 Android 应用和支持此功能的浏览器中）。如果浏览器无法分享图片，或图片未能生成，<Ui>分享链接</Ui>会改为分享帖子文字及其链接。<Ui>保存图片</Ui>会下载图片，<Ui>复制文字</Ui>和<Ui>复制替代文字</Ui>分别复制对应的字段。</li>
          </ul>
          <Callout><p>X、Facebook 和 Bluesky 经常会丢弃随图片一起分享的文字，而且都不能通过这种方式接收替代文字。<strong>“分享图片”也会复制文字</strong>，你可以把它粘贴到帖子里。使用<Ui>复制替代文字</Ui>，然后粘贴到该应用的图片描述栏中。在 iPhone 上，如果分享菜单没有立即打开，请再点按一次<Ui>分享图片</Ui>：文本已经复制好了。</p></Callout>
        </div>
        <Shot src="share" alt="分享面板，含分享卡片预览、可编辑的帖子文字和图片描述" caption="分享面板" />
      </div>
      </>
    ),
  },
  {
    slug: 'account', icon: 'person', title: '你的账户', sub: '登录、密码、删除',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>前往<Ui>我的</Ui>，点按<Ui>登录</Ui>。你可以使用 Google，或使用邮箱和密码。</p>
          <h3>用邮箱创建账户</h3>
          <ol className={s.steps}>
            <li>点按登录面板底部的<Ui>创建账户</Ui>。</li>
            <li>输入你的邮箱和密码：至少 8 个字符，包含字母和数字。出现在已知数据泄露中的密码会被拒绝。</li>
            <li>打开我们发给你的确认邮件，点按其中的链接。之后你就登录了。一分钟后仍未收到？请查看垃圾邮件文件夹。</li>
          </ol>
          <h3>使用 Google 登录</h3>
          <p>点按<Ui>使用 Google 继续</Ui>。在 Android 应用中，从出现的列表里选择你的 Google 账户。如果你的 Google 邮箱已有 sisma 账户，Google 会被添加到同一个账户。</p>
          <p>创建账户时，<Ui>使用 Google 继续</Ui> 也在最上方：无需密码或确认邮件，立即创建账户。</p>
        </div>
        <Shot src="signin" alt="登录面板：使用 Google 继续、邮箱和密码、忘记密码和创建账户" caption="登录" />
      </div>

      <h3 id="password-reset">忘记密码？重置密码</h3>
      <div className={s.pair}>
        <div>
          <ol className={s.steps}>
            <li>在<Ui>我的</Ui>中点按<Ui>登录</Ui>，输入你的邮箱地址。</li>
            <li>点按<Ui>忘记密码？</Ui>。你会看到<em>请查收邮件</em>。</li>
            <li>打开邮件，点按其中的链接。sisma 会打开并要求你<em>设置新密码</em>。</li>
            <li>输入两次新密码，点按<Ui>保存</Ui>。你就登录了。</li>
          </ol>
          <Callout kind="note"><p>为保护你的隐私，即使没有账户使用该地址，sisma 也总是显示已发送链接。如果几分钟内没有收到，请检查垃圾邮件文件夹，并确认你输入的是注册时使用的地址。</p></Callout>
        </div>
        <Shot src="forgot" alt="请查收邮件：我们已发送重置密码的链接" caption="点按“忘记密码？”之后" />
      </div>

      <h3>更改密码，或为 Google 账户添加密码</h3>
      <div className={s.pair}>
        <div>
          <ol className={s.steps}>
            <li>在<Ui>我的</Ui> → <Ui>账户</Ui>中，点按<Ui>设置或更改密码</Ui>。</li>
            <li>输入两次新密码，点按<Ui>保存</Ui>。</li>
          </ol>
          <p>如果你是用 Google 注册的，这会添加一个密码，让你也能用邮箱登录。如果 sisma 要求你先重新登录，这是一项安全检查：退出登录，重新登录后再试一次。</p>
        </div>
        <Shot src="password" alt="设置新密码面板，含新密码和确认密码输入框" caption="设置新密码" />
      </div>

      <h3>其他账户操作</h3>
      <div className={s.pair}>
        <div>
          <ul>
            <li><strong>显示名称</strong>：<Ui>我的</Ui> → <Ui>显示名称</Ui>。留空则显示你的邮箱。</li>
            <li><strong>退出登录</strong>：<Ui>我的</Ui> → <Ui>退出登录</Ui>。你保存的地点会保留在账户中。</li>
            <li><strong>更改邮箱地址</strong>：目前还无法在应用中更改。请用你当前的邮箱写信至 <a href={`mailto:${MAIL}`}>{MAIL}</a>。</li>
          </ul>
        </div>
        <Shot src="me" alt="“我的”中的账户部分：显示名称、邮箱、密码、退出登录、帮助与支持以及删除账户" caption="账户，位于“我的”底部" />
      </div>

      <h3 id="delete-account">删除你的账户</h3>
      <div className={s.pair}>
        <div>
          <ol className={s.steps}>
            <li>如果你订阅了 sisma+，请先取消（请参阅<Link href="/help/plus#cancel">取消 sisma+</Link>）。sisma 不会删除仍在自动续订的账户。</li>
            <li>在<Ui>我的</Ui>中点按<Ui>删除账户</Ui>，然后点按<Ui>永久删除</Ui>。</li>
          </ol>
          <p>这会永久删除你的账户、已保存的地点和提醒设置。你提交过的有感报告会保留，但不含你的姓名。删除账户不会删除 Android 应用；如有需要，请另行卸载。我们的<Link href="/privacy#delete">隐私政策</Link>说明了你的数据会如何处理。</p>
        </div>
        <Shot src="delete" alt="“要删除你的账户吗？”面板，含永久删除和取消" caption="删除账户" />
      </div>
      </>
    ),
  },
  {
    slug: 'locations', icon: 'location_on', title: '已保存的地点', sub: '你关心的地方',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>已保存的地点决定哪些地震算“最近”，以及你的提醒监测哪些地方。</p>
          <ul>
            <li><strong>我的位置</strong>使用你设备的位置（浏览器或手机会先请求权限）。</li>
            <li><Ui>添加地点</Ui>可以搜索城市或城镇并保存。</li>
            <li>点按一个地点，将其设为计算距离所用的地点。点按 <Ui>×</Ui> 可将其删除。</li>
            <li>选择<strong>我的位置</strong>时，只要设备能提供位置，sisma 就会使用你的位置。如果无法获取（定位已关闭或未获允许），或者你选择了已保存的地点，sisma 会使用该已保存地点：你的默认地点，或你保存的第一个地点。</li>
            <li>登录后，<strong>我的位置</strong>也会用于你的提醒和海啸提醒：sisma 会保存设备的最后位置（精确到约 1 公里），并在最后一次更新后的 30 天内使用。</li>
          </ul>
          <p>免费版可保存 <strong>1 个地点</strong>，sisma+ 最多可保存 <strong>10 个</strong>。未登录时，地点保存在本设备上，登录后会移入你的账户。</p>
        </div>
        <Shot src="addloc" alt="添加地点面板，含搜索城市或城镇的搜索框" caption="添加地点" />
      </div>
      </>
    ),
  },
  {
    slug: 'plus', icon: 'workspace_premium', title: 'sisma+', sub: '试用、付费、取消',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>sisma 可以免费使用。sisma+ 增加了：</p>
          <div className={legal.tableWrap}>
            <table style={{ minWidth: 0 }}>
              <thead><tr><th>功能</th><th>免费版</th><th>sisma+</th></tr></thead>
              <tbody>
                <tr><td>实时列表、地图、地球、科普</td><td>✓</td><td>✓</td></tr>
                <tr><td>官方海啸通知</td><td>✓</td><td>✓</td></tr>
                <tr><td>地震历史</td><td>30 天</td><td>完整历史</td></tr>
                <tr><td>已保存的地点</td><td>1</td><td>最多 10 个</td></tr>
                <tr><td>按你自己的规则推送提醒</td><td>–</td><td>最多 5 个提醒</td></tr>
                <tr><td>震级和地区筛选</td><td>–</td><td>✓</td></tr>
                <tr><td>实时地震数据图表</td><td>–</td><td>✓</td></tr>
              </tbody>
            </table>
          </div>
          <p>价格：<strong>每年 {usd(PRICES.yearly.usd)}</strong>，只有一个方案。Google Play 会以你当地的货币显示价格。新订阅用户可享 <strong>{TRIAL_DAYS} 天免费试用</strong>，每个账户限一次。</p>
        </div>
        <Shot src="paywall" alt={`sisma+ 面板，含功能、年费价格和“开始 ${TRIAL_DAYS} 天免费试用”`} caption="选择方案" />
      </div>

      <h3>订阅</h3>
      <ul>
        <li><strong>在网站上</strong>：<Ui>我的</Ui> → <Ui>开始 {TRIAL_DAYS} 天免费试用</Ui>（或<Ui>订阅</Ui>），然后在 Stripe 的安全结账页面付款。如果你先创建账户，点按确认邮件中的链接后会打开结账页面。返回后，sisma 会显示<em>正在启用 sisma+…</em>几秒钟，然后显示<em>欢迎使用 sisma+</em>。</li>
        <li><strong>在 Android 应用中</strong>：同一个按钮会打开 Google Play 的付款面板，你可以使用 Google Pay、银行卡或其他 Google Play 付款方式支付。</li>
      </ul>
      <p>你需要先登录。之后，只要登录该账户，无论在网页还是应用中，你的订阅都有效。</p>

      <h3>管理或切换方案</h3>
      <div className={s.pair}>
        <div>
          <p>前往<Ui>我的</Ui> → <Ui>管理订阅</Ui>，查看你的状态、方案和下一个日期。</p>
          <ul>
            <li><strong>在网站上购买</strong>：<Ui>管理账单</Ui>会打开 Stripe 的页面，你可以在那里更新银行卡、查看发票或取消订阅。</li>
            <li><strong>在 Android 应用中购买</strong>：<Ui>在 Google Play 中管理</Ui>会在 Google Play 中打开你的订阅。</li>
          </ul>
          <p>如果 sisma 已免费为你的账户开通 sisma+，你的方案会显示 <Ui>赠送</Ui>。你不需要订阅，已开始的订阅也可以取消，sisma+ 不会失去。</p>
        </div>
        <Shot src="subscription" alt="订阅页面：状态、方案、续订日期和在 Google Play 中管理" caption="你的订阅" />
      </div>

      <h3 id="cancel">取消 sisma+</h3>
      <ol className={s.steps}>
        <li>打开<Ui>我的</Ui> → <Ui>管理订阅</Ui>。</li>
        <li>点按<Ui>管理账单</Ui>（网站）或<Ui>在 Google Play 中管理</Ui>（应用），然后在那里取消。在 Google Play 中，你也可以前往<em>付款和订阅 → 订阅</em>。</li>
      </ol>
      <p>在已付费的期限结束前，你仍可使用 sisma+。届时<Ui>我的</Ui>中的卡片会显示具体日期和<em>取消</em>字样，过了该日期后你会回到免费版。在免费试用结束前取消，则不会扣费。</p>
      <Callout kind="note"><p>卸载应用或删除 sisma 账户<strong>不会</strong>取消 Google Play 订阅。请在 Google Play 中取消。</p></Callout>

      <h3>恢复购买</h3>
      <p>在新手机上或重新安装应用后，请登录同一个 sisma 账户。如果没有显示 sisma+，请打开 sisma+ 面板并点按<Ui>恢复购买</Ui>。此功能仅在 Android 应用中提供，会查找本设备上的 Google Play 订阅。</p>

      <h3>退款</h3>
      <p>Google Play 购买适用 Google Play 的退款政策，因此请通过 Google Play 申请退款。网站购买请写信至 <a href={`mailto:${MAIL}`}>{MAIL}</a>。我们的<Link href="/terms">服务条款</Link>说明了详细信息。</p>
      </>
    ),
  },
  {
    slug: 'alerts', icon: 'notifications_active', title: '提醒', sub: '符合你条件的推送通知',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>订阅 sisma+ 后，当有地震符合你的某个提醒时，sisma 会发送推送通知。</p>
          <ol className={s.steps}>
            <li>登录并确认你已订阅 sisma+。</li>
            <li>在<Ui>我的</Ui>中开启<Ui>推送提醒</Ui>，或打开<Ui>提醒规则</Ui>并开启<em>地震提醒</em>。</li>
            <li>在<em>通知方式</em>下，点按<Ui>在此设备上开启通知</Ui>，并在系统询问时允许通知。</li>
            <li>点按<Ui>添加提醒</Ui>并进行设置（见下文）。最多可以设置 5 个。</li>
            <li>点按<Ui>发送测试提醒</Ui>，确认本设备能收到提醒。</li>
          </ol>
        </div>
        <Shot src="alerts" alt="提醒页面，含开关、你的提醒（0/5）、添加提醒和通知方式" caption="提醒页面" />
      </div>
      <h3>设置提醒</h3>
      <ul>
        <li><strong>名称</strong>：例如<em>家附近</em>。</li>
        <li><strong>最小震级</strong>：达到此震级及更强的地震都会提醒你。</li>
        <li><strong>监测范围</strong>：你已保存地点周围你所选的距离内（100、250、500 或 1,000 公里），或全球任何地方。</li>
        <li><strong>其他地点</strong>：最多 20 个国家或地区，范围内任何地方都算。</li>
        <li><strong>免打扰时段</strong>：夜间不提醒，也可以选择仍让强震（6 级及以上）的提醒通过。</li>
        <li>图表会显示过去 30 天内有多少次地震会触发该提醒，方便你调整。</li>
      </ul>
      <p>当设备共享位置时，<strong>监测范围</strong>也包括<strong>我的位置</strong>：请参阅<Link href="/help/locations">已保存的地点</Link>。</p>
      <p>过去 30 天内收到的提醒列在<em>提醒记录</em>中。</p>
      <h3>海啸通知</h3>
      <p>海啸通知对所有登录用户免费。在<Ui>我的</Ui>中打开<Ui>海啸通知</Ui>，然后点按<Ui>在此设备上开启通知</Ui>。当你保存地点 1000 公里范围内的地震发布官方海啸警报、威胁、监视或注意报时，你会收到通知。免打扰时段不适用，每个级别对每次地震只发送一次。 与其他提醒一样，我的位置也计算在内。</p>
      <Callout kind="note"><p><strong>iPhone 和 iPad：</strong>只有将 sisma 添加到主屏幕（分享 → 添加到主屏幕）并从主屏幕打开后，网页通知才能使用。 在 iPhone 或 iPad 的浏览器中首次打开 sisma 时，会弹出窗口显示这些步骤；点按<Ui>以后再说</Ui>会在两周后再次显示，点按<Ui>知道了</Ui>则不再显示。</p></Callout>
      </>
    ),
  },
  {
    slug: 'settings', icon: 'tune', title: '设置', sub: '语言、主题、单位',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p>这些设置位于<Ui>我的</Ui>中，在你的地点下方：</p>
          <ul>
            <li><strong>语言</strong>：English、Español、日本語、Bahasa Indonesia、Türkçe、Italiano、Português、中文、Français 或 Deutsch。你也可以点按任意标签页顶部的语言按钮。</li>
            <li><strong>外观</strong>：跟随设备（跟随系统）、浅色或深色。</li>
            <li><strong>单位</strong>：公里或英里。</li>
            <li><strong>地图标记</strong>：内部写有震级的图钉，或按震级决定大小的圆点。颜色图例也在这里。</li>
            <li><strong>帮助绘制地震有感地图</strong>：开启或关闭匿名有感地图共享（请参阅<Link href="/help/felt">我感觉到了</Link>）。</li>
            <li><strong>查看介绍</strong>会重新播放欢迎步骤。</li>
          </ul>
          <p>登录后，你的语言和外观设置会保存到账户中。</p>
        </div>
        <Shot src="me_more" alt="设置：语言、外观、单位、地图标记、有感地图开关、介绍和数据来源" caption="“我的”中的设置" />
      </div>
      </>
    ),
  },
  {
    slug: 'science', icon: 'science', title: '科普', sub: '地震是怎么回事',
    body: (
      <>
      <div className={s.pair}>
        <div>
          <p><Ui>科普</Ui>标签页有八篇简短的图解指南，每篇都配有动画图解或实时图表：板块构造、断层类型、地震波、震级与烈度、深度与余震、海啸、如何做好准备，以及环太平洋火山地震带，并附有一张实时地图，显示太平洋周边近期发生了多少次地震。</p>
          <p>点按图解下方的按钮可切换视图，点按暂停按钮可停止动画。指南和应用的其他部分一样，跟随你的语言。点按指南顶部的<Ui>分享</Ui>，即可把它连同图片、简短摘要和链接发给别人。</p>
          <p>指南下方的<Ui>深度阅读</Ui>收录了较长的文章，供你深入了解：为什么地震无法预测、板块构造与俯冲、断层与应力、地球内部与地震波、余震与地震灾害、为什么同一次地震中一个街区受损而相邻街区安然无恙，以及震级标度如何运作、为什么地震后震级数字会变。每篇文章末尾都列出了参考来源并解答常见问题。这些文章也以你的语言显示；参考来源列表保持英文。</p>
          <p>在<Ui>数据</Ui>中，<Ui>地震数据</Ui>（sisma+）根据 USGS 的数据，用图表展示过去 30 天全球 M4.5 以上的地震：发生了多少次、震级和深度、发生的地区、释放的能量，以及 1900 年以来每年 M7 以上地震的次数。每个图表都附有简短说明；点按柱条即可查看数值。没有 sisma+ 时，你会看到说明和开始免费试用的按钮。颜色各有含义：震级使用地图标记的颜色，深度使用地球仪深度模式的颜色，主要位于环太平洋带的地区会突出显示，高于平均的柱条为珊瑚色。</p>
        </div>
        <Shot src="science" alt="地震波文章，含 P 波的动画图解" caption="一篇科普指南" />
      </div>
      </>
    ),
  },
  {
    slug: 'troubleshooting', icon: 'build', title: '故障排除', sub: '常见问题的解决方法',
    body: (
      <>
      <div className={s.faq}>
        <p className={s.faqGroup}>位置和数据</p>
        <Faq q="“最近”为空，或找不到我的位置">
          <p>sisma 需要获得使用你位置的权限，或者需要一个已保存的地点。</p>
          <ul>
            <li><strong>浏览器</strong>：点按网址旁边的图标，将<em>位置</em>设为<em>允许</em>，然后重新加载。</li>
            <li><strong>Android 应用</strong>：设置 → 应用 → sisma → 权限 → 位置信息 → <em>仅在使用该应用时允许</em>。</li>
            <li>或者在<Ui>我的</Ui> → <Ui>添加地点</Ui>中添加一个地点。</li>
          </ul>
        </Faq>
        <Faq q="某次地震不见了，或者它的震级变了">
          <p>各机构会先发布自动测定的数据，然后进行修订，通常在第一个小时内。震级、深度和地点都可能改变，一些小地震会被删除。不同机构报告的数值也可能略有差异；sisma 在有区域机构数据时优先显示其数据（日本为 JMA，新西兰为 GeoNet），否则显示 USGS 的数据，再次为 EMSC。非常小的地震（日本和新西兰以外地区约 2.5 级以下）不包括在内。</p>
        </Faq>
        <Faq q="时间看起来不对">
          <p>时间按你设备的时区显示。请检查设备的日期、时间和时区设置。</p>
        </Faq>
        <Faq q="放大到很近时地图一片空白">
          <p>街道级地图来自 OpenStreetMap，需要网络连接。如果加载不出来，请稍微缩小一点；地震图钉仍然可以正常使用。</p>
        </Faq>
        <Faq q="应用显示我处于离线状态">
          <p>sisma 需要网络连接才能加载地震。请检查 Wi-Fi 或移动数据，然后重新打开应用。</p>
        </Faq>

        <p className={s.faqGroup}>登录</p>
        <Faq q="“邮箱或密码不正确。”">
          <p>检查是否有输入错误，然后使用<Link href="/help/account#password-reset">忘记密码？</Link>。如果你是用 Google 创建的账户，请使用<Ui>使用 Google 继续</Ui>，或者在用 Google 登录的状态下，到<Ui>我的</Ui> → <Ui>设置或更改密码</Ui>中添加密码。</p>
        </Faq>
        <Faq q="“请先确认你的邮箱”">
          <p>打开 sisma 发来的确认邮件，点按其中的链接，然后登录。找不到邮件？请检查垃圾邮件文件夹。如果还是没有，请用该邮箱写信至 <a href={`mailto:${MAIL}`}>{MAIL}</a>。</p>
        </Faq>
        <Faq q="没有收到重置或确认邮件">
          <p>请等待几分钟，并检查垃圾邮件或推广邮件文件夹。确认你输入的是注册时使用的地址。为保护你的隐私，即使没有账户使用该地址，sisma 也会显示已发送重置链接。</p>
        </Faq>
        <Faq q="无法使用 Google 登录">
          <p>在 Android 应用中，请确认手机上已登录 Google 账户（设置 → 密码和账号），并且 Google Play 服务已更新到最新版本。在网页上，请允许 sisma.io 使用弹出窗口和第三方登录。你随时都可以改用邮箱登录。</p>
        </Faq>
        <Faq q="“为了你的安全，请退出后重新登录”">
          <p>更改密码需要近期登录过。点按<Ui>退出登录</Ui>，重新登录，然后再更改。</p>
        </Faq>

        <p className={s.faqGroup}>sisma+ 和付费</p>
        <Faq q="我已付款，但仍显示免费版">
          <ul>
            <li>请等一分钟，然后关闭并重新打开 sisma。通常会立即生效，但也可能需要几分钟。</li>
            <li>确认你登录的是订阅时使用的账户。</li>
            <li>Android 应用：打开 sisma+ 面板并点按<Ui>恢复购买</Ui>。</li>
            <li>还是不行？请写信至 <a href={`mailto:${MAIL}`}>{MAIL}</a>，附上你的账户邮箱；如果是 Google Play 购买，请附上收据中的订单号（GPA.…）。</li>
          </ul>
        </Faq>
        <Faq q="“此 Google Play 订阅属于另一个 sisma 账户。”">
          <p>这台手机上的订阅是在登录另一个 sisma 账户时购买的。请退出登录，然后登录那个账户。</p>
        </Faq>
        <Faq q="没有提供免费试用">
          <p>试用仅适用于从未订阅过的账户。在 Android 应用中，Google Play 还限定每个 Google 账户只能试用一次，即使使用不同的 sisma 账户也是如此。</p>
        </Faq>
        <Faq q="“应用内订阅暂不可用”或“此设备不支持 Google Play 结算。”">
          <p>请更新 sisma 和 Google Play 商店应用，并确认你已登录 Google Play。有些没有 Google Play 的设备无法在应用内购买。请改为在 <a href="https://sisma.io/app/me">sisma.io</a> 上订阅，然后在应用中登录同一个账户。</p>
        </Faq>
        <Faq q="我无法删除账户">
          <p>请先取消 sisma+。设为到期结束后，你就可以删除账户了。请参阅<Link href="/help/account#delete-account">删除你的账户</Link>。</p>
        </Faq>

        <p className={s.faqGroup}>提醒和通知</p>
        <Faq q="我收不到提醒">
          <ol>
            <li>确认你已订阅 sisma+ 并已登录。</li>
            <li>在<Ui>我的</Ui> → <Ui>提醒规则</Ui>中，确认提醒已开启，并且至少有一个提醒处于开启状态，且设置了地点或区域。</li>
            <li>在<em>通知方式</em>下，确认本设备已开启，然后点按<Ui>发送测试提醒</Ui>。</li>
            <li>Android：设置 → 应用 → sisma → 通知必须设为允许。省电设置可能会延迟通知；请将 sisma 的电池用量设为<em>不受限制</em>。</li>
            <li>浏览器：必须允许 sisma.io 发送通知。在 iPhone 和 iPad 上，请从主屏幕打开 sisma。</li>
            <li>免打扰时段会在夜间暂缓提醒，除非你允许强震提醒通过。</li>
          </ol>
        </Faq>
        <Faq q="我收到的提醒太多了">
          <p>提高最小震级、缩小距离、删除范围较大的地区，或设置免打扰时段。每个提醒中的 30 天图表会显示它本会触发的频率。</p>
        </Faq>

        <p className={s.faqGroup}>分享和报告</p>
        <Faq q="没有“分享图片”按钮">
          <p>你的浏览器无法分享文件。请使用<Ui>保存图片</Ui>和<Ui>复制文字</Ui>，然后自己发布。在 Android 应用中，更新 sisma 即可使用系统分享面板。</p>
        </Faq>
        <Faq q="文字没有出现在我的帖子里">
          <p>许多应用会丢弃随图片一起分享的文字。你点按<Ui>分享图片</Ui>时 sisma 已复制了文字，请把它粘贴到帖子里。</p>
        </Faq>
        <Faq q="没有“我感觉到了”按钮">
          <p>地震发生后 6 小时内可以报告。之后该按钮会消失。</p>
        </Faq>
      </div>
      </>
    ),
  },
  {
    slug: 'contact', icon: 'support_agent', title: '联系支持', sub: '仍未解决？给我们写信',
    body: (
      <>
      <div className={s.contact}>
        <span className="ms" aria-hidden="true">mail</span>
        <div style={{ flex: '1 1 260px' }}>
          <p style={{ margin: 0 }}><strong>仍然需要帮助？</strong>给我们写信，并附上你的账户邮箱、你的设备和浏览器或应用版本，以及你尝试过的操作。附上截图会更有帮助。</p>
        </div>
        <a className={s.mail} href={`mailto:${MAIL}?subject=${encodeURIComponent('sisma help')}`}>{MAIL}</a>
      </div>
      <p>请不要发送密码或完整的银行卡号。我们绝不会索要这些信息。</p>
      </>
    ),
  },
];
