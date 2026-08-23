import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ examQuestionId: string }> }
) {
    try {
        const { examQuestionId } = await params;
        console.log("Exam Question Id: " + examQuestionId);
        const client = await clientPromise;
        const db = client.db("reduceCheat");
        const studentAnalysisPerformance = await db.collection("EXAM_ANALYSIS_T").find({ exam_question_id: new ObjectId(examQuestionId) }).toArray();
        return NextResponse.json(studentAnalysisPerformance);
    } catch (error) {
        console.error("Failed to fetch student analysis performance:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}