// // For GIF restart when hover
// document.querySelectorAll('.project-card').forEach(card => {
//     const gif = card.querySelector('.hover-gif');
  
//     card.addEventListener('mouseenter', () => {
//       const src = gif.getAttribute('src');
//       gif.setAttribute('src', '');
//       gif.setAttribute('src', src);
//     });
//   });
  
//   // For VIDEO restart when hover + to play for project 2
//   document.querySelectorAll('.project-card').forEach(card => {
//     const video = card.querySelector('.hover-video');
//     if (video) {
//       card.addEventListener('mouseenter', () => {
//         video.currentTime = 0;
//         video.play();
//       });
  
//       card.addEventListener('mouseleave', () => {
//         video.pause();
//       });
//     }
//   });
  
  document.querySelectorAll('.project-card').forEach(card => {
    const video = card.querySelector('.hover-video');
  
    if (video) {
      card.addEventListener('mouseenter', () => {
        video.currentTime = 0;  // restart
        video.play();
      });
  
      card.addEventListener('mouseleave', () => {
        video.pause(); // optional
      });
    }
  
    const gif = card.querySelector('.hover-gif');
    if (gif) {
      card.addEventListener('mouseenter', () => {
        const src = gif.getAttribute('src');
        gif.setAttribute('src', '');
        gif.setAttribute('src', src);
      });
    }
  });
  
// Count-up animation for the About page stat numbers
document.addEventListener('DOMContentLoaded', () => {
  const counters = document.querySelectorAll('.stat-number');
  if (!counters.length) return;

  const finalText = el => el.dataset.target + (el.dataset.suffix || '');

  // Respect the visitor's motion preference: show the final numbers, no animation.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    counters.forEach(el => { el.textContent = finalText(el); });
    return;
  }

  const countUp = el => {
    const target = Number(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    const duration = 1400;
    const start = performance.now();

    const step = now => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out
      el.textContent = Math.round(target * eased) + suffix;
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = finalText(el);
    };

    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      countUp(entry.target);
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.4 });

  counters.forEach(el => {
    el.textContent = '0' + (el.dataset.suffix || '');
    observer.observe(el);
  });
});

// Typing effect for the hero heading: types a phrase, holds, deletes, moves to the next
document.addEventListener('DOMContentLoaded', () => {
  const line = document.querySelector('.typing-line');
  if (!line) return;

  let phrases;
  try {
    phrases = JSON.parse(line.dataset.phrases);
  } catch (e) {
    return; // bad data-phrases: leave the plain fallback text in place
  }
  if (!Array.isArray(phrases) || !phrases.length) return;

  const out = line.querySelector('.typing-text');

  // No animation for visitors who ask for reduced motion - just show the first phrase.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    line.classList.add('is-typing');
    out.textContent = phrases[0];
    return;
  }

  const TYPE_SPEED = 90;    // ms per character while typing
  const DELETE_SPEED = 45;  // ms per character while deleting
  const HOLD = 1600;        // ms to sit on a finished phrase
  const PAUSE = 400;        // ms of empty line before the next phrase

  line.classList.add('is-typing');

  let index = 0;
  let chars = 0;
  let deleting = false;

  const tick = () => {
    const phrase = phrases[index];
    chars += deleting ? -1 : 1;
    out.textContent = phrase.slice(0, chars);

    let delay = deleting ? DELETE_SPEED : TYPE_SPEED;

    if (!deleting && chars === phrase.length) {
      deleting = true;
      delay = HOLD;
    } else if (deleting && chars === 0) {
      deleting = false;
      index = (index + 1) % phrases.length;
      delay = PAUSE;
    }

    setTimeout(tick, delay);
  };

  tick();
});

// Project cards: loop their video automatically, but only while the card is on screen,
// so a visitor never downloads six videos at once.
document.addEventListener('DOMContentLoaded', () => {
  const videos = document.querySelectorAll('video.auto-video');
  if (!videos.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const video = entry.target;
      if (entry.isIntersecting) {
        video.play().catch(() => {}); // ignore autoplay rejections
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.25 });

  videos.forEach(video => observer.observe(video));
});

