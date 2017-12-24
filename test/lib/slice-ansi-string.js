const assert = require('assert');
const {describe, it} = require('mocha');

const sliceAnsiString = require('../../lib/slice-ansi-string');


describe('lib/slice-ansi-string', function() {
  const stringToArrayConsideringSurrogatePair = (str) => {
    return str.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[^\uD800-\uDFFF]/g) || [];
  };

  /**
   * fn('abc') -> [0, 1, 2]
   */
  const generateBeginIndexes = (str) => {
    return stringToArrayConsideringSurrogatePair(str).map((_, i) => i).concat([str.length, str.length + 1]);
  };

  const generateEndIndexes = (str) => {
    return generateBeginIndexes(str).concat([undefined]);
  };

  describe('ordinary string only', function() {
    describe('works like `string.slice`', function() {
      const strings = [
        'abcde',
        'あいうえお',
        'aあbいc',
        'あaいbう',
      ];

      strings.forEach(str => {
        generateBeginIndexes(str).forEach(begin => {
          generateEndIndexes(str).forEach(end => {
            const nativeSlice = str.slice(begin, end);
            const title = `sliceAnsiString("${str}", ${begin}, ${end}) === ` +
              ` "${str}".slice(${begin}, ${end}) === ` +
              `"${nativeSlice}"`;

            it(title, function() {
              assert.strictEqual(sliceAnsiString(str, begin, end), nativeSlice);
            });
          });
        });
      })
    });
  });

  describe('16 colors included', function() {
    it('works', function() {
    });
  });
});
