import React, { useEffect, useRef, useState } from "react";



export default function Microphone({ setChatHistory, chatHistory }) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const recognitionRef = useRef(null);

  useEffect(() => {
    // feature detect
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("SpeechRecognition API not supported in this browser. Use Chrome or Edge.");
      return;
    }
    const recog = new SpeechRecognition();
    recog.lang = "en-US";
    recog.interimResults = true;
    recog.continuous = false;

    recog.onresult = (ev) => {
      let full = "";
      let interimText = "";
      for (let i=0;i<ev.results.length;i++){
        const r = ev.results[i];
        if (r.isFinal) full += r[0].transcript;
        else interimText += r[0].transcript;
      }
      if (full.trim()) {
        handleQuestion(full.trim());
      } else setInterim(interimText);
    };
    recog.onerror = (e) => {
      console.error("Speech error", e);
      setListening(false);
    };
    recognitionRef.current = recog;
  }, []);

  const toggle = () => {
    if (!recognitionRef.current) return;
    if (!listening) {
      try {
        recognitionRef.current.start();
        setInterim("");
        setListening(true);
      } catch(e){ console.warn(e); }
    } else {
      recognitionRef.current.stop();
      setListening(false);
    }
  };

  async function handleQuestion(q) {
    setListening(false);
    setInterim("");
    // send to backend
    const localHistory = chatHistory || [];
    try {
      const res = await fetch("https://obsedian-backend.vercel.app/api/ask", {
        method:"POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ question: q, history: localHistory })
      });
      const data = await res.json();
      if (data.ok) {
        setChatHistory(data.chatHistory || []);
      } else {
        alert("Error: " + (data.error||"Unknown"));
      }
    } catch(err){
      alert("Request failed: "+err.message);
    }
  }

  return (
    <div>
      <div>
        <button onClick={toggle}>{listening? "Stop Listening":"Start Listening"}</button>
        <span style={{marginLeft:8}} className="small"> {listening ? "Listening..." : ""} {interim}</span>
      </div>
      <div className="small" style={{marginTop:8}}>
        Tip: Allow microphone in your browser. Speak clearly; the app captures a single question at a time.
      </div>
    </div>
  );
}
