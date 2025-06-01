let myIdentity = undefined;

async function loadIdentity() {
  let identity_div = document.getElementById("identity_div");

  try {
    let identityInfo = await fetchJSON(`api/${apiVersion}/users/myIdentity`);

    if (identityInfo.status == "loggedin") {
      myIdentity = identityInfo.userInfo.username;
      identity_div.innerHTML = `
            <a href="/userInfo.html?user=${encodeURIComponent(
              identityInfo.userInfo.username
            )}">${escapeHTML(identityInfo.userInfo.name)} (${escapeHTML(
        identityInfo.userInfo.username
      )})</a>
            <a href="signout" class="btn btn-danger" role="button">Log out</a>`;
      if (document.getElementById("make_post_div")) {
        document.getElementById("make_post_div").classList.remove("d-none");
      }
    } else {
      //logged out
      myIdentity = undefined;
      identity_div.innerHTML = `
            <a href="signin" class="btn btn-primary" role="button">Log in</a>`;
      if (document.getElementById("make_post_div")) {
        document.getElementById("make_post_div").classList.add("d-none");
      }
    }
  } catch (error) {
    myIdentity = undefined;
    identity_div.innerHTML = `<div>
        <button onclick="loadIdentity()">retry</button>
        Error loading identity: <span id="identity_error_span"></span>
        <a href="signout" class="btn btn-danger" role="button">Log out</a>
        <a href="signin" class="btn btn-primary" role="button">Log in</a>
        </div>`;
    document.getElementById("identity_error_span").innerText = error;
    if (document.getElementById("make_post_div")) {
      document.getElementById("make_post_div").classList.add("d-none");
    }
  }
}

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

document.addEventListener("DOMContentLoaded", () => {
  updateAuthUI();

  // Button click handlers
  const signInBtn = document.getElementById("signin-btn");
  const signOutBtn = document.getElementById("signout-btn");

  if (signInBtn) {
    signInBtn.addEventListener("click", () => {
      window.location.href = "/signin";
    });
  }
  if (signOutBtn) {
    signOutBtn.addEventListener("click", () => {
      window.location.href = "/signout";
    });
  }
});
