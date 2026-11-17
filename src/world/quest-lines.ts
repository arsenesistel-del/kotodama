// Répliques des trois contrats du chapitre 1 (DESIGN, « La boucle » et « Chapitre 1 »).
// Pour chaque contrat : le don (le PNJ demande de l'aide), les témoins (on pose les questions à voix haute),
// le site (la créature répète le début de sa phrase, le joueur la finit : c'est la déduction), la phrase finale
// que la créature dit à l'apaisement, le souvenir doublé, l'explication de ワケ, le retour (discours rapporté :
// 「…」と言っていました) et la réplique d'après, où l'on entend revenir la fin perdue.
// Les répliques guéries ont le droit d'employer leur fin perdue : voir HEALED.
import type { Line } from './dialogue';
import { STORY_HEALED } from './story-lines';

export const QUEST_SPEAKERS: Record<string, { name: string; face?: string }> = {
  kage: { name: '{欠|か}けの{影|かげ}' },
  yuragi: { name: '{揺|ゆ}らぎ' },
  kuzure: { name: '{崩|くず}れ' },
  genzo: { name: '{源造|げんぞう}' },
  yohei: { name: '{与平|よへい}' },
  waka: { name: '{若|わか}き{日|ひ}の{萬作|まんさく}' },
  tsuyu: { name: 'お{露|つゆ}' },
  tsubu: { name: '{呟|つぶや}き' },
  mayoi: { name: '{迷|まよ}い' },
  kiri: { name: '{霧|きり}の{主|ぬし}' },
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
  'r1:give': ['そうよ'],
  'r1:final': ['と思'],
  'r1:report': ['と思'],
  'r1:after': [],
  'r2:give': ['そうよ'],
  'r2:final': ['かもしれ'],
  'r2:report': ['かもしれ'],
  'r2:after': ['と思'],
  'c4:omitsu': ['と思'],
  'c4:final': ['んじゃ'],
  'c4:report': ['かもしれ'],
  ...STORY_HEALED,
};

