const FALLBACK_IMAGE = "/images/default-recipe.svg";
const SPICY_LEVEL_META = {
  하: { count: 0, label: "맵지 않음", icon: "🥛" },
  중: { count: 1, label: "조금 매운", icon: "🌶️" },
  상: { count: 2, label: "매운", icon: "🌶️" },
  아주매움: { count: 3, label: "아주 매운", icon: "🌶️" }
};
// 기본 조미료/양념료/조리용 재료들 - buildIngredientInventory에서 제외
const EXCLUDED_INGREDIENTS = new Set([
  "물", "소금", "설탕", "마늘", "다진마늘", "마늘간", 
  "식용유", "기름", "참기름", "들기름", "고춧가루",
  "간장", "국간장", "식초", "고추장", "된장", "쌈장",
  "맛술", "미림", "굴소스", "케첩", "마요네즈", "물엿",
  "올리고당", "후추", "소금약간", "설탕약간", "간장약간",
  "고춧가루약간", "유", "유기", "물기", "껍질", "대", "줌", "장",
  "불린", "삶은", "슬라이스", "채썬", "다진", "간", "거기"
]);

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
  "참치",
  "무",
  "당근",
  "상추",
  "시금치",
  "미역",
  "깻잎",
  "양배추",
  "고구마",
  "순대",
  "라면",
  "햄",
  "소시지",
  "고사리",
  "숙주나물",
  "우거지",
  "나물",
  "전",
  "떡볶이",
  "찹쌀",
  "대추",
  "인삼",
  "소면",
  "오이",
  "부침가루",
  "신라면",
  "찬"
];
const SAUCE_ALIASES = {
  고추장: ["고추장"],
  된장: ["된장"],
  간장: ["간장", "국간장", "진간장", "양조간장"],
  고춧가루: ["고춧가루"],
  쌈장: ["쌈장"],
  식초: ["식초"],
  설탕: ["설탕"],
  맛술: ["맛술", "미림"],
  참기름: ["참기름"],
  들기름: ["들기름"],
  굴소스: ["굴소스"],
  케첩: ["케첩"],
  마요네즈: ["마요네즈"],
  물엿: ["물엿", "올리고당"]
};
const INGREDIENT_NORMALIZE_MAP = {
  달걀: "계란",
  파: "대파",
  쪽파: "대파",
  당근채: "당근",
  당근채썬것: "당근",
  채썬당근: "당근",
  양배추: "양배추",
  떡국떡: "떡"
};
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
  availableIngredients: [],
  availableSauces: [],
  activeCategory: "전체",
  selectedIngredients: new Set(),
  selectedSauces: new Set(),
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

function normalizeIngredientName(value = "") {
  const name = String(value).trim();
  return INGREDIENT_NORMALIZE_MAP[name] || name;
}

function canonicalizeIngredientName(value = "") {
  const normalized = normalizeIngredientName(value);
  const compact = normalizeText(normalized);

  for (const [base, aliases] of Object.entries(INGREDIENT_ALIASES)) {
    const candidates = [base, ...aliases];
    const matched = candidates.some((alias) => {
      const aliasCompact = normalizeText(alias);
      return compact.includes(aliasCompact) || aliasCompact.includes(compact);
    });

    if (matched) {
      return base;
    }
  }

  return normalized;
}

