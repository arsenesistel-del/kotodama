// Répliques des trois contrats du chapitre 1 (DESIGN, « La boucle » et « Chapitre 1 »).
// Pour chaque contrat : le don (le PNJ demande de l'aide), les témoins (on pose les questions à voix haute),
// le site (la créature répète le début de sa phrase, le joueur la finit : c'est la déduction), la phrase finale
// que la créature dit à l'apaisement, le souvenir doublé, l'explication de ワケ, le retour (discours rapporté :
// 「…」と言っていました) et la réplique d'après, où l'on entend revenir la fin perdue.
// Les répliques guéries ont le droit d'employer leur fin perdue : voir HEALED.
import type { Line } from './dialogue';

export const QUEST_SPEAKERS: Record<string, { name: string; face?: string }> = {
  kage: { name: '{欠|か}けの{影|かげ}' },
  yuragi: { name: '{揺|ゆ}らぎ' },
  kuzure: { name: '{崩|くず}れ' },
  genzo: { name: '{源造|げんぞう}' },
  yohei: { name: '{与平|よへい}' },
  waka: { name: '{若|わか}き{日|ひ}の{萬作|まんさく}' },
  tsuyu: { name: 'お{露|つゆ}' },
};

/** Dialogues où une fin perdue est rendue : la créature apaisée, et le village qui guérit. */
export const HEALED: Record<string, string[]> = {
  'c1:final': ['と思'],
  'c1:report': ['と思'],
  'c1:after': ['と思'],
  'c2:final': ['そうだ'],
  'c2:report': ['そうだ', 'そうよ'],
  'c2:after': ['そうだ', 'そうよ'],
  'c3:final': ['かもしれ'],
  'c3:report': ['かもしれ'],
  'c3:after': ['かもしれ'],
};

/** Peinture affichée derrière un souvenir (src/assets/memory/). */
export const MEMORY_ART: Record<string, string> = {
  'c1:memory': 'mem_mill',
  'c2:memory': 'mem_col',
  'c3:memory': 'mem_bridge',
};

const guess = (q: string, head: string, fr: string, tails: [string, string, string]): Line => ({
  who: 'player',
  fr: 'Finis sa phrase : dis celle qui est juste.',
  choices: [
    { jp: head + 'と{思|おも}う。', fr: `${fr} (je pense)`, act: `guess:${q}:omou` },
    { jp: head + 'かもしれない。', fr: `${fr} (peut-être)`, act: `guess:${q}:kamo` },
    { jp: head + 'そうだ。', fr: `${fr} (paraît-il)`, act: `guess:${q}:souda` },
  ].map((c, i) => ({ ...c, fr: tails[i] })),
});

