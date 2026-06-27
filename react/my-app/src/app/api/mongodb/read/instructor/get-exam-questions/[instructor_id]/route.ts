import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ instructor_id: string }> }
) {
    try {
        const { instructor_id } = await params;
        console.log(instructor_id);
        const client = await clientPromise;
        const db = client.db("reduceCheat");
        const query = {
            question_id: instructor_id,
        };
        const examQuestions = await db.collection("EXAM_QUESTION_T").find(query).toArray();
        return NextResponse.json(examQuestions);
    } catch (error) {
        console.error("Failed to fetch exam questions:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}