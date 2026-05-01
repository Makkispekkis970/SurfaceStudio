import * as THREE from "./node_modules/three/build/three.module.js";

const canvas = document.getElementById("roomCanvas");
const surfaceList = document.getElementById("surfaceList");
const styleGrid = document.getElementById("styleGrid");
const statusEl = document.getElementById("status");
const activeLayerLabel = document.getElementById("activeLayerLabel");
const specSummary = document.getElementById("specSummary");

const roomWidthInput = document.getElementById("roomWidth");
const roomDepthInput = document.getElementById("roomDepth");
const roomHeightInput = document.getElementById("roomHeight");
const materialSelect = document.getElementById("materialSelect");
const primaryColor = document.getElementById("primaryColor");
const secondaryColor = document.getElementById("secondaryColor");
const layoutSelect = document.getElementById("layoutSelect");
const unitWidthInput = document.getElementById("unitWidth");
const unitHeightInput = document.getElementById("unitHeight");
const jointSizeInput = document.getElementById("jointSize");
const variationRange = document.getElementById("variationRange");

const overlayEnabled = document.getElementById("overlayEnabled");
const overlayColor = document.getElementById("overlayColor");
const overlayMode = document.getElementById("overlayMode");
const overlayEndColor = document.getElementById("overlayEndColor");
const overlayEndColorField = document.getElementById("overlayEndColorField");
const overlayStartOpacity = document.getElementById("overlayStartOpacity");
const overlayEndOpacity = document.getElementById("overlayEndOpacity");
const overlayAngle = document.getElementById("overlayAngle");
const overlayPosition = document.getElementById("overlayPosition");
const overlayReach = document.getElementById("overlayReach");
const overlaySoftness = document.getElementById("overlaySoftness");
const overlayStartValue = document.getElementById("overlayStartValue");
const overlayEndValue = document.getElementById("overlayEndValue");
const overlayAngleValue = document.getElementById("overlayAngleValue");
const overlayPositionValue = document.getElementById("overlayPositionValue");
const overlayReachValue = document.getElementById("overlayReachValue");
const overlaySoftnessValue = document.getElementById("overlaySoftnessValue");

const saveBtn = document.getElementById("saveBtn");
const exportBtn = document.getElementById("exportBtn");
const resetBtn = document.getElementById("resetBtn");

const surfaces = [
  { id: "back", name: "Back Wall", role: "Feature wall" },
  { id: "left", name: "Left Wall", role: "Side wall" },
  { id: "right", name: "Right Wall", role: "Side wall" },
  { id: "ceiling", name: "Ceiling", role: "Upper surface" },
  { id: "floor", name: "Floor", role: "Lower surface" }
];

const materialPresets = [
  { id: "pineCladding", name: "Warm pine", colors: ["#b4743b", "#e1a867"], layout: "vertical", unitW: 320, unitH: 12, joint: 4, variation: 76 },
  { id: "woodPlank", name: "Long boards", colors: ["#9e6a3d", "#d7b07a"], layout: "vertical", unitW: 360, unitH: 16, joint: 3, variation: 62 },
  { id: "paintedPlank", name: "Painted boards", colors: ["#dfe8e4", "#9fb5ad"], layout: "vertical", unitW: 320, unitH: 14, joint: 5, variation: 22 },
  { id: "laminate", name: "Laminate", colors: ["#8d714f", "#d2b98a"], layout: "horizontal", unitW: 140, unitH: 22, joint: 2, variation: 46 },
  { id: "ceramicTile", name: "Ceramic tile", colors: ["#e8e1d5", "#8aa6a3"], layout: "stacked", unitW: 30, unitH: 30, joint: 5, variation: 18 },
  { id: "zelligeTile", name: "Zellige", colors: ["#7bb7aa", "#f1eee3"], layout: "offset", unitW: 12, unitH: 12, joint: 4, variation: 70 },
  { id: "floorTile", name: "Floor tile", colors: ["#b98f62", "#e0c3a2"], layout: "stacked", unitW: 45, unitH: 45, joint: 5, variation: 24 },
  { id: "stoneSlab", name: "Stone slab", colors: ["#a6a39c", "#e5e0d6"], layout: "large", unitW: 90, unitH: 60, joint: 3, variation: 34 },
  { id: "terrazzo", name: "Terrazzo", colors: ["#e7dfd2", "#bd7f66"], layout: "large", unitW: 90, unitH: 90, joint: 2, variation: 64 },
  { id: "solid", name: "Smooth paint", colors: ["#d9c7ad", "#d9c7ad"], layout: "stacked", unitW: 60, unitH: 30, joint: 0, variation: 0 },
  { id: "limewash", name: "Limewash", colors: ["#d8d0bd", "#f2eee4"], layout: "stacked", unitW: 60, unitH: 30, joint: 0, variation: 46 }
];

