import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ roleType: string }> }
) {
    try {
        const { roleType } = await params;
        console.log(roleType);
        const client = await clientPromise;
        const db = client.db("reduceCheat");
        const users = await db.collection("USER_T").find({ roleType: roleType }).toArray();

        return NextResponse.json(users);
    } catch (error) {
        console.error("Failed to fetch exam questions:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}