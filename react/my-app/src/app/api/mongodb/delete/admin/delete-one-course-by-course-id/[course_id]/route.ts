import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ course_id: string }> }
) {
    try {
        const { course_id } = await params;
        console.log("Deleting course with ID:", course_id);
        const client = await clientPromise;
        const db = client.db("reduceCheat");
        const deletedCourse = await db.collection("COURSE_T").deleteOne({ _id: new ObjectId(course_id) });

        if (!deletedCourse.deletedCount) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Course deleted successfully" });
    } catch (error) {
        console.error("Failed to delete course:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}