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
  const lines = document.querySelectorAll('.typing-line');
  if (!lines.length) return;

  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  lines.forEach((line) => {
    let phrases;
    try {
      phrases = JSON.parse(line.dataset.phrases);
    } catch (e) {
      return; // bad data-phrases: leave the plain fallback text in place
    }
    if (!Array.isArray(phrases) || !phrases.length) return;

    const out = line.querySelector('.typing-text');
    if (!out) return;

    // No animation for visitors who ask for reduced motion - just show the first phrase.
    if (calm) {
      line.classList.add('is-typing');
      out.textContent = phrases[0];
      return;
    }

    // each line can set its own pace, so a quiet caption can be slower than a headline
    const num = (name, fallback) => {
      const v = parseInt(line.dataset[name], 10);
      return Number.isFinite(v) ? v : fallback;
    };
    const TYPE_SPEED = num('type', 90);     // ms per character while typing
    const DELETE_SPEED = num('delete', 45); // ms per character while deleting
    const HOLD = num('hold', 1600);         // ms to sit on a finished phrase
    const PAUSE = num('pause', 400);        // ms of empty line before the next phrase
    const FADE = num('fade', 0);            // >0: dissolve the phrase instead of backspacing it

    line.classList.add('is-typing');

    let index = 0;
    let chars = 0;
    let deleting = false;

    // Dissolving out reads far smoother than backspacing, and it is the only
    // way the line makes sense without a cursor to justify the deletion.
    const dissolve = () => {
      line.classList.add('is-fading');
      setTimeout(() => {
        chars = 0;
        index = (index + 1) % phrases.length;
        out.textContent = '';
        line.classList.remove('is-fading');
        setTimeout(tick, PAUSE);
      }, FADE);
    };

    const tick = () => {
      const phrase = phrases[index];
      chars += deleting ? -1 : 1;
      out.textContent = phrase.slice(0, chars);

      let delay = deleting ? DELETE_SPEED : TYPE_SPEED;

      if (!deleting && chars === phrase.length) {
        if (FADE) {
          setTimeout(dissolve, HOLD);
          return;
        }
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

// Photo ring: turns by itself, slowly, and takes its cue from the scroll -
// scrolling down spins it one way, scrolling up the other, and it eases back
// to its idle drift once you stop.
document.addEventListener('DOMContentLoaded', () => {
  const ring = document.querySelector('#photo-ring');
  if (!ring) return;

  const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (calm.matches) return;

  const IDLE = -4;       // deg/sec at rest; negative carries the front face left to right
  const PER_PX = -0.22;  // degrees of extra spin per pixel scrolled
  const MAX_BOOST = 260; // ceiling, so a flick of the wheel can't send it wild
  const DECAY = 0.93;    // how quickly the scroll boost bleeds off each frame
  const YAW = 14;        // degrees the ring turns towards the cursor
  const LEAN = -4;       // negative so the ring follows the cursor: down moves it down
  const EASE = 3.5;      // how quickly it catches up with the pointer

  let angle = 0;
  let boost = 0;
  let lastY = window.scrollY;
  let wantX = 0, wantY = 0;   // where the cursor is, as -1..1
  let leanX = 0, leanY = 0;   // where the ring has got to so far
  let last = 0;
  let running = false;
  let frame = null;

  const step = (now) => {
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now;

    angle += (IDLE + boost) * dt;
    boost *= Math.pow(DECAY, dt * 60);
    if (Math.abs(boost) < 0.4) boost = 0;

    // chase the cursor rather than snapping to it, so a fast flick across the
    // screen still reads as the ring leaning over
    const k = 1 - Math.exp(-EASE * dt);
    leanX += (wantX - leanX) * k;
    leanY += (wantY - leanY) * k;

    ring.style.setProperty('--spin', (angle % 360).toFixed(2) + 'deg');
    ring.style.setProperty('--yaw', (leanX * YAW).toFixed(2) + 'deg');
    ring.style.setProperty('--lean', (leanY * LEAN).toFixed(2) + 'deg');

    // keep going while the boost is still unwinding, then settle into the idle turn
    frame = requestAnimationFrame(step);
  };

  const start = () => {
    if (running) return;
    running = true;
    last = 0;
    frame = requestAnimationFrame(step);
  };

  const stop = () => {
    running = false;
    if (frame) cancelAnimationFrame(frame);
    frame = null;
  };

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    boost += (y - lastY) * PER_PX;
    boost = Math.max(-MAX_BOOST, Math.min(MAX_BOOST, boost));
    lastY = y;
  }, { passive: true });

  window.addEventListener('pointermove', (e) => {
    wantX = (e.clientX / window.innerWidth) * 2 - 1;
    wantY = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  // a pointer that leaves the window shouldn't hold the ring over at an angle
  window.addEventListener('pointerleave', () => {
    wantX = 0;
    wantY = 0;
  }, { passive: true });

  // no point burning frames while the ring is nowhere near the screen
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      entries.forEach((entry) => (entry.isIntersecting ? start() : stop()));
    }, { rootMargin: '200px 0px' }).observe(ring);
  } else {
    start();
  }
});

// Skill-card flourishes hold still until their card is actually reached: the
// tool badges pop in one after another, the core-skills track starts running.
document.addEventListener('DOMContentLoaded', () => {
  const targets = [...document.querySelectorAll('.tool-grid, .flow, .cover-stage')];
  if (!targets.length) return;

  if (!('IntersectionObserver' in window)) {
    // no observer: let everything sit in its finished, visible state
    targets.forEach((el) => el.classList.add('is-in'));
    return;
  }

  // only hide the badges once we know we can bring them back
  const grid = targets.find((el) => el.classList.contains('tool-grid'));
  if (grid) grid.classList.add('js-anim');

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);   // each one only needs starting once
    });
  }, { threshold: 0.25 });

  targets.forEach((el) => io.observe(el));
});

