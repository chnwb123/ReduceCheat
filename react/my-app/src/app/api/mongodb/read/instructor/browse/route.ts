import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("reduceCheat");

    const query = {
      "has_objective": true,
    };

    const data = await db
      .collection("EXAM_QUESTION_T")
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

