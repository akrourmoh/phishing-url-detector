// static/app.js

const urlInput = document.getElementById("urlInput");
const checkBtn = document.getElementById("checkBtn");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");

const badgeEl = document.getElementById("badge");
const confidenceEl = document.getElementById("confidence");
const pSafeEl = document.getElementById("pSafe");
const pNotSafeEl = document.getElementById("pNotSafe");
const deviceEl = document.getElementById("device");

// New UI progress bars (from the improved HTML)
const safeFillEl = document.getElementById("safeFill");
const notSafeFillEl = document.getElementById("notSafeFill");

function setLoading(isLoading) {
  checkBtn.disabled = isLoading;
  statusEl.textContent = isLoading ? "Checking..." : "";
}

function toPct(prob) {
  const n = Number(prob);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n * 100));
}

function showResult(data) {
  resultEl.classList.remove("hidden");

  // Badge
  badgeEl.textContent = data.label;
  badgeEl.className = "badge " + (data.label === "Safe" ? "safe" : "notsafe");

  // Metrics
  confidenceEl.textContent = data.confidence;
  pSafeEl.textContent = data.prob_safe;
  pNotSafeEl.textContent = data.prob_not_safe;
  deviceEl.textContent = data.device || "";

  // Progress bars
  if (safeFillEl) safeFillEl.style.width = toPct(data.prob_safe) + "%";
  if (notSafeFillEl) notSafeFillEl.style.width = toPct(data.prob_not_safe) + "%";
}

async function predict(url) {
  const res = await fetch("/api/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Server error");
  return data;
}

async function handleCheck() {
  const url = urlInput.value.trim();
  resultEl.classList.add("hidden");

  if (!url) {
    statusEl.textContent = "Please paste a URL first.";
    return;
  }

  setLoading(true);
  try {
    const data = await predict(url);
    statusEl.textContent = "";
    showResult(data);
  } catch (e) {
    statusEl.textContent = e.message || "Error occurred.";
  } finally {
    setLoading(false);
  }
}

checkBtn.addEventListener("click", handleCheck);

// Submit on Enter
urlInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleCheck();
});

// Example chips
document.querySelectorAll(".chip").forEach(btn => {
  btn.addEventListener("click", () => {
    const u = btn.getAttribute("data-url");
    urlInput.value = u;
    handleCheck();
  });
});
