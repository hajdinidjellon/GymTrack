/**
 * CONTENU LÉGAL EMBARQUÉ — politique de confidentialité.
 *
 * Source de vérité : docs/legal/privacy-policy.html (version hébergée pour
 * les fiches stores). Toute modification doit être répercutée DANS LES DEUX
 * fichiers + la date de mise à jour.
 *
 * Embarqué dans l'app (et pas seulement un lien web) pour rester consultable
 * hors ligne — cohérent avec le principe offline-first de l'app.
 */

export type LegalSection = {
  title: string;
  body: string;
};

export type LegalDocument = {
  title: string;
  /** Date ISO de dernière mise à jour, affichée via t('legal.updated') */
  updated: string;
  sections: LegalSection[];
};

export const PRIVACY_POLICY: Record<'fr' | 'en', LegalDocument> = {
  fr: {
    title: 'Politique de confidentialité',
    updated: '5 juillet 2026',
    sections: [
      {
        title: '1. Qui sommes-nous',
        body:
          "GymTrack est une application mobile de suivi d'entraînement développée et éditée par un développeur indépendant.\n" +
          'Responsable du traitement : Djellon Hajdini — contact : hajdinidjellon@gmail.com',
      },
      {
        title: '2. Le principe : tes données restent chez toi',
        body:
          'GymTrack fonctionne entièrement hors ligne, sans compte. Par défaut, toutes tes données sont stockées uniquement sur ton appareil et ne quittent jamais ton téléphone.\n\n' +
          "La synchronisation cloud est optionnelle : elle n'existe que si tu crées un compte, dans le seul but de sauvegarder tes données et de les retrouver sur un autre appareil.",
      },
      {
        title: '3. Données traitées',
        body:
          '• Prénom / pseudo — appareil (+ cloud si compte) — personnalisation de l\'app.\n' +
          "• Séances d'entraînement (exercices, charges, répétitions, durée, ressenti) — appareil (+ cloud si compte) — historique, statistiques, progression.\n" +
          '• Records personnels, objectifs — appareil (+ cloud si compte) — suivi de progression.\n' +
          '• Données corporelles (poids, mensurations) — données de santé au sens de l\'art. 9 RGPD — appareil (+ cloud si compte) — uniquement si tu les saisis.\n' +
          '• Adresse email + mot de passe — cloud (Supabase Auth), uniquement si compte — authentification.\n' +
          '• Préférences (langue, unités, rappels) — appareil uniquement.\n\n' +
          "Nous ne collectons pas : localisation, contacts, photos, identifiants publicitaires, données d'autres apps. Pas de publicité, pas de revente de données, pas de profilage. Aucun outil d'analytics tiers n'est intégré à ce jour ; si un outil de rapport de plantage était ajouté, il serait configuré pour exclure toute donnée personnelle et cette politique serait mise à jour.",
      },
      {
        title: '4. Base légale',
        body:
          "Exécution du contrat (fournir le service de suivi que tu as installé) pour les données d'entraînement et de compte ; consentement explicite pour les données corporelles (tu choisis de les saisir, elles sont facultatives). Tu peux retirer ce consentement à tout moment en les supprimant.",
      },
      {
        title: '5. Hébergement et sous-traitants',
        body:
          'Si tu crées un compte, les données synchronisées sont hébergées par Supabase (base de données du projet hébergée dans l\'Union européenne). Les échanges sont chiffrés (HTTPS/TLS). Sur l\'appareil, les jetons de connexion sont chiffrés (Keychain iOS / Keystore Android). Aucun autre sous-traitant n\'a accès à tes données.',
      },
      {
        title: '6. Durée de conservation',
        body:
          "Tes données sont conservées tant que tu utilises l'app. Elles sont supprimées : localement si tu désinstalles l'app ; dans le cloud immédiatement et définitivement quand tu supprimes ton compte (voir §7). Aucune copie de sauvegarde au-delà des sauvegardes techniques standard de l'hébergeur (35 jours max).",
      },
      {
        title: '7. Tes droits',
        body:
          "Conformément au RGPD, tu disposes des droits d'accès, de rectification, d'effacement, de portabilité, de limitation et d'opposition. Les deux plus importants sont directement intégrés à l'app (Profil → Réglages) :\n\n" +
          '• « Exporter mes données » : fichier JSON complet et lisible de toutes tes données (portabilité) ;\n' +
          '• « Supprimer mon compte » : effacement immédiat et irréversible de toutes tes données, sur l\'appareil et dans le cloud.\n\n' +
          'Pour toute autre demande : hajdinidjellon@gmail.com (réponse sous 30 jours). Tu peux aussi saisir la CNIL (cnil.fr).',
      },
      {
        title: '8. Mineurs',
        body:
          "GymTrack n'est pas destinée aux enfants de moins de 15 ans. Aucune vérification d'âge n'étant fiable à 100 %, si tu es parent et penses que ton enfant a créé un compte, contacte-nous pour suppression.",
      },
      {
        title: '9. Modifications',
        body:
          "Toute modification substantielle de cette politique sera signalée dans l'app avant de prendre effet, avec la date de mise à jour ci-dessus.",
      },
    ],
  },
  en: {
    title: 'Privacy Policy',
    updated: 'July 5, 2026',
    sections: [
      {
        title: '1. Who we are',
        body:
          'GymTrack is a workout-tracking mobile app developed and published by an independent developer.\n' +
          'Data controller: Djellon Hajdini — contact: hajdinidjellon@gmail.com',
      },
      {
        title: '2. The principle: your data stays with you',
        body:
          'GymTrack works fully offline, without an account. By default, all your data is stored only on your device and never leaves your phone.\n\n' +
          'Cloud sync is optional: it only exists if you create an account, for the sole purpose of backing up your data and retrieving it on another device.',
      },
      {
        title: '3. Data we process',
        body:
          '• First name / nickname — device (+ cloud if account) — app personalisation.\n' +
          '• Workouts (exercises, weights, reps, duration, feeling) — device (+ cloud if account) — history, statistics, progression.\n' +
          '• Personal records, goals — device (+ cloud if account) — progress tracking.\n' +
          '• Body data (weight, measurements) — health data under GDPR art. 9 — device (+ cloud if account) — only if you enter it.\n' +
          '• Email address + password — cloud (Supabase Auth), only if you create an account — authentication.\n' +
          '• Preferences (language, units, reminders) — device only.\n\n' +
          'We do NOT collect: location, contacts, photos, advertising identifiers, or data from other apps. No ads, no data selling, no profiling. No third-party analytics tool is integrated to date; if a crash-reporting tool were added, it would be configured to exclude all personal data and this policy would be updated.',
      },
      {
        title: '4. Legal basis',
        body:
          'Performance of the contract (providing the tracking service you installed) for workout and account data; explicit consent for body data (you choose to enter it, it is optional). You can withdraw this consent at any time by deleting it.',
      },
      {
        title: '5. Hosting and processors',
        body:
          'If you create an account, synced data is hosted by Supabase (project database hosted in the European Union). Transfers are encrypted (HTTPS/TLS). On the device, session tokens are encrypted (iOS Keychain / Android Keystore). No other processor has access to your data.',
      },
      {
        title: '6. Retention',
        body:
          'Your data is kept as long as you use the app. It is deleted: locally when you uninstall the app; in the cloud immediately and permanently when you delete your account (see §7). No backup copies beyond the host\'s standard technical backups (35 days max).',
      },
      {
        title: '7. Your rights',
        body:
          'Under the GDPR, you have the rights of access, rectification, erasure, portability, restriction and objection. The two most important are built directly into the app (Profile → Settings):\n\n' +
          '• "Export my data": a complete, readable JSON file of all your data (portability);\n' +
          '• "Delete my account": immediate, irreversible erasure of all your data, on the device and in the cloud.\n\n' +
          'For any other request: hajdinidjellon@gmail.com (reply within 30 days). You may also contact your data protection authority (in France: cnil.fr).',
      },
      {
        title: '8. Minors',
        body:
          'GymTrack is not intended for children under 15. As no age check is 100% reliable, if you are a parent and believe your child created an account, contact us for deletion.',
      },
      {
        title: '9. Changes',
        body:
          'Any substantial change to this policy will be announced in the app before taking effect, with the update date above.',
      },
    ],
  },
};
