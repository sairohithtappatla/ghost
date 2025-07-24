// src/App.js
import React, { useState, useEffect } from "react";
import ChatRoom from "./components/ChatRoom";

function App() {
  const [showSecretLogin, setShowSecretLogin] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [passphrase, setPassphrase] = useState("");

  // Secret passphrase - change this to whatever you want
  const SECRET_PASSPHRASE = "ghost2025";

  // Fixed secret room ID based on passphrase (everyone with same passphrase enters same room)
  const SECRET_ROOM_ID = `secret-${SECRET_PASSPHRASE}`;

  // Reset click count after 3 seconds of no clicks
  useEffect(() => {
    if (clickCount > 0) {
      const timer = setTimeout(() => setClickCount(0), 3000);
      return () => clearTimeout(timer);
    }
  }, [clickCount]);

  // Panic switch: Ctrl + Shift + X
  useEffect(() => {
    const handleKey = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === "X") {
        if (authenticated) {
          // Panic mode - immediately go back to blog and clear chat data
          setAuthenticated(false);
          setShowSecretLogin(false);
          // Trigger panic mode in ChatRoom (we'll pass this as prop)
          window.dispatchEvent(new CustomEvent('panicMode'));
        } else {
          // Show secret login
          setShowSecretLogin(true);
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [authenticated]);

  // Handle icon clicks (triple click detection)
  const handleIconClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (newCount === 3) {
      if (authenticated) {
        // Panic mode
        setAuthenticated(false);
        setShowSecretLogin(false);
        window.dispatchEvent(new CustomEvent('panicMode'));
      } else {
        // Show secret login
        setShowSecretLogin(true);
      }
      setClickCount(0);
    }
  };

  // Handle passphrase authentication
  const handleAuth = (e) => {
    e.preventDefault();
    if (passphrase === SECRET_PASSPHRASE) {
      setAuthenticated(true);
      setShowSecretLogin(false);
      setPassphrase("");
    } else {
      alert("❌ Wrong passphrase! Access denied.");
      setPassphrase("");
    }
  };

  // Secret Login Modal
  const SecretLogin = () => (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0,0,0,0.8)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999
    }}>
      <div style={{
        backgroundColor: "#ffffff",
        padding: "40px",
        borderRadius: "20px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
        textAlign: "center",
        minWidth: "400px",
        border: "1px solid #e0e0e0"
      }}>
        <h2 style={{ color: "#2c3e50", marginBottom: "20px", fontSize: "24px" }}>🔐 Secure Access</h2>
        <p style={{ color: "#7f8c8d", marginBottom: "30px", fontSize: "16px" }}>Enter your passphrase to continue</p>

        <form onSubmit={handleAuth}>
          <input
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder="Enter passphrase..."
            style={{
              width: "100%",
              padding: "15px",
              marginBottom: "20px",
              backgroundColor: "#f8f9fa",
              color: "#2c3e50",
              border: "2px solid #e9ecef",
              borderRadius: "10px",
              fontSize: "16px",
              outline: "none",
              boxSizing: "border-box"
            }}
            autoFocus
          />
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: "15px",
                backgroundColor: "#3498db",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "16px",
                transition: "background-color 0.3s"
              }}
            >
              🚀 Enter Chat
            </button>
            <button
              type="button"
              onClick={() => {
                setShowSecretLogin(false);
                setPassphrase("");
              }}
              style={{
                flex: 1,
                padding: "15px",
                backgroundColor: "#95a5a6",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                fontSize: "16px"
              }}
            >
              ❌ Cancel
            </button>
          </div>
        </form>

        <small style={{ color: "#95a5a6", display: "block", marginTop: "15px" }}>
          All users with the same passphrase will join the same secure room
        </small>
      </div>
    </div>
  );

  // Fake AI Blog App (default view)
  const FakeAIBlog = () => {
    const [selectedArticle, setSelectedArticle] = useState(0);

    const articles = [
      {
        title: "The Future of Artificial Intelligence in 2025",
        author: "Dr. Sarah Chen",
        date: "January 15, 2025",
        readTime: "8 min read",
        category: "Technology",
        image: "🤖",
        content: `Artificial Intelligence continues to reshape our world in unprecedented ways. As we move through 2025, we're witnessing remarkable breakthroughs in machine learning, natural language processing, and computer vision.

Recent developments in large language models have shown incredible promise in various applications, from content creation to scientific research. The integration of AI into everyday tools has become seamless, making complex tasks more accessible to the general public.

However, with great power comes great responsibility. The ethical implications of AI development remain at the forefront of discussions among researchers, policymakers, and technologists worldwide.

Key trends to watch:
• Multimodal AI systems
• Enhanced privacy-preserving techniques
• AI democratization through no-code platforms
• Sustainable AI development practices

The future looks bright, but we must navigate these waters carefully to ensure AI benefits humanity as a whole.`
      },
      {
        title: "Understanding Quantum Computing: A Beginner's Guide",
        author: "Prof. Michael Torres",
        date: "January 12, 2025",
        readTime: "12 min read",
        category: "Science",
        image: "⚛️",
        content: `Quantum computing represents one of the most exciting frontiers in modern technology. Unlike classical computers that use bits (0s and 1s), quantum computers use quantum bits or 'qubits' that can exist in multiple states simultaneously.

This phenomenon, known as superposition, allows quantum computers to process vast amounts of information in parallel, potentially solving complex problems that would take classical computers thousands of years.

Applications include:
• Cryptography and security
• Drug discovery and molecular modeling
• Financial modeling and optimization
• Weather prediction and climate modeling

While still in its early stages, quantum computing promises to revolutionize industries and solve some of humanity's most pressing challenges.

The race is on among tech giants and research institutions to achieve quantum supremacy and make this technology commercially viable.`
      },
      {
        title: "Cybersecurity Best Practices for Remote Work",
        author: "Lisa Rodriguez",
        date: "January 10, 2025",
        readTime: "6 min read",
        category: "Security",
        image: "🔒",
        content: `As remote work becomes the norm, cybersecurity has never been more critical. Organizations and individuals must adapt their security strategies to protect against evolving threats.

Essential practices include:
• Using strong, unique passwords with a password manager
• Enabling two-factor authentication on all accounts
• Keeping software and systems updated
• Using VPNs for secure connections
• Regular security awareness training

Common threats to watch for:
• Phishing emails and social engineering
• Malware and ransomware attacks
• Unsecured Wi-Fi networks
• Data breaches and identity theft

Remember: cybersecurity is everyone's responsibility. A single weak link can compromise an entire organization's security posture.

Stay vigilant, stay informed, and always think before you click.`
      }
    ];

    const currentArticle = articles[selectedArticle];

    return (
      <div style={{
        maxWidth: "900px",
        margin: "0 auto",
        backgroundColor: "#fff",
        minHeight: "100vh",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}>
        {/* Header */}
        <header style={{
          borderBottom: "1px solid #e5e5e5",
          padding: "20px",
          backgroundColor: "#fafafa"
        }}>
          <h1 style={{
            margin: 0,
            fontSize: "28px",
            fontWeight: "700",
            color: "#1a1a1a"
          }}>
            🧠 TechInsight AI
            {/* Secret clickable icon */}
            <span
              onClick={handleIconClick}
              style={{
                marginLeft: "10px",
                cursor: "pointer",
                opacity: 0.7,
                fontSize: "16px"
              }}
              title="Click me..."
            >
              ⚙️
            </span>
          </h1>
          <p style={{
            margin: "5px 0 0 0",
            color: "#666",
            fontSize: "14px"
          }}>
            Exploring the future of technology and artificial intelligence
          </p>
        </header>

        <div style={{ display: "flex" }}>
          {/* Sidebar */}
          <div style={{
            width: "300px",
            borderRight: "1px solid #e5e5e5",
            padding: "20px",
            backgroundColor: "#f9f9f9",
            minHeight: "calc(100vh - 100px)"
          }}>
            <h3 style={{ marginTop: 0, color: "#333" }}>Latest Articles</h3>
            {articles.map((article, index) => (
              <div
                key={index}
                onClick={() => setSelectedArticle(index)}
                style={{
                  padding: "15px",
                  marginBottom: "10px",
                  backgroundColor: selectedArticle === index ? "#e3f2fd" : "#fff",
                  border: "1px solid #e5e5e5",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                <div style={{ fontSize: "24px", marginBottom: "8px" }}>{article.image}</div>
                <h4 style={{
                  margin: "0 0 8px 0",
                  fontSize: "14px",
                  lineHeight: "1.4",
                  color: "#1a1a1a"
                }}>
                  {article.title}
                </h4>
                <div style={{
                  fontSize: "12px",
                  color: "#666"
                }}>
                  {article.author} • {article.readTime}
                </div>
              </div>
            ))}
          </div>

          {/* Main Content */}
          <div style={{ flex: 1, padding: "30px" }}>
            <div style={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              overflow: "hidden"
            }}>
              {/* Article Header */}
              <div style={{ marginBottom: "30px" }}>
                <div style={{
                  display: "inline-block",
                  backgroundColor: "#3498db",
                  color: "white",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "600",
                  marginBottom: "15px"
                }}>
                  {currentArticle.category}
                </div>

                <h1 style={{
                  fontSize: "32px",
                  fontWeight: "700",
                  lineHeight: "1.3",
                  color: "#1a1a1a",
                  margin: "0 0 20px 0"
                }}>
                  {currentArticle.title}
                </h1>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "15px",
                  color: "#666",
                  fontSize: "14px",
                  marginBottom: "20px"
                }}>
                  <span>By {currentArticle.author}</span>
                  <span>•</span>
                  <span>{currentArticle.date}</span>
                  <span>•</span>
                  <span>{currentArticle.readTime}</span>
                </div>
              </div>

              {/* Article Content */}
              <div style={{
                fontSize: "18px",
                lineHeight: "1.6",
                color: "#333",
                whiteSpace: "pre-line"
              }}>
                {currentArticle.content}
              </div>

              {/* Footer */}
              <div style={{
                marginTop: "40px",
                paddingTop: "20px",
                borderTop: "1px solid #e5e5e5",
                textAlign: "center"
              }}>
                <div style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "20px",
                  marginBottom: "20px"
                }}>
                  <button style={{
                    padding: "10px 20px",
                    backgroundColor: "#3498db",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}>
                    👍 Like
                  </button>
                  <button style={{
                    padding: "10px 20px",
                    backgroundColor: "#f5f5f5",
                    color: "#333",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}>
                    📤 Share
                  </button>
                  <button style={{
                    padding: "10px 20px",
                    backgroundColor: "#f5f5f5",
                    color: "#333",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}>
                    🔖 Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Always show blog by default */}
      {!authenticated ? (
        <FakeAIBlog />
      ) : (
        /* Beautiful light-themed chat */
        <div style={{
          backgroundColor: "#f8f9fa",
          minHeight: "100vh",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }}>
          <div style={{
            backgroundColor: "#ffffff",
            padding: "20px",
            borderBottom: "1px solid #dee2e6",
            textAlign: "center",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }}>
            <h1 style={{
              margin: 0,
              fontSize: "24px",
              color: "#2c3e50",
              fontWeight: "600"
            }}>
              💬 Secure Chat Room
            </h1>
            <p style={{
              margin: "10px 0 0 0",
              fontSize: "14px",
              color: "#6c757d"
            }}>
              Room: {SECRET_ROOM_ID} • End-to-end encrypted
            </p>
          </div>

          <ChatRoom
            roomId={SECRET_ROOM_ID}
            onClose={() => setAuthenticated(false)}
          />

          <div style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            backgroundColor: "#ffffff",
            padding: "10px 15px",
            borderRadius: "20px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            fontSize: "12px",
            color: "#6c757d",
            border: "1px solid #dee2e6"
          }}>
            Press Ctrl+Shift+X for panic mode
          </div>
        </div>
      )}

      {/* Secret login modal */}
      {showSecretLogin && <SecretLogin />}
    </div>
  );
}

export default App;
