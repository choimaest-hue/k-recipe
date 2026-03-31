const fs = require("fs");
const path = require("path");

const recipesPath = path.join(__dirname, "recipes.json");
const imagesDir = path.join(__dirname, "..", "public", "images");

const recipes = JSON.parse(fs.readFileSync(recipesPath, "utf8"));

const missing = [];
for (const recipe of recipes) {
  const imagePath = recipe.image || "";
  const rel = imagePath.replace(/^\//, "");
  const full = path.join(__dirname, "..", "public", rel);
  if (!fs.existsSync(full)) {
    missing.push({ id: recipe.id, image: recipe.image });
  }
}

console.log("total recipes:", recipes.length);
console.log("missing images:", missing.length);
if (missing.length) {
  for (const item of missing) {
    console.log(`- ${item.id} -> ${item.image}`);
  }
}
