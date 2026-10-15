"use client";

import {
  ArrowDownWideNarrow,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  BriefcaseBusiness,
  Building2,
  Check,
  CheckCircle2,
  Clock3,
  Compass,
  FileText,
  Heart,
  MapPin,
  Menu,
  Plus,
  Search,
  Send,
  Sparkles,
  TrendingUp,
  UploadCloud,
  UsersRound,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { FormEvent, ReactNode } from "react";
import { categories, type Job } from "@/lib/jobs";

type View = "jobs" | "saved" | "applications" | "recruiter";
type Application = {
  jobId: string;
  jobTitle: string;
  company: string;
  candidateName: string;
  email: string;
  resumeFilename: string;
  status: "In review" | "Applied";
  appliedAt: string;
};
type ModalState = { type: "apply"; job: Job } | { type: "post" } | null;
type Notice = { message: string; kind: "success" | "error" } | null;

const storageKeys = {
  saved: "careerhub:saved-jobs",
  applications: "careerhub:applications",
  jobs: "careerhub:local-jobs",
};

const companyMark = (job: Job) => (
  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-bold logo-${job.logoTone}`}>
    {job.logo}
  </div>
);

const storageSubscribers = new Map<string, Set<() => void>>();

function subscribeToStorage(key: string, callback: () => void) {
  const subscribers = storageSubscribers.get(key) ?? new Set<() => void>();
  subscribers.add(callback);
  storageSubscribers.set(key, subscribers);

  function handleStorage(event: StorageEvent) {
    if (event.key === key || event.key === null) callback();
  }

  window.addEventListener("storage", handleStorage);
  return () => {
    subscribers.delete(callback);
    window.removeEventListener("storage", handleStorage);
  };
}

function parseStorage<T>(value: string | null, fallback: T): T {
  try {
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function useLocalStorageState<T>(key: string, fallback: T) {
  const subscribe = useCallback(
    (callback: () => void) => subscribeToStorage(key, callback),
    [key],
  );
  const getSnapshot = useCallback(() => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }, [key]);
  const serialized = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const value = parseStorage(serialized, fallback);
  const setValue = useCallback(
    (next: T) => {
      window.localStorage.setItem(key, JSON.stringify(next));
      storageSubscribers.get(key)?.forEach((notify) => notify());
    },
    [key],
  );

  return [value, setValue] as const;
}

function formatPostedAt(value: string) {
  if (!value.includes("T")) return value;
  const days = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000),
  );
  return days === 0 ? "Today" : days === 1 ? "1 day ago" : `${days} days ago`;
}

function daysAgo(value: string) {
  if (value.includes("T")) {
    return Math.max(0, (Date.now() - new Date(value).getTime()) / 86_400_000);
  }
  const match = value.match(/(\d+)\s+(day|week)/);
  if (match) return Number(match[1]) * (match[2] === "week" ? 7 : 1);
  return 0;
}

export default function CareerHub({ initialJobs }: { initialJobs: Job[] }) {
  const [view, setView] = useState<View>("jobs");
  const [serverJobs, setServerJobs] = useState(initialJobs);
  const [localJobs, setLocalJobs] = useLocalStorageState<Job[]>(storageKeys.jobs, []);
  const [savedIds, setSavedIds] = useLocalStorageState<string[]>(storageKeys.saved, []);
  const [applications, setApplications] = useLocalStorageState<Application[]>(
    storageKeys.applications,
    [],
  );
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [submittedKeyword, setSubmittedKeyword] = useState("");
  const [submittedLocation, setSubmittedLocation] = useState("");
  const [category, setCategory] = useState("All jobs");
  const [sort, setSort] = useState("Recommended");
  const [modal, setModal] = useState<ModalState>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const jobs = useMemo(() => [...localJobs, ...serverJobs], [localJobs, serverJobs]);

  useEffect(() => {
    fetch("/api/jobs")
      .then(async (response) => {
        if (!response.ok) throw new Error("Job listings could not be refreshed.");
        const result: { jobs: Job[] } = await response.json();
        setServerJobs(result.jobs);
      })
      .catch(() => {
        setNotice({
          kind: "error",
          message: "Could not refresh live jobs. Showing the latest available listings.",
        });
      });
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const filteredJobs = useMemo(() => {
    let result =
      view === "saved"
        ? jobs.filter((job) => savedIds.includes(job.id))
        : jobs;

    if (view !== "saved" && view !== "jobs") return [];
    if (category !== "All jobs" && view !== "saved") {
      result = result.filter((job) => job.category === category);
    }

    const search = submittedKeyword.trim().toLowerCase();
    if (search) {
      result = result.filter((job) =>
        [job.title, job.company, job.category, ...job.tags]
          .join(" ")
          .toLowerCase()
          .includes(search),
      );
    }

    const place = submittedLocation.trim().toLowerCase();
    if (place) {
      result = result.filter((job) =>
        [job.location, job.workMode].join(" ").toLowerCase().includes(place),
      );
    }

    if (sort === "Newest") return [...result].sort((first, second) => daysAgo(first.postedAt) - daysAgo(second.postedAt));
    if (sort === "Salary: high to low") {
      return [...result].sort((first, second) =>
        Number.parseInt(second.salary.replace(/\D/g, ""), 10) -
        Number.parseInt(first.salary.replace(/\D/g, ""), 10),
      );
    }
    return result;
  }, [category, jobs, savedIds, sort, submittedKeyword, submittedLocation, view]);

  const showNotice = useCallback((message: string, kind: "success" | "error") => {
    setNotice({ message, kind });
  }, []);

  function updateSaved(next: string[]) {
    setSavedIds(next);
  }

  function saveApplication(application: Application) {
    const next = [application, ...applications];
    setApplications(next);
  }

  function toggleSaved(job: Job) {
    const isSaved = savedIds.includes(job.id);
    updateSaved(
      isSaved ? savedIds.filter((id) => id !== job.id) : [...savedIds, job.id],
    );
    showNotice(
      isSaved ? "Removed from your saved jobs." : "Saved to your job list.",
      "success",
    );
  }

  function searchJobs(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedKeyword(keyword);
    setSubmittedLocation(location);
    setView("jobs");
    document.getElementById("job-listings")?.scrollIntoView({ behavior: "smooth" });
  }

  function addLocalJob(job: Job) {
    setLocalJobs([job, ...localJobs]);
    setModal(null);
    setView("jobs");
    showNotice("Your job is live in this demo on this device.", "success");
  }

  const navItems: { id: View; label: string; icon: typeof Compass }[] = [
    { id: "jobs", label: "Find jobs", icon: Compass },
    { id: "saved", label: "Saved", icon: Heart },
    { id: "applications", label: "My applications", icon: FileText },
    { id: "recruiter", label: "For employers", icon: Building2 },
  ];

  return (
    <div className="min-h-screen bg-[#f7f8fc]">
      <header className="sticky top-0 z-30 border-b border-[#e8ebf2] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[76px] max-w-[1320px] items-center justify-between px-5 md:px-8">
          <button
            className="flex items-center gap-2.5"
            onClick={() => {
              setView("jobs");
              setCategory("All jobs");
            }}
            aria-label="CareerHub home"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4f63ed] text-white shadow-sm shadow-indigo-200">
              <BriefcaseBusiness size={19} strokeWidth={2.3} />
            </span>
            <span className="text-[19px] font-bold tracking-[-0.7px] text-[#17213a]">
              Career<span className="text-[#4f63ed]">Hub</span>
            </span>
          </button>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`rounded-lg px-3.5 py-2 text-[13px] font-medium transition ${
                  view === item.id
                    ? "bg-[#f0f2ff] text-[#4659df]"
                    : "text-[#707990] hover:bg-[#f5f6fa] hover:text-[#17213a]"
                }`}
              >
                {item.label}
                {item.id === "saved" && savedIds.length > 0 && (
                  <span className="ml-1.5 rounded-full bg-[#e6eaff] px-1.5 py-0.5 text-[10px]">
                    {savedIds.length}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <span className="hidden items-center gap-1.5 rounded-full bg-[#f1f8f3] px-2.5 py-1.5 text-[11px] font-medium text-[#40865b] md:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#63bc80]" />
              Free to get started
            </span>
            <button
              onClick={() => setModal({ type: "post" })}
              className="rounded-lg bg-[#4f63ed] px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-[#4053d6]"
            >
              Post a job <span className="ml-1">↗</span>
            </button>
          </div>

          <button
            className="rounded-lg p-2 text-[#66708a] hover:bg-[#f5f6fa] lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
        {mobileMenuOpen && (
          <nav className="flex flex-col gap-1 border-t border-[#eef0f5] bg-white px-5 py-3 lg:hidden" aria-label="Mobile navigation">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium ${
                  view === item.id ? "bg-[#f0f2ff] text-[#4659df]" : "text-[#66708a]"
                }`}
              >
                <item.icon size={16} /> {item.label}
              </button>
            ))}
            <button
              onClick={() => {
                setModal({ type: "post" });
                setMobileMenuOpen(false);
              }}
              className="mt-1 flex items-center gap-3 rounded-lg bg-[#4f63ed] px-3 py-2.5 text-left text-sm font-semibold text-white"
            >
              <Plus size={16} /> Post a job
            </button>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-[1320px] px-5 pb-16 pt-7 md:px-8 md:pt-9">
        {view === "recruiter" ? (
          <RecruiterDashboard
            jobs={jobs}
            applications={applications}
            onPost={() => setModal({ type: "post" })}
          />
        ) : view === "applications" ? (
          <ApplicationsView applications={applications} jobs={jobs} onFindJobs={() => setView("jobs")} />
        ) : (
          <>
            <section className="relative isolate overflow-hidden rounded-[26px] bg-gradient-to-br from-[#edf0ff] via-[#f0f3ff] to-[#f5f6ff] px-6 py-9 md:px-12 md:py-11">
              <div className="pointer-events-none absolute -right-20 -top-32 -z-10 h-[390px] w-[390px] rounded-full border-[1px] border-[#dfe4ff] md:right-3 md:top-[-165px] md:h-[530px] md:w-[530px]" />
              <div className="pointer-events-none absolute right-[-30px] top-[-80px] -z-10 h-[260px] w-[260px] rounded-full border-[1px] border-[#e3e7ff] md:right-[85px] md:top-[-85px] md:h-[370px] md:w-[370px]" />
              <div className="pointer-events-none absolute right-[8%] top-[48px] -z-10 hidden h-3 w-3 rounded-full bg-[#f5bf83] md:block" />
              <div className="pointer-events-none absolute right-[17%] bottom-[54px] -z-10 hidden h-2.5 w-2.5 rounded-full bg-[#a5d6b4] md:block" />
              <div className="relative max-w-[710px]">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#dfe3ff] bg-white/80 px-3 py-1.5 text-[11px] font-semibold tracking-[0.12em] text-[#5363d4]">
                  <Sparkles size={13} /> YOUR NEXT CHAPTER STARTS HERE
                </div>
                <h1 className="max-w-[620px] text-[39px] font-bold leading-[1.08] tracking-[-2px] text-[#17213a] md:text-[57px] md:tracking-[-3px]">
                  Find work that
                  <br className="hidden sm:block" /> moves <span className="text-[#4f63ed]">you forward.</span>
                </h1>
                <p className="mt-4 max-w-[470px] text-[14px] leading-6 text-[#6d7690] md:text-[15px]">
                  Good people deserve great opportunities. Find a team where your work makes a difference.
                </p>
                <form
                  onSubmit={searchJobs}
                  className="mt-7 flex flex-col gap-2 rounded-2xl border border-[#e9ebf4] bg-white p-2 shadow-[0_16px_44px_-32px_rgba(42,57,124,0.42)] sm:flex-row sm:items-center"
                >
                  <label className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5">
                    <Search size={18} className="shrink-0 text-[#8590a8]" />
                    <span className="sr-only">Job title or keyword</span>
                    <input
                      value={keyword}
                      onChange={(event) => setKeyword(event.target.value)}
                      placeholder="Job title, keyword, or company"
                      className="w-full bg-transparent text-[13px] text-[#27314a] outline-none placeholder:text-[#9ba3b5]"
                    />
                  </label>
                  <span className="hidden h-8 w-px bg-[#e9ebf2] sm:block" />
                  <label className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5">
                    <MapPin size={18} className="shrink-0 text-[#8590a8]" />
                    <span className="sr-only">Location</span>
                    <input
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                      placeholder="City, state, or remote"
                      className="w-full bg-transparent text-[13px] text-[#27314a] outline-none placeholder:text-[#9ba3b5]"
                    />
                  </label>
                  <button className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#4f63ed] px-5 py-3 text-[13px] font-semibold text-white transition hover:bg-[#4053d6]">
                    <Search size={15} /> Search jobs
                  </button>
                </form>
                <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-2 text-[11px] text-[#7a8297]">
                  <span className="mr-1 font-medium">Popular:</span>
                  {["Product Designer", "Remote", "Engineering"].map((term) => (
                    <button
                      key={term}
                      onClick={() => {
                        setKeyword(term === "Remote" ? "" : term);
                        setLocation(term === "Remote" ? "Remote" : "");
                        setSubmittedKeyword(term === "Remote" ? "" : term);
                        setSubmittedLocation(term === "Remote" ? "Remote" : "");
                        setView("jobs");
                      }}
                      className="rounded-full border border-[#e1e5f3] bg-white/70 px-2.5 py-1 text-[#69738d] transition hover:border-[#bbc4ff] hover:text-[#4659df]"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
              <div className="absolute bottom-9 right-[7%] hidden items-center gap-3 rounded-2xl border border-white/80 bg-white/90 p-3 shadow-lg shadow-indigo-100/50 xl:flex">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e9f6ec] text-[#439060]">
                  <TrendingUp size={19} />
                </div>
                <div>
                  <p className="text-[11px] text-[#7a8297]">New opportunities</p>
                  <p className="mt-0.5 text-[13px] font-bold text-[#25304a]">Added every day</p>
                </div>
              </div>
            </section>

            <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-5">
              <p className="text-[12px] text-[#7d8598]">
                <span className="font-semibold text-[#313c55]">2,400+</span> people found their next role this month
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-[#7d8598]">
                <span className="mr-1 font-medium">Trusted by teams at</span>
                <span className="font-bold tracking-tight text-[#505a71]">figma</span>
                <span className="text-[#c0c5d0]">·</span>
                <span className="font-bold tracking-tight text-[#505a71]">notion</span>
                <span className="text-[#c0c5d0]">·</span>
                <span className="font-bold tracking-tight text-[#505a71]">stripe</span>
                <span className="text-[#c0c5d0]">·</span>
                <span className="font-bold tracking-tight text-[#505a71]">canva</span>
              </div>
            </div>

            <section id="job-listings" className="scroll-mt-24">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="mb-1.5 flex items-center gap-2">
                    <h2 className="text-[22px] font-bold tracking-[-0.7px] text-[#202a43]">
                      {view === "saved" ? "Jobs you saved" : "Find your next opportunity"}
                    </h2>
                    <span className="rounded-md bg-[#e9ecff] px-2 py-0.5 text-[10px] font-semibold text-[#5264dc]">
                      {filteredJobs.length} {filteredJobs.length === 1 ? "opening" : "openings"}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#828a9d]">
                    {view === "saved"
                      ? "Your shortlist, all in one place."
                      : "Hand-picked roles from teams we think you’ll love."}
                  </p>
                </div>
                <label className="flex items-center gap-2 rounded-lg border border-[#e6e9f1] bg-white px-3 py-2 text-[11px] text-[#6d7690] shadow-sm shadow-slate-100">
                  <ArrowDownWideNarrow size={14} className="text-[#8290ab]" />
                  <span>Sort:</span>
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value)}
                    className="cursor-pointer bg-transparent font-semibold text-[#39445e] outline-none"
                    aria-label="Sort jobs"
                  >
                    <option>Recommended</option>
                    <option>Newest</option>
                    <option>Salary: high to low</option>
                  </select>
                </label>
              </div>

              {view === "jobs" && (
                <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
                  {categories.map((item) => (
                    <button
                      key={item}
                      onClick={() => setCategory(item)}
                      className={`shrink-0 rounded-full px-3.5 py-2 text-[11px] font-medium transition ${
                        category === item
                          ? "bg-[#263452] text-white shadow-sm"
                          : "border border-[#e8eaf1] bg-white text-[#717a8f] hover:border-[#cfd5e5] hover:text-[#313b53]"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_290px]">
                <div>
                  {filteredJobs.length ? (
                    <div className="grid gap-3.5 md:grid-cols-2">
                      {filteredJobs.map((job) => (
                        <JobCard
                          key={job.id}
                          job={job}
                          isSaved={savedIds.includes(job.id)}
                          isApplied={applications.some((application) => application.jobId === job.id)}
                          onSave={() => toggleSaved(job)}
                          onApply={() => setModal({ type: "apply", job })}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#d9deea] bg-white px-6 text-center">
                      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f0f2ff] text-[#6878e8]">
                        <Search size={21} />
                      </span>
                      <h3 className="text-[15px] font-semibold text-[#29334c]">
                        {view === "saved" ? "Nothing saved just yet" : "No jobs match those filters"}
                      </h3>
                      <p className="mt-1.5 max-w-[310px] text-[12px] leading-5 text-[#848da0]">
                        {view === "saved"
                          ? "Tap the bookmark on a job you like, and it’ll show up here."
                          : "Try a different title, location, or category to find your fit."}
                      </p>
                      <button
                        onClick={() => {
                          setCategory("All jobs");
                          setSubmittedKeyword("");
                          setSubmittedLocation("");
                          setKeyword("");
                          setLocation("");
                          setView("jobs");
                        }}
                        className="mt-4 text-[12px] font-semibold text-[#4f63ed] hover:underline"
                      >
                        Browse all jobs
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => setNotice({ kind: "success", message: "You’re all caught up on the latest openings." })}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#e5e8f0] bg-white py-3 text-[11px] font-semibold text-[#5e6880] transition hover:border-[#cdd3e1] hover:text-[#3b4660]"
                  >
                    You&apos;re all caught up <Check size={14} />
                  </button>
                </div>

                <aside className="space-y-4">
                  <div className="rounded-2xl border border-[#e8ebf2] bg-white p-5 shadow-[0_8px_24px_-24px_rgba(30,45,80,0.35)]">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#fff3e2] text-[#dc913e]">
                          <Zap size={16} />
                        </span>
                        <h3 className="text-[13px] font-bold text-[#29334c]">Your job search</h3>
                      </div>
                      <span className="rounded-full bg-[#eff8f0] px-2 py-1 text-[9px] font-semibold text-[#43835a]">Looking good</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-[#f7f8fc] p-3">
                        <p className="text-[10px] text-[#81899c]">Saved roles</p>
                        <p className="mt-1 text-[22px] font-bold tracking-tight text-[#26314b]">{savedIds.length}</p>
                      </div>
                      <div className="rounded-xl bg-[#f7f8fc] p-3">
                        <p className="text-[10px] text-[#81899c]">Applications</p>
                        <p className="mt-1 text-[22px] font-bold tracking-tight text-[#26314b]">{applications.length}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setView("applications")}
                      className="mt-3 flex w-full items-center justify-between rounded-lg border border-[#e8eaf1] px-3 py-2.5 text-[11px] font-semibold text-[#5d6780] transition hover:bg-[#f8f9fc]"
                    >
                      Track your applications <ArrowRight size={14} />
                    </button>
                  </div>

                  <div className="overflow-hidden rounded-2xl bg-[#252f4d] p-5 text-white">
                    <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-[#d5dbff]">
                      <UsersRound size={18} />
                    </div>
                    <p className="text-[16px] font-semibold leading-snug">Good people make great teams.</p>
                    <p className="mt-2 text-[11px] leading-[1.7] text-[#c0c8df]">
                      Meet your next great hire. Find thoughtful candidates ready to do their best work.
                    </p>
                    <button
                      onClick={() => setModal({ type: "post" })}
                      className="mt-4 flex items-center gap-2 rounded-lg bg-white px-3 py-2.5 text-[11px] font-semibold text-[#303b5c] transition hover:bg-[#f0f2ff]"
                    >
                      Post a free job <ArrowUpRight size={14} />
                    </button>
                  </div>

                  <div className="rounded-2xl border border-[#e8ebf2] bg-white p-4">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#eaf5ff] text-[#5291c9]">
                        <Sparkles size={15} />
                      </span>
                      <div>
                        <p className="text-[11px] font-semibold text-[#34405b]">A little job-search tip</p>
                        <p className="mt-1 text-[10px] leading-[1.65] text-[#838b9e]">
                          Tailor your resume to the role. A few thoughtful tweaks can make your experience stand out.
                        </p>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </section>

            <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-[#e8eaf0] pt-5 text-[10px] text-[#9299a9]">
              <span>© 2026 CareerHub. Better work starts here.</span>
              <div className="flex gap-4"><span>Made for people and the teams they build.</span></div>
            </footer>
          </>
        )}
      </main>

      {modal?.type === "apply" && (
        <ApplyModal
          job={modal.job}
          onClose={() => setModal(null)}
          onSubmit={async (application) => {
            try {
              const response = await fetch("/api/applications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  jobId: application.jobId,
                  candidateName: application.candidateName,
                  email: application.email,
                  resumeFilename: application.resumeFilename,
                  coverLetter: application.coverLetter,
                }),
              });
              const result = await response.json();
              if (!response.ok && result.code !== "DATABASE_NOT_CONFIGURED") {
                throw new Error(result.message || "Your application could not be sent.");
              }
              saveApplication(application);
              setModal(null);
              showNotice(
                response.ok
                  ? "Application sent. Good luck — we’re rooting for you!"
                  : "Application saved on this device. Connect Neon to save it to your database.",
                "success",
              );
            } catch (error) {
              showNotice(
                error instanceof Error ? error.message : "Your application could not be sent.",
                "error",
              );
            }
          }}
        />
      )}
      {modal?.type === "post" && (
        <PostJobModal
          onClose={() => setModal(null)}
          onSubmit={addLocalJob}
        />
      )}
      {notice && (
        <div
          role="status"
          className={`fixed bottom-5 right-5 z-[60] flex max-w-[min(90vw,420px)] items-center gap-2.5 rounded-xl border px-4 py-3 text-[12px] font-medium shadow-lg ${
            notice.kind === "success"
              ? "border-[#cfe9d6] bg-white text-[#38734d]"
              : "border-[#f4d0d0] bg-white text-[#a24c4c]"
          }`}
        >
          {notice.kind === "success" ? <CheckCircle2 size={17} /> : <X size={17} />}
          {notice.message}
          <button onClick={() => setNotice(null)} className="ml-1 p-1" aria-label="Dismiss notification">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

function JobCard({
  job,
  isSaved,
  isApplied,
  onSave,
  onApply,
}: {
  job: Job;
  isSaved: boolean;
  isApplied: boolean;
  onSave: () => void;
  onApply: () => void;
}) {
  return (
    <article className="job-card rounded-2xl border border-[#e8eaf1] bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {companyMark(job)}
          <div className="min-w-0">
            <p className="truncate text-[13px] font-bold text-[#27314a]">{job.company}</p>
            <p className="mt-0.5 flex items-center gap-1 text-[10px] text-[#9199a9]">
              <Clock3 size={11} /> {formatPostedAt(job.postedAt)}
            </p>
          </div>
        </div>
        <button
          onClick={onSave}
          className={`rounded-lg p-2 transition ${
            isSaved ? "bg-[#eff1ff] text-[#4f63ed]" : "text-[#9aa2b2] hover:bg-[#f5f6fa] hover:text-[#5363d4]"
          }`}
          aria-label={isSaved ? `Remove ${job.title} from saved jobs` : `Save ${job.title}`}
          aria-pressed={isSaved}
        >
          <Bookmark size={16} fill={isSaved ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="mt-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-[15px] font-semibold tracking-[-0.3px] text-[#27314a]">{job.title}</h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[10px] text-[#858da0]">
            <MapPin size={11} /> {job.location}
          </p>
        </div>
        {job.featured && (
          <span className="shrink-0 rounded-full bg-[#fff5e5] px-2 py-1 text-[9px] font-semibold text-[#c1883e]">
            ✦ Featured
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {[job.workMode, job.employmentType, job.level].map((tag) => (
          <span key={tag} className="rounded-md bg-[#f4f5f8] px-2 py-1 text-[9px] font-medium text-[#69738a]">
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-[#f0f1f5] pt-3.5">
        <div>
          <p className="text-[13px] font-bold text-[#303b54]">{job.salary}</p>
          <p className="mt-0.5 text-[9px] text-[#969dae]">per year</p>
        </div>
        {isApplied ? (
          <span className="flex items-center gap-1 rounded-lg bg-[#eef8f0] px-3 py-2 text-[10px] font-semibold text-[#43835a]">
            <Check size={13} /> Applied
          </span>
        ) : (
          <button
            onClick={onApply}
            className="rounded-lg border border-[#dce1fd] bg-[#f4f5ff] px-3.5 py-2 text-[10px] font-semibold text-[#4d5ed4] transition hover:border-[#bbc3ff] hover:bg-[#ebeefe]"
          >
            Apply now <ArrowUpRight className="ml-1 inline" size={12} />
          </button>
        )}
      </div>
    </article>
  );
}

function ApplicationsView({
  applications,
  jobs,
  onFindJobs,
}: {
  applications: Application[];
  jobs: Job[];
  onFindJobs: () => void;
}) {
  const entries = applications.map((application) => ({
    ...application,
    job: jobs.find((job) => job.id === application.jobId),
  }));

  return (
    <section className="mx-auto max-w-[900px]">
      <div className="mb-6 rounded-3xl bg-gradient-to-br from-[#edf0ff] to-[#f8f8ff] px-7 py-8 md:px-10">
        <span className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.08em] text-[#5768d8]">
          <FileText size={14} /> YOUR CAREER, AT A GLANCE
        </span>
        <h1 className="text-[32px] font-bold tracking-[-1.5px] text-[#202a43]">My applications</h1>
        <p className="mt-2 text-[13px] text-[#78819a]">Keep every opportunity in sight, from first hello to next chapter.</p>
        <div className="mt-5 flex gap-3">
          <div className="rounded-xl bg-white px-4 py-3">
            <p className="text-[10px] text-[#8b93a5]">Applications sent</p>
            <p className="mt-1 text-xl font-bold text-[#303b54]">{applications.length}</p>
          </div>
          <div className="rounded-xl bg-white px-4 py-3">
            <p className="text-[10px] text-[#8b93a5]">In review</p>
            <p className="mt-1 text-xl font-bold text-[#303b54]">{applications.filter((item) => item.status === "In review").length}</p>
          </div>
        </div>
      </div>
      {entries.length ? (
        <div className="space-y-3">
          {entries.map((entry, index) => (
            <article key={`${entry.jobId}-${index}`} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#e8eaf1] bg-white p-4 md:p-5">
              <div className="flex items-center gap-3">
                {entry.job ? companyMark(entry.job) : <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f0f2ff] text-[#6573dc]"><BriefcaseBusiness size={19} /></span>}
                <div>
                  <h2 className="text-[14px] font-semibold text-[#27314a]">{entry.jobTitle}</h2>
                  <p className="mt-1 text-[11px] text-[#828b9e]">{entry.company} · Applied {entry.appliedAt}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-[#fff7e7] px-3 py-1.5 text-[10px] font-semibold text-[#a87935]">{entry.status}</span>
                <span className="hidden text-[10px] text-[#969dae] sm:inline">{entry.resumeFilename}</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#d9deea] bg-white px-5 py-12 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eff1ff] text-[#5d6de0]"><Send size={20} /></span>
          <h2 className="mt-4 text-[15px] font-semibold text-[#29334c]">Your story starts with an application</h2>
          <p className="mx-auto mt-1.5 max-w-[360px] text-[12px] leading-5 text-[#848da0]">Apply to a role that feels right, and we’ll keep it right here for you.</p>
          <button onClick={onFindJobs} className="mt-4 rounded-lg bg-[#4f63ed] px-4 py-2.5 text-[11px] font-semibold text-white">Explore open roles</button>
        </div>
      )}
    </section>
  );
}

function RecruiterDashboard({
  jobs,
  applications,
  onPost,
}: {
  jobs: Job[];
  applications: Application[];
  onPost: () => void;
}) {
  return (
    <section className="mx-auto max-w-[1060px]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 rounded-3xl bg-gradient-to-br from-[#202b49] to-[#303e68] px-7 py-8 text-white md:px-10">
        <div>
          <span className="mb-3 inline-flex items-center gap-2 text-[10px] font-semibold tracking-[0.12em] text-[#c8d0ff]">
            <Building2 size={14} /> EMPLOYER WORKSPACE
          </span>
          <h1 className="text-[32px] font-bold tracking-[-1.5px]">Find your next great hire.</h1>
          <p className="mt-2 text-[13px] text-[#ccd3e7]">A clear view of your hiring pipeline, all in one place.</p>
        </div>
        <button onClick={onPost} className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-[12px] font-semibold text-[#303b5c] transition hover:bg-[#f0f2ff]">
          <Plus size={15} /> Post a job
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Open positions", value: jobs.length, icon: BriefcaseBusiness, tone: "bg-[#eff1ff] text-[#596bdd]" },
          { label: "Applications received", value: applications.length, icon: UsersRound, tone: "bg-[#eaf6ee] text-[#469365]" },
          { label: "Roles with applicants", value: new Set(applications.map((item) => item.jobId)).size, icon: TrendingUp, tone: "bg-[#fff3e5] text-[#d08b37]" },
        ].map((stat) => (
          <article key={stat.label} className="rounded-2xl border border-[#e8eaf1] bg-white p-5">
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.tone}`}><stat.icon size={18} /></span>
            <p className="mt-4 text-[11px] text-[#838b9e]">{stat.label}</p>
            <p className="mt-1 text-[28px] font-bold tracking-[-1px] text-[#27314a]">{stat.value}</p>
          </article>
        ))}
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-[#e8eaf1] bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div><h2 className="text-[15px] font-bold text-[#29334c]">Your open roles</h2><p className="mt-1 text-[11px] text-[#8991a2]">Manage opportunities you&apos;ve shared.</p></div>
            <span className="rounded-full bg-[#f0f2ff] px-2.5 py-1 text-[10px] font-semibold text-[#596bdd]">{jobs.length} active</span>
          </div>
          <div className="space-y-2.5">
            {jobs.slice(0, 5).map((job) => (
              <div key={job.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#f8f9fc] p-3">
                <div className="flex min-w-0 items-center gap-3">
                  {companyMark(job)}
                  <div className="min-w-0"><p className="truncate text-[12px] font-semibold text-[#34405a]">{job.title}</p><p className="mt-0.5 truncate text-[10px] text-[#8991a2]">{job.company} · {job.location}</p></div>
                </div>
                <span className="shrink-0 rounded-full bg-[#edf7ef] px-2.5 py-1 text-[9px] font-semibold text-[#47835d]">Open</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-[#e8eaf1] bg-white p-5">
          <div className="mb-4"><h2 className="text-[15px] font-bold text-[#29334c]">Recent applicants</h2><p className="mt-1 text-[11px] text-[#8991a2]">Your candidate pipeline at a glance.</p></div>
          {applications.length ? (
            <div className="space-y-3">
              {applications.slice(0, 5).map((application, index) => (
                <div key={`${application.jobId}-${application.email}-${index}`} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eff1ff] text-[11px] font-bold text-[#596bdd]">{application.candidateName.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</span>
                  <div className="min-w-0 flex-1"><p className="truncate text-[11px] font-semibold text-[#34405a]">{application.candidateName}</p><p className="truncate text-[10px] text-[#8991a2]">{application.jobTitle}</p></div>
                  <span className="rounded-full bg-[#fff7e7] px-2 py-1 text-[9px] font-semibold text-[#a87935]">{application.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[170px] flex-col items-center justify-center rounded-xl bg-[#f8f9fc] px-4 text-center">
              <UsersRound size={22} className="text-[#a2abc0]" />
              <p className="mt-2 text-[12px] font-semibold text-[#53607a]">Your next great hire is out there</p>
              <p className="mt-1 text-[10px] text-[#8d95a7]">Post a role to start meeting candidates.</p>
              <button onClick={onPost} className="mt-3 text-[10px] font-semibold text-[#5363d4] hover:underline">Create a job posting</button>
            </div>
          )}
        </div>
      </div>
      <p className="mt-5 text-center text-[10px] text-[#939aab]">Demo workspace · new job posts stay in this browser until a database is connected.</p>
    </section>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold text-[#535e77]">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-[#e3e6ee] bg-white px-3.5 py-2.5 text-[12px] text-[#303b54] outline-none transition placeholder:text-[#a0a7b5] focus:border-[#98a4fa] focus:ring-2 focus:ring-[#eef0ff]";

function ApplyModal({
  job,
  onClose,
  onSubmit,
}: {
  job: Job;
  onClose: () => void;
  onSubmit: (application: Application & { coverLetter: string }) => Promise<void>;
}) {
  const [candidateName, setCandidateName] = useState("");
  const [email, setEmail] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!resume) {
      setError("Please attach a resume to continue.");
      return;
    }
    if (resume.size > 5 * 1024 * 1024) {
      setError("Your resume must be smaller than 5 MB.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        candidateName: candidateName.trim(),
        email: email.trim(),
        resumeFilename: resume.name,
        status: "In review",
        appliedAt: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        coverLetter,
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Your application could not be sent.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell onClose={onClose} title={`Apply to ${job.company}`} eyebrow={job.title}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Full name">
            <input className={inputClass} value={candidateName} onChange={(event) => setCandidateName(event.target.value)} placeholder="Alex Morgan" required maxLength={120} autoComplete="name" />
          </FormField>
          <FormField label="Email address">
            <input className={inputClass} type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="alex@email.com" required maxLength={254} autoComplete="email" />
          </FormField>
        </div>
        <FormField label="Resume">
          <span className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[#d4d9e7] bg-[#fafbfe] px-3.5 py-3 transition hover:border-[#aeb8ef] hover:bg-[#f7f8ff]">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eff1ff] text-[#6373e0]"><UploadCloud size={17} /></span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11px] font-semibold text-[#58637e]">{resume ? resume.name : "Choose a resume to attach"}</span>
              <span className="mt-0.5 block text-[9px] text-[#929aac]">PDF or Word document · up to 5 MB</span>
            </span>
            <input
              className="sr-only"
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(event) => setResume(event.target.files?.[0] ?? null)}
              required
            />
          </span>
        </FormField>
        <FormField label="A short note (optional)">
          <textarea className={`${inputClass} min-h-[84px] resize-y`} value={coverLetter} onChange={(event) => setCoverLetter(event.target.value)} placeholder="Tell the team what excites you about this role..." maxLength={3000} />
        </FormField>
        <p className="text-[10px] leading-4 text-[#969dae]">Demo applications save your resume filename. Connect a file-storage provider before accepting real resumes.</p>
        {error && <p role="alert" className="rounded-lg bg-[#fff2f2] px-3 py-2 text-[11px] text-[#a24c4c]">{error}</p>}
        <div className="flex justify-end gap-2 border-t border-[#eff0f4] pt-4">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-[11px] font-semibold text-[#69738a] hover:bg-[#f5f6fa]">Cancel</button>
          <button disabled={submitting} className="flex items-center gap-2 rounded-lg bg-[#4f63ed] px-4 py-2.5 text-[11px] font-semibold text-white transition hover:bg-[#4053d6] disabled:cursor-wait disabled:opacity-60">
            {submitting ? "Sending..." : "Send application"} <ArrowRight size={14} />
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function PostJobModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (job: Job) => void;
}) {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [salary, setSalary] = useState("");
  const [category, setCategory] = useState("Engineering");
  const [workMode, setWorkMode] = useState<Job["workMode"]>("Remote");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !company.trim() || !location.trim() || !salary.trim()) {
      setError("Please complete all required fields.");
      return;
    }
    const id = `demo-${Date.now()}`;
    onSubmit({
      id,
      title: title.trim(),
      company: company.trim(),
      location: location.trim(),
      workMode,
      employmentType: "Full-time",
      salary: salary.trim(),
      category,
      level: "Mid-level",
      logo: company.trim().slice(0, 1).toUpperCase(),
      logoTone: "blue",
      postedAt: "Just now",
      description: `${title.trim()} at ${company.trim()}.`,
      tags: [category, "New opportunity"],
      featured: false,
    });
  }

  return (
    <ModalShell onClose={onClose} title="Share an opportunity" eyebrow="LET’S FIND YOUR NEXT GREAT HIRE">
      <form onSubmit={submit} className="space-y-3.5">
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Job title"><input className={inputClass} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Product Designer" required maxLength={120} /></FormField>
          <FormField label="Company"><input className={inputClass} value={company} onChange={(event) => setCompany(event.target.value)} placeholder="e.g. Acme Studio" required maxLength={120} /></FormField>
          <FormField label="Location"><input className={inputClass} value={location} onChange={(event) => setLocation(event.target.value)} placeholder="e.g. Remote · US" required maxLength={120} /></FormField>
          <FormField label="Salary range"><input className={inputClass} value={salary} onChange={(event) => setSalary(event.target.value)} placeholder="e.g. $90k – $120k" required maxLength={80} /></FormField>
          <FormField label="Department">
            <select className={inputClass} value={category} onChange={(event) => setCategory(event.target.value)}>{categories.slice(1).map((item) => <option key={item}>{item}</option>)}</select>
          </FormField>
          <FormField label="Workplace">
            <select
              className={inputClass}
              value={workMode}
              onChange={(event) => {
                const value = event.target.value;
                if (value === "Remote" || value === "Hybrid" || value === "On-site") {
                  setWorkMode(value);
                }
              }}
            >
              <option>Remote</option><option>Hybrid</option><option>On-site</option>
            </select>
          </FormField>
        </div>
        <div className="rounded-xl bg-[#f5f6fc] px-3.5 py-3 text-[10px] leading-[1.6] text-[#727d96]">
          Demo mode keeps this posting in your browser only. Connect a Neon database and employer authentication to publish real jobs.
        </div>
        {error && <p role="alert" className="rounded-lg bg-[#fff2f2] px-3 py-2 text-[11px] text-[#a24c4c]">{error}</p>}
        <div className="flex justify-end gap-2 border-t border-[#eff0f4] pt-4">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-[11px] font-semibold text-[#69738a] hover:bg-[#f5f6fa]">Cancel</button>
          <button className="flex items-center gap-2 rounded-lg bg-[#4f63ed] px-4 py-2.5 text-[11px] font-semibold text-white transition hover:bg-[#4053d6]">
            Publish job <ArrowUpRight size={14} />
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ModalShell({
  title,
  eyebrow,
  onClose,
  children,
}: {
  title: string;
  eyebrow: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#17213a]/45 p-4 backdrop-blur-[3px]">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Close dialog"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="modal-panel relative z-10 my-auto w-full max-w-[500px] rounded-2xl border border-white/60 bg-white p-5 shadow-[0_30px_100px_-35px_rgba(15,24,49,0.45)] sm:p-6"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="mb-1.5 text-[9px] font-semibold tracking-[0.12em] text-[#6474dc]">{eyebrow}</p>
            <h2 className="text-[20px] font-bold tracking-[-0.6px] text-[#252f49]">{title}</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-[#8b93a3] transition hover:bg-[#f4f5f9] hover:text-[#46516b]" aria-label="Close dialog"><X size={18} /></button>
        </div>
        {children}
      </section>
    </div>
  );
}
