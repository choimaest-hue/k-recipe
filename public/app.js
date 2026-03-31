const FALLBACK_IMAGE = "/images/default-recipe.svg";
const state = {
  recipes: [],
  activeCategory: "전체"
};

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    return map[char] || char;
  });
}

function getRecipeImage(recipe) {
  return recipe?.image?.trim() ? recipe.image.trim() : FALLBACK_IMAGE;
}

function getCategory(recipe) {
  return recipe?.category?.trim() ? recipe.category.trim() : "집밥";
}

function createFeaturedMarkup(recipe) {
  return `
    <article class="featured-card">
      <img class="featured-image" src="${escapeHtml(getRecipeImage(recipe))}" alt="${escapeHtml(recipe.title)}" loading="lazy" />
      <div>
        <span class="menu-index">${escapeHtml(getCategory(recipe))}</span>
        <h3>${escapeHtml(recipe.title)}</h3>
        <p>${escapeHtml(recipe.description || "따뜻한 밥과 잘 어울리는 메인 메뉴입니다.")}</p>
        <div class="badges">
          <span class="badge">${escapeHtml(recipe.servings || "인원 미정")}</span>
          <span class="badge">${escapeHtml(recipe.cookTime || "시간 미정")}</span>
          <span class="badge">맵기 ${escapeHtml(recipe.spicyLevel || "미정")}</span>
        </div>
        <p class="helper-text">💡 ${escapeHtml(recipe.tip || "오늘의 요리 팁이 표시됩니다.")}</p>
      </div>
    </article>
  `;
}

function createPreviewMarkup(recipe) {
  return `
    <article class="preview-card">
      <img class="preview-thumb" src="${escapeHtml(getRecipeImage(recipe))}" alt="${escapeHtml(recipe.title)}" loading="lazy" />
      <div class="preview-content">
        <span class="menu-index">${escapeHtml(getCategory(recipe))}</span>
        <h3>${escapeHtml(recipe.title)}</h3>
        <p class="meta">${escapeHtml(recipe.subtitle || "집밥 메뉴")}</p>
        <div class="badges compact-badges">
          <span class="badge">${escapeHtml(recipe.cookTime || "시간 미정")}</span>
          <span class="badge">${escapeHtml(recipe.servings || "인원 미정")}</span>
        </div>
      </div>
    </article>
  `;
}

function createRecipeRowMarkup(recipe, index) {
  return `
    <article class="recipe-row">
      <img class="recipe-thumb" src="${escapeHtml(getRecipeImage(recipe))}" alt="${escapeHtml(recipe.title)}" loading="lazy" />
      <div class="recipe-content">
        <div class="recipe-header">
          <div>
            <span class="menu-index">MENU ${String(index + 1).padStart(2, "0")} · ${escapeHtml(getCategory(recipe))}</span>
            <h3>${escapeHtml(recipe.title)}</h3>
            <p class="meta">${escapeHtml(recipe.subtitle || "집밥 레시피")}</p>
          </div>
          <div class="badges">
            <span class="badge">${escapeHtml(recipe.servings || "인원 미정")}</span>
            <span class="badge">${escapeHtml(recipe.cookTime || "시간 미정")}</span>
            <span class="badge">맵기 ${escapeHtml(recipe.spicyLevel || "미정")}</span>
          </div>
        </div>

        <p>${escapeHtml(recipe.description || "설명이 아직 없습니다.")}</p>

        <details class="recipe-details">
          <summary>재료와 만드는 법 보기</summary>
          <div class="details-grid">
            <div class="list-panel">
              <h4>재료</h4>
              <ul>
                ${(recipe.ingredients || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
              </ul>
            </div>
            <div class="list-panel">
              <h4>만드는 법</h4>
              <ol>
                ${(recipe.steps || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
              </ol>
            </div>
          </div>
        </details>

        <p class="helper-text">💡 ${escapeHtml(recipe.tip || "팁 없음")}</p>
      </div>
    </article>
  `;
}

