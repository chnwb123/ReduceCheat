import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ roleType: string }> }
) {
    try {
        const { roleType } = await params;
        console.log("Getting latest role ID for type:", roleType);
        const client = await clientPromise;
        const db = client.db("reduceCheat");
        const latestRoleRecord = await db.collection("USER_T").findOne({
            role_type: roleType,
        }, {sort: { created_at: -1}});
        let latestRoleId;
        if (latestRoleRecord == null) {
            latestRoleId = 1;
        } else {
            latestRoleId = latestRoleRecord?.role_id?.toString();
            console.log("Raw latest role ID:", latestRoleId);
            latestRoleId = latestRoleId.substring(4);
            latestRoleId = parseInt(latestRoleId) + 1;
        }
        
        return NextResponse.json({ latestRoleId: latestRoleId });
    } catch (error) {
        console.error("Failed to get latest role ID:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}