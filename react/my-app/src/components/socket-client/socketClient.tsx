"use client";
import React, { useEffect, useState, useRef } from "react";
import { io, type Socket } from "socket.io-client";

export default function App() {
  const [backendData, setBackendData] = useState("");
  const [yawAngle, setYawAngle] = useState("");
  const [status, setStatus] = useState("Disconnected");
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect directly to the FastAPI server port (e.g., 8000)
    const socket = io("http://localhost:8000", {
      transports: ["websocket"], // Forces WebSocket transport layer
    });

    socketRef.current = socket;

    // Listen for connection confirmation
    socket.on("connect", () => {
      setStatus("Connected");
    });

    // Listen for custom server status event from FastAPI
    socket.on("server_status", (data) => {
      console.log(data.data);
    });

    // Listen for data payloads sent by FastAPI
    socket.on("receive_data", (data) => {
      setBackendData(data.message);
    });

    socket.on("disconnect", () => {
      setStatus("Disconnected");
    });

    socket.on("yaw_angle_update", (data) => {
      setYawAngle(data.yaw_angle);
      console.log("Received yaw angle:", data);
    });

    // Cleanup connection when component unmounts
    return () => {
      socket.disconnect();
    };
  }, []);

  const triggerDataFetch = () => {
    if (socketRef.current) {
      // Emit an event to request data from FastAPI
      socketRef.current.emit("request_data", {
        client_request: "Give me data",
      });
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>FastAPI to React via Socket.io</h1>
      <h1>Yaw Angle: {yawAngle} degrees</h1>
      <p>
        Connection Status: <strong>{status}</strong>
      </p>
      <button onClick={triggerDataFetch}>Request Live Data</button>
      <div>
        <h3>Payload from FastAPI:</h3>
        <p>{backendData || "No data received yet."}</p>
      </div>
    </div>
  );
}
