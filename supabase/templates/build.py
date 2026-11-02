"""Builds the sisma Supabase Auth email templates in this folder.

Run `python3 supabase/templates/build.py` after editing, then paste each .html into Supabase →
Authentication → Emails, with the subject line from subjects/ (see README.md).

Same approach as the polar lights app (aurora-monitor/supabase/templates): table layout with inline styles for
Gmail, Outlook and Apple Mail; one template per email holding all 10 app languages, chosen per user with Go-template
conditionals on `{{ .Data.locale }}` (user metadata the app sets at sign-up and when the language changes).
Anyone without a saved language gets English.
"""
import re
from pathlib import Path

HERE = Path(__file__).parent
SITE = 'https://sisma.io'
VIOLET, INK, INK2, BG, LINE = '#6C4BF4', '#1B1530', '#5E587A', '#F6F4FC', '#E4E0F0'
MAG = ['#86DCC4', '#F7CF4A', '#FFA94D', '#FF7A59', '#EE4266', '#B5179E']  # theme.ts MAG_SCALE, low → high

LANGS = ['en', 'es', 'ja', 'id', 'tr', 'it', 'pt', 'zh', 'fr', 'de']  # app order; English is the fallback

# ---------------------------------------------------------------- shared text per language
SHARED = {
  'en': dict(tagline='Earthquakes, live and explained', notice='SECURITY NOTICE', wasnt='Wasn’t you?',
    fallback='Button not working? Copy this link into your browser:', dash='Open sisma',
    secure='Reset your password right away, then check the email address and sign-in methods on your account.',
    notice_footer='We send this notice whenever important details on your sisma account change. It was sent automatically; replies aren’t read.'),
  'es': dict(tagline='Terremotos en vivo y explicados', notice='AVISO DE SEGURIDAD', wasnt='¿No fuiste tú?',
    fallback='¿El botón no funciona? Copia este enlace en tu navegador:', dash='Abrir sisma',
    secure='Restablece tu contraseña de inmediato y revisa el correo y los métodos de inicio de sesión de tu cuenta.',
    notice_footer='Enviamos este aviso cada vez que cambian datos importantes de tu cuenta de sisma. Se envió automáticamente; las respuestas no se leen.'),
  'ja': dict(tagline='地震をリアルタイムで、わかりやすく', notice='セキュリティのお知らせ', wasnt='心当たりがない場合',
    fallback='ボタンが使えない場合は、このリンクをブラウザに貼り付けてください：', dash='sisma を開く',
    secure='すぐにパスワードを再設定し、アカウントのメールアドレスとログイン方法を確認してください。',
    notice_footer='sisma アカウントの重要な情報が変更されると、このお知らせをお送りしています。自動送信のため、返信は確認できません。'),
  'id': dict(tagline='Gempa bumi, langsung dan dijelaskan', notice='PEMBERITAHUAN KEAMANAN', wasnt='Bukan Anda?',
    fallback='Tombol tidak berfungsi? Salin tautan ini ke peramban Anda:', dash='Buka sisma',
    secure='Segera atur ulang kata sandi Anda, lalu periksa alamat email dan metode masuk di akun Anda.',
    notice_footer='Kami mengirim pemberitahuan ini setiap kali detail penting akun sisma Anda berubah. Email ini dikirim otomatis; balasan tidak dibaca.'),
  'tr': dict(tagline='Depremler, canlı ve açıklamalı', notice='GÜVENLİK BİLDİRİMİ', wasnt='Siz değil miydiniz?',
    fallback='Düğme çalışmıyor mu? Bu bağlantıyı tarayıcınıza kopyalayın:', dash='sisma’yı aç',
    secure='Şifrenizi hemen sıfırlayın, ardından hesabınızdaki e-posta adresini ve giriş yöntemlerini kontrol edin.',
    notice_footer='sisma hesabınızdaki önemli bilgiler değiştiğinde bu bildirimi göndeririz. Otomatik gönderilmiştir; yanıtlar okunmaz.'),
  'it': dict(tagline='Terremoti in diretta e spiegati', notice='AVVISO DI SICUREZZA', wasnt='Non sei stato tu?',
    fallback='Il pulsante non funziona? Copia questo link nel browser:', dash='Apri sisma',
    secure='Reimposta subito la password, poi controlla l’indirizzo email e i metodi di accesso del tuo account.',
    notice_footer='Inviamo questo avviso ogni volta che cambiano dati importanti del tuo account sisma. È stato inviato automaticamente; le risposte non vengono lette.'),
  'pt': dict(tagline='Terremotos ao vivo e explicados', notice='AVISO DE SEGURANÇA', wasnt='Não foi você?',
    fallback='O botão não funciona? Copie este link no navegador:', dash='Abrir o sisma',
    secure='Redefina sua senha imediatamente e depois confira o e-mail e os métodos de acesso da sua conta.',
    notice_footer='Enviamos este aviso sempre que dados importantes da sua conta sisma mudam. Ele foi enviado automaticamente; as respostas não são lidas.'),
  'zh': dict(tagline='实时地震，清晰解读', notice='安全通知', wasnt='不是你本人操作？',
    fallback='按钮无法使用？请将此链接复制到浏览器：', dash='打开 sisma',
    secure='请立即重置密码，然后检查账户的邮箱地址和登录方式。',
    notice_footer='每当你的 sisma 账户重要信息发生变更时，我们都会发送此通知。此邮件为自动发送，回复不会被查看。'),
  'fr': dict(tagline='Les séismes, en direct et expliqués', notice='AVIS DE SÉCURITÉ', wasnt='Ce n’était pas vous ?',
    fallback='Le bouton ne fonctionne pas ? Copiez ce lien dans votre navigateur :', dash='Ouvrir sisma',
    secure='Réinitialisez votre mot de passe sans attendre, puis vérifiez l’adresse e-mail et les méthodes de connexion de votre compte.',
    notice_footer='Nous envoyons cet avis chaque fois que des informations importantes de votre compte sisma changent. Il a été envoyé automatiquement ; les réponses ne sont pas lues.'),
  'de': dict(tagline='Erdbeben, live und erklärt', notice='SICHERHEITSHINWEIS', wasnt='Das warst nicht du?',
    fallback='Schaltfläche funktioniert nicht? Kopiere diesen Link in deinen Browser:', dash='sisma öffnen',
    secure='Setze sofort dein Passwort zurück und prüfe dann die E-Mail-Adresse und Anmeldemethoden deines Kontos.',
    notice_footer='Wir senden diesen Hinweis, wenn sich wichtige Angaben in deinem sisma-Konto ändern. Er wurde automatisch versendet; Antworten werden nicht gelesen.'),
}

