import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { User } from "@/app/admin/create-user/page";

export interface UserDB {
    _id?: ObjectId;
    name: User["role"]["name"];
    dob: User["role"]["dob"];
    email: User["role"]["email"];
    role_type: User["roleType"];
    username: User["username"];
    password: User["password"];
    created_at: string;
    updated_at?: string;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log(body);
        const userData = body.payload.userDetails;
        console.log(userData);

        const client = await clientPromise;
        const db = client.db("reduceCheat");

        const users = db.collection<UserDB>("USER_T");

        const now = new Date();
        const malaysiaTime = now.toLocaleString("en-MY", {
            timeZone: "Asia/Kuala_Lumpur",
        });

        const newUser = await users.insertOne({
            name: userData.role.name,
            dob: userData.role.dob,
            email: userData.role.email,
            role_type: userData.roleType,
            username: userData.username,
            password: userData.password,
            created_at: malaysiaTime
        });
        return NextResponse.json({ success: true, insertedId: newUser.insertedId }, { status: 201 });
    } catch (error) {
        console.error("Failed to create user:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}