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

// Trial: the blur trail follows the pointer over the whole page (the "Blur
// trail everywhere" section at the end of this file) instead of only over
// case study pictures and project cards. While it is on, those two stand
// down, so the blur isn't doubled. Set to false to go back to them.
const BLUR_EVERYWHERE = true;

// Every picture and clip in a case study has a tiny preview (160px wide, a few
// KB) of the same name in a thumbs/ folder beside it, as a .jpg: for a clip, a
// frame from 40% of the way through. The page minimap draws with them, and the
// slide viewer shows them while a slide loads and in its row of thumbnails.
// This is where that file is found. Vector drawings are small already and have
// none, so for those it gives nothing.
function thumbFor(src) {
  if (!src || /\.svg($|[?#])/i.test(src)) return null;
  const url = new URL(src, location.href);
  // already a preview (the slide viewer's thumbnails are): it is its own
  if (/\/thumbs\/[^/]+$/.test(url.pathname)) return url.href;
  // decoded, so a name with spaces ("IAT343 - Image1") finds its file
  const name = decodeURIComponent(url.pathname.split('/').pop()).replace(/\.[^.]+$/, '');
  return new URL('thumbs/' + encodeURIComponent(name) + '.jpg', url).href;
}

// Safari, and every browser on an iPhone (they all run on Apple's engine).
// Two things below need to know: the avatar file, and the ring's bend.
const appleEngine = (() => {
  const ua = navigator.userAgent;
  return (/AppleWebKit/.test(ua) && !/Chrome\/|Chromium|Edg\//.test(ua)) ||
    /CriOS|FxiOS|EdgiOS/.test(ua);
})();

// The desktop header's picture is a small cube, like a die, with the
// animated avatar on every side. At the very top of the page, scrolling up further, past the top,
// turns it a quarter, right to left, onto its next side; keep scrolling and it
// keeps turning, about a side per flick. The turn and its soft landing are a
// CSS transition (global.css, .avatar-cube).
//
// Built here, around the video already in the page, and straight away rather
// than when the page is ready, so the header's other scripts measure the cube
// and not the video. Without JavaScript the plain video stays.
(() => {
  const video = document.querySelector('.desktop-header video#profile-pic');
  if (!video) return;

  const make = (cls) => Object.assign(document.createElement('span'), { className: cls });
  const box = make('logo-avatar avatar-cube');
  box.id = 'profile-pic';
  box.setAttribute('role', 'img');
  box.setAttribute('aria-label', video.getAttribute('aria-label') || '');
  const cube = make('cube');
  box.append(cube);

  video.replaceWith(box);
  video.removeAttribute('id');
  video.removeAttribute('aria-label');
  video.setAttribute('aria-hidden', 'true');
  video.className = 'avatar-video';
  const front = make('cube-face cube-front');
  front.append(video);
  cube.append(front);
  // Every side plays the same animated avatar, so it keeps moving while the
  // cube turns and whichever side it lands on. The copies are the same small
  // file, which the browser fetches once; they start from wherever the front
  // one is, so all four stay in step.
  const copies = ['right', 'back', 'left'].map((side) => {
    const face = make('cube-face cube-' + side);
    const copy = video.cloneNode(true);
    face.append(copy);
    cube.append(face);
    return copy;
  });
  const videos = [video, ...copies];
  videos.forEach((v) => {
    v.muted = true;
    v.play().catch(() => {});
  });
  const sync = () => copies.forEach((copy) => {
    if (Math.abs(copy.currentTime - video.currentTime) > 0.05) copy.currentTime = video.currentTime;
  });
  video.addEventListener('playing', sync);
  video.addEventListener('seeked', sync);
  // a loop restarts each copy on its own; line them up again each time round
  video.addEventListener('timeupdate', () => { if (video.currentTime < 0.2) sync(); });

  // Scrolling turns the cube with the scroll, wherever on the page, including
  // on past the very top: up turns it right to left, down left to right, a
  // little scroll a little turn. When the scrolling stops it
  // settles onto whichever side is nearest, so a turn that got past halfway
  // carries on to the next side and one that didn't falls back.
  //
  // Driven a frame at a time by a spring rather than by a CSS transition: a
  // mouse wheel moves in big steps, and the spring turns those steps into one
  // glide, where a transition restarted on every step and stuttered.
  // How far it turns per px of scrolling. A mouse wheel notch is about 100px,
  // which makes about 50deg: past halfway, so one notch moves it on a side. A
  // trackpad nudge of a few px only tips it, and it falls back.
  const DEG_PER_PX = 0.5;
  const SETTLE = 220;       // ms without scrolling before it settles onto a side
  // Two springs. While the scroll is moving, a tight one, so the cube keeps
  // up with the mouse or trackpad instead of trailing behind it; once the
  // scroll stops, a calmer one for the settle onto a side. Each is just
  // damped enough not to wobble (damping = 2 x the square root of the pull).
  const FOLLOW = { stiff: 260, damp: 32 };
  const SETTLE_SPRING = { stiff: 70, damp: 16.7 };
  const AHEAD = 180;        // deg it can be asked to turn beyond where it is now
  const still = window.matchMedia('(prefers-reduced-motion: reduce)');

  let angle = 0;      // where it is drawn
  let target = 0;     // where it is heading
  let speed = 0;      // degrees per second
  let running = false;
  let idle = 0;
  let lastFrame = 0;
  let spring = FOLLOW;

  const draw = () => cube.style.setProperty('--turn', angle.toFixed(2) + 'deg');

  const frame = (now) => {
    // The time since the last frame, worked through in small steps, so the
    // turn takes the same time however few frames the browser draws (a busy or
    // power saving one draws fewer) without the spring overshooting. A frame's
    // time stamp can come a hair before the moment the turn began, so never
    // less than nothing; after a long stall, at most a quarter second at once.
    let left = Math.min(0.25, Math.max(0, (now - lastFrame) / 1000));
    lastFrame = now;
    while (left > 0) {
      const dt = Math.min(1 / 240, left);
      left -= dt;
      const pull = (target - angle) * spring.stiff - speed * spring.damp;
      speed += pull * dt;
      angle += speed * dt;
    }
    if (Math.abs(target - angle) < 0.05 && Math.abs(speed) < 0.5) {
      angle = target;
      speed = 0;
      running = false;
    }
    draw();
    if (running) requestAnimationFrame(frame);
  };

  const move = () => {
    if (still.matches) {
      angle = target;
      draw();
      return;
    }
    if (running) return;
    running = true;
    lastFrame = performance.now();
    requestAnimationFrame(frame);
  };

  // onto the nearest side; sides are every 90deg, turning the negative way
  const settle = () => {
    spring = SETTLE_SPRING;
    target = Math.round(target / 90) * 90;
    move();
  };

  window.addEventListener('wheel', (e) => {
    if (!e.deltaY) return;
    // a wheel that reports whole lines or pages, not pixels
    const px = e.deltaMode === 1 ? e.deltaY * 40 : e.deltaMode === 2 ? e.deltaY * 800 : e.deltaY;
    // deltaY is negative going up, which turns it right to left, and positive
    // going down, which turns it left to right
    spring = FOLLOW;
    target += px * DEG_PER_PX;
    // a long or fast scroll lines up at most two sides ahead, so it never
    // keeps spinning long after the scrolling has stopped
    target = Math.max(angle - AHEAD, Math.min(angle + AHEAD, target));
    move();
    clearTimeout(idle);
    idle = setTimeout(settle, SETTLE);
  }, { passive: true });
})();

// The animated avatar in the header comes in two copies, both with a see
// through background: a WebM (VP9) for most browsers and an HEVC MP4 for
// Apple's. Safari, and every iPhone browser since they all run on Apple's
// engine, now plays the WebM, which is listed first, but cannot show its see
// through layer and fills it with white, so the avatar sat in a white box.
// There, swap to the MP4, which it does show see through. Picked by engine
// rather than left to the browser: Chrome on a Mac can play that MP4 too, but
// it would drop the see through layer and give Chrome the white box instead.
document.addEventListener('DOMContentLoaded', () => {
  if (!appleEngine) return;

  document.querySelectorAll('video.logo-avatar, .avatar-cube video').forEach((video) => {
    const webm = video.querySelector('source[type^="video/webm"]');
    if (!webm) return;
    webm.remove();
    video.load();
    video.play().catch(() => {});
  });
});

// A second try for videos the browser would not start. Every looping video on
// the site is started from script when it comes into view, and a phone can
// refuse that: an iPhone in Low Power Mode, or a browser saving data, will
// not play a video until the visitor has touched the page. Left alone, those
// videos stayed still for the whole visit. On each touch, click or key, every
// looping video on screen that is still paused is started again, since a
// touch only lets through the videos in sight at the time; the code that
// started each one pauses it as usual once it leaves.
// With reduced motion they are left as they are.
(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const retry = () => {
    document.querySelectorAll('video[loop]').forEach((video) => {
      if (!video.paused) return;
      const box = video.getBoundingClientRect();
      const onScreen = box.width > 0 && box.height > 0
        && box.bottom > 0 && box.top < window.innerHeight
        && box.right > 0 && box.left < window.innerWidth;
      if (onScreen && getComputedStyle(video).visibility !== 'hidden') {
        video.play().catch(() => {});
      }
    });
  };
  ['pointerdown', 'touchend', 'keydown'].forEach((type) => {
    window.addEventListener(type, retry, { passive: true, capture: true });
  });
})();

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

  // Reduced motion. On a page that opts in (data-reduced-motion="play-button"
  // on a wrapper), these videos never start by themselves: they show their
  // poster with a play button over it, and the visitor decides. Opt in, so
  // the home page cards and the older case studies keep what they do now.
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const addPlayButton = (video) => {
    const label = video.getAttribute('aria-label') || 'video';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'clip-play';
    button.innerHTML =
      '<svg class="clip-play-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z"/></svg>' +
      '<svg class="clip-pause-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>';

    const sync = () => {
      const playing = !video.paused;
      button.classList.toggle('is-playing', playing);
      button.setAttribute('aria-label', (playing ? 'Pause: ' : 'Play: ') + label);
    };

    button.addEventListener('click', () => {
      if (video.paused) video.play().catch(() => {});
      else video.pause();
    });
    video.addEventListener('play', sync);
    video.addEventListener('pause', sync);
    sync();

    // the button covers the video, so it sits in the same positioned box
    video.after(button);
  };

  videos.forEach(video => {
    if (still && video.closest('[data-reduced-motion="play-button"]')) {
      addPlayButton(video);
    } else {
      observer.observe(video);
    }
  });
});

// Fade the header's border in once the page scrolls away from the top. The
// phone top bar gets the same class; the home page turns both to glass with it.
document.addEventListener('DOMContentLoaded', () => {
  const bars = document.querySelectorAll('header.desktop-header, nav.hamburger');
  if (!bars.length) return;

  const THRESHOLD = 24; // px of scroll before the border shows

  const sync = () => {
    bars.forEach((bar) => bar.classList.toggle('scrolled', window.scrollY > THRESHOLD));
  };

  sync(); // in case the page loads part-way down
  window.addEventListener('scroll', sync, { passive: true });
});

// The desktop header's name and badges slide into the picture on scroll, as
// one group (global.css). Measured from the layout, which a slide doesn't
// change, so it works whether or not the header is folded at the time: how
// far the group travels (--fold), and how far each piece starts from the
// picture's edge (--fold-gap), so each is clipped right on that edge.
document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('header.desktop-header');
  const avatar = header && header.querySelector('.logo-avatar');
  const name = header && header.querySelector('.logo-text');
  const badges = header && header.querySelector('.social-badges');
  if (!avatar || !name || !badges) return;

  // left edge within the header, ignoring any slide in progress
  const leftOf = (el) => {
    let x = 0;
    for (let n = el; n && n !== header; n = n.offsetParent) x += n.offsetLeft;
    return x;
  };

  const measure = () => {
    const edge = leftOf(avatar) + avatar.offsetWidth;
    header.style.setProperty('--fold', leftOf(badges) + badges.offsetWidth - edge + 'px');
    name.style.setProperty('--fold-gap', leftOf(name) - edge + 'px');
    badges.style.setProperty('--fold-gap', leftOf(badges) - edge + 'px');
  };

  measure();
  if (document.fonts) document.fonts.ready.then(measure);
  window.addEventListener('resize', measure);
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

  // grow the ring over anything clickable: the case study pictures and the
  // picture viewer too, where a click anywhere closes it. Set on every
  // mouseover, not only added, so it never stays open after the viewer closes.
  const CLICKABLE = 'a, button, label, input, textarea, .project-card, .faq-item label, .zoom-pic, .zoom-box, .reel.is-live .reel-project img, .reel.is-live .reel-project video';
  document.addEventListener('mouseover', e => {
    ring.classList.toggle('is-hovering', !!e.target.closest(CLICKABLE));
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest(CLICKABLE)) ring.classList.remove('is-hovering');
  });
});

