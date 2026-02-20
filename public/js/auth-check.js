// Check authentication status and update navbar
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/auth/status', {
            credentials: 'include' // Ensure cookies are sent
        });
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.warn('Auth status returned non-JSON response');
            handleUnauthenticated();
            return;
        }
        
        const result = await response.json();
        
        const authLink = document.getElementById('authLink');
        
        if (!authLink) {
            console.error('authLink element not found');
            return;
        }
        
        if (result.authenticated && result.user) {
            // User is logged in - update localStorage
            localStorage.setItem('user', JSON.stringify(result.user));
            updateNavbarWithUser(result.user);
        } else {
            handleUnauthenticated();
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        handleUnauthenticated();
    }
}

function handleUnauthenticated() {
    // Check localStorage as fallback
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        try {
            const user = JSON.parse(storedUser);
            updateNavbarWithUser(user);
            return;
        } catch (e) {
            localStorage.removeItem('user');
        }
    }
    
    // User is not logged in
    const authLink = document.getElementById('authLink');
    if (authLink) {
        authLink.innerHTML = 'Login';
        authLink.href = '/login.html';
    }
}

function updateNavbarWithUser(user) {
    const authLink = document.getElementById('authLink');
    if (!authLink) return;
    
    const userName = user.name.split(' ')[0]; // Get first name
    
    // Create dropdown menu
    authLink.innerHTML = `
        <div class="user-menu">
            <span class="user-name">Hi, ${userName} ▾</span>
            <div class="user-dropdown">
                ${user.role === 'admin' ? '<a href="/admin/index.html">Admin Panel</a>' : ''}
                <a href="#" onclick="logout(); return false;">Logout</a>
            </div>
        </div>
    `;
    authLink.href = '#';
}

async function logout() {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        // Clear localStorage
        localStorage.removeItem('user');
        
        // Redirect to home
        window.location.href = '/';
    } catch (error) {
        console.error('Logout error:', error);
        localStorage.removeItem('user');
        window.location.href = '/';
    }
}

// Run on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAuthStatus);
} else {
    checkAuthStatus();
}
