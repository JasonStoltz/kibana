export const replace = () => ({
  name: 'replace',
  type: 'string',
  help: 'Use a regular expression to replace parts of a string',
  context: {
    types: ['string'],
  },
  args: {
    _: {
      aliases: ['pattern', 'regex'],
      types: ['string'],
      help:
        'The text or pattern of a JavaScript regular expression, eg "[aeiou]". You can use capture groups here.',
    },
    flags: {
      aliases: ['modifiers'],
      types: ['string'],
      help:
        'Specify flags. See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp for reference.',
      default: 'g',
    },
    replacement: {
      types: ['string'],
      help:
        'The replacement for the matching parts of string. Capture groups can be accessed by their index, eg $1',
      default: '',
    },
  },
  fn: (context, args) => context.replace(new RegExp(args._, args.flags), args.replacement),
});
