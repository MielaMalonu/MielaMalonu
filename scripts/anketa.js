document.addEventListener("DOMContentLoaded", async function () {
    console.log("✅ DOM fully loaded!");

    // --- CONFIGURATION ---
    const config = {
        API: {
            STATUS_ENDPOINT: "https://supa.mielamalonu.com/api/supabase/Status",
            BLACKLIST_ENDPOINT: "https://supa.mielamalonu.com/api/supabase/Blacklist",
            ROLE_CHECK_ENDPOINT: "https://mmapi-production.up.railway.app/api/check-role",
            SUBMIT_ENDPOINT: "https://botas-production.up.railway.app/webhook",
            API_KEY: "MIELAMALONU"
        },
        DISCORD: {
            CLIENT_ID: "1263389179249692693",
            REDIRECT_URI: window.location.origin + window.location.pathname,
            SCOPES: ["identify", "guilds.members.read", 'guilds.join'],
            GUILD_ID: "1325850250027597845",
            PROXY_URL: "https://add.mielamalonu.com/api/discord/join-server"
        }
    };

    // --- DOM ELEMENTS ---
    const ui = {
        form: document.getElementById('applicationForm'),
        statusDisplay: document.getElementById("statusDisplay"),
        discordButton: document.getElementById("discord-login"),
        profileContainer: document.getElementById('profile-container'),
        responseMessage: document.createElement('p'),
        notification: document.getElementById("notification"),
        notificationMessage: document.querySelector(".notification-message"),
        notificationIcon: document.querySelector(".notification-icon"),
        steps: document.querySelectorAll(".step"),
        formSteps: document.querySelectorAll('.form-step'),
        nextStep1Button: document.getElementById('next-step-1'),
        nextStep2Button: document.getElementById("next-step-2"),
        prevStep2Button: document.getElementById('prev-step-2'),
        prevStep3Button: document.getElementById("prev-step-3"),
        submitButton: document.getElementById("submitButton"),
        plStars: document.querySelectorAll("#pl-stars i"),
        klStars: document.querySelectorAll("#kl-stars i"),
        pcToggle: document.getElementById('pc-toggle'),
        ispToggle: document.getElementById("isp-toggle"),
        ageInput: document.getElementById('age'),
        plInput: document.getElementById('pl'),
        klInput: document.getElementById('kl'),
        whyJoinInput: document.getElementById('whyJoin'),
        pcInput: document.getElementById('pc'),
        ispInput: document.getElementById('isp'),
        reviewDiscord: document.getElementById("review-discord"),
        reviewAge: document.getElementById("review-age"),
        reviewPl: document.getElementById("review-pl"),
        reviewKl: document.getElementById('review-kl'),
        reviewWhyJoin: document.getElementById("review-whyJoin"),
        reviewPc: document.getElementById("review-pc"),
        reviewIsp: document.getElementById("review-isp")
    };

    // --- APPLICATION STATE ---
    let appState = {
        blacklist: [],
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

    // --- INITIAL SETUP & EVENT LISTENERS ---
    
    // Setup form and listeners
    ui.form.appendChild(ui.responseMessage);
    ui.form.addEventListener('submit', handleFormSubmit);
    ui.discordButton.addEventListener('click', loginWithDiscord);

    // Step 1 -> Step 2 Navigation
    ui.nextStep1Button.addEventListener("click", () => {
        // FIX: Add a guard clause to check for a logged-in user.
        if (!appState.currentUser || !appState.currentUser.id) {
            showNotification("error", "❌ Turite prisijungti su Discord, kad tęstumėte!");
            return; // Stop the function here if the user is not logged in.
        }
        goToStep(2);
    });
    
    // Step 2 -> Step 3 Navigation with validation
    ui.nextStep2Button.addEventListener("click", () => {
        if (validateStep2()) {
            populateReviewStep();
            goToStep(3);
        }
    });

    // Previous step navigation
    ui.prevStep2Button.addEventListener('click', () => goToStep(1));
    ui.prevStep3Button.addEventListener("click", () => goToStep(2));
    
    // Make submit button trigger form submission
    ui.submitButton.addEventListener("click", (event) => {
        event.preventDefault();
        ui.form.dispatchEvent(new Event("submit", { cancelable: true }));
    });

    // Star rating setup
    function setupStarRating(stars, input) {
        stars.forEach(star => {
            star.addEventListener("click", function () {
                const value = parseInt(this.getAttribute('data-value'));
                setStarRating(stars, value);
                input.value = value;
            });
            star.addEventListener("mouseover", function () {
                const value = parseInt(this.getAttribute('data-value'));
                highlightStars(stars, value);
            });
            star.addEventListener('mouseout', function () {
                const value = parseInt(input.value) || 0;
                highlightStars(stars, value);
            });
        });
    }
    setupStarRating(ui.plStars, ui.plInput);
    setupStarRating(ui.klStars, ui.klInput);

    // Toggle switch listeners
    ui.pcToggle.addEventListener('change', function () { ui.pcInput.value = this.checked ? "Taip" : 'Ne'; });
    ui.ispToggle.addEventListener("change", function () { ui.ispInput.value = this.checked ? 'Taip' : 'Ne'; });

    // Character counter for textarea
    ui.whyJoinInput.addEventListener("input", function () { updateCharCount(this); });

    /**
     * Handles the OAuth callback from Discord.
     */
    function handleOAuthCallback() {
        if (window.location.hash) {
            const params = new URLSearchParams(window.location.hash.substring(1));
            const accessToken = params.get("access_token");
            const state = params.get('state');
            const storedState = localStorage.getItem("discord_auth_state");
            localStorage.removeItem('discord_auth_state');

            if (accessToken && state && state === storedState) {
                console.log("Successfully obtained token from URL fragment");
                authenticateWithToken(accessToken);
            } else if (accessToken) {
                console.warn("State validation failed, potential CSRF attack");
                showNotification("error", "Authentication failed: security check failed");
            }
        } else {
            updateProfileUI(appState.currentUser);
        }
    }
    
    /**
     * Checks if a given user ID is in the blacklist.
     * @param {string} userId - The Discord user ID.
     * @param {string[]} blacklist - The array of blacklisted IDs.
     * @returns {boolean} - True if the user is blacklisted.
     */
    function isUserBlacklisted(userId, blacklist) {
        if (!userId || !Array.isArray(blacklist) || blacklist.length === 0) {
            return false;
        }
        const trimmedUserId = String(userId).trim();
        const isBlacklisted = blacklist.includes(trimmedUserId);
        console.log(`Is user ${trimmedUserId} blacklisted?`, isBlacklisted);
        return isBlacklisted;
    }

    /**
     * Fetches the application status and blacklist from the API.
     */
    async function fetchStatusAndBlacklist() {
        try {
            console.log("Fetching status and blacklist...");
            const [statusResponse, blacklistResponse] = await Promise.all([
                fetch(config.API.STATUS_ENDPOINT),
                fetch(config.API.BLACKLIST_ENDPOINT)
            ]);

            if (!statusResponse.ok) throw new Error("Failed to fetch status");
            if (!blacklistResponse.ok) throw new Error("Failed to fetch blacklist");

            const statusData = await statusResponse.json();
            const rawBlacklistData = await blacklistResponse.json();
            
            // Process Status
            let status = "offline";
            if (Array.isArray(statusData) && statusData.length > 0 && statusData[0]?.status) {
                status = statusData[0].status.toLowerCase() === "online" ? "online" : "offline";
            }
            
            // Process Blacklist
            const parseBlacklist = (data) => {
                if (typeof data === 'string') return data.split(',').map(id => id.trim()).filter(Boolean);
                if (Array.isArray(data)) return data.map(id => String(id).trim()).filter(Boolean);
                return [];
            };

            let blacklist = [];
            if (Array.isArray(rawBlacklistData) && rawBlacklistData.length > 0) {
                const firstItem = rawBlacklistData[0];
                if (typeof firstItem === 'object' && firstItem !== null) {
                    const ids = firstItem.blacklistedIds || firstItem.ids || firstItem.blacklist;
                    if (ids) blacklist = parseBlacklist(ids);
                } else {
                    blacklist = parseBlacklist(rawBlacklistData);
                }
            } else if (typeof rawBlacklistData === 'object' && rawBlacklistData !== null) {
                 const ids = rawBlacklistData.blacklistedIds || rawBlacklistData.ids || rawBlacklistData.blacklist;
                 if (ids) blacklist = parseBlacklist(ids);
            } else if (typeof rawBlacklistData === 'string') {
                 blacklist = parseBlacklist(rawBlacklistData);
            }
            
            console.log("Processed blacklist into array:", blacklist);
            updateAppStatus({ status, blacklist });

        } catch (error) {
            console.error("❌ Status fetch error:", error);
            updateAppStatus({ status: "offline", blacklist: appState.blacklist || [] });
            showNotification("error", "Nepavyko gauti aplikacijos statuso. Bandykite vėliau.");
        }
    }

    /**
     * Updates the global app state and UI if the status or blacklist has changed.
     * @param {object} data - Contains status and blacklist.
     */
    function updateAppStatus({ status, blacklist }) {
        const hasChanged = appState.lastStatus !== status || JSON.stringify(appState.blacklist) !== JSON.stringify(blacklist);
        if (hasChanged) {
            appState.lastStatus = status;
            appState.blacklist = blacklist || [];

            if (status === "online") {
                ui.statusDisplay.textContent = "✅ Atidaryta ✅";
                ui.statusDisplay.className = "status-online";
            } else {
                ui.statusDisplay.textContent = "❌ Uždaryta ❌";
                ui.statusDisplay.className = "status-offline";
            }
            updateFormAccess();
        }
    }
    
    /**
     * Enables or disables form elements based on application status and user state.
     */
    function updateFormAccess() {
        if (!ui.form) return;

        const isBlacklisted = appState.currentUser ? isUserBlacklisted(appState.currentUser.id, appState.blacklist) : false;
        const isAppOffline = appState.lastStatus !== "online";
        const isLoggedIn = appState.currentUser && appState.currentUser.id;

        // Logic for the final submission button on step 3
        const disableSubmit = isAppOffline || isBlacklisted;
        if (ui.submitButton) {
            ui.submitButton.disabled = disableSubmit;
        }

        // FIX: The "Next Step" button for step 1 must be disabled if the app is offline OR the user is not logged in.
        const disableFirstStep = isAppOffline || !isLoggedIn;
        if (ui.nextStep1Button) {
            ui.nextStep1Button.disabled = disableFirstStep;
        }
        
        if (isBlacklisted) {
            showNotification("error", "🚫 Jūs esate įtrauktas į juodąjį sąrašą ir negalite teikti anketos!");
            ui.form.style.pointerEvents = "none";
            ui.form.style.opacity = '0.5';
        } else {
            ui.form.style.pointerEvents = "auto";
            ui.form.style.opacity = '1';
        }
    }


    /**
     * Handles the entire form submission process.
     * @param {Event} event - The form submission event.
     */
    async function handleFormSubmit(event) {
        event.preventDefault();
        if (appState.isSubmitting) return;

        appState.isSubmitting = true;
        clearResponseMessage();
        ui.submitButton.disabled = true;
        ui.submitButton.textContent = "Pateikiama...";
        document.getElementById("formLoader").style.display = "flex";
        document.body.style.overflow = "hidden";

        try {
            // --- Pre-submission Checks ---
            if (!appState.currentUser || !appState.currentUser.id) {
                throw new Error("Discord authentication required");
            }
            if (isUserBlacklisted(appState.currentUser.id, appState.blacklist)) {
                throw new Error("User blacklisted");
            }

            const roleResponse = await fetch(config.API.ROLE_CHECK_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': "application/json" },
                body: JSON.stringify({ userId: appState.currentUser.id })
            });

            if (!roleResponse.ok) throw new Error("Server error while checking role");
            
            const { hasRole } = await roleResponse.json();
            if (hasRole) {
                throw new Error('Already member');
            }

            // --- Prepare and Send Data ---
            const formData = {
                userId: appState.currentUser.id,
                age: ui.ageInput.value.trim(),
                reason: ui.whyJoinInput.value.trim(),
                pl: ui.plInput.value.trim(),
                kl: ui.klInput.value.trim(),
                pc: ui.pcInput.value.trim(),
                isp: ui.ispInput.value.trim()
            };

            const applicationId = `${formData.userId.slice(0, 16)}-${Date.now()}`;
            const payload = {
                variables: [
                    { name: 'userId', variable: "{event_userId}", value: `${formData.userId}` },
                    { name: 'age', variable: "{event_age}", value: `${formData.age}` },
                    { name: 'reason', variable: "{event_reason}", value: `${formData.reason}` },
                    { name: 'pl', variable: "{event_pl}", value: `${formData.pl}/10` },
                    { name: 'kl', variable: "{event_kl}", value: `${formData.kl}/10` },
                    { name: 'pc', variable: "{event_pc}", value: `${formData.pc}` },
                    { name: 'isp', variable: "{event_isp}", value: `${formData.isp}` },
                    { name: 'applicationId', variable: "{event_appId}", value: applicationId }
                ]
            };

            const submitResponse = await fetch(config.API.SUBMIT_ENDPOINT, {
                method: "POST",
                headers: {
                    'Content-Type': "application/json",
                    'X-Webhook-Secret': config.API.API_KEY
                },
                body: JSON.stringify(payload)
            });

            if (!submitResponse.ok) {
                throw new Error("API error");
            }

            // --- Success ---
            ui.submitButton.textContent = "Pateikta!";
            showNotification("success", "✅ Aplikacija sėkmingai pateikta!");
            resetForm();
            goToStep(1);

        } catch (error) {
            console.error("Submission error:", error);
            const errorMessages = {
                "Discord authentication required": "❌ Prieš pateikiant anketą, reikia prisijungti per Discord!",
                "User blacklisted": "🚫 Jūs esate užblokuotas ir negalite pateikti anketos!",
                "Already member": "❌ Jūs jau esate mūsų gaujos narys arba jūsų anketa yra peržiūrima!",
                "API error": "❌ API klaida pateikiant anketą.",
                "default": "❌ Įvyko klaida pateikiant anketą. Bandykite dar kartą."
            };
            const message = errorMessages[error.message] || errorMessages.default;
            showErrorInForm(message);
            ui.submitButton.textContent = "Bandykite dar kartą";
        } finally {
            document.getElementById('formLoader').style.display = 'none';
            document.body.style.overflow = "auto";
            setTimeout(() => {
                appState.isSubmitting = false;
                ui.submitButton.textContent = "Pateikti aplikaciją";
                updateFormAccess();
            }, 3000);
        }
    }
    
    /**
     * Redirects the user to the Discord OAuth2 authorization page.
     */
    function loginWithDiscord() {
        localStorage.removeItem('discord_token');
        const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem("discord_auth_state", state);

        const authUrl = new URL("https://discord.com/api/oauth2/authorize");
        authUrl.searchParams.append("client_id", config.DISCORD.CLIENT_ID);
        authUrl.searchParams.append("redirect_uri", config.DISCORD.REDIRECT_URI);
        authUrl.searchParams.append("response_type", "token");
        authUrl.searchParams.append("scope", config.DISCORD.SCOPES.join(" "));
        authUrl.searchParams.append('state', state);
        
        console.log("Redirecting to Discord OAuth:", authUrl.toString());
        window.location.href = authUrl.toString();
    }

    /**
     * Authenticates the user with the provided token, fetches their data, and joins them to the server.
     * @param {string} accessToken - The Discord OAuth2 access token.
     */
    async function authenticateWithToken(accessToken) {
        try {
            showNotification("info", "Authenticating with Discord...");
            const userData = await fetchDiscordUserData(accessToken);
            if (!userData || !userData.id) {
                throw new Error("Failed to fetch user data from Discord.");
            }
            
            appState.currentUser = { ...userData, accessToken };
            console.log("User authenticated, ID:", userData.id);
            updateProfileUI(appState.currentUser);

            showNotification("info", "Attempting to add you to the Discord server...");
            const joined = await joinDiscordServer(userData.id, accessToken);
            if (joined) {
                showNotification("success", "Successfully joined Discord server!");
            } else {
                showNotification("warning", "Could not add you to the server automatically. Please join manually if needed.");
            }
            
            // Clean up URL and start presence updates
            window.history.replaceState({}, document.title, window.location.pathname);
            clearInterval(appState.updateInterval);
            appState.updateInterval = setInterval(updatePresence, 300000); // Update every 5 minutes
            updateFormAccess();

        } catch (error) {
            console.error("Auth redirect error:", error);
            showErrorInForm("Failed to authenticate with Discord: " + error.message);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
    
    /**
     * Attempts to add the user to the configured Discord server via a proxy.
     * @param {string} userId - The user's Discord ID.
     * @param {string} accessToken - The user's OAuth2 access token.
     * @returns {Promise<boolean>} - True if the user was added successfully.
     */
    async function joinDiscordServer(userId, accessToken) {
        try {
            const response = await fetch(config.DISCORD.PROXY_URL, {
                method: "POST",
                headers: { 'Content-Type': "application/json" },
                body: JSON.stringify({ userId, accessToken })
            });

            if (response.ok) {
                const data = await response.json();
                console.log("Proxy server response:", data);
                return data.success;
            } else {
                 const errorData = await response.json();
                 console.error("Error from proxy server:", errorData);
                 showNotification('error', `Server error: ${errorData.message || "Unknown error"}`);
                 return false;
            }
        } catch (error) {
            console.error("Error adding user to server via proxy:", error);
            showNotification("error", "Connection error. Please try again later.");
            return false;
        }
    }

    /**
     * Fetches user data from the Discord API.
     * @param {string} accessToken - The Discord OAuth2 access token.
     * @returns {Promise<object|null>} - The user data object or null on failure.
     */
    async function fetchDiscordUserData(accessToken) {
        try {
            const response = await fetch("https://discord.com/api/users/@me", {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            if (!response.ok) {
                // If the token is invalid, log the user out.
                if (response.status === 401) {
                    logout();
                }
                throw new Error(`Discord API returned status ${response.status}`);
            }

            const userData = await response.json();
            if (userData.id) {
                return {
                    ...userData,
                    avatar: `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png?size=256`
                };
            }
            return null;

        } catch (error) {
            console.error("Discord API error:", error);
            showNotification('error', "Nepavyko prisijungti prie Discord. Bandykite vėliau.");
            return null;
        }
    }

    /**
     * Periodically updates the user's presence/status from Discord.
     */
    async function updatePresence() {
        if (!appState.currentUser || !appState.currentUser.accessToken) {
            console.warn("Cannot update presence: currentUser or accessToken is missing.");
            clearInterval(appState.updateInterval);
            logout(); // Log out if session data is lost
            return;
        }
        
        try {
            const updatedUserData = await fetchDiscordUserData(appState.currentUser.accessToken);
            if (updatedUserData) {
                // Check if anything actually changed before re-rendering
                if (updatedUserData.status !== appState.currentUser.status || JSON.stringify(updatedUserData.activities) !== JSON.stringify(appState.currentUser.activities)) {
                    appState.currentUser = { ...appState.currentUser, ...updatedUserData };
                    updateProfileUI(appState.currentUser);
                }
            }
        } catch (error) {
            console.error("Presence update error:", error);
        }
    }

    /**
     * Logs the user out by clearing state and reloading the page.
     */
    function logout() {
        clearInterval(appState.updateInterval);
        appState.currentUser = null;
        localStorage.removeItem('discord_token');
        localStorage.removeItem('discord_auth_state');
        location.reload();
    }

    /**
     * Updates the profile section of the UI with the user's data.
     * @param {object} user - The current user object.
     */
    function updateProfileUI(user) {
        if (user && user.id) {
            ui.profileContainer.innerHTML = `
                <div class="avatar-wrapper">
                    <img src="${user.avatar}" alt="Avatar">
                    <div class="status-dot ${user.status || 'offline'}"></div>
                </div>
                <div class="user-info">
                    <p class="username">${user.global_name || user.username}</p>
                </div>
                <button id="logout">Atsijungti</button>
            `;
            document.getElementById("logout").addEventListener("click", logout);
            
            if (ui.reviewDiscord) {
                ui.reviewDiscord.textContent = user.global_name || user.username;
            }
            // Only show success on initial login, not every profile update
            // showNotification("success", "Sėkmingai prisijungta prie Discord!");
        } else {
            ui.profileContainer.innerHTML = "";
        }
        
        const isLoggedIn = !!(user && user.id);
        ui.discordButton.style.display = isLoggedIn ? "none" : "block";
        ui.profileContainer.style.display = isLoggedIn ? "flex" : "none";
        updateFormAccess();
    }
    
    // --- UTILITY & HELPER FUNCTIONS ---

    function clearResponseMessage() {
        ui.responseMessage.textContent = '';
        ui.responseMessage.className = '';
        hideNotification();
    }

    function showErrorInForm(message) {
        ui.responseMessage.textContent = message;
        ui.responseMessage.className = "error-message";
        showNotification("error", message);
    }
    
    function showNotification(type, message) {
        if (ui.notification && ui.notificationMessage && ui.notificationIcon) {
            ui.notificationMessage.textContent = message;
            ui.notification.className = `notification notification-${type}`;
            
            const icons = {
                success: "fas fa-check-circle",
                error: "fas fa-exclamation-circle",
                warning: "fas fa-exclamation-triangle",
                info: "fas fa-info-circle"
            };
            ui.notificationIcon.className = `notification-icon ${icons[type] || icons.info}`;
            
            ui.notification.classList.add('show');
            if (type === "success" || type === "info") {
                setTimeout(hideNotification, 5000);
            }
        }
    }

    function hideNotification() {
        if (ui.notification) {
            ui.notification.classList.remove("show");
        }
    }
    
    function goToStep(stepNumber) {
        appState.currentStep = stepNumber;
        ui.formSteps.forEach(step => {
            step.style.display = 'none';
        });
        document.getElementById(`step-${stepNumber}`).style.display = "block";
        
        ui.steps.forEach(step => {
            const stepData = parseInt(step.getAttribute("data-step"));
            step.classList.remove("active", "completed");
            if (stepData < stepNumber) {
                step.classList.add("completed");
            } else if (stepData === stepNumber) {
                step.classList.add('active');
            }
        });
        clearResponseMessage();
    }

    function setStarRating(stars, value) {
        highlightStars(stars, value);
    }

    function highlightStars(stars, value) {
        stars.forEach(star => {
            const starValue = parseInt(star.getAttribute("data-value"));
            star.classList.toggle('fas', starValue <= value);
            star.classList.toggle('far', starValue > value);
        });
    }

    function updateCharCount(textarea) {
        const count = textarea.value.length;
        const charCountElement = textarea.parentElement.querySelector('.char-count');
        const maxLength = 200;
        if (charCountElement) {
            charCountElement.textContent = `${count}/${maxLength}`;
            if (count > maxLength) {
                charCountElement.classList.add("char-limit-exceeded");
                textarea.value = textarea.value.substring(0, maxLength);
                updateCharCount(textarea); // Recurse to update count after trim
                showNotification("warning", `Pasiektas maksimalus simbolių skaičius (${maxLength})`);
            } else {
                charCountElement.classList.remove("char-limit-exceeded");
            }
        }
    }
    
    function validateStep2() {
        if (!ui.ageInput.value || ui.ageInput.value < 13) {
            showErrorInForm("❌ Amžius privalo būti bent 13 metų");
            return false;
        }
        if (!ui.plInput.value || ui.plInput.value === '0') {
            showErrorInForm("❌ Prašome įvertinti savo pašaudimo lygį");
            return false;
        }
        if (!ui.klInput.value || ui.klInput.value === '0') {
            showErrorInForm("❌ Prašome įvertinti savo komunikacijos lygį");
            return false;
        }
        if (!ui.whyJoinInput.value || ui.whyJoinInput.value.trim().length < 10) {
            showErrorInForm("❌ Prašome išsamiau aprašyti kodėl norite prisijungti (min. 10 simbolių)");
            return false;
        }
        
        // Auto-fill optional fields if empty
        if (!ui.pcInput.value.trim()) ui.pcInput.value = 'Ne';
        if (!ui.ispInput.value.trim()) ui.ispInput.value = 'Ne';

        showNotification("success", "✅ Visi laukai užpildyti teisingai!");
        return true;
    }

    function populateReviewStep() {
        ui.reviewAge.textContent = ui.ageInput.value || 'N/A';
        ui.reviewPl.textContent = `${ui.plInput.value || '0'}/10`;
        ui.reviewKl.textContent = `${ui.klInput.value || '0'}/10`;
        ui.reviewWhyJoin.textContent = ui.whyJoinInput.value || "N/A";
        ui.reviewPc.textContent = ui.pcInput.value || 'N/A';
        ui.reviewIsp.textContent = ui.ispInput.value || 'N/A';
    }

    function resetForm() {
        ui.form.reset();
        setStarRating(ui.plStars, 0);
        setStarRating(ui.klStars, 0);
        ui.plInput.value = '0';
        ui.klInput.value = '0';
        ui.pcToggle.checked = false;
        ui.ispToggle.checked = false;
        updateCharCount(ui.whyJoinInput);
        clearResponseMessage();
    }
    
    // --- RUN ON PAGE LOAD ---
    handleOAuthCallback();
    setInterval(fetchStatusAndBlacklist, 5000); // Check app status every 5 seconds
    fetchStatusAndBlacklist(); // Initial check on load
});
