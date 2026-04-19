import { S, saveStore, DEMO_USERS } from '../core/state.js';

/**
 * Login Page Module
 * Restored from v8 monolith with professional UI and Demo Access features.
 */

export function renderLogin() {
    const app = document.getElementById('app');
    console.log('Rendering Login UI into #app');
    
    app.innerHTML = `
        <div class="login-container">
            <div class="login-card anim-scale" style="position: relative; z-index: 10;">
                <div class="login-header">
                    <div class="login-logo">GF</div>
                    <h2>Findie</h2>
                    <p>Intelligence Interface v8.2</p>
                </div>
                
                <div id="login-form">
                    <div class="fg" style="text-align:left; margin-bottom:15px">
                        <label style="font-size:11px; color:var(--t3); margin-bottom:5px; font-weight:700">E-POSTA</label>
                        <input type="email" id="login-email" value="admin@gda.com.tr" style="width:100%">
                    </div>
                    <div class="fg" style="text-align:left; margin-bottom:20px">
                        <label style="font-size:11px; color:var(--t3); margin-bottom:5px; font-weight:700">PAROLA</label>
                        <input type="password" id="login-pass" value="gda123" style="width:100%">
                    </div>
                    
                    <div id="login-error" class="login-error" style="display:none"></div>
                    
                    <button class="btn btn-blue" id="login-btn" style="width:100%; height:44px; justify-content:center; border-radius:12px; font-weight:700">Giriş Yap</button>
                    
                    <div class="demo-access">
                        <div class="demo-label">HIZLI ERİŞİM (DEMO)</div>
                        <div class="demo-buttons">
                            <span class="demo-pill" data-email="admin@gda.com.tr" data-pass="gda123">Admin Portal</span>
                            <span class="demo-pill" data-email="demo@gda.com.tr" data-pass="demo123">Viewer</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="dev-access anim-fade" style="position: relative; z-index: 10;">
                <button id="dev-btn">DEVELOPER ACCESS (DEMO)</button>
                <div class="dev-copyright">Professional Release · © 2026 GDA</div>
            </div>
        </div>
    `;

    // Bind Events
    const loginBtn = document.getElementById('login-btn');
    const devBtn = document.getElementById('dev-btn');
    
    if (loginBtn) {
        loginBtn.onclick = (e) => {
            e.preventDefault();
            console.log('Login button clicked');
            handleLogin();
        };
    }

    if (devBtn) {
        devBtn.onclick = (e) => {
            e.preventDefault();
            console.log('Dev access clicked');
            quickDevLogin();
        };
    }

    document.querySelectorAll('.demo-pill').forEach(pill => {
        pill.onclick = (e) => {
            e.preventDefault();
            console.log('Demo pill clicked:', pill.dataset.email);
            const emailInput = document.getElementById('login-email');
            const passInput = document.getElementById('login-pass');
            if (emailInput) emailInput.value = pill.dataset.email;
            if (passInput) passInput.value = pill.dataset.pass;
            handleLogin();
        };
    });

    const passInputField = document.getElementById('login-pass');
    if (passInputField) {
        passInputField.onkeydown = (e) => {
            if (e.key === 'Enter') handleLogin();
        };
    }
}

function handleLogin() {
    console.log('handleLogin execution started');
    const emailInput = document.getElementById('login-email');
    const passInput = document.getElementById('login-pass');
    const btn = document.getElementById('login-btn');
    const err = document.getElementById('login-error');
    
    if (!emailInput || !passInput) {
        console.error('Inputs not found in DOM');
        return;
    }

    const email = emailInput.value.trim();
    const pass = passInput.value.trim();
    
    console.log('Validating credentials for:', email);
    
    const user = DEMO_USERS.find(u => u.email === email && u.pass === pass);
    
    if (user) {
        console.log('Authentication successful for:', user.name);
        if (btn) {
            btn.textContent = 'Giriş Yapılıyor…'; 
            btn.disabled = true;
        }
        
        setTimeout(() => {
            console.log('Updating state and triggering reload...');
            S.isLoggedIn = true;
            S.user = { email: user.email, name: user.name, role: user.role };
            saveStore();
            window.location.reload(); 
        }, 600);
    } else {
        console.warn('Authentication failed for:', email);
        if (err) {
            err.style.display = 'block';
            err.textContent = '<svg class="lucide lucide-triangle-alert inline-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>️ Hatalı e-posta veya şifre girdiniz.';
        }
    }
}

function quickDevLogin() {
    console.log('quickDevLogin triggered');
    const emailInput = document.getElementById('login-email');
    const passInput = document.getElementById('login-pass');
    if (emailInput) emailInput.value = 'admin@gda.com.tr';
    if (passInput) passInput.value = 'gda123';
    handleLogin();
}
