// Supabase Configuration
const SUPABASE_URL = 'https://ihywcpotcozfnhadsfak.supabase.co'; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloeXdjcG90Y296Zm5oYWRzZmFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyOTU2MDYsImV4cCI6MjA2Nzg3MTYwNn0.CmB7EL-_3Kc1eNeVmCaoE6PP8IHiY_bpJoY0dOkJeBQ'; // Replace with your Supabase anon key

// Initialize Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global Variables
let timer = null;
let startTime = null;
let elapsedTime = 0;
let isRunning = false;
let currentUser = null;
let sessions = [];
let sharedUserId = null;
let sharedSessions = [];

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const signupScreen = document.getElementById('signup-screen');
const mainScreen = document.getElementById('main-screen');
const sharedScreen = document.getElementById('shared-screen');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const showSignupBtn = document.getElementById('show-signup');
const showLoginBtn = document.getElementById('show-login');
const logoutBtn = document.getElementById('logout-btn');
const backToLoginBtn = document.getElementById('back-to-login-btn');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const timerDisplay = document.getElementById('timer');
const sideRadios = document.querySelectorAll('input[name="side"]');
const sessionsListEl = document.getElementById('sessions-list');
const sharedSessionsListEl = document.getElementById('shared-sessions-list');
const shareBtn = document.getElementById('share-btn');
const exportBtn = document.getElementById('export-btn');
const exportSharedBtn = document.getElementById('export-shared-btn');
const shareModal = document.getElementById('share-modal');
const shareLink = document.getElementById('share-link');
const copyLinkBtn = document.getElementById('copy-link-btn');
const closeModal = document.querySelector('.close');
const sharedInfoEl = document.getElementById('shared-info');
const totalSessionsEl = document.getElementById('total-sessions');
const totalDurationEl = document.getElementById('total-duration');
const lastSessionEl = document.getElementById('last-session');

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    // Check for shared link
    const urlParams = new URLSearchParams(window.location.search);
    const sharedUser = urlParams.get('user');

    if (sharedUser) {
        sharedUserId = sharedUser;
        await loadSharedView();
        return;
    }

    // Check if user is already logged in
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (user) {
        currentUser = user;
        await loadSessions();
        showMainScreen();
    } else {
        showLoginScreen();
    }
});

// Authentication Functions
async function login(email, password) {
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        currentUser = data.user;
        await loadSessions();
        showMainScreen();
    } catch (error) {
        alert('שגיאה בהתחברות: ' + error.message);
    }
}

async function signup(email, password) {
    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password
        });

        if (error) throw error;

        alert('נרשמת בהצלחה! בדוק את האימייל שלך לאישור החשבון.');
        showLoginScreen();
    } catch (error) {
        alert('שגיאה בהרשמה: ' + error.message);
    }
}

async function logout() {
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;

        currentUser = null;
        sessions = [];
        showLoginScreen();
    } catch (error) {
        alert('שגיאה בהתנתקות: ' + error.message);
    }
}

// Screen Management Functions
function showLoginScreen() {
    loginScreen.classList.remove('hidden');
    signupScreen.classList.add('hidden');
    mainScreen.classList.add('hidden');
    sharedScreen.classList.add('hidden');
}

function showSignupScreen() {
    loginScreen.classList.add('hidden');
    signupScreen.classList.remove('hidden');
    mainScreen.classList.add('hidden');
    sharedScreen.classList.add('hidden');
}

function showMainScreen() {
    loginScreen.classList.add('hidden');
    signupScreen.classList.add('hidden');
    mainScreen.classList.remove('hidden');
    sharedScreen.classList.add('hidden');
}

function showSharedScreen() {
    loginScreen.classList.add('hidden');
    signupScreen.classList.add('hidden');
    mainScreen.classList.add('hidden');
    sharedScreen.classList.remove('hidden');
}

// Timer Functions
function startTimer() {
    if (!isRunning) {
        startTime = Date.now() - elapsedTime;
        isRunning = true;
        startBtn.classList.add('hidden');
        stopBtn.classList.remove('hidden');

        timer = setInterval(() => {
            elapsedTime = Date.now() - startTime;
            updateTimerDisplay();
        }, 1000);
    }
}

