import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { UserDB } from "@/app/api/mongodb/write/admin/create-one-user/route";

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        console.log(body);
        const userId = body.payload;
        console.log("User ID: ", userId);

        const client = await clientPromise;
        const db = client.db("reduceCheat");

        const users = db.collection<UserDB>("USER_T");

        const now = new Date();
        const malaysiaTime = now.toLocaleString("en-MY", {
            timeZone: "Asia/Kuala_Lumpur",
        });

        const newUser = await users.updateOne(
            { _id: new ObjectId(userId) },
            {
                $set: {
                    authenticated: "true",
                    updated_at: malaysiaTime
                }
            }
        );
        return NextResponse.json({ success: true, modifiedCount: newUser.modifiedCount }, { status: 200 });
    } catch (error) {
        console.error("Failed to update user:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}