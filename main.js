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
    let commandBody = "ls -1 {vaultPath}";
    let vaultToken = "filePath";
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
          dropdown.addOption("today", "today").addOption("tomorrow", "tomorrow").addOption("yesterday", "yesterday").addOption("file-creation-date", "file-creation-date").addOption("file-modification-date", "file-modification-date").setValue(dateToken).onChange((value) => {
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
        new import_obsidian.Setting(dynamicSection).setName("Replace").setDesc("Used to build a starter sed: transform.").addText((text) => {
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
        new import_obsidian.Setting(dynamicSection).setName("Shell command").setDesc("You can include placeholders like {vaultPath} inside the command body.").addText((text) => {
          text.setPlaceholder("ls -1 {vaultPath}").setValue(commandBody).onChange((value) => {
            commandBody = value;
          });
          text.inputEl.style.width = "100%";
        });
      }
      if (snippetKind === "vault") {
        new import_obsidian.Setting(dynamicSection).setName("Placeholder").addDropdown((dropdown) => {
          dropdown.addOption("filePath", "{filePath}").addOption("fileName", "{fileName}").addOption("fileStem", "{fileStem}").addOption("folderPath", "{folderPath}").addOption("vaultPath", "{vaultPath}").addOption("vaultName", "{vaultName}").setValue(vaultToken).onChange((value) => {
            vaultToken = value;
          });
        });
      }
      if (snippetKind === "date-picker") {
        new import_obsidian.Setting(dynamicSection).setName("Format").setDesc("Uses date-fns tokens after the date is chosen.").addText((text) => {
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
        return `{${values.dateToken}}|format:${values.dateFormat}`;
      case "clipboard":
        return `{clipboard}|sed:/${escapeSedSegment(values.replaceFrom)}/${escapeSedSegment(values.replaceTo)}/`;
      case "command":
        return `{command:${values.commandBody || "ls -1 {vaultPath}"}}`;
      case "vault":
        return `{${values.vaultToken}}`;
      case "date-picker":
        return `{date-picker}|format:${values.pickerFormat}`;
      default:
        return "{today}|format:yyyy-MM-dd";
    }
  }
  onClose() {
    this.contentEl.empty();
  }
};
function escapeSedSegment(value) {
  return value.replaceAll("/", "\\/");
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
var DATE_TOKEN_ALIASES = {
  today: "today",
  tomorrow: "tomorrow",
  tomorow: "tomorrow",
  tommorow: "tomorrow",
  yesterday: "yesterday",
  "file-creation-date": "file-creation-date",
  fileCreationDate: "file-creation-date",
  "file-modification-date": "file-modification-date",
  fileModificationDate: "file-modification-date"
};
var VAULT_TOKENS = /* @__PURE__ */ new Set([
  "filePath",
  "fileName",
  "fileStem",
  "folderPath",
  "vaultPath",
  "vaultName"
]);
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
  }
  return issues;
}
function buildCommandRegistrationId(commandId) {
  return `template-command-${commandId}`;
}
function parseTemplate(template) {
  const segments = [];
  let cursor = 0;
  while (cursor < template.length) {
    const start = template.indexOf("{", cursor);
    if (start === -1) {
      segments.push({
        type: "text",
        value: template.slice(cursor)
      });
      break;
    }
    if (start > cursor) {
      segments.push({
        type: "text",
        value: template.slice(cursor, start)
      });
    }
    const parsedToken = parseTokenSegment(template, start);
    segments.push(parsedToken.segment);
    cursor = parsedToken.nextIndex;
  }
  return { segments };
}
function parseTokenSegment(template, start) {
  let depth = 0;
  let end = start;
  for (; end < template.length; end += 1) {
    const character = template[end];
    if (character === "{") {
      depth += 1;
    } else if (character === "}") {
      depth -= 1;
      if (depth === 0) {
        break;
      }
    }
  }
  if (depth !== 0) {
    throw new TemplateError("Unclosed template token.");
  }
  const rawToken = template.slice(start + 1, end).trim();
  if (!rawToken) {
    throw new TemplateError("Empty template token.");
  }
  const token = parseTokenDescriptor(rawToken);
  const { transforms, nextIndex } = parseTransforms(template, end + 1);
  return {
    segment: {
      type: "token",
      raw: template.slice(start, nextIndex),
      token,
      transforms
    },
    nextIndex
  };
}
function parseTransforms(template, start) {
  const transforms = [];
  let cursor = start;
  while (template[cursor] === "|") {
    const nameStart = cursor + 1;
    const colonIndex = template.indexOf(":", nameStart);
    if (colonIndex === -1) {
      break;
    }
    const name = template.slice(nameStart, colonIndex).trim();
    if (!name || !/^[a-z-]+$/i.test(name)) {
      break;
    }
    const { argument, nextIndex } = parseTransformArgument(template, colonIndex + 1, name);
    transforms.push({ name, argument });
    cursor = nextIndex;
  }
  return {
    transforms,
    nextIndex: cursor
  };
}
function looksLikeTransformStart(template, index) {
  const remainder = template.slice(index + 1);
  return /^[a-z-]+:/i.test(remainder);
}
function parseTransformArgument(template, start, name) {
  if (name === "sed") {
    return parseSedArgument(template, start);
  }
  let end = start;
  while (end < template.length) {
    const character = template[end];
    if (character === "|" && looksLikeTransformStart(template, end)) {
      break;
    }
    if (character === "{" || /\s/.test(character)) {
      break;
    }
    end += 1;
  }
  return {
    argument: template.slice(start, end),
    nextIndex: end
  };
}
function parseSedArgument(template, start) {
  if (template[start] !== "/") {
    throw new TemplateError("sed: expressions must start with '/'.");
  }
  let slashCount = 0;
  let escaped = false;
  let index = start;
  for (; index < template.length; index += 1) {
    const character = template[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === "\\") {
      escaped = true;
      continue;
    }
    if (character === "/") {
      slashCount += 1;
      if (slashCount === 3) {
        index += 1;
        if (template[index] === "g") {
          index += 1;
        }
        break;
      }
    }
  }
  if (slashCount < 3) {
    throw new TemplateError("sed: expressions must look like /from/to/ or /from/to/g.");
  }
  return {
    argument: template.slice(start, index),
    nextIndex: index
  };
}
function parseTokenDescriptor(rawToken) {
  const trimmed = rawToken.trim();
  if (trimmed.startsWith("command:")) {
    const command = trimmed.slice("command:".length).trim();
    if (!command) {
      throw new TemplateError("Command token requires a shell command.");
    }
    return {
      kind: "command",
      command
    };
  }
  if (trimmed === "clipboard") {
    return { kind: "clipboard" };
  }
  if (trimmed === "date-picker") {
    return { kind: "date-picker" };
  }
  if (trimmed in DATE_TOKEN_ALIASES) {
    return {
      kind: "date",
      token: DATE_TOKEN_ALIASES[trimmed]
    };
  }
  if (VAULT_TOKENS.has(trimmed)) {
    return {
      kind: "vault",
      token: trimmed
    };
  }
  throw new TemplateError(`Unsupported template token: ${trimmed}`);
}
async function renderTemplate(template, context) {
  const parsed = parseTemplate(template);
  let output = "";
  for (const segment of parsed.segments) {
    if (segment.type === "text") {
      output += segment.value;
      continue;
    }
    output += await renderTokenSegment(segment, context);
  }
  return output;
}
async function renderTokenSegment(segment, context) {
  let resolved = await resolveToken(segment.token, context);
  const hasFormatTransform = segment.transforms.some((transform) => transform.name === "format");
  for (const transform of segment.transforms) {
    resolved = applyTransform(resolved, transform);
  }
  if (resolved.kind === "date" && !hasFormatTransform) {
    resolved = applyTransform(resolved, {
      name: "format",
      argument: "yyyy-MM-dd"
    });
  }
  if (resolved.kind === "date") {
    throw new TemplateError("Date values must be formatted before insertion.");
  }
  return resolved.value;
}
async function resolveToken(token, context) {
  switch (token.kind) {
    case "clipboard":
      return {
        kind: "string",
        value: await context.readClipboard()
      };
    case "command": {
      const command = await renderShellCommandTemplate(token.command, context);
      return {
        kind: "string",
        value: await context.executeShellCommand(command)
      };
    }
    case "date":
      return {
        kind: "date",
        value: resolveDateToken(token.token, context)
      };
    case "date-picker": {
      const pickedDate = await context.pickDate();
      if (!pickedDate) {
        throw new TemplateError("Date picker was cancelled.");
      }
      return {
        kind: "date",
        value: pickedDate
      };
    }
    case "vault":
      return {
        kind: "string",
        value: resolveVaultToken(token.token, context)
      };
    default:
      throw new TemplateError("Unsupported token.");
  }
}
async function renderShellCommandTemplate(template, context) {
  const parsed = parseTemplate(template);
  let command = "";
  for (const segment of parsed.segments) {
    if (segment.type === "text") {
      command += segment.value;
      continue;
    }
    const resolved = await resolveToken(segment.token, context);
    if (resolved.kind === "date") {
      throw new TemplateError("Date values are not supported inside shell command templates.");
    }
    command += shellEscape(resolved.value);
  }
  return command;
}
function resolveDateToken(token, context) {
  switch (token) {
    case "today":
      return context.now;
    case "tomorrow":
      return addDays(context.now, 1);
    case "yesterday":
      return addDays(context.now, -1);
    case "file-creation-date":
      return requireFileContext(context.file, "file-creation-date").creationDate;
    case "file-modification-date":
      return requireFileContext(context.file, "file-modification-date").modificationDate;
    default:
      throw new TemplateError("Unsupported date token.");
  }
}
function resolveVaultToken(token, context) {
  switch (token) {
    case "vaultPath":
      return context.vault.path;
    case "vaultName":
      return context.vault.name;
    case "filePath":
      return requireFileContext(context.file, "filePath").path;
    case "fileName":
      return requireFileContext(context.file, "fileName").name;
    case "fileStem":
      return requireFileContext(context.file, "fileStem").stem;
    case "folderPath":
      return requireFileContext(context.file, "folderPath").folderPath;
    default:
      throw new TemplateError("Unsupported vault token.");
  }
}
function requireFileContext(file, token) {
  if (!file) {
    throw new TemplateError(`Token {${token}} requires an active file.`);
  }
  return file;
}
function applyTransform(value, transform) {
  switch (transform.name) {
    case "format":
      if (value.kind !== "date") {
        throw new TemplateError("format: can only be used with date values.");
      }
      return {
        kind: "string",
        value: format(value.value, transform.argument || "yyyy-MM-dd")
      };
    case "sed":
      if (value.kind !== "string") {
        throw new TemplateError("sed: can only be used with string values.");
      }
      return {
        kind: "string",
        value: applySedTransform(value.value, transform.argument)
      };
    default:
      throw new TemplateError(`Unsupported transform: ${transform.name}`);
  }
}
function applySedTransform(value, expression) {
  const parsed = parseSedExpression(expression);
  const flags = parsed.global ? "g" : "";
  const pattern = new RegExp(escapeForRegExp(parsed.search), flags);
  return value.replace(pattern, parsed.replace);
}
function parseSedExpression(expression) {
  if (!expression.startsWith("/")) {
    throw new TemplateError("sed: expressions must start with '/'.");
  }
  const parts = [];
  let current = "";
  let escaped = false;
  for (let index = 1; index < expression.length; index += 1) {
    const character = expression[index];
    if (escaped) {
      current += character;
      escaped = false;
      continue;
    }
    if (character === "\\") {
      escaped = true;
      continue;
    }
    if (character === "/") {
      parts.push(current);
      current = "";
      continue;
    }
    current += character;
  }
  if (current) {
    parts.push(current);
  }
  if (parts.length < 2 || parts.length > 3) {
    throw new TemplateError("sed: expressions must look like /from/to/ or /from/to/g.");
  }
  const [search, replace, maybeFlag] = parts;
  return {
    search,
    replace,
    global: maybeFlag === "g"
  };
}
function escapeForRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
    introEl.createEl("p", {
      cls: "slasher-settings-help",
      text: "Each item becomes a normal Obsidian editor command, so it can appear in Slash commands and the command palette."
    });
    introEl.createEl("p", {
      cls: "slasher-settings-help",
      text: "Use the Add helper inside a row to insert starter snippets such as {today}|format:yyyy-MM-dd or {command:ls -1 {vaultPath}}."
    });
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
    const issues = validateTemplateCommand(command.name, command.template);
    if (issues.length > 0) {
      rowEl.addClass("is-invalid");
    }
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
      await this.plugin.saveSettings();
    }).inputEl.addClass("slasher-settings-input");
    const templateCell = rowEl.createDiv({
      cls: "slasher-settings-cell slasher-settings-cell--template"
    });
    templateCell.setAttr("data-label", "Template");
    const textArea = new import_obsidian2.TextAreaComponent(templateCell);
    textArea.setPlaceholder("{today}|format:yyyy-MM-dd").setValue(command.template).onChange(async (value) => {
      command.template = value;
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
      new TemplateBuilderModal(this.app, async (snippet) => {
        await this.insertSnippet(command, snippet);
      }).open();
    }).extraSettingsEl.addClass("slasher-settings-helper-button");
    const actionCell = rowEl.createDiv({
      cls: "slasher-settings-cell slasher-settings-cell--action"
    });
    actionCell.setAttr("data-label", "Action");
    const deleteButton = new import_obsidian2.ExtraButtonComponent(actionCell).setIcon("trash").setTooltip("Delete command").onClick(async () => {
      await this.plugin.removeCommand(command.id);
      this.display();
    });
    if (typeof deleteButton.setWarning === "function") {
      deleteButton.setWarning();
    }
    deleteButton.extraSettingsEl.addClass("slasher-settings-delete-button");
    if (issues.length > 0) {
      rowEl.createDiv({
        cls: "slasher-validation slasher-settings-validation",
        text: issues.join(" ")
      });
    }
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

// src/main.ts
var execFileAsync = (0, import_node_util.promisify)(import_node_child_process.execFile);
var SlasherPlugin = class extends import_obsidian3.Plugin {
  settings = createDefaultSettings();
  registeredCommandIds = [];
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new SlasherSettingTab(this));
    await this.rebuildCommands();
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
  async removeCommand(commandId) {
    this.settings.commands = this.settings.commands.filter((command) => command.id !== commandId);
    await this.saveSettings();
  }
  async saveSettings() {
    await this.saveData(this.settings);
    await this.rebuildCommands();
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
  async rebuildCommands() {
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
    return {
      path: activeFile.path,
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
      return stdout.replace(/\r?\n$/, "");
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