function stopTimer() {
    if (isRunning) {
        clearInterval(timer);
        isRunning = false;
        startBtn.classList.remove('hidden');
        stopBtn.classList.add('hidden');

        // Save session
        saveSession();

        // Reset timer
        elapsedTime = 0;
        updateTimerDisplay();
    }
}

function updateTimerDisplay() {
    const totalSeconds = Math.floor(elapsedTime / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    timerDisplay.textContent =
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Session Management Functions
async function saveSession() {
    const selectedSide = document.querySelector('input[name="side"]:checked').value;
    const duration = Math.floor(elapsedTime / 1000);

    const session = {
        user_id: currentUser.id,
        side: selectedSide,
        duration: duration,
        start_time: new Date(startTime).toISOString(),
        created_at: new Date().toISOString()
    };

    try {
        const { data, error } = await supabaseClient
            .from('feeding_sessions')
            .insert([session])
            .select();

        if (error) throw error;

        sessions.unshift(data[0]);
        updateSessionsList();
    } catch (error) {
        console.error('Error saving session:', error);
        alert('שגיאה בשמירת הפעילות');
    }
}

async function loadSessions() {
    try {
        const { data, error } = await supabaseClient
            .from('feeding_sessions')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })
            .limit(3);

        if (error) throw error;

        sessions = data || [];
        updateSessionsList();
    } catch (error) {
        console.error('Error loading sessions:', error);
    }
}

function updateSessionsList() {
    if (sessions.length === 0) {
        sessionsListEl.innerHTML = '<div class="no-sessions">אין הנקות עדיין</div>';
        return;
    }

    sessionsListEl.innerHTML = sessions.map(session => {
        const date = new Date(session.created_at);
        const side = session.side === 'right' ? 'ימין' : 'שמאל';
        const duration = formatDuration(session.duration);

        return `
            <div class="session-item">
                <div class="session-side">${side}</div>
                <div class="session-time">${date.toLocaleString('he-IL')}</div>
                <div class="session-duration">${duration}</div>
            </div>
        `;
    }).join('');
}

// Shared View Functions
async function loadSharedView() {
    try {
        showSharedScreen();

        // Load shared sessions (last 10 sessions)
        const { data: sessionsData, error: sessionsError } = await supabaseClient
            .from('feeding_sessions')
            .select('*')
            .eq('user_id', sharedUserId)
            .order('created_at', { ascending: false })
            .limit(10);

        if (sessionsError) throw sessionsError;

        if (!sessionsData || sessionsData.length === 0) {
            showSharedError('לא נמצאו נתונים', 'המשתמש לא קיים או שלא בוצעו הנקות עדיין');
            return;
        }

        sharedSessions = sessionsData;
        updateSharedSessionsList();
        updateSharedStats();
        updateSharedInfo();

    } catch (error) {
        console.error('Error loading shared view:', error);
        showSharedError('שגיאה בטעינת הנתונים', error.message);
    }
}

function updateSharedSessionsList() {
    if (sharedSessions.length === 0) {
        sharedSessionsListEl.innerHTML = '<div class="no-sessions">אין הנקות לתצוגה</div>';
        return;
    }

    sharedSessionsListEl.innerHTML = sharedSessions.map(session => {
        const date = new Date(session.created_at);
        const side = session.side === 'right' ? 'ימין' : 'שמאל';
        const duration = formatDuration(session.duration);

        return `
            <div class="session-item">
                <div class="session-side">${side}</div>
                <div class="session-time">${date.toLocaleString('he-IL')}</div>
                <div class="session-duration">${duration}</div>
            </div>
        `;
    }).join('');
}

function updateSharedStats() {
    const totalSessions = sharedSessions.length;
    const totalDurationSeconds = sharedSessions.reduce((sum, session) => sum + session.duration, 0);
    const totalDurationMinutes = Math.floor(totalDurationSeconds / 60);
    const lastSession = sharedSessions.length > 0 ? new Date(sharedSessions[0].created_at) : null;

    totalSessionsEl.textContent = totalSessions;
    totalDurationEl.textContent = totalDurationMinutes > 60 ?
        `${Math.floor(totalDurationMinutes / 60)}:${(totalDurationMinutes % 60).toString().padStart(2, '0')} שעות` :
        `${totalDurationMinutes} דקות`;
    lastSessionEl.textContent = lastSession ? lastSession.toLocaleDateString('he-IL') : 'אין נתונים';
}

