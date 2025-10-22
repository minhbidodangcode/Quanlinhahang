
// ==================== JAVASCRIPT CODE ====================
// ... phần code còn lại
const validAccounts = [
    { username: 'admin', password: 'admin123', fullName: 'Admin', email: 'admin@btl.com' },
    { username: 'user1', password: 'pass123', fullName: 'User One', email: 'user1@btl.com' },
    { username: 'demo', password: 'demo123', fullName: 'Demo User', email: 'demo@btl.com' }
];

// Navbar scroll effect
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// ============ LOGIN MODAL ============
const loginBtn = document.getElementById('loginBtn');
const loginModal = document.getElementById('loginModal');
const closeModal = document.getElementById('closeModal');
const errorMessage = document.getElementById('errorMessage');

loginBtn.addEventListener('click', () => {
    loginModal.classList.add('active');
    errorMessage.classList.remove('show');
});

closeModal.addEventListener('click', () => {
    loginModal.classList.remove('active');
    errorMessage.classList.remove('show');
});

loginModal.addEventListener('click', (e) => {
    if (e.target === loginModal) {
        loginModal.classList.remove('active');
        errorMessage.classList.remove('show');
    }
});

// Toggle password visibility - Login
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

togglePassword.addEventListener('click', () => {
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        togglePassword.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        togglePassword.textContent = '👁️';
    }
});

// ============ REGISTER MODAL ============
const registerModal = document.getElementById('registerModal');
const closeRegisterModal = document.getElementById('closeRegisterModal');
const registerLink = document.getElementById('registerLink');
const backToLogin = document.getElementById('backToLogin');
const registerForm = document.getElementById('registerForm');
const registerError = document.getElementById('registerError');
const registerSuccess = document.getElementById('registerSuccess');

// Mở modal đăng ký
registerLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginModal.classList.remove('active');
    registerModal.classList.add('active');
    registerError.classList.remove('show');
    registerSuccess.classList.remove('show');
});

// Đóng modal đăng ký
closeRegisterModal.addEventListener('click', () => {
    registerModal.classList.remove('active');
    registerForm.reset();
    registerError.classList.remove('show');
    registerSuccess.classList.remove('show');
});

// Click outside to close
registerModal.addEventListener('click', (e) => {
    if (e.target === registerModal) {
        registerModal.classList.remove('active');
        registerForm.reset();
        registerError.classList.remove('show');
        registerSuccess.classList.remove('show');
    }
});

// Quay lại đăng nhập
backToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    registerModal.classList.remove('active');
    loginModal.classList.add('active');
    registerForm.reset();
    registerError.classList.remove('show');
    registerSuccess.classList.remove('show');
});

// Toggle password visibility - Register
const toggleRegPassword = document.getElementById('toggleRegPassword');
const regPasswordInput = document.getElementById('regPassword');

toggleRegPassword.addEventListener('click', () => {
    if (regPasswordInput.type === 'password') {
        regPasswordInput.type = 'text';
        toggleRegPassword.textContent = '🙈';
    } else {
        regPasswordInput.type = 'password';
        toggleRegPassword.textContent = '👁️';
    }
});

const toggleRegConfirmPassword = document.getElementById('toggleRegConfirmPassword');
const regConfirmPasswordInput = document.getElementById('regConfirmPassword');

toggleRegConfirmPassword.addEventListener('click', () => {
    if (regConfirmPasswordInput.type === 'password') {
        regConfirmPasswordInput.type = 'text';
        toggleRegConfirmPassword.textContent = '🙈';
    } else {
        regConfirmPasswordInput.type = 'password';
        toggleRegConfirmPassword.textContent = '👁️';
    }
});

