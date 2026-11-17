# 言霊 Kotodama : fichier de passation

À donner tel quel à un nouveau chat. Dernière mise à jour : 17 novembre 2026, session 1 (fondations). Le document de conception est `DESIGN.md`, à la racine du dépôt.

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

Dépensé : 10 images, 1 900 crédits sur 30 000.

Gabarit de prompt pour une créature ou un personnage :

> Japanese sumi-e ink painting, dark fantasy, mature and ominous, elegant. [SUJET]. Pale ink and bone-white dry brushwork with splatter, single accent color vermilion red. Centered full-body creature floating on a pure solid black background. No text, no letters, no frame, no signature, no watermark.

Gabarit pour un décor :

> Japanese sumi-e ink painting, dark fantasy, mature, melancholic. [LIEU]. Wide landscape, empty of characters, dark and misty, mostly black and deep grey ink washes with pale highlights, a tiny touch of vermilion red on [DÉTAIL]. The lower third is calm, dark and uncluttered. No text, no letters, no frame, no signature, no watermark.

Détourage : `tools/process.py` (alpha tiré de la luminosité + silhouette remplie, recadrage, WebP), lancé depuis la racine du dépôt. Originaux dans `art/raw/`, images traitées dans `src/assets/combat/`.

## 5. Contenu du dépôt

- `index.html`, `src/main.ts` : point d'entrée, création du jeu Phaser.
- `src/scenes/BootScene.ts` : chargement des images. `src/scenes/CombatScene.ts` : pose le combat v4.
- `src/combat/engine.js` : générateur de phrases, vérification (`matches`), diagnostic (`diagnose`), statuts, les six distorsions (`STAGES`).
- `src/combat/scene.js` : rendu canvas (décor, créature, sabreur, effets) et sons synthétisés.
- `src/combat/game.js` : micro (`Mic`), déroulé d'une chasse, sauvegarde, repaire, résultat.
- `src/combat/shell.html`, `src/combat/style.css` : interface du combat. `src/combat/assets.ts` : URLs des images. `src/combat/mount.ts` : montage dans la page.
- `src/assets/combat/` : images du combat (WebP). `art/raw/` : originaux.
- `scripts/check-engine.mjs` : vérification du moteur (`npm test`).
- `tools/process.py` : détourage. `tools/test_micro.html` : page de test du micro.
- `.github/workflows/deploy.yml` : tests, construction et mise en ligne.
- `DESIGN.md`, `PASSATION.md`, `CREDITS.md`.

Travailler en local : `npm install`, puis `npm run dev` (jeu sur http://localhost:5173), `npm test`, `npm run build`.

Mode test : ajouter `#debug` à l'adresse. Un champ texte remplace le micro et `window.KD` expose l'état (`KD.answer()` dit la bonne phrase, `KD.say(texte)` injecte une phrase, `KD.wrong()` dit la phrase déformée).

## 6. Suite prévue

Lore retenu : voir `DESIGN.md`. Le monde tenait par la parole, les phrases laissées inachevées sont devenues des distorsions, chaque village a perdu une façon de parler.

Plan validé par Arsène, dans cet ordre :
1. Fait en v4 : animations du combat, interface, variété.
2. Premier village avec trois PNJ qui parlent (voix japonaise ElevenLabs), contrats donnés par les PNJ, carte du monde à l'encre avec des lieux reliés. Détail du chapitre 1 dans `DESIGN.md`.
3. Forge : les fragments servent à forger des lames (une lame = une famille de structures : avis, cause, condition...) et des sceaux à équiper qui changent les règles (moins de temps pour plus de dégâts, sans furigana pour un bonus).
4. Traques : une faute répétée fait naître sa propre créature, à rechasser.
5. Nombres et compteurs avec le modèle kana en local.
6. Niveau libre avec un juge LLM (coût d'API à valider avec lui).
7. Fait en session 1 : hébergement GitHub Pages, qui garde la permission micro d'une fois sur l'autre.
8. Lien avec le reste : Anki comme centre, mémo des points faibles pour Riho, import des leçons.

Piste pour mieux animer : générer d'autres poses du sabreur (garde, blessé, à genoux) et une pose d'attaque par créature, 190 crédits l'image.

## 7. Comment lui répondre

Français, court, la réponse d'abord (il est surtout sur mobile et dicte à la voix). Pas de tirets longs, pas de tournures d'IA, pas de justifications à rallonge. Une question au maximum : il délègue les décisions. Son e-mail est privé, ne jamais l'envoyer à un service externe.
