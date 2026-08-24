import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ examSessionId: string; studentRoleId: string }> }
) {
    try {
        const { examSessionId, studentRoleId } = await params;
        console.log("Exam Session Id: " + examSessionId);
        console.log("Student Role Id: " + studentRoleId);
        const client = await clientPromise;
        const db = client.db("reduceCheat");
        const studentExamAnswer = await db.collection("STUDENT_EXAM_ANSWER_SUBMISSION_T").find({ exam_question_id: new ObjectId(examSessionId), role_id: studentRoleId }).toArray();
        return NextResponse.json(studentExamAnswer);
    } catch (error) {
        console.error("Failed to fetch student exam answer:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}