export function initDomainChecker() {
  const form = document.getElementById("domainForm");
  const input = document.getElementById("domainInput");
  const container = document.getElementById("availabilityTable");
  let isChecking = false;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    if (isChecking) return;
    
    let base = input.value.trim().toLowerCase();
    base = base.replace(/\..+$/, ""); // Remove any TLD
    
    // Quick validation
    if (!base || base.length < 2 || base.length > 63) {
      showError("Domain name must be 2-63 characters");
      return;
    }
    
    if (!/^[a-z0-9-]+$/.test(base)) {
      showError("Use only letters, numbers, and hyphens");
      return;
    }
    
    isChecking = true;
    
    // Show loading state
    container.innerHTML = `
      <div class="text-center py-5">
        <div class="spinner-border text-primary mb-3" role="status" style="width: 3rem; height: 3rem;"></div>
        <h5>Checking domain availability...</h5>
        <small class="text-muted">Checking popular TLDs like .com, .in, .tech, .app, .dev</small>
      </div>
    `;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);
      
      const res = await fetch("api/availability.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      displayResults(data);
      
    } catch (err) {
      console.error(err);
      showError(err.message || "Failed to check domains. Please try again.");
    } finally {
      isChecking = false;
    }
  });
  
  function showError(message) {
    container.innerHTML = `
      <div class="alert alert-danger alert-dismissible fade show" role="alert">
        <strong>Error:</strong> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `;
  }
}

function displayResults(data) {
  const container = document.getElementById("availabilityTable");
  
  // Separate available and taken
  const availableDomains = [];
  const takenDomains = [];
  
  Object.keys(data).forEach(domain => {
    if (data[domain].available) {
      availableDomains.push(domain);
    } else {
      takenDomains.push(domain);
    }
  });
  
  // Show summary
  const summaryHTML = `
    <div class="domain-summary mb-4">
      <div class="row text-center">
        <div class="col-6">
          <div class="summary-card available">
            <div class="count">${availableDomains.length}</div>
            <div class="label">Available</div>
          </div>
        </div>
        <div class="col-6">
          <div class="summary-card taken">
            <div class="count">${takenDomains.length}</div>
            <div class="label">Taken</div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Display available domains first
  let html = summaryHTML;
  
  if (availableDomains.length > 0) {
    html += `<h4 class="mb-3 text-success">✨ Available Domains</h4>`;
    html += `<div class="row g-3 mb-5">`;
    availableDomains.forEach(domain => {
      html += createDomainCard(domain, true);
    });
    html += `</div>`;
  }
  
  if (takenDomains.length > 0) {
    html += `<h4 class="mb-3 text-muted">🔒 Taken Domains</h4>`;
    html += `<div class="row g-3">`;
    takenDomains.forEach(domain => {
      html += createDomainCard(domain, false);
    });
    html += `</div>`;
  }
  
  container.innerHTML = html;
  
  // Add click handlers for register buttons
  document.querySelectorAll(".register-btn:not(:disabled)").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const domain = btn.dataset.domain;
      
      // Store selected domain
      sessionStorage.setItem('selectedDomain', JSON.stringify({
        domain: domain,
        timestamp: Date.now()
      }));
      
      // Redirect to registration page
      window.location.href = `/register.html?domain=${encodeURIComponent(domain)}`;
    });
  });
  
  // Add click handlers for notify buttons
  document.querySelectorAll(".btn-notify").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const domain = btn.dataset.domain;
      notifyMe(domain);
    });
  });
}

function createDomainCard(domain, isAvailable) {
  if (isAvailable) {
    return `
      <div class="col-md-6 col-lg-4">
        <div class="domain-card available-card">
          <div class="card-badge">Available Now</div>
          <div class="card-content">
            <div class="domain-name">${escapeHtml(domain)}</div>
            <div class="features">
              <span>✓ Free DNS</span>
              <span>✓ Email Forwarding</span>
              <span>✓ Privacy Protection</span>
              <span>✓ SSL Ready</span>
            </div>
            <button class="btn-register" data-domain="${escapeHtml(domain)}">
              Register Now →
            </button>
          </div>
        </div>
      </div>
    `;
  } else {
    // Extract domain name without TLD for suggestions
    const domainName = domain.split('.')[0];
    const suggestions = [
      `${domainName}.co`,
      `${domainName}.io`,
      `get${domainName}.com`,
      `${domainName}app.com`,
      `try${domainName}.com`
    ];
    
    return `
      <div class="col-md-6 col-lg-4">
        <div class="domain-card taken-card">
          <div class="card-badge taken">Already Taken</div>
          <div class="card-content">
            <div class="domain-name">${escapeHtml(domain)}</div>
            <div class="suggestion-text">
              Try these instead:
              <div class="suggestions">
                ${suggestions.slice(0, 3).map(s => `<div>💡 ${escapeHtml(s)}</div>`).join('')}
              </div>
            </div>
            <button class="btn-notify" data-domain="${escapeHtml(domain)}">
              Notify if available
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

function notifyMe(domain) {
  // Simple notification (you can replace with modal or email signup)
  const email = prompt(`Enter your email to get notified when ${domain} becomes available:`);
  if (email && email.includes('@')) {
    alert(`Thank you! We'll notify you at ${email} when ${domain} is available.`);
    // Here you would typically save to database
  } else if (email) {
    alert('Please enter a valid email address.');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}