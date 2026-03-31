const fs = require("fs");
const path = require("path");

const recipesPath = path.join(__dirname, "recipes.json");
const imagesDir = path.join(__dirname, "..", "public", "images");

const recipes = JSON.parse(fs.readFileSync(recipesPath, "utf8"));

let changed = 0;
for (const recipe of recipes) {
  if (!recipe.image) continue;

  const currentRel = recipe.image.replace(/^\//, "");
  const currentAbs = path.join(__dirname, "..", "public", currentRel);
  if (fs.existsSync(currentAbs)) continue;

  const fileName = path.basename(recipe.image);
  const prefixed = `/images/recipe-${fileName}`;
  const prefixedAbs = path.join(imagesDir, `recipe-${fileName}`);
  if (fs.existsSync(prefixedAbs)) {
    recipe.image = prefixed;
    changed += 1;
  }
}

fs.writeFileSync(recipesPath, JSON.stringify(recipes, null, 2) + "\n", "utf8");
console.log("updated image paths:", changed);
