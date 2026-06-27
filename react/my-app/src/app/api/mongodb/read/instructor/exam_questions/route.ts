import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db("reduceCheat");
        const restaurants = await db.collection("EXAM_QUESTION_T").find({}).toArray();
        return NextResponse.json(restaurants);
    } catch (error) {
        console.error("Failed to fetch exam questions:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}