# 📱 Checklist d'audit — Publication App Store & Play Store

> **Usage avec Claude Code** : "Vérifie mon application contre chaque point de AUDIT_APP_STORES.md. Pour chaque item, réponds ✅ CONFORME / ❌ NON CONFORME / ⚠️ À VÉRIFIER MANUELLEMENT, avec le fichier/la preuve concernée."

---

## 1. LÉGAL & CONFORMITÉ (éviter les poursuites)

### 1.1 RGPD (obligatoire — tu es en France/UE)
- [ ] **Politique de confidentialité** accessible : URL publique + lien dans l'app + lien dans les fiches stores
- [ ] La politique liste : données collectées, finalités, durée de conservation, base légale, sous-traitants (Supabase, Lemon Squeezy, analytics...), droits des utilisateurs (accès, suppression, portabilité)
- [ ] **Consentement explicite** avant tout tracking/analytics non essentiel (bannière opt-in, pas opt-out)
- [ ] **Suppression de compte** possible depuis l'app (exigence Apple ET Google depuis 2022 si création de compte possible)
- [ ] Suppression du compte = suppression réelle des données côté backend (Supabase : cascade delete, pas juste soft delete indéfini)
- [ ] Les données sont hébergées en UE ou avec clauses contractuelles types (vérifier la région Supabase)
- [ ] Pas de collecte de données non déclarées (vérifier chaque SDK tiers : que collecte-t-il réellement ?)
- [ ] Registre des traitements tenu (document interne, obligatoire même pour un solo dev)

### 1.2 CGU / CGV
- [ ] **CGU** (Terms of Service) publiées : limitation de responsabilité, propriété du contenu, comportements interdits, droit applicable (droit français)
- [ ] Si vente (NoorNest, achats in-app) : **CGV** avec droit de rétractation — pour le contenu numérique, exiger la case "je renonce à mon droit de rétractation" avant livraison immédiate (Code de la conso art. L221-28)
- [ ] Mentions légales : identité de l'éditeur, contact, hébergeur (obligatoire en France, loi LCEN)
- [ ] **Statut juridique** : si tu encaisses de l'argent → micro-entreprise minimum déclarée, SIRET, déclaration URSSAF. Vendre sans statut = travail dissimulé

### 1.3 DSA (Digital Services Act — UE, obligatoire depuis 2024)
- [ ] Si tu vends via les stores : statut **"Trader"** déclaré chez Apple et Google avec adresse, email et téléphone publics affichés sur la fiche store (sinon l'app est retirée de l'UE)

### 1.4 Propriété intellectuelle
- [ ] **Aucun asset volé** : icônes, images, sons, polices → vérifier chaque licence (les polices Google Fonts OK, mais Playfair Display etc. → vérifier la licence OFL pour usage app)
- [ ] Pas de contenu ressemblant à une marque déposée (nom, logo, mascotte) — recherche INPI + EUIPO + USPTO sur le nom de l'app avant publication
- [ ] Pas de personnages/univers sous copyright (Disney, jeux existants...) même "inspirés"
- [ ] **Licences open source** : générer la liste des dépendances (npm/pub) et inclure un écran "Licences" dans l'app ; vérifier qu'aucune dépendance GPL ne contamine ton code propriétaire
- [ ] Musiques/sons : licence commerciale prouvable (pas "trouvé sur YouTube")
- [ ] Nom de l'app disponible : vérifier stores + noms de domaine + réseaux sociaux + INPI

### 1.5 Contenus spécifiques
- [ ] Si contenu santé/fitness (GymTrack) : **disclaimer** "ne remplace pas un avis médical", pas de promesses de résultats
- [ ] Si contenu religieux (NoorNest) : sources vérifiées, pas de contenu pouvant être signalé comme haineux/trompeur
- [ ] Si app utilisable par des mineurs : classification d'âge honnête, conformité COPPA/GDPR-K (pas de pub ciblée, pas de collecte de données)
- [ ] Pas de loterie/gambling déguisé (attention aux mécaniques de récompense aléatoire)

---

## 2. VALIDATION APPLE APP STORE

