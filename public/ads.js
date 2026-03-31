const KRECIPE_AD_CLIENT = "ca-pub-3397494907696633";

// Replace the values below with the real AdSense ad slot IDs from your dashboard.
const KRECIPE_AD_SLOTS = {
  homeWide: "",
  homeBottom: "",
  recipesTop: "",
  recipesBottom: "",
  aboutPromo: "",
  contactPromo: "",
  privacyPromo: ""
};

function isValidAdSlot(slot) {
  return /^\d{8,}$/.test(String(slot || "").trim());
}

function renderAdUnit(container) {
  const slotKey = container.dataset.adSlotKey || "";
  const slot = KRECIPE_AD_SLOTS[slotKey];
  const body = container.querySelector(".ad-slot-body");

  if (!body) {
    return;
  }

  if (!isValidAdSlot(slot)) {
    body.innerHTML = `
      <div class="ad-slot-placeholder">
        <strong>광고 영역 준비 완료</strong>
        <p>AdSense 승인 후 <code>public/ads.js</code>의 <code>${slotKey}</code> 값에 광고 슬롯 ID를 넣으면 실제 광고가 표시됩니다.</p>
      </div>
    `;
    return;
  }

  const adElement = document.createElement("ins");
  adElement.className = "adsbygoogle";
  adElement.style.display = "block";
  adElement.setAttribute("data-ad-client", KRECIPE_AD_CLIENT);
  adElement.setAttribute("data-ad-slot", slot);
  adElement.setAttribute("data-ad-format", "auto");
  adElement.setAttribute("data-full-width-responsive", "true");

  body.innerHTML = "";
  body.appendChild(adElement);

  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  } catch (error) {
    console.warn("AdSense init skipped:", error);
  }
}

function initKRecipeAds() {
  document.querySelectorAll("[data-ad-slot-key]").forEach(renderAdUnit);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initKRecipeAds);
} else {
  initKRecipeAds();
}
