/* A GLB model that turns as the page scrolls past it.

   Scroll-driven rather than time-driven: the rotation is a pure function of
   where the stage sits in the viewport, so scrolling back up unwinds it. The
   rAF loop only exists to ease toward that target - reading scroll position
   straight into a transform on every scroll event looks jittery, because the
   events arrive faster and less evenly than frames do.

   Nothing loads until the stage is near the viewport, and the loop parks
   whenever it leaves or the tab goes to the background. */

import * as THREE from '../assets/vendor/three/three.module.min.js';
import { GLTFLoader } from '../assets/vendor/three/GLTFLoader.js';
import { RoomEnvironment } from '../assets/vendor/three/RoomEnvironment.js';

/* ----------------------------------------------------------------- knobs -- */

const TURNS = 3.2;    // full turns over one pass through the viewport. At the
                      // size this thing renders, barely more than a turn was
                      // hard to even notice.
const START = -0.1;   // rotation in turns when the stage first enters, so it
                      // is already at an angle rather than dead flat
const TILT = 0.12;    // how much it leans as it travels, in turns
const EASE = 6;       // how hard it chases the scroll position
const IDLE = 0.035;   // turns per second when nobody is scrolling, so it never
                      // reads as a still image
const FILL = 0.96;    // how much of the stage the model takes up. Near 1 now
                      // that the stage is only a few em across.

/* ------------------------------------------------------------------------- */

let app = null;

export function init(options = {}) {
    if (app) return app;

    const stage = document.querySelector('[data-model]');
    if (!stage) return null;

    const src = stage.dataset.model;
    const { dpr = Math.min(window.devicePixelRatio, 2) } = options;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch (e) {
        return null;   // no WebGL: the stage stays empty, the text still reads
    }
    renderer.setPixelRatio(dpr);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    stage.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 100);

    /* The headphones are anodised metal and fabric, so most of what you read as
       their shape is reflection. Without an environment they look like grey
       plastic. */
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.85;

    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(2, 3, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xbcd4ff, 0.7);
    rim.position.set(-3, 1, -2);
    scene.add(rim);

    const pivot = new THREE.Group();
    scene.add(pivot);

    let frame = 0;
    let visible = false;
    let ready = false;
    let radiusH = 1;   // half its height
    let radiusW = 1;   // its widest horizontal reach while turning
    let turn = START;      // eased
    let target = START;
    let idle = 0;          // accumulates on its own, independent of scroll
    let last = 0;

    /* -- how far through its pass the stage is: 0 entering, 1 leaving -- */

    function progress() {
        const r = stage.getBoundingClientRect();
        const span = window.innerHeight + r.height;
        if (span <= 0) return 0;
        return THREE.MathUtils.clamp((window.innerHeight - r.top) / span, 0, 1);
    }

    /* -- layout -- */

    function resize() {
        const w = stage.clientWidth;
        const h = stage.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        const fov = THREE.MathUtils.degToRad(camera.fov);
        /* Framed off the box rather than the bounding sphere. A sphere big
           enough to hold a pair of headphones is much larger than the
           headphones, which left them filling about a fifth of the frame.
           radiusW already accounts for the turn, so nothing clips mid-spin. */
        const forH = radiusH / Math.tan(fov / 2);
        const forW = radiusW / (Math.tan(fov / 2) * camera.aspect);
        camera.position.set(0, 0, Math.max(forH, forW) / FILL);
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
    }

    /* -- frame -- */

    function tick(now) {
        frame = requestAnimationFrame(tick);
        const dt = Math.max(0, Math.min((now - last) / 1000, 0.05));
        last = now;

        target = START + progress() * TURNS;
        turn += (target - turn) * (1 - Math.exp(-EASE * dt));
        idle += IDLE * dt;

        /* Scroll drives the bulk of it and unwinds when you go back up; the
           idle term only keeps it alive when the page is still. */
        const spin = turn + idle;
        pivot.rotation.y = spin * Math.PI * 2;
        pivot.rotation.x = Math.sin(spin * Math.PI * 2) * TILT;

        renderer.render(scene, camera);
    }

    function start() {
        if (frame || !ready) return;
        last = performance.now();
        frame = requestAnimationFrame(tick);
    }

    function stop() {
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
    }

    /* -- load -- */

    new GLTFLoader().load(src, (gltf) => {
        const root = gltf.scene;

        /* Centre it on the origin so it turns about its own middle, and note
           its bounding sphere so the camera can frame it without knowing
           anything about this particular model's scale. */
        root.updateWorldMatrix(true, true);
        const box = new THREE.Box3().setFromObject(root);
        const mid = box.getCenter(new THREE.Vector3());
        root.position.sub(mid);
        const size = box.getSize(new THREE.Vector3());
        radiusH = size.y / 2;
        /* it turns about Y, so its widest horizontal reach is the diagonal of
           the footprint, not whichever single side happens to face us */
        radiusW = Math.hypot(size.x / 2, size.z / 2);

        pivot.add(root);
        ready = true;
        stage.classList.add('is-ready');
        resize();

        if (reduced) {
            /* one static three-quarter view rather than a scroll-linked spin */
            turn = target = START;
            pivot.rotation.y = turn * Math.PI * 2;
            renderer.render(scene, camera);
            return;
        }
        if (visible) start();
    }, undefined, () => stage.classList.add('is-failed'));

    /* -- wiring -- */

    const io = new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
        if (visible && !reduced) start();
        else stop();
    }, { rootMargin: '200px 0px' });
    io.observe(stage);

    const onVisibility = () => {
        if (document.hidden) stop();
        else if (visible && !reduced) start();
    };
    document.addEventListener('visibilitychange', onVisibility);

    const ro = new ResizeObserver(resize);
    ro.observe(stage);

    app = {
        stage, scene, camera, renderer,
        destroy() {
            stop();
            io.disconnect();
            ro.disconnect();
            document.removeEventListener('visibilitychange', onVisibility);
            renderer.dispose();
            renderer.domElement.remove();
            app = null;
        }
    };
    return app;
}

export function destroy() {
    if (app) app.destroy();
}
