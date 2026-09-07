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
