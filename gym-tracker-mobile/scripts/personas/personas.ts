/**
 * Test accounts, one per kind of user, with a history made by the app's own engine: each past
 * session is planned like "Lancer la séance" does, then logged set by set. Sign in with one on a
 * phone to see the app as that person sees it.
 */
import type { Effort } from '@/domain/effort';
import type { OnboardingAnswers } from '@/domain/onboarding';
import type { UserProfile } from '@/types';

export interface Persona {
  username: string;
  /** For the accounts file: who this is, what to look at. */
  about: string;
  profile: Omit<UserProfile, 'prs' | 'bodyStats'> & { bodyWeight?: number };
  gym: string;
  /** Weeks of history, ending `daysOff` days ago. 0: just signed up, nothing done yet. */
  weeks: number;
  daysOff: number;
  /** How often a last set falls short of its reps (0..1), and the effort felt. */
  missRate: number;
  efforts: Effort[];
  /** The hour sessions start at. */
  hour: number;
}

type Experience = NonNullable<OnboardingAnswers['experience']>;
const exp = (e: Experience) => e;

export const PERSONAS: Persona[] = [
  {
    username: 'test-novice',
    about: 'Débutante, vient de finir l’onboarding, aucune séance : écran du premier jour, choix des charges.',
    profile: {
      goal: 'forme',
      program: { split: 'fb', perWeek: 3 },
      experience: exp('new'),
      sex: 'female',
      ageGroup: '25',
      sessionMinutes: 45,
      bodyWeight: 62,
    },
    gym: 'basicfit',
    weeks: 0,
    daysOff: 0,
    missRate: 0,
    efforts: ['good'],
    hour: 18,
  },
  {
    username: 'test-novice-3sem',
    about: 'Débutante, 3 semaines de full body (7 séances) : premières progressions, échauffements.',
    profile: {
      goal: 'forme',
      program: { split: 'fb', perWeek: 3 },
      experience: exp('new'),
      sex: 'female',
      ageGroup: '25',
      sessionMinutes: 45,
      bodyWeight: 62,
    },
    gym: 'basicfit',
    weeks: 3,
    daysOff: 1,
    missRate: 0.15,
    efforts: ['good', 'good', 'easy'],
    hour: 18,
  },
  {
    username: 'test-inter',
    about: 'Intermédiaire, Push · Pull · Legs 4×/semaine depuis 2 mois : progression, records, historique.',
    profile: {
      goal: 'muscle',
      program: { split: 'ppl', perWeek: 4 },
      experience: exp('months'),
      sex: 'male',
      ageGroup: '25',
      sessionMinutes: 60,
      bodyWeight: 78,
    },
    gym: 'fitnesspark',
    weeks: 8,
    daysOff: 1,
    missRate: 0.2,
    efforts: ['good', 'good', 'max', 'easy'],
    hour: 19,
  },
  {
    username: 'test-avance',
    about: 'Confirmé, Haut · Bas 4×/semaine depuis 4 mois, objectif force : grosses charges, beaucoup d’historique.',
    profile: {
      goal: 'force',
      program: { split: 'ul', perWeek: 4 },
      experience: exp('years'),
      sex: 'male',
      ageGroup: '35',
      sessionMinutes: 75,
      bodyWeight: 92,
    },
    gym: 'keepcool',
    weeks: 16,
    daysOff: 1,
    missRate: 0.25,
    efforts: ['good', 'max', 'max', 'good'],
    hour: 7,
  },
  {
    username: 'test-reprise',
    about: 'Intermédiaire, 2 mois de full body puis 3 semaines d’arrêt : la reprise plus légère.',
    profile: {
      goal: 'muscle',
      program: { split: 'fb', perWeek: 3 },
      experience: exp('months'),
      sex: 'female',
      ageGroup: '45',
      sessionMinutes: 60,
      bodyWeight: 68,
    },
    gym: 'orangebleue',
    weeks: 8,
    daysOff: 21,
    missRate: 0.15,
    efforts: ['good', 'easy', 'good'],
    hour: 12,
  },
];