function renderHome(recipes) {
  const featured = document.getElementById("featured-recipe");
  const homePreviewGrid = document.getElementById("home-preview-grid");

  if (featured) {
    featured.innerHTML = recipes.length
      ? createFeaturedMarkup(recipes[0])
      : '<p class="empty-state">아직 등록된 메뉴가 없습니다.</p>';
  }

  if (homePreviewGrid) {
    homePreviewGrid.innerHTML = recipes.length
      ? recipes.slice(0, 4).map(createPreviewMarkup).join("")
      : '<p class="empty-state">곧 맛있는 메뉴를 더 채워둘게요.</p>';
  }
}

function renderCategoryFilters(recipes) {
  const filterContainer = document.getElementById("category-filters");
  if (!filterContainer) return;

  const categories = ["전체", ...new Set(recipes.map(getCategory))];
  filterContainer.innerHTML = categories
    .map(
      (category) => `
        <button
          type="button"
          class="chip ${state.activeCategory === category ? "is-active" : ""}"
          data-category="${escapeHtml(category)}"
        >
          ${escapeHtml(category)}
        </button>
      `
    )
    .join("");

  filterContainer.querySelectorAll(".chip").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeCategory = button.dataset.category || "전체";
      renderCategoryFilters(state.recipes);
      renderRecipeLibrary();
    });
  });
}

function getFilteredRecipes() {
  const keyword = (document.getElementById("search-input")?.value || "").trim().toLowerCase();

  return state.recipes.filter((recipe) => {
    const matchesCategory = state.activeCategory === "전체" || getCategory(recipe) === state.activeCategory;
    const matchesKeyword = !keyword
      || [
        recipe.title,
        recipe.subtitle,
        recipe.description,
        recipe.spicyLevel,
        recipe.servings,
        recipe.cookTime,
        getCategory(recipe),
        ...(recipe.ingredients || [])
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword);

    return matchesCategory && matchesKeyword;
  });
}

function renderRecipeLibrary() {
  const list = document.getElementById("recipe-list");
  const menuCount = document.getElementById("menu-count");
  if (!list) return;

  const filteredRecipes = getFilteredRecipes();

  if (menuCount) {
    menuCount.textContent = `현재 ${filteredRecipes.length}개의 메뉴를 보고 있습니다.`;
  }

  list.innerHTML = filteredRecipes.length
    ? filteredRecipes.map((recipe, index) => createRecipeRowMarkup(recipe, index)).join("")
    : '<p class="empty-state">조건에 맞는 메뉴가 없습니다. 다른 검색어를 입력해보세요.</p>';
}

async function loadRecipes() {
  const featured = document.getElementById("featured-recipe");
  const list = document.getElementById("recipe-list");
  const homePreviewGrid = document.getElementById("home-preview-grid");
  const menuCount = document.getElementById("menu-count");

  try {
    const response = await fetch("/api/recipes");
    const recipes = await response.json();
    state.recipes = Array.isArray(recipes) ? recipes : [];

    renderHome(state.recipes);
    renderCategoryFilters(state.recipes);
    renderRecipeLibrary();

    const searchInput = document.getElementById("search-input");
    if (searchInput) {
      searchInput.addEventListener("input", renderRecipeLibrary);
    }
  } catch (error) {
    if (featured) {
      featured.innerHTML = '<p class="empty-state">레시피를 불러오지 못했습니다.</p>';
    }
    if (homePreviewGrid) {
      homePreviewGrid.innerHTML = '<p class="empty-state">서버 연결을 확인해 주세요.</p>';
    }
    if (list) {
      list.innerHTML = '<p class="empty-state">서버가 실행 중인지 확인해 주세요.</p>';
    }
    if (menuCount) {
      menuCount.textContent = "서버 연결을 확인해 주세요.";
    }
  }
}

loadRecipes();
