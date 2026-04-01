(function () {
  const MOBILE_ROOT = "/m";
  const MOBILE_INDEX = "/m/index.html";

  function toMobilePath(pathname) {
    if (pathname === "/" || pathname === "/index.html") return MOBILE_INDEX;
    return MOBILE_ROOT + pathname;
  }

  function toDesktopPath(pathname) {
    if (!pathname.startsWith(MOBILE_ROOT + "/")) return pathname;
    const desktop = pathname.slice(MOBILE_ROOT.length) || "/";
    if (desktop === "/index.html") return "/";
    return desktop;
  }

  function initViewSwitch() {
    const mount = document.getElementById("view-switch");
    if (!mount) return;

    const pathname = window.location.pathname;
    const isMobileView = pathname.startsWith(MOBILE_ROOT + "/");
    const desktopPath = toDesktopPath(pathname);
    const mobilePath = toMobilePath(desktopPath);

    mount.innerHTML = "";

    const webLink = document.createElement("a");
    webLink.href = desktopPath;
    webLink.textContent = "웹";
    if (!isMobileView) webLink.classList.add("is-active");

    const mobileLink = document.createElement("a");
    mobileLink.href = mobilePath;
    mobileLink.textContent = "모바일";
    if (isMobileView) mobileLink.classList.add("is-active");

    mount.appendChild(webLink);
    mount.appendChild(mobileLink);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initViewSwitch);
  } else {
    initViewSwitch();
  }
})();
