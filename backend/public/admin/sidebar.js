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
        { name: 'Settings', icon: '⚙️', url: '/admin/settings.html' },
    ];

    function injectSidebar() {
        const sidebar = document.createElement('aside');
        sidebar.className = 'sidebar-container'; // Changed from 'sidebar' to 'sidebar-container' to match new structure

        const currentPath = window.location.pathname;
        const activePage = currentPath.substring(currentPath.lastIndexOf('/') + 1);

        const sidebarContent = `
    <div class="sidebar">
        <div class="logo-container">
            <div class="logo-orbit">🪐</div>
            <div class="logo-text">XalonHub</div>
        </div>
        
        <div class="nav-links">
            <a href="/admin/dashboard.html" class="nav-item ${activePage === 'dashboard.html' ? 'active' : ''}">
                <i class="icon">📊</i>
                <span>Dashboard</span>
            </a>
            <a href="/admin/catalogue.html" class="nav-item ${activePage === 'catalogue.html' ? 'active' : ''}">
                <i class="icon">📋</i>
                <span>Catalogue</span>
            </a>
            <a href="/admin/customers.html" class="nav-item ${activePage === 'customers.html' ? 'active' : ''}">
                <i class="icon">👥</i>
                <span>Customers</span>
            </a>
            <a href="/admin/bookings.html" class="nav-item ${activePage === 'bookings.html' ? 'active' : ''}">
                <i class="icon">📅</i>
                <span>Bookings</span>
            </a>
            <a href="/admin/reports.html" class="nav-item ${activePage === 'reports.html' ? 'active' : ''}">
                <i class="icon">💰</i>
                <span>Reports</span>
            </a>
            <a href="/admin/partners.html" class="nav-item ${activePage === 'partners.html' ? 'active' : ''}">
                <i class="icon">🤝</i>
                <span>Partners</span>
            </a>
            <a href="/admin/settings.html" class="nav-item ${activePage === 'settings.html' ? 'active' : ''}">
                <i class="icon">⚙️</i>
                <span>Settings</span>
            </a>
        </div>

        <div style="padding: 24px;">
            <a href="#" onclick="logout()" class="nav-item" style="color: var(--danger); background: var(--primary-light);">
                <i class="icon">🚪</i>
                <span>Logout</span>
            </a>
        </div>
    </div>
`;
        sidebar.innerHTML = sidebarContent;

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
