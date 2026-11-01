import type { Dictionary } from '@/i18n/fr';

export const session: Dictionary['session'] = {
  backHome: 'Back to home',
  weightMinus: 'Minus {kg} kg',
  weightPlus: 'Plus {kg} kg',

  logger: {
    finishTitle: 'End the workout?',
    finishLeft: {
      one: '{count} set left. The sets you already did are saved.',
      other: '{count} sets left. The sets you already did are saved.',
    },
    finishNoneLeft: 'The sets you did are saved.',
    abandon: 'Discard',
    finish: 'End',
    exerciseOf: '· exercise {n} of {total}',
    setOf: 'Set {n} of {total}',
    nextSetOf: 'Next set {n} of {total}',
    setDone: 'Set {n} done',
  },

  preview: {
    start: 'Start the workout',
    todayEyebrow: "Today's workout · ~{minutes} min",
    chosenEyebrow: 'Chosen workout · ~{minutes} min',
    subtitle: 'Weights and reps worked out from your last workouts. Tap an exercise for the details.',
    otherDay: 'Feel like another workout?',
    dayA11y: '{name} workout',
    dayTodayA11y: '{name} workout, planned for today',
    dayExtraA11y: '{name} workout, off program, just this once',
    extraEyebrow: 'Off program · ~{minutes} min',
    extraSubtitle: 'Just this once: each exercise picks up where you are. Your program carries on where you left it.',
    liftA11y: '{name}, {target}, {delta}',
    firstTime: 'first time',
    weightToPick: 'Weight to pick',
    perSideA11y: 'Per side: {plates}',
    calibrate: 'Set up',
    remove: 'Remove {name}',
    equipment: {
      barbell: 'Barbell',
      dumbbell: 'Dumbbells',
      machine: 'Machine',
      bodyweight: 'BW',
    },
  },

  summary: {
    perSideIncrease: '+{kg} kg / side',
    title: 'Workout done.',
    saved: '{name} · saved to your history',
    newRecord: 'New record',
    record: '{name} · {kg} kg',
    before: 'Before: {kg} kg',
    lifted: 'You lifted',
    plates: { one: "that's {n} 20 kg plate", other: "that's {n} 20 kg plates" },
    duration: 'duration',
    setsDone: { one: 'set done', other: 'sets done' },
    records: { one: 'record', other: 'records' },
    nextTime: 'Next time',
  },

  add: {
    a11y: 'Add an exercise to the workout',
    title: 'Add an exercise',
    sameMuscle: 'Same muscle',
    keep: 'Also add it to my next {day} workouts',
  },

  swap: {
    a11y: 'Swap exercise, instead of {name}',
    button: 'Swap',
    title: 'Swap exercise',
    sameMuscle: 'Same muscle · {muscle}',
    keep: 'Keep this swap for my next {day} workouts',
  },

  picker: {
    suggestions: 'Suggestions',
    taken: '{name}, already in the workout',
    choose: 'Pick {name}',
    alias: 'Also called {alias}',
    own: 'Your exercise',
    newExercise: 'New exercise',
    searchPlaceholder: 'Search: hack squat, smith, converging…',
    searchA11y: 'Search for an exercise',
    notFound: "Not in the list: create it, it'll be filed under its muscle.",
    createNamedA11y: 'Create {name}',
    createA11y: 'Create an exercise',
    createNamed: '+ Create “{name}”',
    create: '+ Create my exercise',
  },

  calibration: {
    firstTime: 'First time',
    startBar: "Load your starting bar. We'll handle the rest.",
    startOther: "Pick your starting weight. We'll handle the rest.",
    inputLabel: 'Starting weight in kilos',
    presetA11y: '{kg} kilos',
    start: 'Start at {kg} kg',
  },

  doLater: {
    a11y: 'Do {name} later',
  },

  effort: {
    question: 'How was it?',
  },

  note: {
    placeholder: 'Seat notch 4, close grip…',
    inputA11y: 'Note on {name}',
    editA11y: 'Edit the note: {note}',
    addA11y: 'Add a note',
    add: '+ A note (setting, grip…)',
  },

  missed: {
    title: 'How many reps?',
    hint: 'Target {target}. No big deal: next workout takes it into account.',
    hintWeight: 'Target {target} at {kg} kg. No big deal: next workout takes it into account.',
    option: '{n} reps',
    optionTarget: '{n} reps (target)',
    save: 'Save {n} reps',
  },

  rest: {
    title: 'Rest',
    minimize: 'Minimize',
    minimizeA11y: 'Minimize the timer',
    closeA11y: 'Close the rest',
    timerA11y: { one: 'Rest, {count} second left', other: 'Rest, {count} seconds left' },
    miniA11y: {
      one: 'Rest, {count} second left. Expand the timer',
      other: 'Rest, {count} seconds left. Expand the timer',
    },
    expand: 'Expand',
    minus15A11y: 'Remove 15 seconds',
    plus15A11y: 'Add 15 seconds',
    nextExercise: 'Next · {name}',
    nextExerciseSet: 'Next · {name}, set {n}',
    nextSet: 'Next · set {n}',
    weightToSet: 'Weight to set',
    skip: 'Skip rest',
    undoA11y: 'Undo the last set',
    undo: '{label} · undo',
  },

  running: {
    title: 'Workout in progress',
    progress: { one: '{done} / {count} set done', other: '{done} / {count} sets done' },
  },

  progress: {
    doNow: 'Do {name} now',
    finished: '{name}, finished',
    current: '{name}, in progress',
  },

  setRow: {
    a11y: 'Set {index}, {kg} kilos, {reps} reps, {state}',
    a11yNoWeight: 'Set {index}, {reps} reps, {state}',
    done: 'done',
    current: 'in progress',
    upcoming: 'upcoming',
    headerSet: 'SET',
    headerKg: 'KG',
    headerReps: 'REPS',
    deleteA11y: 'Delete set {n}',
  },

  setView: {
    lastTime: 'Last time',
    why: 'Why {kg} kg?',
    weightInput: 'Weight in kilos',
    repMinus: 'One rep less',
    repPlus: 'One rep more',
    repsInput: 'Number of reps',
    missed: 'Missed the set? Log the reps you did',
    addSetA11y: 'Add a set',
    addSet: '+ Add a set',
    swipeHint: 'Swipe a set left to delete it',
    allAsPlanned: { one: 'All as planned · {count} set', other: 'All as planned · {count} sets' },
    validateA11y: 'Log the set',
  },
};
