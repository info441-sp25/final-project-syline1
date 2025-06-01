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

  feedContainer.innerHTML = ""; // Clear existing posts

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
    match => `<a href="#" class="hashtag" data-tag="${match.slice(1)}">${match}</a>`
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

function showError(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);
  setTimeout(() => errorDiv.remove(), 5000);
}

// Initialize
async function initialize() {
  const postForm = document.getElementById("post-form");
  if (postForm) {
    postForm.addEventListener("submit", handlePostSubmit);
  }

  const signOutBtn = document.getElementById("signout-btn");
  if (signOutBtn) {
    signOutBtn.addEventListener("click", signOut);
  }

  await Promise.all([
    loadPosts(),
    loadTrendingHashtags()
  ]);
  
  startPeriodicRefresh();
}

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

document.addEventListener("DOMContentLoaded", updateAuthUI);

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

  trendingContainer.querySelectorAll('.hashtag').forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      const tag = e.target.dataset.tag;
      await loadPostsByHashtag(tag);
    });
  });
}

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

async function loadTrendingHashtags() {
  try {
    const hashtags = await fetchTrendingHashtags();
    renderTrendingHashtags(hashtags);
  } catch (error) {
    showError("Failed to load trending hashtags: " + error.message);
  }
}

function startPeriodicRefresh() {
  setInterval(async () => {
    await Promise.all([
      loadPosts(),
      loadTrendingHashtags()
    ]);
  }, 60000);
}

//  Account Button Logic ===
async function loadAccountIcon() {
  try {
    const res = await fetch("/users/auth-status", { credentials: "include" });
    const data = await res.json();

    const accountBtn = document.getElementById("account-btn");
    if (!accountBtn) return;

    if (data.isAuthenticated) {
      if (data.profilePicture) {
        accountBtn.innerHTML = `<div class="profile-circle"><img src="${data.profilePicture}" alt="Profile Picture" class="profile-pic" /></div>`;
      } else {
        accountBtn.innerHTML = `<div class="profile-circle"><img src="/project-user-icon.png" alt="User Icon" class="profile-pic" /></div>`;
      }
      accountBtn.style.display = "inline-block";
    } else {
      accountBtn.style.display = "none";
    }
  } catch (err) {
    console.error("Error loading account icon:", err);
  }
}

document.addEventListener("DOMContentLoaded", loadAccountIcon);

// Event handlers for the new features
async function handleUpvote(postId) {
  try {
    const result = await upvotePost(postId);
    const post = document.querySelector(`[data-post-id="${postId}"]`);
    if (post) {
      const upvoteCount = post.querySelector('.upvote-count');
      if (upvoteCount) {
        upvoteCount.textContent = result.upvotes;
      }
    }
  } catch (error) {
    showError("Failed to upvote: " + error.message);
  }
}

async function handleDownvote(postId) {
  try {
    const result = await downvotePost(postId);
    const post = document.querySelector(`[data-post-id="${postId}"]`);
    if (post) {
      const downvoteCount = post.querySelector('.downvote-count');
      if (downvoteCount) {
        downvoteCount.textContent = result.downvotes;
      }
    }
  } catch (error) {
    showError("Failed to downvote: " + error.message);
  }
}

async function handleAddComment(postId, inputElement) {
  const content = inputElement.value.trim();
  if (!content) return;

  try {
    const result = await addComment(postId, content);
    inputElement.value = "";
    
    // Add the new comment to the UI
    const commentsSection = inputElement.closest('.comments-section').querySelector('.comments-list');
    const commentElement = createCommentElement(result.comment);
    commentsSection.appendChild(commentElement);
  } catch (error) {
    showError("Failed to add comment: " + error.message);
  }
}

function createCommentElement(comment) {
  const commentElement = document.createElement("div");
  commentElement.className = "comment";
  commentElement.innerHTML = `
    <div class="comment-header">
      <span class="comment-author">${comment.author.username}</span>
      <span class="comment-time">${new Date(comment.timestamp).toLocaleString()}</span>
    </div>
    <div class="comment-content">${comment.content}</div>
  `;
  return commentElement;
}
