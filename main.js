"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => SlasherPlugin
});
module.exports = __toCommonJS(main_exports);
var import_node_child_process = require("node:child_process");
var import_node_util = require("node:util");
var import_obsidian3 = require("obsidian");

// src/modals.ts
var import_obsidian = require("obsidian");
var DatePickerModal = class extends import_obsidian.Modal {
  onSubmit;
  constructor(app, onSubmit) {
    super(app);
    this.onSubmit = onSubmit;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "Pick a date" });
    const wrapper = contentEl.createDiv({ cls: "slasher-modal-grid" });
    const label = wrapper.createEl("label", { text: "Date" });
    const input = wrapper.createEl("input", { type: "date" });
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    input.value = today;
    label.appendChild(input);
    const actions = contentEl.createDiv({ cls: "slasher-modal-actions" });
    new import_obsidian.ButtonComponent(actions).setButtonText("Cancel").onClick(() => {
      this.onSubmit(null);
      this.close();
    });
    new import_obsidian.ButtonComponent(actions).setButtonText("Insert").setCta().onClick(() => {
      this.onSubmit(input.value ? /* @__PURE__ */ new Date(`${input.value}T00:00:00`) : null);
      this.close();
    });
    input.focus();
  }
  onClose() {
    this.contentEl.empty();
  }
};
var TemplateBuilderModal = class extends import_obsidian.Modal {
  onSubmit;
  constructor(app, onSubmit) {
    super(app);
    this.onSubmit = onSubmit;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "Add template snippet" });
    let snippetKind = "date";
    let dateToken = "today";
    let dateFormat = "yyyy-MM-dd";
    let replaceFrom = "replace";
    let replaceTo = "this";
    let commandBody = "ls -1 {{ vault_path }}";
    let vaultToken = "file_path";
    let pickerFormat = "yyyy-MM-dd";
    const form = contentEl.createDiv({ cls: "slasher-modal-grid" });
    const helperText = form.createEl("p", {
      cls: "slasher-settings-help",
      text: "The helper inserts a starter snippet into the Template field. You can edit it freely afterwards."
    });
    helperText.style.marginBottom = "0";
    const dynamicSection = form.createDiv();
    const renderFields = () => {
      dynamicSection.empty();
      new import_obsidian.Setting(dynamicSection).setName("Snippet type").setDesc("Choose the kind of snippet to generate.").addDropdown((dropdown) => {
        dropdown.addOption("date", "Date").addOption("clipboard", "Clipboard").addOption("command", "Command").addOption("vault", "Vault/File").addOption("date-picker", "Date Picker").setValue(snippetKind).onChange((value) => {
          snippetKind = value;
          renderFields();
        });
      });
      if (snippetKind === "date") {
        new import_obsidian.Setting(dynamicSection).setName("Date token").addDropdown((dropdown) => {
          dropdown.addOption("today", "today").addOption("tomorrow", "tomorrow").addOption("yesterday", "yesterday").addOption("file_creation_date", "file_creation_date").addOption("file_modification_date", "file_modification_date").setValue(dateToken).onChange((value) => {
            dateToken = value;
          });
        });
        new import_obsidian.Setting(dynamicSection).setName("Format").setDesc("Uses date-fns tokens. Use MM for month, not mm.").addText((text) => {
          text.setValue(dateFormat).onChange((value) => {
            dateFormat = value.trim() || "yyyy-MM-dd";
          });
        });
      }
      if (snippetKind === "clipboard") {
        new import_obsidian.Setting(dynamicSection).setName("Replace").setDesc("Used to build a starter replace_first filter. Regex replacements are also available in templates.").addText((text) => {
          text.setValue(replaceFrom).onChange((value) => {
            replaceFrom = value;
          });
        });
        new import_obsidian.Setting(dynamicSection).setName("With").addText((text) => {
          text.setValue(replaceTo).onChange((value) => {
            replaceTo = value;
          });
        });
      }
      if (snippetKind === "command") {
        new import_obsidian.Setting(dynamicSection).setName("Shell command").setDesc("You can include output tags like {{ vault_path }} inside the command body.").addText((text) => {
          text.setPlaceholder("ls -1 {{ vault_path }}").setValue(commandBody).onChange((value) => {
            commandBody = value;
          });
          text.inputEl.style.width = "100%";
        });
      }
      if (snippetKind === "vault") {
        new import_obsidian.Setting(dynamicSection).setName("Variable").addDropdown((dropdown) => {
          dropdown.addOption("file_path", "{{ file_path }}").addOption("file_name", "{{ file_name }}").addOption("file_stem", "{{ file_stem }}").addOption("folder_path", "{{ folder_path }}").addOption("vault_path", "{{ vault_path }}").addOption("vault_name", "{{ vault_name }}").setValue(vaultToken).onChange((value) => {
            vaultToken = value;
          });
        });
      }
      if (snippetKind === "date-picker") {
        new import_obsidian.Setting(dynamicSection).setName("Format").setDesc("Uses date-fns tokens with the date_picker format filter.").addText((text) => {
          text.setValue(pickerFormat).onChange((value) => {
            pickerFormat = value.trim() || "yyyy-MM-dd";
          });
        });
      }
    };
    renderFields();
    const actions = contentEl.createDiv({ cls: "slasher-modal-actions" });
    new import_obsidian.ButtonComponent(actions).setButtonText("Cancel").onClick(() => this.close());
    new import_obsidian.ButtonComponent(actions).setButtonText("Insert").setCta().onClick(() => {
      this.onSubmit(this.buildSnippet({
        commandBody,
        dateFormat,
        dateToken,
        pickerFormat,
        replaceFrom,
        replaceTo,
        snippetKind,
        vaultToken
      }));
      this.close();
    });
  }
  buildSnippet(values) {
    switch (values.snippetKind) {
      case "date":
        return `{{ ${values.dateToken} | format: "${escapeLiquidString(values.dateFormat)}" }}`;
      case "clipboard":
        return `{{ clipboard | replace_first: "${escapeLiquidString(values.replaceFrom)}", "${escapeLiquidString(values.replaceTo)}" }}`;
      case "command":
        return `{% command %}${values.commandBody || "ls -1 {{ vault_path }}"}{% endcommand %}`;
      case "vault":
        return `{{ ${values.vaultToken} }}`;
      case "date-picker":
        return `{{ date_picker | format: "${escapeLiquidString(values.pickerFormat)}" }}`;
      default:
        return '{{ today | format: "yyyy-MM-dd" }}';
    }
  }
  onClose() {
    this.contentEl.empty();
  }
};
function escapeLiquidString(value) {
  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

// src/settings.ts
var import_obsidian2 = require("obsidian");

// node_modules/date-fns/constants.js
var daysInYear = 365.2425;
var maxTime = Math.pow(10, 8) * 24 * 60 * 60 * 1e3;
var minTime = -maxTime;
var millisecondsInWeek = 6048e5;
var millisecondsInDay = 864e5;
var secondsInHour = 3600;
var secondsInDay = secondsInHour * 24;
var secondsInWeek = secondsInDay * 7;
var secondsInYear = secondsInDay * daysInYear;
var secondsInMonth = secondsInYear / 12;
var secondsInQuarter = secondsInMonth * 3;
var constructFromSymbol = Symbol.for("constructDateFrom");

// node_modules/date-fns/constructFrom.js
function constructFrom(date, value) {
  if (typeof date === "function") return date(value);
  if (date && typeof date === "object" && constructFromSymbol in date)
    return date[constructFromSymbol](value);
  if (date instanceof Date) return new date.constructor(value);
  return new Date(value);
}

// node_modules/date-fns/toDate.js
function toDate(argument, context) {
  return constructFrom(context || argument, argument);
}

// node_modules/date-fns/addDays.js
function addDays(date, amount, options) {
  const _date = toDate(date, options?.in);
  if (isNaN(amount)) return constructFrom(options?.in || date, NaN);
  if (!amount) return _date;
  _date.setDate(_date.getDate() + amount);
  return _date;
}

// node_modules/date-fns/_lib/defaultOptions.js
var defaultOptions = {};
function getDefaultOptions() {
  return defaultOptions;
}

// node_modules/date-fns/startOfWeek.js
function startOfWeek(date, options) {
  const defaultOptions2 = getDefaultOptions();
  const weekStartsOn = options?.weekStartsOn ?? options?.locale?.options?.weekStartsOn ?? defaultOptions2.weekStartsOn ?? defaultOptions2.locale?.options?.weekStartsOn ?? 0;
  const _date = toDate(date, options?.in);
  const day = _date.getDay();
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  _date.setDate(_date.getDate() - diff);
  _date.setHours(0, 0, 0, 0);
  return _date;
}

// node_modules/date-fns/startOfISOWeek.js
function startOfISOWeek(date, options) {
  return startOfWeek(date, { ...options, weekStartsOn: 1 });
}

// node_modules/date-fns/getISOWeekYear.js
function getISOWeekYear(date, options) {
  const _date = toDate(date, options?.in);
  const year = _date.getFullYear();
  const fourthOfJanuaryOfNextYear = constructFrom(_date, 0);
  fourthOfJanuaryOfNextYear.setFullYear(year + 1, 0, 4);
  fourthOfJanuaryOfNextYear.setHours(0, 0, 0, 0);
  const startOfNextYear = startOfISOWeek(fourthOfJanuaryOfNextYear);
  const fourthOfJanuaryOfThisYear = constructFrom(_date, 0);
  fourthOfJanuaryOfThisYear.setFullYear(year, 0, 4);
  fourthOfJanuaryOfThisYear.setHours(0, 0, 0, 0);
  const startOfThisYear = startOfISOWeek(fourthOfJanuaryOfThisYear);
  if (_date.getTime() >= startOfNextYear.getTime()) {
    return year + 1;
  } else if (_date.getTime() >= startOfThisYear.getTime()) {
    return year;
  } else {
    return year - 1;
  }
}

// node_modules/date-fns/_lib/getTimezoneOffsetInMilliseconds.js
function getTimezoneOffsetInMilliseconds(date) {
  const _date = toDate(date);
  const utcDate = new Date(
    Date.UTC(
      _date.getFullYear(),
      _date.getMonth(),
      _date.getDate(),
      _date.getHours(),
      _date.getMinutes(),
      _date.getSeconds(),
      _date.getMilliseconds()
    )
  );
  utcDate.setUTCFullYear(_date.getFullYear());
  return +date - +utcDate;
}

// node_modules/date-fns/_lib/normalizeDates.js
function normalizeDates(context, ...dates) {
  const normalize = constructFrom.bind(
    null,
    context || dates.find((date) => typeof date === "object")
  );
  return dates.map(normalize);
}

// node_modules/date-fns/startOfDay.js
function startOfDay(date, options) {
  const _date = toDate(date, options?.in);
  _date.setHours(0, 0, 0, 0);
  return _date;
}

// node_modules/date-fns/differenceInCalendarDays.js
function differenceInCalendarDays(laterDate, earlierDate, options) {
  const [laterDate_, earlierDate_] = normalizeDates(
    options?.in,
    laterDate,
    earlierDate
  );
  const laterStartOfDay = startOfDay(laterDate_);
  const earlierStartOfDay = startOfDay(earlierDate_);
  const laterTimestamp = +laterStartOfDay - getTimezoneOffsetInMilliseconds(laterStartOfDay);
  const earlierTimestamp = +earlierStartOfDay - getTimezoneOffsetInMilliseconds(earlierStartOfDay);
  return Math.round((laterTimestamp - earlierTimestamp) / millisecondsInDay);
}

// node_modules/date-fns/startOfISOWeekYear.js
function startOfISOWeekYear(date, options) {
  const year = getISOWeekYear(date, options);
  const fourthOfJanuary = constructFrom(options?.in || date, 0);
  fourthOfJanuary.setFullYear(year, 0, 4);
  fourthOfJanuary.setHours(0, 0, 0, 0);
  return startOfISOWeek(fourthOfJanuary);
}

// node_modules/date-fns/isDate.js
function isDate(value) {
  return value instanceof Date || typeof value === "object" && Object.prototype.toString.call(value) === "[object Date]";
}

// node_modules/date-fns/isValid.js
function isValid(date) {
  return !(!isDate(date) && typeof date !== "number" || isNaN(+toDate(date)));
}

// node_modules/date-fns/startOfYear.js
function startOfYear(date, options) {
  const date_ = toDate(date, options?.in);
  date_.setFullYear(date_.getFullYear(), 0, 1);
  date_.setHours(0, 0, 0, 0);
  return date_;
}

// node_modules/date-fns/locale/en-US/_lib/formatDistance.js
var formatDistanceLocale = {
  lessThanXSeconds: {
    one: "less than a second",
    other: "less than {{count}} seconds"
  },
  xSeconds: {
    one: "1 second",
    other: "{{count}} seconds"
  },
  halfAMinute: "half a minute",
  lessThanXMinutes: {
    one: "less than a minute",
    other: "less than {{count}} minutes"
  },
  xMinutes: {
    one: "1 minute",
    other: "{{count}} minutes"
  },
  aboutXHours: {
    one: "about 1 hour",
    other: "about {{count}} hours"
  },
  xHours: {
    one: "1 hour",
    other: "{{count}} hours"
  },
  xDays: {
    one: "1 day",
    other: "{{count}} days"
  },
  aboutXWeeks: {
    one: "about 1 week",
    other: "about {{count}} weeks"
  },
  xWeeks: {
    one: "1 week",
    other: "{{count}} weeks"
  },
  aboutXMonths: {
    one: "about 1 month",
    other: "about {{count}} months"
  },
  xMonths: {
    one: "1 month",
    other: "{{count}} months"
  },
  aboutXYears: {
    one: "about 1 year",
    other: "about {{count}} years"
  },
  xYears: {
    one: "1 year",
    other: "{{count}} years"
  },
  overXYears: {
    one: "over 1 year",
    other: "over {{count}} years"
  },
  almostXYears: {
    one: "almost 1 year",
    other: "almost {{count}} years"
  }
};
var formatDistance = (token, count, options) => {
  let result;
  const tokenValue = formatDistanceLocale[token];
  if (typeof tokenValue === "string") {
    result = tokenValue;
  } else if (count === 1) {
    result = tokenValue.one;
  } else {
    result = tokenValue.other.replace("{{count}}", count.toString());
  }
  if (options?.addSuffix) {
    if (options.comparison && options.comparison > 0) {
      return "in " + result;
    } else {
      return result + " ago";
    }
  }
  return result;
};

// node_modules/date-fns/locale/_lib/buildFormatLongFn.js
function buildFormatLongFn(args) {
  return (options = {}) => {
    const width = options.width ? String(options.width) : args.defaultWidth;
    const format2 = args.formats[width] || args.formats[args.defaultWidth];
    return format2;
  };
}

// node_modules/date-fns/locale/en-US/_lib/formatLong.js
var dateFormats = {
  full: "EEEE, MMMM do, y",
  long: "MMMM do, y",
  medium: "MMM d, y",
  short: "MM/dd/yyyy"
};
var timeFormats = {
  full: "h:mm:ss a zzzz",
  long: "h:mm:ss a z",
  medium: "h:mm:ss a",
  short: "h:mm a"
};
var dateTimeFormats = {
  full: "{{date}} 'at' {{time}}",
  long: "{{date}} 'at' {{time}}",
  medium: "{{date}}, {{time}}",
  short: "{{date}}, {{time}}"
};
var formatLong = {
  date: buildFormatLongFn({
    formats: dateFormats,
    defaultWidth: "full"
  }),
  time: buildFormatLongFn({
    formats: timeFormats,
    defaultWidth: "full"
  }),
  dateTime: buildFormatLongFn({
    formats: dateTimeFormats,
    defaultWidth: "full"
  })
};

// node_modules/date-fns/locale/en-US/_lib/formatRelative.js
var formatRelativeLocale = {
  lastWeek: "'last' eeee 'at' p",
  yesterday: "'yesterday at' p",
  today: "'today at' p",
  tomorrow: "'tomorrow at' p",
  nextWeek: "eeee 'at' p",
  other: "P"
};
var formatRelative = (token, _date, _baseDate, _options) => formatRelativeLocale[token];

// node_modules/date-fns/locale/_lib/buildLocalizeFn.js
function buildLocalizeFn(args) {
  return (value, options) => {
    const context = options?.context ? String(options.context) : "standalone";
    let valuesArray;
    if (context === "formatting" && args.formattingValues) {
      const defaultWidth = args.defaultFormattingWidth || args.defaultWidth;
      const width = options?.width ? String(options.width) : defaultWidth;
      valuesArray = args.formattingValues[width] || args.formattingValues[defaultWidth];
    } else {
      const defaultWidth = args.defaultWidth;
      const width = options?.width ? String(options.width) : args.defaultWidth;
      valuesArray = args.values[width] || args.values[defaultWidth];
    }
    const index = args.argumentCallback ? args.argumentCallback(value) : value;
    return valuesArray[index];
  };
}

// node_modules/date-fns/locale/en-US/_lib/localize.js
var eraValues = {
  narrow: ["B", "A"],
  abbreviated: ["BC", "AD"],
  wide: ["Before Christ", "Anno Domini"]
};
var quarterValues = {
  narrow: ["1", "2", "3", "4"],
  abbreviated: ["Q1", "Q2", "Q3", "Q4"],
  wide: ["1st quarter", "2nd quarter", "3rd quarter", "4th quarter"]
};
var monthValues = {
  narrow: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"],
  abbreviated: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ],
  wide: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ]
};
var dayValues = {
  narrow: ["S", "M", "T", "W", "T", "F", "S"],
  short: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
  abbreviated: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  wide: [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ]
};
var dayPeriodValues = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "mi",
    noon: "n",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "midnight",
    noon: "noon",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night"
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "midnight",
    noon: "noon",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night"
  }
};
var formattingDayPeriodValues = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "mi",
    noon: "n",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "midnight",
    noon: "noon",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night"
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "midnight",
    noon: "noon",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night"
  }
};
var ordinalNumber = (dirtyNumber, _options) => {
  const number = Number(dirtyNumber);
  const rem100 = number % 100;
  if (rem100 > 20 || rem100 < 10) {
    switch (rem100 % 10) {
      case 1:
        return number + "st";
      case 2:
        return number + "nd";
      case 3:
        return number + "rd";
    }
  }
  return number + "th";
};
var localize = {
  ordinalNumber,
  era: buildLocalizeFn({
    values: eraValues,
    defaultWidth: "wide"
  }),
  quarter: buildLocalizeFn({
    values: quarterValues,
    defaultWidth: "wide",
    argumentCallback: (quarter) => quarter - 1
  }),
  month: buildLocalizeFn({
    values: monthValues,
    defaultWidth: "wide"
  }),
  day: buildLocalizeFn({
    values: dayValues,
    defaultWidth: "wide"
  }),
  dayPeriod: buildLocalizeFn({
    values: dayPeriodValues,
    defaultWidth: "wide",
    formattingValues: formattingDayPeriodValues,
    defaultFormattingWidth: "wide"
  })
};