# ---------------------------------------------------------------- templates
# Headings mark the highlighted word with [brackets]. Security notices (kind='notice') use the shared kicker,
# the "Open sisma" button, the "Wasn't you?" advice and the notice footer.
TEMPLATES = [
  ('confirmation', 'Confirm sign up', 'link', {
    'en': dict(subject='Confirm your sisma account', title='Confirm your email', preheader='One tap to finish setting up your sisma account.', kicker='WELCOME',
      heading='Confirm your [email]', body='Thanks for joining sisma. Confirm this address to finish setting up your account and get live earthquakes, felt reports and alerts.',
      button='Confirm email address', footer='You received this because someone signed up for sisma with {{ .Email }}. If that wasn’t you, ignore this email and no account will be created.'),
    'es': dict(subject='Confirma tu cuenta de sisma', title='Confirma tu correo', preheader='Un toque para terminar de configurar tu cuenta de sisma.', kicker='BIENVENIDA',
      heading='Confirma tu [correo]', body='Gracias por unirte a sisma. Confirma esta dirección para terminar de configurar tu cuenta y recibir sismos en vivo, reportes y alertas.',
      button='Confirmar correo', footer='Recibiste este correo porque alguien se registró en sisma con {{ .Email }}. Si no fuiste tú, ignóralo y no se creará ninguna cuenta.'),
    'ja': dict(subject='sisma アカウントを確認してください', title='メールアドレスの確認', preheader='ワンタップで sisma アカウントの設定が完了します。', kicker='ようこそ',
      heading='[メールアドレス]を確認', body='sisma にご登録いただきありがとうございます。このアドレスを確認すると設定が完了し、リアルタイムの地震情報、揺れの報告、アラートを利用できます。',
      button='メールアドレスを確認', footer='{{ .Email }} で sisma に登録があったため、このメールをお送りしています。心当たりがない場合はこのメールを無視してください。アカウントは作成されません。'),
    'id': dict(subject='Konfirmasi akun sisma Anda', title='Konfirmasi email Anda', preheader='Satu ketukan untuk menyelesaikan akun sisma Anda.', kicker='SELAMAT DATANG',
      heading='Konfirmasi [email] Anda', body='Terima kasih telah bergabung dengan sisma. Konfirmasi alamat ini untuk menyelesaikan akun Anda dan mendapatkan gempa langsung, laporan guncangan, dan peringatan.',
      button='Konfirmasi alamat email', footer='Anda menerima email ini karena seseorang mendaftar di sisma dengan {{ .Email }}. Jika itu bukan Anda, abaikan email ini dan tidak ada akun yang dibuat.'),
    'tr': dict(subject='sisma hesabınızı onaylayın', title='E-postanızı onaylayın', preheader='sisma hesabınızı tamamlamak için tek dokunuş.', kicker='HOŞ GELDİNİZ',
      heading='[E-postanızı] onaylayın', body='sisma’ya katıldığınız için teşekkürler. Hesabınızı tamamlamak ve canlı depremler, hissetme raporları ve uyarılar almak için bu adresi onaylayın.',
      button='E-posta adresini onayla', footer='Bu e-postayı, biri {{ .Email }} ile sisma’ya kaydolduğu için aldınız. Bu siz değilseniz e-postayı yok sayın; hesap oluşturulmaz.'),
    'it': dict(subject='Conferma il tuo account sisma', title='Conferma la tua email', preheader='Un tocco per completare il tuo account sisma.', kicker='BENVENUTO',
      heading='Conferma la tua [email]', body='Grazie per esserti iscritto a sisma. Conferma questo indirizzo per completare l’account e ricevere terremoti in diretta, segnalazioni e avvisi.',
      button='Conferma indirizzo email', footer='Hai ricevuto questa email perché qualcuno si è registrato a sisma con {{ .Email }}. Se non sei stato tu, ignorala e non verrà creato alcun account.'),
    'pt': dict(subject='Confirme sua conta sisma', title='Confirme seu e-mail', preheader='Um toque para concluir sua conta sisma.', kicker='BOAS-VINDAS',
      heading='Confirme seu [e-mail]', body='Obrigado por entrar no sisma. Confirme este endereço para concluir sua conta e receber terremotos ao vivo, relatos e alertas.',
      button='Confirmar e-mail', footer='Você recebeu este e-mail porque alguém se cadastrou no sisma com {{ .Email }}. Se não foi você, ignore-o e nenhuma conta será criada.'),
    'zh': dict(subject='请确认你的 sisma 账户', title='确认你的邮箱', preheader='轻点一下即可完成 sisma 账户设置。', kicker='欢迎',
      heading='确认你的[邮箱]', body='感谢加入 sisma。确认此邮箱即可完成账户设置，获取实时地震、有感报告和提醒。',
      button='确认邮箱地址', footer='有人使用 {{ .Email }} 注册了 sisma，因此你收到了这封邮件。如果不是你本人，请忽略此邮件，账户不会被创建。'),
    'fr': dict(subject='Confirmez votre compte sisma', title='Confirmez votre e-mail', preheader='Un geste pour finir de configurer votre compte sisma.', kicker='BIENVENUE',
      heading='Confirmez votre [e-mail]', body='Merci de rejoindre sisma. Confirmez cette adresse pour finir de configurer votre compte et recevoir les séismes en direct, les témoignages et les alertes.',
      button='Confirmer l’adresse e-mail', footer='Vous recevez cet e-mail car quelqu’un s’est inscrit à sisma avec {{ .Email }}. Si ce n’était pas vous, ignorez-le : aucun compte ne sera créé.'),
    'de': dict(subject='Bestätige dein sisma-Konto', title='Bestätige deine E-Mail', preheader='Ein Tipp, um dein sisma-Konto fertig einzurichten.', kicker='WILLKOMMEN',
      heading='E-Mail [bestätigen]', body='Danke, dass du sisma nutzt. Bestätige diese Adresse, um dein Konto fertig einzurichten und Erdbeben live, Meldungen und Alarme zu erhalten.',
      button='E-Mail-Adresse bestätigen', footer='Du erhältst diese E-Mail, weil sich jemand mit {{ .Email }} bei sisma registriert hat. Wenn du das nicht warst, ignoriere sie; es wird kein Konto angelegt.'),
  }),
  ('recovery', 'Reset password', 'link', {
    'en': dict(subject='Reset your sisma password', title='Reset your password', preheader='Choose a new password for your sisma account.', kicker='PASSWORD RESET',
      heading='Reset your [password]', body='We received a request to reset the password for {{ .Email }}. Choose a new one with the button below. The link works once and expires soon.',
      button='Choose a new password', footer='If you didn’t ask to reset your password, ignore this email. Your password stays the same.'),
    'es': dict(subject='Restablece tu contraseña de sisma', title='Restablece tu contraseña', preheader='Elige una contraseña nueva para tu cuenta de sisma.', kicker='RESTABLECER CONTRASEÑA',
      heading='Restablece tu [contraseña]', body='Recibimos una solicitud para restablecer la contraseña de {{ .Email }}. Elige una nueva con el botón de abajo. El enlace funciona una vez y caduca pronto.',
      button='Elegir contraseña nueva', footer='Si no pediste restablecer tu contraseña, ignora este correo. Tu contraseña no cambia.'),
    'ja': dict(subject='sisma のパスワード再設定', title='パスワードの再設定', preheader='sisma アカウントの新しいパスワードを設定してください。', kicker='パスワード再設定',
      heading='[パスワード]を再設定', body='{{ .Email }} のパスワード再設定のリクエストを受け付けました。下のボタンから新しいパスワードを設定してください。リンクは一度だけ有効で、まもなく期限切れになります。',
      button='新しいパスワードを設定', footer='パスワードの再設定を依頼していない場合は、このメールを無視してください。パスワードは変更されません。'),
    'id': dict(subject='Atur ulang kata sandi sisma Anda', title='Atur ulang kata sandi', preheader='Pilih kata sandi baru untuk akun sisma Anda.', kicker='ATUR ULANG KATA SANDI',
      heading='Atur ulang [kata sandi]', body='Kami menerima permintaan untuk mengatur ulang kata sandi {{ .Email }}. Pilih kata sandi baru dengan tombol di bawah. Tautan hanya berlaku sekali dan segera kedaluwarsa.',
      button='Pilih kata sandi baru', footer='Jika Anda tidak meminta pengaturan ulang kata sandi, abaikan email ini. Kata sandi Anda tetap sama.'),
    'tr': dict(subject='sisma şifrenizi sıfırlayın', title='Şifrenizi sıfırlayın', preheader='sisma hesabınız için yeni bir şifre seçin.', kicker='ŞİFRE SIFIRLAMA',
      heading='[Şifrenizi] sıfırlayın', body='{{ .Email }} için şifre sıfırlama isteği aldık. Aşağıdaki düğmeyle yeni bir şifre seçin. Bağlantı yalnızca bir kez çalışır ve kısa sürede geçerliliğini yitirir.',
      button='Yeni şifre seç', footer='Şifre sıfırlama istemediyseniz bu e-postayı yok sayın. Şifreniz değişmez.'),
    'it': dict(subject='Reimposta la password di sisma', title='Reimposta la password', preheader='Scegli una nuova password per il tuo account sisma.', kicker='REIMPOSTA PASSWORD',
      heading='Reimposta la [password]', body='Abbiamo ricevuto una richiesta di reimpostare la password di {{ .Email }}. Scegline una nuova con il pulsante qui sotto. Il link funziona una sola volta e scade a breve.',
      button='Scegli una nuova password', footer='Se non hai chiesto di reimpostare la password, ignora questa email. La password resta invariata.'),
    'pt': dict(subject='Redefina sua senha do sisma', title='Redefina sua senha', preheader='Escolha uma nova senha para sua conta sisma.', kicker='REDEFINIR SENHA',
      heading='Redefina sua [senha]', body='Recebemos um pedido para redefinir a senha de {{ .Email }}. Escolha uma nova com o botão abaixo. O link funciona uma vez e expira em breve.',
      button='Escolher nova senha', footer='Se você não pediu para redefinir a senha, ignore este e-mail. Sua senha continua a mesma.'),
    'zh': dict(subject='重置你的 sisma 密码', title='重置密码', preheader='为你的 sisma 账户设置新密码。', kicker='重置密码',
      heading='重置你的[密码]', body='我们收到了重置 {{ .Email }} 密码的请求。请点击下方按钮设置新密码。链接仅可使用一次，并将很快失效。',
      button='设置新密码', footer='如果你没有申请重置密码，请忽略此邮件，你的密码不会改变。'),
    'fr': dict(subject='Réinitialisez votre mot de passe sisma', title='Réinitialisez votre mot de passe', preheader='Choisissez un nouveau mot de passe pour votre compte sisma.', kicker='RÉINITIALISATION',
      heading='Réinitialisez votre [mot de passe]', body='Nous avons reçu une demande de réinitialisation du mot de passe de {{ .Email }}. Choisissez-en un nouveau avec le bouton ci-dessous. Le lien ne fonctionne qu’une fois et expire bientôt.',
      button='Choisir un nouveau mot de passe', footer='Si vous n’avez pas demandé de réinitialisation, ignorez cet e-mail. Votre mot de passe ne change pas.'),
    'de': dict(subject='Setze dein sisma-Passwort zurück', title='Passwort zurücksetzen', preheader='Wähle ein neues Passwort für dein sisma-Konto.', kicker='PASSWORT ZURÜCKSETZEN',
      heading='[Passwort] zurücksetzen', body='Wir haben eine Anfrage erhalten, das Passwort für {{ .Email }} zurückzusetzen. Wähle mit der Schaltfläche unten ein neues. Der Link funktioniert einmal und läuft bald ab.',
      button='Neues Passwort wählen', footer='Wenn du kein neues Passwort angefordert hast, ignoriere diese E-Mail. Dein Passwort bleibt unverändert.'),
  }),
  ('magic_link', 'Magic link', 'link', {
    'en': dict(subject='Your sisma sign-in link', title='Sign in to sisma', preheader='Your one-time link to sign in to sisma.', kicker='SIGN IN',
      heading='Your [sign-in] link', body='Use the button below to sign in to sisma as {{ .Email }}. The link works once and expires soon.',
      button='Sign in to sisma', footer='If you didn’t try to sign in, ignore this email. Nobody can sign in without this link.'),
    'es': dict(subject='Tu enlace para entrar en sisma', title='Entra en sisma', preheader='Tu enlace de un solo uso para entrar en sisma.', kicker='INICIAR SESIÓN',
      heading='Tu enlace de [acceso]', body='Usa el botón de abajo para entrar en sisma como {{ .Email }}. El enlace funciona una vez y caduca pronto.',
      button='Entrar en sisma', footer='Si no intentaste iniciar sesión, ignora este correo. Nadie puede entrar sin este enlace.'),
    'ja': dict(subject='sisma ログインリンク', title='sisma にログイン', preheader='sisma にログインするための一回限りのリンクです。', kicker='ログイン',
      heading='[ログイン]リンク', body='下のボタンから {{ .Email }} として sisma にログインできます。リンクは一度だけ有効で、まもなく期限切れになります。',
      button='sisma にログイン', footer='ログインしようとしていない場合は、このメールを無視してください。このリンクがなければ誰もログインできません。'),
    'id': dict(subject='Tautan masuk sisma Anda', title='Masuk ke sisma', preheader='Tautan sekali pakai untuk masuk ke sisma.', kicker='MASUK',
      heading='Tautan [masuk] Anda', body='Gunakan tombol di bawah untuk masuk ke sisma sebagai {{ .Email }}. Tautan hanya berlaku sekali dan segera kedaluwarsa.',
      button='Masuk ke sisma', footer='Jika Anda tidak mencoba masuk, abaikan email ini. Tidak ada yang bisa masuk tanpa tautan ini.'),
    'tr': dict(subject='sisma giriş bağlantınız', title='sisma’ya giriş yapın', preheader='sisma’ya giriş için tek kullanımlık bağlantınız.', kicker='GİRİŞ',
      heading='[Giriş] bağlantınız', body='Aşağıdaki düğmeyle sisma’ya {{ .Email }} olarak giriş yapın. Bağlantı yalnızca bir kez çalışır ve kısa sürede geçerliliğini yitirir.',
      button='sisma’ya giriş yap', footer='Giriş yapmaya çalışmadıysanız bu e-postayı yok sayın. Bu bağlantı olmadan kimse giriş yapamaz.'),
    'it': dict(subject='Il tuo link di accesso a sisma', title='Accedi a sisma', preheader='Il tuo link monouso per accedere a sisma.', kicker='ACCESSO',
      heading='Il tuo link di [accesso]', body='Usa il pulsante qui sotto per accedere a sisma come {{ .Email }}. Il link funziona una sola volta e scade a breve.',
      button='Accedi a sisma', footer='Se non hai provato ad accedere, ignora questa email. Nessuno può accedere senza questo link.'),
    'pt': dict(subject='Seu link de acesso ao sisma', title='Entre no sisma', preheader='Seu link de uso único para entrar no sisma.', kicker='ENTRAR',
      heading='Seu link de [acesso]', body='Use o botão abaixo para entrar no sisma como {{ .Email }}. O link funciona uma vez e expira em breve.',
      button='Entrar no sisma', footer='Se você não tentou entrar, ignore este e-mail. Ninguém consegue entrar sem este link.'),
    'zh': dict(subject='你的 sisma 登录链接', title='登录 sisma', preheader='用于登录 sisma 的一次性链接。', kicker='登录',
      heading='你的[登录]链接', body='点击下方按钮，以 {{ .Email }} 身份登录 sisma。链接仅可使用一次，并将很快失效。',
      button='登录 sisma', footer='如果你没有尝试登录，请忽略此邮件。没有此链接，任何人都无法登录。'),
    'fr': dict(subject='Votre lien de connexion sisma', title='Connectez-vous à sisma', preheader='Votre lien à usage unique pour vous connecter à sisma.', kicker='CONNEXION',
      heading='Votre lien de [connexion]', body='Utilisez le bouton ci-dessous pour vous connecter à sisma en tant que {{ .Email }}. Le lien ne fonctionne qu’une fois et expire bientôt.',
      button='Se connecter à sisma', footer='Si vous n’avez pas essayé de vous connecter, ignorez cet e-mail. Personne ne peut se connecter sans ce lien.'),
    'de': dict(subject='Dein sisma-Anmeldelink', title='Bei sisma anmelden', preheader='Dein einmaliger Link zur Anmeldung bei sisma.', kicker='ANMELDEN',
      heading='Dein [Anmeldelink]', body='Melde dich mit der Schaltfläche unten als {{ .Email }} bei sisma an. Der Link funktioniert einmal und läuft bald ab.',
      button='Bei sisma anmelden', footer='Wenn du dich nicht anmelden wolltest, ignoriere diese E-Mail. Ohne diesen Link kann sich niemand anmelden.'),
  }),
  ('email_change', 'Change email address', 'link', {
    'en': dict(subject='Confirm your new email address', title='Confirm your new email', preheader='Confirm the new email address for your sisma account.', kicker='EMAIL CHANGE',
      heading='Confirm your [new email]', body='You asked to change the email address on your sisma account from {{ .Email }} to {{ .NewEmail }}. Confirm the change with the button below.',
      button='Confirm new address', footer='If you didn’t ask for this change, ignore this email and your address stays the same.'),
    'es': dict(subject='Confirma tu nuevo correo', title='Confirma tu nuevo correo', preheader='Confirma la nueva dirección de correo de tu cuenta de sisma.', kicker='CAMBIO DE CORREO',
      heading='Confirma tu [nuevo correo]', body='Pediste cambiar el correo de tu cuenta de sisma de {{ .Email }} a {{ .NewEmail }}. Confirma el cambio con el botón de abajo.',
      button='Confirmar nueva dirección', footer='Si no pediste este cambio, ignora este correo y tu dirección no cambiará.'),
    'ja': dict(subject='新しいメールアドレスを確認してください', title='新しいメールアドレスの確認', preheader='sisma アカウントの新しいメールアドレスを確認してください。', kicker='メールアドレスの変更',
      heading='[新しいメールアドレス]を確認', body='sisma アカウントのメールアドレスを {{ .Email }} から {{ .NewEmail }} に変更するリクエストを受け付けました。下のボタンで変更を確定してください。',
      button='新しいアドレスを確認', footer='この変更を依頼していない場合は、このメールを無視してください。アドレスは変更されません。'),
    'id': dict(subject='Konfirmasi alamat email baru Anda', title='Konfirmasi email baru', preheader='Konfirmasi alamat email baru untuk akun sisma Anda.', kicker='PERUBAHAN EMAIL',
      heading='Konfirmasi [email baru] Anda', body='Anda meminta mengubah alamat email akun sisma dari {{ .Email }} menjadi {{ .NewEmail }}. Konfirmasi perubahan dengan tombol di bawah.',
      button='Konfirmasi alamat baru', footer='Jika Anda tidak meminta perubahan ini, abaikan email ini dan alamat Anda tetap sama.'),
    'tr': dict(subject='Yeni e-posta adresinizi onaylayın', title='Yeni e-postanızı onaylayın', preheader='sisma hesabınızın yeni e-posta adresini onaylayın.', kicker='E-POSTA DEĞİŞİKLİĞİ',
      heading='[Yeni e-postanızı] onaylayın', body='sisma hesabınızın e-posta adresini {{ .Email }} yerine {{ .NewEmail }} olarak değiştirmek istediniz. Değişikliği aşağıdaki düğmeyle onaylayın.',
      button='Yeni adresi onayla', footer='Bu değişikliği istemediyseniz e-postayı yok sayın; adresiniz değişmez.'),
    'it': dict(subject='Conferma il nuovo indirizzo email', title='Conferma la nuova email', preheader='Conferma il nuovo indirizzo email del tuo account sisma.', kicker='CAMBIO EMAIL',
      heading='Conferma la [nuova email]', body='Hai chiesto di cambiare l’indirizzo email del tuo account sisma da {{ .Email }} a {{ .NewEmail }}. Conferma la modifica con il pulsante qui sotto.',
      button='Conferma nuovo indirizzo', footer='Se non hai chiesto questa modifica, ignora questa email e l’indirizzo resta invariato.'),
    'pt': dict(subject='Confirme seu novo e-mail', title='Confirme seu novo e-mail', preheader='Confirme o novo endereço de e-mail da sua conta sisma.', kicker='MUDANÇA DE E-MAIL',
      heading='Confirme seu [novo e-mail]', body='Você pediu para mudar o e-mail da sua conta sisma de {{ .Email }} para {{ .NewEmail }}. Confirme a mudança com o botão abaixo.',
      button='Confirmar novo endereço', footer='Se você não pediu esta mudança, ignore este e-mail e seu endereço continua o mesmo.'),
    'zh': dict(subject='请确认你的新邮箱地址', title='确认新邮箱', preheader='确认 sisma 账户的新邮箱地址。', kicker='更改邮箱',
      heading='确认你的[新邮箱]', body='你申请将 sisma 账户的邮箱从 {{ .Email }} 更改为 {{ .NewEmail }}。请点击下方按钮确认更改。',
      button='确认新地址', footer='如果你没有申请此更改，请忽略此邮件，你的邮箱地址不会改变。'),
    'fr': dict(subject='Confirmez votre nouvelle adresse e-mail', title='Confirmez votre nouvel e-mail', preheader='Confirmez la nouvelle adresse e-mail de votre compte sisma.', kicker='CHANGEMENT D’E-MAIL',
      heading='Confirmez votre [nouvel e-mail]', body='Vous avez demandé à remplacer l’adresse e-mail de votre compte sisma {{ .Email }} par {{ .NewEmail }}. Confirmez le changement avec le bouton ci-dessous.',
      button='Confirmer la nouvelle adresse', footer='Si vous n’avez pas demandé ce changement, ignorez cet e-mail : votre adresse reste la même.'),
    'de': dict(subject='Bestätige deine neue E-Mail-Adresse', title='Neue E-Mail bestätigen', preheader='Bestätige die neue E-Mail-Adresse deines sisma-Kontos.', kicker='E-MAIL-ÄNDERUNG',
      heading='[Neue E-Mail] bestätigen', body='Du möchtest die E-Mail-Adresse deines sisma-Kontos von {{ .Email }} auf {{ .NewEmail }} ändern. Bestätige die Änderung mit der Schaltfläche unten.',
      button='Neue Adresse bestätigen', footer='Wenn du diese Änderung nicht angefordert hast, ignoriere die E-Mail; deine Adresse bleibt unverändert.'),
  }),
  ('password_changed', 'Password changed', 'notice', {
    'en': dict(subject='Your sisma password was changed', title='Password changed', preheader='The password on your sisma account was just changed.',
      heading='Password [changed]', body='The password for your sisma account {{ .Email }} was just changed.'),
    'es': dict(subject='Se cambió tu contraseña de sisma', title='Contraseña cambiada', preheader='La contraseña de tu cuenta de sisma acaba de cambiar.',
      heading='Contraseña [cambiada]', body='La contraseña de tu cuenta de sisma {{ .Email }} acaba de cambiar.'),
    'ja': dict(subject='sisma のパスワードが変更されました', title='パスワード変更', preheader='sisma アカウントのパスワードが変更されました。',
      heading='パスワードが[変更]されました', body='sisma アカウント {{ .Email }} のパスワードが変更されました。'),
    'id': dict(subject='Kata sandi sisma Anda telah diubah', title='Kata sandi diubah', preheader='Kata sandi akun sisma Anda baru saja diubah.',
      heading='Kata sandi [diubah]', body='Kata sandi akun sisma Anda {{ .Email }} baru saja diubah.'),
    'tr': dict(subject='sisma şifreniz değiştirildi', title='Şifre değiştirildi', preheader='sisma hesabınızın şifresi az önce değiştirildi.',
      heading='Şifre [değiştirildi]', body='{{ .Email }} sisma hesabınızın şifresi az önce değiştirildi.'),
    'it': dict(subject='La password di sisma è stata cambiata', title='Password cambiata', preheader='La password del tuo account sisma è appena stata cambiata.',
      heading='Password [cambiata]', body='La password del tuo account sisma {{ .Email }} è appena stata cambiata.'),
    'pt': dict(subject='Sua senha do sisma foi alterada', title='Senha alterada', preheader='A senha da sua conta sisma acabou de ser alterada.',
      heading='Senha [alterada]', body='A senha da sua conta sisma {{ .Email }} acabou de ser alterada.'),
    'zh': dict(subject='你的 sisma 密码已更改', title='密码已更改', preheader='你的 sisma 账户密码刚刚被更改。',
      heading='密码[已更改]', body='你的 sisma 账户 {{ .Email }} 的密码刚刚被更改。'),
    'fr': dict(subject='Votre mot de passe sisma a été modifié', title='Mot de passe modifié', preheader='Le mot de passe de votre compte sisma vient d’être modifié.',
      heading='Mot de passe [modifié]', body='Le mot de passe de votre compte sisma {{ .Email }} vient d’être modifié.'),
    'de': dict(subject='Dein sisma-Passwort wurde geändert', title='Passwort geändert', preheader='Das Passwort deines sisma-Kontos wurde gerade geändert.',
      heading='Passwort [geändert]', body='Das Passwort deines sisma-Kontos {{ .Email }} wurde gerade geändert.'),
  }),
  ('email_changed', 'Email address changed', 'notice', {
    'en': dict(subject='Your sisma email address was changed', title='Email address changed', preheader='The email address on your sisma account was just changed.',
      heading='Email [changed]', body='The email address on your sisma account was changed from {{ .OldEmail }} to {{ .Email }}.'),
    'es': dict(subject='Se cambió el correo de tu cuenta de sisma', title='Correo cambiado', preheader='El correo de tu cuenta de sisma acaba de cambiar.',
      heading='Correo [cambiado]', body='El correo de tu cuenta de sisma cambió de {{ .OldEmail }} a {{ .Email }}.'),
    'ja': dict(subject='sisma のメールアドレスが変更されました', title='メールアドレス変更', preheader='sisma アカウントのメールアドレスが変更されました。',
      heading='メールアドレスが[変更]されました', body='sisma アカウントのメールアドレスが {{ .OldEmail }} から {{ .Email }} に変更されました。'),
    'id': dict(subject='Alamat email sisma Anda telah diubah', title='Alamat email diubah', preheader='Alamat email akun sisma Anda baru saja diubah.',
      heading='Email [diubah]', body='Alamat email akun sisma Anda diubah dari {{ .OldEmail }} menjadi {{ .Email }}.'),
    'tr': dict(subject='sisma e-posta adresiniz değiştirildi', title='E-posta adresi değiştirildi', preheader='sisma hesabınızın e-posta adresi az önce değiştirildi.',
      heading='E-posta [değiştirildi]', body='sisma hesabınızın e-posta adresi {{ .OldEmail }} yerine {{ .Email }} olarak değiştirildi.'),
    'it': dict(subject='L’email di sisma è stata cambiata', title='Email cambiata', preheader='L’indirizzo email del tuo account sisma è appena stato cambiato.',
      heading='Email [cambiata]', body='L’indirizzo email del tuo account sisma è stato cambiato da {{ .OldEmail }} a {{ .Email }}.'),
    'pt': dict(subject='O e-mail da sua conta sisma foi alterado', title='E-mail alterado', preheader='O e-mail da sua conta sisma acabou de ser alterado.',
      heading='E-mail [alterado]', body='O e-mail da sua conta sisma foi alterado de {{ .OldEmail }} para {{ .Email }}.'),
    'zh': dict(subject='你的 sisma 邮箱地址已更改', title='邮箱已更改', preheader='你的 sisma 账户邮箱刚刚被更改。',
      heading='邮箱[已更改]', body='你的 sisma 账户邮箱已从 {{ .OldEmail }} 更改为 {{ .Email }}。'),
    'fr': dict(subject='L’adresse e-mail de votre compte sisma a été modifiée', title='Adresse e-mail modifiée', preheader='L’adresse e-mail de votre compte sisma vient d’être modifiée.',
      heading='E-mail [modifié]', body='L’adresse e-mail de votre compte sisma est passée de {{ .OldEmail }} à {{ .Email }}.'),
    'de': dict(subject='Deine sisma-E-Mail-Adresse wurde geändert', title='E-Mail-Adresse geändert', preheader='Die E-Mail-Adresse deines sisma-Kontos wurde gerade geändert.',
      heading='E-Mail [geändert]', body='Die E-Mail-Adresse deines sisma-Kontos wurde von {{ .OldEmail }} auf {{ .Email }} geändert.'),
  }),
]

