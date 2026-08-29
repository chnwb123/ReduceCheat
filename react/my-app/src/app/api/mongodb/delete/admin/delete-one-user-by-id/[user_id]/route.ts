import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ user_id: string }> }
) {
    try {
        const { user_id } = await params;
        console.log("Deleting user with ID:", user_id);
        const client = await clientPromise;
        const db = client.db("reduceCheat");
        const deletedUser = await db.collection("USER_T").deleteOne({ _id: new ObjectId(user_id) });

        if (!deletedUser.deletedCount) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Failed to delete user:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}