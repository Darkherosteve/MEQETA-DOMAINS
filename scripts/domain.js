export function initDomainChecker() {
  const form = document.getElementById("domainForm");
  const input = document.getElementById("domainInput");
  let isChecking = false;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (isChecking) return;

    let base = input.value.trim().toLowerCase();
    base = base.replace(/\..+$/, "");

    if (!base || base.length < 2 || base.length > 63) {
      return alert("Invalid domain");
    }

    isChecking = true;

    try {
      const res = await fetch("api/availability.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base }),
      });

      const data = await res.json();
      displayResults(data);
    } catch (err) {
      console.error(err);
      alert("Error fetching domains");
    } finally {
      isChecking = false;
    }
  });
}

function displayResults(data) {
  const availableContainer = document.getElementById("availabilityTable");
  const takenContainer = document.getElementById("result");

  const available = [];
  const taken = [];

  Object.keys(data).forEach((d) => {
    data[d].available ? available.push(d) : taken.push(d);
  });

  availableContainer.innerHTML = available
    .map((d) => createCard(d, true))
    .join("");
  takenContainer.innerHTML = taken.map((d) => createCard(d, false)).join("");

  document.querySelectorAll(".btn-register").forEach((btn) => {
    btn.onclick = () => {
      window.location.href = `/register.html?domain=${btn.dataset.domain}`;
    };
  });

  document.querySelectorAll(".btn-notify").forEach((btn) => {
    btn.onclick = () => {
      alert(`We'll notify you for ${btn.dataset.domain}`);
    };
  });
}

function createCard(domain, available) {
  if (available) {
    return `
    <div class="dcard avail">
        <div class="card-badge">Available</div>
        <div class="card-content">
          <div class="domain-name">${domain}</div>
          <div class="features">
            <span>Free DNS</span>
            <span>Email Forwarding</span>
          </div>
          <button class="btn-register" data-domain="${domain}">
            Register
          </button>
        </div>
      </div>
    `;
  } else {
    return `
      <div class="dcard taken">
        <div class="card-badge taken">Taken</div>
        <div class="card-content">
          <div class="domain-name">${domain}</div>
          <button class="btn-notify" data-domain="${domain}">
            Notify
          </button>
        </div>
      </div>
    `;
  }
}