// Fade the header's border in once the page scrolls away from the top
document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('header.desktop-header');
  if (!header) return;

  const THRESHOLD = 24; // px of scroll before the border shows

  const sync = () => {
    header.classList.toggle('scrolled', window.scrollY > THRESHOLD);
  };

  sync(); // in case the page loads part-way down
  window.addEventListener('scroll', sync, { passive: true });
});

// Ring-and-dot cursor: the dot tracks the pointer exactly, the ring trails behind it
document.addEventListener('DOMContentLoaded', () => {
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!finePointer) return;

  const dot = document.createElement('div');
  dot.className = 'cursor-dot';
  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  document.body.append(dot, ring);

  const CHASE = 0.18; // how quickly the ring catches up (1 = instant)
  let pointerX = 0, pointerY = 0;
  let ringX = 0, ringY = 0;
  let seen = false;

  document.addEventListener('mousemove', e => {
    pointerX = e.clientX;
    pointerY = e.clientY;

    if (!seen) { // first move: drop both in place before showing them
      seen = true;
      ringX = pointerX;
      ringY = pointerY;
      dot.classList.add('is-visible');
      ring.classList.add('is-visible');
    }

    dot.style.transform = `translate(${pointerX}px, ${pointerY}px)`;
  });

  // hide when the pointer leaves the window, e.g. onto the browser chrome
  document.addEventListener('mouseleave', () => {
    dot.classList.remove('is-visible');
    ring.classList.remove('is-visible');
  });
  document.addEventListener('mouseenter', () => {
    if (seen) {
      dot.classList.add('is-visible');
      ring.classList.add('is-visible');
    }
  });

  const follow = () => {
    ringX += (pointerX - ringX) * CHASE;
    ringY += (pointerY - ringY) * CHASE;
    ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
    requestAnimationFrame(follow);
  };
  requestAnimationFrame(follow);

  // grow the ring over anything clickable
  const CLICKABLE = 'a, button, label, input, textarea, .project-card, .faq-item label';
  document.addEventListener('mouseover', e => {
    if (e.target.closest(CLICKABLE)) ring.classList.add('is-hovering');
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest(CLICKABLE)) ring.classList.remove('is-hovering');
  });
});

// Eased wheel scrolling - snappy, not a slow glide
document.addEventListener('DOMContentLoaded', () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const EASE = 0.18;  // fraction of the remaining distance covered each frame
  const STEP = 1;     // wheel delta multiplier

  let target = window.scrollY;
  let animating = false;

  const maxScroll = () =>
    Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

  const run = () => {
    const distance = target - window.scrollY;

    // 'instant' matters: html { scroll-behavior: smooth } would otherwise turn each
    // of these into its own native animation and the page would barely move
    if (Math.abs(distance) < 0.5) { // close enough - hand control back
      window.scrollTo({ top: target, behavior: 'instant' });
      animating = false;
      return;
    }

    window.scrollTo({ top: window.scrollY + distance * EASE, behavior: 'instant' });
    requestAnimationFrame(run);
  };

  window.addEventListener('wheel', e => {
    if (e.ctrlKey) return; // pinch-zoom
    // the mobile sidebar scrolls itself
    if (e.target instanceof Element && e.target.closest('.links-container')) return;

    e.preventDefault();
    target = Math.min(Math.max(target + e.deltaY * STEP, 0), maxScroll());

    if (!animating) {
      animating = true;
      requestAnimationFrame(run);
    }
  }, { passive: false });

  // keep in step with scrolling we don't drive (keyboard, scrollbar, anchor links)
  window.addEventListener('scroll', () => {
    if (!animating) target = window.scrollY;
  }, { passive: true });

  // Stop easing the instant a press starts. A click only fires when mousedown and
  // mouseup land on the same element, so a page still gliding under the pointer
  // can swallow the click on whatever the user was aiming at.
  window.addEventListener('pointerdown', () => {
    if (!animating) return;
    animating = false;
    target = window.scrollY;
  }, { passive: true });
});

