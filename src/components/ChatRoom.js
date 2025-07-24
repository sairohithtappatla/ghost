// src/components/ChatRoom.js
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

function ChatRoom({ roomId }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    await addDoc(collection(db, "rooms", roomId, "messages"), {
      text: message,
      createdAt: serverTimestamp(),
    });

    setMessage("");
  };

  useEffect(() => {
    const q = query(
      collection(db, "rooms", roomId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    });

    return () => unsubscribe();
  }, [roomId]);

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ marginBottom: "20px", maxHeight: "300px", overflowY: "auto" }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ marginBottom: "10px" }}>
            {msg.text}
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage}>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your secret message..."
          style={{ width: "70%", marginRight: "10px" }}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default ChatRoom;
