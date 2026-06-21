# MEMORY.md - Architecture & UX/UI Decision Log

## Projet : Système de Réservation Directe - Hôtel La Maison Rouge Cotonou (v5.0 APEX)
Ce document récapitule les décisions stratégiques, l'architecture technique, les principes UX/UI et la structure du projet pour la démo interactive de réservation directe ajustée selon les designs sombres de *Vitrine d'Élite*.

---

## 🎨 IDENTITÉ VISUELLE & GRAPHISMES (Vitrine d'Élite Dark & Gold)
Ajustement du style visuel pour s'harmoniser avec la charte sombre et luxueuse en ligne :

*   **Couleurs Primaires & Accents** :
    *   `Noir Profond / Anthracite` (#070504, #0C0A09) : Base sombre et immersive, idéale pour faire ressortir l'éclairage chaud et les visuels.
    *   `Rouge Terre Cuite / Brique` (#9B2C2C, #C53030) : Rappel direct du nom de l'hôtel, utilisé pour le badge du logo, les boutons de conversion prioritaires et les KPI.
    *   `Doré d'Afrique de l'Ouest` (#CA8A04) : Couleur d'accentuation pour les indicateurs de réussite, les prix, les liens d'action secondaire et les points clés.
    *   `Texte Clair` (#F5F5F4) et `Texte Muted` (#A8A29E) : Contraste élevé sur fond sombre pour une lecture sans fatigue.
*   **Typographie** :
    *   Titres : *Cormorant Garamond* pour insuffler le raffinement artistique des galeries contemporaines exposées dans l'hôtel.
    *   Corps de texte : *Plus Jakarta Sans* pour une UI nette et lisible sur mobile.
*   **Effets Lumineux** :
    *   Gradients radiaux subtils en arrière-plan (glow rouge et or).
    *   Fines bordures semi-transparentes pour structurer les cartes et éléments interactifs sans alourdir le design.

---

## 🔒 GESTION DE LA SÉCURITÉ DE L'ADMINISTRATION (Rôles & Accès)
Pour répondre à l'exigence d'une sécurité robuste, l'accès direct a été verrouillé derrière un portail de connexion (`page-admin-login`) distinguant deux profils hôteliers :

1.  **Profil Réception & Front-Desk** :
    *   **Identifiant** : Sélection dans le menu déroulant
    *   **Mot de passe de session** : `reception2026`
    *   **Droits** : Gestion courante du planning, enregistrement des réservations, validation ou annulation des réservations en attente.
    *   **Restriction de confidentialité** : Le KPI financier global (Commissions Économisées) est masqué pour protéger les données stratégiques.
2.  **Profil Direction Générale & Financière** :
    *   **Identifiant** : Sélection dans le menu déroulant
    *   **Mot de passe de session** : `direction2026`
    *   **Droits** : Vue globale sans restriction, accès aux données de revenus préservés des commissions OTA (Booking.com), droit de réinitialisation complète de la base de démonstration.

---

## 📅 ALGORITHME DE DISPONIBILITÉ PHYSIQUE (Garantie Anti-Surbooking)
Plutôt qu'un simple affichage statique, la démo intègre un moteur de calcul de stock en temps réel basé sur un calendrier d'occupation dynamique.

*   **Capacités Matérielles Simulées** :
    *   Chambre Classique : **7 chambres physiques**
    *   Chambre Supérieure : **5 chambres physiques**
    *   Suite Prestige : **3 suites physiques**
*   **Algorithme de Calcul de Période** :
    *   Pour toute période sélectionnée `[Arrivée, Départ[`, l'algorithme parcourt chaque jour de séjour.
    *   Pour chaque jour, il compte les chambres occupées (statut `Confirmé` ou `En attente`) de la catégorie.
    *   Le stock libre pour le séjour correspond à : `Stock Total - Max(Chambres Occupées sur chaque jour)`.
*   **Comportement Client (Friction Évitée)** :
    *   Si le stock d'une catégorie atteint **0**, l'interface désactive le bouton avec la mention "Indisponible", affiche un indicateur de couleur rouge et la mention "Complet pour ces dates".
    *   Un double contrôle de sécurité est réalisé avant le récapitulatif final et l'approbation de l'admin pour bloquer tout surbooking.
*   **Comportement Admin** :
    *   Les jauges de stock montrent l'état des chambres libres/occupées pour la date du jour (19 Juin 2026).
    *   Le calendrier interactif de la semaine montre le nombre exact de chambres disponibles jour par jour pour chaque type.
