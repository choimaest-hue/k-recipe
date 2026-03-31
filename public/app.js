const FALLBACK_IMAGE = "/images/default-recipe.svg";
const SPICY_LEVEL_META = {
  하: { count: 0, label: "맵지 않음", icon: "🥛" },
  중: { count: 1, label: "조금 매운", icon: "🌶️" },
  상: { count: 2, label: "매운", icon: "🌶️" },
  아주매움: { count: 3, label: "아주 매운", icon: "🌶️" }
};
const COMMON_INGREDIENTS = [
  "김치",
  "돼지고기",
  "소고기",
  "닭고기",
  "두부",
  "계란",
  "감자",
  "양파",
  "대파",
  "애호박",
  "버섯",
  "당면",
  "오징어",
  "어묵",
  "떡",
  "콩나물",
  "바지락",
  "치즈",
  "김",
  "참치"
];
const INGREDIENT_ALIASES = {
  김치: ["김치", "묵은지"],
  돼지고기: ["돼지고기", "삼겹살", "목살", "앞다리살", "갈비", "베이컨", "햄"],
  소고기: ["소고기", "불고기", "양지", "사태"],
  닭고기: ["닭", "닭고기"],
  두부: ["두부", "순두부"],
  계란: ["계란", "달걀"],
  감자: ["감자"],
  양파: ["양파"],
  대파: ["대파", "파"],
  애호박: ["애호박", "호박"],
  버섯: ["버섯", "표고", "느타리"],
  당면: ["당면"],
  오징어: ["오징어"],
  어묵: ["어묵"],
  떡: ["떡", "떡국떡"],
  콩나물: ["콩나물"],
  바지락: ["바지락", "조개", "해물"],
  치즈: ["치즈"],
  김: ["김"],
  참치: ["참치"]
};

