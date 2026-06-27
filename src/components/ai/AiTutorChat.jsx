import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Send, X, Bot, Sparkles, Key, AlertTriangle, Cpu, Terminal } from "lucide-react";
import { aiService } from "../../services/aiService";
import { courseService } from "../../services/courseService";
import { quizService } from "../../services/quizService";

export default function AiTutorChat() {
  const navigate = useNavigate();
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
  
  // AI Configuration Panel State
  const [showConfig, setShowConfig] = useState(false);
  const [provider, setProvider] = useState(aiService.getProvider());
  const [apiKeyInput, setApiKeyInput] = useState(aiService.getApiKey());
  const [ollamaStatus, setOllamaStatus] = useState({ running: false, models: [] });
  const [selectedOllamaModel, setSelectedOllamaModel] = useState(aiService.getOllamaModel());

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Check Ollama status when config panel opens
  useEffect(() => {
    if (showConfig) {
      aiService.checkOllamaStatus().then(status => {
        setOllamaStatus(status);
        if (status.running && status.models.length > 0 && !status.models.includes(selectedOllamaModel)) {
          setSelectedOllamaModel(status.models[0]);
          aiService.setOllamaModel(status.models[0]);
        }
      });
    }
  }, [showConfig]);

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
        text: `⚠️ Error: ${err.message}. Please verify your configurations.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAndTakeLocalQuiz = async () => {
    try {
      setIsLoading(true);
      
      // 1. Fetch courses to map to
      const allCourses = await courseService.getCourses();
      
      // Filter student's courses based on local session branch/semester
      const sessionStr = window.localStorage.getItem("lms-auth-session");
      let studentBranch = "";
      let studentSemester = "";
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        if (session && session.user) {
          studentBranch = session.user.branch;
          studentSemester = String(session.user.semester);
        }
      }

      const studentCourses = allCourses.filter(
        c => c.branch === studentBranch && String(c.semester) === studentSemester
      );

      const pathParts = window.location.pathname.split("/");
      const courseIndex = pathParts.indexOf("courses");
      const currentCourseId = courseIndex !== -1 ? pathParts[courseIndex + 1] : "";
      
      const activeCourse = studentCourses.find(c => String(c.id) === String(currentCourseId)) || studentCourses[0] || allCourses[0];
      
      if (!activeCourse) {
        throw new Error("No active courses found to map this quiz to.");
      }

      // Prompt user for quiz topic
      const topic = prompt("Enter a topic for your AI Practice Quiz:", "React Hooks");
      if (!topic || !topic.trim()) {
        setIsLoading(false);
        return;
      }
      const topicName = topic.trim();

      // 2. Generate quiz questions
      const quizData = await aiService.generateQuiz(topicName, 5, "15 min");

      // 3. Save quiz locally in storage
      const localQuiz = quizService.createLocalAiQuiz(activeCourse, topicName, quizData);

      // 4. Close chat and redirect
      setIsOpen(false);
      navigate(`/student/quizzes/${localQuiz.id}`);
    } catch (err) {
      alert("Failed to generate AI Quiz: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGeminiKey = (e) => {
    e.preventDefault();
    aiService.saveApiKey(apiKeyInput);
    setProvider("gemini");
    aiService.setProvider("gemini");
    setShowConfig(false);
    alert("Gemini API Key saved successfully!");
  };

  const handleSelectProvider = (newProvider) => {
    setProvider(newProvider);
    aiService.setProvider(newProvider);
    if (newProvider === "ollama") {
      aiService.checkOllamaStatus().then(status => {
        if (!status.running) {
          alert("Ollama is not detected locally on http://localhost:11434. Please start Ollama before selecting it.");
        }
      });
    }
  };

  const handleOllamaModelChange = (modelName) => {
    setSelectedOllamaModel(modelName);
    aiService.setOllamaModel(modelName);
  };

  const handleQuickAction = (actionText) => {
    handleSend(actionText);
  };

  const getHeaderSub = () => {
    if (provider === "gemini") return "Gemini 2.5 Flash Live";
    if (provider === "ollama") return `Local Llama (${selectedOllamaModel})`;
    return "Interactive AI Simulator";
  };

  // Don't render chatbot on quiz attempt pages (prevents cheating)
  const isQuizAttemptPage = window.location.pathname.includes("/student/quizzes/") && 
    window.location.pathname.split("/").pop() !== "quizzes";
  if (isQuizAttemptPage) {
    return null;
  }

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
            width: "390px",
            height: "580px",
            backgroundColor: "rgba(255, 255, 255, 0.98)",
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
                <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.9)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Sparkles size={10} /> {getHeaderSub()}
                </span>
              </div>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {/* Config Icon Toggle */}
              <button 
                onClick={() => setShowConfig(!showConfig)}
                style={{ background: "none", border: "none", color: "white", cursor: "pointer", display: "flex", alignItems: "center" }}
                title="AI Settings & Models"
              >
                <Cpu size={18} style={{ color: showConfig ? "#c084fc" : "white" }} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: "none", border: "none", color: "white", opacity: 0.8, cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Model & Provider Settings Overlay */}
          {showConfig && (
            <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderBottom: "1px solid #e2e8f0", overflowY: "auto", maxHeight: "250px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                
                {/* Provider Selector Tabs */}
                <div>
                  <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>AI Engine Mode</label>
                  <div style={{ display: "flex", gap: "6px", backgroundColor: "#e2e8f0", padding: "3px", borderRadius: "8px" }}>
                    <button 
                      onClick={() => handleSelectProvider("mock")}
                      style={{ flex: 1, padding: "6px 4px", fontSize: "11px", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", backgroundColor: provider === "mock" ? "white" : "transparent", color: provider === "mock" ? "#7c3aed" : "#64748b", boxShadow: provider === "mock" ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}
                    >
                      Simulator
                    </button>
                    <button 
                      onClick={() => handleSelectProvider("gemini")}
                      style={{ flex: 1, padding: "6px 4px", fontSize: "11px", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", backgroundColor: provider === "gemini" ? "white" : "transparent", color: provider === "gemini" ? "#7c3aed" : "#64748b", boxShadow: provider === "gemini" ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}
                    >
                      Gemini Key
                    </button>
                    <button 
                      onClick={() => handleSelectProvider("ollama")}
                      style={{ flex: 1, padding: "6px 4px", fontSize: "11px", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", backgroundColor: provider === "ollama" ? "white" : "transparent", color: provider === "ollama" ? "#7c3aed" : "#64748b", boxShadow: provider === "ollama" ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}
                    >
                      Ollama (Llama)
                    </button>
                  </div>
                </div>

                {/* Gemini API Key Form */}
                {provider === "gemini" && (
                  <form onSubmit={handleSaveGeminiKey} style={{ display: "flex", flexDirection: "column", gap: "6px", borderLeft: "2px solid #7c3aed", paddingLeft: "8px" }}>
                    <label style={{ fontSize: "11px", fontWeight: "600", color: "#475569" }}>Paste Google Gemini API Key:</label>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <input
                        type="password"
                        placeholder="AIzaSy..."
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        style={{ flex: 1, padding: "5px 8px", fontSize: "12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                      />
                      <button type="submit" style={{ backgroundColor: "#7c3aed", color: "white", padding: "5px 10px", border: "none", borderRadius: "6px", fontSize: "11px", cursor: "pointer", fontWeight: "600" }}>
                        Save
                      </button>
                    </div>
                  </form>
                )}

                {/* Ollama Local Configuration */}
                {provider === "ollama" && (
                  <div style={{ borderLeft: "2px solid #2563eb", paddingLeft: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Ollama status:</span>
                      <Badge variant={ollamaStatus.running ? "success" : "warning"}>
                        {ollamaStatus.running ? "Connected" : "Offline"}
                      </Badge>
                    </div>
                    {ollamaStatus.running ? (
                      <div>
                        <label style={{ fontSize: "11px", color: "#475569", display: "block", marginBottom: "4px" }}>Select Local Model:</label>
                        {ollamaStatus.models.length > 0 ? (
                          <select 
                            value={selectedOllamaModel} 
                            onChange={(e) => handleOllamaModelChange(e.target.value)}
                            style={{ width: "100%", padding: "5px 8px", fontSize: "12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                          >
                            {ollamaStatus.models.map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        ) : (
                          <small style={{ color: "#ef4444", fontSize: "11px" }}>No models pulled yet! Run `ollama pull llama3` in your terminal.</small>
                        )}
                      </div>
                    ) : (
                      <div style={{ backgroundColor: "#fee2e2", padding: "8px", borderRadius: "6px", fontSize: "11px", color: "#991b1b" }}>
                        <Terminal size={12} style={{ marginRight: "4px" }} /> Ensure Ollama is running locally on port 11434. Run `ollama serve` in command prompt.
                      </div>
                    )}
                  </div>
                )}

                {/* Simulated Mode Explanation */}
                {provider === "mock" && (
                  <div style={{ backgroundColor: "#f0fdf4", padding: "8px 10px", borderRadius: "6px", fontSize: "11px", color: "#166534" }}>
                    🚀 **Smart Simulator Active**: Tailors quiz topics, coding challenges, and explanations dynamically to whatever you type! No keys or local servers required.
                  </div>
                )}

              </div>
            </div>
          )}

          {/* Prompt Mode Warning/Status Badge */}
          {provider === "mock" && !showConfig && (
            <div style={{ backgroundColor: "#f0f9ff", color: "#0369a1", padding: "6px 16px", fontSize: "11px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>🚀 Running in **Smart AI Simulator**. Complete responses.</span>
              <button 
                onClick={() => setShowConfig(true)}
                style={{ background: "none", border: "none", color: "#7c3aed", fontSize: "11px", fontWeight: "700", textDecoration: "underline", cursor: "pointer" }}
              >
                Change Model
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
                  maxWidth: "85%",
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
                    lineHeight: "1.55",
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
          <div style={{ padding: "0 20px 10px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button 
              onClick={handleGenerateAndTakeLocalQuiz}
              disabled={isLoading}
              style={{ 
                padding: "6px 12px", 
                borderRadius: "999px", 
                border: "1px solid #7c3aed", 
                backgroundColor: "#fdfaff", 
                fontSize: "11.5px", 
                color: "#7c3aed", 
                cursor: "pointer", 
                fontWeight: "750",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              <Sparkles size={12} /> ✨ Generate & Take Real Quiz
            </button>
            
            {messages.length <= 2 && (
              <>
                <button 
                  onClick={() => handleQuickAction("Can you explain how React state works?")}
                  style={{ padding: "6px 10px", borderRadius: "999px", border: "1px solid #e2e8f0", backgroundColor: "white", fontSize: "11.5px", color: "#475569", cursor: "pointer", transition: "all 0.2s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#7c3aed"; e.currentTarget.style.color = "#7c3aed"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#475569"; }}
                >
                  💡 Explain React State
                </button>
                <button 
                  onClick={() => handleQuickAction("What is the difference between let, var, and const?")}
                  style={{ padding: "6px 10px", borderRadius: "999px", border: "1px solid #e2e8f0", backgroundColor: "white", fontSize: "11.5px", color: "#475569", cursor: "pointer", transition: "all 0.2s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#7c3aed"; e.currentTarget.style.color = "#7c3aed"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#475569"; }}
                >
                  ⚡ JS Scoping
                </button>
                <button 
                  onClick={() => handleQuickAction("Give me a practice question")}
                  style={{ padding: "6px 10px", borderRadius: "999px", border: "1px solid #e2e8f0", backgroundColor: "white", fontSize: "11.5px", color: "#475569", cursor: "pointer", transition: "all 0.2s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#7c3aed"; e.currentTarget.style.color = "#7c3aed"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#475569"; }}
                >
                  ❓ Practice Challenge
                </button>
              </>
            )}
          </div>

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

// Tiny helper badge styled inline
function Badge({ children, variant }) {
  const bg = variant === "success" ? "#dcfce7" : "#fef3c7";
  const fg = variant === "success" ? "#14532d" : "#78350f";
  return (
    <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", backgroundColor: bg, color: fg, fontWeight: "700" }}>
      {children}
    </span>
  );
}