export const QUEST_DIALOGUES: Record<string, Line[]> = {
  // ================= 一、水車小屋の影 (太一, と思う) =================
  'c1:give': [
    { who: 'taichi', jp: 'お{侍|さむらい}さん、お{願|ねが}い！{水車小屋|すいしゃごや}の{影|かげ}、{追|お}い{出|だ}して！', fr: 'Monsieur le samouraï, s’il te plaît ! Chasse l’ombre du moulin !' },
    { who: 'player', jp: 'わかりました。まず、{話|はなし}を{聞|き}かせてください。', fr: 'D’accord. Raconte-moi d’abord.' },
    { who: 'taichi', jp: '{影|かげ}がね、『{太一|たいち}は、いい{職人|しょくにん}に……』って。それで、{止|と}まっちゃった。', fr: 'L’ombre a dit « Taichi deviendra un bon artisan… », et puis elle s’est arrêtée.' },
    { who: 'player', jp: 'おじいさんの{声|こえ}だったんですか。', fr: 'C’était la voix de ton grand-père ?' },
    { who: 'taichi', jp: '……じいちゃんの{声|こえ}。じいちゃん、{去年|きょねん}の{冬|ふゆ}に、いなくなった。', fr: '… La voix de grand-père. Grand-père est parti l’hiver dernier.' },
    { who: 'wake', fr: 'Une phrase coupée en plein milieu, avec la voix de son grand-père. Pour la trancher, il faut savoir comment elle finissait.' },
    { who: 'wake', fr: 'Qui l’a connu, ce grand-père ? Demande à おたね, sur la place, et à 権兵衛, dans les rizières.' },
  ],
  'c1:otane': [
    { who: 'player', jp: '{太一|たいち}くんのおじいさんを{知|し}っていますか。', fr: 'Vous connaissiez le grand-père de Taichi ?' },
    { who: 'otane', jp: '{源造|げんぞう}さん。{水車|すいしゃ}の{職人|しょくにん}。……{毎日|まいにち}、{太一|たいち}を{見|み}てた。', fr: 'Genzō. L’artisan du moulin. … Tous les jours, il regardait Taichi.' },
    { who: 'player', jp: 'おじいさんは、{太一|たいち}くんに{何|なに}か{言|い}っていましたか。', fr: 'Il disait quelque chose à Taichi ?' },
    { who: 'otane', jp: '{何|なに}も。……でも、{目|め}が{言|い}ってた。あの{子|こ}は、いい{子|こ}だって。', fr: 'Rien. … Mais ses yeux le disaient. Que ce petit était un bon petit.' },
    { who: 'wake', fr: 'Il ne disait rien, mais ses yeux parlaient pour lui. Retiens ça.' },
  ],
  'c1:gonbei': [
    { who: 'player', jp: '{源造|げんぞう}さんは、どんな{人|ひと}でしたか。', fr: 'Quel genre d’homme était Genzō ?' },
    { who: 'gonbei', jp: '{頑固|がんこ}。{噂|うわさ}、{聞|き}かない。{自分|じぶん}の{目|め}で、{見|み}る。', fr: 'Têtu. Les rumeurs, il ne les écoute pas. Il voit de ses propres yeux.' },
    { who: 'player', jp: '{迷|まよ}うことは、ありましたか。', fr: 'Il lui arrivait d’hésiter ?' },
    { who: 'gonbei', jp: 'ない。{一度|いちど}も。', fr: 'Non. Pas une fois.' },
    { who: 'wake', fr: 'Pas un homme de rumeurs, et jamais une hésitation. Je crois qu’on en sait assez. Au moulin !' },
  ],
  'c1:site': [
    { who: 'kage', jp: '{太一|たいち}は、いい{職人|しょくにん}に……。', fr: 'Taichi, un bon artisan, il…' },
    { who: 'wake', fr: 'La voilà. Elle répète le début, jamais la fin.' },
    { who: 'wake', fr: 'Finis sa phrase à voix haute. Choisis bien : ta lame prendra la fin que tu diras.' },
    guess('c1', '{太一|たいち}は、いい{職人|しょくにん}になる', 'Taichi deviendra un bon artisan', [
      'Taichi deviendra un bon artisan, je pense.',
      'Taichi deviendra peut-être un bon artisan.',
      'Taichi deviendra un bon artisan, paraît-il.',
    ]),
    { who: 'wake', fr: 'Allons-y.' },
  ],
  'c1:final': [{ who: 'genzo', jp: '{太一|たいち}は、いい{職人|しょくにん}になると{思|おも}う。', fr: 'Je pense que Taichi deviendra un bon artisan.' }],
  'c1:memory': [
    { who: 'genzo', jp: '{太一|たいち}、{今日|きょう}も{水車|すいしゃ}を{見|み}ておったか。', fr: 'Taichi, tu as encore regardé la roue aujourd’hui ?' },
    { who: 'taichi', jp: 'うん！ぼく、じいちゃんみたいになるもん！', fr: 'Oui ! Moi, je serai comme grand-père !' },
    { who: 'genzo', jp: '……そうか。{太一|たいち}は、いい{職人|しょくにん}に……。', fr: '… Je vois. Taichi, un bon artisan, il…' },
    { who: 'genzo', jp: '……ごほっ。もう{寝|ね}ろ。{冬|ふゆ}は、{冷|ひ}える。', fr: '… Kof. Va dormir. L’hiver, il fait froid.' },
    { who: 'wake', fr: 'Il n’a jamais fini. Et l’hiver l’a emporté.' },
  ],
  'c1:right': [
    { who: 'wake', fr: 'Bien vu : c’était son avis à lui. Ta lame portait la bonne fin, elle a coupé plus profond.' },
    { who: 'wake', fr: 'Retourne voir 太一. Il doit savoir ce que disait son grand-père.' },
  ],
  'c1:wrong': [
    { who: 'wake', fr: 'Ce n’était pas la bonne fin. Il ne doutait jamais et n’écoutait pas les rumeurs, 権兵衛 l’a dit. Ses yeux disaient ce qu’il pensait : c’était son avis, と思う.' },
    { who: 'wake', fr: 'Retourne voir 太一. Il doit savoir ce que disait son grand-père.' },
  ],
  'c1:report': [
    { who: 'taichi', jp: 'お{侍|さむらい}さん！{影|かげ}は？', fr: 'Monsieur le samouraï ! Et l’ombre ?' },
    { who: 'player', jp: 'おじいさんは、「{太一|たいち}は、いい{職人|しょくにん}になると{思|おも}う」と{言|い}っていました。', fr: 'Ton grand-père disait : « Je pense que Taichi deviendra un bon artisan. »' },
    { who: 'taichi', jp: '……じいちゃんが？', fr: '… Grand-père a dit ça ?' },
    { who: 'taichi', jp: 'ぼく、{水車|すいしゃ}を{直|なお}す！じいちゃんみたいな{職人|しょくにん}に、なれると{思|おも}う！', fr: 'Je vais réparer le moulin ! Je crois que je peux devenir un artisan comme grand-père !' },
    { who: 'wake', fr: 'Tu as entendu ? と思う. Il vient de donner son avis. Le premier, dans ce village, depuis longtemps.' },
    { who: 'wake', fr: 'Au fait, おみつ voulait nous parler du col. Sa phrase s’était arrêtée net, tu te souviens ?' },
  ],
  'c1:after': [
    { who: 'taichi', jp: '{見|み}て！{水車|すいしゃ}、{回|まわ}ってる！', fr: 'Regarde ! La roue, elle tourne !' },
    { who: 'taichi', jp: 'じいちゃんも、{喜|よろこ}んでいると{思|おも}う。', fr: 'Je crois que grand-père est content, lui aussi.' },
    { who: 'player', jp: 'きっと{喜|よろこ}んでいると{思|おも}います。', fr: 'Je suis sûr qu’il est content.' },
  ],

  // ================= 二、峠の噂 (おみつ, そうだ) =================
  'c2:give': [
    { who: 'omitsu', jp: 'お{客|きゃく}さん。{太一|たいち}の{影|かげ}、{消|け}してくれたのね。', fr: 'Dis donc. C’est toi qui as fait disparaître l’ombre de Taichi.' },
    { who: 'omitsu', jp: 'あたしも、お{願|ねが}いがあるの。……{峠|とうげ}で、{夜|よる}になると、{声|こえ}がするの。', fr: 'Moi aussi, j’ai un service à te demander. … Au col, quand la nuit tombe, on entend une voix.' },
    { who: 'player', jp: 'どんな{声|こえ}ですか。', fr: 'Quel genre de voix ?' },
    { who: 'omitsu', jp: '{男|おとこ}の{人|ひと}の{声|こえ}。『お{前|まえ}の{母|かあ}さんは、{都|みやこ}で……』って。そこで、{止|と}まるの。', fr: 'Une voix d’homme. « Ta mère, à la capitale… » Et ça s’arrête là.' },
    { who: 'player', jp: 'お{母|かあ}さんは、{都|みやこ}にいるんですか。', fr: 'Ta mère est à la capitale ?' },
    { who: 'omitsu', jp: '……あたしが{小|ちい}さいとき、{都|みやこ}に{行|い}った。それから、{何|なに}も{知|し}らない。', fr: '… Elle est partie à la capitale quand j’étais petite. Depuis, je ne sais rien.' },
    { who: 'wake', fr: 'Un homme qui parle de sa mère, coincé au col. Qui passait par là ? 萬作 connaît tout le monde. Et 権兵衛 voit arriver tous ceux qui montent par la grand-route.' },
  ],
  'c2:mansaku': [
    { who: 'player', jp: '{峠|とうげ}を{通|とお}る{人|ひと}を{知|し}っていますか。', fr: 'Vous connaissez des gens qui passent par le col ?' },
    { who: 'mansaku', jp: '{秋|あき}に、{薬売|くすりう}りが{来|き}ておった。{与平|よへい}という{男|おとこ}じゃ。{都|みやこ}から、{毎年|まいとし}。', fr: 'À l’automne, il venait un marchand de remèdes. Un nommé Yohei. De la capitale, chaque année.' },
    { who: 'player', jp: '{与平|よへい}さんは、おみつさんのお{母|かあ}さんに{会|あ}ったんですか。', fr: 'Yohei avait rencontré la mère d’Omitsu ?' },
    { who: 'mansaku', jp: 'いや、{会|あ}ってはおらん。あの{男|おとこ}は、{都|みやこ}で{人|ひと}から{聞|き}いた{話|はなし}を、{運|はこ}ぶだけじゃ。', fr: 'Non, il ne l’a pas vue. Cet homme-là ne fait que transporter ce qu’on lui raconte à la capitale.' },
    { who: 'wake', fr: 'Il ne l’a pas vue lui-même, donc. Il rapportait ce qu’on lui avait dit.' },
  ],
  'c2:gonbei': [
    { who: 'player', jp: '{去年|きょねん}の{秋|あき}、{与平|よへい}さんを{見|み}ましたか。', fr: 'L’automne dernier, vous avez vu Yohei ?' },
    { who: 'gonbei', jp: '{見|み}た。{峠|とうげ}の{上|うえ}。{霧|きり}の{中|なか}。……{下|お}りてこなかった。', fr: 'Vu. En haut du col. Dans le brouillard. … Il n’est pas descendu.' },
    { who: 'player', jp: '{与平|よへい}さんは、{何|なに}か{言|い}っていましたか。', fr: 'Il disait quelque chose ?' },
    { who: 'gonbei', jp: '{確|たし}かな{話|はなし}。{都|みやこ}で{聞|き}いた、{確|たし}かな{話|はなし}。……そう、{言|い}ってた。', fr: 'Une nouvelle sûre. Une nouvelle sûre, entendue à la capitale. … C’est ce qu’il disait.' },
    { who: 'wake', fr: 'Une nouvelle sûre, mais entendue de la bouche d’un autre. Je crois qu’on sait comment finit sa phrase. Le col, près du 地蔵.' },
  ],
  'c2:site': [
    { who: 'yuragi', jp: 'お{前|まえ}の{母|かあ}さんは、{都|みやこ}で{元気|げんき}に{暮|く}らして……。', fr: 'Ta mère, à la capitale, elle vit en bonne santé…' },
    { who: 'wake', fr: 'Elle tremble comme une lanterne au vent. Finis sa phrase.' },
    guess('c2', 'お{前|まえ}の{母|かあ}さんは、{都|みやこ}で{元気|げんき}に{暮|く}らしている', 'Ta mère vit en bonne santé à la capitale', [
      'Je pense que ta mère vit en bonne santé à la capitale.',
      'Ta mère vit peut-être en bonne santé à la capitale.',
      'Il paraît que ta mère vit en bonne santé à la capitale.',
    ]),
    { who: 'wake', fr: 'Allons-y.' },
  ],
  'c2:final': [{ who: 'yohei', jp: 'お{前|まえ}の{母|かあ}さんは、{都|みやこ}で{元気|げんき}に{暮|く}らしているそうだ。', fr: 'Il paraît que ta mère vit en bonne santé à la capitale.' }],
  'c2:memory': [
    { who: 'yohei', jp: '{都|みやこ}で、{確|たし}かな{話|はなし}を{聞|き}いた。おみつの{母|かあ}さんの{話|はなし}だ。', fr: 'À la capitale, j’ai appris une nouvelle sûre. Sur la mère d’Omitsu.' },
    { who: 'yohei', jp: '……{霧|きり}が{濃|こ}い。{今夜|こんや}は、{下|お}りられない。', fr: '… Le brouillard est épais. Ce soir, impossible de descendre.' },
    { who: 'yohei', jp: '{明日|あした}、{言|い}おう。「お{前|まえ}の{母|かあ}さんは、{都|みやこ}で{元気|げんき}に……」', fr: 'Je le dirai demain. « Ta mère, à la capitale, elle vit en bonne santé… »' },
    { who: 'wake', fr: 'Il a remis ça au lendemain. Le lendemain, la brume ne s’est pas levée, et il a repris la route sans descendre. La phrase, elle, est restée au col.' },
  ],
  'c2:right': [
    { who: 'wake', fr: 'Bien vu : une nouvelle sûre, mais de seconde main. そうだ. Ta lame l’a sentie.' },
    { who: 'wake', fr: 'おみつ attend. Va lui dire.' },
  ],
  'c2:wrong': [
    { who: 'wake', fr: 'Pas tout à fait. Il ne l’avait pas vue lui-même, 萬作 l’a dit, et ce n’était pas un doute : une nouvelle sûre, entendue à la capitale. Ce qu’on t’a dit, c’est そうだ.' },
    { who: 'wake', fr: 'おみつ attend. Va lui dire.' },
  ],
  'c2:report': [
    { who: 'omitsu', jp: '……{峠|とうげ}の{声|こえ}、{消|き}えた。', fr: '… La voix du col s’est tue.' },
    { who: 'player', jp: '{与平|よへい}さんは、「お{前|まえ}の{母|かあ}さんは、{都|みやこ}で{元気|げんき}に{暮|く}らしているそうだ」と{言|い}っていました。', fr: 'Yohei disait : « Il paraît que ta mère vit en bonne santé à la capitale. »' },
    { who: 'omitsu', jp: '……{母|かあ}さん、{都|みやこ}で{元気|げんき}にしているそうよ。……よかった。', fr: '… Il paraît que maman va bien, à la capitale. … Tant mieux.' },
    { who: 'omitsu', jp: 'お{団子|だんご}、{食|た}べて。{今日|きょう}は、ただでいいわ。', fr: 'Mange des dango. Aujourd’hui, c’est gratuit.' },
    { who: 'wake', fr: 'そうよ : elle rapporte une nouvelle. Le village retrouve ses rumeurs. Ça va faire du bruit, je te préviens.' },
    { who: 'wake', fr: 'Reste 萬作. Il tourne autour de son pont depuis qu’on est arrivés.' },
  ],
  'c2:after': [
    { who: 'omitsu', jp: 'あら、あんた。{聞|き}いて。{権兵衛|ごんべえ}さん、お{嫁|よめ}さんを{探|さが}しているそうよ。', fr: 'Ah, toi. Écoute. Il paraît que Gonbei se cherche une épouse.' },
    { who: 'omitsu', jp: '……{内緒|ないしょ}よ。', fr: '… C’est un secret.' },
  ],

  // ================= 三、吊り橋 (萬作, かもしれない) =================
  'c3:give': [
    { who: 'mansaku', jp: 'お{前|まえ}さん。……{吊|つ}り{橋|ばし}に、{影|かげ}が{出|で}る。', fr: 'Toi. … Sur le pont suspendu, il y a une ombre.' },
    { who: 'mansaku', jp: '{若|わか}い{男|おとこ}の{影|かげ}じゃ。{縄|なわ}を、じっと{見|み}ておる。', fr: 'L’ombre d’un jeune homme. Elle fixe les cordes.' },
    { who: 'player', jp: '{萬作|まんさく}さんが{架|か}けた{橋|はし}なんですか。', fr: 'C’est le pont que vous avez construit ?' },
    { who: 'mansaku', jp: '……{四十年|よんじゅうねん}{前|まえ}じゃ。わしが、{架|か}けた。', fr: '… Il y a quarante ans. C’est moi qui l’ai construit.' },
    { who: 'mansaku', jp: '{頼|たの}む。あの{影|かげ}を、{静|しず}めてくれ。', fr: 'Je t’en prie. Apaise cette ombre.' },
    { who: 'wake', fr: 'Il n’en dira pas plus. おたね le connaît depuis toujours. Et 太一 traîne partout, il a peut-être vu quelque chose.' },
  ],
  'c3:otane': [
    { who: 'player', jp: '{萬作|まんさく}さんは、{橋|はし}のことを{何|なに}か{言|い}っていましたか。', fr: 'Mansaku disait quelque chose sur le pont ?' },
    { who: 'otane', jp: '{何|なに}も。でも、{毎晩|まいばん}、{縄|なわ}を{見|み}に{行|い}く。{四十年|よんじゅうねん}、{毎晩|まいばん}。', fr: 'Rien. Mais chaque soir, il va voir les cordes. Quarante ans, chaque soir.' },
    { who: 'player', jp: 'どうして{毎晩|まいばん}{見|み}に{行|い}くんですか。', fr: 'Pourquoi va-t-il les voir chaque soir ?' },
    { who: 'otane', jp: 'わからない。……あの{人|ひと}、いつも、わからない{顔|かお}。', fr: 'Je ne sais pas. … Il a toujours cette tête de quelqu’un qui ne sait pas.' },
    { who: 'wake', fr: 'Quarante ans à vérifier, sans jamais savoir. Retiens ce visage-là.' },
  ],
  'c3:taichi': [
    { who: 'player', jp: '{吊|つ}り{橋|ばし}の{影|かげ}を{見|み}ましたか。', fr: 'Tu as vu l’ombre du pont suspendu ?' },
    { who: 'taichi', jp: '{見|み}た！{若|わか}いお{兄|にい}さん。{縄|なわ}をさわって、{首|くび}を、こう、かしげてた。', fr: 'Oui ! Un jeune homme. Il touchait les cordes et il penchait la tête, comme ça.' },
    { who: 'player', jp: 'その{人|ひと}は、だれかと{話|はな}していましたか。', fr: 'Il parlait avec quelqu’un ?' },
    { who: 'taichi', jp: 'ううん。ひとりごと。だれも、いなかった。', fr: 'Non. Il parlait tout seul. Il n’y avait personne.' },
    { who: 'wake', fr: 'Personne ne lui avait rien raconté : il parlait tout seul, à ses cordes. Et il penchait la tête. Le pont, maintenant.' },
  ],
  'c3:site': [
    { who: 'kuzure', jp: 'この{橋|はし}は、もう{長|なが}くは……。', fr: 'Ce pont, il ne va plus longtemps…' },
    { who: 'wake', fr: 'Elle grince comme le pont. Finis sa phrase.' },
    guess('c3', 'この{橋|はし}は、もう{長|なが}くはもたない', 'Ce pont ne tiendra plus longtemps', [
      'Je pense que ce pont ne tiendra plus longtemps.',
      'Ce pont ne tiendra peut-être plus longtemps.',
      'Il paraît que ce pont ne tiendra plus longtemps.',
    ]),
    { who: 'wake', fr: 'Allons-y. Et ne regarde pas en bas.' },
  ],
  'c3:final': [{ who: 'waka', jp: 'この{橋|はし}は、もう{長|なが}くはもたないかもしれない。', fr: 'Ce pont ne tiendra peut-être plus longtemps.' }],
  'c3:memory': [
    { who: 'tsuyu', jp: '{萬作|まんさく}さん、こんな{夜|よる}に、どうしたの？', fr: 'Mansaku, qu’est-ce que tu fais là, à une heure pareille ?' },
    { who: 'waka', jp: '……{縄|なわ}を{見|み}ていた。この{橋|はし}は、もう{長|なが}くは……。', fr: '… Je regardais les cordes. Ce pont, il ne va plus longtemps…' },
    { who: 'waka', jp: 'いや、{何|なん}でもない。{帰|かえ}ろう、{露|つゆ}。', fr: 'Non, rien. Rentrons, Tsuyu.' },
    { who: 'tsuyu', jp: '……うん。', fr: '… D’accord.' },
    { who: 'wake', fr: 'Il n’était pas sûr. Alors il n’a rien dit, et il a vérifié les cordes chaque nuit, pendant quarante ans.' },
  ],
  'c3:right': [
    { who: 'wake', fr: 'Bien vu : il n’était pas sûr, c’était un doute. かもしれない. Ta lame a tremblé juste comme il fallait.' },
    { who: 'wake', fr: 'Va voir 萬作.' },
  ],
  'c3:wrong': [
    { who: 'wake', fr: 'Pas la bonne fin. Personne ne lui avait rien dit, il parlait tout seul, et il ne savait pas : おたね l’a vu sur son visage pendant quarante ans. C’était un doute : かもしれない.' },
    { who: 'wake', fr: 'Va voir 萬作.' },
  ],
  'c3:report': [
    { who: 'mansaku', jp: '……{影|かげ}は、{消|き}えたか。', fr: '… L’ombre a disparu ?' },
    { who: 'player', jp: '{若|わか}い{萬作|まんさく}さんは、「この{橋|はし}は、もう{長|なが}くはもたないかもしれない」と{言|い}っていました。', fr: 'Le jeune Mansaku disait : « Ce pont ne tiendra peut-être plus longtemps. »' },
    { who: 'mansaku', jp: '……{言|い}えなかった。{四十年|よんじゅうねん}じゃ。', fr: '… Je n’ai jamais pu le dire. Quarante ans.' },
    { who: 'mansaku', jp: '{明日|あした}、{皆|みな}で{縄|なわ}を{張|は}り{替|か}える。……まだ、{間|ま}に{合|あ}うかもしれん。', fr: 'Demain, on change les cordes, tous ensemble. … Il est peut-être encore temps.' },
    { who: 'wake', fr: 'かもしれん : un doute, enfin dit à voix haute. Chez lui, ça vaut un discours.' },
    { who: 'wake', fr: 'Trois phrases rendues. Et pourtant la brume ne se lève pas. Elle est plus épaisse que jamais, là-haut, sur la colline du cimetière.' },
  ],
  'c3:after': [
    { who: 'mansaku', jp: 'お{前|まえ}さんか。{縄|なわ}は、{新|あたら}しくなった。', fr: 'Ah, c’est toi. Les cordes sont neuves.' },
    { who: 'mansaku', jp: '……{霧|きり}は、まだ{晴|は}れん。あの{丘|おか}かもしれんのう。', fr: '… La brume ne se lève toujours pas. C’est peut-être cette colline, hein.' },
  ],

  // ================= sites hors contrat, défaite =================
  'site-mill': [
    { who: 'sign', jp: '{水車小屋|すいしゃごや}', fr: 'Le moulin à eau.' },
    { who: 'wake', fr: 'La roue ne tourne plus. L’eau passe à côté, comme si de rien n’était.' },
  ],
  'site-mill:done': [
    { who: 'sign', jp: '{水車小屋|すいしゃごや}', fr: 'Le moulin à eau.' },
    { who: 'wake', fr: 'Elle tourne. Il paraît que 太一 vient la graisser tous les matins.' },
  ],
  'site-jizo': [
    { who: 'sign', jp: 'お{地蔵|じぞう}さま', fr: 'Un jizō, gardien des voyageurs.' },
    { who: 'wake', fr: 'Quelqu’un lui a laissé une offrande. Un voyageur qui avait peur de la brume, sans doute.' },
  ],
  'hunt:lost': [{ who: 'wake', fr: 'Elle tient encore. Sa phrase n’a pas bougé : on y retourne quand tu veux.' }],
};
