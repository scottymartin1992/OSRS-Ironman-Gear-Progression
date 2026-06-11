import { initPanZoom } from "./panzoom.js";
import overlays from "./rect_overlays.js";

const svg = document.getElementById("root");
const content = document.getElementById("content");
const imageLayers = document.getElementById("image-layers");
const overlaysLayer = document.getElementById("overlays");
const contextMenu = document.getElementById("context-menu");

const btnReset = document.getElementById("btn-reset");
const btnClear = document.getElementById("btn-clear");

console.log("main.js loaded");
console.log("contextMenu found:", contextMenu);
console.log("overlays loaded:", overlays.length);

const camera = initPanZoom(svg, content, {
  naturalWidth: 13850,
  naturalHeight: 11250,
  panDamp: 0.9,
  minScale: 0.2,
  maxScale: 12,
});

const IMAGE_LAYERS = [
  { file: "Background.png", x: 0, y: 0, width: 13850, height: 11250 },
  { file: "Title.png", x: 100, y: 100, width: 13650, height: 200 },
  { file: "Pre Bossing Gear Guide.png", x: 100, y: 400, width: 9850, height: 1250 },
  { file: "Skilling.png", x: 100, y: 1750, width: 2200, height: 2250 },
  { file: "Background Bossing.png", x: 450, y: 4150, width: 1500, height: 6350 },
  { file: "70+ Combat Stats.png", x: 2450, y: 2100, width: 2250, height: 5600 },
  { file: "Bossing Border.png", x: 2400, y: 1750, width: 11350, height: 9400 },
  { file: "Entry Level Bossing.png", x: 10050, y: 400, width: 3700, height: 1250 },
  { file: "Slayer.png", x: 4800, y: 2100, width: 8750, height: 1800 },
  { file: "90+ Range.png", x: 5088, y: 4000, width: 400, height: 600 },
  { file: "Ranged Pathway.png", x: 5725, y: 4000, width: 4000, height: 1050 },
  { file: "Bowfa Bossing.png", x: 10100, y: 4000, width: 3250, height: 1050 },
  { file: "Demonic Pathway.png", x: 5025, y: 5150, width: 4700, height: 1050 },
  { file: "Demonic Endgame.png", x: 10100, y: 5150, width: 3250, height: 1050 },
  { file: "Entry Level Raiding.png", x: 5025, y: 6300, width: 4700, height: 1050 },
  { file: "BIS Capes.png", x: 10100, y: 6300, width: 2900, height: 1050 },
  { file: "Godwars.png", x: 5025, y: 7450, width: 1450, height: 3600 },
  { file: "Wilderness.png", x: 2450, y: 8150, width: 2250, height: 2900 },
  { file: "DT2.png", x: 7000, y: 7750, width: 1850, height: 3300 },
  { file: "Endgame Bossing.png", x: 9400, y: 7750, width: 4300, height: 3300 },
  { file: "Arrows.png", x: 3574, y: 3900, width: 10076, height: 4239 },
];

const OVERLAY_OFFSET_X = 120;
const OVERLAY_OFFSET_Y = 120;

const STORAGE_KEY = "osrs-ironman-selected-overlays-v1";

function loadSelectedOverlayIds() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

    if (Array.isArray(saved)) {
      return new Set(saved);
    }

    return new Set();
  } catch (error) {
    console.warn("Could not load saved overlays:", error);
    return new Set();
  }
}

const selectedOverlayIds = loadSelectedOverlayIds();

const AREAS = overlays.map((area) => ({
  ...area,
  x: area.x + OVERLAY_OFFSET_X,
  y: area.y + OVERLAY_OFFSET_Y,
}));

function saveSelectedOverlays() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([...selectedOverlayIds])
    );
  } catch (error) {
    console.warn("Could not save overlays:", error);
  }
}

function drawImageLayers() {
  imageLayers.innerHTML = "";

  for (const layer of IMAGE_LAYERS) {
    const image = document.createElementNS("http://www.w3.org/2000/svg", "image");

    image.setAttribute("href", `./assets/tiles/${layer.file}`);
    image.setAttribute("x", layer.x);
    image.setAttribute("y", layer.y);
    image.setAttribute("width", layer.width);
    image.setAttribute("height", layer.height);
    image.setAttribute("preserveAspectRatio", "none");

    imageLayers.appendChild(image);
  }
}

function safeId(id) {
  return String(id).replace(/[^a-zA-Z0-9_-]/g, "_");
}

