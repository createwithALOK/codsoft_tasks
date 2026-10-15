import CareerHub from "@/app/career-hub";
import { sampleJobs } from "@/lib/jobs";

export default function Home() {
  return <CareerHub initialJobs={sampleJobs} />;
}
