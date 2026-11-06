import { afterEach, describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { setLocale } from '@/i18n';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';

async function setup() {
  const onExit = jest.fn();
  const onFinish = jest.fn();
  await render(<OnboardingFlow onExit={onExit} onFinish={onFinish} />);
  return { onExit, onFinish };
}

const tap = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }));
const pick = (name: string | RegExp) => fireEvent.press(screen.getByRole('radio', { name }));

/** From the goal question to the rhythm one, without answering the others. */
async function toRhythm() {
  await tap('Continuer');
  await tap('Continuer');
  await tap('Continuer');
}

describe('OnboardingFlow', () => {
  it('asks the seven questions in order, each already answered', async () => {
    await setup();
    expect(screen.getByText('Tu viens pour quoi ?')).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: /Prendre du muscle/ })).toBeSelected();
    expect(screen.getByLabelText('Question 1 sur 7')).toBeOnTheScreen();

    await tap('Continuer');
    expect(screen.getByText('Et toi ?')).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'Je préfère pas dire' })).toBeSelected();

    await tap('Continuer');
    expect(screen.getByText('Tu soulèves depuis quand ?')).toBeOnTheScreen();

    await tap('Continuer');
    expect(screen.getByText('Combien de séances par semaine ?')).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: '3 séances par semaine' })).toBeSelected();

    await tap('Continuer');
    expect(screen.getByText('Quel programme ?')).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: /^Tout le corps.*Conseillé pour 3 séances/ })).toBeSelected();

    await tap('Continuer');
    expect(screen.getByText('Une séance, ça dure combien ?')).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: '60 minutes' })).toBeSelected();

    await tap('Continuer');
    expect(screen.getByText('Tu vas dans quelle salle ?')).toBeOnTheScreen();

    await tap('Voir mon programme');
    expect(screen.getByText(/Ton programme/)).toBeOnTheScreen();
    expect(screen.getByText('Séance 1 · Full body A')).toBeOnTheScreen();
  });

  it('reacts to the answer and picks the split from the rhythm', async () => {
    await setup();
    await fireEvent.press(screen.getByRole('radio', { name: /Devenir plus fort/ }));
    expect(screen.getByText(/5 reps partout/)).toBeOnTheScreen();

    await toRhythm();
    await fireEvent.press(screen.getByRole('radio', { name: '4 séances par semaine' }));
    expect(screen.getByText('Haut · Bas')).toBeOnTheScreen();
    expect(screen.getByText(/deux fois par semaine/)).toBeOnTheScreen();
  });

  it('sends the answers when the recap is confirmed', async () => {
    const { onFinish } = await setup();
    await pick(/Rester en forme/);
    await tap('Continuer');
    await pick('Une femme');
    await pick('25–34 ans');
    await tap('Un kilo de plus');
    await tap('Continuer');
    await pick(/Je débute/);
    await tap('Continuer');
    await pick('5 séances par semaine');
    await tap('Continuer');
    await pick(/^Fessiers \/ Haut \/ Jambes/);
    await tap('Continuer');
    await pick('45 minutes');
    await tap('Continuer');
    await pick('Basic-Fit');
    expect(screen.getByText('Machines : crans de 4,5 kg, poulies : 2,3 kg')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('radio', { name: /Barre de 15 kilos/ }));
    await fireEvent.press(screen.getByRole('checkbox', { name: '25 kilos' }));
    await fireEvent.press(screen.getByRole('checkbox', { name: '1,25 kilos' }));
    await tap('Voir mon programme');
    await tap('Voir ma première séance');

    expect(onFinish).toHaveBeenCalledWith(
      {
        goal: 'forme',
        perWeek: 5,
        experience: 'new',
        barWeight: 15,
        plates: [25, 20, 15, 10, 5, 2.5],
        schedule: ['Fessiers', 'Haut du corps', 'Jambes', null, 'Fessiers', 'Haut du corps', null],
        split: 'glutes',
        sex: 'female',
        ageGroup: '25',
        bodyWeight: 71,
        sessionMinutes: 45,
        gym: 'basicfit',
        stackStep: 4.5,
        cableStep: 2.3,
      },
      'session',
    );
  });

  it('lets the user pick the session of each day of the week', async () => {
    const { onFinish } = await setup();
    await toRhythm();
    await fireEvent.press(screen.getByRole('radio', { name: '4 séances par semaine' }));
    // Monday is open from the start: its sessions are right there
    expect(screen.getByText('Le lundi, tu fais :')).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'Haut' })).toBeSelected();
    await fireEvent.press(screen.getByRole('radio', { name: 'Bas' }));
    expect(screen.getByRole('button', { name: 'lundi : Bas' })).toBeOnTheScreen();
    await tap('mercredi : repos');
    expect(screen.getByText('Le mercredi, tu fais :')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('radio', { name: 'Haut' }));
    expect(screen.getByRole('button', { name: 'mercredi : Haut' })).toBeOnTheScreen();
    expect(screen.getByText('5 séances,')).toBeOnTheScreen();
    await tap('Passer');
    await tap("Plus tard, voir l'accueil");

    expect(onFinish).toHaveBeenCalledWith(
      expect.objectContaining({ perWeek: 4, schedule: ['Bas', 'Bas', 'Haut', 'Haut', 'Bas', null, null] }),
      'home',
    );
  });

  it('keeps the week shown when the user goes on without touching it', async () => {
    const { onFinish } = await setup();
    await toRhythm();
    await tap('Continuer');
    await tap('Passer');
    await tap("Plus tard, voir l'accueil");
    expect(onFinish).toHaveBeenCalledWith(
      expect.objectContaining({ schedule: ['Full body A', null, 'Full body B', null, 'Full body A', null, null] }),
      'home',
    );
  });

  it('asks for one day at least before going on', async () => {
    await setup();
    await toRhythm();
    await fireEvent.press(screen.getByRole('radio', { name: '2 séances par semaine' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'Repos' }));
    await tap(/^jeudi/);
    await fireEvent.press(screen.getByRole('radio', { name: 'Repos' }));
    expect(screen.getByText(/Choisis au moins un jour/)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Continuer' })).toBeDisabled();
  });

  it('skips straight to the recap with the defaults', async () => {
    const { onFinish } = await setup();
    await tap('Passer');
    await tap("Plus tard, voir l'accueil");
    expect(onFinish).toHaveBeenCalledWith(
      expect.objectContaining({ goal: 'muscle', perWeek: 3, schedule: null }),
      'home',
    );
  });

  it('keeps the days picked when the program changes, with the new program on them', async () => {
    const { onFinish } = await setup();
    await toRhythm();
    await pick('4 séances par semaine');
    await tap('Continuer');
    expect(screen.getByRole('radio', { name: /^Haut \/ Bas.*Conseillé pour 4 séances/ })).toBeSelected();
    await pick(/^Pousser \/ Tirer \/ Jambes/);
    await tap('Passer');
    await tap("Plus tard, voir l'accueil");
    expect(onFinish).toHaveBeenCalledWith(
      expect.objectContaining({ split: 'ppl', schedule: ['Push', 'Pull', null, 'Legs', 'Push', null, null] }),
      'home',
    );
  });

  it('finds a gym by searching, and offers another gym or home', async () => {
    const { onFinish } = await setup();
    await tap('Passer');
    await tap('Retour');
    // Back from the recap: the last question
    expect(screen.getByText('Tu vas dans quelle salle ?')).toBeOnTheScreen();
    await fireEvent.changeText(screen.getByLabelText('Chercher une autre salle'), 'neo');
    await pick('Neoness');
    expect(screen.getByRole('radio', { name: 'Neoness' })).toBeSelected();
    await fireEvent.changeText(screen.getByLabelText('Chercher une autre salle'), 'zzz');
    expect(screen.getByText(/Pas dans la liste/)).toBeOnTheScreen();
    await pick('Chez moi');
    await tap('Voir mon programme');
    await tap("Plus tard, voir l'accueil");
    expect(onFinish).toHaveBeenCalledWith(
      expect.objectContaining({ gym: 'home', plates: [20, 10, 5, 2.5, 1.25], stackStep: null }),
      'home',
    );
  });

  it('goes back one question, then leaves from the first one', async () => {
    const { onExit } = await setup();
    await tap('Continuer');
    await tap('Retour');
    expect(screen.getByText('Tu viens pour quoi ?')).toBeOnTheScreen();
    await tap('Retour');
    expect(onExit).toHaveBeenCalled();
  });

  describe('in English', () => {
    afterEach(() => setLocale('fr'));

    it('asks the questions and shows the recap in English', async () => {
      setLocale('en');
      await setup();
      expect(screen.getByText('What are you here for?')).toBeOnTheScreen();
      expect(screen.getByLabelText('Question 1 of 7')).toBeOnTheScreen();

      await tap('Continue');
      expect(screen.getByText('And you?')).toBeOnTheScreen();
      await tap('Continue');
      await tap('Continue');
      expect(screen.getByText('How many sessions a week?')).toBeOnTheScreen();
      expect(screen.getByRole('radio', { name: '3 sessions a week' })).toBeSelected();

      await tap('Skip');
      expect(screen.getByText(/Your program/)).toBeOnTheScreen();
      expect(screen.getByText('3 × a week')).toBeOnTheScreen();
      expect(screen.getByRole('button', { name: 'See my first session' })).toBeOnTheScreen();
    });
  });
});
