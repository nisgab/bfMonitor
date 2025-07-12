// Supabase Configuration
const SUPABASE_URL = 'https://ihywcpotcozfnhadsfak.supabase.co'; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloeXdjcG90Y296Zm5oYWRzZmFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyOTU2MDYsImV4cCI6MjA2Nzg3MTYwNn0.CmB7EL-_3Kc1eNeVmCaoE6PP8IHiY_bpJoY0dOkJeBQ'; // Replace with your Supabase anon key

// Initialize Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global Variables
let currentUser = null;
let sessions = [];
let sharedUserId = null;
let sharedSessions = [];
let showingAllSessions = false;

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
const leftBtn = document.getElementById('left-btn');
const rightBtn = document.getElementById('right-btn');
const sessionsListEl = document.getElementById('sessions-list');
const sessionsTitleEl = document.getElementById('sessions-title');
const sharedSessionsListEl = document.getElementById('shared-sessions-list');
const showAllBtn = document.getElementById('show-all-btn');
const exportBtn = document.getElementById('export-btn');
const exportSharedBtn = document.getElementById('export-shared-btn');
const sharedInfoEl = document.getElementById('shared-info');
const totalSessionsEl = document.getElementById('total-sessions');
const lastSessionEl = document.getElementById('last-session');
const leftCountEl = document.getElementById('left-count');
const rightCountEl = document.getElementById('right-count');

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

        // If signup is successful and user is immediately available, log them in
        if (data.user && !data.user.email_confirmed_at) {
            alert('נרשמת בהצלחה! מתחבר אותך אוטומטית...');
            // Try to log in immediately
            await login(email, password);
        } else if (data.user) {
            currentUser = data.user;
            await loadSessions();
            showMainScreen();
            alert('נרשמת והתחברת בהצלחה!');
        } else {
            alert('נרשמת בהצלחה! אנא התחבר עם הפרטים שלך.');
            showLoginScreen();
        }
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

