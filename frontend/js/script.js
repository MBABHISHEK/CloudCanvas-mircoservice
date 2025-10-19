// Main application script
let currentUser = null;

// Check if user is logged in on page load
document.addEventListener("DOMContentLoaded", async function () {
  // Check for existing authentication
  if (authService.isAuthenticated()) {
    currentUser = await authService.getCurrentUser();
  }

  updateUI();
  setupAuthModal();
});

// Update UI based on authentication status
function updateUI() {
  const navLinks = document.getElementById("navLinks");
  const heroButtons = document.getElementById("heroButtons");

  if (currentUser) {
    navLinks.innerHTML = `
            <a href="/">Home</a>
            <a href="pages/gallery.html">Gallery</a>
            <span>Welcome, ${currentUser.username}</span>
            <a href="pages/dashboard.html">Dashboard</a>
            <a href="pages/upload.html">Upload</a>
            <a href="#" id="logoutLink">Logout</a>
        `;

    heroButtons.innerHTML = `
            <a href="pages/upload.html" class="btn btn-primary">Upload Image</a>
            <a href="pages/dashboard.html" class="btn btn-secondary">My Dashboard</a>
        `;

    document.getElementById("logoutLink").addEventListener("click", logout);
  } else {
    navLinks.innerHTML = `
            <a href="/">Home</a>
            <a href="pages/gallery.html">Gallery</a>
            <a href="#" id="loginLink">Login</a>
            <a href="#" id="registerLink">Register</a>
        `;

    heroButtons.innerHTML = `
            <a href="#" id="getStartedLink" class="btn btn-primary">Get Started</a>
            <a href="pages/gallery.html" class="btn btn-secondary">View Gallery</a>
        `;

    document
      .getElementById("loginLink")
      .addEventListener("click", showLoginModal);
    document
      .getElementById("registerLink")
      .addEventListener("click", showRegisterModal);
    document
      .getElementById("getStartedLink")
      .addEventListener("click", showRegisterModal);
  }
}

// Setup authentication modal
function setupAuthModal() {
  const authModal = document.getElementById("authModal");
  const closeModal = document.getElementById("closeModal");
  const authForm = document.getElementById("authForm");
  const authSwitchLink = document.getElementById("authSwitchLink");
  const authTitle = document.getElementById("authTitle");
  const authButton = document.getElementById("authButton");
  const authSwitchText = document.getElementById("authSwitchText");
  const confirmPasswordContainer = document.getElementById(
    "confirmPasswordContainer"
  );

  let isLoginMode = true;

  // Close modal when clicking X
  closeModal.addEventListener("click", function () {
    authModal.style.display = "none";
  });

  // Close modal when clicking outside
  window.addEventListener("click", function (event) {
    if (event.target === authModal) {
      authModal.style.display = "none";
    }
  });

  // Switch between login and register
  authSwitchLink.addEventListener("click", function () {
    isLoginMode = !isLoginMode;

    if (isLoginMode) {
      authTitle.textContent = "Login";
      authButton.textContent = "Login";
      authSwitchText.textContent = "Don't have an account? ";
      authSwitchLink.textContent = "Register";
      confirmPasswordContainer.style.display = "none";
    } else {
      authTitle.textContent = "Register";
      authButton.textContent = "Register";
      authSwitchText.textContent = "Already have an account? ";
      authSwitchLink.textContent = "Login";
      confirmPasswordContainer.style.display = "block";
    }

    // Clear form
    authForm.reset();
  });

  // Handle form submission
  authForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (isLoginMode) {
      // Login logic
      const result = await authService.login({ username, password });
      if (result.success) {
        currentUser = result.user;
        document.getElementById("authModal").style.display = "none";
        updateUI();
        alert("Login successful!");
      } else {
        alert("Login failed: " + result.error);
      }
    } else {
      // Register logic
      const confirmPassword = document.getElementById("confirmPassword").value;

      if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
      }

      const result = await authService.register({ username, password });
      if (result.success) {
        currentUser = result.user;
        document.getElementById("authModal").style.display = "none";
        updateUI();
        alert("Registration successful!");
      } else {
        alert("Registration failed: " + result.error);
      }
    }
  });
}

// Show login modal
function showLoginModal() {
  const authModal = document.getElementById("authModal");
  const authTitle = document.getElementById("authTitle");
  const authButton = document.getElementById("authButton");
  const authSwitchText = document.getElementById("authSwitchText");
  const authSwitchLink = document.getElementById("authSwitchLink");
  const confirmPasswordContainer = document.getElementById(
    "confirmPasswordContainer"
  );

  // Set to login mode
  authTitle.textContent = "Login";
  authButton.textContent = "Login";
  authSwitchText.textContent = "Don't have an account? ";
  authSwitchLink.textContent = "Register";
  confirmPasswordContainer.style.display = "none";

  // Show modal
  authModal.style.display = "flex";
}

// Show register modal
function showRegisterModal() {
  const authModal = document.getElementById("authModal");
  const authTitle = document.getElementById("authTitle");
  const authButton = document.getElementById("authButton");
  const authSwitchText = document.getElementById("authSwitchText");
  const authSwitchLink = document.getElementById("authSwitchLink");
  const confirmPasswordContainer = document.getElementById(
    "confirmPasswordContainer"
  );

  // Set to register mode
  authTitle.textContent = "Register";
  authButton.textContent = "Register";
  authSwitchText.textContent = "Already have an account? ";
  authSwitchLink.textContent = "Login";
  confirmPasswordContainer.style.display = "block";

  // Show modal
  authModal.style.display = "flex";
}

// Logout function
function logout() {
  authService.logout();
  currentUser = null;
  updateUI();
  alert("You have been logged out.");
}