### 2.1 Causes de rejet les plus fréquentes
- [ ] **Guideline 4.2 (Minimum Functionality)** : l'app fait plus qu'un site web wrappé ; elle a une vraie valeur native
- [ ] **Guideline 2.1** : app complète, pas de placeholder, pas de "coming soon", pas de crash au review
- [ ] **Compte de test** fourni dans App Review Notes si login requis (identifiants qui fonctionnent !)
- [ ] **Guideline 3.1.1 (IAP)** : tout bien/service numérique consommé DANS l'app passe par In-App Purchase Apple (30%/15%). Interdit de rediriger vers Stripe/Lemon Squeezy pour du contenu débloqué in-app. (NoorNest web = OK ; NoorNest app = attention)
- [ ] Bouton **"Se connecter avec Apple"** obligatoire si tu proposes Google/Facebook login
- [ ] Demande de permissions avec **NSUsageDescription** claires et honnêtes (caméra, photos, notifications...) — texte générique = rejet
- [ ] Pas de mention d'Android, "beta", "test" dans l'app ou les metadata
- [ ] **App Tracking Transparency (ATT)** : popup obligatoire avant tout tracking cross-app (si SDK pub/analytics tiers)

### 2.2 Fiche & metadata
- [ ] Screenshots conformes aux tailles requises, montrant l'app réelle (pas de mockups mensongers)
- [ ] Description sans mots-clés spammés, sans mention de prix promotionnels
- [ ] **Privacy Nutrition Labels** remplis honnêtement (Apple croise avec le comportement réel de l'app)
- [ ] Classification d'âge correcte via le questionnaire
- [ ] URL support + URL politique de confidentialité fonctionnelles

### 2.3 Compte & signature
- [ ] Compte Apple Developer (99$/an) au bon nom (perso ou société — impacte le nom affiché "par XXX")
- [ ] Certificats et provisioning profiles valides, pas d'entitlements inutilisés

---

## 3. VALIDATION GOOGLE PLAY STORE

- [ ] **Data Safety Form** rempli et cohérent avec le comportement réel de l'app (Google scanne le binaire ; incohérence = suspension)
- [ ] **Target API level** : viser le niveau exigé de l'année en cours (Google l'augmente chaque année, app bloquée sinon)
- [ ] App Bundle (.aab) signé, Play App Signing activé
- [ ] **Compte perso ≠ compte orga** : depuis 2023, les comptes perso doivent faire tester l'app par 12 testeurs pendant 14 jours (closed testing) avant la prod
- [ ] Permissions sensibles justifiées via déclaration (SMS, localisation background... → à éviter si pas indispensable)
- [ ] Politique de confidentialité liée dans la Play Console ET dans l'app
- [ ] Pas de nom/icône/description trompeurs ou mots-clés spammés
- [ ] Classification du contenu (questionnaire IARC) remplie honnêtement
- [ ] Si IAP : facturation Google Play obligatoire pour les biens numériques (même règle qu'Apple)
- [ ] Compte développeur (25$ one-time), identité vérifiée, adresse trader UE affichée (DSA)

---

## 4. SÉCURITÉ (ne pas se faire hacker)

### 4.1 Secrets & code
- [ ] **AUCUNE clé secrète dans le code client** : chercher dans tout le repo `API_KEY`, `SECRET`, `password`, tokens en dur. Le bundle JS/APK est décompilable en 5 minutes
- [ ] Clés Supabase : seule la clé `anon` côté client, la `service_role` UNIQUEMENT côté serveur/edge functions
- [ ] `.env` dans `.gitignore` ; vérifier l'historique git (une clé déjà commitée = compromise → la révoquer)
- [ ] Obfuscation activée en release : ProGuard/R8 (Android), pas de sourcemaps publiques

### 4.2 Backend & API
- [ ] **Supabase RLS (Row Level Security) activé sur TOUTES les tables** — c'est LA faille n°1 des apps Supabase. Tester : peut-on lire/écrire les données d'un autre user avec sa propre clé anon ?
- [ ] Toute logique critique (prix, validation d'achat, droits premium) exécutée **côté serveur**, jamais côté client
- [ ] Validation des inputs côté serveur (pas seulement les formulaires côté client)
- [ ] Rate limiting sur les endpoints sensibles (login, reset password, création de compte)
- [ ] Vérification des achats/webhooks : signature Lemon Squeezy vérifiée, receipts IAP validés côté serveur

### 4.3 Réseau & données
- [ ] 100% HTTPS, pas d'exception cleartext dans le manifest Android / ATS iOS non désactivé
- [ ] Tokens stockés dans **SecureStore/Keychain** (expo-secure-store), jamais dans AsyncStorage
- [ ] Pas de données sensibles dans les logs (`console.log` de tokens/emails en prod)
- [ ] Sessions avec expiration + refresh tokens ; logout = invalidation serveur
- [ ] Deep links validés (pas d'injection via paramètres d'URL)

### 4.4 Dépendances & CI
- [ ] `npm audit` / `dart pub outdated` sans vulnérabilité critique
- [ ] Dependabot ou équivalent activé sur GitHub
- [ ] Secrets GitHub Actions dans les Secrets du repo, jamais dans le YAML
- [ ] Repo privé pour le code propriétaire

---

## 5. QUALITÉ TECHNIQUE (validation + rétention)

- [ ] Zéro crash sur les parcours principaux (tester sur vrai device Android bas de gamme + iPhone)
- [ ] Démarrage < 3s, pas d'écran blanc prolongé
- [ ] Gestion du mode hors-ligne ou au minimum un message d'erreur propre (pas de crash sans réseau)
- [ ] Tous les états gérés : loading, vide, erreur, succès
- [ ] Testé sur petits écrans + grands écrans + encoches/notch
- [ ] Crash reporting en place (Sentry gratuit) — indispensable pour corriger vite après lancement
- [ ] Accessibilité basique : contrastes suffisants, tailles de police dynamiques, labels sur les boutons

---

## 6. TÉLÉCHARGEMENTS (ASO — App Store Optimization)

- [ ] **Nom de l'app** : marque + 1-2 mots-clés descriptifs (ex : "GymTrack — Suivi musculation")
- [ ] Sous-titre (iOS) / description courte (Android) avec les mots-clés principaux
- [ ] Champ keywords iOS (100 caractères) rempli sans répéter le nom
- [ ] **Icône** : lisible en 48px, testée face aux concurrents dans les résultats de recherche
- [ ] 3 premiers screenshots = argumentaire de vente (texte + bénéfice), pas juste des captures brutes
- [ ] Vidéo preview si possible (fort impact conversion)
- [ ] Localisation FR + EN minimum (double la surface de recherche)
- [ ] Description : bénéfices d'abord, features ensuite, mots-clés naturellement intégrés
- [ ] Fiche mise à jour régulièrement (les stores favorisent les apps actives)
- [ ] Landing page web + liens depuis réseaux sociaux (le trafic externe améliore le ranking)

---

## 7. AVIS & NOTES

- [ ] **Utiliser les API natives** : `SKStoreReviewController` (iOS) / In-App Review API (Android) — jamais de popup custom "notez-nous 5 étoiles"
- [ ] Demander l'avis au **bon moment** : après une action réussie/valorisante (séance terminée, puzzle résolu), jamais au premier lancement
- [ ] Limiter la fréquence (Apple limite à 3 demandes/an de toute façon)
- [ ] ❌ **INTERDIT et sanctionné** : acheter des avis, échanger des avis, incentiver ("avis 5★ = feature gratuite"), filtrer ("content ? → store / pas content ? → email"). Apple et Google bannissent les comptes pour ça, et c'est une pratique commerciale trompeuse (amende DGCCRF en France)
- [ ] **Répondre à tous les avis négatifs** publiquement et calmement (visible par les futurs users, améliore la conversion)
- [ ] Canal de feedback in-app (email/formulaire) pour capter les frustrations AVANT qu'elles finissent en avis 1★

---

## 8. MONÉTISATION & FISCAL

- [ ] Biens numériques in-app → IAP obligatoire (Apple/Google). Biens physiques ou services consommés hors app → Stripe/Lemon Squeezy autorisé
- [ ] Prix affichés TTC, TVA gérée (les stores collectent la TVA sur les IAP ; Lemon Squeezy est merchant of record pour le web)
- [ ] Revenus déclarés (micro-BNC/BIC selon le cas) — les stores transmettent aux administrations fiscales (DAC7 en UE)
- [ ] Abonnements : conditions claires, annulation facile, période d'essai bien décrite (sinon rejet + remboursements forcés)
- [ ] Restore purchases fonctionnel (obligatoire iOS)

---

## 9. AVANT CHAQUE RELEASE (checklist rapide)

- [ ] Version/build number incrémentés
- [ ] Changelog rédigé (visible sur les stores)
- [ ] Testé en build de production (pas seulement Expo Go / debug)
- [ ] Aucun `console.log` sensible, aucun flag debug actif
- [ ] Politique de confidentialité à jour si nouvelles données/SDK collectés
- [ ] Data Safety Form / Privacy Labels mis à jour si changement
- [ ] Backup de la base avant migration
- [ ] Rollback possible (staged rollout Android : commencer à 10-20%)

---

*Dernière mise à jour : juillet 2026. Les règles des stores changent plusieurs fois par an — vérifier les guidelines officielles (developer.apple.com/app-store/review/guidelines, play.google/developer-content-policy) avant chaque soumission majeure.*
