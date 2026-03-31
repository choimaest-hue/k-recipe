const { listRecipes } = require("../lib/recipeStore");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ message: "허용되지 않은 메서드입니다." });
  }

  try {
    const recipes = await listRecipes();
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json(recipes);
  } catch (error) {
    console.error("Failed to fetch recipes:", error);
    return res.status(500).json({ message: "레시피를 불러오지 못했습니다." });
  }
};