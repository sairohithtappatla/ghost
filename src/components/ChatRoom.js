// src/components/ChatRoom.js
import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  writeBatch,
  limit,
  doc,
  enableNetwork,
  disableNetwork
} from "firebase/firestore";
import CryptoJS from "crypto-js";

function ChatRoom({ roomId, onClose }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [userId] = useState(() => 'user_' + Math.random().toString(36).substr(2, 9));
  const messagesEndRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const messageInputRef = useRef(null);
  const unsubscribeRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const ENCRYPTION_KEY = "ghost-secure-2025";

  // Enhanced encryption with error handling
  const encryptMessage = useCallback((text) => {
    try {
      return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
    } catch (error) {
      console.error("Encryption error:", error);
      return text;
    }
  }, []);

  const decryptMessage = useCallback((encryptedText) => {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return decrypted || "[Encrypted Message]";
    } catch (error) {
      return "[Encrypted Message]";
    }
  }, []);

  // Optimized scroll
  const scrollToBottom = useCallback((immediate = false) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: immediate ? "auto" : "smooth",
        block: "end"
      });
    }
  }, []);

  // Enhanced message status tracking (WhatsApp-style)
  const getMessageStatus = useCallback((msg) => {
    if (msg.sending) return "sending";
    if (msg.senderId === userId) {
      if (!msg.readBy || Object.keys(msg.readBy).length <= 1) {
        // Only sender has read it, show single tick
        return "sent";
      }

      // Check if others have read it
      const readByOthers = Object.keys(msg.readBy).filter(id => id !== userId);
      if (readByOthers.length > 0) {
        return "read"; // Blue double tick
      }

      return "delivered"; // Gray double tick
    }
    return "";
  }, [userId]);

  // Enhanced connection recovery
  const handleConnectionError = useCallback(() => {
    setConnectionError(true);

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(async () => {
      try {
        await disableNetwork(db);
        await new Promise(resolve => setTimeout(resolve, 1000));
        await enableNetwork(db);

        setConnectionError(false);
        console.log("🔄 Connection recovered");
      } catch (error) {
        console.warn("Connection recovery failed:", error);
        setTimeout(() => handleConnectionError(), 5000);
      }
    }, 3000);
  }, []);

  // Improved read receipt tracking
  const markMultipleAsRead = useCallback(async (messageIds) => {
    if (!messageIds.length || connectionError) return;

    try {
      const batch = writeBatch(db);
      const batchSize = Math.min(messageIds.length, 5); // Smaller batches
      const limitedIds = messageIds.slice(0, batchSize);

      limitedIds.forEach(messageId => {
        const messageRef = doc(db, "rooms", roomId, "messages", messageId);
        batch.update(messageRef, {
          [`readBy.${userId}`]: serverTimestamp()
        });
      });

      await batch.commit();
    } catch (error) {
      if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
        handleConnectionError();
      } else if (error.code !== 'not-found') {
        console.warn("Read receipt error:", error.message);
      }
    }
  }, [roomId, userId, connectionError, handleConnectionError]);

  // Auto-scroll effect
  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length, scrollToBottom]);

  // Enhanced message listener
  useEffect(() => {
    if (!roomId) return;

    const q = query(
      collection(db, "rooms", roomId, "messages"),
      orderBy("createdAt", "asc"),
      limit(50)
    );

    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        try {
          setConnectionError(false);

          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }

          const newMessages = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            newMessages.push({
              id: docSnap.id,
              ...data,
              createdAt: data.createdAt || { toDate: () => new Date() }
            });
          });

          setMessages(newMessages);

          // Mark unread messages as read with delay
          const unreadMessages = newMessages.filter(msg =>
            msg.senderId !== userId &&
            !msg.readBy?.[userId] &&
            msg.senderId
          ).slice(-3); // Only last 3 unread

          if (unreadMessages.length > 0) {
            setTimeout(() => {
              markMultipleAsRead(unreadMessages.map(msg => msg.id));
            }, 1500); // Longer delay for better UX
          }

        } catch (error) {
          console.error("Message processing error:", error);
          handleConnectionError();
        }
      },
      (error) => {
        console.error("Firestore listener error:", error);
        handleConnectionError();
      }
    );

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [roomId, userId, markMultipleAsRead, handleConnectionError]);

  // Enhanced message sending
  const sendMessage = useCallback(async (e) => {
    e.preventDefault();
    if (!message.trim() || isLoading || connectionError) return;

    const messageText = message.trim();
    const tempId = 'temp_' + Date.now();

    // Optimistic update
    const optimisticMessage = {
      id: tempId,
      text: messageText,
      senderId: userId,
      createdAt: { toDate: () => new Date() },
      readBy: { [userId]: { toDate: () => new Date() } },
      encrypted: false,
      sending: true
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setMessage("");
    scrollToBottom(true);

    try {
      setIsLoading(true);
      const encryptedMessage = encryptMessage(messageText);

      await addDoc(collection(db, "rooms", roomId, "messages"), {
        text: encryptedMessage,
        senderId: userId,
        createdAt: serverTimestamp(),
        readBy: {
          [userId]: serverTimestamp()
        },
        encrypted: true
      });

      // Remove optimistic message
      setMessages(prev => prev.filter(msg => msg.id !== tempId));

    } catch (error) {
      console.error("Send message error:", error);

      if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
        handleConnectionError();
      }

      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      setMessage(messageText);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [message, isLoading, connectionError, encryptMessage, roomId, userId, scrollToBottom, handleConnectionError]);

  // Enhanced panic mode - immediate clear without confirmation
  const handlePanicMode = useCallback(async () => {
    // Immediate clear without any dialog
    setIsLoading(true);

    try {
      // Clean up listeners first
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }

      // Clear UI immediately
      setMessages([]);

      // Clear from Firebase
      const messagesQuery = query(
        collection(db, "rooms", roomId, "messages"),
        limit(100)
      );
      const snapshot = await getDocs(messagesQuery);

      if (snapshot.docs.length > 0) {
        const batch = writeBatch(db);
        snapshot.docs.forEach(docSnap => {
          batch.delete(docSnap.ref);
        });

        await batch.commit();
      }

      console.log("🚨 Panic mode executed - all messages cleared instantly");

      // Brief loading state then reload
      setTimeout(() => {
        window.location.reload();
      }, 300);

    } catch (error) {
      console.error("Panic mode error:", error);
      // Still reload even if there's an error
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  }, [roomId]);

  // Handle escape key to exit chat (go back to blog)
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        // Exit chat and go back to blog
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onClose]);

  // Processed messages
  const processedMessages = useMemo(() => {
    return messages.map((msg) => ({
      ...msg,
      decryptedText: msg.encrypted ? decryptMessage(msg.text) : msg.text,
      isOwn: msg.senderId === userId,
      status: getMessageStatus(msg)
    }));
  }, [messages, decryptMessage, userId, getMessageStatus]);

  // Enhanced status icons (WhatsApp-style)
  const getStatusIcon = useCallback((status) => {
    switch (status) {
      case "sending": return "🕐";
      case "sent": return "✓";
      case "delivered": return "✓✓";
      case "read": return <span style={{ color: "#34b7f1" }}>✓✓</span>;
      default: return "";
    }
  }, []);

  // Time formatting
  const formatTime = useCallback((timestamp) => {
    if (!timestamp?.toDate) return "";

    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;

    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Key press handler
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  }, [sendMessage]);

  return (
    <div style={{
      maxWidth: "800px",
      margin: "0 auto",
      height: "calc(100vh - 120px)",
      display: "flex",
      flexDirection: "column",
      backgroundColor: "#ffffff",
      borderRadius: "10px",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      overflow: "hidden"
    }}>
      {/* Header */}
      <div style={{
        padding: "15px 20px",
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #dee2e6",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div>
          <h3 style={{ margin: 0, color: "#2c3e50", fontSize: "16px" }}>
            🔒 Secure Chat
          </h3>
          <small style={{ color: "#6c757d", fontSize: "12px" }}>
            {connectionError ? "🔄 Reconnecting..." : "🟢 Connected"}
          </small>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handlePanicMode}
            disabled={isLoading}
            style={{
              padding: "8px 12px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: isLoading ? "not-allowed" : "pointer",
              fontSize: "12px",
              fontWeight: "600",
              opacity: isLoading ? 0.6 : 1
            }}
          >
            {isLoading ? "🔄 Clearing..." : "🚨 PANIC"}
          </button>

          <button
            onClick={onClose}
            style={{
              padding: "8px 12px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "600"
            }}
          >
            ✕ Close
          </button>
        </div>
      </div>

      {/* Connection Status */}
      {connectionError && (
        <div style={{
          padding: "10px 20px",
          backgroundColor: "#fff3cd",
          color: "#856404",
          fontSize: "14px",
          textAlign: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px"
        }}>
          <span>🔄</span>
          <span>Reconnecting to secure server...</span>
        </div>
      )}

      {/* Messages */}
      <div style={{
        flex: 1,
        padding: "20px",
        overflowY: "auto",
        backgroundColor: "#f8f9fa",
        display: "flex",
        flexDirection: "column"
      }} className="messages-container">
        {processedMessages.length === 0 ? (
          <div style={{
            textAlign: "center",
            color: "#6c757d",
            marginTop: "50px",
            fontSize: "16px"
          }}>
            🔒 Secure chat initialized. Start your conversation!
          </div>
        ) : (
          processedMessages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.isOwn}
              status={msg.status}
              getStatusIcon={getStatusIcon}
              formatTime={formatTime}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} style={{
        padding: "20px",
        backgroundColor: "#ffffff",
        borderTop: "1px solid #dee2e6",
        display: "flex",
        gap: "10px"
      }}>
        <input
          ref={messageInputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={connectionError ? "Reconnecting..." : "Type your encrypted message..."}
          disabled={isLoading || connectionError}
          style={{
            flex: 1,
            padding: "12px 16px",
            borderRadius: "25px",
            border: "1px solid #dee2e6",
            fontSize: "15px",
            outline: "none",
            backgroundColor: (isLoading || connectionError) ? "#f0f0f0" : "#f8f9fa",
            cursor: (isLoading || connectionError) ? "not-allowed" : "text"
          }}
          autoFocus
        />
        <button
          type="submit"
          disabled={!message.trim() || isLoading || connectionError}
          style={{
            padding: "12px 24px",
            borderRadius: "25px",
            border: "none",
            backgroundColor: (!message.trim() || isLoading || connectionError) ? "#6c757d" : "#007bff",
            color: "#ffffff",
            cursor: (!message.trim() || isLoading || connectionError) ? "not-allowed" : "pointer",
            fontSize: "15px",
            fontWeight: "600"
          }}
        >
          {isLoading ? "..." : "Send 🔒"}
        </button>
      </form>

      {/* Footer */}
      <div style={{
        padding: "8px 20px",
        backgroundColor: "#e8f5e8",
        borderTop: "1px solid #d4edda",
        fontSize: "11px",
        color: "#155724",
        textAlign: "center"
      }}>
        🔐 AES Encrypted • ✓ Read Receipts • 🚨 Panic Mode • ⚡ Real-time • ESC to Exit
      </div>
    </div>
  );
}

// Enhanced Message Bubble with better status tracking
const MessageBubble = React.memo(({ message, isOwn, status, getStatusIcon, formatTime }) => (
  <div
    style={{
      display: "flex",
      justifyContent: isOwn ? "flex-end" : "flex-start",
      marginBottom: "8px",
      animation: "messageSlideIn 0.3s ease-out"
    }}
  >
    <div
      style={{
        maxWidth: "70%",
        padding: "8px 12px",
        borderRadius: isOwn ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        backgroundColor: isOwn ? "#007bff" : "#ffffff",
        color: isOwn ? "#ffffff" : "#2c3e50",
        boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
        border: !isOwn ? "1px solid #e9ecef" : "none",
        wordBreak: "break-word"
      }}
    >
      <div style={{
        fontSize: "15px",
        lineHeight: "1.4",
        marginBottom: "4px"
      }}>
        {message.decryptedText}
      </div>

      <div style={{
        fontSize: "11px",
        opacity: 0.7,
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: "4px"
      }}>
        <span>{formatTime(message.createdAt)}</span>
        {isOwn && (
          <span style={{ fontSize: "12px", marginLeft: "4px" }}>
            {getStatusIcon(status)}
          </span>
        )}
      </div>
    </div>
  </div>
));

export default ChatRoom;
