const express = require("express");
const path = require("path");
const { listRecipes } = require("./lib/recipeStore");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/recipes", async (req, res) => {
  try {
    const recipes = await listRecipes();
    return res.json(recipes);
  } catch (error) {
    console.error("Failed to fetch recipes:", error);
    return res.status(500).json({ message: "레시피를 불러오지 못했습니다." });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`K Recipe app is running at http://localhost:${PORT}`);
});
