import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db("reduceCheat");
        const users = await db.collection("USER_T").find({}).toArray();
        return NextResponse.json(users);
    } catch (error) {
        console.error("Failed to fetch users:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}