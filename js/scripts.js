// ================= VARIÁVEIS GLOBAIS =================
const pages = document.querySelectorAll(".page");
const dots = document.querySelectorAll(".scroll-dots .dot");
const navbar = document.querySelector(".navbar");
const scrollDots = document.querySelector(".scroll-dots");
const contactPopup = document.querySelector(".contact-popup");
const logoLink = document.getElementById("logo-link");

let currentIndex = 0;
let isScrolling = false;
let touchStartY = 0;
let scrollTimeout;
let modalOpen = false; // 🔥 NOVO: Detecta se modal está aberto

// ================= FUNÇÃO PARA MOSTRAR PÁGINA =================
function showPage(index) {
  if (index < 0 || index >= pages.length) return;

  pages.forEach((page, i) => {
    page.style.transform = `translateY(${(i - index) * 100}%)`;
    page.classList.toggle("visible", i === index);
  });

  dots.forEach((dot, i) => dot.classList.toggle("active", i === index));
  currentIndex = index;
}

// ================= SCROLL ENTRE PÁGINAS =================
function scrollToPage(direction) {
  if (isScrolling || modalOpen) return;

  let newIndex = currentIndex;
  if (direction === "down" && newIndex < pages.length - 1) newIndex++;
  else if (direction === "up" && newIndex > 0) newIndex--;
  else return;

  isScrolling = true;
  showPage(newIndex);
  setTimeout(() => { isScrolling = false; }, 700);
}

// ================= OBSERVER PARA NAVBAR, DOTS E POPUP =================
const firstSection = document.querySelector(".page.banner");

if (firstSection) {
  navbar?.classList.remove('visible');
  scrollDots && (scrollDots.style.opacity = '0');
  contactPopup?.classList.remove('visible');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navbar?.classList.remove('visible');
        scrollDots && (scrollDots.style.opacity = '0');
        contactPopup?.classList.remove('visible');
      } else {
        navbar?.classList.add('visible');
        scrollDots && (scrollDots.style.opacity = '1');
        contactPopup?.classList.add('visible');
      }
    });
  }, { threshold: 1 });

  observer.observe(firstSection);
}

// ================= EVENT LISTENERS =================

// Clique nos dots
dots.forEach((dot, index) => {
  dot.addEventListener("click", () => {
    if (!modalOpen && index !== currentIndex) showPage(index);
  });
});

function showDots() { scrollDots.style.opacity = '1'; }
function hideDots() { scrollDots.style.opacity = '0.3'; }
hideDots();

// Scroll via mouse
window.addEventListener("wheel", (e) => {
  if (modalOpen) return; // 🔥 BLOQUEIA TUDO
  e.preventDefault();
  showDots();
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(hideDots, 1000);

  if (e.deltaY > 10) scrollToPage("down");
  else if (e.deltaY < -10) scrollToPage("up");
}, { passive: false });

// Scroll via touch
window.addEventListener('touchstart', e => touchStartY = e.touches[0].clientY, { passive: true });
window.addEventListener('touchend', e => {
  if (modalOpen) return; // 🔥 BLOQUEIA SWIPE
  const deltaY = touchStartY - e.changedTouches[0].clientY;
  if (deltaY > 50) scrollToPage("down");
  else if (deltaY < -50) scrollToPage("up");
});

