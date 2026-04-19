import { S, saveStore } from './core/state.js';
import { DEMO_USERS } from './core/constants.js';
import { toast } from './components/ui.js';
import { navigate } from './core/router.js';

/**
 * Authentication Service
 */
export function checkAuth() {
    if (!S.isLoggedIn) {
        renderLoginPage();
        return false;
    }
    return true;
}

export function handleLogin(email, pass) {
    const user = DEMO_USERS.find(u => u.email === email && u.pass === pass);
    
    if (user) {
        S.isLoggedIn = true;
        S.user = { email: user.email, name: user.name, role: user.role };
        saveStore();
        toast('Giriş başarılı, hoş geldiniz!', 'ok');
        // Reload to initialize app state correctly
        window.location.reload(); 
    } else {
        toast('Hatalı e-posta veya şifre!', 'danger');
    }
}

export function logout() {
    S.isLoggedIn = false;
    S.user = null;
    saveStore();
    window.location.reload();
}

function renderLoginPage(err = '') {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
        <div class="auth-container">
            <div class="auth-card anim-scale">
                <div class="auth-header">
                    <div class="auth-logo">GF</div>
                    <h2 class="auth-title">GDA Finance</h2>
                    <p class="auth-subtitle">Kurumsal Finans Arayüzü v8.2</p>
                </div>
                
                <div class="fg">
                    <label>E-POSTA</label>
                    <input type="email" id="login-email" value="admin@gda.com.tr" placeholder="ör: admin@gda.com.tr">
                </div>
                <div class="fg">
                    <label>ŞİFRE</label>
                    <input type="password" id="login-pass" value="gda123" placeholder="••••••••">
                </div>
                
                <button class="btn btn-blue auth-btn" id="login-submit-btn">Giriş Yap</button>
                
                <div class="auth-footer">
                    <div class="auth-demo-label">HIZLI ERİŞİM (DEMO)</div>
                    <div class="auth-demo-grid">
                        <button class="demo-pill" data-email="admin@gda.com.tr" data-pass="gda123">Admin Portal</button>
                        <button class="demo-pill" data-email="demo@gda.com.tr" data-pass="demo123">Viewer</button>
                    </div>
                </div>
            </div>
            <div class="auth-copyright">Professional Release · © 2026 GDA</div>
        </div>
    `;

    // Event Listeners
    document.getElementById('login-submit-btn')?.addEventListener('click', () => {
        const e = document.getElementById('login-email').value;
        const p = document.getElementById('login-pass').value;
        handleLogin(e, p);
    });

    document.querySelectorAll('.demo-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('login-email').value = btn.dataset.email;
            document.getElementById('login-pass').value = btn.dataset.pass;
        });
    });

    // Enter key support
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && document.getElementById('login-submit-btn')) {
            document.getElementById('login-submit-btn').click();
        }
    });
}
