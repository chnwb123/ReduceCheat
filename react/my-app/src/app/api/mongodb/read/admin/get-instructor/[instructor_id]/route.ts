import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ instructor_id: string }> }
) {
    try {
        const { instructor_id } = await params;
        console.log(instructor_id);
        const client = await clientPromise;
        const db = client.db("reduceCheat");
        const instructor = await db.collection("USER_T").findOne({
            _id: new ObjectId(instructor_id),
        });

        return NextResponse.json(instructor);
    } catch (error) {
        console.error("Failed to fetch exam questions:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}