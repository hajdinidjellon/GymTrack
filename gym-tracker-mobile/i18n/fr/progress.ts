/** The "Progrès" tab and the stats components (charts, tiles, insights). */
export const progress = {
  history: 'Tout l’historique',
  title: 'Progrès',
  subtitle: 'Ce que tu as gagné depuis le début, en disques.',
  empty: {
    cta: 'Voir la séance du jour',
    title: 'Ta barre est encore vide',
    text: "Fais ta première séance : tes courbes, ton volume et tes records s'afficheront ici.",
  },
  tiles: {
    sessions: { one: 'séance', other: 'séances' },
    gainedValue: '+{kg} kg',
    gained: 'gagnés au total',
    records: { one: 'record', other: 'records' },
  },
  volume: {
    title: 'Volume par semaine',
    thisWeek: 'kg cette semaine',
  },
  hero: {
    title: 'Ta plus belle progression',
    since: '{name} · depuis le {date}',
    gained: 'Tu as gagné {plates} de chaque côté.',
    start: 'Au début',
    now: 'Maintenant',
  },
  records: {
    title: 'Tes records',
    meta: '{date} · {reps} reps',
  },
  lifts: {
    title: 'Tous tes exercices',
    stable: 'stable',
    a11y: '{name}, {kg} kilos',
    a11yGain: '{name}, {kg} kilos, plus {diff} depuis le début',
  },
  stats: {
    insights: {
      title: "Ce que l'app sait de toi",
      left: {
        one: "Encore {count} séance et je te dirai ce que j'ai appris : ton moment, tes jours, tes repos, ton point fort.",
        other:
          "Encore {count} séances et je te dirai ce que j'ai appris : ton moment, tes jours, tes repos, ton point fort.",
      },
      soon: 'Continue comme ça : je te dirai bientôt ce que j’ai appris de tes séances.',
    },
    chart: {
      a11y: 'Volume par semaine. {weeks}',
      week: 'semaine du {day}/{month} : {kg} kg',
      tons: '{tons} t',
      weeksAgo: { one: 'il y a {count} sem.', other: 'il y a {count} sem.' },
      thisWeek: 'cette semaine',
    },
    week: {
      trained: 'Entraîné {days}',
      none: 'Pas encore de séance cette semaine',
      monday: 'lundi',
      tuesday: 'mardi',
      wednesday: 'mercredi',
      thursday: 'jeudi',
      friday: 'vendredi',
      saturday: 'samedi',
      sunday: 'dimanche',
    },
  },
};
