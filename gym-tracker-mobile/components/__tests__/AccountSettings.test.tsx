import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { createRecoveryCode, deleteAccount, getContactEmail, updateContactEmail } from '@/services/recovery';
import { signOutAndClear } from '@/stores/accountData';
import { AccountSettings } from '@/components/account/AccountSettings';

jest.mock('@/services/recovery', () => ({
  getContactEmail: jest.fn(),
  updateContactEmail: jest.fn(),
  createRecoveryCode: jest.fn(),
  deleteAccount: jest.fn(),
}));
jest.mock('@/stores/accountData', () => ({ signOutAndClear: jest.fn(() => Promise.resolve()) }));
jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));

const mocked = {
  getContactEmail: jest.mocked(getContactEmail),
  updateContactEmail: jest.mocked(updateContactEmail),
  createRecoveryCode: jest.mocked(createRecoveryCode),
  deleteAccount: jest.mocked(deleteAccount),
};

/** Presses the destructive button of the alert just shown, and lets what follows settle. */
async function confirmAlert() {
  const buttons = jest.mocked(Alert.alert).mock.calls.at(-1)?.[2] ?? [];
  await act(async () => {
    buttons.find((b) => b.style === 'destructive')?.onPress?.();
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 0));
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mocked.getContactEmail.mockResolvedValue(null);
});

const typePassword = async (password: string) =>
  fireEvent.changeText(screen.getByLabelText('Ton mot de passe actuel'), password);

describe('AccountSettings', () => {
  it('adds an email, the password checked again', async () => {
    mocked.updateContactEmail.mockResolvedValue('ok');
    await render(<AccountSettings />);
    expect(await screen.findByText('Aucun email')).toBeOnTheScreen();
    await fireEvent.changeText(screen.getByLabelText('Ton email'), ' me@mail.com ');
    await typePassword('secret1');
    await fireEvent.press(screen.getByRole('button', { name: "Enregistrer l'email" }));
    expect(mocked.updateContactEmail).toHaveBeenCalledWith('me@mail.com', 'secret1');
    expect(await screen.findByText('Email enregistré.')).toBeOnTheScreen();
    expect(screen.getByTestId('saved-email')).toHaveTextContent('me@mail.com');
  });

  it('refuses a malformed email before asking the server', async () => {
    await render(<AccountSettings />);
    await fireEvent.changeText(screen.getByLabelText('Ton email'), 'not-an-email');
    await typePassword('secret1');
    await fireEvent.press(screen.getByRole('button', { name: "Enregistrer l'email" }));
    expect(mocked.updateContactEmail).not.toHaveBeenCalled();
  });

  it('says when the password is wrong', async () => {
    mocked.getContactEmail.mockResolvedValue('old@mail.com');
    mocked.updateContactEmail.mockResolvedValue('password');
    await render(<AccountSettings />);
    await screen.findByText('old@mail.com');
    await fireEvent.changeText(screen.getByLabelText('Ton email'), '');
    await typePassword('wrong');
    await fireEvent.press(screen.getByRole('button', { name: "Retirer l'email" }));
    expect(mocked.updateContactEmail).toHaveBeenCalledWith(null, 'wrong');
    expect(await screen.findByText('Mot de passe incorrect.')).toBeOnTheScreen();
  });

  it('shows a new recovery code once, in place', async () => {
    mocked.createRecoveryCode.mockResolvedValue({ ok: true, code: 'OKL-7K2M-9QXR-4HTZ' });
    await render(<AccountSettings />);
    await typePassword('secret1');
    await fireEvent.press(screen.getByRole('button', { name: 'Nouveau code de récupération' }));
    expect(mocked.createRecoveryCode).toHaveBeenCalledWith('secret1');
    expect(await screen.findByTestId('recovery-code')).toHaveTextContent('OKL - 7K2M - 9QXR - 4HTZ');
  });

  it('says when there were too many tries', async () => {
    mocked.createRecoveryCode.mockResolvedValue({ ok: false, reason: 'limit' });
    await render(<AccountSettings />);
    await typePassword('secret1');
    await fireEvent.press(screen.getByRole('button', { name: 'Nouveau code de récupération' }));
    expect(await screen.findByText(/Trop d'essais/)).toBeOnTheScreen();
  });

  describe('deleting the account', () => {
    beforeEach(() => {
      jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    });

    it('asks the password, confirms, then erases the account and this phone', async () => {
      mocked.deleteAccount.mockResolvedValue('ok');
      await render(<AccountSettings />);
      expect(screen.getByRole('button', { name: 'Supprimer mon compte' })).toBeDisabled();
      await typePassword('secret1');
      await fireEvent.press(screen.getByRole('button', { name: 'Supprimer mon compte' }));
      expect(mocked.deleteAccount).not.toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith('Supprimer ton compte ?', expect.any(String), expect.any(Array));
      await confirmAlert();
      expect(mocked.deleteAccount).toHaveBeenCalledWith('secret1');
      await waitFor(() => expect(signOutAndClear).toHaveBeenCalled());
      expect(router.replace).toHaveBeenCalledWith('/welcome');
    });

    it('keeps everything when the password is wrong', async () => {
      mocked.deleteAccount.mockResolvedValue('password');
      await render(<AccountSettings />);
      await typePassword('wrong');
      await fireEvent.press(screen.getByRole('button', { name: 'Supprimer mon compte' }));
      await confirmAlert();
      expect(await screen.findByText('Mot de passe incorrect.')).toBeOnTheScreen();
      expect(signOutAndClear).not.toHaveBeenCalled();
    });
  });
});
