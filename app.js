const SUPABASE_URL = window.SUPABASE_URL || "https://YOUR-SUPABASE-URL.supabase.co";
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || "YOUR_SUPABASE_ANON_KEY";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const STAKING_ROI = 2.0;
const STAKING_DAYS = 60;

const state = {
    view: 'loading',
    user: null,
    profile: null,
    settings: null,
    deposits: [],
    withdraws: [],
    stakings: [],
    adminData: { users: [], deposits: [], withdraws: [] },
    submitting: false,
};

function formatUSD(value) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
}

function toast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toastEl = document.createElement('div');
    toastEl.className = `toast toast-${type}`;
    toastEl.innerHTML = `<i data-lucide="${type === 'error' ? 'x-circle' : 'check-circle'}" size="18"></i><span>${message}</span>`;
    document.body.appendChild(toastEl);
    lucide.createIcons();

    setTimeout(() => toastEl.remove(), 4200);
}

function showError(message) {
    toast(message, 'error');
}

async function render() {
    const app = document.getElementById('app');
    if (!app) return;

    if (state.view === 'loading') {
        app.innerHTML = `
            <div class="glass-card hero-card" style="max-width: 520px; margin: 80px auto; text-align:center;">
                <h1 class="section-title">Loading CryptoStake...</h1>
                <p class="text-muted">Please wait while we connect to Supabase.</p>
            </div>
        `;
        return;
    }

    if (state.view === 'login') {
        renderLogin(app);
        return;
    }

    if (state.view === 'register') {
        renderRegister(app);
        return;
    }

    renderLayout(app);
    lucide.createIcons();
    startClock();
}

function renderLogin(container) {
    container.innerHTML = `
        <div class="glass-card hero-card" style="max-width: 520px; margin: 48px auto;">
            <h1 class="section-title">CryptoStake Login</h1>
            <p class="text-muted">Masuk untuk mulai staking dan kelola asetmu.</p>
            <div style="margin-top:2rem; display:grid; gap:1rem;">
                <input id="loginEmail" type="email" class="input-field" placeholder="Email" required />
                <input id="loginPassword" type="password" class="input-field" placeholder="Password" required />
                <button id="loginButton" class="primary-btn button">Login</button>
                <button onclick="navigate('register')" class="secondary-btn button">Create an account</button>
            </div>
        </div>
    `;
    lucide.createIcons();

    document.getElementById('loginButton').addEventListener('click', handleLogin);
}

function renderRegister(container) {
    container.innerHTML = `
        <div class="glass-card hero-card" style="max-width: 520px; margin: 48px auto;">
            <h1 class="section-title">Register CryptoStake</h1>
            <p class="text-muted">Buat akun baru dan mulai staking sekarang.</p>
            <div style="margin-top:2rem; display:grid; gap:1rem;">
                <input id="registerName" type="text" class="input-field" placeholder="Username" required />
                <input id="registerEmail" type="email" class="input-field" placeholder="Email" required />
                <input id="registerPassword" type="password" class="input-field" placeholder="Password" required />
                <button id="registerButton" class="primary-btn button">Sign Up</button>
                <button onclick="navigate('login')" class="secondary-btn button">Back to login</button>
            </div>
        </div>
    `;
    lucide.createIcons();

    document.getElementById('registerButton').addEventListener('click', handleRegister);
}