// Xử lý đăng ký
registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const fullName = document.getElementById('regFullName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;

    // Validate
    if (username.length < 4) {
        showRegisterError('Tên đăng nhập phải có ít nhất 4 ký tự!');
        return;
    }

    if (password.length < 6) {
        showRegisterError('Mật khẩu phải có ít nhất 6 ký tự!');
        return;
    }

    if (password !== confirmPassword) {
        showRegisterError('Mật khẩu xác nhận không khớp!');
        return;
    }

    // Kiểm tra username đã tồn tại
    const existingUser = validAccounts.find(acc => acc.username === username);
    if (existingUser) {
        showRegisterError('Tên đăng nhập đã tồn tại! Vui lòng chọn tên khác.');
        return;
    }

    // Kiểm tra email đã tồn tại
    const existingEmail = validAccounts.find(acc => acc.email === email);
    if (existingEmail) {
        showRegisterError('Email đã được sử dụng! Vui lòng dùng email khác.');
        return;
    }

    // Thêm tài khoản mới
    validAccounts.push({
        username: username,
        password: password,
        fullName: fullName,
        email: email
    });

    // Hiển thị thông báo thành công
    showRegisterSuccess(`Đăng ký thành công! Chào mừng ${fullName} 🎉`);
    
    // Reset form và chuyển về đăng nhập sau 2 giây
    setTimeout(() => {
        registerForm.reset();
        registerModal.classList.remove('active');
        loginModal.classList.add('active');
        registerSuccess.classList.remove('show');
        
        // Tự động điền username vào form đăng nhập
        document.getElementById('username').value = username;
    }, 2000);

    console.log('Tài khoản mới đã được tạo:', { username, email, fullName });
});

function showRegisterError(message) {
    registerError.textContent = message;
    registerError.classList.add('show');
    registerSuccess.classList.remove('show');
}

function showRegisterSuccess(message) {
    registerSuccess.textContent = message;
    registerSuccess.classList.add('show');
    registerError.classList.remove('show');
}

// ============ LOGIN FORM ============
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const rememberMe = document.getElementById('rememberMe');
const logoutBtn = document.getElementById('logoutBtn');
const userGreeting = document.getElementById('userGreeting');

// Load saved credentials
window.addEventListener('load', () => {
    const savedUsername = localStorage.getItem('rememberedUsername');
    if (savedUsername) {
        usernameInput.value = savedUsername;
        rememberMe.checked = true;
    }
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    const account = validAccounts.find(acc => 
        acc.username === username && acc.password === password
    );

    if (account) {
        if (rememberMe.checked) {
            localStorage.setItem('rememberedUsername', username);
        } else {
            localStorage.removeItem('rememberedUsername');
        }

        alert(`Đăng nhập thành công! Chào mừng ${account.fullName || username}! 🎉`);
        loginModal.classList.remove('active');
        loginForm.reset();
        errorMessage.classList.remove('show');

        // Hiển thị tên người dùng và nút đăng xuất
        userGreeting.textContent = `Xin chào ${account.fullName || username} 👋`;
        userGreeting.style.display = 'inline-block';
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
    } else {
        showError('Tài khoản hoặc mật khẩu không chính xác. Vui lòng thử lại hoặc đăng ký tài khoản mới.');
    }
});

// Đăng xuất
logoutBtn.addEventListener('click', () => {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
        alert('Đăng xuất thành công! Hẹn gặp lại! 👋');
        userGreeting.textContent = '';
        userGreeting.style.display = 'none';
        logoutBtn.style.display = 'none';
        loginBtn.style.display = 'inline-block';
    }
});

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
}

// Forgot password
const forgotPassword = document.getElementById('forgotPassword');
forgotPassword.addEventListener('click', (e) => {
    e.preventDefault();
    alert('Chức năng khôi phục mật khẩu sẽ được gửi đến email đã đăng ký của bạn.');
});
// Console log accounts
console.log('Tài khoản demo để test:');
validAccounts.forEach(acc => {
    console.log(`Username: ${acc.username} | Password: ${acc.password} | Email: ${acc.email}`);
});