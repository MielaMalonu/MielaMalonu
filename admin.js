document.addEventListener("DOMContentLoaded", async function () {
    console.log("✅ Admin panel loaded!");

    const CONFIG = {
        SUPABASE: {
            URL: "https://smodsdsnswwtnbnmzhse.supabase.co/rest/v1",
            API_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtb2RzZHNuc3d3dG5ibm16aHNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE2MjUyOTAsImV4cCI6MjA1NzIwMTI5MH0.zMdjymIaGU66_y6X-fS8nKnrWgJjXgw7NgXPBIzVCiI"
        },
        ADMIN_PASSWORD: "R&bRY5UY2QpG$uuMjLe4",
        AUTH_KEY: "miela_malonu_auth"  // Key for local storage
    };

    const BLACKLIST_ID = 1;
    let fetchedData = [];
    let blacklist = [];
    let isOnline = "offline";
    let idStatus = "uždaryta"; // Add a new variable to track ID status

    // Check if already authenticated via local storage
    function checkAuthentication() {
        const isAuthenticated = localStorage.getItem(CONFIG.AUTH_KEY);
        if (isAuthenticated === "true") {
            console.log("✅ Authentication found in local storage");
            return true;
        }
        return false;
    }

    // Store authentication in local storage
    function storeAuthentication() {
        localStorage.setItem(CONFIG.AUTH_KEY, "true");
        console.log("✅ Authentication stored in local storage");
    }

    // Clear authentication from local storage
    function clearAuthentication() {
        localStorage.removeItem(CONFIG.AUTH_KEY);
        console.log("🔄 Authentication cleared from local storage");
    }

    // Add logout button to admin panel
    function addLogoutButton() {
        const adminPanel = document.querySelector('.admin-panel');
        
        // Check if logout button already exists
        if (!document.getElementById('logoutButton')) {
            const logoutButton = document.createElement('button');
            logoutButton.id = 'logoutButton';
            logoutButton.textContent = '🚪 Atsijungti';
            logoutButton.addEventListener('click', function() {
                clearAuthentication();
                location.reload(); // Reload the page to show login
            });
            
            adminPanel.appendChild(logoutButton);
        }
    }

    // Hide all content except auth overlay initially
    function hideContent() {
        // Hide all body content
        document.querySelectorAll('body > *').forEach(el => {
            if (!el.classList.contains('auth-overlay')) {
                el.style.display = 'none';
            }
        });
    }

    // Show content after authentication
    function showContent() {
        // Show all body content
        document.querySelectorAll('body > *').forEach(el => {
            if (!el.classList.contains('auth-overlay')) {
                el.style.display = '';
            }
        });
        // Remove the auth overlay
        const authOverlay = document.querySelector('.auth-overlay');
        if (authOverlay) {
            authOverlay.remove();
        }
        
        // Add logout button
        addLogoutButton();
    }

    // Create and show auth overlay
    function showAuthOverlay() {
        // Hide all other content first
        hideContent();
        
        // Create auth overlay if it doesn't exist
        if (!document.querySelector('.auth-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'auth-overlay';
            
            const title = document.createElement('h2');
            title.textContent = 'Admin prisijungimas';
            
            const passwordInput = document.createElement('input');
            passwordInput.type = 'password';
            passwordInput.id = 'adminPassword';
            passwordInput.placeholder = 'Įveskite admin slaptažodį';
            
            const loginButton = document.createElement('button');
            loginButton.textContent = 'Prisijungti';
            loginButton.id = 'loginButton';
            loginButton.addEventListener('click', validatePassword);
            
            // Add keypress event to input field
            passwordInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    validatePassword();
                }
            });
            
            overlay.appendChild(title);
            overlay.appendChild(passwordInput);
            overlay.appendChild(loginButton);
            
            document.body.appendChild(overlay);
            
            // Focus on password input
            passwordInput.focus();
        }
    }

    // Validate password
    async function validatePassword() {
        const passwordInput = document.getElementById('adminPassword');
        const password = passwordInput.value;
        
        if (password === CONFIG.ADMIN_PASSWORD) {
            // Store authentication in local storage
            storeAuthentication();
            
            showContent();
            console.log("✅ Sėkmingai praėjote autorizacija");
            await fetchSupabaseData();
            await fetchBlacklist();
            await fetchStatus();
            await fetchEventIds();
            await fetchIdStatus(); // Add a call to fetch the ID status
        } else {
            passwordInput.value = '';
            passwordInput.placeholder = 'Neteisingas slaptažodis';
            passwordInput.classList.add('password-error');
            setTimeout(() => {
                passwordInput.classList.remove('password-error');
                passwordInput.placeholder = 'Įveskite admin slaptažodį';
            }, 1500);
        }
    }

    // Fetch Supabase Data
    async function fetchSupabaseData() {
        try {
            const response = await fetch(`${CONFIG.SUPABASE.URL}/IC`, {
                method: "GET",
                headers: {
                    "apikey": CONFIG.SUPABASE.API_KEY,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) throw new Error("⚠️ Failed to fetch data");

            fetchedData = await response.json();
            populateTable(fetchedData);

        } catch (error) {
            console.error("❌ Error fetching Supabase data:", error);
            alert("⚠️ Nepavyko gauti duomenų iš duombazės.");
        }
    }

    // Fetch Blacklist from Supabase
    async function fetchBlacklist() {
        try {
            const response = await fetch(`${CONFIG.SUPABASE.URL}/Blacklist?id=eq.${BLACKLIST_ID}&select=blacklist`, {
                method: "GET",
                headers: {
                    "apikey": CONFIG.SUPABASE.API_KEY,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) throw new Error("⚠️ Failed to fetch blacklist data");

            const data = await response.json();
            if (data.length > 0) {
                blacklist = data[0].blacklist || [];
                console.log("📜 Current Blacklist:", blacklist);
            } else {
                console.log("❌ No blacklist found in Supabase.");
                blacklist = [];
            }
        } catch (error) {
            console.error("❌ Error fetching blacklist:", error);
            alert("⚠️ Nepavyko gauti duomenų iš duombazės.");
        }
    }

    // Add User to Blacklist
    async function addToBlacklist() {
        const userId = prompt("Enter the User ID to Blacklist:");
        if (!userId || blacklist.includes(userId)) {
            alert("⚠️ Asmuo jau yra blackliste arba neteisingai ivestas ID.");
            return;
        }

        blacklist.push(userId);

        try {
            const response = await fetch(`${CONFIG.SUPABASE.URL}/Blacklist?id=eq.${BLACKLIST_ID}`, {
                method: "PATCH",
                headers: {
                    "apikey": CONFIG.SUPABASE.API_KEY,
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal"
                },
                body: JSON.stringify({ blacklist })
            });

            if (!response.ok) throw new Error("⚠️ Failed to update blacklist");
            alert("✅ Asmuo pridėtas į Blacklista!");
            console.log("📜 Updated Blacklist:", blacklist);

        } catch (error) {
            console.error("❌ Error updating blacklist:", error);
            alert("⚠️ Nepavyko atnaujinti blacklisto.");
        }
    }

    // Remove User from Blacklist
    async function removeFromBlacklist() {
        const userId = prompt("Enter the User ID to Remove from Blacklist:");
        if (!userId || !blacklist.includes(userId)) {
            alert("⚠️ Asmuo nėra Blackliste.");
            return;
        }

        blacklist = blacklist.filter(id => id !== userId);

        try {
            const response = await fetch(`${CONFIG.SUPABASE.URL}/Blacklist?id=eq.${BLACKLIST_ID}`, {
                method: "PATCH",
                headers: {
                    "apikey": CONFIG.SUPABASE.API_KEY,
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal"
                },
                body: JSON.stringify({ blacklist })
            });

            if (!response.ok) throw new Error("⚠️ Failed to update blacklist");
            alert("✅ User removed from blacklist!");
            console.log("📜 Updated Blacklist:", blacklist);

        } catch (error) {
            console.error("❌ Error updating blacklist:", error);
            alert("⚠️ Unable to update blacklist.");
        }
    }

    // Fetch Status
    async function fetchStatus() {
        try {
            const response = await fetch(`${CONFIG.SUPABASE.URL}/Status?id=eq.${BLACKLIST_ID}&select=status`, {
                method: "GET",
                headers: {
                    "apikey": CONFIG.SUPABASE.API_KEY,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) throw new Error("⚠️ Failed to fetch status");

            const data = await response.json();
            // Update to handle string values
            if (data.length > 0) {
                isOnline = data[0].status;
                // Convert to string if it's still boolean
                if (typeof isOnline === 'boolean') {
                    isOnline = isOnline ? "online" : "offline";
                }
            } else {
                isOnline = "offline";
            }
            updateStatusDisplay();
        } catch (error) {
            console.error("❌ Error fetching status:", error);
        }
    }

    // NEW FUNCTION: Fetch ID Status
    async function fetchIdStatus() {
        try {
            const response = await fetch(`${CONFIG.SUPABASE.URL}/ID?id=eq.1&select=statusas`, {
                method: "GET",
                headers: {
                    "apikey": CONFIG.SUPABASE.API_KEY,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) throw new Error("⚠️ Failed to fetch ID status");

            const data = await response.json();
            if (data.length > 0) {
                idStatus = data[0].statusas || "uždaryta";
                console.log("📜 Current ID Status:", idStatus);
            } else {
                idStatus = "uždaryta";
                console.log("❗ No ID status found, defaulting to 'uždaryta'");
            }
            updateIdStatusDisplay();
        } catch (error) {
            console.error("❌ Error fetching ID status:", error);
        }
    }

    // NEW FUNCTION: Toggle ID Status
    async function toggleIdStatus() {
        // Toggle between "atidaryta" and "uždaryta"
        idStatus = idStatus === "atidaryta" ? "uždaryta" : "atidaryta";
        updateIdStatusDisplay();

        try {
            const response = await fetch(`${CONFIG.SUPABASE.URL}/ID?id=eq.1`, {
                method: "PATCH",
                headers: {
                    "apikey": CONFIG.SUPABASE.API_KEY,
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal"
                },
                body: JSON.stringify({ statusas: idStatus })
            });

            if (!response.ok) throw new Error("⚠️ Failed to update ID status");
            console.log(`🔄 ID Status changed to: ${idStatus}`);
            alert(`✅ ID Statusas pakeistas į: ${idStatus}`);
        } catch (error) {
            console.error("❌ Error updating ID status:", error);
            alert("⚠️ Nepavyko atnaujinti ID statuso.");
        }
    }

    // NEW FUNCTION: Update ID Status Display
    function updateIdStatusDisplay() {
        const idStatusDisplay = document.getElementById("idStatusDisplay");
        if (idStatusDisplay) {
            if (idStatus === "atidaryta") {
                idStatusDisplay.textContent = "✅ ID Registracija atidaryta ✅";
                idStatusDisplay.classList.remove("status-offline");
                idStatusDisplay.classList.add("status-online");
            } else {
                idStatusDisplay.textContent = "❌ ID Registracija uždaryta ❌";
                idStatusDisplay.classList.remove("status-online");
                idStatusDisplay.classList.add("status-offline");
            }
        }
    }

    // Toggle Status
    async function toggleStatus() {
        // Toggle between "online" and "offline" strings
        isOnline = isOnline === "online" ? "offline" : "online";
        updateStatusDisplay();

        try {
            await fetch(`${CONFIG.SUPABASE.URL}/Status?id=eq.${BLACKLIST_ID}`, {
                method: "PATCH",
                headers: {
                    "apikey": CONFIG.SUPABASE.API_KEY,
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal"
                },
                body: JSON.stringify({ status: isOnline }) // Now sending "online" or "offline"
            });

            console.log(`🔄 Status changed to: ${isOnline}`);
        } catch (error) {
            console.error("❌ Error updating status:", error);
        }
    }

    function updateStatusDisplay() {
        const statusDisplay = document.getElementById("statusDisplay");
        if (isOnline === "online") {
            statusDisplay.textContent = "✅ Anketos atidarytos ✅"; // Custom text for online
        } else {
            statusDisplay.textContent = "❌ Anketos uždarytos ❌"; // Custom text for offline
        }
        // Update class logic based on string values
        statusDisplay.classList.toggle("status-online", isOnline === "online");
        statusDisplay.classList.toggle("status-offline", isOnline === "offline");
    }

    // Populate Table
    function populateTable(data) {
        const dataTableBody = document.querySelector("#data-table tbody");
        dataTableBody.innerHTML = "";

        data.forEach((item, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${index + 1}.</td> <!-- Row number -->
                <td><span class="copy-text" data-copy="${item.DISCORD_ID}">${item.DISCORD_ID}</span></td>
                <td><span class="copy-text" data-copy="${item.USERIS}">${item.USERIS}</span></td>
                <td><span class="copy-text" data-copy="${item.VARDAS}">${item.VARDAS}</span></td>
                <td><span class="copy-text" data-copy="${item.PAVARDĖ}">${item.PAVARDĖ}</span></td>
                <td><span class="copy-text" data-copy="${item["STEAM NICKAS"]}">${item["STEAM NICKAS"]}</span></td>
                <td>
                  <a href="${item["STEAM LINKAS"]}" target="_blank">🔗 Steam Profilis</a>
                  <span class="copy-text" data-copy="${item["STEAM LINKAS"]}">📋</span>
                </td>
            `;
            dataTableBody.appendChild(row);
        });
        
        // Add event listeners to all copy text elements
        document.querySelectorAll('.copy-text').forEach(element => {
            element.addEventListener('click', function() {
                const textToCopy = this.getAttribute('data-copy');
                navigator.clipboard.writeText(textToCopy)
                    .then(() => {
                        // Visual feedback
                        const originalText = this.textContent;
                        this.classList.add('copy-flash');
                        
                        // Only change text content if it's not the clipboard icon
                        if (this.textContent !== '📋') {
                            this.setAttribute('data-original-text', originalText);
                            this.textContent = 'Nukopijuota ✅';
                        } else {
                            this.textContent = '✓';
                        }
                        
                        setTimeout(() => {
                            this.classList.remove('copy-flash');
                            
                            // Restore original text if it was changed
                            if (this.hasAttribute('data-original-text')) {
                                this.textContent = this.getAttribute('data-original-text');
                                this.removeAttribute('data-original-text');
                            } else if (this.textContent === '✓') {
                                this.textContent = '📋';
                            }
                        }, 1000);
                    })
                    .catch(err => {
                        console.error('Failed to copy: ', err);
                    });
            });
        });
    }

    // Fetch Event IDs from Supabase
    async function fetchEventIds() {
        try {
            const response = await fetch(`${CONFIG.SUPABASE.URL}/Event?id=eq.1&select=IDs`, {
                method: "GET",
                headers: {
                    "apikey": CONFIG.SUPABASE.API_KEY,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) throw new Error("⚠️ Failed to fetch event IDs");

            const data = await response.json();
            if (data.length > 0 && data[0].IDs) {
                const eventIds = data[0].IDs;
                console.log("📜 Current Event IDs:", eventIds);
                displayEventIds(eventIds);
                return eventIds;
            } else {
                console.log("❗ No event IDs found");
                displayEventIds([]);
                return [];
            }
        } catch (error) {
            console.error("❌ Error fetching event IDs:", error);
            alert("⚠️ Unable to fetch event IDs.");
            return [];
        }
    }

    // Display Event IDs as individual tags only
    function displayEventIds(ids) {
        const container = document.getElementById("event-ids-display");
        container.innerHTML = "";
        
        if (!ids || ids.length === 0) {
            container.innerHTML = "<p class='empty-message'>Nėra pridėtų ID</p>";
            return;
        }
        
        // Create a comma-separated string of all IDs (for the copy all button)
        const allIdsText = ids.join(", ");
        
        // Create a title for the IDs section
        const idsTitle = document.createElement("h3");
        idsTitle.textContent = "Event IDs:";
        idsTitle.className = "ids-title";
        container.appendChild(idsTitle);
        
        // Create a copy button for all IDs
        const copyAllButton = document.createElement("button");
        copyAllButton.className = "copy-all-button";
        copyAllButton.textContent = "📋 Kopijuoti visus";
        copyAllButton.style.marginTop = "8px";
        copyAllButton.addEventListener("click", function() {
            navigator.clipboard.writeText(allIdsText)
                .then(() => {
                    this.textContent = "✅ Nukopijuota!";
                    setTimeout(() => {
                        this.textContent = "📋 Kopijuoti visus";
                    }, 1000);
                })
                .catch(err => {
                    console.error("Failed to copy: ", err);
                    this.textContent = "❌ Nepavyko kopijuoti";
                    setTimeout(() => {
                        this.textContent = "📋 Kopijuoti visus";
                    }, 1000);
                });
        });
        
        // Add copy button below the title
        container.appendChild(copyAllButton);
        
        // Display individual IDs that can be copied separately
        const individualIdsContainer = document.createElement("div");
        individualIdsContainer.className = "individual-ids-container";
        individualIdsContainer.style.display = "flex";
        individualIdsContainer.style.flexWrap = "wrap";
        individualIdsContainer.style.gap = "5px";
        individualIdsContainer.style.marginTop = "10px";
        
        ids.forEach(id => {
            const idElement = document.createElement("div");
            idElement.className = "event-id-tag copy-text";
            idElement.setAttribute("data-copy", id);
            idElement.textContent = id;
            individualIdsContainer.appendChild(idElement);
        });
        
        container.appendChild(individualIdsContainer);
        
        // Add click event to copy functionality for individual ID elements
        document.querySelectorAll('#event-ids-display .copy-text').forEach(element => {
            element.addEventListener('click', function() {
                const textToCopy = this.getAttribute('data-copy');
                navigator.clipboard.writeText(textToCopy)
                    .then(() => {
                        // Visual feedback
                        const originalText = this.textContent;
                        this.classList.add('copy-flash');
                        this.setAttribute('data-original-text', originalText);
                        this.textContent = 'Nukopijuota ✅';
                        
                        setTimeout(() => {
                            this.classList.remove('copy-flash');
                            this.textContent = this.getAttribute('data-original-text');
                            this.removeAttribute('data-original-text');
                        }, 1000);
                    })
                    .catch(err => {
                        console.error('Failed to copy: ', err);
                    });
            });
        });
    }

    // Clear Event IDs function
    async function clearEventIds() {
        if (!confirm("Ar tikrai norite išvalyti visus Event ID?")) {
            return;
        }
        
        try {
            const response = await fetch(`${CONFIG.SUPABASE.URL}/Event?id=eq.1`, {
                method: "PATCH",
                headers: {
                    "apikey": CONFIG.SUPABASE.API_KEY,
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal"
                },
                body: JSON.stringify({ IDs: [] })
            });

            if (!response.ok) throw new Error("⚠️ Failed to clear event IDs");
            
            alert("✅ Visi ID sėkmingai išvalyti!");
            displayEventIds([]); // Update the display
            
        } catch (error) {
            console.error("❌ Error clearing event IDs:", error);
            alert("⚠️ Nepavyko išvalyti ID.");
        }
    }

    // Add ID Status section to the admin panel
    function addIdStatusSection() {
        const adminPanel = document.querySelector('.admin-panel');
        
        // Create ID status display element
        const idStatusDisplay = document.createElement('p');
        idStatusDisplay.id = 'idStatusDisplay';
        idStatusDisplay.className = idStatus === 'atidaryta' ? 'status-online' : 'status-offline';
        idStatusDisplay.textContent = idStatus === 'atidaryta' ? 
            '✅ IDS atidaryta ✅' : 
            '❌ IDS uždaryta ❌';
        
        // Create ID status toggle button
        const idStatusButton = document.createElement('button');
        idStatusButton.id = 'idStatusButton';
        idStatusButton.textContent = '🔄 Keisti ID statusą';
        idStatusButton.addEventListener('click', toggleIdStatus);
        
        // Add elements to admin panel
        adminPanel.insertBefore(idStatusDisplay, document.getElementById('blacklistButton'));
        adminPanel.insertBefore(idStatusButton, document.getElementById('blacklistButton'));
        
        // Add some spacing
        const spacer = document.createElement('div');
        spacer.style.margin = '10px 0';
        adminPanel.insertBefore(spacer, document.getElementById('blacklistButton'));
    }

    // Event Listeners
    document.getElementById("statusButton").addEventListener("click", toggleStatus);
    document.getElementById("blacklistButton").addEventListener("click", addToBlacklist);
    document.getElementById("removeButton").addEventListener("click", removeFromBlacklist);
    document.getElementById("clearEventIdsButton").addEventListener("click", clearEventIds);

    document.getElementById("searchInput").addEventListener("input", function () {
        const searchInput = this.value.toLowerCase();

        const filteredData = fetchedData.filter(item => 
            Object.values(item).some(value => 
                value.toString().toLowerCase().includes(searchInput)
            )
        );

        populateTable(filteredData); // Re-populate table with filtered results
    });

    // Initialize the application
    const init = async () => {
        // Check if already authenticated
        if (checkAuthentication()) {
            showContent();
            await fetchSupabaseData();
            await fetchBlacklist();
            await fetchStatus();
            await fetchEventIds();
            await fetchIdStatus(); // Fetch ID status
            addIdStatusSection(); // Add ID status section to the admin panel
        } else {
            showAuthOverlay();
        }
    };

    // Start the application
    init();
});
