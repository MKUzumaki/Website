(() => {
    const el = document.querySelector('.journey-slider');
    if (!el || typeof Swiper === 'undefined') return;

    const SCRAMBLE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#@&$%';
    const SCRAMBLE_TARGETS = [
        { sel: '.journey-year', delay: 50, duration: 450 },
        { sel: '.journey-title', delay: 200, duration: 750 },
        { sel: '.journey-meta', delay: 450, duration: 600 },
        { sel: '.journey-summary', delay: 620, duration: 700 },
    ];

    el.querySelectorAll('.journey-slide').forEach(slide => {
        SCRAMBLE_TARGETS.forEach(({ sel }) => {
            const node = slide.querySelector(sel);
            if (node && !node.dataset.text) node.dataset.text = node.textContent.trim();
        });
    });

    function cancelScramble(node) {
        if (node._scrambleRaf) {
            cancelAnimationFrame(node._scrambleRaf);
            node._scrambleRaf = null;
        }
        node.classList.remove('is-scrambling');
    }

    function scrambleText(node, duration) {
        cancelScramble(node);
        const finalText = node.dataset.text || node.textContent;
        if (!node.dataset.text) node.dataset.text = finalText;
        const length = finalText.length;
        const reveals = new Array(length);
        for (let i = 0; i < length; i++) {
            reveals[i] = Math.random() * duration * 0.85;
        }
        const start = performance.now();
        node.classList.add('is-scrambling');
        const tick = (now) => {
            const elapsed = now - start;
            let out = '';
            let done = true;
            for (let i = 0; i < length; i++) {
                const ch = finalText[i];
                if (elapsed >= reveals[i] || ch === ' ' || ch === '\u00A0' || ch === '\n') {
                    out += ch;
                } else {
                    done = false;
                    out += SCRAMBLE_CHARS[(Math.random() * SCRAMBLE_CHARS.length) | 0];
                }
            }
            node.textContent = out;
            if (done) {
                node.textContent = finalText;
                node._scrambleRaf = null;
                node.classList.remove('is-scrambling');
            } else {
                node._scrambleRaf = requestAnimationFrame(tick);
            }
        };
        node._scrambleRaf = requestAnimationFrame(tick);
    }

    function animateActive(swiper) {
        const active = swiper.slides[swiper.activeIndex];
        if (!active) return;
        el.querySelectorAll('.journey-text > *').forEach(cancelScramble);
        SCRAMBLE_TARGETS.forEach(({ sel, delay, duration }) => {
            const node = active.querySelector(sel);
            if (!node || !node.dataset.text) return;
            node.textContent = '';
            setTimeout(() => scrambleText(node, duration), delay);
        });
    }

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    new Swiper(el, {
        direction: 'vertical',
        loop: true,
        speed: 850,
        slidesPerView: 1,
        allowTouchMove: !isMobile,
        simulateTouch: !isMobile,
        touchStartPreventDefault: false,
        keyboard: { enabled: true },
        mousewheel: isMobile ? false : { forceToAxis: true, releaseOnEdges: true, thresholdDelta: 20, thresholdTime: 400 },
        autoplay: {
            delay: 4500,
            disableOnInteraction: false,
            pauseOnMouseEnter: false,
        },
        pagination: {
            el: el.querySelector('.journey-pagination'),
            clickable: true,
            renderBullet: function (index, className) {
                const slide = this.slides[index];
                const year = slide.getAttribute('data-year') || (index + 1);
                return `<span class="${className}">${year}</span>`;
            },
        },
        navigation: {
            nextEl: el.querySelector('.journey-next'),
            prevEl: el.querySelector('.journey-prev'),
        },
        on: {
            init(swiper) { requestAnimationFrame(() => animateActive(swiper)); },
            slideChangeTransitionStart(swiper) { animateActive(swiper); },
        },
    });
})();

