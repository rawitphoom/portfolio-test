/* ---------------------------------------------------------------- *
 * GSAP text test, About page only
 *
 * A try out of what GSAP (gsap.com) does with type, one different effect per
 * section so they can be compared:
 *
 *   1. "About Me": the letters rise one by one from behind the line.
 *   2. The intro paragraph: each line slides up from behind its own edge.
 *   3. "The path so far": the two entries slide in one after the other.
 *   4. The photo ring title: each word sharpens out of a blur, tied to the
 *      scroll, so scrolling back up runs it backwards.
 *
 * SplitText cuts the text into letters, words or lines and keeps an
 * aria-label of the whole sentence, so screen readers still read it as one.
 * Splitting waits for the web font, since lines measured in the fallback font
 * would break in the wrong places; with autoSplit the lines are cut again if
 * the window is resized. Reduced motion skips all of it and the text simply
 * shows.
 * ---------------------------------------------------------------- */
(() => {
  const root = document.documentElement;
  const done = () => root.classList.remove('gsap-text');

  if (!window.gsap || !window.SplitText || !window.ScrollTrigger
    || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    done();
    return;
  }

  gsap.registerPlugin(SplitText, ScrollTrigger);

  document.fonts.ready.then(() => {
    // 1. About Me: letters up from behind the line
    const heading = document.querySelector('.about-heading');
    if (heading) {
      SplitText.create(heading, {
        type: 'chars, lines',
        mask: 'lines',
        onSplit: (self) => gsap.from(self.chars, {
          yPercent: 115,
          rotate: 6,
          duration: 0.9,
          ease: 'expo.out',
          stagger: 0.04,
        }),
      });
    }

    // 2. the intro: line by line, each from behind its own edge
    const bio = document.querySelector('.about-bio p');
    if (bio) {
      SplitText.create(bio, {
        type: 'lines',
        mask: 'lines',
        autoSplit: true,
        onSplit: (self) => gsap.from(self.lines, {
          yPercent: 100,
          duration: 0.85,
          ease: 'power3.out',
          stagger: 0.09,
          delay: 0.3,
        }),
      });
    }

    // the hidden text can show now: it starts from the first frame of its animation
    done();

    // 3. The path so far: the entries slide in one after the other
    const entries = document.querySelectorAll('.about-path li');
    if (entries.length) {
      gsap.from(entries, {
        x: -28,
        autoAlpha: 0,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.15,
        scrollTrigger: { trigger: entries[0].parentElement, start: 'top 85%', once: true },
      });
    }

    // 4. the ring title: words out of a blur, scrubbed by the scroll
    const ringTitle = document.querySelector('.ring-title');
    if (ringTitle) {
      SplitText.create(ringTitle, {
        type: 'words',
        autoSplit: true,
        onSplit: (self) => gsap.fromTo(self.words,
          { opacity: 0.12, filter: 'blur(6px)' },
          {
            opacity: 1,
            filter: 'blur(0px)',
            ease: 'none',
            stagger: 0.1,
            scrollTrigger: { trigger: ringTitle, start: 'top 85%', end: 'top 35%', scrub: true },
          }),
      });
    }
  });
})();