function updateSharedInfo() {
    const sessionCount = sharedSessions.length;
    const dateRange = getDateRange();
    sharedInfoEl.textContent = `מציג ${sessionCount} הנקות אחרונות ${dateRange}`;
}

function getDateRange() {
    if (sharedSessions.length === 0) return '';

    const latest = new Date(sharedSessions[0].created_at);
    const earliest = new Date(sharedSessions[sharedSessions.length - 1].created_at);

    if (sharedSessions.length === 1) {
        return `מ-${latest.toLocaleDateString('he-IL')}`;
    }

    return `מ-${earliest.toLocaleDateString('he-IL')} עד ${latest.toLocaleDateString('he-IL')}`;
}

function showSharedError(title, message) {
    sharedSessionsListEl.innerHTML = `
        <div class="error-message">
            <h3>${title}</h3>
            <p>${message}</p>
        </div>
    `;

    // Disable export button
    exportSharedBtn.disabled = true;

    // Update info
    sharedInfoEl.textContent = 'נתונים לא זמינים';
}

// Export Functions
async function exportToCSV() {
    try {
        const { data, error } = await supabaseClient
            .from('feeding_sessions')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            alert('אין נתונים לייצוא');
            return;
        }

        const csvHeaders = ['תאריך', 'צד', 'משך (דקות)', 'זמן התחלה'];
        const csvData = data.map(session => [
            new Date(session.created_at).toLocaleDateString('he-IL'),
            session.side === 'right' ? 'ימין' : 'שמאל',
            Math.floor(session.duration / 60),
            new Date(session.start_time).toLocaleTimeString('he-IL')
        ]);

        const csvContent = [csvHeaders, ...csvData]
            .map(row => row.join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `feeding_log_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    } catch (error) {
        console.error('Error exporting CSV:', error);
        alert('שגיאה בייצוא הנתונים');
    }
}

async function exportSharedToCSV() {
    if (!sharedSessions || sharedSessions.length === 0) {
        alert('אין נתונים לייצוא');
        return;
    }

    try {
        const csvHeaders = ['תאריך', 'צד', 'משך (דקות)', 'זמן התחלה'];
        const csvData = sharedSessions.map(session => [
            new Date(session.created_at).toLocaleDateString('he-IL'),
            session.side === 'right' ? 'ימין' : 'שמאל',
            Math.floor(session.duration / 60),
            new Date(session.start_time).toLocaleTimeString('he-IL')
        ]);

        const csvContent = [csvHeaders, ...csvData]
            .map(row => row.join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `shared_feeding_log_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    } catch (error) {
        console.error('Error exporting shared CSV:', error);
        alert('שגיאה בייצוא הנתונים');
    }
}

function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}

// Sharing Functions
function shareLog() {
    const shareUrl = `${window.location.origin}${window.location.pathname}?user=${currentUser.id}`;
    shareLink.value = shareUrl;
    shareModal.classList.remove('hidden');
    shareModal.classList.add('show');
}

function copyShareLink() {
    shareLink.select();
    document.execCommand('copy');
    alert('הקישור הועתק');
}

function goBackToLogin() {
    // Clear shared data
    sharedUserId = null;
    sharedSessions = [];

    // Remove URL parameters
    window.history.pushState({}, document.title, window.location.pathname);

    // Show login screen
    showLoginScreen();
}

// Event Listeners
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    await login(email, password);
});

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;

    if (password !== confirmPassword) {
        alert('הסיסמאות אינן תואמות');
        return;
    }

    await signup(email, password);
});

showSignupBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showSignupScreen();
});

showLoginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showLoginScreen();
});

logoutBtn.addEventListener('click', logout);
backToLoginBtn.addEventListener('click', goBackToLogin);

startBtn.addEventListener('click', startTimer);
stopBtn.addEventListener('click', stopTimer);

shareBtn.addEventListener('click', shareLog);
exportBtn.addEventListener('click', exportToCSV);
exportSharedBtn.addEventListener('click', exportSharedToCSV);

copyLinkBtn.addEventListener('click', copyShareLink);

closeModal.addEventListener('click', () => {
    shareModal.classList.add('hidden');
    shareModal.classList.remove('show');
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === shareModal) {
        shareModal.classList.add('hidden');
        shareModal.classList.remove('show');
    }
});

// Initialize timer display
updateTimerDisplay(); 