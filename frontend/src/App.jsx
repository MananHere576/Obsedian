import React, { useState, useEffect } from "react";
import ResumeUpload from "./components/ResumeUpload";
import Microphone from "./components/Microphone";
import ChatHistory from "./components/ChatHistory";
import "./styles.css";


export default function App() {
  const [resumeSnippet, setResumeSnippet] = useState("");
  const [chatHistory, setChatHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("chatHistory") || "[]");
    } catch (e) { return []; }
  });

  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  }, [chatHistory]);

  return (
    <div className="container">
      <h1>Obsedian (Demo)</h1>
      <div className="columns">
        <div className="left">
          <ResumeUpload setResumeSnippet={setResumeSnippet} />
          <Microphone setChatHistory={setChatHistory} chatHistory={chatHistory} />
        </div>
        <div className="right">
          <h3>Resume snippet</h3>
          <pre className="resumeBox">{resumeSnippet || "(no resume uploaded yet)"}</pre>
          <ChatHistory chatHistory={chatHistory} setChatHistory={setChatHistory} />
        </div>
      </div>
    </div>
  );
}