/** Peinture affichée derrière un souvenir (src/assets/memory/). */
export const MEMORY_ART: Record<string, string> = {
  'c1:memory': 'mem_mill',
  'c2:memory': 'mem_col',
  'c3:memory': 'mem_bridge',
  'r1:memory': 'mem_well',
  'r2:memory': 'mem_field',
  'c4:memory': 'mem_bedside',
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

// Le cœur de la brume : quatre fins possibles, dont んだ (on explique).
const guess4 = (q: string, head: string, tails: [string, string, string, string]): Line => ({
  who: 'player',
  fr: 'Finis sa phrase : dis celle qui est juste.',
  choices: [
    { jp: head + 'と{思|おも}う。', fr: tails[0], act: `guess:${q}:omou` },
    { jp: head + 'かもしれない。', fr: tails[1], act: `guess:${q}:kamo` },
    { jp: head + 'そうだ。', fr: tails[2], act: `guess:${q}:souda` },
    { jp: head + 'んだ。', fr: tails[3], act: `guess:${q}:ndesu` },
  ],
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

  // ================= 小、井戸の呟き (おみつ, révision : と思う) =================
  'r1:give': [
    { who: 'omitsu', jp: 'あんた、{聞|き}いて！{井戸|いど}の{底|そこ}から、{夜|よる}になると{声|こえ}がするそうよ。', fr: 'Toi, écoute ! Il paraît qu’au fond du puits, la nuit, on entend une voix.' },
    { who: 'player', jp: 'どんな{声|こえ}ですか。', fr: 'Quel genre de voix ?' },
    { who: 'omitsu', jp: 'おじいさんの{声|こえ}。『おみつのお{団子|だんご}は……』って。……あたしのお{団子|だんご}よ？', fr: 'Une voix de vieux. « Les dango d’Omitsu… ». … Mes dango à moi ?' },
    { who: 'omitsu', jp: '{続|つづ}きが{気|き}になって、{夜|よる}も{眠|ねむ}れないの。お{願|ねが}い、{調|しら}べて！', fr: 'Je veux savoir la suite, je n’en dors plus. S’il te plaît, va voir !' },
    { who: 'wake', fr: 'Elle a retrouvé ses rumeurs, et elle ne va plus s’arrêter. Bon. Qui traîne près du puits ? 太一 joue partout. Et おたね est toujours sur la place.' },
  ],
  'r1:taichi': [
    { who: 'player', jp: '{夜|よる}、{井戸|いど}のそばで、だれかを{見|み}ましたか。', fr: 'La nuit, tu as vu quelqu’un près du puits ?' },
    { who: 'taichi', jp: '{見|み}た！{萬作|まんさく}じいちゃん。ひとりで、お{団子|だんご}を{食|た}べてた。', fr: 'Oui ! Papi Mansaku. Il mangeait des dango, tout seul.' },
    { who: 'player', jp: '{何|なに}か{言|い}っていましたか。', fr: 'Il disait quelque chose ?' },
    { who: 'taichi', jp: '『うまい』って。{小|ちい}さい{声|こえ}で。でも、おみつ{姉|ねえ}ちゃんの{前|まえ}では、『{甘|あま}い』しか{言|い}わないもん。', fr: '« C’est bon », tout bas. Mais devant Omitsu, il ne dit que « c’est sucré ».' },
    { who: 'wake', fr: 'Tout bas, quand personne n’écoute. Un avis qu’on garde pour soi, ça.' },
  ],
  'r1:otane': [
    { who: 'player', jp: '{萬作|まんさく}さんは、おみつさんのお{団子|だんご}をよく{食|た}べるんですか。', fr: 'Mansaku mange souvent les dango d’Omitsu ?' },
    { who: 'otane', jp: '{毎日|まいにち}。{雨|あめ}の{日|ひ}も、{霧|きり}の{日|ひ}も。', fr: 'Tous les jours. Les jours de pluie, les jours de brume.' },
    { who: 'player', jp: 'だれかと、お{団子|だんご}の{話|はなし}をしますか。', fr: 'Il en parle avec quelqu’un, de ces dango ?' },
    { who: 'otane', jp: 'しない。あの{人|ひと}は、{人|ひと}の{話|はなし}より、{自分|じぶん}の{舌|した}。', fr: 'Non. Lui, il se fie à sa langue, pas à ce qu’on raconte.' },
    { who: 'wake', fr: 'Il ne répète personne, et il ne doute pas : tous les jours, par tous les temps. C’est son goût à lui. Le puits, maintenant.' },
  ],
  'r1:site': [
    { who: 'tsubu', jp: 'おみつのお{団子|だんご}は、うまい……。', fr: 'Les dango d’Omitsu, ils sont bons…' },
    { who: 'wake', fr: 'Il marmonne au fond de l’eau. Finis sa phrase.' },
    guess('r1', 'おみつのお{団子|だんご}は、うまい', 'Les dango d’Omitsu sont bons', [
      'Je trouve que les dango d’Omitsu sont bons.',
      'Les dango d’Omitsu sont peut-être bons.',
      'Il paraît que les dango d’Omitsu sont bons.',
    ]),
    { who: 'wake', fr: 'Allons-y. Et ne tombe pas dedans.' },
  ],
  'r1:final': [{ who: 'mansaku', jp: 'おみつのお{団子|だんご}は、うまいと{思|おも}う。', fr: 'Je trouve que les dango d’Omitsu sont bons.' }],
  'r1:memory': [
    { who: 'omitsu', jp: '{萬作|まんさく}さん、お{団子|だんご}、どう？', fr: 'Mansaku, les dango, comment tu les trouves ?' },
    { who: 'mansaku', jp: '……{甘|あま}い。', fr: '… Sucrés.' },
    { who: 'omitsu', jp: 'それだけ？', fr: 'C’est tout ?' },
    { who: 'mansaku', jp: '……それだけじゃ。', fr: '… C’est tout.' },
    { who: 'mansaku', jp: '（……おみつのお{団子|だんご}は、うまい……）', fr: '(… Les dango d’Omitsu, ils sont bons…)' },
    { who: 'wake', fr: 'Il n’a jamais pu le lui dire en face. Alors il l’a dit au puits, tous les soirs. Le puits a fini par répondre.' },
  ],
  'r1:right': [
    { who: 'wake', fr: 'Bien vu : son goût à lui. Pas un on-dit, pas un doute. と思う.' },
    { who: 'wake', fr: 'Va le dire à おみつ. Je veux voir sa tête.' },
  ],
  'r1:wrong': [
    { who: 'wake', fr: 'Raté. Il en mangeait tous les jours et se fiait à sa langue, pas aux rumeurs : おたね l’a dit. C’était son avis : と思う.' },
    { who: 'wake', fr: 'Va le dire à おみつ. Je veux voir sa tête.' },
  ],
  'r1:report': [
    { who: 'omitsu', jp: 'どうだった？{井戸|いど}の{声|こえ}は？', fr: 'Alors ? La voix du puits ?' },
    { who: 'player', jp: '{萬作|まんさく}さんは、「おみつのお{団子|だんご}は、うまいと{思|おも}う」と{言|い}っていました。', fr: 'Mansaku disait : « Je trouve que les dango d’Omitsu sont bons. »' },
    { who: 'omitsu', jp: '……{萬作|まんさく}さんが？{毎日|まいにち}{来|き}て、『{甘|あま}い』しか{言|い}わないのに？', fr: '… Mansaku ? Il vient tous les jours et il ne dit que « sucrés » !' },
    { who: 'omitsu', jp: '……ふふ。{明日|あした}から、{一本|いっぽん}おまけしようかしら。', fr: '… Hi hi. À partir de demain, je lui mets une brochette en plus, tiens.' },
    { who: 'wake', fr: 'Un tout petit contrat. Je crois que c’est mon préféré.' },
  ],
  'r1:after': [
    { who: 'omitsu', jp: '{萬作|まんさく}さん、{今日|きょう}も{来|き}たわ。『{甘|あま}い』って。', fr: 'Mansaku est encore venu aujourd’hui. « Sucrés », qu’il a dit.' },
    { who: 'omitsu', jp: '……でも、{一本|いっぽん}{多|おお}く{食|た}べたの。', fr: '… Mais il en a mangé une de plus.' },
  ],

  // ================= 小、案山子の迷い (おたね, révision : かもしれない) =================
  'r2:give': [
    { who: 'otane', jp: '{旅|たび}の{人|ひと}。{田|た}んぼの{案山子|かかし}が、{夕方|ゆうがた}になると、しゃべるそうよ。', fr: 'Voyageur. Il paraît que l’épouvantail des rizières parle, au crépuscule.' },
    { who: 'otane', jp: '{権兵衛|ごんべえ}さんの{声|こえ}で。『おたねさんの{漬物|つけもの}は……』って。', fr: 'Avec la voix de Gonbei. « Les pickles d’Otane… »' },
    { who: 'player', jp: 'おたねさんの{漬物|つけもの}ですか。', fr: 'Vos pickles ?' },
    { who: 'otane', jp: 'わたしの{漬物|つけもの}。……{続|つづ}きが{気|き}になる。{聞|き}いてきて。', fr: 'Mes pickles. … Je veux savoir la suite. Va écouter.' },
    { who: 'wake', fr: 'Encore une rumeur. Ce village rattrape dix ans de commérages en une semaine.' },
    { who: 'wake', fr: '権兵衛 est dans ses rizières. Et おみつ sait tout sur tout le monde.' },
  ],
  'r2:gonbei': [
    { who: 'player', jp: '{案山子|かかし}の{声|こえ}は、{権兵衛|ごんべえ}さんの{声|こえ}ですか。', fr: 'La voix de l’épouvantail, c’est la vôtre ?' },
    { who: 'gonbei', jp: '……おれの{声|こえ}。', fr: '… Ma voix.' },
    { who: 'player', jp: 'おたねさんの{漬物|つけもの}を、よく{食|た}べますか。', fr: 'Vous mangez souvent les pickles d’Otane ?' },
    { who: 'gonbei', jp: '{食|た}べる。もう{一|ひと}つ{食|た}べる。{首|くび}を、かしげる。', fr: 'J’en mange. J’en reprends un. Je penche la tête.' },
    { who: 'gonbei', jp: '……わからない。おれの{舌|した}が、{変|へん}なのか。', fr: '… Je ne sais pas. C’est ma langue qui est bizarre, peut-être.' },
    { who: 'wake', fr: 'Il goûte, il reprend, il penche la tête. Il n’est pas sûr de lui. Retiens ça.' },
  ],
  'r2:omitsu': [
    { who: 'player', jp: '{権兵衛|ごんべえ}さんは、だれかに{漬物|つけもの}の{話|はなし}を{聞|き}きましたか。', fr: 'Quelqu’un a parlé des pickles à Gonbei ?' },
    { who: 'omitsu', jp: '{聞|き}いてないわ。おたねさんの{漬物|つけもの}の{話|はなし}なんて、だれもしないわよ。', fr: 'Non. Personne ne parle des pickles d’Otane, voyons.' },
    { who: 'omitsu', jp: 'でもね、{権兵衛|ごんべえ}さん、{毎日|まいにち}おたねさんの{家|いえ}に{行|い}くの。だから、お{嫁|よめ}さんを{探|さが}してるって{噂|うわさ}。', fr: 'Mais Gonbei va chez Otane tous les jours. D’où la rumeur qu’il se cherche une épouse.' },
    { who: 'wake', fr: 'Personne ne lui en a parlé, donc ce n’est pas un on-dit. Le reste, je préfère ne pas le traduire.' },
  ],
  'r2:site': [
    { who: 'mayoi', jp: 'おたねさんの{漬物|つけもの}は、ちょっとしょっぱい……。', fr: 'Les pickles d’Otane, ils sont un peu salés…' },
    { who: 'wake', fr: 'Il penche la tête, comme son propriétaire. Finis sa phrase.' },
    guess('r2', 'おたねさんの{漬物|つけもの}は、ちょっとしょっぱい', 'Les pickles d’Otane sont un peu salés', [
      'Je trouve que les pickles d’Otane sont un peu salés.',
      'Les pickles d’Otane sont peut-être un peu salés.',
      'Il paraît que les pickles d’Otane sont un peu salés.',
    ]),
    { who: 'wake', fr: 'Allons-y. Doucement : c’est pour la bonne cause.' },
  ],
  'r2:final': [{ who: 'gonbei', jp: 'おたねさんの{漬物|つけもの}は、ちょっとしょっぱいかもしれない。', fr: 'Les pickles d’Otane sont peut-être un peu salés.' }],
  'r2:memory': [
    { who: 'otane', jp: '{権兵衛|ごんべえ}さん、{漬物|つけもの}、どう？', fr: 'Gonbei, les pickles, comment tu les trouves ?' },
    { who: 'gonbei', jp: '……もう{一|ひと}つ。', fr: '… Encore un.' },
    { who: 'otane', jp: 'どう？', fr: 'Alors ?' },
    { who: 'gonbei', jp: '……おたねさんの{漬物|つけもの}は、ちょっとしょっぱい……', fr: '… Les pickles d’Otane, ils sont un peu salés…' },
    { who: 'gonbei', jp: '……いや。{水|みず}、ください。', fr: '… Non. De l’eau, s’il vous plaît.' },
    { who: 'wake', fr: 'Il n’était pas sûr. Alors il a demandé de l’eau. Pendant des années.' },
  ],
  'r2:right': [
    { who: 'wake', fr: 'Bien vu : il hésitait, et personne ne lui avait rien dit. かもしれない : un doute. Et un doute poli.' },
    { who: 'wake', fr: 'Va voir おたね. Avec tact.' },
  ],
  'r2:wrong': [
    { who: 'wake', fr: 'Pas ça. Il goûtait, reprenait, penchait la tête : il n’était pas sûr. Et personne ne lui en avait parlé, おみつ l’a dit. C’était un doute : かもしれない.' },
    { who: 'wake', fr: 'Va voir おたね. Avec tact.' },
  ],
  'r2:report': [
    { who: 'otane', jp: '……{案山子|かかし}、{静|しず}かになった。', fr: '… L’épouvantail s’est tu.' },
    { who: 'player', jp: '{権兵衛|ごんべえ}さんは、「おたねさんの{漬物|つけもの}は、ちょっとしょっぱいかもしれない」と{言|い}っていました。', fr: 'Gonbei disait : « Les pickles d’Otane sont peut-être un peu salés. »' },
    { who: 'otane', jp: '……しょっぱい。', fr: '… Salés.' },
    { who: 'otane', jp: '……{塩|しお}、{少|すこ}し{減|へ}らすかもしれない。', fr: '… Je mettrai peut-être un peu moins de sel.' },
    { who: 'wake', fr: 'Elle le prend bien. Je crois. Elle serre un peu fort son bol, quand même.' },
  ],
  'r2:after': [
    { who: 'otane', jp: '{権兵衛|ごんべえ}さん、{今日|きょう}、{漬物|つけもの}を{三|みっ}つ{食|た}べた。', fr: 'Gonbei a mangé trois pickles, aujourd’hui.' },
    { who: 'otane', jp: 'おいしいと{思|おも}うって。……{水|みず}は、{飲|の}まなかった。', fr: 'Il les trouve bons, qu’il a dit. … Et il n’a pas bu d’eau.' },
  ],

  // ================= 四、霧の丘 (萬作, le cœur de la brume : んだ) =================
  'c4:give': [
    { who: 'mansaku', jp: '……{丘|おか}の{霧|きり}か。', fr: '… La brume de la colline.' },
    { who: 'player', jp: '{霧|きり}は、{丘|おか}から{来|き}ているんですか。', fr: 'La brume vient de la colline ?' },
    { who: 'mansaku', jp: '……{知|し}らん。', fr: '… J’en sais rien.' },
    { who: 'mansaku', jp: '{何|なに}も、{言|い}えん。……すまん。', fr: 'Je ne peux rien dire. … Désolé.' },
    { who: 'wake', fr: 'Il ne peut pas en parler. Ça le serre trop. 太一 traîne partout le soir. Et おみつ connaissait sa femme.' },
  ],
  'c4:taichi': [
    { who: 'player', jp: '{夜|よる}、{萬作|まんさく}さんを{見|み}ましたか。', fr: 'Tu as vu Mansaku, le soir ?' },
    { who: 'taichi', jp: '{見|み}た。{毎晩|まいばん}、{丘|おか}のお{墓|はか}に{行|い}く。お{花|はな}を{持|も}って。', fr: 'Oui. Tous les soirs, il va à la tombe, sur la colline. Avec des fleurs.' },
    { who: 'player', jp: 'お{墓|はか}の{前|まえ}で、{何|なに}をしていましたか。', fr: 'Qu’est-ce qu’il fait, devant la tombe ?' },
    { who: 'taichi', jp: '{口|くち}を、あけて……とじる。あけて、とじる。{何|なに}も{言|い}わない。', fr: 'Il ouvre la bouche… et il la ferme. Il l’ouvre, il la ferme. Il ne dit rien.' },
    { who: 'player', jp: 'お{露|つゆ}さんを{知|し}っていますか。', fr: 'Tu connaissais Tsuyu ?' },
    { who: 'taichi', jp: 'お{露|つゆ}ばあちゃん？{知|し}らない。ぼくが{生|う}まれる{前|まえ}だもん。', fr: 'Mamie Tsuyu ? Non. C’était avant que je naisse, voyons.' },
    { who: 'wake', fr: 'Tous les soirs, une phrase qui commence et qui ne sort pas. Je crois savoir d’où vient la brume.' },
  ],
  'c4:omitsu': [
    { who: 'player', jp: 'お{露|つゆ}さんは、どんな{人|ひと}でしたか。', fr: 'Comment était Tsuyu ?' },
    { who: 'omitsu', jp: 'やさしい{人|ひと}。あたしが{小|ちい}さいとき、よくお{茶|ちゃ}を{飲|の}みに{来|き}たわ。', fr: 'Douce. Quand j’étais petite, elle venait souvent boire le thé.' },
    { who: 'omitsu', jp: 'いつも{言|い}ってた。『あの{人|ひと}、{何|なに}か{言|い}いたい{顔|かお}をしてる。どうしたのって{聞|き}いても、{霧|きり}の{話|はなし}ばかり』って。', fr: 'Elle disait toujours : « Il a l’air de vouloir me dire quelque chose. Quand je lui demande ce qu’il y a, il ne parle que de la brume. »' },
    { who: 'player', jp: 'お{露|つゆ}さんは、{理由|りゆう}を{聞|き}きたかったんですね。', fr: 'Tsuyu voulait savoir pourquoi, alors.' },
    { who: 'omitsu', jp: '……そうね。ずっと、{待|ま}ってたと{思|おも}うわ。', fr: '… Oui. Je crois qu’elle a attendu longtemps.' },
    { who: 'wake', fr: '« Qu’est-ce qu’il y a ? » : elle lui demandait une explication. Retiens bien ça. La colline, maintenant. La tombe de お露.' },
  ],
  'c4:site': [
    { who: 'kiri', jp: 'わしは、お{前|まえ}に……。', fr: 'Moi, à toi…' },
    { who: 'kiri', jp: 'わしは、お{前|まえ}に……{礼|れい}を{言|い}いたかった……。', fr: 'Moi, à toi… je voulais te remercier…' },
    { who: 'wake', fr: 'C’est elle. La brume entière. Tout le village tenait dans cette phrase-là.' },
    { who: 'wake', fr: 'Elle lui demandait ce qu’il y avait. Il lui devait une explication. Finis-la : quatre fins, cette fois.' },
    guess4('c4', 'お{前|まえ}に、{礼|れい}を{言|い}いたかった', [
      'Je crois que je voulais te remercier.',
      'Je voulais peut-être te remercier.',
      'Il paraît que je voulais te remercier.',
      'C’est que je voulais te remercier.',
    ]),
    { who: 'wake', fr: 'Allons-y. C’est la dernière.' },
  ],
  'c4:final': [{ who: 'mansaku', jp: 'わしはな、お{前|まえ}に{礼|れい}を{言|い}いたかったんじゃ。', fr: 'Tu sais, ce que je voulais, c’était te remercier.' }],
  'c4:memory': [
    { who: 'tsuyu', jp: '{萬作|まんさく}さん……どうしたの？そんな{顔|かお}して。', fr: 'Mansaku… qu’est-ce qu’il y a ? Tu en fais une tête.' },
    { who: 'mansaku', jp: '……{霧|きり}じゃ。{今日|きょう}も、{霧|きり}じゃ。', fr: '… Du brouillard. Encore du brouillard aujourd’hui.' },
    { who: 'tsuyu', jp: 'ふふ。いつも、それ。', fr: 'Hi hi. Toujours la même chose.' },
    { who: 'mansaku', jp: 'わしは、お{前|まえ}に……', fr: 'Moi, à toi…' },
    { who: 'tsuyu', jp: '……うん？', fr: '… Oui ?' },
    { who: 'mansaku', jp: '……いや。{明日|あした}、{言|い}う。', fr: '… Non. Je te le dirai demain.' },
    { who: 'wake', fr: 'Il n’y a pas eu de lendemain. Depuis dix ans, il parle du temps qu’il fait. Et la brume n’est jamais repartie.' },
  ],
  'c4:right': [
    { who: 'wake', fr: 'Bien vu. Elle demandait une explication, il en devait une : んだ.' },
    { who: 'wake', fr: 'Et tu as entendu ? Il a dit んじゃ. C’est ton んだ, dans la bouche d’un vieil homme. Même phrase, autre voix.' },
    { who: 'wake', fr: 'Va voir 萬作. Il faut qu’il l’entende de quelqu’un.' },
  ],
  'c4:wrong': [
    { who: 'wake', fr: 'Pas tout à fait. Elle lui demandait どうしたの, « qu’est-ce qu’il y a » : à un の, on répond par un の. Il ne doutait pas, il ne répétait personne. Il expliquait : んだ.' },
    { who: 'wake', fr: 'Et il a dit んじゃ : c’est ton んだ, dans la bouche d’un vieil homme.' },
    { who: 'wake', fr: 'Va voir 萬作. Il faut qu’il l’entende de quelqu’un.' },
  ],
  'c4:report': [
    { who: 'mansaku', jp: '……{丘|おか}の{霧|きり}が、{薄|うす}くなった。', fr: '… La brume de la colline s’est éclaircie.' },
    { who: 'player', jp: '{霧|きり}の{中|なか}の{声|こえ}は、「お{前|まえ}に{礼|れい}を{言|い}いたかったんだ」と{言|い}っていました。', fr: 'La voix dans la brume disait : « C’est que je voulais te remercier. »' },
    { who: 'mansaku', jp: '……わしの{声|こえ}か。', fr: '… Ma voix.' },
    { who: 'mansaku', jp: '{十年|じゅうねん}じゃ。{十年|じゅうねん}、{霧|きり}の{話|はなし}ばかりしておった。', fr: 'Dix ans. Dix ans que je ne parle que de la brume.' },
    { who: 'mansaku', jp: '……{行|い}ってくる。{今|いま}なら、{言|い}えるかもしれん。', fr: '… J’y vais. Maintenant, j’y arriverai peut-être.' },
  ],
  'site-well': [
    { who: 'sign', jp: '{井戸|いど}', fr: 'Le puits.' },
    { who: 'wake', fr: 'De l’eau noire, tout au fond. Elle sent la pierre froide.' },
  ],
  'site-well:done': [
    { who: 'sign', jp: '{井戸|いど}', fr: 'Le puits.' },
    { who: 'wake', fr: 'Plus un murmure. Quelqu’un a posé une brochette de dango sur la margelle. Pour le puits, sans doute.' },
  ],
  'site-scarecrow': [
    { who: 'sign', jp: '{案山子|かかし}', fr: 'Un épouvantail.' },
    { who: 'wake', fr: 'Il a la tête un peu penchée. Comme quelqu’un qui hésite.' },
  ],
  'site-scarecrow:done': [
    { who: 'sign', jp: '{案山子|かかし}', fr: 'Un épouvantail.' },
    { who: 'wake', fr: 'Il se tient droit, maintenant. On dirait qu’il a dit ce qu’il avait à dire.' },
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
