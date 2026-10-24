// A small Block Blast-style puzzle for the phone: drag the three pieces onto an 8×8 board,
// fill a whole row or column to clear it, and keep going until nothing fits.
// mobile.js mounts it under an extra's video when the extra has `game: "blocks"`.
window.BlockBlast = (() => {
  const N = 8;
  const COLORS = ["#ff4d6d", "#ff9f1c", "#ffd60a", "#4cd964", "#2ec4f1", "#3a7bff", "#a259ff"];
  // each shape is a list of [row, col] cells
  const rect = (h, w) => { const s = []; for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) s.push([r, c]); return s; };
  const SHAPES = [
    rect(1, 1), rect(1, 2), rect(2, 1), rect(1, 3), rect(3, 1), rect(1, 4), rect(4, 1), rect(1, 5), rect(5, 1),
    rect(2, 2), rect(2, 2), rect(3, 3), rect(2, 3), rect(3, 2),
    [[0, 0], [1, 0], [1, 1]], [[0, 1], [1, 0], [1, 1]], [[0, 0], [0, 1], [1, 0]], [[0, 0], [0, 1], [1, 1]],
    [[0, 0], [1, 0], [2, 0], [2, 1]], [[0, 1], [1, 1], [2, 1], [2, 0]], [[0, 0], [0, 1], [1, 0], [2, 0]], [[0, 0], [0, 1], [1, 1], [2, 1]],
    [[0, 0], [0, 1], [0, 2], [1, 0]], [[0, 0], [0, 1], [0, 2], [1, 2]], [[0, 0], [1, 0], [1, 1], [1, 2]], [[0, 2], [1, 0], [1, 1], [1, 2]],
    [[0, 0], [0, 1], [0, 2], [1, 1]], [[0, 1], [1, 0], [1, 1], [1, 2]], [[0, 0], [1, 0], [2, 0], [1, 1]], [[0, 1], [1, 1], [2, 1], [1, 0]],
    [[0, 0], [0, 1], [1, 1], [1, 2]], [[0, 1], [0, 2], [1, 0], [1, 1]], [[0, 0], [1, 0], [1, 1], [2, 1]], [[0, 1], [1, 1], [1, 0], [2, 0]],
    [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]], [[0, 0], [0, 1], [0, 2], [1, 0], [2, 0]],
  ];
  const size = (shape) => [Math.max(...shape.map(([r]) => r)) + 1, Math.max(...shape.map(([, c]) => c)) + 1];
  const el = (tag, className, props) => Object.assign(document.createElement(tag), className ? { className } : {}, props);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  return function mount(host) {
    const root = el("section", "bb", { ariaLabel: "Block puzzle" });
    const head = el("div", "bb-head");
    const scoreEl = el("strong", "bb-score", { textContent: "0" });
    const bestEl = el("span", "bb-best");
    const restart = el("button", "bb-restart", { type: "button", textContent: "Restart" });
    const side = el("div", "bb-head-side");
    side.append(restart, bestEl);
    head.append(el("span", "bb-label", { textContent: "Can't sit through it? Play while it runs" }), scoreEl, side);
    const board = el("div", "bb-board");
    const cells = [];
    for (let i = 0; i < N * N; i++) cells.push(board.appendChild(el("span", "bb-cell")));
    const pop = el("span", "bb-pop");
    const over = el("div", "bb-over");
    board.append(pop, over);
    const tray = el("div", "bb-tray");
    root.append(head, board, tray);
    host.appendChild(root);

    let grid, pieces, score, combo, best = 0, drag = null;
    try { best = +localStorage.getItem("bb-best") || 0; } catch {}

    // the page behind can be pulled down to close, so keep the game's touches to itself
    for (const t of ["touchstart", "touchmove", "touchend"]) root.addEventListener(t, (e) => e.stopPropagation(), { passive: true });

    const fits = (shape, r0, c0) => shape.every(([r, c]) => r0 + r < N && c0 + c < N && r0 + r >= 0 && c0 + c >= 0 && !grid[(r0 + r) * N + c0 + c]);
    const fitsAnywhere = (shape) => { for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (fits(shape, r, c)) return true; return false; };

    function render() {
      cells.forEach((cell, i) => { cell.style.background = grid[i] || ""; cell.classList.toggle("on", !!grid[i]); });
      scoreEl.textContent = score;
      bestEl.textContent = "Best " + best;
    }

    function pieceEl(p, cell) {
      const [h, w] = size(p.shape);
      const box = el("span", "bb-piece");
      box.style.cssText = `width:${w * cell}px;height:${h * cell}px;--c:${p.color};--s:${cell}px`;
      for (const [r, c] of p.shape) {
        const b = box.appendChild(el("span", "bb-block"));
        b.style.left = c * cell + "px";
        b.style.top = r * cell + "px";
      }
      return box;
    }

    function deal() {
      // three new pieces, and at least one of them has somewhere to go if anything can
      for (let tries = 0; tries < 20; tries++) {
        pieces = [0, 1, 2].map(() => ({ shape: pick(SHAPES), color: pick(COLORS) }));
        if (pieces.some((p) => fitsAnywhere(p.shape))) break;
      }
      drawTray();
    }

    function drawTray() {
      tray.textContent = "";
      const cell = Math.min(22, board.clientWidth / N * 0.55 || 20);
      pieces.forEach((p, i) => {
        const slot = tray.appendChild(el("div", "bb-slot"));
        if (!p) return;
        const box = slot.appendChild(pieceEl(p, cell));
        box.classList.toggle("stuck", !fitsAnywhere(p.shape));
        slot.addEventListener("pointerdown", (e) => startDrag(e, i, slot));
      });
    }

    // ---------- dragging: the piece grows to board size and floats above the finger ----------
    function startDrag(e, i, slot) {
      if (drag || over.classList.contains("show")) return;
      e.preventDefault();
      const cell = (board.clientWidth - 3) / N; // one step: a cell and the 3px gap after it
      const p = pieces[i];
      const ghost = pieceEl(p, cell);
      ghost.classList.add("bb-drag");
      document.body.appendChild(ghost);
      slot.classList.add("lifted");
      slot.setPointerCapture(e.pointerId);
      drag = { i, p, ghost, slot, cell, at: null, lift: e.pointerType === "mouse" ? 0 : cell * 1.6 };
      move(e);
      slot.onpointermove = move;
      slot.onpointerup = slot.onpointercancel = drop;
    }

    function move(e) {
      if (!drag) return;
      const { p, ghost, cell, lift } = drag;
      const [h, w] = size(p.shape);
      const x = e.clientX - (w * cell) / 2;
      const y = e.clientY - h * cell - lift + (lift ? 0 : (h * cell) / 2);
      ghost.style.transform = `translate(${x}px, ${y}px)`;
      const b = board.getBoundingClientRect();
      const r0 = Math.round((y - b.top - 3) / cell), c0 = Math.round((x - b.left - 3) / cell);
      drag.at = fits(p.shape, r0, c0) ? [r0, c0] : null;
      preview();
    }

    // shade where it would land, and light up the rows and columns it would finish
    function preview() {
      cells.forEach((c) => { c.classList.remove("hint", "clearing"); c.style.removeProperty("--c"); });
      if (!drag || !drag.at) return;
      const [r0, c0] = drag.at;
      const g = grid.slice();
      for (const [r, c] of drag.p.shape) {
        const i = (r0 + r) * N + c0 + c;
        g[i] = drag.p.color;
        cells[i].classList.add("hint");
        cells[i].style.setProperty("--c", drag.p.color);
      }
      for (const i of fullCells(g)) { cells[i].classList.add("clearing"); cells[i].style.setProperty("--c", drag.p.color); }
    }

    function fullCells(g) {
      const out = new Set();
      for (let k = 0; k < N; k++) {
        const row = [...Array(N)].map((_, j) => k * N + j), col = [...Array(N)].map((_, j) => j * N + k);
        if (row.every((i) => g[i])) row.forEach((i) => out.add(i));
        if (col.every((i) => g[i])) col.forEach((i) => out.add(i));
      }
      return out;
    }

    function lines(g) {
      let n = 0;
      for (let k = 0; k < N; k++) {
        if ([...Array(N)].every((_, j) => g[k * N + j])) n++;
        if ([...Array(N)].every((_, j) => g[j * N + k])) n++;
      }
      return n;
    }

    function drop() {
      if (!drag) return;
      const { i, p, ghost, slot, at } = drag;
      slot.onpointermove = slot.onpointerup = slot.onpointercancel = null;
      drag = null;
      preview();
      if (!at) {
        // fly back to the tray
        const r = slot.firstChild.getBoundingClientRect();
        ghost.style.transition = "transform .2s ease, opacity .2s";
        ghost.style.transform = `translate(${r.left}px, ${r.top}px) scale(.5)`;
        ghost.style.opacity = "0";
        setTimeout(() => { ghost.remove(); slot.classList.remove("lifted"); }, 200);
        return;
      }
      ghost.remove();
      place(i, p, at);
    }

    function place(i, p, [r0, c0]) {
      for (const [r, c] of p.shape) grid[(r0 + r) * N + c0 + c] = p.color;
      score += p.shape.length;
      const n = lines(grid);
      const gone = fullCells(grid);
      if (n) {
        combo++;
        const gain = n * 10 * n * combo;
        score += gain;
        flash(n > 1 || combo > 1 ? `${n > 1 ? n + " lines" : "Clear"}${combo > 1 ? " · combo ×" + combo : ""}  +${gain}` : `+${gain}`, p.color);
        for (const k of gone) {
          cells[k].classList.add("burst");
          setTimeout(() => cells[k].classList.remove("burst"), 360);
          grid[k] = null;
        }
        navigator.vibrate && navigator.vibrate(12);
      } else combo = 0;
      if (score > best) { best = score; try { localStorage.setItem("bb-best", best); } catch {} }
      pieces[i] = null;
      if (pieces.every((x) => !x)) deal(); else drawTray();
      render();
      if (pieces.every((x) => !x || !fitsAnywhere(x.shape))) setTimeout(gameOver, 450);
    }

    function flash(text, color) {
      pop.textContent = text;
      pop.style.color = color;
      pop.classList.remove("show");
      void pop.offsetWidth;
      pop.classList.add("show");
    }

    function gameOver() {
      over.textContent = "";
      const again = el("button", "", { type: "button", textContent: "Play again" });
      again.addEventListener("click", start);
      over.append(el("strong", "", { textContent: "No more room" }), el("span", "", { textContent: `Score ${score}${score && score >= best ? " · new best!" : ""}` }), again);
      over.classList.add("show");
    }

    function start() {
      grid = Array(N * N).fill(null);
      score = 0;
      combo = 0;
      over.classList.remove("show");
      render();
      deal();
    }

    restart.addEventListener("click", start);
    // the tray sizes its pieces from the board, so deal once it's laid out
    requestAnimationFrame(start);
    return root;
  };
})();
