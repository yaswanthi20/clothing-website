let isSignup = false;

function toggleForm() {
    isSignup = !isSignup;
    
    const nameField = document.getElementById('nameField');
    const phoneField = document.getElementById('phoneField');
    const nameInput = document.getElementById('name');
    const phoneInput = document.getElementById('phone');
    
    document.getElementById('formTitle').textContent = isSignup ? 'Sign Up' : 'Login';
    
    if (isSignup) {
        nameField.style.display = 'block';
        phoneField.style.display = 'block';
        nameInput.setAttribute('required', 'required');
        // Phone is optional, so no required attribute
    } else {
        nameField.style.display = 'none';
        phoneField.style.display = 'none';
        nameInput.removeAttribute('required');
        phoneInput.removeAttribute('required');
    }
    
    document.querySelector('.toggle-form').innerHTML = isSignup 
        ? 'Already have an account? <a href="#" onclick="toggleForm(); return false;">Login</a>'
        : 'Don\'t have an account? <a href="#" onclick="toggleForm(); return false;">Sign Up</a>';
    
    document.querySelector('button[type="submit"]').textContent = isSignup ? 'Sign Up' : 'Login';
}

document.getElementById('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const endpoint = isSignup ? '/api/auth/register' : '/api/auth/login';
    const body = { email, password };
    
    if (isSignup) {
        body.name = document.getElementById('name').value;
        body.phone = document.getElementById('phone').value;
    }
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        const result = await response.json();
        
        if (result.success) {
            if (isSignup) {
                alert('Registration successful! Please login.');
                toggleForm();
            } else {
                // Store user info in localStorage
                if (result.user) {
                    localStorage.setItem('user', JSON.stringify(result.user));
                }
                
                alert('Login successful!');
                
                // Small delay to ensure session is saved
                setTimeout(() => {
                    // Redirect based on user role
                    if (result.user && result.user.role === 'admin') {
                        window.location.href = '/admin/index.html';
                    } else {
                        window.location.href = '/';
                    }
                }, 100);
            }
        } else {
            alert(result.message || 'An error occurred');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    }
});