(() => {
    const canvas = document.getElementById("bg-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const mainColor = getComputedStyle(document.documentElement)
        .getPropertyValue("--main-color").trim() || "#00ffee";
    const charSet = "0123456789ABCDEF";
    const fontSize = 15;
    let w, h, dpr, cols, drops;

    function randChar() {
        return charSet[Math.floor(Math.random() * charSet.length)];
    }

    function resize() {
        dpr = window.devicePixelRatio || 1;
        w = window.innerWidth;
        h = window.innerHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + "px";
        canvas.style.height = h + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.font = `${fontSize}px "Courier New", monospace`;
        cols = Math.ceil(w / fontSize);
        drops = Array.from({ length: cols }, () => Math.random() * -h / fontSize);
    }

    const dropSpeed = 0.3;

    function frame() {
        ctx.fillStyle = "rgba(8, 8, 8, 0.05)";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = mainColor;
        for (let i = 0; i < cols; i++) {
            const prevRow = Math.floor(drops[i]);
            drops[i] += dropSpeed;
            const newRow = Math.floor(drops[i]);
            if (newRow !== prevRow) {
                const ch = randChar();
                const x = i * fontSize;
                const y = newRow * fontSize;
                ctx.fillText(ch, x, y);
                if (y > h && Math.random() > 0.975) drops[i] = 0;
            }
        }
        requestAnimationFrame(frame);
    }

    window.addEventListener("resize", resize);
    resize();
    frame();
})();

(() => {
    const wrapper = document.querySelector('.certifications .wrapper');
    if (!wrapper) return;

    const originals = Array.from(wrapper.querySelectorAll('.certification-item'));
    if (originals.length < 2) return;

    const track = document.createElement('div');
    track.className = 'track';
    originals.forEach(item => track.appendChild(item));
    originals.forEach(item => {
        const clone = item.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        track.appendChild(clone);
    });
    wrapper.appendChild(track);

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const SPEED = 120;
    const RESUME_DELAY = 2500;

    let offset = 0;
    let halfWidth = 0;
    let rafId = null;
    let lastTime = 0;
    let running = false;
    let resumeTimer = null;

    const measure = () => {
        const firstClone = track.children[originals.length];
        halfWidth = firstClone ? firstClone.offsetLeft - track.children[0].offsetLeft : 0;
    };

    const apply = () => {
        track.style.transform = `translate3d(${offset}px, 0, 0)`;
    };

    const wrap = () => {
        if (halfWidth <= 0) return;
        while (offset <= -halfWidth) offset += halfWidth;
        while (offset > 0) offset -= halfWidth;
    };

    const tick = (time) => {
        if (!running) return;
        if (!lastTime) lastTime = time;
        const dt = time - lastTime;
        lastTime = time;
        offset -= (SPEED * dt) / 1000;
        wrap();
        apply();
        rafId = requestAnimationFrame(tick);
    };

    const start = () => {
        if (running || reduceMotion.matches || halfWidth <= 0) return;
        running = true;
        lastTime = 0;
        rafId = requestAnimationFrame(tick);
    };

    const pause = () => {
        running = false;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
    };

    const queueResume = () => {
        clearTimeout(resumeTimer);
        resumeTimer = setTimeout(start, RESUME_DELAY);
    };

    let dragging = false;
    let dragStartX = 0;
    let dragStartOffset = 0;
    let activePointer = null;

    wrapper.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        dragging = true;
        activePointer = e.pointerId;
        dragStartX = e.clientX;
        dragStartOffset = offset;
        pause();
        wrapper.classList.add('is-dragging');
        try { wrapper.setPointerCapture(e.pointerId); } catch (_) {}
    });

    wrapper.addEventListener('pointermove', (e) => {
        if (!dragging || e.pointerId !== activePointer) return;
        offset = dragStartOffset + (e.clientX - dragStartX);
        wrap();
        apply();
    });

    const endDrag = (e) => {
        if (!dragging || e.pointerId !== activePointer) return;
        dragging = false;
        activePointer = null;
        wrapper.classList.remove('is-dragging');
        try { wrapper.releasePointerCapture(e.pointerId); } catch (_) {}
        queueResume();
    };
    wrapper.addEventListener('pointerup', endDrag);
    wrapper.addEventListener('pointercancel', endDrag);

    wrapper.addEventListener('wheel', (e) => {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
            e.preventDefault();
            offset -= e.deltaX;
            wrap();
            apply();
            pause();
            queueResume();
        }
    }, { passive: false });

    wrapper.addEventListener('pointerenter', (e) => {
        if (e.pointerType === 'mouse') pause();
    });
    wrapper.addEventListener('pointerleave', (e) => {
        if (e.pointerType !== 'mouse' || dragging) return;
        clearTimeout(resumeTimer);
        start();
    });

    window.addEventListener('resize', () => {
        measure();
        wrap();
        apply();
    });

    requestAnimationFrame(() => {
        measure();
        apply();
        setTimeout(start, 300);
    });
})();

