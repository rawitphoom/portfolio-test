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
