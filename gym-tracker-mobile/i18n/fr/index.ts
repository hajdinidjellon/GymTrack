/** French is the source language: every other dictionary has exactly its shape. */
import { account } from './account';
import { common } from './common';
import { data } from './data';
import { domain } from './domain';
import { exercise } from './exercise';
import { history } from './history';
import { home } from './home';
import { onboarding } from './onboarding';
import { privacy } from './privacy';
import { profile } from './profile';
import { program } from './program';
import { progress } from './progress';
import { session } from './session';
import { ui } from './ui';

export const fr = {
  account,
  common,
  data,
  domain,
  exercise,
  history,
  home,
  onboarding,
  privacy,
  profile,
  program,
  progress,
  session,
  ui,
};

export type Dictionary = typeof fr;