function createOverlay(area) {
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");

  rect.setAttribute("id", `overlay-${safeId(area.id)}`);
  rect.setAttribute("x", area.x);
  rect.setAttribute("y", area.y);
  rect.setAttribute("width", area.w);
  rect.setAttribute("height", area.h);
  rect.setAttribute("rx", area.rx ?? 0);
  rect.setAttribute("class", "overlay");

  return rect;
}

function toggleOverlay(area) {
  const overlayId = `overlay-${safeId(area.id)}`;
  const existing = document.getElementById(overlayId);

  if (existing) {
    existing.remove();
    selectedOverlayIds.delete(area.id);
    saveSelectedOverlays();
    return;
  }

  overlaysLayer.appendChild(createOverlay(area));
  selectedOverlayIds.add(area.id);
  saveSelectedOverlays();
}

function restoreSavedOverlays() {
  overlaysLayer.innerHTML = "";

  for (const area of AREAS) {
    if (selectedOverlayIds.has(area.id)) {
      overlaysLayer.appendChild(createOverlay(area));
    }
  }
}

function hideContextMenu() {
  if (!contextMenu) return;

  contextMenu.classList.add("hidden");
  contextMenu.innerHTML = "";
}

function showContextMenu(area, mouseX, mouseY) {
  if (!contextMenu) return;

  contextMenu.innerHTML = "";

  const title = document.createElement("div");
  title.className = "context-menu-title";
  title.textContent = area.id;
  contextMenu.appendChild(title);

  const validLinks = Array.isArray(area.links)
    ? area.links.filter((link) => link && link.url && link.url.trim() !== "")
    : [];

  if (validLinks.length === 0) {
    const empty = document.createElement("div");
    empty.className = "context-menu-empty";
    empty.textContent = "No links available";
    contextMenu.appendChild(empty);
  } else {
    for (const link of validLinks) {
      const a = document.createElement("a");

      a.className = "context-menu-item";
      a.href = link.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = link.label || link.url;

      contextMenu.appendChild(a);
    }
  }

  contextMenu.classList.remove("hidden");

  const menuRect = contextMenu.getBoundingClientRect();

  let left = mouseX;
  let top = mouseY;

  if (left + menuRect.width > window.innerWidth - 10) {
    left = window.innerWidth - menuRect.width - 10;
  }

  if (top + menuRect.height > window.innerHeight - 10) {
    top = window.innerHeight - menuRect.height - 10;
  }

  contextMenu.style.left = `${left}px`;
  contextMenu.style.top = `${top}px`;
}

function drawHitAreas() {
  const oldHitLayer = document.getElementById("hit-areas");
  if (oldHitLayer) oldHitLayer.remove();

  const hitLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
  hitLayer.setAttribute("id", "hit-areas");

  for (const area of AREAS) {
    const hit = document.createElementNS("http://www.w3.org/2000/svg", "rect");

    hit.setAttribute("id", `hit-${safeId(area.id)}`);
    hit.setAttribute("x", area.x);
    hit.setAttribute("y", area.y);
    hit.setAttribute("width", area.w);
    hit.setAttribute("height", area.h);
    hit.setAttribute("rx", area.rx ?? 0);
    hit.setAttribute("fill", "transparent");
    hit.setAttribute("pointer-events", "all");

    hit.style.cursor = "pointer";

    // Left click = toggle green overlay
    hit.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      hideContextMenu();
      toggleOverlay(area);
    });

    // Right mouse down = open link menu
    hit.addEventListener("mousedown", (event) => {
      if (event.button !== 2) return;

      event.preventDefault();
      event.stopPropagation();

      showContextMenu(area, event.clientX, event.clientY);
    });

    // Block the browser's default right-click menu
    hit.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });

    hitLayer.appendChild(hit);
  }

  content.appendChild(hitLayer);

  console.log("hit areas drawn:", AREAS.length);
}

drawImageLayers();
drawHitAreas();
restoreSavedOverlays();

btnReset.addEventListener("click", () => {
  hideContextMenu();
  camera.resetView();
});

btnClear.addEventListener("click", () => {
  hideContextMenu();

  overlaysLayer.innerHTML = "";
  selectedOverlayIds.clear();
  saveSelectedOverlays();
});

document.addEventListener("click", () => {
  hideContextMenu();
});

document.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

window.addEventListener("resize", () => {
  hideContextMenu();
});