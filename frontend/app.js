const UID_RE = /^[a-zA-Z0-9_-]{3,64}$/;
const BAD_RE =
  /(--|\/\*|\*\/|;|'|"|<|>|`|\$\(|\b(select|drop|union|insert|script)\b)/i;

const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  try {
    tg.setHeaderColor("#1e2025");
    tg.setBackgroundColor("#1e2025");
  } catch {
    /* older clients */
  }
}

const oldInput = document.getElementById("old_uid");
const newInput = document.getElementById("new_uid");
const oldHint = document.getElementById("old_hint");
const newHint = document.getElementById("new_hint");
const submit = document.getElementById("submit");
const alertEl = document.getElementById("alert");
const userLabel = document.getElementById("user_label");

const user = tg?.initDataUnsafe?.user;
if (user?.id) {
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
  userLabel.textContent = `${name || "User"} · ID ${user.id}`;
}

function validateUid(value, other) {
  const v = value.trim();
  if (!v) return "Required";
  if (!UID_RE.test(v)) return "3–64 chars: letters, numbers, _ or -";
  if (BAD_RE.test(v)) return "Disallowed characters/patterns";
  if (other && v === other.trim()) return "Must differ from the other UID";
  return "";
}

function refresh() {
  const oldErr = validateUid(oldInput.value, newInput.value);
  const newErr = validateUid(newInput.value, oldInput.value);
  oldHint.textContent = oldErr;
  newHint.textContent = newErr;
  oldHint.className = "hint" + (!oldErr && oldInput.value ? " ok" : "");
  newHint.className = "hint" + (!newErr && newInput.value ? " ok" : "");
  if (!oldErr && oldInput.value) oldHint.textContent = "Looks good";
  if (!newErr && newInput.value) newHint.textContent = "Looks good";
  submit.disabled = Boolean(oldErr || newErr);
}

function showAlert(message, type) {
  alertEl.hidden = false;
  alertEl.textContent = message;
  alertEl.className = "alert " + type;
  if (tg?.HapticFeedback) {
    try {
      tg.HapticFeedback.notificationOccurred(
        type === "success" ? "success" : "error",
      );
    } catch {
      /* ignore */
    }
  }
}

oldInput.addEventListener("input", refresh);
newInput.addEventListener("input", refresh);
refresh();

submit.addEventListener("click", async () => {
  refresh();
  if (submit.disabled) return;

  const initData = tg?.initData || "";
  if (!initData) {
    showAlert(
      "Open this page from the Telegram Mini App (initData missing).",
      "error",
    );
    return;
  }

  submit.disabled = true;
  submit.classList.add("loading");
  submit.querySelector(".btn-spinner").hidden = false;

  try {
    const res = await fetch("/api/change-uid", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Telegram-Init-Data": initData,
      },
      body: JSON.stringify({
        old_uid: oldInput.value.trim(),
        new_uid: newInput.value.trim(),
      }),
    });

    let data = {};
    try {
      data = await res.json();
    } catch {
      data = { message: "Invalid server response" };
    }

    if (res.ok && data.ok) {
      showAlert(data.message || "UID changed successfully.", "success");
    } else {
      showAlert(data.message || "Request failed.", "error");
    }
  } catch {
    showAlert("Network error. Try again.", "error");
  } finally {
    submit.classList.remove("loading");
    submit.querySelector(".btn-spinner").hidden = true;
    refresh();
  }
});
