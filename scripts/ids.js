
     document.addEventListener("DOMContentLoaded", function() {
    const CONFIG = {
        SUPABASE: {
            URL: "https://supa.mielamalonu.com/api/supabase/",
            API_KEY: "cbb"
        },
        DISCORD: {
            DISCORD_CLIENT_ID: "1263389179249692693",
            REDIRECT_URI: window.location.origin + window.location.pathname,
            ROLE_CHECK_ENDPOINT: "https://mielamalonu-rolecheck1-production.up.railway.app/api/check-role"
        }
    };

    // Elements
    const elements = {
        loginSection: document.getElementById("login-section"),
        profileContainer: document.getElementById("profile-container"),
        formSection: document.getElementById("form-section"),
        noRoleMessage: document.getElementById("no-role-message"),
        discordLogin: document.getElementById("discord-login"),
        logoutButton: document.getElementById("logout-button"),
        submitButton: document.getElementById("submit-button"),
        statusMessage: document.getElementById("status-message"),
        discordAvatar: document.getElementById("discord-avatar"),
        discordUsername: document.getElementById("discord-username"),
        systemClosedMessage: document.getElementById("system-closed-message")
    };

    let userData = null;
    let hasRequiredRole = false;
    let isSystemOpen = true; // Default state, will be updated by checkSystemStatus

    // Auth Functions
    async function initAuth() {
        // First check if the system is open
        await checkSystemStatus();
        
        const fragmentParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = fragmentParams.get('access_token');

        if (accessToken) {
            window.history.replaceState({}, document.title, window.location.pathname);
            await handleLogin(accessToken);
        } else {
            await checkExistingSession();
        }
    }

    // New function to check system status
    async function checkSystemStatus() {
        try {
            const response = await fetch(`${CONFIG.SUPABASE.URL}/ID?id=eq.1`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': CONFIG.SUPABASE.API_KEY
                }
            });
            
            if (!response.ok) {
                throw new Error("Nepavyko patikrinti sistemos statuso");
            }
            
            const data = await response.json();
            if (data && data.length > 0) {
                // Check if status is "uždaryta" (closed)
                isSystemOpen = data[0].statusas !== "uždaryta";
                
                // Show system closed message if applicable
                if (!isSystemOpen) {
                    elements.systemClosedMessage.style.display = "block";
                    elements.formSection.classList.add("hidden");
                } else {
                    elements.systemClosedMessage.style.display = "none";
                }
            }
        } catch (error) {
            console.error("Error checking system status:", error);
            // Default to system closed if there's an error
            isSystemOpen = false;
            elements.systemClosedMessage.style.display = "block";
            elements.formSection.classList.add("hidden");
        }
    }

    async function handleLogin(token) {
        try {
            const user = await fetchUserInfo(token);
            if (!user) return;

            userData = user;
            localStorage.setItem('discord_token', token);
            localStorage.setItem('discord_user', JSON.stringify(user));

            // Check if user has the required role
            hasRequiredRole = await checkUserRole(user.id, token);
            updateUI();
        } catch (error) {
            console.error("Login error:", error);
            showStatusMessage("Prisijungimo klaida", "error");
        }
    }

    async function checkExistingSession() {
        const token = localStorage.getItem('discord_token');
        const user = localStorage.getItem('discord_user');
        
        if (token && user) {
            try {
                const freshUser = await fetchUserInfo(token);
                if (freshUser) {
                    userData = freshUser;
                    hasRequiredRole = await checkUserRole(freshUser.id, token);
                    updateUI();
                }
            } catch {
                logout();
            }
        }
    }

    // Role Check
    async function checkUserRole(userId, token) {
        try {
            const response = await fetch(CONFIG.DISCORD.ROLE_CHECK_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, token })
            });
            return response.ok ? (await response.json()).hasRole : false;
        } catch (error) {
            console.error("Role check failed:", error);
            return false;
        }
    }

    // UI Updates
    function updateUI() {
        elements.loginSection.classList.add("hidden");
        elements.profileContainer.style.display = "flex";
        elements.discordUsername.textContent = userData.global_name || userData.username;
        elements.discordAvatar.src = userData.avatar 
            ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`
            : `https://cdn.discordapp.com/embed/avatars/${userData.discriminator % 5}.png`;

        // Show form only if user has the required role AND system is open
        if (hasRequiredRole && isSystemOpen) {
            elements.formSection.classList.remove("hidden");
            elements.noRoleMessage.style.display = "none";
            elements.systemClosedMessage.style.display = "none";
        } else if (!hasRequiredRole) {
            elements.formSection.classList.add("hidden");
            elements.noRoleMessage.style.display = "block";
            elements.systemClosedMessage.style.display = "none";
        } else if (!isSystemOpen) {
            elements.formSection.classList.add("hidden");
            elements.noRoleMessage.style.display = "none";
            elements.systemClosedMessage.style.display = "block";
        }
    }

    // Event Listeners
    elements.discordLogin.addEventListener("click", () => {
        window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${CONFIG.DISCORD.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(CONFIG.DISCORD.REDIRECT_URI)}&response_type=token&scope=identify`;
    });

    elements.logoutButton.addEventListener("click", logout);

    elements.submitButton.addEventListener("click", async () => {
        // Double-check that user has role before allowing submission and system is open
        if (!hasRequiredRole) {
            showStatusMessage("Neturite reikiamos rolės", "error");
            return;
        }
        
        if (!isSystemOpen) {
            showStatusMessage("Sistema šiuo metu uždaryta", "error");
            return;
        }
        
        if (!validateForm()) return;
        
        const idNumber = document.getElementById("id-number").value.trim();
        elements.submitButton.disabled = true;
        elements.submitButton.classList.add("loading");
        elements.loadingSpinner = document.getElementById("loading-spinner");
        elements.loadingSpinner.classList.remove("hidden");
        
        try {
            await submitID(idNumber);
            showStatusMessage("ID pateiktas sėkmingai ✅", "success");
            document.getElementById("id-number").value = "";
        } catch (error) {
            showStatusMessage(error.message || "Įvyko klaida", "error");
        } finally {
            elements.submitButton.disabled = false;
            elements.submitButton.classList.remove("loading");
            elements.loadingSpinner.classList.add("hidden");
        }
    });

    // Helper Functions
    function logout() {
        localStorage.removeItem("discord_token");
        localStorage.removeItem("discord_user");
        userData = null;
        hasRequiredRole = false;
        elements.loginSection.classList.remove("hidden");
        elements.profileContainer.style.display = "none";
        elements.formSection.classList.add("hidden");
        elements.noRoleMessage.style.display = "none";
    }

    async function fetchUserInfo(token) {
        const response = await fetch('https://discord.com/api/users/@me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.ok ? response.json() : null;
    }

   async function submitID(idNumber) {
    // First, get the current IDs array from the database
    return new Promise((resolve, reject) => {
        // Step 1: Get the current IDs array
        fetch(`${CONFIG.SUPABASE.URL}/Event?id=eq.1`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'apikey': CONFIG.SUPABASE.API_KEY
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("Nepavyko gauti duomenų");
            }
            return response.json();
        })
        .then(data => {
            if (!data || data.length === 0) {
                throw new Error("Duomenys nerasti");
            }
            
            // Step 2: Update with the combined array
            let currentIds = data[0].IDs || [];
            
            // If currentIds is a string, try to parse it as JSON
            if (typeof currentIds === 'string') {
                try {
                    currentIds = JSON.parse(currentIds);
                } catch(e) {
                    currentIds = [];
                }
            }
            
            // If it's still not an array, initialize as empty array
            if (!Array.isArray(currentIds)) {
                currentIds = [];
            }
            
            // Add the new ID to the array
            currentIds.push(idNumber);
            
            // Step 3: Update the database with the new array
            return fetch(`${CONFIG.SUPABASE.URL}/Event?id=eq.1`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': CONFIG.SUPABASE.API_KEY,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    IDs: currentIds
                })
            });
        })
        .then(response => {
            if (response.ok) {
                resolve();
            } else {
                reject(new Error("Nepavyko atnaujinti ID"));
            }
        })
        .catch(error => {
            console.error("Error submitting ID:", error);
            reject(new Error("Įvyko serverio klaida"));
        });
    });
}

    function validateForm() {
        const input = document.getElementById("id-number");
        if (!input.value.trim()) {
            input.style.borderColor = 'rgba(237, 66, 69, 0.6)';
            return false;
        }
        input.style.borderColor = ''; // Reset border color
        return true;
    }

    function showStatusMessage(message, type) {
        elements.statusMessage.textContent = message;
        elements.statusMessage.className = type;
        elements.statusMessage.classList.remove("hidden");
        setTimeout(() => elements.statusMessage.classList.add("hidden"), 5000);
    }

    // Initialize
    initAuth();
});
