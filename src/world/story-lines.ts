// Répliques du fil du chapitre 1 hors contrats (DESIGN, « Chapitre 1 ») : le prologue au col qui libère ワケ,
// l'arrivée au village, et l'épilogue quand la brume se lève. Les cinématiques sont des dialogues joués sur une
// peinture plein écran (CINE_ART) ; le narrateur (« narr ») parle japonais, sous-titré en français.
import type { Line } from './dialogue';

export const STORY_SPEAKERS: Record<string, { name: string; face?: string }> = {
  narr: { name: '' },
  stone: { name: '？？？' },
};

/** Peinture plein écran derrière une cinématique (src/assets/memory/). */
export const CINE_ART: Record<string, string> = {
  'pro:cine1': 'cine_yakumo',
  'pro:cine2': 'cine_pass',
  'c4:site': 'cine_hill',
  'ep:dawn': 'cine_dawn',
  'ep:seal': 'cine_pass',
};

/** Effet posé sur la peinture à une réplique donnée : le sceau 訳 qui apparaît sur la borne du col. */
export const CINE_FX: Record<string, 'seal'> = { 'ep:seal:0': 'seal' };

/** Dialogues de l'histoire où les fins retrouvées ont le droit de revenir. */
export const STORY_HEALED: Record<string, string[]> = {
  'post:done': ['と思'],
  'ep:tea': ['と思', 'かもしれ'],
  'ep:thanks': ['と思'],
  'ep:tomb': ['んじゃ'],
  'mansaku:ep': [],
};

