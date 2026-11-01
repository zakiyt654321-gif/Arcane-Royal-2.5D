# Arcane Royale · Pseudo-3D (2.5D) Engine Overhaul Plan

This architectural blueprint outlines the transformation of Arcane Royale from a flat 2D top-down game into an angled **2.5D pseudo-3D battle royale** (Brawl Stars style). It is designed to run at 60–120 FPS on mobile Android devices using pure HTML5 2D Canvas with zero external 3D libraries or heavy assets, and is fully structured for review and implementation with DeepSeek.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> **Confirmed Architectural Choices:**
> - **Perspective**: Angled 60-degree bird's-eye view (Brawl Stars / Hades style) using a vertical coordinate compression factor ($S_y \approx 0.866$) and vertical billboarding for characters.
> - **Physics & Movement**: Full 3-axis physics ($x, y, z$) with simulated gravity ($g = -980\text{ px/s}^2$), allowing true jumping, knockback arcs, and arcing projectile spells.
> - **Prop Rendering**: **Procedural Canvas Extrusion** with dual polygon faces (bright top face + darker front extrusion wall) to create instantaneous 3D geometric volume at zero asset cost.
> - **Directional Floor Shadows**: Soft elliptical drop shadows offset down-right at $45^\circ$, dynamically shrinking and fading as an entity's $z$-height increases.
> - **Z-Height Collision Gating**: Obstacles define a physical height ($z_{\text{height}}$). Low obstacles (rocks, crates, $z \le 20$) can be cleared during jumps or dashes, while tall structures (pillars, trees, $z \ge 60$) block entities regardless of jump height.
> - **Asset Fallback Bridge**: Future uploaded sprite sheets drop directly into the billboard renderer without breaking the underlying directional shadow or Z-height collision systems.

---

### 1. Overview & Core Concept

The goal of this overhaul is to give Arcane Royale the visual depth, physical heft, and spatial clarity of a modern 3D mobile arena brawler while preserving the lightweight, single-file performance required for Android APK export and 120 FPS displays.

Instead of introducing WebGL or Three.js (which would bloat memory and compromise low-end Android performance), the engine applies **spatial projection math** directly to the Canvas 2D context:
- Floor elements (arena ground, decals, storm ring, and shadows) exist on the angled ground plane ($z = 0$).
- Combatants, projectiles, and particle effects operate in a 3D space $(x, y, z)$, where $z$ represents elevation above ground.
- Props and obstacles project vertical thickness along the $y$-axis to simulate solid height.

---

### 2. User Experience & Visual Design

#### 2.1 The 2.5D Projection Model
- **World Ground to Screen**:
  $$\text{screenX} = (x - \text{Camera.x}) + \frac{W}{2}$$
  $$\text{screenY} = (y - \text{Camera.y}) \times 0.866 + \frac{H}{2} - z$$
- **Billboarding**:
  - Ground decals and storm circles are rendered with `ctx.scale(1.0, 0.866)` to lay flat on the terrain.
  - Character sprites, health bars, and indicators are rendered without Y-compression so they stand upright facing the camera.

#### 2.2 Directional Dynamic Shadows
- Simulated light source placed at the top-left (casting shadows towards $+X, +Y$ at a $45^\circ$ angle).
- **Shadow Math**:
  $$\text{shadowX} = \text{screenX}_{\text{ground}} + 8$$
  $$\text{shadowY} = \text{screenY}_{\text{ground}} + 12$$
  $$\text{scale} = \max\left(0.35, 1 - \frac{z}{120}\right)$$
  $$\text{alpha} = \max\left(0.12, 0.45 \times \left(1 - \frac{z}{160}\right)\right)$$
- When an entity leaps into the air:
  - The sprite rises: $\text{screenY} = \text{groundY} - z$.
  - The shadow stays anchored on the ground, shrinking in size and fading in opacity, providing an unmistakable spatial cue of true elevation.

#### 2.3 Procedural Prop Extrusions
Obstacles (crystals, pillars, crates, boulders) are rendered in two distinct passes:
1. **Front/Side Extrusion Wall**: A darker shaded polygon drawn from ground level $(y)$ upward to $(y - z_{\text{height}})$.
2. **Top Cap Face**: A brighter polygon drawn at $(y - z_{\text{height}})$, receiving full simulated ambient light.
3. **Bevel / Highlight Stroke**: A 1px subtle white/accent stroke on the top edges to accentuate the 3D rim.

```
            ┌───────────────────┐  <-- Top Face (Brighter color)
           /                   /│
          /                   / │
         ┌───────────────────┐  │
         │                   │  │  <-- Front/Side Extrusion (Darker color)
         │                   │  │
         │                   │  │
         │                   │ /
         └───────────────────┘/   <-- Ground Anchor
       (•••• Directional Shadow ••••)
```

---

### 3. Key Product Decisions & Trade-Offs

| Decision | Chosen Approach | Alternative Considered | Rationale |
| :--- | :--- | :--- | :--- |
| **3D Rendering Method** | Pure 2D Canvas Projection + Procedural Extrusion | Three.js / WebGL 3D meshes | Eliminates GPU memory spikes, asset loading stalls, and shader compilation delays on low-spec Android phones; keeps the entire engine in a single self-contained file. |
| **Depth Sorting** | Y-Sorted Render Queue based on $(y - z)$ ground footprint | Full 3D Z-Buffer or BSP Tree | Pure Canvas 2D does not have a hardware depth buffer; sorting entities by their ground $y$-anchor gives perfect visual occlusion with $O(N \log N)$ complexity. |
| **Obstacle Volume** | Dual-Polygon Extrusion (Front Face + Top Face) | Multi-slice Sprite Stacking (6-10 draws per prop) | Sprite stacking multiplies draw calls by 8–10x per obstacle, degrading 120 FPS targets on mobile; procedural extrusion delivers crisp 3D edges in just 2 draw passes. |
| **Jump Mechanic** | Dedicated Jump/Dodge input or automatic elevation on dash | Ground-only movement | Gives fighters physical aerial evasion, allows leaping over low environmental hazards, and introduces high-skill vertical combat mechanics. |

