// Variables and Constants
const SUPABASE_URL = 'your-supabase-url';
const SUPABASE_KEY = 'your-supabase-anon-key';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Discord server information
const serverData = {
    name: "Miela Malonu",
    icon: "https://i.imgur.com/amma0ov.gif",
    banner: "https://cdn.discordapp.com/banners/1325850250027597845/a_43970ce0bb676e58d0c4e04043a9d31b.gif?size=1024",
    invite: "https://discord.gg/yourlink",
    memberCount: 150,
    onlineCount: 45
};

// Elements
const discordLoginBtn = document.getElementById('discord-login');
const profileContainer = document.getElementById('profile-container');
const nextStep1Btn = document.getElementById('next-step-1');
const nextStep2Btn = document.getElementById('next-step-2');
const prevStep2Btn = document.getElementById('prev-step-2');
const prevStep3Btn = document.getElementById('prev-step-3');
const submitBtn = document.getElementById('submitButton');
const steps = document.querySelectorAll('.step');
const formSteps = document.querySelectorAll('.form-step');

// Discord elements
const serverNameEl = document.getElementById('serverName');
const serverIconEl = document.getElementById('serverIcon');
const serverBannerEl = document.getElementById('serverBanner');
const memberCountEl = document.getElementById('memberCount');
const onlineCountEl = document.getElementById('onlineCount');
const inviteLinkEl = document.getElementById('inviteLink');
const statusDisplay = document.getElementById('statusDisplay');

// Admin panel elements
const adminPanel = document.querySelector('.admin-panel');
const statusBtn = document.getElementById('statusButton');
const blacklistBtn = document.getElementById('blacklistButton');
const removeBtn = document.getElementById('removeButton');

// Form fields
const ageInput = document.getElementById('age');
const whyJoinTextarea = document.getElementById('whyJoin');
const charCount = document.querySelector('.char-count');
const pcToggle = document.getElementById('pc-toggle');
const pcTextarea = document.getElementById('pc');
const ispToggle = document.getElementById('isp-toggle');
const ispTextarea = document.getElementById('isp');

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    loadServerInfo();
    checkApplicationStatus();
});

// Functions
function initializeApp() {
    // Set up Discord server info
    serverNameEl.textContent = serverData.name;
    serverIconEl.src = serverData.icon;
    serverBannerEl.src = serverData.banner;
    memberCountEl.innerHTML = `<i class="fas fa-users"></i> ${serverData.memberCount} nariai`;
    onlineCountEl.innerHTML = `<i class="fas fa-circle online-indicator"></i> ${serverData.onlineCount} prisijungę`;
    inviteLinkEl.href = serverData.invite;
    
    // Check if user is admin
    checkAdminStatus();
}

function setupEventListeners() {
    // Discord login
    discordLoginBtn.addEventListener('click', handleDiscordLogin);
    
    // Navigation buttons
    nextStep1Btn.addEventListener('click', () => goToStep(2));
    prevStep2Btn.addEventListener('click', () => goToStep(1));
    nextStep2Btn.addEventListener('click', validateAndGoToStep3);
    prevStep3Btn.addEventListener('click', () => goToStep(2));
    submitBtn.addEventListener('click', submitApplication);
    
    // Admin buttons
    if (statusBtn) statusBtn.addEventListener('click', toggleApplicationStatus);
    if (blacklistBtn) blacklistBtn.addEventListener('click', addToBlacklist);
    if (removeBtn) removeBtn.addEventListener('click', removeFromBlacklist);
    
    // Form interactions
    setupStarRatings();
    setupToggleTextareas();
    setupCharCounter();
    setupFormValidation();
}

// Discord Authentication
function handleDiscordLogin() {
    // Simulate Discord auth for demo purposes
    simulateDiscordAuth();
    
    // In a real application, you would redirect to Discord OAuth
    // window.location.href = `https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=${encodeURIComponent(window.location.origin)}&response_type=code&scope=identify%20email`;
}

