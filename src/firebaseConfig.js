import { getDatabase, ref, push, onChildAdded } from "firebase/database";
import { app } from "./firebase"; // your initialized app

const db = getDatabase(app);

export const sendMessage = (roomId, senderId, text) => {
  const msgRef = ref(db, `chatrooms/${roomId}/messages`);
  return push(msgRef, {
    senderId,
    text,
    timestamp: Date.now(),
  });
};

export const subscribeToMessages = (roomId, callback) => {
  const msgRef = ref(db, `chatrooms/${roomId}/messages`);
  onChildAdded(msgRef, (snapshot) => {
    callback(snapshot.val());
  });
};
