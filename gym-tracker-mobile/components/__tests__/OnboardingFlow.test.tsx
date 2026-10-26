import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
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
      { goal: 'forme', perWeek: 5, experience: 'new', barWeight: 15, plates: [25, 20, 15, 10, 5, 2.5] },
      'session',
    );
  });

  it('skips straight to the recap with the defaults', async () => {
    const { onFinish } = await setup();
    await tap('Passer');
    await tap("Plus tard, voir l'accueil");
    expect(onFinish).toHaveBeenCalledWith(expect.objectContaining({ goal: 'muscle', perWeek: 3 }), 'home');
  });

  it('goes back one question, then leaves from the first one', async () => {
    const { onExit } = await setup();
    await tap('Continuer');
    await tap('Retour');
    expect(screen.getByText('Tu viens pour quoi ?')).toBeOnTheScreen();
    await tap('Retour');
    expect(onExit).toHaveBeenCalled();
  });
});