// Inverted ripples that spread from the cursor across a piece of glass. Any
// element marked [data-glass] gets them - the footer wordmark and the connect
// button both do. What differs between the two is only the mask in the CSS:
// here they are the same surface.
document.addEventListener('DOMContentLoaded', () => {
  if (window.matchMedia('(hover: none)').matches) return;   // nothing to follow

  const glass = (mark) => {
    const flare = mark.querySelector('.ripple-origin');   // the moving anchor
    const shell = mark.querySelector('.glass-ripple');    // masked wrapper
    if (!flare || !shell) return;

    const EASE = 18;   // how quickly the ripples catch the pointer

    let wantX = 0, wantY = 0;
    let x = 0, y = 0;
    let placed = false;
    let running = false, frame = null, last = 0;

    const draw = () => {
      flare.style.transform = 'translate3d(' + x.toFixed(1) + 'px, ' + y.toFixed(1) + 'px, 0)';
    };

    const step = (now) => {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;

      const k = 1 - Math.exp(-EASE * dt);
      x += (wantX - x) * k;
      y += (wantY - y) * k;

      draw();
      frame = requestAnimationFrame(step);
    };

    const start = () => {
      if (running) return;
      running = true;
      last = 0;
      frame = requestAnimationFrame(step);
    };

    const stop = () => {
      running = false;
      if (frame) cancelAnimationFrame(frame);
      frame = null;
    };

    const off = () => shell.classList.remove('is-on');

    window.addEventListener('pointermove', (e) => {
      const r = mark.getBoundingClientRect();
      if (!r.width || !r.height) return;

      wantX = e.clientX - r.left;
      wantY = e.clientY - r.top;

      // first appearance lands on the cursor rather than flying in
      if (!placed) {
        x = wantX;
        y = wantY;
        placed = true;
        draw();
      }

      const inside = e.clientX >= r.left && e.clientX <= r.right
                  && e.clientY >= r.top && e.clientY <= r.bottom;
      shell.classList.toggle('is-on', inside);
    }, { passive: true });

    window.addEventListener('pointerleave', off, { passive: true });
    window.addEventListener('blur', off);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        entries.forEach((entry) => (entry.isIntersecting ? start() : (stop(), off())));
      }, { rootMargin: '150px 0px' }).observe(mark);
    } else {
      start();
    }
  };

  document.querySelectorAll('[data-glass]').forEach(glass);
});


