/** French is the source language: every other dictionary has exactly its shape. */
import { common } from './common';
import { domain } from './domain';
import { exercise } from './exercise';
import { home } from './home';
import { onboarding } from './onboarding';
import { profile } from './profile';
import { program } from './program';
import { progress } from './progress';
import { session } from './session';
import { ui } from './ui';

export const fr = { common, domain, exercise, home, onboarding, profile, program, progress, session, ui };

export type Dictionary = typeof fr;
