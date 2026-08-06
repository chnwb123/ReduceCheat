import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db("reduceCheat");
        const courses = await db.collection("COURSE_T").aggregate([
            {
                $lookup: {
                    from: "USER_T",
                    localField: "instructor_id",
                    foreignField: "_id",
                    as: "instructor_details"
                },
            },
            {
                $lookup: {
                    from: "USER_T",
                    localField: "student_ids",
                    foreignField: "_id",
                    as: "student_details"
                },
            },
            {
                $addFields: {
                    student_details: {
                        $sortArray: {
                            input: "$student_details",
                            sortBy: {
                                _id: 1
                            }
                        }
                    }
                }
            }
        ])
            .toArray();
        return NextResponse.json(courses);
    } catch (error) {
        console.error("Failed to fetch courses:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}