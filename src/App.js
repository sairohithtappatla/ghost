// src/App.js
import React, { useState } from "react";
import Room from "./components/Room";
import ChatRoom from "./components/ChatRoom";

function App() {
  const [roomId, setRoomId] = useState(null);

  return (
    <div>
      <h1 style={{ textAlign: "center" }}>🔥 Stealth Chat</h1>
      {!roomId ? (
        <Room setRoomId={setRoomId} />
      ) : (
        <>
          <h2 style={{ textAlign: "center" }}>✅ Joined Room: {roomId}</h2>
          <ChatRoom roomId={roomId} />
        </>
      )}
    </div>
  );
}

export default App;
