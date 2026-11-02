/** Your data: backup, restore, import from another app, spreadsheet export. */
export const data = {
  title: 'Tes données',
  subtitle: 'Tout reste sur ton téléphone. Ici, tu en gardes une copie ou tu ramènes tes séances d’une autre app.',
  failTitle: 'Ça n’a pas marché',
  failText: 'Le fichier n’a pas pu être ouvert. Réessaie.',

  backup: {
    title: 'Sauvegarde',
    text: 'Un fichier avec tout : séances, programme, réglages. Range-le dans Fichiers ou envoie-le toi par mail.',
    create: 'Créer une sauvegarde',
    restore: 'Restaurer une sauvegarde',
    shareTitle: 'GymTrack · sauvegarde',
    confirmTitle: 'Restaurer cette sauvegarde ?',
    confirmText: {
      one: '{count} séance dedans. Ton programme et tes réglages seront remplacés par ceux du fichier. Tes séances actuelles restent.',
      other:
        '{count} séances dedans. Ton programme et tes réglages seront remplacés par ceux du fichier. Tes séances actuelles restent.',
    },
    confirm: 'Restaurer',
    doneTitle: 'Sauvegarde restaurée',
    added: { one: '{count} séance ajoutée à ton historique.', other: '{count} séances ajoutées à ton historique.' },
    rejected: {
      one: '{count} séance illisible a été laissée de côté.',
      other: '{count} séances illisibles ont été laissées de côté.',
    },
    notBackup: 'Ce fichier n’est pas une sauvegarde GymTrack.',
    newerVersion: 'Cette sauvegarde vient d’une version plus récente de GymTrack. Mets l’app à jour, puis réessaie.',
  },

  import: {
    title: 'Venir de Strong ou Hevy',
    text: 'Dans Strong ou Hevy, exporte tes données en CSV (dans les réglages), puis choisis le fichier ici. La progression repart de tes dernières charges.',
    button: 'Importer un fichier CSV',
    doneTitle: 'Import terminé',
    added: { one: '{count} séance ajoutée depuis {source}.', other: '{count} séances ajoutées depuis {source}.' },
    nothingNew: 'Ces séances sont déjà dans ton historique.',
    recognized: {
      one: '{count} exercice reconnu : la progression le reprend.',
      other: '{count} exercices reconnus : la progression les reprend.',
    },
    unknown: {
      one: '{count} exercice gardé sous son nom, visible dans l’historique.',
      other: '{count} exercices gardés sous leur nom, visibles dans l’historique.',
    },
    skipped: {
      one: '{count} ligne sans reps ni durée ignorée (cardio…).',
      other: '{count} lignes sans reps ni durée ignorées (cardio…).',
    },
    strongKilos: 'Strong n’indique pas l’unité : les poids sont lus en kilos.',
    errorTitle: 'Import impossible',
    empty: 'Ce fichier est vide.',
    unknownFormat: 'Ce fichier ne ressemble pas à un export Strong ou Hevy.',
    noSets: 'Aucune série avec des reps dans ce fichier.',
  },

  csv: {
    title: 'Tableur',
    text: 'Toutes tes séries dans un fichier CSV, pour Excel ou Numbers.',
    button: 'Exporter en CSV',
    shareTitle: 'GymTrack · mes séances',
    emptyTitle: 'Rien à exporter',
    emptyText: 'Fais ta première séance : elle apparaîtra dans le fichier.',
  },
};
