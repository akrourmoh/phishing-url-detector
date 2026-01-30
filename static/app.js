const urlInput = document.getElementById("urlInput");
const checkBtn = document.getElementById("checkBtn");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");

const badgeEl = document.getElementById("badge");
const confidenceEl = document.getElementById("confidence");
const pSafeEl = document.getElementById("pSafe");
const pNotSafeEl = document.getElementById("pNotSafe");
const deviceEl = document.getElementById("device");

function setLoading(isLoading) {
  checkBtn.disabled = isLoading;
  statusEl.textContent = isLoading ? "Checking..." : "";
}

function showResult(data) {
  resultEl.classList.remove("hidden");

  badgeEl.textContent = data.label;
  badgeEl.className = "badge " + (data.label === "Safe" ? "safe" : "notsafe");

  confidenceEl.textContent = data.confidence;
  pSafeEl.textContent = data.prob_safe;
  pNotSafeEl.textContent = data.prob_not_safe;
  deviceEl.textContent = data.device || "";
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

checkBtn.addEventListener("click", async () => {
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
});

// Example chips
document.querySelectorAll(".chip").forEach(btn => {
  btn.addEventListener("click", async () => {
    const u = btn.getAttribute("data-url");
    urlInput.value = u;
    checkBtn.click();
  });
});
