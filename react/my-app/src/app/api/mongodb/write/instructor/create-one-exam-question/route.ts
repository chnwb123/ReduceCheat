import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { ExamData, ObjectiveQuestionData, SubjectiveQuestionData, SectionData } from "@/components/instructor/form/create-question/page";

export interface ExamQuestionDB {
    _id?: ObjectId;
    instructor_id: ExamData["instructor_id"];
    course_id: ExamData["course_id"];
    title: ExamData["title"];
    description: ExamData["description"];
    start_date_time: ExamData["start_date_time"];
    end_date_time: ExamData["end_date_time"];
    duration: ExamData["duration"];
    number_of_section: number;
    sections: [{
        id: number;
        title: SectionData["sectionTitle"];
        description: SectionData["sectionDescription"];
        objective_questions: ObjectiveQuestionData[];
        subjective_questions: SubjectiveQuestionData[];
    }];
    created_at: string;
    updated_at?: string;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log(body);
        const examData = body.payload.examData;
        const sectionData = body.payload.sections;
        console.log(sectionData);

        const client = await clientPromise;
        const db = client.db("reduceCheat");

        const examQuestions = db.collection<ExamQuestionDB>("EXAM_QUESTION_T");

        const now = new Date();
        const malaysiaTime = now.toLocaleString("en-MY", {
            timeZone: "Asia/Kuala_Lumpur",
        });

        const newExamQuestion = await examQuestions.insertOne({
            title: examData.title,
            instructor_id: examData.instructor_id,
            course_id: examData.course_id,
            description: examData.description,
            start_date_time: examData.start_date_time,
            end_date_time: examData.end_date_time,
            duration: examData.end_minutes - examData.start_minutes,
            number_of_section: sectionData.length,
            sections: sectionData.map((section: SectionData, index: number) => ({
                id: index + 1,
                title: section.sectionTitle,
                description: section.sectionDescription,
                objective_questions: section.objectiveQuestions,
                subjective_questions: section.subjectiveQuestions
            })),
            created_at: malaysiaTime
        });
        return NextResponse.json({ success: true, insertedId: newExamQuestion.insertedId }, { status: 201 });
    } catch (error) {
        console.error("Failed to create exam question:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
