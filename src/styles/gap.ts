import styles from './gap.module.css';

/** A step on the spacing scale: 1 is 4px, 2 is 8px, 3 is 16px, 4 is 24px, 5 is 32px, 6 is 48px, 7 is 96px */
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

/**
 * The class for a gap on the spacing scale. Spacing uses classes rather than inline styles, because
 * the Content Security Policy blocks inline styles in prerendered HTML
 */
export function gapClass(step: SpaceStep): string | undefined {
  return GAP_CLASSES[step];
}
