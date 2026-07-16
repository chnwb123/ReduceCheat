import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log(body);
        const studentIds = body.payload;
        console.log(studentIds);

        const client = await clientPromise;
        const db = client.db("reduceCheat");

        const query = {
            "_id": { $in: studentIds.map((id: string) => new ObjectId(id)) }
        };

        const data = await db
            .collection("USER_T")
            .find(query)
            .toArray();

        return NextResponse.json(data);
    } catch {
        return NextResponse.json(
            { error: "Failed to fetch data" },
            { status: 500 }
        );
    }
}

