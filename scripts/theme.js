export function initTheme() {
    const toggle = document.getElementById("themeToggle");
    const label = document.getElementById("themeLabel");
    const navbar = document.getElementById("mainNavbar");

    function updateTextColors(isDark) {
        const status = document.getElementById("marginStatus");
        const result = document.getElementById("result");

        const color = isDark ? "#ffffff" : "#000000";

        if (status) status.style.color = color;
        if (result) result.style.color = color;
    }

    function applyTheme(isDark) {
        if (isDark) {
            document.body.classList.remove("light-mode");
            navbar.classList.remove("navbar-light");
            navbar.classList.add("navbar-dark");
            label.textContent = "🌙";
        } else {
            document.body.classList.add("light-mode");
            navbar.classList.remove("navbar-dark");
            navbar.classList.add("navbar-light");
            label.textContent = "☀️";
        }

        // Apply dynamic text colors
        updateTextColors(isDark);
    }

    function loadTheme() {
        const saved = localStorage.getItem("theme");
        const isDark = saved !== "light";

        toggle.checked = isDark;
        applyTheme(isDark);
    }

    toggle.addEventListener("change", () => {
        const isDark = toggle.checked;
        localStorage.setItem("theme", isDark ? "dark" : "light");
        applyTheme(isDark);
    });

    loadTheme();
}