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

export function UserDetailsDisplayPanelCheckbox({
  userData,
  onCheck,
  selectedIds,
}: {
  userData: UserDB[];
  onCheck: (user: UserDB, checked: boolean) => void;
  selectedIds?: Course["student_ids"];
}) {
  return (
    <ul>
      {userData.map((user, index) => (
        <li key={String(user._id) ?? `${user.name ?? "user"}-${index}`}>
          <label>{user.name ? user.name + " (" + user.role_id + ") " : "Unnamed user"}</label>
          <input
            type="checkbox"
            name={`student-${index}`}
            value={String(user._id)}
            checked={selectedIds?.includes(String(user._id))}
            onChange={(e) => {
              onCheck(user, e.target.checked);
            }}
          />
        </li>
      ))}
    </ul>
  );
}

export function UserDetailsDisplayPanelRadio({
  userData,
  onSelect,
  selectedId,
}: {
  userData: [] | UserDB[] | CourseDB[];
  onSelect: (user: UserDB | CourseDB) => void;
  selectedId?: UserDB["_id"] | CourseDB["_id"] | Course["instructor_id"] | null;
}) {
  return (
    <ul>
      {userData.map((user, index) => (
        <li key={String(user._id) ?? `${user.name ?? "user"}-${index}`}>
          <label>{user.name ? user.name + " (" + user.role_id + ") " : "Unnamed user"}</label>
          <input
            type="radio"
            name="selectedUser"
            value={String(user._id)}
            checked={String(user._id) === selectedId}
            onChange={() => onSelect(user)}
          />
        </li>
      ))}
    </ul>
  );
}

