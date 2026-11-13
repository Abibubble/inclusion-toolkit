import { SETTINGS, SETTING_NAMES, STORAGE_KEY } from './displaySettings';

const ATTRIBUTES = Object.fromEntries(
  SETTING_NAMES.map((name) => {
    const { attribute, default: defaultValue, options } = SETTINGS[name];
    return [name, [attribute, defaultValue, options.map((option) => option.value)]];
  }),
);

/** How long after the page loads to wait for React, before showing the page as it is without JavaScript */
export const HYDRATION_WAIT_MS = 3000;

/**
 * Marks that JavaScript is running, so the narrow-screen menu can collapse behind its button, and
 * applies saved display settings before anything is drawn. If React still hasn't taken over a
 * while after the page loads, such as when its script fails to load, the mark is taken off again.
 * The page then shows as it does without JavaScript, with the menu's links always visible, so
 * nobody is left with a Menu button that does nothing
 */
export const BEFORE_PAINT_SCRIPT = `(function () {
  var root = document.documentElement;
  root.setAttribute('data-js', '');
  window.addEventListener('load', function () {
    setTimeout(function () {
      if (!root.hasAttribute('data-hydrated')) root.removeAttribute('data-js');
    }, ${String(HYDRATION_WAIT_MS)});
  });
  try {
    var saved = JSON.parse(localStorage.getItem(${JSON.stringify(STORAGE_KEY)}) || '{}');
    var settings = ${JSON.stringify(ATTRIBUTES)};
    for (var name in settings) {
      var value = saved[name];
      var setting = settings[name];
      if (value !== setting[1] && setting[2].indexOf(value) !== -1) {
        root.setAttribute(setting[0], value);
      }
    }
  } catch (error) {}
})();`;