// Smooth wheel scrolling: the long, soft glide of most portfolio sites (the
// feel Lenis gives them), done here rather than with a library. Each wheel
// step moves a target, and the page glides toward it, easing out, so it keeps
// drifting a moment after the wheel stops.
//
// The glide is worked out from the time between frames, not per frame, so it
// feels the same on a 60Hz screen and a 120Hz one. The page's own position is
// kept as a fraction here and only written to the window, since the window
// rounds it and a glide read back from there can stall.
//
// Left to the browser: pinch zoom, sideways scrolling (the slide viewer's row
// of thumbnails), anything inside a box that scrolls on its own while that box
// can still go further that way, the phone menu, and the page behind an open
// picture viewer. Off for touch screens, which glide natively, and for anyone
// who has asked for less motion.
document.addEventListener('DOMContentLoaded', () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const SMOOTH = 7;   // how quickly it catches up: higher is snappier, lower is floatier
  const STEP = 1;     // wheel delta multiplier

  let target = window.scrollY;
  let current = window.scrollY;
  let animating = false;
  let last = 0;

  const maxScroll = () =>
    Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

  const run = (now) => {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    current += (target - current) * (1 - Math.exp(-SMOOTH * dt));

    // 'instant' matters: html { scroll-behavior: smooth } would otherwise turn each
    // of these into its own native animation and the page would barely move
    if (Math.abs(target - current) < 0.3) { // close enough - hand control back
      current = target;
      window.scrollTo({ top: target, behavior: 'instant' });
      animating = false;
      return;
    }

    window.scrollTo({ top: current, behavior: 'instant' });
    requestAnimationFrame(run);
  };

  // a box between the pointer and the page that can still scroll that way
  const scrollsItself = (el, dy) => {
    for (let n = el; n && n !== document.body && n !== document.documentElement; n = n.parentElement) {
      if (n.scrollHeight <= n.clientHeight + 1) continue;
      const overflow = getComputedStyle(n).overflowY;
      if (overflow !== 'auto' && overflow !== 'scroll') continue;
      if (dy < 0 ? n.scrollTop > 0 : n.scrollTop + n.clientHeight < n.scrollHeight - 1) return true;
    }
    return false;
  };

  window.addEventListener('wheel', e => {
    if (e.ctrlKey) return; // pinch-zoom
    // sideways: the browser's own
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    // the mobile sidebar scrolls itself
    if (e.target instanceof Element && e.target.closest('.links-container')) return;
    // and while it is open the page behind stays put (the CSS locks it; this
    // stops the glide from moving it anyway)
    if (document.getElementById('sidebar-active')?.checked) return;
    // while the picture viewer is open, the page behind it stays put
    if (document.querySelector('.zoom-box[open]')) return;
    if (e.target instanceof Element && scrollsItself(e.target, e.deltaY)) return;

    // a wheel that reports whole lines or pages, not pixels
    const dy = e.deltaMode === 1 ? e.deltaY * 40 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;

    e.preventDefault();
    if (!animating) current = window.scrollY;
    target = Math.min(Math.max(target + dy * STEP, 0), maxScroll());

    if (!animating) {
      animating = true;
      last = performance.now();
      requestAnimationFrame(run);
    }
  }, { passive: false });

  // keep in step with scrolling we don't drive (keyboard, scrollbar, anchor links)
  window.addEventListener('scroll', () => {
    if (!animating) target = current = window.scrollY;
  }, { passive: true });

  // Stop easing the instant a press starts. A click only fires when mousedown and
  // mouseup land on the same element, so a page still gliding under the pointer
  // can swallow the click on whatever the user was aiming at.
  window.addEventListener('pointerdown', () => {
    if (!animating) return;
    animating = false;
    target = current = window.scrollY;
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

// Photo ring bend: cut each photo into upright strips that about.css turns
// along an arc, so the photo curves in round the ring rather than sitting
// flat. Runs with reduced motion too: the bend is shape, not movement.
//
// Not on Apple's engine. The bend turns 20 photos into 80 separately drawn 3D
// strips, and on iPhone the ring came up black once it had them; an iPhone
// draws 3D layers black when it runs short of graphics memory for them. There
// the photos stay flat, as they were when the ring worked.
document.addEventListener('DOMContentLoaded', () => {
  const ring = document.querySelector('#photo-ring');
  if (!ring || appleEngine) return;

  const slices = parseInt(
    getComputedStyle(ring).getPropertyValue('--slices'), 10) || 4;

  ring.querySelectorAll('.ring-cell').forEach((cell) => {
    const img = cell.querySelector('img');
    if (!img) return;
    // the strips paint the same file the photo already loads
    cell.style.setProperty('--photo', `url("${img.src}")`);
    for (let k = 0; k < slices; k++) {
      const strip = document.createElement('span');
      strip.className = 'ring-slice';
      strip.style.setProperty('--k', k);
      cell.append(strip);
    }
  });

  ring.classList.add('is-bent');
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
  const AVATAR = '/assets/images/profile_photo.jpg';
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

  const PLAYER = '/scripts/vendor/lottie_light.min.js';
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

/* ---------------------------------------------------------------- *
 * Liquid chrome
 *
 * Two things on the site are drawn as moving liquid metal: the arrow in the
 * Next project card at the end of every case study, and the "rawi" wordmark
 * in the home page footer. Both use Paper Shaders' liquid metal effect
 * (github.com/paper-design/shaders, Apache-2.0; the five files it needs are in
 * scripts/vendor/paper-shaders with the licence).
 *
 * The effect needs its shape pre-processed into an edge map first. That was
 * done once, ahead of time, and saved as a small image per shape
 * (assets/images/chrome-arrow-metal.png, footer-rawi-metal.png), so a page
 * only loads the result rather than doing the work itself.
 *
 * Nothing loads until the thing is close to the screen, and whatever was there
 * before (the text arrow, the rendered wordmark) stays until the metal has
 * drawn, and for good if WebGL is not available. Paper's mount pauses itself
 * while it is off screen or the tab is hidden.
 * ---------------------------------------------------------------- */
const paperShadersBase = document.currentScript
  ? new URL('vendor/paper-shaders/', document.currentScript.src).href
  : null;

// the two modules, fetched once however many things end up using them
let liquidMetalModules = null;
const loadLiquidMetal = () => {
  liquidMetalModules ||= Promise.all([
    import(paperShadersBase + 'shader-mount.js'),
    import(paperShadersBase + 'shaders/liquid-metal.js'),
  ]).then(([mount, metal]) => ({
    ShaderMount: mount.ShaderMount,
    fragmentShader: metal.liquidMetalFragmentShader,
  }));
  return liquidMetalModules;
};

const loadImage = (src) => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = reject;
  img.src = src;
});

// Paper's default liquid metal, on a transparent background. Each use passes
// only what it changes.
const liquidMetalUniforms = (shape, overrides) => ({
  u_colorBack: [0, 0, 0, 0],
  u_colorTint: [1, 1, 1, 1],
  u_image: shape,
  u_isImage: true,
  u_shape: 0,
  u_repetition: 2,
  u_softness: 0.1,
  u_shiftRed: 0.3,
  u_shiftBlue: 0.3,
  u_distortion: 0.07,
  u_contour: 0.4,
  u_angle: 70,
  u_fit: 1,
  u_scale: 1,
  u_rotation: 0,
  u_offsetX: 0,
  u_offsetY: 0,
  u_originX: 0.5,
  u_originY: 0.5,
  u_worldWidth: 0,
  u_worldHeight: 0,
  ...overrides,
});

// Start `start` once any of `targets` comes within `margin` of the screen.
const whenNear = (targets, margin, start) => {
  const io = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect();
    start().catch(() => {});   // any failure leaves the original in place
  }, { rootMargin: margin + ' 0px' });
  targets.forEach((t) => io.observe(t));
};

// --- the Next project arrow ---
document.addEventListener('DOMContentLoaded', () => {
  const arrows = [...document.querySelectorAll('.case-next-arrow')];
  if (!arrows.length || !paperShadersBase || !('IntersectionObserver' in window)) return;

  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SPEED = still ? 0 : 1;          // reduced motion gets one still frame of chrome
  const HOVER_SPEED = still ? 0 : 2.4;  // and the card quickens it when pointed at

  whenNear(arrows, '400px', async () => {
    const [{ ShaderMount, fragmentShader }, shape] = await Promise.all([
      loadLiquidMetal(),
      loadImage('/assets/images/chrome-arrow-metal.png'),
    ]);

    arrows.forEach((arrow) => {
      const stage = document.createElement('span');
      stage.className = 'case-next-metal';
      arrow.append(stage);

      try {
        const mount = new ShaderMount(stage, fragmentShader, liquidMetalUniforms(shape, {
          // Paper's default is 0.3 on both. At that the edges threw a warm
          // orange glint, and the chrome button is kept free of orange; this
          // keeps a cool edge and only a trace of warmth.
          u_shiftRed: 0.08,
          u_shiftBlue: 0.2,
          // contain the arrow in its box, nearly edge to edge
          u_scale: 0.92,
        }), undefined, SPEED, 0, 2, undefined, ['u_image']);

        // swap the text arrow out only once there is a frame to show instead
        requestAnimationFrame(() => arrow.classList.add('is-metal'));

        const card = arrow.closest('.case-next-link');
        card?.addEventListener('pointerenter', () => mount.setSpeed(HOVER_SPEED));
        card?.addEventListener('pointerleave', () => mount.setSpeed(SPEED));
      } catch (err) {
        // no WebGL2: the text arrow stays exactly as it was
        stage.remove();
      }
    });
  });
});

// --- the footer wordmark ---
//
// Drawn over the rendered image rather than instead of it: the CSS blends it
// with `overlay`, so the render keeps its own look and the metal only moves
// light along the letters (see .footer-metal in main.css for why).
//
// The shape is the render's own outline (every pixel at least half opaque),
// so the moving light follows exactly the render's letters. The settings are
// pushed well past Paper's default: hard edges, five reflections, a strong
// pull at the rims and heavy colour dispersion. Under an overlay blend that
// is what reads as highlights sliding along glass, rather than a grey wash.
document.addEventListener('DOMContentLoaded', () => {
  const mark = document.querySelector('#glass-mark');
  const stage = mark?.querySelector('.footer-metal');
  if (!stage || !paperShadersBase || !('IntersectionObserver' in window)) return;

  // With reduced motion the render alone is the answer - it is the designed
  // still version, and it costs no WebGL at all.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  whenNear([mark], '600px', async () => {
    const [{ ShaderMount, fragmentShader }, shape] = await Promise.all([
      loadLiquidMetal(),
      loadImage('/assets/images/footer-rawi-metal.png'),
    ]);

    try {
      new ShaderMount(stage, fragmentShader, liquidMetalUniforms(shape, {
        u_repetition: 5,
        u_softness: 0,
        u_contour: 1,
        u_distortion: 0.12,
        u_shiftRed: 0.75,
        u_shiftBlue: 0.75,
        u_angle: 90,
        // the box is wider than the artwork (2.9:1 against 2:1) and the image
        // fills it with object-fit: cover; this does the same
        u_fit: 2,
      }), undefined, 1, 0, 2, undefined, ['u_image']);

      requestAnimationFrame(() => mark.classList.add('is-metal'));
    } catch (err) {
      // no WebGL2: the render on its own, exactly as before
      stage.remove();
    }
  });
});

