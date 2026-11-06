import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { Alert, Share } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { RecoveryCodeView } from '@/components/account/RecoveryCodeView';

const CODE = 'OKL-7K2M-9QXR-4HTZ';

beforeEach(() => {
  jest.restoreAllMocks();
});

describe('RecoveryCodeView', () => {
  it('shows the code with the warning that it will not come back', async () => {
    await render(<RecoveryCodeView code={CODE} onKept={jest.fn()} />);
    expect(screen.getByTestId('recovery-code')).toHaveTextContent('OKL - 7K2M - 9QXR - 4HTZ');
    expect(screen.getByText(/Il ne sera plus jamais affiché/)).toBeOnTheScreen();
  });

  it('saves it through the share sheet, without writing a file', async () => {
    const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction', activityType: undefined });
    await render(<RecoveryCodeView code={CODE} username="poseidon" onKept={jest.fn()} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Copier ou enregistrer dans mes notes' }));
    expect(share).toHaveBeenCalledWith({ message: `Mon code de récupération Okilo (poseidon) : ${CODE}` });
  });

  it('asks once more before leaving it behind', async () => {
    const onKept = jest.fn();
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    await render(<RecoveryCodeView code={CODE} onKept={onKept} />);
    await fireEvent.press(screen.getByRole('button', { name: "Je l'ai gardé" }));
    expect(onKept).not.toHaveBeenCalled();
    const buttons = alert.mock.calls[0]?.[2] ?? [];
    buttons.find((b) => b.text === "Oui, je l'ai")?.onPress?.();
    expect(onKept).toHaveBeenCalled();
  });
});
