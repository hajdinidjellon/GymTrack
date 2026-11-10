import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Journey, seed } from './harness';

jest.setTimeout(60_000);

beforeEach(() => {
  jest.useFakeTimers();
  seed({ profile: null });
});

const GROUP = 'Arrivée';

describe('arrival', () => {
  it('first launch, everything skipped, straight to the first session', async () => {
    const j = await new Journey('onboarding-skip', 'Premier lancement, questions passées → 1ʳᵉ séance', GROUP).open(
      '/welcome',
    );
    await j.tap("C'est parti");
    await j.tap('Passer');
    j.view('récapitulatif');
    await j.tap('Voir ma première séance');
    expect(j.pathname).toBe('/session/preview');
    await j.tap('Lancer la séance');
    expect(j.pathname).toBe('/session');
    const r = j.save();
    expect(r.taps).toBeLessThanOrEqual(5);
  });

  it('first launch, every question answered, then the first session', async () => {
    const j = await new Journey(
      'onboarding-full',
      'Premier lancement, les 7 questions répondues → 1ʳᵉ séance',
      GROUP,
    ).open('/welcome');
    await j.tap("C'est parti");
    // 1. Objectif
    await j.tap(/^Prendre du muscle/, 'radio');
    await j.tap('Continuer');
    j.view('question 2');
    // 2. Toi : sexe, âge, poids
    await j.tap('Un homme', 'radio');
    await j.tap(/^25/, 'radio');
    await j.tap('Continuer');
    j.view('question 3');
    // 3. Expérience
    await j.tap(/^Quelques mois/, 'radio');
    await j.tap('Continuer');
    j.view('question 4');
    // 4. Programme
    await j.tap(/^Haut \/ Bas/, 'radio');
    await j.tap('Continuer');
    j.view('question 5');
    // 5. Rythme : la semaine proposée est gardée
    await j.tap('4 séances par semaine', 'radio');
    await j.tap('Continuer');
    j.view('question 6');
    // 6. Durée
    await j.tap('60 minutes', 'radio');
    await j.tap('Continuer');
    j.view('question 7');
    // 7. Salle
    await j.tap('Basic-Fit', 'radio');
    await j.tap('Voir mon programme');
    j.view('récapitulatif');
    await j.tap('Voir ma première séance');
    await j.tap('Lancer la séance');
    expect(j.pathname).toBe('/session');
    j.note(
      'Chaque question demande 2 taps (choisir + Continuer) : passer à la suivante dès le choix fait économiserait 6 taps.',
    );
    j.save();
  });

  it('creates an account from the welcome screen', async () => {
    const j = await new Journey('signup', 'Créer un compte depuis l’accueil, puis l’onboarding passé', GROUP).open(
      '/welcome',
    );
    await j.tap("J'ai déjà un compte");
    await j.tap('Pas de compte ? Créer un compte');
    await j.type('Pseudo', 'poseidon');
    await j.type('Mot de passe', 'motdepasse1');
    await j.tap('Créer mon compte');
    expect(j.pathname).toBe('/recovery-code');
    j.sheet('code de récupération');
    j.note('Le bouton « Créer un compte » est caché derrière « J’ai déjà un compte » : 1 tap et une lecture de trop.');
    j.save();
  });
});