/* ---------------------------------------------------------------- *
 * Moving gradient behind the home page and the project pages
 *
 * Paper Shaders' mesh gradient, from the same library and folder as the
 * liquid chrome above: a set of colour points drift slowly over each other
 * and blend. Here they are blacks and graphites with two silver lights, so it
 * reads as the site's chrome seen out of focus rather than as colour.
 *
 * Each point colours the area nearest to it, so the more points there are,
 * the smaller each one's share. The first version had seven, two of them
 * silver, and every so often the two silvers drifted to the middle together
 * and washed the hero out in a big grey patch. Now there are ten (the most
 * the shader takes), eight of them near black, and the silvers are dimmer:
 * the light stays as smaller pools moving through the dark. Measured over ten
 * minutes of the animation, the most of the headline area ever lit up went
 * from 92% to 21%.
 *
 * It is fixed behind the whole page, so the page scrolls over it. Near the
 * end it fades out as the black footer comes up, so the footer never cuts
 * across it, and once it is fully gone it stops moving.
 *
 * It is only fetched once the page has finished loading and the browser is
 * idle, so the text is never kept waiting. Paper's mount stops drawing while
 * the tab is hidden. It fills the whole screen, so it is drawn at no more than
 * about 1.2 million pixels and stretched: a smooth gradient gains nothing
 * from more. Reduced motion gets one still frame. Without WebGL2 the page
 * stays plain black.
 * ---------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  const stage = document.querySelector('.page-gradient');
  if (!stage || !paperShadersBase) return;

  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SPEED = still ? 0 : 0.25;

  // [red, green, blue, opacity], 0 to 1
  const COLOURS = [
    [0, 0, 0, 1],
    [0.03, 0.035, 0.045, 1],
    [0.1, 0.115, 0.14, 1],     // graphite
    [0.25, 0.28, 0.32, 1],     // silver
    [0, 0, 0, 1],
    [0.02, 0.02, 0.025, 1],
    [0.2, 0.235, 0.27, 1],     // a cooler silver, the chrome's blue fringe
    [0, 0, 0, 1],
    [0.06, 0.07, 0.085, 1],
    [0, 0, 0, 1],
  ];

  const start = async () => {
    const [{ ShaderMount }, { meshGradientFragmentShader }] = await Promise.all([
      import(paperShadersBase + 'shader-mount.js'),
      import(paperShadersBase + 'shaders/mesh-gradient.js'),
    ]);

    // Paper's shader, with a dither added as its last step: every pixel is
    // nudged by less than one shade, differently from its neighbours. That is
    // far too small to see as noise, but it breaks up the faint stepped bands
    // a smooth dark gradient otherwise shows on an ordinary screen.
    const shader = meshGradientFragmentShader.replace(
      'fragColor = vec4(color, opacity);',
      'color += (hash21(gl_FragCoord.xy) - .5) * 1.5 / 255.;\n  fragColor = vec4(color, opacity);',
    );

    let mount;
    try {
      mount = new ShaderMount(stage, shader, {
        u_colors: COLOURS,
        u_colorsCount: COLOURS.length,
        u_distortion: 0.8,
        u_swirl: 0.15,
        // No grain. Drawn at reduced size and stretched, grain came out as
        // soft blotches that read as blurry noise.
        u_grainMixer: 0,
        u_grainOverlay: 0,
        // fill the screen edge to edge, like object-fit: cover
        u_fit: 2,
        u_scale: 1,
        u_rotation: 0,
        u_offsetX: 0,
        u_offsetY: 0,
        u_originX: 0.5,
        u_originY: 0.5,
        u_worldWidth: 0,
        u_worldHeight: 0,
      }, undefined, SPEED, 0, 1, 1.2e6);
    } catch (err) {
      // no WebGL2: the page stays plain black, exactly as before
      stage.replaceChildren();
      return;
    }

    requestAnimationFrame(() => stage.classList.add('is-ready'));

    // Fade out as the footer rises: whole until its top is past the bottom 5%
    // of the screen, gone by the time it reaches the middle.
    const footer = document.querySelector('.site-footer');
    if (!footer) return;
    let queued = false;
    let moving = true;
    const fade = () => {
      queued = false;
      const top = footer.getBoundingClientRect().top / window.innerHeight;
      const amount = Math.min(1, Math.max(0, (top - 0.45) / 0.5));
      stage.style.setProperty('--fade', amount.toFixed(3));
      // nothing to see, so nothing to draw
      if (moving !== amount > 0) {
        moving = amount > 0;
        mount.setSpeed(moving ? SPEED : 0);
      }
    };
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(fade);
    };
    fade();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
  };

  const begin = () => {
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 200));
    idle(() => start().catch(() => {}));
  };

  if (document.readyState === 'complete') begin();
  else window.addEventListener('load', begin, { once: true });
});

/* ---------------------------------------------------------------- *
 * Page minimap
 *
 * A small live overview of the whole page down the right hand side, with a
 * frame showing where the visitor is (styles in case-study.css). A page turns
 * it on with data-minimap on its case study; every case study has it.
 *
 * It is drawn from the page itself rather than from a screenshot, so it is
 * always up to date: every picture and video poster becomes a tiny thumbnail
 * at its own place, every heading and paragraph a grey bar, every panel an
 * outline. Across, it covers only the article column (the content), not the
 * whole window, so the content fills the map and the "you are here" frame
 * sits squarely on it rather than off to one side. Down, it runs from the top
 * of the page to the bottom of the Next project card; the contact section and
 * footer are not drawn. Pictures come from small ready made thumbnails (see
 * thumb below), about 100KB for a whole page.
 *
 * The map is a short window onto that drawing rather than the whole of it: the
 * drawing is longer than the map, and slides through it as the page scrolls,
 * at the same rate the page moves through its own length, so the top of the
 * page shows at the top and the end at the end, and the frame is always in
 * view.
 *
 * It slides in from the right as the page opens, while the Contents rail
 * slides in from the left (case-study.css), and back out once the
 * visitor has scrolled past the Next project card, so the contact section and
 * the footer have the page to themselves. Clicking it jumps
 * there; dragging scrubs through the page. It is sized to the room in
 * the right margin and left out when there is none (tablets, phones). It is
 * hidden from screen readers: the Contents rail is the way around for them.
 * ---------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  const page = document.querySelector('[data-minimap]');
  if (!page) return;

  const MAX_W = 48;         // px, the widest the map gets
  const MAX_H = 0.5;        // of the window's height, the tallest the map's window gets
  const GAP = 20;           // px kept clear of the content and of the window edge
  const content = page.querySelector('.case-main') || page;
  // where the map stops, and bows out: the Next project card, once its bottom
  // edge is this far up the window (the card has been seen)
  const end = page.querySelector('.case-next');
  const END_AT = 0.5;       // of the window's height from the top
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  const map = document.createElement('div');
  map.className = 'minimap';
  map.setAttribute('aria-hidden', 'true');
  // the card crops the drawing; the frame sits outside it so it can overhang
  const clip = document.createElement('div');
  clip.className = 'minimap-clip';
  const layer = document.createElement('div');
  layer.className = 'minimap-page';
  clip.append(layer);
  const view = document.createElement('div');
  view.className = 'minimap-view';
  map.append(clip, view);
  document.body.append(map);

  // what gets drawn, and as what
  const KINDS = [
    ['minimap-panel', '.case-feature, .case-next-link, .connect-border-wrap'],
    ['minimap-text', 'p, li, figcaption, .case-next-label, .case-next-title, .case-next-sub'],
    ['minimap-heading', 'h1, h2, h3, h4'],
    ['minimap-media', 'img, video'],
  ];
  // the fixed bars and menus are not part of the page's length
  const SKIP = 'header, .hamburger, .minimap, .page-gradient, .case-contents';
  // the type settings each line of text is drawn with, copied from the page
  const TYPE = ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing',
    'textTransform', 'textAlign', 'whiteSpace', 'color', 'fontVariantNumeric'];

  let scale = 0;
  let enabled = false;
  let ready = false;  // held off until the map has been drawn once off screen
  let endY = 0;       // where the drawing stops, in page pixels
  let slide = 0;      // how much longer the drawing is than the map, in map pixels

  // Each picture and clip has a tiny thumbnail (160px wide, a few KB) of the
  // same name in a thumbs/ folder beside it: for a clip, a frame from 40% of
  // the way through, since several recordings open on a blank screen. They
  // load straight away, so the map shows real pictures from the start rather
  // than grey, while the page itself still loads its full size pictures only
  // as they come into view. Anything without a thumbnail falls back to its
  // poster, or to its own picture once that has loaded on the page.
  const thumbUrl = (el) => {
    // a clip names its file on a <source>, or on the <video> itself
    const src = el.tagName === 'VIDEO'
      ? el.querySelector('source')?.getAttribute('src') || el.getAttribute('src')
      : el.getAttribute('src');
    return thumbFor(src);
  };

  const thumb = (el, block) => {
    const fallback = () => {
      if (el.tagName === 'VIDEO') {
        const poster = el.getAttribute('poster');
        if (poster) block.style.backgroundImage = `url("${new URL(poster, location.href)}")`;
        return;
      }
      const fill = () => { block.style.backgroundImage = `url("${el.currentSrc || el.src}")`; };
      if (el.complete && el.naturalWidth) fill();
      else el.addEventListener('load', fill, { once: true });
    };
    const small = thumbUrl(el);
    if (!small) return fallback();
    const probe = new Image();
    probe.onload = () => { block.style.backgroundImage = `url("${small}")`; };
    probe.onerror = fallback;
    probe.src = small;
  };

  // Text is drawn as itself: the same words at the same width in the same
  // type, then shrunk to the map's scale, so it wraps line for line as it
  // does on the page. Far too small to read, but the map shows real lines and
  // paragraph shapes rather than solid bars.
  const setText = (el, block, r) => {
    const cs = getComputedStyle(el);
    const words = document.createElement('span');
    words.className = 'minimap-words';
    for (const prop of TYPE) words.style[prop] = cs[prop];
    words.style.width = r.width + 'px';
    words.style.transform = `scale(${scale})`;
    words.textContent = el.textContent.replace(/\s+/g, ' ').trim();
    block.append(words);
  };

  const build = () => {
    // the rail's height, and how far the title sits below the top of the
    // hero, for the CSS that starts the title level with the rail
    const rail = page.querySelector('.case-contents');
    if (rail) page.style.setProperty('--rail-h', rail.offsetHeight + 'px');
    const hero = page.querySelector('.case-hero');
    const title = hero && hero.querySelector('.case-title');
    if (title) {
      // measured on screen, title against hero: they move together, so the
      // gap between them stays the same whatever the padding above them is
      const drop = title.getBoundingClientRect().top - hero.getBoundingClientRect().top;
      page.style.setProperty('--title-drop', Math.round(drop) + 'px');
    }

    const column = content.getBoundingClientRect();
    const left = column.left + window.scrollX;   // the map starts at the column's left edge
    const docW = column.width;
    endY = end
      ? end.getBoundingClientRect().bottom + window.scrollY + 24
      : document.documentElement.scrollHeight;
    // room for the map plus the frame's overhang on each side, between the
    // content (with a gap) and the map's own distance from the window edge
    const edge = parseFloat(getComputedStyle(map).right) || GAP;
    const room = window.innerWidth - column.right - GAP - edge - 16;
    const maxW = Math.min(MAX_W, room);
    enabled = maxW >= 32;
    map.hidden = !enabled;
    if (!enabled) return;

    // the drawing's size is set by the width; the map is a window onto it
    scale = maxW / docW;
    const drawH = endY * scale;
    const mapH = Math.min(drawH, window.innerHeight * MAX_H);
    slide = drawH - mapH;
    map.style.width = docW * scale + 'px';
    map.style.height = mapH + 'px';
    layer.style.height = drawH + 'px';
    view.style.height = Math.max(window.innerHeight * scale, 6) + 'px';

    const frag = document.createDocumentFragment();
    for (const [kind, selector] of KINDS) {
      document.querySelectorAll(selector).forEach((el) => {
        if (el.closest(SKIP) || el.closest('[hidden]')) return;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) return;
        if (r.top + window.scrollY > endY) return;   // below the end of the map
        const block = document.createElement('span');
        block.className = 'minimap-block ' + kind;
        block.style.left = (r.left + window.scrollX - left) * scale + 'px';
        block.style.top = (r.top + window.scrollY) * scale + 'px';
        block.style.width = Math.max(r.width * scale, 1) + 'px';
        block.style.height = Math.max(r.height * scale, 1) + 'px';
        if (kind === 'minimap-media') thumb(el, block);
        else if (kind !== 'minimap-panel') setText(el, block, r);
        frag.append(block);
      });
    }
    layer.replaceChildren(frag);
    sync();
  };

  // how far through the drawing to slide: 0 at the top of the page, all the
  // way once the end of the drawing reaches the bottom of the window
  const offset = () => {
    const travel = Math.max(1, endY - window.innerHeight);
    return Math.min(1, Math.max(0, window.scrollY / travel)) * slide;
  };

  const sync = () => {
    if (!enabled) return;
    const shift = offset();
    layer.style.transform = `translateY(${-shift}px)`;
    // held inside the map: near the end the window also shows the contact
    // section, which the map does not draw, so the frame rests at the bottom
    const room = map.clientHeight - view.offsetHeight;
    const top = Math.min(room, Math.max(0, window.scrollY * scale - shift));
    view.style.transform = `translateY(${top}px)`;
    const past = end && end.getBoundingClientRect().bottom < window.innerHeight * END_AT;
    map.classList.toggle('is-shown', ready && !past);
  };

  // redrawn whenever the page changes size, but not more than every 200ms
  let timer = 0;
  const rebuild = () => {
    clearTimeout(timer);
    timer = setTimeout(build, 200);
  };

  // jump to a point on the map, centring the window on it
  const jump = (clientY, smooth) => {
    const y = (clientY - map.getBoundingClientRect().top + offset()) / scale - window.innerHeight / 2;
    window.scrollTo({ top: Math.max(0, y), behavior: smooth && !reduce.matches ? 'smooth' : 'instant' });
  };

  let pressed = false;
  let dragged = false;
  map.addEventListener('pointerdown', (e) => {
    pressed = true;
    dragged = false;
    map.setPointerCapture(e.pointerId);
  });
  map.addEventListener('pointermove', (e) => {
    if (!pressed) return;
    dragged = true;
    jump(e.clientY, false);
  });
  map.addEventListener('pointerup', (e) => {
    if (pressed && !dragged) jump(e.clientY, true);
    pressed = false;
  });
  map.addEventListener('pointercancel', () => { pressed = false; });

  window.addEventListener('scroll', sync, { passive: true });
  window.addEventListener('resize', rebuild, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(rebuild).observe(document.body);
  document.fonts?.ready.then(rebuild);
  window.addEventListener('load', rebuild);
  // the content rises into place as the page opens (data-rise): redraw once
  // it has landed, since it was measured part way up
  page.addEventListener('animationend', rebuild);
  build();
  // Let go once the page's content has mostly risen into place, so the map
  // follows it in; the Contents rail slides in from the left at the same
  // moment (case-study.css, the same 0.9s). Only this first entrance waits: if
  // the map fades out at the end of the page, it comes back straight away.
  // (a little under 0.9s: this timer starts a moment later than the CSS one)
  const ENTER_AFTER = reduce.matches ? 0 : 780;   // ms
  setTimeout(() => requestAnimationFrame(() => {
    ready = true;
    sync();
  }), ENTER_AFTER);
});

/* ---------------------------------------------------------------- *
 * Click to view larger
 *
 * Every picture in a case study's content lifts a little when pointed at
 * (case-study.css) and, clicked, opens over the page, fitted whole inside the
 * window so there is nothing to scroll. A click anywhere in the viewer, the
 * close button or Escape goes back; the page underneath never moved.
 *
 * Two kinds of trigger. Links marked [data-zoom] point at the picture's own
 * file (and without JavaScript simply open it). Every other picture in the
 * content is picked up here, so a new one needs nothing in its markup; the Next
 * project thumbnail is left alone (the whole card is already a link), as is
 * anything else inside a link. Keyboard users reach the pictures with Tab and
 * open them with Enter or Space.
 * ---------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  const links = [...document.querySelectorAll('a[data-zoom]')];
  const pictures = [...document.querySelectorAll('.case-main figure img')]
    .filter((img) => !img.closest('a, .case-next'));
  if ((!links.length && !pictures.length) || typeof HTMLDialogElement !== 'function') return;

  const box = document.createElement('dialog');
  box.className = 'zoom-box';
  box.setAttribute('aria-label', 'Picture viewer');
  box.innerHTML =
    '<button class="zoom-close" type="button" aria-label="Close">&times;</button>' +
    '<div class="zoom-scroll"><img class="zoom-img" alt=""></div>';
  document.body.append(box);

  const img = box.querySelector('.zoom-img');

  const open = (src, alt) => {
    img.src = src;
    img.alt = alt || '';
    box.showModal();
    // the viewer sits above everything else on the page, the ring-and-dot
    // cursor included, so the cursor moves inside it while it is open
    box.append(...document.querySelectorAll('.cursor-dot, .cursor-ring'));
    document.documentElement.style.overflow = 'hidden';
    // a frame later, so the fade and the settle actually play
    requestAnimationFrame(() => box.classList.add('is-in'));
  };

  // hand the page its scroll back; safe to run twice
  const release = () => {
    box.classList.remove('is-in');
    document.body.append(...box.querySelectorAll('.cursor-dot, .cursor-ring'));
    document.documentElement.style.overflow = '';
  };

  const shut = () => {
    if (box.open) box.close();
    release();
  };

  links.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      open(link.getAttribute('href'), link.querySelector('img')?.alt);
    });
  });

  pictures.forEach((pic) => {
    pic.classList.add('zoom-pic');
    pic.tabIndex = 0;
    pic.setAttribute('role', 'button');
    pic.setAttribute('aria-label', 'View larger: ' + (pic.alt || 'picture'));
    const show = () => open(pic.currentSrc || pic.src, pic.alt);
    pic.addEventListener('click', show);
    pic.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        show();
      }
    });
  });

  box.querySelector('.zoom-close').addEventListener('click', shut);
  // a click anywhere in the viewer, the picture included, closes it
  box.addEventListener('click', shut);
  // Escape closes the dialog by itself; this catches that path
  box.addEventListener('close', release);
});

/* ---------------------------------------------------------------- *
 * Header links roll on hover
 *
 * Each header link's word goes in twice, one copy under the other, so
 * pointing at it can push the first up and slide the second into its place
 * (the movement is in global.css). The second copy is hidden from screen
 * readers, so the link still reads once. Without JavaScript the links are
 * plain words, metal on hover as before.
 * ---------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.desktop-header nav a').forEach((link) => {
    const word = link.textContent.trim();
    if (!word) return;
    const roll = document.createElement('span');
    roll.className = 'nav-roll';
    const first = document.createElement('span');
    first.textContent = word;
    const second = document.createElement('span');
    second.textContent = word;
    second.setAttribute('aria-hidden', 'true');
    roll.append(first, second);
    link.replaceChildren(roll);
    link.classList.add('has-roll');
  });
});

/* ---------------------------------------------------------------- *
 * The page you are on, lit up in the menus
 *
 * Marks the header link and the phone menu link for the current section
 * with aria-current, which global.css lights up. The home page, the
 * projects page and every case study count as Projects; Resume and About
 * are their own pages. In the phone menu only the Navigate group is marked,
 * not the Resume link further down under Contact.
 * ---------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  const path = location.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
  let section = null;
  if (path === '/' || path === '/projects' || document.querySelector('.case-study')) section = 'projects';
  else if (path === '/resume') section = 'resume';
  else if (path === '/about') section = 'about';
  if (!section) return;

  const matches = (link) => {
    const href = link.getAttribute('href') || '';
    if (section === 'projects') return href === '/';
    return href.replace(/^\//, '') === section + '.html';
  };

  // the phone menu's Navigate group: the links before the second group label
  const navigate = [];
  const labels = document.querySelectorAll('.links-container .sidebar-label');
  for (let el = labels[0]?.nextElementSibling; el && el !== labels[1]; el = el.nextElementSibling) {
    if (el.tagName === 'A') navigate.push(el);
  }

  [...document.querySelectorAll('.desktop-header nav a'), ...navigate].forEach((link) => {
    if (matches(link)) link.setAttribute('aria-current', 'page');
  });
});

/* ---------------------------------------------------------------- *
 * Footer sweep
 *
 * The footer's text lights up the way the About page's does: every word starts
 * dim and a little low, then pops up to full, one after another, so the light
 * sweeps across the footer from the first column (Index) to the last
 * (© 2026), top to bottom within each. The About page ties its sweep to the
 * scroll, but the footer is the end of the page and can't scroll far enough
 * up to finish one, so this one plays by itself once the footer is in view.
 * It resets once the footer is off screen, to play again next time.
 *
 * Words are wrapped here, so without JavaScript the footer is plain text. The
 * clock is kept whole, since its time is rewritten every minute.
 * ---------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  const bar = document.querySelector('.footer-bar');
  if (!bar || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;

  const STEP = 35; // ms between one word and the next

  const parts = [];
  const wrapWords = (el) => {
    for (const node of [...el.childNodes]) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        // an icon, flag or arrow inside a line lights in its turn
        node.classList.add('sweep-part');
        parts.push(node);
        continue;
      }
      if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) continue;
      // the words of a run of text stay in one wrapper, so a line laid out as a
      // flex row (back to top, the flag and the city) keeps them as one item
      // rather than spacing every word apart
      const frag = document.createElement('span');
      frag.className = 'sweep-text';
      for (const chunk of node.textContent.trim().split(/(\s+)/)) {
        if (!chunk) continue;
        if (/^\s+$/.test(chunk)) { frag.append(' '); continue; }
        const word = document.createElement('span');
        word.className = 'sweep-part sweep-word';
        word.textContent = chunk;
        frag.append(word);
        parts.push(word);
      }
      // spaces either side of the text stay where they were, outside the
      // wrapper: the one before the city is what sets it off from the flag
      const text = node.textContent;
      const before = text.match(/^\s*/)[0], after = text.match(/\s*$/)[0];
      node.replaceWith(...[before && ' ', frag, after && ' '].filter(Boolean));
    }
  };

  // column by column, and line by line within each, which is source order
  bar.querySelectorAll('.footer-col').forEach((col) => {
    [...col.children].forEach((line) => {
      if (line.classList.contains('footer-clock')) {
        line.classList.add('sweep-part');
        parts.push(line);
      } else {
        wrapWords(line);
      }
    });
  });

  parts.forEach((part, i) => part.style.setProperty('--sweep-delay', i * STEP + 'ms'));
  bar.classList.add('sweep-ready');

  new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.intersectionRatio >= 0.4) bar.classList.add('is-lit');
      else if (!entry.isIntersecting && entry.boundingClientRect.top > 0) bar.classList.remove('is-lit');
    });
  }, { threshold: [0, 0.4] }).observe(bar);
});