function simulateDiscordAuth() {
    // Hide login button, show profile
    discordLoginBtn.style.display = 'none';
    profileContainer.style.display = 'flex';
    
    // Create mock Discord profile
    const mockUserData = {
        id: '123456789012345678',
        username: 'User' + Math.floor(Math.random() * 10000),
        avatar: 'https://cdn.discordapp.com/embed/avatars/' + Math.floor(Math.random() * 5) + '.png',
        discriminator: '0001',
        status: 'online'
    };
    
    // Populate hidden username field
    document.getElementById('username').value = mockUserData.id;
    
    // Create profile content
    profileContainer.innerHTML = `
        <div class="avatar-wrapper">
            <img src="${mockUserData.avatar}" alt="Avatar">
            <span class="status-dot ${mockUserData.status}"></span>
        </div>
        <div class="profile-info">
            <h3>${mockUserData.username}</h3>
            <span class="user-tag">#${mockUserData.discriminator}</span>
        </div>
    `;
    
    // Enable next step button
    nextStep1Btn.disabled = false;
    
    // Show success notification
    showNotification('Sėkmingai prisijungta prie Discord!', 'success');
}

// Navigation
function goToStep(stepNumber) {
    // Hide all steps
    formSteps.forEach(step => {
        step.style.display = 'none';
    });
    
    // Show selected step
    document.getElementById(`step-${stepNumber}`).style.display = 'block';
    
    // Update step indicators
    updateStepIndicators(stepNumber);
}

function updateStepIndicators(activeStep) {
    steps.forEach((step, index) => {
        const stepNum = index + 1;
        
        // Remove all classes first
        step.classList.remove('active', 'completed');
        
        // Add appropriate class
        if (stepNum === activeStep) {
            step.classList.add('active');
        } else if (stepNum < activeStep) {
            step.classList.add('completed');
        }
    });
}

function validateAndGoToStep3() {
    if (validateStep2()) {
        // Populate review content
        populateReviewStep();
        goToStep(3);
    } else {
        showNotification('Užpildykite visus reikalingus laukus', 'error');
    }
}

function populateReviewStep() {
    // Get form values
    const values = {
        discord: document.querySelector('.profile-info h3')?.textContent || 'Neprisijungta',
        age: ageInput.value,
        pl: document.getElementById('pl').value,
        kl: document.getElementById('kl').value,
        whyJoin: whyJoinTextarea.value,
        pc: pcToggle.checked ? pcTextarea.value : 'Ne',
        isp: ispToggle.checked ? ispTextarea.value : 'Ne'
    };
    
    // Set review values
    document.getElementById('review-discord').textContent = values.discord;
    document.getElementById('review-age').textContent = values.age;
    document.getElementById('review-pl').textContent = `${values.pl}/5`;
    document.getElementById('review-kl').textContent = `${values.kl}/5`;
    document.getElementById('review-whyJoin').textContent = values.whyJoin;
    document.getElementById('review-pc').textContent = values.pc;
    document.getElementById('review-isp').textContent = values.isp;
}

// Form Elements Setup
function setupStarRatings() {
    const plStars = document.querySelectorAll('#pl-stars i');
    const klStars = document.querySelectorAll('#kl-stars i');
    
    setupStarRating(plStars, 'pl');
    setupStarRating(klStars, 'kl');
}

function setupStarRating(stars, inputId) {
    stars.forEach(star => {
        star.addEventListener('mouseover', function() {
            const value = this.getAttribute('data-value');
            highlightStars(stars, value);
        });
        
        star.addEventListener('mouseout', function() {
            const selectedValue = document.getElementById(inputId).value;
            if (selectedValue) {
                highlightStars(stars, selectedValue);
            } else {
                resetStars(stars);
            }
        });
        
        star.addEventListener('click', function() {
            const value = this.getAttribute('data-value');
            document.getElementById(inputId).value = value;
            highlightStars(stars, value);
        });
    });
}

