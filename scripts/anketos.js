const DEBUG = true;
function debug(...args) {
    if (DEBUG) console.log("DEBUG:", ...args);
}

debug("Script started");

// API endpoints configuration
const API_BASE_URL = "https://supa.mielamalonu.com/api/supabase";
const API_KEY = "cbb";

// Discord OAuth configuration
const DISCORD_CLIENT_ID = "1263389179249692693";
const DISCORD_REDIRECT_URI = encodeURIComponent(window.location.origin + window.location.pathname);

// IMPORTANT: Change this to your Discord user ID for testing
const ADMIN_DISCORD_ID = "959449311366766622";

let discordToken = null;
let discordUserId = null;
let pendingAppIdToDelete = null;
let authWindow = null;

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function getStatusClass(status) {
    if (!status) return 'status-reviewing';
    
    status = status.toLowerCase();
    
    // Check for keywords in the status regardless of surrounding text
    if (status.includes('patvirtinta') || status.includes('priimtas') || status.includes('accepted')) {
        return 'status-accepted';
    } else if (status.includes('atmesta') || status.includes('atmestas') || status.includes('rejected')) {
        return 'status-rejected';
    } else if (status.includes('laukiama') || status.includes('pending')) {
        return 'status-pending';
    } else {
        return 'status-reviewing';
    }
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    
    try {
        const date = new Date(dateStr);
        return date.toISOString().split('T')[0];
    } catch (e) {
        return dateStr;
    }
}

function showOAuthPopup() {
    debug("Showing OAuth popup");
    document.getElementById('oauth-popup').classList.remove('hidden');
}

function hideOAuthPopup() {
    debug("Hiding OAuth popup");
    document.getElementById('oauth-popup').classList.add('hidden');
}

function showStatusMessage(message, isError = false) {
    debug("Status message:", message, isError ? "(error)" : "");
    const statusElement = document.getElementById('status-message');
    statusElement.textContent = message;
    statusElement.classList.remove('hidden', 'success-message', 'error-message');
    statusElement.classList.add(isError ? 'error-message' : 'success-message');
    
    setTimeout(() => {
        statusElement.classList.add('hidden');
    }, 5000);
}

