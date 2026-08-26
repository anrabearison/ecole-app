# Guide Pédagogique et Manuel de Test Utilisateur (Cahier de Recette Détaillé)

> **À qui s'adresse ce document ?**  
> Ce manuel est spécialement rédigé pour les **utilisateurs non-techniciens** (Directeurs d'école, Secrétaires d'administration, Enseignants, Parents ou Responsables pédagogiques).  
> Il explique de manière **très claire, simple et illustrée par des exemples réels**, comment tester pas à pas l'intégralité de l'application de la création d'une école jusqu'à la génération du bulletin scolaire PDF.

---

## 💡 Guide Pratique : Comment naviguer dans l'application ?

Avant de commencer les tests, voici quelques repères simples sur l'écran :

1. **La barre de navigation à gauche (Menu principal)** :
   - Sur votre ordinateur, elle reste toujours visible sur le côté gauche.
   - Sur smartphone ou tablette, appuyez sur l'icône **`☰`** en haut à gauche pour faire apparaître le menu.
2. **Les Boutons d'action** :
   - Les boutons **Bleus** (ex: `+ Créer`, `+ Nouveau`, `Enregistrer`) servent à valider ou créer un élément.
   - Les boutons **Blancs avec bordure** (ex: `Modifier`, `Voir`, `Retour`, `Réinitialiser`) permettent de consulter, corriger ou réinitialiser.
   - Les boutons **Rouges** (ex: `Supprimer`, `Désactiver`, `Déconnexion`) sont réservés aux actions destructives ou à la sortie.
3. **Les champs obligatoires** :
   - Tous les champs suivis d'une étoile rouge `*` doivent obligatoirement être remplis.
4. **Adresse du site officiel** : 
   - Ouvrez votre navigateur internet (Chrome, Safari, Firefox ou Edge) et rendez-vous à l'adresse : `https://andakilasy.vercel.app` (ou l'adresse web transmise par votre administrateur).

---

## 📋 Sommaire Interactif des Tests

