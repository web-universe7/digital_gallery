"use strict";

/* =========================================================
   SETTINGS - the only part you need to edit
   ========================================================= */

// Password is stored as a SHA-256 hash, so it is not readable in the source.
// The hash below is for the password:  gaurav123
// To use your own password: open the page, press F12 -> Console, type
//     makeHash("yourpassword")
// then paste the long text it prints between the quotes below.
const PASSWORD_HASH = "be6011390524928943f9fc75fb8c814927d3a4ec6c85ac1a19678a1a53ae7268";

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
const homeRequested = new URLSearchParams(window.location.search).has("home");
try {
  if (homeRequested) sessionStorage.removeItem("unlocked");
  else if (sessionStorage.getItem("unlocked") === "yes") unlock();
} catch (e) {}

/* ---------------- First-page photo frame ---------------- */
let framePhotos = [];
let frameIndex = 0;
let discoveringFramePhotos = false;
const framePhoto = $("framePhoto");
const frameEmpty = $("frameEmpty");
const openFrameViewer = $("openFrameViewer");
const frameViewer = $("frameViewer");
const largeFramePhoto = $("largeFramePhoto");
let frameViewerFocus = null;

function showFramePhoto() {
  if (!framePhotos.length) return;
  framePhoto.src = framePhotos[frameIndex];
  framePhoto.alt = "Featured photo " + (frameIndex + 1);
  framePhoto.classList.remove("hidden");
  frameEmpty.classList.add("hidden");
  openFrameViewer.disabled = false;
  if (!frameViewer.classList.contains("hidden")) showLargeFramePhoto();
}

function showLargeFramePhoto() {
  largeFramePhoto.src = framePhotos[frameIndex];
  largeFramePhoto.alt = "Featured photo " + (frameIndex + 1);
  $("frameViewerCount").textContent = (frameIndex + 1) + " / " + framePhotos.length;
  const multiplePhotos = framePhotos.length > 1;
  $("prevFramePhoto").classList.toggle("hidden", !multiplePhotos);
  $("nextFramePhoto").classList.toggle("hidden", !multiplePhotos);
}

function openFeaturedViewer() {
  if (!framePhotos.length) return;
  frameViewerFocus = document.activeElement;
  showLargeFramePhoto();
  frameViewer.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  $("closeFrameViewer").focus();
}

function closeFeaturedViewer() {
  if (frameViewer.classList.contains("hidden")) return;
  frameViewer.classList.add("hidden");
  document.body.style.overflow = "";
  if (frameViewerFocus && frameViewerFocus.focus) frameViewerFocus.focus();
}

function stepFramePhoto(direction) {
  if (framePhotos.length < 2) return;
  frameIndex = (frameIndex + direction + framePhotos.length) % framePhotos.length;
  showFramePhoto();
}

async function discoverFramePhotos() {
  if (discoveringFramePhotos) return;
  discoveringFramePhotos = true;

  const found = framePhotos.slice();
  const hadPhotos = framePhotos.length > 0;
  let number = found.length + 1;

  try {
    while (true) {
      const src = "photos/image" + number + ".jpg";
      const response = await fetch(src, { method: "HEAD", cache: "no-store" });
      if (response.status === 404) break;
      if (!response.ok) {
        console.error("Could not check " + src + ". Server returned " + response.status + ".");
        break;
      }
      found.push(src);
      number += 1;
    }
  } catch (error) {
    console.error("Could not check the photos folder.", error);
  } finally {
    framePhotos = found;
    discoveringFramePhotos = false;
    if (!hadPhotos && framePhotos.length) showFramePhoto();
  }
}

discoverFramePhotos();
window.setInterval(() => {
  if (framePhotos.length > 1) {
    frameIndex = (frameIndex + 1) % framePhotos.length;
    showFramePhoto();
  }
}, 4000);
window.setInterval(discoverFramePhotos, 30000);

openFrameViewer.addEventListener("click", openFeaturedViewer);
$("closeFrameViewer").addEventListener("click", closeFeaturedViewer);
$("prevFramePhoto").addEventListener("click", () => stepFramePhoto(-1));
$("nextFramePhoto").addEventListener("click", () => stepFramePhoto(1));
frameViewer.addEventListener("click", event => {
  if (event.target === frameViewer) closeFeaturedViewer();
});
document.addEventListener("keydown", event => {
  if (frameViewer.classList.contains("hidden")) return;
  if (event.key === "Escape") closeFeaturedViewer();
  if (event.key === "ArrowLeft") stepFramePhoto(-1);
  if (event.key === "ArrowRight") stepFramePhoto(1);
});