---

### 4. Technical Architecture & Data Strategy (DeepSeek Reference)

#### 4.1 System Diagram
```
┌────────────────────────────────────────────────────────┐
│                   Game Loop (60/120 FPS)               │
└───────────────────────────┬────────────────────────────┘
                            │ deltaTime
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Physics Update                       │
│  - X, Y movement & friction                            │
│  - Z elevation: z += vz * dt; vz += gravity * dt       │
│  - Ground clamping: if (z <= 0) { z = 0; vz = 0; }     │
│  - Z-Gated Collision: checkObs(x, y, z, zHeight)       │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                Layered Render Pipeline                 │
│                                                        │
│  1. Ground Plane (scaleY: 0.866)                       │
│     - Arena floor texture & decals                     │
│     - Storm boundary ring                              │
│                                                        │
│  2. Shadow Pass                                        │
│     - Directional drop shadows anchored to ground      │
│     - Scaled & faded by entity.z                       │
│                                                        │
│  3. Y-Sorted Entity & Prop Pass                        │
│     - Obstacle extrusion (Front wall + Top cap)        │
│     - Billboarded character sprites (y - z)            │
│     - Projectiles (x, y - z) with ground shadow        │
│                                                        │
│  4. Screen-Space HUD & Floating Indicators             │
│     - Critical pulsing HP/Mana bars, minimap, controls │
└────────────────────────────────────────────────────────┘
```

#### 4.2 Data Models

##### Entity Extensions
```typescript
interface Entity {
  x: number;
  y: number;
  z: number;            // Elevation above ground in pixels (0 = grounded)
  vx: number;
  vy: number;
  vz: number;           // Vertical jump/knockback velocity
  zHeight: number;      // Physical height of entity (default: 32px)
  isGrounded: boolean;  // True when z === 0
  jumpForce: number;    // Initial velocity on jump (e.g. 420 px/s)
}
```

##### Obstacle & Prop Definitions
```typescript
interface Obstacle {
  x: number;
  y: number;
  w: number;
  h: number;
  zHeight: number;      // 15 = low rock (jumpable), 65 = tall pillar (blocking)
  type: 'PILLAR' | 'CRYSTAL' | 'CRATE' | 'BOULDER';
  colorTop: string;     // Bright illuminated face
  colorFront: string;   // Darker vertical extrusion wall
  spriteKey?: string;   // Optional asset texture fallback
}
```

#### 4.3 Collision Resolution with Z-Gating
```typescript
function checkEntityObstacleCollision(entity: Entity, obs: Obstacle) {
  // If entity has jumped higher than obstacle top, pass freely
  if (entity.z >= obs.zHeight) {
    return false;
  }

  // Otherwise, standard 2D bounding-box / circle collision on ground footprint
  const closestX = Math.max(obs.x, Math.min(entity.x, obs.x + obs.w));
  const closestY = Math.max(obs.y, Math.min(entity.y, obs.y + obs.h));
  const dx = entity.x - closestX;
  const dy = entity.y - closestY;
  const distSq = dx * dx + dy * dy;

  if (distSq < entity.radius * entity.radius) {
    // Push entity out along ground plane
    resolveGroundOverlap(entity, closestX, closestY);
    return true;
  }
  return false;
}
```

---

### 5. Implementation Roadmap for DeepSeek

1. **Phase 1: Projection & Camera Update**
   - Add camera tilt coefficient $S_y = 0.866$.
   - Update world-to-screen coordinate helper functions.
   - Flatten ground tiles, decal stamps, and storm radius with `ctx.scale(1.0, 0.866)`.

2. **Phase 2: Z-Axis Physics Integration**
   - Add `z`, `vz`, `zHeight`, and `isGrounded` to fighter and bot entities.
   - Implement gravity integration (`vz += GRAVITY * dt`, `z += vz * dt`).
   - Add jump trigger to Dash action or add dedicated Jump button.
   - Add ballistic arc formula to projectile spells (`pz = sin(progress) * arcHeight`).

3. **Phase 3: Procedural Prop Extrusions & Ground Shadows**
   - Implement `drawExtrudedObstacle(ctx, obs)` rendering the front wall polygon and top face polygon.
   - Implement `drawDirectionalShadow(ctx, x, y, z, radius)`.
   - Update obstacle definitions with individual `zHeight` properties (rocks: $z=15$, pillars: $z=70$).

4. **Phase 4: Z-Collision & Aerial Interactions**
   - Gate obstacle collision checks by comparing `entity.z` against `obstacle.zHeight`.
   - Add landing impact VFX (ring of 8 dust particles when `vz < -100` and `z <= 0`).

5. **Phase 5: Seamless Asset Texture Fallback**
   - If an obstacle image from `AssetLoader` is available, draw the sprite with an upright offset $(y - z_{\text{height}})$, while keeping the procedural extrusion underneath as the 3D foundation.