function renderLayout(container) {
    const isAdmin = state.profile?.role === 'admin' || state.user?.user_metadata?.role === 'admin';
    container.innerHTML = `
        <div class="layout-columns">
            <aside class="glass-card" style="padding:24px; display:flex; flex-direction:column; gap:1rem;">
                <div style="display:flex; align-items:center; gap:1rem;">
                    <div style="width:48px; height:48px; border-radius:16px; background:linear-gradient(135deg,#14b8a6,#0d9488); display:flex; align-items:center; justify-content:center; color:#fff; font-weight:800;">S</div>
                    <div>
                        <p style="margin:0; font-weight:700; color:#f8fafc;">CryptoStake</p>
                        <p class="text-muted" style="margin:4px 0 0 0; font-size:0.95rem;">Dashboard</p>
                    </div>
                </div>
                <nav class="nav-panel">
                    <button onclick="navigate('dashboard')" class="nav-link ${state.view === 'dashboard' ? 'active' : ''}">Dashboard</button>
                    <button onclick="navigate('staking')" class="nav-link ${state.view === 'staking' ? 'active' : ''}">Staking</button>
                    <button onclick="navigate('deposit')" class="nav-link ${state.view === 'deposit' ? 'active' : ''}">Deposit</button>
                    <button onclick="navigate('withdraw')" class="nav-link ${state.view === 'withdraw' ? 'active' : ''}">Withdraw</button>
                    ${isAdmin ? `<button onclick="navigate('admin')" class="nav-link ${state.view === 'admin' ? 'active' : ''}">Admin</button>` : ''}
                </nav>
                <div style="margin-top:auto;">
                    <div style="display:flex; align-items:center; gap:0.85rem; margin-bottom:1rem;">
                        <div style="width:42px; height:42px; border-radius:50%; background:rgba(20,184,166,0.12); display:flex; align-items:center; justify-content:center; color:#14b8a6; font-weight:700;">${(state.profile?.username || 'U').charAt(0).toUpperCase()}</div>
                        <div>
                            <p style="margin:0; font-weight:700; color:#f8fafc;">${state.profile?.username || 'User'}</p>
                            <p class="text-muted" style="margin:4px 0 0 0; font-size:0.85rem;">${state.user?.email || ''}</p>
                        </div>
                    </div>
                    <button onclick="handleLogout()" class="secondary-btn button" style="width:100%;">Logout</button>
                </div>
            </aside>
            <main style="display:flex; flex-direction:column; gap:1.5rem;">
                <section class="glass-card" style="padding:24px;">
                    <div style="display:flex; flex-wrap:wrap; justify-content:space-between; gap:1rem; align-items:center;">
                        <div>
                            <h2 class="section-title" style="margin-bottom:0.4rem; text-transform:capitalize;">${state.view}</h2>
                            <p class="text-muted">Kelola aset staking, deposit, dan permintaan withdrawmu.</p>
                        </div>
                        <div style="display:flex; gap:0.75rem; align-items:center;">
                            <i data-lucide="clock" style="color:#14b8a6;"></i>
                            <span id="clock" style="font-family:ui-monospace, monospace; font-weight:700;">00:00:00</span>
                        </div>
                    </div>
                </section>
                <section id="viewContent" class="glass-card" style="padding:24px; min-height:480px;"></section>
            </main>
        </div>
    `;
    const content = document.getElementById('viewContent');
    if (content) content.innerHTML = renderView();
}

function renderView() {
    switch (state.view) {
        case 'dashboard': return renderDashboard();
        case 'staking': return renderStaking();
        case 'deposit': return renderDeposit();
        case 'withdraw': return renderWithdraw();
        case 'admin': return renderAdmin();
        default: return '<p class="text-muted">Section not found.</p>';
    }
}

