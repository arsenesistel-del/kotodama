# 言霊 Kotodama : fichier de passation

À donner tel quel à un nouveau chat. Dernière mise à jour : 17 novembre 2026, session 7 (la progression). Le document de conception est `DESIGN.md`, à la racine du dépôt.

## 0. Où est le jeu

- Jeu en ligne : https://arsenesistel-del.github.io/kotodama/ (Chrome sur PC, micro requis).
- Mode test : https://arsenesistel-del.github.io/kotodama/#debug
- Dépôt : https://github.com/arsenesistel-del/kotodama, public. Chaque push sur `main` lance les tests, construit le jeu et le met en ligne (GitHub Actions, onglet Actions du dépôt).

## 1. Ce qu'est le projet

Un jeu vidéo à la voix pour débloquer l'oral japonais d'Arsène. Il lit presque au niveau N2 mais produit 1 à 3 mots. Ses erreurs sont dans les jointures (だ/な devant と思う, conjugaisons, particules) et les nombres. Sept tentatives d'oral en solo ont échoué parce que rien n'était couplé à autre chose.

Règles de conception qui en découlent :
- le contenu est fourni, il ne cherche jamais quoi dire ;
- la machine vérifie, il n'y a pas d'auto-évaluation ;
- progression du scripté vers le libre ;
- zéro friction : une adresse, Chrome, et on joue ;
- ça doit être un vrai jeu, qu'on a envie de relancer.

Document de cadrage complet : https://claude.ai/artifact/5RwHQVeMepsgU1KX3P8kjD

## 2. État au 17 novembre

### Session 7 : la progression

Branche `session-7-progression`, fusionnée dans `main` et en ligne.

- **Suivi caché façon FSRS** (`src/world/fsrs.ts`, `src/world/progress.ts`, clé `kotodama.progress.v1`). Chaque mot (`w:霧`) et chaque structure (`s:omou.na` : と思う après un adjectif な ; 17 en tout, les quatre fins sur les quatre types de mots et `s:inyou`, 「…」と言っていた) a une stabilité et une difficulté, avec les formules et les paramètres par défaut de FSRS-5. Ce que le jeu note :
  - dialogue, réponse validée : chaque mot dit juste (pas les particules ni les fins) et chaque structure de la phrase, note 3 ;
  - dialogue, faute de jointure diagnostiquée : la structure de la phrase, note 1 (un « pas reconnu » ne note rien, ça peut être le micro) ;
  - toucher un mot pour son sens : note 1 sur ce mot ;
  - chasse : la structure, 4 si juste en moins de 3,5 s, 3 si juste, 2 si juste après 9 s, 1 si ratée ; les deux mots de la phrase, 3 si juste, 1 si la lecture a été demandée (F) ;
  - une phrase passée avec 飛ばす ne compte pas (avant, ses mots comptaient : corrigé).
- **Même jour** : un raté compte une fois de suite, et la reprise qui le suit aussi ; dix réussites dans la même chasse ne valent pas dix jours. Le jour de jeu commence à 4 h. Une première fois ne peut pas être « facile ».
- **Acquis** : stabilité de 10 jours pour un mot, 14 pour une structure. En pratique, un mot demandé puis redit juste un jour sur deux est acquis vers le 6e jour, une structure dite juste chaque jour vers le 5e. Toasts 覚えた (mot) et 型を覚えた (structure), et en fin de chasse la liste de ce qui vient d'être acquis.
- **Aides qui s'effacent** :
  - furigana dans les dialogues : un mot demandé garde son furigana ; il pâlit à partir de 3 jours de stabilité, disparaît quand le mot est acquis, et revient pâle si le mot s'oublie (souvenir sous 80 %). Un mot réputé lisible et jamais demandé reste sans furigana. Le bouton ふりがな de la fiche reste un choix manuel qui passe avant ;
  - lectures en chasse (mode « sur demande ») : un mot dont il a demandé la lecture l'affiche tout seul, pâle puis plus du tout, de la même façon ;
  - l'ancienne règle (trois fois prononcé juste le même jour, furigana masqué) est remplacée. Reprise automatique des données des sessions 4 à 6 : mots acquis et mots demandés deviennent des cartes, l'historique des chasses aussi.
