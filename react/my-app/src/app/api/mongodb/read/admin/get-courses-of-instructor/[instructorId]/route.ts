import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ instructorId: string }> }
) {
    try {
        const { instructorId } = await params;
        console.log(instructorId);
        const client = await clientPromise;
        const db = client.db("reduceCheat");
        const courses = await db.collection("COURSE_T").find({ instructor_id: new ObjectId(instructorId) }).toArray();

        return NextResponse.json(courses);
    } catch (error) {
        console.error("Failed to fetch courses:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}