import styles from './gap.module.css';

/** A spacing scale step: 1 to 7 are 4px, 8px, 16px, 24px, 32px, 48px and 96px */
export type SpaceStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const GAP_CLASSES: Record<SpaceStep, string | undefined> = {
  1: styles.gap1,
  2: styles.gap2,
  3: styles.gap3,
  4: styles.gap4,
  5: styles.gap5,
  6: styles.gap6,
  7: styles.gap7,
};

/** A class, not an inline style, as the Content Security Policy blocks inline styles */
export function gapClass(step: SpaceStep): string | undefined {
  return GAP_CLASSES[step];
}