# ---------------------------------------------------------------- layout (light, matches the website)
FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
STRIP = ''.join(
  f'<td height="4" bgcolor="{c}" style="height:4px;line-height:4px;font-size:0;{"border-top-left-radius:20px;" if i == 0 else ""}{"border-top-right-radius:20px;" if i == len(MAG) - 1 else ""}">&nbsp;</td>'
  for i, c in enumerate(MAG))

LAYOUT = """{{{{ $l := printf "%v" .Data.locale }}}}<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>{title}</title>
</head>
<body style="margin:0;padding:0;background-color:{bg};">
<!-- Inbox preview text -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">{preheader}&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="{bg}" style="background-color:{bg};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
        <!-- Logo -->
        <tr>
          <td style="padding:0 4px 24px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="padding-right:10px;vertical-align:middle;"><img src="{site}/icons/icon-192.png" width="36" height="36" alt="" style="display:block;border:0;border-radius:11px;"></td>
              <td style="vertical-align:middle;font-family:{font};font-size:22px;font-weight:800;letter-spacing:-0.4px;color:{ink};">sisma<span style="color:{ink2};font-weight:600;">.io</span></td>
            </tr></table>
          </td>
        </tr>
        <!-- Card -->
        <tr>
          <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;border:1px solid {line};border-radius:20px;">
            <!-- Magnitude colour strip -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>{strip}</tr></table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td style="padding:28px 32px 8px;font-family:{font};font-size:12px;font-weight:700;letter-spacing:1.5px;color:{kicker_color};">{kicker}</td></tr>
              <tr><td style="padding:0 32px 14px;font-family:{font};font-size:28px;line-height:34px;font-weight:800;letter-spacing:-0.5px;color:{ink};">{heading}</td></tr>
              <tr><td style="padding:0 32px 26px;font-family:{font};font-size:16px;line-height:24px;color:{ink2};">{body}</td></tr>
              <tr>
                <td style="padding:0 32px {button_pad}px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                    <td align="center" bgcolor="{violet}" style="background-color:{violet};border-radius:999px;">
                      <a href="{href}" target="_blank" style="display:inline-block;padding:15px 28px;font-family:{font};font-size:16px;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:999px;">{button}</a>
                    </td>
                  </tr></table>
                </td>
              </tr>
{after}            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 4px 0;font-family:{font};font-size:12px;line-height:18px;color:{ink2};">
            {footer}<br><br>
            <a href="{site}" target="_blank" style="color:{violet};text-decoration:none;font-weight:700;">sisma.io</a>
            <span style="color:#B9B3CC;">&nbsp;·&nbsp;</span>{tagline}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>
"""