// node_modules/date-fns/locale/_lib/buildMatchFn.js
function buildMatchFn(args) {
  return (string, options = {}) => {
    const width = options.width;
    const matchPattern = width && args.matchPatterns[width] || args.matchPatterns[args.defaultMatchWidth];
    const matchResult = string.match(matchPattern);
    if (!matchResult) {
      return null;
    }
    const matchedString = matchResult[0];
    const parsePatterns = width && args.parsePatterns[width] || args.parsePatterns[args.defaultParseWidth];
    const key = Array.isArray(parsePatterns) ? findIndex(parsePatterns, (pattern) => pattern.test(matchedString)) : (
      // [TODO] -- I challenge you to fix the type
      findKey(parsePatterns, (pattern) => pattern.test(matchedString))
    );
    let value;
    value = args.valueCallback ? args.valueCallback(key) : key;
    value = options.valueCallback ? (
      // [TODO] -- I challenge you to fix the type
      options.valueCallback(value)
    ) : value;
    const rest = string.slice(matchedString.length);
    return { value, rest };
  };
}
function findKey(object, predicate) {
  for (const key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key) && predicate(object[key])) {
      return key;
    }
  }
  return void 0;
}
function findIndex(array, predicate) {
  for (let key = 0; key < array.length; key++) {
    if (predicate(array[key])) {
      return key;
    }
  }
  return void 0;
}