/* ---------------------------------------------------------------- *
 * Slide viewer
 *
 * Any element marked [data-slides] whose children are <figure>s, one per
 * slide, becomes a viewer: one slide at a time, Previous and Next buttons, a
 * "3 / 29" counter, and a row of small thumbnails that jump to a slide. The
 * arrow keys move it while it has focus, and a sideways swipe moves it on a
 * touch screen. At the first and last slide the matching button is turned off
 * rather than wrapping round. Without JavaScript the figures simply stack.
 *
 * data-slides-autoplay="6" also moves it on by itself every 6 seconds, and
 * from the last slide back to the first. It holds while someone is using it
 * (pressing, typing or moving the pointer on it) and plays again once they
 * have been idle for 2 seconds; it also holds while off screen and while the
 * tab is hidden, and any move by hand starts the time again. With reduced
 * motion asked for it doesn't move by itself at all.
 *
 * Slides load lazily: only the one on show, plus the one either side so the
 * next press is instant. Until a slide arrives, its thumbnail (thumbFor, the
 * same tiny previews the minimap uses) is stretched behind it. A slide fades
 * in when it changes, unless reduced motion is asked for (case-study.css).
 *
 * Built straight away rather than when the page is ready, so the stack of
 * figures is gathered into one before the page is first drawn.
 * ---------------------------------------------------------------- */
