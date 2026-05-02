export function initDomainChecker() {
    const form = document.getElementById("domainForm");
    const input = document.getElementById("domainInput");
    const result = document.getElementById("result");
    const tableDiv = document.getElementById("availabilityTable");

    if (!form) return;

    const tlds = [".com", ".net", ".org", ".co", ".io"];

    form.addEventListener("submit", function(e) {
        e.preventDefault();

        const base = input.value.replace(/\..+$/, "").toLowerCase();

        result.innerHTML = `<div class="loader"></div>`;
        tableDiv.innerHTML = "";

        setTimeout(() => {
            result.innerHTML = "";

            let table = `<table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Domain</th>
                                    <th>Status</th>
                                </tr>
                            </thead><tbody>`;

            tlds.forEach(tld => {
                const domain = base + tld;
                const available = Math.random() > 0.5;

                table += `
                    <tr>
                        <td>${domain}</td>
                        <td class="${available ? 'available' : 'taken'}">
                            ${available ? "Available" : "Taken"}
                        </td>
                    </tr>
                `;
            });

            table += "</tbody></table>";
            tableDiv.innerHTML = table;

        }, 800);
    });
}