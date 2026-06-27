import Link from "next/link";

export default function InstructorMainPage() {
  return (
    <div>
      <h1>Instructor Main Page</h1>
      <Link href="/instructor/create-question">Create Question</Link>      
    </div>
  );
}