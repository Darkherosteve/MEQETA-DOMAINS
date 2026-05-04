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

    // Show loading state
    const availableContainer = document.getElementById("availabilityTable");
    const takenContainer = document.getElementById("result");
    if (availableContainer) availableContainer.innerHTML = '<div class="empty"><div class="empty-ic">⏳</div>Checking availability...</div>';
    if (takenContainer) takenContainer.innerHTML = '<div class="empty"><div class="empty-ic">⏳</div>Checking availability...</div>';

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
      if (availableContainer) availableContainer.innerHTML = '<div class="empty"><div class="empty-ic">⚠️</div>Error loading domains</div>';
      if (takenContainer) takenContainer.innerHTML = '<div class="empty"><div class="empty-ic">⚠️</div>Error loading domains</div>';
    } finally {
      isChecking = false;
    }
  });
}

function displayResults(data) {
  const availableContainer = document.getElementById("availabilityTable");
  const takenContainer = document.getElementById("result");
  const availableCountSpan = document.getElementById("availableCount");
  const takenCountSpan = document.getElementById("takenCount");

  const available = [];
  const taken = [];

  Object.keys(data).forEach((d) => {
    data[d].available ? available.push(d) : taken.push(d);
  });

  // Update counters
  if (availableCountSpan) availableCountSpan.textContent = available.length;
  if (takenCountSpan) takenCountSpan.textContent = taken.length;

  if (availableContainer) {
    availableContainer.innerHTML = available.length 
      ? available.map((d) => createCard(d, true)).join("")
      : '<div class="empty"><div class="empty-ic">🎉</div>All domains available!</div>';
  }
  
  if (takenContainer) {
    takenContainer.innerHTML = taken.length 
      ? taken.map((d) => createCard(d, false)).join("")
      : '<div class="empty"><div class="empty-ic">🏆</div>No premium taken domains</div>';
  }

  // Register buttons
  document.querySelectorAll(".btn-reg").forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const domain = btn.dataset.domain;
      window.location.href = `/register.html?domain=${encodeURIComponent(domain)}`;
    };
  });

  // Notify buttons
  document.querySelectorAll(".btn-notify").forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const domain = btn.dataset.domain;
      alert(`🔔 We'll notify you when ${domain} becomes available!`);
    };
  });

  // Quick view buttons
  document.querySelectorAll(".btn-view").forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const domain = btn.dataset.domain;
      alert(`📋 ${domain}\n\nDomain: ${domain}\nStatus: ${btn.dataset.status}\nAdded to your watchlist`);
    };
  });
}

function createCard(domain, available) {
  // Extract domain name and TLD
  const parts = domain.split('.');
  const domainName = parts[0];
  const tld = parts.slice(1).join('.');
  
  if (available) {
    return `
      <div class="dcard avail">
        <div class="dcard-top"></div>
        <div class="dcard-body">
          <div class="dcard-head">
            <span class="status-tag">✅ AVAILABLE NOW</span>
          </div>
          <div class="domain-nm">
            ${domainName}<span class="tld-hl">.${tld}</span>
          </div>
          <div class="feats">
            <div class="feat">
              <span class="feat-ic">⚡</span>
              <span>Instant Activation</span>
            </div>
            <div class="feat">
              <span class="feat-ic">🔒</span>
              <span>Free Privacy</span>
            </div>
            <div class="feat">
              <span class="feat-ic">🔄</span>
              <span>Free Transfer</span>
            </div>
          </div>
          <div class="dcard-actions">
            <button class="btn-reg" data-domain="${domain}">🎯 Get This Domain →</button>
            <button class="btn-view" data-domain="${domain}" data-status="available">👁️ Quick View</button>
          </div>
        </div>
      </div>
    `;
  } else {
    return `
      <div class="dcard taken">
        <div class="dcard-top"></div>
        <div class="dcard-body">
          <div class="dcard-head">
            <span class="status-tag">❌ CURRENTLY TAKEN</span>
          </div>
          <div class="domain-nm">
            ${domainName}<span class="tld-hl">.${tld}</span>
          </div>
          <div class="feats">
            <div class="feat">
              <span class="feat-ic">⏰</span>
              <span>Registered</span>
            </div>
            <div class="feat">
              <span class="feat-ic">📅</span>
              <span>Check Back</span>
            </div>
            <div class="feat">
              <span class="feat-ic">🔄</span>
              <span>Backorder Available</span>
            </div>
          </div>
          <div class="dcard-actions">
            <button class="btn-notify" data-domain="${domain}">🔔 Notify When Free</button>
            <button class="btn-view" data-domain="${domain}" data-status="taken">👁️ Details</button>
          </div>
        </div>
      </div>
    `;
  }
}