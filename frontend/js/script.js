// Main application script
let currentUser = null;

// Wait for DOM to load
document.addEventListener("DOMContentLoaded", async () => {
  // Check if user is authenticated
  if (typeof authService !== "undefined" && authService.isAuthenticated()) {
    currentUser = await authService.getCurrentUser();
  }

  updateUI();
  setupAuthModal();

  // Load dashboard images if logged in
  if (currentUser) {
    loadDashboardImages();
  }
});

// ---------------------
// Update navigation & hero UI
// ---------------------
function updateUI() {
  const navLinks = document.getElementById("navLinks");
  const heroButtons = document.getElementById("heroButtons");

  if (navLinks) {
    if (currentUser) {
      navLinks.innerHTML = `
        <a href="../index.html">Home</a>
        <a href="/pages/gallery.html">Gallery</a>
        <span>Welcome, ${currentUser.username}</span>
        <a href="/pages/dashboard.html">Dashboard</a>
        <a href="/pages/upload.html">Upload</a>
        <a href="#" id="logoutLink">Logout</a>
      `;
      const logoutLink = document.getElementById("logoutLink");
      if (logoutLink) logoutLink.addEventListener("click", logout);
    } else {
      navLinks.innerHTML = `
        <a href="../index.html">Home</a>
        <a href="/pages/gallery.html">Gallery</a>
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

// ---------------------
// Auth modal setup
// ---------------------
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
    authForm.addEventListener("submit", async (event) => {
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
        } else alert("Login failed: " + result.error);
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
        } else alert("Registration failed: " + result.error);
      }
    });
  }
}

// ---------------------
// Show modals
// ---------------------
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

// ---------------------
// Logout
// ---------------------
function logout() {
  authService.logout();
  currentUser = null;
  updateUI();
  alert("You have been logged out.");
}

// ---------------------
// Load user images and stats
// ---------------------
// Render dashboard images with stats
async function loadDashboardImages() {
  if (!currentUser) return;

  const grid = document.getElementById("userImagesGrid");
  const totalImagesSpan = document.getElementById("totalImages");
  const publicImagesSpan = document.getElementById("publicImages");
  const privateImagesSpan = document.getElementById("privateImages");
  const storageUsedSpan = document.getElementById("storageUsed");

  const result = await imageService.getUserImagesWithStats();
  console.log(result);
  if (result.success) {
    totalImagesSpan.textContent = result.stats.total;
    publicImagesSpan.textContent = result.stats.public;
    privateImagesSpan.textContent = result.stats.private;
    storageUsedSpan.textContent = (
      result.stats.storageUsed /
      (1024 * 1024)
    ).toFixed(2); // MB

    grid.innerHTML = "";
    result.images.forEach((img) => {
      const div = document.createElement("div");
      div.classList.add("gallery-item");
      div.innerHTML = `
      <div class="image-container">
        <img class="gallery-image" src="${img.url}" alt="${
        img.original_name
      }" />
       <div class="image-overlay">
          <a href="${
            img.url
          }" download class="btn btn-secondary">To View Full Image</a>
            <button class="btn btn-danger btn-delete" data-id="${
              img.id
            }">Delete</button>
          </div>
        </div>
        <div class="image-info">
        <p class="image-name">${img.original_name}</p>
         <p class="image-visibility ${img.is_public ? "public" : "private"}">
            ${img.is_public ? "Public" : "Private"}
      `;
      grid.appendChild(div);
    });
    document.querySelectorAll(".btn-delete").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const imageId = e.target.dataset.id;
        if (confirm("Are you sure you want to delete this image?")) {
          const delResult = await imageService.deleteImage(imageId);
          if (delResult.success) {
            alert("Image deleted successfully");
            loadDashboardImages(); // Refresh dashboard after deletion
          } else {
            alert("Failed to delete image: " + delResult.error);
          }
        }
      });
    });
  } else {
    grid.innerHTML = `<p style="color:red;">Failed to load images: ${result.error}</p>`;
  }
}

// Render gallery images (all users, public + private)
async function loadGalleryImages() {
  const grid = document.getElementById("galleryGrid");
  if (!grid) return;

  const result = await imageService.getAllImages();
  if (result.success) {
    grid.innerHTML = "";
    result.images.forEach((img) => {
      const div = document.createElement("div");
      div.classList.add("gallery-item");
      div.innerHTML = `
      <div class="image-container">
      <img class="gallery-image" src="${img.url}" alt="${img.original_name}" />
      <div class="image-overlay">
      <a href="${
        img.url
      }" download class="btn btn-secondary">To View Full Image</a>
        </div>
        <p class="image-name">${img.original_name}</p>
         <p class="image-visibility ${img.is_public ? "Private" : "Public"}">
            ${img.is_public ? "Private" : "Public"}
      `;
      grid.appendChild(div);
    });
  } else {
    grid.innerHTML = `<p style="color:red;">Failed to load images: ${result.error}</p>`;
  }
}

// On DOM load
document.addEventListener("DOMContentLoaded", async () => {
  if (currentUser && document.getElementById("userImagesGrid")) {
    await loadDashboardImages();
  }
  if (document.getElementById("galleryGrid")) {
    await loadGalleryImages();
  }
});
