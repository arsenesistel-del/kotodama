// Session 11, le village : quêtes de chasse des villageois, salon de thé d'おみつ, rumeurs entendues en passant,
// et tout ce qu'on peut lire en examinant (panneaux, 絵馬, avis du village, étals, intérieurs).
// Avant guérison, les villageois ne disent que des faits nus : aucune des quatre fins perdues (と思う, かもしれない,
// そうだ, んだ) sauf dans les variantes « :ep » (après l'épilogue, voir VILLAGE_HEALED). Le joueur, lui, les a toutes.
// Les quêtes de chasse : `hN:give` (la demande ; la réplique `key` de HUNTS dit quoi, où, combien), `hN:wait`, `hN:done`.
import type { Line } from './dialogue';
import { ALL_ORDERS } from './craft';

export const VILLAGE_SPEAKERS: Record<string, { name: string; face?: string }> = {
  oharu: { name: 'おはる', face: 'actors/woman_face' },
  mokichi: { name: '{茂吉|もきち}', face: 'actors/oldman_face' },
};

export const VILLAGE_HEALED: Record<string, string[]> = {
  'gossip:1:ep': ['そうよ', 'んじゃ'],
  'gossip:2:ep': ['そうよ', 'と思'],
  'gossip:3:ep': ['かもしれ', 'と思'],
};

