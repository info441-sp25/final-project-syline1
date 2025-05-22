// Authentication functions
// async function checkAuth() { ... }

async function signOut() {
  try {
    await fetch("/signout");
    window.location.href = "/";
  } catch (error) {
    console.error("Sign out failed:", error);
  }
}

// Post-related functions
async function createPost(content) {
  try {
    const response = await fetch("/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to create post");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating post:", error);
    throw error;
  }
}

async function fetchPosts() {
  try {
    const response = await fetch("/posts");
    if (!response.ok) {
      throw new Error("Failed to fetch posts");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching posts:", error);
    throw error;
  }
}

async function deletePost(postId) {
  try {
    const response = await fetch(`/posts/${postId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to delete post");
    }
  } catch (error) {
    console.error("Error deleting post:", error);
    throw error;
  }
}

// UI Functions
function renderPosts(posts) {
  const feedContainer = document.getElementById("feed");
  if (!feedContainer) return;

  feedContainer.innerHTML = ""; // Clear existing posts

  posts.forEach((post) => {
    const postElement = createPostElement(post);
    feedContainer.appendChild(postElement);
  });
}

function createPostElement(post) {
  const postElement = document.createElement("div");
  postElement.className = "post";
  postElement.innerHTML = `
        <div class="post-header">
            <span class="post-author">${post.author.username}</span>
            <span class="post-time">${new Date(
              post.createdAt
            ).toLocaleString()}</span>
        </div>
        <div class="post-content">${post.content}</div>
        <div class="post-actions">
            <button onclick="deletePost('${
              post._id
            }')" class="delete-btn">Delete</button>
        </div>
    `;
  return postElement;
}

// Event Handlers
async function handlePostSubmit(event) {
  event.preventDefault();
  const contentInput = document.getElementById("post-content");
  const content = contentInput.value.trim();

  if (!content) return;

  try {
    await createPost(content);
    contentInput.value = "";
    await loadPosts();
  } catch (error) {
    showError("Failed to create post: " + error.message);
  }
}

async function loadPosts() {
  try {
    const posts = await fetchPosts();
    renderPosts(posts);
  } catch (error) {
    showError("Failed to load posts: " + error.message);
  }
}

// Utility Functions
function showError(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);
  setTimeout(() => errorDiv.remove(), 5000);
}

// Initialize
async function initialize() {
  // Remove the auth check
  // if (!await checkAuth()) return;

  // Set up post form submission
  const postForm = document.getElementById("post-form");
  if (postForm) {
    postForm.addEventListener("submit", handlePostSubmit);
  }

  // Set up sign out button
  const signOutBtn = document.getElementById("signout-btn");
  if (signOutBtn) {
    signOutBtn.addEventListener("click", signOut);
  }

  // Load initial posts
  await loadPosts();
}

// Start the application when the DOM is loaded
document.addEventListener("DOMContentLoaded", initialize);

function signIn() {
  window.location.href = "/signin";
}

document.getElementById("signin-btn")?.addEventListener("click", () => {
  window.location.href = "/signin";
});
document.getElementById("signout-btn")?.addEventListener("click", () => {
  window.location.href = "/signout";
});

async function updateAuthUI() {
  try {
    const res = await fetch("/users/auth-status", { credentials: "include" });
    const data = await res.json();

    const signInBtn = document.getElementById("signin-btn");
    const signOutBtn = document.getElementById("signout-btn");

    if (data.isAuthenticated) {
      if (signInBtn) signInBtn.style.display = "none";
      if (signOutBtn) signOutBtn.style.display = "inline-block";
    } else {
      if (signInBtn) signInBtn.style.display = "inline-block";
      if (signOutBtn) signOutBtn.style.display = "none";
    }
  } catch (err) {
    console.error("Failed to check auth status:", err);
  }
}

// Call this on page load
document.addEventListener("DOMContentLoaded", updateAuthUI);