def choose(values: dict) -> str:
  """Go-template chain picking the user's language; English last as the fallback."""
  if len(set(values.values())) == 1:
    return values['en']
  out = ''
  for i, lang in enumerate(l for l in LANGS if l != 'en'):
    out += ('{{ if eq $l "' if i == 0 else '{{ else if eq $l "') + lang + '" }}' + values[lang]
  return out + '{{ else }}' + values['en'] + '{{ end }}'

def hl(s: str) -> str:
  return re.sub(r'\[(.+?)\]', rf'<span style="color:{VIOLET};">\1</span>', s)

def strong(s: str) -> str:
  for v in ('{{ .Email }}', '{{ .NewEmail }}', '{{ .OldEmail }}'):
    s = s.replace(v, f'<strong style="color:{INK};">{v}</strong>')
  return s

def build():
  (HERE / 'subjects').mkdir(exist_ok=True)
  rows = []
  for name, dashboard, kind, text in TEMPLATES:
    assert set(text) == set(LANGS), (name, set(LANGS) - set(text))
    per = lambda key: {l: text[l][key] for l in LANGS}
    shared = lambda key: {l: SHARED[l][key] for l in LANGS}
    notice = kind == 'notice'
    after = (f"""              <tr><td style="padding:0 32px 32px;font-family:{FONT};font-size:13px;line-height:20px;color:{INK2};">
                <strong style="color:#EE4266;">{choose(shared('wasnt'))}</strong> {choose(shared('secure'))}
              </td></tr>
""" if notice else f"""              <tr><td style="padding:0 32px 32px;font-family:{FONT};font-size:13px;line-height:20px;color:{INK2};">
                {choose(shared('fallback'))}<br>
                <a href="{{{{ .ConfirmationURL }}}}" target="_blank" style="color:{VIOLET};word-break:break-all;">{{{{ .ConfirmationURL }}}}</a>
              </td></tr>
""")
    html = LAYOUT.format(
      lang=choose({l: l for l in LANGS}), title=choose(per('title')), preheader=choose(per('preheader')),
      bg=BG, ink=INK, ink2=INK2, line=LINE, violet=VIOLET, font=FONT, site=SITE, strip=STRIP,
      kicker_color='#EE4266' if notice else VIOLET,
      kicker=choose(shared('notice') if notice else per('kicker')),
      heading=choose({l: hl(v) for l, v in per('heading').items()}),
      body=choose({l: strong(v) for l, v in per('body').items()}),
      href=f'{SITE}/app/me' if notice else '{{ .ConfirmationURL }}',
      button=choose(shared('dash') if notice else per('button')),
      button_pad=24, after=after,
      footer=choose(shared('notice_footer') if notice else per('footer')),
      tagline=choose(shared('tagline')),
    )
    (HERE / f'{name}.html').write_text(html, encoding='utf-8')
    subject = '{{ $l := printf "%v" .Data.locale }}' + choose(per('subject'))
    (HERE / 'subjects' / f'{name}.txt').write_text(subject + '\n', encoding='utf-8')
    rows.append((dashboard, name, text['en']['subject'], len(html)))
  for r in rows:
    print(f'{r[0]:<24} {r[1]}.html  ({r[3]:,} bytes)  subject: {r[2]}')

if __name__ == '__main__':
  build()
