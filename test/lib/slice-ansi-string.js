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
    describe('single color string, such as `red("abc")`', function() {
      [
        'foreground',
        'background',
      ].forEach(describeTitle => {
        describe(describeTitle, function() {
          let wrapToRed;
          if (describeTitle === 'foreground') {
            wrapToRed = (str) => chalk.red(str);
          } else if (describeTitle === 'background') {
            wrapToRed = (str) => chalk.bgRed(str);
          }

          const str = wrapToRed('abc');

          it('(str, 0, 0) === ""', function() {
            assert.strictEqual(sliceAnsiString(str, 0, 0), '');
          });

          it('(str, 0, 1) === red("a")', function() {
            assert.strictEqual(sliceAnsiString(str, 0, 1), wrapToRed('a'));
          });

          it('(str, 0, 2) === red("ab")', function() {
            assert.strictEqual(sliceAnsiString(str, 0, 2), wrapToRed('ab'));
          });

          it('(str, 0, 3) === red("abc")', function() {
            assert.strictEqual(sliceAnsiString(str, 0, 3), wrapToRed('abc'));
          });

          it('(str, 0, 4) === red("abc")', function() {
            assert.strictEqual(sliceAnsiString(str, 0, 3), wrapToRed('abc'));
          });

          it('(str, 0) === red("abc")', function() {
            assert.strictEqual(sliceAnsiString(str, 0), wrapToRed('abc'));
          });

          it('(str, 2, 2) === ""', function() {
            assert.strictEqual(sliceAnsiString(str, 2, 2), '');
          });

          it('(str, 2, 3) === red("c")', function() {
            assert.strictEqual(sliceAnsiString(str, 2, 3), wrapToRed('c'));
          });

          it('(str, 2, 4) === red("c")', function() {
            assert.strictEqual(sliceAnsiString(str, 2, 4), wrapToRed('c'));
          });
        });
      });
    });

    describe('different colors are adjacent, such as `red("ab") + green("cd")`', function() {
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

    describe('ordinary string and colored string are adjacent, such as `"a" + red("b") + "c" + green("d")`', function() {
      const str = 'a' + chalk.red('b') + 'c' + chalk.green('d');

      it('(str, 0, 0) === ""', function() {
        assert.strictEqual(sliceAnsiString(str, 0, 0), '');
      });

      it('(str, 0, 1) === "a"', function() {
        assert.strictEqual(sliceAnsiString(str, 0, 1), 'a');
      });

      it('(str, 0, 2) === "a" + red("b")', function() {
        assert.strictEqual(sliceAnsiString(str, 0, 2), 'a' + chalk.red('b'));
      });

      it('(str, 0, 3) === "a" + red("b") + "c"', function() {
        assert.strictEqual(sliceAnsiString(str, 0, 3), 'a' + chalk.red('b') + 'c');
      });

      it('(str, 0, 4) === "a" + red("b") + "c" + green("d")', function() {
        assert.strictEqual(sliceAnsiString(str, 0, 4), 'a' + chalk.red('b') + 'c' + chalk.green('d'));
      });

      it('(str, 0, 5) === "a" + red("b") + "c" + green("d")', function() {
        assert.strictEqual(sliceAnsiString(str, 0, 4), 'a' + chalk.red('b') + 'c' + chalk.green('d'));
      });

      it('(str, 0) === "a" + red("b") + "c" + green("d")', function() {
        assert.strictEqual(sliceAnsiString(str, 0, 4), 'a' + chalk.red('b') + 'c' + chalk.green('d'));
      });

      it('(str, 1, 1) === ""', function() {
        assert.strictEqual(sliceAnsiString(str, 1, 1), '');
      });

      it('(str, 1, 2) === red("b")', function() {
        assert.strictEqual(sliceAnsiString(str, 1, 2), chalk.red('b'));
      });

      it('(str, 1, 3) === red("b") + "c"', function() {
        assert.strictEqual(sliceAnsiString(str, 1, 3), chalk.red('b') + 'c');
      });
    });
  });

  describe('256 colors included, such as `"a" + 256("bc") + red("d")`', function() {
    [
      'foreground',
      'background',
    ].forEach(describeTitle => {
      describe(describeTitle, function() {
        let wrapTo256;
        if (describeTitle === 'foreground') {
          wrapTo256 = (str) => `\u001b[38;5;001m${str}\u001b[39m`;
        } else if (describeTitle === 'background') {
          wrapTo256 = (str) => `\u001b[48;5;001m${str}\u001b[49m`;
        }

        const str = 'a' + wrapTo256('bc') + chalk.red('d');

        it('(str, 0, 0) === ""', function() {
          assert.strictEqual(sliceAnsiString(str, 0, 0), '');
        });

        it('(str, 0, 1) === "a"', function() {
          assert.strictEqual(sliceAnsiString(str, 0, 1), 'a');
        });

        it('(str, 0, 2) === "a" + 256("b")', function() {
          assert.strictEqual(sliceAnsiString(str, 0, 2), 'a' + wrapTo256('b'));
        });

        it('(str, 0, 3) === "a" + 256("bc")', function() {
          assert.strictEqual(sliceAnsiString(str, 0, 3), 'a' + wrapTo256('bc'));
        });

        it('(str, 0, 4) === "a" + 256("bc") + "d"', function() {
          assert.strictEqual(sliceAnsiString(str, 0, 4), 'a' + wrapTo256('bc') + chalk.red('d'));
        });

        it('(str, 0, 5) === "a" + 256("bc") + "d"', function() {
          assert.strictEqual(sliceAnsiString(str, 0, 5), 'a' + wrapTo256('bc') + chalk.red('d'));
        });

        it('(str, 0) === "a" + 256("bc") + "d"', function() {
          assert.strictEqual(sliceAnsiString(str, 0, 4), 'a' + wrapTo256('bc') + chalk.red('d'));
        });

        it('(str, 2, 2) === ""', function() {
          assert.strictEqual(sliceAnsiString(str, 2, 2), '');
        });

        it('(str, 2, 3) === 256("c")', function() {
          assert.strictEqual(sliceAnsiString(str, 2, 3), wrapTo256('c'));
        });

        it('(str, 2, 4) === 256("c") + red("d")', function() {
          assert.strictEqual(sliceAnsiString(str, 2, 4), wrapTo256('c') + chalk.red('d'));
        });

        it('(str, 2, 5) === 256("c") + red("d")', function() {
          assert.strictEqual(sliceAnsiString(str, 2, 5), wrapTo256('c') + chalk.red('d'));
        });

        it('(str, 3, 3) === ""', function() {
          assert.strictEqual(sliceAnsiString(str, 3, 3), '');
        });

        it('(str, 3, 4) === red("d")', function() {
          assert.strictEqual(sliceAnsiString(str, 3, 4), chalk.red('d'));
        });
      });
    });
  });

  describe('other SGR effects included', function() {
    [
      'bold',
      'dim',
      'italic',
      'underline',
      'inverse',
      'hidden',
      'strikethrough',
    ].forEach(chalkMethodName => {
      describe(`${chalkMethodName}, such as \`"a" + ${chalkMethodName}("bc") + "d"\``, function() {
        const str = 'a' + chalk[chalkMethodName]('bc') + 'd';

        it('(str, 0, 0) === ""', function() {
          assert.strictEqual(sliceAnsiString(str, 0, 0), '');
        });

        it('(str, 0, 1) === "a"', function() {
          assert.strictEqual(sliceAnsiString(str, 0, 1), 'a');
        });

        it(`(str, 0, 2) === "a" + ${chalkMethodName}("b")`, function() {
          assert.strictEqual(sliceAnsiString(str, 0, 2), 'a' + chalk[chalkMethodName]('b'));
        });

        it(`(str, 0, 3) === "a" + ${chalkMethodName}("bc")`, function() {
          assert.strictEqual(sliceAnsiString(str, 0, 3), 'a' + chalk[chalkMethodName]('bc'));
        });

        it(`(str, 0, 4) === "a" + ${chalkMethodName}("bc") + "d"`, function() {
          assert.strictEqual(sliceAnsiString(str, 0, 4), 'a' + chalk[chalkMethodName]('bc') + 'd');
        });

        it(`(str, 0, 5) === "a" + ${chalkMethodName}("bc") + "d"`, function() {
          assert.strictEqual(sliceAnsiString(str, 0, 4), 'a' + chalk[chalkMethodName]('bc') + 'd');
        });

        it(`(str, 0) === "a" + ${chalkMethodName}("bc") + "d"`, function() {
          assert.strictEqual(sliceAnsiString(str, 0, 4), 'a' + chalk[chalkMethodName]('bc') + 'd');
        });

        it('(str, 2, 2) === ""', function() {
          assert.strictEqual(sliceAnsiString(str, 2, 2), '');
        });

        it(`(str, 2, 3) === ${chalkMethodName}("c")`, function() {
          assert.strictEqual(sliceAnsiString(str, 2, 3), chalk[chalkMethodName]('c'));
        });

        it(`(str, 2, 4) === ${chalkMethodName}("c") + "d"`, function() {
          assert.strictEqual(sliceAnsiString(str, 2, 4), chalk[chalkMethodName]('c') + 'd');
        });

        it('(str, 3, 3) === ""', function() {
          assert.strictEqual(sliceAnsiString(str, 3, 3), '');
        });

        it('(str, 3, 4) === "d"', function() {
          assert.strictEqual(sliceAnsiString(str, 3, 4), 'd');
        });
      });
    });
  });
});
