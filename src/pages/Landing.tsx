"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ScrollToTopButton from '../components/ScrollToTopButton';
import {
  Check,
  Sparkles,
  Shield,
  GaugeCircle,
  BarChart3,
  Clock,
  FileSpreadsheet,
  Cloud,
  Brain,
  GraduationCap,
  Rocket,
  ArrowRight,
  Menu,
  X,
  FileText,
  Users,
  TrendingUp,
  ShieldCheck,
  Zap,
  Scale,
  CheckCircle2,
  Lock,
  BarChart,
} from "lucide-react";

const Landing = () => {
  useEffect(() => {
    document.body.style.overflow = "auto";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);
  
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSignIn = () => {
    setOpen(false);
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900 antialiased">
      <Header open={open} setOpen={setOpen} onSignIn={handleSignIn} />
      <main>
        <Hero />
        <TrustBar />
        <ProblemSolution />
        <FeatureGrid />
        <HowItWorks />
        <Outcomes />
        <TechStack />
        <Pricing />
        <FAQ />
        <CTA onSignIn={handleSignIn} />
      </main>
      <Footer />
      <ScrollToTopButton />
    </div>
  );
};

function Container({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}
    >
      {children}
    </div>
  );
}

function Header({
  open,
  setOpen,
  onSignIn,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  onSignIn: () => void;
}) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <Container className="flex h-16 items-center justify-between">
        <a
          href="#"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <img src="IntelliClass.jpg" alt="Logo" width="50" />
          <span>IntelliClass</span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm text-slate-700">
          <a href="#features" className="hover:text-slate-900">
            Features
          </a>
          <a href="#how" className="hover:text-slate-900">
            How it works
          </a>
          <a href="#pricing" className="hover:text-slate-900">
            Pricing
          </a>
          <a href="#faq" className="hover:text-slate-900">
            FAQ
          </a>
          <button
            onClick={onSignIn}
            className="ml-2 inline-flex items-center gap-2 rounded-xl bg-green-950 px-4 py-2 font-medium text-white hover:bg-green-900 transition"
          >
            Sign in
          </button>
        </nav>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-slate-100"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </Container>

      {/* Mobile Nav */}
      {open && (
        <div className="md:hidden border-t border-slate-200">
          <Container className="py-4 space-y-3">
            {[
              { href: "#features", label: "Features" },
              { href: "#how", label: "How it works" },
              { href: "#pricing", label: "Pricing" },
              { href: "#faq", label: "FAQ" },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="block py-2 text-slate-700 hover:text-slate-900"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </a>
            ))}
            <button
              onClick={onSignIn}
              className="inline-flex items-center gap-2 rounded-xl bg-green-950 px-4 py-2 font-medium text-white hover:bg-green-900 transition"
            >
              Sign in
            </button>
          </Container>
        </div>
      )}
    </header>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
      <Sparkles className="h-3.5 w-3.5" /> {children}
    </span>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1000px_600px_at_50%_-200px,rgba(16,185,129,0.15),transparent)]" />
      <Container className="flex flex-col items-center py-20 md:py-28 text-center">
        <Pill>Intelligent Classroom Management</Pill>
        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
          AI that
          <span className="text-green-900"> grades,</span> so teachers can{" "}
          <span className="text-green-900"> teach.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-balance text-slate-600">
          IntelliClass is an AI-powered platform with rubric‑based auto‑grading
          so educators spend less time marking and more time mentoring.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <a
            href="#cta"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-950 px-6 py-3 font-semibold text-white hover:bg-green-900 transition"
          >
            Start free trial <Rocket className="h-4 w-4" />
          </a>
          <a
            href="#features"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            See features <ArrowRight className="h-4 w-4" />
          </a>
        </div>
        <HeroMockup />
      </Container>
    </section>
  );
}