// Case-study contents tracker: highlights whichever section is currently in view
document.addEventListener('DOMContentLoaded', () => {
  const links = document.querySelectorAll('.case-contents-nav a');
  if (!links.length) return;

  const sections = [...links]
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);
  if (!sections.length) return;

  const marker = document.querySelector('.case-contents-marker');
  const nav = document.querySelector('.case-contents-nav');

  // slide the marker onto whichever link is active - vertical on desktop, and an
  // underline once the rail turns horizontal on narrow screens
  const moveMarker = link => {
    if (!marker || !nav) return;

    if (getComputedStyle(nav).flexDirection === 'row') {
      marker.style.height = '';
      marker.style.width = link.offsetWidth + 'px';
      marker.style.translate = link.offsetLeft + 'px 0';
    } else {
      marker.style.width = '';
      marker.style.height = link.offsetHeight + 'px';
      marker.style.translate = '0 ' + link.offsetTop + 'px';
    }
  };

  const setActive = id => {
    links.forEach(link => {
      const active = link.getAttribute('href') === '#' + id;
      link.classList.toggle('is-active', active);
      if (active) moveMarker(link);
    });
  };

  // handle the jump here rather than leaving it to the browser, so the eased
  // wheel scrolling doesn't fight the anchor
  links.forEach(link => {
    link.addEventListener('click', e => {
      const section = document.querySelector(link.getAttribute('href'));
      if (!section) return;

      e.preventDefault();
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      section.scrollIntoView({ behavior: reduce ? 'instant' : 'smooth', block: 'start' });
      history.replaceState(null, '', link.getAttribute('href'));
    });
  });

  // Pick whichever section's heading last crossed the top quarter of the screen.
  // Simple scroll math beats an observer here - sections are taller than the
  // viewport, so more than one is visible at a time.
  const line = () => window.innerHeight * 0.28;

  const sync = () => {
    let current = sections[0];

    for (const section of sections) {
      if (section.getBoundingClientRect().top <= line()) current = section;
    }

    // at the very bottom the last section may never reach the line
    const atBottom =
      window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
    if (atBottom) current = sections[sections.length - 1];

    setActive(current.id);
  };

  sync();
  window.addEventListener('scroll', sync, { passive: true });
  window.addEventListener('resize', sync, { passive: true });
});

// Floating case-study CTA: slides up from the bottom once the hero is behind you
document.addEventListener('DOMContentLoaded', () => {
  const cta = document.querySelector('.case-float-cta');
  if (!cta) return;

  const SHOW_AFTER = 260; // px of scroll before it appears

  const sync = () => {
    cta.classList.toggle('is-visible', window.scrollY > SHOW_AFTER);
  };

  sync();
  window.addEventListener('scroll', sync, { passive: true });
});

// Ease the resume entries open and shut. <details> toggles instantly on its own,
// so take over the click and animate the panel's height either way.
document.addEventListener('DOMContentLoaded', () => {
  const entries = document.querySelectorAll('.resume-entry');
  if (!entries.length) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  const OPEN_MS = 320;
  const CLOSE_MS = 240;
  const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';   // quick start, soft landing
  const EASE_IN = 'cubic-bezier(0.4, 0, 0.9, 0.6)';

  entries.forEach(entry => {
    const summary = entry.querySelector('summary');
    const panel = entry.querySelector('.resume-bullets');
    if (!summary || !panel) return;

    let animation = null;

    summary.addEventListener('click', event => {
      event.preventDefault();

      if (reduced.matches) {          // no motion: just flip it
        entry.open = !entry.open;
        return;
      }

      if (animation) animation.cancel();

      if (!entry.open) {
        entry.open = true;            // must be open before the panel can be measured
        const height = panel.offsetHeight;

        animation = panel.animate(
          { height: ['0px', height + 'px'], opacity: [0, 1] },
          { duration: OPEN_MS, easing: EASE_OUT }
        );
      } else {
        const height = panel.offsetHeight;

        animation = panel.animate(
          { height: [height + 'px', '0px'], opacity: [1, 0] },
          { duration: CLOSE_MS, easing: EASE_IN }
        );
        animation.onfinish = () => { entry.open = false; };
      }

      animation.finished
        .catch(() => {})              // cancelled by a fast second click
        .finally(() => { animation = null; });
    });
  });
});

