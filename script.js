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
menuIcon.onclick = () => {
    menuIcon.classList.toggle("bx-x");
    navbar.classList.toggle("active");
}
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