const defaultOverlay = {
  enabled: true,
  color: "#f0eadf",
  endColor: "#a6d8d4",
  mode: "transparent",
  startOpacity: 75,
  endOpacity: 0,
  angle: 90,
  position: 50,
  reach: 90,
  softness: 35
};

const defaultRoom = {
  size: { width: 4.8, depth: 3.6, height: 2.7 },
  activeSurface: "back",
  surfaces: {
    back: makeFinish("pineCladding", "#b4743b", "#e1a867", "vertical", 320, 12, 4, 76, {
      ...defaultOverlay,
      enabled: true,
      color: "#f0eadf",
      startOpacity: 58,
      endOpacity: 0,
      angle: 90,
      softness: 42
    }),
    left: makeFinish("pineCladding", "#a76534", "#d99a56", "horizontal", 360, 14, 4, 72, { ...defaultOverlay, enabled: false }),
    right: makeFinish("pineCladding", "#b4743b", "#e1a867", "vertical", 320, 12, 4, 76, { ...defaultOverlay, enabled: false }),
    ceiling: makeFinish("pineCladding", "#a86635", "#d99a58", "vertical", 340, 10, 3, 68, { ...defaultOverlay, enabled: false }),
    floor: makeFinish("laminate", "#8d714f", "#d2b98a", "horizontal", 140, 22, 2, 46, { ...defaultOverlay, enabled: false })
  }
};

let room = loadRoom();
let surfaceMeshes = new Map();
let cameraState = { yaw: Math.PI, pitch: -0.08, position: new THREE.Vector3(0, 1.55, 3.0) };
let dragState = null;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setClearColor(0x101318);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101318);

const camera = new THREE.PerspectiveCamera(65, 1, 0.05, 100);
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

scene.add(new THREE.HemisphereLight(0xffffff, 0x7a6a55, 1.05));
scene.add(new THREE.AmbientLight(0xffffff, 0.42));
const keyLight = new THREE.DirectionalLight(0xffffff, 1.15);
keyLight.position.set(2.2, 3.2, 2.2);
scene.add(keyLight);
const floorBounce = new THREE.PointLight(0xffe8c4, 1.9, 8.5, 1.6);
floorBounce.position.set(0, 0.55, 0.55);
scene.add(floorBounce);

const roomGroup = new THREE.Group();
scene.add(roomGroup);

function makeFinish(material, primary, secondary, layout, unitW, unitH, joint, variation, overlay) {
  return {
    material,
    primary,
    secondary,
    layout,
    unitW,
    unitH,
    joint,
    variation,
    overlay: { ...defaultOverlay, ...overlay }
  };
}

function loadRoom() {
  const saved = localStorage.getItem("surface-studio-3d-room");
  if (!saved) return normalizeRoom(clone(defaultRoom));
  try {
    return normalizeRoom({ ...clone(defaultRoom), ...JSON.parse(saved) });
  } catch {
    return normalizeRoom(clone(defaultRoom));
  }
}

function normalizeRoom(nextRoom) {
  nextRoom.size = { ...defaultRoom.size, ...(nextRoom.size || {}) };
  for (const surface of surfaces) {
    nextRoom.surfaces[surface.id] = {
      ...defaultRoom.surfaces[surface.id],
      ...(nextRoom.surfaces?.[surface.id] || {})
    };
    nextRoom.surfaces[surface.id].overlay = {
      ...defaultOverlay,
      ...(nextRoom.surfaces[surface.id].overlay || {})
    };
  }
  return nextRoom;
}

