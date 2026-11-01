# Arcane Royale - Playable HTML Game Artifact & Export Delivery

Deliver the complete, standalone, self-contained `index.html` game file directly into the AI Studio **Artifacts** tab as an exportable artifact, while providing a native 1-tap **"Export HTML"** button inside the game's Lobby for direct mobile downloads.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed based on your input:
> - **Artifact Presentation**: The game will be published as a complete, standalone, self-contained playable `.html` game artifact in the Artifacts tab (`arcane_royale_standalone.html`), runnable offline in any web browser.
> - **In-Game Lobby Export Button**: A dedicated, thumb-friendly "Export Game (.html)" button will be added to the pre-game Lobby screen so mobile Android users can download the single-file game directly to their device with one tap.

---

## 1. Overview & Core Concept

- **What It Does**: Publishes the complete, production-grade Arcane Royale battle royale engine (visuals, wizards, storm, bot AI, progression, shop, and audio) into the AI Studio Artifacts system. Users can immediately view, inspect, and download the full `.html` file from the Artifacts tab, or export it from the in-game Lobby.
- **Target Audience**: Android mobile players and developers seeking a lightweight, zero-dependency, 60FPS battle royale game that runs offline in any browser.
- **Key Value**: Solves the mobile download constraint by giving users two seamless ways to export: directly from the AI Studio Artifacts panel or via an in-game 1-tap download trigger on mobile Chrome.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Artifacts Tab Access**:
   - The user opens the **Artifacts** tab in the AI Studio interface.
   - The standalone game artifact `arcane_royale_standalone.html` is listed with detailed metadata, file size, and direct download/preview options.
2. **In-Game Lobby Export**:
   - On launching the game in mobile Chrome, the Lobby screen presents the Hero Showcase, Wallet (Gold & Gems), and quick actions.
   - Beside the "Shop" button, a clean **"📥 Export HTML"** button is readily accessible.
   - Tapping it triggers a browser file download of `arcane_royale.html` directly into the phone's Downloads folder without opening popups or navigation bars.

### Visual Styling & Component Hierarchy
- **Lobby Export Button**: Styled consistently with the Arcane dark fantasy aesthetic (`rgba(30, 41, 59, 0.85)`, subtle border, thumb-friendly 44px height).
- **Feedback Toast**: When tapped, plays a pleasant confirmation chime and displays a toast: `✓ Game HTML Downloaded to Device!`.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Dual-Delivery Model (Artifacts Tab + In-Game Download)**
  - *Chosen Approach*: Write the complete game to `/.aistudio/artifacts/.../arcane_royale_standalone.html` with full `ArtifactMetadata` so it registers in the AI Studio Artifacts tab, and simultaneously equip the game Lobby with a Blob-based download handler (`URL.createObjectURL(blob)`).
  - *Why*: Ensures maximum accessibility—users on desktop can grab it from the Artifacts tab, while mobile Android users can download it directly from the game's UI in Chrome.
- **Decision 2: Pure Offline Self-Contained Blob**
  - *Chosen Approach*: The export button serializes the current document DOM and inline scripts into a clean UTF-8 HTML Blob.
  - *Why*: Requires no external servers, APIs, or internet connectivity; operates 100% client-side.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                      Arcane Royale                          │
├───────────────────────────────┬─────────────────────────────┤
│      AI Studio Platform       │      Mobile In-Game UI      │
│ ┌───────────────────────────┐ │ ┌─────────────────────────┐ │
│ │       Artifacts Tab       │ │ │       Lobby View        │ │
│ │  arcane_royale_           │ │ │  [🪙 150]    [💎 10]    │ │
│ │  standalone.html          │ │ │  [ Hero Showcase ]      │ │
│ │  (Download / Preview)     │ │ │  [🛒 Shop] [📥 Export]  │ │
│ └─────────────┬─────────────┘ │ │      [⚔️ BATTLE]        │ │
│               │               │ └───────────┬─────────────┘ │
└───────────────┼───────────────┴─────────────┼───────────────┘
                ▼                             ▼
       Direct File Export            Blob Download Trigger
       (AI Studio Storage)           (Mobile Chrome Device)
```

### Data Model & Execution Sequence
1. **Artifact Generation**: Read `/index.html` and mirror the pristine single-file code to `/.aistudio/artifacts/brain/0dced059-a71f-4045-bb2b-a94903df655f/arcane_royale_standalone.html`.
2. **In-Game Export Routine**:
   ```javascript
   function exportGameFile() {
     const htmlContent = "<!doctype html>\n" + document.documentElement.outerHTML;
     const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = 'arcane_royale.html';
     document.body.appendChild(a);
     a.click();
     document.body.removeChild(a);
     URL.revokeObjectURL(url);
     showToast("✓ Game Downloaded to Device!", false);
   }
   ```
3. **Verification**: Run `compile_applet` and `lint_applet` to ensure build integrity.
