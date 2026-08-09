import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ roleId: string }> }
) {
    try {
        const { roleId } = await params;
        console.log("Roles ID for getting upcoming exams:" + roleId);
        const client = await clientPromise;
        const db = client.db("reduceCheat");
        const user = await db.collection("USER_T").findOne({
            role_id: roleId
        });
        const studentId = user?._id;
        console.log("Object Student ID for getting upcoming exams:" + studentId);
        const courses = await db.collection("EXAM_QUESTION_T").aggregate([
            {
                $lookup: {
                    from: "COURSE_T",
                    localField: "course_id",
                    foreignField: "_id",
                    as: "course_plus_exam_details"
                }
            },
            {
                $match: {
                    "course_plus_exam_details.student_ids": new ObjectId(studentId)
                }
            }
        ]).toArray();
        return NextResponse.json(courses);
    } catch (error) {
        console.error("Failed to fetch exam questions:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}