export const VILLAGE_DIALOGUES: Record<string, Line[]> = {
  // ================= quêtes de chasse =================
  // h1 : おみつ veut cueillir des eulalies pour la lune ; des つぶやき marmonnent à l'entrée de la lande.
  'h1:give': [
    { who: 'omitsu', jp: 'お{月見|つきみ}の{薄|すすき}、{取|と}りに{行|い}けないの。', fr: 'Je n’arrive pas à aller cueillir les eulalies pour la lune.' },
    { who: 'omitsu', jp: '{野原|のはら}の{入口|いりぐち}に、つぶやきが{四匹|よんひき}。……ずっと、ぶつぶつ。', fr: 'À l’entrée de la lande, quatre marmonneurs. Ils marmonnent sans arrêt.' },
    { who: 'player', jp: 'つぶやきを{鎮|しず}めればいいんですね。', fr: 'Il suffit d’apaiser les marmonneurs, c’est ça ?' },
    { who: 'omitsu', jp: 'うん。お{願|ねが}い。', fr: 'Oui. S’il te plaît.' },
  ],
  'h1:wait': [{ who: 'omitsu', jp: 'つぶやき、まだぶつぶつ{言|い}ってるわ。{入口|いりぐち}よ。', fr: 'Les marmonneurs marmonnent toujours. À l’entrée.' }],
  'h1:done': [
    { who: 'player', jp: '{入口|いりぐち}は、もう{静|しず}かだと{思|おも}います。', fr: 'Je pense que l’entrée est calme, maintenant.' },
    { who: 'omitsu', jp: 'ほんと？じゃあ、{薄|すすき}、{取|と}ってくるわ！', fr: 'C’est vrai ? Alors je vais cueillir les eulalies !' },
    { who: 'omitsu', jp: 'はい、お{礼|れい}。お{米|こめ}、{持|も}っていって。', fr: 'Tiens, pour te remercier. Prends ce riz.' },
  ],
  // h2 : 権兵衛, les うわさ鳥 picorent ses rizières.
  'h2:give': [
    { who: 'gonbei', jp: '{田|た}んぼに、うわさ{鳥|どり}。{米|こめ}、{食|た}べる。', fr: 'Dans les rizières, des oiseaux-rumeurs. Ils mangent le riz.' },
    { who: 'gonbei', jp: '{野原|のはら}の{入口|いりぐち}から、{来|く}る。……{三羽|さんば}。{三羽|さんば}、{追|お}い{払|はら}ってくれ。', fr: 'Ils viennent de l’entrée de la lande. Trois. Chasse-m’en trois.' },
    { who: 'player', jp: '{入口|いりぐち}にいるんですね。{行|い}ってきます。', fr: 'Ils sont à l’entrée, c’est ça ? J’y vais.' },
  ],
  'h2:wait': [{ who: 'gonbei', jp: 'うわさ{鳥|どり}、まだ{来|く}る。……{三羽|さんば}。', fr: 'Les oiseaux-rumeurs viennent encore. Trois.' }],
  'h2:done': [
    { who: 'player', jp: 'うわさ{鳥|どり}は、もう{来|こ}ないと{思|おも}います。', fr: 'Je pense que les oiseaux-rumeurs ne viendront plus.' },
    { who: 'gonbei', jp: '……{助|たす}かった。{米|こめ}、{持|も}っていけ。', fr: '… Tu m’as tiré d’affaire. Prends du riz.' },
  ],
  // h3 : おたね manque de fil.
  'h3:give': [
    { who: 'otane', jp: '{糸|いと}が、ない。……{着物|きもの}、{縫|ぬ}えない。', fr: 'Plus de fil. Je ne peux pas coudre de kimono.' },
    { who: 'otane', jp: '{言蟲|ことむし}は、{糸|いと}を{持|も}っている。……{五|いつ}つ、ほしい。', fr: 'Les kotomushi ont du fil. J’en voudrais cinq.' },
    { who: 'player', jp: '{糸|いと}が{要|い}るんですね。{探|さが}してきます。', fr: 'Vous avez besoin de fil, c’est ça ? Je vais en chercher.' },
  ],
  'h3:wait': [{ who: 'otane', jp: '{糸|いと}、まだ{足|た}りない。……{五|いつ}つ。', fr: 'Il manque encore du fil. Cinq.' }],
  'h3:done': [
    { who: 'player', jp: '{糸|いと}を{持|も}ってきました。', fr: 'Je vous ai apporté du fil.' },
    { who: 'otane', jp: 'まあ。……これで、{孫|まご}の{着物|きもの}が{縫|ぬ}える。', fr: 'Oh. Avec ça, je pourrai coudre le kimono de mon petit-fils.' },
  ],
  // h4 : 太一 veut voir une まよい蛾 de près, et il a peur.
  'h4:give': [
    { who: 'taichi', jp: 'お{侍|さむらい}さん！まよい{蛾|が}、{見|み}たことある？{羽|はね}、ぱたぱた！', fr: 'Monsieur le samouraï ! Vous avez déjà vu une phalène qui hésite ? Ses ailes, flap flap !' },
    { who: 'taichi', jp: '{野原|のはら}の{中|なか}に、いる。……{一匹|いっぴき}、{見|み}てきて！ぼく、こわい。', fr: 'Il y en a au milieu de la lande. Va en voir une ! Moi, j’ai peur.' },
    { who: 'player', jp: '{野原|のはら}の{中|なか}ですね。{見|み}てきます。', fr: 'Au milieu de la lande, d’accord. Je vais voir.' },
  ],
  'h4:wait': [{ who: 'taichi', jp: 'まよい{蛾|が}、まだ？……{野原|のはら}の{中|なか}だよ！', fr: 'La phalène, alors ? Au milieu de la lande, hein !' }],
  'h4:done': [
    { who: 'player', jp: 'まよい{蛾|が}は、こわくないと{思|おも}います。', fr: 'Je pense que les phalènes ne font pas peur.' },
    { who: 'taichi', jp: 'ほんと？……じゃあ、ぼくも、いつか{行|い}く！', fr: 'C’est vrai ? Alors moi aussi, j’irai un jour !' },
    { who: 'taichi', jp: 'これ、あげる。{川|かわ}で{拾|ひろ}った！', fr: 'Tiens, c’est pour toi. Je l’ai trouvé dans la rivière !' },
  ],
  // h5 : 萬作, les わけ狐 rongent les planches du pont.
  'h5:give': [
    { who: 'mansaku', jp: 'わけ{狐|ぎつね}が、{橋|はし}の{板|いた}をかじる。', fr: 'Les renards des raisons rongent les planches du pont.' },
    { who: 'mansaku', jp: '{池|いけ}のほとりに、{巣|す}がある。……{二匹|にひき}じゃ。', fr: 'Ils ont leur terrier au bord de l’étang. Deux.' },
    { who: 'player', jp: '{池|いけ}のほとりにいるんですね。{行|い}ってきます。', fr: 'Ils sont au bord de l’étang, c’est ça ? J’y vais.' },
  ],
  'h5:wait': [{ who: 'mansaku', jp: 'わけ{狐|ぎつね}、まだ{板|いた}をかじっておる。', fr: 'Les renards rongent toujours les planches.' }],
  'h5:done': [
    { who: 'player', jp: 'もう{大丈夫|だいじょうぶ}だと{思|おも}います。', fr: 'Je pense que c’est réglé.' },
    { who: 'mansaku', jp: '……そうか。{古|ふる}い{釘|くぎ}じゃが、{鉄|てつ}は{鉄|てつ}じゃ。{持|も}っていけ。', fr: '… Je vois. Ce sont de vieux clous, mais le fer reste du fer. Prends-les.' },
  ],

  // ================= le salon de thé =================
  // Sans contrat ni demande, おみつ prend la commande. Ce qu'on dit à voix haute décide : le thé et les dango
  // rendent les forces, se reposer dans la pièce du fond ouvre la セーブ.
  'chaya:menu': [{ who: 'omitsu', jp: 'いらっしゃい。……{何|なに}にする？', fr: 'Bienvenue. … Qu’est-ce que tu prends ?' }],
  // Session 12 : la commande du joueur est tirée de craft.ts (`pick`) : le thé, les dango qu'on peut payer, le repos.
  'omitsu:make:mitarashi': [{ who: 'omitsu', jp: 'みたらし、ひとつね。……はい、どうぞ。', fr: 'Une mitarashi, d’accord. … Tiens, voilà.' }],
  'omitsu:make:sanshoku': [{ who: 'omitsu', jp: '{三色|さんしょく}{団子|だんご}。……{母|かあ}さんの{味|あじ}よ。', fr: 'Des dango tricolores. … Le goût de maman.' }],
  'omitsu:more': [{ who: 'omitsu', jp: 'ほかには？', fr: 'Autre chose ?' }],
  'omitsu:bye': [{ who: 'omitsu', jp: 'また{来|き}てね。', fr: 'Reviens quand tu veux.' }],
  // Après le col, おみつ se souvient des dango tricolores de sa mère : la deuxième recette.
  'omitsu:sanshoku': [
    { who: 'omitsu', jp: 'あのね。{母|かあ}さんの{三色|さんしょく}{団子|だんご}、{作|つく}り{方|かた}を{思|おも}い{出|だ}したの。', fr: 'Dis. Les dango tricolores de maman, je me suis souvenue de la recette.' },
    { who: 'omitsu', jp: 'お{米|こめ}が{四|よっ}つあれば、{包|つつ}むわ。', fr: 'Si tu as quatre mesures de riz, je t’en emballe.' },
    { who: 'wake', fr: 'Les みたらし rendent trois PV, les 三色 rendent tout. On les mange dans les herbes : touche C, ou le bouton 団子 de l’encart.' },
  ],
  // La première commande à emporter : ワケ explique.
  'chaya:dango': [{ who: 'wake', fr: 'Des dango à emporter : dans les herbes, touche C (ou le bouton 団子 de l’encart) pour en manger un. Les みたらし coûtent deux mesures de riz.' }],

  // ================= l'atelier de 萬作 (session 12) =================
  // Après le moulin, 萬作 se remet à l'ouvrage : pièces du sabre (une fois pour toutes) et 札 (chacun sert une fois).
  'craft:intro': [
    { who: 'mansaku', jp: 'お{前|まえ}さん、その{刀|かたな}。{柄|つか}の{糸|いと}が、ほつれておる。', fr: 'Toi, ton sabre. Le fil du manche s’effiloche.' },
    { who: 'mansaku', jp: '{材料|ざいりょう}を{持|も}ってくれば、わしが{直|なお}す。お{守|まも}りも{作|つく}れる。', fr: 'Apporte-moi des matériaux, et je le répare. Je sais faire des amulettes, aussi.' },
    { who: 'player', jp: 'ありがとうございます。お{願|ねが}いします。', fr: 'Merci beaucoup. Je compte sur vous.' },
    { who: 'wake', fr: 'Il se remet au travail, on dirait. Ce qu’il sait faire et ce qu’il lui faut : メニュー → 持ち物. Quand tu as de quoi payer, parle-lui et commande à voix haute.' },
  ],
  'mansaku:craft': [{ who: 'mansaku', jp: '{何|なに}を{作|つく}る？', fr: 'Qu’est-ce que je te fabrique ?' }],
  'mansaku:more': [{ who: 'mansaku', jp: 'ほかに、{何|なに}か{作|つく}るか？', fr: 'Je te fais autre chose ?' }],
  'mansaku:bye': [{ who: 'mansaku', jp: '……うむ。', fr: '… Hm.' }],
  'mansaku:make:tsukamaki': [{ who: 'mansaku', jp: '{糸|いと}を{巻|ま}きなおした。……{握|にぎ}ってみい。', fr: 'J’ai refait le fil du manche. … Essaie, tiens-le.' }],
  'mansaku:make:mamori': [{ who: 'mansaku', jp: 'お{守|まも}りじゃ。{一度|いちど}だけ、お{前|まえ}さんを{守|まも}る。', fr: 'Une amulette. Elle te protégera une fois.' }],
  'mansaku:make:tsuka': [{ who: 'mansaku', jp: '{新|あたら}しい{柄|つか}じゃ。{軽|かる}いぞ。', fr: 'Un manche neuf. Il est léger.' }],
  'mansaku:make:tsuba': [{ who: 'mansaku', jp: '{鍔|つば}じゃ。{古|ふる}い{鉄|てつ}じゃが、{丈夫|じょうぶ}じゃ。', fr: 'Une garde. Du vieux fer, mais solide.' }],
  'mansaku:make:yobi': [{ who: 'mansaku', jp: '{赤|あか}い{札|ふだ}じゃ。{朱|しゅ}の{言蟲|ことむし}が、{寄|よ}ってくる。', fr: 'Le talisman rouge. Les kotomushi vermillon viennent à lui.' }],
  'mansaku:make:saya': [{ who: 'mansaku', jp: '{鞘|さや}じゃ。……{久|ひさ}しぶりに、いい{仕事|しごと}をした。', fr: 'Un fourreau. … Ça faisait longtemps que je n’avais pas fait du bon travail.' }],
  // Pour `npm test` seulement : toutes les phrases de commande (lectures, lexique, phrases acceptées).
  'craft:orders': [ALL_ORDERS],

  'chaya:rest': [{ who: 'omitsu', jp: '{奥|おく}の{座敷|ざしき}、{使|つか}って。{静|しず}かよ。', fr: 'Prends la pièce du fond. C’est calme.' }],
  'chaya:wake': [{ who: 'wake', fr: 'Rien de tel qu’un thé brûlant. Tes forces sont revenues.' }],
  'down:wake': [{ who: 'wake', fr: 'Tu tenais à peine debout. Je t’ai ramené chez おみつ. Elle t’a laissé dormir dans la pièce du fond.' }],
  'chaya:sign': [
    { who: 'sign', jp: '{茶屋|ちゃや}　お{茶|ちゃ}　お{団子|だんご}', fr: 'Salon de thé. Thé, dango.' },
    { who: 'wake', fr: 'On entre, on commande à voix haute, on repart en forme. Et on peut s’y reposer.' },
  ],
  'chaya:menuboard': [
    { who: 'sign', jp: 'お{茶|ちゃ}　{四文|よんもん}', fr: 'Thé : quatre mon.' },
    { who: 'sign', jp: 'お{団子|だんご}　{一串|ひとくし}　{六文|ろくもん}', fr: 'Dango : six mon la brochette.' },
    { who: 'sign', jp: '{甘酒|あまざけ}　{八文|はちもん}', fr: 'Amazake : huit mon.' },
    { who: 'wake', fr: 'Le mon, c’est la petite monnaie d’ici. Note le compteur : 一串, une brochette.' },
  ],
  'chaya:kamidana': [
    { who: 'sign', jp: '{商売繁盛|しょうばいはんじょう}', fr: 'Prospérité du commerce.' },
    { who: 'wake', fr: 'Une amulette sur l’étagère des dieux. Pour que la boutique marche.' },
  ],
  'chaya:kamidana:letter': [
    { who: 'sign', jp: '{商売繁盛|しょうばいはんじょう}', fr: 'Prospérité du commerce.' },
    { who: 'sign', jp: 'みつへ。{都|みやこ}で、{元気|げんき}にしています。{母|はは}より。', fr: 'À Mitsu. Je vais bien, à la capitale. Ta mère.' },
    { who: 'wake', fr: 'Une lettre est arrivée, glissée sous l’amulette. Elle la relit souvent, on dirait : le papier est tout doux.' },
  ],
  'chaya:kamado': [
    { who: 'sign', jp: 'かまど', fr: 'Le fourneau.' },
    { who: 'wake', fr: 'Ça sent le riz grillé et la sauce sucrée. Ne touche pas, c’est brûlant.' },
  ],

  // ================= la maison-atelier de 萬作 =================
  'ie:plans': [
    { who: 'sign', jp: '{吊|つ}り{橋|ばし}　{図面|ずめん}', fr: 'Pont suspendu. Plan.' },
    { who: 'wake', fr: 'Des calculs partout dans la marge. Il a tout vérifié trois fois. Puis il a arrêté.' },
  ],
  'ie:plans:new': [
    { who: 'sign', jp: '{新|あたら}しい{吊|つ}り{橋|ばし}　{図面|ずめん}', fr: 'Nouveau pont suspendu. Plan.' },
    { who: 'wake', fr: 'Un plan tout neuf, l’encre à peine sèche. Il s’est remis au travail.' },
  ],
  'ie:tools': [
    { who: 'sign', jp: '{大工道具|だいくどうぐ}', fr: 'Outils de charpentier.' },
    { who: 'wake', fr: 'Les lames sont affûtées. Pour un vieux qui ne « fait plus rien », c’est bien entretenu.' },
  ],
  'ie:bench': [
    { who: 'sign', jp: '{作|つく}りかけの{棚|たな}', fr: 'Une étagère pas finie.' },
    { who: 'wake', fr: 'Même ses meubles restent en plan. Ce village, je te jure.' },
  ],
  'ie:butsudan': [
    { who: 'sign', jp: '{露|つゆ}', fr: 'Tsuyu.' },
    { who: 'wake', fr: 'Le nom de sa femme, sur la tablette. Une tasse de thé encore tiède devant.' },
  ],
  'ie:butsudan:ep': [
    { who: 'sign', jp: '{露|つゆ}', fr: 'Tsuyu.' },
    { who: 'wake', fr: 'Des dango d’おみつ en offrande, et une fleur des rizières. Il lui parle, maintenant, je crois.' },
  ],
  'ie:irori': [
    { who: 'sign', jp: '{囲炉裏|いろり}', fr: 'Le foyer.' },
    { who: 'wake', fr: 'Un foyer creusé dans le plancher. On s’assoit autour, on se tait. Lui, il se tait très bien.' },
  ],

  // ================= le moulin =================
  'mill:stone': [
    { who: 'sign', jp: '{石臼|いしうす}', fr: 'La meule.' },
    { who: 'wake', fr: 'Arrêtée. La farine d’hier sèche encore dans les rainures.' },
  ],
  'mill:stone:turn': [
    { who: 'sign', jp: '{石臼|いしうす}', fr: 'La meule.' },
    { who: 'wake', fr: 'Elle tourne ! Écoute ce grondement. Le petit a bien travaillé.' },
  ],
  'mill:notebook': [
    { who: 'sign', jp: '{水車|すいしゃ}の{帳面|ちょうめん}', fr: 'Le cahier du moulin.' },
    { who: 'sign', jp: '{今日|きょう}も、よく{回|まわ}った。{太一|たいち}が{手伝|てつだ}った。', fr: 'Aujourd’hui encore, la roue a bien tourné. Taichi a aidé.' },
    { who: 'sign', jp: '{太一|たいち}は、', fr: 'Taichi est…' },
    { who: 'wake', fr: 'La dernière page s’arrête là. Comme la phrase de l’ombre.' },
  ],
  'mill:drawing': [
    { who: 'sign', jp: 'じいちゃんの　すいしゃ', fr: 'Le moulin de grand-père.' },
    { who: 'wake', fr: 'Un dessin d’enfant, au charbon. La roue est énorme. Le grand-père, minuscule à côté, sourit.' },
  ],
  'mill:drawing:after': [
    { who: 'sign', jp: 'じいちゃんの　すいしゃ。ぼくが　まわす。', fr: 'Le moulin de grand-père. C’est moi qui le fais tourner.' },
    { who: 'wake', fr: 'Il a ajouté une ligne. Et un deuxième bonhomme, à côté du grand-père.' },
  ],
  'mill:rice': [
    { who: 'sign', jp: '{米俵|こめだわら}', fr: 'Des ballots de riz.' },
    { who: 'wake', fr: 'Le riz de tout le village passe ici. Enfin, passait.' },
  ],

  // ================= le sanctuaire =================
  'yashiro:yuisho': [
    { who: 'sign', jp: '{霧野神社|きりのじんじゃ}', fr: 'Sanctuaire de Kirino.' },
    { who: 'sign', jp: 'この{村|むら}を{守|まも}る{神|かみ}さまを、{祀|まつ}る。', fr: 'On y honore la divinité qui protège ce village.' },
  ],
  'yashiro:saisen': [
    { who: 'wake', fr: 'Le tronc des offrandes. Ici, on fait un vœu à voix haute. Vas-y.' },
    { who: 'player', jp: '{村|むら}の{霧|きり}が、{晴|は}れますように。', fr: 'Pourvu que la brume du village se lève.' },
    { who: 'wake', fr: 'Deux saluts, deux claquements de mains, un salut. Voilà. Le dieu a entendu, j’espère.' },
  ],
  'yashiro:saisen:ep': [
    { who: 'wake', fr: 'La brume est levée. Tu peux remercier, maintenant.' },
    { who: 'player', jp: 'ありがとうございました。', fr: 'Merci beaucoup.' },
    { who: 'wake', fr: 'Court et juste. J’aime bien.' },
  ],
  'yashiro:mirror': [
    { who: 'sign', jp: '{御神鏡|ごしんきょう}', fr: 'Le miroir sacré.' },
    { who: 'wake', fr: 'On ne s’y regarde pas, il paraît. C’est le dieu qui nous regarde.' },
  ],
  'omikuji:first': [{ who: 'wake', fr: 'Des おみくじ : on tire un oracle au hasard. Lis-le, je ne te dis rien.' }],
  'omikuji:1': [{ who: 'sign', jp: '{大吉|だいきち}　{待|ま}ち{人|びと}、{来|く}る。', fr: 'Grande chance. La personne attendue viendra.' }],
  'omikuji:2': [{ who: 'sign', jp: '{吉|きち}　{旅|たび}、よし。{急|いそ}ぐな。', fr: 'Chance. Voyage : favorable. Ne te presse pas.' }],
  'omikuji:3': [{ who: 'sign', jp: '{小吉|しょうきち}　{言葉|ことば}は、{最後|さいご}まで{言|い}え。', fr: 'Petite chance. Va au bout de tes phrases.' }],
  'omikuji:4': [{ who: 'sign', jp: '{末吉|すえきち}　{失|う}せ{物|もの}、{近|ちか}くにあり。', fr: 'Chance à venir. Objet perdu : il est tout près.' }],
  'omikuji:5': [
    { who: 'sign', jp: '{凶|きょう}　{今日|きょう}は、{静|しず}かにせよ。', fr: 'Malchance. Aujourd’hui, reste tranquille.' },
    { who: 'wake', fr: 'Un 凶. On l’attache à la corde, là, et on laisse le dieu s’en occuper.' },
  ],
  ema: [{ who: 'wake', fr: 'Des 絵馬 : des tablettes de bois où l’on écrit un vœu. On en lit une ?' }],
  'ema:1': [{ who: 'sign', jp: '{母|かあ}さんに、{会|あ}えますように。　みつ', fr: 'Pourvu que je revoie maman. Mitsu.' }],
  'ema:2': [{ who: 'sign', jp: 'いい{職人|しょくにん}に、なれますように。　{太一|たいち}', fr: 'Pourvu que je devienne un bon artisan. Taichi.' }],
  'ema:3': [{ who: 'sign', jp: '{稲|いね}が、たくさん{実|みの}りますように。　{権兵衛|ごんべえ}', fr: 'Pourvu que le riz donne beaucoup. Gonbei.' }],
  'ema:4': [{ who: 'sign', jp: '{孫|まご}が、{元気|げんき}でありますように。　たね', fr: 'Pourvu que mon petit-fils soit en bonne santé. Tane.' }],
  'ema:5': [
    { who: 'sign', jp: '{霧|きり}が、{晴|は}れますように。', fr: 'Pourvu que la brume se lève.' },
    { who: 'wake', fr: 'Pas de nom sur celle-là. L’écriture tremble, comme celle d’un vieil homme.' },
  ],

  // ================= le village : avis, étal, objets =================
  board: [
    { who: 'sign', jp: '{村|むら}のお{知|し}らせ', fr: 'Avis du village.' },
    { who: 'sign', jp: '{吊|つ}り{橋|ばし}は、{古|ふる}い。{一人|ひとり}ずつ、{渡|わた}ること。', fr: 'Le pont suspendu est vieux. Le traverser un par un.' },
    { who: 'sign', jp: '{夜|よる}は、{薄野原|すすきのはら}に{行|い}かないこと。', fr: 'La nuit, ne pas aller à Susukinohara.' },
  ],
  'board:1': [
    { who: 'sign', jp: '{村|むら}のお{知|し}らせ', fr: 'Avis du village.' },
    { who: 'sign', jp: '{水車|すいしゃ}が、また{回|まわ}る。{米|こめ}は、{水車小屋|すいしゃごや}へ。', fr: 'Le moulin tourne de nouveau. Le riz, au moulin.' },
    { who: 'sign', jp: '{吊|つ}り{橋|ばし}は、{古|ふる}い。{一人|ひとり}ずつ、{渡|わた}ること。', fr: 'Le pont suspendu est vieux. Le traverser un par un.' },
  ],
  'board:2': [
    { who: 'sign', jp: '{村|むら}のお{知|し}らせ', fr: 'Avis du village.' },
    { who: 'sign', jp: '{吊|つ}り{橋|ばし}は、{皆|みんな}で{直|なお}しました。', fr: 'Le pont suspendu a été réparé par tout le monde.' },
    { who: 'sign', jp: '{水車|すいしゃ}が、また{回|まわ}る。{米|こめ}は、{水車小屋|すいしゃごや}へ。', fr: 'Le moulin tourne de nouveau. Le riz, au moulin.' },
  ],
  'board:3': [
    { who: 'sign', jp: '{村|むら}のお{知|し}らせ', fr: 'Avis du village.' },
    { who: 'sign', jp: '{霧|きり}が{晴|は}れました。{十五夜|じゅうごや}に、お{月見|つきみ}をします。', fr: 'La brume s’est levée. À la pleine lune, on fera la fête de la lune.' },
    { who: 'sign', jp: 'お{団子|だんご}は、{茶屋|ちゃや}で。', fr: 'Les dango : au salon de thé.' },
  ],
  stall: [
    { who: 'sign', jp: '{漬物|つけもの}　{一皿|ひとさら}　{五文|ごもん}', fr: 'Pickles : cinq mon l’assiette.' },
    { who: 'sign', jp: '{大根|だいこん}　{一本|いっぽん}　{十文|じゅうもん}', fr: 'Radis blanc : dix mon pièce.' },
    { who: 'wake', fr: 'L’étal d’おたね. 一皿, 一本 : chaque chose a son compteur. Une assiette, un objet long.' },
  ],
  'yashiro:sign': [{ who: 'sign', jp: '{霧野神社|きりのじんじゃ}', fr: 'Sanctuaire de Kirino.' }],
  'door:shut': [{ who: 'wake', fr: 'Fermé. Il n’y a personne.' }],

  // ================= rumeurs entendues en passant (おはる et 茂吉, au puits) =================
  'gossip:1': [
    { who: 'oharu', jp: '{権兵衛|ごんべえ}さんの{田|た}んぼ、また{鳥|とり}。', fr: 'Les rizières de Gonbei, encore des oiseaux.' },
    { who: 'mokichi', jp: '{鳥|とり}。……また、{鳥|とり}。', fr: 'Des oiseaux. … Encore des oiseaux.' },
  ],
  'gossip:1:ep': [
    { who: 'oharu', jp: '{権兵衛|ごんべえ}さんの{田|た}んぼに、また{鳥|とり}が{来|き}たそうよ。', fr: 'Il paraît que des oiseaux sont encore venus dans les rizières de Gonbei.' },
    { who: 'mokichi', jp: '{鳥|とり}も、お{腹|なか}が{空|す}いておるんじゃろう。', fr: 'Les oiseaux aussi doivent avoir faim, va.' },
  ],
  'gossip:2': [
    { who: 'oharu', jp: '{薄野原|すすきのはら}に、{言蟲|ことむし}。{多|おお}い。', fr: 'À Susukinohara, des kotomushi. Beaucoup.' },
    { who: 'mokichi', jp: '{池|いけ}のほうは、{強|つよ}い。', fr: 'Du côté de l’étang, ils sont forts.' },
  ],
  'gossip:2:ep': [
    { who: 'oharu', jp: '{池|いけ}のほうの{言蟲|ことむし}は、{強|つよ}いそうよ。', fr: 'Il paraît que les kotomushi de l’étang sont forts.' },
    { who: 'mokichi', jp: '{近|ちか}づかんほうがいいと{思|おも}うがのう。', fr: 'Je pense qu’il vaut mieux ne pas s’en approcher, hein.' },
  ],
  'gossip:3': [
    { who: 'oharu', jp: 'おみつちゃんのお{団子|だんご}、{甘|あま}い。', fr: 'Les dango d’Omitsu, sucrés.' },
    { who: 'mokichi', jp: '{甘|あま}い。……{甘|あま}い。', fr: 'Sucrés. … Sucrés.' },
  ],
  'gossip:3:ep': [
    { who: 'oharu', jp: 'おみつちゃんのお{団子|だんご}、{甘|あま}すぎるかもしれないわね。', fr: 'Les dango d’Omitsu sont peut-être un peu trop sucrés.' },
    { who: 'mokichi', jp: 'わしは、ちょうどいいと{思|おも}うがのう。', fr: 'Moi, je les trouve juste comme il faut.' },
  ],
};
