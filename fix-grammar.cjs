
const fs = require("fs");

let code = fs.readFileSync("src/main.jsx", "utf-8");

code = code.replace("Kapurthala most", "Kapurthala\x27s most");
code = code.replace("guests plates", "guests\x27 plates");
code = code.replace("flawless night sleep", "flawless night\x27s sleep");
code = code.replace("resort lush", "resort\x27s lush");

fs.writeFileSync("src/main.jsx", code, "utf-8");
console.log("Fixed grammar.");
