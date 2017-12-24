const assert = require('assert');
const chalk = require('chalk');
const {describe, it} = require('mocha');

const sliceAnsiString = require('../../lib/slice-ansi-string');


describe('lib/slice-ansi-string', function() {
  const SURROGATE_PAIR_CHARACTER = '\uD867\uDE3D';  // === "\u{29E3D}"

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
    describe('working like `string.slice`', function() {
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

    describe('consideration of surrogate pair', function() {
      it('works', function() {
        const str = SURROGATE_PAIR_CHARACTER.repeat(3);
        assert.strictEqual(sliceAnsiString(str, 0, 1), SURROGATE_PAIR_CHARACTER);
        assert.strictEqual(sliceAnsiString(str, 0, 2), SURROGATE_PAIR_CHARACTER.repeat(2));
        assert.strictEqual(sliceAnsiString(str, 0, 3), SURROGATE_PAIR_CHARACTER.repeat(3));
        assert.strictEqual(sliceAnsiString(str, 0, 4), SURROGATE_PAIR_CHARACTER.repeat(3));
        assert.strictEqual(sliceAnsiString(str, 1, 3), SURROGATE_PAIR_CHARACTER.repeat(2));
        assert.strictEqual(sliceAnsiString(str, 1, 4), SURROGATE_PAIR_CHARACTER.repeat(2));
        assert.strictEqual(sliceAnsiString(str, 2, 4), SURROGATE_PAIR_CHARACTER);
        assert.strictEqual(sliceAnsiString(str, 3, 4), '');
        assert.strictEqual(sliceAnsiString(str, 4, 4), '');
      });
    });
  });

  describe('16 colors included', function() {
    describe('single color string', function() {
      const str = chalk.red('abc');

      it('(str, 0, 0) === ""', function() {
        assert.strictEqual(sliceAnsiString(str, 0, 0), '');
      });

      it('(str, 0, 1) === red("a")', function() {
        assert.strictEqual(sliceAnsiString(str, 0, 1), chalk.red('a'));
      });

      it('(str, 0, 2) === red("ab")', function() {
        assert.strictEqual(sliceAnsiString(str, 0, 2), chalk.red('ab'));
      });

      it('(str, 0, 3) === red("abc")', function() {
        assert.strictEqual(sliceAnsiString(str, 0, 3), chalk.red('abc'));
      });

      it('(str, 0, 4) === red("abc")', function() {
        assert.strictEqual(sliceAnsiString(str, 0, 3), chalk.red('abc'));
      });

      it('(str, 0) === red("abc")', function() {
        assert.strictEqual(sliceAnsiString(str, 0), chalk.red('abc'));
      });

      it('(str, 2, 2) === ""', function() {
        assert.strictEqual(sliceAnsiString(str, 2, 2), '');
      });

      it('(str, 2, 3) === red("c")', function() {
        assert.strictEqual(sliceAnsiString(str, 2, 3), chalk.red('c'));
      });

      it('(str, 2, 4) === red("c")', function() {
        assert.strictEqual(sliceAnsiString(str, 2, 4), chalk.red('c'));
      });
    });

    describe('different colors are adjacent', function() {
      const str = chalk.red('ab') + chalk.green('cd');

      it('(str, 1, 1) === ""', function() {
        assert.strictEqual(sliceAnsiString(str, 1, 1), '');
      });

      it('(str, 1, 2) === red("b")', function() {
        assert.strictEqual(sliceAnsiString(str, 1, 2), chalk.red('b'));
      });

      it('(str, 1, 3) === red("b") + green("c")', function() {
        assert.strictEqual(sliceAnsiString(str, 1, 3), chalk.red('b') + chalk.green('c'));
      });

      it('(str, 1, 4) === red("b") + green("cd")', function() {
        assert.strictEqual(sliceAnsiString(str, 1, 4), chalk.red('b') + chalk.green('cd'));
      });

      it('(str, 1, 5) === red("b") + green("cd")', function() {
        assert.strictEqual(sliceAnsiString(str, 1, 4), chalk.red('b') + chalk.green('cd'));
      });

      it('(str, 1) === red("b") + green("cd")', function() {
        assert.strictEqual(sliceAnsiString(str, 1, 4), chalk.red('b') + chalk.green('cd'));
      });
    });
  });
});
