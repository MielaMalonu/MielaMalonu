// ===== SIMPLIFIED DISCORD AUTH INTEGRATION =====
document.addEventListener('DOMContentLoaded', function() {
    // Discord OAuth configuration
    const DISCORD_CLIENT_ID = '1263389179249692693';
    const REDIRECT_URI = encodeURIComponent(window.location.origin + window.location.pathname);
    const DISCORD_AUTH_URL = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=identify guilds.members.read`; // Added guilds.members.read scope
    
    // Supabase configuration (just for data access, not auth)
    const SUPABASE_URL = 'https://smodsdsnswwtnbnmzhse.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtb2RzZHNuc3d3dG5ibm16aHNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE2MjUyOTAsImV4cCI6MjA1NzIwMTI5MH0.zMdjymIaGU66_y6X-fS8nKnrWgJjXgw7NgXPBIzVCiI';
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // DOM Elements
    const tabButtons = document.querySelectorAll('.nav-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const loginScreen = document.getElementById('loginScreen');
    const loginButton = document.getElementById('loginButton');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginError = document.getElementById('loginError');
    const warningsContainer = document.getElementById('warningsContainer');
    const icStatusContainer = document.getElementById('icStatusContainer');
    const gangDetailsContainer = document.getElementById('gangDetailsContainer');
    
    // Event listeners
    tabButtons.forEach(button => {
        button.addEventListener('click', () => switchTab(button));
    });
    
    loginButton.addEventListener('click', initiateDiscordLogin);
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logoutUser);
    }
    
    // Check login status on page load
    checkAuthStatus();
    
    // ===== AUTHENTICATION FUNCTIONS =====
    
    function initiateDiscordLogin() {
        // Redirect to Discord OAuth
        window.location.href = DISCORD_AUTH_URL;
    }
    
    function checkAuthStatus() {
        // First check if we have a hash in the URL (returning from Discord OAuth)
        if (window.location.hash.includes('access_token=')) {
            handleDiscordAuthResponse();
            return;
        }
        
        // Check localStorage for saved Discord info
        const savedDiscordId = localStorage.getItem('discord_id');
        const savedDiscordUsername = localStorage.getItem('discord_username');
        const savedDiscordAvatar = localStorage.getItem('discord_avatar');
        const savedDiscordGuildTag = localStorage.getItem('discord_guild_tag');
        const savedDiscordServerId = localStorage.getItem('discord_server_id');
        const savedDiscordBadgeHash = localStorage.getItem('discord_badge_hash');
        
        if (savedDiscordId) {
            // User has previously authenticated
            updateUserUI(savedDiscordUsername, savedDiscordAvatar, savedDiscordGuildTag, savedDiscordServerId, savedDiscordBadgeHash);
            hideLoginScreen();
            loadDashboardData(savedDiscordId);
            logoutBtn.style.display = 'inline-block';
        } else {
            // Show login screen
            showLoginScreen();
            logoutBtn.style.display = 'none';
        }
    }
    
    async function handleDiscordAuthResponse() {
        try {
            // Parse the access token from the URL hash
            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash);
            const accessToken = params.get('access_token');
            
            if (!accessToken) {
                throw new Error('No access token found');
            }
            
            // Fetch user profile from Discord API
            const discordUser = await fetchDiscordUserProfile(accessToken);
            
            if (!discordUser || !discordUser.id) {
                throw new Error('Failed to get Discord user profile');
            }
            
            // Fetch user's guild member info to get guild tag and badge
            const guildMemberInfo = await fetchDiscordGuildMember(accessToken, discordUser.id, '1325850250027597845'); // Replace with your actual guild ID
            
            let guildTag = null;
            let serverId = null;
            let badgeHash = null;

            if (guildMemberInfo && guildMemberInfo.guild_id === '1325850250027597845') { // Check if they are a member of your specific guild
                guildTag = guildMemberInfo.guild_member_flags ? 'Member' : null; // Example: Set a generic 'Member' tag if part of the guild
                // Discord API does not directly expose 'primary_guild.badge' or 'primary_guild.tag' like this.
                // You would typically get clan badge data from a bot or another API if available.
                // For demonstration, let's simulate a guild tag/badge if they are a member.
                // Replace with actual logic if you have specific clan badge data.
                serverId = '1325850250027597845'; // Your guild ID
                // This badge hash would need to come from your specific Discord setup if you have clan badges.
                // For now, let's use a placeholder if you don't have one:
                badgeHash = 'a_390be3fdaab65e28c28d150ca21d93bb'; // Placeholder from your current logo
                if (guildMemberInfo.nick) { // Use nick if available
                    guildTag = guildMemberInfo.nick.split(' ')[0]; // Example: First word of nick as tag
                } else if (guildMemberInfo.roles && guildMemberInfo.roles.length > 0) {
                    // You might fetch role names and use one as a tag
                    guildTag = 'Rank'; // Placeholder
                }
            }
            
            // Save user details to localStorage - use global_name (display name) if available
            localStorage.setItem('discord_id', discordUser.id);
            localStorage.setItem('discord_username', discordUser.global_name || discordUser.username);
            localStorage.setItem('discord_guild_tag', guildTag);
            localStorage.setItem('discord_server_id', serverId);
            localStorage.setItem('discord_badge_hash', badgeHash);
            
            // Handle avatar URL
            const avatarUrl = discordUser.avatar 
                ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png` 
                : '/api/placeholder/40/40';
            localStorage.setItem('discord_avatar', avatarUrl);
            
            // Update UI with display name and potential badge
            updateUserUI(discordUser.global_name || discordUser.username, avatarUrl, guildTag, serverId, badgeHash);
            hideLoginScreen();
            
            // Load dashboard data using Discord ID
            loadDashboardData(discordUser.id);
            logoutBtn.style.display = 'inline-block';
            
            // Clean URL after successful auth
            window.history.replaceState({}, document.title, window.location.pathname);
            
        } catch (err) {
            console.error('Error during Discord authentication:', err);
            showLoginError('Authentication failed. Please try again.');
            showLoginScreen();
        }
    }
    
    async function fetchDiscordUserProfile(accessToken) {
        try {
            const response = await fetch('https://discord.com/api/users/@me', {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch Discord profile: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (err) {
            console.error('Error fetching Discord profile:', err);
            throw err;
        }
    }

    // New function to fetch guild member info (requires 'guilds.members.read' scope)
    async function fetchDiscordGuildMember(accessToken, userId, guildId) {
        try {
            const response = await fetch(`https://discord.com/api/users/@me/guilds/${guildId}/member`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });

            if (!response.ok) {
                // If user is not in the guild or scope is not granted, this will likely return 403
                console.warn(`Could not fetch guild member info for guild ${guildId}: ${response.statusText}`);
                return null;
            }
            return await response.json();
        } catch (err) {
            console.error('Error fetching Discord guild member info:', err);
            return null;
        }
    }
    
    function updateUserUI(username, avatarUrl, guildTag, serverID, badgeHash) {
        // Update display name with badge if available
        if (serverID && badgeHash && guildTag) { // Ensure all components are present for the badge
            userName.innerHTML = `
                <div class="user-container">
                    <span class="primary-user-badge">
                        <img class="badge-icon" src="https://cdn.discordapp.com/clan-badges/${serverID}/${badgeHash}.png?size=16" 
                             onerror="this.onerror=null; this.src='/api/placeholder/16/16';" alt="badge">
                        <span class="badge-text">${guildTag}</span>
                    </span>
                    <span class="username-text">${username || 'User'}</span>
                </div>
            `;
        } else {
            // No badge or incomplete badge info, show just the username
            userName.textContent = username || 'User';
        }
        
        // Update user avatar
        userAvatar.src = avatarUrl || '/api/placeholder/40/40';
    }
    
    // ===== UI FUNCTIONS =====
    
    function switchTab(selectedButton) {
        // Do nothing if not logged in
        if (loginScreen.style.display !== 'none') return;
        
        // Remove active class from all tabs
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Activate selected tab
        selectedButton.classList.add('active');
        const tabId = selectedButton.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
    }
    
    function hideLoginScreen() {
        loginScreen.style.display = 'none';
        document.getElementById('dashboard').classList.add('active');
        tabButtons[0].classList.add('active');
    }
    
    function showLoginScreen() {
        loginScreen.style.display = 'block';
        tabContents.forEach(content => content.classList.remove('active'));
        tabButtons.forEach(btn => btn.classList.remove('active'));
    }
    
    function showLoginError(message) {
        if (loginError) {
            loginError.textContent = message;
            loginError.style.display = 'block';
        }
    }
    
    // ===== DATA LOADING FUNCTIONS =====
    
    async function loadDashboardData(discordId) {
        try {
            await Promise.all([
                loadWarnings(discordId),
                loadIcInfo(discordId),
                loadRecentActivity(discordId)
            ]);
            updateDiscordInvite(); // Call Discord invite update after data load
        } catch (err) {
            console.error('Error loading dashboard data:', err);
        }
    }
    
    // Fixed loadWarnings function
    async function loadWarnings(discordId) {
        try {
            // Ensure discordId is a string and try direct equality filter first
            const stringDiscordId = String(discordId);
            
            // Fetch warnings from Supabase using Discord ID
            let { data: warnings, error } = await supabase
                .from('Ispejimai')
                .select('*')
                .filter('ID', 'eq', stringDiscordId)
                .order('DATA', { ascending: false });
            
            // If the above fails, try with the .eq() method
            if (error) {
                console.warn('First warning query failed, trying alternative method:', error);
                ({ data: warnings, error } = await supabase
                    .from('Ispejimai')
                    .select('*')
                    .eq('ID', stringDiscordId)
                    .order('DATA', { ascending: false }));
            }
                
            if (error) throw error;
            
            // Update warnings count in dashboard
            const warningCount = document.getElementById('warningCount');
            if (warningCount) {
                warningCount.textContent = warnings ? warnings.length : 0;
                
                // Update status badge based on warning count
                const warningStatus = document.getElementById('warningStatus');
                if (warningStatus) {
                    if (!warnings || warnings.length === 0) {
                        warningStatus.textContent = 'Neturi ispėjimų';
                        warningStatus.className = 'status-badge badge-success';
                    } else if (warnings.length < 3) {
                        warningStatus.textContent = 'Normaliai ispėjimų';
                        warningStatus.className = 'status-badge badge-warning';
                    } else {
                        warningStatus.textContent = 'Per Daug ispėjimų';
                        warningStatus.className = 'status-badge badge-danger';
                    }
                }
            }
            
            // Update warnings tab
            updateWarningsTab(warnings || []);
            
            return warnings;
        } catch (err) {
            console.error('Error loading warnings:', err);
            // Make sure to update the UI even when there's an error
            updateWarningsTab([]);
            return [];
        }
    }

    function updateWarningsTab(warnings) {
        if (!warningsContainer) return;
        
        // Clear loading spinner and any existing content
        warningsContainer.innerHTML = '';
        
        if (!warnings || warnings.length === 0) {
            const noWarningsElement = document.createElement('div');
            noWarningsElement.className = 'warning-item';
            noWarningsElement.innerHTML = '<div class="warning-reason">Neturi Ispėjimų</div>';
            warningsContainer.appendChild(noWarningsElement);
        } else {
            warnings.forEach((warning, index) => {
                const warningElement = document.createElement('div');
                warningElement.className = 'warning-item';
                warningElement.style.setProperty('--item-delay', index);
                
                // Format date - add fallback for invalid dates
                let formattedDate = 'Unknown date';
                if (warning.DATA) {
                    try {
                        const date = new Date(warning.DATA);
                        formattedDate = date.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                        });
                    } catch (err) {
                        console.error('Error formatting date:', err);
                    }
                }
                
                warningElement.innerHTML = `
                    <div class="warning-reason">${warning.PRIEŽASTIS || 'Unknown reason'}</div>
                    <div class="warning-date">${formattedDate}</div>
                `;
                
                warningsContainer.appendChild(warningElement);
            });
        }
    }

    // Fixed loadIcInfo function
    async function loadIcInfo(discordId) {
        try {
            // Ensure discordId is a string
            const stringDiscordId = String(discordId);
            
            // First approach: Use .filter() method which is more flexible
            let { data: icInfo, error } = await supabase
                .from('IC')
                .select('*')
                .filter('DISCORD_ID', 'eq', stringDiscordId);
            
            // If there's an error or no data, try alternative approach
            if (error || (Array.isArray(icInfo) && icInfo.length === 0)) {
                console.log('First IC query attempt failed, trying text comparison:', error);
                
                // Try using text comparison with ILIKE for case-insensitive matching
                ({ data: icInfo, error } = await supabase
                    .from('IC')
                    .select('*')
                    .ilike('ID', stringDiscordId));
                
                // If that fails too, try a raw SQL query as a last resort
                if (error || (Array.isArray(icInfo) && icInfo.length === 0)) {
                    console.log('Second IC query attempt failed, trying direct query:', error);
                    
                    // Execute a raw SQL query (if available in your Supabase setup)
                    try {
                        const { data, error: sqlError } = await supabase.rpc(
                            'get_ic_info_by_discord_id',
                            { discord_id_param: stringDiscordId }
                        );
                        
                        if (!sqlError && data && data.length > 0) {
                            icInfo = data;
                            error = null;
                        }
                    } catch (rpcErr) {
                        console.warn('RPC call failed:', rpcErr);
                    }
                }
            }
            
            // Extract first record if we got an array
            if (Array.isArray(icInfo) && icInfo.length > 0) {
                icInfo = icInfo[0];
            }
            
            if (error) throw error;
            
            // If still no data after all attempts, throw an error
            if (!icInfo) {
                throw new Error('No IC info found for this user');
            }
            
            // Update IC status in dashboard
            const icStatusIcon = document.getElementById('icStatusIcon');
            const icStatusBadge = document.getElementById('icStatusBadge');
            
            if (icStatusIcon && icStatusBadge && icInfo) {
                if (icInfo.STATUSAS === 'UŽPILDYTA') {
                    icStatusIcon.style.color = '#3ba55c';
                    icStatusBadge.textContent = 'Užpildyta';
                    icStatusBadge.className = 'status-badge badge-success';
                } else {
                    icStatusIcon.style.color = '#ed4245';
                    icStatusBadge.textContent = 'Neužpildyta';
                    icStatusBadge.className = 'status-badge badge-danger';
                }
            }
            
            // Update IC info tab
            updateIcInfoTab(icInfo);
            
            return icInfo;
        } catch (err) {
            console.error('Error loading IC info:', err);
            // Show default "not found" state in the IC info tab
            updateIcInfoTabNotFound();
            
            // Also update the dashboard icons to show inactive
            const icStatusIcon = document.getElementById('icStatusIcon');
            const icStatusBadge = document.getElementById('icStatusBadge');
            
            if (icStatusIcon && icStatusBadge) {
                icStatusIcon.style.color = '#ed4245';
                icStatusBadge.textContent = 'Not Found';
                icStatusBadge.className = 'status-badge badge-danger';
            }
            
            return null;
        }
    }

    // Add this function to handle the "not found" case
    function updateIcInfoTabNotFound() {
        if (!icStatusContainer || !gangDetailsContainer) return;
        
        // Clear loading spinners
        icStatusContainer.innerHTML = '';
        gangDetailsContainer.innerHTML = '';
        
        // Add "not found" message to IC status container
        const notFoundItem = document.createElement('div');
        notFoundItem.className = 'icinfo-item';
        notFoundItem.innerHTML = `
            <div>Statusas:</div>
            <div class="icinfo-status inactive-status">Not Found</div>
        `;
        icStatusContainer.appendChild(notFoundItem);
        
        // Add explanation and button to gang details container
        const explanationItem = document.createElement('div');
        explanationItem.className = 'icinfo-item ic-missing-info';
        explanationItem.innerHTML = `
            <div>No character information found for your Discord account.</div>
            <button id="fill-ic-info-btn" class="fill-ic-btn">Užpildyti IC informaciją</button>
        `;
        gangDetailsContainer.appendChild(explanationItem);
        
        // Add event listener to the button
        const fillIcInfoBtn = document.getElementById('fill-ic-info-btn');
        if (fillIcInfoBtn) {
            fillIcInfoBtn.addEventListener('click', showICFormPopup);
        }
        
        // Initialize form popup
        initializeICFormPopup();
        setupICFormValidation();
    }
    
    // Fixed updateIcInfoTab function
    function updateIcInfoTab(icInfo) {
        if (!icStatusContainer || !gangDetailsContainer) return;
        
        // Clear loading spinners
        icStatusContainer.innerHTML = '';
        gangDetailsContainer.innerHTML = '';
        
        // If icInfo is null or undefined, show "not found" message
        if (!icInfo) {
            updateIcInfoTabNotFound();
            return;
        }
        
        // Create status section
        const statusItem = document.createElement('div');
        statusItem.className = 'icinfo-item';
        statusItem.innerHTML = `
            <div>Statusas:</div>
            <div class="icinfo-status ${icInfo.STATUSAS === 'UŽPILDYTA' ? 'active-status' : 'inactive-status'}">
                ${icInfo.STATUSAS || 'Unknown'}
            </div>
        `;
        icStatusContainer.appendChild(statusItem);
        
        // Character name
        const characterNameItem = document.createElement('div');
        characterNameItem.className = 'icinfo-item';
        characterNameItem.innerHTML = `
            <div>Vardas Pavardė:</div>
            <div>${icInfo.VARDAS || 'Unknown'} ${icInfo.PAVARDĖ || ''}</div>
        `;
        icStatusContainer.appendChild(characterNameItem);
        
        // Steam Nickname - Fixed syntax error by using bracket notation
        const steamNicknameItem = document.createElement('div');
        steamNicknameItem.className = 'icinfo-item';
        steamNicknameItem.innerHTML = `
            <div>Steamo Nickas:</div>
            <div>${icInfo["STEAM NICKAS"] || 'Unknown'}</div>
        `;
        icStatusContainer.appendChild(steamNicknameItem);
        
        // Gang details - Rank
        const rankItem = document.createElement('div');
        rankItem.className = 'icinfo-item';
        rankItem.innerHTML = `
            <div>Rankas:</div>
            <div>${icInfo.RANKAS || 'None'}</div>
        `;
        gangDetailsContainer.appendChild(rankItem);
    }
    
    // Create the modal/popup markup first (add this inside the container div before the footer)
    function initializeICFormPopup() {
        // Create popup container if it doesn't exist
        if (!document.getElementById('ic-form-popup')) {
            const popupHTML = `
            <div id="ic-form-popup" class="popup-container">
                <div class="popup-content">
                    <div class="popup-header">
                        <h3>IC Info anketa</h3>
                        <span class="close-btn">&times;</span>
                    </div>
                    <div class="popup-body">
                        <div class="form-group">
                            <label for="vardas">Vardas</label>
                            <input type="text" id="vardas" placeholder="Įveskite vardą" required>
                        </div>
                        <div class="form-group">
                            <label for="pavarde">Pavardė</label>
                            <input type="text" id="pavarde" placeholder="Įveskite pavardę" required>
                        </div>
                        <div class="form-group">
                            <label for="steam-nick">Steam Nickas</label>
                            <input type="text" id="steam-nick" placeholder="Įveskite Steam slapyvardį" required>
                        </div>
                        <div class="form-group">
                            <label for="steam-link">Steam Nuoroda</label>
                            <input type="url" id="steam-link" placeholder="https://steamcommunity.com/id/..." required>
                        </div>
                        <div id="ic-form-status" class="form-status"></div>
                        <button id="ic-submit-button" class="submit-button">
                            <span id="submit-text">Pateikti</span>
                            <span id="loading-spinner" class="spinner hidden"></span>
                        </button>
                    </div>
                </div>
            </div>`;
            
            // Append the popup HTML to the body
            document.body.insertAdjacentHTML('beforeend', popupHTML);
            
            // Set up event listeners for the popup
            const popup = document.getElementById('ic-form-popup');
            const closeBtn = popup.querySelector('.close-btn');
            const submitBtn = document.getElementById('ic-submit-button');
            
            // Close popup when clicking X
            closeBtn.addEventListener('click', () => {
                popup.style.display = 'none';
            });
            
            // Close popup when clicking outside
            window.addEventListener('click', (e) => {
                if (e.target === popup) {
                    popup.style.display = 'none';
                }
            });
            
            // Handle form submission
            submitBtn.addEventListener('click', submitICForm);
        }
    }

    // Function to show the IC form popup
    function showICFormPopup() {
        initializeICFormPopup();
        document.getElementById('ic-form-popup').style.display = 'flex';
    }

    // Form validation
    function validateICForm() {
        const inputs = document.querySelectorAll('#ic-form-popup input[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                input.style.borderColor = 'rgba(237, 66, 69, 0.6)';
                input.style.boxShadow = '0 0 0 2px rgba(237, 66, 69, 0.2)';
                isValid = false;
            } else {
                input.style.borderColor = '';
                input.style.boxShadow = '';
            }
        });
        
        const steamLink = document.getElementById('steam-link');
        if (steamLink.value && !steamLink.value.includes('steamcommunity.com')) {
            steamLink.style.borderColor = 'rgba(237, 66, 69, 0.6)';
            steamLink.style.boxShadow = '0 0 0 2px rgba(237, 66, 69, 0.2)';
            isValid = false;
        }
        
        return isValid;
    }

    // Reset validation styles on input
    function setupICFormValidation() {
        document.querySelectorAll('#ic-form-popup input').forEach(input => {
            input.addEventListener('input', function() {
                this.style.borderColor = '';
                this.style.boxShadow = '';
            });
        });
    }

    // Submit IC form data to Supabase
    async function submitICForm() {
        // Validate inputs
        if (!validateICForm()) {
            showICFormStatus("Užpildykite visus laukelius teisingai", "error");
            return;
        }
        
        const vardas = document.getElementById("vardas").value.trim();
        const pavarde = document.getElementById("pavarde").value.trim();
        const steamNick = document.getElementById("steam-nick").value.trim();
        const steamLink = document.getElementById("steam-link").value.trim();
        
        // Get Discord ID and username from localStorage
        const discordId = localStorage.getItem('discord_id');
        const discordUsername = localStorage.getItem('discord_username');
        
        if (!discordId || !discordUsername) {
            showICFormStatus("Nepavyko gauti Discord informacijos", "error");
            return;
        }
        
        // Show loading state
        const submitButton = document.getElementById("ic-submit-button");
        const loadingSpinner = document.getElementById("loading-spinner");
        
        submitButton.disabled = true;
        submitButton.classList.add("loading");
        loadingSpinner.classList.remove("hidden");
        
        const formData = {
            DISCORD_ID: discordId,
            USERIS: discordUsername,
            VARDAS: vardas,
            PAVARDĖ: pavarde,
            "STEAM NICKAS": steamNick,
            "STEAM LINKAS": steamLink,
            STATUSAS: "UŽPILDYTA" // Set status to filled out
        };
        
        try {
            // Insert data into IC table
            const { data, error } = await supabase
                .from('IC')
                .insert([formData]);
            
            if (error) throw error;
            
            showICFormStatus("IC Info pateikta sėkmingai ✅", "success");
            
            // Reset form with smooth effect
            document.querySelectorAll('#ic-form-popup input').forEach(input => {
                input.value = "";
                input.style.borderColor = "";
                input.style.boxShadow = "";
            });
            
            // Close popup after successful submission
            setTimeout(() => {
                document.getElementById('ic-form-popup').style.display = 'none';
                
                // Refresh IC Info data
                const discordId = localStorage.getItem('discord_id');
                if (discordId) {
                    loadIcInfo(discordId);
                }
            }, 2000);
            
        } catch (error) {
            console.error("Error submitting form:", error);
            showICFormStatus("Nepavyko išsiųsti duomenų. Bandykite vėliau.", "error");
        } finally {
            // Reset button state
            setTimeout(() => {
                submitButton.disabled = false;
                submitButton.classList.remove("loading");
                loadingSpinner.classList.add("hidden");
            }, 500);
        }
    }

    // Show status message in IC form
    function showICFormStatus(message, type) {
        const statusElement = document.getElementById('ic-form-status');
        statusElement.textContent = message;
        statusElement.className = 'form-status';
        statusElement.classList.add(type);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            statusElement.textContent = '';
            statusElement.className = 'form-status';
        }, 5000);
    }
    
    async function loadRecentActivity(discordId) {
        try {
            // For this function, assuming it's a nice-to-have feature
            // We'll implement a basic structure but make it fault-tolerant
            console.log('Loading recent activity for user:', discordId);
            
            // This is a placeholder - you can implement actual activity tracking later
            return [];
        } catch (err) {
            console.error('Error loading recent activity:', err);
            return [];
        }
    }

    // Add Discord server information update function
    function updateDiscordInvite() {
        const inviteCode = "VfC3Ay86cW"; // Your invite code
        
        // Using Discord's invite widget endpoint (which sometimes allows CORS)
        fetch(`https://discordapp.com/api/invites/${inviteCode}?with_counts=true`)
            .then(response => response.json())
            .then(data => {
                // Update member counts with real data
                const serverMembers = document.querySelector('.server-members');
                if (serverMembers) {
                    serverMembers.innerHTML = `
                        <span class="online-indicator"></span>
                        <span>${data.approximate_presence_count} Online</span>
                        <span style="margin: 0 4px;">•</span>
                        <span>${data.approximate_member_count} Members</span>
                    `;
                }
                
                // Update server name if needed
                const serverName = document.querySelector('.discord-server-name');
                if (serverName && data.guild && data.guild.name) {
                    serverName.textContent = data.guild.name;
                }
                
                // Update server icon if needed
                const serverIcon = document.querySelector('.discord-server-icon');
                if (serverIcon && data.guild && data.guild.icon) {
                    const serverIconUrl = `https://cdn.discordapp.com/icons/${data.guild.id}/${data.guild.icon}.${data.guild.icon.startsWith('a_') ? 'gif' : 'png'}?size=1024`;
                    serverIcon.src = serverIconUrl;
                }
            })
            .catch(error => {
                console.error('Error fetching Discord invite data:', error);
            });
    }

    // Add Copy to Clipboard function for binds
    function copyToClipboard(text) {
        const el = event.currentTarget;
        const copyMessage = el.querySelector('.copy-message');
        
        navigator.clipboard.writeText(text).then(() => {
            // Show copy message
            copyMessage.style.display = 'block';
            
            // Hide copy message after 2 seconds
            setTimeout(() => {
                copyMessage.style.display = 'none';
            }, 2000);
        });
    }

    // Make copyToClipboard accessible globally
    window.copyToClipboard = copyToClipboard;

    // ===== LOGOUT FUNCTION =====
    function logoutUser() {
        // Clear stored Discord data
        localStorage.removeItem('discord_id');
        localStorage.removeItem('discord_username');
        localStorage.removeItem('discord_avatar');
        localStorage.removeItem('discord_guild_tag');
        localStorage.removeItem('discord_server_id');
        localStorage.removeItem('discord_badge_hash');
        
        // Reset UI
        userName.textContent = 'Neprisijungta';
        userAvatar.src = '/api/placeholder/40/40';
        logoutBtn.style.display = 'none';
        
        showLoginScreen();
    }
});