// node_modules/date-fns/locale/_lib/buildMatchPatternFn.js
function buildMatchPatternFn(args) {
  return (string, options = {}) => {
    const matchResult = string.match(args.matchPattern);
    if (!matchResult) return null;
    const matchedString = matchResult[0];
    const parseResult = string.match(args.parsePattern);
    if (!parseResult) return null;
    let value = args.valueCallback ? args.valueCallback(parseResult[0]) : parseResult[0];
    value = options.valueCallback ? options.valueCallback(value) : value;
    const rest = string.slice(matchedString.length);
    return { value, rest };
  };
}

// node_modules/date-fns/locale/en-US/_lib/match.js
var matchOrdinalNumberPattern = /^(\d+)(th|st|nd|rd)?/i;
var parseOrdinalNumberPattern = /\d+/i;
var matchEraPatterns = {
  narrow: /^(b|a)/i,
  abbreviated: /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
  wide: /^(before christ|before common era|anno domini|common era)/i
};
var parseEraPatterns = {
  any: [/^b/i, /^(a|c)/i]
};
var matchQuarterPatterns = {
  narrow: /^[1234]/i,
  abbreviated: /^q[1234]/i,
  wide: /^[1234](th|st|nd|rd)? quarter/i
};
var parseQuarterPatterns = {
  any: [/1/i, /2/i, /3/i, /4/i]
};
var matchMonthPatterns = {
  narrow: /^[jfmasond]/i,
  abbreviated: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
  wide: /^(january|february|march|april|may|june|july|august|september|october|november|december)/i
};
var parseMonthPatterns = {
  narrow: [
    /^j/i,
    /^f/i,
    /^m/i,
    /^a/i,
    /^m/i,
    /^j/i,
    /^j/i,
    /^a/i,
    /^s/i,
    /^o/i,
    /^n/i,
    /^d/i
  ],
  any: [
    /^ja/i,
    /^f/i,
    /^mar/i,
    /^ap/i,
    /^may/i,
    /^jun/i,
    /^jul/i,
    /^au/i,
    /^s/i,
    /^o/i,
    /^n/i,
    /^d/i
  ]
};
var matchDayPatterns = {
  narrow: /^[smtwf]/i,
  short: /^(su|mo|tu|we|th|fr|sa)/i,
  abbreviated: /^(sun|mon|tue|wed|thu|fri|sat)/i,
  wide: /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i
};
var parseDayPatterns = {
  narrow: [/^s/i, /^m/i, /^t/i, /^w/i, /^t/i, /^f/i, /^s/i],
  any: [/^su/i, /^m/i, /^tu/i, /^w/i, /^th/i, /^f/i, /^sa/i]
};
var matchDayPeriodPatterns = {
  narrow: /^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
  any: /^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i
};
var parseDayPeriodPatterns = {
  any: {
    am: /^a/i,
    pm: /^p/i,
    midnight: /^mi/i,
    noon: /^no/i,
    morning: /morning/i,
    afternoon: /afternoon/i,
    evening: /evening/i,
    night: /night/i
  }
};
var match = {
  ordinalNumber: buildMatchPatternFn({
    matchPattern: matchOrdinalNumberPattern,
    parsePattern: parseOrdinalNumberPattern,
    valueCallback: (value) => parseInt(value, 10)
  }),
  era: buildMatchFn({
    matchPatterns: matchEraPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseEraPatterns,
    defaultParseWidth: "any"
  }),
  quarter: buildMatchFn({
    matchPatterns: matchQuarterPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseQuarterPatterns,
    defaultParseWidth: "any",
    valueCallback: (index) => index + 1
  }),
  month: buildMatchFn({
    matchPatterns: matchMonthPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseMonthPatterns,
    defaultParseWidth: "any"
  }),
  day: buildMatchFn({
    matchPatterns: matchDayPatterns,
    defaultMatchWidth: "wide",
    parsePatterns: parseDayPatterns,
    defaultParseWidth: "any"
  }),
  dayPeriod: buildMatchFn({
    matchPatterns: matchDayPeriodPatterns,
    defaultMatchWidth: "any",
    parsePatterns: parseDayPeriodPatterns,
    defaultParseWidth: "any"
  })
};

// node_modules/date-fns/locale/en-US.js
var enUS = {
  code: "en-US",
  formatDistance,
  formatLong,
  formatRelative,
  localize,
  match,
  options: {
    weekStartsOn: 0,
    firstWeekContainsDate: 1
  }
};

// node_modules/date-fns/getDayOfYear.js
function getDayOfYear(date, options) {
  const _date = toDate(date, options?.in);
  const diff = differenceInCalendarDays(_date, startOfYear(_date));
  const dayOfYear = diff + 1;
  return dayOfYear;
}

// node_modules/date-fns/getISOWeek.js
function getISOWeek(date, options) {
  const _date = toDate(date, options?.in);
  const diff = +startOfISOWeek(_date) - +startOfISOWeekYear(_date);
  return Math.round(diff / millisecondsInWeek) + 1;
}

// node_modules/date-fns/getWeekYear.js
function getWeekYear(date, options) {
  const _date = toDate(date, options?.in);
  const year = _date.getFullYear();
  const defaultOptions2 = getDefaultOptions();
  const firstWeekContainsDate = options?.firstWeekContainsDate ?? options?.locale?.options?.firstWeekContainsDate ?? defaultOptions2.firstWeekContainsDate ?? defaultOptions2.locale?.options?.firstWeekContainsDate ?? 1;
  const firstWeekOfNextYear = constructFrom(options?.in || date, 0);
  firstWeekOfNextYear.setFullYear(year + 1, 0, firstWeekContainsDate);
  firstWeekOfNextYear.setHours(0, 0, 0, 0);
  const startOfNextYear = startOfWeek(firstWeekOfNextYear, options);
  const firstWeekOfThisYear = constructFrom(options?.in || date, 0);
  firstWeekOfThisYear.setFullYear(year, 0, firstWeekContainsDate);
  firstWeekOfThisYear.setHours(0, 0, 0, 0);
  const startOfThisYear = startOfWeek(firstWeekOfThisYear, options);
  if (+_date >= +startOfNextYear) {
    return year + 1;
  } else if (+_date >= +startOfThisYear) {
    return year;
  } else {
    return year - 1;
  }
}

// node_modules/date-fns/startOfWeekYear.js
function startOfWeekYear(date, options) {
  const defaultOptions2 = getDefaultOptions();
  const firstWeekContainsDate = options?.firstWeekContainsDate ?? options?.locale?.options?.firstWeekContainsDate ?? defaultOptions2.firstWeekContainsDate ?? defaultOptions2.locale?.options?.firstWeekContainsDate ?? 1;
  const year = getWeekYear(date, options);
  const firstWeek = constructFrom(options?.in || date, 0);
  firstWeek.setFullYear(year, 0, firstWeekContainsDate);
  firstWeek.setHours(0, 0, 0, 0);
  const _date = startOfWeek(firstWeek, options);
  return _date;
}

// node_modules/date-fns/getWeek.js
function getWeek(date, options) {
  const _date = toDate(date, options?.in);
  const diff = +startOfWeek(_date, options) - +startOfWeekYear(_date, options);
  return Math.round(diff / millisecondsInWeek) + 1;
}

// node_modules/date-fns/_lib/addLeadingZeros.js
function addLeadingZeros(number, targetLength) {
  const sign = number < 0 ? "-" : "";
  const output = Math.abs(number).toString().padStart(targetLength, "0");
  return sign + output;
}

// node_modules/date-fns/_lib/format/lightFormatters.js
var lightFormatters = {
  // Year
  y(date, token) {
    const signedYear = date.getFullYear();
    const year = signedYear > 0 ? signedYear : 1 - signedYear;
    return addLeadingZeros(token === "yy" ? year % 100 : year, token.length);
  },
  // Month
  M(date, token) {
    const month = date.getMonth();
    return token === "M" ? String(month + 1) : addLeadingZeros(month + 1, 2);
  },
  // Day of the month
  d(date, token) {
    return addLeadingZeros(date.getDate(), token.length);
  },
  // AM or PM
  a(date, token) {
    const dayPeriodEnumValue = date.getHours() / 12 >= 1 ? "pm" : "am";
    switch (token) {
      case "a":
      case "aa":
        return dayPeriodEnumValue.toUpperCase();
      case "aaa":
        return dayPeriodEnumValue;
      case "aaaaa":
        return dayPeriodEnumValue[0];
      case "aaaa":
      default:
        return dayPeriodEnumValue === "am" ? "a.m." : "p.m.";
    }
  },
  // Hour [1-12]
  h(date, token) {
    return addLeadingZeros(date.getHours() % 12 || 12, token.length);
  },
  // Hour [0-23]
  H(date, token) {
    return addLeadingZeros(date.getHours(), token.length);
  },
  // Minute
  m(date, token) {
    return addLeadingZeros(date.getMinutes(), token.length);
  },
  // Second
  s(date, token) {
    return addLeadingZeros(date.getSeconds(), token.length);
  },
  // Fraction of second
  S(date, token) {
    const numberOfDigits = token.length;
    const milliseconds = date.getMilliseconds();
    const fractionalSeconds = Math.trunc(
      milliseconds * Math.pow(10, numberOfDigits - 3)
    );
    return addLeadingZeros(fractionalSeconds, token.length);
  }
};

