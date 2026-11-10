// Components must use design tokens for colour, spacing and type. Only token files may hold raw values.
const TOKENISED_PROPERTIES = [
  '/color$/',
  'fill',
  'stroke',
  'background',
  'box-shadow',
  '/^(margin|padding)/',
  '/^(gap|row-gap|column-gap)$/',
  'font-size',
  'font-family',
  'font-weight',
  'line-height',
  'letter-spacing',
  'word-spacing',
  'border-radius',
  '/^border(-(top|right|bottom|left))?-width$/',
  'outline-width',
  'outline-offset',
];

/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard'],
  plugins: ['stylelint-declaration-strict-value'],
  rules: {
    'scale-unlimited/declaration-strict-value': [
      TOKENISED_PROPERTIES,
      {
        ignoreValues: [
          'inherit',
          'initial',
          'unset',
          'currentcolor',
          'transparent',
          'none',
          'auto',
          '0',
          '/^(Canvas|CanvasText|LinkText|VisitedText|ButtonFace|ButtonText|ButtonBorder|Highlight|HighlightText|GrayText|Field|FieldText|Mark|MarkText|AccentColor|AccentColorText)$/',
        ],
        expandShorthand: true,
        disableFix: true,
      },
    ],
    'selector-class-pattern': [
      '^[a-z][a-zA-Z0-9]*$',
      { message: 'Use camelCase class names in CSS Modules' },
    ],
    'selector-pseudo-class-no-unknown': [true, { ignorePseudoClasses: ['global'] }],
  },
  overrides: [
    {
      files: ['src/styles/tokens/**/*.css'],
      rules: { 'scale-unlimited/declaration-strict-value': null },
    },
  ],
};