function clone(value) {
  return typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

function activeFinish() {
  return room.surfaces[room.activeSurface];
}

function setStatus(message) {
  statusEl.textContent = message;
}

function activeSurfaceName() {
  return surfaces.find((surface) => surface.id === room.activeSurface)?.name || "Surface";
}

function buildRoom() {
  for (const child of [...roomGroup.children]) {
    if (child.material?.map) child.material.map.dispose();
    child.geometry?.dispose();
    child.material?.dispose();
    roomGroup.remove(child);
  }
  surfaceMeshes.clear();

  const { width, depth, height } = room.size;
  const definitions = [
    { id: "back", size: [width, height], position: [0, height / 2, -depth / 2], rotation: [0, 0, 0], dims: [width, height] },
    { id: "left", size: [depth, height], position: [-width / 2, height / 2, 0], rotation: [0, Math.PI / 2, 0], dims: [depth, height] },
    { id: "right", size: [depth, height], position: [width / 2, height / 2, 0], rotation: [0, -Math.PI / 2, 0], dims: [depth, height] },
    { id: "ceiling", size: [width, depth], position: [0, height, 0], rotation: [Math.PI / 2, 0, 0], dims: [width, depth] },
    { id: "floor", size: [width, depth], position: [0, 0, 0], rotation: [-Math.PI / 2, 0, 0], dims: [width, depth] }
  ];

  for (const definition of definitions) {
    const mesh = makeSurfaceMesh(definition);
    roomGroup.add(mesh);
    surfaceMeshes.set(definition.id, mesh);
  }

  updateCameraTarget();
}

function makeSurfaceMesh(definition) {
  const finish = room.surfaces[definition.id];
  const texture = makeSurfaceTexture(finish, definition.dims[0], definition.dims[1]);
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: finish.material.includes("wood") || finish.material.includes("Cladding") ? 0.64 : 0.78,
    metalness: 0.02,
    side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(definition.size[0], definition.size[1]), material);
  mesh.name = definition.id;
  mesh.userData.surfaceId = definition.id;
  mesh.position.set(...definition.position);
  mesh.rotation.set(...definition.rotation);
  return mesh;
}

function refreshSurfaceTexture(surfaceId) {
  const mesh = surfaceMeshes.get(surfaceId);
  if (!mesh) return;
  const dims = surfaceDimensions(surfaceId);
  const nextTexture = makeSurfaceTexture(room.surfaces[surfaceId], dims[0], dims[1]);
  mesh.material.map?.dispose();
  mesh.material.map = nextTexture;
  mesh.material.needsUpdate = true;
}

function surfaceDimensions(surfaceId) {
  const { width, depth, height } = room.size;
  if (surfaceId === "left" || surfaceId === "right") return [depth, height];
  if (surfaceId === "ceiling" || surfaceId === "floor") return [width, depth];
  return [width, height];
}

function makeSurfaceTexture(finish, surfaceWidthM, surfaceHeightM) {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 1024;
  textureCanvas.height = 1024;
  const tctx = textureCanvas.getContext("2d");
  drawBaseMaterial(tctx, finish, surfaceWidthM, surfaceHeightM, textureCanvas.width, textureCanvas.height);
  drawFadeOverlay(tctx, finish.overlay, textureCanvas.width, textureCanvas.height);
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
  texture.needsUpdate = true;
  return texture;
}

function drawBaseMaterial(tctx, finish, surfaceWidthM, surfaceHeightM, width, height) {
  const base = tctx.createLinearGradient(0, 0, width, height);
  base.addColorStop(0, finish.primary);
  base.addColorStop(1, finish.secondary);
  tctx.fillStyle = base;
  tctx.fillRect(0, 0, width, height);

  if (["pineCladding", "woodPlank", "paintedPlank", "laminate"].includes(finish.material)) {
    drawBoards(tctx, finish, surfaceWidthM, surfaceHeightM, width, height);
  } else if (["ceramicTile", "zelligeTile", "stoneSlab", "floorTile"].includes(finish.material)) {
    drawTiles(tctx, finish, surfaceWidthM, surfaceHeightM, width, height);
  } else if (finish.material === "terrazzo") {
    drawTerrazzo(tctx, finish, width, height);
  } else if (finish.material === "limewash") {
    drawLimewash(tctx, finish, width, height);
  }
}

function drawBoards(tctx, finish, surfaceWidthM, surfaceHeightM, width, height) {
  const vertical = finish.layout !== "horizontal";
  const acrossCm = (vertical ? surfaceWidthM : surfaceHeightM) * 100;
  const boardWidthPx = Math.max(8, (finish.unitH / acrossCm) * (vertical ? width : height));
  const jointPx = Math.max(0.5, finish.joint * 0.85);
  const boardCount = Math.ceil((vertical ? width : height) / (boardWidthPx + jointPx)) + 2;

  for (let i = -1; i < boardCount; i += 1) {
    const p = i * (boardWidthPx + jointPx);
    const tone = (seeded(i * 17) - 0.5) * (finish.variation / 100);
    const color = shade(mix(finish.primary, finish.secondary, seeded(i * 29)), tone);
    tctx.fillStyle = color;

    if (vertical) {
      tctx.fillRect(p, 0, boardWidthPx, height);
      drawBoardDetails(tctx, p, 0, boardWidthPx, height, finish, i, true);
      drawGroove(tctx, p, 0, boardWidthPx, height, jointPx, true);
    } else {
      tctx.fillRect(0, p, width, boardWidthPx);
      drawBoardDetails(tctx, 0, p, width, boardWidthPx, finish, i, false);
      drawGroove(tctx, 0, p, width, boardWidthPx, jointPx, false);
    }
  }
}

