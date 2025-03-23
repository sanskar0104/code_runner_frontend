// ✅ Replace this with your actual backend Render URL:
const BACKEND_URL = "https://code-runner-backend-yjzx.onrender.com";

// Handle "Run Code" form on index.html
if (location.pathname.endsWith("code.html")) {
  const mode = localStorage.getItem("mode");

  // Aider-generated code: pre-fill and lock the textarea
  if (mode === "aider") {
    const { code } = JSON.parse(localStorage.getItem("codePayload") || "{}");
    const textarea = document.getElementById("code");
    textarea.readOnly = true;
    textarea.value = code || "# No code received from Aider.";
  }

  document.getElementById("codeForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const code = document.getElementById("code").value;

    localStorage.setItem("codePayload", JSON.stringify({ code }));
    localStorage.setItem("mode", "code");

    // ✅ Redirect to result
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

// Handle logic for result.html
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

  // Placeholder buttons
  document.getElementById("regenerateBtn").onclick = () => {};
  document.getElementById("paperBtn").onclick = () => {};
}
