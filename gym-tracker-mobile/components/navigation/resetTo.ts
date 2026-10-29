import { router, type Href } from 'expo-router';

/**
 * Leaves the whole flow for `href`: closes the screens stacked above, if any,
 * then replaces. Dismissing an empty stack is an unhandled POP_TO_TOP.
 */
export function resetTo(href: Href): void {
  if (router.canDismiss()) router.dismissAll();
  router.replace(href);
}
