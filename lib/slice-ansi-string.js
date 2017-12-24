const ansiStyles = require('ansi-styles');


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

const findSgrCloseParameter = (sgrParameter) => {
  const sgrCode = extractSgrCode(sgrParameter);
  let closeSgrParameter;
  if (sgrCode === '38') {
    closeSgrParameter = '39';
  } else if (sgrCode === '48') {
    closeSgrParameter = '49';
  } else {
    closeSgrParameter = ansiStyles.codes.get(Number(sgrCode)).toString();
  }
  if (typeof closeSgrParameter !== 'string') {
    throw new Error('Can not find SGR code to close');
  }
  return closeSgrParameter;
};

const findAndOffsetEffectingSgrParameter = (effectingSgrParameters, closeSgrParameter) => {
  const newList = [];
  for (let i = effectingSgrParameters.length - 1; i >= 0; i -= 1) {
    const sgrParameter = effectingSgrParameters[i];
    if (findSgrCloseParameter(sgrParameter) !== closeSgrParameter) {
      newList.unshift(sgrParameter);
    }
  }
  return newList;
};

const wrapToAnsi = (sgrParameter) => `${CSI_CODES[0]}[${sgrParameter}m`;

const appendAnsiOutput = (output, ansi) => {
  // NOTE: Does not erase to leave the tag structure.
  //// Does not put two identical ANSI escape codes at the end.
  //if (output.indexOf(ansi) === output.length - ansi.length) {
  //  return output;
  //}
  return output + ansi;
};


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
    if (visibleCharacterIndex >= actualEnd - 1) {
      break;
    }

    const [
      characterIndex,
      character,
    ] = item;

    let leftAnsi = false;  // Does the `character` left from ANSI escape code at this loop?

    if (CSI_CODES.indexOf(character) !== -1) {
      insideAnsi = true;

      // If ANSI escape code is 256 colors, it will be 11 characters long. ex) "\u001b[38;5;255m"
      const strIncludedSgrParameter = characters.slice(characterIndex, characterIndex + 11).join('');
      const sgrParameter = /\d[^m]*/.exec(strIncludedSgrParameter).toString();
      const sgrCode = extractSgrCode(sgrParameter);
      if (SGR_CLOSE_CODES.indexOf(sgrCode) !== -1) {
        effectingSgrParameters = findAndOffsetEffectingSgrParameter(effectingSgrParameters, sgrCode);
      } else {
        effectingSgrParameters.push(sgrParameter);
      }
      if (output !== '') {
        output = appendAnsiOutput(output, wrapToAnsi(sgrParameter));
      }
    } else if (insideAnsi && character === 'm') {
      insideAnsi = false;
      leftAnsi = true;
    }

    if (!insideAnsi && !leftAnsi) {
      visibleCharacterIndex += 1;

      if (visibleCharacterIndex >= begin && visibleCharacterIndex < actualEnd) {
        // Add effecting ANSI escape codes.
        if (output === '') {
          effectingSgrParameters.forEach(v => {
            output = appendAnsiOutput(output, wrapToAnsi(v));
          });
        }
        output += character;
      }
    }
  }

  // Close ANSI escape if escape is ongoing.
  if (output !== '') {
    effectingSgrParameters.slice().reverse().forEach(sgrParameter => {
      const closeSgrParameter = findSgrCloseParameter(sgrParameter);
      output = appendAnsiOutput(output, wrapToAnsi(closeSgrParameter));
    });
  }

  return output;
};

module.exports = sliceAnsiString;
