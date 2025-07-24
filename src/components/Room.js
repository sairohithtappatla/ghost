// src/components/Room.js
import React, { useState } from "react";
import { db } from "../firebase";
import { collection, doc, setDoc, getDoc } from "firebase/firestore";

function Room({ setRoomId }) {
  const [inputRoomId, setInputRoomId] = useState("");

  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 10);
  };

  const createRoom = async () => {
    const newRoomId = generateRoomId();
    await setDoc(doc(collection(db, "rooms"), newRoomId), {
      createdAt: Date.now(),
    });
    setRoomId(newRoomId);
  };

  const joinRoom = async () => {
    const docRef = doc(db, "rooms", inputRoomId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setRoomId(inputRoomId);
    } else {
      alert("Room doesn't exist");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "3rem" }}>
      <h2>🔒 Join or Create Chat Room</h2>
      <input
        type="text"
        placeholder="Enter Room ID"
        value={inputRoomId}
        onChange={(e) => setInputRoomId(e.target.value)}
        style={{ padding: "10px", width: "200px" }}
      />
      <br /><br />
      <button onClick={joinRoom}>Join Room</button>
      <button onClick={createRoom} style={{ marginLeft: "10px" }}>
        Create New Room
      </button>
    </div>
  );
}

export default Room;
