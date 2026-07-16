import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db("reduceCheat");
        const query = { roleType: "Student" };
        const students = await db.collection("USER_T").find(query).toArray();
        return NextResponse.json(students);
    } catch (error) {
        console.error("Failed to fetch students:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}