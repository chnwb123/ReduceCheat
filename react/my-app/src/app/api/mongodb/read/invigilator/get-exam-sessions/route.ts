import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(
) {
    try {
        const client = await clientPromise;
        const db = client.db("reduceCheat");

        const currentTime = new Date();
        const examSessions = await db.collection("EXAM_QUESTION_T").find().toArray();
        const filteredSessions = examSessions.filter((session) => {
            const startDateTime = new Date(session.start_date_time);
            const endDateTime = new Date(session.end_date_time);
            return startDateTime <= currentTime && endDateTime >= currentTime;
        });
        return NextResponse.json(filteredSessions);
    } catch (error) {
        console.error("Failed to fetch exam sessions:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}