// node_modules/date-fns/_lib/format/formatters.js
var dayPeriodEnum = {
  am: "am",
  pm: "pm",
  midnight: "midnight",
  noon: "noon",
  morning: "morning",
  afternoon: "afternoon",
  evening: "evening",
  night: "night"
};
var formatters = {
  // Era
  G: function(date, token, localize2) {
    const era = date.getFullYear() > 0 ? 1 : 0;
    switch (token) {
      // AD, BC
      case "G":
      case "GG":
      case "GGG":
        return localize2.era(era, { width: "abbreviated" });
      // A, B
      case "GGGGG":
        return localize2.era(era, { width: "narrow" });
      // Anno Domini, Before Christ
      case "GGGG":
      default:
        return localize2.era(era, { width: "wide" });
    }
  },
  // Year
  y: function(date, token, localize2) {
    if (token === "yo") {
      const signedYear = date.getFullYear();
      const year = signedYear > 0 ? signedYear : 1 - signedYear;
      return localize2.ordinalNumber(year, { unit: "year" });
    }
    return lightFormatters.y(date, token);
  },
  // Local week-numbering year
  Y: function(date, token, localize2, options) {
    const signedWeekYear = getWeekYear(date, options);
    const weekYear = signedWeekYear > 0 ? signedWeekYear : 1 - signedWeekYear;
    if (token === "YY") {
      const twoDigitYear = weekYear % 100;
      return addLeadingZeros(twoDigitYear, 2);
    }
    if (token === "Yo") {
      return localize2.ordinalNumber(weekYear, { unit: "year" });
    }
    return addLeadingZeros(weekYear, token.length);
  },
  // ISO week-numbering year
  R: function(date, token) {
    const isoWeekYear = getISOWeekYear(date);
    return addLeadingZeros(isoWeekYear, token.length);
  },
  // Extended year. This is a single number designating the year of this calendar system.
  // The main difference between `y` and `u` localizers are B.C. years:
  // | Year | `y` | `u` |
  // |------|-----|-----|
  // | AC 1 |   1 |   1 |
  // | BC 1 |   1 |   0 |
  // | BC 2 |   2 |  -1 |
  // Also `yy` always returns the last two digits of a year,
  // while `uu` pads single digit years to 2 characters and returns other years unchanged.
  u: function(date, token) {
    const year = date.getFullYear();
    return addLeadingZeros(year, token.length);
  },
  // Quarter
  Q: function(date, token, localize2) {
    const quarter = Math.ceil((date.getMonth() + 1) / 3);
    switch (token) {
      // 1, 2, 3, 4
      case "Q":
        return String(quarter);
      // 01, 02, 03, 04
      case "QQ":
        return addLeadingZeros(quarter, 2);
      // 1st, 2nd, 3rd, 4th
      case "Qo":
        return localize2.ordinalNumber(quarter, { unit: "quarter" });
      // Q1, Q2, Q3, Q4
      case "QQQ":
        return localize2.quarter(quarter, {
          width: "abbreviated",
          context: "formatting"
        });
      // 1, 2, 3, 4 (narrow quarter; could be not numerical)
      case "QQQQQ":
        return localize2.quarter(quarter, {
          width: "narrow",
          context: "formatting"
        });
      // 1st quarter, 2nd quarter, ...
      case "QQQQ":
      default:
        return localize2.quarter(quarter, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // Stand-alone quarter
  q: function(date, token, localize2) {
    const quarter = Math.ceil((date.getMonth() + 1) / 3);
    switch (token) {
      // 1, 2, 3, 4
      case "q":
        return String(quarter);
      // 01, 02, 03, 04
      case "qq":
        return addLeadingZeros(quarter, 2);
      // 1st, 2nd, 3rd, 4th
      case "qo":
        return localize2.ordinalNumber(quarter, { unit: "quarter" });
      // Q1, Q2, Q3, Q4
      case "qqq":
        return localize2.quarter(quarter, {
          width: "abbreviated",
          context: "standalone"
        });
      // 1, 2, 3, 4 (narrow quarter; could be not numerical)
      case "qqqqq":
        return localize2.quarter(quarter, {
          width: "narrow",
          context: "standalone"
        });
      // 1st quarter, 2nd quarter, ...
      case "qqqq":
      default:
        return localize2.quarter(quarter, {
          width: "wide",
          context: "standalone"
        });
    }
  },
  // Month
  M: function(date, token, localize2) {
    const month = date.getMonth();
    switch (token) {
      case "M":
      case "MM":
        return lightFormatters.M(date, token);
      // 1st, 2nd, ..., 12th
      case "Mo":
        return localize2.ordinalNumber(month + 1, { unit: "month" });
      // Jan, Feb, ..., Dec
      case "MMM":
        return localize2.month(month, {
          width: "abbreviated",
          context: "formatting"
        });
      // J, F, ..., D
      case "MMMMM":
        return localize2.month(month, {
          width: "narrow",
          context: "formatting"
        });
      // January, February, ..., December
      case "MMMM":
      default:
        return localize2.month(month, { width: "wide", context: "formatting" });
    }
  },
  // Stand-alone month
  L: function(date, token, localize2) {
    const month = date.getMonth();
    switch (token) {
      // 1, 2, ..., 12
      case "L":
        return String(month + 1);
      // 01, 02, ..., 12
      case "LL":
        return addLeadingZeros(month + 1, 2);
      // 1st, 2nd, ..., 12th
      case "Lo":
        return localize2.ordinalNumber(month + 1, { unit: "month" });
      // Jan, Feb, ..., Dec
      case "LLL":
        return localize2.month(month, {
          width: "abbreviated",
          context: "standalone"
        });
      // J, F, ..., D
      case "LLLLL":
        return localize2.month(month, {
          width: "narrow",
          context: "standalone"
        });
      // January, February, ..., December
      case "LLLL":
      default:
        return localize2.month(month, { width: "wide", context: "standalone" });
    }
  },
  // Local week of year
  w: function(date, token, localize2, options) {
    const week = getWeek(date, options);
    if (token === "wo") {
      return localize2.ordinalNumber(week, { unit: "week" });
    }
    return addLeadingZeros(week, token.length);
  },
  // ISO week of year
  I: function(date, token, localize2) {
    const isoWeek = getISOWeek(date);
    if (token === "Io") {
      return localize2.ordinalNumber(isoWeek, { unit: "week" });
    }
    return addLeadingZeros(isoWeek, token.length);
  },
  // Day of the month
  d: function(date, token, localize2) {
    if (token === "do") {
      return localize2.ordinalNumber(date.getDate(), { unit: "date" });
    }
    return lightFormatters.d(date, token);
  },
  // Day of year
  D: function(date, token, localize2) {
    const dayOfYear = getDayOfYear(date);
    if (token === "Do") {
      return localize2.ordinalNumber(dayOfYear, { unit: "dayOfYear" });
    }
    return addLeadingZeros(dayOfYear, token.length);
  },
  // Day of week
  E: function(date, token, localize2) {
    const dayOfWeek = date.getDay();
    switch (token) {
      // Tue
      case "E":
      case "EE":
      case "EEE":
        return localize2.day(dayOfWeek, {
          width: "abbreviated",
          context: "formatting"
        });
      // T
      case "EEEEE":
        return localize2.day(dayOfWeek, {
          width: "narrow",
          context: "formatting"
        });
      // Tu
      case "EEEEEE":
        return localize2.day(dayOfWeek, {
          width: "short",
          context: "formatting"
        });
      // Tuesday
      case "EEEE":
      default:
        return localize2.day(dayOfWeek, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // Local day of week
  e: function(date, token, localize2, options) {
    const dayOfWeek = date.getDay();
    const localDayOfWeek = (dayOfWeek - options.weekStartsOn + 8) % 7 || 7;
    switch (token) {
      // Numerical value (Nth day of week with current locale or weekStartsOn)
      case "e":
        return String(localDayOfWeek);
      // Padded numerical value
      case "ee":
        return addLeadingZeros(localDayOfWeek, 2);
      // 1st, 2nd, ..., 7th
      case "eo":
        return localize2.ordinalNumber(localDayOfWeek, { unit: "day" });
      case "eee":
        return localize2.day(dayOfWeek, {
          width: "abbreviated",
          context: "formatting"
        });
      // T
      case "eeeee":
        return localize2.day(dayOfWeek, {
          width: "narrow",
          context: "formatting"
        });
      // Tu
      case "eeeeee":
        return localize2.day(dayOfWeek, {
          width: "short",
          context: "formatting"
        });
      // Tuesday
      case "eeee":
      default:
        return localize2.day(dayOfWeek, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // Stand-alone local day of week
  c: function(date, token, localize2, options) {
    const dayOfWeek = date.getDay();
    const localDayOfWeek = (dayOfWeek - options.weekStartsOn + 8) % 7 || 7;
    switch (token) {
      // Numerical value (same as in `e`)
      case "c":
        return String(localDayOfWeek);
      // Padded numerical value
      case "cc":
        return addLeadingZeros(localDayOfWeek, token.length);
      // 1st, 2nd, ..., 7th
      case "co":
        return localize2.ordinalNumber(localDayOfWeek, { unit: "day" });
      case "ccc":
        return localize2.day(dayOfWeek, {
          width: "abbreviated",
          context: "standalone"
        });
      // T
      case "ccccc":
        return localize2.day(dayOfWeek, {
          width: "narrow",
          context: "standalone"
        });
      // Tu
      case "cccccc":
        return localize2.day(dayOfWeek, {
          width: "short",
          context: "standalone"
        });
      // Tuesday
      case "cccc":
      default:
        return localize2.day(dayOfWeek, {
          width: "wide",
          context: "standalone"
        });
    }
  },
  // ISO day of week
  i: function(date, token, localize2) {
    const dayOfWeek = date.getDay();
    const isoDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
    switch (token) {
      // 2
      case "i":
        return String(isoDayOfWeek);
      // 02
      case "ii":
        return addLeadingZeros(isoDayOfWeek, token.length);
      // 2nd
      case "io":
        return localize2.ordinalNumber(isoDayOfWeek, { unit: "day" });
      // Tue
      case "iii":
        return localize2.day(dayOfWeek, {
          width: "abbreviated",
          context: "formatting"
        });
      // T
      case "iiiii":
        return localize2.day(dayOfWeek, {
          width: "narrow",
          context: "formatting"
        });
      // Tu
      case "iiiiii":
        return localize2.day(dayOfWeek, {
          width: "short",
          context: "formatting"
        });
      // Tuesday
      case "iiii":
      default:
        return localize2.day(dayOfWeek, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // AM or PM
  a: function(date, token, localize2) {
    const hours = date.getHours();
    const dayPeriodEnumValue = hours / 12 >= 1 ? "pm" : "am";
    switch (token) {
      case "a":
      case "aa":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting"
        });
      case "aaa":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting"
        }).toLowerCase();
      case "aaaaa":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "narrow",
          context: "formatting"
        });
      case "aaaa":
      default:
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // AM, PM, midnight, noon
  b: function(date, token, localize2) {
    const hours = date.getHours();
    let dayPeriodEnumValue;
    if (hours === 12) {
      dayPeriodEnumValue = dayPeriodEnum.noon;
    } else if (hours === 0) {
      dayPeriodEnumValue = dayPeriodEnum.midnight;
    } else {
      dayPeriodEnumValue = hours / 12 >= 1 ? "pm" : "am";
    }
    switch (token) {
      case "b":
      case "bb":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting"
        });
      case "bbb":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting"
        }).toLowerCase();
      case "bbbbb":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "narrow",
          context: "formatting"
        });
      case "bbbb":
      default:
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // in the morning, in the afternoon, in the evening, at night
  B: function(date, token, localize2) {
    const hours = date.getHours();
    let dayPeriodEnumValue;
    if (hours >= 17) {
      dayPeriodEnumValue = dayPeriodEnum.evening;
    } else if (hours >= 12) {
      dayPeriodEnumValue = dayPeriodEnum.afternoon;
    } else if (hours >= 4) {
      dayPeriodEnumValue = dayPeriodEnum.morning;
    } else {
      dayPeriodEnumValue = dayPeriodEnum.night;
    }
    switch (token) {
      case "B":
      case "BB":
      case "BBB":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "abbreviated",
          context: "formatting"
        });
      case "BBBBB":
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "narrow",
          context: "formatting"
        });
      case "BBBB":
      default:
        return localize2.dayPeriod(dayPeriodEnumValue, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // Hour [1-12]
  h: function(date, token, localize2) {
    if (token === "ho") {
      let hours = date.getHours() % 12;
      if (hours === 0) hours = 12;
      return localize2.ordinalNumber(hours, { unit: "hour" });
    }
    return lightFormatters.h(date, token);
  },
  // Hour [0-23]
  H: function(date, token, localize2) {
    if (token === "Ho") {
      return localize2.ordinalNumber(date.getHours(), { unit: "hour" });
    }
    return lightFormatters.H(date, token);
  },
  // Hour [0-11]
  K: function(date, token, localize2) {
    const hours = date.getHours() % 12;
    if (token === "Ko") {
      return localize2.ordinalNumber(hours, { unit: "hour" });
    }
    return addLeadingZeros(hours, token.length);
  },
  // Hour [1-24]
  k: function(date, token, localize2) {
    let hours = date.getHours();
    if (hours === 0) hours = 24;
    if (token === "ko") {
      return localize2.ordinalNumber(hours, { unit: "hour" });
    }
    return addLeadingZeros(hours, token.length);
  },
  // Minute
  m: function(date, token, localize2) {
    if (token === "mo") {
      return localize2.ordinalNumber(date.getMinutes(), { unit: "minute" });
    }
    return lightFormatters.m(date, token);
  },
  // Second
  s: function(date, token, localize2) {
    if (token === "so") {
      return localize2.ordinalNumber(date.getSeconds(), { unit: "second" });
    }
    return lightFormatters.s(date, token);
  },
  // Fraction of second
  S: function(date, token) {
    return lightFormatters.S(date, token);
  },
  // Timezone (ISO-8601. If offset is 0, output is always `'Z'`)
  X: function(date, token, _localize) {
    const timezoneOffset = date.getTimezoneOffset();
    if (timezoneOffset === 0) {
      return "Z";
    }
    switch (token) {
      // Hours and optional minutes
      case "X":
        return formatTimezoneWithOptionalMinutes(timezoneOffset);
      // Hours, minutes and optional seconds without `:` delimiter
      // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
      // so this token always has the same output as `XX`
      case "XXXX":
      case "XX":
        return formatTimezone(timezoneOffset);
      // Hours, minutes and optional seconds with `:` delimiter
      // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
      // so this token always has the same output as `XXX`
      case "XXXXX":
      case "XXX":
      // Hours and minutes with `:` delimiter
      default:
        return formatTimezone(timezoneOffset, ":");
    }
  },
  // Timezone (ISO-8601. If offset is 0, output is `'+00:00'` or equivalent)
  x: function(date, token, _localize) {
    const timezoneOffset = date.getTimezoneOffset();
    switch (token) {
      // Hours and optional minutes
      case "x":
        return formatTimezoneWithOptionalMinutes(timezoneOffset);
      // Hours, minutes and optional seconds without `:` delimiter
      // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
      // so this token always has the same output as `xx`
      case "xxxx":
      case "xx":
        return formatTimezone(timezoneOffset);
      // Hours, minutes and optional seconds with `:` delimiter
      // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
      // so this token always has the same output as `xxx`
      case "xxxxx":
      case "xxx":
      // Hours and minutes with `:` delimiter
      default:
        return formatTimezone(timezoneOffset, ":");
    }
  },
  // Timezone (GMT)
  O: function(date, token, _localize) {
    const timezoneOffset = date.getTimezoneOffset();
    switch (token) {
      // Short
      case "O":
      case "OO":
      case "OOO":
        return "GMT" + formatTimezoneShort(timezoneOffset, ":");
      // Long
      case "OOOO":
      default:
        return "GMT" + formatTimezone(timezoneOffset, ":");
    }
  },
  // Timezone (specific non-location)
  z: function(date, token, _localize) {
    const timezoneOffset = date.getTimezoneOffset();
    switch (token) {
      // Short
      case "z":
      case "zz":
      case "zzz":
        return "GMT" + formatTimezoneShort(timezoneOffset, ":");
      // Long
      case "zzzz":
      default:
        return "GMT" + formatTimezone(timezoneOffset, ":");
    }
  },
  // Seconds timestamp
  t: function(date, token, _localize) {
    const timestamp = Math.trunc(+date / 1e3);
    return addLeadingZeros(timestamp, token.length);
  },
  // Milliseconds timestamp
  T: function(date, token, _localize) {
    return addLeadingZeros(+date, token.length);
  }
};
function formatTimezoneShort(offset, delimiter = "") {
  const sign = offset > 0 ? "-" : "+";
  const absOffset = Math.abs(offset);
  const hours = Math.trunc(absOffset / 60);
  const minutes = absOffset % 60;
  if (minutes === 0) {
    return sign + String(hours);
  }
  return sign + String(hours) + delimiter + addLeadingZeros(minutes, 2);
}
function formatTimezoneWithOptionalMinutes(offset, delimiter) {
  if (offset % 60 === 0) {
    const sign = offset > 0 ? "-" : "+";
    return sign + addLeadingZeros(Math.abs(offset) / 60, 2);
  }
  return formatTimezone(offset, delimiter);
}
function formatTimezone(offset, delimiter = "") {
  const sign = offset > 0 ? "-" : "+";
  const absOffset = Math.abs(offset);
  const hours = addLeadingZeros(Math.trunc(absOffset / 60), 2);
  const minutes = addLeadingZeros(absOffset % 60, 2);
  return sign + hours + delimiter + minutes;
}

// node_modules/date-fns/_lib/format/longFormatters.js
var dateLongFormatter = (pattern, formatLong2) => {
  switch (pattern) {
    case "P":
      return formatLong2.date({ width: "short" });
    case "PP":
      return formatLong2.date({ width: "medium" });
    case "PPP":
      return formatLong2.date({ width: "long" });
    case "PPPP":
    default:
      return formatLong2.date({ width: "full" });
  }
};
var timeLongFormatter = (pattern, formatLong2) => {
  switch (pattern) {
    case "p":
      return formatLong2.time({ width: "short" });
    case "pp":
      return formatLong2.time({ width: "medium" });
    case "ppp":
      return formatLong2.time({ width: "long" });
    case "pppp":
    default:
      return formatLong2.time({ width: "full" });
  }
};
var dateTimeLongFormatter = (pattern, formatLong2) => {
  const matchResult = pattern.match(/(P+)(p+)?/) || [];
  const datePattern = matchResult[1];
  const timePattern = matchResult[2];
  if (!timePattern) {
    return dateLongFormatter(pattern, formatLong2);
  }
  let dateTimeFormat;
  switch (datePattern) {
    case "P":
      dateTimeFormat = formatLong2.dateTime({ width: "short" });
      break;
    case "PP":
      dateTimeFormat = formatLong2.dateTime({ width: "medium" });
      break;
    case "PPP":
      dateTimeFormat = formatLong2.dateTime({ width: "long" });
      break;
    case "PPPP":
    default:
      dateTimeFormat = formatLong2.dateTime({ width: "full" });
      break;
  }
  return dateTimeFormat.replace("{{date}}", dateLongFormatter(datePattern, formatLong2)).replace("{{time}}", timeLongFormatter(timePattern, formatLong2));
};
var longFormatters = {
  p: timeLongFormatter,
  P: dateTimeLongFormatter
};

// node_modules/date-fns/_lib/protectedTokens.js
var dayOfYearTokenRE = /^D+$/;
var weekYearTokenRE = /^Y+$/;
var throwTokens = ["D", "DD", "YY", "YYYY"];
function isProtectedDayOfYearToken(token) {
  return dayOfYearTokenRE.test(token);
}
function isProtectedWeekYearToken(token) {
  return weekYearTokenRE.test(token);
}
function warnOrThrowProtectedError(token, format2, input) {
  const _message = message(token, format2, input);
  console.warn(_message);
  if (throwTokens.includes(token)) throw new RangeError(_message);
}
function message(token, format2, input) {
  const subject = token[0] === "Y" ? "years" : "days of the month";
  return `Use \`${token.toLowerCase()}\` instead of \`${token}\` (in \`${format2}\`) for formatting ${subject} to the input \`${input}\`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md`;
}

// node_modules/date-fns/format.js
var formattingTokensRegExp = /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g;
var longFormattingTokensRegExp = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g;
var escapedStringRegExp = /^'([^]*?)'?$/;
var doubleQuoteRegExp = /''/g;
var unescapedLatinCharacterRegExp = /[a-zA-Z]/;
function format(date, formatStr, options) {
  const defaultOptions2 = getDefaultOptions();
  const locale = options?.locale ?? defaultOptions2.locale ?? enUS;
  const firstWeekContainsDate = options?.firstWeekContainsDate ?? options?.locale?.options?.firstWeekContainsDate ?? defaultOptions2.firstWeekContainsDate ?? defaultOptions2.locale?.options?.firstWeekContainsDate ?? 1;
  const weekStartsOn = options?.weekStartsOn ?? options?.locale?.options?.weekStartsOn ?? defaultOptions2.weekStartsOn ?? defaultOptions2.locale?.options?.weekStartsOn ?? 0;
  const originalDate = toDate(date, options?.in);
  if (!isValid(originalDate)) {
    throw new RangeError("Invalid time value");
  }
  let parts = formatStr.match(longFormattingTokensRegExp).map((substring) => {
    const firstCharacter = substring[0];
    if (firstCharacter === "p" || firstCharacter === "P") {
      const longFormatter = longFormatters[firstCharacter];
      return longFormatter(substring, locale.formatLong);
    }
    return substring;
  }).join("").match(formattingTokensRegExp).map((substring) => {
    if (substring === "''") {
      return { isToken: false, value: "'" };
    }
    const firstCharacter = substring[0];
    if (firstCharacter === "'") {
      return { isToken: false, value: cleanEscapedString(substring) };
    }
    if (formatters[firstCharacter]) {
      return { isToken: true, value: substring };
    }
    if (firstCharacter.match(unescapedLatinCharacterRegExp)) {
      throw new RangeError(
        "Format string contains an unescaped latin alphabet character `" + firstCharacter + "`"
      );
    }
    return { isToken: false, value: substring };
  });
  if (locale.localize.preprocessor) {
    parts = locale.localize.preprocessor(originalDate, parts);
  }
  const formatterOptions = {
    firstWeekContainsDate,
    weekStartsOn,
    locale
  };
  return parts.map((part) => {
    if (!part.isToken) return part.value;
    const token = part.value;
    if (!options?.useAdditionalWeekYearTokens && isProtectedWeekYearToken(token) || !options?.useAdditionalDayOfYearTokens && isProtectedDayOfYearToken(token)) {
      warnOrThrowProtectedError(token, formatStr, String(date));
    }
    const formatter = formatters[token[0]];
    return formatter(originalDate, token, locale.localize, formatterOptions);
  }).join("");
}
function cleanEscapedString(input) {
  const matched = input.match(escapedStringRegExp);
  if (!matched) {
    return input;
  }
  return matched[1].replace(doubleQuoteRegExp, "'");
}

// src/template-engine.ts
var OUTPUT_TAG_OPEN = "{{";
var OUTPUT_TAG_CLOSE = "}}";
var TAG_OPEN = "{%";
var TAG_CLOSE = "%}";
var END_COMMAND_TAG = "{% endcommand %}";
var TEMPLATE_VARIABLES = /* @__PURE__ */ new Set([
  "today",
  "tomorrow",
  "yesterday",
  "clipboard",
  "file_creation_date",
  "file_modification_date",
  "file_path",
  "file_name",
  "file_stem",
  "folder_path",
  "vault_path",
  "vault_name",
  "date_picker"
]);
var FILTER_ARGUMENT_COUNTS = {
  format: 1,
  replace: 2,
  replace_first: 2,
  replace_regex: 2,
  replace_first_regex: 2
};
var TemplateError = class extends Error {
  constructor(message2) {
    super(message2);
    this.name = "TemplateError";
  }
};
function createDefaultSettings() {
  return {
    version: 1,
    commands: []
  };
}
function sanitizeCommandName(name) {
  return name.trim();
}
function sanitizeTemplate(template) {
  return template.trim();
}
function validateTemplateCommand(name, template) {
  const issues = [];
  if (!sanitizeCommandName(name)) {
    issues.push("Command name is required.");
  }
  if (!sanitizeTemplate(template)) {
    issues.push("Template is required.");
    return issues;
  }
  try {
    parseTemplate(template);
  } catch (error) {
    issues.push(error instanceof TemplateError ? error.message : "Template syntax is invalid.");
  }
  return issues;
}
function buildCommandRegistrationId(commandId) {
  return `template-command-${commandId}`;
}
function parseTemplate(template) {
  return parseTemplateInternal(template, "root");
}
function parseTemplateInternal(template, mode) {
  const segments = [];
  let cursor = 0;
  while (cursor < template.length) {
    const nextOutput = template.indexOf(OUTPUT_TAG_OPEN, cursor);
    const nextTag = template.indexOf(TAG_OPEN, cursor);
    const nextIndex = findNextTokenIndex(nextOutput, nextTag);
    if (nextIndex === -1) {
      segments.push({
        type: "text",
        value: template.slice(cursor)
      });
      break;
    }
    if (nextIndex > cursor) {
      segments.push({
        type: "text",
        value: template.slice(cursor, nextIndex)
      });
    }
    if (nextIndex === nextOutput) {
      const parsedOutput = parseOutputSegment(template, nextIndex);
      segments.push(parsedOutput.segment);
      cursor = parsedOutput.nextIndex;
      continue;
    }
    const parsedTag = parseTagSegment(template, nextIndex, mode);
    segments.push(parsedTag.segment);
    cursor = parsedTag.nextIndex;
  }
  return { segments };
}
function findNextTokenIndex(nextOutput, nextTag) {
  if (nextOutput === -1) {
    return nextTag;
  }
  if (nextTag === -1) {
    return nextOutput;
  }
  return Math.min(nextOutput, nextTag);
}
function parseOutputSegment(template, start) {
  const closeIndex = template.indexOf(OUTPUT_TAG_CLOSE, start + OUTPUT_TAG_OPEN.length);
  if (closeIndex === -1) {
    throw new TemplateError("Unclosed Liquid output tag.");
  }
  const raw = template.slice(start, closeIndex + OUTPUT_TAG_CLOSE.length);
  const expressionSource = template.slice(start + OUTPUT_TAG_OPEN.length, closeIndex).trim();
  if (!expressionSource) {
    throw new TemplateError("Empty Liquid output tag.");
  }
  return {
    segment: {
      type: "output",
      raw,
      expression: parseOutputExpression(expressionSource)
    },
    nextIndex: closeIndex + OUTPUT_TAG_CLOSE.length
  };
}
function parseTagSegment(template, start, mode) {
  const closeIndex = template.indexOf(TAG_CLOSE, start + TAG_OPEN.length);
  if (closeIndex === -1) {
    throw new TemplateError("Unclosed Liquid tag.");
  }
  const rawTag = template.slice(start, closeIndex + TAG_CLOSE.length);
  const tagSource = template.slice(start + TAG_OPEN.length, closeIndex).trim();
  if (!tagSource) {
    throw new TemplateError("Empty Liquid tag.");
  }
  if (tagSource === "command") {
    if (mode === "command") {
      throw new TemplateError("Nested command tags are not supported.");
    }
    const endTagIndex = template.indexOf(END_COMMAND_TAG, closeIndex + TAG_CLOSE.length);
    if (endTagIndex === -1) {
      throw new TemplateError("Unclosed command tag.");
    }
    const bodySource = template.slice(closeIndex + TAG_CLOSE.length, endTagIndex);
    const body = parseTemplateInternal(bodySource, "command");
    return {
      segment: {
        type: "command",
        raw: `${rawTag}${bodySource}${END_COMMAND_TAG}`,
        body
      },
      nextIndex: endTagIndex + END_COMMAND_TAG.length
    };
  }
  if (tagSource === "endcommand") {
    throw new TemplateError("Unexpected endcommand tag.");
  }
  if (tagSource.startsWith("date_picker")) {
    if (mode === "command") {
      throw new TemplateError("date_picker is not supported inside command tags.");
    }
    const format2 = parseDatePickerFormat(tagSource);
    return {
      segment: {
        type: "output",
        raw: rawTag,
        expression: {
          variable: "date_picker",
          filters: [
            {
              name: "format",
              arguments: [format2]
            }
          ]
        }
      },
      nextIndex: closeIndex + TAG_CLOSE.length
    };
  }
  throw new TemplateError(`Unsupported Liquid tag: ${tagSource}`);
}
function parseDatePickerFormat(tagSource) {
  let index = "date_picker".length;
  index = skipWhitespace(tagSource, index);
  if (index >= tagSource.length) {
    throw new TemplateError("date_picker requires a format argument.");
  }
  if (!tagSource.startsWith("format", index)) {
    throw new TemplateError("date_picker only supports the format argument.");
  }
  index += "format".length;
  index = skipWhitespace(tagSource, index);
  if (tagSource[index] !== ":") {
    throw new TemplateError('date_picker format must use format: "...".');
  }
  index += 1;
  index = skipWhitespace(tagSource, index);
  const { value, nextIndex } = parseQuotedString(tagSource, index);
  index = skipWhitespace(tagSource, nextIndex);
  if (index !== tagSource.length) {
    throw new TemplateError("date_picker only supports a single format argument.");
  }
  return value;
}
function parseOutputExpression(source) {
  const parts = splitByPipes(source);
  if (parts.length === 0) {
    throw new TemplateError("Empty Liquid expression.");
  }
  const variable = parts[0]?.trim() ?? "";
  if (!TEMPLATE_VARIABLES.has(variable)) {
    throw new TemplateError(`Unsupported template variable: ${variable}`);
  }
  return {
    variable,
    filters: parts.slice(1).map((part) => parseFilter(part.trim()))
  };
}
function splitByPipes(source) {
  const parts = [];
  let current = "";
  let quote = null;
  let escaped = false;
  for (const character of source) {
    if (escaped) {
      current += character;
      escaped = false;
      continue;
    }
    if (quote) {
      current += character;
      if (character === "\\") {
        escaped = true;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }
    if (character === "'" || character === '"') {
      quote = character;
      current += character;
      continue;
    }
    if (character === "|") {
      parts.push(current);
      current = "";
      continue;
    }
    current += character;
  }
  if (quote) {
    throw new TemplateError("Unclosed string literal in Liquid expression.");
  }
  parts.push(current);
  return parts;
}
function parseFilter(source) {
  if (!source) {
    throw new TemplateError("Empty Liquid filter.");
  }
  const colonIndex = indexOfUnquoted(source, ":");
  const name = (colonIndex === -1 ? source : source.slice(0, colonIndex)).trim();
  if (!(name in FILTER_ARGUMENT_COUNTS)) {
    throw new TemplateError(`Unsupported filter: ${name}`);
  }
  const expectedArgumentCount = FILTER_ARGUMENT_COUNTS[name];
  const argsSource = colonIndex === -1 ? "" : source.slice(colonIndex + 1).trim();
  const args = argsSource ? parseFilterArguments(argsSource) : [];
  if (name === "replace_regex" || name === "replace_first_regex") {
    if (args.length < expectedArgumentCount || args.length > expectedArgumentCount + 1) {
      throw new TemplateError(`${name} requires 2 or 3 arguments.`);
    }
  } else if (args.length !== expectedArgumentCount) {
    const suffix = expectedArgumentCount === 1 ? "" : "s";
    throw new TemplateError(`${name} requires ${expectedArgumentCount} argument${suffix}.`);
  }
  return {
    name,
    arguments: args
  };
}
function parseFilterArguments(source) {
  const args = [];
  let index = 0;
  while (index < source.length) {
    index = skipWhitespace(source, index);
    if (index >= source.length) {
      break;
    }
    const parsed = parseQuotedString(source, index);
    args.push(parsed.value);
    index = skipWhitespace(source, parsed.nextIndex);
    if (index >= source.length) {
      break;
    }
    if (source[index] !== ",") {
      throw new TemplateError("Filter arguments must be quoted strings separated by commas.");
    }
    index += 1;
  }
  return args;
}
function parseQuotedString(source, index) {
  const quote = source[index];
  if (quote !== "'" && quote !== '"') {
    throw new TemplateError("String arguments must be wrapped in quotes.");
  }
  let value = "";
  let cursor = index + 1;
  while (cursor < source.length) {
    const character = source[cursor];
    if (character === "\\") {
      const nextCharacter = source[cursor + 1];
      if (nextCharacter === void 0) {
        throw new TemplateError("Invalid escape sequence in string argument.");
      }
      if (nextCharacter === "\\" || nextCharacter === quote) {
        value += nextCharacter;
      } else {
        value += `\\${nextCharacter}`;
      }
      cursor += 2;
      continue;
    }
    if (character === quote) {
      return {
        value,
        nextIndex: cursor + 1
      };
    }
    value += character;
    cursor += 1;
  }
  throw new TemplateError("Unclosed string argument.");
}
function skipWhitespace(source, index) {
  while (index < source.length && /\s/.test(source[index] ?? "")) {
    index += 1;
  }
  return index;
}
function indexOfUnquoted(source, target) {
  let quote = null;
  let escaped = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (quote) {
      if (character === "\\") {
        escaped = true;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }
    if (character === "'" || character === '"') {
      quote = character;
      continue;
    }
    if (character === target) {
      return index;
    }
  }
  return -1;
}
async function renderTemplate(template, context) {
  const parsed = parseTemplate(template);
  return renderParsedTemplate(parsed, context, "root");
}
async function renderParsedTemplate(parsed, context, mode) {
  let output = "";
  for (const segment of parsed.segments) {
    switch (segment.type) {
      case "text":
        output += segment.value;
        break;
      case "output":
        output += await renderOutputExpression(segment.expression, context, mode);
        break;
      case "command": {
        const command = await renderParsedTemplate(segment.body, context, "command");
        output += await context.executeShellCommand(command);
        break;
      }
      default:
        throw new TemplateError("Unsupported template segment.");
    }
  }
  return output;
}
async function renderOutputExpression(expression, context, mode) {
  if (expression.variable === "date_picker") {
    if (mode === "command") {
      throw new TemplateError("date_picker is not supported inside command tags.");
    }
    const hasFormatFilter = expression.filters.some((filter) => filter.name === "format");
    if (!hasFormatFilter) {
      throw new TemplateError("date_picker must use the format filter before insertion.");
    }
  }
  let resolved = await resolveVariable(expression.variable, context);
  for (const filter of expression.filters) {
    resolved = applyFilter(resolved, filter);
  }
  if (resolved.kind === "date") {
    throw new TemplateError("Date values must use the format filter before insertion.");
  }
  return mode === "command" ? shellEscape(resolved.value) : resolved.value;
}
async function resolveVariable(variable, context) {
  switch (variable) {
    case "clipboard":
      return {
        kind: "string",
        value: await context.readClipboard()
      };
    case "today":
      return {
        kind: "date",
        value: context.now
      };
    case "tomorrow":
      return {
        kind: "date",
        value: addDays(context.now, 1)
      };
    case "yesterday":
      return {
        kind: "date",
        value: addDays(context.now, -1)
      };
    case "file_creation_date":
      return {
        kind: "date",
        value: requireFileContext(context.file, "file_creation_date").creationDate
      };
    case "file_modification_date":
      return {
        kind: "date",
        value: requireFileContext(context.file, "file_modification_date").modificationDate
      };
    case "vault_path":
      return {
        kind: "string",
        value: context.vault.path
      };
    case "vault_name":
      return {
        kind: "string",
        value: context.vault.name
      };
    case "file_path":
      return {
        kind: "string",
        value: requireFileContext(context.file, "file_path").path
      };
    case "file_name":
      return {
        kind: "string",
        value: requireFileContext(context.file, "file_name").name
      };
    case "file_stem":
      return {
        kind: "string",
        value: requireFileContext(context.file, "file_stem").stem
      };
    case "folder_path":
      return {
        kind: "string",
        value: requireFileContext(context.file, "folder_path").folderPath
      };
    case "date_picker":
      return {
        kind: "date",
        value: await requirePickedDate(context)
      };
    default:
      throw new TemplateError(`Unsupported template variable: ${String(variable)}`);
  }
}
async function requirePickedDate(context) {
  const pickedDate = await context.pickDate();
  if (!pickedDate) {
    throw new TemplateError("Date picker was cancelled.");
  }
  return pickedDate;
}
function requireFileContext(file, variable) {
  if (!file) {
    throw new TemplateError(`{{ ${variable} }} requires an active file.`);
  }
  return file;
}
function applyFilter(value, filter) {
  switch (filter.name) {
    case "format":
      if (value.kind !== "date") {
        throw new TemplateError("format can only be used with date values.");
      }
      return {
        kind: "string",
        value: format(value.value, filter.arguments[0] ?? "yyyy-MM-dd")
      };
    case "replace":
      if (value.kind !== "string") {
        throw new TemplateError("replace can only be used with string values.");
      }
      return {
        kind: "string",
        value: value.value.replaceAll(filter.arguments[0] ?? "", filter.arguments[1] ?? "")
      };
    case "replace_first":
      if (value.kind !== "string") {
        throw new TemplateError("replace_first can only be used with string values.");
      }
      return {
        kind: "string",
        value: value.value.replace(filter.arguments[0] ?? "", filter.arguments[1] ?? "")
      };
    case "replace_regex":
      if (value.kind !== "string") {
        throw new TemplateError("replace_regex can only be used with string values.");
      }
      return {
        kind: "string",
        value: value.value.replaceAll(createRegexFilterPattern(filter, true), filter.arguments[1] ?? "")
      };
    case "replace_first_regex":
      if (value.kind !== "string") {
        throw new TemplateError("replace_first_regex can only be used with string values.");
      }
      return {
        kind: "string",
        value: value.value.replace(createRegexFilterPattern(filter, false), filter.arguments[1] ?? "")
      };
    default:
      throw new TemplateError(`Unsupported filter: ${String(filter.name)}`);
  }
}
function createRegexFilterPattern(filter, replaceAllMatches) {
  const source = filter.arguments[0] ?? "";
  const rawFlags = filter.arguments[2] ?? "";
  const flags = replaceAllMatches ? ensureRegexFlag(rawFlags, "g") : removeRegexFlag(rawFlags, "g");
  try {
    return new RegExp(source, flags);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Invalid regex.";
    throw new TemplateError(`Invalid regular expression for ${filter.name}: ${reason}`);
  }
}
function ensureRegexFlag(flags, flag) {
  return flags.includes(flag) ? flags : `${flags}${flag}`;
}
function removeRegexFlag(flags, flag) {
  return [...flags].filter((value) => value !== flag).join("");
}
function shellEscape(value) {
  return `'${value.replace(/'/g, `'"'"'`)}'`;
}

// src/settings.ts
var SlasherSettingTab = class extends import_obsidian2.PluginSettingTab {
  constructor(plugin) {
    super(plugin.app, plugin);
    this.plugin = plugin;
  }
  selectionByCommandId = /* @__PURE__ */ new Map();
  display() {
    const { containerEl } = this;
    containerEl.empty();
    const layoutEl = containerEl.createDiv({ cls: "slasher-settings-layout" });
    layoutEl.createEl("h2", {
      cls: "slasher-settings-title",
      text: "Slasher"
    });
    const introEl = layoutEl.createDiv({ cls: "slasher-settings-intro" });
    const helpEl = introEl.createEl("p", {
      cls: "slasher-settings-help"
    });
    helpEl.appendText("Refer the ");
    helpEl.createEl("a", {
      cls: "slasher-settings-help-link",
      href: "https://github.com/binnyva/obsidian-slasher",
      text: "Documentation"
    });
    helpEl.appendText(" for template string format.");
    const tableEl = layoutEl.createDiv({ cls: "slasher-settings-table" });
    const headerEl = tableEl.createDiv({ cls: "slasher-settings-table-header" });
    headerEl.createDiv({
      cls: "slasher-settings-table-heading",
      text: "Enabled"
    });
    headerEl.createDiv({
      cls: "slasher-settings-table-heading",
      text: "Command Name"
    });
    headerEl.createDiv({
      cls: "slasher-settings-table-heading",
      text: "Template"
    });
    headerEl.createDiv({
      cls: "slasher-settings-table-heading slasher-settings-table-heading--icon",
      text: "Build"
    });
    headerEl.createDiv({
      cls: "slasher-settings-table-heading slasher-settings-table-heading--action",
      text: "Action"
    });
    const bodyEl = tableEl.createDiv({ cls: "slasher-settings-table-body" });
    if (this.plugin.settings.commands.length === 0) {
      bodyEl.createDiv({
        cls: "slasher-settings-empty-state",
        text: "No commands yet. Add a row to create one and it will show up as an editor command immediately after save."
      });
    } else {
      for (const command of this.plugin.settings.commands) {
        this.renderCommandRow(bodyEl, command);
      }
    }
    const footerEl = layoutEl.createDiv({ cls: "slasher-settings-footer" });
    this.renderAddRowButton(footerEl, "+ Add row");
  }
  renderAddRowButton(parentEl, label) {
    const buttonEl = parentEl.createEl("button", {
      cls: "mod-cta slasher-settings-add-row-button",
      text: label
    });
    buttonEl.type = "button";
    buttonEl.addEventListener("click", async () => {
      try {
        await this.plugin.addEmptyCommand();
        this.display();
      } catch (error) {
        const message2 = error instanceof Error && error.message ? error.message : "Failed to add a new command row.";
        new import_obsidian2.Notice(`Slasher: ${message2}`);
        console.error("Slasher add row failed", error);
      }
    });
  }
  renderCommandRow(parentEl, command) {
    const rowEl = parentEl.createDiv({ cls: "slasher-settings-table-row" });
    if (!command.enabled) {
      rowEl.addClass("is-disabled");
    }
    let validationEl = null;
    const refreshValidation = () => {
      const issues = validateTemplateCommand(command.name, command.template);
      rowEl.toggleClass("is-invalid", issues.length > 0);
      if (issues.length === 0) {
        validationEl?.remove();
        validationEl = null;
        return;
      }
      if (!validationEl) {
        validationEl = rowEl.createDiv({
          cls: "slasher-validation slasher-settings-validation"
        });
      }
      validationEl.setText(issues.join(" "));
    };
    refreshValidation();
    const enabledCell = rowEl.createDiv({
      cls: "slasher-settings-cell slasher-settings-cell--enabled"
    });
    enabledCell.setAttr("data-label", "Enabled");
    new import_obsidian2.ToggleComponent(enabledCell).setValue(command.enabled).onChange(async (value) => {
      command.enabled = value;
      await this.plugin.saveSettings();
      this.display();
    });
    const commandCell = rowEl.createDiv({
      cls: "slasher-settings-cell slasher-settings-cell--name"
    });
    commandCell.setAttr("data-label", "Command Name");
    new import_obsidian2.TextComponent(commandCell).setPlaceholder("Insert tomorrow's date").setValue(command.name).onChange(async (value) => {
      command.name = value;
      refreshValidation();
      await this.plugin.saveSettings();
    }).inputEl.addClass("slasher-settings-input");
    const templateCell = rowEl.createDiv({
      cls: "slasher-settings-cell slasher-settings-cell--template"
    });
    templateCell.setAttr("data-label", "Template");
    const textArea = new import_obsidian2.TextAreaComponent(templateCell);
    textArea.setPlaceholder('{{ today | format: "yyyy-MM-dd" }}').setValue(command.template).onChange(async (value) => {
      command.template = value;
      refreshValidation();
      await this.plugin.saveSettings();
    });
    textArea.inputEl.rows = 1;
    textArea.inputEl.addClass("slasher-settings-textarea");
    this.syncTextAreaHeight(textArea.inputEl);
    const updateSelection = () => {
      this.selectionByCommandId.set(command.id, {
        start: textArea.inputEl.selectionStart ?? textArea.inputEl.value.length,
        end: textArea.inputEl.selectionEnd ?? textArea.inputEl.value.length
      });
    };
    textArea.inputEl.addEventListener("input", () => {
      this.syncTextAreaHeight(textArea.inputEl);
      updateSelection();
    });
    textArea.inputEl.addEventListener("click", updateSelection);
    textArea.inputEl.addEventListener("keyup", updateSelection);
    textArea.inputEl.addEventListener("select", updateSelection);
    textArea.inputEl.addEventListener("focus", updateSelection);
    const helperCell = rowEl.createDiv({
      cls: "slasher-settings-cell slasher-settings-cell--helper"
    });
    helperCell.setAttr("data-label", "Build");
    new import_obsidian2.ExtraButtonComponent(helperCell).setIcon("settings").setTooltip("Open template helper").onClick(() => {
      new TemplateBuilderModal(this.app, (snippet) => {
        void this.insertSnippet(command, snippet);
      }).open();
    }).extraSettingsEl.addClass("slasher-settings-helper-button");
    const actionCell = rowEl.createDiv({
      cls: "slasher-settings-cell slasher-settings-cell--action"
    });
    actionCell.setAttr("data-label", "Action");
    const deleteButton = new import_obsidian2.ExtraButtonComponent(actionCell).setIcon("trash").setTooltip("Delete command").onClick(async () => {
      await this.plugin.removeTemplateCommand(command.id);
      this.display();
    });
    const warningCapableDeleteButton = deleteButton;
    warningCapableDeleteButton.setWarning?.();
    deleteButton.extraSettingsEl.addClass("slasher-settings-delete-button");
  }
  syncTextAreaHeight(textAreaEl) {
    textAreaEl.style.height = "auto";
    textAreaEl.style.height = `${Math.max(textAreaEl.scrollHeight, 44)}px`;
  }
  async insertSnippet(command, snippet) {
    const range = this.selectionByCommandId.get(command.id) ?? {
      start: command.template.length,
      end: command.template.length
    };
    const currentTemplate = command.template;
    command.template = currentTemplate.slice(0, range.start) + snippet + currentTemplate.slice(range.end);
    const newCursor = range.start + snippet.length;
    this.selectionByCommandId.set(command.id, {
      start: newCursor,
      end: newCursor
    });
    await this.plugin.saveSettings();
    this.display();
  }
};

// src/shell-output.ts
function trimShellOutput(output) {
  return output.trim();
}

// src/main.ts
var execFileAsync = (0, import_node_util.promisify)(import_node_child_process.execFile);
var SlasherPlugin = class extends import_obsidian3.Plugin {
  settings = createDefaultSettings();
  registeredCommandIds = [];
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new SlasherSettingTab(this));
    this.rebuildCommands();
  }
  onunload() {
    this.clearRegisteredCommands();
  }
  async addEmptyCommand() {
    this.settings.commands.push({
      id: this.createCommandId(),
      name: "",
      template: "",
      enabled: true
    });
    await this.saveSettings();
  }
  async removeTemplateCommand(commandId) {
    this.settings.commands = this.settings.commands.filter((command) => command.id !== commandId);
    await this.saveSettings();
  }
  async saveSettings() {
    await this.saveData(this.settings);
    this.rebuildCommands();
  }
  async loadSettings() {
    const loaded = await this.loadData();
    const defaults = createDefaultSettings();
    if (!loaded || typeof loaded !== "object") {
      this.settings = defaults;
      return;
    }
    const rawCommands = loaded.commands;
    const commands = Array.isArray(rawCommands) ? rawCommands.filter((item) => Boolean(item && typeof item === "object" && "id" in item && typeof item.id === "string")).map((item) => ({
      id: item.id,
      name: typeof item.name === "string" ? item.name : "",
      template: typeof item.template === "string" ? item.template : "",
      enabled: typeof item.enabled === "boolean" ? item.enabled : true
    })) : [];
    this.settings = {
      version: 1,
      commands
    };
  }
  createCommandId() {
    const randomUuid = globalThis.crypto?.randomUUID?.();
    if (randomUuid) {
      return randomUuid;
    }
    return `template-command-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
  rebuildCommands() {
    this.clearRegisteredCommands();
    for (const command of this.settings.commands) {
      if (!command.enabled || validateTemplateCommand(command.name, command.template).length > 0) {
        continue;
      }
      const registered = this.addCommand({
        id: buildCommandRegistrationId(command.id),
        name: command.name.trim(),
        editorCheckCallback: (checking, editor, ctx) => {
          if (!editor || !ctx) {
            return false;
          }
          if (!checking) {
            void this.runTemplateCommand(command, editor);
          }
          return true;
        }
      });
      this.registeredCommandIds.push(registered.id);
    }
  }
  clearRegisteredCommands() {
    const commandManager = this.app.commands;
    for (const commandId of this.registeredCommandIds) {
      delete commandManager?.commands?.[commandId];
      delete commandManager?.editorCommands?.[commandId];
    }
    this.registeredCommandIds = [];
  }
  async runTemplateCommand(command, editor) {
    try {
      const runtimeContext = this.createRuntimeContext();
      const output = await renderTemplate(command.template, runtimeContext);
      editor.replaceSelection(output);
    } catch (error) {
      const message2 = error instanceof TemplateError ? error.message : "Failed to render template.";
      new import_obsidian3.Notice(`Slasher: ${message2}`);
      console.error("Slasher command failed", error);
    }
  }
  createRuntimeContext() {
    return {
      now: /* @__PURE__ */ new Date(),
      vault: this.getVaultContext(),
      file: this.getActiveFileContext(),
      readClipboard: () => this.readClipboard(),
      executeShellCommand: (command) => this.executeShellCommand(command),
      pickDate: () => this.pickDate()
    };
  }
  getVaultContext() {
    const adapter = this.app.vault.adapter;
    if (!(adapter instanceof import_obsidian3.FileSystemAdapter)) {
      throw new TemplateError("This plugin requires the desktop file system adapter.");
    }
    return {
      name: this.app.vault.getName(),
      path: adapter.getBasePath()
    };
  }
  getActiveFileContext() {
    const activeFile = this.app.workspace.getActiveFile();
    if (!(activeFile instanceof import_obsidian3.TFile)) {
      return void 0;
    }
    const adapter = this.app.vault.adapter;
    if (!(adapter instanceof import_obsidian3.FileSystemAdapter)) {
      throw new TemplateError("This plugin requires the desktop file system adapter.");
    }
    return {
      path: adapter.getFullPath(activeFile.path),
      name: activeFile.name,
      stem: activeFile.basename,
      folderPath: activeFile.parent?.path === "/" ? "" : activeFile.parent?.path ?? "",
      creationDate: new Date(activeFile.stat.ctime),
      modificationDate: new Date(activeFile.stat.mtime)
    };
  }
  async readClipboard() {
    if (typeof navigator !== "undefined" && navigator.clipboard?.readText) {
      return navigator.clipboard.readText();
    }
    const electron = window.require?.("electron");
    if (electron?.clipboard) {
      return electron.clipboard.readText();
    }
    throw new TemplateError("Clipboard access is unavailable.");
  }
  async executeShellCommand(command) {
    const shell = process.env.SHELL ?? "/bin/bash";
    const vault = this.getVaultContext();
    try {
      const { stdout } = await execFileAsync(shell, ["-lc", command], {
        cwd: vault.path,
        maxBuffer: 1024 * 1024
      });
      return trimShellOutput(stdout);
    } catch (error) {
      throw new TemplateError(
        error instanceof Error && error.message ? `Shell command failed: ${error.message}` : "Shell command failed."
      );
    }
  }
  pickDate() {
    return new Promise((resolve) => {
      new DatePickerModal(this.app, resolve).open();
    });
  }
};