export const STORY_DIALOGUES: Record<string, Line[]> = {
  // ================= 序章 : le col =================
  'pro:cine1': [
    { who: 'narr', jp: '{八雲|やくも}の{国|くに}では、{言葉|ことば}が{世界|せかい}を{支|ささ}えていた。', fr: 'Au pays de Yakumo, les mots tenaient le monde.' },
    { who: 'narr', jp: '{最後|さいご}まで{言|い}われなかった{言葉|ことば}は、{消|き}えない。{霧|きり}になって、{残|のこ}る。', fr: 'Une phrase qu’on ne finit pas ne disparaît pas. Elle devient brume, et elle reste.' },
    { who: 'narr', jp: 'ある{日|ひ}、ひとりの{通詞|つうじ}が、{言葉|ことば}の{継|つ}ぎ{目|め}を{奪|うば}った。', fr: 'Un jour, un interprète arracha aux phrases leurs jointures.' },
    { who: 'narr', jp: 'それから、{人|ひと}は{言葉|ことば}を{最後|さいご}まで{言|い}えなくなった。', fr: 'Depuis, plus personne n’arrive à finir ses phrases.' },
  ],
  'pro:cine2': [
    { who: 'narr', jp: '{海|うみ}の{向|む}こうから、ひとりの{渡|わた}りが{来|き}た。', fr: 'D’au-delà de la mer, un voyageur arriva.' },
    { who: 'narr', jp: '{腰|こし}には、{正|ただ}しい{言葉|ことば}しか{斬|き}れない{刀|かたな}。{言刃|ことば}。', fr: 'À sa ceinture, un sabre qui ne tranche que les phrases justes : le kotoba.' },
  ],
  'pro:call': [
    { who: 'stone', fr: '… Hé. Hé ! Par ici. Oui, toi. Le grand, avec le sabre.' },
    { who: 'stone', fr: 'La pierre, là-haut, au bord du chemin. Viens voir. Je ne mords pas. Je ne peux pas, de toute façon.' },
  ],
  'pro:post': [
    { who: 'sign', jp: '{霧|きり}の{向|む}こうにも、{道|みち}はある……', fr: 'Au-delà de la brume aussi, il y a un chemin…' },
    { who: 'stone', fr: 'Ne cherche pas, je suis dans la pierre. Longue histoire. Je ne m’en souviens pas, d’ailleurs.' },
    { who: 'stone', fr: 'Tu parles français ? Évidemment. Ça se voit à ta façon de marcher.' },
    { who: 'stone', fr: 'Cette inscription n’a jamais été finie. Tant qu’elle reste coupée, je reste coincé dedans.' },
    { who: 'stone', fr: 'Ici, les phrases ont perdu leurs fins. Les tiennes, non : tu viens d’ailleurs. Alors tu vas la dire. À voix haute.' },
    { who: 'stone', fr: 'D’abord, lis ce qui est gravé. Pour te chauffer la voix. Quand la phrase s’affiche, dis-la.' },
    { who: 'player', jp: '{霧|きり}の{向|む}こうにも、{道|みち}はある。', fr: 'Au-delà de la brume aussi, il y a un chemin.' },
    { who: 'stone', fr: 'Bien. Je t’entends, et la pierre aussi. Maintenant, la fin. Celle qui manque.' },
    { who: 'stone', fr: 'Celui qui a gravé ça n’en savait rien, s’il y avait un chemin. Il le pensait, c’est tout. Un avis, ça finit par と思う.' },
    { who: 'player', jp: '{霧|きり}の{向|む}こうにも、{道|みち}はあると{思|おも}う。', fr: 'Je pense qu’au-delà de la brume aussi, il y a un chemin.' },
  ],
  'pro:free': [
    { who: 'wake', fr: 'Ahh. De l’air. Enfin, de la brume. Mais de l’air quand même.' },
    { who: 'wake', fr: 'Je m’appelle ワケ. Comme 訳, la traduction. Et comme わけ, le sens des choses. Le meilleur traducteur du pays. Le seul, depuis un moment.' },
    { who: 'wake', fr: 'D’où je viens ? Aucune idée. Je sais seulement que je viens de quelqu’un qui aimait les mots. Et que je déteste les phrases pas finies.' },
    { who: 'wake', fr: 'Toi, tu as une lame qui ne coupe que les phrases justes, et une langue qui sait encore les finir. Moi, je comprends tout ce qu’on dit ici. On fait la paire.' },
    { who: 'wake', fr: 'En bas, c’est Kirino, un village dans la brume. Le chemin descend par là. Je te suis.' },
  ],
  'post:done': [
    { who: 'sign', jp: '{霧|きり}の{向|む}こうにも、{道|みち}はあると{思|おも}う。', fr: 'Je pense qu’au-delà de la brume aussi, il y a un chemin.' },
    { who: 'wake', fr: 'Ma vieille maison. Je n’y retournerais pour rien au monde.' },
  ],
  'pro:fog': [{ who: 'stone', fr: 'Pas par là, la brume est trop épaisse. Viens d’abord me voir. Là-haut, la pierre.' }],
  'sign-pass': [{ who: 'sign', jp: 'この{先|さき}　{霧野村|きりのむら}', fr: 'Plus loin : Kirino.' }],

  // ================= arrivée au village =================
  arrival: [
    { who: 'omitsu', jp: 'いらっしゃい！お{茶|ちゃ}、{熱|あつ}いわ。お{団子|だんご}、{甘|あま}いわよ。……それだけ。', fr: 'Bienvenue ! Le thé, chaud. Les dango, sucrés. C’est tout.' },
    { who: 'mansaku', jp: '{霧|きり}じゃ。{今日|きょう}も、{霧|きり}じゃ。', fr: 'Du brouillard. Encore du brouillard aujourd’hui.' },
    { who: 'omitsu', jp: '{萬作|まんさく}さん、お{茶|ちゃ}。', fr: 'Mansaku, ton thé.' },
    { who: 'mansaku', jp: '……{熱|あつ}い。', fr: '… Chaud.' },
    { who: 'omitsu', jp: '{熱|あつ}いわ。', fr: 'Chaud.' },
    { who: 'mansaku', jp: '……{霧|きり}じゃ。', fr: '… Du brouillard.' },
    { who: 'wake', fr: '… C’est tout ? Ils se parlent, et personne ne dit rien.' },
    { who: 'wake', fr: 'Pas un « je trouve », pas un « peut-être », pas un « il paraît ». Des faits, posés là comme des cailloux.' },
    { who: 'wake', fr: 'Ce village a perdu les fins de phrase. Celles qui portent le cœur de celui qui parle.' },
    { who: 'wake', fr: 'Toi, tu les as encore. Viens, je te fais le tour.' },
  ],
  'tour:house': [{ who: 'wake', fr: 'À l’ouest, la maison du vieux. Celui qui parle du temps qu’il fait.' }],
  'tour:mill': [{ who: 'wake', fr: 'Le moulin, au bord de la rivière. La roue ne tourne plus.' }],
  'tour:bridge': [{ who: 'wake', fr: 'Un pont suspendu. Il grince jusqu’ici.' }],
  'tour:hill': [{ who: 'wake', fr: 'Et là-haut, la colline du cimetière. La brume y est plus épaisse qu’ailleurs. Je n’aime pas ça.' }],
  'tour:end': [
    { who: 'wake', fr: 'Approche-toi des gens et appuie sur Espace pour leur parler. Touche un mot pour son sens. Si tu sèches, touche T ou 訳 : je te souffle la traduction.' },
    { who: 'wake', fr: 'Et quand ta phrase s’affiche, dis-la à voix haute. Ta lame ne coupe que les phrases justes. Ta langue, c’est pareil.' },
  ],

  // ================= épilogue =================
  'ep:tomb': [
    { who: 'mansaku', jp: '{露|つゆ}。', fr: 'Tsuyu.' },
    { who: 'mansaku', jp: '……{霧|きり}じゃ。{今日|きょう}も……', fr: '… Du brouillard. Encore aujourd’hui…' },
    { who: 'mansaku', jp: '……いや。{霧|きり}の{話|はなし}は、もういい。', fr: '… Non. Assez parlé de la brume.' },
    { who: 'mansaku', jp: 'わしはな、お{前|まえ}に{礼|れい}を{言|い}いたかったんじゃ。', fr: 'Tu sais, ce que je voulais, c’était te remercier.' },
    { who: 'mansaku', jp: '{長|なが}い{間|あいだ}、ありがとう。', fr: 'Merci. Pour toutes ces années.' },
  ],
  'ep:dawn': [
    { who: 'narr', jp: '{霧|きり}が、{晴|は}れた。', fr: 'La brume s’est levée.' },
    { who: 'narr', jp: '{十年|じゅうねん}ぶりに、{霧野|きりの}の{田|た}んぼに{朝日|あさひ}が{差|さ}した。', fr: 'Pour la première fois en dix ans, le soleil du matin toucha les rizières de Kirino.' },
    { who: 'narr', jp: 'そして、{村|むら}はまた{話|はな}しはじめた。……{少|すこ}し、{話|はな}しすぎるくらいに。', fr: 'Et le village se remit à parler. … Un peu trop, même.' },
  ],
  'ep:tea': [
    { who: 'omitsu', jp: '{萬作|まんさく}さん、{今日|きょう}のお{茶|ちゃ}、どう？', fr: 'Mansaku, le thé d’aujourd’hui, comment tu le trouves ?' },
    { who: 'mansaku', jp: 'ぬるいと{思|おも}う。', fr: 'Je le trouve tiède.' },
    { who: 'omitsu', jp: 'ぬるい？あたしは{熱|あつ}いと{思|おも}うわ！', fr: 'Tiède ? Moi, je le trouve chaud !' },
    { who: 'mansaku', jp: 'いや、ぬるい。それに、お{団子|だんご}は{甘|あま}すぎるかもしれん。', fr: 'Non, tiède. Et puis les dango sont peut-être trop sucrés.' },
    { who: 'omitsu', jp: '{毎日|まいにち}{食|た}べに{来|く}るくせに！', fr: 'Tu viens en manger tous les jours !' },
    { who: 'taichi', jp: 'ぼくは、ちょうどいいと{思|おも}う！', fr: 'Moi, je trouve que c’est parfait !' },
    { who: 'wake', fr: 'Ils ont retrouvé leurs avis. Tous. En même temps.' },
    { who: 'wake', fr: 'Je ne suis pas sûr que ce soit plus calme.' },
  ],
  'ep:thanks': [
    { who: 'mansaku', jp: 'お{前|まえ}さん。', fr: 'Toi.' },
    { who: 'mansaku', jp: 'お{前|まえ}さんが{来|き}てくれて、よかったと{思|おも}っておる。', fr: 'Je crois que c’est une bonne chose que tu sois venu.' },
    { who: 'mansaku', jp: '……ありがとう。', fr: '… Merci.' },
    { who: 'player', jp: 'こちらこそ、ありがとうございました。', fr: 'C’est moi qui vous remercie.' },
    { who: 'mansaku', jp: '{道|みち}は、{南|みなみ}の{灯籠宿|とうろうじゅく}に{続|つづ}いておる。……{気|き}をつけてな。', fr: 'La route continue au sud, vers Tōrōjuku. … Prends soin de toi.' },
    { who: 'wake', fr: 'Il dit qu’il est content que tu sois venu. Non, attends. C’est plus que content. Il y a un mot pour ça, en français.' },
    { who: 'wake', fr: 'Quand on doit quelque chose à quelqu’un, et qu’on est heureux de le lui devoir. Re… recon…' },
    { who: 'wake', fr: '…' },
    { who: 'wake', fr: 'Il est parti. Le mot. Je l’avais sur le bout de la langue, et il est parti.' },
    { who: 'wake', fr: 'C’est la première fois que ça m’arrive. … Bah. Ça reviendra. Sûrement.' },
  ],
  'ep:seal': [
    { who: 'narr', jp: 'その{朝|あさ}、{峠|とうげ}の{道標|みちしるべ}に、{赤|あか}い{印|しるし}が{浮|う}かんでいた。', fr: 'Ce matin-là, sur la borne du col, un sceau vermillon était apparu.' },
    { who: 'narr', jp: '{訳|わけ}。', fr: '訳 : traduire. Et aussi : le sens des choses.' },
    { who: 'narr', jp: '{道|みち}は、{灯籠宿|とうろうじゅく}へ{続|つづ}く。', fr: 'La route continue vers Tōrōjuku.' },
  ],
  'ep:end': [
    { who: 'wake', fr: 'La route du sud est ouverte. 灯籠宿, le relais aux lanternes. On dit qu’on n’y explique plus jamais rien.' },
    { who: 'wake', fr: 'Rien ne presse. Le village reste là, et ses rumeurs aussi. On peut y revenir quand tu veux.' },
  ],
  'mansaku:ep': [
    { who: 'mansaku', jp: 'お{前|まえ}さんか。{今日|きょう}は、いい{天気|てんき}じゃのう。', fr: 'Ah, c’est toi. Il fait beau aujourd’hui, hein.' },
    { who: 'mansaku', jp: '……{霧|きり}がないと、{話|はなし}が{続|つづ}かんのう。', fr: '… Sans brume, je ne sais plus de quoi parler.' },
  ],
  'tomb-otsuyu:done': [
    { who: 'sign', jp: '{露|つゆ}の{墓|はか}', fr: 'La tombe de Tsuyu.' },
    { who: 'wake', fr: 'Des fleurs fraîches. Et une brochette de dango posée à côté. Je me demande de qui.' },
  ],
};