- **Les chasses suivent l'échéance** (`setBias` dans `engine.js`) : une structure à revoir pèse 1,8, une neuve 1,3, une acquise 0,6 ; un couple de mots dont un a été demandé et n'est pas acquis revient trois fois plus souvent.
- **Bilan de la semaine (記録)** : メニュー → 記録. Semaine du lundi au dimanche : minutes parlées, phrases dites (et % justes), structures acquises, mots acquis, chasses gagnées ; minutes jour par jour (aujourd'hui en vermillon, détail au survol) ; grille des 17 structures (未 jamais dite, 中 en cours, 得 acquise, 忘 s'oublie, ↺ à revoir, trait sous la case : ce qu'elle tient, détail au survol) ; ce qui a été acquis ; ce que le jeu va ramener. Flèches ‹ › pour les semaines passées. Il s'ouvre tout seul à la première partie d'une nouvelle semaine si la précédente a été jouée.
- **Minutes parlées** : mesurées par le micro (`src/mic.js`), de la première à la dernière transcription d'une phrase, plus 0,7 s de délai, 20 s au plus par phrase.
- **Sauvegarde** : 設定 → 記録 : 書き出す télécharge toute la partie (toutes les clés `kotodama.*` : monde, emplacements, mots, progression, combat, réglages) dans `kotodama-AAAA-MM-JJ.json` ; 読み込む la recharge (sur un autre navigateur aussi) et relance le jeu. Le jeu demande aussi à Chrome de ne pas effacer ses données (`navigator.storage.persist`). La progression suit le joueur, pas l'emplacement de sauvegarde, comme les mots.
- Corrigé au passage : les boutons de 設定 ne réagissaient plus depuis la session 4 (ils étaient pris pour des boutons ▶ de la バックログ).
- `npm test` lance aussi `scripts/check-progress.mjs` : courbe d'oubli, rythme d'acquisition d'un mot et d'une structure, mot oublié dont l'aide revient, structure reconnue dans chaque réponse du joueur (29), bilan de la semaine (lundi, jour qui commence à 4 h, ouverture automatique une fois), export et import.
- Vérifié dans Chrome sans écran (mode test, réponses tapées) : reprise d'une partie de la session 6, bilan qui s'ouvre tout seul, réponses justes et fausses notées, furigana pâle, bilan de la semaine et de la précédente, une chasse puis une deuxième où le mot demandé garde sa lecture, export puis import. Aucune erreur JavaScript. Pas vérifié à la voix réelle (les minutes parlées réelles restent à confirmer).
- Pas fait : un mot touché souvent ne revient pas plus souvent dans les dialogues (ils sont écrits à l'avance), le butin ne dépend pas encore de l'échéance.

Pour suivre : `window.KDV.progress` (le module), `KDV.record(n)` ouvre le bilan d'il y a n semaines. Repartir de zéro : `localStorage.removeItem('kotodama.progress.v1')`.

### Session 6 : la boucle complète

Branche `session-6-boucle`, PR #5, fusionnée dans `main` et en ligne.

- **Trois contrats jouables de bout en bout**, dans l'ordre du DESIGN : 水車小屋の影 (太一, と思う, créature 欠けの影), 峠の噂 (おみつ, そうだ, 揺らぎ), 吊り橋 (萬作, かもしれない, 崩れ). Chacun s'ouvre quand le précédent est rapporté. Définitions dans `src/world/quests.ts`, répliques dans `src/world/quest-lines.ts`.
- **Don** : le PNJ demande de l'aide (si on ne l'a jamais rencontré, sa première rencontre passe avant). Le joueur répond à voix haute, comme partout. Un sceau 依 et le titre calligraphié s'affichent.
- **Enquête** : deux témoins par contrat, marqués « ？ » au-dessus de la tête. On leur pose les questions à voix haute (phrases affichées, échelle « Lire »). Ce qu'ils disent tranche entre avis, doute et rumeur : 源造 « ne doute jamais, n'écoute pas les rumeurs », 与平 « n'a pas vu la mère, il rapporte ce qu'on lui a dit », 萬作 jeune « parlait tout seul et penchait la tête ». ワケ résume en français après chaque témoin.
- **Site** (examiner : le moulin, le 地蔵 du col, le panneau du pont suspendu) : trop tôt, ワケ dit qui reste à interroger. Sinon, la créature répète le début de sa phrase (voix d'écho, texte vermillon qui tremble) et le joueur la finit à voix haute parmi trois fins (と思う, かもしれない, そうだ). Le choix est enregistré, juste ou non. Passer avec 飛ばす ne donne jamais le bonus.
- **Chasse** (`huntContract` dans `game.js`) : créature et décor de la v4 en pixel, structures du contrat (`CONTRACT_STAGES` dans `engine.js`). Bonne déduction : bannière 刃, dégâts ×1,5, jauge 崩 ×1,5, un 欠片 de plus. À l'apaisement, la créature dit enfin sa phrase entière, écrite en grand et dite avec la voix de celui qui l'avait laissée en suspens. Le résultat propose « 村へ戻る » ; après une défaite, « Rechasser » ou retour, et ワケ dit que la phrase n'a pas bougé (on peut refaire la déduction).
- **Souvenir** : au retour, deux à quatre répliques doublées sur une peinture à l'encre plein écran (sceau 記憶) : 源造 et 太一 au moulin, 与平 au col dans la brume, 萬作 jeune et お露 au pont. Puis ワケ dit si la déduction était juste, et sinon pourquoi.
- **Retour** : le joueur rapporte à voix haute avec 「…」と言っていました. Le PNJ reparle avec la fin retrouvée (太一 : なれると思う ; おみつ : 元気にしているそうよ ; 萬作 : 間に合うかもしれん). 縁 +1 (toast), sceau 了. Ensuite sa réplique ordinaire change (`c1:after`… : la roue tourne, おみつ colporte une rumeur sur 権兵衛, 萬作 soupçonne la colline). La roue du moulin tourne une fois le premier contrat fini.
- **Encart du contrat** en haut à gauche : titre, témoins cochés, étape en cours. Marqueurs « ！ » (contrat à prendre ou à rapporter) et « ？ » (témoin) en pixel au-dessus des PNJ.
- 55 nouvelles répliques doublées (ElevenLabs eleven_v4, 1 674 crédits). Nouvelles voix : Akio pour 源造, Koichi pour 与平, Ryo pour 萬作 jeune, Akane pour お露 ; 太一 garde chinyaku dans son souvenir. Les échos des créatures sont la voix de leur auteur, chuchotée, ralentie et passée dans `aecho` (ffmpeg). 3 peintures de souvenir (570 crédits), `src/assets/memory/`, originaux dans `art/raw/`.
- Lexique : environ 130 mots ajoutés, marqueurs あたし (町娘) et ん (négation des vieux). `npm test` autorise une fin perdue dans les dialogues guéris (`HEALED`). Nouvelles fautes reconnues : だ après un verbe devant と思う ou そうだ, だ devant かもしれない.
- `bg_temple.webp` et `p_slash.webp` retirés.
- Vérifié dans Chrome sans écran (mode test, réponses tapées) : les trois contrats de bout en bout, avec une faute diagnostiquée au rapport, une déduction fausse, une défaite puis une victoire, les souvenirs, les répliques d'après, le repaire depuis la carte. Aucune erreur JavaScript. `npm test` et `npm run build` passent. Pas vérifié à la voix réelle.
- Pas fait : le prologue au col, le boss 霧の主 et l'épilogue, les portraits illustrés, l'écran du 言葉帳. Le vocabulaire des chasses reste celui de la v4 (moderne).

Ajouter un contrat : une entrée dans `QUESTS` (`quests.ts`), une chasse dans `CONTRACT_STAGES`, ses dialogues `id:give`, `id:<témoin>`, `id:site` (avec `guess`), `id:final`, `id:memory`, `id:right`, `id:wrong`, `id:report`, `id:after` dans `quest-lines.ts`, la peinture dans `MEMORY_ART`, puis `npm test` et les voix.

### Session 5 : le combat en pixel

Branche `session-5-combat-pixel`, PR #4 : https://github.com/arsenesistel-del/kotodama/pull/4. Construite sur la session 4 : fusionner #2, puis #3, puis #4.

- **La chasse est de profil, façon vieux Final Fantasy** : la créature à gauche, le sabreur et ワケ à droite, trois fenêtres en bas. Le titre et le repaire restent à l'encre.
- **Moteur inchangé** : `engine.js` et `game.js` n'ont pas bougé. 斬, 祓, 奥義, 崩, 怒, coups critiques, riposte, diagnostic des erreurs, rangs et 欠片 marchent comme en v4. Seul le rendu a changé : `src/combat/pixel.js` reprend l'interface de l'ancien rendu (`slash`, `stagger`, `enrage`, `monsterAttack`, `die`…).
- **Rendu** : tout se dessine dans un petit tampon (environ 270 × 150 pixels du jeu) agrandi d'un facteur entier, donc aucun pixel coupé. Le sol se cale juste au-dessus des fenêtres du bas, quelle que soit la taille de l'écran.
- **Sprites du pack** : le sabreur est `samuraiblue` (colonne de profil : attente, course, coup, blessé, victoire), ワケ est `spirit` teinté comme au village et flotte derrière lui. Le pack complet n'a pas pu être retéléchargé dans la session (itch.io refusé) : pas d'effets ni d'armes du pack, les coups de lame sont dessinés par le code.
- **Créatures en pixel** : `tools/pixelize.py` tire une version pixel de chaque peinture de la v4 (62 à 86 pixels de haut), dans la rampe d'encre du pack (noir du contour, gris, os) avec un seul vermillon pour les yeux et les marques. Sortie dans `src/assets/combat/px/` (11 Ko pour les six). Relancer le script si une peinture change.
- **Un décor par créature**, peint par le code dans la palette du pack, avec des objets du pack voilés de brume : moulin et rivière au crépuscule (欠けの影), gorge et pont suspendu (崩れ), col dans la brume avec 地蔵 et poteau (揺らぎ), relais de nuit aux lanternes (伝え火), torii sous les étoiles (訳の主), lune rouge et ruines (歪みの王). Brume tramée qui dérive, poussières.
- **Ce qui se voit à chaque échange** : la créature s'assemble pixel par pixel à l'entrée. Elle flotte, ses bandes de pixels se décalent (la distorsion), plus souvent quand elle faiblit. Le sabreur court jusqu'à elle et frappe (traînée sur un critique ou un 奥義), elle clignote en blanc, les chiffres de dégâts rebondissent en police pixel. Avant de frapper, elle tremble, s'entoure de rouge et clignote ; elle se rue sur le sabreur, qui rougit et recule, ワケ sursaute. 崩 : contour doré et étoiles au-dessus de la tête. 怒 : contour et voile rouges, poussières rouges. Coup critique et 奥義 : image d'impact noir et blanc. Défaite : le sabreur tombe sur le côté. Apaisement : quatre traits de lame, puis la créature se défait pixel par pixel en flocons qui montent, et le sabreur prend la pose de victoire.
- **Restent à l'encre**, en pleine résolution : les sceaux 会心, 崩, 怒, 奥義, 祓, le nom calligraphié à l'entrée, les lettres qui tournent autour de la créature (en DotGothic16).
- **Fenêtres du bas** : à gauche la créature (nom, vie, jauge 崩), au centre la consigne (badge 斬, 祓 ou 奥義, phrase, barre de temps, ce que le micro entend), à droite 渡り (形, série 連, état du micro). Style des dialogues : encre, os, bord vermillon, DotGothic16. Le cadre central passe au rouge sur une phrase déformée ou une erreur, à l'or sur un 奥義 ou un critique.
- `bg_temple.webp` et `p_slash.webp` ne servent plus (à retirer de `src/assets/combat/` pour alléger le chargement ; originaux dans `art/raw/`).
- Vérifié dans Chrome sans écran (mode test, 1600 × 900 et 1280 × 720) : les six créatures et leurs décors, une chasse complète de 欠けの影 (critique, erreur et riposte, 祓, 崩 puis 奥義, 怒, apaisement, rang A), une défaite contre 歪みの王. Aucune erreur JavaScript. `npm test` et `npm run build` passent. Pas vérifié à la voix réelle ni sur un vrai écran.

### Session 4 : les voix

Branche `session-4-voix`, PR à part, construite sur la session 3 (PR #2). Les deux PR sont à fusionner dans l'ordre : #2, puis celle de la session 4.

- **Le joueur répond à voix haute** (échelle « Lire » du DESIGN). Une réplique `who: 'player'` dans `dialogue.ts` affiche la phrase à dire, avec le portrait du sabreur et 「声に出して」. Le micro écoute, le jeu juge, et la phrase validée reçoit un sceau 言, un son, puis la suite. Faute connue : diagnostic en français (« Il manque だ avant と思います. ») et nouvel essai. Après trois ratés, ou sans micro (pas Chrome, micro refusé), le bouton 飛ばす passe sans rien compter.
- **Choix** : une réplique du joueur avec `choices` propose plusieurs phrases (一, 二). Celle qu'il dit mène à son dialogue `goto`, puis on reprend après le choix. Exemple : commander du thé ou des dango chez おみつ.
- **Vérification** (`src/world/answer.ts`), sur le principe du moteur du combat : chaque mot balisé `{漢字|かな}` est accepté en kanji ou en kana, la ponctuation est ignorée, les katakana sont ramenés en hiragana, quelques écritures de Chrome sont unifiées (吊橋, 君…), un はい d'ouverture peut manquer. Les fautes prévues sont tirées automatiquement de la phrase attendue : だ qui manque ou な à la place devant と思います, だ après un adjectif en い, だ ou rien à la place du な de なんです, な après un verbe devant んです, だ devant かもしれません, いかった. Une variante proposée par Chrome n'est acceptée que si la transcription principale n'est pas une faute diagnostiquée.
- **Micro partagé** : le `Mic` du combat est sorti dans `src/mic.js`, utilisé par le combat et les dialogues. Une seule écoute continue pour tout le jeu ; le micro s'ouvre à la première réponse demandée.
- **14 réponses à dire** dans le village, toutes en japonais poli et standard, chacune sur une jointure : 萬作 (旅の者です, なんですか, かもしれませんね), おみつ (choix, おいしいと思います, いるんですか, 好きなんです), 太一 (見たんですか, じゃないかもしれません, 大丈夫だと思います, 強い子だと思います), おたね (冬なんですね), 権兵衛 (寒かったんですか). Les villageois, eux, n'emploient toujours pas les fins perdues : 萬作 commence à parler du pont et retombe sur la météo, おみつ « n'arrive pas à le dire ».
- **Voix** : les 24 répliques japonaises des PNJ sont doublées, générées à l'avance avec ElevenLabs (eleven_v4) et rangées en OGG mono dans `src/assets/voice/` (816 Ko), avec `index.json` (texte, voix, moteur). Voix : JUN pour 萬作, Konomi pour おみつ, chinyaku pour 太一, Chieko pour おたね, Kiyo pour 権兵衛. Le texte envoyé au moteur met en kana les noms propres et les mots que la voix pourrait mal lire (`scripts/voice-lines.mjs`). Les villageois parlent lentement à l'étranger (balise `[slowly]`).
- **Figurants et VOICEVOX** : le moteur VOICEVOX n'a pas pu tourner dans la session (téléchargé, mais son lancement est bloqué). おたね et 権兵衛 ont donc des voix ElevenLabs pour l'instant. `tools/voicevox.mjs` les refait avec VOICEVOX sur le PC d'Arsène (VOICEVOX ouvert, puis `node tools/voicevox.mjs`).
- **Création de voix** : la création d'une voix d'enfant pour 太一 a été refusée par ElevenLabs (règles de sécurité). D'où chinyaku, une voix de la bibliothèque qui fait aussi les jeunes garçons.
- **Écoute** : la voix part avec chaque réplique. Boutons 聞 (réécouter, R) et 遅 (lentement, L, à 0,72). En オート, la suite attend la fin de la voix. Dans la バックログ, ▶ réécoute chaque réplique doublée ; les phrases dites par le joueur y apparaissent aussi. 設定 a un volume ボイス à part.
- **Acquisition d'un mot** (DESIGN) : chaque mot d'une phrase validée au micro compte. Un mot dont le joueur avait demandé la lecture et qu'il a prononcé juste trois fois perd son furigana (toast 覚えた).
- `npm test` vérifie aussi chaque réponse : la bonne phrase est acceptée en clair et en kana, chaque faute prévue est refusée et diagnostiquée. Il signale les répliques sans voix ou dont le texte a changé depuis l'enregistrement.
- Vérifié dans Chrome sans écran (mode test, réponses tapées) : voix de chaque réplique, réponses justes en kanji et en kana, fautes diagnostiquées (な/だ devant んです, だ après い, だ devant かもしれない), choix et retour au dialogue, trois ratés puis 飛ばす, バックログ avec ▶, lecture lente. Une chasse complète au combat avec le micro partagé. Aucune erreur JavaScript. Pas vérifié à la voix réelle.
- Crédits ElevenLabs : 3 693 utilisés sur 40 000 ce mois (images 1 900, voix et tests 1 793).

Pour ajouter une réplique doublée : l'écrire dans `dialogue.ts`, `npm test` la signale sans voix, `node scripts/voice-lines.mjs --missing` donne le texte à envoyer, la générer (voix et balises dans `index.json`), l'encoder en OGG mono dans `src/assets/voice/<fichier>.ogg` et compléter `index.json`.

Pour ajouter une réponse du joueur : `{ who: 'player', jp: '…', fr: '…' }` dans le dialogue, ou `choices: [{ jp, fr, goto }]`. `node scripts/check-dialogue.mjs --show` affiche les fautes que le jeu reconnaîtra.

### Session 3 : les dialogues

Branche `session-3-dialogues`, PR #2 : https://github.com/arsenesistel-del/kotodama/pull/2 (appliquée depuis le correctif, la session 3 n'avait pas pu pousser). Système de dialogue façon visual novel, dans `src/world/vn.ts` et `vn.css` (l'ancienne boîte de `ui.ts` est remplacée).

- Boîte de VN : portrait, nom avec furigana, texte qui défile, ▼ d'attente. Menu rapide sous le texte, en japonais : セーブ, ロード, オート, スキップ, バックログ, 設定. Bouton メニュー en haut à droite (village et carte), ou Échap.
- バックログ : les 120 dernières répliques, gardées dans la sauvegarde du monde. Mots touchables, bouton 訳 pour afficher les traductions. B ou molette vers le haut sur la boîte.
- オート (A) : attente selon la longueur de la réplique, plus longue si ワケ parle. スキップ : 既読スキップ, ne passe que les répliques déjà lues (Ctrl tenu ou bouton) ; sur une réplique jamais lue, refus avec « 未読です ».
- セーブ・ロード : trois emplacements (`kotodama.slots.v1`), avec lieu, date et dernière réplique. Confirmation par un second clic. Charger relance la bonne scène (village ou carte). La sauvegarde automatique continue à côté. Les emplacements ne gardent que le monde, pas le combat.
- 設定 (`kotodama.settings.v1`) : vitesse du texte, vitesse de l'オート, ふりがな (自動, 全部, なし), kanji réputés connus (N3 ou N2), traduction de ワケ (à la demande ou toujours), volume, remise à zéro des mots.
- Furigana seulement sur ce qu'on ne sait pas lire : un mot n'en a que si l'un de ses kanji dépasse le niveau choisi (N3 par défaut, liste dans `src/world/kanji.ts`), ou si c'est un nom propre. Toucher un mot pour son sens le marque comme illisible : son furigana s'affiche désormais partout. La fiche a un bouton ふりがな pour le masquer ou le remettre. F montre tout le furigana de la réplique en cours, sans rien marquer. Mémoire des mots : `kotodama.words.v1`.
- Sens en français au toucher : chaque mot de chaque réplique est cliquable (aussi dans la バックログ). Fiche : mot, lecture, forme du dictionnaire (辞書形), nature, sens, marqueur de 役割語 avec son équivalent standard (じゃ → だ), remarque de grammaire. Les sens viennent de `src/world/lexicon.ts`, écrit à la main (JMdict n'était pas téléchargeable depuis la session ; à brancher plus tard si besoin).
- ワケ souffle : T ou 訳 ouvre une bulle de ワケ au-dessus de la boîte avec la traduction (palier 1). La première fois qu'un marqueur de 役割語 apparaît (じゃ, わし, おる, のう, わ, もん), ワケ le signale dans la bulle et il entre dans le 言葉帳 (`notebook` de la sauvegarde, pas encore d'écran).
- Découpage des répliques en mots par correspondance la plus longue avec le lexique, sans couper un groupe à furigana (`src/world/text.ts`). « / » dans une réplique force une coupure.
- Trois PNJ avec leurs premières répliques du DESIGN : 萬作 (avant, présentation), おみつ (avant, indice), 太一 (avant), chacun suivi d'une remarque de ワケ. Quand on leur reparle, une réplique courte (`id:again`) : 「お前さんか。……霧じゃのう。」, 「あら、お客さん。お団子、甘いわよ。……甘いわ。」, 「水車小屋、こわい。……こわくないもん！」.
- `npm test` vérifie aussi les répliques (`scripts/check-dialogue.mjs`) : chaque kanji a sa lecture, chaque mot est dans le lexique, chaque marqueur existe, aucune fin perdue avant guérison (と思う, かもしれない, そうだ, んだ). `node scripts/check-dialogue.mjs --show` affiche le découpage.
- Vérifié dans Chrome sans écran : arrivée, dialogues des trois PNJ et des figurants, bulle de ワケ et marqueurs, fiche d'un mot et furigana qui apparaît, masquage du furigana, F, オート jusqu'au bout, スキップ sur du lu et refus sur du non lu, バックログ avec traductions, セーブ puis ロード (retour à la position), 設定, menu sur la carte qui bloque les touches du jeu. Aucune erreur JavaScript.

Pas encore fait dans les dialogues : écran du 言葉帳, portraits illustrés (le reste est fait en session 4).

Écrire une réplique : la mettre dans `dialogue.ts` avec la lecture de chaque kanji (`{霧|きり}`), lancer `npm test`, ajouter au lexique les mots qu'il signale.

### Session 2 : le monde en pixel

Livrée dans la PR #1 (branche `session-2-village`) : https://github.com/arsenesistel-del/kotodama/pull/1. En ligne dès qu'elle est fusionnée dans `main`.

- Pack [Ninja Adventure](https://pixel-boy.itch.io/ninja-adventure-asset-pack) complet récupéré sur itch.io (CC0, 89 Mo). Seul ce qui sert est dans le dépôt, sous `src/assets/world/` (tuiles, 7 personnages et leurs portraits, roue du moulin, 2 musiques, 4 bruitages ; 2,5 Mo). Le pack entier n'est pas versionné : le retélécharger s'il faut d'autres pièces.
- Premier village, 霧野村, 48 × 40 tuiles de 16 px, décrit dans `src/world/maps/kirino.ts` : col au nord (地蔵, poteau), salon de thé d'おみつ, maison de 萬作, place et puits, moulin à l'arrêt au bord de la rivière, pont de bois, pont suspendu, rizières en terrasse, colline du cimetière (torii, tombes, grand cerisier, tombe d'お露), grand-route au sud. Forêt de montagne tout autour.
- Le terrain s'écrit en lettres (herbe, chemin, eau, forêt) ; les bords des chemins et de l'eau sont posés automatiquement (`autotile` dans `src/world/tileset.ts`). Les objets ont un masque de collision et un nombre de lignes dessinées devant les personnages (cimes, toits).
- Déplacement au clavier (ZQSD, WASD ou flèches, Maj pour courir), collisions sur la grille avec glissement le long des murs, caméra qui suit avec un zoom entier calculé sur la taille de l'écran.
- ワケ suit le sabreur en flottant (sprite « Spirit » du pack, teinté gris).
- Cinq PNJ en place, qui disent leur réplique « avant » du DESIGN : 萬作, おみつ, 太一, et deux figurants, おたね et 権兵衛. Boîte de dialogue façon VN en HTML (portrait du pack, DotGothic16, furigana, texte qui défile). T ou le bouton 訳 : ワケ traduit (palier 1). Panneaux et tombe lisibles.
- Brume : deux nappes qui dérivent, plus épaisses sur la colline ; vignette et couleurs désaturées dans le village. Titre du lieu calligraphié à l'arrivée. Musique « Lost Village », rivière dont le son monte quand on s'en approche.
- Carte du monde à l'encre (`src/world/inkmap.ts`, peinte par le code) : montagnes au lavis, mer, rivière, brume, grand-route vers les huit lieux, en pointillés tant qu'ils sont fermés. Lieux dans `src/world/places.ts`. Ouverts : 霧野村 et 霧野峠. Clic ou flèches puis Entrée.
- Sortir du village par le nord ou le sud mène à la carte. 霧野峠 ouvre le combat v4 ; le bouton 地図へ du repaire ramène à la carte. Revenir du col fait entrer au village par le nord.
- Sauvegarde du monde séparée : `localStorage`, clé `kotodama.world.v1` (scène, lieu, entrée, position, dialogues vus). Au rechargement, on reprend dans le village ou sur la carte.
- `npm test` vérifie aussi les cartes (`scripts/check-maps.mjs`) : arrivées libres, sorties, PNJ et panneaux atteignables à pied, répliques présentes.
- Vérifié dans Chrome sans écran : arrivée et dialogue de ワケ, marche, collisions (salon de thé, rivière), traversée du pont, dialogue avec traduction, sortie sud, carte, combat, retour à la carte, retour au village par le nord. Aucune erreur JavaScript.

Pas encore fait dans le village : répondre à voix haute (les PNJ parlent, le joueur écoute seulement), voix des PNJ, contrats donnés par les PNJ, prologue au col, intérieurs des maisons.

### Session 1 : les fondations

- Projet Vite + TypeScript + Phaser 4, mis en ligne sur GitHub Pages par GitHub Actions.
- Le combat v4 tourne en ligne tel quel. Il est découpé en modules ES dans `src/combat/` ; les images sont des fichiers servis à part, plus du base64 dans un HTML unique.
- Phaser démarre le jeu (scène `boot` : chargement des images avec une barre à l'encre), puis la scène `combat` pose l'interface v4 par-dessus et met Phaser en veille. Le village, la carte et le futur combat en pixel seront des scènes Phaser.
- `npm test` refait la vérification automatique du moteur (19 200 phrases). Le déploiement s'arrête si elle échoue.
- Vérifié en session 1 : une chasse complète du roi en mode texte dans Chrome sans écran (斬, 祓, 奥義, 怒, erreur et riposte, victoire de rang A), sans erreur JavaScript.
- La sauvegarde reste dans le navigateur (`localStorage`, clé `kotodama.v1`). Elle est liée à l'adresse : une partie commencée sur l'ancien fichier `kotodama.html` ne suit pas.

### Retours et contenu de la v4

Retour d'Arsène sur la v3 jouée à la voix : le combat tient, c'est bien meilleur, mais un peu répétitif et encore « concept », pas assez vrai jeu (animations, interface). Il veut un jeu long et costaud, qui monte jusqu'à un niveau presque bilingue. Il ne veut pas fournir de message vocal sur sa vie : on fait un jeu, le contenu vient du jeu.

Ce qui marche :
- Boucle de combat : la distorsion montre deux mots et une fin (この町 ／ 静か + 〜と思う), il dit la phrase entière, le jeu juge sur le texte en cours de reconnaissance.
- Trois types d'échange (v4) : 斬 trancher (construire la phrase), 祓 purifier (une phrase déformée s'affiche, il la redit juste ; `item.broken` dans le moteur), 奥義 (voir 崩).
- 崩 (v4) : une jauge de garde se remplit à chaque phrase juste (15, ou 34 sur un coup critique). Pleine, la distorsion vacille et la phrase suivante est une 奥義 à dégâts triplés, sans riposte si elle est ratée.
- 怒 (v4) : à mi-vie la distorsion s'enrage, 15 % de temps en moins et plus de phrases déformées.
- Coup critique si la parole démarre en moins de 3,5 s. Série (連), 5 points de vie, riposte après une erreur (il redit la phrase juste).
- Diagnostic en français des erreurs connues (« Il manque だ avant と思う. », etc.).
- Six distorsions à débloquer dans l'ordre : 欠けの影, 崩れ, 揺らぎ, 伝え火, 訳の主, 歪みの王. Quatre fins : と思う, かもしれない, そうです, んです. Quatre types de mots : nom, adjectif な, adjectif い, verbe. Formes : présent, négatif, passé.
- Vocabulaire doublé en v4 (1 224 phrases distinctes) et un même couple de mots ne revient pas avant 7 échanges.
- Repaire en trois onglets (v4) : 依頼 contrats (cartes avec la peinture de chaque créature, silhouette si verrouillée, sceau de rang), 図鑑 bestiaire (grille fin × type), 設定 réglages. Règles dans une fenêtre au premier lancement.
- Fragments 欠片 (v4) : chaque victoire en donne 1 à 3 selon le rang, stockés dans `save.frags`. Ils ne servent encore à rien, prévus pour la forge.
- Furigana à la demande (F, Espace ou clic).
- Animations (v4) : créature qui ondule, se cabre puis se rue sur le sabreur, vacille, s'enrage ; traits de pinceau sec pour les coups ; image d'impact noir et blanc sur les coups critiques ; sceaux 会心, 崩, 怒, 奥義, 祓 ; encre qui reste sur l'eau ; bandes cinéma à l'entrée et à la mise à mort ; nom de la créature calligraphié à la verticale ; rideau d'encre entre les écrans ; sceau de rang tamponné.

Pas encore vérifié à la voix réelle : le rythme avec les animations v4, la lisibilité des phrases déformées, et le micro sur l'adresse GitHub Pages.

## 3. Décisions prises

- Reconnaissance : Web Speech API de Chrome (`ja-JP`), une seule session continue. Test micro sur 22 phrases : jointures justes reconnues environ 9 à 10 sur 12, jointures fausses conservées 5 sur 7, une corrigée en silence (難しいかった devient 難しかった). Les nombres et compteurs passent mal (はつか, しちじ, さんびき).
- Donc : les jointures d'abord. Les nombres et compteurs attendent un modèle parole vers kana (Kana Whisper, `sbintuitions/kana-whisper`) sur sa RTX 3060 Ti.
- Une alternative du moteur vocal n'est acceptée que si la transcription principale n'est pas une erreur diagnostiquée, pour ne pas valider une faute corrigée en douce.
- Le combat actuel est « la partie combat » d'un jeu plus large : monde ouvert, villes, personnages.
- Images générées autorisées pour ce projet (il a levé sa règle de Nagori). Style adulte, pas cartoon.
- Budget : ElevenLabs Starter (1 $ le premier mois, 6 $ ensuite, 30 000 crédits). Toute autre dépense seulement si très justifiée.
- Pile technique (session 1) : Vite, TypeScript, Phaser 4, GitHub Pages. Le code v4 reste en JavaScript dans `src/combat/` ; le nouveau code s'écrit en TypeScript.

## 4. Direction artistique et production des images

Style : peinture à l'encre sumi-e, dark fantasy, adulte. Os pâle et gris sur noir pur, un seul accent vermillon (#d4412b). Pas de texte dans les images.

Outil : connecteur ElevenLabs, `creative_generate_image`, modèle `gpt-image-2.5-sunburst`, 1 variation, 190 crédits par image. Flow : `kU3JafHN2mqqQZTk0WH1`. Sortie 1280×720 quoi qu'on demande. Récupération : `creative_get_generations` donne une URL signée (2 h), téléchargeable avec curl. Ne jamais relancer un appel pour réessayer, ça refacture.

Dépensé : 10 images (1 900 crédits), puis les voix du chapitre 1 (environ 1 800), puis en session 6 les voix des contrats (1 674) et 3 peintures de souvenir (570). Le compte affiche 40 000 crédits par mois, 5 937 utilisés au 17 novembre.

Gabarit de prompt pour une créature ou un personnage :

> Japanese sumi-e ink painting, dark fantasy, mature and ominous, elegant. [SUJET]. Pale ink and bone-white dry brushwork with splatter, single accent color vermilion red. Centered full-body creature floating on a pure solid black background. No text, no letters, no frame, no signature, no watermark.

Gabarit pour un décor :

> Japanese sumi-e ink painting, dark fantasy, mature, melancholic. [LIEU]. Wide landscape, empty of characters, dark and misty, mostly black and deep grey ink washes with pale highlights, a tiny touch of vermilion red on [DÉTAIL]. The lower third is calm, dark and uncluttered. No text, no letters, no frame, no signature, no watermark.

Détourage : `tools/process.py` (alpha tiré de la luminosité + silhouette remplie, recadrage, WebP), lancé depuis la racine du dépôt. Originaux dans `art/raw/`, images traitées dans `src/assets/combat/`.

## 5. Contenu du dépôt

- `index.html`, `src/main.ts` : point d'entrée, création du jeu Phaser.
- `src/scenes/BootScene.ts` : chargement des images, des sons et des polices, puis village ou carte selon la sauvegarde. `src/scenes/CombatScene.ts` : pose le combat v4. `src/scenes/VillageScene.ts` : le village en pixel. `src/scenes/WorldMapScene.ts` : la carte du monde.
- `src/world/` : le monde. `fsrs.ts` (courbe d'oubli), `progress.ts` (suivi caché, journal du jour, bilan, sauvegarde complète), `record.ts` (écran 記録), `quests.ts` (contrats : état, qui dit quoi, sites, marqueurs, encart), `quest-lines.ts` (leurs répliques, `HEALED`, `MEMORY_ART`), `vn.ts` et `vn.css` (dialogues façon VN, menus, バックログ, sauvegardes, réglages), `text.ts` (découpage des répliques en mots), `lexicon.ts` (sens en français, 役割語), `prefs.ts` (réglages, mémoire des mots), `kanji.ts` (kanji N5 à N2), `assets.ts` (URLs des ressources), `tileset.ts` (feuilles et transitions automatiques), `objects.ts` (catalogue des objets du décor), `build.ts` (calcul des tuiles et des collisions, sans Phaser), `draw.ts` (pose dans Phaser), `maps/` (une carte par lieu), `dialogue.ts` (répliques et traductions), `ui.ts` et `ui.css` (invites, titres, fiche d'un lieu), `places.ts` et `inkmap.ts` (carte du monde), `state.ts` (sauvegarde du monde), `actor.ts` (animations).
- `src/assets/world/` : tuiles, personnages, sons du pack Ninja Adventure.
- `src/combat/engine.js` : générateur de phrases, vérification (`matches`), diagnostic (`diagnose`), statuts, les six distorsions (`STAGES`).
- `src/combat/scene.js` : fond à l'encre du titre et du repaire, état partagé, sons synthétisés. `src/combat/pixel.js` : la chasse en pixel (décors, créature, sabreur, ワケ, effets, sceaux).
- `src/mic.js` : le micro (Web Speech API), partagé par le combat et les dialogues. `src/world/answer.ts` : vérification des réponses dites. `src/world/voice.ts`, `voicefile.ts` : lecture des voix. `src/assets/voice/` : les voix et `index.json`.
- `src/combat/game.js` : déroulé d'une chasse, sauvegarde, repaire, résultat.
- `src/combat/shell.html`, `src/combat/style.css` : interface du combat. `src/combat/assets.ts` : URLs des images. `src/combat/mount.ts` : montage dans la page.
- `src/assets/combat/` : peintures du titre et du repaire (WebP), `px/` : les créatures en pixel. `src/assets/memory/` : peintures des souvenirs. `art/raw/` : originaux.
- `scripts/check-engine.mjs` : vérification du moteur ; `scripts/check-maps.mjs` : vérification des cartes ; `scripts/check-dialogue.mjs` : vérification des répliques ; `scripts/check-progress.mjs` : vérification du suivi caché. Les quatre tournent avec `npm test`.
- `scripts/voice-lines.mjs` : répliques à doubler et texte pour le moteur de voix. `tools/voicevox.mjs` : voix des figurants avec VOICEVOX, sur le PC d'Arsène.
- `tools/process.py` : détourage. `tools/pixelize.py` : version pixel des créatures. `tools/test_micro.html` : page de test du micro.
- `.github/workflows/deploy.yml` : tests, construction et mise en ligne.
- `DESIGN.md`, `PASSATION.md`, `CREDITS.md`.

Travailler en local : `npm install`, puis `npm run dev` (jeu sur http://localhost:5173), `npm test`, `npm run build`.

Mode test : ajouter `#debug` à l'adresse. Un champ texte remplace le micro et `window.KD` expose l'état (`KD.answer()` dit la bonne phrase, `KD.say(texte)` injecte une phrase, `KD.wrong()` dit la phrase déformée).

Dans le village, `window.KDW` : `KDW.go(x, y)` téléporte (en tuiles), `KDW.state()` donne position, direction, cible et dialogue, `KDW.talk()` parle, `KDW.talkTo('taichi')` parle à quelqu'un ou examine un objet (`site-mill`, `site-jizo`, `sign-bridge`) d'où qu'on soit, `KDW.quests()` et `KDW.hud()` donnent l'état des contrats. Sur la carte, `window.KDM.go('kirino')` voyage, `KDM.sel()` donne le lieu choisi. Pour repartir de zéro dans le monde : `localStorage.removeItem('kotodama.world.v1')`.

Dialogues, `window.KDV` : `KDV.state()` (réplique, défilement, オート, スキップ, panneau, bulle), `KDV.open('mansaku')` ouvre un dialogue, `KDV.text()` donne le HTML de la réplique. Réponses : `KDV.answer(k)` dit la bonne phrase (choix k), `KDV.wrong()` la première faute prévue, `KDV.say(texte)` n'importe quoi ; `KDV.state().answer` et `.voice`. En mode test, un champ sous la phrase remplace le micro (Entrée envoie). Attention, en Chrome sans écran Phaser tourne au ralenti : le dialogue d'arrivée met une dizaine de secondes à s'ouvrir. Mots et réglages : `kotodama.words.v1`, `kotodama.settings.v1`, `kotodama.slots.v1`. Progression : `kotodama.progress.v1`.

Ajouter un lieu en pixel : une carte dans `src/world/maps/` (terrain en lettres, objets du catalogue, PNJ, arrivées, sorties), l'inscrire dans `maps/index.ts`, ouvrir le lieu dans `places.ts`, écrire ses répliques dans `dialogue.ts`. `npm test` dit si quelque chose est inaccessible.

## 6. Suite prévue

Lore retenu : voir `DESIGN.md`. Le monde tenait par la parole, les phrases laissées inachevées sont devenues des distorsions, chaque village a perdu une façon de parler.

Plan validé par Arsène, dans cet ordre :
1. Fait en v4 : animations du combat, interface, variété.
2. Premier village : fait en session 2 pour la carte, le déplacement, les PNJ et la carte du monde, en session 3 pour le système de dialogue et les aides, en session 4 pour les voix et les réponses à voix haute. Contrats avec enquête et retour : faits en session 6. Reste, dans l'ordre : le cœur de la brume (enquête sur la colline, boss 霧の主, souvenir de 萬作 et お露, épilogue), prologue au col qui libère ワケ, portraits illustrés, vocabulaire des chasses accordé au monde. Détail du chapitre 1 dans `DESIGN.md`.
3. Forge : les fragments servent à forger des lames (une lame = une famille de structures : avis, cause, condition...) et des sceaux à équiper qui changent les règles (moins de temps pour plus de dégâts, sans furigana pour un bonus).
4. Traques : une faute répétée fait naître sa propre créature, à rechasser.
5. Nombres et compteurs avec le modèle kana en local.
6. Niveau libre avec un juge LLM (coût d'API à valider avec lui).
7. Fait en session 1 : hébergement GitHub Pages, qui garde la permission micro d'une fois sur l'autre.
8. Lien avec le reste : Anki comme centre, mémo des points faibles pour Riho, import des leçons.

Piste pour le combat en pixel : retélécharger le pack Ninja Adventure (depuis le PC d'Arsène si la session ne peut pas) pour prendre ses effets (Fx : coupures, fumée, éléments) et le katana, et dessiner deux ou trois images d'attaque par créature.

## 7. Comment lui répondre

Français, court, la réponse d'abord (il est surtout sur mobile et dicte à la voix). Pas de tirets longs, pas de tournures d'IA, pas de justifications à rallonge. Une question au maximum : il délègue les décisions. Son e-mail est privé, ne jamais l'envoyer à un service externe.
