export function initSettings() {
    const input = document.getElementById("marginInput");
    const btn = document.getElementById("saveMargin");
    const status = document.getElementById("marginStatus");

    if (!input) return;

    const API = "api/main.php?route=settings";

    /* Load margin */
    async function load() {
        const res = await fetch(API);
        const data = await res.json();

        if (data.margin !== undefined) {
            input.value = data.margin;
            status.innerHTML = `Saved: ${data.margin}%`;

            // Apply correct color
            status.style.color = document.body.classList.contains("light-mode")
                ? "#000000"
                : "#ffffff";
        }
    }

    /* Save margin */
    btn.addEventListener("click", async () => {
        const value = input.value;

        if (!value) {
            status.innerHTML = "⚠️ Enter value";

            // Force correct color immediately
            status.style.color = document.body.classList.contains("light-mode")
                ? "#000000"
                : "#ffffff";

            return;
        }

        const res = await fetch(API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ margin: value })
        });

        if (res.ok) {
            status.innerHTML = "✅ Saved";
        } else {
            status.innerHTML = "❌ Error";
        }

        // Apply correct color after update
        status.style.color = document.body.classList.contains("light-mode")
            ? "#000000"
            : "#ffffff";
    });

    load();
}