function drawBoardDetails(tctx, x, y, w, h, finish, seed, vertical) {
  const lineCount = Math.max(3, Math.floor((vertical ? w : h) / 4));
  tctx.save();
  tctx.globalAlpha = 0.16 + finish.variation / 650;
  tctx.strokeStyle = shade(finish.primary, -0.34);
  tctx.lineWidth = 1;

  for (let i = 0; i < lineCount; i += 1) {
    tctx.beginPath();
    if (vertical) {
      const gx = x + w * (0.16 + (i / lineCount) * 0.72);
      tctx.moveTo(gx, y);
      tctx.bezierCurveTo(gx + seeded(seed + i) * 8 - 4, y + h * 0.32, gx + seeded(seed + i * 3) * 12 - 6, y + h * 0.68, gx, y + h);
    } else {
      const gy = y + h * (0.16 + (i / lineCount) * 0.72);
      tctx.moveTo(x, gy);
      tctx.bezierCurveTo(x + w * 0.32, gy + seeded(seed + i) * 8 - 4, x + w * 0.68, gy + seeded(seed + i * 3) * 12 - 6, x + w, gy);
    }
    tctx.stroke();
  }
  tctx.restore();

  const knotCount = Math.max(1, Math.floor((vertical ? h : w) / 210));
  for (let i = 0; i < knotCount; i += 1) {
    const along = seeded(seed * 41 + i * 13);
    const across = 0.24 + seeded(seed * 37 + i * 11) * 0.52;
    const kx = vertical ? x + w * across : x + w * along;
    const ky = vertical ? y + h * along : y + h * across;
    const radius = 2.4 + seeded(seed * 31 + i) * Math.max(3, Math.min(w, h) * 0.22);
    tctx.save();
    tctx.translate(kx, ky);
    tctx.rotate(seeded(seed + i) * Math.PI);
    tctx.globalAlpha = 0.34 + finish.variation / 360;
    tctx.fillStyle = shade(finish.primary, -0.42);
    tctx.beginPath();
    tctx.ellipse(0, 0, radius * 1.45, radius * 0.82, 0, 0, Math.PI * 2);
    tctx.fill();
    tctx.globalAlpha = 0.22;
    tctx.strokeStyle = shade(finish.secondary, -0.48);
    tctx.stroke();
    tctx.restore();
  }
}

function drawGroove(tctx, x, y, w, h, jointPx, vertical) {
  tctx.save();
  tctx.fillStyle = "rgba(36, 22, 13, 0.58)";
  if (vertical) {
    tctx.fillRect(x - jointPx * 0.45, y, jointPx, h);
    tctx.fillStyle = "rgba(255, 238, 198, 0.18)";
    tctx.fillRect(x + w * 0.18, y, Math.max(1, w * 0.08), h);
  } else {
    tctx.fillRect(x, y - jointPx * 0.45, w, jointPx);
    tctx.fillStyle = "rgba(255, 238, 198, 0.18)";
    tctx.fillRect(x, y + h * 0.18, w, Math.max(1, h * 0.08));
  }
  tctx.restore();
}

function drawTiles(tctx, finish, surfaceWidthM, surfaceHeightM, width, height) {
  const tileW = Math.max(10, (finish.unitW / (surfaceWidthM * 100)) * width);
  const tileH = Math.max(10, (finish.unitH / (surfaceHeightM * 100)) * height);
  const jointPx = Math.max(0, finish.joint * 0.75);

  tctx.fillStyle = "rgba(23, 25, 29, 0.32)";
  tctx.fillRect(0, 0, width, height);

  if (finish.layout === "herringbone") {
    drawHerringbone(tctx, finish, width, height, tileW, tileH);
    return;
  }

  for (let y = -tileH; y < height + tileH; y += tileH + jointPx) {
    const offset = finish.layout === "offset" && Math.round(y / tileH) % 2 ? tileW / 2 : 0;
    for (let x = -tileW - offset; x < width + tileW; x += tileW + jointPx) {
      const wobble = finish.material === "zelligeTile" ? (seeded(x + y) - 0.5) * 3 : 0;
      tctx.fillStyle = shade(mix(finish.primary, finish.secondary, seeded(x + y)), (seeded(x * 3 + y) - 0.5) * (finish.variation / 100));
      tctx.fillRect(x + wobble, y - wobble, tileW, tileH);
      tctx.globalAlpha = finish.material === "zelligeTile" ? 0.2 : 0.08;
      tctx.fillStyle = "#ffffff";
      tctx.fillRect(x + 4, y + 4, tileW * 0.34, Math.max(2, tileH * 0.08));
      tctx.globalAlpha = 1;
    }
  }
}

