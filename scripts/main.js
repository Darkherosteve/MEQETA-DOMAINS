// Main JavaScript for MEQTEADOMAINS 
// Minions Enterprises Solutions Lati System 
console.log("Project: MEQTEADOMAINS loaded"); 
document.addEventListener('DOMContentLoaded', function() { 
    console.log("DOM fully loaded"); 
    document.title = "MEQTEADOMAINS - Lati System"; 

    // Domain check form 
    document.getElementById('domainForm').addEventListener('submit', function(e) { 
        e.preventDefault(); 
        const domain = document.getElementById('domainInput').value; 
        checkDomainAvailability(domain); 
    }); 

    // Margin form 
    document.getElementById('marginForm').addEventListener('submit', function(e) { 
        e.preventDefault(); 
        const margin = document.getElementById('marginInput').value; 
        setMargin(margin); 
    }); 
}); 

function checkDomainAvailability(domain) { 
    fetch('api/main.php', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ action: 'check_domain', domain: domain }) 
    }) 
    .then(response => response.json()) 
    .then(data => { 
        const resultEl = document.getElementById('result'); 
        const tableEl = document.getElementById('availabilityTable'); 
        resultEl.innerHTML = data.message || 'No response message'; 
        if (data.records && Array.isArray(data.records) && data.records.length > 0) { 
            tableEl.innerHTML = renderAvailabilityTable(data.records); 
        } else { 
            tableEl.innerHTML = ''; 
        } 
    }) 
    .catch(error => { 
        document.getElementById('result').innerHTML = 'Error: ' + error.message; 
        document.getElementById('availabilityTable').innerHTML = ''; 
    }); 
} 

function renderAvailabilityTable(records) { 
    let rows = records.map(record => { 
        const statusClass = record.available ? 'status-available' : 'status-unavailable'; 
        const priceDisplay = record.price ? record.price : 'N/A'; 
        const saleDisplay = record.sale_price ? record.sale_price : 'N/A'; 
        return `
            <tr>
                <td>${record.domain}</td>
                <td class="${statusClass}">${record.available ? 'Available' : 'Unavailable'}</td>
                <td>${priceDisplay}</td>
                <td>${saleDisplay}</td>
                <td>${record.source || 'unknown'}</td>
            </tr>
        `; 
    }).join(''); 

    return `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Domain</th>
                        <th>Status</th>
                        <th>Base Price</th>
                        <th>Price + Margin</th>
                        <th>Source</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    `; 
} 

function setMargin(margin) { 
    fetch('api/main.php', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ action: 'set_margin', margin: margin }) 
    }) 
    .then(response => response.json()) 
    .then(data => { 
        document.getElementById('marginResult').innerHTML = data.message; 
    }) 
    .catch(error => { 
        document.getElementById('marginResult').innerHTML = 'Error: ' + error.message; 
    }); 
} 
