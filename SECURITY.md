# Sécurité

## Signaler une faille

En privé, par [GitHub Security Advisories](https://github.com/hajdinidjellon/GymTrack/security/advisories/new),
jamais dans une issue publique. Réponse sous 7 jours.

## Ce qui protège les données

- Les données d'un compte ne sont lisibles que par lui : policies RLS Supabase (`gym-tracker-mobile/supabase/schema.sql`).
- La session d'authentification est chiffrée sur le téléphone (AES, clé dans le Keychain).
- Tout ce qui est relu du disque ou du cloud est validé (schémas zod).
- La CI cherche des secrets dans l'historique (gitleaks), analyse le code et les workflows (CodeQL),
  bloque les dépendances vulnérables (`npm audit`, Dependency Review) et Dependabot les tient à jour.
