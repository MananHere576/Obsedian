import React from "react";



export default function ChatHistory({ chatHistory, setChatHistory }) {
  const clear = () => {
    if (confirm("Clear history?")) {
      setChatHistory([]);
      localStorage.removeItem("chatHistory");
    }
  };

  return (
    <div className="chatHistoryContainer">
      <h3>Chat history</h3>
      <button onClick={clear} className="clearBtn">Clear</button>
      <div className="chatMessages">
        {chatHistory.length === 0 && (
          <div className="small">No chats yet. Use the microphone to ask questions.</div>
        )}

        {chatHistory.slice(0).reverse().map((c, idx) => (
          <div key={idx} className="chatBubble">
            <div className="userMsg"><strong>Q:</strong> {c.question}</div>
            <div className="assistantMsg"><strong>A:</strong> {c.answer}</div>
            <div className="small timestamp">{new Date(c.timestamp).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
