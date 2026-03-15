(function () {
    const token = localStorage.getItem('admin_token');
    if (!token && !window.location.pathname.endsWith('/admin/') && !window.location.pathname.endsWith('/admin/index.html')) {
        window.location.href = '/admin/';
        return;
    }

    const menuItems = [
        { name: 'Dashboard', icon: '📊', url: '/admin/dashboard.html' },
        { name: 'Service Catalogue', icon: '📋', url: '/admin/catalogue.html' },
        { name: 'Customers', icon: '👥', url: '/admin/customers.html' },
        { name: 'Bookings', icon: '📅', url: '/admin/bookings.html' },
        { name: 'Reports', icon: '📈', url: '/admin/reports.html' },
        { name: 'Partners & KYC', icon: '🤝', url: '/admin/partners.html' },
    ];

    function injectSidebar() {
        const sidebar = document.createElement('aside');
        sidebar.className = 'sidebar';

        const currentPath = window.location.pathname;

        const linksHtml = menuItems.map(item => `
            <a href="${item.url}" class="sidebar-link ${currentPath.includes(item.url) ? 'active' : ''}">
                <span class="sidebar-icon">${item.icon}</span>
                <span class="sidebar-text">${item.name}</span>
            </a>
        `).join('');

        sidebar.innerHTML = `
            <a href="/admin/dashboard.html" class="sidebar-brand" style="display: flex; align-items: center; gap: 8px;">
                <img src="assets/logo_full.png" alt="Xalon" style="height: 28px; width: auto; object-fit: contain;">
                <span style="font-size: 16px; font-weight: 800; color: var(--text); letter-spacing: 2px; line-height: 1; margin-top: 4px;">HUB</span>
            </a>
            <nav class="sidebar-nav">
                ${linksHtml}
            </nav>
            <div class="sidebar-footer">
                <button class="btn-logout" onclick="logout()" style="width: 100%; text-align: left; display: flex; align-items: center; gap: 12px; padding: 12px 16px; border: none; background: none; color: var(--text-dim); cursor: pointer; border-radius: 12px; font-weight: 500; font-family: inherit;">
                    <span class="sidebar-icon">🚪</span>
                    <span>Logout</span>
                </button>
            </div>
        `;

        document.body.prepend(sidebar);
    }

    window.logout = async function () {
        try {
            await fetch('/admin/api/logout', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (_) { }
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/admin/';
    };

    // Inject sidebar once DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectSidebar);
    } else {
        injectSidebar();
    }
})();