/* ---------------------------------------------------------------- *
 * FOOTER CLOCK
 * The "based in" column shows the current time where I actually am,
 * not where the visitor is - so the zone is named rather than local.
 * ---------------------------------------------------------------- */

(function footerClock() {
  const out = document.querySelector('#footer-time');
  if (!out) return;

  let fmt;
  try {
    fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Vancouver',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZoneName: 'short'
    });
  } catch (e) {
    /* a browser without that zone in its database keeps the dashes */
    return;
  }

  const tick = () => {
    out.textContent = fmt.format(new Date());
    /* line up the next run with the top of the minute rather than drifting */
    setTimeout(tick, 60000 - (Date.now() % 60000) + 250);
  };
  tick();
})();

// Animated project covers: the NextStep column cover's nine phone videos and the
// Consistency / Mixtape backgrounds. None of them autoplay or preload in the
// markup - left to themselves they all downloaded the moment the page opened,
// cover by cover, whether or not anyone scrolled that far. They start here, as
// each card comes near the screen, and pause again once it has gone.
document.addEventListener('DOMContentLoaded', () => {
  const covers = document.querySelectorAll('.colcover, .cover-stage');
  if (!covers.length) return;

  // no observer: fall back to what autoplay used to do
  if (!('IntersectionObserver' in window)) {
    covers.forEach(cover => cover.querySelectorAll('video').forEach(v => v.play().catch(() => {})));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      entry.target.querySelectorAll('video').forEach(video => {
        if (entry.isIntersecting) {
          video.play().catch(() => {}); // ignore autoplay rejections
        } else {
          video.pause();
        }
      });
    });
  }, { rootMargin: '200px 0px' });

  covers.forEach(cover => observer.observe(cover));
});

