const sliceAnsiString = require('../index');

const str = 'A\u001b[31mBC\u001b[39mD';  // Meaning like "A<red>BC</red>D"

console.log(sliceAnsiString(str, 0, 1));  // -> "A"
console.log(sliceAnsiString(str, 0, 2));  // -> "A\u001b[31mB\u001b[39m", meaning like "A<red>B</red>"
console.log(sliceAnsiString(str, 2, 3));  // -> "\u001b[31mC\u001b[39m", meaning like "<red>C</red>"
