import React, {useState} from "react";



export default function ResumeUpload({ setResumeSnippet }) {
  const [loading, setLoading] = useState(false);
  const upload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    const form = new FormData();
    form.append("resume", file);
    try {
      const res = await fetch("https://obsedian-backend.vercel.app/api/upload-resume", { method: "POST", body: form });
      const data = await res.json();
      if (data.ok) {
        setResumeSnippet(data.resumeTextSnippet || "");
        alert("Resume uploaded successfully (snippet shown).");
      } else {
        alert("Upload failed: " + (data.error||""));
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{marginBottom:12}}>
      <label className="small">Upload resume (PDF or TXT):</label><br/>
      <input type="file" accept=".pdf,.txt" onChange={upload} />
      <div className="small">Or paste resume text below:</div>
      <ResumeTextBox setResumeSnippet={setResumeSnippet} />
      {loading && <div className="small">Uploading...</div>}
    </div>
  );
}

function ResumeTextBox({ setResumeSnippet }) {
  const [text, setText] = React.useState("");
  const send = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/upload-resume", {
        method:"POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ resumeText: text })
      });
      const data = await res.json();
      if (data.ok) {
        setResumeSnippet(data.resumeTextSnippet||"");
        alert("Resume text saved.");
      } else alert("Failed: "+(data.error||""));
    } catch(err){ alert(err.message); }
  };
  return (
    <div>
      <textarea value={text} onChange={e=>setText(e.target.value)} rows={6} style={{width:"100%"}} />
      <button onClick={send}>Save resume text</button>
    </div>
  );
}