function drawHerringbone(tctx, finish, width, height, tileW, tileH) {
  const pieceW = Math.max(22, tileW * 0.78);
  const pieceH = Math.max(8, tileH * 0.42);
  const step = pieceW + pieceH + finish.joint;
  for (let y = -height; y < height * 2; y += step) {
    for (let x = -width; x < width * 2; x += step) {
      drawRotatedPiece(tctx, finish, x, y, pieceW, pieceH, 45);
      drawRotatedPiece(tctx, finish, x + pieceW * 0.58, y + pieceW * 0.58, pieceW, pieceH, -45);
    }
  }
}

function drawRotatedPiece(tctx, finish, x, y, w, h, angle) {
  tctx.save();
  tctx.translate(x, y);
  tctx.rotate((angle * Math.PI) / 180);
  tctx.fillStyle = shade(mix(finish.primary, finish.secondary, seeded(x + y + angle)), (seeded(x * y + angle) - 0.5) * (finish.variation / 100));
  tctx.fillRect(0, 0, w, h);
  tctx.globalAlpha = 0.24;
  tctx.strokeStyle = "rgba(20, 20, 20, 0.6)";
  tctx.strokeRect(0, 0, w, h);
  tctx.restore();
}

function drawTerrazzo(tctx, finish, width, height) {
  tctx.globalAlpha = 0.75;
  for (let i = 0; i < 600; i += 1) {
    const x = seeded(i * 41) * width;
    const y = seeded(i * 53) * height;
    const r = 2 + seeded(i * 67) * Math.max(4, finish.unitW / 10);
    tctx.fillStyle = [finish.secondary, "#f4eee4", "#77716b", finish.primary][i % 4];
    tctx.beginPath();
    tctx.ellipse(x, y, r, r * (0.5 + seeded(i) * 0.8), seeded(i * 7) * Math.PI, 0, Math.PI * 2);
    tctx.fill();
  }
  tctx.globalAlpha = 1;
}

function drawLimewash(tctx, finish, width, height) {
  tctx.globalAlpha = 0.23 + finish.variation / 500;
  tctx.strokeStyle = finish.secondary;
  tctx.lineWidth = 18;
  for (let i = 0; i < 34; i += 1) {
    const y = (i * 47) % height;
    tctx.beginPath();
    tctx.moveTo(-40, y);
    tctx.bezierCurveTo(width * 0.25, y - 60, width * 0.65, y + 70, width + 40, y - 20);
    tctx.stroke();
  }
  tctx.globalAlpha = 1;
}

function drawFadeOverlay(tctx, overlay, width, height) {
  if (!overlay.enabled) return;

  const radians = (overlay.angle * Math.PI) / 180;
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.sqrt(width * width + height * height) / 2;
  const gradient = tctx.createLinearGradient(
    cx - Math.cos(radians) * radius,
    cy - Math.sin(radians) * radius,
    cx + Math.cos(radians) * radius,
    cy + Math.sin(radians) * radius
  );

  const start = hexToRgb(overlay.color);
  const end = overlay.mode === "color" ? hexToRgb(overlay.endColor) : start;
  const startAlpha = Math.pow(overlay.startOpacity / 100, 0.82);
  const endAlpha = Math.pow(overlay.endOpacity / 100, 0.82);
  const softness = overlay.softness / 100;
  const reach = Math.max(0.05, overlay.reach / 100);
  const center = overlay.position / 100;
  const startStop = clamp(center - reach / 2, 0, 1);
  const endStop = clamp(center + reach / 2, 0, 1);
  const feather = Math.max(0.01, (endStop - startStop) * softness * 0.35);
  const holdStop = clamp(startStop + feather, startStop, endStop);
  const releaseStop = clamp(endStop - feather, startStop, endStop);
  const midA = startAlpha + (endAlpha - startAlpha) * 0.5;
  const midColor = mixRgb(start, end, 0.5);

  gradient.addColorStop(0, rgba(start, startAlpha));
  gradient.addColorStop(startStop, rgba(start, startAlpha));
  gradient.addColorStop(holdStop, rgba(mixRgb(start, midColor, 0.25), startAlpha));
  gradient.addColorStop(releaseStop, rgba(midColor, midA));
  gradient.addColorStop(endStop, rgba(end, endAlpha));
  gradient.addColorStop(1, rgba(end, endAlpha));

  tctx.fillStyle = gradient;
  tctx.fillRect(0, 0, width, height);
}

