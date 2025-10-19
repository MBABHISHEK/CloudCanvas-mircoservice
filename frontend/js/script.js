// User authentication simulation
let currentUser = null;

// Check if user is logged in on page load
document.addEventListener("DOMContentLoaded", function () {
  // Check if user data exists in localStorage
  const userData = localStorage.getItem("cloudCanvasUser");
  if (userData) {
    currentUser = JSON.parse(userData);
  }

  updateUI();

  // Set up authentication modal
  setupAuthModal();
});

// Update UI based on authentication status
function updateUI() {
  const navLinks = document.getElementById("navLinks");
  const heroButtons = document.getElementById("heroButtons");

  if (currentUser) {
    // User is logged in
    navLinks.innerHTML = `
            <a href="/">Home</a>
            <a href="/pages/gallery.html">Gallery</a>
            <span>Welcome, ${currentUser.username}</span>
            <a href="/pages/dashboard.html">Dashboard</a>
            <a href="/pages/upload.html">Upload</a>
            <a href="#" id="logoutLink">Logout</a>
        `;

    heroButtons.innerHTML = `
            <a href="/pages/upload.html" class="btn btn-primary">Upload Image</a>
            <a href="/pages/dashboard.html" class="btn btn-secondary">My Dashboard</a>
        `;

    // Add logout event listener
    document.getElementById("logoutLink").addEventListener("click", logout);
  } else {
    // User is not logged in
    navLinks.innerHTML = `
            <a href="/">Home</a>
            <a href="/pages/gallery.html">Gallery</a>
            <a href="#" id="loginLink">Login</a>
            <a href="#" id="registerLink">Register</a>
        `;

    heroButtons.innerHTML = `
            <a href="#" id="getStartedLink" class="btn btn-primary">Get Started</a>
            <a href="/pages/gallery.html" class="btn btn-secondary">View Gallery</a>
        `;

    // Add authentication event listeners
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

// ... rest of the functions remain the same as in the previous version ...

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
  authForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (isLoginMode) {
      // Login logic
      login(username, password);
    } else {
      // Register logic
      const confirmPassword = document.getElementById("confirmPassword").value;

      if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
      }

      register(username, password);
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

// Login function
function login(username, password) {
  // In a real application, this would be an API call to the server
  // For demo purposes, we'll check against localStorage

  // Get users from localStorage
  const users = JSON.parse(localStorage.getItem("cloudCanvasUsers") || "[]");

  // Find user with matching credentials
  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (user) {
    // Login successful
    currentUser = { id: user.id, username: user.username };
    localStorage.setItem("cloudCanvasUser", JSON.stringify(currentUser));

    // Close modal and update UI
    document.getElementById("authModal").style.display = "none";
    updateUI();

    alert("Login successful!");
  } else {
    alert("Invalid username or password!");
  }
}

// Register function
function register(username, password) {
  // In a real application, this would be an API call to the server
  // For demo purposes, we'll store in localStorage

  // Get users from localStorage
  const users = JSON.parse(localStorage.getItem("cloudCanvasUsers") || "[]");

  // Check if username already exists
  if (users.find((u) => u.username === username)) {
    alert("Username already exists!");
    return;
  }

  // Create new user
  const newUser = {
    id: Date.now().toString(),
    username: username,
    password: password,
  };

  // Add to users array
  users.push(newUser);
  localStorage.setItem("cloudCanvasUsers", JSON.stringify(users));

  // Auto login after registration
  currentUser = { id: newUser.id, username: newUser.username };
  localStorage.setItem("cloudCanvasUser", JSON.stringify(currentUser));

  // Close modal and update UI
  document.getElementById("authModal").style.display = "none";
  updateUI();

  alert("Registration successful!");
}

// Logout function
function logout() {
  currentUser = null;
  localStorage.removeItem("cloudCanvasUser");
  updateUI();
  alert("You have been logged out.");
}
