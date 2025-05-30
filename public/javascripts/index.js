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
  postElement.dataset.createdAt = post.createdAt;
  
  // Highlight hashtags in content
  const contentWithHighlightedHashtags = post.content.replace(
    /#[\w]+/g,
    match => `<a href="#" class="hashtag" data-tag="${match.slice(1)}">${match}</a>`
  );
  
  postElement.innerHTML = `
        <div class="post-header">
            <span class="post-author">${post.author.username}</span>
            <span class="post-time">${new Date(
              post.createdAt
            ).toLocaleString()}</span>
        </div>
        <div class="post-content">${contentWithHighlightedHashtags}</div>
        <div class="post-actions">
            <button onclick="deletePost('${
              post._id
            }')" class="delete-btn">Delete</button>
        </div>
    `;

  // Add click handlers for hashtags in the post
  postElement.querySelectorAll('.hashtag').forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      const tag = e.target.dataset.tag;
      await loadPostsByHashtag(tag);
    });
  });

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

  // Load initial posts and trending hashtags
  await Promise.all([
    loadPosts(),
    loadTrendingHashtags()
  ]);
  
  // Start periodic refresh
  startPeriodicRefresh();
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

// Add function to fetch trending hashtags
async function fetchTrendingHashtags() {
  try {
    const response = await fetch("/posts/trending");
    if (!response.ok) {
      throw new Error("Failed to fetch trending hashtags");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching trending hashtags:", error);
    throw error;
  }
}

// Add function to render trending hashtags
function renderTrendingHashtags(hashtags) {
  const trendingContainer = document.getElementById("trending-hashtags");
  if (!trendingContainer) return;

  trendingContainer.innerHTML = `
    <h3>Trending Hashtags</h3>
    <div class="hashtag-list">
      ${hashtags.map(tag => `
        <a href="#" class="hashtag" data-tag="${tag.tag}">
          #${tag.tag} (${tag.count})
        </a>
      `).join('')}
    </div>
  `;

  // Add click handlers for hashtags
  trendingContainer.querySelectorAll('.hashtag').forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      const tag = e.target.dataset.tag;
      await loadPostsByHashtag(tag);
    });
  });
}

// Add function to load posts by hashtag
async function loadPostsByHashtag(tag) {
  try {
    const response = await fetch(`/posts/hashtag/${tag}`);
    if (!response.ok) {
      throw new Error("Failed to fetch posts by hashtag");
    }
    const posts = await response.json();
    renderPosts(posts);
  } catch (error) {
    showError("Failed to load posts by hashtag: " + error.message);
  }
}

// Modify initialize function to load trending hashtags
async function initialize() {
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

  // Load initial posts and trending hashtags
  await Promise.all([
    loadPosts(),
    loadTrendingHashtags()
  ]);
  
  // Start periodic refresh
  startPeriodicRefresh();
}

// Add function to load trending hashtags
async function loadTrendingHashtags() {
  try {
    const hashtags = await fetchTrendingHashtags();
    renderTrendingHashtags(hashtags);
  } catch (error) {
    showError("Failed to load trending hashtags: " + error.message);
  }
}

// Modify startPeriodicRefresh to also refresh trending hashtags
function startPeriodicRefresh() {
  // Refresh posts and trending hashtags every minute
  setInterval(async () => {
    await Promise.all([
      loadPosts(),
      loadTrendingHashtags()
    ]);
  }, 60000);
}
