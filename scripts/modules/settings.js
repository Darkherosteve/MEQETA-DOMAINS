export function initSettings() {
    const marginInput = document.getElementById("marginInput");
    const saveMargin = document.getElementById("saveMargin");
    const marginStatus = document.getElementById("marginStatus");

    if (!marginInput) return;

    /* Load margin */
    async function loadMargin() {
        const res = await fetch("api/settings.php");
        const data = await res.json();

        if (data.margin !== undefined) {
            marginInput.value = data.margin;
            marginStatus.innerHTML = `Saved: ${data.margin}%`;
        }
    }

    /* Save margin */
    saveMargin.addEventListener("click", async () => {
        const value = marginInput.value;

        if (!value) {
            marginStatus.innerHTML = "⚠️ Enter a value";
            return;
        }

        const res = await fetch("api/settings.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ margin: value })
        });

        if (res.ok) {
            marginStatus.innerHTML = "✅ Saved";
        } else {
            marginStatus.innerHTML = "❌ Error";
        }
    });

    loadMargin();
}