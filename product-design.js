const productNav = document.querySelector(".product-nav");
const productImage = document.querySelector(".product-design__image");
const navButtons = document.querySelectorAll("[data-scroll-ratio]");

const darkRanges = [
  [0, 1030],
  [2860, 3548],
  [4448, Number.POSITIVE_INFINITY],
];

function getImageNaturalHeight() {
  return productImage?.naturalHeight || 5442;
}

function getImageRenderedHeight() {
  return productImage?.getBoundingClientRect().height || document.documentElement.scrollHeight;
}

function getDesignYAtNav() {
  const navRect = productNav.getBoundingClientRect();
  const sampleY = window.scrollY + navRect.top + navRect.height * 0.55;
  const imageTop = productImage.getBoundingClientRect().top + window.scrollY;
  const imageY = Math.max(0, sampleY - imageTop);

  return (imageY / Math.max(1, getImageRenderedHeight())) * getImageNaturalHeight();
}

function isDarkAtNav() {
  const designY = getDesignYAtNav();

  return darkRanges.some(([start, end]) => designY >= start && designY < end);
}

function syncNavTone() {
  if (!productNav) return;

  productNav.classList.toggle("product-nav--dark", isDarkAtNav());
  productNav.classList.toggle("product-nav--light", !isDarkAtNav());
}

function scrollToDesignRatio(ratio) {
  const imageTop = productImage.getBoundingClientRect().top + window.scrollY;
  const targetY = imageTop + getImageRenderedHeight() * ratio;

  window.scrollTo({
    top: Math.max(0, targetY),
    behavior: "smooth",
  });
}

let ticking = false;

function requestToneSync() {
  if (ticking) return;

  ticking = true;
  window.requestAnimationFrame(() => {
    syncNavTone();
    ticking = false;
  });
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    scrollToDesignRatio(Number(button.dataset.scrollRatio || 0));
  });
});

window.addEventListener("scroll", requestToneSync, { passive: true });
window.addEventListener("resize", requestToneSync);

if (productImage?.complete) {
  syncNavTone();
} else {
  productImage?.addEventListener("load", syncNavTone, { once: true });
}
