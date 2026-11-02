"use strict";

/* =========================================================
   SETTINGS - the only part you need to edit
   ========================================================= */

// Password is stored as a SHA-256 hash, so it is not readable in the source.
// The hash below is for the password:  friends123
// To use your own password: open the page, press F12 -> Console, type
//     makeHash("yourpassword")
// then paste the long text it prints between the quotes below.
const PASSWORD_HASH = "92fe1e84e35ee22f96a491b8249fd21628203a09965d31c3bf7d1769913c3e8f";

// Your photos. Put the files in the "photos" folder and list them here.
const PHOTOS = [
  { src: "photos/photo1.jpg", caption: "Photo 1" },
  { src: "photos/photo2.jpg", caption: "Photo 2" },
  { src: "photos/photo3.jpg", caption: "Photo 3" },
  { src: "photos/photo4.jpg", caption: "Photo 4" },
  { src: "photos/photo5.jpg", caption: "Photo 5" },
  { src: "photos/photo6.jpg", caption: "Photo 6" },
  { src: "photos/photo7.jpg", caption: "Photo 7" },
  { src: "photos/photo8.jpg", caption: "Photo 8" },
  { src: "photos/photo9.jpg", caption: "Photo 9" },
  { src: "photos/photo10.jpg", caption: "Photo 10" },
  { src: "photos/photo11.jpg", caption: "Photo 11" },
  // { src: "photos/photo3.jpg", caption: "Add more like this" },
];

/* ========================================================= */

const $ = id => document.getElementById(id);
const root = document.documentElement;

/* ---------------- Theme (Day garden / Night garden) ---------------- */
function applyTheme(t) {
  root.dataset.theme = t;
  $("themeIcon").textContent = t === "day" ? "🌙" : "☀️";
  $("themeLabel").textContent = t === "day" ? "Night garden" : "Day garden";
  try { localStorage.setItem("gallery-theme", t); } catch (e) {}
}
(function initTheme() {
  let saved = "day";
  try { saved = localStorage.getItem("gallery-theme") || "day"; } catch (e) {}
  applyTheme(saved === "night" ? "night" : "day");
})();
$("themeBtn").onclick = () => applyTheme(root.dataset.theme === "day" ? "night" : "day");

/* ---------------- Password ---------------- */
async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}
// helper for creating a new password hash (use in the browser console)
window.makeHash = async pw => { const h = await sha256(pw); console.log(h); return h; };

const lock = $("lock"), gallery = $("gallery"), pw = $("pw"), err = $("error"), box = $("lockBox");

async function tryUnlock() {
  if (!pw.value) { err.textContent = "Please type the password."; return; }
  let ok = false;
  try {
    ok = (await sha256(pw.value)) === PASSWORD_HASH;
  } catch (e) {
    err.textContent = "Please open this page with Live Server or an https link.";
    return;
  }
  if (ok) {
    err.textContent = "";
    try { sessionStorage.setItem("unlocked", "yes"); } catch (e) {}
    unlock();
  } else {
    err.textContent = "Wrong password. Please try again.";
    box.classList.remove("shake");
    void box.offsetWidth;            // restart the shake animation
    box.classList.add("shake");
    pw.select();
  }
}

function unlock() {
  lock.classList.add("hidden");
  gallery.classList.remove("hidden");
  buildGrid();
  window.scrollTo(0, 0);
}

function relock() {
  try { sessionStorage.removeItem("unlocked"); } catch (e) {}
  closeViewer();
  gallery.classList.add("hidden");
  lock.classList.remove("hidden");
  pw.value = "";
  pw.focus();
}

$("enter").onclick = tryUnlock;
pw.addEventListener("keydown", e => { if (e.key === "Enter") tryUnlock(); });
$("lockAgain").onclick = relock;
$("showPw").onclick = () => {
  const show = pw.type === "password";
  pw.type = show ? "text" : "password";
  $("showPw").textContent = show ? "Hide" : "Show";
};

/* ---------------- Photo grid ---------------- */
let built = false;
function buildGrid() {
  if (built) return;
  built = true;
  const grid = $("grid");
  if (!PHOTOS.length) { $("empty").classList.remove("hidden"); return; }

  PHOTOS.forEach((p, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "card";
    btn.setAttribute("aria-label", "Open photo " + (i + 1) + (p.caption ? ": " + p.caption : ""));

    const img = document.createElement("img");
    img.alt = p.caption || "Photo " + (i + 1);
    img.decoding = "async";
    img.onload = () => img.classList.add("loaded");
    img.onerror = () => { btn.dataset.missing = p.src; btn.onclick = null; };
    img.src = p.src;

    const cap = document.createElement("span");
    cap.className = "cap";
    cap.textContent = p.caption || "";

    btn.append(img, cap);
    btn.onclick = () => openViewer(i);
    grid.appendChild(btn);
  });
}

/* ---------------- Full-screen viewer ---------------- */
const viewer = $("viewer"), big = $("big");
let current = 0, lastFocus = null;

function showPhoto() {
  const p = PHOTOS[current];
  big.style.opacity = 0;
  big.onload = () => { big.style.opacity = 1; };
  big.src = p.src;
  big.alt = p.caption || "Photo " + (current + 1);
  $("vcap").textContent = p.caption || "";
  $("vcount").textContent = (current + 1) + " / " + PHOTOS.length;
  $("vdl").href = p.src;
  $("vdl").setAttribute("download", p.src.split("/").pop());

  // preload neighbours so next/prev feel instant
  [1, -1].forEach(d => { new Image().src = PHOTOS[(current + d + PHOTOS.length) % PHOTOS.length].src; });
}

function openViewer(i) {
  current = i;
  lastFocus = document.activeElement;
  const single = PHOTOS.length < 2;
  $("vprev").classList.toggle("hidden", single);
  $("vnext").classList.toggle("hidden", single);
  showPhoto();
  viewer.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  $("vclose").focus();
}

function closeViewer() {
  if (viewer.classList.contains("hidden")) return;
  viewer.classList.add("hidden");
  document.body.style.overflow = "";
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}

function step(d) {
  current = (current + d + PHOTOS.length) % PHOTOS.length;
  showPhoto();
}

$("vclose").onclick = closeViewer;
$("vprev").onclick = () => step(-1);
$("vnext").onclick = () => step(1);
viewer.addEventListener("click", e => { if (e.target === viewer) closeViewer(); });

document.addEventListener("keydown", e => {
  if (viewer.classList.contains("hidden")) return;
  if (e.key === "Escape") closeViewer();
  if (PHOTOS.length > 1 && e.key === "ArrowLeft") step(-1);
  if (PHOTOS.length > 1 && e.key === "ArrowRight") step(1);
});

// swipe left / right on phones
let touchX = null;
viewer.addEventListener("touchstart", e => { touchX = e.changedTouches[0].clientX; }, { passive: true });
viewer.addEventListener("touchend", e => {
  if (touchX === null || PHOTOS.length < 2) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
  touchX = null;
}, { passive: true });

/* ---------------- Stay unlocked during this visit ---------------- */
try { if (sessionStorage.getItem("unlocked") === "yes") unlock(); } catch (e) {}