function extractIngredientName(raw = "") {
  const cleaned = String(raw)
    .replace(/\([^)]*\)/g, " ")
    .replace(/[·,/~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const stripped = cleaned
    .replace(/\d+(?:\.\d+)?\s*(?:kg|g|ml|l|컵|큰술|작은술|큰스푼|작은스푼|개|모|대|줄|장|마리|알|봉|포기|줌|조각|스푼)/gi, " ")
    .replace(/\d+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const NOISE_TOKENS = new Set([
    "약간", "조금", "적당량", "넉넉히", "약", "기호에", "따라", "기호", "가능",
    "한", "두", "세", "네", "반",
    "한개", "두개", "세개", "네개", "반개",
    "개", "모", "대", "줄", "장", "마리", "알", "봉", "포기", "줌", "조각", "컵", "큰술", "작은술", "스푼",
    // 조미료 제외 토큰들
    "물", "소금", "설탕", "마늘", "다진", "간", "식용유", "기름", "참기름", "들기름",
    "고춧가루", "간장", "국간장", "식초", "고추장", "된장", "쌈장", 
    "맛술", "미림", "굴소스", "케첩", "마요네즈", "물엿", "올리고당",
    "후추", "소금약간", "또는", "육수"
  ]);

  const base = stripped || cleaned;
  const tokens = base
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean)
    .filter((token) => !NOISE_TOKENS.has(token));

  if (!tokens.length) return "";

  const pairCandidate = tokens.slice(0, 2).join(" ").trim();
  const singleCandidate = tokens[0] || "";

  const pairCanonical = canonicalizeIngredientName(pairCandidate);
  const singleCanonical = canonicalizeIngredientName(singleCandidate);

  // Prefer a canonical pair only when it resolves to a known canonical ingredient.
  if (pairCanonical && INGREDIENT_ALIASES[pairCanonical]) {
    return pairCanonical;
  }

  return singleCanonical || pairCanonical;
}

function buildIngredientInventory(recipes) {
  const set = new Set(COMMON_INGREDIENTS.map(normalizeIngredientName)
    .filter((item) => !EXCLUDED_INGREDIENTS.has(item)));

  recipes.forEach((recipe) => {
    (recipe.ingredients || []).forEach((item) => {
      const extracted = extractIngredientName(item);
      if (extracted && !EXCLUDED_INGREDIENTS.has(extracted)) {
        set.add(extracted);
      }
    });
  });

  return Array.from(set)
    .filter((item) => item.length > 0 && !EXCLUDED_INGREDIENTS.has(item))
    .sort((a, b) => a.localeCompare(b, "ko"));
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

// 맵기를 0-3 숫자로 변환 (0=하, 1=중, 2=상, 3=아주매움)
function getSpicyLevel(spicyLevel) {
  const normalized = normalizeSpicyLevel(spicyLevel);
  const map = { 하: 0, 중: 1, 상: 2, 아주매움: 3 };
  return map[normalized] !== undefined ? map[normalized] : 1;
}

// 맵기 점수 계산: 정확히 맞으면 15점, 양 옆이면 5점, 아니면 0점
function getSpicyScore(selectedSpicy, recipeSpicy) {
  if (selectedSpicy === "상관없음") return 0;
  
  const selectedLevel = getSpicyLevel(selectedSpicy);
  const recipeLevel = getSpicyLevel(recipeSpicy);
  const diff = Math.abs(selectedLevel - recipeLevel);
  
  if (diff === 0) return 15;  // 정확히 맞음
  if (diff === 1) return 5;   // 양 옆 (조금 다름)
  return 0;                   // 2 이상 차이
}

// 맵기 경고 메시지 생성
function getSpicyWarning(selectedSpicy, recipeSpicy) {
  if (selectedSpicy === "상관없음") return null;
  
  const selectedLevel = getSpicyLevel(selectedSpicy);
  const recipeLevel = getSpicyLevel(recipeSpicy);
  
  if (selectedLevel === recipeLevel) return null;  // 정확히 맞으면 경고 없음
  if (recipeLevel > selectedLevel) return "🌶️ 매움 유의";  // 더 매움
  if (recipeLevel < selectedLevel) return "🧊 싱거울 수 있음";  // 덜 매움
  
  return null;
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
  // 명시적인 styles 필드가 있으면 첫 번째 스타일 사용
  if (recipe.styles && Array.isArray(recipe.styles) && recipe.styles.length > 0) {
    return recipe.styles[0];
  }

  // 레거시 category 기반 추론
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

function matchesSauce(recipe, sauce) {
  const haystack = normalizeText([
    recipe.title,
    recipe.subtitle,
    recipe.description,
    ...(recipe.ingredients || [])
  ].join(" "));

  const aliases = SAUCE_ALIASES[sauce] || [sauce];
  return aliases.some((alias) => haystack.includes(normalizeText(alias)));
}

function getMatchedIngredients(recipe) {
  return Array.from(state.selectedIngredients).filter((ingredient) => matchesIngredient(recipe, ingredient));
}

function getRecipeCoreIngredients(recipe) {
  const fromRecipe = (recipe.ingredients || [])
    .map(extractIngredientName)
    .map(normalizeIngredientName)
    .filter(Boolean);

  return Array.from(new Set(fromRecipe));
}

function getIngredientGapInfo(recipe, matchedIngredients) {
  const coreIngredients = getRecipeCoreIngredients(recipe);

  if (state.selectedIngredients.size === 0) {
    return {
      level: "확인 필요",
      text: "재료를 선택하면 부족 정도를 계산해드려요.",
      className: "is-pending"
    };
  }

  if (coreIngredients.length === 0) {
    return {
      level: "판단 어려움",
      text: "재료 정보가 적어 부족 정도를 정확히 계산하기 어려워요.",
      className: "is-pending"
    };
  }

  const missingIngredients = coreIngredients.filter((item) => !state.selectedIngredients.has(item));
  const missingCount = missingIngredients.length;

  if (missingCount === 0) {
    return {
      level: "완비",
      text: "재료 부족 0개 · 지금 바로 만들 수 있어요.",
      className: "is-good",
      missingCount: 0
    };
  }

  if (missingCount <= 2) {
    return {
      level: "조금 부족",
      text: `재료 부족 ${missingCount}개 · ${missingIngredients.slice(0, 3).join(", ")}`,
      className: "is-mid",
      missingCount
    };
  }

  return {
    level: "많이 부족",
    text: `재료 부족 ${missingCount}개 · ${missingIngredients.slice(0, 3).join(", ")}`,
    className: "is-low",
    missingCount
  };
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

function createRecommendCardMarkup(recipe, score, matchedIngredients, matchedSauces, gapInfo, spicyWarning) {
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
  if (state.selectedSauces.size > 0 && matchedSauces.length) {
    reasons.push(`${matchedSauces.join(", ")} 소스와 잘 맞아요.`);
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
        ${(state.selectedSauces.size > 0 && matchedSauces.length
          ? matchedSauces.map((item) => `<span class="match-tag">소스 ${escapeHtml(item)}</span>`).join("")
          : "")}
      </div>
      <p class="ingredient-gap ${escapeHtml(gapInfo.className || "is-pending")}">재료 상태 · ${escapeHtml(gapInfo.level)}<br />${escapeHtml(gapInfo.text)}</p>
      ${spicyWarning ? `<p class="spicy-warning">${escapeHtml(spicyWarning)}</p>` : ""}
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

  const ingredientSearchInput = document.getElementById("ingredient-search");
  const ingredientKeyword = normalizeText(ingredientSearchInput?.value || "");

  const availableIngredients = state.availableIngredients
    .filter((ingredient) => state.recipes.some((recipe) => matchesIngredient(recipe, ingredient)))
    .filter((ingredient) => !ingredientKeyword || normalizeText(ingredient).includes(ingredientKeyword));

  if (!availableIngredients.length) {
    ingredientContainer.innerHTML = '<p class="ingredient-empty">검색된 재료가 없습니다. 다른 키워드를 입력해 보세요.</p>';
    return;
  }

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
      renderIngredientSuggestionDropdown();
      renderRecommender();
      renderRecipeLibrary();
    });
  });
}

function renderIngredientSuggestionDropdown() {
  const suggestionBox = document.getElementById("ingredient-suggest-list");
  const ingredientSearchInput = document.getElementById("ingredient-search");
  if (!suggestionBox || !ingredientSearchInput) return;

  const keyword = ingredientSearchInput.value.trim().toLowerCase();
  if (!keyword) {
    suggestionBox.innerHTML = "";
    suggestionBox.hidden = true;
    return;
  }

  // 정규화된 키워드로 검색
  const normalizedKeyword = normalizeText(keyword);
  
  // 1단계: 입력 글자로 시작하는 재료들 (정확한 매치 우선)
  const exactMatches = state.availableIngredients
    .filter((item) => {
      const normalized = normalizeText(item);
      return normalized.startsWith(normalizedKeyword) && !state.selectedIngredients.has(item);
    });

  // 2단계: 입력 글자를 포함하는 재료들 (포함 매치)
  const partialMatches = state.availableIngredients
    .filter((item) => {
      const normalized = normalizeText(item);
      return normalized.includes(normalizedKeyword) && 
             !normalized.startsWith(normalizedKeyword) && 
             !state.selectedIngredients.has(item);
    });

  // 정확한 매치를 우선적으로 표시 (최대 12개)
  const suggestions = [...exactMatches, ...partialMatches].slice(0, 12);

  if (!suggestions.length) {
    suggestionBox.innerHTML = '<p class="ingredient-suggest-empty">추천 재료가 없습니다.</p>';
    suggestionBox.hidden = false;
    return;
  }

  suggestionBox.innerHTML = suggestions
    .map((item) => {
      // 검색 키워드 부분을 굵게 표시
      const normalized = normalizeText(item);
      const displayHtml = item.replace(
        new RegExp(`(${keyword})`, 'gi'),
        '<strong>$1</strong>'
      );
      return `<button type="button" class="ingredient-suggest-item" data-suggest-ingredient="${escapeHtml(item)}">${displayHtml}</button>`;
    })
    .join("");
  suggestionBox.hidden = false;

  suggestionBox.querySelectorAll("[data-suggest-ingredient]").forEach((button) => {
    button.addEventListener("click", () => {
      const ingredient = button.dataset.suggestIngredient || "";
      if (!ingredient) return;
      state.selectedIngredients.add(ingredient);
      ingredientSearchInput.value = "";
      renderIngredientSelector();
      renderIngredientSuggestionDropdown();
      renderRecommender();
      renderRecipeLibrary();
    });
  });
}

function renderSauceSelector() {
  const sauceContainer = document.getElementById("sauce-chip-list");
  if (!sauceContainer) return;

  if (!state.availableSauces.length) {
    sauceContainer.innerHTML = '<p class="ingredient-empty">등록된 레시피에서 선택 가능한 소스를 찾지 못했습니다.</p>';
    return;
  }

  sauceContainer.innerHTML = state.availableSauces
    .map(
      (sauce) => `
        <button
          type="button"
          class="chip sauce-chip ${state.selectedSauces.has(sauce) ? "is-selected" : ""}"
          data-sauce="${escapeHtml(sauce)}"
        >
          ${escapeHtml(sauce)}
        </button>
      `
    )
    .join("");

  sauceContainer.querySelectorAll("[data-sauce]").forEach((button) => {
    button.addEventListener("click", () => {
      const sauce = button.dataset.sauce || "";
      if (!sauce) return;
      if (state.selectedSauces.has(sauce)) {
        state.selectedSauces.delete(sauce);
      } else {
        state.selectedSauces.add(sauce);
      }
      renderSauceSelector();
      renderRecommender();
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
      const matchedSauces = Array.from(state.selectedSauces).filter((sauce) => matchesSauce(recipe, sauce));
      const gapInfo = getIngredientGapInfo(recipe, matchedIngredients);
      const spicyWarning = getSpicyWarning(state.selectedSpicy, recipe.spicyLevel);
      
      let score = matchedIngredients.length * 4;

      // 재료 완전 일치 보너스
      if (state.selectedIngredients.size > 0 && matchedIngredients.length === state.selectedIngredients.size) {
        score += 2;
      }

      // 스타일 매칭: 정확히 맞으면 8점 (기존)
      if (state.selectedStyle !== "상관없음" && getRecipeStyle(recipe) === state.selectedStyle) {
        score += 8;
      }

      // 맵기 매칭: 개선된 시스템
      // - 정확히 맞으면 15점
      // - 양 옆이면 5점
      // - 아니면 0점
      const spicyScore = getSpicyScore(state.selectedSpicy, recipe.spicyLevel);
      score += spicyScore;

      // 소스 매칭
      if (state.selectedSauces.size > 0) {
        score += matchedSauces.length * 3;
        if (matchedSauces.length === state.selectedSauces.size) {
          score += 2;
        }
      }

      // 재료 부족도 보너스
      if (typeof gapInfo.missingCount === "number") {
        score += Math.max(0, 3 - gapInfo.missingCount);
      }

      // 아무것도 선택하지 않으면 약간의 보너스
      if (state.selectedIngredients.size === 0 && state.selectedStyle === "상관없음" && state.selectedSpicy === "상관없음") {
        score += 1;
      }

      return { recipe, score, matchedIngredients, matchedSauces, gapInfo, spicyWarning, spicyScore };
    })
    .filter(({ score, matchedIngredients, matchedSauces, recipe }) => {
      if (state.selectedIngredients.size > 0 && matchedIngredients.length === 0) {
        return false;
      }
      if (state.selectedSpicy !== "상관없음" && getSpicyScore(state.selectedSpicy, recipe.spicyLevel) === 0 && score < 3) {
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
  const selectedSauceText = state.selectedSauces.size
    ? ` 소스 ${Array.from(state.selectedSauces).join(", ")}도 함께 반영했습니다.`
    : "";

  summary.textContent = `${selectedIngredientText}${selectedSauceText} 현재 ${recommendations.length}개의 추천 메뉴를 보여드립니다.`;
  results.innerHTML = recommendations
    .map(({ recipe, score, matchedIngredients, matchedSauces, gapInfo, spicyWarning }) => createRecommendCardMarkup(recipe, score, matchedIngredients, matchedSauces, gapInfo, spicyWarning))
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

  const ingredientSearchInput = document.getElementById("ingredient-search");
  if (ingredientSearchInput) {
    ingredientSearchInput.addEventListener("input", () => {
      renderIngredientSelector();
      renderIngredientSuggestionDropdown();
    });

    ingredientSearchInput.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      const suggestionBox = document.getElementById("ingredient-suggest-list");
      const first = suggestionBox?.querySelector("[data-suggest-ingredient]");
      if (!first) return;
      event.preventDefault();
      first.click();
    });
  }

  const resetButton = document.getElementById("reset-recommender");
  if (resetButton) {
    resetButton.addEventListener("click", () => {
      state.selectedIngredients.clear();
      state.selectedSauces.clear();
      state.selectedStyle = "상관없음";
      state.selectedSpicy = "상관없음";
      if (styleSelect) styleSelect.value = "상관없음";
      if (spicySelect) spicySelect.value = "상관없음";
      if (ingredientSearchInput) ingredientSearchInput.value = "";
      renderIngredientSelector();
      renderIngredientSuggestionDropdown();
      renderSauceSelector();
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
    state.availableIngredients = buildIngredientInventory(state.recipes);
    state.availableSauces = Object.keys(SAUCE_ALIASES).filter((sauce) => state.recipes.some((recipe) => matchesSauce(recipe, sauce)));

    renderHome(state.recipes);
    renderCategoryFilters(state.recipes);
    renderIngredientSelector();
    renderIngredientSuggestionDropdown();
    renderSauceSelector();
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