function CourseDetailsDisplayPanel({
  courses,
  instructors,
  students,
  courseSubmitted,
  setCourseSubmitted,
}: {
  courses: CourseDB[];
  instructors: UserDB[];
  students: UserDB[];
  courseSubmitted: boolean;
  setCourseSubmitted: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [editingId, setEditingId] = useState<{
    editingId: CourseDB["_id"] | null;
  }>({
    editingId: null,
  });

  const [editingCourseDetails, setEditingCourseDetails] = useState<Course>({
    name: "",
    description: "",
    instructor_id: "",
    student_ids: [],
  });

  function getEditingCourseDetails(course: CourseDB) {
    if (course) {
      setEditingCourseDetails({
        name: course.name,
        description: course.description,
        instructor_id: String(course.instructor_details?.[0]?._id),
        student_ids: course.student_ids?.map((id) => String(id)) || [],
      });
    }
  }

  console.log("Editing Course Details: ", editingCourseDetails);
  // console.log("Editing Course instructors: " + instructors);
  // console.log("Editing Course students: " + students);

  async function handleSubmitEditing(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const payload = {
      editingId: editingId.editingId,
      editingCourseDetails: editingCourseDetails,
    };

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/mongodb/update/admin/update-one-course`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ payload: payload }),
        },
      );

      if (response.ok) {
        const updatedData = await response.json();
        console.log("Updated course data:", updatedData);
        setEditingId({ editingId: null });
        setCourseSubmitted(!courseSubmitted);
      }
    } catch (error) {
      console.error("Failed to update course:", error);
    }
  }

  async function handleSubmitDeleting(courseId: CourseDB["_id"] | null) {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/mongodb/delete/admin/delete-one-course-by-course-id/${courseId}`,
        {
          cache: "no-store",
        },
      );

      if (response.ok) {
        const DeletedCourseData = await response.json();
        console.log("Deleted course data:", DeletedCourseData);
        setCourseSubmitted(!courseSubmitted);
      }
    } catch (error) {
      console.error("Failed to delete course:", error);
    }
  }

  console.log("Editing Id: ", editingId);
  console.log(
    "Editing Course Instructor ID: ",
    editingCourseDetails.instructor_id,
  );

  return (
    <div className="mt-5">
      <h2>Course Details</h2>

      <div className={`${editingId.editingId ? "block" : "hidden"}`}>
        <h3>Currently Editing Course ID: {String(editingId.editingId)}</h3>
        <form onSubmit={handleSubmitEditing}>
          <div className="grid grid-cols-2 border-2 border-black p-5">
            <div className="flex flex-col justify-center">
              <label>Course Name</label>
            </div>

            <div>
              <input
                id={"course-name-editing-input"}
                className="w-full rounded-md border-2 border-black px-1 py-1 outline-none"
                type="text"
                placeholder="Course Name"
                value={editingCourseDetails.name}
                onChange={(e) =>
                  setEditingCourseDetails({
                    ...editingCourseDetails,
                    name: e.target.value,
                  })
                }
                name="courseName"
              />
            </div>

            <div className="flex flex-col justify-center">
              <label>Course Description</label>
            </div>

            <div>
              <input
                id={"course-description-editing-input"}
                className="mt-2 w-full rounded-md border-2 border-black px-1 py-1 outline-none"
                type="text"
                placeholder="Course Description"
                value={editingCourseDetails.description}
                onChange={(e) =>
                  setEditingCourseDetails({
                    ...editingCourseDetails,
                    description: e.target.value,
                  })
                }
                name="courseDescription"
              />
            </div>

            <div className="flex flex-col justify-center">
              <label>Instructor</label>
            </div>

            <div>
              <UserDetailsDisplayPanelRadio
                userData={instructors}
                onSelect={(instructor) =>
                  setEditingCourseDetails((prev) => ({
                    ...prev,
                    instructor_id: String(instructor._id),
                  }))
                }
                selectedId={String(editingCourseDetails.instructor_id)}
              />
            </div>

            <div className="flex flex-col justify-center">
              <label>Students</label>
            </div>

            <div>
              <UserDetailsDisplayPanelCheckbox
                userData={students}
                onCheck={(student, checked) => {
                  setEditingCourseDetails((prev) => {
                    const updatedStudentIds = checked
                      ? [...(prev.student_ids ?? []), String(student._id)]
                      : (prev.student_ids ?? []).filter(
                          (id) => id !== String(student._id),
                        );
                    return { ...prev, student_ids: updatedStudentIds };
                  });
                }}
                selectedIds={editingCourseDetails.student_ids}
              />
            </div>
          </div>

          <button type="submit">Edit Course</button>
        </form>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-5 xl:grid-cols-3">
        {courses.map((course) => (
          <div
            key={String(course._id)}
            className="grid grid-cols-2 border-2 border-black p-5"
          >
            <div className="flex justify-center">
              <input
                className="rounded border-2 bg-blue-100 px-2 transition hover:bg-blue-200"
                type="button"
                value="Edit"
                onClick={() => {
                  setEditingId({ editingId: course._id });
                  getEditingCourseDetails(course);
                }}
              />
            </div>

            <div className="flex justify-center">
              <input
                className="rounded border-2 bg-blue-100 px-2 transition hover:bg-blue-200"
                type="button"
                value="Delete"
                onClick={() => handleSubmitDeleting(course._id)}
              />
            </div>

            <div className="mt-5"></div>
            <div></div>

            <div>Course Name</div>
            <div>{course.name}</div>

            <div>Course Description</div>
            <div>{course.description}</div>

            <div>Instructor Name</div>
            <div>{course.instructor_details?.[0]?.name}</div>

            <div>Student Names</div>
            <div>
              {course.student_details?.map((student) => (
                <div key={String(student._id)}>
                  {student.name}
                  {""}
                  {course.student_details?.length &&
                  course.student_details.length > 1
                    ? ", "
                    : ""}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CreateCoursePanel() {
  const [courseDetails, setCourseDetails] = useState<Course>({
    name: "",
    description: "",
    instructor_id: "",
    student_ids: [],
  });

  const [students, setStudents] = useState<UserDB[]>([]);
  const [filteringStudents, setFilteringStudents] = useState<UserDB["name"]>("");
  const [filteredStudents, setFilteredStudents] = useState<UserDB[]>([]);
  const [instructors, setInstructors] = useState<UserDB[]>([]);
  const [filteringInstructors, setFilteringInstructors] = useState<UserDB["name"]>("");
  const [filteredInstructors, setFilteredInstructors] = useState<UserDB[]>([]);
  const [courses, setCourses] = useState<CourseDB[]>([]);

  const [courseSubmitted, setCourseSubmitted] = useState<boolean>(false);

  console.log("Course Details:", courseDetails);
  console.log("Courses: ", courses);

  useEffect(() => {
    const getStudents = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/mongodb/read/admin/get-user-by-role-type/Student`,
          {
            cache: "no-store",
          },
        );

        if (response.ok) {
          const studentsData = await response.json();
          setStudents(studentsData);
          console.log("Fetched students:", studentsData);
        }
      } catch (error) {
        console.error("Failed to fetch students:", error);
      }
    };

    const getInstructors = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/mongodb/read/admin/get-user-by-role-type/Instructor`,
          {
            cache: "no-store",
          },
        );

        if (response.ok) {
          const instructorsData = await response.json();
          setInstructors(instructorsData);
          console.log("Fetched instructors:", instructorsData);
        }
      } catch (error) {
        console.error("Failed to fetch instructors:", error);
      }
    };

    getStudents();
    getInstructors();
  }, []);

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
          console.log("Fetched courses:", coursesData);
        }
      } catch (error) {
        console.error("Failed to fetch courses:", error);
      }
    };

    getCourses();
  }, [courseSubmitted]);

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
      setCourseDetails(() => ({
        name: "",
        description: "",
        instructor_id: courseDetails.instructor_id ?? "",
        student_ids: courseDetails.student_ids ?? [],
      }));
      setCourseSubmitted(!courseSubmitted);
    }
  }

  const handleStudentFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilteringStudents(value);

    const normalized = value.toLowerCase();
    setFilteredStudents(
      students.filter((student) =>
        student.name?.toLowerCase().includes(normalized) ||
        student.role_id?.toLowerCase().includes(normalized)
      )
    );
  };

  const handleInstructorFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilteringInstructors(value);

    const normalized = value.toLowerCase();
    setFilteredInstructors(
      instructors.filter((instructor) =>
        instructor.name?.toLowerCase().includes(normalized) ||
        instructor.role_id?.toLowerCase().includes(normalized)
      )
    );
  };

  return (
    <div>
      <h1>------------------------------</h1>
      <h2>Create Course Panel</h2>

      <form onSubmit={handleSubmit}>
        <input
          id={"course-name-input"}
          className="mt-2 w-full rounded-md border-2 border-black px-1 py-1 outline-none"
          type="text"
          placeholder="Course Name"
          value={courseDetails.name}
          onChange={(e) =>
            setCourseDetails({ ...courseDetails, name: e.target.value })
          }
          name="courseName"
        />

        <input
          id={"course-description-input"}
          className="mt-2 w-full rounded-md border-2 border-black px-1 py-1 outline-none"
          type="text"
          placeholder="Course Description"
          value={courseDetails.description}
          onChange={(e) =>
            setCourseDetails({ ...courseDetails, description: e.target.value })
          }
          name="courseDescription"
        />

        <h1 className="mt-5 text-lg font-medium text-gray-700">Students</h1>
        {/* filter students */}
        <input
          id={"student-filter-input"}
          className="mt-2 w-full rounded-md border-2 border-black px-1 py-1 outline-none"
          type="text"
          placeholder="Filter Students..."
          value={filteringStudents}
          onChange={handleStudentFilterChange}
          name="studentFilter"
        />
        <UserDetailsDisplayPanelCheckbox
          userData={filteringStudents ? filteredStudents : students}
          onCheck={(student, checked) => {
            setCourseDetails((prev) => {
              const updatedStudentIds = checked
                ? [...(prev.student_ids ?? []), String(student._id)]
                : (prev.student_ids ?? []).filter(
                    (id) => id !== String(student._id),
                  );
              return { ...prev, student_ids: updatedStudentIds };
            });
          }}
        />

        <h1 className="mt-5 text-lg font-medium text-gray-700">Instructors</h1>
        {/* filter instructors */}
        <input
          id={"instructor-filter-input"}
          className="mt-2 w-full rounded-md border-2 border-black px-1 py-1 outline-none"
          type="text"
          placeholder="Filter Instructors..."
          value={filteringInstructors}
          onChange={handleInstructorFilterChange}
          name="instructorFilter"
        />
        <UserDetailsDisplayPanelRadio
          userData={filteringInstructors ? filteredInstructors : instructors}
          onSelect={(instructor) =>
            setCourseDetails((prev) => ({
              ...prev,
              instructor_id: String(instructor._id),
            }))
          }
          selectedId={courseDetails.instructor_id}
        />

        <h1 className="mt-5">
          Registering {courseDetails.student_ids?.length || 0} students under{" "}
          {instructors.find(
            (instructor) =>
              String(instructor._id) === courseDetails.instructor_id,
          )?.name || ""}{" "}
          instructor to the course of {courseDetails.name || ""}.
        </h1>

        <button
          type="submit"
          className="mt-2 rounded-md bg-blue-600 px-6 py-3 text-lg font-medium text-white hover:bg-blue-700"
        >
          Create Course
        </button>
      </form>

      <CourseDetailsDisplayPanel
        courses={courses}
        instructors={instructors}
        students={students}
        courseSubmitted={courseSubmitted}
        setCourseSubmitted={setCourseSubmitted}
      />

      <h1>------------------------------</h1>
    </div>
  );
}

export default function AdminManageCoursePage2() {
  return (
    <div>
      <h1>Admin Manage Course Page</h1>
      <CreateCoursePanel />
    </div>
  );
}