// About page: the "Say hi" chat.
//
// The replies are scripted, not AI. A real model would need an API key, and
// anything shipped to the browser is readable by anyone who opens DevTools -
// the key would be public and the bill would be whoever found it. Doing it
// properly needs a small server function (Vercel, Netlify, a Cloudflare
// Worker) holding the key, which a static host can't run.
//
// It is written so that is a small change later: everything below is plumbing,
// and replyTo() is the only part that decides what to say. Swapping it for
//
//   const replyTo = async (text) => {
//     const r = await fetch('/api/chat', { method: 'POST', body: JSON.stringify({ text }) });
//     return (await r.json()).reply;
//   };
//
// is the whole job, once such an endpoint exists.
//
// Nothing is sent anywhere. The email the visitor leaves is used to build a
// mailto: link that opens their own mail app with the note already written.
document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('[data-chat]');
  if (!root) return;

  const log = root.querySelector('[data-chat-log]');
  const form = root.querySelector('[data-chat-form]');
  const input = root.querySelector('[data-chat-input]');
  const send = form.querySelector('button');

  const ME = 'rawitphoom1@gmail.com';
  const AVATAR = 'assets/images/profile_photo.jpg';
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  let asked = false;        // has the email been asked for yet
  let firstMessage = '';    // kept so the mailto can quote it back

  /* ---- the only part that decides what to say ---- */
  const replyTo = (text) => {
    const t = text.toLowerCase();
    // intent first: "hey, are you free for freelance work?" opens with a
    // greeting but is not a greeting, and answering the actual ask is better
    if (/(hire|job|role|opportunit|freelance|free\b|available|project|collab|contract|gig|work with)/.test(t))
      return "I'd love to hear about it. What are you building?";
    if (/(resume|cv)/.test(t)) return 'My resume is linked in the menu, under Experience and Education.';
    if (/(name|who are you)/.test(t)) return "I'm Rawi, a UX/UI designer and front-end developer in Burnaby.";
    if (/(figma|design|ux|ui)/.test(t)) return 'Design is most of what I do. Figma all day, then I build the thing.';
    if (/(code|dev|front.?end|react|website)/.test(t)) return 'I build what I design, mostly front-end.';
    // a bare greeting, checked late so it can't swallow a real question
    if (/^(hi|hey|hello|yo|sup|hiya)\b/.test(t) && t.length < 24) return 'Hey! Good to meet you.';
    if (/\?/.test(t)) return 'Good question. Let me give you a proper answer rather than a quick one.';
    return 'Thanks for that.';
  };

  /* ---- plumbing ---- */

  const scroll = () => { log.scrollTop = log.scrollHeight; };

  const bubble = (who, node) => {
    const row = document.createElement('div');
    row.className = 'chat-row' + (who === 'me' ? ' is-me' : '');
    if (who !== 'me') {
      const img = document.createElement('img');
      img.className = 'chat-avatar';
      img.src = AVATAR;
      img.alt = 'Rawitphoom Kiatthitinan';
      row.appendChild(img);
    }
    const b = document.createElement('div');
    b.className = 'chat-bubble';
    if (typeof node === 'string') b.textContent = node; else b.appendChild(node);
    row.appendChild(b);
    log.appendChild(row);
    scroll();
    return row;
  };

  // shows the three dots for a beat, then swaps them for the message, so a
  // reply doesn't appear the instant you hit send
  const says = (node, wait = 700) => new Promise((done) => {
    const dots = document.createElement('span');
    dots.className = 'chat-dots';
    dots.innerHTML = '<i></i><i></i><i></i>';
    const row = bubble('them', dots);
    setTimeout(() => {
      row.remove();
      bubble('them', node);
      done();
    }, wait);
  });

  const mailtoLink = (email) => {
    const a = document.createElement('a');
    const body = `Hi Rawi,\n\n${firstMessage}\n\nYou can reach me at ${email}.`;
    a.href = `mailto:${ME}?subject=${encodeURIComponent('Hello from your portfolio')}&body=${encodeURIComponent(body)}`;
    a.textContent = 'Open it in your mail app';
    const wrap = document.createElement('span');
    wrap.append('Got it. This page can\u2019t send mail on its own, so here it is ready to go: ', a, '.');
    return wrap;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    bubble('me', text);
    input.value = '';
    input.disabled = send.disabled = true;

    if (!asked) {
      firstMessage = text;
      await says(replyTo(text));
      await says("I'll get back to you as soon as I can. What's a good email to reach you at?", 900);
      asked = true;
      input.placeholder = 'Your email...';
      input.type = 'email';
    } else if (EMAIL_RE.test(text)) {
      await says(mailtoLink(text), 800);
      input.placeholder = 'Anything else?';
      input.type = 'text';
      asked = false;
    } else {
      await says("That doesn't look like an email. Mind checking it?", 600);
    }

    input.disabled = send.disabled = false;
    input.focus();
  });

  // the opening line waits until the card is actually looked at
  const io = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    io.disconnect();
    says('Nice to meet you! Feel free to send me a message.', 500);
  }, { threshold: 0.4 });
  io.observe(root);
});

