import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { Course } from "@/app/admin/manage-course/page";

export interface CourseDB {
    _id?: ObjectId;
    name: Course["name"];
    description: Course["description"];
    createdAt: string;
    updatedAt?: string;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log(body);
        const courseData = body.payload.courseDetails;
        console.log(courseData);

        const client = await clientPromise;
        const db = client.db("reduceCheat");

        const users = db.collection<CourseDB>("COURSE_T");

        const now = new Date();
        const malaysiaTime = now.toLocaleString("en-MY", {
            timeZone: "Asia/Kuala_Lumpur",
        });

        const newUser = await users.insertOne({
            name: courseData.name,
            description: courseData.description,
            createdAt: malaysiaTime
        });
        return NextResponse.json({ success: true, insertedId: newUser.insertedId }, { status: 201 });
    } catch (error) {
        console.error("Failed to create course:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}