document.addEventListener('DOMContentLoaded', function () {
    // --- Konfiguracija ---
    const config = {
        API: {
            BASE_URL: "https://supa.mielamalonu.com/api/supabase",
            API_KEY: "cbb"
        },
        DISCORD: {
            CLIENT_ID: "1263389179249692693",
            GUILD_ID: "1325850250027597845",
            REDIRECT_URI: window.location.origin + window.location.pathname,
            AUTH_URL: `https://discord.com/api/oauth2/authorize?client_id=1263389179249692693&redirect_uri=${encodeURIComponent(window.location.origin + window.location.pathname)}&response_type=token&scope=identify guilds.members.read`
        },
        DISCORD_INVITE_API: 'https://discordapp.com/api/invites/VfC3Ay86cW?with_counts=true'
    };

    // --- DOM Elementai ---
    const navButtons = document.querySelectorAll(".nav-button");
    const tabContents = document.querySelectorAll(".tab-content");
    const loginScreen = document.getElementById("loginScreen");
    const dashboardScreen = document.getElementById("dashboard");
    const loginButton = document.getElementById("loginButton");
    const userAvatar = document.getElementById("userAvatar");
    const userNameElement = document.getElementById("userName");
    const logoutBtn = document.getElementById("logoutBtn");
    const loginError = document.getElementById("loginError");
    const warningsContainer = document.getElementById("warningsContainer");
    const icStatusContainer = document.getElementById("icStatusContainer");
    const gangDetailsContainer = document.getElementById('gangDetailsContainer');

    // --- UI FUNKCIJOS ---

    function updateProfileUI(username, avatarUrl, guildTag, serverId, badgeHash) {
        if (serverId && badgeHash && guildTag) {
            userNameElement.innerHTML = `<div class="user-container"><span class="primary-user-badge"><img class="badge-icon" src="https://cdn.discordapp.com/clan-badges/${serverId}/${badgeHash}.png?size=16" onerror="this.onerror=null; this.src='/api/placeholder/16/16';" alt="badge"><span class="badge-text">${guildTag}</span></span><span class="username-text">${username || "User"}</span></div>`;
        } else {
            userNameElement.textContent = username || "User";
        }
        userAvatar.src = avatarUrl || "/api/placeholder/40/40";
    }

    function showDashboard() {
        loginScreen.style.display = 'none';
        dashboardScreen.classList.add("active");
        if (navButtons.length > 0) {
            navButtons[0].classList.add("active");
            const firstTab = document.getElementById(navButtons[0].getAttribute('data-tab'));
            if(firstTab) firstTab.classList.add('active');
        }
        logoutBtn.style.display = 'inline-block';
    }

    function showLoginScreen() {
        loginScreen.style.display = 'block';
        dashboardScreen.classList.remove("active");
        tabContents.forEach(tab => tab.classList.remove("active"));
        navButtons.forEach(button => button.classList.remove("active"));
        logoutBtn.style.display = 'none';
    }

    function displayWarnings(warnings) {
        if (!warningsContainer) return;
        warningsContainer.innerHTML = '';
        if (warnings && warnings.length > 0) {
            warnings.forEach((warning, index) => {
                const item = document.createElement("div");
                item.className = "warning-item";
                item.style.setProperty('--item-delay', index);
                let formattedDate = "Nežinoma data";
                if (warning.DATA) {
                    try {
                        formattedDate = new Date(warning.DATA).toLocaleDateString("lt-LT", { month: "short", day: 'numeric', year: "numeric" });
                    } catch (e) { console.error("Klaida formatuojant datą:", e); }
                }
                item.innerHTML = `<div class="warning-reason">${warning.PRIEŽASTIS || "Nežinoma priežastis"}</div><div class="warning-date">${formattedDate}</div>`;
                warningsContainer.appendChild(item);
            });
        } else {
            const noWarningsItem = document.createElement("div");
            noWarningsItem.className = "warning-item";
            noWarningsItem.innerHTML = `<div class="warning-reason">Neturi Įspėjimų</div>`;
            warningsContainer.appendChild(noWarningsItem);
        }
    }

    function displayIcData(icData) {
        if (!icStatusContainer || !gangDetailsContainer) return;

        icStatusContainer.innerHTML = `
            <div class="icinfo-item"><div>Statusas:</div><div class="icinfo-status ${icData.STATUSAS === 'UŽPILDYTA' ? 'active-status' : 'inactive-status'}">${icData.STATUSAS || "Nežinomas"}</div></div>
            <div class="icinfo-item"><div>Vardas Pavardė:</div><div>${icData.VARDAS || "Nežinomas"} ${icData.PAVARDĖ || ''}</div></div>
            <div class="icinfo-item"><div>Steam Nickas:</div><div>${icData["STEAM NICKAS"] || "Nežinomas"}</div></div>`;
        gangDetailsContainer.innerHTML = `<div class="icinfo-item"><div>Rankas:</div><div>${icData.RANKAS || "Nenurodytas"}</div></div>`;

        const statusIcon = document.getElementById("icStatusIcon");
        const statusBadge = document.getElementById("icStatusBadge");
        if (statusIcon && statusBadge) {
            if (icData.STATUSAS === 'UŽPILDYTA') {
                statusIcon.style.color = "#3ba55c";
                statusBadge.textContent = "Užpildyta";
                statusBadge.className = "status-badge badge-success";
            } else {
                statusIcon.style.color = '#ed4245';
                statusBadge.textContent = "Neužpildyta";
                statusBadge.className = "status-badge badge-danger";
            }
        }
    }

    function displayEmptyIcForm() {
        if (!icStatusContainer || !gangDetailsContainer) return;
        icStatusContainer.innerHTML = `<div class="icinfo-item"><div>Statusas:</div><div class="icinfo-status inactive-status">Nerasta</div></div>`;
        gangDetailsContainer.innerHTML = `<div class="icinfo-item ic-missing-info"><div>Nerasta IC informacija jūsų Discord paskyrai.</div><button id="fill-ic-info-btn" class="fill-ic-btn">Užpildyti IC informaciją</button></div>`;

        const fillButton = document.getElementById("fill-ic-info-btn");
        if (fillButton) fillButton.addEventListener("click", openIcFormPopup);
        
        const statusIcon = document.getElementById("icStatusIcon");
        const statusBadge = document.getElementById("icStatusBadge");
        if(statusIcon && statusBadge){
            statusIcon.style.color = "#ed4245";
            statusBadge.textContent = "Nerasta";
            statusBadge.className = "status-badge badge-danger";
        }
    }

    function createIcFormPopup() {
        if (document.getElementById("ic-form-popup")) return;
        document.body.insertAdjacentHTML("beforeend", `
            <div id="ic-form-popup" class="popup-container" style="display: none;">
                <div class="popup-content">
                    <div class="popup-header"><h3>IC Info anketa</h3><span class="close-btn">&times;</span></div>
                    <div class="popup-body">
                        <div class="form-group"><label for="vardas">Vardas</label><input type="text" id="vardas" placeholder="Įveskite vardą" required></div>
                        <div class="form-group"><label for="pavarde">Pavardė</label><input type="text" id="pavarde" placeholder="Įveskite pavardę" required></div>
                        <div class="form-group"><label for="steam-nick">Steam Nickas</label><input type="text" id="steam-nick" placeholder="Įveskite Steam slapyvardį" required></div>
                        <div class="form-group"><label for="steam-link">Steam Nuoroda</label><input type="url" id="steam-link" placeholder="https://steamcommunity.com/id/..." required></div>
                        <div id="ic-form-status" class="form-status"></div>
                        <button id="ic-submit-button" class="submit-button"><span id="submit-text">Pateikti</span><span id="loading-spinner" class="spinner hidden"></span></button>
                    </div>
                </div>
            </div>`);

        const popup = document.getElementById('ic-form-popup');
        popup.querySelector(".close-btn").addEventListener("click", () => popup.style.display = 'none');
        window.addEventListener('click', e => { if (e.target === popup) popup.style.display = 'none'; });
        document.getElementById("ic-submit-button").addEventListener('click', handleIcFormSubmit);
    }

    function openIcFormPopup() {
        if (!document.getElementById("ic-form-popup")) createIcFormPopup();
        document.getElementById("ic-form-popup").style.display = "flex";
    }

    function showFormStatus(message, type) {
        const statusElement = document.getElementById('ic-form-status');
        if (!statusElement) return;
        statusElement.textContent = message;
        statusElement.className = `form-status ${type}`;
        setTimeout(() => {
            statusElement.textContent = '';
            statusElement.className = 'form-status';
        }, 5000);
    }
    
    // --- DUOMENŲ KROVIMAS IR SIUNTIMAS ---

    async function loadDashboardData(userId) {
        try {
            await Promise.all([loadWarnings(userId), loadIcData(userId), loadServerInfo()]);
        } catch (error) {
            console.error("Klaida kraunant panelės duomenis:", error);
        }
    }

    async function loadWarnings(userId) {
        try {
            const response = await fetch(`${config.API.BASE_URL}/Ispejimai?ID=eq.${userId}&order=DATA.desc`, { headers: { 'apikey': config.API.API_KEY } });
            if (!response.ok) throw new Error("API klaida gaunant įspėjimus");
            const warnings = await response.json();
            
            const warningCountElement = document.getElementById("warningCount");
            const warningStatusElement = document.getElementById("warningStatus");
            if (warningCountElement) warningCountElement.textContent = warnings.length;
            if (warningStatusElement) {
                if (warnings.length > 0) {
                    warningStatusElement.textContent = warnings.length < 3 ? "Normalus įspėjimų kiekis" : "Per daug įspėjimų";
                    warningStatusElement.className = `status-badge ${warnings.length < 3 ? 'badge-warning' : 'badge-danger'}`;
                } else {
                    warningStatusElement.textContent = "Neturi įspėjimų";
                    warningStatusElement.className = "status-badge badge-success";
                }
            }
            displayWarnings(warnings);
        } catch (error) {
            console.error("Klaida gaunant įspėjimus:", error);
            displayWarnings([]);
        }
    }

    async function loadIcData(userId) {
        try {
            const response = await fetch(`${config.API.BASE_URL}/IC?DISCORD_ID=eq.${userId}`, { headers: { 'apikey': config.API.API_KEY } });
            if (!response.ok) throw new Error("API klaida gaunant IC duomenis");
            const icDataArray = await response.json();
            
            if (icDataArray && icDataArray.length > 0) {
                displayIcData(icDataArray[0]);
            } else {
                displayEmptyIcForm();
            }
        } catch (error) {
            console.error("Klaida gaunant IC duomenis:", error);
            displayEmptyIcForm();
        }
    }

    async function handleIcFormSubmit() {
        const requiredFields = document.querySelectorAll("#ic-form-popup input[required]");
        let isValid = true;
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.style.borderColor = "rgba(237, 66, 69, 0.6)";
                isValid = false;
            } else {
                field.style.borderColor = '';
            }
        });

        if (!isValid) {
            showFormStatus("Užpildykite visus privalomus laukus", "error");
            return;
        }

        const formData = {
            'DISCORD_ID': localStorage.getItem("discord_id"),
            'USERIS': localStorage.getItem("discord_username"),
            'VARDAS': document.getElementById("vardas").value.trim(),
            'PAVARDĖ': document.getElementById("pavarde").value.trim(),
            "STEAM NICKAS": document.getElementById("steam-nick").value.trim(),
            "STEAM LINKAS": document.getElementById("steam-link").value.trim(),
            'STATUSAS': "UŽPILDYTA"
        };
        
        const submitButton = document.getElementById('ic-submit-button');
        submitButton.disabled = true;

        try {
            const response = await fetch(`${config.API.BASE_URL}/IC`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'apikey': config.API.API_KEY },
                body: JSON.stringify(formData)
            });
            if (!response.ok) throw new Error("API klaida siunčiant formą");

            showFormStatus("IC Info pateikta sėkmingai ✅", 'success');
            setTimeout(() => {
                document.getElementById("ic-form-popup").style.display = "none";
                loadIcData(formData.DISCORD_ID);
            }, 2000);
        } catch (error) {
            console.error("Klaida siunčiant formą:", error);
            showFormStatus("Nepavyko išsiųsti duomenų. Bandykite vėliau.", "error");
        } finally {
            submitButton.disabled = false;
        }
    }

    async function loadServerInfo() {
        try {
            const response = await fetch(config.DISCORD_INVITE_API);
            if (!response.ok) return;
            const data = await response.json();
            const membersElement = document.querySelector(".server-members");
            if (membersElement) membersElement.innerHTML = `<span class="online-indicator"></span> <span>${data.approximate_presence_count} Online</span> <span style="margin: 0 4px;">•</span> <span>${data.approximate_member_count} Members</span>`;
        } catch (e) { console.error("Klaida gaunant serverio info:", e); }
    }

    // --- AUTENTIFIKACIJA ---
    async function handleDiscordRedirect() {
        try {
            const params = new URLSearchParams(window.location.hash.substring(1));
            const accessToken = params.get("access_token");
            if (!accessToken) throw new Error("Nerastas prieigos raktas");

            const userData = await fetch("https://discord.com/api/users/@me", { headers: { 'Authorization': `Bearer ${accessToken}` } }).then(res => res.json());
            if (!userData.id) throw new Error("Nepavyko gauti Discord profilio");

            const memberData = await fetch(`https://discord.com/api/users/@me/guilds/${config.DISCORD.GUILD_ID}/member`, { headers: { 'Authorization': `Bearer ${accessToken}` } }).then(res => res.ok ? res.json() : null);

            localStorage.setItem("discord_id", userData.id);
            localStorage.setItem("discord_username", userData.global_name || userData.username);
            localStorage.setItem("discord_avatar", userData.avatar ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png` : '/api/placeholder/40/40');
            if (memberData) {
                localStorage.setItem("discord_guild_tag", "Narys"); // Pavyzdys
                localStorage.setItem("discord_server_id", memberData.guild_id);
                localStorage.setItem("discord_badge_hash", "a_390be3fdaab65e28c28d150ca21d93bb"); // Pavyzdys
            }
            window.history.replaceState({}, document.title, window.location.pathname);
            initializeApp();
        } catch (error) {
            console.error("Klaida Discord autorizacijos metu:", error);
            if (loginError) loginError.textContent = "Autorizacija nepavyko. Bandykite dar kartą.";
            showLoginScreen();
        }
    }

    function initializeApp() {
        const userId = localStorage.getItem('discord_id');
        if (userId) {
            updateProfileUI(localStorage.getItem('discord_username'), localStorage.getItem('discord_avatar'), localStorage.getItem('discord_guild_tag'), localStorage.getItem('discord_server_id'), localStorage.getItem('discord_badge_hash'));
            showDashboard();
            loadDashboardData(userId);
        } else {
            showLoginScreen();
        }
    }

    // --- MYGTUKŲ PRISKYRIMAS ---
    loginButton.addEventListener('click', () => window.location.href = config.DISCORD.AUTH_URL);
    logoutBtn.addEventListener('click', () => {
        Object.keys(localStorage).forEach(key => { if (key.startsWith('discord_')) localStorage.removeItem(key); });
        updateProfileUI('Neprisijungta', '/api/placeholder/40/40');
        showLoginScreen();
    });

    navButtons.forEach(button => {
        button.addEventListener("click", () => {
            if (loginScreen.style.display === 'none') {
                navButtons.forEach(btn => btn.classList.remove("active"));
                tabContents.forEach(tab => tab.classList.remove("active"));
                button.classList.add("active");
                const tabId = button.getAttribute("data-tab");
                const tabElement = document.getElementById(tabId);
                if(tabElement) tabElement.classList.add("active");
            }
        });
    });

    // --- PROGRAMOS PALEIDIMAS ---
    createIcFormPopup(); // Sukuriame formos HTML iš anksto, bet paslepiame
    if (window.location.hash.includes("access_token=")) {
        handleDiscordRedirect();
    } else {
        initializeApp();
    }
});
