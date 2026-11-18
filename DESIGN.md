# 言霊 Kotodama : document de conception

Session 0, 17 novembre 2026. Version éditable (avec les schémas) : https://claude.ai/artifact/GqjVpDXpT5q3FnbojRCHQt

Refonte « un monde à parcourir » (conçue en session 9, validée par Arsène) intégrée en session 10 : voir la section « Un monde à parcourir ».

## Intention

Kotodama est un RPG en pixel art, entièrement en japonais, où l'on avance en parlant à voix haute. Il vise deux choses : rendre automatiques les jointures de la phrase à l'oral, et habituer l'oreille et les yeux à un vrai jeu japonais, jusqu'à pouvoir ouvrir un visual novel sans filet.

Le jeu remplace la séance de production orale. Il ne s'ajoute pas à Anki, Seidoku et aux lectures. Une session dure 20 à 40 minutes, un contrat 10 à 15.

**Les règles de conception**

1. **Le contenu est fourni.** On ne cherche jamais quoi dire : le jeu donne la situation, les mots, la structure.
2. **La machine vérifie.** Pas d'auto-évaluation. La reconnaissance vocale juge, le moteur diagnostique.
3. **Du scripté vers le libre.** On lit d'abord une phrase entière, puis on complète, puis on construit, et beaucoup plus tard on parle librement.
4. **L'histoire retire l'aide.** Ce n'est pas un réglage qui enlève la traduction, c'est un personnage qui change.
5. **Comprendre se prouve en agissant.** Pas de quiz : on va au bon endroit, on choisit la bonne lame, on fait confiance à la bonne personne.
6. **Le meilleur butin vient de ce qui est dur.** Sinon on farme le facile.
7. **Un jeu d'abord.** Si une idée est utile mais ennuyeuse, on la change jusqu'à ce qu'elle ne le soit plus.

**Exclu**

- Toute production écrite : pas de clavier japonais, pas de rapport écrit, pas de phrase gravée sur les lames. L'écrit se travaille ailleurs.
- Les quiz de compréhension et les QCM.
- Le contenu tiré de la vie d'Arsène : tout vient du jeu.

## Ton

Calme, mélancolique, drôle par moments : Mushishi et Frieren, pas Berserk. Les créatures sont des chagrins, pas des monstres. Mature veut dire qu'on prend les gens au sérieux, pas qu'on montre du sang.

**Ce qu'on prend à Mushishi**

- Chaque contrat est une petite histoire fermée, qu'on comprend avant de trancher.
- La créature n'est pas méchante. C'est un phénomène né d'un humain, ici d'une phrase qu'il n'a pas finie.
- La nature tient le premier rôle : brume, eau, saisons, villages isolés.
- Le voyageur arrive, règle ce qu'il peut, et repart.

**Ce qu'on prend à Frieren**

- Le temps et le regret : ce qu'on n'a pas dit quand il était encore temps.
- Un humour sec, dans le quotidien, jamais dans les moments graves.
- La tendresse sans effusion. Un merci dit tard pèse plus qu'une grande scène.
- Un voyage après la fin d'une époque.

**Règles d'écriture**

- Pas de gore, pas de cruauté gratuite, pas de jurons pour faire adulte.
- La tristesse vient toujours de ce qui n'a pas été dit.
- Chaque village a au moins un moment drôle.
- Répliques courtes. Pas de leçon de morale.
- La mise à mort est un apaisement (鎮め) : la phrase s'achève, la créature se dissout.

**Image et son**

- Village vu de dessus, combat de profil façon vieux Final Fantasy, portraits illustrés pendant les dialogues.
- Base : le pack Ninja Adventure (CC0), complété par les sources du tableau ci-dessous.
- L'encre et le vermillon restent pour l'identité : titres, sceaux, nom calligraphié des créatures, apaisement final.
- Les créatures sont des silhouettes d'encre dans la palette du pack, avec un seul accent vermillon.
- Musique calme et japonisante. Pendant les dialogues, les voix, l'ambiance et presque pas de musique.

**Les sources**

