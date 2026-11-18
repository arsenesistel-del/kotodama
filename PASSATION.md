# 言霊 Kotodama : fichier de passation

À donner tel quel à un nouveau chat. Dernière mise à jour : 18 novembre 2026, session 12 (l'économie). Le document de conception est `DESIGN.md`, à la racine du dépôt.

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

## 2. État au 18 novembre

### Session 12 : l'économie et l'équilibrage

Branche `session-12-economie`, PR #10 (voir l'onglet Pull requests du dépôt). La PR #9 (session 11) était déjà fusionnée au début de la session. À fusionner dans `main` pour la mise en ligne.

**À tester en priorité dans ta partie à la voix** (repars avec メニュー → はじめから : le 渡り repart maintenant du niveau 1, sac vide ; tes mots, ta progression et le 図鑑 restent) :
1. **Les commandes à voix haute** : au salon de thé 「みたらし団子を、包んでください。」 et 「三色団子を、包んでください。」 ; chez 萬作 「刀を、握りやすくしてほしいんです。」, 「刀を、軽くしてほしいんです。」, 「鍔を付けてほしいんです。」, 「鞘を作ってほしいんです。」, 「お守りを作ってください。」, 「赤い札が、ほしいんです。」. Note celles que Chrome refuse et ce qu'il entend (affiché sous la phrase) : 鍔, 鞘, 札 et 三色 sont les plus à risque (j'ai déjà ramené 唾 → 鍔, 莢 → 鞘, 赤い蓋 → 赤い札, 三食 → 三色, 握り易 → 握りやす).
2. **Le temps de jeu** : 持ち物 affiche le temps de la partie, dans les herbes, contre les distorsions, et par étape (c1, c2…). Donne-moi ces chiffres à chaque boss ou à la fin : ils remplaceront les hypothèses du modèle d'équilibrage.
3. **Les boss au niveau conseillé** : 欠けの影 (Lv 3) demande maintenant des mots + fin au présent et au négatif, plus seulement la phrase entière ; dis si la marche est trop haute après les herbes du niveau Lire. Et 霧の主 (Lv 10) est plus long (environ 35 phrases).
4. **Le rythme dans les herbes** : niveaux 2 → 3 et 4 → 5, 7 → 8 (25 à 31 combats d'après le modèle). Si c'est du remplissage, dis où.
5. **Les dango** (touche C ou bouton 団子 de l'encart) et la brume du fond de 薄野原 (fermée jusqu'au contrat du col).

- **おみつ, salon de thé** (`src/world/craft.ts`, répliques dans `village-lines.ts`) : la commande se dit parmi ce qu'on peut payer, quatre phrases au plus (`pick`) : le thé (gratuit, rend les PV), les みたらし団子 à emporter (米 ×2, rendent 3 PV), après le col les 三色団子 (米 ×4, rendent tout ; おみつ s'est souvenue de la recette de sa mère, `omitsu:sanshoku`), le repos (sauvegarde). Après un dango, 「ほかには？」 : on en recommande ou on dit 「それで、大丈夫です。」. 「お団子をください」 ne soigne plus gratuitement. Les dango se mangent dans les herbes : touche C, bouton 団子 de l'encart du 渡り, ou 持ち物 → 食べる. 9 みたらし et 5 三色 au plus.
- **萬作, l'atelier** : après le moulin, il remarque que le fil du manche s'effiloche et propose son travail (`craft:intro`). Ensuite, quand on peut payer quelque chose, lui parler ouvre la commande (trois choses au plus, et 「今日は、大丈夫です。」 pour partir) ; sinon un toast dit qu'il manque des matériaux. Les contrats, les témoignages et les quêtes de chasse passent avant.
  - Pièces du sabre, une fois pour toutes : 柄巻 (après le moulin ; 糸 ×4, 和紙 ×2 ; +0,5 s pour répondre), 軽い柄 (après le col ; 木片 ×4, 墨 ×3 ; coup critique jusqu'à 4 s au lieu de 3,5), 鍔 (après le col ; 鉄片 ×2, 木片 ×2 ; +1 PV max), 鞘 (après le pont ; 木片 ×5, 和紙 ×4, 鉄片 ×2 ; dégâts +20 % contre les distorsions).
  - 札, chacun sert une fois, 3 au plus : 守り札 (après le moulin ; 和紙 ×2, 墨 ×2 ; contre une distorsion, le premier coup reçu est paré, sceau 守), 呼び札 (après le col ; 墨 ×3, 糸 ×1 ; 持ち物 → 使う : variantes 朱 une sur quatre pendant dix rencontres, compte dans l'encart).
  - Pendant la commande, une fiche à droite montre ce que l'artisan sait faire, ce que ça coûte (en rouge ce qui manque) et ce qu'on a. La même liste est dans 持ち物 (注文), avec les dango et 札 portés (道具) et les pièces posées (刀).
- **Niveaux conseillés** (`rec` dans `quests.ts`) : 欠けの影 3, 揺らぎ 5, 呟き 6, 崩れ 8, 迷い 9, 霧の主 10. L'encart du contrat le rappelle (« 推奨 Lv 5 · ton 渡り : Lv 3 (plus dur) »), ワケ prévient au site si le 渡り n'y est pas (on peut y aller quand même), le bandeau de la chasse aussi.
- **Les boss suivent le tableau des niveaux**, un cran au-dessus de leur niveau conseillé (vérifié par `npm test`) : 欠けの影 et 揺らぎ, présent et négatif, 13 s ; 呟き, 崩れ, 迷い, passé, négatif passé et négatif, 11 s ; phrases déformées (祓) seulement pour 迷い et 霧の主 ; phrases entendues pour 霧の主 (une sur cinq, si Chrome a une voix japonaise). Avant, tous mêlaient présent, négatif et passé, avec du 祓 dès le premier. Plus de PV, comme des examens : 340, 420, 340, 500, 420, 660 (霧の主 : environ 35 phrases au niveau conseillé).
- **Écart corrigé** : une variante 朱 au niveau Lire passait en 奥義 avec les mots seuls ; elle montre maintenant la phrase entière.
- **Courbe et récompenses** (`field.ts`) : expérience en table pour la tranche 1 à 10 (120, 380, 640, 670, 800, 900, 880, 1 150, 1 200) ; une bête rapporte 2 + 3 × niveau (double si 朱), plus les critiques et +2 sans coup reçu ; une bête de plus de deux niveaux sous le 渡り rapporte moins (−25 % par niveau, 20 % au moins) ; 連鎖 : chaque combat sans coup reçu qui suit d'autres combats sans coup reçu rapporte +10 % de plus, jusqu'à +50 % (affiché dans l'encart et le panneau de fin). L'expérience de l'histoire est une part du niveau en cours : contrat gagné un quart, 霧の主 la moitié, rapport un dixième, quête de chasse un cinquième. Butin un peu réduit (un tirage de plus au niveau 6 au lieu de 5 et 8, 鉄片 à 20 % au niveau 9).
- **薄野原** : le fond se coupe en deux, 池のほとり (6 à 8, au nord de l'étang) et 野原の奥 (8 à 10, au sud), et une brume le ferme tant que le contrat du col n'est pas rapporté (ワケ : « Trop épais, par là »). Les barrières de brume peuvent maintenant s'ouvrir avec un contrat (`flag: 'c2'`). Les phrases entendues n'arrivent donc qu'après le col, vers le niveau 8. La quête h5 (わけ狐 au 池のほとり) ne change pas.
- **Équilibrage** (`scripts/check-balance.mjs`, dans `npm test`, `--report` pour le détail) : 100 parties simulées avec les vraies règles (tirages, expérience, butin, recettes, PV et dégâts des boss, 守り札, dango) et un joueur moyen modélisé (7 à 10,5 s par phrase, 6 à 26 % d'erreurs selon le niveau, répliques à 8 s pour les PNJ, 13 s pour les réponses). En suivant les niveaux conseillés : **5 h 24 en moyenne** (5 h 11 à 5 h 38), dont 1 h 48 d'histoire seule et environ 2 h 40 dans les herbes ; 180 combats, 660 phrases de bêtes, 200 phrases de boss. Étapes : c1 36 min (20 dans les herbes), c2 54 (32), r1 27 (13), c3 76 (57), r2 35 (21), c4 59 (33). Boss gagnés du premier coup à 81 à 100 % au niveau conseillé, 75 à 92 % trois niveaux en dessous. Le test vérifie : 5 à 8 heures, une heure d'herbes au plus entre deux boss, 32 combats au plus par niveau, chaque palier travaillé (Lire, négatif, passé, niveau 10), pas de phrase entendue avant le col, boss conformes au tableau, les quatre pièces payables avant le dernier boss, les dango mangés, les cinq quêtes rendues. Tirages à graine fixe : le résultat ne bouge pas d'un `npm test` à l'autre. Les temps sont des hypothèses : tes chiffres réels les remplaceront.
- **Temps de jeu** (`clock` dans `kotodama.world.v1`) : compté quand l'onglet est visible, au total, dans les herbes, contre les distorsions et par étape de l'histoire. Affiché dans 持ち物. Remis à zéro par はじめから.
- **はじめから** remet aussi le 渡り au niveau 1 (sac, dango, pièces, clochette), le 図鑑 reste (`Field.newRun`).
- **Voix** : 17 répliques (おみつ : Konomi, 萬作 : JUN, `[slowly]`), 426 crédits. Crédits ElevenLabs : environ 12 875 utilisés sur 40 000 ce mois.
- Lexique : `src/world/lexicon-craft.ts` (包む, 握りやすい, 鍔, 鞘, 札, 柄, 朱…), fusionné dans `LEX`.
- `npm test` vérifie aussi : commandes (rien avant le moulin, on ne paie que ce qu'on a, une pièce ne se pose qu'une fois, effets des pièces, dango, 守り札 une fois, 呼び札 dix rencontres, quatre phrases au plus au comptoir), 連鎖 et expérience des bêtes trop faibles, はじめから, brume du fond de 薄野原 (elle ferme les zones 6 et plus, et rien d'autre), phrases de commande acceptées et fautes reconnues.
- Vérifié dans Chrome sans écran (mode test, réponses tapées, Playwright) : nouvelle partie de bout en bout, de l'écran titre au carton de fin (prologue, arrivée, les six contrats, épilogue, drapeau `ch1`) ; avertissement de ワケ au moulin au niveau 1 ; combats dans les herbes (expérience, butin, 連鎖) ; intro de 萬作, commande du 柄巻 et de deux 守り札 ; trois みたらし emballées d'affilée jusqu'à épuisement du riz ; touche C ; brume fermée avant le col (le sabreur s'arrête à x 26,2), ouverte après ; les quatre pièces posées (PV max 10 au niveau 10) ; 守り札 qui pare une faute contre 欠けの影 ; 呼び札 utilisé depuis 持ち物 ; fiche de commande et 持ち物 en capture. Aucune erreur JavaScript. `npm test` et `npm run build` passent. Pas vérifié à la voix réelle.
- Pas fait : musique des intérieurs, portraits illustrés, écran du 言葉帳.

Pour suivre : `KDW.craft()` (ce que proposent おみつ et 萬作, ce qu'on peut payer, objets et pièces), `KDW.give({ kome: 6 })` remplit le sac, `KDW.lv(5)` met le 渡り au niveau voulu, `KDW.eat()` mange un dango, `KDW.clock()` le temps de jeu, `KDW.exit('east')` sort du lieu par un côté (`'south'` pour sortir d'un intérieur), `KDW.boss('c1')` relance la chasse d'un contrat (test seulement : un contrat fini repasse « à rapporter »). Le pilote Playwright de la session est décrit dans la PR.

### Session 11 : le village

Branche `session-11-village`, PR #9 : https://github.com/arsenesistel-del/kotodama/pull/9 (à fusionner). La PR #8 (session 10) était déjà fusionnée au début de la session.

- **Intérieurs** (`src/world/maps/interiors.ts`) : on entre en marchant sur la porte (`doors` de la carte), on ressort par le bas, devant la même porte. La pièce entière est cadrée au centre de l'écran, un peu haute pour laisser la place au dialogue.
  - **茶屋** (`chaya`) : fourneau et comptoir, おみつ derrière (elle vit là maintenant ; dans les cinématiques d'arrivée et d'épilogue, elle sort le temps de la scène, `cameo`), bancs rouges, menu au mur, étagère des dieux, pièce du fond en tatami avec un futon. Sans contrat ni demande, elle prend la commande (`chaya:menu`), à voix haute : 「お茶をください」 ou 「お団子をください」 rendent tous les PV, 「少し休ませてください」 rend les PV et ouvre la セーブ. Elle prend aussi la commande quand un de ses contrats ou une de ses demandes est en cours (après le rappel). **Les PV ne reviennent plus en entrant au village** : il faut passer au salon de thé. À bout de forces, on se réveille sur le futon (`down:wake`).
  - **萬作の家** (`ie`) : l'atelier en terre battue (établi, outils, planches, plan du pont qui change après le pont), la pièce en tatami autour du foyer (braises qui palpitent, vapeur), l'autel avec le nom de お露 (offrandes après l'épilogue).
  - **水車小屋** (`mill`) : la meule (elle tremble et la farine vole une fois le moulin réparé), les ballots de riz, le cahier du grand-père dont la dernière page s'arrête sur 「太一は、」, le dessin de 太一 (une ligne de plus après le moulin).
  - **霧野神社** (`yashiro`), le petit sanctuaire, nouveau bâtiment au sud-est de la place (torii, chiens-lions, lanternes de pierre, portant des 絵馬) : corde sacrée, miroir, tronc des offrandes où l'on dit un vœu à voix haute (「村の霧が、晴れますように。」, 「ありがとうございました。」 après l'épilogue), おみくじ tirée au hasard (cinq oracles).
- **Peint par le code** (`src/world/paint.ts`), dans la palette du pack : plancher, tatami (nattes décalées d'une rangée à l'autre), terre battue, plancher sombre, murs de plâtre à poutres, haut des murs ; foyer, autel, étagère des dieux, meule, ballots, fourneau, shoji, menu, tronc, miroir, corde, 絵馬, おみくじ, tableau d'avis, outils, plan, dessin, banc rouge et grande ombrelle, lanternes, coussins, service à thé, dango, futon, lanterne de pierre, chiens-lions, étal, radis, bûches, établi, planches, lettre. Meubles du pack en plus (table basse, coffre, jarre, seau, tabouret). Les lettres « F M E K W X » du terrain sont les sols et murs des intérieurs ; un objet `top` se pose par-dessus un autre (calque `deco`).
- **Pack payant** : pas acheté. Ninja Adventure + les objets peints suffisent et gardent un seul style ; Japanese House (Kohari, 5 $) ne dit pas si on peut redistribuer ses tuiles, et le dépôt est public.
- **Pack Ninja Adventure** retéléchargé dans la session (itch.io, fichier direct `…/file/16981275?source=view_game&as_props=1&after_download_lightbox=true`). Ajouté au dépôt : `tiles/bed.png`, `tiles/infloor.png`, `tiles/leaf.png`, `actors/chicken*.png`, `actors/cat.png`, `actors/woman*.png`, `actors/oldman*.png`.
- **Objets à lire** (`src/world/examine.ts`, répliques dans `src/world/village-lines.ts`) : panneau du 茶屋, menu (prix en 文, compteur 一串), lettre de la mère d'おみつ glissée sous l'amulette après le col, tableau d'avis du village (quatre versions : avant le moulin, après, après le pont, après l'épilogue), 絵馬 lues l'une après l'autre (おみつ, 太一, 権兵衛, おたね, une sans nom), étal d'おたね (一皿, 一本), et tout ce qui est dans les intérieurs. Lexique : `src/world/lexicon-village.ts`, fusionné dans `LEX`.
- **Quêtes de chasse** (`src/world/hunts.ts`) : données à voix haute, sans tableau. L'encart (« 頼み ») montre la phrase de la demande en japonais et le compte (« 鎮めた : n »), pas la traduction. Seule compte la bonne espèce dans la bonne zone, apaisée après la demande (`tally` dans `kotodama.field.v1`, la zone est rangée dans la bête). Le panneau de fin de combat dit quand une bête comptait (« 頼み · 鳥追い 2 »). Retour au villageois : compte rendu à voix haute (と思う, んです), récompense, 経験 +25, 縁 +1.
  - h1 薄取り, おみつ (dès que le moulin est accepté) : 4 つぶやき au 野原の入口 ; 米 ×2.
  - h2 鳥追い, 権兵衛 (après le moulin) : 3 うわさ鳥 au 野原の入口 ; 米 ×3.
  - h3 糸集め, おたね (après le moulin) : 5 糸 à rapporter ; 和紙 ×2.
  - h4 蛾見物, 太一 (après le col) : 1 まよい蛾 au 野原の中 ; 鉄片.
  - h5 狐払い, 萬作 (après le pont) : 2 わけ狐 au 池のほとり ; 鉄片, 木片 ×2.
  - Les contrats de l'histoire passent avant ; la première rencontre d'un PNJ aussi. Marqueur « ！ » au-dessus du villageois, et au-dessus de la porte quand il est à l'intérieur.
- **Village vivant** : deux commères au puits, おはる et 茂吉 (`critters`, `rumors` de la carte). En passant près d'elles, leur échange s'affiche en bulles au-dessus de leur tête, doublé (Kaori, Makoto), et entre dans la バックログ avec sa traduction ; on peut aussi leur parler (聞く). Trois rumeurs (les oiseaux de 権兵衛, les 言蟲 de l'étang, les dango d'おみつ), chacune avec sa version guérie après l'épilogue. Poules qui picorent et s'écartent, chat qui dort près du banc, fumées des cheminées, feuilles d'automne qui tombent des arbres du village, rides sur la rivière, lanternes et foyers qui respirent, PNJ qui regardent le sabreur quand il passe et jettent un coup d'œil ailleurs. Encart du 渡り (PV) aussi dans le village dès qu'on a combattu.
- **Placements corrigés** : le moulin est une cabane de bois (le bâtiment rouge est devenu le sanctuaire) et sa roue tourne dans un bief tiré de la rivière, contre le mur ; 太一 se tient devant ; l'épouvantail est planté dans la rizière sans trouer la terrasse ; banc rouge et ombrelle devant le 茶屋, lanternes de part et d'autre de la porte ; les objets du pack mal choisis (panneau pris pour une caisse, petit pain pris pour des bûches) remplacés par des bûches et des planches ; berge entre les deux ponts ; arbres déplacés pour le sanctuaire. Au col, le sentier n'est plus coupé en morceaux (les bords d'herbe de chaque tronçon effaçaient la terre du précédent), deux rochers sortis de sous les arbres.
- **Voix** : 37 répliques (quêtes de chasse, commande au 茶屋, rumeurs), environ 900 crédits. Nouvelles voix : Kaori (おはる), Makoto (茂吉). Crédits ElevenLabs : 12 449 utilisés sur 40 000 ce mois.
- `npm test` vérifie aussi : portes (atteignables, l'intérieur existe, on ressort devant la porte), figurants et rumeurs, quêtes de chasse (rien avant la demande, ni mauvaise espèce ni mauvaise zone, compte, récompense, fils donnés). `tools/render-map.mjs <carte> <sortie.png> [échelle] --marks` rend une carte entière en image (objets lisibles en vermillon, portes en bleu ; les objets peints y sont des cadres).
- Vérifié dans Chrome sans écran (mode test, réponses tapées) : les quatre intérieurs, entrée et sortie par la porte ; commande au 茶屋 (thé : PV 2 → 6 ; repos : セーブ ouverte) ; lettre, plans, autel, cahier, dessin, おみくじ, vœu, 絵馬, avis ; quête de 権兵衛 donnée, deux combats (le bon compte, l'autre zone non), compte rendu et riz ; rumeur en bulles et version guérie ; figurant à qui l'on parle ; défaite et réveil au 茶屋 ; cinématique d'arrivée (おみつ sort, puis rentre) ; épilogue complet ; vue d'ensemble du village. Aucune erreur JavaScript. `npm test` et `npm run build` passent. Pas vérifié à la voix réelle.
- Pas fait (session 12) : dango et fabrication avec les matériaux (おみつ, 萬作), niveaux conseillés des boss, équilibrage. Les intérieurs n'ont pas de musique à eux.

Pour suivre : `KDW.enter('chaya')` entre par une porte, `KDW.place()` le lieu, `KDW.hunts()` et `KDW.huntHud()` les quêtes de chasse, `KDW.crits()` bêtes et figurants, `KDW.rumor()` lance la rumeur du puits, `KDW.bubbles()` les bulles affichées, `KDW.fight(sp, lvl, rare, zone)` (la zone compte pour les quêtes). Sortir d'un intérieur en mode test : `KDW.go(porte + 0.5, hauteur + 0.1)`.


### Session 10 : les rencontres

Branche `session-10-rencontres`, PR #8 : https://github.com/arsenesistel-del/kotodama/pull/8. À fusionner dans `main` pour la mise en ligne. La PR #7 (chapitre 1) a été fusionnée au début de la session. REFONTE.md (session 9, conception sans code) est intégrée à `DESIGN.md` : section « Un monde à parcourir ».

- **Retiré** : 霧野峠 de la carte du monde, le repaire du combat v4 (écran titre, onglets 依頼, 図鑑, 設定, règles) et l'accès libre aux six distorsions. Les créatures v4 ne restent que comme boss des contrats. Une sauvegarde restée sur le col reprend au village. Les réglages du combat (lectures, effets sonores) sont dans 設定 (`fieldui.ts`, ils restent dans `kotodama.v1`).
- **薄野原** (`src/world/maps/susuki.ts`, 42 × 28) : la lande à l'est du village, par la route de l'est (sortie est de 霧野村, panneau 東 薄野原). Six nappes d'herbes hautes (« g » dans le terrain), trois zones de niveaux (`zones` de la carte) : l'entrée 1 à 3, le milieu 3 à 6, autour de l'étang 6 à 10. À la première arrivée, ワケ explique les 言蟲. Les cartes acceptent maintenant des sorties est et ouest.
- **Herbes hautes** peintes par le code dans la palette du pack (`paintGrass` dans `VillageScene.ts`) : tiges, plumets d'eulalie, rangées qui se recouvrent ; le pied des touffes passe devant le sabreur (herbe jusqu'aux genoux), la touffe s'agite à chaque pas, le vent les couche de temps en temps.
- **Rencontres** : une chance sur neuf par case d'herbe traversée (trois cases de répit en arrivant). Éclair, puis le combat. Le **鈴** pend au cou du 地蔵 de l'entrée (l'examiner) ; touche X, le bouton 鈴 de l'encart, ou メニュー → 持ち物. Tant qu'il tinte, aucune rencontre.
- **Les quatre 言蟲** (`src/world/field.ts`) : つぶやき (と思う), うわさ鳥 (そうだ), まよい蛾 (かもしれない), わけ狐 (んだ). Elles se montrent au fil de l'histoire : つぶやき d'emblée, うわさ鳥 après le moulin (c1), まよい蛾 après le col (c2), わけ狐 après le pont (c3) ; la plus récente sort un peu plus souvent. Variante rare 朱 (une sur seize) : recolorée en vermillon, un niveau et une phrase de plus, 崩, 奥義 et 怒, double expérience, un 鉄片.
- **Images** : quatre peintures à l'encre (760 crédits) dans `art/raw/k1_tsubuyaki.png`… `k4_wakegitsune.png`, détourées (`tools/process.py k_tsubu k_uwasa k_mayoi k_wake`, 360 px de haut) et pixelisées (`tools/pixelize.py`, 34 à 48 pixels, yeux vermillon cherchés dans la peinture entière, l'oiseau et le renard retournés vers le sabreur). Décor de combat 薄野原 peint par le code (`SETS.susuki` dans `pixel.js`).
- **Combats courts** (`huntBeast` dans `game.js`) : même moteur que la chasse. Chaque phrase juste vaut une (deux sur un 奥義) : 2 phrases jusqu'au niveau 3, 3 jusqu'au 7, 4 au-delà. Bandeau d'entrée plus court, bouton 逃げる (fuir, sans pénalité). Fin : panneau 鎮まった (expérience, butin, ce qui vient d'être acquis), puis retour dans les herbes à la même place.
- **Niveau des bêtes = difficulté de la phrase** (`levelSpec`) : 1 à 3, phrase entière affichée au présent (furigana sur demande, F) ; 4 à 6, mots + fin, présent et négatif ; 7 à 9, passé et **négatif passé** (nouvelle forme du moteur : じゃなかった, くなかった, 来なかった, avec ses fautes diagnostiquées), 11 s au lieu de 13 ; 10, 祓, fins du village mêlées, et phrase seulement entendue (聞, voix japonaise de Chrome, micro coupé pendant qu'elle parle, clic pour réécouter ; sans voix japonaise, on affiche les mots). Les structures et les mots sont choisis par le suivi FSRS, comme dans les chasses.
- **Le 渡り** : niveau par l'expérience (bêtes : 3 + 2 × niveau, plus les critiques et un combat sans coup reçu ; contrat 30, boss 60, rapport 20 ; refait en session 12). PV = 4 + niveau/2 ; +0,3 s de temps par niveau, 3 s au plus. Les PV restent d'un combat à l'autre et reviennent au village (plus tard : les dango). À bout de forces, ワケ ramène au 茶屋. Les chasses de contrat profitent aussi des PV et du temps. Encart en haut à droite dans les herbes : niveau, PV, expérience, 鈴, zone et niveaux.
- **Butin** : 和紙, 米, 墨, 糸, 木片, 鉄片 selon l'espèce ; plus de tirages au niveau 5 et 8, sur une variante rare, et quand une phrase à échéance ou difficile pour le joueur (structure à revoir, difficulté FSRS 7 ou plus, deux ratés) a été bien dite (règle 6).
- **メニュー** : **持ち物** (le 渡り, les matériaux, le 鈴 à faire tinter, les 欠片) et **図鑑** (les quatre 言蟲 numérotés, avec leur fin, leur histoire, rencontres, apaisements, niveau le plus haut, variantes rares, structures acquises ; les six distorsions du chapitre, avec leur phrase apaisée ; silhouettes et « ？？？ » pour le reste).
- Sauvegarde : `kotodama.field.v1` (niveau, expérience, PV, sac, clochette, bêtes rencontrées), comprise dans l'export de 設定 → 記録.
- `npm test` lance aussi `scripts/check-field.mjs` (tableau des niveaux, espèces débloquées, 900 phrases de bêtes acceptées, expérience, butin plus riche quand c'est dur, clochette) ; `check-engine` vérifie 25 600 phrases (avec le négatif passé) ; `check-maps` vérifie les herbes hautes (atteignables, toutes dans une zone de la tranche 1 à 10) et les sorties est et ouest.
- Vérifié dans Chrome sans écran (mode test, réponses tapées) : passage du village à 薄野原 et retour, intro de ワケ, 鈴 trouvé et sonné (aucune rencontre en traversant), rencontre forcée puis fuite, combats aux niveaux 2, 5, 8 (rare) et 10 (祓 et phrase entendue), une défaite et le retour au 茶屋, 持ち物, 図鑑, réglages du combat dans 設定, chasse du contrat du moulin avec le niveau du joueur et son expérience, carte du monde sans le col, ancienne sauvegarde sur le col. Aucune erreur JavaScript. `npm test` et `npm run build` passent. Pas vérifié à la voix réelle (ni la voix japonaise de Chrome pour les phrases entendues).
- Pas fait (sessions 11 et 12) : intérieurs, objets à examiner, quêtes de chasse, dango et fabrication, niveaux conseillés des boss, équilibrage. Les matériaux ne servent encore à rien.

Pour suivre : dans les herbes, `KDW.grass()` (case, zone, clochette), `KDW.field()` (le 渡り), `KDW.meet()` force la prochaine rencontre, `KDW.fight('mayoiga', 8, true)` lance un combat, `KDW.bell(true)`. En combat, `KD.eres()` dit si le panneau de fin est ouvert, `KD.cont()` le ferme. Ajouter `listen` à l'adresse (`#debug-listen`) pour voir les phrases entendues sans voix japonaise. Repartir de zéro : `localStorage.removeItem('kotodama.field.v1')`.

### Session 9 : la refonte (conception)

Session sans code : retour d'Arsène sur le chapitre 1 et nouvelle direction, « un monde à parcourir », à la Pokémon. Document `REFONTE.md` dans le projet, intégré à `DESIGN.md` en session 10.

### Session 8 : le chapitre 1, du début à la fin

Branche `session-8-chapitre-1`, PR #7 : https://github.com/arsenesistel-del/kotodama/pull/7, fusionnée dans `main` (session 10) et en ligne.

- **Nouvelle partie** : écran 言霊 « はじめる » (le clic autorise le son et le micro), cinématique d'ouverture sur deux peintures avec un narrateur doublé (voix Kuro), sous-titres français, carton 第一章「霧の村」. Puis le col en pixel (`src/world/maps/pass.ts`) : sentier en lacets dans la brume, la borne dont l'inscription s'arrête.
- **Prologue** : en approchant, une voix dans la pierre (ワケ, « ？？？ ») appelle le joueur. À la borne, tutoriel de la voix : lire l'inscription telle quelle, puis la finir avec と思う (「霧の向こうにも、道はあると思う。」). La pierre se fend de vermillon, ワケ sort, se présente, décide de suivre. Avant, une brume barre la descente (`barriers` dans la carte) ; après, la sortie sud mène droit à l'entrée nord du village.
- **Arrivée** : cinématique en pixel. Le sabreur descend jusqu'au salon de thé, おみつ et 萬作 échangent des faits nus (「熱い。」「熱いわ。」「……霧じゃ。」), ワケ comprend ce que le village a perdu, puis la caméra fait le tour : maison de 萬作, moulin, pont suspendu, colline du cimetière.
- **Deux contrats de révision** (« 小依頼 », tirés des rumeurs, ne bloquent pas l'histoire) :
  - 井戸の呟き (おみつ, après le contrat du col) : le puits marmonne 「おみつのお団子は、うまい……」. Témoins 太一 et おたね. Fin : と思う (萬作 n'a jamais osé dire que les dango sont bons). Chasse 呟き : と思う et そうです mêlés.
  - 案山子の迷い (おたね, après le pont) : l'épouvantail des rizières dit 「おたねさんの漬物は、ちょっとしょっぱい……」. Témoins 権兵衛 et おみつ. Fin : かもしれない. Chasse 迷い : と思う, そうです, かもしれない.
- **Le cœur de la brume** (霧の丘, après le pont) : 萬作 ne peut rien dire, 太一 l'a vu ouvrir et fermer la bouche devant la tombe chaque soir, おみつ rapporte que お露 lui demandait toujours どうしたの. Sur la colline, peinture plein écran, 霧の主 répète 「わしは、お前に……礼を言いたかった……」 et le joueur choisit parmi **quatre** fins (と思う, かもしれない, そうだ, んだ) : la bonne est んだ. Boss 霧の主 : les 16 structures, 260 PV. Souvenir au chevet de お露, il y a dix ans (萬作 répond 「霧じゃ。今日も、霧じゃ。」). ワケ fait remarquer que んじゃ est le んだ du joueur. Rapport : 「霧の中の声は、「お前に礼を言いたかったんだ」と言っていました。」
- **Épilogue** (enchaîné au rapport) : 萬作 sur la tombe dit enfin sa phrase, la brume se lève dans le pixel (brume et couleurs), cinématique de l'aube sur les rizières, dispute au salon de thé (ぬるいと思う / 熱いと思うわ / 甘すぎるかもしれん), 萬作 remercie, ワケ cherche « reconnaissant » et ne le trouve pas, cinématique du col avec le sceau 訳 qui se tamponne sur la borne, carton de fin de chapitre (了). La route de 灯籠宿 s'ouvre sur la carte (« 第二章 : à venir », on ne peut pas encore y aller). Ensuite le village reste plus clair, 萬作 a une réplique d'après (「霧がないと、話が続かんのう。」), les contrats de révision restent jouables.
- **Contrats en parallèle** : `quests.ts` gère le fil de l'histoire (c1, c2, c3, c4) et les contrats de révision (r1, r2, `side: true`) en même temps. L'encart montre le contrat de l'histoire en entier et les autres repliés sur leur étape.
- **回想** (メニュー → 回想) : revoir le prologue, les sept souvenirs et l'épilogue déjà vus. **はじめから** (メニュー) : nouvelle partie depuis le col, deux clics ; les mots, la progression et les réglages restent.
- **Vocabulaire des chasses accordé au monde** (`engine.js`) : plus d'アプリ, de パスポート ni de バス. 通行手形, 茶屋, 侍, 庄屋, 大工, 渡し舟, 寄り合い, 芝居, 親方… Les 19 200 phrases sont toujours vérifiées.
- **Parties en cours** : une sauvegarde d'avant (sans drapeaux) est considérée comme passée par le col, ワケ est là, rien ne se rejoue. Pour voir le prologue : はじめから, ou 回想.
- **Images** (10, 1 900 crédits) : `cine_yakumo`, `cine_pass`, `cine_hill`, `cine_dawn`, `mem_well`, `mem_field`, `mem_bedside` dans `src/assets/memory/` ; créatures 霧の主 (`kiri`), 呟き (`tsubu`), 迷い (`mayoi`) détourées et pixelisées. Originaux dans `art/raw/`. Décors de chasse peints par le code : la place au puits, les rizières, la colline aux tombes.
- **Voix** : 93 répliques doublées (environ 2 950 crédits), 3 reprises de fichiers existants. Échos des nouvelles créatures avec ffmpeg comme en session 6 (霧の主 plus grave). Crédits ElevenLabs : 10 790 utilisés sur 40 000 ce mois.
- Langue : 265 répliques japonaises, 75 réponses à dire, 46 réponses avec une structure suivie. Nouvelles fautes reconnues : な devant んだ, だ après un passé devant と思う, かもしれない, そうだ. Nouveau marqueur かしら.
- Vérifié dans Chrome sans écran (mode test, réponses tapées) : nouvelle partie de bout en bout (écran titre, cinématique, carton, col, voix dans la pierre, réponses, libération de ワケ, descente, arrivée et tour du village), le cœur de la brume jusqu'au carton de fin (choix des quatre fins, boss, souvenir, rapport, épilogue entier), un contrat de révision avec une déduction fausse, la reprise d'une partie de la session 7, 回想. Aucune erreur JavaScript. `npm test` et `npm run build` passent. Pas vérifié à la voix réelle.
- Pas fait : les portraits illustrés (toujours les visages du pack), l'écran du 言葉帳, le chapitre 2.

Pour suivre : `KDW.flags()` (prologue, wake, ch1), `KDW.card(true)` montre le carton de fin. Revoir l'épilogue sans tout rejouer : 回想.

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

Dépensé : 10 images (1 900 crédits), puis les voix du chapitre 1 (environ 1 800), puis en session 6 les voix des contrats (1 674) et 3 peintures de souvenir (570). En session 8 : 10 images (1 900) et 93 voix (environ 2 950). En session 10 : 4 peintures de 言蟲 (760). En session 11 : 37 voix (environ 900). En session 12 : 17 voix (426). Le compte affiche 40 000 crédits par mois, environ 12 875 utilisés au 18 novembre. Narrateur des cinématiques : Kuro (`UUpoAQhpz37lNIWNVLoF`).

Gabarit de prompt pour une créature ou un personnage :

> Japanese sumi-e ink painting, dark fantasy, mature and ominous, elegant. [SUJET]. Pale ink and bone-white dry brushwork with splatter, single accent color vermilion red. Centered full-body creature floating on a pure solid black background. No text, no letters, no frame, no signature, no watermark.

Gabarit pour un décor :

> Japanese sumi-e ink painting, dark fantasy, mature, melancholic. [LIEU]. Wide landscape, empty of characters, dark and misty, mostly black and deep grey ink washes with pale highlights, a tiny touch of vermilion red on [DÉTAIL]. The lower third is calm, dark and uncluttered. No text, no letters, no frame, no signature, no watermark.

Détourage : `tools/process.py` (alpha tiré de la luminosité + silhouette remplie, recadrage, WebP), lancé depuis la racine du dépôt. Originaux dans `art/raw/`, images traitées dans `src/assets/combat/`.

## 5. Contenu du dépôt

- `index.html`, `src/main.ts` : point d'entrée, création du jeu Phaser.
- `src/scenes/BootScene.ts` : chargement des images, des sons et des polices, puis village ou carte selon la sauvegarde. `src/scenes/CombatScene.ts` : pose le combat v4. `src/scenes/VillageScene.ts` : le village en pixel. `src/scenes/WorldMapScene.ts` : la carte du monde.
- `src/world/` : le monde. `craft.ts` (commandes chez おみつ et 萬作 : recettes, dango, 札, fiche), `lexicon-craft.ts`, `hunts.ts` (quêtes de chasse), `examine.ts` (textes qui changent avec l'histoire, 絵馬, おみくじ, rumeurs), `village-lines.ts` (leurs répliques), `lexicon-village.ts`, `paint.ts` (intérieurs et objets peints par le code), `field.ts` (rencontres : espèces, niveaux, 渡り, butin, sac, clochette, sans Phaser ni DOM), `fieldui.ts` (écrans 持ち物 et 図鑑, réglages du combat), `fsrs.ts` (courbe d'oubli), `progress.ts` (suivi caché, journal du jour, bilan, sauvegarde complète), `record.ts` (écran 記録), `quests.ts` (contrats : état, qui dit quoi, sites, marqueurs, encart), `quest-lines.ts` (leurs répliques, `HEALED`, `MEMORY_ART`), `story-lines.ts` (prologue, arrivée, épilogue, `CINE_ART`, `CINE_FX`), `vn.ts` et `vn.css` (dialogues façon VN, menus, バックログ, sauvegardes, réglages), `text.ts` (découpage des répliques en mots), `lexicon.ts` (sens en français, 役割語), `prefs.ts` (réglages, mémoire des mots), `kanji.ts` (kanji N5 à N2), `assets.ts` (URLs des ressources), `tileset.ts` (feuilles et transitions automatiques), `objects.ts` (catalogue des objets du décor), `build.ts` (calcul des tuiles et des collisions, sans Phaser), `draw.ts` (pose dans Phaser), `maps/` (une carte par lieu : `kirino.ts`, `pass.ts` pour le col du prologue, `susuki.ts` pour 薄野原, `interiors.ts` pour le 茶屋, la maison de 萬作, le moulin et le sanctuaire), `dialogue.ts` (répliques et traductions), `ui.ts` et `ui.css` (invites, titres, fiche d'un lieu), `places.ts` et `inkmap.ts` (carte du monde), `state.ts` (sauvegarde du monde), `actor.ts` (animations).
- `src/assets/world/` : tuiles, personnages, sons du pack Ninja Adventure.
- `src/combat/engine.js` : générateur de phrases, vérification (`matches`), diagnostic (`diagnose`), statuts, les six distorsions (`STAGES`).
- `src/combat/scene.js` : fond à l'encre (écran de résultat d'un contrat), état partagé, sons synthétisés. `src/combat/pixel.js` : la chasse en pixel (décors, créature, sabreur, ワケ, effets, sceaux).
- `src/mic.js` : le micro (Web Speech API), partagé par le combat et les dialogues. `src/world/answer.ts` : vérification des réponses dites. `src/world/voice.ts`, `voicefile.ts` : lecture des voix. `src/assets/voice/` : les voix et `index.json`.
- `src/combat/game.js` : déroulé d'une chasse de contrat ou d'une rencontre (`huntContract`, `huntBeast`), sauvegarde, résultat. Plus de repaire.
- `src/combat/shell.html`, `src/combat/style.css` : interface du combat. `src/combat/assets.ts` : URLs des images. `src/combat/mount.ts` : montage dans la page.
- `src/assets/combat/` : peintures à l'encre des créatures (WebP, montrées dans le 図鑑 ; `k_*` pour les 言蟲), `px/` : les créatures en pixel. `src/assets/memory/` : peintures des souvenirs. `art/raw/` : originaux.
- `scripts/check-engine.mjs` : vérification du moteur ; `scripts/check-maps.mjs` : vérification des cartes ; `scripts/check-dialogue.mjs` : vérification des répliques ; `scripts/check-progress.mjs` : vérification du suivi caché ; `scripts/check-field.mjs` (avec `field-entry.ts`) : vérification des rencontres et des commandes ; `scripts/check-balance.mjs` (avec `balance-entry.ts`) : équilibrage du chapitre par simulation. Les six tournent avec `npm test`.
- `scripts/voice-lines.mjs` : répliques à doubler et texte pour le moteur de voix. `tools/voicevox.mjs` : voix des figurants avec VOICEVOX, sur le PC d'Arsène.
- `tools/process.py` : détourage. `tools/pixelize.py` : version pixel des créatures. `tools/render-map.mjs` (avec `render-map.py`) : une carte entière en image. `tools/test_micro.html` : page de test du micro.
- `.github/workflows/deploy.yml` : tests, construction et mise en ligne.
- `DESIGN.md`, `PASSATION.md`, `CREDITS.md`.

Travailler en local : `npm install`, puis `npm run dev` (jeu sur http://localhost:5173), `npm test`, `npm run build`.

Mode test : ajouter `#debug` à l'adresse. Un champ texte remplace le micro et `window.KD` expose l'état (`KD.answer()` dit la bonne phrase, `KD.say(texte)` injecte une phrase, `KD.wrong()` dit la phrase déformée).

Dans le village, `window.KDW` : `KDW.go(x, y)` téléporte (en tuiles), `KDW.state()` donne position, direction, cible et dialogue, `KDW.talk()` parle, `KDW.talkTo('taichi')` parle à quelqu'un ou examine un objet (`site-mill`, `site-jizo`, `sign-bridge`) d'où qu'on soit, `KDW.quests()` et `KDW.hud()` donnent l'état des contrats. Sur la carte, `window.KDM.go('kirino')` voyage, `KDM.sel()` donne le lieu choisi. Pour repartir de zéro dans le monde : `localStorage.removeItem('kotodama.world.v1')`.

Dialogues, `window.KDV` : `KDV.state()` (réplique, défilement, オート, スキップ, panneau, bulle), `KDV.open('mansaku')` ouvre un dialogue, `KDV.text()` donne le HTML de la réplique. Réponses : `KDV.answer(k)` dit la bonne phrase (choix k), `KDV.wrong()` la première faute prévue, `KDV.say(texte)` n'importe quoi ; `KDV.state().answer` et `.voice`. En mode test, un champ sous la phrase remplace le micro (Entrée envoie). Attention, en Chrome sans écran Phaser tourne au ralenti : le dialogue d'arrivée met une dizaine de secondes à s'ouvrir. Mots et réglages : `kotodama.words.v1`, `kotodama.settings.v1`, `kotodama.slots.v1`. Progression : `kotodama.progress.v1`.

Ajouter un intérieur : une entrée `room({...})` dans `maps/interiors.ts` (rangées de lettres F M E K W X, la porte en bas), l'inscrire dans `maps/index.ts`, une porte `doors` sur la carte du dehors et une arrivée devant cette porte (`spawns`, du nom donné à `gate`). Un objet peint : une entrée `def('p-…')` dans `paint.ts`, puis `painted(...)` dans `objects.ts`. Une quête de chasse : une entrée dans `HUNTS` (`hunts.ts`) et ses dialogues `hN:give` (la réplique `key` est montrée dans l'encart), `hN:wait`, `hN:done`.

Ajouter un lieu en pixel : une carte dans `src/world/maps/` (terrain en lettres, objets du catalogue, PNJ, arrivées, sorties), l'inscrire dans `maps/index.ts`, ouvrir le lieu dans `places.ts`, écrire ses répliques dans `dialogue.ts`. `npm test` dit si quelque chose est inaccessible. Une zone sauvage : des « g » dans le terrain et des `zones` (rectangle, niveaux) qui les couvrent toutes ; une sortie peut mener droit à un autre lieu (`place`), sur les quatre côtés.

Ajouter une espèce de 言蟲 : une entrée dans `SPECIES` (`field.ts` : fin, image, contrat qui l'ouvre, matériaux, histoire), une peinture dans `art/raw/`, `tools/process.py` puis `tools/pixelize.py` (taille dans `SIZE`), puis `npm test`.

## 6. Suite prévue

Lore retenu : voir `DESIGN.md`. Le monde tenait par la parole, les phrases laissées inachevées sont devenues des distorsions, chaque village a perdu une façon de parler.

Plan validé par Arsène, dans cet ordre :
1. Fait en v4 : animations du combat, interface, variété.
2. Premier village : fait (sessions 2 à 8). Chapitre 1 complet en session 8 : prologue, arrivée, trois contrats, deux contrats de révision, cœur de la brume, boss, épilogue. Refonte « un monde à parcourir » (`DESIGN.md`) : session 10 faite (rencontres) ; session 11, le village (faite : intérieurs, objets à lire, placements, quêtes de chasse, village vivant) ; session 12, l'économie (faite : dango et fabrication à voix haute, niveaux conseillés des boss, équilibrage 1 à 10). Maintenant : Arsène rejoue le chapitre 1 à la voix, puis on recale l'équilibrage sur ses temps réels. Reste aussi : portraits illustrés, écran du 言葉帳. Suite : chapitre 2, 灯籠宿 (dire pourquoi : から, ので, ため…), tranche 8 à 20.
3. Forge : les fragments servent à forger des lames (une lame = une famille de structures : avis, cause, condition...) et des sceaux à équiper qui changent les règles (moins de temps pour plus de dégâts, sans furigana pour un bonus).
4. Traques : une faute répétée fait naître sa propre créature, à rechasser.
5. Nombres et compteurs avec le modèle kana en local.
6. Niveau libre avec un juge LLM (coût d'API à valider avec lui).
7. Fait en session 1 : hébergement GitHub Pages, qui garde la permission micro d'une fois sur l'autre.
8. Lien avec le reste : Anki comme centre, mémo des points faibles pour Riho, import des leçons.

Piste pour le combat en pixel : retélécharger le pack Ninja Adventure (depuis le PC d'Arsène si la session ne peut pas) pour prendre ses effets (Fx : coupures, fumée, éléments) et le katana, et dessiner deux ou trois images d'attaque par créature.

## 7. Comment lui répondre

Français, court, la réponse d'abord (il est surtout sur mobile et dicte à la voix). Pas de tirets longs, pas de tournures d'IA, pas de justifications à rallonge. Une question au maximum : il délègue les décisions. Son e-mail est privé, ne jamais l'envoyer à un service externe.
