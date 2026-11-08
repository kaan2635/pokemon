import { Direction, MapData, NpcData, WeatherType } from '../types/game';

const TILE = 32;

const imageCache = new Map<string, HTMLImageElement>();

export function getCachedImage(src: string): HTMLImageElement | null {
  let img = imageCache.get(src);
  if (!img) {
    img = new Image();
    img.src = src;
    imageCache.set(src, img);
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}

export interface RenderOverworldParams {
  ctx: CanvasRenderingContext2D;
  canvasWidth: number;
  canvasHeight: number;
  map: MapData;
  playerX: number; // smoothly interpolated float tile x
  playerY: number; // smoothly interpolated float tile y
  playerDir: Direction;
  isMoving: boolean;
  isRunning: boolean;
  isBiking: boolean;
  isSurfing: boolean;
  followerSpeciesId?: number;
  followerX: number;
  followerY: number;
  collectedItems: Set<string>;
  defeatedTrainers: Set<string>;
  flags: Record<string, boolean>;
  weather: WeatherType;
  tick: number;
  alertNpcId?: string | null;
}

function drawTile(
  ctx: CanvasRenderingContext2D,
  ch: string,
  px: number,
  py: number,
  gx: number,
  gy: number,
  tick: number,
  isCave: boolean
) {
  // Base ground fill
  if (isCave) {
    ctx.fillStyle = (gx + gy) % 2 === 0 ? '#7c6248' : '#755b42';
  } else {
    ctx.fillStyle = (gx + gy) % 2 === 0 ? '#68c151' : '#61b84b';
  }
  ctx.fillRect(px, py, TILE, TILE);

  switch (ch) {
    case '.': {
      // Subtle grass pixel tufts
      ctx.fillStyle = '#53a63f';
      if ((gx * 7 + gy * 13) % 3 === 0) {
        ctx.fillRect(px + 6, py + 10, 2, 4);
        ctx.fillRect(px + 22, py + 20, 2, 4);
      }
      break;
    }
    case 'c': {
      ctx.fillStyle = (gx + gy) % 2 === 0 ? '#8a6d50' : '#826549';
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = '#6c5239';
      if ((gx + gy * 3) % 4 === 0) {
        ctx.fillRect(px + 8, py + 12, 4, 2);
        ctx.fillRect(px + 20, py + 22, 3, 2);
      }
      break;
    }
    case ',': {
      // Warm GBA dirt path
      ctx.fillStyle = '#e5c98b';
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = '#d4b472';
      ctx.fillRect(px + 4, py + 6, 4, 3);
      ctx.fillRect(px + 20, py + 18, 5, 3);
      ctx.fillStyle = '#f2dca6';
      ctx.fillRect(px + 12, py + 12, 4, 2);
      break;
    }
    case ':': {
      // City cobblestone plaza
      ctx.fillStyle = '#d8dee9';
      ctx.fillRect(px, py, TILE, TILE);
      ctx.strokeStyle = '#b8c2d1';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 1, py + 1, 14, 14);
      ctx.strokeRect(px + 16, py + 1, 15, 14);
      ctx.strokeRect(px + 8, py + 16, 16, 15);
      break;
    }
    case '_': {
      // Indoor wood floor
      ctx.fillStyle = '#d9a86c';
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = '#c49154';
      ctx.fillRect(px, py + 7, TILE, 2);
      ctx.fillRect(px, py + 15, TILE, 2);
      ctx.fillRect(px, py + 23, TILE, 2);
      ctx.fillRect(px + ((gy % 2) * 16), py, 2, TILE);
      break;
    }
    case '=': {
      // Wooden bridge over water
      ctx.fillStyle = '#3687d9';
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = '#b98346';
      ctx.fillRect(px + 1, py + 2, TILE - 2, TILE - 4);
      ctx.fillStyle = '#8c5e2a';
      for (let i = 4; i < TILE; i += 6) {
        ctx.fillRect(px + i, py + 2, 2, TILE - 4);
      }
      ctx.fillStyle = '#dfae70';
      ctx.fillRect(px, py + 2, TILE, 3);
      ctx.fillRect(px, py + TILE - 5, TILE, 3);
      break;
    }
    case 's': {
      // Golden sand
      ctx.fillStyle = '#f3dc99';
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = '#e0c479';
      ctx.fillRect(px + 7, py + 9, 3, 2);
      ctx.fillRect(px + 21, py + 23, 3, 2);
      break;
    }
    case 'g': {
      // Tall Wild Grass (Swaying GBA emerald blades!)
      const sway = Math.sin(tick * 0.08 + gx * 0.7 + gy * 0.5) * 1.5;
      ctx.fillStyle = '#2d7a2b';
      ctx.fillRect(px + 2, py + 8, TILE - 4, TILE - 10);
      ctx.fillStyle = '#3da138';
      for (let bx = 3; bx < 28; bx += 6) {
        ctx.beginPath();
        ctx.moveTo(px + bx, py + 28);
        ctx.lineTo(px + bx + 3 + sway, py + 7);
        ctx.lineTo(px + bx + 6, py + 28);
        ctx.fill();
      }
      ctx.fillStyle = '#7be068';
      for (let bx = 5; bx < 27; bx += 8) {
        ctx.fillRect(px + bx + sway * 0.6, py + 10, 2, 7);
      }
      break;
    }
    case 'f': {
      // Animated GBA Red & Yellow Wildflowers
      const phase = Math.floor(tick / 22) % 2;
      const offset = phase === 0 ? 0 : 2;
      const drawFlower = (fx: number, fy: number, petal: string) => {
        ctx.fillStyle = '#3d8f34';
        ctx.fillRect(fx + 2, fy + 5, 2, 4);
        ctx.fillStyle = petal;
        ctx.fillRect(fx + offset, fy + 2, 6, 4);
        ctx.fillRect(fx + 1 + offset, fy + 1, 4, 6);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(fx + 2 + offset, fy + 3, 2, 2);
      };
      drawFlower(px + 5, py + 6, '#f43f5e');
      drawFlower(px + 18, py + 16, '#fb923c');
      drawFlower(px + 7, py + 20, '#facc15');
      break;
    }
    case '~': {
      // Shimmering GBA Water
      ctx.fillStyle = '#2b82d9';
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = '#3d95eb';
      ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
      const waveShift = Math.floor((tick * 0.25 + gx * 4 + gy * 2) % 14);
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(px + 4 + (waveShift % 8), py + 8, 8, 2);
      ctx.fillRect(px + 14 - (waveShift % 6), py + 21, 9, 2);
      break;
    }
    case 'T': {
      // Iconic GBA Layered Forest Tree
      ctx.fillStyle = '#3f2a18';
      ctx.fillRect(px + 11, py + 22, 10, 10);
      ctx.fillStyle = '#1b5125';
      ctx.beginPath();
      ctx.arc(px + 16, py + 16, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2b7a36';
      ctx.beginPath();
      ctx.arc(px + 16, py + 13, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4cb050';
      ctx.beginPath();
      ctx.arc(px + 14, py + 10, 8, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case '#': {
      // Sculpted Rock / Mountain Cliff Wall
      ctx.fillStyle = '#5c4b3c';
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = '#78624f';
      ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 6);
      ctx.fillStyle = '#967c66';
      ctx.fillRect(px + 5, py + 4, TILE - 10, 8);
      ctx.fillStyle = '#3f3227';
      ctx.fillRect(px, py + TILE - 4, TILE, 4);
      break;
    }
    case 'W': {
      // Building Wall with GBA window
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(px, py + TILE - 5, TILE, 5);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
      if ((gx + gy) % 2 === 0) {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(px + 8, py + 8, 16, 12);
        ctx.strokeStyle = '#475569';
        ctx.strokeRect(px + 8, py + 8, 16, 12);
        ctx.fillStyle = '#e0f2fe';
        ctx.fillRect(px + 10, py + 10, 5, 4);
      }
      break;
    }
    case 'R':
    case 'B':
    case 'G': {
      // GBA Shingled Roofs: Red (Center/House), Blue (Mart/Lab), Gold/Emerald (Gym)
      const main = ch === 'R' ? '#dc2626' : ch === 'B' ? '#2563eb' : '#d97706';
      const light = ch === 'R' ? '#f87171' : ch === 'B' ? '#60a5fa' : '#fbbf24';
      const dark = ch === 'R' ? '#991b1b' : ch === 'B' ? '#1e40af' : '#92400e';
      ctx.fillStyle = main;
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = light;
      ctx.fillRect(px, py, TILE, 6);
      ctx.fillStyle = dark;
      ctx.fillRect(px, py + 14, TILE, 3);
      ctx.fillRect(px, py + 28, TILE, 4);
      break;
    }
    case 'D': {
      // Building Doorway
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = '#334155';
      ctx.fillRect(px + 5, py + 4, TILE - 10, TILE - 4);
      ctx.fillStyle = '#7dd3fc';
      ctx.fillRect(px + 8, py + 7, TILE - 16, 12);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(px + 20, py + 19, 3, 3);
      break;
    }
    case 'v': {
      // One-way jumpable GBA Ledge
      ctx.fillStyle = '#855830';
      ctx.fillRect(px, py + 14, TILE, 10);
      ctx.fillStyle = '#52341a';
      ctx.fillRect(px, py + 24, TILE, 6);
      ctx.fillStyle = '#a67446';
      ctx.fillRect(px, py + 12, TILE, 4);
      break;
    }
    case 'E': {
      // Warp Carpet / Exit Tile
      ctx.fillStyle = '#be123c';
      ctx.fillRect(px + 2, py + 4, TILE - 4, TILE - 8);
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 4, py + 6, TILE - 8, TILE - 12);
      break;
    }
    case 'P': {
      // Glowing Psychic Teleporter Pad
      const glow = 0.6 + 0.4 * Math.sin(tick * 0.15);
      ctx.fillStyle = '#4c1d95';
      ctx.fillRect(px + 3, py + 3, TILE - 6, TILE - 6);
      ctx.fillStyle = `rgba(56, 189, 248, ${glow})`;
      ctx.beginPath();
      ctx.arc(px + 16, py + 16, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f0abfc';
      ctx.beginPath();
      ctx.arc(px + 16, py + 16, 5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'S': {
      // Ornate Gym / Legendary Shrine Pillar
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(px + 6, py + 18, 20, 12);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(px + 9, py + 6, 14, 14);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(px + 12, py + 8, 8, 6);
      break;
    }
  }
}

function drawHumanoidSprite(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  dir: Direction,
  stepFrame: number,
  palette: { hat: string; hair: string; shirt: string; pants: string; skin: string; accent?: string },
  opts?: { isBiking?: boolean; isSurfing?: boolean; isRunning?: boolean }
) {
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(px + 16, py + 29, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  if (opts?.isSurfing) {
    // Lapras Surf mount under player!
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.ellipse(px + 16, py + 26, 13, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(px + 16, py + 24, 7, Math.PI, 0);
    ctx.fill();
  }

  if (opts?.isBiking) {
    // Racing Bike wheels
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px + 9, py + 26, 4, 0, Math.PI * 2);
    ctx.arc(px + 23, py + 26, 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(px + 9, py + 26);
    ctx.lineTo(px + 16, py + 20);
    ctx.lineTo(px + 23, py + 26);
    ctx.stroke();
  }

  const bob = stepFrame % 2 === 1 ? -1.5 : 0;
  const lean = opts?.isRunning ? (dir === 'left' ? -2 : dir === 'right' ? 2 : 0) : 0;
  const bx = px + lean;
  const by = py + bob - (opts?.isSurfing ? 3 : 0);

  // Legs
  const legOffset = stepFrame === 1 ? -2 : stepFrame === 3 ? 2 : 0;
  ctx.fillStyle = palette.pants;
  ctx.fillRect(bx + 10, by + 21 + (legOffset > 0 ? -1 : 0), 5, 7);
  ctx.fillRect(bx + 17, by + 21 + (legOffset < 0 ? -1 : 0), 5, 7);

  // Torso / Jacket
  ctx.fillStyle = palette.shirt;
  ctx.fillRect(bx + 9, by + 13, 14, 9);
  if (palette.accent) {
    ctx.fillStyle = palette.accent;
    ctx.fillRect(bx + 14, by + 13, 4, 9);
  }

  // Arms
  ctx.fillStyle = palette.shirt;
  ctx.fillRect(bx + 6, by + 14 + legOffset * 0.5, 3, 6);
  ctx.fillRect(bx + 23, by + 14 - legOffset * 0.5, 3, 6);

  // Head
  ctx.fillStyle = palette.skin;
  ctx.fillRect(bx + 9, by + 4, 14, 10);

  // Hair & Cap
  ctx.fillStyle = palette.hair;
  ctx.fillRect(bx + 8, by + 4, 16, 4);
  ctx.fillStyle = palette.hat;
  ctx.fillRect(bx + 8, by + 1, 16, 5);
  if (dir === 'down') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bx + 11, by + 3, 10, 2);
    // Eyes
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(bx + 11, by + 8, 2, 3);
    ctx.fillRect(bx + 19, by + 8, 2, 3);
  } else if (dir === 'up') {
    ctx.fillStyle = palette.hair;
    ctx.fillRect(bx + 9, by + 6, 14, 7);
  } else if (dir === 'left') {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(bx + 10, by + 8, 2, 3);
  } else if (dir === 'right') {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(bx + 20, by + 8, 2, 3);
  }
}

const NPC_PALETTES: Record<
  NpcData['spriteType'],
  { hat: string; hair: string; shirt: string; pants: string; skin: string; accent?: string }
> = {
  oak: { hat: '#cbd5e1', hair: '#94a3b8', shirt: '#f8fafc', pants: '#78350f', skin: '#fed7aa', accent: '#b91c1c' },
  mom: { hat: '#f43f5e', hair: '#9a3412', shirt: '#fb7185', pants: '#1e3a8a', skin: '#fed7aa' },
  rival: { hat: '#92400e', hair: '#b45309', shirt: '#4c1d95', pants: '#1e293b', skin: '#fed7aa', accent: '#cbd5e1' },
  nurse: { hat: '#ffffff', hair: '#f472b6', shirt: '#fbcfe8', pants: '#f472b6', skin: '#ffe4e6', accent: '#ef4444' },
  mart: { hat: '#2563eb', hair: '#1e293b', shirt: '#3b82f6', pants: '#1e293b', skin: '#fed7aa', accent: '#ffffff' },
  youngster: { hat: '#eab308', hair: '#713f12', shirt: '#38bdf8', pants: '#1d4ed8', skin: '#fed7aa' },
  lass: { hat: '#ec4899', hair: '#854d0e', shirt: '#f472b6', pants: '#1e40af', skin: '#fed7aa' },
  bugcatcher: { hat: '#fde047', hair: '#422006', shirt: '#84cc16', pants: '#365314', skin: '#fed7aa' },
  hiker: { hat: '#78350f', hair: '#451a03', shirt: '#a16207', pants: '#44403c', skin: '#fdba74' },
  rocket: { hat: '#0f172a', hair: '#334155', shirt: '#1e293b', pants: '#0f172a', skin: '#fed7aa', accent: '#ef4444' },
  magma: { hat: '#991b1b', hair: '#1e293b', shirt: '#b91c1c', pants: '#18181b', skin: '#fed7aa', accent: '#fbbf24' },
  gymleader: { hat: '#dc2626', hair: '#1e293b', shirt: '#0f172a', pants: '#334155', skin: '#fed7aa', accent: '#facc15' },
  gentleman: { hat: '#1e293b', hair: '#e2e8f0', shirt: '#334155', pants: '#0f172a', skin: '#fed7aa', accent: '#ef4444' },
  scientist: { hat: '#f1f5f9', hair: '#475569', shirt: '#ffffff', pants: '#334155', skin: '#fed7aa', accent: '#38bdf8' },
  sailor: { hat: '#ffffff', hair: '#78350f', shirt: '#1d4ed8', pants: '#1e3a8a', skin: '#fdba74', accent: '#ffffff' },
  guard: { hat: '#1e3a8a', hair: '#0f172a', shirt: '#2563eb', pants: '#1e293b', skin: '#fed7aa', accent: '#fbbf24' },
  champion: { hat: '#7c3aed', hair: '#f59e0b', shirt: '#1e1b4b', pants: '#0f172a', skin: '#fed7aa', accent: '#ef4444' },
  legendary: { hat: '#fbbf24', hair: '#fbbf24', shirt: '#f59e0b', pants: '#d97706', skin: '#fef08a' },
  guildmaster: { hat: '#0284c7', hair: '#f8fafc', shirt: '#38bdf8', pants: '#facc15', skin: '#fef08a', accent: '#ffffff' },
};

export function isNpcVisible(npc: NpcData, flags: Record<string, boolean>): boolean {
  if (npc.showIfFlag && !flags[npc.showIfFlag]) return false;
  if (npc.hideIfFlag && flags[npc.hideIfFlag]) return false;
  return true;
}

export function renderOverworld(params: RenderOverworldParams) {
  const {
    ctx,
    canvasWidth,
    canvasHeight,
    map,
    playerX,
    playerY,
    playerDir,
    isMoving,
    isRunning,
    isBiking,
    isSurfing,
    followerSpeciesId,
    followerX,
    followerY,
    collectedItems,
    flags,
    weather,
    tick,
    alertNpcId,
  } = params;

  ctx.imageSmoothingEnabled = false;

  // Clear dark background
  ctx.fillStyle = map.isCave ? '#1c1510' : map.isIndoor ? '#0f172a' : '#14331b';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const mapW = map.rows[0].length * TILE;
  const mapH = map.rows.length * TILE;

  // Camera centered on player, clamped gently when map is larger than viewport
  let camX = playerX * TILE + TILE / 2 - canvasWidth / 2;
  let camY = playerY * TILE + TILE / 2 - canvasHeight / 2;
  if (mapW > canvasWidth) {
    camX = Math.max(0, Math.min(mapW - canvasWidth, camX));
  } else {
    camX = (mapW - canvasWidth) / 2;
  }
  if (mapH > canvasHeight) {
    camY = Math.max(0, Math.min(mapH - canvasHeight, camY));
  } else {
    camY = (mapH - canvasHeight) / 2;
  }

  ctx.save();
  ctx.translate(-Math.round(camX), -Math.round(camY));

  // 1. Draw Tiles
  for (let gy = 0; gy < map.rows.length; gy++) {
    const row = map.rows[gy];
    for (let gx = 0; gx < row.length; gx++) {
      const px = gx * TILE;
      const py = gy * TILE;
      if (
        px + TILE < camX - TILE ||
        px > camX + canvasWidth + TILE ||
        py + TILE < camY - TILE ||
        py > camY + canvasHeight + TILE
      ) {
        continue;
      }
      drawTile(ctx, row[gx], px, py, gx, gy, tick, !!map.isCave);
    }
  }

  // 2. Draw Signs
  for (const sign of map.signs) {
    const sx = sign.x * TILE;
    const sy = sign.y * TILE;
    ctx.fillStyle = '#78350f';
    ctx.fillRect(sx + 14, sy + 18, 4, 11);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(sx + 5, sy + 7, 22, 13);
    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx + 7, sy + 9, 18, 9);
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(sx + 10, sy + 12, 12, 2);
    ctx.fillRect(sx + 10, sy + 15, 8, 2);
  }

  // 3. Draw Ground Item Poké Balls
  for (const gi of map.groundItems) {
    if (collectedItems.has(gi.id)) continue;
    const ix = gi.x * TILE + 16;
    const iy = gi.y * TILE + 18;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(ix, iy + 6, 7, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(ix, iy, 7, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(ix, iy, 7, 0, Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(ix, iy, 7, 0, Math.PI * 2);
    ctx.moveTo(ix - 7, iy);
    ctx.lineTo(ix + 7, iy);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ix, iy, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Depth-sorted Entities (NPCs + Follower Pokémon + Player Red)
  type Drawable = { ySort: number; draw: () => void };
  const entities: Drawable[] = [];

  for (const npc of map.npcs) {
    if (!isNpcVisible(npc, flags)) continue;
    entities.push({
      ySort: npc.y,
      draw: () => {
        const nx = npc.x * TILE;
        const ny = npc.y * TILE;
        if (npc.spriteType === 'legendary' && npc.legendarySpeciesId) {
          // Legendary Boss Aura + Actual GBA Sprite!
          const pulse = 14 + Math.sin(tick * 0.1) * 3;
          ctx.fillStyle = 'rgba(250, 204, 21, 0.28)';
          ctx.beginPath();
          ctx.arc(nx + 16, ny + 16, pulse, 0, Math.PI * 2);
          ctx.fill();
          const img = getCachedImage(`/sprites/front/${npc.legendarySpeciesId}.png`);
          if (img) {
            const floatY = Math.sin(tick * 0.08) * 2.5;
            ctx.drawImage(img, nx - 8, ny - 14 + floatY, 48, 48);
          } else {
            drawHumanoidSprite(ctx, nx, ny, npc.dir, 0, NPC_PALETTES.legendary);
          }
        } else {
          drawHumanoidSprite(ctx, nx, ny, npc.dir, 0, NPC_PALETTES[npc.spriteType]);
        }

        // Trainer Sight `!` Bubble
        if (alertNpcId === npc.id) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(nx + 9, ny - 20, 14, 16);
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 2;
          ctx.strokeRect(nx + 9, ny - 20, 14, 16);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(nx + 14, ny - 17, 4, 7);
          ctx.fillRect(nx + 14, ny - 8, 4, 3);
        }
      },
    });
  }

  // Follower Pokémon (Emerald Seaglass / Yellow tribute!)
  if (followerSpeciesId && !isSurfing) {
    entities.push({
      ySort: followerY - 0.01,
      draw: () => {
        const fx = followerX * TILE;
        const fy = followerY * TILE;
        const bounce = Math.abs(Math.sin(tick * 0.14)) * 3;
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.beginPath();
        ctx.ellipse(fx + 16, fy + 28, 8, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        const icon = getCachedImage(`/sprites/icons/${followerSpeciesId}.png`);
        if (icon) {
          ctx.drawImage(icon, fx, fy - 4 - bounce, 32, 32);
        }
      },
    });
  }

  // Player Red
  entities.push({
    ySort: playerY,
    draw: () => {
      const stepFrame = isMoving ? Math.floor(tick / 5) % 4 : 0;
      drawHumanoidSprite(
        ctx,
        playerX * TILE,
        playerY * TILE,
        playerDir,
        stepFrame,
        {
          hat: '#ef4444',
          hair: '#0f172a',
          shirt: '#dc2626',
          pants: '#1d4ed8',
          skin: '#fed7aa',
          accent: '#f8fafc',
        },
        { isBiking, isSurfing, isRunning }
      );
    },
  });

  entities.sort((a, b) => a.ySort - b.ySort);
  for (const ent of entities) ent.draw();

  ctx.restore();

  // 5. Weather & Ambient Lighting Overlays (Ruby/Sapphire/Emerald + Lavender atmosphere!)
  if (map.id === 'lavender_town') {
    ctx.fillStyle = 'rgba(139, 92, 246, 0.14)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  } else if (map.isCave) {
    const grad = ctx.createRadialGradient(
      canvasWidth / 2,
      canvasHeight / 2,
      90,
      canvasWidth / 2,
      canvasHeight / 2,
      Math.max(canvasWidth, canvasHeight) * 0.65
    );
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  if (!map.isIndoor) {
    if (weather === 'rain') {
      ctx.fillStyle = 'rgba(30, 58, 138, 0.18)';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.65)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 40; i++) {
        const rx = ((i * 73 + tick * 9) % (canvasWidth + 80)) - 40;
        const ry = ((i * 47 + tick * 15) % (canvasHeight + 40)) - 20;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 6, ry + 14);
        ctx.stroke();
      }
    } else if (weather === 'sun') {
      const grad = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
      grad.addColorStop(0, 'rgba(251, 191, 36, 0.18)');
      grad.addColorStop(1, 'rgba(249, 115, 22, 0.06)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    } else if (weather === 'sandstorm') {
      ctx.fillStyle = 'rgba(217, 119, 6, 0.2)';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.fillStyle = 'rgba(254, 243, 199, 0.65)';
      for (let i = 0; i < 45; i++) {
        const sx = (i * 61 + tick * 14) % canvasWidth;
        const sy = (i * 37 + Math.sin(tick * 0.1 + i) * 12 + canvasHeight) % canvasHeight;
        ctx.fillRect(sx, sy, 4, 2);
      }
    }
  }
}