function highlightStars(stars, value) {
    stars.forEach(star => {
        const starValue = star.getAttribute('data-value');
        if (starValue <= value) {
            star.classList.remove('far');
            star.classList.add('fas');
        } else {
            star.classList.remove('fas');
            star.classList.add('far');
        }
    });
}

function resetStars(stars) {
    stars.forEach(star => {
        star.classList.remove('fas');
        star.classList.add('far');
    });
}

function setupToggleTextareas() {
    // PC textarea toggle
    pcToggle.addEventListener('change', function() {
        pcTextarea.style.display = this.checked ? 'block' : 'none';
        if (!this.checked) {
            pcTextarea.value = '';
        }
    });
    
    // ISP textarea toggle
    ispToggle.addEventListener('change', function() {
        ispTextarea.style.display = this.checked ? 'block' : 'none';
        if (!this.checked) {
            ispTextarea.value = '';
        }
    });
    
    // Initialize textarea visibility
    pcTextarea.style.display = 'none';
    ispTextarea.style.display = 'none';
}

function setupCharCounter() {
    whyJoinTextarea.addEventListener('input', function() {
        const currentLength = this.value.length;
        charCount.textContent = `${currentLength}/200`;
        
        if (currentLength > 200) {
            charCount.style.color = 'var(--danger-color)';
            this.classList.add('invalid');
        } else {
            charCount.style.color = 'var(--secondary-text)';
            this.classList.remove('invalid');
        }
    });
}

function setupFormValidation() {
    // Age input validation
    ageInput.addEventListener('input', function() {
        const age = parseInt(this.value);
        const validationMessage = this.nextElementSibling;
        
        if (isNaN(age) || age < 13 || age > 99) {
            validationMessage.textContent = 'Amžius turi būti tarp 13 ir 99 metų';
            this.classList.add('invalid');
        } else {
            validationMessage.textContent = '';
            this.classList.remove('invalid');
        }
    });
}

function validateStep2() {
    let isValid = true;
    
    // Age validation
    const age = parseInt(ageInput.value);
    if (isNaN(age) || age < 13 || age > 99) {
        ageInput.classList.add('invalid');
        ageInput.nextElementSibling.textContent = 'Amžius turi būti tarp 13 ir 99 metų';
        isValid = false;
    }
    
    // Star ratings validation
    if (!document.getElementById('pl').value) {
        document.querySelector('#pl-stars').classList.add('invalid');
        isValid = false;
    }
    
    if (!document.getElementById('kl').value) {
        document.querySelector('#kl-stars').classList.add('invalid');
        isValid = false;
    }
    
    // Why join validation
    if (!whyJoinTextarea.value.trim() || whyJoinTextarea.value.length > 200) {
        whyJoinTextarea.classList.add('invalid');
        isValid = false;
    }
    
    // Toggle textareas validation
    if (pcToggle.checked && !pcTextarea.value.trim()) {
        pcTextarea.classList.add('invalid');
        isValid = false;
    }
    
    if (ispToggle.checked && !ispTextarea.value.trim()) {
        ispTextarea.classList.add('invalid');
        isValid = false;
    }
    
    return isValid;
}

// Application Status
function checkApplicationStatus() {
    // Simulate checking status from backend
    const isOpen = Math.random() > 0.3; // 70% chance of being open
    
    if (isOpen) {
        statusDisplay.className = 'status-online';
        statusDisplay.innerHTML = '<i class="fas fa-check-circle"></i> APLIKACIJOS ATVIROS';
    } else {
        statusDisplay.className = 'status-offline';
        statusDisplay.innerHTML = '<i class="fas fa-times-circle"></i> APLIKACIJOS UŽDARYTOS';
        
        // Disable form if applications are closed
        disableFormIfClosed();
    }
}

function disableFormIfClosed() {
    discordLoginBtn.disabled = true;
    discordLoginBtn.classList.remove('pulse-button');
    discordLoginBtn.innerHTML = '<i class="fas fa-lock"></i><span>Aplikacijos uždarytos</span>';
}