/* ==========================================================================
   3D LAYER
   Three effects that share one rule: they are decoration, so they only ever
   run when the device can spare the frames. Every one of them degrades to
   the flat layout rather than to a broken one.
   ========================================================================== */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
// Coarse pointer = finger. Tilt needs a hovering cursor to make any sense,
// and phones are where dropped frames actually hurt.
const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

/* --- Card tilt -----------------------------------------------------------
   Cards rotate toward the pointer and a specular glare tracks across them.
   Pointer position is read on the event but written on the next animation
   frame, so a fast mouse can't force more style writes than the screen can
   actually draw.                                                          */
(() => {
    const cards = document.querySelectorAll('.project-card');
    if (!cards.length || !hasFinePointer.matches || prefersReducedMotion.matches) return;

    const MAX_TILT = 9; // degrees; past ~12 it starts to look like a gimmick

    cards.forEach((card) => {
        let frame = null;
        let pending = null;

        const paint = () => {
            frame = null;
            if (!pending) return;
            const { x, y, rect } = pending;
            const px = x / rect.width;   // 0 = left edge, 1 = right edge
            const py = y / rect.height;
            card.style.setProperty('--ry', `${(px - 0.5) * 2 * MAX_TILT}deg`);
            card.style.setProperty('--rx', `${(0.5 - py) * 2 * MAX_TILT}deg`);
            card.style.setProperty('--mx', `${px * 100}%`);
            card.style.setProperty('--my', `${py * 100}%`);
        };

        card.addEventListener('pointermove', (e) => {
            if (e.pointerType !== 'mouse') return;
            const rect = card.getBoundingClientRect();
            pending = { x: e.clientX - rect.left, y: e.clientY - rect.top, rect };
            if (!frame) frame = requestAnimationFrame(paint);
        });

        card.addEventListener('pointerenter', (e) => {
            if (e.pointerType === 'mouse') card.classList.add('is-tilting');
        });

        card.addEventListener('pointerleave', () => {
            if (frame) cancelAnimationFrame(frame);
            frame = null;
            pending = null;
            // Drop the class first so the CSS transition eases it back to flat.
            card.classList.remove('is-tilting');
            card.style.setProperty('--rx', '0deg');
            card.style.setProperty('--ry', '0deg');
        });
    });
})();

/* --- Hero parallax -------------------------------------------------------
   Portrait and text drift at different rates as the hero scrolls away,
   which reads as depth. Values are written as CSS custom properties so the
   transforms themselves stay declared in the stylesheet.                  */
(() => {
    const home = document.querySelector('.home');
    const content = document.querySelector('.home-content');
    const img = document.querySelector('.home-img');
    if (!home || !content || !img || prefersReducedMotion.matches) return;

    let frame = null;

    const update = () => {
        frame = null;
        const rect = home.getBoundingClientRect();
        if (rect.bottom < 0) return; // hero is off-screen; nothing to move
        // 0 while the hero is in place, growing as it scrolls out of view.
        const progress = Math.min(Math.max(-rect.top / window.innerHeight, 0), 1);
        content.style.setProperty('--parallax-text', `${progress * 40}px`);
        img.style.setProperty('--parallax-img', `${progress * -55}px`);
    };

    const onScroll = () => {
        if (!frame) frame = requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
})();

let menuIcon = document.querySelector("#menu-icon");
let navbar = document.querySelector(".navbar");
let sections = document.querySelectorAll("section");
let navLinks = document.querySelectorAll("header nav a");

window.onscroll = () => {
    sections.forEach(sec => {
        let top = window.scrollY;
        let offset = sec.offsetTop - 150;
        let height = sec.offsetHeight;
        let id = sec.getAttribute("id");

        if (top >= offset && top < offset + height) {
            navLinks.forEach(link => link.classList.remove("active"));
            const activeLink = document.querySelector(`header nav a[href*="${id}"]`);
            if (activeLink) activeLink.classList.add("active");
        }
    });
};
if (menuIcon) {
    menuIcon.onclick = () => {
        menuIcon.classList.toggle("bx-x");
        navbar.classList.toggle("active");
    };
}
navLinks.forEach(link => {
    link.addEventListener("click", () => {
        menuIcon?.classList.remove("bx-x");
        navbar?.classList.remove("active");
    });
});
const hireBtn = document.getElementById('hireBtn');
const hireDropdown = hireBtn?.closest('.hire-dropdown');
if (hireBtn && hireDropdown) {
    const closeHireMenu = () => {
        hireDropdown.classList.remove('open');
        hireBtn.setAttribute('aria-expanded', 'false');
    };
    hireBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const isOpen = hireDropdown.classList.toggle('open');
        hireBtn.setAttribute('aria-expanded', String(isOpen));
    });
    hireDropdown.querySelector('.hire-close')?.addEventListener('click', closeHireMenu);
    document.addEventListener('click', (e) => {
        if (!hireDropdown.contains(e.target)) closeHireMenu();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeHireMenu();
    });
}

