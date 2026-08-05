"use client";
import { useState } from "react";
import * as React from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs, { Dayjs } from "dayjs";

export type ExamData = {
  title: string;
  description: string;
  date: string;
  duration: string;
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

function CustomTimePicker({
  maxHour,
  minuteInterval,
  setData,
}: {
  maxHour: number;
  minuteInterval: number;
  setData: React.Dispatch<React.SetStateAction<ExamData>>;
}) {
  // Initialize to "0 hours, 0 minutes" using a clean baseline time
  const [intervalValue, setIntervalValue] = React.useState<Dayjs | null>(
    dayjs().startOf("day"),
  );

  const handleIntervalChange = (newValue: Dayjs | null) => {
    setIntervalValue(newValue);

    if (newValue) {
      // Extract the isolated hour and minute values
      const hours = newValue.hour();
      const minutes = newValue.minute();
      const totalMinutes = hours * 60 + minutes;

      console.log(
        `Interval collected: ${hours}h ${minutes}m (Total: ${totalMinutes} mins)`,
      );

      // Update the parent component's state with the total duration in minutes
      setData((prev) => ({
        ...prev,
        duration: totalMinutes.toString(),
      }));
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <TimePicker
        label="Select Duration (Hours & Minutes)"
        value={intervalValue}
        onChange={handleIntervalChange}
        ampm={false} // Enforce 24-hour format so "PM" doesn't display
        minutesStep={minuteInterval} // Restrict minutes selection to the specified interval
        maxTime={dayjs().set("hour", maxHour).set("minute", 60)} // allow maximum of specified hours
        views={["hours", "minutes"]} // Filter out seconds
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
            className="w-full rounded-md border-2 border-black px-1 py-1 outline-none"
            type="text"
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
            className="w-full rounded-md border-2 border-black px-1 py-1 outline-none"
            type="text"
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
            className="w-24 rounded-md border-2 border-black px-1 py-1 outline-none"
            type="number"
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
            className="w-full rounded-md border-2 border-black px-1 py-1 outline-none"
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
            className="w-full rounded-md border-2 border-black px-1 py-1 outline-none"
            type="text"
            placeholder="Objective Question Title"
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
            className="border-2 border-black px-1 py-1 md:rounded"
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
            className="w-full rounded-md border-2 border-black px-1 py-1 outline-none"
            value={correctAnswer}
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
            className="w-24 rounded-md border-2 border-black px-1 py-1 outline-none"
            type="number"
            placeholder="Marks"
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
}: {
  index: number;
  data: SectionData;
  onChange: (index: number, patch: Partial<SectionData>) => void;
  onRemove: (index: number) => void;
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
                onChange={(e) =>
                  onChange(index, { sectionTitle: e.target.value })
                }
                className="w-full rounded-md border-2 border-black px-1 py-1 outline-none"
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
                  className="w-full rounded-md border-2 border-black px-1 py-1 outline-none"
                  type="text"
                  placeholder="Section Description"
                />
              </td>
            )}
            <td className="pl-2">
              <button
                type="button"
                className="border-2 border-black px-1 py-1"
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
                className="border-2 border-black px-1 py-1"
                onClick={addObjectiveQuestion}
              >
                Add Objective Question
              </button>
            </td>
          </tr>

          <tr>
            <th>
              <label>Subjective Questions: {subjectiveQuestions.length}</label>
            </th>
            <td className="pl-2">
              <button
                type="button"
                className="border-2 border-black px-1 py-1"
                onClick={addSubjectiveQuestion}
              >
                Add Subjective Question
              </button>
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

export default function CreateQuestionForm() {
  const [examData, setExamData] = useState<ExamData>({
    title: "",
    description: "",
    date: "",
    duration: "",
  });

  const [sections, setSections] = useState<SectionData[]>([
    {
      sectionTitle: "",
      sectionDescription: "",
      objectiveQuestions: [],
      subjectiveQuestions: [],
    },
  ]);

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
  };

  const removeSection = (index: number) => {
    setSections((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSection = (index: number, patch: Partial<SectionData>) => {
    setSections((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...patch };
      return copy;
    });
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const payload = {
      examData,
      sections,
    };
    console.log("Full exam payload:", payload);
    try {
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

  return (
    <div className="mt-15 p-4">
      <h1 className="mb-4 text-4xl font-bold">Create Exam</h1>

      <form onSubmit={handleSubmit}>
        <div className="mb-6 flex items-center gap-4">
          <label htmlFor="exam-title" className="flex-none text-lg font-bold">
            Exam Title:
          </label>
          <input
            id="exam-title"
            type="text"
            placeholder="Exam Title"
            value={examData.title}
            onChange={(e) =>
              setExamData({ ...examData, title: e.target.value })
            }
            className="w-full rounded-md border-2 border-black px-1 py-1 outline-none"
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
            placeholder="Exam Description"
            value={examData.description}
            onChange={(e) =>
              setExamData({ ...examData, description: e.target.value })
            }
            className="w-full rounded-md border-2 border-black px-1 py-1 outline-none"
          />
        </div>

        <div className="mb-6 flex items-center gap-4">
          <label htmlFor="exam-date" className="flex-none text-lg font-bold">
            Exam Date:
          </label>
          <input
            id="exam-date"
            type="date"
            placeholder="Exam Date"
            value={examData.date}
            onChange={(e) => setExamData({ ...examData, date: e.target.value })}
            className="w-full rounded-md border-2 border-black px-1 py-1 outline-none"
          />
        </div>

        <div className="mb-6 flex items-center gap-4">
          <label
            htmlFor="exam-duration"
            className="flex-none text-lg font-bold"
          >
            Exam Duration:
          </label>
          <CustomTimePicker
            maxHour={3}
            minuteInterval={15}
            setData={setExamData}
          />
        </div>

        <div className="mb-4 flex items-center gap-2">
          <p className="text-lg font-bold">Sections: {sections.length}</p>
          <button
            type="button"
            className="rounded border-2 border-black px-3 py-1"
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
          />
        ))}

        <div className="mt-6 mb-4 rounded bg-gray-100 p-4">
          <p className="text-2xl font-bold">Total Exam Marks: {totalMarks}</p>
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