// "Off the clock" photo pile: scatter the photos at random, keep reshuffling one
// card at a time so it plays by itself, and let anyone drag them around.
document.addEventListener('DOMContentLoaded', () => {
  const pile = document.querySelector('.photo-pile');
  if (!pile) return;

  const cards = [...pile.querySelectorAll('.photo-card')];   // grows as more are summoned
  if (!cards.length) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const rand = (min, max) => min + Math.random() * (max - min);

  pile.classList.add('is-scattered');

  let top = cards.length;   // running z-index, always climbing

  // A random resting spot. Horizontally the card stays inside the box; vertically
  // it may hang past either edge, so photos lie over the heading and the sections
  // above and below.
  // Rather than placing each card independently - which clumps badly - the pile is
  // split into a loose grid, one card per cell, jittered inside its cell. The
  // result still looks scattered but nothing ends up buried.
  const JITTER = 0.42;   // fraction of the spare room in a cell to wander by
  const BLEED_X = 60;    // px a card may hang past the left/right of the column
  const BLEED_Y = 90;    // px it may hang past the top/bottom

  let layout = { cols: 1, rows: 1, cellW: 0, cellH: 0 };

  const measure = () => {
    const box = pile.getBoundingClientRect();
    const w = cards[0].offsetWidth;
    const h = cards[0].offsetHeight;

    // roughly square cells for the pile's proportions, but never narrower
    // than a card's width or the grid stops helping
    let cols = Math.round(Math.sqrt(cards.length * (box.width / box.height))) || 1;
    cols = Math.max(1, Math.min(cards.length, cols));
    while (cols > 1 && box.width / cols < w * 0.72) cols--;

    const rows = Math.ceil(cards.length / cols);
    layout = {
      cols, rows, w, h,
      cellW: box.width / cols,
      cellH: box.height / rows,
    };
  };

  const place = (card, index) => {
    const { cols, cellW, cellH, w, h } = layout;
    const col = index % cols;
    const row = Math.floor(index / cols);

    // centre of the cell, then wander
    const slackX = Math.max(cellW - w, 0) + w * 0.35;
    const slackY = Math.max(cellH - h, 0) + h * 0.3;

    const x = col * cellW + (cellW - w) / 2 + rand(-slackX, slackX) * JITTER;
    const y = row * cellH + (cellH - h) / 2 + rand(-slackY, slackY) * JITTER;

    card.style.setProperty('--x', x + 'px');
    card.style.setProperty('--y', y + 'px');
    card.style.setProperty('--r', rand(-11, 11).toFixed(1) + 'deg');

    // its own drift rhythm, so the pile never pulses in unison
    card.style.setProperty('--float-dur', rand(5, 9).toFixed(2) + 's');
    card.style.setProperty('--float-delay', (-rand(0, 6)).toFixed(2) + 's');

    card.dataset.x = x;
    card.dataset.y = y;
  };

  const raise = card => { card.style.zIndex = ++top; };

  const scatter = () => {
    measure();
    const slots = cards.map((_, i) => i);
    for (let i = slots.length - 1; i > 0; i--) {      // shuffle the cell order
      const j = Math.floor(Math.random() * (i + 1));
      [slots[i], slots[j]] = [slots[j], slots[i]];
    }
    cards.forEach((card, i) => { place(card, slots[i]); raise(card); });
  };

  // Scatter straight away - the card height comes from a CSS aspect-ratio, so it
  // measures correctly before the photos load. The extra frame is only a safety
  // net for fonts/layout settling; on its own it would leave the pile stacked in
  // a background tab, where requestAnimationFrame never fires.
  scatter();
  requestAnimationFrame(scatter);

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(scatter, 250);
  });

  // ---- drag, then throw ----
  //
  // While dragging we remember the last couple of pointer samples. On release
  // that becomes a velocity, and the card flies off under gravity, bouncing off
  // the edges of the pile until friction settles it.

  // No gravity - the photos drift like something in orbit, coasting until the
  // edges of the pile turn them back and drag eventually stills them.
  const BOUNCE = 0.82;       // energy kept when it glances off an edge
  const DRAG = 0.992;        // speed kept per frame
  const SPIN_DRAG = 0.99;
  const REST_SPEED = 14;     // px/s below which we call it settled
  const MAX_THROW = 1400;    // px/s cap so a flick can't launch it into orbit

  const bounds = () => {
    const box = pile.getBoundingClientRect();
    return {
      minX: -BLEED_X,
      maxX: Math.max(0, box.width - layout.w) + BLEED_X,
      minY: -BLEED_Y,
      maxY: Math.max(0, box.height - layout.h) + BLEED_Y,
    };
  };

  const clampSpeed = v => Math.max(-MAX_THROW, Math.min(MAX_THROW, v));

  const driftCard = (card, vx, vy, spin) => {
    if (reduced.matches) return;

    cancelAnimationFrame(card._physics);

    let x = parseFloat(card.dataset.x) || 0;
    let y = parseFloat(card.dataset.y) || 0;
    let r = parseFloat(card.style.getPropertyValue('--r')) || 0;
    let last = performance.now();

    card.classList.add('is-flying');

    const step = now => {
      const dt = Math.min((now - last) / 1000, 0.032);  // clamp after a stall
      last = now;

      vx *= DRAG;
      vy *= DRAG;
      spin *= SPIN_DRAG;

      x += vx * dt;
      y += vy * dt;
      r += spin * dt;

      const b = bounds();

      // glance off each wall, keeping most of the momentum
      if (x < b.minX) { x = b.minX; vx = Math.abs(vx) * BOUNCE; spin = -spin * BOUNCE; }
      if (x > b.maxX) { x = b.maxX; vx = -Math.abs(vx) * BOUNCE; spin = -spin * BOUNCE; }
      if (y < b.minY) { y = b.minY; vy = Math.abs(vy) * BOUNCE; spin = -spin * BOUNCE; }
      if (y > b.maxY) { y = b.maxY; vy = -Math.abs(vy) * BOUNCE; spin = -spin * BOUNCE; }

      card.style.setProperty('--x', x + 'px');
      card.style.setProperty('--y', y + 'px');
      card.style.setProperty('--r', r.toFixed(1) + 'deg');
      card.dataset.x = x;
      card.dataset.y = y;

      if (Math.hypot(vx, vy) < REST_SPEED) {
        card.classList.remove('is-flying');
        card._physics = null;
        return;
      }

      card._physics = requestAnimationFrame(step);
    };

    card._physics = requestAnimationFrame(step);
  };

  const wire = card => {
    card.addEventListener('pointerdown', event => {
      if (event.button !== 0 && event.pointerType === 'mouse') return;
      // dragging a photo would fight scrolling on a phone - leave touches alone
      if (event.pointerType === 'touch') return;

      cancelAnimationFrame(card._physics);
      card._physics = null;
      card.classList.remove('is-flying');

      const startX = event.clientX;
      const startY = event.clientY;
      const originX = parseFloat(card.dataset.x) || 0;
      const originY = parseFloat(card.dataset.y) || 0;

      // rolling sample of recent pointer positions, for the release velocity
      let samples = [{ x: event.clientX, y: event.clientY, t: performance.now() }];

      raise(card);
      card.classList.add('is-dragging');
      card.setPointerCapture(event.pointerId);

      const move = e => {
        const x = originX + (e.clientX - startX);
        const y = originY + (e.clientY - startY);
        card.style.setProperty('--x', x + 'px');
        card.style.setProperty('--y', y + 'px');
        card.dataset.x = x;
        card.dataset.y = y;

        samples.push({ x: e.clientX, y: e.clientY, t: performance.now() });
        if (samples.length > 5) samples.shift();
      };

      const up = () => {
        card.classList.remove('is-dragging');
        card.removeEventListener('pointermove', move);
        card.removeEventListener('pointerup', up);
        card.removeEventListener('pointercancel', up);

        const first = samples[0];
        const last = samples[samples.length - 1];
        const dt = (last.t - first.t) / 1000;

        // a slow drag shouldn't fling; only a real flick sets it drifting.
        // Anything gentler simply stays where it was let go.
        if (dt > 0.005 && samples.length > 1) {
          const vx = clampSpeed((last.x - first.x) / dt);
          const vy = clampSpeed((last.y - first.y) / dt);
          if (Math.hypot(vx, vy) > 60) {
            driftCard(card, vx, vy, vx * 0.06);
          }
        }
      };

      card.addEventListener('pointermove', move);
      card.addEventListener('pointerup', up);
      card.addEventListener('pointercancel', up);
    });
  };

  cards.forEach(wire);

  // ---- the + button: fling one more photo in from off screen ----
  //
  // Once the pool is empty it turns into a reset: everything that was added
  // slides back off the edges and the original dozen re-scatter.

  const button = document.querySelector('.photo-more');
  const original = [...cards];
  const startingPool = (() => {
    try { return JSON.parse(pile.dataset.pool || '[]'); } catch (e) { return []; }
  })();
  let pool = [...startingPool];

  // a point beyond one of the four edges, in pile coordinates
  const offscreenPoint = (toX, toY) => {
    const box = pile.getBoundingClientRect();
    const edge = Math.floor(Math.random() * 4);
    const far = 1.4;
    if (edge === 0) return [-box.left - layout.w * far, toY];
    if (edge === 1) return [window.innerWidth - box.left + layout.w * far, toY];
    if (edge === 2) return [toX, -box.top - layout.h * far];
    return [toX, window.innerHeight - box.top + layout.h * far];
  };

  const setMode = () => {
    const done = pool.length === 0;
    button.classList.toggle('is-reset', done);
    button.setAttribute('aria-label', done ? 'Reset the photos' : 'Add another photo');
  };

  const addPhoto = () => {
    const file = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    if (!file) return;

    const card = document.createElement('figure');
    card.className = 'photo-card';
    const img = document.createElement('img');
    img.src = 'assets/images/about-photos/web/' + file;
    img.alt = '';
    img.draggable = false;
    card.append(img);
    card.dataset.file = file;
    pile.append(card);

    cards.push(card);
    wire(card);
    raise(card);

    measure();
    // a random cell, not the last one - the last cell is always the bottom-right
    // of the grid, which is why new photos were all landing along the bottom
    place(card, Math.floor(Math.random() * layout.cols * layout.rows));
    const toX = parseFloat(card.dataset.x);
    const toY = parseFloat(card.dataset.y);

    const [fromX, fromY] = offscreenPoint(toX, toY);
    card.style.setProperty('--x', fromX + 'px');
    card.style.setProperty('--y', fromY + 'px');
    card.style.setProperty('--r', rand(-160, 160).toFixed(1) + 'deg');

    // commit that starting point before switching the transition on,
    // otherwise the browser collapses both writes into one and nothing moves
    void card.offsetWidth;

    card.classList.add('is-arriving');
    card.style.setProperty('--x', toX + 'px');
    card.style.setProperty('--y', toY + 'px');
    card.style.setProperty('--r', rand(-11, 11).toFixed(1) + 'deg');
    card.dataset.x = toX;
    card.dataset.y = toY;

    const landed = event => {
      // scale/box-shadow also transition; only the arrival counts
      if (event && event.propertyName !== 'translate') return;
      card.classList.remove('is-arriving');
      card.removeEventListener('transitionend', landed);
    };
    card.addEventListener('transitionend', landed);
    setTimeout(landed, 1400);   // in case the transition never reports back
  };

  const reset = () => {
    const extras = cards.filter(card => !original.includes(card));

    extras.forEach(card => {
      cancelAnimationFrame(card._physics);
      card._physics = null;
      card.classList.remove('is-flying', 'is-arriving');

      const [x, y] = offscreenPoint(parseFloat(card.dataset.x), parseFloat(card.dataset.y));
      void card.offsetWidth;
      card.classList.add('is-leaving');
      card.style.setProperty('--x', x + 'px');
      card.style.setProperty('--y', y + 'px');
      card.style.setProperty('--r', rand(-200, 200).toFixed(1) + 'deg');

      setTimeout(() => card.remove(), 800);
    });

    cards.length = 0;
    cards.push(...original);

    // settle the keepers back into a fresh scatter
    original.forEach(card => {
      cancelAnimationFrame(card._physics);
      card._physics = null;
      card.classList.remove('is-flying');
      card.classList.add('is-arriving');
      setTimeout(() => card.classList.remove('is-arriving'), 1100);
    });
    scatter();

    pool = [...startingPool];
    setMode();
  };

  if (button) {
    setMode();
    button.addEventListener('click', () => {
      if (pool.length) {
        addPhoto();
        setMode();
      } else {
        reset();
      }
    });
  }
});
