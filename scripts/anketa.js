document.addEventListener("DOMContentLoaded", async function () {
    console.log("✅ DOM fully loaded!");

    // Configuration
    const CONFIG = {
        API: {
            STATUS_ENDPOINT: "https://supa.mielamalonu.com/api/supabase/Status",
            BLACKLIST_ENDPOINT: "https://supa.mielamalonu.com/api/supabase/Blacklist",
            ROLE_CHECK_ENDPOINT: "https://mmapi-production.up.railway.app/api/check-role",
            SUBMIT_ENDPOINT: "https://api.mielamalonu.com/send-to-botghost",
            API_KEY: "cbb"
        },
        DISCORD: {
            CLIENT_ID: "1263389179249692693",
            REDIRECT_URI: window.location.origin + window.location.pathname,
            SCOPES: ["identify", "guilds.members.read", "guilds.join"], // Add guilds.join scope
            WEBHOOK_URL: "https://canary.discord.com/api/webhooks/1346529699081490472/k-O-v4wKDiUjsj1w-Achvrej1Kr-W-rXqZVibcftwWFn5sMZyhIMSb9E4r975HbQI3tF",
            GUILD_ID: "1325850250027597845",
            PROXY_URL: "https://add.mielamalonu.com/api/discord/join-server" // Your secure proxy server endpoint
        }
    };

    // DOM Elements
    const elements = {
        form: document.getElementById("applicationForm"),
        statusDisplay: document.getElementById("statusDisplay"),
        discordButton: document.getElementById("discord-login"),
        profileContainer: document.getElementById("profile-container"),
        responseMessage: document.createElement("p"),
        notification: document.getElementById("notification"),
        notificationMessage: document.querySelector(".notification-message"),
        notificationIcon: document.querySelector(".notification-icon"),
        steps: document.querySelectorAll(".step"),
        formSteps: document.querySelectorAll(".form-step"),
        nextStep1Button: document.getElementById("next-step-1"),
        nextStep2Button: document.getElementById("next-step-2"),
        prevStep2Button: document.getElementById("prev-step-2"),
        prevStep3Button: document.getElementById("prev-step-3"),
        submitButton: document.getElementById("submitButton"),
        plStars: document.querySelectorAll("#pl-stars i"),
        klStars: document.querySelectorAll("#kl-stars i"),
        pcToggle: document.getElementById("pc-toggle"),
        ispToggle: document.getElementById("isp-toggle"),
        ageInput: document.getElementById("age"),
        plInput: document.getElementById("pl"),
        klInput: document.getElementById("kl"),
        whyJoinInput: document.getElementById("whyJoin"),
        pcInput: document.getElementById("pc"),
        ispInput: document.getElementById("isp"),
        reviewDiscord: document.getElementById("review-discord"),
        reviewAge: document.getElementById("review-age"),
        reviewPl: document.getElementById("review-pl"),
        reviewKl: document.getElementById("review-kl"),
        reviewWhyJoin: document.getElementById("review-whyJoin"),
        reviewPc: document.getElementById("review-pc"),
        reviewIsp: document.getElementById("review-isp")
    };

    // State Management
    let state = {
        blacklist: [], // MODIFIED: Always use an array for the blacklist
        lastStatus: null,
        currentUser: null,
        updateInterval: null,
        isSubmitting: false,
        currentStep: 1,
        formData: {
            pl: 0,
            kl: 0
        }
    };

    // Initialize
    elements.form.appendChild(elements.responseMessage);
    initializeEventListeners();
    initializeStarRatings();
    initializeToggles();
    checkAuthState();
    setInterval(fetchStatus, 5000);
    fetchStatus();

    /**
     * [MODIFIED/IMPROVED] Checks if a user ID is in the blacklist array.
     * This function now assumes blacklistData is a clean array of strings.
     * @param {string} userId - The Discord user ID to check.
     * @param {string[]} blacklistArray - The pre-parsed array of blacklisted user IDs.
     * @returns {boolean} - True if the user is blacklisted, false otherwise.
     */
    function isUserBlacklisted(userId, blacklistArray) {
        console.log("Checking blacklist for user:", userId);
        console.log("Blacklist array:", blacklistArray);

        if (!userId || !Array.isArray(blacklistArray) || blacklistArray.length === 0) {
            return false;
        }

        const userIdStr = String(userId).trim();
        const isBlacklisted = blacklistArray.includes(userIdStr);
        
        console.log(`Is user ${userIdStr} blacklisted?`, isBlacklisted);
        return isBlacklisted;
    }

    /**
     * [MODIFIED/IMPROVED] Fetches status and blacklist data from the API.
     * It now centralizes the parsing of raw blacklist data into a clean array of strings.
     */
    async function fetchStatus() {
        try {
            console.log("Fetching status and blacklist...");

            // Fetch application status
            const statusResponse = await fetch(CONFIG.API.STATUS_ENDPOINT);
            if (!statusResponse.ok) throw new Error("Failed to fetch status");
            const statusData = await statusResponse.json();
            console.log("Status data received:", statusData);

            let currentStatus = "offline";
            if (Array.isArray(statusData) && statusData.length > 0 && statusData[0] && statusData[0].status) {
                currentStatus = statusData[0].status.toLowerCase() === 'online' ? 'online' : 'offline';
            }

            // Fetch blacklist and parse it into a clean array
            const blacklistResponse = await fetch(CONFIG.API.BLACKLIST_ENDPOINT);
            if (!blacklistResponse.ok) throw new Error("Failed to fetch blacklist");
            const rawBlacklistData = await blacklistResponse.json();
            console.log("Raw blacklist data received:", rawBlacklistData);

            let finalBlacklistArray = [];
            const parseIds = (data) => {
                if (typeof data === 'string') {
                    return data.split(',').map(id => id.trim()).filter(id => id);
                }
                if (Array.isArray(data)) {
                    return data.map(id => String(id).trim()).filter(id => id);
                }
                return [];
            };

            if (Array.isArray(rawBlacklistData) && rawBlacklistData.length > 0) {
                const firstElement = rawBlacklistData[0];
                if (typeof firstElement === 'object' && firstElement !== null) {
                    const ids = firstElement.blacklistedIds || firstElement.ids || firstElement.blacklist;
                    if (ids) finalBlacklistArray = parseIds(ids);
                } else {
                    finalBlacklistArray = parseIds(rawBlacklistData);
                }
            } else if (typeof rawBlacklistData === 'object' && rawBlacklistData !== null) {
                const ids = rawBlacklistData.blacklistedIds || rawBlacklistData.ids || rawBlacklistData.blacklist;
                if (ids) finalBlacklistArray = parseIds(ids);
            } else if (typeof rawBlacklistData === 'string') {
                finalBlacklistArray = parseIds(rawBlacklistData);
            }

            console.log("Processed blacklist into array:", finalBlacklistArray);

            updateApplicationState({
                status: currentStatus,
                blacklist: finalBlacklistArray
            });

        } catch (error) {
            console.error("❌ Status fetch error:", error);
            updateApplicationState({
                status: "offline",
                blacklist: state.blacklist || []
            });
            showNotification("error", "Nepavyko gauti aplikacijos statuso. Bandykite vėliau.");
        }
    }

    /**
     * [MODIFIED/IMPROVED] Updates the application state and UI if data has changed.
     * Now uses a reliable method to check if the blacklist array has been updated.
     */
    function updateApplicationState(data) {
        const newBlacklist = data.blacklist || [];

        // Reliably compare arrays by turning them into strings
        if (state.lastStatus !== data.status || JSON.stringify(state.blacklist) !== JSON.stringify(newBlacklist)) {
            state.lastStatus = data.status;
            state.blacklist = newBlacklist;
            updateStatusDisplay();
            updateFormState();
        }
    }

    function updateFormState() {
        if (!elements.form) return;

        const isLoggedIn = !!state.currentUser;
        console.log("Form state check - User logged in:", isLoggedIn);

        let isBlacklisted = false;
        if (isLoggedIn && state.currentUser.id) {
            // Use the robust check against the clean state.blacklist array
            isBlacklisted = isUserBlacklisted(state.currentUser.id, state.blacklist);
            console.log("Form state check - User blacklisted:", isBlacklisted);
        }

        const isOnline = state.lastStatus === "online";
        console.log("Form state check - App online:", isOnline);

        // Disable submit button if any condition fails
        const shouldDisableSubmit = !isLoggedIn || isBlacklisted || !isOnline || state.isSubmitting;
        if (elements.submitButton) {
            elements.submitButton.disabled = shouldDisableSubmit;
        }
        
        console.log("Submit button disabled:", shouldDisableSubmit);

        // Enable/disable next button in step 1
        if (elements.nextStep1Button) {
            elements.nextStep1Button.disabled = !isLoggedIn || isBlacklisted;
        }

        // Handle messages and UI blocking for blacklisted users
        if (isBlacklisted) {
            showNotification("error", "🚫 Jūs esate įtrauktas į juodąjį sąrašą ir negalite teikti anketos!");
            if (elements.form) {
                elements.form.style.pointerEvents = 'none';
                elements.form.style.opacity = '0.5';
            }
        } else {
            if (elements.form) {
                elements.form.style.pointerEvents = 'auto';
                elements.form.style.opacity = '1';
            }
            // Hiding notification should be handled carefully, maybe not automatically here
            // hideNotification(); 
        }
    }


    // ======================
    // FORM HANDLING (No changes needed here)
    // ======================
    async function handleFormSubmit(event) {
        event.preventDefault();
        if (state.isSubmitting) return;
        state.isSubmitting = true;
        clearMessages();

        const submitButton = elements.submitButton;
        submitButton.disabled = true;
        submitButton.textContent = "Pateikiama...";
        showLoader();

        try {
            await validateAllRequirements();
            const formData = gatherFormData();
            await submitApplication(formData);

            submitButton.textContent = "Pateikta!";
            showNotification("success", "✅ Aplikacija sėkmingai pateikta!");
            elements.form.reset();
            resetFormState();
            goToStep(1);
        } catch (error) {
            handleSubmissionError(error);
            submitButton.textContent = "Bandykite dar kartą";
        } finally {
            hideLoader();
            setTimeout(() => {
                state.isSubmitting = false;
                submitButton.textContent = "Pateikti aplikaciją";
                submitButton.disabled = false;
                updateFormState();
            }, 3000);
        }
    }
    
    async function validateAllRequirements() {
        console.log("Validating all requirements...");

        if (!state.currentUser || !state.currentUser.id) {
            throw new Error("Discord authentication required");
        }
        
        // Final blacklist check before submission
        const isBlacklisted = isUserBlacklisted(state.currentUser.id, state.blacklist);
        console.log("Final blacklist check before submission:", isBlacklisted);
        if (isBlacklisted) {
            showNotification("error", "🚫 Jūs esate užblokuotas ir negalite pateikti anketos!");
            throw new Error("User blacklisted");
        }

        try {
            const response = await fetch(CONFIG.API.ROLE_CHECK_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: state.currentUser.id })
            });
            if (!response.ok) {
                showNotification("error", "Serverio klaida tikrinant naudotojo rolę");
                throw new Error("Server error while checking role");
            }
            const data = await response.json();
            if (data.hasRole) throw new Error("LA"); // Already has the role
        } catch (error) {
            if (error.message !== "LA") {
                showNotification("error", "Nepavyko patikrinti naudotojo informacijos");
            }
            throw error;
        }
    }

    function gatherFormData() {
        return {
            userId: state.currentUser.id,
            age: elements.ageInput.value.trim(),
            reason: elements.whyJoinInput.value.trim(),
            pl: elements.plInput.value.trim(),
            kl: elements.klInput.value.trim(),
            pc: elements.pcInput.value.trim(),
            isp: elements.ispInput.value.trim()
        };
    }

    async function submitApplication(data) {
    try {
        const appId = `${state.currentUser.id.slice(0, 16)}-${Date.now()}`;

        // CORRECTED: Restored the 'variable' property for each item in the payload.
        const payload = {
            variables: [
                { name: "userId", variable: "{event_userId}", value: `${data.userId}` },
                { name: "age", variable: "{event_age}", value: `${data.age}` },
                { name: "reason", variable: "{event_reason}", value: `${data.reason}` },
                { name: "pl", variable: "{event_pl}", value: `${data.pl}/10` },
                { name: "kl", variable: "{event_kl}", value: `${data.kl}/10` },
                { name: "pc", variable: "{event_pc}", value: `${data.pc}` },
                { name: "isp", variable: "{event_isp}", value: `${data.isp}` },
                { name: "applicationId", variable: "{event_appId}", value: `${appId}` }
            ]
        };

        const response = await fetch(CONFIG.API.SUBMIT_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": CONFIG.API.API_KEY
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            showNotification("error", "API klaida pateikiant anketą");
            throw new Error("API error");
        }
    } catch (error) {
        console.error("Submission error:", error);
        throw error;
    }
}
    
    // ======================
    // DISCORD INTEGRATION (No changes needed here)
    // ======================
    function handleDiscordAuth() {
        localStorage.removeItem('discord_token');
        localStorage.removeItem('discord_token_expiry');
        const authUrl = new URL("https://discord.com/api/oauth2/authorize");
        authUrl.searchParams.append("client_id", CONFIG.DISCORD.CLIENT_ID);
        authUrl.searchParams.append("redirect_uri", CONFIG.DISCORD.REDIRECT_URI);
        authUrl.searchParams.append("response_type", "token");
        authUrl.searchParams.append("scope", CONFIG.DISCORD.SCOPES.join(" "));
        const state = generateRandomState();
        localStorage.setItem('discord_auth_state', state);
        authUrl.searchParams.append("state", state);
        console.log("Redirecting to Discord OAuth:", authUrl.toString());
        window.location.href = authUrl.toString();
    }

    function generateRandomState() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    function checkAuthState() {
        if (window.location.hash) {
            const params = new URLSearchParams(window.location.hash.substring(1));
            const token = params.get("access_token");
            const state = params.get("state");
            const storedState = localStorage.getItem('discord_auth_state');
            localStorage.removeItem('discord_auth_state');

            if (token && state && state === storedState) {
                console.log("Successfully obtained token from URL fragment");
                handleAuthRedirect(token);
            } else if (token) {
                console.warn("State validation failed, potential CSRF attack");
                showNotification("error", "Authentication failed: security check failed");
            }
        } else {
            updateUserInterface(state.currentUser);
        }
    }
    
    async function handleAuthRedirect(token) {
        try {
            showNotification("info", "Authenticating with Discord...");
            const userData = await fetchDiscordUser(token);
            if (!userData || !userData.id) {
                throw new Error("Failed to fetch user data");
            }
            state.currentUser = { ...userData, accessToken: token };
            console.log("User authenticated, ID:", userData.id);
            updateUserInterface(state.currentUser);
            showNotification("info", "Attempting to add you to Discord server...");
            const addedToServer = await addUserToServerViaProxy(userData.id, token);
            if (addedToServer) {
                showNotification("success", "Successfully joined Discord server!");
            } else {
                showNotification("warning", "Could not add you to the server automatically. Please join manually if needed.");
            }
            window.history.replaceState({}, document.title, window.location.pathname);
            startPresenceUpdates();
            updateFormState(); // Crucial call after login to check blacklist
        } catch (error) {
            console.error("Auth redirect error:", error);
            showErrorMessage("Failed to authenticate with Discord: " + error.message);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
    
    async function addUserToServerViaProxy(userId, accessToken) {
        try {
            showNotification("info", "Connecting to Discord server...");
            const payload = { userId: userId, accessToken: accessToken };
            console.log("Sending join request to proxy:", { userId: userId, tokenPresent: !!accessToken, proxyUrl: CONFIG.DISCORD.PROXY_URL });
            const response = await fetch(CONFIG.DISCORD.PROXY_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                    console.error("Error from proxy server:", errorData);
                    if (errorData.error && errorData.error.code === 50025) {
                        showNotification("error", "Invalid OAuth token. Try logging out and in again.");
                    } else {
                        showNotification("error", `Server error: ${errorData.message || "Unknown error"}`);
                    }
                } catch (e) {
                    console.error("Failed to parse error response:", e);
                    showNotification("error", `Server error (${response.status}): Could not process response`);
                }
                return false;
            }
            const data = await response.json();
            console.log("Proxy server response:", data);
            return data.success;
        } catch (error) {
            console.error("Error adding user to server via proxy:", error);
            showNotification("error", "Connection error. Please try again later.");
            return false;
        }
    }

    async function fetchDiscordUser(token) {
        try {
            const [userData, presenceData] = await Promise.all([
                fetch("https://discord.com/api/users/@me", { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`https://discord.com/api/v10/users/@me/guilds/${CONFIG.DISCORD.GUILD_ID}/member`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            const user = await userData.json();
            const presence = await presenceData.json();
            if (!user.id) {
                showNotification("error", "Nepavyko gauti Discord naudotojo informacijos");
                throw new Error("Invalid user data");
            }
            const status = presence.presence?.status || 'offline';
            const activities = presence.activities || [];
            const mainActivity = activities.find(a => a.type === 0) || {};
            return {
                ...user,
                avatar: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`,
                status: status,
                activities: activities,
                activity: {
                    name: mainActivity.name || '',
                    details: mainActivity.details || '',
                    state: mainActivity.state || '',
                    emoji: mainActivity.emoji?.name || '🎮'
                }
            };
        } catch (error) {
            console.error("Discord API error:", error);
            showNotification("error", "Nepavyko prisijungti prie Discord. Bandykite vėliau.");
            return { status: 'offline', activities: [] };
        }
    }

    async function updateDiscordPresence() {
        if (!state.currentUser) return;
        try {
            const user = await fetchDiscordUser(state.currentUser.accessToken);
            if (user.status !== state.currentUser.status || JSON.stringify(user.activities) !== JSON.stringify(state.currentUser.activities)) {
                state.currentUser = { ...user, accessToken: state.currentUser.accessToken };
                updateUserInterface(state.currentUser);
            }
        } catch (error) {
            console.error("Presence update error:", error);
        }
    }


    // ======================
    // UI, FORM, AND EVENT LISTENERS (No changes needed)
    // ======================
    function handleLogout() {
        clearInterval(state.updateInterval);
        state.currentUser = null;
        updateUserInterface(null);
        location.reload();
    }

    function updateUserInterface(user) {
        if (user) {
            elements.profileContainer.innerHTML = `
                <div class="avatar-wrapper">
                    <img src="${user.avatar}" alt="Avatar">
                    <div class="status-dot ${user.status}"></div>
                </div>
                <div class="user-info">
                    <p class="username">${user.global_name || user.username}</p>
                    ${user.status === 'dnd' ? '<div class="dnd-banner">Do Not Disturb</div>' : ''}
                </div>
                <button id="logout">Atsijungti</button>
            `;
            document.getElementById("logout").addEventListener("click", handleLogout);
            if (elements.reviewDiscord) {
                elements.reviewDiscord.textContent = user.global_name || user.username;
            }
            showNotification("success", "Sėkmingai prisijungta prie Discord!");
        }
        toggleAuthElements(!!user);
        updateFormState();
    }

    function toggleAuthElements(isLoggedIn) {
        elements.discordButton.style.display = isLoggedIn ? 'none' : 'block';
        elements.profileContainer.style.display = isLoggedIn ? 'flex' : 'none';
    }

    function startPresenceUpdates() {
        if (state.updateInterval) clearInterval(state.updateInterval);
        state.updateInterval = setInterval(updateDiscordPresence, 50000000);
    }

    function clearMessages() {
        elements.responseMessage.textContent = "";
        elements.responseMessage.className = "";
        hideNotification();
    }

    function showErrorMessage(message) {
        elements.responseMessage.textContent = message;
        elements.responseMessage.className = "error-message";
        showNotification("error", message);
    }

    function showNotification(type, message) {
        if (!elements.notification || !elements.notificationMessage || !elements.notificationIcon) return;
        elements.notificationMessage.textContent = message;
        elements.notification.className = "notification";
        elements.notification.classList.add(`notification-${type}`);
        switch (type) {
            case "success":
                elements.notificationIcon.className = "notification-icon fas fa-check-circle";
                break;
            case "error":
                elements.notificationIcon.className = "notification-icon fas fa-exclamation-circle";
                break;
            case "warning":
                elements.notificationIcon.className = "notification-icon fas fa-exclamation-triangle";
                break;
            default:
                elements.notificationIcon.className = "notification-icon fas fa-info-circle";
        }
        elements.notification.classList.add("show");
        if (type === "success" || type === "info") {
            setTimeout(hideNotification, 5000);
        }
    }

    function hideNotification() {
        if (!elements.notification) return;
        elements.notification.classList.remove("show");
    }

    function goToStep(stepNumber) {
        state.currentStep = stepNumber;
        elements.formSteps.forEach(step => {
            step.style.display = 'none';
        });
        document.getElementById(`step-${stepNumber}`).style.display = 'block';
        elements.steps.forEach(step => {
            const stepNum = parseInt(step.getAttribute('data-step'));
            step.classList.remove('active', 'completed');
            if (stepNum < stepNumber) {
                step.classList.add('completed');
            } else if (stepNum === stepNumber) {
                step.classList.add('active');
            }
        });
        clearMessages();
    }

    function showLoader() {
        document.getElementById('formLoader').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function hideLoader() {
        document.getElementById('formLoader').style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    function validateField(input) {
        // This function remains as is from your original code
    }
    
    function updateReviewPage() {
        if (elements.reviewAge) elements.reviewAge.textContent = elements.ageInput.value || 'N/A';
        if (elements.reviewPl) elements.reviewPl.textContent = `${elements.plInput.value || '0'}/10`;
        if (elements.reviewKl) elements.reviewKl.textContent = `${elements.klInput.value || '0'}/10`;
        if (elements.reviewWhyJoin) elements.reviewWhyJoin.textContent = elements.whyJoinInput.value || 'N/A';
        if (elements.reviewPc) elements.reviewPc.textContent = elements.pcInput.value || 'N/A';
        if (elements.reviewIsp) elements.reviewIsp.textContent = elements.ispInput.value || 'N/A';
    }

    function validateStep2() {
        if (!elements.ageInput.value || elements.ageInput.value < 13) {
            showErrorMessage("❌ Amžius privalo būti bent 13 metų");
            return false;
        }
        if (!elements.plInput.value || elements.plInput.value === "0") {
            showErrorMessage("❌ Prašome įvertinti savo pašaudimo lygį");
            return false;
        }
        if (!elements.klInput.value || elements.klInput.value === "0") {
            showErrorMessage("❌ Prašome įvertinti savo komunikacijos lygį");
            return false;
        }
        if (!elements.whyJoinInput.value || elements.whyJoinInput.value.trim().length < 10) {
            showErrorMessage("❌ Prašome išsamiau aprašyti kodėl norite prisijungti");
            return false;
        }
        if (!elements.pcInput.value.trim()) elements.pcInput.value = "Ne";
        if (!elements.ispInput.value.trim()) elements.ispInput.value = "Ne";
        showNotification("success", "✅ Visi laukai užpildyti teisingai!");
        clearMessages();
        return true;
    }

    function resetFormState() {
        setStarRating(elements.plStars, 0);
        setStarRating(elements.klStars, 0);
        elements.plInput.value = "0";
        elements.klInput.value = "0";
        elements.pcToggle.checked = false;
        elements.ispToggle.checked = false;
        updateCharCount(elements.whyJoinInput, 0);
        clearMessages();
    }

    function initializeStarRatings() {
        // This function remains as is from your original code
    }

    function setStarRating(stars, value) {
        // This function remains as is from your original code
    }

    function highlightStars(stars, value) {
        // This function remains as is from your original code
    }

    function initializeToggles() {
        // This function remains as is from your original code
    }
    
    function updateCharCount(textarea) {
        // This function remains as is from your original code
    }

    function initializeEventListeners() {
        elements.form.addEventListener("submit", handleFormSubmit);
        elements.discordButton.addEventListener("click", handleDiscordAuth);
        elements.nextStep1Button.addEventListener("click", () => {
            if (state.currentUser) {
                goToStep(2);
            } else {
                showErrorMessage("Prašome prisijungti su Discord prieš tęsiant");
            }
        });
        elements.nextStep2Button.addEventListener("click", () => {
            if (validateStep2()) {
                updateReviewPage();
                goToStep(3);
            }
        });
        elements.prevStep2Button.addEventListener("click", () => goToStep(1));
        elements.prevStep3Button.addEventListener("click", () => goToStep(2));
        elements.submitButton.addEventListener("click", (e) => {
            e.preventDefault();
            // Create a new submit event to trigger the form's listener
            elements.form.dispatchEvent(new Event('submit', { cancelable: true }));
        });
    }

    function updateStatusDisplay() {
        if (state.lastStatus === "online") {
            elements.statusDisplay.textContent = "✅ Atidaryta ✅";
            elements.statusDisplay.className = "status-online";
        } else {
            elements.statusDisplay.textContent = "❌ Uždaryta ❌";
            elements.statusDisplay.className = "status-offline";
        }
    }

    function handleSubmissionError(error) {
        console.error("Submission error:", error);
        switch (error.message) {
            case "Discord authentication required":
                showErrorMessage("❌ Prieš pateikiant anketą, reikia prisijungti per Discord!");
                break;
            case "Applications closed":
                showErrorMessage("❌ Anketų pildymas šiuo metu yra sustabdytas.");
                break;
            case "User blacklisted":
                showErrorMessage("🚫 Jūs esate užblokuotas ir negalite pateikti anketos!");
                break;
            case "LA":
                showErrorMessage("❌ Jūs jau esate mūsų gaujos narys arba jūsų anketa yra peržiūrima!");
                break;
            default:
                showErrorMessage("❌ Įvyko klaida pateikiant anketą. Bandykite dar kartą.");
        }
    }

    // The rest of your functions (like star ratings, toggles, etc.) do not need changes.
    // I am including them here to make the script complete.

    // STAR RATING FUNCTIONS
    function initializeStarRatings() {
        const setupStars = (starElements, inputElement) => {
            starElements.forEach(star => {
                star.addEventListener('click', function() {
                    const value = parseInt(this.getAttribute('data-value'));
                    setStarRating(starElements, value);
                    inputElement.value = value;
                });
                star.addEventListener('mouseover', function() {
                    const value = parseInt(this.getAttribute('data-value'));
                    highlightStars(starElements, value);
                });
                star.addEventListener('mouseout', function() {
                    const currentValue = parseInt(inputElement.value) || 0;
                    highlightStars(starElements, currentValue);
                });
            });
        };
        setupStars(elements.plStars, elements.plInput);
        setupStars(elements.klStars, elements.klInput);
    }

    function setStarRating(stars, value) {
        highlightStars(stars, value);
    }

    function highlightStars(stars, value) {
        stars.forEach(star => {
            const starValue = parseInt(star.getAttribute('data-value'));
            if (starValue <= value) {
                star.classList.remove('far');
                star.classList.add('fas');
            } else {
                star.classList.remove('fas');
                star.classList.add('far');
            }
        });
    }

    // TOGGLE FUNCTIONS
    function initializeToggles() {
        elements.pcToggle.addEventListener('change', function() {
            elements.pcInput.value = this.checked ? "Taip" : "Ne";
        });
        elements.ispToggle.addEventListener('change', function() {
            elements.ispInput.value = this.checked ? "Taip" : "Ne";
        });
        elements.whyJoinInput.addEventListener('input', function() {
            updateCharCount(this);
        });
    }

    function updateCharCount(textarea) {
        const charCount = textarea.value.length;
        const maxLength = 200;
        const countDisplay = textarea.parentElement.querySelector('.char-count');
        if (countDisplay) {
            countDisplay.textContent = `${charCount}/${maxLength}`;
            if (charCount > maxLength) {
                countDisplay.classList.add('char-limit-exceeded');
                textarea.value = textarea.value.substring(0, maxLength);
                updateCharCount(textarea);
                showNotification("warning", "Pasiektas maksimalus simbolių skaičius (200)");
            } else {
                countDisplay.classList.remove('char-limit-exceeded');
            }
        }
    }
});