function renderDashboard() {
    const activeStakes = state.stakings.filter(s => s.status === 'active');
    const profit = activeStakes.reduce((sum, stake) => sum + calculateReward(stake), 0);
    const totalDeposit = state.deposits.reduce((sum, item) => sum + (item.status === 'approved' ? Number(item.deposit_amount) : 0), 0);

    return `
        <div class="card-grid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr));">
            <div class="glass-card" style="padding:22px;">
                <p class="text-muted">Balance</p>
                <h3>${formatUSD(state.profile?.balance)}</h3>
            </div>
            <div class="glass-card" style="padding:22px;">
                <p class="text-muted">Active Stakes</p>
                <h3>${activeStakes.length}</h3>
            </div>
            <div class="glass-card" style="padding:22px;">
                <p class="text-muted">Estimated Reward</p>
                <h3>${formatUSD(profit)}</h3>
            </div>
            <div class="glass-card" style="padding:22px;">
                <p class="text-muted">Total Approved Deposit</p>
                <h3>${formatUSD(totalDeposit)}</h3>
            </div>
        </div>
        <div style="margin-top:1.5rem;">
            <h3 style="margin-bottom:1rem; color:#f8fafc;">Latest Deposit Requests</h3>
            <div class="table-panel">
                <table class="transaction-table">
                    <thead>
                        <tr><th>Amount</th><th>Status</th><th>Date</th></tr>
                    </thead>
                    <tbody>
                        ${state.deposits.slice(0, 5).map(item => `
                            <tr>
                                <td>${formatUSD(item.deposit_amount)}</td>
                                <td><span class="status-pill ${item.status === 'approved' ? 'status-approved' : 'status-pending'}">${item.status}</span></td>
                                <td>${new Date(item.created_at || item.date || Date.now()).toLocaleDateString()}</td>
                            </tr>
                        `).join('')}
                        ${state.deposits.length === 0 ? `
                            <tr><td colspan="3" style="padding:1.5rem; text-align:center; color:#94a3b8;">No deposit activity yet.</td></tr>
                        ` : ''}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderStaking() {
    const activeStakes = state.stakings.filter(s => s.status === 'active');
    return `
        <div class="card-grid" style="grid-template-columns:1.2fr 0.8fr; gap:1.5rem;">
            <div class="glass-card" style="padding:24px;">
                <h3 style="margin-top:0;">Start a new stake</h3>
                <p class="text-muted">Minimum $10, maximum balance tersedia.</p>
                <div style="margin-top:1.5rem; display:grid; gap:1rem;">
                    <input id="stakeAmount" type="number" min="10" step="0.01" class="input-field" placeholder="Stake amount in USD" />
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:1rem;">
                        <span class="text-muted">Estimated reward</span>
                        <strong id="stakeEstimate">$0.00</strong>
                    </div>
                    <button onclick="handleStake()" class="primary-btn button">Create Stake</button>
                </div>
            </div>
            <div style="display:grid; gap:1rem;">
                ${activeStakes.length ? activeStakes.map(stake => `
                    <div class="glass-card" style="padding:20px;">
                        <p class="text-muted" style="margin:0 0 0.5rem 0;">Stake amount</p>
                        <h4 style="margin:0 0 1rem 0;">${formatUSD(stake.stake_amount)}</h4>
                        <p class="text-muted" style="margin:0 0 0.5rem 0;">Current reward</p>
                        <h4 style="margin:0 0 1rem 0;">${formatUSD(calculateReward(stake))}</h4>
                        <div style="height:10px; border-radius:999px; background:rgba(148,163,184,0.12); overflow:hidden; margin-bottom:1rem;">
                            <div id="progress-${stake.id}" style="width:${Math.min(getStakeProgress(stake), 100)}%; height:100%; background:linear-gradient(135deg,#14b8a6,#0d9488);"></div>
                        </div>
                        <button onclick="handleUnstake('${stake.id}')" class="secondary-btn button" style="width:100%;">End Stake</button>
                    </div>
                `).join('') : `<div class="glass-card" style="padding:24px; text-align:center; color:#94a3b8;">No active stakes yet.</div>`}
            </div>
        </div>
    `;
}

function renderDeposit() {
    return `
        <div class="card-grid" style="grid-template-columns:1.1fr 0.9fr; gap:1.5rem;">
            <div class="glass-card" style="padding:24px;">
                <h3 style="margin-top:0;">Deposit Proof</h3>
                <p class="text-muted">Kirim USDT TRC20 ke alamat platform lalu submit bukti.</p>
                <div style="margin:1.5rem 0; padding:1rem; border-radius:22px; background:rgba(15,23,42,0.88);">
                    <p class="text-muted" style="margin:0 0 0.75rem 0;">Platform Wallet</p>
                    <div style="display:flex; gap:0.75rem; align-items:center; justify-content:space-between;">
                        <code style="word-break:break-all; color:#e2e8f0;">${state.settings?.admin_wallet || 'Loading wallet...'}</code>
                        <button onclick="copyWallet()" class="secondary-btn button">Copy</button>
                    </div>
                </div>
                <div style="display:grid; gap:1rem;">
                    <input id="depositAmount" type="number" min="10" step="0.01" class="input-field" placeholder="Amount in USD" />
                    <input id="depositTxid" type="text" class="input-field" placeholder="Transaction ID / TXID" />
                    <button onclick="handleDeposit()" class="primary-btn button">Submit Proof</button>
                </div>
            </div>
            <div class="glass-card" style="padding:24px;">
                <h3 style="margin-top:0;">Recent deposits</h3>
                <div class="table-panel" style="margin-top:1rem;">
                    <table class="transaction-table">
                        <thead><tr><th>Amount</th><th>Status</th></tr></thead>
                        <tbody>
                            ${state.deposits.map(item => `
                                <tr>
                                    <td>${formatUSD(item.deposit_amount)}</td>
                                    <td><span class="status-pill ${item.status === 'approved' ? 'status-approved' : 'status-pending'}">${item.status}</span></td>
                                </tr>
                            `).join('')}
                            ${state.deposits.length === 0 ? `
                                <tr><td colspan="2" style="padding:1.5rem; text-align:center; color:#94a3b8;">Belum ada deposit.</td></tr>
                            ` : ''}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function renderWithdraw() {
    return `
        <div class="glass-card" style="padding:32px; max-width:700px; margin:auto;">
            <h3 style="margin-top:0;">Withdraw Request</h3>
            <p class="text-muted">Masukkan jumlah dan alamat TRC20 Anda.</p>
            <div style="margin-top:1.5rem; display:grid; gap:1rem;">
                <input id="withdrawAmount" type="number" min="10" step="0.01" class="input-field" placeholder="Amount in USD" />
                <input id="withdrawWallet" type="text" class="input-field" placeholder="TRC20 wallet address" />
                <button onclick="handleWithdraw()" class="primary-btn button">Request Withdraw</button>
            </div>
        </div>
    `;
}

function renderAdmin() {
    const pendingDeposits = state.adminData.deposits.filter(item => item.status === 'pending');
    const pendingWithdraws = state.adminData.withdraws.filter(item => item.status === 'pending');

    return `
        <div style="display:grid; gap:1.5rem;">
            <div class="card-grid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr));">
                <div class="glass-card" style="padding:24px;"><p class="text-muted">Total Users</p><h3>${state.adminData.users.length}</h3></div>
                <div class="glass-card" style="padding:24px;"><p class="text-muted">Pending Deposits</p><h3>${pendingDeposits.length}</h3></div>
                <div class="glass-card" style="padding:24px;"><p class="text-muted">Pending Withdraws</p><h3>${pendingWithdraws.length}</h3></div>
            </div>
            <div class="glass-card" style="padding:24px;">
                <h3 style="margin-top:0;">Pending Deposit Approvals</h3>
                <div class="table-panel" style="margin-top:1rem;">
                    <table class="transaction-table">
                        <thead><tr><th>User</th><th>Amount</th><th>Action</th></tr></thead>
                        <tbody>
                            ${pendingDeposits.map(item => `
                                <tr>
                                    <td>${item.user_id}</td>
                                    <td>${formatUSD(item.deposit_amount)}</td>
                                    <td style="display:flex; gap:0.5rem;">
                                        <button onclick="adminAction('deposits', '${item.id}', 'approved', ${item.deposit_amount}, '${item.user_id}')" class="secondary-btn button">Approve</button>
                                        <button onclick="adminAction('deposits', '${item.id}', 'rejected')" class="secondary-btn button">Reject</button>
                                    </td>
                                </tr>
                            `).join('')}
                            ${pendingDeposits.length === 0 ? `
                                <tr><td colspan="3" style="padding:1.5rem; text-align:center; color:#94a3b8;">No pending deposit requests.</td></tr>
                            ` : ''}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function navigate(view) {
    state.view = view;
    render();
}

async function checkAuth() {
    const { data } = await supabaseClient.auth.getSession();
    if (data?.session) {
        state.user = data.session.user;
        state.view = 'dashboard';
        await fetchUserData();
    } else {
        state.user = null;
        state.view = 'login';
    }
    render();
}

async function fetchUserData() {
    if (!state.user) return;

    const [profileResult, settingsResult, depositResult, withdrawResult, stakingResult] = await Promise.all([
        supabaseClient.from('users').select('*').eq('id', state.user.id).single(),
        supabaseClient.from('settings').select('*').single(),
        supabaseClient.from('deposits').select('*').eq('user_id', state.user.id).order('created_at', { ascending: false }),
        supabaseClient.from('withdraw').select('*').eq('user_id', state.user.id).order('created_at', { ascending: false }),
        supabaseClient.from('staking').select('*').eq('user_id', state.user.id)
    ]);

    state.profile = profileResult.data;
    state.settings = settingsResult.data;
    state.deposits = depositResult.data || [];
    state.withdraws = withdrawResult.data || [];
    state.stakings = stakingResult.data || [];

    if (state.profile?.role === 'admin') {
        const [usersResult, allDepositsResult, allWithdrawsResult] = await Promise.all([
            supabaseClient.from('users').select('*'),
            supabaseClient.from('deposits').select('*').order('created_at', { ascending: false }),
            supabaseClient.from('withdraw').select('*').order('created_at', { ascending: false })
        ]);
        state.adminData = {
            users: usersResult.data || [],
            deposits: allDepositsResult.data || [],
            withdraws: allWithdrawsResult.data || []
        };
    }
}

function getStakeProgress(stake) {
    const start = new Date(stake.start_time).getTime();
    const end = new Date(stake.end_time).getTime();
    return ((Date.now() - start) / (end - start)) * 100;
}

function calculateReward(stake) {
    if (!stake || stake.status !== 'active') return stake?.total_reward || 0;
    const start = new Date(stake.start_time).getTime();
    const end = new Date(stake.end_time).getTime();
    const now = Math.min(Date.now(), end);
    const elapsed = Math.max(0, now - start);
    const totalDuration = Math.max(1, end - start);
    return (elapsed / totalDuration) * (stake.stake_amount * STAKING_ROI);
}

async function handleLogin() {
    const email = document.getElementById('loginEmail')?.value;
    const password = document.getElementById('loginPassword')?.value;
    if (!email || !password) {
        return showError('Email dan password diperlukan.');
    }
    state.submitting = true;
    try {
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await checkAuth();
        toast('Login berhasil');
    } catch (err) {
        showError(err.message);
    } finally {
        state.submitting = false;
    }
}

async function handleRegister() {
    const username = document.getElementById('registerName')?.value;
    const email = document.getElementById('registerEmail')?.value;
    const password = document.getElementById('registerPassword')?.value;
    if (!username || !email || !password) {
        return showError('Lengkapi semua kolom pendaftaran.');
    }
    state.submitting = true;
    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: { data: { username, role: 'user' } }
        });
        if (error) throw error;
        await supabaseClient.from('users').insert([{ id: data.user.id, email, username, balance: 0, role: 'user' }]);
        toast('Akun dibuat. Silakan login.');
        navigate('login');
    } catch (err) {
        showError(err.message);
    } finally {
        state.submitting = false;
    }
}

async function handleStake() {
    const amount = Number(document.getElementById('stakeAmount')?.value);
    if (!amount || amount < 10) {
        return showError('Minimal staking adalah $10.');
    }
    if (amount > Number(state.profile?.balance || 0)) {
        return showError('Saldo tidak cukup.');
    }
    const start = new Date();
    const end = new Date();
    end.setDate(start.getDate() + STAKING_DAYS);
    try {
        const { error } = await supabaseClient.from('staking').insert([{ user_id: state.user.id, stake_amount: amount, start_time: start.toISOString(), end_time: end.toISOString(), status: 'active' }]);
        if (error) throw error;
        await supabaseClient.from('users').update({ balance: Number(state.profile.balance) - amount }).eq('id', state.user.id);
        await fetchUserData();
        render();
        toast('Staking dimulai!');
    } catch (err) {
        showError(err.message);
    }
}

async function handleUnstake(stakeId) {
    const stake = state.stakings.find(item => item.id === stakeId);
    if (!stake) return showError('Stake tidak ditemukan.');
    const reward = calculateReward(stake);
    if (!confirm(`Akhiri stake? Total return ${formatUSD(Number(stake.stake_amount) + reward)}`)) return;
    try {
        const { error } = await supabaseClient.from('staking').update({ status: 'completed', total_reward: reward }).eq('id', stakeId);
        if (error) throw error;
        await supabaseClient.from('users').update({ balance: Number(state.profile.balance) + Number(stake.stake_amount) + reward }).eq('id', state.user.id);
        await fetchUserData();
        render();
        toast('Stake berhasil selesai dan saldo diperbarui.');
    } catch (err) {
        showError(err.message);
    }
}

async function handleDeposit() {
    const amount = Number(document.getElementById('depositAmount')?.value);
    const txid = document.getElementById('depositTxid')?.value;
    if (!amount || !txid) {
        return showError('Masukkan jumlah dan TXID deposit.');
    }
    try {
        const { error } = await supabaseClient.from('deposits').insert([{ user_id: state.user.id, deposit_amount: amount, txid, status: 'pending' }]);
        if (error) throw error;
        await fetchUserData();
        render();
        toast('Deposit proof submitted.');
    } catch (err) {
        showError(err.message);
    }
}

async function handleWithdraw() {
    const amount = Number(document.getElementById('withdrawAmount')?.value);
    const wallet = document.getElementById('withdrawWallet')?.value;
    if (!amount || !wallet) {
        return showError('Lengkapi jumlah dan alamat wallet.');
    }
    if (amount < 10) {
        return showError('Minimal withdraw $10.');
    }
    if (amount > Number(state.profile?.balance || 0)) {
        return showError('Saldo tidak cukup.');
    }
    try {
        const { error } = await supabaseClient.from('withdraw').insert([{ user_id: state.user.id, amount, wallet, status: 'pending' }]);
        if (error) throw error;
        await supabaseClient.from('users').update({ balance: Number(state.profile.balance) - amount }).eq('id', state.user.id);
        await fetchUserData();
        render();
        toast('Withdrawal request submitted.');
    } catch (err) {
        showError(err.message);
    }
}

async function adminAction(table, id, status, amount = 0, userId = null) {
    try {
        const { error } = await supabaseClient.from(table).update({ status }).eq('id', id);
        if (error) throw error;
        if (status === 'approved' && table === 'deposits' && userId) {
            const { data } = await supabaseClient.from('users').select('balance').eq('id', userId).single();
            await supabaseClient.from('users').update({ balance: Number(data.balance || 0) + Number(amount) }).eq('id', userId);
        }
        await fetchUserData();
        render();
        toast('Action completed successfully.');
    } catch (err) {
        showError(err.message);
    }
}

function startClock() {
    const clock = document.getElementById('clock');
    const estimate = document.getElementById('stakeEstimate');
    const stakeInput = document.getElementById('stakeAmount');
    if (!clock) return;

    setInterval(() => {
        clock.innerText = new Date().toLocaleTimeString();
        if (estimate && stakeInput) {
            estimate.innerText = formatUSD((Number(stakeInput.value) || 0) * STAKING_ROI);
        }
    }, 1000);
}

function handleLogout() {
    supabaseClient.auth.signOut().then(() => {
        state.user = null;
        state.profile = null;
        state.view = 'login';
        render();
        toast('Logged out successfully.');
    });
}

function copyWallet() {
    const wallet = state.settings?.admin_wallet || '';
    if (!wallet) {
        return showError('Wallet address belum tersedia.');
    }
    navigator.clipboard.writeText(wallet).then(() => {
        toast('Wallet address copied.');
    }).catch(() => {
        showError('Copy failed.');
    });
}

window.onload = () => checkAuth();