const state = {
  recipes: [],
  activeCategory: "전체",
  selectedIngredients: new Set(),
  selectedStyle: "상관없음",
  selectedSpicy: "상관없음",
  currentPage: 1,
  pageSize: 6
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

function normalizeText(value = "") {
  return String(value).replace(/\s+/g, "").toLowerCase();
}

function getRecipeImage(recipe) {
  return recipe?.image?.trim() ? recipe.image.trim() : FALLBACK_IMAGE;
}

function getCategory(recipe) {
  return recipe?.category?.trim() ? recipe.category.trim() : "집밥";
}

function normalizeSpicyLevel(value = "") {
  const input = String(value).trim().toLowerCase();
  if (!input || input === "상관없음") return "상관없음";

  if (["하", "순한", "순한맛", "mild", "low", "1"].includes(input)) return "하";
  if (["중", "보통", "보통맛", "normal", "medium", "2"].includes(input)) return "중";
  if (["상", "매운", "매운맛", "hot", "3"].includes(input)) return "상";
  if (["아주매움", "아주 매움", "아주매운맛", "매우매움", "veryhot", "extra hot", "4"].includes(input)) return "아주매움";

  return "중";
}

function getSpicyLevelCount(spicyLevel) {
  const normalized = normalizeSpicyLevel(spicyLevel);
  return SPICY_LEVEL_META[normalized]?.count || 0;
}

function getSpicyLevelLabel(spicyLevel) {
  const normalized = normalizeSpicyLevel(spicyLevel);
  return SPICY_LEVEL_META[normalized]?.label || "맵기 정보 없음";
}

function getSpicySymbol(spicyLevel) {
  const normalized = normalizeSpicyLevel(spicyLevel);
  return SPICY_LEVEL_META[normalized]?.icon || "🙂";
}

function renderSpicyBadge(spicyLevel) {
  const normalized = normalizeSpicyLevel(spicyLevel);
  const count = getSpicyLevelCount(spicyLevel);
  const label = getSpicyLevelLabel(normalized);
  const symbol = getSpicySymbol(normalized);
  if (!count) {
    return `<span class="badge spicy-badge" aria-label="${escapeHtml(label)}">${escapeHtml(symbol)} ${escapeHtml(label)}</span>`;
  }

  return `<span class="badge spicy-badge" aria-label="${escapeHtml(label)}">${symbol.repeat(count)} ${escapeHtml(label)}</span>`;
}

function getRecipeStyle(recipe) {
  const category = getCategory(recipe);
  const title = recipe?.title || "";

  if (["찌개", "국/탕"].includes(category) || /국|탕|찌개/.test(title)) return "국물요리";
  if (category.includes("볶음")) return "볶음";
  if (category.includes("찜") || category.includes("조림")) return "찜/조림";
  if (category.includes("한그릇")) return "한그릇";
  if (category.includes("분식")) return "분식";
  if (category.includes("반찬")) return "반찬";
  if (category.includes("고기") || category.includes("특별식")) return "고기요리";

  return category;
}

function matchesIngredient(recipe, ingredient) {
  const haystack = normalizeText([
    recipe.title,
    recipe.subtitle,
    recipe.description,
    ...(recipe.ingredients || [])
  ].join(" "));

  const aliases = INGREDIENT_ALIASES[ingredient] || [ingredient];
  return aliases.some((alias) => haystack.includes(normalizeText(alias)));
}

function getMatchedIngredients(recipe) {
  return Array.from(state.selectedIngredients).filter((ingredient) => matchesIngredient(recipe, ingredient));
}

function createFeaturedMarkup(recipe) {
  return `
    <article class="featured-card card-clickable" data-recipe-id="${escapeHtml(recipe.id)}">
      <img class="featured-image" src="${escapeHtml(getRecipeImage(recipe))}" alt="${escapeHtml(recipe.title)}" loading="lazy" />
      <div>
        <span class="menu-index">${escapeHtml(getCategory(recipe))}</span>
        <h3>${escapeHtml(recipe.title)}</h3>
        <p>${escapeHtml(recipe.description || "따뜻한 밥과 잘 어울리는 메인 메뉴입니다.")}</p>
        <div class="badges">
          <span class="badge">${escapeHtml(recipe.servings || "인원 미정")}</span>
          <span class="badge">${escapeHtml(recipe.cookTime || "시간 미정")}</span>
          ${renderSpicyBadge(recipe.spicyLevel || "미정")}
        </div>
        <p class="helper-text">💡 ${escapeHtml(recipe.tip || "오늘의 요리 팁이 표시됩니다.")}</p>
        <a class="text-link" href="/recipes.html">이 메뉴 자세히 보기 →</a>
      </div>
    </article>
  `;
}

function createPreviewMarkup(recipe) {
  return `
    <article class="preview-card card-clickable" data-recipe-id="${escapeHtml(recipe.id)}">
      <img class="preview-thumb" src="${escapeHtml(getRecipeImage(recipe))}" alt="${escapeHtml(recipe.title)}" loading="lazy" />
      <div class="preview-content">
        <span class="menu-index">${escapeHtml(getCategory(recipe))}</span>
        <h3>${escapeHtml(recipe.title)}</h3>
        <p class="meta">${escapeHtml(recipe.subtitle || "집밥 메뉴")}</p>
        <div class="badges compact-badges">
          <span class="badge">${escapeHtml(recipe.cookTime || "시간 미정")}</span>
          <span class="badge">${escapeHtml(recipe.servings || "인원 미정")}</span>
        </div>
        <a class="text-link" href="/recipes.html">레시피 페이지에서 계속 보기 →</a>
      </div>
    </article>
  `;
}

function createRecipeRowMarkup(recipe, index) {
  const matchedIngredients = getMatchedIngredients(recipe);

  return `
    <article class="recipe-row card-clickable" data-recipe-id="${escapeHtml(recipe.id)}">
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
            ${renderSpicyBadge(recipe.spicyLevel || "미정")}
          </div>
        </div>

        <p>${escapeHtml(recipe.description || "설명이 아직 없습니다.")}</p>

        ${matchedIngredients.length ? `
          <div class="match-tags">
            ${matchedIngredients.map((item) => `<span class="match-tag">${escapeHtml(item)} 매칭</span>`).join("")}
          </div>
        ` : ""}

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

function createRecommendCardMarkup(recipe, score, matchedIngredients) {
  const reasons = [];

  if (matchedIngredients.length) {
    reasons.push(`${matchedIngredients.join(", ")} 재료를 활용할 수 있어요.`);
  }
  if (state.selectedStyle !== "상관없음") {
    reasons.push(`${state.selectedStyle} 취향과 잘 맞습니다.`);
  }
  if (state.selectedSpicy !== "상관없음") {
    reasons.push(`맵기 ${getSpicyLevelLabel(state.selectedSpicy)} 기준에 가까워요.`);
  }

  return `
    <article class="recommend-card card-clickable" data-recipe-id="${escapeHtml(recipe.id)}">
      <div class="recommend-top">
        <div>
          <span class="menu-index">${escapeHtml(getCategory(recipe))}</span>
          <h4>${escapeHtml(recipe.title)}</h4>
        </div>
        <span class="recommend-score">추천 점수 ${score}</span>
      </div>
      <p class="meta">${escapeHtml(recipe.subtitle || recipe.description || "집밥 메뉴")}</p>
      <div class="match-tags">
        ${(matchedIngredients.length
          ? matchedIngredients.map((item) => `<span class="match-tag">${escapeHtml(item)}</span>`).join("")
          : '<span class="match-tag">재료 범용 추천</span>')}
      </div>
      <p class="helper-inline">${escapeHtml(reasons[0] || "지금 만들기 쉬운 메뉴로 골라드렸어요.")}</p>
      <a class="text-link" href="/recipes.html">상세 레시피 보기 →</a>
    </article>
  `;
}

function renderHome(recipes) {
  const featured = document.getElementById("featured-recipe");
  const homePreviewGrid = document.getElementById("home-preview-grid");

  if (featured) {
    const randomRecipe = recipes.length
      ? recipes[Math.floor(Math.random() * recipes.length)]
      : null;

    featured.innerHTML = randomRecipe
      ? createFeaturedMarkup(randomRecipe)
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
      state.currentPage = 1;
      renderCategoryFilters(state.recipes);
      renderRecipeLibrary();
    });
  });
}

function renderIngredientSelector() {
  const ingredientContainer = document.getElementById("ingredient-chip-list");
  if (!ingredientContainer) return;

  const availableIngredients = COMMON_INGREDIENTS.filter((ingredient) => state.recipes.some((recipe) => matchesIngredient(recipe, ingredient)));

  ingredientContainer.innerHTML = availableIngredients
    .map(
      (ingredient) => `
        <button
          type="button"
          class="chip ingredient-chip ${state.selectedIngredients.has(ingredient) ? "is-selected" : ""}"
          data-ingredient="${escapeHtml(ingredient)}"
        >
          ${escapeHtml(ingredient)}
        </button>
      `
    )
    .join("");

  ingredientContainer.querySelectorAll("[data-ingredient]").forEach((button) => {
    button.addEventListener("click", () => {
      const ingredient = button.dataset.ingredient || "";
      if (state.selectedIngredients.has(ingredient)) {
        state.selectedIngredients.delete(ingredient);
      } else {
        state.selectedIngredients.add(ingredient);
      }
      renderIngredientSelector();
      renderRecommender();
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

function getRecommendedRecipes() {
  return state.recipes
    .map((recipe) => {
      const matchedIngredients = getMatchedIngredients(recipe);
      let score = matchedIngredients.length * 4;

      if (state.selectedIngredients.size > 0 && matchedIngredients.length === state.selectedIngredients.size) {
        score += 2;
      }
      if (state.selectedStyle !== "상관없음" && getRecipeStyle(recipe) === state.selectedStyle) {
        score += 2;
      }
      if (state.selectedSpicy !== "상관없음" && normalizeSpicyLevel(recipe.spicyLevel) === normalizeSpicyLevel(state.selectedSpicy)) {
        score += 2;
      }
      if (state.selectedIngredients.size === 0 && state.selectedStyle === "상관없음" && state.selectedSpicy === "상관없음") {
        score += 1;
      }

      return { recipe, score, matchedIngredients };
    })
    .filter(({ score, matchedIngredients, recipe }) => {
      if (state.selectedIngredients.size > 0 && matchedIngredients.length === 0) {
        return false;
      }
      if (state.selectedStyle !== "상관없음" && getRecipeStyle(recipe) !== state.selectedStyle) {
        return false;
      }
      if (state.selectedSpicy !== "상관없음" && normalizeSpicyLevel(recipe.spicyLevel) !== normalizeSpicyLevel(state.selectedSpicy) && score < 3) {
        return false;
      }
      return score > 0;
    })
    .sort((a, b) => b.score - a.score || b.matchedIngredients.length - a.matchedIngredients.length || a.recipe.title.localeCompare(b.recipe.title, "ko"));
}

function renderPagination(totalItems) {
  const pagination = document.getElementById("pagination-controls");
  if (!pagination) return;

  const totalPages = Math.max(1, Math.ceil(totalItems / state.pageSize));
  state.currentPage = Math.min(state.currentPage, totalPages);

  if (totalPages <= 1) {
    pagination.innerHTML = "";
    return;
  }

  let buttons = `
    <button type="button" class="chip pagination-btn" data-page="${Math.max(1, state.currentPage - 1)}" ${state.currentPage === 1 ? "disabled" : ""}>이전</button>
  `;

  for (let page = 1; page <= totalPages; page += 1) {
    buttons += `
      <button type="button" class="chip pagination-btn ${page === state.currentPage ? "is-active" : ""}" data-page="${page}">${page}</button>
    `;
  }

  buttons += `
    <button type="button" class="chip pagination-btn" data-page="${Math.min(totalPages, state.currentPage + 1)}" ${state.currentPage === totalPages ? "disabled" : ""}>다음</button>
  `;

  pagination.innerHTML = buttons;
  pagination.querySelectorAll("[data-page]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextPage = Number(button.dataset.page || state.currentPage);
      if (nextPage === state.currentPage) return;
      state.currentPage = nextPage;
      renderRecipeLibrary();
      const listTop = document.getElementById("recipe-list");
      if (listTop) {
        listTop.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
}

function renderRecommender() {
  const summary = document.getElementById("recommender-summary");
  const results = document.getElementById("recommender-results");
  if (!summary || !results) return;

  const hasFilters = state.selectedIngredients.size > 0 || state.selectedStyle !== "상관없음" || state.selectedSpicy !== "상관없음";
  const recommendations = hasFilters ? getRecommendedRecipes().slice(0, 5) : state.recipes.slice(0, 3).map((recipe) => ({ recipe, score: 1, matchedIngredients: [] }));

  if (!recommendations.length) {
    summary.textContent = "선택한 재료와 조건에 딱 맞는 메뉴가 아직 없어요. 다른 재료를 골라보세요.";
    results.innerHTML = '<p class="empty-state">추천 결과가 없습니다.</p>';
    return;
  }

  const selectedIngredientText = state.selectedIngredients.size
    ? `선택한 재료 ${Array.from(state.selectedIngredients).join(", ")} 기준으로 추천했어요.`
    : "재료를 고르면 추천 정확도가 더 올라갑니다.";

  summary.textContent = `${selectedIngredientText} 현재 ${recommendations.length}개의 추천 메뉴를 보여드립니다.`;
  results.innerHTML = recommendations
    .map(({ recipe, score, matchedIngredients }) => createRecommendCardMarkup(recipe, score, matchedIngredients))
    .join("");
}

function renderRecipeLibrary() {
  const list = document.getElementById("recipe-list");
  const menuCount = document.getElementById("menu-count");
  if (!list) return;

  const filteredRecipes = getFilteredRecipes();
  const totalPages = Math.max(1, Math.ceil(filteredRecipes.length / state.pageSize));
  state.currentPage = Math.min(state.currentPage, totalPages);
  const startIndex = (state.currentPage - 1) * state.pageSize;
  const pagedRecipes = filteredRecipes.slice(startIndex, startIndex + state.pageSize);

  if (menuCount) {
    menuCount.textContent = `총 ${filteredRecipes.length}개 메뉴 중 ${state.currentPage}/${totalPages} 페이지를 보고 있습니다.`;
  }

  list.innerHTML = filteredRecipes.length
    ? pagedRecipes.map((recipe, index) => createRecipeRowMarkup(recipe, startIndex + index)).join("")
    : '<p class="empty-state">조건에 맞는 메뉴가 없습니다. 다른 검색어를 입력해보세요.</p>';

  renderPagination(filteredRecipes.length);
}

function bindInteractiveControls() {
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      state.currentPage = 1;
      renderRecipeLibrary();
    });
  }

  const styleSelect = document.getElementById("style-select");
  if (styleSelect) {
    styleSelect.addEventListener("change", (event) => {
      state.selectedStyle = event.target.value;
      renderRecommender();
    });
  }

  const spicySelect = document.getElementById("spicy-select");
  if (spicySelect) {
    spicySelect.addEventListener("change", (event) => {
      state.selectedSpicy = normalizeSpicyLevel(event.target.value);
      renderRecommender();
    });
  }

  const resetButton = document.getElementById("reset-recommender");
  if (resetButton) {
    resetButton.addEventListener("click", () => {
      state.selectedIngredients.clear();
      state.selectedStyle = "상관없음";
      state.selectedSpicy = "상관없음";
      if (styleSelect) styleSelect.value = "상관없음";
      if (spicySelect) spicySelect.value = "상관없음";
      renderIngredientSelector();
      renderRecommender();
      renderRecipeLibrary();
    });
  }
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
    renderIngredientSelector();
    renderRecommender();
    renderRecipeLibrary();
    bindInteractiveControls();
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

/* ── Modal ─────────────────────────────────── */
function renderModalContent(recipe) {
  const spicyLabel = getSpicyLevelLabel(recipe.spicyLevel);
  const spicySymbol = getSpicySymbol(recipe.spicyLevel);
  const spicyCount = getSpicyLevelCount(recipe.spicyLevel);
  const spicyStr = spicyCount ? spicySymbol.repeat(spicyCount) : spicySymbol;

  return `
    <div class="modal-image-wrap">
      <img src="${escapeHtml(getRecipeImage(recipe))}" alt="${escapeHtml(recipe.title)}" />
    </div>
    <div class="modal-body-inner">
      <div class="modal-meta-row">
        <span class="badge">${escapeHtml(getCategory(recipe))}</span>
        <span class="badge">${escapeHtml(recipe.servings || "-")}</span>
        <span class="badge">${escapeHtml(recipe.cookTime || "-")}</span>
        <span class="badge spicy-badge" aria-label="${escapeHtml(spicyLabel)}">${spicyStr} ${escapeHtml(spicyLabel)}</span>
      </div>
      <h2 class="modal-title" id="modal-title">${escapeHtml(recipe.title)}</h2>
      <p class="modal-subtitle">${escapeHtml(recipe.subtitle || "")}</p>
      <p class="modal-desc">${escapeHtml(recipe.description || "")}</p>
      <div class="modal-grid">
        <div class="modal-panel">
          <h3>재료</h3>
          <ul>
            ${(recipe.ingredients || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </div>
        <div class="modal-panel">
          <h3>만드는 법</h3>
          <ol>
            ${(recipe.steps || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ol>
        </div>
      </div>
      ${recipe.tip ? `<p class="modal-tip">💡 ${escapeHtml(recipe.tip)}</p>` : ""}
    </div>
  `;
}

function openRecipeModal(recipeId) {
  const recipe = state.recipes.find((r) => r.id === recipeId);
  if (!recipe) return;

  const modal = document.getElementById("recipe-modal");
  const body = document.getElementById("modal-body");
  if (!modal || !body) return;

  body.innerHTML = renderModalContent(recipe);
  modal.hidden = false;
  body.scrollTop = 0;
  document.body.classList.add("modal-open");
  document.getElementById("modal-close")?.focus();
}

function closeRecipeModal() {
  const modal = document.getElementById("recipe-modal");
  if (modal) modal.hidden = true;
  document.body.classList.remove("modal-open");
}

document.addEventListener("click", (e) => {
  const card = e.target.closest("[data-recipe-id]");
  if (card) {
    e.preventDefault();
    openRecipeModal(card.dataset.recipeId);
    return;
  }
  if (e.target.id === "modal-backdrop" || e.target.id === "modal-close") {
    closeRecipeModal();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeRecipeModal();
});
