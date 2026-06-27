"use client";
import { useEffect, useState } from "react";
import { UserDB } from "@/app/api/mongodb/write/admin/create-one-user/route";
import { CourseDB } from "@/app/api/mongodb/write/admin/create-one-course/route";

export type Course = {
  id?: number;
  name: string;
  description: string;
};

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
  setSelectedCourse: React.Dispatch<React.SetStateAction<string>>;
}) {
  const [courseDetails, setCourseDetails] = useState<Course>({
    name: "",
    description: "",
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
                setSelectedCourse(String(course.name));
              }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AdminManageCoursePage() {
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [students, setStudents] = useState<UserDB[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [courses, setCourses] = useState<CourseDB[]>([]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Handle form submission logic here
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
                      String(student._id),
                    ]);
                  } else {
                    setSelectedStudents(
                      selectedStudents.filter(
                        (id) => id !== String(student._id),
                      ),
                    );
                  }
                }}
              />
            </li>
          ))}
        </ul>
        <button type="submit">
          Register {selectedStudents.length} to Course {selectedCourse}
        </button>
      </form>
      <CourseModuleCRUD
        courses={courses}
        setCourses={setCourses}
        setSelectedCourse={setSelectedCourse}
      />
    </div>
  );
}