| Besoin | Base | Compléments | Licence et conditions |
| --- | --- | --- | --- |
| Monde vu de dessus : tuiles, objets, personnages | [Ninja Adventure](https://pixel-boy.itch.io/ninja-adventure-asset-pack), 16×16 | [The Japan Collection](https://itch.io/c/858918/the-japan-collection) de GuttyKreum (temples, sanctuaires, intérieurs, une ville gratuite), [Japanese House](https://nakokohari.itch.io/2d-japanese-house-pixel-tileset-16x16) de Kohari (16×16), [Cozy Japan](https://purbeurre.itch.io/cozy-japan) de PurBeurre | CC0 pour la base. Packs payants autour de 5 à 10 $ : à te demander avant achat. Licence et taille de tuile à vérifier pack par pack |
| Portraits de dialogue | Générés sur ElevenLabs, même gabarit pour tous | Plusieurs expressions par PNJ : neutre, sourire, tristesse, surprise | Images à nous. 190 crédits l'image, soit environ 3 000 pour les trois PNJ et ワケ |
| Décors des cinématiques et des souvenirs | Générés à l'encre, comme en v4 | [Fonds japonais sur BOOTH](https://booth.pm/ja/items/6917321) (和室, 茶屋, temples), quelques centaines de yens | Redistribution à vérifier avant de les mettre dans le dépôt |
| Créatures | Peintures à l'encre de la v4 | Une version pixel par créature pour le combat | Images à nous |
| Texte des dialogues | [DotGothic16](https://github.com/fontworks-fonts/DotGothic16), pixel 16×16 très lisible | PixelMplus pour les petits textes d'interface | SIL OFL et licence M+ : libres, redistribuables |
| Titres, noms des créatures | [Yuji Syuku](https://fonts.google.com/specimen/Yuji+Syuku), d'après la calligraphie de Yuji Kataoka | Les sceaux dessinés de la v4 | SIL OFL |
| Musique | Musiques de Ninja Adventure | Morceaux 和風 d'[OpenTracks](https://dova-s.jp) (ex-DOVA-SYNDROME), albums 和風 sur BOOTH si besoin | CC0 pour la base. OpenTracks : intégration dans un jeu permise sous conditions, à relire avant |
| Bruitages et ambiance | Bruitages de Ninja Adventure | [OtoLogic](https://otologic.jp), Freesound filtré en CC0 pour l'ambiance (rivière, cigales, cloches) | OtoLogic : CC BY 4.0, crédit « OtoLogic » obligatoire |
| Voix | ElevenLabs pour les personnages principaux | VOICEVOX pour les figurants | Crédit VOICEVOX par voix utilisée |

**Règles pour les ressources**

- Un seul style : tout se cale sur des tuiles de 16×16 et sur la palette de Ninja Adventure. Ce qui détonne reste dehors, même gratuit.
- Le dépôt est public, donc tout fichier qu'on y met devient téléchargeable. On privilégie les licences qui permettent la redistribution (CC0, CC BY, OFL) et on évite les packs « sans modification » (CC BY-ND), qui interdisent de recolorer.
- Chaque ressource entre dans un fichier CREDITS.md avec sa source et sa licence, et le jeu a un écran クレジット.
- Toute ressource payante t'est demandée avant achat.

## Monde et carte

Le jeu se passe dans 八雲の国 (Yakumo), un Japon imaginaire de la fin d'Edo, sans dates ni personnages historiques. Le nom vient du premier waka de la tradition (八雲立つ) : c'est un pays fait de mots. Cette section dévoile l'intrigue.

**Le lore**

- Ici, le 言霊 est littéral : une phrase dite entière tient le monde.
- Une phrase laissée en suspens ne disparaît pas. Elle traîne, s'alourdit et devient un 歪み, une distorsion. Une excuse jamais dite, une promesse coupée en deux.
- Il y a longtemps, un 通詞 (interprète officiel) a perdu quelqu'un à cause d'une phrase ambiguë qu'il avait traduite. Il a voulu une langue sans ambiguïté et a arraché au pays ses jointures : だ, の, les particules, les fins de phrase. Il est devenu le 歪みの王.
- Depuis, chaque région a perdu une façon de parler. Dans le premier village, on ne sait plus donner son avis : on ne dit que des faits nus.
- Le joueur est un 渡り, un sabreur venu d'un autre pays. Sa lame, le 言刃 (koto-ba, « la lame de parole »), ne coupe que si la phrase est juste.
- Comme il est étranger, les villageois lui parlent lentement et simplement. Plus le lien (縁) monte, plus ils parlent comme entre eux : la hausse de difficulté a une raison dans l'histoire.
- ワケ, le compagnon, est un fragment détaché du traducteur : la part de lui qui aimait encore les nuances. Plus le joueur répare la langue, plus ワケ retrouve le japonais et oublie le français. À la fin, il choisit de se taire.

**La carte**

- Une carte à l'encre, avec des lieux reliés par des routes. On voyage d'un lieu à l'autre en un clic, sans marcher entre les régions.
- Dans un lieu, on se déplace librement en pixel, vu de dessus.
- Chaque région a un village central, sûr comme une ville de Pokémon, et autour des zones sauvages (herbes hautes, rizières en friche, sous-bois, nappes de brume) où vivent les 言蟲, plus coriaces à mesure qu'on s'éloigne du village. Les boss sont réservés à l'histoire. La route suivante s'ouvre à la fin du chapitre.
- Chaque région apporte un nouveau 役割語, comme un dialecte qu'on découvre en voyageant.
- Les régions finies restent ouvertes : on y revient pour les contrats de révision, et y farmer, c'est réviser (le suivi caché choisit les phrases selon l'échéance).

**La route, un chapitre par lieu**

| Ch. | Lieu | Ce que c'est | 役割語 introduit |
| --- | --- | --- | --- |
| 一 | 霧野村 | Village de montagne, brume | 老人・子ども・町娘 |
| 二 | 灯籠宿 | Relais sur la grand-route | 武士（ござる） |
| 三 | 潮見港 | Port de pêche et marchands | 関西弁 |
| 四 | 鍛冶谷 | Vallée des forges | 職人（江戸弁） |
| 五 | 千鳥町 | Ville du théâtre | ならず者 |
| 六 | 白鷺城 | Château et cour | 姫・敬語 |
| 七 | 雪寺 | Temple sous la neige | 僧侶 |
| 八 | 言の葉の都 | La capitale du traducteur | 役人・書き言葉 |
| 終章 | 無言の塔 | Face au 歪みの王 | Plus aucune aide |

La route serpente comme un chemin de montagne : chaque lieu ne s'ouvre qu'une fois le précédent apaisé.

## Compagnon traducteur et aides qui s'effacent

Tout est en japonais, mais on n'est jamais seul face au texte : ワケ souffle le sens, et cette aide diminue chapitre après chapitre pour une raison qui tient à l'histoire.

**ワケ (訳)**

- Un petit esprit d'encre, de la taille d'une lanterne. Le joueur le trouve coincé dans un poteau indicateur dont l'inscription n'a jamais été finie.
- Son nom joue sur 訳 : やく, la traduction, et わけ, le sens ou la raison.
- Il parle français au joueur (« la langue de ton pays »). Quand il passe au japonais, il parle un japonais standard : c'est la référence neutre face aux 役割語 des PNJ.
- Curieux, un peu vaniteux sur ses talents de traducteur, il se trompe parfois de nuance et l'avoue. C'est lui qui porte l'humour.

**Les paliers de ワケ**

| Palier | Chapitres | Ce que fait ワケ | Pour 「霧じゃ。今日も、霧じゃ。」 |
| --- | --- | --- | --- |
| 1. Il traduit | 1 et 2 | Traduction française de chaque réplique, à la demande | « Du brouillard. Encore du brouillard aujourd'hui. » |
| 2. Il résume | 3 et 4 | Résumé français des répliques importantes seulement, le reste mot à mot au toucher | Rien, la réplique est secondaire |
| 3. Il reformule | 5 et 6 | Reformulation en japonais simple | 「霧だって。毎日、霧なんだね。」 |
| 4. Il souligne | 7 et 8 | Il désigne le mot clé, sans l'expliquer | 「……霧。」 |
| 5. Il se tait | Chapitre final | Plus rien, sauf contre un 栞 | Rien |

La raison dans l'histoire : à chaque chapitre apaisé, ワケ récupère un morceau de sa mémoire japonaise et perd un peu de français. Les premières fois, c'est drôle : il cherche un mot français et ne le trouve plus. À la fin, se taire devient son choix.

**Les aides par mot**

Elles suivent le joueur, pas le chapitre.

- **Furigana** seulement sur les mots que le jeu croit illisibles pour toi. Au départ, les kanji jusqu'au N3 sont réputés connus. Demander une lecture marque le mot comme inconnu ; le prononcer juste à voix haute sur plusieurs jours fait pâlir son furigana, puis le fait disparaître quand il est acquis. S'il s'oublie, le furigana revient, pâle.
- **Sens en français au toucher**, tiré de JMdict, sur n'importe quel mot de n'importe quelle réplique.
- **Réécouter** chaque réplique, et en vitesse lente jusqu'au chapitre 4.
- Un mot touché souvent revient plus souvent dans les chasses et les dialogues.

**Les filets**

- **栞 (shiori)** : un objet rare qui donne le résumé français de la scène en cours. Un ou deux par chapitre. On essaie d'abord, on a un filet si on bloque.
- Après une erreur de compréhension, ワケ explique ce qui a été mal compris, dans la langue de son palier.
- **言葉帳** : un carnet qui garde chaque 役割語 et chaque structure rencontrés, avec leur équivalent standard. Il se remplit comme le bestiaire.

**Les codes des jeux japonais**

- Menus en japonais dès le début : セーブ, ロード, オート, スキップ, バックログ, 設定.
- Boîte de dialogue de VN : portrait, nom, texte qui défile, voix, icône d'attente.
- バックログ avec la voix de chaque réplique, オート, et 既読スキップ pour ce qui a déjà été lu.
- Le jour où tu ouvres un vrai VN, l'interface t'est déjà familière.

**La compréhension se prouve en agissant.** Où aller, à qui faire confiance, quelle lame prendre : tout dépend de ce qu'on a compris. Se tromper coûte du temps ou un bonus, jamais la partie.

## 役割語 des PNJ

Chaque type de personnage parle d'une façon reconnaissable, et chaque région en apporte un nouveau. Les jeux et les VN japonais en sont pleins et aucun cours ne les enseigne : c'est ce qui bloque le plus quand on passe aux œuvres natives.

| Type | Marqueurs | Exemple | En japonais standard | Arrive |
| --- | --- | --- | --- | --- |
| Vieillard | わし, ～じゃ, ～おる, ～ん (négation), ～のう | 「わしは知らんのじゃ」 | 私は知らないんだ | Ch. 1, 萬作 |
| Jeune femme | あたし, ～わ, ～のよ, ～かしら | 「お茶、いかがかしら」 | お茶はどう？ | Ch. 1, おみつ |
| Enfant | ぼく, ～もん, ～ちゃう, phrases hachées | 「だって、こわいんだもん」 | 怖いから | Ch. 1, 太一 |
| Samouraï | 拙者, ～でござる, ～ぬ, ～申す | 「拙者、ただの浪人でござる」 | 私はただの浪人です | Ch. 2 |
| Marchand du Kansai | うち, ～や, ～へん, なんぼ, おおきに | 「これ、なんぼや？」 | これ、いくら？ | Ch. 3 |
| Artisan d'Edo | おいら, ～ねえ, ～てえ, ひ → し | 「できねえこたぁねえ」 | できないことはない | Ch. 4 |
| Voyou | おれ, てめえ, ～ぜ, ～やがる | 「何しやがる」 | 何をするんだ | Ch. 5 |
| Princesse | わらわ, ～じゃ, ～であろう, ～たもれ | 「わらわは退屈じゃ」 | 私は退屈だ | Ch. 6 |
| Serviteur du château | ～でございます, 申し上げる, お～になる | 「殿がお待ちでございます」 | 殿が待っています | Ch. 6 |
| Moine | 拙僧, ～ませぬ, ～ですな | 「拙僧にもわかりませぬ」 | 私にもわかりません | Ch. 7 |
| Fonctionnaire | langue écrite : ～である, ～べし, ～ねばならぬ | 「通行は禁ずる」 | 通ってはいけない | Ch. 8 |

**Règles**

1. La première fois qu'un marqueur apparaît, ワケ le signale et donne son équivalent standard. Il entre dans le 言葉帳.
2. Au chapitre où un type arrive, ses répliques ont un ou deux marqueurs. Ensuite, le personnage parle pleinement à sa façon.
3. Au toucher, un marqueur affiche son équivalent standard (じゃ → だ).
4. Le joueur ne parle jamais en 役割語. Il répond en japonais standard : poli (です, ます) au chapitre 1, poli ou familier selon l'interlocuteur à partir du chapitre 2, et 敬語 imposé au château, au chapitre 6.
5. Un personnage garde sa voix d'un bout à l'autre. Quand le 縁 monte, il parle plus naturellement : contractions (～ちゃう, ～てる), phrases laissées en l'air, sous-entendus.
6. Les voix suivent le type. Personnages principaux sur ElevenLabs, figurants sur VOICEVOX, tout est généré à l'avance.

## La boucle : village, enquête, chasse, retour

Un contrat fait travailler, dans l'ordre, l'écoute, la compréhension, la production rapide et le discours rapporté. La chasse existe déjà ; le reste est à construire autour.

Village → Enquête → Chasse → Retour → contrat suivant. Sous le capot, un suivi caché façon FSRS : chaque mot et chaque structure a sa courbe d'oubli, et le jeu choisit répliques, combats et butin selon l'échéance.

*Mis en œuvre (session 7)* : FSRS-5 sur chaque mot et chaque structure. Un mot est acquis à 10 jours de stabilité, une structure à 14. Les chasses choisissent structures et mots selon l'échéance ; les dialogues, écrits à l'avance, ne changent pas. Le butin ne dépend pas encore de l'échéance. Bilan de la semaine dans メニュー → 記録.

**Village**

- Les PNJ parlent avec leur voix. On leur répond à voix haute, jamais au clic.
- Les contrats viennent des PNJ, pas d'un tableau. Chaque PNJ a ses contrats et son 縁.
- Entre deux contrats : des rumeurs entendues en passant (deux figurants qui discutent), un crieur public, un village qui change à mesure qu'il guérit.
- Les réponses suivent une échelle, du scripté au libre :
    1. **Lire** : la phrase entière s'affiche, on la dit. Chapitre 1.
    2. **Compléter** : la jointure est masquée. Fin du chapitre 1 et chapitre 2.
    3. **Construire** : les mots et la fin s'affichent, comme en combat. Chapitres 2 à 4.
    4. **Intention** : seule l'intention s'affiche (「理由を聞く」) et plusieurs formulations sont acceptées. À partir du chapitre 5.
    5. **Libre**, jugé par un LLM. Plus tard.

**Enquête**

- Deux ou trois témoins à interroger. On pose les questions à voix haute, parmi celles que le jeu propose.
- Leurs réponses donnent le lieu, le moment, et surtout la phrase inachevée que répète la créature.
- Le cœur de l'enquête est de deviner la fin qui manque. 「明日は雨が降る……」 : un avis (と思う), un doute (かもしれない) ou une rumeur (そうだ) ? Ce que disent les témoins permet de trancher.
- Conclure, c'est dire la phrase complète à voix haute. Juste : la lame prend la bonne structure, dégâts ×1,5 et 崩 plus rapide. Fausse : on part quand même, sans bonus, et ワケ explique l'erreur après la chasse.

*Mis en œuvre (session 6)* : deux témoins par contrat, marqués « ？ ». Sur le site, la créature répète le début de sa phrase et le joueur dit l'une des trois fins proposées (と思う, かもしれない, そうだ) : c'est l'échelle « Compléter ». Les questions aux témoins restent à l'échelle « Lire ».

**Chasse**

- Le combat v4 : 斬, 祓, 奥義, 崩, 怒, coups critiques, riposte, diagnostic des erreurs en français.
- Depuis la refonte, la chasse d'un contrat est un combat de boss d'histoire. Le même moteur fait les combats courts contre les 言蟲 (voir « Un monde à parcourir »).
- Les phrases mélangent la structure du contrat, ce qui arrive à échéance et un peu des chapitres passés.
- À la fin, l'apaisement : la créature dit enfin sa phrase entière, puis un court souvenir doublé (deux à quatre répliques) montre qui l'avait laissée en suspens. C'est la récompense d'exposition et la petite histoire du contrat.

**Retour**

- On rapporte au PNJ ce qu'on a vu et entendu, à voix haute : c'est là qu'arrive le discours rapporté (～と言っていました).
- Le PNJ gagne du 縁, donne des 欠片 et parfois le contrat suivant.
- On l'entend utiliser de nouveau la structure perdue : le signe audible que le village guérit.
- Le butin est plus riche quand la chasse portait sur des structures difficiles pour toi.
- Le contrat rapporté donne aussi de l'expérience au 渡り.

## Un monde à parcourir : rencontres, niveaux, butin

Refonte conçue en session 9 après le retour d'Arsène sur le chapitre 1 : l'ambiance tient, la zone de départ est bonne, mais le jeu manque de volume et de vie. La chasse se passait dans une zone à part du monde, il n'y avait rien à faire entre deux contrats, on n'entrait nulle part. Il veut une progression à la Pokémon : des petites créatures faciles partout, des niveaux, des ressources, des quêtes de chasse, des boss réservés à l'histoire, et une montée vers le N1 qui prend son temps, à l'oral comme en compréhension.

Pourquoi : ce qui rend une jointure automatique, c'est le nombre de fois où on la dit. Ce volume ne venait que du repaire, détaché du monde. Les rencontres le ramènent dans le monde.

**Ce qui disparaît**

- 霧野峠 sur la carte du monde, le repaire du combat v4 (onglets 依頼, 図鑑, 設定) et l'accès libre aux six distorsions.
- Les distorsions v4 ne sont plus que des boss d'histoire : 欠けの影, 揺らぎ, 崩れ (contrats du chapitre 1), 伝え火 (chapitre 2), 訳の主 (chapitre 8), 歪みの王 (fin). 霧の主 reste le boss du chapitre 1.
- Le 図鑑 devient le bestiaire de tout ce qu'on a croisé, dans la メニュー. Les réglages du combat passent dans 設定.

**Les 言蟲 (kotomushi)**

- Lore : une phrase importante laissée en suspens devient un 歪み. Les bouts de phrases ordinaires lâchés sans être finis (「えっと……」, 「まあ……」, un avis ravalé) ne deviennent rien d'aussi gros : ils s'agglutinent en petites bêtes, les 言蟲. Pas méchantes, elles grignotent les mots qui traînent. Le ton reste celui de Mushishi.
- Où : hors des villages. Herbes hautes (薄), rizières en friche, sous-bois, nappes de brume. Le village reste sûr.
- Rencontre : au hasard en marchant dans les herbes hautes. Un 鈴 (clochette) les éloigne quand on veut juste traverser.
- Une espèce, une structure : voir la bête, c'est savoir quelle fin dire (reconnaître avant de produire). Au chapitre 1 : つぶやき (と思う), うわさ鳥 (そうだ), まよい蛾 (かもしれない), わけ狐 (んだ). Chaque chapitre ajoute ses espèces (chapitre 2 : から, ので, ため…). Variantes rares plus fortes, qui donnent plus.
- Combat court : 2 à 4 phrases, une minute au plus, même moteur que la chasse (斬, critique, riposte, diagnostic). Pas de 怒 ni de 奥義 sur les petites, sauf variantes rares.
- Images : une peinture à l'encre par espèce, pixelisée avec `tools/pixelize.py` comme les créatures v4.

**Les niveaux**

Le niveau d'une bête est la difficulté de sa phrase. Le niveau du joueur ne change jamais la phrase demandée.

| Niveau de la bête | Ce qu'on dit | Échelle |
| --- | --- | --- |
| 1 à 3 | Phrase entière affichée, présent | Lire |
| 4 à 6 | Mots + fin, présent et négatif | Construire |
| 7 à 9 | Passé et négatif passé, moins de temps | Construire |
| 10 et plus | Phrases déformées (祓), structures du chapitre mélangées | Construire |
| Haut de tranche | Phrase seulement entendue, rien d'affiché | Écoute |

- Tranches par chapitre : chapitre 1 niveaux 1 à 10, chapitre 2 8 à 20, chapitre 3 18 à 30, et ainsi de suite jusqu'au chapitre 8 (70 à 80) et au chapitre final (80 à 99). Dans une région, plusieurs zones de niveaux différents : un champ facile près du village, une forêt plus dure plus loin.
- Les anciennes zones restent ouvertes : y farmer, c'est réviser. Le suivi caché (FSRS) choisit les phrases selon l'échéance, comme dans les chasses.

**Le joueur progresse**

- Niveau du 渡り par l'expérience (bêtes, quêtes, contrats). Il donne des PV, un peu de temps de réponse, plus de droit à l'erreur. Du confort seulement : il ne dit jamais la phrase à la place du joueur.
- Les boss d'histoire ont un niveau conseillé. On peut les tenter avant, c'est juste plus dur.

**Le butin**

- Matériaux selon l'espèce et le niveau : 墨, 和紙, 糸, 木片, 鉄片, 米, plus rares en haut de tranche. Plus riche quand la phrase était à échéance ou difficile pour le joueur (règle 6).
- Ils servent dès le chapitre 1 : おみつ fait des dango qui soignent, 萬作 (charpentier) fabrique des pièces pour le sabre et des amulettes. On commande à voix haute. La vraie forge (lames par famille de structures, sceaux) reste au chapitre 4, 鍛冶谷.
- Les 欠片 des boss restent la ressource rare.

**Les quêtes de chasse**

- Données par les villageois, à voix haute, sans tableau. Comprendre la demande fait partie de la quête : quelle bête, où, combien. Exemples : 権兵衛, les うわさ鳥 picorent ses rizières ; 太一 veut voir une まよい蛾 de près ; おたね manque de 糸.
- Plus tard dans le jeu, certaines demandes ne sont que dites, sans texte.
- Les contrats (quête principale) ne changent pas : enquête, déduction, boss, souvenir, rapport.

**Un village plus vivant**

- On entre dans les maisons : 茶屋 (sauvegarde, soins, commandes), maison de 萬作 (atelier), moulin de 太一, petit sanctuaire. Intérieurs tirés de Ninja Adventure, ou de The Japan Collection et Japanese House si la licence le permet (achat à demander).
- Plus d'objets à examiner, avec du texte japonais à lire : panneaux, 絵馬, avis du village, étals.
- Passe sur les placements incohérents : le moulin à eau d'abord, puis une revue en captures.
- Plus tard : jour et nuit, PNJ qui bougent selon l'heure.

**La compréhension prend son temps**

- Les PNJ parlent plus long et plus naturellement quand le 縁 monte, les rumeurs entre figurants se multiplient, les quêtes de chasse passent peu à peu à l'oral seul, les bêtes d'écoute arrivent en haut de chaque tranche.
- Le chapitre 1 passe d'environ 2 à 4 heures à 5 à 8 heures.

**Découpage**

1. Session 10, les rencontres : retrait de 霧野峠 et du repaire, zone 薄野原 à côté du village, herbes hautes et rencontres, quatre espèces du chapitre 1, combats courts, niveaux des bêtes, expérience et niveau du joueur, butin et sac, 図鑑 dans la メニュー.
2. Session 11, le village : intérieurs (茶屋, maison de 萬作, moulin, sanctuaire), objets à examiner, correction des placements, quêtes de chasse auprès des villageois. Fait.
3. Session 12, l'économie : dango et fabrication chez おみつ et 萬作, niveaux conseillés des boss, équilibrage de la courbe 1 à 10 sur tout le chapitre 1.

Ensuite Arsène rejoue le chapitre 1 dans les bonnes conditions.

*Mis en œuvre (session 10)* : 霧野峠 et le repaire retirés (une sauvegarde restée sur le col reprend au village). 薄野原, à l'est du village (sortie par la route de l'est), avec trois zones d'herbes hautes : l'entrée (niveaux 1 à 3), le milieu (3 à 6), autour de l'étang (6 à 10). Une rencontre a une chance sur neuf par case d'herbe traversée. Le 鈴 pend au cou du 地蔵 de l'entrée ; touche X ou メニュー → 持ち物. Les espèces se montrent au fil de l'histoire : つぶやき d'emblée, うわさ鳥 après le moulin, まよい蛾 après le col, わけ狐 après le pont. Variante rare (朱, une chance sur seize) : vermillon, un niveau et une phrase de plus, avec 崩, 奥義 et 怒. Combat de 2 à 4 phrases (une phrase juste en vaut une), fuite possible (逃げる). Niveau 10 : 祓, fins mêlées et phrase seulement entendue (voix japonaise de Chrome ; sans elle, on affiche les mots). Le 渡り : 4 + niveau/2 PV, +0,3 s par niveau (3 s au plus), PV gardés entre deux combats et rendus au village ; à bout de forces, ワケ ramène au 茶屋. Expérience : bêtes, contrats (30, boss 60), rapports (20). Butin dans un sac (持ち物), plus riche quand une phrase à revoir a été bien dite. 図鑑 dans la メニュー : les quatre 言蟲 et les six distorsions du chapitre, silhouettes pour le reste.

*Mis en œuvre (session 11)* : quatre intérieurs, où l'on entre en marchant sur la porte. Le 茶屋 d'おみつ (elle y vit désormais ; on y commande à voix haute : お茶 ou お団子 rendent les PV, 「少し休ませてください」 ouvre la セーブ ; on s'y réveille après une défaite), la maison-atelier de 萬作 (établi, plan du pont, foyer, autel de お露), le moulin de 太一 (meule, cahier du grand-père qui s'arrête sur 「太一は、」, dessin de 太一) et le petit sanctuaire 霧野神社 (vœu dit à voix haute, おみくじ au hasard). Les PV ne reviennent plus en entrant au village : il faut passer au salon de thé. Sols, murs et objets japonais peints par le code dans la palette du pack (`paint.ts`), meubles du pack ; aucun pack payant. Objets à lire dont le texte suit l'histoire : avis du village (quatre versions), 絵馬 (cinq vœux), étal d'おたね (prix avec compteurs), lettre de la mère d'おみつ après le col, plans du pont. Cinq quêtes de chasse dites à voix haute (bête, zone, nombre, ou matériau), sans traduction dans l'encart ; une bête d'une autre espèce ou d'une autre zone ne compte pas. Village vivant : deux commères au puits dont on surprend les rumeurs en bulles (doublées, guéries après l'épilogue), poules, chat, fumées, feuilles d'automne, rides sur l'eau, lanternes qui respirent, PNJ qui regardent le sabreur. Placements corrigés : le moulin est une cabane de bois dont la roue tourne dans un bief, l'épouvantail est planté dans la rizière, le sentier du col n'est plus coupé.

## Courbe des structures, de N4+ à N1

Chaque chapitre rend au pays une façon de parler, donc une famille de structures. Trois choses montent ensemble : les structures à produire, la langue des PNJ et le retrait de ワケ. Les niveaux JLPT sont indicatifs.

| Ch. | Lieu | Ce que le pays a perdu | Structures à produire | Niveau | Parole des PNJ | ワケ |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 霧野村 | Donner son avis | と思う, かもしれない, そうだ (ouï-dire), んだ ; nom, adjectifs な et い, verbe ; présent, négatif, passé | N4+ | やさしい日本語, phrases courtes, lentes | Traduit |
| 2 | 灯籠宿 | Dire pourquoi | から, ので, ～のは～からだ, ～ため(に), ～せいで, ～おかげで, ～て de cause | N3− | Phrases courtes, premières liaisons | Traduit |
| 3 | 潮見港 | Poser une condition | ～たら, ～ば, ～なら, ～と, ～ても, ～ないと | N3 | Débit normal, 関西弁 | Résume |
| 4 | 鍛冶谷 | Donner et recevoir | ～てあげる, ～てくれる, ～てもらう, causatif, passif, causatif-passif, paires 自他動詞, ～てある, ～ておく | N3+ | Contractions (～ちゃう, ～てる) | Résume |
| 5 | 千鳥町 | Rapporter, supposer | ～らしい, ～ようだ, ～みたい, ～はず, ～わけだ, ～わけではない, ～って, ～ということだ | N2− | Rumeurs, sous-entendus, phrases en l'air | Reformule |
| 6 | 白鷺城 | Le registre | 尊敬語, 謙譲語, ～ていただけますか, ～させていただく, passer du poli au familier | N2 | Cour en 敬語, princesse en わらわ | Reformule |
| 7 | 雪寺 | La nuance | ～のに, ～ながらも, ～ものの, ～にもかかわらず, ～に過ぎない, ～ていく, ～てくる, ～はずの | N2+ | Langue d'un VN ordinaire | Souligne |
| 8 | 言の葉の都 | La langue écrite | ～ざるを得ない, ～にほかならない, ～を余儀なくされる, ～んばかり, ～ともなると, ～である | N1− | Discours officiels, écrit lu à voix haute | Souligne |
| Final | 無言の塔 | Tout | Toutes, mélangées, sans indice | N1 | Comme un vrai VN | Se tait |

- **Tes points faibles sont placés exprès** : les paires 自他動詞 au chapitre 4, ～ていく, ～はずの et ～に過ぎない au chapitre 7.
- **Les nombres et compteurs** arrivent au marché du port (chapitre 3) si Kana Whisper est prêt, sinon plus tard dans un contrat à part.
- **Rien n'est jamais fini** : chaque chapitre ajoute ses structures au suivi caché, et elles reviennent dans les chasses quand elles arrivent à échéance.
- **Le boss de chapitre sert d'examen** : il mélange toutes les structures du chapitre et quelques anciennes, sans furigana sur les mots acquis.
- **Taille visée** : quatre à six contrats et un boss par chapitre, plus les rencontres et les quêtes de chasse : cinq à huit heures de jeu pour le chapitre 1 (refonte).

## Chapitre 1 : 第一章「霧の村」

Le village de 霧野 ne sait plus donner son avis : les villageois ne disent que des faits nus, et chaque opinion jamais dite épaissit la brume. Le joueur apaise trois distorsions, puis la brume elle-même.

**Les scènes**

1. **Prologue, le col.** Le sabreur monte dans la brume jusqu'à un poteau indicateur dont l'inscription s'arrête en plein milieu. En disant à voix haute la phrase affichée, il libère ワケ, coincé dans la pierre. ワケ parle français, se présente comme « le meilleur traducteur du pays » et décide de le suivre. C'est le tutoriel de la voix.
2. **Arrivée au village.** Personne ne donne d'avis. おみつ annonce 「お茶、熱いわ。お団子、甘いわよ。……それだけ。」, 萬作 répond 「霧じゃ。今日も、霧じゃ。」. ワケ comprend : le village a perdu les fins qui portent le cœur de celui qui parle. On découvre le 茶屋, la maison de 萬作, le moulin à l'arrêt, le pont suspendu, la colline du cimetière.
3. **Trois contrats**, dans l'ordre du tableau ci-dessous, plus deux petits contrats de révision tirés des rumeurs du village.
4. **Le cœur de la brume.** Après les trois contrats, la brume ne se lève pas. L'enquête mène à la colline, où elle est la plus épaisse, près de la tombe de お露, la femme de 萬作. 萬作 ne peut pas en parler ; 太一 et おみつ témoignent. Le boss, 霧の主, mélange les quatre fins.
5. **Le souvenir.** 萬作 au chevet de お露, il y a dix ans : 「わしは、お前に……」. La phrase apaisée : 「わしはな、お前に礼を言いたかったんじゃ」. ワケ fait remarquer que ce んじゃ est le んだ du joueur, dit par un vieil homme.
6. **Épilogue.** La brume se lève sur les rizières en terrasse. Le village reparle, et donne même trop son avis : おみつ et 萬作 se disputent sur le goût du thé. 萬作 remercie le joueur. ワケ cherche un mot français et, pour la première fois, ne le trouve pas. Sur le poteau du col, un sceau vermillon est apparu : 訳. La route vers 灯籠宿 s'ouvre.

**Les trois contrats**

| Contrat | Donné par | Créature | Fin perdue | Lieu | La phrase apaisée et son auteur |
| --- | --- | --- | --- | --- | --- |
| 水車小屋の影 | 太一 | 欠けの影 | と思う | Le moulin à l'arrêt | 「太一は、いい職人になると思う」 : le grand-père meunier de 太一, mort l'hiver dernier |
| 峠の噂 | おみつ | 揺らぎ | そうだ | Le col, près du 地蔵 | 「お前の母さんは、都で元気に暮らしているそうだ」 : un colporteur qui n'a jamais fini de transmettre la nouvelle |
| 吊り橋 | 萬作 | 崩れ | かもしれない | Le pont suspendu | 「この橋は、もう長くはもたないかもしれない」 : 萬作 jeune, charpentier du pont, qui n'a jamais osé le dire |

Après chaque contrat, le village change : 太一 décide de réparer le moulin, おみつ apprend que sa mère est vivante, et le village répare le pont ensemble. Les trois créatures reprennent celles de la v4 ; 霧の主 est nouveau.

*Mis en œuvre (session 8)* : tout le chapitre, cinématiques comprises. Prologue au col en pixel (la voix de ワケ dans la borne, deux phrases à dire). Arrivée en cinématique (おみつ et 萬作 en faits nus, tour du village). Deux contrats de révision tirés des rumeurs : 井戸の呟き (おみつ, と思う : 萬作 trouve les dango bons sans jamais le dire) et 案山子の迷い (おたね, かもしれない : 権兵衛 trouve ses pickles un peu salés). Le cœur de la brume (霧の丘) : la déduction se fait parmi quatre fins, dont んだ, parce que お露 demandait toujours どうしたの. Boss 霧の主 sur les seize structures. Épilogue complet, sceau 訳 sur la borne, route de 灯籠宿 ouverte (chapitre 2 à venir).

## Les trois PNJ du chapitre 1

Trois façons de parler dès le premier village, pour que l'oreille compare : le vieil homme, la jeune femme, l'enfant. Avant guérison, leurs répliques n'utilisent aucune des quatre fins perdues ; après, elles reviennent.

### 萬作 (Mansaku), le vieux charpentier

- **Rôle** : doyen du village et ancien charpentier du pont. Il donne le contrat du pont et mène, sans le vouloir, au boss.
- **Voix** : homme d'environ 70 ans, grave, lent, un peu rauque. ElevenLabs.
- **役割語** : vieillard (わし, じゃ, おる, ん, のう). Il appelle le joueur お前さん.
- **Caractère** : bourru, pudique, drôle malgré lui. Il parle peu, et presque toujours du temps qu'il fait.
- **Arc** : il n'a jamais dit à sa femme ce qu'elle comptait pour lui. Le chapitre se termine sur cette phrase.
- **Répliques**
    - Avant : 「旅の者か。……霧じゃ。今日も、霧じゃ。」 Un voyageur ? Du brouillard. Encore du brouillard aujourd'hui.
    - Présentation : 「わしは萬作。昔は橋を架けておった。今は、ただの年寄りじゃ。」 Je suis Mansaku. Autrefois, je construisais des ponts. Aujourd'hui, je ne suis qu'un vieux.
    - Après le chapitre : 「お前さんが来てくれて、よかったと思っておる。」 Je crois que c'est une bonne chose que tu sois venu.

### おみつ (Omitsu), la fille du salon de thé

- **Rôle** : tient le 茶屋 à l'entrée du village, qui sert de point de sauvegarde. Elle donne le contrat du col et la plupart des rumeurs.
- **Voix** : jeune femme, vive, rapide quand elle s'emballe. ElevenLabs.
- **役割語** : jeune femme (あたし, わ, のよ, かしら). Elle appelle le joueur お客さん, puis あんた quand le 縁 monte.
- **Caractère** : bavarde, curieuse, très fière de ses dango. C'est elle qui souffre le plus de ne plus pouvoir colporter les rumeurs.
- **Arc** : sa mère est partie pour la capitale quand elle était petite. Elle apprend qu'elle est vivante.
- **Répliques**
    - Avant : 「いらっしゃい！お茶、熱いわ。お団子、甘いわよ。……それだけ。」 Bienvenue ! Le thé, chaud. Les dango, sucrés. C'est tout.
    - Indice : 「峠に、何かいる。……あれ？続きが出てこないの。」 Il y a quelque chose au col. Hein ? La suite ne vient pas.
    - Après son contrat : 「母さん、都で元気にしているそうよ。……よかった。」 Il paraît que maman va bien, à la capitale. Tant mieux.

### 太一 (Taichi), le petit-fils du meunier

- **Rôle** : 8 ans, premier témoin du jeu. Il donne le premier contrat, qui sert de tutoriel à l'enquête.
- **Voix** : enfant, aiguë, phrases hachées. Voix créée sur ElevenLabs.
- **役割語** : enfant (ぼく, もん, ちゃう). Il appelle le joueur お侍さん.
- **Caractère** : courageux pour faire comme les grands, peureux en vrai. Il veut devenir meunier comme son grand-père.
- **Arc** : son grand-père croyait en lui sans jamais le lui dire. Il décide de remettre le moulin en marche.
- **Répliques**
    - Avant : 「お侍さん！水車小屋に、影、いた！顔、なかった！ほんとだもん！」 Monsieur le samouraï ! Au moulin, une ombre ! Sans visage ! C'est vrai, hein !
    - Témoignage : 「影がね、『太一は、いい職人に……』って。それで、止まっちゃった。」 L'ombre a dit « Taichi deviendra un bon artisan… », et puis elle s'est arrêtée.
    - Après son contrat : 「ぼく、水車を直すんだ。じいちゃんの水車だもん。」 Je vais réparer le moulin. C'est le moulin de grand-père.

## Plus tard, et décisions prises

Ce document fixe la direction d'ensemble et le chapitre 1. Le reste du brainstorm attend son tour, sauf la production écrite, abandonnée.

**Plus tard, dans l'ordre probable**

- La forge, au chapitre 4 (鍛冶谷) : les 欠片 servent à forger des lames (une famille de structures) et des sceaux qui changent les règles.
- Les traques : une faute répétée fait naître sa propre créature.
- Les nombres et compteurs avec Kana Whisper.
- Les 式神 : sceller une créature apaisée pour en faire un familier.
- 深淵, le mode sans fin : trois fautes et la partie s'arrête.
- Le niveau libre, jugé par un LLM, coût à valider avec toi.
- Les 72 micro-saisons, les versions renforcées des créatures. (Le bilan de la semaine est fait, session 7.)
- Jour et nuit, PNJ qui bougent selon l'heure (refonte).
- Envoyer un mot vers Anki d'un toucher.

**Décisions prises par défaut**

Commente celles qui ne te vont pas.

- Le compagnon s'appelle ワケ et c'est un fragment du traducteur.
- Huit chapitres et un chapitre final, un lieu par chapitre.
- Le joueur est un étranger : c'est ce qui justifie la langue simplifiée du début.
- Les créatures de la v4 sont réparties dans l'histoire, comme boss : 欠けの影, 揺らぎ et 崩れ au chapitre 1, 伝え火 au chapitre 2 (le relais aux lanternes), 訳の主 au chapitre 8, 歪みの王 à la fin. On ne les chasse plus librement (refonte).
- On progresse à la Pokémon : petites bêtes dans les zones sauvages, niveaux, ressources, quêtes de chasse (refonte validée par Arsène).
- Le jeu se joue sur PC avec un micro. Un mode téléphone, à l'écoute seule, reste une question ouverte.
