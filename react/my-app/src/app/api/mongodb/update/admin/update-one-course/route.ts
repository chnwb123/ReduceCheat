import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { CourseDB } from "@/app/api/mongodb/write/admin/create-one-course/route";

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        console.log(body);
        const courseId = body.payload.editingId;
        const updateCourseDetails = body.payload.editingCourseDetails;
        console.log("Course ID: ", courseId);
        console.log("Updated Course Details: ", updateCourseDetails);


        const client = await clientPromise;
        const db = client.db("reduceCheat");

        const users = db.collection<CourseDB>("COURSE_T");

        const now = new Date();
        const malaysiaTime = now.toLocaleString("en-MY", {
            timeZone: "Asia/Kuala_Lumpur",
        });

        const newUser = await users.updateOne(
            { _id: new ObjectId(courseId) },
            {
                $set: {
                    name: updateCourseDetails.name,
                    description: updateCourseDetails.description,
                    instructor_id: new ObjectId(updateCourseDetails.instructor_id),
                    student_ids: updateCourseDetails.student_ids.map((id: string) => new ObjectId(id)),
                    updated_at: malaysiaTime
                }
            }
        );
        return NextResponse.json({ success: true, modifiedCount: newUser.modifiedCount }, { status: 200 });
    } catch (error) {
        console.error("Failed to update course:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}