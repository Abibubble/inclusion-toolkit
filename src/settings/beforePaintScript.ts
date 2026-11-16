import { SETTINGS, SETTING_NAMES, STORAGE_KEY } from './displaySettings';

const SCRIPT_SETTINGS = Object.fromEntries(
  SETTING_NAMES.map((name) => {
    const { attribute, default: defaultValue, options } = SETTINGS[name];
    return [
      name,
      { attribute, default: defaultValue, values: options.map((option) => option.value) },
    ];
  }),
);

/** How long after load to wait for React, before showing the page as it is without JavaScript */
export const HYDRATION_WAIT_MS = 3000;

/**
 * Adds data-js so the narrow menu can collapse, and applies saved display settings before the first
 * paint. If React hasn't taken over soon after load, data-js comes off again, so the menu links
 * show instead of a Menu button that does nothing
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
    var settings = ${JSON.stringify(SCRIPT_SETTINGS)};
    for (var name in settings) {
      var value = saved[name];
      var setting = settings[name];
      if (value !== setting.default && setting.values.indexOf(value) !== -1) {
        root.setAttribute(setting.attribute, value);
      }
    }
  } catch (error) {}
})();`;