function HeroMockup() {
  return (
    <div className="mt-12 w-full rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-xl">
      <div className="rounded-2xl bg-white/80 p-6 ring-1 ring-slate-200 backdrop-blur-md">
        {/* Simulated dashboard preview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Feature */}
            <div className="h-44 rounded-2xl bg-gradient-to-br from-emerald-100 via-sky-100 to-purple-100 ring-1 ring-slate-200 flex items-center justify-center text-base font-semibold text-slate-700 shadow-md">
              Course Stream & Assignments
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  title: "Create Classrooms",
                  icon: <Users className="h-5 w-5 text-emerald-600" />,
                },
                {
                  title: "Post Assignments",
                  icon: <FileText className="h-5 w-5 text-sky-600" />,
                },
                {
                  title: "Auto Reports",
                  icon: <TrendingUp className="h-5 w-5 text-purple-600" />,
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-slate-200 p-5 bg-white shadow hover:shadow-lg transition duration-300 cursor-pointer flex flex-col items-center gap-2"
                >
                  {item.icon}
                  <span className="text-sm font-medium text-slate-700">
                    {item.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Section */}
          <div className="my-auto">
            <div className="rounded-2xl border border-slate-200 p-6 bg-gradient-to-br from-slate-50 to-white shadow-md hover:shadow-lg transition duration-300">
              <div className="flex items-center gap-2 text-base font-semibold text-slate-800">
                <BarChart3 className="h-5 w-5 text-green-700" />
                Auto‑Grading
              </div>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Rubric‑aware scoring for{" "}
                <span className="font-medium">originality</span>,{" "}
                <span className="font-medium">relevance</span>,{" "}
                <span className="font-medium">completeness</span>, and{" "}
                <span className="font-medium">quality</span>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrustBar() {
  const items = [
    { label: "Fairness", icon: <Scale className="h-4 w-4 text-emerald-600" /> },
    {
      label: "Scalability",
      icon: <BarChart className="h-4 w-4 text-sky-600" />,
    },
    {
      label: "Integrity",
      icon: <CheckCircle2 className="h-4 w-4 text-purple-600" />,
    },
    { label: "Security", icon: <Lock className="h-4 w-4 text-red-600" /> },
    { label: "Speed", icon: <Zap className="h-4 w-4 text-yellow-600" /> },
    {
      label: "Accuracy",
      icon: <ShieldCheck className="h-4 w-4 text-indigo-600" />,
    },
  ];

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-0">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-6xl mx-auto">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 flex flex-col items-center justify-center gap-2 shadow hover:shadow-md transition duration-300"
          >
            {item.icon}
            <span className="text-sm font-medium text-slate-700 tracking-wide">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProblemSolution() {
  return (
    <Container className="py-20" id="problem">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            The problem
          </h2>
          <p className="mt-4 text-slate-600 font-semibold">
            Unsustainable Grading Workload
          </p>
          <ul className="mt-6 space-y-3 text-slate-600">
            {[
              "The sheer volume of manually assessing hundreds of student assignments is prohibitively time-consuming.",
              "This repetitive task leads to grader fatigue, which can potentially impact scoring consistency and the quality of feedback.",
            ].map((i) => (
              <li key={i} className="flex items-start gap-3">
                <Shield className="mt-1 h-4 w-4 text-green-900" />
                <span>{i}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-slate-600 font-semibold">
            Inefficient Administrative Overhead
          </p>
          <ul className="mt-6 space-y-3 text-slate-600">
            {[
              "Significant time and effort are wasted on non-educational tasks, such as tracking missing submissions, managing extensions, and organizing physical or digital documents.",
              "Chasing down late or missing assignments creates unnecessary communication burdens and disrupts workflow.",
            ].map((i) => (
              <li key={i} className="flex items-start gap-3">
                <Shield className="mt-1 h-4 w-4 text-green-900" />
                <span>{i}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-slate-600 font-semibold">
            Challenges in Deadline Management
          </p>
          <ul className="mt-6 space-y-3 text-slate-600">
            {[
              "Manually enforcing deadlines for a large cohort is inefficient and difficult to standardize.",
              "The process of accepting, timestamping, and organizing a flood of last-minute submissions is chaotic and prone to error.",
            ].map((i) => (
              <li key={i} className="flex items-start gap-3">
                <Shield className="mt-1 h-4 w-4 text-green-900" />
                <span>{i}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            The solution
          </h2>
          <p className="mt-4 text-slate-600">
            A classroom platform with built‑in AI detection, automated
            rubric‑based grading, and one‑click reporting. Design classrooms,
            post assignments, collect submissions, and get fair, consistent
            results—fast.
          </p>
          <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: Brain, label: "AI Submission Check" },
              { icon: GaugeCircle, label: "Rubric Auto‑Grading" },
              { icon: FileSpreadsheet, label: "Excel & CSV Reports" },
              { icon: Clock, label: "Deadlines & Reminders" },
            ].map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2"
              >
                <Icon className="h-4 w-4 text-green-900" />{" "}
                <span className="text-sm">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Container>
  );
}

function FeatureCard({
  title,
  desc,
  points,
  Icon,
}: {
  title: string;
  desc: string;
  points: string[];
  Icon: any;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-green-900" />
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <p className="mt-2 text-sm text-slate-600">{desc}</p>
      <ul className="mt-4 space-y-2 text-sm text-slate-600">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 text-green-900" /> <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FeatureGrid() {
  return (
    <section id="features">
      <Container className="py-20">
        <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
          Everything you need to run fair assignments
        </h2>
        <p className="mt-3 text-center text-slate-600">
          Classroom creation, assignment distribution, AI checks, auto‑grading,
          and reporting—all in one place.
        </p>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <FeatureCard
            title="Classrooms & Roster"
            desc="Set up courses, invite students, and manage sections with ease."
            points={[
              "Multiple classes per instructor",
              "Join via code or email",
              "Granular roles & permissions",
            ]}
            Icon={GraduationCap}
          />
          <FeatureCard
            title="Assignments & Deadlines"
            desc="Publish instructions, attach files, set due dates, and schedule reminders."
            points={[
              "Rich text editor",
              "Rubric templates",
              "Late submission windows",
            ]}
            Icon={Clock}
          />
          {/* <FeatureCard
            title="AI Detection"
            desc="Flag suspected AI‑generated text at submission with transparent feedback."
            points={[
              "Model‑agnostic detectors",
              "Confidence scoring",
              "Student resubmission flow",
            ]}
            Icon={Brain}
          /> */}
          <FeatureCard
            title="Auto‑Grading"
            desc="Rubric‑aware evaluation across relevance, effort, quality, and completeness."
            points={[
              "Consistent scoring",
              "Instructor overrides",
              "Comment bank",
            ]}
            Icon={GaugeCircle}
          />
          <FeatureCard
            title="Reports & Exports"
            desc="Download structured Excel/CSV and share with faculty in one click."
            points={[
              "Per‑class gradebooks",
              "Per‑assignment summaries",
              "Audit trails",
            ]}
            Icon={FileSpreadsheet}
          />
          <FeatureCard
            title="Cloud & Security"
            desc="Scale on your cloud with privacy and compliance best practices."
            points={[
              "SAML/SSO ready",
              "Row‑level security",
              "Encrypted at rest & in transit",
            ]}
            Icon={Cloud}
          />
        </div>
      </Container>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      title: "Create classes",
      desc: "Spin up a course, add students, and drop your rubric.",
      icon: GraduationCap,
    },
    {
      title: "Post assignment",
      desc: "Attach instructions, files, and set a due date.",
      icon: Clock,
    },
    {
      title: "Extract & grade",
      desc: "AI extracts content and grades originals.",
      icon: Brain,
    },
    {
      title: "Export report",
      desc: "Send gradebook as Excel/CSV to instructors.",
      icon: FileSpreadsheet,
    },
  ];
  return (
    <section id="how" className="bg-slate-50 border-y border-slate-200">
      <Container className="py-20">
        <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
          How it works
        </h2>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-6">
          {steps.map(({ title, desc, icon: Icon }, idx) => (
            <div
              key={title}
              className="relative rounded-2xl border border-slate-200 bg-white p-6"
            >
              <div className="absolute -top-3 left-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-950 text-white font-bold">
                {idx + 1}
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Icon className="h-5 w-5 text-green-900" />
                <h3 className="font-semibold">{title}</h3>
              </div>
              <p className="mt-2 text-sm text-slate-600">{desc}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function Outcomes() {
  const stats = [
    { label: "Faster grading", value: "10×" },
    { label: "Manual review reduction", value: "-70%" },
    { label: "Integrity alerts accuracy", value: "95%" },
  ];
  return (
    <Container className="py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Outcomes that matter
          </h2>
          <p className="mt-4 text-slate-600">
            Free up faculty time, preserve fairness, and scale across
            departments without adding headcount.
          </p>
          <ul className="mt-6 space-y-3 text-slate-600">
            {[
              "Fair evaluation based on genuine effort",
              "Scales to thousands of submissions per semester",
              "Transparent, auditable reports for faculty",
            ].map((i) => (
              <li key={i} className="flex items-start gap-3">
                <Check className="mt-1 h-5 w-5 text-green-900" />
                <span>{i}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-slate-200 bg-white p-6 text-center"
            >
              <div className="text-3xl font-bold text-slate-900">{s.value}</div>
              <div className="mt-1 text-xs text-slate-600">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}

function TechStack() {
  const items = [
    { label: "React.js", icon: Rocket },
    { label: "Flask", icon: GaugeCircle },
    { label: "LLMs", icon: Brain },
    { label: "Postgres/MongoDB", icon: FileSpreadsheet },
    // { label: "AWS/GCP", icon: Cloud },
    // { label: "SSO/SAML", icon: Shield },
  ];
  return (
    <Container className="py-20">
      <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
        Built on proven tech
      </h2>
      <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 justify-center">
        {items.map(({ label, icon: Icon }) => (
          <div
            key={label}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <Icon className="h-4 w-4 text-green-900" /> {label}
          </div>
        ))}
      </div>
    </Container>
  );
}

function Pricing() {
  const tiers = [
    {
      name: "Starter",
      price: "$0",
      tagline: "For pilots and small classes",
      features: [
        "1 instructor • 1 class",
        "Up to 200 submissions/mo",
        "AI detection (basic)",
        "CSV/Excel export",
      ],
      cta: "Get started",
      popular: false,
    },
    {
      name: "Pro",
      price: "$49",
      tagline: "Best for departments",
      features: [
        "Unlimited classes",
        "Up to 5,000 submissions/mo",
        "Advanced AI detection",
        "Rubric auto‑grading",
      ],
      cta: "Start Pro",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Talk to us",
      tagline: "Institution‑wide scale & security",
      features: [
        "SSO/SAML",
        "Custom detectors",
        "VPC & on‑prem options",
        "Dedicated success manager",
      ],
      cta: "Contact sales",
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="bg-slate-50 border-y border-slate-200">
      <Container className="py-20">
        <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
          Simple pricing
        </h2>
        <p className="mt-3 text-center text-slate-600">
          Scale from a single course to an entire university.
        </p>
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`relative rounded-2xl border ${
                t.popular ? "border-green-900" : "border-slate-200"
              } bg-white p-6`}
            >
              {t.popular && (
                <div className="absolute -top-3 left-6 rounded-full bg-green-950 px-3 py-1 text-xs font-bold text-white">
                  POPULAR
                </div>
              )}
              <h3 className="text-lg font-semibold">{t.name}</h3>
              <div className="mt-2 text-3xl font-bold">
                {t.price}
                <span className="text-sm font-normal text-slate-500">/mo</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{t.tagline}</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-green-900" />{" "}
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href="#cta"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-950 px-4 py-2 font-semibold text-white hover:bg-green-800 transition"
              >
                {t.cta}
              </a>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function FAQ() {
  const faqs = [
    {
      q: "How reliable is AI detection?",
      a: "We combine multiple detectors and provide confidence scores. Instructors can override any decision and request resubmissions.",
    },
    {
      q: "Can I use my own rubric?",
      a: "Yes. Create, reuse, and share rubric templates across courses and departments.",
    },
    {
      q: "Do you support on‑prem?",
      a: "Enterprise plans support VPC deployment and on‑prem options with full data ownership.",
    },
    {
      q: "What file types are supported?",
      a: "PDF, DOCX, and plain text by default. Others can be enabled per institution.",
    },
  ];
  return (
    <section id="faq">
      <Container className="py-20">
        <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
          Frequently asked questions
        </h2>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          {faqs.map(({ q, a }) => (
            <details
              key={q}
              className="group rounded-xl border border-slate-200 bg-white p-5"
            >
              <summary className="cursor-pointer list-none font-medium">
                {q}
              </summary>
              <p className="mt-2 text-sm text-slate-600">{a}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}

function CTA({
  onSignIn,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  onSignIn: () => void;
}) {
  return (
    <section id="cta" className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(800px_300px_at_50%_-100px,rgba(16,185,129,0.1),transparent)]" />
      <Container className="py-20 text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Bring fairness back to continuous assessment
        </h2>
        <p className="mt-3 text-slate-600">
          Launch your first class in minutes. No credit card required.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
          <button
            onClick={onSignIn}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-green-950 px-4 py-2 font-semibold text-white hover:bg-green-800 transition"
          >
            Create free account
          </button>
          {/* <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50 transition">
            Book a demo
          </button> */}
        </div>
      </Container>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200">
      <Container className="py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <a href="#" className="flex items-center gap-2 font-semibold">
            <img src="IntelliClass.jpg" alt="Logo" width="50" /> IntelliClass
          </a>
          <nav className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
            <a href="#features" className="hover:text-slate-900">
              Features
            </a>
            <a href="#how" className="hover:text-slate-900">
              How it works
            </a>
            <a href="#pricing" className="hover:text-slate-900">
              Pricing
            </a>
            <a href="#faq" className="hover:text-slate-900">
              FAQ
            </a>
            <a href="#" className="hover:text-slate-900">
              Docs
            </a>
            <a href="#" className="hover:text-slate-900">
              Privacy
            </a>
          </nav>
        </div>
        <p className="mt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} IntelliClass. All rights reserved.
        </p>
      </Container>
    </footer>
  );
}

export default Landing;