(() => {
  const still = window.matchMedia('(prefers-reduced-motion: reduce)');
  const make = (tag, className) => Object.assign(document.createElement(tag), { className });

  // the site's short tailed arrow (as on the Resume button), pointing either way
  const arrow = (back) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 10 10');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', back ? 'M8.5 5h-7M4.5 2l-3 3 3 3' : 'M1.5 5h7M5.5 2l3 3-3 3');
    svg.append(path);
    return svg;
  };

  const init = (root) => {
    const slides = [...root.children].filter((el) => el.tagName === 'FIGURE');
    const total = slides.length;
    if (total < 2) return;

    root.setAttribute('role', 'region');
    root.setAttribute('aria-roledescription', 'carousel');
    root.tabIndex = 0;

    const stage = make('div', 'slides-stage');
    slides[0].before(stage);
    stage.append(...slides);

    slides.forEach((slide, i) => {
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-roledescription', 'slide');
      slide.setAttribute('aria-label', `${i + 1} of ${total}`);
      const img = slide.querySelector('img');
      const small = img && thumbFor(img.getAttribute('src'));
      if (small) img.style.backgroundImage = `url("${small}")`;
    });

    const bar = make('div', 'slides-bar');
    const prev = make('button', 'slides-btn');
    prev.type = 'button';
    prev.setAttribute('aria-label', 'Previous slide');
    prev.append(arrow(true));
    const next = make('button', 'slides-btn');
    next.type = 'button';
    next.setAttribute('aria-label', 'Next slide');
    next.append(arrow(false));
    const count = make('p', 'slides-count');
    count.setAttribute('aria-live', 'polite');
    bar.append(prev, count, next);

    const strip = make('div', 'slides-thumbs');
    const thumbs = slides.map((slide, i) => {
      const button = make('button', 'slides-thumb');
      button.type = 'button';
      button.setAttribute('aria-label', `Go to slide ${i + 1}`);
      const src = slide.querySelector('img')?.getAttribute('src');
      const picture = Object.assign(document.createElement('img'), {
        src: thumbFor(src) || src, alt: '', loading: 'lazy', decoding: 'async',
      });
      picture.width = 160;
      picture.height = 90;
      button.append(picture);
      button.addEventListener('click', () => show(i));
      strip.append(button);
      return button;
    });

    root.append(bar, strip);

    // Autoplay. The time is kept by a CSS animation on an unseen element
    // (case-study.css, .slides-timer): when it finishes the slide moves on, and
    // holding it is just pausing the animation, which resumes where it was.
    const seconds = parseFloat(root.dataset.slidesAutoplay);
    let playing = false;
    let restart = () => {};
    if (seconds > 0 && !still.matches) {
      root.style.setProperty('--slide-time', seconds + 's');
      const timer = make('div', 'slides-timer');
      timer.setAttribute('aria-hidden', 'true');
      const fill = make('span', '');
      timer.append(fill);
      stage.after(timer);

      restart = () => {
        fill.style.animation = 'none';
        void fill.offsetWidth; // let the browser see it stop, so it starts over
        fill.style.animation = '';
      };

      fill.addEventListener('animationend', () => {
        if (!playing) return;
        show(index === total - 1 ? 0 : index + 1);
      });

      // Reasons to hold: someone using it, off screen, the tab hidden. Using
      // it is any press, key or pointer movement on it; once they have been
      // idle for IDLE it plays again, even with the pointer still resting
      // over it.
      const IDLE = 2000;
      const hold = { busy: false, away: true, hidden: document.hidden };
      const update = () => root.classList.toggle('is-held', Object.values(hold).some(Boolean));
      let quiet = 0;
      const busy = () => {
        hold.busy = true;
        update();
        clearTimeout(quiet);
        quiet = setTimeout(() => { hold.busy = false; update(); }, IDLE);
      };
      for (const type of ['pointerdown', 'pointermove', 'keydown']) {
        root.addEventListener(type, busy, { passive: true });
      }
      document.addEventListener('visibilitychange', () => { hold.hidden = document.hidden; update(); });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
          hold.away = !entries[0].isIntersecting;
          update();
        }, { threshold: 0.5 }).observe(stage);
      } else {
        hold.away = false;
      }
      update();
      playing = true;
      root.classList.add('is-playing');
    }

    // Fetch a slide now rather than when it is shown, but only once the viewer
    // is close to the screen: until then nothing is fetched at all, and the
    // slide on show loads by itself, lazily, as it scrolls into view.
    let near = false;
    const warm = (i) => {
      const img = near && slides[i]?.querySelector('img');
      if (img && img.loading === 'lazy') img.loading = 'eager';
    };
    if ('IntersectionObserver' in window) {
      const watch = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        near = true;
        watch.disconnect();
        warm(index);
        warm(index - 1);
        warm(index + 1);
      }, { rootMargin: '600px 0px' });
      watch.observe(root);
    } else {
      near = true;
    }

    let index = -1;
    const show = (i, moved = true) => {
      i = Math.max(0, Math.min(total - 1, i));
      if (i === index) return;
      index = i;
      // a move by hand, or the timer's own, starts the time over
      restart();
      slides.forEach((slide, k) => { slide.hidden = k !== i; });
      warm(i);
      warm(i - 1);
      warm(i + 1);

      count.innerHTML = `<span class="slides-sr">Slide </span>${i + 1}<span aria-hidden="true"> / </span>` +
        `<span class="slides-sr"> of </span>${total}`;

      // a button that has just been turned off can't keep focus, so the
      // viewer takes it, and the arrow keys carry on working
      const focused = document.activeElement;
      prev.disabled = i === 0;
      next.disabled = i === total - 1;
      if (focused && focused.disabled) root.focus({ preventScroll: true });

      thumbs.forEach((button, k) => button.setAttribute('aria-current', k === i ? 'true' : 'false'));
      // bring the thumbnail into the middle of its row without moving the page
      const active = thumbs[i];
      strip.scrollTo({
        left: active.offsetLeft - (strip.clientWidth - active.offsetWidth) / 2,
        behavior: moved && !still.matches ? 'smooth' : 'auto',
      });
    };

    prev.addEventListener('click', () => show(index - 1));
    next.addEventListener('click', () => show(index + 1));

    root.addEventListener('keydown', (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const to = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: total - 1 }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      show(to);
    });

    // A sideways swipe on a touch screen. Up and down still scroll the page
    // (touch-action in the CSS). A swipe that ends on a slide would otherwise
    // count as a tap and open the picture viewer, so that tap is swallowed.
    let startX = null;
    let startY = 0;
    let swiped = false;
    stage.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') return;
      startX = e.clientX;
      startY = e.clientY;
      swiped = false;
    });
    stage.addEventListener('pointercancel', () => { startX = null; });
    stage.addEventListener('pointerup', (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      startX = null;
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      swiped = true;
      show(index + (dx < 0 ? 1 : -1));
    });
    stage.addEventListener('click', (e) => {
      if (!swiped) return;
      swiped = false;
      e.preventDefault();
      e.stopPropagation();
    }, true);

    show(0, false);
    root.classList.add('is-ready');
  };

  document.querySelectorAll('[data-slides]').forEach(init);
})();

