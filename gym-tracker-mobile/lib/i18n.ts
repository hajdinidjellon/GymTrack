import { fr as dateFnsFr, enUS as dateFnsEn } from 'date-fns/locale';
import { useSettingsStore } from '@/stores/settingsStore';

type Lang = 'fr' | 'en';

// ── Dictionnaires ────────────────────────────────────────────────
const T = {
  fr: {
    // Common
    'common.today': "Aujourd'hui",
    'common.save': 'Sauvegarder',
    'common.cancel': 'Annuler',
    'common.start': 'Démarrer',
    'common.finish': 'Terminer',
    'common.discard': 'Abandonner',
    'common.continue': 'Continuer',
    'common.seeMore': 'Voir plus',
    'common.seeLess': 'Voir moins',
    'common.goal': 'objectif',
    'common.week': 'sem.',
    'common.send': 'Envoyer',
    'common.delete': 'Supprimer',

    // Unités
    'unit.day': 'jour',
    'unit.days': 'jours',
    'unit.session': 'séance',
    'unit.sessions': 'séances',
    'unit.min': 'min',

    // Jours abrégés (lun → dim)
    'days.0': 'L',
    'days.1': 'M',
    'days.2': 'M',
    'days.3': 'J',
    'days.4': 'V',
    'days.5': 'S',
    'days.6': 'D',

    // Dashboard
    'dashboard.greeting': 'Salut, {name}',
    'dashboard.greetingAnon': 'Salut',
    'dashboard.myWeek': 'Ma semaine',
    'dashboard.weekGoal': '{done}/{target} · objectif',
    'dashboard.activeSession': 'Séance en cours',
    'dashboard.resume': 'Reprendre',
    'dashboard.heatmap': 'Activité musculaire',
    'dashboard.period.7': '7j',
    'dashboard.period.30': '30j',
    'dashboard.recovered': 'Récupérés',
    'dashboard.active': 'Actifs',
    'dashboard.fatigued': 'Fatigués',
    'dashboard.suggestion': 'Suggestion du jour',
    'dashboard.lastWorkouts': 'Dernières séances',
    'dashboard.streak': 'Streak',
    'dashboard.thisWeek': 'Cette sem.',
    'dashboard.total': 'Total',
    'dashboard.noWorkouts': 'Aucune séance',
    'dashboard.startFirst': "Lance ta première séance depuis l'onglet Séance.",
    'dashboard.weeklyGoalReached': 'Objectif atteint !',
    'dashboard.weeklyGoalSubtitle': '{n} séance{plural} cette semaine — bien joué 💪',
    'dashboard.prTitle': 'Nouveau record !',
    'dashboard.prSubtitle': '{exercise} — tu repousses tes limites 🔥',
    'dashboard.selectMuscle': 'Sélectionne un muscle pour voir le détail.',

    // Session
    'session.today': "Aujourd'hui",
    'session.newSession': 'Nouvelle séance',
    'session.subtitle': 'Lance-toi avec une suggestion ou crée la tienne.',
    'session.modeLabel': "Mode d'entraînement",
    'session.suggestionLabel': 'Suggestion',
    'session.freeSectionLabel': 'Ou séance libre',
    'session.freeStart': 'Démarrer sans programme',
    'session.addExercise': 'Ajouter un exercice',
    'session.finish': 'Terminer',
    'session.sets': 'Séries',
    'session.discardTitle': 'Abandonner la séance ?',
    'session.discardMessage': 'Toutes les données seront perdues.',
    'session.discardConfirm': 'Abandonner',
    'session.discardCancel': 'Continuer',
    'session.finishTitle': 'Terminer la séance',
    'session.sessionName': 'Nom de la séance',
    'session.howFeel': 'Comment tu te sens ?',
    'session.duration': 'Durée',
    'session.exercises': 'Exercices',
    'session.saveSession': 'Sauvegarder',
    'session.continueSession': 'Continuer la séance',
    'session.zeroState': "On va construire ton premier entraînement.\nChoisis un type ci-dessus et go.",

    // Types d'entraînement
    'session.type.strength.title': 'Force',
    'session.type.strength.subtitle': 'Entraînement lourd',
    'session.type.strength.hint': '3–5 REPS',
    'session.type.hypertrophy.title': 'Hypertrophie',
    'session.type.hypertrophy.subtitle': 'Volume & muscle',
    'session.type.hypertrophy.hint': '8–12 REPS',
    'session.type.cardio.title': 'Cardio',
    'session.type.cardio.subtitle': 'Endurance',
    'session.type.cardio.hint': 'HIIT',
    'session.type.mobility.title': 'Mobilité',
    'session.type.mobility.subtitle': 'Récupération active',
    'session.type.mobility.hint': 'MOBILITÉ',

    // Exercise picker
    'picker.addExercise': 'Ajouter un exercice',
    'picker.customTitle': 'Exercice personnalisé',
    'picker.section': 'Exercices',
    'picker.searchPlaceholder': 'Bench press, squat, curl...',
    'picker.noResults': "Aucun exercice trouvé.\nCrée-le ci-dessous.",
    'picker.customCta': 'Exercice personnalisé',
    'picker.customCtaSub': "Crée un exercice qui n'est pas dans la liste",
    'picker.customNameLabel': "Nom de l'exercice",
    'picker.customNamePlaceholder': 'Ex: Hip abduction machine',
    'picker.customMusclesLabel': 'Muscles travaillés (au moins 1)',
    'picker.createBtn': "Créer l'exercice",
    'picker.poly': 'Poly',
    'picker.iso': 'Iso',
    'picker.acc': 'Acc',

    // Progress
    'progress.supertitle': 'Analyse',
    'progress.title': 'Progression',
    'progress.subtitle': 'Mesure ton évolution sur chaque exercice et muscle.',
    'progress.tab.exercises': 'Exercices',
    'progress.tab.volume': 'Volume',
    'progress.tab.muscles': 'Muscles',
    'progress.noDataTitle': "Pas encore assez\nde données",
    'progress.noDataSubtitle': 'Fais au moins 2 séances avec le même exercice pour voir ta progression.',
    'progress.personalRecords': 'Records personnels',
    'progress.weekVolume': 'Volume par muscle — 7 jours',
    'progress.noSessionsWeek': 'Aucune séance cette semaine',
    'progress.seeMore': 'Voir {n} exercice{plural} de plus',
    'progress.seeLess': 'Voir moins',
    'progress.sessions': '{n} séances',
    'progress.pr': 'PR {value}{unit}',
    'progress.period.7': '7j',
    'progress.period.30': '30j',

    // Planner
    'planner.supertitle': 'Planification',
    'planner.title': 'Mon plan',
    'planner.subtitle': "Suggestions du jour, échauffement intelligent, programmes de force.",
    'planner.templates': 'Templates rapides',
    'planner.templatesSub': 'Push, Pull, Legs — démarre en un tap',
    'planner.suggestion': 'Suggestion du jour',
    'planner.suggestionSub': 'Basée sur tes muscles récupérés et ton historique',
    'planner.startSession': 'Démarrer cette séance',
    'planner.warmup': 'Échauffement intelligent',
    'planner.strengthProgram': 'Programme de force',
    'planner.strengthSub': 'Génère un plan progressif sur plusieurs semaines',
    'planner.activePlan': 'Programme actif',
    'planner.newPlan': 'Nouveau programme',
    'planner.generate': 'Générer le programme',
    'planner.targetWeight': 'Objectif (kg)',
    'planner.weeks': 'Durée (semaines)',
    'planner.profileRequired': 'Profil requis',
    'planner.profileRequiredMsg': 'Configure ton profil avant de créer un plan.',
    'planner.week': 'Semaine {n}',
    'planner.deload': 'DÉLOAD',
    'planner.moreExercises': '+ {n} exercices',

    // Profile
    'profile.supertitle': 'Mon profil',
    'profile.tab.stats': 'Profil',
    'profile.tab.badges': 'Badges',
    'profile.tab.settings': 'Réglages',
    'profile.personalRecords': 'Records personnels',
    'profile.noPRs': "Aucun PR enregistré.\nFais une séance pour en ajouter.",
    'profile.config': 'Configuration',
    'profile.level': 'Niveau',
    'profile.sessionsPerWeek': 'Séances / semaine',
    'profile.estimatedRM': '1RM estimé',
    'profile.logoutBtn': 'Se déconnecter',
    'profile.logoutTitle': 'Se déconnecter',
    'profile.logoutMsg': 'Tes données locales seront conservées.',
    'profile.logoutConfirm': 'Se déconnecter',
    'profile.logoutCancel': 'Annuler',

    // Settings
    'settings.units': 'Unités',
    'settings.restTimer': 'Timer de repos',
    'settings.defaultRest': 'Repos par défaut',
    'settings.notifications': 'Notifications',
    'settings.testNotif': 'Tester les notifs',
    'settings.language': 'Langue',

    // Niveaux
    'level.beginner': 'Débutant',
    'level.intermediate': 'Intermédiaire',
    'level.advanced': 'Avancé',
    'level.elite': 'Élite',
    'level.beginner.years': '< 1 an',
    'level.intermediate.years': '1–3 ans',
    'level.advanced.years': '3–5 ans',
    'level.elite.years': '5 ans+',

    // Rangs
    'rank.next': 'Prochain rang',
    'rank.max': 'Max',
    'rank.towards': 'Vers',
    'rank.xpTotal': 'XP total',
    'rank.ladder': 'Échelle des rangs',
    'rank.youAreHere': 'TU ES ICI',

    // Célébrations
    'celebration.newRecord': 'Nouveau record',
    'celebration.previous': 'Précédent',
    'celebration.tapToContinue': 'Appuie pour continuer',
    'celebration.rankUp': 'Montée de rang',
    'tier.bronze': 'BRONZE',
    'tier.silver': 'ARGENT',
    'tier.gold': 'OR',
    'tier.platinum': 'PLATINE',
    'tier.diamond': 'DIAMANT',
    'tier.legend': 'CHAMPION',

    // Muscles
    'muscle.chest': 'Pectoraux',
    'muscle.back': 'Dos',
    'muscle.shoulders': 'Épaules',
    'muscle.arms': 'Bras',
    'muscle.legs': 'Jambes',
    'muscle.core': 'Abdos',
    'muscle.glutes': 'Fessiers',
    'muscle.calves': 'Mollets',

    // WeeklyComparison
    'weekly.title': 'Progression de la semaine',
    'weekly.sessions': 'Séances',
    'weekly.goal': 'objectif',
    'weekly.reached': 'Atteint !',
    'weekly.remaining1': 'Encore 1',
    'weekly.remaining': 'Encore {n}',
    'weekly.upcoming': 'À venir',
    'weekly.inProgress': 'En cours',

    // ExerciseCard / SetRow
    'exercise.sets': 'SÉRIES',
    'exercise.addSet': '+ Série',
    'setRow.prev': 'Avant',
    'setRow.firstTime': 'Première fois',
    'setRow.weight': 'Poids ({units})',

    // BadgeGrid
    'badge.all': 'Tous',
    'badge.unlocked': 'Débloqué',
    'badge.progress': 'Progression',
    'badge.cat.consistency': 'Régularité',
    'badge.cat.strength': 'Force',
    'badge.cat.volume': 'Volume',
    'badge.cat.diversity': 'Diversité',
    'badge.cat.milestone': 'Jalons',
    'badge.cat.special': 'Spécial',
    'badge.first_workout.name': 'Premier Pas',
    'badge.first_workout.desc': 'Complète ta première séance',
    'badge.streak_3.name': 'En Feu',
    'badge.streak_3.desc': '3 jours de streak consécutifs',
    'badge.streak_7.name': 'Semaine Parfaite',
    'badge.streak_7.desc': '7 jours de streak',
    'badge.streak_30.name': 'Mois de Fer',
    'badge.streak_30.desc': '30 jours de streak',
    'badge.streak_100.name': 'Centenaire',
    'badge.streak_100.desc': '100 jours de streak',
    'badge.workouts_10.name': 'Habitude',
    'badge.workouts_10.desc': '10 séances complétées',
    'badge.workouts_50.name': 'Régulier',
    'badge.workouts_50.desc': '50 séances complétées',
    'badge.workouts_100.name': 'Centurion',
    'badge.workouts_100.desc': '100 séances complétées',
    'badge.pr_first.name': 'Premier Record',
    'badge.pr_first.desc': 'Enregistre ton premier PR',
    'badge.pr_5.name': 'Collectionneur de PRs',
    'badge.pr_5.desc': '5 records personnels',
    'badge.bench_100.name': 'Club des 100kg',
    'badge.bench_100.desc': 'Développé couché 100kg',
    'badge.squat_100.name': "Jambes d'Acier",
    'badge.squat_100.desc': 'Squat 100kg',
    'badge.deadlift_100.name': 'Force Brute',
    'badge.deadlift_100.desc': 'Soulevé de terre 100kg',
    'badge.volume_1ton.name': 'Une Tonne',
    'badge.volume_1ton.desc': '1000kg de volume en une séance',
    'badge.all_muscles.name': 'Corps Complet',
    'badge.all_muscles.desc': 'Travaille tous les groupes musculaires',
    'badge.gold_rank.name': 'Statut Or',
    'badge.gold_rank.desc': 'Atteindre le rang Or',

    // Erreurs
    'error.generic.title': 'Oups, quelque chose a cassé',
    'error.generic.message': 'Une erreur inattendue est survenue. Tes données sont en sécurité.',
    'error.generic.retry': 'Réessayer',
    'error.boot.title': 'Impossible de démarrer',
    'error.boot.message': "La base de données locale n'a pas pu s'initialiser. Réessaie ; si le problème persiste, réinstalle l'application.",
    'error.auth.invalidCredentials': 'Email ou mot de passe incorrect',
    'error.auth.emailNotConfirmed': 'Confirme ton email avant de te connecter (vérifie ta boîte mail)',
    'error.auth.userExists': 'Un compte existe déjà avec cet email',
    'error.auth.weakPassword': 'Mot de passe trop court (6 caractères minimum)',
    'error.auth.network': 'Connexion impossible — vérifie ton réseau',
    'error.auth.generic': 'Une erreur est survenue, réessaie',
  },

  en: {
    // Common
    'common.today': 'Today',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.start': 'Start',
    'common.finish': 'Finish',
    'common.discard': 'Discard',
    'common.continue': 'Continue',
    'common.seeMore': 'See more',
    'common.seeLess': 'See less',
    'common.goal': 'goal',
    'common.week': 'wk',
    'common.send': 'Send',
    'common.delete': 'Delete',

    // Units
    'unit.day': 'day',
    'unit.days': 'days',
    'unit.session': 'workout',
    'unit.sessions': 'workouts',
    'unit.min': 'min',

    // Day abbreviations (Mon → Sun)
    'days.0': 'M',
    'days.1': 'T',
    'days.2': 'W',
    'days.3': 'T',
    'days.4': 'F',
    'days.5': 'S',
    'days.6': 'S',

    // Dashboard
    'dashboard.greeting': 'Hey, {name}',
    'dashboard.greetingAnon': 'Hey',
    'dashboard.myWeek': 'My week',
    'dashboard.weekGoal': '{done}/{target} · goal',
    'dashboard.activeSession': 'Session in progress',
    'dashboard.resume': 'Resume',
    'dashboard.heatmap': 'Muscle activity',
    'dashboard.period.7': '7d',
    'dashboard.period.30': '30d',
    'dashboard.recovered': 'Recovered',
    'dashboard.active': 'Active',
    'dashboard.fatigued': 'Fatigued',
    'dashboard.suggestion': 'Suggested workout',
    'dashboard.lastWorkouts': 'Recent workouts',
    'dashboard.streak': 'Streak',
    'dashboard.thisWeek': 'This week',
    'dashboard.total': 'Total',
    'dashboard.noWorkouts': 'No workouts',
    'dashboard.startFirst': 'Start your first session from the Session tab.',
    'dashboard.weeklyGoalReached': 'Goal reached!',
    'dashboard.weeklyGoalSubtitle': '{n} workout{plural} this week — well done 💪',
    'dashboard.prTitle': 'New record!',
    'dashboard.prSubtitle': '{exercise} — you\'re pushing limits 🔥',
    'dashboard.selectMuscle': 'Select a muscle to see details.',

    // Session
    'session.today': 'Today',
    'session.newSession': 'New session',
    'session.subtitle': 'Start with a suggestion or build your own.',
    'session.modeLabel': 'Training mode',
    'session.suggestionLabel': 'Suggestion',
    'session.freeSectionLabel': 'Or free session',
    'session.freeStart': 'Start without program',
    'session.addExercise': 'Add exercise',
    'session.finish': 'Finish',
    'session.sets': 'Sets',
    'session.discardTitle': 'Abandon session?',
    'session.discardMessage': 'All data will be lost.',
    'session.discardConfirm': 'Abandon',
    'session.discardCancel': 'Continue',
    'session.finishTitle': 'Finish session',
    'session.sessionName': 'Session name',
    'session.howFeel': 'How do you feel?',
    'session.duration': 'Duration',
    'session.exercises': 'Exercises',
    'session.saveSession': 'Save',
    'session.continueSession': 'Continue session',
    'session.zeroState': "Let's build your first workout.\nChoose a type above and go.",

    // Workout types
    'session.type.strength.title': 'Strength',
    'session.type.strength.subtitle': 'Heavy training',
    'session.type.strength.hint': '3–5 REPS',
    'session.type.hypertrophy.title': 'Hypertrophy',
    'session.type.hypertrophy.subtitle': 'Volume & muscle',
    'session.type.hypertrophy.hint': '8–12 REPS',
    'session.type.cardio.title': 'Cardio',
    'session.type.cardio.subtitle': 'Endurance',
    'session.type.cardio.hint': 'HIIT',
    'session.type.mobility.title': 'Mobility',
    'session.type.mobility.subtitle': 'Active recovery',
    'session.type.mobility.hint': 'MOBILITY',

    // Exercise picker
    'picker.addExercise': 'Add exercise',
    'picker.customTitle': 'Custom exercise',
    'picker.section': 'Exercises',
    'picker.searchPlaceholder': 'Bench press, squat, curl...',
    'picker.noResults': 'No exercise found.\nCreate it below.',
    'picker.customCta': 'Custom exercise',
    'picker.customCtaSub': 'Create an exercise not in the list',
    'picker.customNameLabel': 'Exercise name',
    'picker.customNamePlaceholder': 'Ex: Hip abduction machine',
    'picker.customMusclesLabel': 'Target muscles (at least 1)',
    'picker.createBtn': 'Create exercise',
    'picker.poly': 'Comp',
    'picker.iso': 'Iso',
    'picker.acc': 'Acc',

    // Progress
    'progress.supertitle': 'Analytics',
    'progress.title': 'Progress',
    'progress.subtitle': 'Track your improvement on every exercise and muscle.',
    'progress.tab.exercises': 'Exercises',
    'progress.tab.volume': 'Volume',
    'progress.tab.muscles': 'Muscles',
    'progress.noDataTitle': 'Not enough data yet',
    'progress.noDataSubtitle': 'Do at least 2 sessions with the same exercise to see your progress.',
    'progress.personalRecords': 'Personal records',
    'progress.weekVolume': 'Muscle volume — 7 days',
    'progress.noSessionsWeek': 'No sessions this week',
    'progress.seeMore': 'See {n} more exercise{plural}',
    'progress.seeLess': 'See less',
    'progress.sessions': '{n} sessions',
    'progress.pr': 'PR {value}{unit}',
    'progress.period.7': '7d',
    'progress.period.30': '30d',

    // Planner
    'planner.supertitle': 'Planning',
    'planner.title': 'My plan',
    'planner.subtitle': 'Daily suggestions, smart warmup, strength programs.',
    'planner.templates': 'Quick templates',
    'planner.templatesSub': 'Push, Pull, Legs — start in one tap',
    'planner.suggestion': 'Suggested workout',
    'planner.suggestionSub': 'Based on your muscle recovery and history',
    'planner.startSession': 'Start this session',
    'planner.warmup': 'Smart warmup',
    'planner.strengthProgram': 'Strength program',
    'planner.strengthSub': 'Generate a progressive plan over several weeks',
    'planner.activePlan': 'Active program',
    'planner.newPlan': 'New program',
    'planner.generate': 'Generate program',
    'planner.targetWeight': 'Target (kg)',
    'planner.weeks': 'Duration (weeks)',
    'planner.profileRequired': 'Profile required',
    'planner.profileRequiredMsg': 'Set up your profile before creating a plan.',
    'planner.week': 'Week {n}',
    'planner.deload': 'DELOAD',
    'planner.moreExercises': '+ {n} exercises',

    // Profile
    'profile.supertitle': 'My profile',
    'profile.tab.stats': 'Profile',
    'profile.tab.badges': 'Badges',
    'profile.tab.settings': 'Settings',
    'profile.personalRecords': 'Personal records',
    'profile.noPRs': 'No PRs recorded yet.\nComplete a session to add some.',
    'profile.config': 'Configuration',
    'profile.level': 'Level',
    'profile.sessionsPerWeek': 'Sessions / week',
    'profile.estimatedRM': 'Estimated 1RM',
    'profile.logoutBtn': 'Sign out',
    'profile.logoutTitle': 'Sign out',
    'profile.logoutMsg': 'Your local data will be preserved.',
    'profile.logoutConfirm': 'Sign out',
    'profile.logoutCancel': 'Cancel',

    // Settings
    'settings.units': 'Units',
    'settings.restTimer': 'Rest timer',
    'settings.defaultRest': 'Default rest',
    'settings.notifications': 'Notifications',
    'settings.testNotif': 'Test notifications',
    'settings.language': 'Language',

    // Levels
    'level.beginner': 'Beginner',
    'level.intermediate': 'Intermediate',
    'level.advanced': 'Advanced',
    'level.elite': 'Elite',
    'level.beginner.years': '< 1 yr',
    'level.intermediate.years': '1–3 yrs',
    'level.advanced.years': '3–5 yrs',
    'level.elite.years': '5+ yrs',

    // Ranks
    'rank.next': 'Next rank',
    'rank.max': 'Max',
    'rank.towards': 'Towards',
    'rank.xpTotal': 'Total XP',
    'rank.ladder': 'Rank ladder',
    'rank.youAreHere': 'YOU ARE HERE',

    // Celebrations
    'celebration.newRecord': 'New record',
    'celebration.previous': 'Previous',
    'celebration.tapToContinue': 'Tap to continue',
    'celebration.rankUp': 'Rank up',
    'tier.bronze': 'BRONZE',
    'tier.silver': 'SILVER',
    'tier.gold': 'GOLD',
    'tier.platinum': 'PLATINUM',
    'tier.diamond': 'DIAMOND',
    'tier.legend': 'CHAMPION',

    // Muscles
    'muscle.chest': 'Chest',
    'muscle.back': 'Back',
    'muscle.shoulders': 'Shoulders',
    'muscle.arms': 'Arms',
    'muscle.legs': 'Legs',
    'muscle.core': 'Core',
    'muscle.glutes': 'Glutes',
    'muscle.calves': 'Calves',

    // WeeklyComparison
    'weekly.title': 'Week progress',
    'weekly.sessions': 'Sessions',
    'weekly.goal': 'goal',
    'weekly.reached': 'Done!',
    'weekly.remaining1': '1 left',
    'weekly.remaining': '{n} left',
    'weekly.upcoming': 'Upcoming',
    'weekly.inProgress': 'In progress',

    // ExerciseCard / SetRow
    'exercise.sets': 'SETS',
    'exercise.addSet': '+ Set',
    'setRow.prev': 'Prev',
    'setRow.firstTime': 'First time',
    'setRow.weight': 'Weight ({units})',

    // BadgeGrid
    'badge.all': 'All',
    'badge.unlocked': 'Unlocked',
    'badge.progress': 'Progress',
    'badge.cat.consistency': 'Consistency',
    'badge.cat.strength': 'Strength',
    'badge.cat.volume': 'Volume',
    'badge.cat.diversity': 'Diversity',
    'badge.cat.milestone': 'Milestones',
    'badge.cat.special': 'Special',
    'badge.first_workout.name': 'First Step',
    'badge.first_workout.desc': 'Complete your first session',
    'badge.streak_3.name': 'On Fire',
    'badge.streak_3.desc': '3 consecutive streak days',
    'badge.streak_7.name': 'Perfect Week',
    'badge.streak_7.desc': '7-day streak',
    'badge.streak_30.name': 'Iron Month',
    'badge.streak_30.desc': '30-day streak',
    'badge.streak_100.name': 'Centurion',
    'badge.streak_100.desc': '100-day streak',
    'badge.workouts_10.name': 'Habit',
    'badge.workouts_10.desc': '10 sessions completed',
    'badge.workouts_50.name': 'Consistent',
    'badge.workouts_50.desc': '50 sessions completed',
    'badge.workouts_100.name': 'Centurion',
    'badge.workouts_100.desc': '100 sessions completed',
    'badge.pr_first.name': 'First Record',
    'badge.pr_first.desc': 'Log your first PR',
    'badge.pr_5.name': 'PR Collector',
    'badge.pr_5.desc': '5 personal records',
    'badge.bench_100.name': '100kg Club',
    'badge.bench_100.desc': 'Bench press 100kg',
    'badge.squat_100.name': 'Steel Legs',
    'badge.squat_100.desc': 'Squat 100kg',
    'badge.deadlift_100.name': 'Raw Strength',
    'badge.deadlift_100.desc': 'Deadlift 100kg',
    'badge.volume_1ton.name': 'One Ton',
    'badge.volume_1ton.desc': '1000kg volume in one session',
    'badge.all_muscles.name': 'Full Body',
    'badge.all_muscles.desc': 'Train every muscle group',
    'badge.gold_rank.name': 'Gold Status',
    'badge.gold_rank.desc': 'Reach Gold rank',

    // Errors
    'error.generic.title': 'Oops, something broke',
    'error.generic.message': 'An unexpected error occurred. Your data is safe.',
    'error.generic.retry': 'Retry',
    'error.boot.title': 'Unable to start',
    'error.boot.message': 'The local database could not be initialised. Try again; if the problem persists, reinstall the app.',
    'error.auth.invalidCredentials': 'Incorrect email or password',
    'error.auth.emailNotConfirmed': 'Confirm your email before signing in (check your inbox)',
    'error.auth.userExists': 'An account already exists with this email',
    'error.auth.weakPassword': 'Password too short (6 characters minimum)',
    'error.auth.network': 'Connection failed — check your network',
    'error.auth.generic': 'Something went wrong, please try again',
  },
} as const;

