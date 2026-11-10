/**
 * The privacy policy (Profil → Confidentialité). Keep it in step with legal/privacy.html,
 * the page given to the stores, and with the App Store and Google Play privacy forms.
 */
export const privacy = {
  title: 'Confidentialité',
  subtitle: 'Ce que l’app garde de toi, où, et comment tout effacer.',
  updated: 'Mise à jour : 10 novembre 2026',
  sections: {
    who: {
      title: 'Qui s’en occupe',
      body: 'Okilo est édité par Djellon Hajdini, en France, responsable de tes données. Pour toute question ou demande : hajdinidjellon@gmail.com.',
    },
    local: {
      title: 'Sans compte, rien ne part',
      body: 'Sans compte, tes séances, ton programme et tes réglages restent sur ton téléphone. Rien n’est envoyé à un serveur.',
    },
    collected: {
      title: 'Avec un compte',
      body: 'Pour retrouver tes données sur un autre téléphone, l’app les envoie dans ton compte :\n• ton pseudo et ton mot de passe (jamais stocké en clair) ;\n• ton email de récupération, si tu en donnes un ;\n• ton code de récupération, gardé sous une forme qui ne permet pas de le relire ;\n• ton profil : objectif, expérience, rythme, programme, durée de séance, salle, et si tu les donnes, ton sexe, ta tranche d’âge et ton poids ;\n• tes séances (exercices, charges, répétitions, ressenti, dates, durées) et tes réglages.\nLors d’une demande de récupération, de code ou de suppression, le serveur note aussi ton adresse IP et l’heure, pour bloquer les abus. Ces traces sont effacées au bout de 24 heures.',
    },
    why: {
      title: 'Pourquoi',
      body: 'Uniquement pour faire marcher l’app : calculer tes charges, garder ton historique, synchroniser tes téléphones et t’aider à récupérer ton compte. Pas de publicité, pas de statistiques d’usage, pas de traceurs, aucune revente. Base légale : l’exécution du service que tu demandes en créant un compte.',
    },
    health: {
      title: 'Poids et séances',
      body: 'Ton poids et tes séances peuvent en dire un peu sur ta santé. Tu les saisis toi-même, ils sont facultatifs (sauf les séances, qui sont le cœur de l’app) et ne servent qu’à calculer tes charges. En créant un compte, tu acceptes qu’ils y soient gardés. Tu retires cet accord à tout moment en supprimant ton compte.',
    },
    device: {
      title: 'Sur ton téléphone seulement',
      body: 'Micro : si tu actives les commandes vocales, ta voix est reconnue par ton téléphone lui-même. Rien n’est enregistré ni envoyé. Notifications : les rappels de repos sont programmés sur ton téléphone.',
    },
    processors: {
      title: 'Qui les héberge',
      body: '• Supabase (hébergement du compte et des données), serveurs dans l’Union européenne.\n• Resend (envoi des emails de récupération), aux États-Unis : il reçoit seulement ton email de récupération et le message. Ce transfert est encadré par le Data Privacy Framework et les clauses contractuelles types de la Commission européenne.\nPersonne d’autre ne reçoit tes données.',
    },
    keep: {
      title: 'Combien de temps',
      body: 'Tant que ton compte existe. Une séance que tu supprimes est effacée du compte. Quand tu supprimes ton compte, tout est effacé tout de suite du serveur.',
    },
    rights: {
      title: 'Tes droits',
      body: 'Tu peux accéder à tes données, les corriger, les exporter, t’opposer à leur traitement ou les effacer.\n• Exporter : Profil → Sauvegarde, import.\n• Tout effacer : Profil → Email et code de récupération → Supprimer mon compte.\n• Pour le reste, écris à hajdinidjellon@gmail.com : réponse sous un mois.\nTu peux aussi te plaindre auprès de la CNIL (cnil.fr).',
    },
    age: {
      title: 'Âge',
      body: 'Okilo s’adresse aux personnes de 15 ans et plus.',
    },
  },
  link: 'Confidentialité',
  linkValue: 'Tes données, tes droits',
  linkHint: 'Ce que l’app garde de toi, où, et comment tout effacer.',
};
