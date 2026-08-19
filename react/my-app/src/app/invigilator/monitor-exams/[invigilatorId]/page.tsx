"use client";
import { useState, useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { Navbar } from "@/components/general/navigation/top-menu/page";
import { UserDB } from "../../../api/mongodb/write/admin/create-one-user/route";

export interface InvigilatorPageProps {
  params: Promise<{ invigilatorId: UserDB["role_id"] }>;
  searchParams: Promise<{ name: UserDB["name"] }>;
}

export default function InvigilatorPage({
  params,
  searchParams,
}: InvigilatorPageProps) {
  const [invigilatorId, setInvigilatorId] = useState<UserDB["role_id"]>("");
  const [name, setName] = useState<UserDB["name"]>("");
  const [backendData, setBackendData] = useState("");
  const [yawAngle, setYawAngle] = useState("");
  const [status, setStatus] = useState("Disconnected");
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const getParams = async () => {
      const { invigilatorId } = await params;
      const { name } = await searchParams;
      console.log("Invigilator ID from params:", invigilatorId);
      console.log("Name from searchParams:", name);
      setInvigilatorId(invigilatorId);
      setName(name);
    };

    getParams();
  }, [params, searchParams]);

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
    <div className="flex min-h-screen w-full items-center justify-center bg-linear-to-br from-blue-900 via-indigo-500 to-blue-600 p-4">
      <Navbar
        navItems={[
          { label: "Home", href: `/invigilator/${invigilatorId}?name=${name}` },
          {
            label: "Monitor Exams",
            href: `/invigilator/monitor-exams/${invigilatorId}?name=${name}`,
          },
        ]}
      />
      <div className="relative mt-20 w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-2 py-4 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Monitor Exams
          </h1>
        </div>
        <div className="tracking-tight text-white">
          <div style={{ padding: "20px" }}>
            <h1>Yaw Angle: {yawAngle} degrees</h1>
            {/* <p>
              Connection Status: <strong>{status}</strong>
            </p>
            <button onClick={triggerDataFetch}>Request Live Data</button>
            <div>
              <h3>Payload from FastAPI:</h3>
              <p>{backendData || "No data received yet."}</p>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}