/* ---------------------------------------------------------------- *
 * Blur trail on pictures
 *
 * Moving the pointer across a picture in a case study leaves a short motion
 * blur behind it, smeared the way the pointer went, longer the faster it
 * went, fading in about a third of a second. Taken from the way
 * mariavasilyeva.com draws its pictures.
 *
 * One WebGL canvas does it for every picture: it is laid over whichever one
 * the pointer is on and draws that picture again, blurred along the trail,
 * only while there is a trail to see; otherwise it is hidden and the picture
 * underneath is the page as usual. It never takes the pointer, so hovering,
 * the hover zoom and clicking to view larger all still reach the picture,
 * and it copies the picture's zoom and clip each frame so the two stay in
 * line. Not on touch screens (no pointer to trail), and not for visitors who
 * have asked for less motion.
 * ---------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  if (BLUR_EVERYWHERE) return;

  const PICTURES = '.case-main figure img';
  const POINTS = 20;      // trail points kept
  const LIFE = 520;       // ms for a point to fade to almost nothing
  const RADIUS = 26;      // css px the blur reaches either side of the trail
  const STRETCH = 0.9;    // blur length per px the pointer moved in a frame
  const LONGEST = 48;     // css px, the longest blur

  const canvas = document.createElement('canvas');
  canvas.className = 'blur-trail';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
  if (!gl) return;

  const vert = `
    attribute vec2 pos;
    varying vec2 vUv;
    void main() { vUv = pos * 0.5 + 0.5; gl_Position = vec4(pos, 0.0, 1.0); }`;
  const frag = `
    precision highp float;
    uniform sampler2D tex;
    uniform vec2 res;          // canvas size in px
    uniform vec4 fit;          // box uv -> picture uv: scale (xy), offset (zw)
    uniform vec4 pts[${POINTS}];   // x, y, push x, push y (px, y from the top)
    uniform float str[${POINTS}];  // how strong each point still is
    uniform float radius;
    varying vec2 vUv;

    vec4 pic(vec2 uv) {        // uv from the top left of the box
      vec2 t = uv * fit.xy + fit.zw;
      if (t.x < 0.0 || t.y < 0.0 || t.x > 1.0 || t.y > 1.0) return vec4(0.0);
      // a picture uploads top row first, so its uv already runs from the top
      return texture2D(tex, t);
    }

    void main() {
      vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
      vec2 p = uv * res;
      vec2 push = vec2(0.0);
      float w = 0.0;
      for (int i = 0; i < ${POINTS}; i++) {
        vec2 d = p - pts[i].xy;
        float f = str[i] * exp(-dot(d, d) / (radius * radius));
        push += pts[i].zw * f;
        w += f;
      }
      vec4 still = pic(uv);
      w = clamp(w, 0.0, 1.0);
      if (w < 0.004) { gl_FragColor = still; return; }
      // smear along the way the pointer went, heaviest in the middle
      vec2 stepUv = push / max(w, 0.0001) / res;
      vec4 sum = vec4(0.0);
      float total = 0.0;
      for (int k = 0; k < 14; k++) {
        float t = (float(k) + 0.5) / 14.0 * 2.0 - 1.0;
        float fall = 1.0 - abs(t);
        sum += pic(uv - stepUv * t) * fall;
        total += fall;
      }
      gl_FragColor = mix(still, sum / total, w);
    }`;

  const shader = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  };
  const vs = shader(gl.VERTEX_SHADER, vert);
  const fs = shader(gl.FRAGMENT_SHADER, frag);
  if (!vs || !fs) return;
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  gl.useProgram(program);

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const posLoc = gl.getAttribLocation(program, 'pos');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const u = (name) => gl.getUniformLocation(program, name);
  const uRes = u('res'), uFit = u('fit'), uPts = u('pts'), uStr = u('str'), uRadius = u('radius');

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

  document.body.append(canvas);

  let img = null;          // the picture the canvas is over
  let over = false;        // the pointer is on it
  let trail = [];          // {x, y, px, py, t}: css px from the box's top left
  let last = null;
  let running = false;
  const pts = new Float32Array(POINTS * 4);
  const str = new Float32Array(POINTS);

  // where the picture's own pixels sit in its box, for object-fit contain or
  // cover (and plain, where they fill it)
  const fitFor = (el, w, h) => {
    const nw = el.naturalWidth, nh = el.naturalHeight;
    const cs = getComputedStyle(el);
    if (!nw || !nh || cs.objectFit === 'fill' || !cs.objectFit) return [1, 1, 0, 0];
    const s = cs.objectFit === 'cover' ? Math.max(w / nw, h / nh) : Math.min(w / nw, h / nh);
    const dw = nw * s, dh = nh * s;
    const [ax, ay] = cs.objectPosition.split(' ').map((v) => parseFloat(v) / 100);
    const ox = (w - dw) * (isNaN(ax) ? 0.5 : ax);
    const oy = (h - dh) * (isNaN(ay) ? 0.5 : ay);
    return [w / dw, h / dh, -ox / dw, -oy / dh];
  };

  const take = (el) => {
    if (!el.complete || !el.naturalWidth) return false;
    img = el;
    trail = [];
    last = null;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, el);
    } catch {
      img = null;
      return false;
    }
    return true;
  };

  const frame = (now) => {
    if (!img) { running = false; return; }
    // keep only the points still worth drawing
    trail = trail.filter((p) => now - p.t < LIFE * 2).slice(-POINTS);
    const alive = trail.length > 0;
    if (!alive && !over) {
      canvas.classList.remove('is-on');
      running = false;
      return;
    }

    // sit exactly over the picture, zoom and clip included
    const r = img.getBoundingClientRect();
    const cs = getComputedStyle(img);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cw = Math.round(r.width * dpr), ch = Math.round(r.height * dpr);
    if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }
    Object.assign(canvas.style, {
      left: r.left + window.scrollX + 'px', top: r.top + window.scrollY + 'px',
      width: r.width + 'px', height: r.height + 'px',
      clipPath: cs.clipPath === 'none' ? '' : cs.clipPath, borderRadius: cs.borderRadius,
    });

    // the trail, measured against the picture's unzoomed box, scaled to the canvas
    const zoom = img.offsetWidth ? r.width / img.offsetWidth : 1;
    str.fill(0);
    pts.fill(0);
    trail.forEach((p, i) => {
      const fade = Math.exp(-(now - p.t) / (LIFE / 3));
      let px = p.px * STRETCH, py = p.py * STRETCH;
      const len = Math.hypot(px, py);
      if (len > LONGEST) { px *= LONGEST / len; py *= LONGEST / len; }
      pts.set([p.x * zoom * dpr, p.y * zoom * dpr, px * zoom * dpr, py * zoom * dpr], i * 4);
      str[i] = fade * Math.min(1, len / 6);
    });

    gl.viewport(0, 0, cw, ch);
    gl.disable(gl.SCISSOR_TEST);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    // Draw only the box around the trail: the rest of the canvas stays clear
    // and the picture underneath shows as it is, so the work each frame is a
    // small patch rather than the whole picture.
    if (alive) {
      const reach = (RADIUS + LONGEST) * zoom * dpr;
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (let i = 0; i < trail.length; i++) {
        if (str[i] < 0.01) continue;
        x0 = Math.min(x0, pts[i * 4]); x1 = Math.max(x1, pts[i * 4]);
        y0 = Math.min(y0, pts[i * 4 + 1]); y1 = Math.max(y1, pts[i * 4 + 1]);
      }
      if (x0 === Infinity) {
        canvas.classList.remove('is-on');
        requestAnimationFrame(frame);
        return;
      }
      const sx = Math.max(0, Math.floor(x0 - reach)), sy = Math.max(0, Math.floor(y0 - reach));
      const ex = Math.min(cw, Math.ceil(x1 + reach)), ey = Math.min(ch, Math.ceil(y1 + reach));
      gl.enable(gl.SCISSOR_TEST);
      // scissor counts from the bottom of the canvas, the trail from the top
      gl.scissor(sx, ch - ey, Math.max(0, ex - sx), Math.max(0, ey - sy));
    }
    gl.uniform2f(uRes, cw, ch);
    gl.uniform4fv(uFit, fitFor(img, img.offsetWidth, img.offsetHeight));
    gl.uniform4fv(uPts, pts);
    gl.uniform1fv(uStr, str);
    gl.uniform1f(uRadius, RADIUS * zoom * dpr);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    canvas.classList.toggle('is-on', alive);
    requestAnimationFrame(frame);
  };

  const run = () => {
    if (running) return;
    running = true;
    requestAnimationFrame(frame);
  };

  document.addEventListener('pointerover', (e) => {
    const el = e.target.closest && e.target.closest(PICTURES);
    if (!el || el === img) { over = !!el; return; }
    over = take(el);
    if (over) run();
  });
  document.addEventListener('pointerout', (e) => {
    if (img && e.target === img && !img.contains(e.relatedTarget)) over = false;
  });
  document.addEventListener('pointermove', (e) => {
    if (!over || !img || e.pointerType !== 'mouse') return;
    const r = img.getBoundingClientRect();
    const zoom = img.offsetWidth ? r.width / img.offsetWidth : 1;
    const x = (e.clientX - r.left) / zoom;
    const y = (e.clientY - r.top) / zoom;
    if (last) trail.push({ x, y, px: x - last.x, py: y - last.y, t: performance.now() });
    last = { x, y };
    run();
  }, { passive: true });
});

/* ---------------------------------------------------------------- *
 * Blur trail on the project cards
 *
 * The same idea as the blur trail on case study pictures, for the cards on
 * the home and projects pages. A card isn't one flat picture (some are built
 * from layers, one is a grid of nine clips, most turn into a clip on hover),
 * so it isn't redrawn; instead small spots blur whatever is under them
 * (backdrop-filter, global.css) and fade. On the black page around the cards
 * there is nothing to blur, so they only show on the picture, and they stay
 * inside it.
 *
 * Two things keep it smooth and shapeless. A follower glides after the
 * pointer every frame, and spots are laid every few px along its path, so the
 * trail is one stroke rather than a string of beads. And each spot blurs only
 * a little but they overlap heavily: the middle of the stroke, under many of
 * them, comes out properly blurred, while its edges, under one or two, barely
 * change, so the blur fades out rather than ending in a ring. (Feathering one
 * strong spot with a mask would be simpler, but Chrome then drops the blur.)
 * Not on touch screens, and not for visitors who have asked for less motion.
 * ---------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  if (BLUR_EVERYWHERE) return;

  const SPACING = 9;    // css px between spots along the path
  const FOLLOW = 0.6;   // how much of the way to the pointer the follower goes each frame
  const MOST = 32;      // spots on a card at once (with SPACING, how long the trail can get)

  document.querySelectorAll('.project-card .project-image-wrapper').forEach((wrap) => {
    const card = wrap.closest('.project-card');
    const layer = document.createElement('span');
    layer.className = 'card-trail';
    layer.setAttribute('aria-hidden', 'true');
    wrap.append(layer);

    let aim = null;     // where the pointer is, in the picture
    let at = null;      // where the follower is
    let laid = null;    // where the last spot went
    let running = false;

    const spot = (x, y) => {
      const el = document.createElement('i');
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.addEventListener('animationend', () => el.remove(), { once: true });
      layer.append(el);
      while (layer.children.length > MOST) layer.firstElementChild.remove();
    };

    const frame = () => {
      if (!aim) { running = false; return; }
      at = at ? { x: at.x + (aim.x - at.x) * FOLLOW, y: at.y + (aim.y - at.y) * FOLLOW } : { ...aim };
      if (!laid) { laid = { ...at }; spot(at.x, at.y); }
      // fill the way from the last spot to here, a spot every SPACING px
      let dx = at.x - laid.x, dy = at.y - laid.y;
      let gap = Math.hypot(dx, dy);
      while (gap >= SPACING) {
        laid = { x: laid.x + dx / gap * SPACING, y: laid.y + dy / gap * SPACING };
        spot(laid.x, laid.y);
        dx = at.x - laid.x; dy = at.y - laid.y;
        gap = Math.hypot(dx, dy);
      }
      // keep going while the follower is still catching up
      if (Math.hypot(aim.x - at.x, aim.y - at.y) > 0.5) requestAnimationFrame(frame);
      else running = false;
    };

    card.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      // The card grows a little on hover (transform: scale), so its box on
      // screen is bigger than the layout the spots are placed in: measure
      // against the grown box and scale back, or the trail drifts off the
      // pointer the further it is from the middle.
      const r = wrap.getBoundingClientRect();
      const zoom = wrap.offsetWidth ? r.width / wrap.offsetWidth : 1;
      const x = (e.clientX - r.left) / zoom;
      const y = (e.clientY - r.top) / zoom;
      if (x < 0 || y < 0 || x > wrap.offsetWidth || y > wrap.offsetHeight) { aim = at = laid = null; return; }
      aim = { x, y };
      if (!running) { running = true; requestAnimationFrame(frame); }
    }, { passive: true });

    card.addEventListener('pointerleave', () => { aim = at = laid = null; });
  });
});

/* ---------------------------------------------------------------- *
 * Blur trail everywhere (trial, BLUR_EVERYWHERE near the top)
 *
 * The project cards' trail, over the whole page: a follower glides after the
 * pointer and lays small spots along its path, each blurring whatever is
 * under it a little (backdrop-filter, global.css), overlapping so the middle
 * of the stroke blurs properly and its edges fade. Text, pictures, cards and
 * the header all smear as it passes; on the plain black page there is nothing
 * to blur, so it shows only where it crosses something. It sits under the
 * cursor's dot and ring. Not on touch screens, and not for visitors who have
 * asked for less motion.
 * ---------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  if (!BLUR_EVERYWHERE) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const SPACING = 9;    // px between spots along the path
  const FOLLOW = 0.6;   // how much of the way to the pointer the follower goes each frame
  const MOST = 32;      // spots on screen at once

  const layer = document.createElement('div');
  layer.className = 'page-trail';
  layer.setAttribute('aria-hidden', 'true');
  document.body.append(layer);

  let aim = null;
  let at = null;
  let laid = null;
  let running = false;

  const spot = (x, y) => {
    const el = document.createElement('i');
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.addEventListener('animationend', () => el.remove(), { once: true });
    layer.append(el);
    while (layer.children.length > MOST) layer.firstElementChild.remove();
  };

  const frame = () => {
    if (!aim) { running = false; return; }
    at = at ? { x: at.x + (aim.x - at.x) * FOLLOW, y: at.y + (aim.y - at.y) * FOLLOW } : { ...aim };
    if (!laid) { laid = { ...at }; spot(at.x, at.y); }
    let dx = at.x - laid.x, dy = at.y - laid.y;
    let gap = Math.hypot(dx, dy);
    while (gap >= SPACING) {
      laid = { x: laid.x + dx / gap * SPACING, y: laid.y + dy / gap * SPACING };
      spot(laid.x, laid.y);
      dx = at.x - laid.x; dy = at.y - laid.y;
      gap = Math.hypot(dx, dy);
    }
    if (Math.hypot(aim.x - at.x, aim.y - at.y) > 0.5) requestAnimationFrame(frame);
    else running = false;
  };

  document.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    aim = { x: e.clientX, y: e.clientY };
    if (!running) { running = true; requestAnimationFrame(frame); }
  }, { passive: true });

  // leaving the window, or the page scrolling under a still pointer, starts
  // the trail afresh rather than drawing a line across the jump
  document.addEventListener('mouseleave', () => { aim = at = laid = null; });
  window.addEventListener('scroll', () => { at = laid = null; }, { passive: true });
});

/* ---------------------------------------------------------------- *
 * All projects (the home page, .reel)
 *
 * Every project's pictures in one thin row across the middle of the screen,
 * and a lens that travels along it from left to right as the page scrolls.
 * The pictures near the lens grow out of the row and scatter above and below
 * it, small and big, card over card with the biggest on top; as the lens
 * moves on they shrink back into their places in the row. The bar at the
 * bottom shows the number and name of the project under the lens, with a
 * link to it; on a phone just the name and the link. Clicking a picture opens
 * its project. The clips among them play only while they are on screen.
 *
 * The section is made as tall as the run, and its stage is pinned to the
 * window while it lasts. Adding a project to the markup is all it takes to
 * add it here. Without JavaScript, or with reduced motion, it stays the plain
 * strip of pictures the CSS draws.
 * ---------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  const reel = document.querySelector('.reel');
  if (!reel) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const STEP = 60;          // px scrolled to move the lens on by one picture
  const PROJECT_GAP = 0.5;  // extra steps between one project and the next
  const THUMB = 0.15;       // a picture's size in the row, of its full size
  const REACH = 9;          // how many pictures either side of the lens grow
  const SPACING = 0.15;     // how far apart grown pictures sit, of a card's height,
                            // so the spread always fits the cards and leaves no gaps
  const READY = REACH + 14; // how far ahead of the lens pictures are got ready
  const LEAD = 5;           // on a phone, how many pictures before the first one the
                            // lens starts, so only a few have begun to grow at first
  const phone = window.matchMedia('(max-width: 768px)');

  const projects = [...reel.querySelectorAll('.reel-project')];
  if (!projects.length) return;

  // a little give, the same every visit: a number from 0 to 1
  const rand = (a, b) => {
    const n = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
    return n - Math.floor(n);
  };

  // small, medium or big: mostly small, a few big
  const sizeOf = (pick, give) => {
    if (pick < 0.4) return 0.3 + give * 0.15;
    if (pick < 0.75) return 0.6 + give * 0.25;
    return 1 + give * 0.25;
  };

  let at = 0;
  const items = [];
  projects.forEach((project, p) => {
    [...project.querySelectorAll('img, video')].forEach((img, k) => {
      if (k === 0 && p > 0) at += PROJECT_GAP;
      const n = items.length;
      const aspect = (+img.getAttribute('width') || 16) / (+img.getAttribute('height') || 9);
      items.push({
        img,
        p,
        at,
        aspect,
        // where it sits when grown: a nudge across (of a card's height), above
        // or below the row in turn (of the screen's height), and how big it gets
        x: (rand(n, 1) - 0.5) * 0.8,
        y: (n % 2 ? 1 : -1) * (0.04 + rand(n, 2) * 0.3),
        size: sizeOf(rand(n, 3), rand(n, 4)),
      });
      img.addEventListener('click', () => { location.href = project.dataset.href; });
      at += 1;
    });
  });
  const last = at - 1;

  // the bar
  const stage = reel.querySelector('.reel-stage');
  const bar = document.createElement('div');
  bar.className = 'reel-bar';
  const count = Object.assign(document.createElement('span'), { className: 'reel-count' });
  const name = Object.assign(document.createElement('span'), { className: 'reel-name' });
  const link = Object.assign(document.createElement('a'), { className: 'reel-link' });
  link.append('View project');
  bar.append(count, name, link);
  stage.append(bar);

  // fetch the pictures a screen or two before the section arrives, so they
  // are there when the run starts rather than appearing during it
  if ('IntersectionObserver' in window) {
    const early = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      early.disconnect();
      items.forEach(({ img }) => {
        if (img.tagName === 'VIDEO') img.preload = 'auto';
        else img.loading = 'eager';
      });
    }, { rootMargin: '150% 0px' });
    early.observe(reel);
  }

  // the run is as long as the lens's trip, a little longer on a phone
  const leadIn = () => (phone.matches ? LEAD : 0);
  const setLength = () => {
    reel.style.setProperty('--reel-height', `calc(${Math.round((last + leadIn()) * STEP)}px + 100vh)`);
  };
  setLength();
  phone.addEventListener?.('change', setLength);
  reel.classList.add('is-live');

  let shown = -1;
  const label = (p) => {
    if (p === shown) return;
    shown = p;
    const project = projects[p];
    count.textContent = String(p + 1).padStart(2, '0');
    name.textContent = '▸ ' + project.dataset.name;
    link.href = project.dataset.href;
    link.setAttribute('aria-label', 'View project: ' + project.dataset.name);
  };

  const mix = (a, b, t) => a + (b - a) * t;

  const update = () => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    // a card's full height: a good share of the screen, and on a phone, where
    // the screen is narrow, a larger share of its width so cards stay readable
    const narrow = phone.matches;
    const tall = Math.min(H * 0.32, W * (narrow ? 0.5 : 0.38));
    const r = reel.getBoundingClientRect();
    const room = Math.max(1, r.height - H);
    const scrolled = Math.min(room, Math.max(0, -r.top));
    const onScreen = r.bottom > 0 && r.top < H;
    const progress = scrolled / room;

    // the row: each picture's middle, side by side at their small size, one
    // project running straight on into the next
    const thumbH = tall * THUMB;
    const space = thumbH * 0.08;
    let run = 0;
    for (const item of items) {
      const w = thumbH * item.aspect;
      item.row = run + w / 2;
      run += w + space;
    }

    // a place along the row, for any step, past either end too
    const first = items[0];
    const end = items[items.length - 1];
    const each = (end.row - first.row) / Math.max(1, end.at - first.at);
    const rowAt = (a) => {
      if (a <= first.at) return first.row + (a - first.at) * each;
      if (a >= end.at) return end.row + (a - end.at) * each;
      for (let i = 0; i < items.length - 1; i++) {
        const b = items[i + 1];
        if (a <= b.at) return mix(items[i].row, b.row, (a - items[i].at) / (b.at - items[i].at));
      }
      return end.row;
    };

    // the lens: where it is along the row, and where on the screen. The row
    // either side starts at its edges, from the pictures just out of reach.
    const lead = leadIn();
    const lens = progress * (last + lead) - lead;
    const leftEdge = rowAt(lens - REACH);
    const rightEdge = rowAt(lens + REACH);
    const half = REACH * SPACING * tall;
    // the lens crosses the screen from near one edge to near the other; on a
    // phone the cluster is wider than half the screen, so it is let run up
    // close to the edges rather than standing still in the middle
    const margin = Math.min(half, W * 0.25);
    const lensX = margin + progress * (W - 2 * margin);

    let under = 0;
    let nearest = Infinity;
    for (const item of items) {
      const k = item.at - lens;  // pictures from the lens, + to the right
      if (Math.abs(k) < nearest) { nearest = Math.abs(k); under = item.p; }
      // get a picture ready at full size a little before the lens reaches
      // it. In the row the browser only keeps a small copy, and a picture
      // that grows before its full copy is ready is left blank until it is,
      // which showed as a gap whenever a new project came in.
      if (Math.abs(k) < READY) {
        if (!item.ready && item.img.decode) {
          item.ready = true;
          item.img.decode().catch(() => {});
        }
      } else if (Math.abs(k) > READY * 2) {
        item.ready = false;
      }
      // full size near the lens, easing to 0 at REACH pictures away
      const t = Math.min(1, 1.5 * Math.max(0, 1 - Math.abs(k) / REACH));
      const grow = t * t * (3 - 2 * t);
      const fullW = tall * item.aspect;
      // never wider than about a third of the screen (most of it on a phone),
      // for the very wide ones
      const size = Math.min(item.size, (W * (narrow ? 0.6 : 0.3)) / fullW);
      const s = THUMB + (size - THUMB) * grow;
      // in the row, pushed aside by the lens; grown, spread across its width
      const inRow = k < 0
        ? lensX - half + (item.row - leftEdge)
        : lensX + half + (item.row - rightEdge);
      const grown = lensX + k * SPACING * tall + item.x * tall;
      const cx = mix(inRow, grown, grow);
      const w = fullW * s;
      const h = tall * s;
      // kept clear of the header at the top and the bar at the bottom
      const cy = Math.min(H - 80 - h / 2, Math.max(70 + h / 2, H / 2 + item.y * H * grow));
      // only what has changed is written: the size only when the screen
      // does, the stacking only when a card passes another. Cards off screen
      // are hidden rather than taken out, so they stay drawn and ready.
      const el = item.img;
      const isClip = el.tagName === 'VIDEO';
      const shown = onScreen && cx + w / 2 > 0 && cx - w / 2 < W;
      if (shown !== item.shown) {
        item.shown = shown;
        el.style.visibility = shown ? 'visible' : 'hidden';
      }
      if (!shown) {
        if (isClip && !el.paused) el.pause();
        continue;
      }
      if (tall !== item.tall) {
        item.tall = tall;
        el.style.width = `${fullW.toFixed(1)}px`;
        el.style.height = `${tall.toFixed(1)}px`;
      }
      const z = Math.round(s * 100);
      if (z !== item.z) {
        item.z = z;
        el.style.zIndex = String(z);
      }
      el.style.transform = `translate3d(${(cx - w / 2).toFixed(1)}px, ${(cy - h / 2).toFixed(1)}px, 0) scale(${s.toFixed(3)})`;
      // a clip plays whenever it is on screen, small in the row or grown
      if (isClip && el.paused) el.play().catch(() => {});
    }

    label(under);
  };

  let queued = false;
  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; update(); });
  };
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue, { passive: true });
  update();
});
