"use client";
import { useState, useEffect } from "react";
import * as React from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs, { Dayjs } from "dayjs";
import { CourseDB } from "@/app/api/mongodb/write/admin/create-one-course/route";
import { UserDB } from "@/app/api/mongodb/write/admin/create-one-user/route";
import { validateSelectionNumber } from "@/app/admin/manage-course/[adminId]/page";

export type ExamData = {
  title: string;
  description: string;
  start_date_time: string;
  end_date_time: string;
  start_minutes: number;
  end_minutes: number;
  duration?: number;
  instructor_id: string;
  course_id: string;
};

export type ObjectiveQuestionData = {
  title: string;
  numOptions: number;
  options: string[];
  correctAnswer: string;
  marks: number;
};

export type SubjectiveQuestionData = {
  title: string;
  correctAnswer: string;
  marks: number;
};

export type SectionData = {
  sectionTitle: string;
  sectionDescription: string;
  objectiveQuestions: ObjectiveQuestionData[];
  subjectiveQuestions: SubjectiveQuestionData[];
};

type CreateQuestionFormProps = {
  instructorId: UserDB["role_id"] | string;
};

type SectionErrors = {
  objectiveQuestionsError: string;
  subjectiveQuestionsError: string;
};

function CustomTimePicker({
  minuteInterval,
  setData,
  type,
}: {
  minuteInterval: number;
  setData: React.Dispatch<React.SetStateAction<ExamData>>;
  type: "startDateTime" | "endDateTime";
}) {
  // Initialize to "0 hours, 0 minutes" using a clean baseline time
  const [intervalValue, setIntervalValue] = React.useState<Dayjs | null>(
    dayjs(),
  );

  const handleIntervalChange = (newValue: Dayjs | null) => {
    setIntervalValue(newValue);

    if (newValue) {
      // Extract the isolated date and time components
      const datePart = newValue.format("YYYY-MM-DD");
      const timePart = newValue.format("HH:mm");
      // convert time to 12 hour format with AM/PM
      const hours = newValue.hour();
      const minutes = newValue.minute();
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      const formattedTime = `${displayHours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
      const totalMinutes = hours * 60 + minutes;

      const formattedDateTime = `${datePart} ${formattedTime}`;

      console.log(
        `Interval collected: ${datePart} ${timePart} (Total: ${totalMinutes} mins)`,
      );

      console.log(
        `Formatted Time: ${formattedTime} (Hours: ${hours}, Minutes: ${minutes}, AM/PM: ${ampm})`,
      );

      // Update the parent component's state with the total duration in minutes
      setData((prev) => ({
        ...prev,
        [type === "startDateTime" ? "start_date_time" : "end_date_time"]:
          formattedDateTime,
        [type === "startDateTime" ? "start_minutes" : "end_minutes"]:
          totalMinutes,
      }));
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DateTimePicker
        label="Select Date & Time"
        minDateTime={dayjs()} // Prevent selecting past times
        value={intervalValue}
        onChange={handleIntervalChange}
        className="bg-white/35"
        minutesStep={minuteInterval} // Restrict minutes selection to the specified interval
      />
    </LocalizationProvider>
  );
}

function SubjectiveQuestion({
  index,
  data,
  onChange,
  onRemove,
}: {
  index: number;
  data: SubjectiveQuestionData;
  onChange: (index: number, patch: Partial<SubjectiveQuestionData>) => void;
  onRemove: (index: number) => void;
}) {
  const { title, correctAnswer, marks } = data;
  return (
    <>
      <tr>
        <td>--</td>
      </tr>

      <tr>
        <th>
          <label htmlFor={`s${index}-title`}>
            Subjective Question {index + 1}:
          </label>
        </th>
        <td className="pl-2">
          <input
            id={`s${index}-title`}
            className="w-full rounded-md border-2 border-white px-1 py-1 outline-none"
            type="text"
            required
            placeholder="Subjective Question Title"
            value={title}
            onChange={(e) => onChange(index, { title: e.target.value })}
            name={`subjective[${index}].title`}
          />
        </td>
      </tr>

      <tr>
        <th>
          <label htmlFor={`s${index}-answer`}>Correct Answer:</label>
        </th>
        <td className="pl-2">
          <input
            id={`s${index}-answer`}
            className="w-full rounded-md border-2 border-white px-1 py-1 outline-none"
            type="text"
            required
            placeholder="Correct Answer"
            value={correctAnswer}
            onChange={(e) => onChange(index, { correctAnswer: e.target.value })}
            name={`subjective[${index}].correctAnswer`}
          />
        </td>
      </tr>

      <tr>
        <th>
          <label htmlFor={`s${index}-marks`}>Marks:</label>
        </th>
        <td className="flex items-center gap-2">
          <input
            id={`s${index}-marks`}
            className="w-24 rounded-md border-2 border-white px-1 py-1 outline-none"
            type="text"
            inputMode="numeric"
            placeholder="Marks"
            value={marks}
            onChange={(e) =>
              onChange(index, { marks: Number(e.target.value) || 0 })
            }
            name={`subjective[${index}].marks`}
          />
          <button
            type="button"
            className="text-sm text-red-600"
            onClick={() => onRemove(index)}
          >
            Remove
          </button>
        </td>
      </tr>
    </>
  );
}

function ObjectiveQuestion({
  index,
  data,
  onChange,
  onRemove,
}: {
  index: number;
  data: ObjectiveQuestionData;
  onChange: (index: number, patch: Partial<ObjectiveQuestionData>) => void;
  onRemove: (index: number) => void;
}) {
  const { title, numOptions, options, correctAnswer, marks } = data;

  const setOptionValue = (optIndex: number, value: string) => {
    const next = [...options];
    next[optIndex] = value;
    onChange(index, { options: next });
  };

  const addOption = () =>
    onChange(index, { numOptions: numOptions + 1, options: [...options, ""] });
  const setTitle = (v: string) => onChange(index, { title: v });
  const setCorrect = (v: string) => onChange(index, { correctAnswer: v });
  const setMarks = (v: number) => onChange(index, { marks: v });

  const optionRows = Array.from({ length: numOptions }, (_, i) => {
    const label = String.fromCharCode(65 + i);
    return (
      <tr key={label}>
        <th>
          <label htmlFor={`q${index}-opt-${label}`}>{label}</label>
        </th>
        <td className="pl-2">
          <input
            id={`q${index}-opt-${label}`}
            className="w-full rounded-md border-2 border-white px-1 py-1 outline-none"
            required
            type="text"
            placeholder={`Option ${label}`}
            value={options[i] ?? ""}
            onChange={(e) => setOptionValue(i, e.target.value)}
            name={`objective[${index}].options[${i}]`}
          />
        </td>
      </tr>
    );
  });

  return (
    <>
      <tr>
        <td>--</td>
      </tr>

      <tr>
        <th>
          <label htmlFor={`q${index}-title`}>
            Objective Question {index + 1}:
          </label>
        </th>
        <td className="pl-2">
          <input
            id={`q${index}-title`}
            className="w-full rounded-md border-2 border-white px-1 py-1 outline-none"
            type="text"
            placeholder="Objective Question Title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            name={`objective[${index}].title`}
          />
        </td>
      </tr>

      <tr>
        <th>
          <label>Objective Selection:</label>
        </th>
        <td className="flex items-center gap-2 pl-2">
          <button
            type="button"
            className="border-2 border-black text-black bg-white px-1 py-1 md:rounded"
            onClick={addOption}
          >
            Add Option
          </button>
          <button
            type="button"
            className="text-sm text-red-600"
            onClick={() => onRemove(index)}
          >
            Remove
          </button>
        </td>
      </tr>

      {optionRows}

      <tr>
        <th>
          <label htmlFor={`q${index}-answer`}>Correct Answer:</label>
        </th>
        <td>
          <select
            id={`q${index}-answer`}
            className="w-full rounded-md border-2 border-white text-black bg-white px-1 py-1 outline-none"
            value={correctAnswer}
            required
            onChange={(e) => setCorrect(e.target.value)}
            name={`objective[${index}].correctAnswer`}
          >
            <option value="">Select Correct Answer</option>
            {Array.from({ length: numOptions }, (_, i) => {
              const label = String.fromCharCode(65 + i);
              const text = options[i] ?? "";
              return (
                <option key={label} value={label} disabled={!text.trim()}>
                  {label}. {text || "(empty)"}
                </option>
              );
            })}
          </select>
        </td>
      </tr>

      <tr>
        <th>
          <label htmlFor={`q${index}-marks`}>Marks:</label>
        </th>
        <td>
          <input
            id={`q${index}-marks`}
            className="w-24 rounded-md border-2 border-white px-1 py-1 outline-none"
            type="text"
            inputMode="numeric"
            placeholder="Marks"
            required
            value={marks}
            onChange={(e) => setMarks(Number(e.target.value) || 0)}
            name={`objective[${index}].marks`}
          />
        </td>
      </tr>
    </>
  );
}

function Form({
  index,
  data,
  onChange,
  onRemove,
  errors,
}: {
  index: number;
  data: SectionData;
  onChange: (index: number, patch: Partial<SectionData>) => void;
  onRemove: (index: number) => void;
  errors: SectionErrors;
}) {
  const {
    sectionTitle,
    sectionDescription,
    objectiveQuestions,
    subjectiveQuestions,
  } = data;
  const [displaySectionDescription, setDisplaySectionDescription] =
    useState(!!sectionDescription);

  // helpers to add/remove questions
  const addObjectiveQuestion = () => {
    onChange(index, {
      objectiveQuestions: [
        ...objectiveQuestions,
        {
          title: "",
          numOptions: 1,
          options: [""],
          correctAnswer: "",
          marks: 0,
        },
      ],
    });
  };

  const removeObjectiveQuestion = (qIndex: number) => {
    onChange(index, {
      objectiveQuestions: objectiveQuestions.filter((_, i) => i !== qIndex),
    });
  };

  const addSubjectiveQuestion = () => {
    onChange(index, {
      subjectiveQuestions: [
        ...subjectiveQuestions,
        { title: "", correctAnswer: "", marks: 0 },
      ],
    });
  };

  const removeSubjectiveQuestion = (qIndex: number) => {
    onChange(index, {
      subjectiveQuestions: subjectiveQuestions.filter((_, i) => i !== qIndex),
    });
  };

  // update functions for nested questions
  const updateObjectiveQuestion = (
    qIndex: number,
    patch: Partial<ObjectiveQuestionData>,
  ) => {
    const copy = objectiveQuestions.map((q) => ({ ...q }));
    copy[qIndex] = { ...copy[qIndex], ...patch };
    if (typeof copy[qIndex].numOptions === "number") {
      const desired = copy[qIndex].numOptions;
      copy[qIndex].options = copy[qIndex].options ?? [];
      while (copy[qIndex].options.length < desired)
        copy[qIndex].options.push("");
      if (copy[qIndex].options.length > desired)
        copy[qIndex].options = copy[qIndex].options.slice(0, desired);
    }
    onChange(index, { objectiveQuestions: copy });
  };

  const updateSubjectiveQuestion = (
    qIndex: number,
    patch: Partial<SubjectiveQuestionData>,
  ) => {
    const copy = subjectiveQuestions.map((q) => ({ ...q }));
    copy[qIndex] = { ...copy[qIndex], ...patch };
    onChange(index, { subjectiveQuestions: copy });
  };

  const toggleSectionDescription = () => {
    setDisplaySectionDescription((prev) => !prev);
    if (displaySectionDescription) {
      onChange(index, { sectionDescription: "" });
    }
  };

  const totalObjectiveMarks = objectiveQuestions.reduce(
    (sum, q) => sum + (q.marks || 0),
    0,
  );
  const totalSubjectiveMarks = subjectiveQuestions.reduce(
    (sum, q) => sum + (q.marks || 0),
    0,
  );
  const totalMarks = totalObjectiveMarks + totalSubjectiveMarks;

  return (
    <div className="mb-8 rounded-md border-2 border-gray-400 p-4">
      <h2 className="mb-4 text-2xl font-bold">Section {index + 1}</h2>
      <table className="w-full border-separate border-spacing-y-2">
        <tbody>
          <tr>
            <th>
              <label htmlFor={`sec${index}-title`}>Section Title:</label>
            </th>
            <td className="pl-2">
              <input
                id={`sec${index}-title`}
                value={sectionTitle}
                required
                onChange={(e) =>
                  onChange(index, { sectionTitle: e.target.value })
                }
                className="w-full rounded-md border-2 border-white px-1 py-1 outline-none"
                type="text"
                placeholder="Section Title"
              />
            </td>
          </tr>

          <tr>
            <th>
              <label>Section Description:</label>
            </th>
            {displaySectionDescription && (
              <td className="pl-2">
                <input
                  value={sectionDescription}
                  onChange={(e) =>
                    onChange(index, { sectionDescription: e.target.value })
                  }
                  required={displaySectionDescription}
                  className="w-full rounded-md border-2 border-white px-1 py-1 outline-none"
                  type="text"
                  placeholder="Section Description"
                />
              </td>
            )}
            <td className="pl-2">
              <button
                type="button"
                className="border-2 border-white text-black bg-white px-1 py-1"
                onClick={toggleSectionDescription}
              >
                {displaySectionDescription ? "Remove" : "Add"} Description
              </button>
            </td>
          </tr>

          <tr>
            <th>
              <label>Objective Questions: {objectiveQuestions.length}</label>
            </th>
            <td className="pl-2">
              <button
                type="button"
                className="border-2 border-white text-black bg-white px-1 py-1"
                onClick={addObjectiveQuestion}
              >
                Add Objective Question
              </button>
              {errors.objectiveQuestionsError && (
                <p className="mt-2 text-sm font-semibold tracking-wider text-red-400">
                  {errors.objectiveQuestionsError}
                </p>
              )}
            </td>
          </tr>

          <tr>
            <th>
              <label>Subjective Questions: {subjectiveQuestions.length}</label>
            </th>
            <td className="pl-2">
              <button
                type="button"
                className="border-2 border-white text-black bg-white px-1 py-1"
                onClick={addSubjectiveQuestion}
              >
                Add Subjective Question
              </button>
              {errors.subjectiveQuestionsError && (
                <p className="mt-2 text-sm font-semibold tracking-wider text-red-400">
                  {errors.subjectiveQuestionsError}
                </p>
              )}
            </td>
          </tr>

          {objectiveQuestions.map((q, i) => (
            <ObjectiveQuestion
              key={i}
              index={i}
              data={q}
              onChange={updateObjectiveQuestion}
              onRemove={removeObjectiveQuestion}
            />
          ))}

          {subjectiveQuestions.map((q, i) => (
            <SubjectiveQuestion
              key={i}
              index={i}
              data={q}
              onChange={updateSubjectiveQuestion}
              onRemove={removeSubjectiveQuestion}
            />
          ))}
        </tbody>
      </table>

      <p className="mt-4 text-lg font-bold">
        Section Total Marks: {totalMarks}
      </p>

      <button
        type="button"
        className="mt-2 text-sm text-red-600"
        onClick={() => onRemove(index)}
      >
        Remove This Section
      </button>
    </div>
  );
}

export default function CreateQuestionForm({
  instructorId,
  setIsSubmitted,
  isSubmitted,
}: {
  instructorId: string;
  setIsSubmitted: React.Dispatch<React.SetStateAction<boolean>>;
  isSubmitted: boolean;
}) {
  const [instructorCourses, setInstructorCourses] = useState<CourseDB[]>([]);

  const [examData, setExamData] = useState<ExamData>({
    title: "",
    description: "",
    start_date_time: "",
    end_date_time: "",
    instructor_id: String(instructorId),
    course_id: "",
    start_minutes: 0,
    end_minutes: 0,
  });

  const [sections, setSections] = useState<SectionData[]>([
    {
      sectionTitle: "",
      sectionDescription: "",
      objectiveQuestions: [],
      subjectiveQuestions: [],
    },
  ]);

  const [errors, setErrors] = useState<SectionErrors[]>([
    { objectiveQuestionsError: "", subjectiveQuestionsError: "" },
  ]);

  const [dateTimeError, setDateTimeError] = useState<string>("");
  const [totalMarksError, setTotalMarksError] = useState<string>("");

  const addSection = () => {
    setSections((prev) => [
      ...prev,
      {
        sectionTitle: "",
        sectionDescription: "",
        objectiveQuestions: [],
        subjectiveQuestions: [],
      },
    ]);
    setErrors((prev) => [
      ...prev,
      { objectiveQuestionsError: "", subjectiveQuestionsError: "" },
    ]);
  };

  const removeSection = (index: number) => {
    setSections((prev) => prev.filter((_, i) => i !== index));
    setErrors((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSection = (index: number, patch: Partial<SectionData>) => {
    setSections((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...patch };
      return copy;
    });
  };

  const totalMarks = sections.reduce((sum, section) => {
    const obj = section.objectiveQuestions.reduce(
      (s, q) => s + (q.marks || 0),
      0,
    );
    const subj = section.subjectiveQuestions.reduce(
      (s, q) => s + (q.marks || 0),
      0,
    );
    return sum + obj + subj;
  }, 0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const payload = {
      examData,
      sections,
    };
    console.log("Full exam payload:", payload);

    const validateDateTime = (start: string, end: string) => {
      const startDate = new Date(start);
      const endDate = new Date(end);
      console.log(
        `Validating DateTime: Start - ${startDate.getTime()}, End - ${endDate.getTime()}`,
      );

      if (startDate.getTime() >= endDate.getTime()) {
        return "Start date/time must be before end date/time";
      } else if (startDate.getTime() === endDate.getTime()) {
        return "Start date/time and end date/time cannot be the same";
      } else if (
        (endDate.getTime() - startDate.getTime()) % (15 * 60 * 1000) !==
        0
      ) {
        return "The difference between start and end date/time must be in intervals of 15 minutes";
      }
      return "";
    };

    const dateTimeError = validateDateTime(
      examData.start_date_time,
      examData.end_date_time,
    );
    setDateTimeError(dateTimeError);

    if (dateTimeError) {
      return;
    }

    const sectionErrors = sections.map((section) => ({
      objectiveQuestionsError: validateSelectionNumber(
        section.objectiveQuestions.length,
        "Objective Questions",
      ),
      subjectiveQuestionsError: validateSelectionNumber(
        section.subjectiveQuestions.length,
        "Subjective Questions",
      ),
    }));

    setErrors(sectionErrors);

    if (
      sectionErrors.some(
        (sectionError) =>
          sectionError.objectiveQuestionsError.length > 0 ||
          sectionError.subjectiveQuestionsError.length > 0,
      )
    ) {
      return;
    }

    const validateTotalMarks = (totalMarks: number) => {
      if (totalMarks > 100 || totalMarks < 100) {
        return "Total Marks should be equal to 100.";
      }
      return "";
    };

    const totalMarksValidation = validateTotalMarks(totalMarks);
    setTotalMarksError(totalMarksValidation);

    if (totalMarksValidation) {
      return;
    }

    try {
      setIsSubmitted(!isSubmitted);
      const response = await fetch(
        "/api/mongodb/write/instructor/create-one-exam-question",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ payload: payload }),
        },
      );
      console.log("Response from backend:", await response.json());
    } catch (error) {
      console.error("Error creating exam question:", error);
    }
  }

  useEffect(() => {
    if (!instructorId) {
      return;
    }

    const getInstructorCourses = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/mongodb/read/instructor/get-courses-of-instructor/${String(instructorId)}`,
          {
            cache: "no-store",
          },
        );

        if (response.ok) {
          const instructorCoursesData = await response.json();
          setInstructorCourses(instructorCoursesData);
          setExamData((prev) => ({
            ...prev,
            instructor_id: String(instructorId),
          }));
          console.log("Fetched instructor courses:", instructorCoursesData);
        }
      } catch (error) {
        console.error("Failed to fetch instructor courses:", error);
      }
    };

    getInstructorCourses();
  }, [instructorId]);

  return (
    <div className="p-4 text-white tracking-tight">
      <form onSubmit={handleSubmit}>
        <div className="mb-6 flex items-center gap-4">
          <label htmlFor="exam-title" className="flex-none text-lg font-bold">
            Course:
          </label>
          <select
            id={`course-select`}
            required
            className="w-full rounded-md border-2 border-white text-white px-1 py-1 outline-none"
            value={examData.course_id}
            onChange={(e) =>
              setExamData({ ...examData, course_id: e.target.value })
            }
            name="course_id"
          >
            <option value="" className="text-black">
              Select Course
            </option>
            {Array.from({ length: instructorCourses.length }, (_, i) => {
              const text = instructorCourses[i]?.name || "";
              return (
                <option
                  className="text-black"
                  key={i}
                  value={String(instructorCourses[i]?._id)}
                >
                  {text || "(empty)"}
                </option>
              );
            })}
          </select>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <label htmlFor="exam-title" className="flex-none text-lg font-bold">
            Exam Title:
          </label>
          <input
            id="exam-title"
            type="text"
            required
            placeholder="Exam Title"
            value={examData.title}
            onChange={(e) =>
              setExamData({ ...examData, title: e.target.value })
            }
            className="w-full rounded-md border-2 border-white px-1 py-1 outline-none"
          />
        </div>

        <div className="mb-6 flex items-center gap-4">
          <label
            htmlFor="exam-description"
            className="flex-none text-lg font-bold"
          >
            Exam Description:
          </label>
          <input
            id="exam-description"
            type="text"
            required
            placeholder="Exam Description"
            value={examData.description}
            onChange={(e) =>
              setExamData({ ...examData, description: e.target.value })
            }
            className="w-full rounded-md border-2 border-white px-1 py-1 outline-none"
          />
        </div>

        <div className="mb-6 flex items-center gap-4">
          <label htmlFor="exam-date" className="flex-none text-lg font-bold">
            Exam Start Date Time:
          </label>
          <CustomTimePicker
            minuteInterval={15}
            setData={setExamData}
            type={"startDateTime"}
          />
          {dateTimeError && (
            <p className="mt-2 text-sm font-semibold tracking-wider text-red-400">
              {dateTimeError}
            </p>
          )}
        </div>

        <div className="mb-6 flex items-center gap-4">
          <label htmlFor="exam-date" className="flex-none text-lg font-bold">
            Exam End Date Time:
          </label>
          <CustomTimePicker
            minuteInterval={15}
            setData={setExamData}
            type={"endDateTime"}
          />
        </div>

        <div className="mb-4 flex items-center gap-2">
          <p className="text-lg font-bold">Sections: {sections.length}</p>
          <button
            type="button"
            className="rounded border-2 border-black text-black bg-white px-3 py-1"
            onClick={addSection}
          >
            Add Section
          </button>
        </div>

        {sections.map((section, i) => (
          <Form
            key={i}
            index={i}
            data={section}
            onChange={updateSection}
            onRemove={removeSection}
            errors={
              errors[i] ?? {
                objectiveQuestionsError: "",
                subjectiveQuestionsError: "",
              }
            }
          />
        ))}

        <div className="mt-6 mb-4 rounded bg-gray-100 text-black p-4">
          <p className="text-2xl font-bold">Total Exam Marks: {totalMarks}</p>
          <span className="text-sm font-semibold tracking-wider text-red-400">
            {" "}
            {totalMarksError}{" "}
          </span>
        </div>

        <button
          type="submit"
          className="rounded-md bg-blue-600 px-6 py-3 text-lg font-medium text-white hover:bg-blue-700"
        >
          Submit Exam
        </button>
      </form>
    </div>
  );
}
