const sliceAnsiString = require('../index');

const str = 'A\u001b[31mB\u001b[4mCD\u001b[24m\u001b[39mE';  // Meaning like "A<red>B<underline>CD</underline></red>E"

console.log(sliceAnsiString(str, 1, 3));  // -> "\u001b[31mB\u001b[4mC\u001b[24m\u001b[39m", meaning like "<red>B<underline>C</underline></red>"
