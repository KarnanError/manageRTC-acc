import { useAuth } from "@clerk/clerk-react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { getToken, isSignedIn } = useAuth();
  const socketRef = useRef(null);
  const [socketState, setSocketState] = useState(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  useEffect(() => {
    const connectSocket = async () => {
      if (!isSignedIn) {
        console.log("[Socket] User not signed in, disconnecting socket");
        socketRef.current?.disconnect();
        socketRef.current = null;
        setSocketState(null);
        setConnectionAttempts(0);
        return;
      }

      try {
        console.log("[Socket] Getting auth token...");
        const token = await getToken();
        if (!token) {
          console.error("[Socket] No auth token available for socket connection");
          setConnectionAttempts(prev => prev + 1);
          return;
        }
        console.log("[Socket] Auth token retrieved successfully");

        const backend_url =
          process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
        console.log("[Socket] Connecting to:", backend_url);

        const newSocket = io(backend_url, {
          auth: { token },
          timeout: 20000,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
        });

        newSocket.on("connect", () => {
          console.log("[Socket] ✅ Connected successfully:", newSocket.id);
          setConnectionAttempts(0);
        });

        newSocket.on("disconnect", (reason) => {
          console.log("[Socket] ⚠️ Disconnected:", reason);
          if (reason === "io server disconnect") {
            // Server disconnected us, try to reconnect
            console.log("[Socket] Server disconnected, attempting reconnection...");
            setTimeout(() => newSocket.connect(), 1000);
          }
        });

        newSocket.on("connect_error", (error) => {
          console.error("[Socket] ❌ Connection error:", error.message);
          setConnectionAttempts(prev => prev + 1);

          if (error.message.includes("Authentication error")) {
            console.error("[Socket] Authentication failed - check user metadata (role, companyId)");
          }
        });

        newSocket.on("reconnect_attempt", (attemptNumber) => {
          console.log(`[Socket] Reconnection attempt ${attemptNumber}...`);
        });

        newSocket.on("reconnect_failed", () => {
          console.error("[Socket] ❌ Reconnection failed after all attempts");
        });

        socketRef.current = newSocket;
        setSocketState(newSocket);
      } catch (error) {
        console.error("[Socket] ❌ Failed to initialize socket:", error);
        setConnectionAttempts(prev => prev + 1);
      }
    };

    connectSocket();

    return () => {
      console.log("[Socket] Cleaning up socket connection");
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocketState(null);
    };
  }, [isSignedIn, getToken]);

  return (
    <SocketContext.Provider value={socketState}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
