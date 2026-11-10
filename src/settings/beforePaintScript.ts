import { SETTINGS, SETTING_NAMES, STORAGE_KEY } from './displaySettings';

const ATTRIBUTES = Object.fromEntries(
  SETTING_NAMES.map((name) => {
    const { attribute, default: defaultValue, options } = SETTINGS[name];
    return [name, [attribute, defaultValue, options.map((option) => option.value)]];
  }),
);

export const BEFORE_PAINT_SCRIPT = `(function () {
  var root = document.documentElement;
  root.setAttribute('data-js', '');
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
