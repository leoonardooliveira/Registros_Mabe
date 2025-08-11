// =============================================================
// === PASSO 1: SUBSTITUA AS CREDENCIAIS DO SEU PROJETO AQUI ===
// =============================================================
const SUPABASE_URL = 'https://wihlkmmtevkuyvssbtwg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpaGxrbW10ZXZrdXl2c3NidHdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MjExMjgsImV4cCI6MjA3MDQ5NzEyOH0.SKD94txUo2e10gyAODn3QmHJH1QyI-t4HDqR3ZyhnHQ';

// CORREÇÃO: Acessar a função `createClient` através do objeto global `window.supabase`
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const btnLogin = document.getElementById('btn-login');

async function checkLoginStatus() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        window.location.href = 'index.html';
    }
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    btnLogin.disabled = true;
    btnLogin.textContent = 'Verificando...';

    const email = emailInput.value;
    const password = passwordInput.value;

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        Swal.fire('Erro!', 'E-mail ou senha incorretos.', 'error');
        console.error(error);
    } else {
        Swal.fire('Sucesso!', 'Login realizado com sucesso.', 'success');
        window.location.href = 'index.html';
    }

    btnLogin.disabled = false;
    btnLogin.textContent = 'Entrar';
});

document.addEventListener('DOMContentLoaded', checkLoginStatus);