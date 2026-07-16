"use client";
import { useEffect, useState } from "react";
import { UserDB } from "@/app/api/mongodb/write/admin/create-one-user/route";
import { CourseDB } from "@/app/api/mongodb/write/admin/create-one-course/route";

export type Course = {
  id?: number;
  name: string;
  description: string;
  instructor_id?: string;
  student_ids?: string[];
};

const EMPTY_STUDENT_IDS: string[] = [];

function CreateCourseModule({
  courseDetails,
  setCourseDetails,
}: {
  courseDetails: Course;
  setCourseDetails: React.Dispatch<React.SetStateAction<Course>>;
}) {
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const payload = {
      courseDetails,
    };
    console.log("Full course payload:", payload);
    try {
      const response = await fetch(
        "/api/mongodb/write/admin/create-one-course",
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
      console.error("Error creating course:", error);
    } finally {
      setCourseDetails({ name: "", description: "" });
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Course Name"
        value={courseDetails.name}
        onChange={(e) =>
          setCourseDetails({ ...courseDetails, name: e.target.value })
        }
      />
      <input
        type="text"
        placeholder="Course Description"
        value={courseDetails.description}
        onChange={(e) =>
          setCourseDetails({ ...courseDetails, description: e.target.value })
        }
      />
      <button type="submit">Create Course</button>
    </form>
  );
}

function CourseModuleCRUD({
  courses,
  setCourses,
  setSelectedCourse,
}: {
  courses: CourseDB[];
  setCourses: React.Dispatch<React.SetStateAction<CourseDB[]>>;
  setSelectedCourse: React.Dispatch<React.SetStateAction<CourseDB[]>>;
}) {
  const [courseDetails, setCourseDetails] = useState<Course>({
    name: "",
    description: "",
    instructor_id: "",
    student_ids: [],
  });

  useEffect(() => {
    const getCourses = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/mongodb/read/admin/get-courses`,
          {
            cache: "no-store",
          },
        );

        if (response.ok) {
          const coursesData = await response.json();
          setCourses(coursesData);
        }
      } catch (error) {
        console.error("Failed to fetch courses:", error);
      }
    };
    getCourses();
  }, [setCourses, courseDetails]); // Re-fetch courses when courseDetails change, to reflect new additions

  return (
    <div>
      <CreateCourseModule
        courseDetails={courseDetails}
        setCourseDetails={setCourseDetails}
      />
      <ul>
        {courses.map((course, index) => (
          <li key={String(course._id) ?? `${course.name ?? "course"}-${index}`}>
            <label>{String(course.name) ?? "Unnamed course"}</label>
            <input
              type="radio"
              name="selectedCourse"
              value={String(course._id)}
              onChange={() => {
                setSelectedCourse([course]);
              }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function CourseDetailsPanel({
  // selectedCourse,
  instructorName,
  setInstructorName,
  studentNames,
  setStudentNames,
  instructorId,
  studentIds,
}: {
  // selectedCourse: CourseDB[];
  instructorName: string;
  setInstructorName: React.Dispatch<React.SetStateAction<string>>;
  studentNames: UserDB[];
  setStudentNames: React.Dispatch<React.SetStateAction<UserDB[]>>;
  instructorId: string;
  studentIds: string[];
}) {
  

  // console.log("Selected course: ", course);
  console.log("Student IDs: ", studentIds);

  useEffect(() => {
    const getInstructorName = async () => {
      try {
        if (instructorId) {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/mongodb/read/admin/get-instructor/${instructorId}`,
            {
              cache: "no-store",
            },
          );

          if (response.ok) {
            const instructorData = await response.json();
            setInstructorName(instructorData?.name ?? "Not assigned");
          }
        } else {
          setInstructorName("Not assigned");
        }
      } catch (error) {
        console.error("Failed to fetch instructor name:", error);
      }
    };

    const getStudentNames = async () => {
      try {
        if (studentIds.length > 0) {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/mongodb/read/admin/get-students-names`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ payload: studentIds }),
            },
          );

          if (response.ok) {
            const studentData = await response.json();
            console.log("Fetched student data:", studentData);
            setStudentNames(studentData);
          }
        } else {
          setStudentNames([]);
        }
      } catch (error) {
        console.error("Failed to fetch student names:", error);
      }
    };

    getInstructorName();
    getStudentNames();
  }, [instructorId, studentIds, setInstructorName, setStudentNames]);

  return (
    <div>
      <h2>Course Details</h2>
      <h1>Instructor: {instructorName}</h1>
      Students:
      <ul>
        {studentNames.map((student) => (
          <li key={String(student._id)}>
            {student.name ?? student.email ?? "Unnamed student"}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AdminManageCoursePage() {
  const [students, setStudents] = useState<UserDB[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<UserDB[]>([]);

  const [loading, setLoading] = useState<boolean>(true);

  const [courses, setCourses] = useState<CourseDB[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseDB[]>([]);

  const [instructorName, setInstructorName] = useState("Not assigned");
  const [studentNames, setStudentNames] = useState<UserDB[]>([]);

  const course = selectedCourse[0] || null;
  const instructorId = course?.instructor_id || "";
  const studentIds = course?.student_ids ?? EMPTY_STUDENT_IDS;

  // console.log("Selected course data:", selectedCourse);
  console.log("Selected students:", selectedStudents);
  console.log("All students:", students);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const selectedCourseId = selectedCourse[0]?._id;
    const selectedStudentIds = selectedStudents.map((student) => student._id);

    console.log("Submit (selected course ID): ", selectedCourseId);
    console.log("Submit (selected student IDs): ", selectedStudentIds);

    const payload = {
      courseId: selectedCourseId,
      studentIds: selectedStudentIds,
    };

    try {
      const response = await fetch(
        "/api/mongodb/update/admin/update-one-course",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ payload: payload }),
        },
      );
      console.log("Response from backend:", await response.json()); 
      setStudentNames([]); 
      setInstructorName("LOL");
    } catch (error) {
      console.error("Error updating course:", error);
    }
  }

  useEffect(() => {
    const getStudents = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/mongodb/read/admin/get-students`,
          {
            cache: "no-store",
          },
        );

        if (response.ok) {
          const studentsData = await response.json();
          setStudents(studentsData);
        }
      } catch (error) {
        console.error("Failed to fetch students:", error);
      } finally {
        setLoading(false);
      }
    };
    getStudents();
  }, []);

  return (
    <div>
      <h1>Admin Manage Course Page</h1>
      <p>{loading ? "Loading students..." : ""}</p>
      <p>Students found: {students.length}</p>
      <form onSubmit={handleSubmit}>
        <ul>
          {students.map((student, index) => (
            <li
              key={
                String(student._id) ?? `${student.name ?? "student"}-${index}`
              }
            >
              <label>
                {student.name ?? student.email ?? "Unnamed student"}
              </label>
              <input
                type="checkbox"
                name={`student-${index}`}
                value={String(student._id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedStudents([
                      ...selectedStudents,
                      Object.assign({}, student, { _id: student._id }), // Ensure _id is included
                    ]);
                  } else {
                    setSelectedStudents(
                      selectedStudents.filter(
                        (selectedStudent) =>
                          selectedStudent._id !== student._id,
                      ),
                    );
                  }
                }}
              />
            </li>
          ))}
        </ul>
        <button type="submit">
          Register {selectedStudents.length} to Course{" "}
          {selectedCourse[0]?.name || "Unknown Course"}
        </button>
      </form>
      <CourseModuleCRUD
        courses={courses}
        setCourses={setCourses}
        setSelectedCourse={setSelectedCourse}
      />
      <CourseDetailsPanel instructorName={instructorName} setInstructorName={setInstructorName} studentNames={studentNames} setStudentNames={setStudentNames} instructorId={instructorId} studentIds={studentIds} />
    </div>
  );
}