const contactForm = document.getElementById('contactForm');
if (contactForm) {
    const GOOGLE_FORM_ACTION = 'https://docs.google.com/forms/d/e/1FAIpQLScieinKRzLGrfEvJB0etcYtCUZYgt_AF9jqAcQEIrzI0UFgZw/formResponse';
    const FIELD_MAP = {
        fullName: 'entry.905326345',
        email: 'entry.677081586',
        phone: 'entry.1756753663',
        subject: 'entry.294419669',
        message: 'entry.873234177',
    };
    const submitBtn = contactForm.querySelector('input[type="submit"]');
    const originalBtnValue = submitBtn ? submitBtn.value : 'Send Message';

    const phoneInput = document.getElementById('phoneInput');
    let iti = null;

    if (phoneInput) {
        // Digit-only typing works with or without the library.
        phoneInput.addEventListener('input', () => {
            const cleaned = phoneInput.value.replace(/\D/g, '');
            if (cleaned !== phoneInput.value) {
                phoneInput.value = cleaned;
            }
        });
        phoneInput.addEventListener('keypress', (e) => {
            if (!/[0-9]/.test(e.key) && e.key.length === 1) {
                e.preventDefault();
            }
        });
    }

    // intl-tel-input costs ~306 KB (library + utils) to serve one field at the
    // very bottom of the page. Loading it in <head> delayed first paint for
    // every visitor, so it is fetched during idle time instead — or straight
    // away if the visitor reaches the field before the browser goes idle.
    const ITI_BASE = 'https://cdn.jsdelivr.net/npm/intl-tel-input@25.3.1/build';
    let itiRequest = null;
    const loadIntlTelInput = () => itiRequest || (itiRequest = new Promise((resolve, reject) => {
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = `${ITI_BASE}/css/intlTelInput.css`;
        document.head.appendChild(css);

        const js = document.createElement('script');
        js.src = `${ITI_BASE}/js/intlTelInput.min.js`;
        js.onload = resolve;
        js.onerror = reject;
        document.head.appendChild(js);
    }));

    let phoneSetupStarted = false;
    const setupPhoneField = async () => {
        if (phoneSetupStarted || !phoneInput) return;
        phoneSetupStarted = true;
        try {
            await loadIntlTelInput();
        } catch {
            return; // CDN unreachable — the plain tel input still submits fine.
        }
        if (!window.intlTelInput) return;
        const hadFocus = document.activeElement === phoneInput;
        iti = window.intlTelInput(phoneInput, {
            initialCountry: 'fr',
            preferredCountries: ['fr', 'kh', 'us', 'gb'],
            separateDialCode: true,
            loadUtilsOnInit: `${ITI_BASE}/js/utils.js`,
            strictMode: true,
        });
        // Wrapping the input in .iti can drop focus; hand it back if we took it.
        if (hadFocus) phoneInput.focus();
    };

    if (phoneInput) {
        phoneInput.addEventListener('focus', setupPhoneField, { once: true });
        const whenIdle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1500));
        whenIdle(() => setupPhoneField());
    }

    const getFullPhone = (rawValue) => {
        if (!iti) return rawValue.trim();
        const viaUtils = (iti.getNumber() || '').trim();
        if (viaUtils) return viaUtils;
        const national = rawValue.trim();
        if (!national) return '';
        const country = iti.getSelectedCountryData();
        const dial = country && country.dialCode ? country.dialCode : '';
        return dial ? `+${dial}${national.replace(/\D/g, '')}` : national;
    };

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = new FormData(contactForm);
        const rawPhone = (data.get('phone') || '').toString();
        const fullPhone = getFullPhone(rawPhone);
        const values = {
            fullName: (data.get('fullName') || '').toString().trim(),
            email: (data.get('email') || '').toString().trim(),
            phone: fullPhone,
            subject: (data.get('subject') || '').toString().trim(),
            message: (data.get('message') || '').toString().trim(),
        };

        if (!values.fullName || !values.message) {
            alert('Please fill in your name and message.');
            return;
        }
        if (!values.email && !values.phone) {
            alert('Please provide an email address or a phone number so I can get back to you.');
            return;
        }
        if (values.email && !values.email.includes('@')) {
            alert('Please enter a valid email address');
            return;
        }
        if (iti && phoneInput.value.trim() && typeof iti.isPossibleNumber === 'function' && !iti.isPossibleNumber()) {
            alert('Please enter a valid phone number for the selected country.');
            return;
        }

        const body = new URLSearchParams();
        for (const [key, entryId] of Object.entries(FIELD_MAP)) {
            if (values[key]) body.append(entryId, values[key]);
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.value = 'Sending...';
        }

        try {
            await fetch(GOOGLE_FORM_ACTION, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: body.toString(),
            });
            if (submitBtn) submitBtn.value = 'Message Sent!';
            contactForm.reset();
        } catch (err) {
            if (submitBtn) submitBtn.value = 'Error — try again';
        } finally {
            setTimeout(() => {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.value = originalBtnValue;
                }
            }, 3000);
        }
    });
}

