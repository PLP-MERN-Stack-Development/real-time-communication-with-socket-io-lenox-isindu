import { useState, useEffect } from "react";
import { useSocket } from "./useSocket";

export const useChat = () => {
  const [messages, setMessages] = useState([]);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      setMessages((prev) => [...prev, message]);
    };

    const handleMessageHistory = (history) => {
      console.log("Received message history:", history?.length || 0);
      setMessages(history || []);
    };

    socket.on("message:new", handleNewMessage);
    socket.on("messages:history", handleMessageHistory);

    // Always fetch history when socket connects or reconnects
    console.log("Fetching message history from backend...");
    socket.emit("messages:get", { room: "global" });

    
    socket.on("connect", () => {
      console.log(" Socket reconnected — fetching message history again");
      socket.emit("messages:get", { room: "global" });
    });

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("messages:history", handleMessageHistory);
      socket.off("connect");
    };
  }, [socket]);

  return { messages };
};
