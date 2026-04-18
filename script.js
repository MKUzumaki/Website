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
    if (phoneInput && window.intlTelInput) {
        iti = window.intlTelInput(phoneInput, {
            initialCountry: 'fr',
            preferredCountries: ['fr', 'kh', 'us', 'gb'],
            separateDialCode: true,
            loadUtilsOnInit: 'https://cdn.jsdelivr.net/npm/intl-tel-input@25.3.1/build/js/utils.js',
            strictMode: true,
        });
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