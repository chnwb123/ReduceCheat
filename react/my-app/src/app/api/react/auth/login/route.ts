import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log(body);
        const username = body.payload.username;
        const password = body.payload.password;
        const client = await clientPromise;
        const db = client.db("reduceCheat");
        const query = {
            username: username,
            password: password,
        };
        const user = await db.collection("USER_T").findOne(query);
        if (user) {
            return NextResponse.json({ exists: true, role: user.role_type, role_id: user.role_id, name: user.name });
        } else {
            return NextResponse.json({ exists: false });
        }
    } catch (error) {
        console.error("Failed to fetch user:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}