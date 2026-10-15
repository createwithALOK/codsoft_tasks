export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  workMode: "Remote" | "Hybrid" | "On-site";
  employmentType: "Full-time" | "Part-time" | "Contract";
  salary: string;
  category: string;
  level: string;
  logo: string;
  logoTone: "violet" | "blue" | "orange" | "green" | "rose" | "cyan";
  postedAt: string;
  description: string;
  tags: string[];
  featured: boolean;
};

export const sampleJobs: Job[] = [
  {
    id: "product-designer-figma",
    title: "Product Designer",
    company: "Figma",
    location: "San Francisco, CA",
    workMode: "Remote",
    employmentType: "Full-time",
    salary: "$120k – $160k",
    category: "Design",
    level: "Mid-level",
    logo: "F",
    logoTone: "violet",
    postedAt: "2 days ago",
    description:
      "Help shape the future of collaborative design. You will work closely with product and engineering to make powerful tools feel simple, thoughtful, and delightful.",
    tags: ["Product design", "Figma", "Design systems"],
    featured: true,
  },
  {
    id: "frontend-engineer-linear",
    title: "Frontend Engineer",
    company: "Linear",
    location: "New York, NY",
    workMode: "Hybrid",
    employmentType: "Full-time",
    salary: "$140k – $190k",
    category: "Engineering",
    level: "Senior",
    logo: "L",
    logoTone: "blue",
    postedAt: "1 day ago",
    description:
      "Build fast, focused experiences for teams that care about their craft. Partner with a small product team and ship work that makes a visible difference.",
    tags: ["React", "TypeScript", "Next.js"],
    featured: true,
  },
  {
    id: "growth-marketer-notion",
    title: "Growth Marketing Manager",
    company: "Notion",
    location: "Remote · US",
    workMode: "Remote",
    employmentType: "Full-time",
    salary: "$110k – $145k",
    category: "Marketing",
    level: "Mid-level",
    logo: "N",
    logoTone: "orange",
    postedAt: "3 days ago",
    description:
      "Create experiments that help more people discover a better way to work. Own campaigns from the first idea through measurement and iteration.",
    tags: ["Growth", "Content", "Analytics"],
    featured: false,
  },
  {
    id: "product-manager-airbnb",
    title: "Product Manager",
    company: "Airbnb",
    location: "Austin, TX",
    workMode: "Hybrid",
    employmentType: "Full-time",
    salary: "$135k – $175k",
    category: "Product",
    level: "Senior",
    logo: "A",
    logoTone: "rose",
    postedAt: "5 days ago",
    description:
      "Bring people together through products that make travel feel more human. Set a clear product direction and lead cross-functional teams from insight to impact.",
    tags: ["Product strategy", "Roadmaps", "Research"],
    featured: false,
  },
  {
    id: "data-analyst-stripe",
    title: "Data Analyst",
    company: "Stripe",
    location: "Remote · US",
    workMode: "Remote",
    employmentType: "Full-time",
    salary: "$105k – $140k",
    category: "Engineering",
    level: "Entry-level",
    logo: "S",
    logoTone: "cyan",
    postedAt: "1 week ago",
    description:
      "Turn complex product questions into clear, actionable insights. Work with curious teammates and help businesses around the world grow their revenue.",
    tags: ["SQL", "Python", "Data"],
    featured: false,
  },
  {
    id: "brand-designer-canva",
    title: "Brand Designer",
    company: "Canva",
    location: "Melbourne, AU",
    workMode: "Hybrid",
    employmentType: "Full-time",
    salary: "$95k – $125k",
    category: "Design",
    level: "Mid-level",
    logo: "C",
    logoTone: "green",
    postedAt: "4 days ago",
    description:
      "Build a brand that empowers the world to design. Collaborate with a generous creative team on stories, campaigns, and experiences seen by millions.",
    tags: ["Brand", "Illustration", "Creative"],
    featured: false,
  },
];

export const categories = [
  "All jobs",
  "Design",
  "Engineering",
  "Marketing",
  "Product",
  "Finance",
];
