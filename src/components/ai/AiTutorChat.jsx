import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, Bot, User, Sparkles, Key, AlertTriangle } from "lucide-react";
import { aiService } from "../../services/aiService";

export default function AiTutorChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "tutor",
      text: "Hi! I am your AI Study Tutor. 🎓 Ask me anything about your courses, topics, or request practice questions!",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // API key configuration states inside chat
  const [showConfig, setShowConfig] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(aiService.getApiKey());
  const [isConfigured, setIsConfigured] = useState(aiService.isConfigured());

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend = inputText) => {
    const text = typeof textToSend === 'string' ? textToSend.trim() : inputText.trim();
    if (!text) return;

    // Add user message
    const userMsg = {
      id: Date.now(),
      sender: "student",
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    try {
      // Determine course context if any (we can parse path or title)
      let courseContext = "General Studies";
      if (window.location.pathname.includes("/courses/")) {
        courseContext = "Current Course Module";
      }

      const reply = await aiService.askTutor(text, courseContext, messages);
      
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: "tutor",
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: "tutor",
        text: `⚠️ Error: ${err.message}. Please verify your Gemini API key.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveKey = (e) => {
    e.preventDefault();
    aiService.saveApiKey(apiKeyInput);
    setIsConfigured(aiService.isConfigured());
    setShowConfig(false);
  };

  const handleQuickAction = (actionText) => {
    handleSend(actionText);
  };

  return (
    <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 1000, fontFamily: "system-ui, sans-serif" }}>
      {/* Floating Chat Bubble Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)",
            color: "white",
            border: "none",
            boxShadow: "0 8px 30px rgba(124, 58, 237, 0.4)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.15) rotate(5deg)";
            e.currentTarget.style.boxShadow = "0 12px 35px rgba(124, 58, 237, 0.55)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1) rotate(0deg)";
            e.currentTarget.style.boxShadow = "0 8px 30px rgba(124, 58, 237, 0.4)";
          }}
          title="Ask AI Tutor"
        >
          <div style={{ position: "relative" }}>
            <MessageSquare size={26} />
            <span style={{ position: "absolute", top: "-5px", right: "-5px", display: "flex", height: "10px", width: "10px" }}>
              <span style={{ animate: "ping", position: "absolute", inlineSize: "100%", blockSize: "100%", borderRadius: "50%", backgroundColor: "#a78bfa", opacity: 0.75 }}></span>
              <span style={{ position: "relative", borderRadius: "50%", height: "10px", width: "10px", backgroundColor: "#c084fc" }}></span>
            </span>
          </div>
        </button>
      )}

      {/* Expanded Chatbot Window */}
      {isOpen && (
        <div
          style={{
            width: "380px",
            height: "550px",
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(12px)",
            borderRadius: "20px",
            boxShadow: "0 12px 40px rgba(0, 0, 0, 0.15)",
            border: "1px solid rgba(226, 232, 240, 0.8)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "16px 20px",
              background: "linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)",
              color: "white",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "rgba(255, 255, 255, 0.2)", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center" }}>
                <Bot size={20} />
              </div>
              <div>
                <strong style={{ display: "block", fontSize: "14px", fontWeight: "600" }}>AI Study Tutor</strong>
                <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.8)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Sparkles size={10} /> Powered by Gemini
                </span>
              </div>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {/* API Key Icon Config Toggle */}
              <button 
                onClick={() => setShowConfig(!showConfig)}
                style={{ background: "none", border: "none", color: "white", opacity: isConfigured ? 0.7 : 1, cursor: "pointer", display: "flex", alignItems: "center" }}
                title={isConfigured ? "Gemini Key Configured" : "Add Gemini Key (Demo Mode)"}
              >
                {isConfigured ? <Key size={16} /> : <AlertTriangle size={16} style={{ color: "#fdba74" }} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: "none", border: "none", color: "white", opacity: 0.8, cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Key Configuration Overlay Panel */}
          {showConfig && (
            <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderBottom: "1px solid #e2e8f0" }}>
              <form onSubmit={handleSaveKey} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Provide Gemini API Key:</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="password"
                    placeholder="paste AI key..."
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    style={{ flex: 1, padding: "6px 10px", fontSize: "13px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                  <button type="submit" style={{ backgroundColor: "#7c3aed", color: "white", padding: "6px 12px", border: "none", borderRadius: "6px", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}>
                    Save
                  </button>
                </div>
                <small style={{ fontSize: "10px", color: "#64748b" }}>
                  Stored locally. Get a key at <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" style={{ color: "#7c3aed", textDecoration: "underline" }}>Google AI Studio</a>.
                </small>
              </form>
            </div>
          )}

          {/* Demo Mode Notice */}
          {!isConfigured && !showConfig && (
            <div style={{ backgroundColor: "#ffedd5", color: "#9a3412", padding: "8px 16px", fontSize: "11px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>⚠️ Running in **Demo Mock Mode**. API Key not set.</span>
              <button 
                onClick={() => setShowConfig(true)}
                style={{ background: "none", border: "none", color: "#7c3aed", fontSize: "11px", fontWeight: "700", textDecoration: "underline", cursor: "pointer" }}
              >
                Set Key
              </button>
            </div>
          )}

          {/* Chat Messages */}
          <div
            style={{
              flex: 1,
              padding: "16px 20px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              background: "#fdfdfd"
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  alignSelf: msg.sender === "student" ? "flex-end" : "flex-start",
                  maxWidth: "80%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: msg.sender === "student" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: msg.sender === "student" ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                    backgroundColor: msg.sender === "student" ? "#7c3aed" : "#f1f5f9",
                    color: msg.sender === "student" ? "white" : "#1e293b",
                    fontSize: "13.5px",
                    lineHeight: "1.5",
                    whiteSpace: "pre-line",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                  }}
                >
                  {msg.text}
                </div>
                <small style={{ fontSize: "9px", color: "#94a3b8", marginTop: "4px", padding: "0 2px" }}>
                  {msg.time}
                </small>
              </div>
            ))}
            
            {isLoading && (
              <div style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", backgroundColor: "#f1f5f9", borderRadius: "16px 16px 16px 2px" }}>
                <span style={{ display: "inline-block", width: "6px", height: "6px", backgroundColor: "#64748b", borderRadius: "50%", animation: "bounce 0.6s infinite alternate" }}></span>
                <span style={{ display: "inline-block", width: "6px", height: "6px", backgroundColor: "#64748b", borderRadius: "50%", animation: "bounce 0.6s infinite alternate 0.2s" }}></span>
                <span style={{ display: "inline-block", width: "6px", height: "6px", backgroundColor: "#64748b", borderRadius: "50%", animation: "bounce 0.6s infinite alternate 0.4s" }}></span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Panel */}
          {messages.length <= 2 && (
            <div style={{ padding: "0 20px 10px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button 
                onClick={() => handleQuickAction("Can you give me 3 study tips?")}
                style={{ padding: "6px 10px", borderRadius: "999px", border: "1px solid #e2e8f0", backgroundColor: "white", fontSize: "11.5px", color: "#475569", cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#7c3aed"; e.currentTarget.style.color = "#7c3aed"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#475569"; }}
              >
                💡 Study Tips
              </button>
              <button 
                onClick={() => handleQuickAction("Can you explain how to prepare for exams?")}
                style={{ padding: "6px 10px", borderRadius: "999px", border: "1px solid #e2e8f0", backgroundColor: "white", fontSize: "11.5px", color: "#475569", cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#7c3aed"; e.currentTarget.style.color = "#7c3aed"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#475569"; }}
              >
                📅 Exam Help
              </button>
              <button 
                onClick={() => handleQuickAction("Create a practice question for me")}
                style={{ padding: "6px 10px", borderRadius: "999px", border: "1px solid #e2e8f0", backgroundColor: "white", fontSize: "11.5px", color: "#475569", cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#7c3aed"; e.currentTarget.style.color = "#7c3aed"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#475569"; }}
              >
                ❓ Practice Question
              </button>
            </div>
          )}

          {/* Input Form */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            style={{
              padding: "16px 20px",
              borderTop: "1px solid #e2e8f0",
              backgroundColor: "white",
              display: "flex",
              gap: "8px",
            }}
          >
            <input
              type="text"
              placeholder="Ask a question..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isLoading}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                fontSize: "13px",
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              style={{
                backgroundColor: "#7c3aed",
                color: "white",
                border: "none",
                borderRadius: "10px",
                width: "38px",
                height: "38px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                opacity: (isLoading || !inputText.trim()) ? 0.6 : 1,
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
