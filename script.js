document.addEventListener("DOMContentLoaded", async function () {
    console.log("✅ DOM fully loaded!");

    // Configuration
    const CONFIG = {
        SUPABASE: {
            URL: "https://smodsdsnswwtnbnmzhse.supabase.co", // FIXED: Removed "/rest/v1"
            API_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtb2RzZHNuc3d3dG5ibm16aHNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE2MjUyOTAsImV4cCI6MjA1NzIwMTI5MH0.zMdjymIaGU66_y6X-fS8nKnrWgJjXgw7NgXPBIzVCiI",
            STATUS_TABLE: "Status",
            BLACKLIST_TABLE: "Blacklist"
        },
        DISCORD: {
            CLIENT_ID: "1263389179249692693",
            REDIRECT_URI: window.location.origin + window.location.pathname,
            SCOPES: ["identify", "guilds.members.read"],
            WEBHOOK_URL: "https://discord.com/api/webhooks/1346529699081490472/k-O-v4wKDiUjsj1w-Achvrej1Kr-W-rXqZVibcftwWFn5sMZyhIMSb9E4r975HbQI3tF",
            GUILD_ID: "1325850250027597845"
        }
    };

    // Initialize Supabase client
    const { createClient } = supabase;
    const supabaseClient = createClient(CONFIG.SUPABASE.URL, CONFIG.SUPABASE.API_KEY);
    console.log("✅ Supabase client initialized!");

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
        // Add multi-step form elements
        steps: document.querySelectorAll(".step"),
        formSteps: document.querySelectorAll(".form-step"),
        nextStep1Button: document.getElementById("next-step-1"),
        nextStep2Button: document.getElementById("next-step-2"),
        prevStep2Button: document.getElementById("prev-step-2"),
        prevStep3Button: document.getElementById("prev-step-3"),
        submitButton: document.getElementById("submitButton"),
        // Star rating elements
        plStars: document.querySelectorAll("#pl-stars i"),
        klStars: document.querySelectorAll("#kl-stars i"),
        // Toggle elements
        pcToggle: document.getElementById("pc-toggle"),
        ispToggle: document.getElementById("isp-toggle"),
        // Form inputs
        ageInput: document.getElementById("age"),
        plInput: document.getElementById("pl"),
        klInput: document.getElementById("kl"),
        whyJoinInput: document.getElementById("whyJoin"),
        pcInput: document.getElementById("pc"),
        ispInput: document.getElementById("isp"),
        // Review elements
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
        blacklist: '',
        lastStatus: null,
        currentUser: null, // Modified: Memory-only Discord auth
        updateInterval: null,
        isSubmitting: false, // Added to prevent multiple submissions
        currentStep: 1, // Track the current form step
        // Form data
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
    await initializeDatabase(); // New: Make sure database is properly set up
    fetchStatus();

    // Helper function to check if a user is blacklisted - Simplified
    function isUserBlacklisted(userId, blacklistString) {
        // Guard against empty blacklist
        if (!blacklistString || blacklistString.trim() === '') {
            return false;
        }
        
        // Convert userId to string for consistent comparison
        const userIdStr = String(userId).trim();
        
        // Split the blacklist string by commas
        const blacklistedIds = blacklistString.split(',').map(id => id.trim());
        
        // Check if the user ID exists in the blacklisted IDs array
        return blacklistedIds.includes(userIdStr);
    }

    // ======================
    // DATABASE INITIALIZATION
    // ======================

    async function initializeDatabase() {
        try {
            // Check if status record exists
            const { data: statusData, error: statusError } = await supabaseClient
                .from(CONFIG.SUPABASE.STATUS_TABLE)
                .select('*')
                .eq('id', 1);
            
            if (statusError) throw new Error("Failed to check status table");
            
            // If status record doesn't exist, create it with default "online" status
            if (!statusData || statusData.length === 0) {
                console.log("Creating initial status record...");
                const { error: insertError } = await supabaseClient
                    .from(CONFIG.SUPABASE.STATUS_TABLE)
                    .insert({ id: 1, status: 'online' }); // Set default status to online
                
                if (insertError) throw new Error("Failed to create status record");
            }
            
            // Check if blacklist table is initialized
            const { data: blData, error: blError } = await supabaseClient
                .from(CONFIG.SUPABASE.BLACKLIST_TABLE)
                .select('*')
                .eq('id', 1);
            
            // If blacklist record with ID 1 doesn't exist, create it
            if (!blData || blData.length === 0) {
                console.log("Initializing blacklist record...");
                const { error: blInsertError } = await supabaseClient
                    .from(CONFIG.SUPABASE.BLACKLIST_TABLE)
                    .insert({ id: 1, blacklisted_ids: '' });
                
                if (blInsertError) throw new Error("Failed to initialize blacklist");
            }
            
            console.log("✅ Database initialized successfully!");
        } catch (error) {
            console.error("Database initialization error:", error);
            showNotification("error", "Duomenų bazės inicializavimo klaida. Bandykite vėliau.");
        }
    }

    // ======================
    // CORE FUNCTIONS
    // ======================

    async function fetchStatus() {
        try {
            // Fetch application status
            const { data: statusData, error: statusError } = await supabaseClient
                .from(CONFIG.SUPABASE.STATUS_TABLE)
                .select('*')
                .eq('id', 1)
                .single();
            
            if (statusError) {
                throw new Error("Failed to fetch status");
            }
            
            // Force status to be "online" or "offline" only
            let currentStatus = statusData.status;
            if (currentStatus !== "online" && currentStatus !== "offline") {
                currentStatus = "online"; // Default to online if invalid value
                // Update database with correct value
                await supabaseClient
                    .from(CONFIG.SUPABASE.STATUS_TABLE)
                    .update({ status: currentStatus })
                    .eq('id', 1);
            }
            
            // Fetch blacklist - Simplified
            const { data: blacklistData, error: blacklistError } = await supabaseClient
                .from(CONFIG.SUPABASE.BLACKLIST_TABLE)
                .select('*')
                .eq('id', 1)
                .single();
            
            if (blacklistError) {
                throw new Error("Failed to fetch blacklist");
            }
            
            // Process blacklist data
            let blacklistedIds = '';
            if (blacklistData) {
                if (typeof blacklistData.blacklisted_ids === 'string') {
                    blacklistedIds = blacklistData.blacklisted_ids;
                } else if (Array.isArray(blacklistData.blacklisted_ids)) {
                    blacklistedIds = blacklistData.blacklisted_ids.join(',');
                } else if (Array.isArray(blacklistData.blacklist)) {
                    blacklistedIds = blacklistData.blacklist.join(',');
                } else if (blacklistData.blacklisted_ids !== null && blacklistData.blacklisted_ids !== undefined) {
                    blacklistedIds = String(blacklistData.blacklisted_ids);
                }
            }
            
            // Update application state
            updateApplicationState({
                status: currentStatus,
                blacklist: blacklistedIds
            });
        } catch (error) {
            console.error("❌ Status fetch error:", error);
            showNotification("error", "Nepavyko gauti aplikacijos statuso. Bandykite vėliau.");
        }
    }

    function updateApplicationState(data) {
        const newBlacklist = data.blacklist || '';
        
        if (state.lastStatus !== data.status || state.blacklist !== newBlacklist) {
            state.lastStatus = data.status;
            state.blacklist = newBlacklist;
            updateStatusDisplay();
            
            // Update UI based on current state
            updateFormState();
        }
    }

    // Single function to update form state
    function updateFormState() {
        if (!elements.form) return;
        
        const submitBtn = elements.submitButton;
        if (!submitBtn) return;
        
        // Only enable if all conditions are met
        const isLoggedIn = !!state.currentUser;
        const isBlacklisted = isLoggedIn && isUserBlacklisted(state.currentUser.id, state.blacklist);
        const isOnline = state.lastStatus === "online";
        
        submitBtn.disabled = !isLoggedIn || isBlacklisted || !isOnline || state.isSubmitting;
        
        // Enable/disable next button in step 1 based on login status
        if (elements.nextStep1Button) {
            elements.nextStep1Button.disabled = !isLoggedIn;
        }
        
        // Handle messages
        if (isBlacklisted) {
            showNotification("error", "🚫 Jūs esate užblokuotas ir negalite pateikti anketos!");
        } 
            // Clear notifications only if they are related to login/blacklist status
            hideNotification();
        }

    // ======================
    // FORM HANDLING
    // ======================

    async function handleFormSubmit(event) {
        event.preventDefault();
        
        // Prevent multiple submissions
        if (state.isSubmitting) return;
        state.isSubmitting = true;
        
        clearMessages();

        const submitButton = elements.submitButton;
        submitButton.disabled = true;
        submitButton.textContent = "Pateikiama...";

        try {
            // Validate all requirements in one go
            await validateAllRequirements();
            
            // If validation passes, gather data and submit
            const formData = gatherFormData();
            await submitApplication(formData);

            submitButton.textContent = "Pateikta!";
            showNotification("success", "✅ Aplikacija sėkmingai pateikta!");
            elements.form.reset();
            resetFormState();
            goToStep(1); // Go back to step 1 after submission
            
        } catch (error) {
            handleSubmissionError(error);
            submitButton.textContent = "Bandykite dar kartą";
        } finally {
            // Reset submission state after delay
            setTimeout(() => {
                state.isSubmitting = false;
                submitButton.textContent = "Pateikti aplikaciją";
                submitButton.disabled = false;
                updateFormState();
            }, 3000);
        }
    }

    // Combined validation function
    async function validateAllRequirements() {
            
        // Check blacklist - single check
        if (isUserBlacklisted(state.currentUser.id, state.blacklist)) {
            throw new Error("User blacklisted");
        }
        
        // Check user role
        try {
            const response = await fetch("https://mmapi-production.up.railway.app/api/check-role", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ userId: state.currentUser.id })
            });

            if (!response.ok) {
                showNotification("error", "Serverio klaida tikrinant naudotojo rolę");
                throw new Error("Server error while checking role");
            }
            
            const data = await response.json();
            if (data.hasRole) throw new Error("LA");
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

            const response = await fetch("https://proxy-zzi2.onrender.com/send-to-botghost", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "ef0576a7eb018e3d7cb3a7d4564069245fa8a9fb2b4dd74b5bd3d20c19983041"
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                showNotification("error", "BotGhost API klaida pateikiant anketą");
                throw new Error("BotGhost API error");
            }
        } catch (error) {
            console.error("Submission error:", error);
            throw error;
        }
    }

    // ======================
    // DISCORD INTEGRATION (MODIFIED)
    // ======================

    function handleDiscordAuth() {
        const authUrl = new URL("https://discord.com/api/oauth2/authorize");
        authUrl.searchParams.append("client_id", CONFIG.DISCORD.CLIENT_ID);
        authUrl.searchParams.append("redirect_uri", CONFIG.DISCORD.REDIRECT_URI);
        authUrl.searchParams.append("response_type", "token");
        authUrl.searchParams.append("scope", CONFIG.DISCORD.SCOPES.join(" "));
        window.location.href = authUrl.toString();
    }

    async function fetchDiscordUser(token) {
        try {
            const [userData, presenceData] = await Promise.all([
                fetch("https://discord.com/api/users/@me", {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`https://discord.com/api/v10/users/@me/guilds/${CONFIG.DISCORD.GUILD_ID}/member`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
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
            if (user.status !== state.currentUser.status || 
                JSON.stringify(user.activities) !== JSON.stringify(state.currentUser.activities)) {
                state.currentUser = { ...user, accessToken: state.currentUser.accessToken };
                updateUserInterface(state.currentUser);
            }
        } catch (error) {
            console.error("Presence update error:", error);
        }
    }

    // ======================
    // UI MANAGEMENT (MODIFIED)
    // ======================

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
            
            // Update review page with user info
            if (elements.reviewDiscord) {
                elements.reviewDiscord.textContent = user.global_name || user.username;
            }
            
            // Show success notification on successful login
            showNotification("success", "Sėkmingai prisijungta prie Discord!");
        }
        
        toggleAuthElements(!!user);
        updateFormState();
    }

    function toggleAuthElements(isLoggedIn) {
        // Hide login button when logged in, show profile when logged in
        elements.discordButton.style.display = isLoggedIn ? 'none' : 'block';
        elements.profileContainer.style.display = isLoggedIn ? 'flex' : 'none';
    }

    function startPresenceUpdates() {
        if (state.updateInterval) clearInterval(state.updateInterval);
        state.updateInterval = setInterval(updateDiscordPresence, 50000000);
    }

    // ======================
    // MESSAGE HANDLING FUNCTIONS - ENHANCED
    // ======================

    function clearMessages() {
        elements.responseMessage.textContent = "";
        elements.responseMessage.className = "";
        hideNotification();
    }

    function showErrorMessage(message) {
        elements.responseMessage.textContent = message;
        elements.responseMessage.className = "error-message";
        // Also show as notification
        showNotification("error", message);
    }

    function showSuccessMessage(message) {
        elements.responseMessage.textContent = message;
        elements.responseMessage.className = "success-message";
        // Also show as notification
        showNotification("success", message);
    }

    // New notification system
    function showNotification(type, message) {
        if (!elements.notification || !elements.notificationMessage || !elements.notificationIcon) return;
        
        // Set notification content
        elements.notificationMessage.textContent = message;
        
        // Set notification type
        elements.notification.className = "notification";
        elements.notification.classList.add(`notification-${type}`);
        
        // Set icon based on type
        switch(type) {
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
        
        // Show notification
        elements.notification.classList.add("show");
        
        // Auto-hide after 5 seconds for success notifications
        if (type === "success") {
            setTimeout(hideNotification, 5000);
        }
    }

    function hideNotification() {
        if (!elements.notification) return;
        elements.notification.classList.remove("show");
    }

    // ======================
    // MULTI-STEP FORM FUNCTIONS
    // ======================

    function goToStep(stepNumber) {
        // Update current step in state
        state.currentStep = stepNumber;
        
        // Hide all steps
        elements.formSteps.forEach(step => {
            step.style.display = 'none';
        });
        
        // Show current step
        document.getElementById(`step-${stepNumber}`).style.display = 'block';
        
        // Update step indicators
        elements.steps.forEach(step => {
            const stepNum = parseInt(step.getAttribute('data-step'));
            if (stepNum < stepNumber) {
                step.classList.remove('active');
                step.classList.add('completed');
            } else if (stepNum === stepNumber) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('active');
                step.classList.remove('completed');
            }
        });
        
        // Clear any existing validation messages when changing steps
        clearMessages();
    }

    function updateReviewPage() {
        // Update review page with form data
        if (elements.reviewAge) elements.reviewAge.textContent = elements.ageInput.value || 'N/A';
        if (elements.reviewPl) elements.reviewPl.textContent = `${elements.plInput.value || '0'}/10`;
        if (elements.reviewKl) elements.reviewKl.textContent = `${elements.klInput.value || '0'}/10`;
        if (elements.reviewWhyJoin) elements.reviewWhyJoin.textContent = elements.whyJoinInput.value || 'N/A';
        if (elements.reviewPc) elements.reviewPc.textContent = elements.pcInput.value || 'N/A';
        if (elements.reviewIsp) elements.reviewIsp.textContent = elements.ispInput.value || 'N/A';
    }

    function validateStep2() {
        // Validate age
        if (!elements.ageInput.value || elements.ageInput.value < 13) {
            showErrorMessage("❌ Amžius privalo būti bent 13 metų");
            return false;
        }
        
        // Validate star ratings
        if (!elements.plInput.value || elements.plInput.value === "0") {
            showErrorMessage("❌ Prašome įvertinti savo pašaudimo lygį");
            return false;
        }
        
        if (!elements.klInput.value || elements.klInput.value === "0") {
            showErrorMessage("❌ Prašome įvertinti savo komunikacijos lygį");
            return false;
        }
        
        // Validate reason
        if (!elements.whyJoinInput.value || elements.whyJoinInput.value.trim().length < 10) {
            showErrorMessage("❌ Prašome išsamiau aprašyti kodėl norite prisijungti");
            return false;
        }
        
        // Validate toggles and related text
        if (!elements.pcInput.value.trim()) {
            showErrorMessage("❌ Prašome atsakyti į klausimą dėl PC check");
            return false;
        }
        
        if (!elements.ispInput.value.trim()) {
            showErrorMessage("❌ Prašome atsakyti į klausimą dėl įspėjimo išpirkimo");
            return false;
        }
        
        // If all validations pass, show success message
        showNotification("success", "✅ Visi laukai užpildyti teisingai!");
        clearMessages();
        return true;
    }

    function resetFormState() {
        // Reset star ratings
        setStarRating(elements.plStars, 0);
        setStarRating(elements.klStars, 0);
        elements.plInput.value = "0";
        elements.klInput.value = "0";
        
        // Reset toggles
        elements.pcToggle.checked = false;
        elements.ispToggle.checked = false;
        
        // Clear character count
        updateCharCount(elements.whyJoinInput, 0);
        
        // Clear any error messages
        clearMessages();
    }

    // ======================
    // STAR RATING FUNCTIONS
    // ======================

    function initializeStarRatings() {
        // Initialize star ratings
        elements.plStars.forEach(star => {
            star.addEventListener('click', function() {
                const value = parseInt(this.getAttribute('data-value'));
                setStarRating(elements.plStars, value);
                elements.plInput.value = value;
            });
            
            star.addEventListener('mouseover', function() {
                const value = parseInt(this.getAttribute('data-value'));
                highlightStars(elements.plStars, value);
            });
            
            star.addEventListener('mouseout', function() {
                const currentValue = parseInt(elements.plInput.value) || 0;
                highlightStars(elements.plStars, currentValue);
            });
        });
        
        elements.klStars.forEach(star => {
            star.addEventListener('click', function() {
                const value = parseInt(this.getAttribute('data-value'));
                setStarRating(elements.klStars, value);
                elements.klInput.value = value;
            });
            
            star.addEventListener('mouseover', function() {
                const value = parseInt(this.getAttribute('data-value'));
                highlightStars(elements.klStars, value);
            });
            
            star.addEventListener('mouseout', function() {
                const currentValue = parseInt(elements.klInput.value) || 0;
                highlightStars(elements.klStars, currentValue);
            });
        });
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

    // ======================
    // TOGGLE FUNCTIONS
    // ======================

    function initializeToggles() {
        // Initialize toggle inputs
        elements.pcToggle.addEventListener('change', function() {
            elements.pcInput.value = this.checked ? "Taip" : "Ne";
        });
        
        elements.ispToggle.addEventListener('change', function() {
            elements.ispInput.value = this.checked ? "Taip" : "Ne";
        });
        
        // Initialize character count for whyJoin textarea
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

    // ======================
    // UTILITY FUNCTIONS
    // ======================

    function initializeEventListeners() {
        // Original event listeners
        elements.form.addEventListener("submit", handleFormSubmit);
        elements.discordButton.addEventListener("click", handleDiscordAuth);
        
        // Multi-step form navigation
        elements.nextStep1Button.addEventListener("click", function() {
            if (state.currentUser) {
                goToStep(2);
            } else {
                showErrorMessage("Prašome prisijungti su Discord prieš tęsiant");
            }
        });
        
        elements.nextStep2Button.addEventListener("click", function() {
            if (validateStep2()) {
                updateReviewPage();
                goToStep(3);
            }
        });
        
        elements.prevStep2Button.addEventListener("click", function() {
            goToStep(1);
        });
        
        elements.prevStep3Button.addEventListener("click", function() {
            goToStep(2);
        });
        
        // Submit button should trigger the form submission
        elements.submitButton.addEventListener("click", function(e) {
            e.preventDefault();
            handleFormSubmit(new Event('submit'));
        });
    }

    function checkAuthState() {
        const token = new URLSearchParams(window.location.hash.substring(1)).get("access_token");
        if (token) handleAuthRedirect(token);
        updateUserInterface(state.currentUser);
    }

    async function handleAuthRedirect(token) {
        try {
            const userData = await fetchDiscordUser(token);
            state.currentUser = {
                ...userData,
                accessToken: token
            };
            window.history.replaceState({}, document.title, window.location.pathname);
            updateUserInterface(state.currentUser);
            startPresenceUpdates();
            updateFormState();
        } catch (error) {
            showErrorMessage("Failed to authenticate with Discord");
        }
    }

    function handleLogout() {
        clearInterval(state.updateInterval);
        state.currentUser = null;
        updateUserInterface(null);
        location.reload();
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
        switch(error.message) {
            case "Discord authentication required":
                showErrorMessage("❌ Prieš pateikiant anketą, reikia prisijungti per Discord! (Spauskite mygtuką viršuje!)");
                break;
            case "Applications closed":
                showErrorMessage("");
                break;
            case "User blacklisted":
                showErrorMessage("🚫 Jūs esate užblokuotas ir negalite pateikti anketos!");
                break;
            case "LA":
                showErrorMessage("❌ Jūs jau esate užpildęs anketa!");
                break;
            default:
                showErrorMessage("❌ Įvyko klaida pateikiant anketą. Bandykite dar kartą.");
        }
    }

    async function fetchDiscordInvite(inviteCode, containerClass) {
        try {
            const response = await fetch(`https://discord.com/api/v9/invites/${inviteCode}?with_counts=true`);
            const data = await response.json();

            if (data.guild) {
                const container = document.querySelector(`.${containerClass}`);
 if (!container) return console.error("Container not found!");

                // Remove any existing invite before adding a new one
                const oldInvite = container.querySelector(".discord-invite");
                if (oldInvite) oldInvite.remove();

                // Create the Discord invite HTML structure dynamically
                const inviteHTML = `
                    <div class="discord-invite">
                        <div class="invite-banner">
                            ${data.guild.banner ? `<img src="https://cdn.discordapp.com/banners/${data.guild.id}/${data.guild.banner}.png?size=600" alt="Server Banner">` : ""}
                        </div>
                        <div class="invite-content">
                            <img src="https://cdn.discordapp.com/icons/${data.guild.id}/${data.guild.icon}.png" alt="Server Icon" class="server-icon">
                            <div class="server-info">
                                <h3>${data.guild.name}</h3>
                                <p>${data.approximate_presence_count} Online • ${data.approximate_member_count} Members</p>
                            </div>
                            <a href="https://discord.gg/${inviteCode}" target="_blank" class="join-button">Join</a>
                        </div>
                    </div>
                `;

                container.insertAdjacentHTML("beforeend", inviteHTML);
            }
        } catch (error) {
            console.error("Error fetching Discord invite:", error);
        }
    }

    // Call function and pass the container class where you want the invite to be displayed
    fetchDiscordInvite("mielamalonu", "rules-container");
});