function openDiscordAuthPopup() {
    debug("Opening Discord OAuth popup");
    const width = 600;
    const height = 800;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    const DISCORD_OAUTH_URL = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${DISCORD_REDIRECT_URI}&response_type=token&scope=identify`;
    
    authWindow = window.open(
        DISCORD_OAUTH_URL,
        'Discord Authentication',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
    
    // Poll for access token
    const pollTimer = setInterval(() => {
        try {
            if (authWindow.closed) {
                clearInterval(pollTimer);
                return;
            }
            
            const currentUrl = authWindow.location.href;
            if (currentUrl.includes('access_token=')) {
                clearInterval(pollTimer);
                
                // Extract token
                const hashParams = new URLSearchParams(authWindow.location.hash.substring(1));
                const accessToken = hashParams.get('access_token');
                
                authWindow.close();
                
                if (accessToken) {
                    debug("Got access token from popup:", accessToken.substring(0, 10) + "...");
                    handleDiscordAuth(accessToken);
                }
            }
        } catch (e) {
            // This will throw an exception when accessing location on a different domain
            // which is expected during the OAuth flow, we can ignore it
        }
    }, 500);
}

async function handleDiscordAuth(accessToken) {
    debug("Handling Discord auth with token");
    hideOAuthPopup();
    
    const userInfo = await getUserInfo(accessToken);
    
    if (userInfo) {
        discordToken = accessToken;
        discordUserId = userInfo.id;
        debug("Auth successful:", userInfo.username, discordUserId);
        debug("Is admin?", discordUserId === ADMIN_DISCORD_ID);
        
        if (pendingAppIdToDelete) {
            debug("Processing pending deletion:", pendingAppIdToDelete);
            const tempAppId = pendingAppIdToDelete;
            pendingAppIdToDelete = null;
            await deleteApplication(tempAppId);
        }
    } else {
        showStatusMessage("Discord authentication failed. Please try again.", true);
    }
}

async function getUserInfo(token) {
    debug("Getting user info with token:", token.substring(0, 10) + "...");
    try {
        const response = await fetch('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            debug("Discord API error:", response.status, errorText);
            throw new Error(`Failed to get user info from Discord: ${response.status}`);
        }
        
        const data = await response.json();
        debug("User info received:", data.username, data.id);
        return data;
    } catch (error) {
        debug("Error getting Discord user info:", error);
        console.error('Error getting Discord user info:', error);
        return null;
    }
}

async function deleteApplication(appId) {
    debug("Attempting to delete application:", appId);
    debug("Current user ID:", discordUserId);
    debug("Admin ID:", ADMIN_DISCORD_ID);
    
    try {
        // Check if the authenticated user is the admin
        if (discordUserId !== ADMIN_DISCORD_ID) {
            debug("Delete failed: Not admin");
            showStatusMessage("Negalite to padaryti. Jūs neturite administratoriaus teisių.", true);
            return false;
        }
        
        debug("User is admin, proceeding with deletion");
        
        // Get the full application data first
        const dataFetchUrl = `${API_BASE_URL}/Anketos?ID=eq.${encodeURIComponent(appId.trim())}`;
        debug("Fetching application details:", dataFetchUrl);
        
        const dataResponse = await fetch(dataFetchUrl, {
            headers: {
                'apikey': API_KEY,
                'Authorization': `Bearer ${API_KEY}`
            }
        });
        
        if (!dataResponse.ok) {
            throw new Error(`Failed to fetch application details. Status: ${dataResponse.status}`);
        }
        
        const applications = await dataResponse.json();
        debug("Found applications:", applications.length);
        
        if (applications.length === 0) {
            throw new Error("Application not found");
        }
        
        // Get the specific application that was clicked by looking at DOM data
        const clickedElement = document.querySelector(`.application-item[data-id="${appId}"]`);
        if (!clickedElement) {
            throw new Error("Could not locate the clicked application in the DOM");
        }
        
        // Extract all visible data from the clicked element using proper DOM methods
        const clickedData = {
            nick: clickedElement.querySelector('.user-id')?.textContent.trim().replace('@', ''),
            status: clickedElement.querySelector('.status-tag')?.textContent.trim(),
            date: clickedElement.querySelector('.application-date')?.textContent.trim()
        };
        
        // Find fields by iterating through all field names and matching text content
        const fieldNameElements = clickedElement.querySelectorAll('.field-name');
        fieldNameElements.forEach(fieldElement => {
            const text = fieldElement.textContent.trim();
            const valueElement = fieldElement.nextElementSibling;
            
            if (text.includes('Amžius') && valueElement) {
                clickedData.metai = valueElement.textContent.trim();
            } else if (text.includes('pc check') && valueElement) {
                clickedData.pccheck = valueElement.textContent.trim();
            } else if (text.includes('įspėjimą') && valueElement) {
                clickedData.isp = valueElement.textContent.trim();
            } else if (text.includes('Atmetimo priežastis') && valueElement) {
                clickedData.priezastis = valueElement.textContent.trim();
            }
        });
        
        // Find rating values
        const ratingLabelElements = clickedElement.querySelectorAll('.rating-label');
        ratingLabelElements.forEach(labelElement => {
            const text = labelElement.textContent.trim();
            const valueElement = labelElement.nextElementSibling;
            
            if (text.includes('Pašaudymo lygis') && valueElement) {
                clickedData.pl = valueElement.textContent.trim();
            } else if (text.includes('Komunikavimo lygis') && valueElement) {
                clickedData.kl = valueElement.textContent.trim();
            }
        });
        
        debug("Clicked element data:", clickedData);
        
        // Find the application in the fetched data that best matches the clicked element
        let targetApp = null;
        let bestMatchScore = 0;
        
        for (const app of applications) {
            let matchScore = 0;
            
            // Check each field for a match, giving points for each match
            if (app.NICK === clickedData.nick) matchScore += 10;
            if (app.STATUS === clickedData.status) matchScore += 5;
            if (formatDate(app.DATA) === clickedData.date) matchScore += 8;
            if (app.METAI && clickedData.metai && app.METAI.toString() === clickedData.metai) matchScore += 3;
            if (app.PL && clickedData.pl && app.PL.toString() === clickedData.pl) matchScore += 3;
            if (app.KL && clickedData.kl && app.KL.toString() === clickedData.kl) matchScore += 3;
            if (app.PCCHECK === clickedData.pccheck) matchScore += 3;
            if (app.ISP === clickedData.isp) matchScore += 3;
            if (app.PRIEŽASTIS === clickedData.priezastis) matchScore += 3;
            
            debug(`App match score (${app.NICK}, ${formatDate(app.DATA)}): ${matchScore}`);
            
            // Select the application with the highest match score
            if (matchScore > bestMatchScore) {
                bestMatchScore = matchScore;
                targetApp = app;
            }
        }
        
        if (!targetApp) {
            throw new Error("Could not identify the specific application to delete");
        }
        
        debug("Found target application for deletion:", targetApp);
        
        // Build a URL that uniquely identifies this specific record
        let deleteUrl = `${API_BASE_URL}/Anketos?ID=eq.${encodeURIComponent(appId.trim())}`;
        
        // Add all available fields as filters
        if (targetApp.DATA) {
            deleteUrl += `&DATA=eq.${encodeURIComponent(targetApp.DATA)}`;
        }
        if (targetApp.NICK) {
            deleteUrl += `&NICK=eq.${encodeURIComponent(targetApp.NICK)}`;
        }
        if (targetApp.STATUS) {
            deleteUrl += `&STATUS=eq.${encodeURIComponent(targetApp.STATUS)}`;
        }
        if (targetApp.METAI !== null && targetApp.METAI !== undefined) {
            deleteUrl += `&METAI=eq.${encodeURIComponent(targetApp.METAI)}`;
        }
        if (targetApp.PL !== null && targetApp.PL !== undefined) {
            deleteUrl += `&PL=eq.${encodeURIComponent(targetApp.PL)}`;
        }
        if (targetApp.KL !== null && targetApp.KL !== undefined) {
            deleteUrl += `&KL=eq.${encodeURIComponent(targetApp.KL)}`;
        }
        if (targetApp.PCCHECK) {
            deleteUrl += `&PCCHECK=eq.${encodeURIComponent(targetApp.PCCHECK)}`;
        }
        if (targetApp.ISP) {
            deleteUrl += `&ISP=eq.${encodeURIComponent(targetApp.ISP)}`;
        }
        if (targetApp.PRIEŽASTIS) {
            deleteUrl += `&PRIEŽASTIS=eq.${encodeURIComponent(targetApp.PRIEŽASTIS)}`;
        }
        
        debug("Delete URL with all filters:", deleteUrl);
        
        // Make the DELETE request to the API
        const response = await fetch(deleteUrl, {
            method: 'DELETE',
            headers: {
                'apikey': API_KEY,
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        // Log the full response for debugging
        debug("Delete response status:", response.status);
        let responseText = '';
        
        try {
            responseText = await response.text();
            debug("Delete response text:", responseText);
        } catch (e) {
            debug("Could not get response text:", e);
        }
        
        if (!response.ok) {
            throw new Error(`Failed to delete. Status: ${response.status}`);
        }
        
        showStatusMessage("Aplikacija sėkmingai ištrinta!");
        debug("Delete successful");
        
        // Remove the deleted application from the DOM
        clickedElement.remove();
        
        return true;
    } catch (error) {
        debug("Error deleting application:", error);
        console.error('Error deleting application:', error);
        showStatusMessage(`Klaida trinant aplikaciją: ${error.message}`, true);
        return false;
    }
}

async function removeApplication(appId) {
    debug("Remove application clicked:", appId);
    pendingAppIdToDelete = appId;
    
    if (!discordToken || !discordUserId) {
        debug("No Discord token/user ID, showing auth popup");
        showOAuthPopup();
        return false;
    }
    
    debug("Has Discord auth, confirming deletion");
    if (confirm("Ar tikrai norite ištrinti šią aplikaciją?")) {
        await deleteApplication(appId);
    } else {
        debug("User cancelled deletion");
        pendingAppIdToDelete = null;
    }
}

function createDiscordEmbeds(applications) {
    debug("Creating embeds for", applications ? applications.length : 0, "applications");
    if (!applications || applications.length === 0) {
        return '<div class="error">No applications found.</div>';
    }

    let embedsHtml = '';

    applications.forEach(app => {
        const statusClass = getStatusClass(app.STATUS);
        const formattedDate = formatDate(app.DATA);
        
        // Check if the status contains any rejection keywords
        const isRejected = app.STATUS && (
            app.STATUS.toLowerCase().includes('atmesta') || 
            app.STATUS.toLowerCase().includes('atmestas') || 
            app.STATUS.toLowerCase().includes('rejected')
        );
        
        // Show remove button for everyone
        const removeButton = `<button class="remove-btn" data-id="${app.ID || app.id}">Pašalinti</button>`;
        
        embedsHtml += `
            <div class="application-item" data-id="${app.ID || app.id}">
                <div class="application-header">
                    <div class="application-id">
                        <img src="https://cdn.discordapp.com/icons/1325850250027597845/a_390be3fdaab65e28c28d150ca21d93bb.gif?size=1024" alt="MM" class="header-logo">
                        <div class="user-info">
                            <span class="username">Anketos</span>
                            <span class="user-id">@${app.NICK || 'N/A'}</span>
                        </div>
                        <span class="status-tag ${statusClass}">${app.STATUS || 'Peržiūrima'}</span>
                    </div>
                    <div class="application-actions">
                        <div class="application-date">${formattedDate}</div>
                        ${removeButton}
                    </div>
                </div>
                
                <div class="application-field">
                    <div class="field-name">Amžius</div>
                    <div class="field-value">${app.METAI || 'N/A'}</div>
                </div>

                <div class="application-field">
                    <div class="field-name">Dėl ko nori i Ganga</div>
                    <div class="field-value">${app.REASON || 'N/A'}</div>
                </div>
                
                ${isRejected ? `
                <div class="application-field">
                    <div class="field-name">Atmetimo priežastis</div>
                    <div class="field-value rejection-reason">${app.PRIEŽASTIS || 'Nepateikta'}</div>
                </div>
                ` : ''}
                
                <div class="application-field">
                    <div class="field-name">Ar sutiktumėte pasidaryti pc check?</div>
                    <div class="field-value">${app.PCCHECK || 'Taip'}</div>
                </div>
                
                <div class="application-field">
                    <div class="field-name">Ar išpirkumėte įspėjimą jei jis būtų dėl jūsų kaltės?</div>
                    <div class="field-value">${app.ISP || 'Taip'}</div>
                </div>
                
                <div class="rating-row">
                    <div class="rating-item">
                        <div class="rating-label">Pašaudymo lygis</div>
                        <div class="rating-value">${app.PL || '0'}</div>
                    </div>
                    <div class="rating-item">
                        <div class="rating-label">Komunikavimo lygis</div>
                        <div class="rating-value">${app.KL || '0'}</div>
                    </div>
                </div>
                
                <div class="bottom-info">
                    <img src="https://cdn.discordapp.com/icons/1325850250027597845/a_390be3fdaab65e28c28d150ca21d93bb.gif?size=1024" alt="MM" class="footer-logo">
                    Miela Malonu | Anketos
                </div>
            </div>
        `;
    });

    return embedsHtml;
}

function setupRemoveButtons() {
    debug("Setting up remove button event listeners");
    const removeButtons = document.querySelectorAll('.remove-btn');
    
    removeButtons.forEach(button => {
        // Remove any existing event listeners
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Add the event listener
        newButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const appId = this.getAttribute('data-id');
            debug("Remove button clicked for ID:", appId);
            if (appId) {
                removeApplication(appId);
            }
        });
    });
    
    debug("Total remove buttons with listeners:", removeButtons.length);
}

async function fetchApplications(userId = null) {
    debug("Fetching applications for user:", userId);
    const contentElement = document.getElementById('content');
    contentElement.innerHTML = '<div class="loading">Loading application data...</div>';
    
    try {
        // Use direct API endpoint for the Anketos table
        let url = `${API_BASE_URL}/Anketos?select=ID,METAI,PRIEŽASTIS,PL,KL,PCCHECK,ISP,STATUS,DATA,NICK,REASON`;
        
        if (userId) {
            url += `&ID=eq.${encodeURIComponent(userId)}`;
        }
        
        debug("Fetch URL:", url);
        const response = await fetch(url, {
            headers: {
                'apikey': API_KEY,
                'Authorization': `Bearer ${API_KEY}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        debug("Received", data.length, "applications");
        
        contentElement.innerHTML = createDiscordEmbeds(data);
        
        // Setup remove button event listeners
        setupRemoveButtons();
        
    } catch (error) {
        debug("Error fetching data:", error);
        console.error('Error fetching data:', error);
        contentElement.innerHTML = `<div class="error">Failed to load applications: ${error.message}</div>`;
    }
}

