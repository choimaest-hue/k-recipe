const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const DATA_DIR = path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "recipes.json");
const DEFAULT_RECIPES = [
  {
    id: "recipe-kimchi-jjim",
    title: "집밥 김치찜",
    subtitle: "푹 익은 김치와 돼지고기로 완성하는 밥도둑 메뉴",
    category: "찜/조림",
    description: "새콤한 김치와 부드러운 고기를 푹 졸여내 깊은 맛이 나는 대표 집밥입니다.",
    servings: "2~3인분",
    cookTime: "약 45분",
    spicyLevel: "중",
    image: "/images/kimchi-jjim.svg",
    ingredients: ["돼지고기 목살 600g", "잘 익은 김치 1/4포기", "양파 1개", "대파 1대"],
    steps: ["냄비 바닥에 김치를 깔고 고기를 올립니다.", "양념과 물을 넣고 푹 끓입니다.", "국물을 졸여 진하게 마무리합니다."],
    tip: "묵은지를 쓰면 더 진한 맛이 납니다.",
    updatedAt: new Date().toISOString()
  }
];

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_RECIPES, null, 2), "utf8");
  }
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function sanitizeRecipe(input) {
  return {
    id: input.id || crypto.randomUUID(),
    title: String(input.title || "김치찜").trim(),
    subtitle: String(input.subtitle || "").trim(),
    category: String(input.category || "집밥").trim(),
    description: String(input.description || "").trim(),
    servings: String(input.servings || "").trim(),
    cookTime: String(input.cookTime || "").trim(),
    spicyLevel: String(input.spicyLevel || "").trim(),
    image: String(input.image || "").trim(),
    ingredients: normalizeList(input.ingredients),
    steps: normalizeList(input.steps),
    tip: String(input.tip || "").trim(),
    updatedAt: input.updatedAt ? String(input.updatedAt).trim() : new Date().toISOString()
  };
}

async function readLocalRecipes() {
  ensureDataFile();
  const raw = await fs.promises.readFile(DATA_FILE, "utf8");
  return JSON.parse(raw || "[]");
}

async function writeLocalRecipes(recipes) {
  await fs.promises.writeFile(DATA_FILE, JSON.stringify(recipes, null, 2), "utf8");
}

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

function toDbRecord(recipe) {
  return {
    id: recipe.id,
    title: recipe.title,
    subtitle: recipe.subtitle,
    category: recipe.category,
    description: recipe.description,
    servings: recipe.servings,
    cook_time: recipe.cookTime,
    spicy_level: recipe.spicyLevel,
    image: recipe.image,
    ingredients: recipe.ingredients,
    steps: recipe.steps,
    tip: recipe.tip,
    updated_at: recipe.updatedAt
  };
}

function fromDbRecord(row) {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle || "",
    category: row.category || "집밥",
    description: row.description || "",
    servings: row.servings || "",
    cookTime: row.cook_time || "",
    spicyLevel: row.spicy_level || "",
    image: row.image || "",
    ingredients: Array.isArray(row.ingredients) ? row.ingredients : [],
    steps: Array.isArray(row.steps) ? row.steps : [],
    tip: row.tip || "",
    updatedAt: row.updated_at || new Date().toISOString()
  };
}

async function ensureSupabaseSeeded(client) {
  const localRecipes = await readLocalRecipes();

  if (!localRecipes.length) {
    return;
  }

  const { error: seedError } = await client
    .from("recipes")
    .upsert(localRecipes.map((recipe) => toDbRecord(sanitizeRecipe(recipe))), { onConflict: "id" });

  if (seedError) {
    throw seedError;
  }
}

async function listRecipes() {
  const client = getSupabaseClient();

  if (client) {
    await ensureSupabaseSeeded(client);
    const { data, error } = await client.from("recipes").select("*").order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []).map(fromDbRecord);
  }

  const recipes = await readLocalRecipes();
  return recipes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

async function createRecipe(input) {
  const recipe = sanitizeRecipe(input);
  const client = getSupabaseClient();

  if (client) {
    const { data, error } = await client.from("recipes").insert(toDbRecord(recipe)).select("*").single();

    if (error) {
      throw error;
    }

    return fromDbRecord(data);
  }

  const recipes = await readLocalRecipes();
  recipes.unshift(recipe);
  await writeLocalRecipes(recipes);
  return recipe;
}

async function updateRecipe(id, input) {
  const client = getSupabaseClient();

  if (client) {
    const currentRecipes = await listRecipes();
    const current = currentRecipes.find((item) => item.id === id);

    if (!current) {
      return null;
    }

    const updatedRecipe = sanitizeRecipe({ ...current, ...input, id });
    const { data, error } = await client
      .from("recipes")
      .update(toDbRecord(updatedRecipe))
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return fromDbRecord(data);
  }

  const recipes = await readLocalRecipes();
  const index = recipes.findIndex((item) => item.id === id);

  if (index === -1) {
    return null;
  }

  const updatedRecipe = sanitizeRecipe({ ...recipes[index], ...input, id });
  recipes[index] = updatedRecipe;
  await writeLocalRecipes(recipes);
  return updatedRecipe;
}

async function deleteRecipe(id) {
  const client = getSupabaseClient();

  if (client) {
    const { error } = await client.from("recipes").delete().eq("id", id);
    if (error) {
      throw error;
    }
    return true;
  }

  const recipes = await readLocalRecipes();
  const filtered = recipes.filter((item) => item.id !== id);

  if (filtered.length === recipes.length) {
    return false;
  }

  await writeLocalRecipes(filtered);
  return true;
}

module.exports = {
  sanitizeRecipe,
  listRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe
};