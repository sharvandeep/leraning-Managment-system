// AI Service for LMS Integration
// Communicates with Gemini 2.5 Flash API, Local Ollama (Llama), or falls back to an intelligent mock simulator

const API_KEY_KEY = "lms-gemini-key";
const AI_PROVIDER_KEY = "lms-ai-provider";
const OLLAMA_MODEL_KEY = "lms-ollama-model";

export const aiService = {
  // Get currently active provider: "gemini" | "ollama" | "mock"
  getProvider() {
    return localStorage.getItem(AI_PROVIDER_KEY) || (this.getApiKey() ? "gemini" : "mock");
  },

  setProvider(provider) {
    localStorage.setItem(AI_PROVIDER_KEY, provider);
  },

  // Get API key from localStorage or Environment Variables
  getApiKey() {
    return localStorage.getItem(API_KEY_KEY) || import.meta.env.VITE_GEMINI_API_KEY || "";
  },

  // Save API key
  saveApiKey(key) {
    if (key) {
      localStorage.setItem(API_KEY_KEY, key);
      this.setProvider("gemini");
    } else {
      localStorage.removeItem(API_KEY_KEY);
      if (this.getProvider() === "gemini") {
        this.setProvider("mock");
      }
    }
  },

  // Check if Ollama is running and get available models
  async checkOllamaStatus() {
    try {
      const res = await fetch("http://localhost:11434/api/tags");
      if (res.ok) {
        const data = await res.json();
        const models = data.models?.map(m => m.name) || [];
        return { running: true, models };
      }
    } catch (e) {
      // Ollama offline
    }
    return { running: false, models: [] };
  },

  getOllamaModel() {
    return localStorage.getItem(OLLAMA_MODEL_KEY) || "llama3";
  },

  setOllamaModel(model) {
    localStorage.setItem(OLLAMA_MODEL_KEY, model);
  },

  // Generic Gemini API caller helper
  async callGemini(prompt, systemInstruction = "", isJson = false) {
    const key = this.getApiKey();
    if (!key) {
      throw new Error("Gemini API key is not configured.");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    
    const body = {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ]
    };

    if (systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    if (isJson) {
      body.generationConfig = {
        responseMimeType: "application/json"
      };
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API error (${response.status})`);
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    if (isJson) {
      try {
        return JSON.parse(textResponse);
      } catch (err) {
        console.error("Failed to parse AI JSON response", textResponse);
        throw new Error("Failed to parse structured AI output. Please try again.");
      }
    }

    return textResponse;
  },

  // Local Ollama Chat API caller
  async callOllama(prompt, systemInstruction = "", isJson = false) {
    const url = "http://localhost:11434/api/chat";
    const model = this.getOllamaModel();

    const messages = [];
    if (systemInstruction) {
      messages.push({ role: "system", content: systemInstruction });
    }
    messages.push({ role: "user", content: prompt });

    const body = {
      model: model,
      messages: messages,
      stream: false,
      options: {
        temperature: 0.7
      }
    };

    if (isJson) {
      body.format = "json";
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Ollama local service error (${response.status}). Is Ollama running?`);
    }

    const data = await response.json();
    const textResponse = data.message?.content || "";

    if (isJson) {
      try {
        return JSON.parse(textResponse);
      } catch (err) {
        console.error("Failed to parse Ollama JSON", textResponse);
        throw new Error("Failed to parse structured JSON from Ollama. Ensure your model supports JSON output.");
      }
    }

    return textResponse;
  },

  // 1. AI Quiz Generator
  async generateQuiz(topic, count = 5, duration = "15 min") {
    const provider = this.getProvider();

    if (provider === "gemini") {
      const systemInstruction = "You are a professional teacher's assistant. Generate academic quiz content based on the requested topics. Always reply with raw JSON only.";
      const prompt = `Create a quiz with exactly ${count} multiple choice questions on the topic "${topic}".
      Provide a title for the quiz and duration: "${duration}".
      The output format must be a JSON object matching this schema:
      {
        "title": "String title for the quiz",
        "questionsCount": ${count},
        "duration": "${duration}",
        "questions": [
          {
            "id": 1,
            "question": "The question text",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "answer": "The exact string from the options array that represents the correct answer"
          }
        ]
      }`;
      return this.callGemini(prompt, systemInstruction, true);
    } 
    
    if (provider === "ollama") {
      const systemInstruction = "You are a teacher assistant. Generate a quiz. Reply ONLY with a valid raw JSON object matching the requested schema. No conversational filler.";
      const prompt = `Create a quiz with exactly ${count} multiple choice questions on the topic "${topic}".
      The output format must be a JSON object matching this schema:
      {
        "title": "Quiz on ${topic}",
        "questionsCount": ${count},
        "duration": "${duration}",
        "questions": [
          {
            "id": 1,
            "question": "Question text here",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "answer": "Option A"
          }
        ]
      }`;
      return this.callOllama(prompt, systemInstruction, true);
    }

    // Fallback: Smart mock quiz builder based on topics
    await new Promise(resolve => setTimeout(resolve, 1500));
    const generated = this.getSmartMockQuestions(topic, count);
    return {
      title: `Practice Quiz: ${topic}`,
      questionsCount: count,
      duration: duration,
      questions: generated
    };
  },

  // 2. AI Study Tutor / Chat Assistant
  async askTutor(message, courseContext = "", chatHistory = []) {
    const provider = this.getProvider();

    if (provider === "gemini") {
      const systemInstruction = `You are a friendly, encouraging AI Study Tutor for students. The current course context is: "${courseContext}". Keep explanations structured and use markdown (bullet points, bold text).`;
      
      const historyPrompt = chatHistory
        .slice(-6)
        .map(h => `${h.sender === "student" ? "User" : "Model"}: ${h.text}`)
        .join("\n");
        
      const prompt = historyPrompt 
        ? `${historyPrompt}\nUser: ${message}\nModel:` 
        : message;

      return this.callGemini(prompt, systemInstruction, false);
    }

    if (provider === "ollama") {
      const systemInstruction = `You are a friendly, encouraging AI Study Tutor for students. The current course context is: "${courseContext}". Keep explanations structured and use markdown (bullet points, bold text).`;
      
      const historyPrompt = chatHistory
        .slice(-6)
        .map(h => `${h.sender === "student" ? "User" : "Model"}: ${h.text}`)
        .join("\n");
        
      const prompt = historyPrompt 
        ? `${historyPrompt}\nUser: ${message}\nModel:` 
        : message;

      return this.callOllama(prompt, systemInstruction, false);
    }

    // Smart Simulator Mode
    await new Promise(resolve => setTimeout(resolve, 800));
    return this.getSmartMockChatResponse(message, courseContext);
  },

  // 3. Smart Course Material Summarization
  async summarizeMaterial(title, content) {
    const provider = this.getProvider();

    if (provider === "gemini") {
      const systemInstruction = "You are a professional educational summarizer. Your goal is to take reading material and condense it into an actionable, beautiful, markdown-formatted study guide.";
      const prompt = `Summarize the course material titled "${title}". Focus on key concepts, definitions, formulas, and takeaways. 
      Here is the content/description to summarize:
      ---
      ${content}
      ---
      Make the response highly readable using Markdown (bold text, bullet points, headers).`;
      return this.callGemini(prompt, systemInstruction, false);
    }

    if (provider === "ollama") {
      const systemInstruction = "You are an educational summarizer. Condense the reading material into a bulleted markdown study guide.";
      const prompt = `Summarize the course material titled "${title}". Focus on key concepts, definitions, and takeaways.
      Content:
      ${content}`;
      return this.callOllama(prompt, systemInstruction, false);
    }

    // Smart Mock Summary
    await new Promise(resolve => setTimeout(resolve, 1000));
    return `### 📝 Study Summary: ${title}\n\nHere is a customized study summary of this material:\n\n* **Core Objective**: Master the foundational mechanics outlined in *"${title}"*.\n* **Key Pillars Explored**:\n  * *Architectural Design*: Proper structure and flow of data/actions.\n  * *Quality Parameters*: Validation, boundaries, and testing protocols.\n* **Actionable Takeaways**:\n  * Practice applying these principles directly in your coursework.\n  * Leverage discussions with faculty to clarify edge cases.\n* **Review Question**: Ask yourself how this topic connects with your upcoming quizzes and assignments.`;
  },

  // 4. AI-Assisted Grading & Feedback
  async gradeAssignment(assignmentTitle, instructions, maxMarks, studentName, submissionDetails = "") {
    const provider = this.getProvider();

    if (provider === "gemini") {
      const systemInstruction = "You are an expert teaching assistant. Grade the student's submission fairly based on instructions and max marks. Output a JSON object containing the recommended score and written feedback.";
      const prompt = `Grade the following assignment submission:
      - **Assignment**: ${assignmentTitle}
      - **Instructions**: ${instructions}
      - **Max Marks**: ${maxMarks}
      - **Student**: ${studentName}
      - **Submission Reference**: ${submissionDetails}
      
      Please provide:
      1. A suggested integer score between 0 and ${maxMarks}.
      2. Constructive feedback in clear markdown format.
      
      Return the response as a JSON object with this exact schema:
      {
        "score": 85,
        "feedback": "Markdown text here"
      }`;
      return this.callGemini(prompt, systemInstruction, true);
    }

    if (provider === "ollama") {
      const systemInstruction = "You are a grading assistant. Reply ONLY with a valid raw JSON object matching the requested schema.";
      const prompt = `Grade this submission:
      - **Assignment**: ${assignmentTitle}
      - **Instructions**: ${instructions}
      - **Max Marks**: ${maxMarks}
      - **Student**: ${studentName}
      
      Provide a JSON object matching this schema:
      {
        "score": 80,
        "feedback": "Markdown feedback here"
      }`;
      return this.callOllama(prompt, systemInstruction, true);
    }

    // Smart Mock Grading
    await new Promise(resolve => setTimeout(resolve, 1200));
    const score = Math.round(maxMarks * 0.88);
    return {
      score: score,
      feedback: `### 🎯 AI Evaluation suggestion for **${studentName}**\n\n* **Suggested Score**: ${score} / ${maxMarks}\n* **Key Strengths**: The student successfully submitted the work for *"${assignmentTitle}"*. Core directives in the instructions were addressed in a detailed manner.\n* **Constructive Feedback**: To achieve a higher score, structure the final segments more clearly and ensure all specific edge cases or rubric guidelines are explicitly documented.\n* **Final Verdict**: Very good effort. Ready for teacher approval.`
    };
  },

  // Smart Mock Quiz Generator helper
  getSmartMockQuestions(topic, count) {
    const normalized = topic.toLowerCase();
    let questions = [];

    const reactQuestions = [
      { question: "What is the main benefit of React Hooks?", options: ["Reuse stateful logic between components", "Direct DOM manipulation", "Faster CSS compiling", "Replacing Redux state entirely"], answer: "Reuse stateful logic between components" },
      { question: "Which hook is used to perform side effects in functional components?", options: ["useEffect", "useState", "useContext", "useMemo"], answer: "useEffect" },
      { question: "What does the Virtual DOM do?", options: ["Updates the real DOM efficiently by batching changes", "Stores state globally in database", "Secures HTTP requests", "Replaces HTML compilers"], answer: "Updates the real DOM efficiently by batching changes" },
      { question: "How do you pass data from a parent component to a child?", options: ["Using Props", "Using State", "Using local storage", "Using query parameters"], answer: "Using Props" },
      { question: "What is the purpose of the useRef hook?", options: ["Accessing DOM elements directly and persisting values", "Creating React Context", "Caching calculations", "Handling async data fetches"], answer: "Accessing DOM elements directly and persisting values" }
    ];

    const jsQuestions = [
      { question: "Which of the following is NOT a JavaScript data type?", options: ["Float", "Undefined", "Symbol", "Boolean"], answer: "Float" },
      { question: "What is a closure in JavaScript?", options: ["A function retaining access to its outer lexical scope", "A method to compress JS files", "A way to close browser tabs", "A secure encryption protocol"], answer: "A function retaining access to its outer lexical scope" },
      { question: "What does async/await do?", options: ["Simplifies asynchronous code using promises", "Speeds up browser rendering", "Creates multi-threaded loops", "Validates JSON inputs"], answer: "Simplifies asynchronous code using promises" },
      { question: "Which keyword creates a block-scoped variable in JS?", options: ["let", "var", "global", "define"], answer: "let" },
      { question: "What is the role of the event loop?", options: ["Manage callback execution and asynchronous calls", "Compile JavaScript into binary", "Route network requests", "Handle CSS animations"], answer: "Manage callback execution and asynchronous calls" }
    ];

    const pythonQuestions = [
      { question: "How do you define a function in Python?", options: ["def my_func():", "function my_func() {", "void my_func()", "func my_func():"], answer: "def my_func():" },
      { question: "What is a list comprehension?", options: ["Concise syntax for generating lists", "A debugger tool", "A way to read Excel files", "An encryption algorithm"], answer: "Concise syntax for generating lists" },
      { question: "Which data structure is immutable in Python?", options: ["Tuple", "List", "Dictionary", "Set"], answer: "Tuple" },
      { question: "What does PEP 8 represent?", options: ["Python code style guide", "A security standard", "A runtime compiler", "A package installer"], answer: "Python code style guide" },
      { question: "What is a decorator in Python?", options: ["A function modifying the behavior of another function", "A visual design tool", "A database connector", "A type of class builder"], answer: "A function modifying the behavior of another function" }
    ];

    const generalQuestions = [
      { question: `What is the primary definition of ${topic}?`, options: ["The core operational mechanism and principles", "An optional auxiliary library", "A legacy protocol", "A stylesheet directive"], answer: "The core operational mechanism and principles" },
      { question: `Why is ${topic} widely adopted in modern environments?`, options: ["It solves fundamental development and workflow challenges", "It has no licensing costs", "It runs directly on GPU hardware", "It requires no documentation"], answer: "It solves fundamental development and workflow challenges" },
      { question: `Which is a key component of ${topic}?`, options: ["Core architecture elements", "Global configuration files", "Legacy API endpoints", "Virtual CSS variables"], answer: "Core architecture elements" },
      { question: `How do you measure efficiency in ${topic}?`, options: ["By throughput and latency parameters", "By line count of the source files", "By the size of binary artifacts", "By user feedback statistics"], answer: "By throughput and latency parameters" },
      { question: `What is a common pitfall when implementing ${topic}?`, options: ["Premature optimization without profiling", "Incomplete code indentation", "Over-reliance on browser caches", "Lack of proper internet connection"], answer: "Premature optimization without profiling" }
    ];

    if (normalized.includes("react")) {
      questions = reactQuestions;
    } else if (normalized.includes("js") || normalized.includes("javascript")) {
      questions = jsQuestions;
    } else if (normalized.includes("py") || normalized.includes("python")) {
      questions = pythonQuestions;
    } else {
      questions = generalQuestions;
    }

    const shuffled = [...questions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, shuffled.length)).map((q, idx) => ({ ...q, id: idx + 1 }));
  },

  // Smart Mock Chat Response helper
  getSmartMockChatResponse(message, context) {
    const lower = message.toLowerCase();

    if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
      return `Hello! I am your AI Tutor. 🎓 

I'm currently running in **Smart AI Simulator Mode**. I can help you study for your **${context || "courses"}**. 

Try asking me questions about:
* **React** (hooks, state, Virtual DOM)
* **JavaScript** (closures, event loop, async)
* **Python** (decorators, tuple vs list)

Or type **"practice"** to get a review question!`;
    }

    if (lower.includes("react")) {
      return `### Let's talk React! ⚛️

React is a declarative library for building user interfaces. Here are key topics you should master:
1. **Virtual DOM**: React keeps a lightweight representation of the UI in memory, syncing it with the real DOM efficiently via a process called *reconciliation*.
2. **State vs Props**: *State* is internal data managed by a component, while *Props* are configuration parameters passed down from a parent.
3. **Hooks**: Introduced in React 16.8, hooks like \`useState\` and \`useEffect\` let you use state and lifecycle methods in functional components.

Would you like me to write a code snippet showing how to use \`useEffect\`?`;
    }

    if (lower.includes("javascript") || lower.includes("js")) {
      return `### Deep Dive into JavaScript 💛

JavaScript is a single-threaded, non-blocking asynchronous language.
* **Closures**: Occur when a function remembers its outer lexical scope even when executed outside that scope. Useful for data privacy.
* **Event Loop**: Monitors the Call Stack and Callback Queue. If the stack is empty, it pushes callbacks onto the stack for execution.
* **Promises & Async/Await**: Help manage asynchronous execution flows without falling into "callback hell".

What specific concept can I clarify for you?`;
    }

    if (lower.includes("python") || lower.includes("py")) {
      return `### Python Essentials 🐍

Python is a high-level, interpreted programming language known for readability.
* **Lists vs Tuples**: Lists are *mutable* (can be changed), whereas Tuples are *immutable* (cannot be changed after creation).
* **Decorators**: Functions that wrap other functions to modify their behavior without altering the code directly.
* **List Comprehensions**: Elegant way to create lists, e.g., \`[x*x for x in range(10)]\`.

Would you like to try a Python challenge?`;
    }

    if (lower.includes("practice") || lower.includes("question") || lower.includes("quiz")) {
      return `Here is a practice question for you:

**Question:** Which JavaScript hook is best suited to optimize performance by caching expensive function calculations?
* A) \`useEffect\`
* B) \`useMemo\`
* C) \`useRef\`
* D) \`useCallback\`

*Think about the difference between caching values vs caching functions. Reply with your answer!*`;
    }

    if (lower.includes("b") || lower.includes("usememo")) {
      return `🎉 **Correct!** \`useMemo\` caches the *result* of a calculation between renders, only recomputing when its dependencies change. Excellent job!`;
    }

    if (lower.includes("d") || lower.includes("usecallback")) {
      return `Close! \`useCallback\` caches the *function definition itself* rather than its result. The correct answer for caching *calculations* is \`useMemo\`.`;
    }

    // Default catch-all dynamic template
    return `That's a great question! While in simulator mode, I can tell you that **"${message}"** connects closely with standard programming concepts.

Here are a few quick study directions:
1. Break down **"${message}"** into core sub-problems.
2. Consider how you would explain this to a peer.
3. Test your logic by drafting a simple implementation.

If you connect a live model like **Gemini** or **Ollama** in the config panel, I can provide full, detailed LLM responses!`;
  },

  // 5. AI Student Performance Risk Analysis
  async analyzeStudentPerformance(studentName, branch, semester, progress, average, submittedCount, totalAssignments, attendance = 85) {
    const provider = this.getProvider();

    if (provider === "gemini") {
      const systemInstruction = "You are a professional academic advisor and counselor. Analyze student metrics and output a JSON object containing the risk level (Low, Medium, High), risk factors analysis, and a drafted outreach email.";
      const prompt = `Perform a student performance risk assessment:
      - **Student**: ${studentName}
      - **Branch**: ${branch} (Semester ${semester})
      - **Course Progress**: ${progress}%
      - **Grade Average**: ${average}%
      - **Assignments Submitted**: ${submittedCount} out of ${totalAssignments}
      - **Attendance Rate**: ${attendance}%
      
      Determine the Risk Level ("Low" | "Medium" | "High").
      Write a concise bulleted analysis explaining the risk factors.
      Write an encouraging, supportive drafted email from the teacher offering tutoring, office hours, and specific support.
      
      Return the response as a JSON object with this exact schema:
      {
        "riskLevel": "High",
        "analysis": "Analysis bullet points here...",
        "emailDraft": "Drafted email contents here..."
      }`;
      return this.callGemini(prompt, systemInstruction, true);
    }

    if (provider === "ollama") {
      const systemInstruction = "You are an academic advisor. Reply ONLY with a valid JSON object matching the requested schema.";
      const prompt = `Analyze this student:
      - **Name**: ${studentName}
      - **Progress**: ${progress}%
      - **Average**: ${average}%
      - **Assignments**: ${submittedCount}/${totalAssignments}
      - **Attendance**: ${attendance}%
      
      Return a JSON object:
      {
        "riskLevel": "Medium",
        "analysis": "Analysis here...",
        "emailDraft": "Email draft here..."
      }`;
      return this.callOllama(prompt, systemInstruction, true);
    }

    // Smart Mock Risk Analyzer
    await new Promise(resolve => setTimeout(resolve, 1500));
    let riskLevel = "Low";
    let analysis = "";
    
    if (average < 60 || progress < 45 || attendance < 70) {
      riskLevel = "High";
      analysis = `• **Critical Academic Risk**: Grade average is currently at ${average}%, which is below passing threshold.\n• **Incomplete Assignments**: Only submitted ${submittedCount} out of ${totalAssignments} assignments, causing missing points.\n• **Attendance Warning**: Attendance is at ${attendance}%, indicating high class absenteeism.`;
    } else if (average < 75 || progress < 70 || attendance < 80) {
      riskLevel = "Medium";
      analysis = `• **Academic Performance**: Grade average is moderate (${average}%), leaving room for improvement.\n• **Progress Delay**: Module progress is currently at ${progress}%. The student is slightly behind the class average.\n• **Moderate Submission Rate**: Has submitted ${submittedCount}/${totalAssignments} assignments. Needs attention.`;
    } else {
      riskLevel = "Low";
      analysis = `• **Excellent Standing**: Average grade is strong at ${average}%.\n• **Good Progress**: Course progress is at ${progress}%, showing timely completion.\n• **Consistent Attendance**: Attendance is stable at ${attendance}%, reflecting strong class engagement.`;
    }

    const emailDraft = `Subject: Supporting your academic journey in ${branch}

Dear ${studentName},

I hope you are doing well. 

I've been reviewing our class progress in the Learning Management System, and wanted to reach out to see how I can support you. Your current average is ${average}%, and you've submitted ${submittedCount} of the ${totalAssignments} assignments.

If you are finding any of the topics challenging, please feel free to drop by my office hours or stay back after lectures. I want to make sure you have all the resources you need to succeed.

Best regards,
Prof. (Teacher)`;

    return { riskLevel, analysis, emailDraft };
  }
};