/* ---------------------------------------------------------------- *
 * Scroll-lit text
 *
 * Each word of a [data-reveal] paragraph fades from dim to solid as the
 * paragraph crosses the middle of the screen, a few words at a time rather
 * than all at once, so the light reads as a sweep.
 *
 * Words are wrapped here rather than in the HTML: the markup stays a normal
 * paragraph, which is what a reader without JS (and a search engine) gets.
 * Inline images are pushed into the same queue as the words, so a picture in
 * the middle of a sentence lights in its turn instead of sitting bright while
 * the text around it is still dark.
 * ---------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  const blocks = [...document.querySelectorAll('[data-reveal]')];
  if (!blocks.length) return;

  const DIM = 0.18;   // the resting opacity - matches .reveal-part in the CSS
  const LEAD = 8;     // words lit at once; larger is a softer edge

  // Split every text node into words, wrapping each in its own span. Whitespace
  // is left as plain text between them so lines still break normally.
  const wrap = block => {
    const parts = [];

    // Every part is inline-block, because an inline box cannot be transformed
    // - and browsers will break a line between two inline-blocks even with no
    // space between them, which sent the full stop after a photo down to a
    // line of its own. A word joiner between them is the textbook fix and
    // Chrome broke anyway; wrapping the pair in a nowrap span is what actually
    // holds them together.
    let spaceBefore = true;
    let previous = null;

    const glue = (prev, next) => {
      const box = prev.parentNode?.classList?.contains('reveal-glue')
        ? prev.parentNode
        : Object.assign(document.createElement('span'), { className: 'reveal-glue' });

      if (box !== prev.parentNode) {
        prev.replaceWith(box);
        box.append(prev);
      }

      box.append(next);
    };

    for (const node of [...block.childNodes]) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        node.classList.add('reveal-part');
        parts.push(node);
        previous = node;
        spaceBefore = false;
        continue;
      }

      if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) continue;

      const frag = document.createDocumentFragment();

      for (const chunk of node.textContent.split(/(\s+)/)) {
        if (!chunk) continue;

        if (/^\s+$/.test(chunk)) {
          frag.append(chunk);
          spaceBefore = true;
          continue;
        }

        const span = document.createElement('span');
        span.className = 'reveal-part';
        span.textContent = chunk;

        // butted up against the part before it (a full stop after a photo):
        // the two have to travel together
        if (!spaceBefore && previous) glue(previous, span);
        else frag.append(span);

        parts.push(span);
        previous = span;
        spaceBefore = false;
      }

      node.replaceWith(frag);
    }

    return parts;
  };

  const still = window.matchMedia('(prefers-reduced-motion: reduce)');

  const items = blocks.map(block => ({
    block,
    parts: wrap(block),
    // what was last written, so a frame that changes nothing touches no styles
    last: [],
    // whether each part has been sent off on its bounce yet
    on: [],
  }));

  const paint = () => {
    const vh = window.innerHeight;

    for (const item of items) {
      const box = item.block.getBoundingClientRect();

      // nowhere near the screen: whatever it is showing is already right
      if (box.bottom < -vh || box.top > vh * 2) continue;

      // 0 when the paragraph's top is four fifths down the screen, 1 once its
      // bottom has come up past the middle. Including the height means a long
      // paragraph takes proportionally longer to light than a short one.
      const p = Math.min(1, Math.max(0,
        (vh * 0.8 - box.top) / (vh * 0.25 + box.height)));

      const n = item.parts.length;

      item.parts.forEach((part, i) => {
        // each word's own slice of the sweep, LEAD words wide
        const lit = Math.min(1, Math.max(0, (p * (n + LEAD) - i) / LEAD));
        const value = DIM + (1 - DIM) * lit;

        // The bounce is a CSS animation fired by this class, not something
        // driven frame by frame - a spring dragged by the scrollbar reads as
        // dead. The two thresholds are deliberately apart: with one value a
        // word sitting exactly on the line flickers the class on and off as
        // you inch the page, and the animation restarts every time.
        if (lit > 0.4 && !item.on[i]) {
          part.classList.add('is-lit');
          item.on[i] = true;
        } else if (lit < 0.08 && item.on[i]) {
          part.classList.remove('is-lit');
          item.on[i] = false;
        }

        if (Math.abs(value - item.last[i]) < 0.01) return;

        part.style.opacity = value.toFixed(3);
        item.last[i] = value;
      });
    }
  };

  const light = () => {
    for (const item of items) {
      for (const part of item.parts) {
        part.style.opacity = '1';
        part.classList.remove('is-lit');
      }
    }
  };

  // The scroll handler runs for the whole page, so paint() keeps itself cheap
  // by skipping any paragraph that is nowhere near the viewport. Gating the
  // listener on an IntersectionObserver instead was neater and more fragile:
  // if the observer never fires, the sweep never starts at all.
  let queued = false;

  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      paint();
    });
  };

  const start = () => {
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    paint();
  };

  const stop = () => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
  };

  if (still.matches) light();
  else start();

  still.addEventListener('change', () => (still.matches ? (stop(), light()) : start()));
});

/* ---------------------------------------------------------------- *
 * Animated emoji in the bio
 *
 * Noto Animated Emoji, played as Lottie. Each sticker is an empty span in the
 * markup with a data-lottie path; nothing is fetched until the bio is on
 * screen, because the player and the four animations together are heavier
 * than the rest of this page put together and none of it matters to someone
 * who never scrolls past the hero.
 *
 * Players are paused whenever their sticker leaves the viewport - four looping
 * SVG animations repainting behind the fold is exactly the sort of thing that
 * made the 3D models feel slow.
 * ---------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  const stickers = [...document.querySelectorAll('[data-lottie]')];
  if (!stickers.length || !('IntersectionObserver' in window)) return;

  const PLAYER = 'scripts/vendor/lottie_light.min.js';
  const still = window.matchMedia('(prefers-reduced-motion: reduce)');

  let loading = null;

  const player = () => {
    if (window.lottie) return Promise.resolve(window.lottie);

    loading ||= new Promise((resolve, reject) => {
      const tag = document.createElement('script');
      tag.src = PLAYER;
      tag.onload = () => resolve(window.lottie);
      tag.onerror = reject;
      document.head.append(tag);
    });

    return loading;
  };

  const build = async sticker => {
    const lottie = await player();

    const anim = lottie.loadAnimation({
      container: sticker,
      renderer: 'svg',
      loop: true,
      // Reduced motion gets the artwork, held on its first frame.
      autoplay: !still.matches,
      path: sticker.dataset.lottie,
    });

    if (still.matches) anim.goToAndStop(0, true);

    return anim;
  };

  // One observer builds a sticker the first time it is seen, and from then on
  // just plays and pauses it.
  const io = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const sticker = entry.target;

      if (entry.isIntersecting && !sticker.dataset.built) {
        sticker.dataset.built = '1';
        build(sticker).then(anim => (sticker.anim = anim));
        continue;
      }

      if (!sticker.anim || still.matches) continue;
      entry.isIntersecting ? sticker.anim.play() : sticker.anim.pause();
    }
  }, { rootMargin: '25% 0px' });

  stickers.forEach(sticker => io.observe(sticker));
});


/* ---------------------------------------------------------------- *
 * Footer wordmark: the pull
 *
 * The mark stretches vertically from squashed to its true proportions over the
 * last stretch of the page, reaching full height exactly as the scroll bottoms
 * out. All this writes is one number; the shape of the move lives in the CSS.
 * ---------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  const mark = document.querySelector('#glass-mark');
  if (!mark) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // how much scrolling the stretch is spread over, in px before the bottom
  const RUN = 560;

  let queued = false;
  let last = -1;

  const sync = () => {
    const doc = document.documentElement;
    // distance still to go before the page is fully scrolled
    const rest = doc.scrollHeight - (window.scrollY + window.innerHeight);
    const pull = 1 - Math.min(Math.max(rest / RUN, 0), 1);

    // a frame that would write the same number touches nothing
    if (Math.abs(pull - last) < 0.002) return;
    last = pull;
    mark.style.setProperty('--pull', pull.toFixed(3));
  };

  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      sync();
    });
  };

  sync();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
});