function setupSearchButton() {
    const searchButton = document.getElementById('searchButton');
    const userIdInput = document.getElementById('userId');
    
    searchButton.addEventListener('click', () => {
        const userId = userIdInput.value.trim();
        if (userId) {
            window.location.href = `anketos.html?user=${userId}`;
        }
    });
    
    userIdInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchButton.click();
        }
    });
}

function setupAuthButtons() {
    const authenticateBtn = document.getElementById('authenticate-btn');
    const cancelAuthBtn = document.getElementById('cancel-auth-btn');
    
    authenticateBtn.addEventListener('click', () => {
        debug("Auth button clicked, opening Discord OAuth popup");
        hideOAuthPopup();
        openDiscordAuthPopup();
    });
    
    cancelAuthBtn.addEventListener('click', () => {
        debug("Cancel auth button clicked");
        pendingAppIdToDelete = null;
        hideOAuthPopup();
    });
}

// Add global event listener for remove buttons (delegation approach)
document.addEventListener('click', function(e) {
    if (e.target && e.target.classList.contains('remove-btn')) {
        e.preventDefault();
        e.stopPropagation();
        const appId = e.target.getAttribute('data-id');
        debug("Remove button clicked via delegation for ID:", appId);
        if (appId) {
            removeApplication(appId);
        }
    }
});

// Listen for messages from popup window
window.addEventListener('message', function(event) {
    // Check origin for security
    if (event.data && event.data.type === 'discord_auth') {
        debug("Received message from auth popup:", event.data);
        handleDiscordAuth(event.data.token);
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    debug("DOM loaded");
    setupSearchButton();
    setupAuthButtons();
    
    const userId = getQueryParam('user');
    debug("User ID from URL:", userId);
    if (userId) {
        document.getElementById('userId').value = userId;
    }
    
    await fetchApplications(userId);
});
