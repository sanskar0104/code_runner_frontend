// ✅ Replace this with your actual backend Render URL:
const BACKEND_URL = "https://code-runner-backend-yjzx.onrender.com";

// Helper function to fill dropdown
function populateDropdown(id, list, callback) {
  const dropdown = document.getElementById(id);
  dropdown.innerHTML = list.map(v => `<option value="${v}">${v}</option>`).join("");
  dropdown.onchange = () => callback(dropdown.value);
}

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
        localStorage.setItem("session_id", data.session_id);
      })
      .catch((err) => {
        textarea.value = "# Error generating code:\n" + err.toString();
      });
  }

  document.getElementById("codeForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const code = document.getElementById("code").value;
    const session_id = localStorage.getItem("session_id");

    localStorage.setItem("codePayload", JSON.stringify({ code }));
    localStorage.setItem("mode", "code");

    fetch(`${BACKEND_URL}/run-code/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, session_id }),
    })
    .then(res => res.json())
    .then((data) => {
      localStorage.setItem("lastOutput", JSON.stringify(data));
      window.location.href = "result.html";
    });
  });

  document.getElementById("uploadForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const file = document.getElementById("jsonFile").files[0];

    if (!file || file.type !== "application/json") {
      alert("Please upload a valid JSON file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${BACKEND_URL}/upload-json/`, {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    localStorage.setItem("uploadedJSON", JSON.stringify(data.result));
    localStorage.setItem("mode", "upload");

    window.location.href = "result.html";
  });
}

// Handle result.html logic
if (location.pathname.endsWith("result.html")) {
  const mode = localStorage.getItem("mode");
  const output = document.getElementById("jsonOutput");
  const status = document.getElementById("status");
  const session_id = localStorage.getItem("session_id");

  function loadOutputFile(file) {
    fetch(`/tmp/session_${session_id}/${file}`)
      .then(res => res.json())
      .then(data => {
        status.innerText = `Viewing: ${file}`;
        output.innerText = JSON.stringify(data, null, 2);
      });
  }

  if (mode === "upload") {
    const data = JSON.parse(localStorage.getItem("uploadedJSON"));
    status.innerText = "Uploaded JSON:";
    output.innerText = JSON.stringify(data, null, 2);
  } else {
    // Show last output if immediately after code execution
    const data = JSON.parse(localStorage.getItem("lastOutput") || "{}");
    if (data.result) {
      status.innerText = `Output v${data.version || "?"}`;
      output.innerText = JSON.stringify(data.result, null, 2);
    }

    // Populate dropdown for all outputs
    fetch(`${BACKEND_URL}/versions/?session_id=${session_id}`)
      .then(res => res.json())
      .then(data => {
        populateDropdown("outputVersionSelect", data.output_versions, loadOutputFile);
      });
  }

  document.getElementById("regenerateBtn").onclick = async () => {
    const formData = new FormData();
    formData.append("session_id", session_id);

    const res = await fetch(`${BACKEND_URL}/regenerate/`, {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    localStorage.setItem("codePayload", JSON.stringify({ code: data.generated_code }));
    localStorage.setItem("mode", "aider");
    window.location.href = "code.html";
  };

  document.getElementById("paperBtn").onclick = () => {
    alert("📝 Paper writing feature coming soon!");
  };
}
