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

describe('OnboardingFlow', () => {
  it('asks the four questions in order, each already answered', async () => {
    await setup();
    expect(screen.getByText('Tu viens pour quoi ?')).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: /Prendre du muscle/ })).toBeSelected();
    expect(screen.getByLabelText('Question 1 sur 4')).toBeOnTheScreen();

    await tap('Continuer');
    expect(screen.getByText('Combien de séances par semaine ?')).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: '3 séances par semaine' })).toBeSelected();

    await tap('Continuer');
    expect(screen.getByText('Tu soulèves depuis quand ?')).toBeOnTheScreen();

    await tap('Continuer');
    expect(screen.getByText('Il y a quoi dans ta salle ?')).toBeOnTheScreen();

    await tap('Voir mon programme');
    expect(screen.getByText(/Ton programme/)).toBeOnTheScreen();
    expect(screen.getByText('Séance 1 · Full body A')).toBeOnTheScreen();
  });

  it('reacts to the answer and picks the split from the rhythm', async () => {
    await setup();
    await fireEvent.press(screen.getByRole('radio', { name: /Devenir plus fort/ }));
    expect(screen.getByText(/5 reps partout/)).toBeOnTheScreen();

    await tap('Continuer');
    await fireEvent.press(screen.getByRole('radio', { name: '4 séances par semaine' }));
    expect(screen.getByText('Haut · Bas')).toBeOnTheScreen();
    expect(screen.getByText(/deux fois par semaine/)).toBeOnTheScreen();
  });

  it('sends the answers when the recap is confirmed', async () => {
    const { onFinish } = await setup();
    await fireEvent.press(screen.getByRole('radio', { name: /Rester en forme/ }));
    await tap('Continuer');
    await fireEvent.press(screen.getByRole('radio', { name: '5 séances par semaine' }));
    await tap('Continuer');
    await fireEvent.press(screen.getByRole('radio', { name: /Je débute/ }));
    await tap('Continuer');
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
        schedule: ['Push', 'Pull', 'Legs', null, 'Push', 'Pull', null],
      },
      'session',
    );
  });

  it('lets the user pick the session of each day of the week', async () => {
    const { onFinish } = await setup();
    await tap('Continuer');
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
    await tap('Continuer');
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
    await tap('Continuer');
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
      expect(screen.getByLabelText('Question 1 of 4')).toBeOnTheScreen();

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