type TranslationKey = keyof typeof T.fr;
type Params = Record<string, string | number>;

/**
 * Version non-réactive de t() — pour les contextes où les hooks sont
 * indisponibles ou risqués (ErrorBoundary, écran d'erreur de boot).
 * Crash-proof : si le settingsStore est lui-même en panne, retombe sur le fr.
 */
export function tStatic(key: TranslationKey): string {
  let lang: Lang = 'fr';
  try {
    lang = useSettingsStore.getState().settings.language as Lang;
  } catch {
    // settingsStore indisponible — fallback fr
  }
  const dict = (T[lang] ?? T.fr) as Record<string, string>;
  return dict[key] ?? (T.fr as Record<string, string>)[key] ?? key;
}

// ── Hook principal ────────────────────────────────────────────────
export function useT() {
  const language = useSettingsStore((s) => s.settings.language) as Lang;
  const dict = (T[language] ?? T.fr) as Record<string, string>;
  const fallback = T.fr as Record<string, string>;

  return function t(key: TranslationKey, params?: Params): string {
    let str = dict[key] ?? fallback[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }
    return str;
  };
}

// ── Hook locale date-fns ──────────────────────────────────────────
export function useDateLocale() {
  const language = useSettingsStore((s) => s.settings.language) as Lang;
  return language === 'en' ? dateFnsEn : dateFnsFr;
}

// ── Hook labels musculaires traduits ─────────────────────────────
import type { MuscleGroup } from '@/types';

export function useMuscleLabels(): Record<MuscleGroup, string> {
  const t = useT();
  return {
    chest:     t('muscle.chest'),
    back:      t('muscle.back'),
    shoulders: t('muscle.shoulders'),
    arms:      t('muscle.arms'),
    legs:      t('muscle.legs'),
    core:      t('muscle.core'),
    glutes:    t('muscle.glutes'),
    calves:    t('muscle.calves'),
  };
}