// Form Submission
function submitApplication() {
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Siunčiama...';
    
    // Simulate submission delay
    setTimeout(() => {
        // Get form data
        const formData = {
            discord_id: document.getElementById('username').value,
            discord_username: document.querySelector('.profile-info h3')?.textContent,
            age: ageInput.value,
            shooting_level: document.getElementById('pl').value,
            communication_level: document.getElementById('kl').value,
            why_join: whyJoinTextarea.value,
            pc_check: pcToggle.checked ? pcTextarea.value : 'Ne',
            warning_payment: ispToggle.checked ? ispTextarea.value : 'Ne',
            submit_date: new Date().toISOString()
        };
        
        // Simulate successful submission
        console.log('Application submitted:', formData);
        
        // Show success and reset
        showNotification('Aplikacija sėkmingai pateikta!', 'success');
        resetForm();
        
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Pateikti aplikaciją';
    }, 2000);
}

function resetForm() {
    // Reset form and go to step 1
    document.getElementById('applicationForm').reset();
    resetStars(document.querySelectorAll('#pl-stars i'));
    resetStars(document.querySelectorAll('#kl-stars i'));
    document.getElementById('pl').value = '';
    document.getElementById('kl').value = '';
    goToStep(1);
    
    // Other reset actions
    pcTextarea.style.display = 'none';
    ispTextarea.style.display = 'none';
    whyJoinTextarea.value = '';
    charCount.textContent = '0/200';
}

// Admin Functions
function checkAdminStatus() {
    // Check if user is admin (simplified for demo)
    const urlParams = new URLSearchParams(window.location.search);
    const isAdmin = urlParams.get('admin') === 'true';
    
    if (isAdmin) {
        adminPanel.style.display = 'flex';
    }
}

function toggleApplicationStatus() {
    const isCurrentlyOpen = statusDisplay.classList.contains('status-online');
    
    if (isCurrentlyOpen) {
        statusDisplay.className = 'status-offline';
        statusDisplay.innerHTML = '<i class="fas fa-times-circle"></i> APLIKACIJOS UŽDARYTOS';
        disableFormIfClosed();
        showNotification('Aplikacijos uždarytos', 'info');
    } else {
        statusDisplay.className = 'status-online';
        statusDisplay.innerHTML = '<i class="fas fa-check-circle"></i> APLIKACIJOS ATVIROS';
        enableForm();
        showNotification('Aplikacijos atviros', 'success');
    }
}

function enableForm() {
    discordLoginBtn.disabled = false;
    discordLoginBtn.classList.add('pulse-button');
    discordLoginBtn.innerHTML = '<i class="fab fa-discord"></i><span>Prisijungti su Discord</span>';
}

function addToBlacklist() {
    // Simulate adding user to blacklist
    const userId = prompt('Įveskite Discord ID arba vartotojo vardą:');
    
    if (userId) {
        showNotification(`Vartotojas ${userId} įtrauktas į juodąjį sąrašą`, 'success');
    }
}

function removeFromBlacklist() {
    // Simulate removing user from blacklist
    const userId = prompt('Įveskite Discord ID arba vartotojo vardą:');
    
    if (userId) {
        showNotification(`Vartotojas ${userId} pašalintas iš juodojo sąrašo`, 'success');
    }
}

// Server Information
function loadServerInfo() {
    // This would typically fetch from Discord API
    // For demo purposes, we use the predefined data
}

// Notifications
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const notificationMessage = notification.querySelector('.notification-message');
    const notificationIcon = notification.querySelector('.notification-icon');
    
    // Set icon based on type
    if (type === 'success') {
        notificationIcon.className = 'notification-icon fas fa-check-circle';
    } else if (type === 'error') {
        notificationIcon.className = 'notification-icon fas fa-exclamation-circle';
    } else {
        notificationIcon.className = 'notification-icon fas fa-info-circle';
    }
    
    // Set message and add class for animation
    notificationMessage.textContent = message;
    notification.className = `notification ${type} show-notification`;
    
    // Hide after 3 seconds
    setTimeout(() => {
        notification.className = 'notification';
    }, 3000);
}
