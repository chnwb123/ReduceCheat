import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log(body);
        const email = body.payload;
        const client = await clientPromise;
        const db = client.db("reduceCheat");
        const query = {
            email: email,
        };
        const user = await db.collection("USER_T").findOne(query);
        if (user) {
            return NextResponse.json({ exists: true });
        } else {
            return NextResponse.json({ exists: false });
        }
    } catch (error) {
        console.error("Failed to fetch user:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}