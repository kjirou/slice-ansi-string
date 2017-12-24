# slice-ansi-string

[![npm version](https://badge.fury.io/js/slice-ansi-string.svg)](https://badge.fury.io/js/slice-ansi-string)
[![Build Status](https://travis-ci.org/kjirou/slice-ansi-string.svg?branch=master)](https://travis-ci.org/kjirou/slice-ansi-string)

Slice a string included [ANSI escape codes](https://en.wikipedia.org/wiki/ANSI_escape_code)

In some use cases [slice-ansi](https://github.com/chalk/slice-ansi) did not work properly.
This is what I reworked with reference to [slice-ansi](https://github.com/chalk/slice-ansi).


## Installation

```bash
npm install slice-ansi-string
```


## Usage
### Basic usage

```js
const sliceAnsiString = require('slice-ansi-string');

const str = 'A\u001b[31mBC\u001b[39mD';  // Meaning like "A<red>BC</red>D"

console.log(sliceAnsiString(str, 0, 1));  // -> "A"
console.log(sliceAnsiString(str, 0, 2));  // -> "A\u001b[31mB\u001b[39m", meaning like "A<red>B</red>"
console.log(sliceAnsiString(str, 2, 3));  // -> "\u001b[31mC\u001b[39m", meaning like "<red>C</red>"
```

### Nested ANSI escape codes

```js
const sliceAnsiString = require('slice-ansi-string');

const str = 'A\u001b[31mB\u001b[4mCD\u001b[24m\u001b[39mE';  // Meaning like "A<red>B<underline>CD</underline></red>E"

console.log(sliceAnsiString(str, 1, 3));  // -> "\u001b[31mB\u001b[4mC\u001b[24m\u001b[39m", meaning like "<red>B<underline>C</underline></red>"
```


## API
### sliceAnsiString(str, beginSlice, [endSlice])
#### Arguments

- `str: string`
- `beginSlice: number`
  - A zero-based index of where to begin the slice.
  - Only 0 or more.
- `endSlice: (string|null|undefined)`
  - A zero-based index of where to end the slice.
  - Only 0 or more.
  - The default is until the end.

#### Supplements

- Multibyte characters and surrogate pairs are counted as one character.
- It may not be possible to correspond to the character string output by [chalk](https://github.com/chalk/chalk).
  - For example, `chalk.dim.bold('A')` outputs `"\u001b[2m\u001b[1mA\u001b[2m\u001b[22m"`, but this library expects `"\u001b[2m\u001b[1mA\u001b[22m\u001b[22m"`.
  - However, `chalk.bold.underline.red('A')` returns expected outputs, so it may be a specific problem of `dim.bold`.
