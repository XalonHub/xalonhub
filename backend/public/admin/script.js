document.addEventListener('DOMContentLoaded', () => {
    // If already logged in, redirect to dashboard
    if (localStorage.getItem('admin_token')) {
        window.location.href = '/admin/dashboard.html';
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const phoneInput = document.getElementById('phone');
    const passwordInput = document.getElementById('password');
    const errorMsg = document.getElementById('errorMessage');
    const loginBtn = document.getElementById('loginBtn');
    const spinner = document.getElementById('spinner');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const phone = phoneInput.value.trim();
        const password = passwordInput.value.trim();

        if (phone.length !== 10) {
            showError('Please enter a valid 10-digit phone number');
            return;
        }

        setLoading(true);
        errorMsg.textContent = '';

        try {
            const response = await fetch('/admin/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, password })
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('admin_token', data.token);
                localStorage.setItem('admin_user', JSON.stringify(data.user));
                showSuccess('Login successful! Redirecting...');
                setTimeout(() => { window.location.href = '/admin/dashboard.html'; }, 600);
            } else {
                showError(data.message || 'Login failed');
            }
        } catch (error) {
            showError('Network error. Is the server running?');
        } finally {
            setLoading(false);
        }
    });

    function showError(msg) {
        errorMsg.style.color = '#EF4444';
        errorMsg.textContent = msg;
        loginForm.parentElement.animate([
            { transform: 'translateX(0)' }, { transform: 'translateX(-5px)' },
            { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }
        ], { duration: 300 });
    }

    function showSuccess(msg) {
        errorMsg.style.color = '#10B981';
        errorMsg.textContent = msg;
    }

    function setLoading(isLoading) {
        loginBtn.disabled = isLoading;
        spinner.style.display = isLoading ? 'block' : 'none';
        loginBtn.querySelector('.btn-text').textContent = isLoading ? 'Authenticating...' : 'Log In';
    }
});