// ================= Pull-to-refresh CUSTOM =================
(function() {
  const banner = document.querySelector('.page.banner');
  if (!banner) return;

  let startY = 0;
  let startTime = 0;
  let moved = false;
  const MIN_DISTANCE = 70;
  const MAX_HORIZONTAL_DELTA = 50;
  const MAX_DURATION = 900;
  const MOBILE_MAX = 768;

  const hint = (() => {
    const el = document.createElement('div');
    el.id = 'ptp-refresh-hint';
    el.style.position = 'fixed';
    el.style.top = '14px';
    el.style.left = '50%';
    el.style.transform = 'translateX(-50%)';
    el.style.padding = '8px 12px';
    el.style.background = 'rgba(0,0,0,0.6)';
    el.style.color = '#fff';
    el.style.borderRadius = '999px';
    el.style.fontSize = '14px';
    el.style.zIndex = 20000;
    el.style.pointerEvents = 'none';
    el.style.opacity = '0';
    el.style.transition = 'opacity .18s ease, transform .18s ease';
    el.textContent = 'Puxa para atualizar';
    document.body.appendChild(el);
    return el;
  })();

  function showHint() { hint.style.opacity = '1'; }
  function hideHint() { hint.style.opacity = '0'; }
  function isMobile() { return window.innerWidth <= MOBILE_MAX; }

  banner.addEventListener('touchstart', (e) => {
    if (!isMobile() || modalOpen) return; // 🔥 Não ativa dentro de modal
    const t = e.touches[0];
    startY = t.clientY;
    startX = t.clientX;
    startTime = Date.now();
    moved = false;
  }, { passive: true });

  banner.addEventListener('touchmove', (e) => {
    if (!isMobile() || modalOpen) return; // 🔥 Não ativa dentro de modal
    const t = e.touches[0];
    const dy = t.clientY - startY;
    const dx = Math.abs(t.clientX - (startX || 0));
    if (dy > 20 && dx < MAX_HORIZONTAL_DELTA) {
      showHint();
      moved = true;
    }
  }, { passive: true });

  banner.addEventListener('touchend', (e) => {
    if (!isMobile() || modalOpen) return; // 🔥 BLOQUEADO NO MODAL
    hideHint();

    if (!moved) return;

    const touch = e.changedTouches[0];
    const dy = touch.clientY - startY;
    const dx = Math.abs(touch.clientX - (startX || 0));
    const dt = Date.now() - startTime;

    if (dy >= MIN_DISTANCE && dx <= MAX_HORIZONTAL_DELTA && dt <= MAX_DURATION) {
      if (window.__ptp_refresh_triggered) return;
      window.__ptp_refresh_triggered = true;

      hint.textContent = 'A atualizar...';
      hint.style.opacity = '1';

      setTimeout(() => location.reload(), 220);
    }
  }, { passive: true });

  window.addEventListener('resize', () => {
    hideHint();
    window.__ptp_refresh_triggered = false;
  });
})();

// ================= Bootstrap Modal: BLOQUEIO TOTAL DE SCROLL =================
document.addEventListener('show.bs.modal', function () {
  modalOpen = true;
  document.body.classList.add("modal-open-custom");
  isScrolling = true; // impede páginas
  scrollDots && (scrollDots.style.display = 'none');
});

document.addEventListener('hidden.bs.modal', function () {
  modalOpen = false;
  document.body.classList.remove("modal-open-custom");
  isScrolling = false;
  scrollDots && (scrollDots.style.display = 'flex');
});

// Popup toggle
const toggleBtn = contactPopup?.querySelector('.popup-toggle');
if (toggleBtn) {
  toggleBtn.addEventListener('click', () => {
    contactPopup.classList.toggle('open');
  });
}

// Logo volta à primeira página
if (logoLink) {
  logoLink.addEventListener('click', e => {
    e.preventDefault();
    if (!modalOpen && currentIndex !== 0) showPage(0);
  });
}

// Mostrar primeira página ao carregar
showPage(currentIndex);

// ================= Cards Swipe =================
document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".cards-mobile .cards-container");
  if (!container) return;

  const cards = container.children;
  if (!cards.length) return;

  let currentIndex = 0;
  let startX = 0;

  function updatePosition() {
    const offset = cards[0].offsetWidth + 16;
    container.style.transform = `translateX(${-currentIndex * offset}px)`;
  }

  container.addEventListener("touchstart", (e) => {
    if (modalOpen) return;
    startX = e.touches[0].clientX;
  });

  container.addEventListener("touchend", (e) => {
    if (modalOpen) return;
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) currentIndex++;
      else currentIndex--;
      if (currentIndex < 0) currentIndex = cards.length - 1;
      if (currentIndex >= cards.length) currentIndex = 0;
      updatePosition();
    }
  });
});

// ================= Cards Tutorial =================

const cardsSection = document.querySelector('.cards-mobile');
const tutorialVideo = document.querySelector('.cards-video-overlay');
let tutorialPlayed = false;

if (cardsSection && tutorialVideo) {
  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !tutorialPlayed) {
        tutorialPlayed = true;
        tutorialVideo.classList.add('visible');
        tutorialVideo.play();
        tutorialVideo.addEventListener('ended', () => {
          tutorialVideo.classList.remove('visible');
        });
      }
    });
  }, { threshold: 4 });

  videoObserver.observe(cardsSection);
}