/* ==========================================================================
   ORBIT GLOBE  ·  WebGL, lazy, optional
   A wireframe globe with travelling data arcs, drawn around the portrait.

   Three.js is ~160 KB gzipped, so it is never part of the initial page load.
   It is fetched only when ALL of these hold:
     · the viewport is desktop-sized      (phones skip it entirely)
     · the visitor has not asked for reduced motion
     · the browser actually reports a WebGL context
     · the hero is on screen              (no point paying for it otherwise)
   If any check fails, or the CDN is down, the canvas simply stays invisible
   and the hero looks exactly as it did before.
   ========================================================================== */
(() => {
    const canvas = document.querySelector('.orbit-canvas');
    if (!canvas) return;
    if (prefersReducedMotion.matches) return;
    if (!window.matchMedia('(min-width: 992px)').matches) return;

    // Cheap capability probe — cheaper than downloading Three.js to find out.
    try {
        const probe = document.createElement('canvas');
        if (!probe.getContext('webgl2') && !probe.getContext('webgl')) return;
    } catch { return; }

    const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
    const accent = getComputedStyle(document.documentElement)
        .getPropertyValue('--main-color').trim() || '#00ffee';

    let started = false;

    const start = async () => {
        if (started) return;
        started = true;

        let THREE;
        try {
            THREE = await import(THREE_URL);
        } catch {
            return; // offline or blocked — hero stays flat, no error surfaced
        }

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
        camera.position.z = 3.2;

        const renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: true,
            powerPreference: 'low-power',
        });
        renderer.setClearColor(0x000000, 0);

        const globe = new THREE.Group();
        scene.add(globe);

        const color = new THREE.Color(accent);
        const R = 1;

        // --- surface points, spread evenly with a Fibonacci sphere ---------
        const COUNT = 900;
        const positions = new Float32Array(COUNT * 3);
        const golden = Math.PI * (3 - Math.sqrt(5));
        for (let i = 0; i < COUNT; i++) {
            const y = 1 - (i / (COUNT - 1)) * 2;
            const radius = Math.sqrt(Math.max(0, 1 - y * y));
            const theta = golden * i;
            positions[i * 3] = Math.cos(theta) * radius * R;
            positions[i * 3 + 1] = y * R;
            positions[i * 3 + 2] = Math.sin(theta) * radius * R;
        }
        const dotGeo = new THREE.BufferGeometry();
        dotGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        globe.add(new THREE.Points(dotGeo, new THREE.PointsMaterial({
            color,
            size: 0.018,
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        })));

        // --- faint wireframe shell so the sphere reads as solid ------------
        globe.add(new THREE.LineSegments(
            new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(R * 0.995, 3)),
            new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.08 })
        ));

        // --- three tilted orbit rings --------------------------------------
        // Radii are capped at ~1.21R so the widest ring still clears the
        // camera frustum; any larger and the rings get sliced by the canvas.
        [[0.15, 0.4], [1.1, -0.3], [-0.9, 0.8]].forEach(([rx, rz], i) => {
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(R * (1.05 + i * 0.08), 0.0035, 8, 180),
                new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.3 })
            );
            ring.rotation.set(rx, 0, rz);
            globe.add(ring);
        });

        // --- data arcs with a packet travelling along each ------------------
        const surfacePoint = () => {
            const u = Math.random() * Math.PI * 2;
            const v = Math.acos(2 * Math.random() - 1);
            return new THREE.Vector3(
                Math.sin(v) * Math.cos(u), Math.cos(v), Math.sin(v) * Math.sin(u)
            ).multiplyScalar(R);
        };

        const arcs = [];
        for (let i = 0; i < 7; i++) {
            const a = surfacePoint();
            const b = surfacePoint();
            // Lift the control point off the surface so the arc bows outward.
            const mid = a.clone().add(b).multiplyScalar(0.5)
                .normalize().multiplyScalar(R + 0.24 + Math.random() * 0.14);
            const curve = new THREE.QuadraticBezierCurve3(a, mid, b);

            globe.add(new THREE.Line(
                new THREE.BufferGeometry().setFromPoints(curve.getPoints(60)),
                new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.28 })
            ));

            const packet = new THREE.Mesh(
                new THREE.SphereGeometry(0.022, 10, 10),
                new THREE.MeshBasicMaterial({
                    color, transparent: true, blending: THREE.AdditiveBlending,
                })
            );
            globe.add(packet);
            arcs.push({ curve, packet, t: Math.random(), speed: 0.11 + Math.random() * 0.13 });
        }

        // --- sizing ---------------------------------------------------------
        const resize = () => {
            const size = canvas.clientWidth;
            if (!size) return;
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
            renderer.setSize(size, size, false);
            camera.aspect = 1;
            camera.updateProjectionMatrix();
        };
        resize();
        new ResizeObserver(resize).observe(canvas);

        // --- pointer influence ----------------------------------------------
        let targetX = 0, targetY = 0, curX = 0, curY = 0;
        window.addEventListener('pointermove', (e) => {
            if (e.pointerType !== 'mouse') return;
            targetX = (e.clientX / window.innerWidth - 0.5) * 0.55;
            targetY = (e.clientY / window.innerHeight - 0.5) * 0.35;
        }, { passive: true });

        // --- render loop, paused whenever the hero is off screen -------------
        let visible = true;
        let raf = null;
        let last = performance.now();

        const frame = (now) => {
            raf = requestAnimationFrame(frame);
            const dt = Math.min((now - last) / 1000, 0.05);
            last = now;

            globe.rotation.y += dt * 0.12;
            curX += (targetX - curX) * 0.05;
            curY += (targetY - curY) * 0.05;
            globe.rotation.x = curY;
            globe.position.x = curX * 0.12;

            for (const arc of arcs) {
                arc.t = (arc.t + dt * arc.speed) % 1;
                arc.curve.getPoint(arc.t, arc.packet.position);
                // Fade in and out at the ends so packets don't pop.
                arc.packet.material.opacity = Math.sin(arc.t * Math.PI);
            }
            renderer.render(scene, camera);
        };

        const play = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
        const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = null; } };

        new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            visible ? play() : stop();
        }, { threshold: 0 }).observe(canvas);

        document.addEventListener('visibilitychange', () => {
            document.hidden || !visible ? stop() : play();
        });

        canvas.classList.add('is-live');
        play();
    };

    // Only pay for it once the hero is actually on screen, and never before
    // the browser has finished the work that matters.
    const watcher = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        watcher.disconnect();
        const whenIdle = window.requestIdleCallback || ((fn) => setTimeout(fn, 400));
        whenIdle(() => start());
    }, { threshold: 0 });
    watcher.observe(canvas);
})();