function renderSurfaceList() {
  surfaceList.innerHTML = "";
  for (const surface of surfaces) {
    const finish = room.surfaces[surface.id];
    const button = document.createElement("button");
    button.className = `surface-card ${room.activeSurface === surface.id ? "active" : ""}`;
    button.type = "button";
    button.innerHTML = `
      <span class="swatch" style="--swatch: linear-gradient(135deg, ${finish.primary}, ${finish.secondary})"></span>
      <span><strong>${surface.name}</strong><small>${surface.role}</small></span>
    `;
    button.addEventListener("click", () => selectSurface(surface.id));
    surfaceList.appendChild(button);
  }
}

function renderStyleGrid() {
  styleGrid.innerHTML = "";
  for (const preset of materialPresets) {
    const button = document.createElement("button");
    button.className = `style-card ${activeFinish().material === preset.id ? "active" : ""}`;
    button.type = "button";
    button.innerHTML = `
      <span class="swatch" style="--swatch: linear-gradient(135deg, ${preset.colors[0]}, ${preset.colors[1]})"></span>
      <strong>${preset.name}</strong>
    `;
    button.addEventListener("click", () => applyPreset(preset));
    styleGrid.appendChild(button);
  }
}

function syncControls() {
  const finish = activeFinish();
  roomWidthInput.value = room.size.width;
  roomDepthInput.value = room.size.depth;
  roomHeightInput.value = room.size.height;

  materialSelect.value = finish.material;
  primaryColor.value = finish.primary;
  secondaryColor.value = finish.secondary;
  layoutSelect.value = finish.layout;
  unitWidthInput.value = finish.unitW;
  unitHeightInput.value = finish.unitH;
  jointSizeInput.value = finish.joint;
  variationRange.value = finish.variation;

  overlayEnabled.checked = finish.overlay.enabled;
  overlayColor.value = finish.overlay.color;
  overlayMode.value = finish.overlay.mode;
  overlayEndColor.value = finish.overlay.endColor;
  overlayStartOpacity.value = finish.overlay.startOpacity;
  overlayEndOpacity.value = finish.overlay.endOpacity;
  overlayAngle.value = finish.overlay.angle;
  overlayPosition.value = finish.overlay.position;
  overlayReach.value = finish.overlay.reach;
  overlaySoftness.value = finish.overlay.softness;
  overlayStartValue.textContent = `${finish.overlay.startOpacity}%`;
  overlayEndValue.textContent = `${finish.overlay.endOpacity}%`;
  overlayAngleValue.textContent = `${finish.overlay.angle} deg`;
  overlayPositionValue.textContent = `${finish.overlay.position}%`;
  overlayReachValue.textContent = `${finish.overlay.reach}%`;
  overlaySoftnessValue.textContent = `${finish.overlay.softness}%`;
  overlayEndColorField.style.display = finish.overlay.mode === "color" ? "grid" : "none";
  activeLayerLabel.textContent = activeSurfaceName();
}

function updateSpec() {
  const roomLine = `<div><strong>Room</strong>: ${fmt(room.size.width)} x ${fmt(room.size.depth)} x ${fmt(room.size.height)} m</div>`;
  const surfaceLines = surfaces
    .map((surface) => {
      const finish = room.surfaces[surface.id];
      const overlayText = finish.overlay.enabled
        ? `fade paint ${finish.overlay.startOpacity}% to ${finish.overlay.endOpacity}%`
        : "no fade paint";
      return `<div><strong>${surface.name}</strong>: ${labelFor(finish.material)}, ${finish.unitW} x ${finish.unitH} cm, ${finish.layout}, ${overlayText}</div>`;
    })
    .join("");
  specSummary.innerHTML = roomLine + surfaceLines;
}

function selectSurface(surfaceId) {
  room.activeSurface = surfaceId;
  setStatus(`${activeSurfaceName()} selected.`);
  renderAll(false);
}

