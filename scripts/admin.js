document.addEventListener("DOMContentLoaded", async function () {
    console.log("✅ Admin panel loaded");

    const CONFIG = {
        SUPABASE: {
            URL: "https://supa.mielamalonu.com/api/supabase/",
            API_KEY: "cbb"
        },
        DISCORD: {
            CLIENT_ID: "1263389179249692693", // Replace with your Discord app's client ID
            REDIRECT_URI: window.location.origin + window.location.pathname, // Current URL
            SCOPE: "identify",
        },
        ALLOWED_ADMIN_IDS: [
            "959449311366766622", // Replace with actual admin Discord IDs
            "495602170507296778",
            "1365306133212037213",
         

        ],
        AUTH_KEY: "miela_malonu_auth"  // Key for local storage
    };

    const BLACKLIST_ID = 1;
    let fetchedData = [];
    let blacklist = [];
    let isOnline = "offline";
    let idStatus = "uždaryta";
    let currentUser = null;

// Create and add notification container
function createNotificationContainer() {
    if (!document.getElementById('notification-container')) {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(container);
    }
}

// Show notification
function showNotification(message, type = 'info') {
    createNotificationContainer();
    const container = document.getElementById('notification-container');
    
    const notification = document.createElement('div');
    notification.classList.add('notification', `notification-${type}`);
    notification.style.cssText = `
        padding: 15px 20px;
        border-radius: 8px;
        margin-bottom: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        font-weight: 500;
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-width: 280px;
        max-width: 400px;
        opacity: 0;
        transform: translateX(30px);
        transition: all 0.3s ease;
        animation: slideIn 0.3s forwards;
    `;
    
    // Set background color based on type
    switch(type) {
        case 'success':
            notification.style.background = 'linear-gradient(135deg, #4CAF50, #2E7D32)';
            notification.style.color = 'white';
            break;
        case 'error':
            notification.style.background = 'linear-gradient(135deg, #F44336, #C62828)';
            notification.style.color = 'white';
            break;
        case 'warning':
            notification.style.background = 'linear-gradient(135deg, #FF9800, #EF6C00)';
            notification.style.color = 'white';
            break;
        default:
            notification.style.background = 'linear-gradient(135deg, #2196F3, #0D47A1)';
            notification.style.color = 'white';
    }
    
    // Add message and close button
    notification.innerHTML = `
        <span>${message}</span>
        <button style="background: none; border: none; color: white; cursor: pointer; margin-left: 10px; font-size: 18px;">×</button>
    `;
    
    // Add click event to close button
    notification.querySelector('button').addEventListener('click', () => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(30px)';
        setTimeout(() => notification.remove(), 300);
    });
    
    // Add to container
    container.appendChild(notification);
    
    // Add CSS animation
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes slideIn {
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
    `;
    document.head.appendChild(style);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(30px)';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Show custom popup
function showPopup({ title, message, customContent, inputField = false, confirmText = 'Gerai', cancelText = 'Atšaukti', onConfirm, onCancel }) {
    // Create container
    const container = document.createElement('div');
    container.className = 'popup-container';
    
    // Create popup
    const popup = document.createElement('div');
    popup.className = 'popup';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'popup-header';
    
    // Create title
    const titleEl = document.createElement('h3');
    titleEl.textContent = title;
    header.appendChild(titleEl);
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = 'popup-close';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => {
        closePopup();
        if (onCancel) onCancel();
    });
    
    // Create content
    const content = document.createElement('div');
    content.className = 'popup-content';
    
    // Handle custom content or regular message
    if (customContent) {
        content.innerHTML = customContent;
    } else if (message) {
        content.textContent = message;
    }
    
    // Add input field if needed
    let inputEl;
    if (inputField) {
        inputEl = document.createElement('textarea');
        inputEl.className = 'popup-input';
        inputEl.style.width = '100%';
        inputEl.style.padding = '10px';
        inputEl.style.borderRadius = '8px';
        inputEl.style.marginTop = '15px';
        inputEl.style.background = 'rgba(30, 30, 30, 0.7)';
        inputEl.style.color = 'white';
        inputEl.style.border = '1px solid rgba(80, 80, 80, 0.5)';
    }
    
    // Create buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'popup-actions';
    
    // Create cancel button
    let cancelBtn;
    if (cancelText && cancelText !== 'none') {
        cancelBtn = document.createElement('button');
        cancelBtn.textContent = cancelText;
        cancelBtn.className = 'cancel';
        cancelBtn.addEventListener('click', () => {
            closePopup();
            if (onCancel) onCancel();
        });
        buttonsContainer.appendChild(cancelBtn);
    }
    
    // Create confirm button
    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = confirmText;
    confirmBtn.className = 'confirm';
    confirmBtn.addEventListener('click', () => {
        closePopup();
        if (onConfirm) {
            if (inputField) {
                onConfirm(inputEl.value);
            } else {
                onConfirm();
            }
        }
    });
    buttonsContainer.appendChild(confirmBtn);
    
    // Assemble popup
    popup.appendChild(closeButton);
    popup.appendChild(header);
    popup.appendChild(content);
    if (inputField) {
        popup.appendChild(inputEl);
    }
    popup.appendChild(buttonsContainer);
    
    // Add popup to container
    container.appendChild(popup);
    
    // Add container to body
    document.body.appendChild(container);
    
    // Trigger animation by adding active class after a small delay
    setTimeout(() => {
        container.classList.add('active');
        popup.classList.add('active');
    }, 10);
    
    // Function to close popup
    function closePopup() {
        container.classList.remove('active');
        popup.classList.remove('active');
        setTimeout(() => {
            container.remove();
        }, 300);
    }
}
    // Check if we have a Discord auth code in the URL (redirect from Discord OAuth)
    async function handleDiscordCallback() {
        // Check for token in hash (implicit grant)
        const urlParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = urlParams.get("access_token");
        
        // Check for code in query parameters (authorization code flow)
        const queryParams = new URLSearchParams(window.location.search);
        const authCode = queryParams.get("code");
        
        console.log("Auth check - Token:", accessToken, "Code:", authCode);
        
        if (accessToken) {
            // Clear the URL to remove the token
            window.history.replaceState({}, document.title, window.location.pathname);
            
            try {
                // Get user info from Discord
                const userResponse = await fetch('https://discord.com/api/users/@me', {
                    headers: {
                        authorization: `Bearer ${accessToken}`,
                    },
                });
                
                if (!userResponse.ok) throw new Error("Failed to get Discord user data");
                
                const userData = await userResponse.json();
                console.log("✅ Discord user data received:", userData);
                
                // Check if user ID is in the allowed list
                if (CONFIG.ALLOWED_ADMIN_IDS.includes(userData.id)) {
                    // Store user data and authentication
                    currentUser = userData;
                    storeAuthentication(userData);
                    
                    showContent();
                    await fetchSupabaseData();
                    await fetchBlacklist();
                    await fetchStatus();
                    await fetchEventIds();
                    await fetchIdStatus();
                    addIdStatusSection();
                    
                    // Display welcome message with username
                    showWelcomeMessage(userData.username);
                } else {
                    // Not authorized
                    showAuthError("Neturite teisių prieiti prie administracijos puslapio.");
                }
            } catch (error) {
                console.error("❌ Error processing Discord auth:", error);
                showAuthError("Įvyko klaida autentifikuojant per Discord.");
            }
        } else if (authCode) {
            // If you're using authorization code flow instead of implicit flow
            console.log("Authorization code found, but this implementation uses implicit flow");
            showAuthError("Netinkamas autorizacijos metodas. Prašome susisiekti su administratoriumi.");
        }
    }

    // Show welcome message
    function showWelcomeMessage(username) {
        const adminPanel = document.querySelector('.admin-panel');
        const welcomeMsg = document.createElement('p');
        welcomeMsg.className = 'welcome-message';
        welcomeMsg.textContent = `Sveiki, ${username}!`;
        adminPanel.insertBefore(welcomeMsg, adminPanel.firstChild);
    }

    // Show authentication error message
    function showAuthError(message) {
        const authOverlay = document.querySelector('.auth-overlay');
        const errorMsg = document.createElement('p');
        errorMsg.className = 'auth-error';
        errorMsg.textContent = message;
        errorMsg.style.color = '#ff5555';
        errorMsg.style.marginTop = '10px';
        
        // Remove existing error messages
        document.querySelectorAll('.auth-error').forEach(el => el.remove());
        
        // Add new error message
        if (authOverlay) {
            authOverlay.appendChild(errorMsg);
        } else {
            showAuthOverlay();
            document.querySelector('.auth-overlay').appendChild(errorMsg);
        }
    }

    // Check if already authenticated via local storage
    function checkAuthentication() {
        const authData = localStorage.getItem(CONFIG.AUTH_KEY);
        if (authData) {
            try {
                currentUser = JSON.parse(authData);
                console.log("✅ Authentication found in local storage");
                return true;
            } catch (e) {
                console.error("❌ Error parsing auth data:", e);
                clearAuthentication();
                return false;
            }
        }
        return false;
    }

    // Store authentication in local storage
    function storeAuthentication(userData) {
        localStorage.setItem(CONFIG.AUTH_KEY, JSON.stringify(userData));
        console.log("✅ Authentication stored in local storage");
    }

    // Clear authentication from local storage
    function clearAuthentication() {
        localStorage.removeItem(CONFIG.AUTH_KEY);
        currentUser = null;
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

    // Build Discord OAuth URL
    function getDiscordAuthUrl() {
        return `https://discord.com/api/oauth2/authorize?client_id=${CONFIG.DISCORD.CLIENT_ID}&redirect_uri=${encodeURIComponent(CONFIG.DISCORD.REDIRECT_URI)}&response_type=token&scope=${CONFIG.DISCORD.SCOPE}`;
    }

    // Create and show auth overlay with Discord OAuth button
    function showAuthOverlay() {
        // Hide all other content first
        hideContent();
        
        // Create auth overlay if it doesn't exist
        if (!document.querySelector('.auth-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'auth-overlay';
            
            const title = document.createElement('h2');
            title.textContent = 'Admin prisijungimas';
            
            const discordButton = document.createElement('button');
            discordButton.className = 'discord-login-button';
            discordButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M19.54 0c1.356 0 2.46 1.104 2.46 2.472v21.528l-2.58-2.28-1.452-1.344-1.536-1.428.636 2.22h-13.608c-1.356 0-2.46-1.104-2.46-2.472v-16.224c0-1.368 1.104-2.472 2.46-2.472h16.08zm-4.632 15.672c2.652-.084 3.672-1.824 3.672-1.824 0-3.864-1.728-6.996-1.728-6.996-1.728-1.296-3.372-1.26-3.372-1.26l-.168.192c2.04.624 2.988 1.524 2.988 1.524-1.248-.684-2.472-1.02-3.612-1.152-.864-.096-1.692-.072-2.424.024l-.204.024c-.42.036-1.44.192-2.724.756-.444.204-.708.348-.708.348s.996-.948 3.156-1.572l-.12-.144s-1.644-.036-3.372 1.26c0 0-1.728 3.132-1.728 6.996 0 0 1.008 1.74 3.66 1.824 0 0 .444-.54.804-.996-1.524-.456-2.1-1.416-2.1-1.416l.336.204.048.036.047.027.014.006.047.027c.3.168.6.3.876.408.492.192 1.08.384 1.764.516.9.168 1.956.228 3.108.012.564-.096 1.14-.264 1.74-.516.42-.156.888-.384 1.38-.708 0 0-.6.984-2.172 1.428.36.456.792.972.792.972zm-5.58-5.604c-.684 0-1.224.6-1.224 1.332 0 .732.552 1.332 1.224 1.332.684 0 1.224-.6 1.224-1.332.012-.732-.54-1.332-1.224-1.332zm4.38 0c-.684 0-1.224.6-1.224 1.332 0 .732.552 1.332 1.224 1.332.684 0 1.224-.6 1.224-1.332 0-.732-.54-1.332-1.224-1.332z" fill="currentColor"></path></svg> Prisijungti su Discord';
            discordButton.addEventListener('click', function() {
                window.location.href = getDiscordAuthUrl();
            });
            
            overlay.appendChild(title);
            overlay.appendChild(discordButton);
            
            document.body.appendChild(overlay);
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
  // Add User to Blacklist
async function addToBlacklist() {
    showPopup({
        title: "Pridėti į Blacklist",
        message: "Įveskite vartotojo ID, kurį norite pridėti į blacklist:",
        inputField: true,
        confirmText: "Pridėti",
        onConfirm: async (userId) => {
            if (!userId || userId.trim() === '') {
                showNotification("⚠️ Negalima pridėti tuščio ID.", 'error');
                return;
            }
            
            if (blacklist.includes(userId)) {
                showNotification("⚠️ Asmuo jau yra blackliste.", 'warning');
                return;
            }
            
            blacklist.push(userId);

            try {
                const response = await fetch(`${CONFIG.SUPABASE.URL}/Blacklist?id=eq.${BLACKLIST_ID}`, {
                    method: "PATCH",
                    headers: {
                        "apikey": CONFIG.SUPABASE.API_KEY,
                        "Content-Type": "application/json",
                     
                    },
                    body: JSON.stringify({ blacklist })
                });

                if (!response.ok) throw new Error("⚠️ Failed to update blacklist");
                showNotification("✅ Asmuo pridėtas į Blacklistą!", 'success');
                console.log("📜 Updated Blacklist:", blacklist);

            } catch (error) {
                console.error("❌ Error updating blacklist:", error);
                showNotification("⚠️ Nepavyko atnaujinti blacklisto.", 'error');
            }
        }
    });
}

   // Remove User from Blacklist
async function removeFromBlacklist() {
    showPopup({
        title: "Pašalinti iš Blacklisto",
        message: "Įveskite vartotojo ID, kurį norite pašalinti iš blacklisto:",
        inputField: true,
        confirmText: "Pašalinti",
        onConfirm: async (userId) => {
            if (!userId || userId.trim() === '') {
                showNotification("⚠️ Negalima pašalinti tuščio ID.", 'error');
                return;
            }
            
            if (!blacklist.includes(userId)) {
                showNotification("⚠️ Asmuo nėra Blackliste.", 'warning');
                return;
            }
            
            blacklist = blacklist.filter(id => id !== userId);

            try {
                const response = await fetch(`${CONFIG.SUPABASE.URL}/Blacklist?id=eq.${BLACKLIST_ID}`, {
                    method: "PATCH",
                    headers: {
                        "apikey": CONFIG.SUPABASE.API_KEY,
                        "Content-Type": "application/json",
                    
                    },
                    body: JSON.stringify({ blacklist })
                });

                if (!response.ok) throw new Error("⚠️ Failed to update blacklist");
                showNotification("✅ Asmuo pašalintas iš Blacklisto!", 'success');
                console.log("📜 Updated Blacklist:", blacklist);

            } catch (error) {
                console.error("❌ Error updating blacklist:", error);
                showNotification("⚠️ Nepavyko atnaujinti blacklisto.", 'error');
            }
        }
    });
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
                idStatusDisplay.textContent = "✅ IDS atidaryta ✅";
                idStatusDisplay.classList.remove("status-offline");
                idStatusDisplay.classList.add("status-online");
            } else {
                idStatusDisplay.textContent = "❌ IDS uždaryta ❌";
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
<td>
  <button class="warning-button" data-user-id="${item.DISCORD_ID}" data-user-name="${item.USERIS}">⚠️</button>
  <button class="view-warnings-button" data-user-id="${item.DISCORD_ID}" data-user-name="${item.USERIS}">📋</button>
</td>
        `;
        dataTableBody.appendChild(row);
    });
    
    // Add event listeners to all warning buttons
    document.querySelectorAll('.warning-button').forEach(button => {
        button.addEventListener('click', handleWarningButton);
    });

    // Add event listeners to all view warnings buttons
document.querySelectorAll('.view-warnings-button').forEach(button => {
    button.addEventListener('click', function() {
        const userId = this.getAttribute('data-user-id');
        const userName = this.getAttribute('data-user-name');
  viewUserWarnings(userId, userName); // Fixed: Added function name
    });
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
async function handleWarningButton() {
    const userId = this.getAttribute('data-user-id');
    const userName = this.getAttribute('data-user-name');
    
    // Show custom popup instead of prompt
    showPopup({
        title: `Įspėjimo pridėjimas`,
        message: `Įveskite įspėjimo priežastį vartotojui ${userName}:`,
        inputField: true,
        confirmText: "Pridėti įspėjimą",
        onConfirm: async (reason) => {
            if (!reason || reason.trim() === '') {
                showNotification('⚠️ Įspėjimas nebuvo sukurtas. Priežastis yra privaloma.', 'error');
                return;
            }
            
            // Get current date in YYYY-MM-DD format
            const currentDate = new Date().toISOString().split('T')[0];
            
            // Create warning object
            const warningData = {
                ID: userId,
                DATA: currentDate,
                PRIEŽASTIS: reason
            };
            
            try {
                const response = await fetch(`${CONFIG.SUPABASE.URL}Ispejimai`, {
                    method: "POST",
                    headers: {
                     
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(warningData)
                });

                if (!response.ok) throw new Error("⚠️ Failed to create warning");
                
                // Show success notification
                showNotification(`✅ Įspėjimas vartotojui ${userName} sėkmingai sukurtas!`, 'success');
                
                // Visual feedback on the button
                this.textContent = "✓";
                setTimeout(() => {
                    this.textContent = "⚠️";
                }, 2000);
                
            } catch (error) {
                console.error("❌ Error creating warning:", error);
                showNotification("⚠️ Nepavyko sukurti įspėjimo.", 'error');
            }
        }
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

// Function to view user warnings
async function viewUserWarnings(userId, userName) {
    try {
        // Fetch warnings for this user
        const response = await fetch(`${CONFIG.SUPABASE.URL}/Ispejimai?ID=eq.${userId}&order=DATA.asc`, {
            method: "GET",
            headers: {
                "apikey": CONFIG.SUPABASE.API_KEY,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) throw new Error("Failed to fetch warnings");
        
        const warnings = await response.json();
        
        // Format the warnings for display
        let warningsHTML = "";
        
        if (warnings.length === 0) {
            warningsHTML = "<p>Vartotojas neturi įspėjimų.</p>";
        } else {
            // Remove the warning count text
            // warningsHTML = `<p class="warning-count">Vartotojas turi ${warnings.length} įspėjimų:</p>`;
            
            warnings.forEach((warning, index) => {
                // Format the date properly (YYYY-MM-DD)
                const warningDate = warning.DATA.split('T')[0];
                
                warningsHTML += `
                    <div class="warning-item">
                        <div class="warning-header">
                            <span class="warning-number">#${index + 1}</span>
                            <span class="warning-date">${warningDate}</span>
                        </div>
                        <div class="warning-reason">${warning.PRIEŽASTIS}</div>
                    </div>
                `;
            });
        }
        
        // Show the warnings in a popup with only one confirmation button
        showPopup({
            title: `Įspėjimai: ${userName}`,
            customContent: `<div class="warnings-list">${warningsHTML}</div>`,
            confirmText: "Uždaryti",
            cancelText: "none" // This ensures there's only one button
        });
        
    } catch (error) {
        console.error("Error fetching warnings:", error);
        showNotification("Nepavyko gauti įspėjimų.", 'error');
    }
}
    // Clear Event IDs function
   // Clear Event IDs function
async function clearEventIds() {
    showPopup({
        title: "Išvalyti Event ID",
        message: "Ar tikrai norite išvalyti visus Event ID?",
        confirmText: "Išvalyti",
        onConfirm: async () => {
            try {
                const response = await fetch(`${CONFIG.SUPABASE.URL}/Event?id=eq.1`, {
                    method: "PATCH",
                    headers: {
                        "apikey": CONFIG.SUPABASE.API_KEY,
                        "Content-Type": "application/json",
                       
                    },
                    body: JSON.stringify({ IDs: [] })
                });

                if (!response.ok) throw new Error("⚠️ Failed to clear event IDs");
                
                showNotification("✅ Visi ID sėkmingai išvalyti!", 'success');
                displayEventIds([]); // Update the display
                
            } catch (error) {
                console.error("❌ Error clearing event IDs:", error);
                showNotification("⚠️ Nepavyko išvalyti ID.", 'error');
            }
        }
    });
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

 document.getElementById("searchInput").addEventListener("input", function() {
    const searchInput = this.value.toLowerCase();
    
    // Make sure we're only searching the main data table, not the holidays table
    if (fetchedData && fetchedData.length > 0) {
        try {
            const filteredData = fetchedData.filter(item => {
                if (!item) return false;
                
                return Object.entries(item).some(([key, value]) => {
                    if (value === null || value === undefined) return false;
                    return String(value).toLowerCase().includes(searchInput);
                });
            });
            
            // Only update the main data table
            const dataTableBody = document.querySelector("#data-table tbody");
            if (dataTableBody) {
                // Clear current table data
                dataTableBody.innerHTML = "";
                
                // Repopulate with filtered data
                filteredData.forEach((item, index) => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${index + 1}.</td>
                        <td><span class="copy-text" data-copy="${item.DISCORD_ID}">${item.DISCORD_ID}</span></td>
                        <td><span class="copy-text" data-copy="${item.USERIS}">${item.USERIS}</span></td>
                        <td><span class="copy-text" data-copy="${item.VARDAS}">${item.VARDAS}</span></td>
                        <td><span class="copy-text" data-copy="${item.PAVARDĖ}">${item.PAVARDĖ}</span></td>
                        <td><span class="copy-text" data-copy="${item["STEAM NICKAS"]}">${item["STEAM NICKAS"]}</span></td>
                        <td>
                          <a href="${item["STEAM LINKAS"]}" target="_blank">🔗 Steam Profilis</a>
                          <span class="copy-text" data-copy="${item["STEAM LINKAS"]}">📋</span>
                        </td>
<td>
  <button class="warning-button" data-user-id="${item.DISCORD_ID}" data-user-name="${item.USERIS}">⚠️</button>
  <button class="view-warnings-button" data-user-id="${item.DISCORD_ID}" data-user-name="${item.USERIS}">📋</button>
</td>
                    `;
                    dataTableBody.appendChild(row);
                });
                // Add event listeners to all view warnings buttons
document.querySelectorAll('.view-warnings-button').forEach(button => {
    button.addEventListener('click', function() {
        const userId = this.getAttribute('data-user-id');
        const userName = this.getAttribute('data-user-name');
        viewUserWarnings(userId, userName);

    });
});
                // Reattach copy functionality to the newly created elements
                addCopyFunctionality();
document.querySelectorAll('.warning-button').forEach(button => {
                    button.addEventListener('click', handleWarningButton);
                });
            }
        } catch (error) {
            console.error("Error filtering data:", error);
        }
    }
});

// Helper function to add copy functionality to elements (extracted from populateTable)
function addCopyFunctionality() {
    document.querySelectorAll('#data-table .copy-text').forEach(element => {
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

    // Initialize the application
 const init = async () => {
        console.log("🚀 Initializing admin panel");
        
        // First check if there's an OAuth callback to handle
        if (window.location.hash.includes("access_token=") || window.location.search.includes("code=")) {
            console.log("🔑 OAuth callback detected");
            await handleDiscordCallback();
        }
        // Then check if already authenticated
        else if (checkAuthentication()) {
            console.log("🔒 Already authenticated");
            showContent();
            await fetchSupabaseData();
            await fetchBlacklist();
            await fetchStatus();
            await fetchEventIds();
            await fetchIdStatus();
            addIdStatusSection();
            // Display welcome message with username
            if (currentUser && currentUser.username) {
                showWelcomeMessage(currentUser.username);
            }
        } else {
            console.log("🔓 Not authenticated, showing login");
            showAuthOverlay();
        }
    };

    // Start the application
    init();
});
