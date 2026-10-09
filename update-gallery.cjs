
const fs = require("fs");

let code = fs.readFileSync("src/main.jsx", "utf-8");

// Remove the board duplicate
code = code.replace(
  `{ image: images.board, title: \x27Entrance sign\x27, area: \x27Wayfinding\x27 },`,
  ``
);

// We want to add missing images: frontDay, facade, banquet, bar, food, golf, lobby1, lobby2, lobby3, olive, pool, poolDay, palace, mosque, lake, gurudwara.
// We should group them nicely in the gallery array or just append them to specific places.
// Actually, let\x27s just append them at the end of the gallery array.

const additions = [
  `  { image: images.frontDay, title: \x27Resort day view\x27, area: \x27Exterior\x27 },`,
  `  { image: images.facade, title: \x27Classic facade\x27, area: \x27Arrival\x27 },`,
  `  { image: images.banquet, title: \x27Banquet setup\x27, area: \x27Events\x27 },`,
  `  { image: images.bar, title: \x27Classic Bar\x27, area: \x27Dining\x27 },`,
  `  { image: images.food, title: \x27Classic dish\x27, area: \x27Dining\x27 },`,
  `  { image: images.golf, title: \x27Golf cart\x27, area: \x27Grounds\x27 },`,
  `  { image: images.lobby1, title: \x27Classic lobby 1\x27, area: \x27Interior\x27 },`,
  `  { image: images.lobby2, title: \x27Classic lobby 2\x27, area: \x27Interior\x27 },`,
  `  { image: images.lobby3, title: \x27Classic lobby 3\x27, area: \x27Interior\x27 },`,
  `  { image: images.olive, title: \x27Classic olive tree\x27, area: \x27Landscape\x27 },`,
  `  { image: images.pool, title: \x27Classic pool\x27, area: \x27Leisure\x27 },`,
  `  { image: images.poolDay, title: \x27Classic pool day\x27, area: \x27Leisure\x27 },`,
  `  { image: images.palace, title: \x27Kapurthala Palace\x27, area: \x27Local Attractions\x27 },`,
  `  { image: images.mosque, title: \x27Moorish Mosque\x27, area: \x27Local Attractions\x27 },`,
  `  { image: images.lake, title: \x27Kanjli Wetland\x27, area: \x27Local Attractions\x27 },`,
  `  { image: images.gurudwara, title: \x27Sultanpur Lodhi\x27, area: \x27Local Attractions\x27 }`
];

code = code.replace(
  `{ image: images.room9, title: \x27Room Amenities\x27, area: \x27Rooms\x27 }`,
  `{ image: images.room9, title: \x27Room Amenities\x27, area: \x27Rooms\x27 },\n` + additions.join("\n")
);

// We might have an empty line where board was. Let\x27s clean it up if needed.
code = code.replace(/\n\s*\n\s*\{\s*image: images.roadsideBoard/, "\n  { image: images.roadsideBoard");

fs.writeFileSync("src/main.jsx", code, "utf-8");
console.log("Gallery updated.");
