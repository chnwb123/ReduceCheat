import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ instructorId: string }> }
) {
    try {
        const { instructorId } = await params;
        console.log("Instructor Id: " + instructorId);
        const client = await clientPromise;
        const db = client.db("reduceCheat");
        const user = await db.collection("USER_T").findOne({
            role_id: instructorId
        });
        const instructorID = user?._id;
        console.log("Object Instructor ID for getting courses:" + instructorId);
        const examSessions = await db.collection("EXAM_QUESTION_T").find({ instructor_id: new ObjectId(instructorID) }).toArray();
        const currentTime = new Date();
        const endedExamSessions = examSessions.filter((session) => {
            const endDateTime = new Date(session.end_date_time);
            return currentTime > endDateTime;
        });
        return NextResponse.json(endedExamSessions);
    } catch (error) {
        console.error("Failed to fetch exam sessions:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}