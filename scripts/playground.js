/* ---------------------------------------------------------------- *
 * Playground (playground/index.html)
 *
 * Every project as one row of its pictures, all the rows on the screen at
 * once. Scrolling, a swipe or the arrow keys slide every row to the left
 * (back the other way to the right), each row at a pace of its own so they
 * drift against one another. A row never runs out: its pictures are laid out
 * again and again end to end, and the row is moved round by exactly one pass
 * whenever it has gone a whole pass, which can't be seen because the next
 * pass is the same. So scrolling on and on brings each project back round to
 * its start through the scroll itself, never with a jump.
 *
 * A row's title shows only while it passes through the middle of the
 * screen: it slides out of the pictures beside it into place, and back into
 * them as it moves on (the movement is in playground.css), so only a few
 * titles are up at a time.
 *
 * Pointing at a row grows it, and its neighbours a little, while the rows
 * further off give up the room, so all of them still fill the screen
 * (as on mariavasilyeva.com/work). Only a project counts: the pointer has to
 * be on its pictures or its title, not on the black between passes, where
 * the rows settle back. The row grows out from where the pointer came onto
 * it, slowly, and beside the pointer its title, what kind of project it was
 * and the role in it appear. All of it is moved with transforms alone, so
 * the pictures are never laid out again as it happens; the lines between
 * the rows are drawn separately so they stay a hair thin. On a touch screen,
 * with nothing to point with, the rows simply stay as they are.
 *
 * Everything follows a moment behind and eases into place, like the gallery
 * on the home page. Clips play while they are on screen. A click on a
 * project opens it; a click on the black between them, or a swipe that moved
 * the rows, doesn't.
 *
 * Without this script each row is a strip that scrolls sideways on its own.
 * ---------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  const playground = document.querySelector('.playground');
  if (!playground) return;
  const rows = [...playground.querySelectorAll('.pg-row')];
  if (!rows.length) return;
  const N = rows.length;
  playground.style.setProperty('--rows', N);
  const root = document.documentElement;

  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const LENS = pointer && !still;  // rows grow under the pointer
  const EASE = still ? 60 : 6;     // how quickly the rows catch up with the scroll
  const LENS_EASE = 3.2;           // and with the pointer (lower is slower)
  const TIP_EASE = 8;              // how closely the details follow the pointer
  const WHEEL = 1;                 // px the rows move per px of wheel
  const SWIPE = 1.6;               // and per px of swipe
  const KEY = 220;                 // and per press of an arrow key
  const GROW = 2.5;                // how many times its height the pointed row grows
  // each row's own pace, so they drift against one another
  const PACE = [1, 0.84, 1.16, 0.92, 1.08, 0.88, 1.2, 0.96];
  // where a title shows: while the middle of its label is within this span
  // of the screen's width (a wider one on a phone, where labels are wide for
  // the screen), with a little give at the edges so it doesn't flicker
  // each row has its own span, a third of the screen wide, at a different
  // place for each row, so the titles come up spread out and a few at a time
  // rather than all together in one column (on a phone, one wide span for
  // all, the labels being wide for the screen)
  const narrow = window.matchMedia('(max-width: 768px)').matches;
  const zoneFor = (i) => {
    if (narrow) return [0.05, 1];
    const middle = 0.2 + ((i * 0.618) % 1) * 0.6;
    return [middle - 0.16, middle + 0.16];
  };
  const GIVE = 24;

  // a little give, the same every visit: a number from 0 to 1
  const rand = (n) => {
    const v = Math.sin(n * 12.9898 + 4.1414) * 43758.5453;
    return v - Math.floor(v);
  };

  // each row's height, in rows: the pointed one grown, all the others as
  // they are (between two rows, as the pointer moves on, the growth passes
  // from one to the next)
  const sizesFor = (focus, amount) => rows.map((_, i) => 1 + amount * (GROW - 1) * Math.max(0, 1 - Math.abs(i - focus)));
  // rows are never drawn narrower than they are (a squeezed row is cut down,
  // not shrunk), so a strip of one row's width always fills it
  const SMALLEST = 1;
  const THINNEST = 0.3;    // how thin, in rows, a squeezed row can get

  // fit the rows between the caps at the top and bottom: the pointed row
  // grows evenly up and down from its middle, the rows beside it keep their
  // size, and the room it needs is taken from the rows furthest from it
  // first, each squeezed down to a thin strip before the next one gives
  const fit = (grownSizes) => {
    const out = grownSizes.slice();
    let up = 0;
    for (let i = 0; i < N; i++) {
      const above = focus + 0.5 - i;   // how much of row i lies above the middle
      up += (out[i] - 1) * Math.max(0, Math.min(1, above));
    }
    const extra = out.reduce((a, b) => a + b, 0) - N;
    let down = extra - up;
    const squeeze = (order, need) => {
      for (const i of order) {
        if (need <= 0) break;
        if (out[i] > 1) continue;
        const take = Math.min(need, out[i] - THINNEST);
        out[i] -= take;
        need -= take;
      }
      return need;
    };
    const top = rows.map((_, i) => i).filter((i) => i < focus);
    const bottom = rows.map((_, i) => i).filter((i) => i > focus).reverse();
    // what one side can't give, the other side gives instead
    up = squeeze(top, up);
    down = squeeze(bottom, down + up);
    squeeze(top, down);
    return out;
  };

  // each picture keeps its own shape at the row's height
  playground.querySelectorAll('.pg-set > img, .pg-set > video').forEach((el) => {
    const w = +el.getAttribute('width');
    const h = +el.getAttribute('height');
    if (w && h) el.style.aspectRatio = `${w} / ${h}`;
  });

  // each row becomes a track of passes; the first pass is the real one, the
  // copies after it are hidden from screen readers (they hold nothing the
  // keyboard can reach, and the pointer has to be able to land on them)
  const lanes = rows.map((row, i) => {
    const set = row.querySelector('.pg-set');
    const track = document.createElement('div');
    track.className = 'pg-track';
    row.insertBefore(track, set);
    track.append(set);
    return { row, track, set, pace: PACE[i % PACE.length], start: rand(i + 1), width: 0, lead: 0, labels: [] };
  });

  // the lines between the rows, drawn apart from them
  const rowsBox = playground.querySelector('.pg-rows');
  const lines = document.createElement('div');
  lines.className = 'pg-lines';
  lines.setAttribute('aria-hidden', 'true');
  for (let i = 0; i <= N; i++) lines.append(document.createElement('i'));
  rowsBox.append(lines);

  // the details beside the pointer
  const tip = document.createElement('div');
  tip.className = 'pg-tip';
  tip.setAttribute('aria-hidden', 'true');
  tip.innerHTML = '<span class="pg-tip-title"></span><span class="pg-tip-line"></span><span class="pg-tip-line"></span>';
  const [tipTitle, tipContext, tipRole] = tip.children;
  document.body.append(tip);

  // clips play while they are on screen and rest when they leave it
  const sight = 'IntersectionObserver' in window && !still
    ? new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.play().catch(() => {});
        else e.target.pause();
      });
    })
    : null;
  const watch = (video, first) => {
    video.preload = first ? 'auto' : 'metadata';
    sight?.observe(video);
  };
  playground.querySelectorAll('video').forEach((v) => watch(v, true));

  // the row's resting height, and enough passes in each row to fill it at
  // its smallest, with room before the first for a shrinking row to show
  let rest = 0;
  const lay = () => {
    rest = rows[0].offsetHeight;
    const width = rowsBox.clientWidth;
    lanes.forEach((lane) => {
      lane.width = lane.set.getBoundingClientRect().width;
      if (!lane.width) return;
      lane.lead = LENS ? Math.ceil((width * (1 / SMALLEST - 1)) / lane.width) * lane.width : 0;
      const need = Math.ceil((lane.lead + lane.width + width / SMALLEST) / lane.width) + 1;
      const passes = lane.track.children;
      while (passes.length < need) {
        const copy = lane.set.cloneNode(true);
        copy.setAttribute('aria-hidden', 'true');
        copy.querySelectorAll('video').forEach((v) => { v.muted = true; watch(v, false); });
        lane.track.append(copy);
      }
      while (passes.length > need) passes[passes.length - 1].remove();
      // where the label sits in a pass, and each pass's label
      const label = lane.set.querySelector('.pg-label');
      lane.labelAt = label.offsetLeft;
      lane.labelWidth = label.offsetWidth;
      lane.labels = [...lane.track.querySelectorAll('.pg-label')].map((el) => {
        el.classList.remove('is-shown');
        return { el, shown: false };
      });
    });
  };

  root.classList.add('pg-still');
  playground.classList.add('is-live');

  // where the scroll has got to, and where the rows are on their way to it
  let target = 0;
  let shown = 0;
  // the pointed row, and the eased version the rows are drawn from
  const aim = { inside: false, on: false, row: 0, x: 0, px: 0, py: 0 };
  let focus = 0;
  let amount = 0;
  let originX = 0;
  let tipX = 0;
  let tipY = 0;
  let sizes = rows.map(() => 1);
  let then = null;
  let queued = false;

  const draw = () => {
    const width = rowsBox.clientWidth;
    const share = LENS ? fit(sizesFor(focus, amount)) : sizes;
    sizes = share;
    let y = 0;
    share.forEach((s, i) => {
      const lane = lanes[i];
      lane.row.style.transform = LENS
        ? `translate3d(0, ${((y - i) * rest).toFixed(2)}px, 0) scale(1, ${s.toFixed(4)})`
        : '';
      lines.children[i].style.transform = `translate3d(0, ${(y * rest).toFixed(2)}px, 0)`;
      y += s;
      if (!lane.width) return;
      const at = lane.start * lane.width + shown * lane.pace;
      // round by whole passes, so the track only ever moves within one pass
      const x = ((at % lane.width) + lane.width) % lane.width + lane.lead;
      // a grown row grows about the point the pointer came in at; a squeezed
      // one keeps its pictures their size and shows the middle of them
      lane.track.style.transform = s >= 1
        ? `translate3d(${originX.toFixed(2)}px, 0, 0) scale(${s.toFixed(4)}, 1) translate3d(${(-originX - x).toFixed(2)}px, 0, 0)`
        : `translate3d(0, ${(-((1 - s) * rest) / (2 * s)).toFixed(2)}px, 0) scale(1, ${(1 / s).toFixed(4)}) translate3d(${(-x).toFixed(2)}px, 0, 0)`;
      // each pass's title, up while its label is in the middle span
      const zone = zoneFor(i);
      const from = zone[0] * width;
      const to = zone[1] * width;
      lane.labels.forEach((label, k) => {
        const middle = originX + Math.max(1, s) * (k * lane.width - x + lane.labelAt + lane.labelWidth / 2 - originX);
        const give = label.shown ? GIVE : 0;
        const on = middle >= from - give && middle <= to + give;
        if (on !== label.shown) {
          label.shown = on;
          label.el.classList.toggle('is-shown', on);
        }
      });
    });
    lines.children[N].style.transform = `translate3d(0, ${(y * rest).toFixed(2)}px, 0)`;
    // the details, a little below and to the right of the pointer, always;
    // near the right edge they run on past it and are cut off there, which
    // shows they carry on (as on mariavasilyeva.com/work)
    tip.style.transform = `translate3d(${(tipX + 24).toFixed(1)}px, ${(tipY + 20).toFixed(1)}px, 0)`;
  };

  const ease = (from, to, rate, dt) => from + (to - from) * (1 - Math.exp(-rate * dt));
  const frame = (time) => {
    queued = false;
    const dt = then === null ? 1 / 60 : Math.min(0.1, (time - then) / 1000);
    then = time;
    shown = ease(shown, target, EASE, dt);
    if (Math.abs(target - shown) < 0.1) shown = target;
    focus = ease(focus, aim.row, LENS_EASE, dt);
    if (Math.abs(aim.row - focus) < 0.001) focus = aim.row;
    amount = ease(amount, aim.on ? 1 : 0, LENS_EASE, dt);
    if (Math.abs((aim.on ? 1 : 0) - amount) < 0.001) amount = aim.on ? 1 : 0;
    // while the rows shift under a still pointer, keep up with what it is on
    if (aim.inside) look();
    originX = ease(originX, aim.x, LENS_EASE, dt);
    if (Math.abs(aim.x - originX) < 0.1) originX = aim.x;
    tipX = ease(tipX, aim.px, TIP_EASE, dt);
    tipY = ease(tipY, aim.py, TIP_EASE, dt);
    if (Math.abs(aim.px - tipX) + Math.abs(aim.py - tipY) < 0.2) { tipX = aim.px; tipY = aim.py; }
    draw();
    // while a row grows or shrinks it is moved as it was drawn, which keeps
    // the movement smooth; once it settles it is let go, and the browser draws
    // it again sharp at its new size
    const growing = focus !== aim.row || amount !== (aim.on ? 1 : 0);
    if (growing !== rowsBox.classList.contains('is-growing')) rowsBox.classList.toggle('is-growing', growing);
    const moving = shown !== target || focus !== aim.row || amount !== (aim.on ? 1 : 0)
      || originX !== aim.x || tipX !== aim.px || tipY !== aim.py;
    if (moving) queue();
    else then = null;
  };
  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(frame);
  };
  const push = (px) => {
    target += px;
    queue();
  };

  let pointed = -1;
  const point = (row) => {
    if (row === pointed) return;
    if (pointed >= 0) rows[pointed].classList.remove('is-focus');
    pointed = row;
    // while a project is pointed at, the other rows' titles step aside
    rowsBox.classList.toggle('has-focus', row >= 0);
    if (row < 0) {
      tip.classList.remove('is-on');
      return;
    }
    rows[row].classList.add('is-focus');
    tipTitle.innerHTML = rows[row].querySelector('.pg-title').innerHTML;
    tipContext.textContent = rows[row].dataset.context || '';
    tipRole.textContent = rows[row].dataset.role ? `Role in project is ${rows[row].dataset.role}` : '';
    // moving from one project to another, the bars close and wipe open again
    // with the new details
    if (tip.classList.contains('is-on')) {
      tip.classList.remove('is-on');
      tip.classList.add('is-reset');
      void tip.offsetWidth;
      tip.classList.remove('is-reset');
    }
    tip.classList.add('is-on');
  };

  // what counts as a project: its pictures and clips, and its title while
  // the title is showing (a hidden title's place looks like the black)
  const PROJECT = '.pg-set > img, .pg-set > video, .pg-label.is-shown';
  // what the pointer is on, asked of the page itself so it is always what a
  // click would land on: a project (its pictures or its title) in some row,
  // or nothing, over the black between passes
  const look = () => {
    const el = aim.inside ? document.elementFromPoint(aim.px, aim.py) : null;
    const row = el?.closest(PROJECT) ? el.closest('.pg-row') : null;
    const i = row ? rows.indexOf(row) : -1;
    if (i < 0) {
      if (aim.on) {
        aim.on = false;
        point(-1);
      }
      return;
    }
    if (!aim.on) {
      // onto a project: start right where the pointer is
      tipX = aim.px;
      tipY = aim.py;
      if (amount === 0) {
        originX = aim.px;
        focus = i;
      }
    }
    // a row grows out from where the pointer came onto it
    if (!aim.on || i !== aim.row) aim.x = aim.px;
    aim.row = i;
    aim.on = true;
    point(i);
  };

  if (pointer) {
    rowsBox.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || root.classList.contains('menu-open')) return;
      aim.px = e.clientX;
      aim.py = e.clientY;
      aim.inside = true;
      look();
      queue();
    });
    rowsBox.addEventListener('pointerleave', () => {
      aim.inside = false;
      look();
      queue();
    });
  }

  // the wheel, either way it turns
  window.addEventListener('wheel', (e) => {
    if (e.ctrlKey) return;
    if (root.classList.contains('menu-open')) return;
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
    push((e.deltaY + e.deltaX) * unit * WHEEL);
  }, { passive: true });

  // a swipe, up or across; one that moved the rows isn't a click
  let touch = null;
  let moved = 0;
  rowsBox.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    touch = { x: t.clientX, y: t.clientY };
    moved = 0;
  }, { passive: true });
  rowsBox.addEventListener('touchmove', (e) => {
    if (!touch) return;
    const t = e.touches[0];
    const dx = touch.x - t.clientX;
    const dy = touch.y - t.clientY;
    touch = { x: t.clientX, y: t.clientY };
    const d = Math.abs(dx) > Math.abs(dy) ? dx : dy;
    moved += Math.abs(d);
    push(d * SWIPE);
  }, { passive: true });
  rowsBox.addEventListener('touchend', () => { touch = null; }, { passive: true });
  rowsBox.addEventListener('click', (e) => {
    if (moved > 8) {
      e.preventDefault();
      moved = 0;
      return;
    }
    // only a project opens its page: a click on the black between passes
    // does nothing (Enter on a focused row, which clicks it from the
    // keyboard, still opens it)
    if (e.detail > 0 && !e.target.closest(PROJECT)) e.preventDefault();
  }, true);

  // the arrow keys and page keys
  document.addEventListener('keydown', (e) => {
    if (root.classList.contains('menu-open')) return;
    const step = { ArrowRight: KEY, ArrowDown: KEY, PageDown: KEY * 3, ' ': KEY * 3,
      ArrowLeft: -KEY, ArrowUp: -KEY, PageUp: -KEY * 3 }[e.key];
    if (!step) return;
    e.preventDefault();
    push(e.shiftKey && e.key === ' ' ? -step : step);
  });

  const settle = () => {
    lay();
    draw();
  };
  window.addEventListener('resize', settle, { passive: true });
  window.addEventListener('load', settle);
  settle();
});