// Feeding Functions
async function recordFeeding(side) {
    try {
        // Add visual feedback
        const button = side === 'left' ? leftBtn : rightBtn;
        button.disabled = true;
        button.style.opacity = '0.7';

        const session = {
            user_id: currentUser.id,
            side: side,
            duration: 0, // Set to 0 since we're not tracking time
            start_time: new Date().toISOString(),
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabaseClient
            .from('feeding_sessions')
            .insert([session])
            .select();

        if (error) throw error;

        sessions.unshift(data[0]);

        // Reset to showing recent sessions to see the new feeding
        if (showingAllSessions) {
            showingAllSessions = false;
            showAllBtn.textContent = 'הצג היסטוריה מלאה';
            sessionsTitleEl.textContent = 'הנקות אחרונות';
        }

        updateSessionsList();

        // Show success feedback
        const originalText = button.querySelector('.side-text').textContent;
        button.querySelector('.side-text').textContent = 'נרשם!';
        button.style.background = '#4caf50';

        setTimeout(() => {
            button.querySelector('.side-text').textContent = originalText;
            button.disabled = false;
            button.style.opacity = '1';
            button.style.background = '';
        }, 1500);

    } catch (error) {
        console.error('Error saving feeding:', error);
        alert('שגיאה ברישום ההנקה');

        // Reset button
        const button = side === 'left' ? leftBtn : rightBtn;
        button.disabled = false;
        button.style.opacity = '1';
    }
}

// Session Management Functions
async function loadSessions(loadAll = false) {
    try {
        const query = supabaseClient
            .from('feeding_sessions')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (!loadAll) {
            query.limit(3);
        }

        const { data, error } = await query;

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

    const displaySessions = showingAllSessions ? sessions : sessions.slice(0, 3);

    sessionsListEl.innerHTML = displaySessions.map(session => {
        const date = new Date(session.created_at);
        const side = session.side === 'right' ? 'ימין' : 'שמאל';
        const sideClass = session.side === 'right' ? 'right-side' : 'left-side';

        return `
            <div class="session-item">
                <div class="session-side ${sideClass}">${side}</div>
                <div class="session-time">${date.toLocaleString('he-IL')}</div>
            </div>
        `;
    }).join('');
}

async function toggleAllSessions() {
    showingAllSessions = !showingAllSessions;

    if (showingAllSessions) {
        await loadSessions(true);
        showAllBtn.textContent = 'הצג הנקות אחרונות';
        sessionsTitleEl.textContent = 'היסטוריה מלאה';
    } else {
        await loadSessions(false);
        showAllBtn.textContent = 'הצג היסטוריה מלאה';
        sessionsTitleEl.textContent = 'הנקות אחרונות';
    }
}

// Shared View Functions
async function loadSharedView() {
    try {
        showSharedScreen();

        // Add debug info for mobile troubleshooting
        console.log('Loading shared view for user:', sharedUserId);
        console.log('User agent:', navigator.userAgent);
        console.log('Supabase URL:', SUPABASE_URL);

        // Update UI to show loading state
        sharedInfoEl.textContent = 'טוען נתונים...';

        // Load shared sessions (last 10 sessions)
        const { data: sessionsData, error: sessionsError } = await supabaseClient
            .from('feeding_sessions')
            .select('*')
            .eq('user_id', sharedUserId)
            .order('created_at', { ascending: false })
            .limit(10);

        console.log('Supabase response:', { data: sessionsData, error: sessionsError });

        if (sessionsError) {
            console.error('Supabase error:', sessionsError);
            throw sessionsError;
        }

        if (!sessionsData || sessionsData.length === 0) {
            console.log('No sessions found for user:', sharedUserId);
            showSharedError('לא נמצאו נתונים', 'המשתמש לא קיים או שלא בוצעו הנקות עדיין');
            return;
        }

        console.log('Successfully loaded', sessionsData.length, 'sessions');
        sharedSessions = sessionsData;
        updateSharedSessionsList();
        updateSharedStats();
        updateSharedInfo();

    } catch (error) {
        console.error('Error loading shared view:', error);

        // Show more detailed error for debugging
        const errorMessage = error.message || 'שגיאה לא ידועה';
        const debugInfo = `Debug info: ${error.name || 'Unknown'} - ${errorMessage}`;

        showSharedError('שגיאה בטעינת הנתונים', `${errorMessage}\n\n${debugInfo}`);

        // Also update the info element with debug information
        sharedInfoEl.textContent = `שגיאה: ${errorMessage}`;
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
        const sideClass = session.side === 'right' ? 'right-side' : 'left-side';

        return `
            <div class="session-item">
                <div class="session-side ${sideClass}">${side}</div>
                <div class="session-time">${date.toLocaleString('he-IL')}</div>
            </div>
        `;
    }).join('');
}

function updateSharedStats() {
    const totalSessions = sharedSessions.length;
    const leftSessions = sharedSessions.filter(s => s.side === 'left').length;
    const rightSessions = sharedSessions.filter(s => s.side === 'right').length;
    const lastSession = sharedSessions.length > 0 ? new Date(sharedSessions[0].created_at) : null;

    totalSessionsEl.textContent = totalSessions;
    leftCountEl.textContent = leftSessions;
    rightCountEl.textContent = rightSessions;
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

function goBackToLogin() {
    // Clear shared data
    sharedUserId = null;
    sharedSessions = [];

    // Remove URL parameters
    window.history.pushState({}, document.title, window.location.pathname);

    // Show login screen
    showLoginScreen();
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

        const csvHeaders = ['תאריך', 'צד', 'זמן'];
        const csvData = data.map(session => [
            new Date(session.created_at).toLocaleDateString('he-IL'),
            session.side === 'right' ? 'ימין' : 'שמאל',
            new Date(session.created_at).toLocaleTimeString('he-IL')
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
        const csvHeaders = ['תאריך', 'צד', 'זמן'];
        const csvData = sharedSessions.map(session => [
            new Date(session.created_at).toLocaleDateString('he-IL'),
            session.side === 'right' ? 'ימין' : 'שמאל',
            new Date(session.created_at).toLocaleTimeString('he-IL')
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

leftBtn.addEventListener('click', () => recordFeeding('left'));
rightBtn.addEventListener('click', () => recordFeeding('right'));

showAllBtn.addEventListener('click', toggleAllSessions);
exportBtn.addEventListener('click', exportToCSV);
exportSharedBtn.addEventListener('click', exportSharedToCSV); 