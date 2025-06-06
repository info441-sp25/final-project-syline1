// Authentication functions
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

// Comment-related functions
async function addComment(postId, content) {
  try {
    const response = await fetch(`/posts/${postId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to add comment");
    }

    return await response.json();
  } catch (error) {
    console.error("Error adding comment:", error);
    throw error;
  }
}

async function upvotePost(postId) {
  try {
    const response = await fetch(`/posts/${postId}/upvote`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to upvote post");
    }

    return await response.json();
  } catch (error) {
    console.error("Error upvoting post:", error);
    throw error;
  }
}

async function downvotePost(postId) {
  try {
    const response = await fetch(`/posts/${postId}/downvote`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to downvote post");
    }

    return await response.json();
  } catch (error) {
    console.error("Error downvoting post:", error);
    throw error;
  }
}

// UI Functions
function renderPosts(posts) {
  const feedContainer = document.getElementById("feed");
  if (!feedContainer) return;
  posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  feedContainer.innerHTML = "";
  posts.forEach((post) => {
    const postElement = createPostElement(post);
    feedContainer.appendChild(postElement);
  });
}

function createPostElement(post) {
  const postElement = document.createElement("div");
  postElement.className = "post";
  postElement.dataset.postId = post._id;
  postElement.dataset.createdAt = post.createdAt;

  const contentWithHighlightedHashtags = post.content.replace(
    /#[\w]+/g,
    match => `<span class="hashtag">${match}</span>`
  );

  postElement.innerHTML = `
    <div class="post-header">
      <span class="post-author">${post.author.username}</span>
      <span class="post-time">${new Date(post.createdAt).toLocaleString()}</span>
    </div>
    <div class="post-content">${contentWithHighlightedHashtags}</div>
    <div class="post-actions">
      <div class="voting-section">
        <button class="upvote-btn" onclick="handleUpvote('${post._id}')">
          👍 <span class="upvote-count">${post.upvotes || 0}</span>
        </button>
        <button class="downvote-btn" onclick="handleDownvote('${post._id}')">
          👎 <span class="downvote-count">${post.downvotes || 0}</span>
        </button>
      </div>
      <button onclick="deletePost('${post._id}')" class="delete-btn">Delete</button>
    </div>
    <div class="comments-section">
      <div class="comments-list">
        ${post.comments.map(comment => `
          <div class="comment">
            <div class="comment-header">
              <span class="comment-author">${comment.author.username}</span>
              <span class="comment-time">${new Date(comment.timestamp).toLocaleString()}</span>
            </div>
            <div class="comment-content">${comment.content}</div>
          </div>
        `).join('')}
      </div>
      <div class="comment-form">
        <textarea class="comment-input" placeholder="Write a comment..."></textarea>
        <button onclick="handleAddComment('${post._id}', this.parentElement.querySelector('.comment-input'))">Comment</button>
      </div>
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

function showError(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);
  setTimeout(() => errorDiv.remove(), 5000);
}

// Enhanced Authentication UI with proper profile picture handling
async function updateAuthUI() {
  try {
    const res = await fetch("/users/auth-status", { credentials: "include" });
    const data = await res.json();

    const signInBtn = document.getElementById("signin-btn");
    const signOutBtn = document.getElementById("signout-btn");
    const accountBtn = document.getElementById("account-btn");

    if (data.isAuthenticated) {
      // Hide sign in, show sign out
      if (signInBtn) signInBtn.style.display = "none";
      if (signOutBtn) signOutBtn.style.display = "inline-block";
      
      // Show and update account button with profile picture
      if (accountBtn) {
        accountBtn.style.display = "inline-block";
        updateProfilePicture(accountBtn, data.profilePicture);
      }
    } else {
      // Show sign in, hide sign out and account button
      if (signInBtn) signInBtn.style.display = "inline-block";
      if (signOutBtn) signOutBtn.style.display = "none";
      if (accountBtn) accountBtn.style.display = "none";
    }
  } catch (err) {
    console.error("Failed to check auth status:", err);
  }
}

// Helper function to update profile picture display
function updateProfilePicture(container, profilePicturePath) {
  if (!container) return;
  
  container.innerHTML = '';
  
  const profileCircle = document.createElement("div");
  profileCircle.className = "profile-circle";
  
  const img = document.createElement("img");
  img.className = "profile-pic";
  img.alt = "Profile Picture";
  
  // Handle profile picture source
  if (profilePicturePath && profilePicturePath.trim() !== '') {
    // Add cache busting to ensure fresh image load
    img.src = `${profilePicturePath}?t=${Date.now()}`;
    img.onerror = function() {
      // Fallback to default if image fails to load
      console.warn('Profile picture failed to load, using default');
      this.src = "/project-user-icon.png";
      profileCircle.classList.add("default");
    };
  } else {
    // Use default image
    img.src = "/project-user-icon.png";
    profileCircle.classList.add("default");
  }
  
  profileCircle.appendChild(img);
  container.appendChild(profileCircle);
}

// Account Icon loading with enhanced error handling
async function loadAccountIcon() {
  try {
    const res = await fetch("/users/auth-status", { credentials: "include" });
    const data = await res.json();

    const accountBtn = document.getElementById("account-btn");
    if (!accountBtn) return;

    if (data.isAuthenticated) {
      accountBtn.style.display = "inline-block";
      updateProfilePicture(accountBtn, data.profilePicture);
    } else {
      accountBtn.style.display = "none";
    }
  } catch (err) {
    console.error("Error loading account icon:", err);
    const accountBtn = document.getElementById("account-btn");
    if (accountBtn) {
      accountBtn.style.display = "none";
    }
  }
}

// Trending hashtags functions
async function fetchTrendingHashtags() {
  try {
    const response = await fetch("/posts/trending");
    if (!response.ok) {
      throw new Error("Failed to fetch trending hashtags");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching trending hashtags:", error);
    return [];
  }
}

function renderTrendingHashtags(hashtags) {
  const trendingContainer = document.getElementById("trending-hashtags");
  if (!trendingContainer) return;

  if (hashtags.length === 0) {
    trendingContainer.innerHTML = `
      <h3>Trending Hashtags</h3>
      <div class="hashtag-list">
        <span>No trending hashtags yet</span>
      </div>
    `;
    return;
  }

  trendingContainer.innerHTML = `
    <h3>Trending Hashtags</h3>
    <div class="hashtag-list">
      ${hashtags.map(tag => `
        <span class="hashtag">
          #${tag.tag} (${tag.count})
        </span>
      `).join('')}
    </div>
  `;
}

async function loadTrendingHashtags() {
  try {
    const hashtags = await fetchTrendingHashtags();
    renderTrendingHashtags(hashtags);
  } catch (error) {
    console.error("Failed to load trending hashtags:", error);
    renderTrendingHashtags([]); // Show empty state
  }
}

// Periodic refresh
function startPeriodicRefresh() {
  setInterval(async () => {
    await Promise.all([
      loadPosts(),
      loadTrendingHashtags(),
      updateAuthUI() // Also refresh auth UI to catch profile picture updates
    ]);
  }, 60000);
}

// Global handlers for voting and comments
window.handleUpvote = async function(postId) {
  try {
    await upvotePost(postId);
    await loadPosts(); // Refresh posts to show updated vote counts
  } catch (error) {
    showError("Failed to upvote: " + error.message);
  }
};

window.handleDownvote = async function(postId) {
  try {
    await downvotePost(postId);
    await loadPosts(); // Refresh posts to show updated vote counts
  } catch (error) {
    showError("Failed to downvote: " + error.message);
  }
};

window.handleAddComment = async function(postId, inputElement) {
  try {
    const content = inputElement.value.trim();
    if (!content) return;
    
    await addComment(postId, content);
    inputElement.value = '';
    await loadPosts(); // Refresh posts to show new comment
  } catch (error) {
    showError("Failed to add comment: " + error.message);
  }
};

// Enhanced initialization
async function initialize() {
  const postForm = document.getElementById("post-form");
  if (postForm) {
    postForm.addEventListener("submit", handlePostSubmit);
  }

  const signOutBtn = document.getElementById("signout-btn");
  if (signOutBtn) {
    signOutBtn.addEventListener("click", signOut);
  }

  // Initialize all components
  await Promise.all([
    loadPosts(),
    loadTrendingHashtags(),
    updateAuthUI(),
    loadAccountIcon(),
  ]);

  startPeriodicRefresh();
}

// Event listeners
document.addEventListener("DOMContentLoaded", initialize);

document.getElementById("signin-btn")?.addEventListener("click", () => {
  window.location.href = "/signin";
});

document.getElementById("signout-btn")?.addEventListener("click", () => {
  window.location.href = "/signout";
});