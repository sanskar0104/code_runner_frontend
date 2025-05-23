// ✅ Replace this with your actual backend Render URL:
const BACKEND_URL = "https://code-runner-backend-wxfd.onrender.com";

// Handle everything for code.html
if (location.pathname.endsWith("code.html")) {
  const mode = localStorage.getItem("mode");
  const textarea = document.getElementById("code");

  if (mode === "aider") {
    textarea.value = "Generating code...";

    const payload = JSON.parse(localStorage.getItem("pendingPrompt") || "{}");
    const formData = new FormData();
    formData.append("prompt", payload.prompt);

    if (payload.fileContent && payload.fileName) {
      const blob = new Blob([payload.fileContent], { type: "text/plain" });
      formData.append("file", blob, payload.fileName);
    }

    fetch(`${BACKEND_URL}/aider-generate/`, {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        const finalCode = data.generated_code || "# No code returned by Aider.";
        textarea.value = finalCode;
        textarea.readOnly = true;

        localStorage.setItem("codePayload", JSON.stringify({ code: finalCode }));
        localStorage.setItem("mode", "aider");
        localStorage.setItem("session_id", data.session_id);
      })
      .catch((err) => {
        textarea.value = "# Error generating code:\n" + err.toString();
      });
  }

  document.getElementById("codeForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const code = document.getElementById("code").value;
    localStorage.setItem("codePayload", JSON.stringify({ code }));
    localStorage.setItem("mode", "code");
    window.location.href = "result.html";
  });

  document.getElementById("uploadForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const file = document.getElementById("jsonFile").files[0];

    if (!file || file.type !== "application/json") {
      alert("Please upload a valid JSON file.");
      return;
    }

    const content = await file.text();
    localStorage.setItem("uploadedJSON", content);
    localStorage.setItem("mode", "upload");
    window.location.href = "result.html";
  });
}

// Handle everything for result.html
if (location.pathname.endsWith("result.html")) {
  const mode = localStorage.getItem("mode");
  const output = document.getElementById("jsonOutput");
  const status = document.getElementById("status");

  if (mode === "upload") {
    const data = JSON.parse(localStorage.getItem("uploadedJSON"));
    status.innerText = "Uploaded JSON:";
    output.innerText = JSON.stringify(data, null, 2);
  } else if (mode === "code" || mode === "aider") {
    const payload = JSON.parse(localStorage.getItem("codePayload"));
    fetch(`${BACKEND_URL}/run-code/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        status.innerText = "Results:";
        output.innerText = JSON.stringify(data, null, 2);
      })
      .catch((err) => {
        status.innerText = "Error fetching results:";
        output.innerText = err.toString();
      });
  }

  document.getElementById("regenerateBtn").onclick = async () => {
    const session_id = localStorage.getItem("session_id");
    if (!session_id) return alert("No session available to regenerate.");

    const formData = new FormData();
    formData.append("session_id", session_id);

    localStorage.setItem("mode", "aider");
    window.location.href = "code.html";

    const textarea = document.getElementById("code");
    if (textarea) textarea.value = "Regenerating code...";

    try {
      const res = await fetch(`${BACKEND_URL}/regenerate/`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      localStorage.setItem("codePayload", JSON.stringify({ code: data.generated_code }));
    } catch (err) {
      console.error("Regeneration failed:", err);
    }
  };

  document.getElementById("paperBtn").onclick = () => {
    alert("Paper Writing feature coming soon!");
  };
}
