import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { User } from "@/app/admin/manage-user/[adminId]/page";
import bcrypt from 'bcrypt';

export interface UserDB {
    _id?: ObjectId | string;
    name: User["role"]["name"];
    dob: User["role"]["dob"];
    email: User["role"]["email"];
    role_type: User["roleType"];
    role_id?: User["roleId"];
    username: User["username"];
    password: User["password"];
    authenticated?: string;
    created_at: string;
    updated_at?: string;
}

async function getLatestRoleId(roleType: User["roleType"]): Promise<string | undefined> {
    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/mongodb/read/admin/get-latest-role-id/${roleType}`,
            {
                cache: "no-store",
            },
        );

        if (response.ok) {
            const latestRoleId = await response.json();
            console.log("Latest role ID:", latestRoleId.latestRoleId);
            return latestRoleId.latestRoleId?.toString();
        }
    } catch (error) {
        console.error("Failed to get latest role ID:", error);
    }
}

function formatRoleId(roleType: User["roleType"], roleId: string): string {
    const prefixMap: Record<User["roleType"], string> = {
        "": "",
        Student: "STU_",
        Instructor: "INS_",
        Admin: "ADM_",
        Invigilator: "INV_",
    };
    return prefixMap[roleType] + roleId;
}

function formatUsername(roleType: User["roleType"], roleId: string): string {
    const prefixMap: Record<User["roleType"], string> = {
        "": "",
        Student: "STU",
        Instructor: "INS",
        Admin: "ADM",
        Invigilator: "INV",
    };
    return prefixMap[roleType] + roleId;
}

export async function POST(request: Request) {
    try {
        const saltRounds = 10;

        const body = await request.json();
        console.log(body);
        const userData = body.payload.userDetails;
        console.log(userData);

        const roleId = await getLatestRoleId(userData.roleType);
        const formattedRoleId = roleId ? formatRoleId(userData.roleType, roleId) : undefined;
        const formattedUsername = roleId ? formatUsername(userData.roleType, roleId) : undefined;
        const password = userData.password
        const hashedPassword = await bcrypt.hash(password, saltRounds);
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
            role_id: formattedRoleId,
            username: formattedUsername,
            password: hashedPassword,
            authenticated: "false",
            created_at: malaysiaTime
        });
        return NextResponse.json({ success: true, insertedId: newUser.insertedId }, { status: 201 });
    } catch (error) {
        console.error("Failed to create user:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}