function applyPreset(preset) {
  Object.assign(activeFinish(), {
    material: preset.id,
    primary: preset.colors[0],
    secondary: preset.colors[1],
    layout: preset.layout,
    unitW: preset.unitW,
    unitH: preset.unitH,
    joint: preset.joint,
    variation: preset.variation
  });
  setStatus(`${preset.name} applied to ${activeSurfaceName()}.`);
  renderAll(true);
}

function updateFinishFromControls() {
  Object.assign(activeFinish(), {
    material: materialSelect.value,
    primary: primaryColor.value,
    secondary: secondaryColor.value,
    layout: layoutSelect.value,
    unitW: clamp(parseLocalizedNumber(unitWidthInput.value) ?? activeFinish().unitW, 10, 600),
    unitH: clamp(parseLocalizedNumber(unitHeightInput.value) ?? activeFinish().unitH, 4, 200),
    joint: clamp(parseLocalizedNumber(jointSizeInput.value) ?? activeFinish().joint, 0, 40),
    variation: Number(variationRange.value),
    overlay: {
      enabled: overlayEnabled.checked,
      color: overlayColor.value,
      endColor: overlayEndColor.value,
      mode: overlayMode.value,
      startOpacity: Number(overlayStartOpacity.value),
      endOpacity: Number(overlayEndOpacity.value),
      angle: Number(overlayAngle.value),
      position: Number(overlayPosition.value),
      reach: Number(overlayReach.value),
      softness: Number(overlaySoftness.value)
    }
  });
  renderAll(true);
}

function updateRoomSizeFromControls() {
  const width = parseLocalizedNumber(roomWidthInput.value);
  const depth = parseLocalizedNumber(roomDepthInput.value);
  const height = parseLocalizedNumber(roomHeightInput.value);
  if (width === null || depth === null || height === null) return;

  room.size = {
    width: clamp(width, 1.5, 14),
    depth: clamp(depth, 1.5, 14),
    height: clamp(height, 2, 6)
  };
  setStatus(`Room resized to ${fmt(room.size.width)} x ${fmt(room.size.depth)} x ${fmt(room.size.height)} m.`);
  buildRoom();
  renderAll(false);
}

function renderAll(updateTexture) {
  if (updateTexture) refreshSurfaceTexture(room.activeSurface);
  renderSurfaceList();
  renderStyleGrid();
  syncControls();
  updateSpec();
  highlightActiveSurface();
  renderScene();
}

function highlightActiveSurface() {
  for (const [surfaceId, mesh] of surfaceMeshes.entries()) {
    mesh.material.emissive = new THREE.Color(surfaceId === room.activeSurface ? 0x102d2a : 0x000000);
    mesh.material.emissiveIntensity = surfaceId === room.activeSurface ? 0.55 : 0;
  }
}

function updateCameraTarget() {
  cameraState.position.x = clamp(cameraState.position.x, -room.size.width * 0.65, room.size.width * 0.65);
  cameraState.position.y = clamp(cameraState.position.y, 0.65, room.size.height - 0.25);
  cameraState.position.z = clamp(cameraState.position.z, -room.size.depth * 0.46, room.size.depth * 1.08);
  updateCamera();
}

function updateCamera() {
  const pitch = clamp(cameraState.pitch, -1.15, 1.15);
  const direction = cameraDirection(cameraState.yaw, pitch);
  camera.position.copy(cameraState.position);
  camera.lookAt(cameraState.position.clone().add(direction));
}

function renderScene() {
  updateRendererSize();
  updateCamera();
  renderer.render(scene, camera);
}

