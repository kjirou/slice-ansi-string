const ansiStyles = require('ansi-styles');
const astralRegex = require('astral-regex');
const isFullwidthCodePoint = require('is-fullwidth-code-point');


// "CSI" = "Control Sequence Introducer"
// Ref) https://en.wikipedia.org/wiki/ANSI_escape_code - "Escape sequences"
const CSI_CODES = [
  '\u001b',
  '\u009b',
];

const SGR_CLOSE_CODES = [];
ansiStyles.codes.forEach(value => SGR_CLOSE_CODES.push(value.toString()));

const stringToArrayConsideringSurrogatePair = (str) => {
  return str.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[^\uD800-\uDFFF]/g) || [];
};

const extractSgrCode = (sgrParameter) => /^\d+/.exec(sgrParameter).toString();

const findAndOffsetEffectingSgrParameter = (effectingSgrParameters, closeSgrParameter) => {
  const closeSgrCode = extractSgrCode(closeSgrParameter);
  const newList = [];
  for (let i = effectingSgrParameters.length - 1; i >= 0; i -= 1) {
    const sgrCode = extractSgrCode(effectingSgrParameters[i]);
    if (ansiStyles.codes.get(Number(sgrCode)) !== Number(closeSgrCode)) {
      newList.unshift(sgrCode);
    }
  }
  return newList;
};

const wrapToAnsi = (sgrParameter) => `${CSI_CODES[0]}[${sgrParameter}m`;


/**
 * TODO:
 * - Slice to negative position ex) slice(str, -4, -1)
 *
 * @param str {string}
 * @param begin {number}
 * @param end {(number|null|undefined)}
 */
const sliceAnsiString = (str, begin, end = null) => {
  const characters = stringToArrayConsideringSurrogatePair(str);
  const actualEnd = end === null ? characters.length : end;

  let insideAnsi = false;  // Is the `character` inside of ANSI escape code?
  let effectingSgrParameters = [];
  let visibleCharacterIndex = -1;
  let output = '';

  for (const item of characters.entries()) {
    const [
      characterIndex,
      character,
    ] = item;

    let leftAnsi = false;  // Does the `character` left from ANSI escape code at this loop?

    if (CSI_CODES.indexOf(character) !== -1) {
      insideAnsi = true;
    } else if (insideAnsi && character === 'm') {
      insideAnsi = false;
      leftAnsi = true;

      // If ANSI escape code is 256 colors, it will be 11 characters long.
      // ex) "\u001b[38;5;255m"
      const sgrParameter = /\d[^m]*/.exec(str.slice(characterIndex, characterIndex + 11)).toString();
      const sgrCode = extractSgrCode(sgrParameter);

      if (SGR_CLOSE_CODES.indexOf(sgrCode) !== -1) {
        effectingSgrParameters = findAndOffsetEffectingSgrParameter(effectingSgrParameters, sgrCode);
      } else {
        effectingSgrParameters.push(sgrParameter);
      }
    }

    const lastEffectingSgrParameter = effectingSgrParameters[effectingSgrParameters.length - 1];

    if (!insideAnsi && !leftAnsi) {
      visibleCharacterIndex += 1;

      //if (!astralRegex({exact: true}).test(character) && isFullwidthCodePoint(character.codePointAt())) {
      //  visibleCharacterIndex += 1;
      //}

      if (visibleCharacterIndex >= begin && visibleCharacterIndex < actualEnd) {
        // Add effecting ANSI escape codes.
        if (output === '') {
          effectingSgrParameters.forEach(v => {
            output += wrapToAnsi(v);
          });
        }
        output += character;
      }
    } else if (
      leftAnsi &&
      visibleCharacterIndex >= begin &&
      visibleCharacterIndex < actualEnd &&
      output !== '' &&
      lastEffectingSgrParameter !== null
    ) {
      output += wrapToAnsi(lastEffectingSgrParameter);
    }

    if (visibleCharacterIndex >= actualEnd - 1) {
      // Close if the escape is ongoing.
      if (output !== '') {
        effectingSgrParameters.slice().reverse().forEach(sgrParameter => {
          const closeSgrParameter = ansiStyles.codes.get(Number(sgrParameter)).toString();
          output += wrapToAnsi(closeSgrParameter);
        });
      }
      break;
    }
  }

  return output;
};

module.exports = sliceAnsiString;
