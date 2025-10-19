// Main application script
let currentUser = null;

// Check if user is logged in on page load
document.addEventListener("DOMContentLoaded", async function () {
  if (typeof authService !== "undefined" && authService.isAuthenticated()) {
    currentUser = await authService.getCurrentUser();
  }

  updateUI();

  if (currentUser && document.getElementById("userImagesGrid")) {
    loadUserImages();
  }

  setupAuthModal();
});

// Update UI based on authentication status
function updateUI() {
  const navLinks = document.getElementById("navLinks");
  const heroButtons = document.getElementById("heroButtons");

  if (navLinks) {
    if (currentUser) {
      navLinks.innerHTML = `
        <a href="../index.html">Home</a>
        <a href="gallery.html">Gallery</a>
        <span>Welcome, ${currentUser.username}</span>
        <a href="dashboard.html">Dashboard</a>
        <a href="upload.html">Upload</a>
        <a href="#" id="logoutLink">Logout</a>
      `;
      const logoutLink = document.getElementById("logoutLink");
      if (logoutLink) logoutLink.addEventListener("click", logout);
    } else {
      navLinks.innerHTML = `
        <a href="../index.html">Home</a>
        <a href="gallery.html">Gallery</a>
        <a href="#" id="loginLink">Login</a>
        <a href="#" id="registerLink">Register</a>
      `;
      const loginLink = document.getElementById("loginLink");
      const registerLink = document.getElementById("registerLink");
      if (loginLink) loginLink.addEventListener("click", showLoginModal);
      if (registerLink)
        registerLink.addEventListener("click", showRegisterModal);
    }
  }

  if (heroButtons) {
    if (currentUser) {
      heroButtons.innerHTML = `
        <a href="upload.html" class="btn btn-primary">Upload Image</a>
        <a href="dashboard.html" class="btn btn-secondary">My Dashboard</a>
      `;
    } else {
      heroButtons.innerHTML = `
        <a href="#" id="getStartedLink" class="btn btn-primary">Get Started</a>
        <a href="gallery.html" class="btn btn-secondary">View Gallery</a>
      `;
      const getStartedLink = document.getElementById("getStartedLink");
      if (getStartedLink)
        getStartedLink.addEventListener("click", showRegisterModal);
    }
  }
}

// Setup authentication modal
function setupAuthModal() {
  const authModal = document.getElementById("authModal");
  if (!authModal) return;

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

  if (closeModal) {
    closeModal.addEventListener(
      "click",
      () => (authModal.style.display = "none")
    );
  }

  window.addEventListener("click", (event) => {
    if (event.target === authModal) authModal.style.display = "none";
  });

  if (authSwitchLink) {
    authSwitchLink.addEventListener("click", () => {
      isLoginMode = !isLoginMode;

      if (isLoginMode) {
        authTitle.textContent = "Login";
        authButton.textContent = "Login";
        authSwitchText.textContent = "Don't have an account? ";
        authSwitchLink.textContent = "Register";
        if (confirmPasswordContainer)
          confirmPasswordContainer.style.display = "none";
      } else {
        authTitle.textContent = "Register";
        authButton.textContent = "Register";
        authSwitchText.textContent = "Already have an account? ";
        authSwitchLink.textContent = "Login";
        if (confirmPasswordContainer)
          confirmPasswordContainer.style.display = "block";
      }

      if (authForm) authForm.reset();
    });
  }

  if (authForm) {
    authForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      const username = document.getElementById("username")?.value;
      const password = document.getElementById("password")?.value;

      if (!username || !password) return;

      if (isLoginMode) {
        const result = await authService.login({ username, password });
        if (result.success) {
          currentUser = result.user;
          authModal.style.display = "none";
          updateUI();
          if (document.getElementById("userImagesGrid")) loadUserImages();
          alert("Login successful!");
        } else {
          alert("Login failed: " + result.error);
        }
      } else {
        const confirmPassword =
          document.getElementById("confirmPassword")?.value;
        if (password !== confirmPassword) {
          alert("Passwords do not match!");
          return;
        }
        const result = await authService.register({ username, password });
        if (result.success) {
          currentUser = result.user;
          authModal.style.display = "none";
          updateUI();
          if (document.getElementById("userImagesGrid")) loadUserImages();
          alert("Registration successful!");
        } else {
          alert("Registration failed: " + result.error);
        }
      }
    });
  }
}

// Show login modal
function showLoginModal() {
  const authModal = document.getElementById("authModal");
  if (!authModal) return;
  document.getElementById("authTitle").textContent = "Login";
  document.getElementById("authButton").textContent = "Login";
  document.getElementById("authSwitchText").textContent =
    "Don't have an account? ";
  document.getElementById("authSwitchLink").textContent = "Register";
  document.getElementById("confirmPasswordContainer").style.display = "none";
  authModal.style.display = "flex";
}

// Show register modal
function showRegisterModal() {
  const authModal = document.getElementById("authModal");
  if (!authModal) return;
  document.getElementById("authTitle").textContent = "Register";
  document.getElementById("authButton").textContent = "Register";
  document.getElementById("authSwitchText").textContent =
    "Already have an account? ";
  document.getElementById("authSwitchLink").textContent = "Login";
  document.getElementById("confirmPasswordContainer").style.display = "block";
  authModal.style.display = "flex";
}

// Logout function
function logout() {
  authService.logout();
  currentUser = null;
  updateUI();
  alert("You have been logged out.");
}

// Load user images for dashboard
async function loadUserImages() {
  const grid = document.getElementById("userImagesGrid");
  if (!grid || !currentUser) return;

  const result = await imageService.getUserImages();
  if (result.success) {
    grid.innerHTML = result.images
      .map(
        (img) => `
      <div class="image-card">
        <img src="${img.url}" alt="${img.title || "User Image"}">
        <div class="image-info">
          <h3>${img.title || "Untitled"}</h3>
          <p>${img.description || ""}</p>
        </div>
      </div>
    `
      )
      .join("");
  } else {
    grid.innerHTML = `<p style="color:red;">Failed to load images: ${result.error}</p>`;
  }
}