function updateRendererSize() {
  const { clientWidth, clientHeight } = canvas;
  const width = Math.max(1, clientWidth);
  const height = Math.max(1, clientHeight);
  const needsResize = canvas.width !== Math.round(width * renderer.getPixelRatio()) || canvas.height !== Math.round(height * renderer.getPixelRatio());
  if (needsResize) {
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
}

function onPointerDown(event) {
  if (event.button === 2) {
    event.preventDefault();
    canvas.classList.add("dragging");
    dragState = {
      x: event.clientX,
      y: event.clientY,
      yaw: cameraState.yaw,
      pitch: cameraState.pitch,
      position: cameraState.position.clone()
    };
    canvas.setPointerCapture(event.pointerId);
    return;
  }

  if (event.button === 0) selectSurfaceFromPointer(event);
}

function onPointerMove(event) {
  if (!dragState) return;
  const dx = event.clientX - dragState.x;
  const dy = event.clientY - dragState.y;
  if (event.shiftKey) {
    const right = new THREE.Vector3(Math.cos(cameraState.yaw), 0, -Math.sin(cameraState.yaw));
    const up = new THREE.Vector3(0, 1, 0);
    cameraState.position.copy(dragState.position).addScaledVector(right, -dx * 0.008).addScaledVector(up, dy * 0.006);
    updateCameraTarget();
  } else {
    cameraState.yaw = dragState.yaw - dx * 0.006;
    cameraState.pitch = clamp(dragState.pitch + dy * 0.005, -1.05, 1.1);
  }
  renderScene();
}

function onPointerUp(event) {
  if (!dragState) return;
  dragState = null;
  canvas.classList.remove("dragging");
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
}

function onWheel(event) {
  event.preventDefault();
  const direction = cameraDirection(cameraState.yaw, cameraState.pitch);
  cameraState.position.addScaledVector(direction, -event.deltaY * 0.0035);
  updateCameraTarget();
  renderScene();
}

function cameraDirection(yaw, pitch) {
  return new THREE.Vector3(
    Math.sin(yaw) * Math.cos(pitch),
    Math.sin(pitch),
    Math.cos(yaw) * Math.cos(pitch)
  ).normalize();
}

function selectSurfaceFromPointer(event) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects([...surfaceMeshes.values()]);
  if (!hits.length) return;
  selectSurface(hits[0].object.userData.surfaceId);
}

function labelFor(materialId) {
  return materialPresets.find((preset) => preset.id === materialId)?.name || materialId;
}

function fmt(value) {
  return Number(value).toFixed(1);
}

function parseLocalizedNumber(value) {
  const text = String(value).trim();
  if (!text || /[,.]$/.test(text)) return null;
  const parsed = Number(text.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function mix(hexA, hexB, amount) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  return rgbToCss(mixRgb(a, b, amount));
}

function mixRgb(a, b, amount) {
  return {
    r: Math.round(a.r + (b.r - a.r) * amount),
    g: Math.round(a.g + (b.g - a.g) * amount),
    b: Math.round(a.b + (b.b - a.b) * amount)
  };
}

function shade(color, amount) {
  const rgb = color.startsWith("#") ? hexToRgb(color) : rgbStringToObj(color);
  const shift = Math.round(amount * 70);
  return rgbToCss({
    r: clamp(rgb.r + shift, 0, 255),
    g: clamp(rgb.g + shift, 0, 255),
    b: clamp(rgb.b + shift, 0, 255)
  });
}

function rgba(rgb, alpha) {
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function rgbToCss(rgb) {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

function rgbStringToObj(color) {
  const values = color.match(/\d+/g).map(Number);
  return { r: values[0], g: values[1], b: values[2] };
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16)
  };
}

function seeded(seed) {
  const x = Math.sin(seed * 999) * 10000;
  return x - Math.floor(x);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

for (const control of [roomWidthInput, roomDepthInput, roomHeightInput]) {
  control.addEventListener("change", updateRoomSizeFromControls);
  control.addEventListener("input", updateRoomSizeFromControls);
}

for (const control of [
  materialSelect,
  primaryColor,
  secondaryColor,
  layoutSelect,
  unitWidthInput,
  unitHeightInput,
  jointSizeInput,
  variationRange,
  overlayEnabled,
  overlayColor,
  overlayMode,
  overlayEndColor,
  overlayStartOpacity,
  overlayEndOpacity,
  overlayAngle,
  overlayPosition,
  overlayReach,
  overlaySoftness
]) {
  control.addEventListener("input", updateFinishFromControls);
  control.addEventListener("change", updateFinishFromControls);
}

canvas.addEventListener("contextmenu", (event) => event.preventDefault());
canvas.addEventListener("pointerdown", onPointerDown);
canvas.addEventListener("pointermove", onPointerMove);
canvas.addEventListener("pointerup", onPointerUp);
canvas.addEventListener("pointercancel", onPointerUp);
canvas.addEventListener("wheel", onWheel, { passive: false });

saveBtn.addEventListener("click", () => {
  localStorage.setItem("surface-studio-3d-room", JSON.stringify(room));
  setStatus("Room saved locally.");
});

exportBtn.addEventListener("click", () => {
  renderScene();
  const link = document.createElement("a");
  link.download = "surface-studio-3d-room.png";
  link.href = renderer.domElement.toDataURL("image/png");
  link.click();
  setStatus("PNG exported.");
});

resetBtn.addEventListener("click", () => {
  room = clone(defaultRoom);
  localStorage.removeItem("surface-studio-3d-room");
  buildRoom();
  setStatus("Room reset.");
  renderAll(false);
});

window.addEventListener("resize", renderScene);

buildRoom();
renderAll(false);