1. [Test 1 : Création de l'Établissement et du Compte Directeur](#test-1--création-de-létablissement-et-du-compte-directeur)
2. [Test 2 : Configuration des Niveaux Scolaires et des Séries](#test-2--configuration-des-niveaux-scolaires-et-des-séries)
3. [Test 3 : Configuration des Salles, Trimestres et Matières](#test-3--configuration-des-salles-trimestres-et-matières)
4. [Test 4 : Configuration des Coefficients par Niveau et par Série](#test-4--configuration-des-coefficients-par-niveau-et-par-série)
5. [Test 5 : Création des Classes Physiques d'Élèves](#test-5--création-des-classes-physiques-délèves)
6. [Test 6 : Création d'un Enseignant et Affectation de ses Cours](#test-6--création-dun-enseignant-et-affectation-de-ses-cours)
7. [Test 7 : Inscription d'un Élève et Nomination du Professeur Principal](#test-7--inscription-dun-élève-et-nomination-du-professeur-principal)
8. [Test 8 : Création de l'Emploi du Temps et Test Anti-Conflits](#test-8--création-de-lemploi-du-temps-et-test-anti-conflits)
9. [Test 9 : Connexion de l'Enseignant et Saisie des Notes](#test-9--connexion-de-lenseignant-et-saisie-des-notes)
10. [Test 10 : Calcul de la Moyenne, Appréciation et Délibération](#test-10--calcul-de-la-moyenne-appréciation-et-délibération)
11. [Test 11 : Génération et Téléchargement du Bulletin Scolaire PDF](#test-11--génération-et-téléchargement-du-bulletin-scolaire-pdf)
12. [Test 12 : Gestion du Profil et Changement Sécurisé du Mot de Passe](#test-12--gestion-du-profil-et-changement-sécurisé-du-mot-de-passe)

---

## Test 1 : Création de l'Établissement et du Compte Directeur

### 🎯 Pourquoi ce test ?
Avant qu'une école puisse utiliser l'application, l'administrateur général de la plateforme doit l'enregistrer dans le système et créer le premier compte pour le Directeur de cette école.

* **Qui réalise ce test ?** Le Super-Administrateur de la plateforme.
* **Page de départ** : `https://andakilasy.vercel.app/login`

### 📥 Données à saisir pour l'essai :

| Champ du formulaire | Valeur à tapez / copier-coller | Explication simple |
|---|---|---|
| **Identifiant Super-Admin** | `superadmin@ecole.com` | Votre compte d'accès général |
| **Mot de passe Super-Admin** | *(Mot de passe fourni)* | Votre mot de passe secret |
| **Nom de l'école** | `Lycée & Collège Saint-Joseph` | Le nom officiel de l'établissement |
| **Adresse** | `12 Avenue de l'Indépendance, Antananarivo` | L'adresse postale |
| **Email du Directeur** | `directeur.stjoseph@gmail.com` | L'adresse email qui servira à connecter le Directeur |
| **Mot de passe du Directeur** | `MotDePasse123!` | Le mot de passe initial du Directeur |

### 📌 Pas-à-Pas Détaillé :
1. Ouvrez votre navigateur web et rendez-vous sur `https://andakilasy.vercel.app/login`.
2. Connectez-vous avec l'identifiant et le mot de passe Super-Admin.
3. Dans le menu de gauche, cliquez sur le lien **Écoles**.
4. En haut à droite de l'écran, cliquez sur le bouton bleu **+ Nouvelle école**.
5. Remplissez scrupuleusement tous les champs du formulaire à l'aide du tableau ci-dessus.
6. Cliquez sur le bouton bleu **Créer l'école** tout en bas.

### 🔍 Ce que le système fait pour vous :
Le système crée simultanément l'espace de votre école et génère le compte du Directeur rattaché à cet établissement uniquement.

### 🎯 Ce que vous devez observer (Résultat attendu) :
- [ ] Une bannière verte apparaît en haut de l'écran avec le message d'enregistrement réussi.
- [ ] L'école *Lycée & Collège Saint-Joseph* figure maintenant dans le tableau récapitulatif des écoles.

---

## Test 2 : Configuration des Niveaux Scolaires et des Séries

### 🎯 Pourquoi ce test ?
Une école est structurée par niveaux (ex: 6ème, 3ème, Seconde, Première). Au lycée, à partir de la classe de Première, s'ajoutent des séries (ex: Série A pour le Littéraire, Série C pour le Scientifique). Ce test permet d'établir cette arborescence.

* **Qui réalise ce test ?** Le Directeur / Administrateur de l'école (`directeur.stjoseph@gmail.com`).

### 📌 Pas-à-Pas Détaillé :

#### Étape A : Se connecter en tant que Directeur
1. Si vous êtes connecté en Super-Admin, cliquez sur **Déconnexion** en bas du menu de gauche.
2. Sur la page de connexion `https://andakilasy.vercel.app/login`, tapez :
   - Identifiant : `directeur.stjoseph@gmail.com`
   - Mot de passe : `MotDePasse123!`
3. Cliquez sur **Se connecter**. Vous arrivez sur le **Tableau de bord Admin**.

#### Étape B : Créer les niveaux scolaires
4. Dans le menu de gauche, cliquez sur **Académique**, puis sur **Niveaux**.
5. Cliquez sur le bouton bleu **+ Créer un niveau** en haut à droite.
6. Ajoutez successivement les 4 niveaux suivants :
   - **Niveau 1** : Nom = `6ème` | Cycle = `Primaire/Collège` | Ordre = `1` $\rightarrow$ Cliquez sur **Enregistrer**.
   - **Niveau 2** : Nom = `3ème` | Cycle = `Collège` | Ordre = `4` $\rightarrow$ Cliquez sur **Enregistrer**.
   - **Niveau 3** : Nom = `Seconde` | Cycle = `Lycée` | Ordre = `5` $\rightarrow$ Cliquez sur **Enregistrer**.
   - **Niveau 4** : Nom = `Première` | Cycle = `Lycée` | Ordre = `6` $\rightarrow$ Cliquez sur **Enregistrer**.

#### Étape C : Créer les séries du Lycée
7. Dans le menu de gauche, cliquez sur **Académique > Séries**.
8. Cliquez sur le bouton bleu **+ Créer une série**.
9. Ajoutez les séries pour le niveau *Première* :
   - Niveau = `Première` | Nom de la série = `A` (Littéraire) $\rightarrow$ Cliquez sur **Enregistrer**.
   - Niveau = `Première` | Nom de la série = `C` (Scientifique) $\rightarrow$ Cliquez sur **Enregistrer**.

### 🎯 Ce que vous devez observer :
- [ ] Sur la page **Niveaux**, les classes sont classées clairement par bloc (*Collège*, *Lycée*).
- [ ] Sur la page **Séries**, la catégorie *Première (Lycée)* contient les séries *Série A* et *Série C*.

---

## Test 3 : Configuration des Salles, Trimestres et Matières

### 🎯 Pourquoi ce test ?
Pour planifier l'année scolaire et calculer les bulletins, l'école doit enregistrer :
- Les salles de classe où se déroulent les cours.
- Les découpages en trimestres avec leur poids dans la moyenne.
- La liste générale des matières enseignées dans l'établissement.

* **Qui réalise ce test ?** Le Directeur (`directeur.stjoseph@gmail.com`).

### 📌 Pas-à-Pas Détaillé :

#### 1. Configuration des Salles :
1. Menu de gauche : cliquez sur **Académique > Salles**.
2. Cliquez sur **+ Nouvelle salle** et créez :
   - Nom : `Salle 101` $\rightarrow$ Cliquez sur **Enregistrer**.
   - Nom : `Labo Sciences` $\rightarrow$ Cliquez sur **Enregistrer**.

#### 2. Configuration des Trimestres (Périodes) :
1. Menu de gauche : cliquez sur **Académique > Périodes**.
2. Cliquez sur **+ Nouvelle période** et enregistrez :
   - Nom : `Trimestre 1`
   - Année scolaire : `2025-2026`
   - Ordre chronologique : `1`
   - Poids des examens : `60%` (0.6)
   - Poids du contrôle continu / devoirs : `40%` (0.4)
   - Cliquez sur **Enregistrer**.

#### 3. Configuration de la liste générale des Matières :
1. Menu de gauche : cliquez sur **Académique > Matières**.
2. Cliquez sur **+ Nouvelle matière** et créez :
   - Matière 1 : Nom = `Mathématiques` | Coefficient par défaut = `4.0` $\rightarrow$ Enregistrer.
   - Matière 2 : Nom = `Français` | Coefficient par défaut = `3.0` $\rightarrow$ Enregistrer.
   - Matière 3 : Nom = `Physique-Chimie` | Coefficient par défaut = `3.0` $\rightarrow$ Enregistrer.

### 🎯 Ce que vous devez observer :
- [ ] Les 2 salles apparaissent dans le tableau des salles.
- [ ] Le *Trimestre 1* affiche bien le poids Examen à 60% et Journalier à 40%.
- [ ] Les 3 matières s'affichent avec leurs coefficients généraux par défaut.

---

## Test 4 : Configuration des Coefficients par Niveau et par Série

### 🎯 Pourquoi ce test ?
Dans le système scolaire, une même matière n'a pas le même coefficient selon le niveau d'études ou la série d'un élève.  
*Exemple :* Les Mathématiques ont un coefficient de **4.0 en 6ème**, de **3.0 en Première A (Littéraire)** et de **5.0 en Première C (Scientifique)**.  
Ce test permet d'adapter la grille des coefficients précisément par niveau et par série.

* **Qui réalise ce test ?** Le Directeur (`directeur.stjoseph@gmail.com`).

### 📌 Pas-à-Pas Détaillé :

#### Étape A : Configurer le coefficient pour le Collège (6ème)
1. Dans le menu de gauche, cliquez sur **Académique > Coefficients**.
2. Dans la barre d'onglets des niveaux en haut, cliquez sur **6ème**.
3. Observez le tableau des matières. Pour la ligne **Mathématiques** :
   - Le coefficient par défaut indique `4.0`.
   - Modifiez la valeur dans la case si nécessaire et cliquez sur le bouton bleu **Enregistrer**.

#### Étape B : Configurer les coefficients par Série pour la classe de Première (Série A vs Série C)
4. Dans la barre d'onglets des niveaux en haut, cliquez sur **Première**.
5. Observez l'encadré des séries qui apparaît sous les onglets :
   - Cliquez sur l'onglet **Série A** (Littéraire) :
     - Pour la matière **Mathématiques**, tapez la valeur : `3.0` $\rightarrow$ Cliquez sur **Enregistrer**.
     - Pour la matière **Français**, tapez la valeur : `5.0` $\rightarrow$ Cliquez sur **Enregistrer**.
   - Cliquez ensuite sur l'onglet **Série C** (Scientifique) :
     - Pour la matière **Mathématiques**, tapez la valeur : `5.0` $\rightarrow$ Cliquez sur **Enregistrer**.
     - Pour la matière **Physique-Chimie**, tapez la valeur : `4.0` $\rightarrow$ Cliquez sur **Enregistrer**.

#### Étape C : Tester la réinitialisation
6. Sur la ligne d'une matière personnalisée, cliquez sur le bouton blanc **Réinitialiser**.

### 🎯 Ce que vous devez observer :
- [ ] Pour la classe de **Première - Série A**, les Mathématiques affichent un badge bleu `Personnalisé` avec la valeur **3.0**.
- [ ] Pour la classe de **Première - Série C**, les Mathématiques affichent un badge bleu `Personnalisé` avec la valeur **5.0**.
- [ ] Le bouton **Réinitialiser** permet de supprimer la règle spécifique et de réappliquer le coefficient par défaut de la matière.

---

## Test 5 : Création des Classes Physiques d'Élèves

### 🎯 Pourquoi ce test ?
Une classe réunit un groupe d'élèves pour une année scolaire donnée (ex: *6ème A*, *Première C 1*). C'est le cadre de référence pour l'emploi du temps, la saisie des notes et les bulletins.

* **Qui réalise ce test ?** Le Directeur (`directeur.stjoseph@gmail.com`).

### 📌 Pas-à-Pas Détaillé :

#### Création de la classe de 6ème A (sans série) :
1. Dans le menu de gauche, cliquez sur **Académique > Classes**.
2. Cliquez sur le bouton bleu **+ Nouvelle classe** en haut à droite.
3. Remplissez le formulaire :
   - Niveau : Sélectionnez `6ème`
   - Série : *(Laissez vide - aucune série au collège)*
   - Section / Lettre : Tapez `A`
   - Année scolaire : Tapez `2025-2026`
   - Seuil de passage : `10.0` (Note minimale /20 pour réussir l'année)
4. Cliquez sur **Enregistrer la classe**.

#### Création de la classe de Première C 1 (avec série) :
5. Cliquez à nouveau sur **+ Nouvelle classe**.
6. Remplissez le formulaire :
   - Niveau : Sélectionnez `Première`
   - Série : Sélectionnez `C`
   - Section / Chiffre : Tapez `1`
   - Année scolaire : Tapez `2025-2026`
   - Seuil de passage : `10.0`
7. Cliquez sur **Enregistrer la classe**.

### 🎯 Ce que vous devez observer :
- [ ] La classe **6ème A (2025-2026)** apparaît dans la liste sous le bloc *Collège*.
- [ ] La classe **Première C 1 (2025-2026)** apparaît sous le bloc *Lycée*.

---

## Test 6 : Création d'un Enseignant et Affectation de ses Cours

### 🎯 Pourquoi ce test ?
Un enseignant doit être créé dans le système avec son **numéro CIN** (Carte Nationale d'Identité). Ce numéro CIN lui permettra de se connecter. Ensuite, l'administration doit lui attribuer les matières qu'il a le droit d'enseigner dans chaque classe.

* **Qui réalise ce test ?** Le Directeur (`directeur.stjoseph@gmail.com`).

### 📌 Pas-à-Pas Détaillé :

#### Étape A : Créer la fiche de l'enseignant
1. Dans le menu de gauche, cliquez sur **Utilisateurs**, puis sur **Enseignants**.
2. Cliquez sur le bouton bleu **+ Nouvel enseignant**.
3. Remplissez le formulaire :
   - Prénom : `Jean`
   - Nom : `RAKOTO`
   - Numéro CIN : `101202303404` *(⚠️ Notez bien ce numéro : c'est son identifiant de connexion !)*
   - Sexe : Cochez `Masculin`
   - Téléphone : `034 12 345 67`
   - Type de contrat : Sélectionnez `Fonctionnaire`
   - Email (optionnel) : `jean.rakoto@gmail.com`
4. Cliquez sur **Enregistrer l'enseignant**.

#### Étape B : Affecter ses cours (Matière + Classe)
5. Vous êtes automatiquement dirigé sur la fiche individuelle de *M. Jean RAKOTO*.
6. Cliquez sur le 2ème onglet intitulé **Matières & classes**.
7. Dans le cadre "Ajouter une matière et classe" :
   - Matière : Choisissez `Mathématiques`
   - Classe : Choisissez `6ème A (2025-2026)`
8. Cliquez sur le bouton bleu **Ajouter**.

### 🎯 Ce que vous devez observer :
- [ ] La fiche de *M. Jean RAKOTO* est créée et son statut indique un badge vert **Actif**.
- [ ] L'attribution *Mathématiques — 6ème A (2025-2026)* s'affiche dans le tableau des assignations.

---

## Test 7 : Inscription d'un Élève et Nomination du Professeur Principal

### 🎯 Pourquoi ce test ?
Inscrire les élèves avec leur **numéro matricule** (qui sert d'identifiant pour l'élève et ses parents) et leur désigner un professeur principal référent.

* **Qui réalise ce test ?** Le Directeur (`directeur.stjoseph@gmail.com`).

### 📌 Pas-à-Pas Détaillé :

#### Étape A : Désigner le Professeur Principal de la classe
1. Menu de gauche : **Académique > Classes**.
2. Cliquez sur la classe **6ème A**.
3. Cliquez sur le bouton **Modifier** en haut à droite.
4. Dans le champ déroulant **Professeur principal**, sélectionnez `Jean RAKOTO`.
5. Cliquez sur **Enregistrer les modifications**.

#### Étape B : Inscrire l'élève
6. Menu de gauche : **Utilisateurs > Élèves**.
7. Cliquez sur le bouton bleu **+ Nouvel élève**.
8. Remplissez la fiche de l'élève :
   - Prénom : `Miora`
   - Nom : `RANDRIA`
   - Numéro Matricule : `MAT-2025-001` *(⚠️ Identifiant unique de l'élève)*
   - Sexe : Cochez `Féminin`
   - Statut scolaire : Sélectionnez `Passant`
   - Classe actuelle : Sélectionnez `6ème A`
   - Nom du tuteur / parent : `Hery RANDRIA`
   - Téléphone du tuteur : `032 99 888 77`
9. Cliquez sur **Enregistrer l'élève**.

### 🎯 Ce que vous devez observer :
- [ ] L'élève *Miora RANDRIA* s'affiche dans la liste des élèves avec le matricule *MAT-2025-001*.
- [ ] Dans la vue détaillée de l'élève (onglet *Informations* / *Scolarité*), le professeur principal désigné est bien *Jean RAKOTO*.

---

## Test 8 : Création de l'Emploi du Temps et Test Anti-Conflits

### 🎯 Pourquoi ce test ?
Vérifier la création des séances de cours et tester la sécurité automatique de l'application qui empêche d'affecter un même enseignant ou une même salle à deux cours au même moment.

* **Qui réalise ce test ?** Le Directeur (`directeur.stjoseph@gmail.com`).

### 📌 Pas-à-Pas Détaillé :

#### Étape A : Ajouter un cours valide
1. Dans le menu de gauche, cliquez sur **Emploi du temps**.
2. Cliquez sur le bouton **+ Nouveau créneau**.
3. Remplissez le créneau :
   - Jour : `Lundi`
   - Heure de début : `08:00` | Heure de fin : `10:00`
   - Classe : `6ème A`
   - Matière : `Mathématiques`
   - Enseignant : `Jean RAKOTO`
   - Salle : `Salle 101`
4. Cliquez sur **Enregistrer le créneau**.

#### Étape B : Tester la sécurité anti-conflit (Double réservation)
5. Cliquez à nouveau sur **+ Nouveau créneau**.
6. Tentez d'ajouter un second cours sur le même créneau horaire :
   - Jour : `Lundi`
   - Heure de début : `09:00` | Heure de fin : `11:00` *(Chevauchement de 9h à 10h !)*
   - Classe : `Première C 1`
   - Enseignant : `Jean RAKOTO` *(Déjà en cours avec la 6ème A !)*
   - Salle : `Salle 101` *(Déjà occupée !)*
7. Cliquez sur **Enregistrer**.

### 🎯 Ce que vous devez observer :
- [ ] Le premier cours de Mathématiques apparaît clairement sur la grille du Lundi de 08:00 à 10:00.
- [ ] Lors de l'étape B, une **alerte d'avertissement** s'affiche à l'écran vous avertissant des conflits d'enseignant et de salle.

---

## Test 9 : Connexion de l'Enseignant et Saisie des Notes

### 🎯 Pourquoi ce test ?
L'enseignant se connecte avec son numéro CIN. Il accède uniquement à ses classes assignées et enregistre les notes des élèves pour le devoirs (note journalière) et l'examen.

* **Qui réalise ce test ?** L'Enseignant (*M. Jean RAKOTO*).

### 📌 Pas-à-Pas Détaillé :

#### Étape A : Connexion avec le N° CIN
1. Déconnectez-vous du compte Directeur.
2. Sur la page `https://andakilasy.vercel.app/login`, entrez :
   - Identifiant : `101202303404` *(Numéro CIN de M. RAKOTO)*
   - Mot de passe : `MotDePasse123!`
3. Cliquez sur **Se connecter**. Vous arrivez sur l'espace Enseignant (*Mes matières et classes*).

#### Étape B : Saisir la note de devoir (Note Journalière)
4. Dans le menu de gauche, cliquez sur **Notes > Saisir des notes**.
5. Remplissez le bloc de sélection en haut :
   - Classe : `6ème A`
   - Matière : `Mathématiques`
   - Période : `Trimestre 1`
   - Type d'évaluation : Cliquez sur le bouton segmenté **Journalière**
   - Date : Date du jour
6. Dans le tableau des élèves qui s'affiche en-dessous :
   - En face de l'élève *Miora RANDRIA*, tapez la note : `14` (sur 20).
7. Cliquez sur le bouton bleu **Enregistrer les notes**.

#### Étape C : Saisir la note d'Examen
8. Sur la même page, modifiez le type d'évaluation : cliquez sur le bouton segmenté **Examen**.
9. Dans le tableau des élèves :
   - En face de l'élève *Miora RANDRIA*, tapez la note : `16` (sur 20).
10. Cliquez sur le bouton bleu **Enregistrer les notes**.

### 🎯 Ce que vous devez observer :
- [ ] Une bannière verte confirme que les notes ont été enregistrées.
- [ ] En allant dans le menu **Notes > Consulter**, les deux notes apparaissent : `14/20` (Badge bleu *Journalière*) et `16/20` (Badge violet *Examen*).

---

## Test 10 : Calcul de la Moyenne, Appréciation et Délibération

### 🎯 Pourquoi ce test ?
Vérifier le calcul automatique de la moyenne par l'application selon la pondération configurée (poids examen vs devoirs et coefficient de la matière/niveau), puis enregistrer l'appréciation du bulletin et la décision de passage.

* **Qui réalise ce test ?** Le Directeur ou l'Enseignant.

### 📐 Règle de calcul appliquée par l'application :
- Note Journalière : 14/20 (Compte pour 40% $\rightarrow 14 \times 0.4 = 5.60$)
- Note Examen : 16/20 (Compte pour 60% $\rightarrow 16 \times 0.6 = 9.60$)
- **Moyenne calculée en Mathématiques** : $5.60 + 9.60 =$ **`15.20 / 20`**
- **Coefficient Mathématiques en 6ème** : `4.0`

### 📌 Pas-à-Pas Détaillé :

#### Étape A : Vérifier le calcul et ajouter l'appréciation
1. Connectez-vous en tant que Directeur ou Enseignant.
2. Allez dans **Utilisateurs > Élèves** et cliquez sur l'élève **Miora RANDRIA**.
3. Cliquez sur le 3ème onglet **Notes**.
4. Sélectionnez la période `Trimestre 1` et cliquez sur **Afficher**.
5. Observez la moyenne affichée sous la matière Mathématiques ainsi que le coefficient de niveau `4.0`.
6. Dans le champ texte **Appréciation globale du bulletin**, saisissez :
   `"Très bon trimestre. Élève appliquée et constante dans ses efforts. Félicitations !"`
7. Cliquez sur **Enregistrer l'appréciation**.

#### Étape B : Délibération de fin d'année
8. Allez dans **Académique > Classes** et cliquez sur la classe **6ème A**.
9. Dans la section "Délibération de fin d'année", observez le statut de l'élève.

### 🎯 Ce que vous devez observer :
- [ ] La moyenne de Mathématiques est exactement **15.20 / 20**.
- [ ] Le coefficient appliqué est bien **4.0** pour la classe de 6ème.
- [ ] La moyenne générale de l'élève indique **15.20 / 20**.
- [ ] L'appréciation globale est enregistrée avec succès.
- [ ] L'élève avec une moyenne de 15.20 (supérieure au seuil de 10.0) est automatiquement qualifiée de **Passant (PROMOTED)**.

---

## Test 11 : Génération et Téléchargement du Bulletin Scolaire PDF

### 🎯 Pourquoi ce test ?
Produire le document officiel du bulletin de notes au format PDF imprimable et vérifier que l'élève peut également télécharger son propre bulletin depuis son espace.

* **Qui réalise ce test ?** Le Directeur puis l'Élève (*Miora RANDRIA*).

### 📌 Pas-à-Pas Détaillé :

#### Étape A : Génération du bulletin PDF par la Direction
1. Sur la fiche de l'élève (*Miora RANDRIA*), allez sur l'onglet **Notes** (Période : *Trimestre 1*).
2. Cliquez sur le bouton bleu **Générer le bulletin (PDF)**.
3. Le fichier PDF est immédiatement téléchargé sur votre ordinateur et s'ouvre dans votre lecteur PDF.

#### Étape B : Téléchargement par l'Élève lui-même
4. Déconnectez-vous du compte Directeur.
5. Sur la page `https://andakilasy.vercel.app/login`, connectez-vous avec les identifiants de l'élève :
   - Identifiant : `MAT-2025-001` *(Numéro matricule de Miora RANDRIA)*
   - Mot de passe : `MotDePasse123!`
6. Vous arrivez dans l'espace Élève (**Mes notes**).
7. Cliquez sur le bouton **Télécharger mon bulletin PDF**.

### 🎯 Ce que vous devez observer sur le document PDF téléchargé :
- [ ] **En-tête officiel** : Nom de l'école (*Lycée & Collège Saint-Joseph*), Année scolaire (*2025-2026*), Période (*Trimestre 1*).
- [ ] **Identité de l'élève** : Nom (*RANDRIA Miora*), Classe (*6ème A*), Professeur principal (*Jean RAKOTO*).
- [ ] **Tableau des notes** : Matière (*Mathématiques*), Coefficient (*4.0*), Moyenne de l'élève (*15.20 / 20*).
- [ ] **Moyenne générale & Rang** : Moyenne générale (*15.20 / 20*) et Classement (*1er / 1 élève*).
- [ ] **Appréciation** : Présence du texte *"Très bon trimestre. Élève appliquée..."* et ligne réservée à la signature du Directeur.

---

## Test 12 : Gestion du Profil et Changement Sécurisé du Mot de Passe

### 🎯 Pourquoi ce test ?
Chaque utilisateur (Directeur, Enseignant, Élève) doit pouvoir mettre à jour ses coordonnées personnelles et remplacer son mot de passe initial par un mot de passe personnel sécurisé.

* **Qui réalise ce test ?** Tout utilisateur connecté (Directeur, Enseignant ou Élève).

### 📌 Pas-à-Pas Détaillé :

#### Étape A : Accéder à son profil
1. Tout en bas de la barre de navigation de gauche, sous le pavé *"Connecté en tant que..."*, cliquez sur le bouton **Mon profil** (avec l'icône d'utilisateur).
2. La page de gestion de votre profil s'ouvre avec 2 onglets :
   - **Informations personnelles**
   - **Sécurité & Mot de passe**

#### Étape B : Modifier ses informations personnelles
3. Dans l'onglet **Informations personnelles**, modifiez votre adresse email ou numéro de téléphone.
4. Cliquez sur le bouton bleu **Enregistrer les modifications**.

#### Étape C : Changer son mot de passe
5. Cliquez sur le 2ème onglet **Sécurité & Mot de passe**.
6. Remplissez les 3 champs requis :
   - **Mot de passe actuel** : Tapez le mot de passe actuel (ex: `MotDePasse123!`).
   - **Nouveau mot de passe** : Tapez le nouveau mot de passe (ex: `MonSuperCode2026!`).
   - **Confirmer le nouveau mot de passe** : Re-tapez à l'identique `MonSuperCode2026!`.
7. Cliquez sur le bouton bleu **Modifier mon mot de passe**.
8. Déconnectez-vous, puis tentez de vous reconnecter sur `https://andakilasy.vercel.app/login` avec le **nouveau mot de passe**.

### 🎯 Ce que vous devez observer :
- [ ] Une bannière verte confirme que le mot de passe a été modifié avec succès.
- [ ] La connexion avec l'ancien mot de passe est refusée avec un message d'erreur.
- [ ] La connexion avec le nouveau mot de passe `MonSuperCode2026!` réussit immédiatement.

---

## 🏁 Conclusion de la Recette Utilisateur

Si l'ensemble des 12 tests a été réalisé et que tous les résultats attendus sont observés à l'écran, **le système informatique de gestion scolaire est totalement validé, fonctionnel et prêt pour l'exploitation en conditions réelles.**
