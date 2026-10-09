
const fs = require("fs");

let code = fs.readFileSync("src/main.jsx", "utf-8");

code = code.replace("200?300", "200-300");
code = code.replace("400?1500", "400-1500");

fs.writeFileSync("src/main.jsx", code, "utf-8");
console.log("Fixed question marks.");
