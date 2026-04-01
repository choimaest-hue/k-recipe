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
    body.innerHTML = "";
    body.classList.add("ad-slot-empty");
    return;
  }

  body.classList.remove("ad-slot-empty");

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
