import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Eye,
  EyeOff,
  BookOpen,
  ArrowRight,
  Loader2,
  Plus,
  X,
  Pencil,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

interface AuthFormData {
  name: string;
  email: string;
  password: string;
  university: string;
  course: string;
  yearOfStudy: number;
}

interface AuthFormProps {
  type: "login" | "register";
  onSwitch: () => void;
  onClose: () => void;
}

const YEAR_OPTIONS = [1, 2, 3, 4, 5, 6];

const PREDEFINED_UNIVERSITIES = [
  "Makerere University",
  "Kyambogo University",
  "Uganda Christian University",
  "Victoria University",
  "Ndejje University",
  "MUBS",
];

const PREDEFINED_COURSES = [
  "Computer Science",
  "Software Engineering",
  "Information Technology",
  "Medicine",
  "Law",
  "Business Administration",
  "Economics",
  "Civil Engineering",
  "Electrical Engineering",
];

//  Reusable field wrapper
function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}

//  Shared input class
const inputClass = (hasError?: string) =>
  `w-full px-4 py-2.5 text-sm rounded-xl border bg-slate-50 text-slate-800 outline-none transition-all duration-150 focus:bg-white focus:ring-2 focus:ring-teal-500/20 ${
    hasError
      ? "border-red-400 focus:border-red-400"
      : "border-slate-200 focus:border-teal-500"
  }`;

//  CustomSelectField ─
/**
 * Unified component for "pick from list OR type your own".
 * State machine:
 *   "select"  → shows <select> + "Add yours" button
 *   "typing"  → shows text input + Add / Cancel
 *   "custom"  → shows teal badge with Edit button
 *
 * Predefined picks stay in "select" mode (value shown via the <select>).
 */
type SelectMode = "select" | "typing" | "custom";

function CustomSelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  addLabel,
  typingPlaceholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  addLabel: string;
  typingPlaceholder: string;
  error?: string;
}) {
  const isCustom = value !== "" && !options.includes(value);
  const [mode, setMode] = useState<SelectMode>(isCustom ? "custom" : "select");
  const [draft, setDraft] = useState(isCustom ? value : "");

  const commit = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onChange(trimmed);
    setMode("custom");
  };

  const startEdit = () => {
    setDraft(value);
    onChange(""); // clear so validation doesn't think it's set while editing
    setMode("typing");
  };

  const cancelTyping = () => {
    // If we were editing an existing custom value, restore it
    if (draft.trim() && isCustom) {
      onChange(draft.trim());
      setMode("custom");
    } else {
      setDraft("");
      setMode("select");
    }
  };

  const clearCustom = () => {
    onChange("");
    setDraft("");
    setMode("select");
  };

  return (
    <Field label={label} error={error}>
      {/* ── SELECT mode ── */}
      {mode === "select" && (
        <div className="flex flex-col gap-2">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass(error)}
          >
            <option value="" disabled>
              {placeholder}
            </option>
            {options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              setDraft("");
              setMode("typing");
            }}
            className="inline-flex w-fit items-center cursor-pointer gap-1.5 rounded-lg border border-dashed border-teal-300 bg-teal-50 px-3 py-2 text-xs font-medium text-teal-700 transition hover:border-teal-400 hover:bg-teal-100"
          >
            <Plus size={13} />
            {addLabel}
          </button>
        </div>
      )}

      {/* ── TYPING mode ── */}
      {mode === "typing" && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && (e.preventDefault(), commit())
            }
            placeholder={typingPlaceholder}
            autoFocus
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
          <div className="mt-2.5 flex items-center gap-2">
            <button
              type="button"
              onClick={commit}
              disabled={!draft.trim()}
              className="rounded-lg bg-teal-600 px-4 py-2 cursor-pointer text-xs font-semibold text-white transition hover:bg-teal-700 disabled:opacity-40"
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={cancelTyping}
              className="inline-flex items-center gap-1 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={12} />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── CUSTOM badge mode ── */}
      {mode === "custom" && (
        <div className="flex items-center justify-between rounded-xl border border-teal-200 bg-teal-50 px-3.5 py-3">
          <span className="text-sm font-semibold text-teal-800 truncate pr-2">
            {value}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={startEdit}
              className="inline-flex items-center gap-1 cursor-pointer rounded-lg border border-teal-200 bg-white px-2.5 py-1.5 text-xs font-medium text-teal-700 transition hover:bg-teal-100"
            >
              <Pencil size={11} />
              Edit
            </button>
            <button
              type="button"
              onClick={clearCustom}
              className="inline-flex items-center cursor-pointer  rounded-lg border border-slate-200 bg-white p-1.5 text-slate-400 transition hover:bg-red-50 hover:border-red-200 hover:text-red-500"
              aria-label="Remove"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}
    </Field>
  );
}

//  Main AuthForm
export function AuthForm({ type, onSwitch, onClose }: AuthFormProps) {
  const { login, register: registerApi } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [university, setUniversity] = useState("");
  const [course, setCourse] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState<number>(1);
  const [role, setRole] = useState<"student" | "instructor">("student");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [instructorDepartment, setInstructorDepartment] = useState("");
  const [instructorBio, setInstructorBio] = useState("");
  const [errors, setErrors] = useState<
    Partial<AuthFormData & { general: string; department: string; bio: string }>
  >({});

  function validate(): boolean {
    const e: typeof errors = {};

    if (!email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email";

    if (!password) e.password = "Password is required";
    else if (password.length < 6) e.password = "Must be at least 6 characters";

    if (type === "register") {
      if (!name.trim()) e.name = "Your name is required";
      if (!university) e.university = "Please select or add your university";

      if (role === "student" && !course)
        e.course = "Please select or add your course";

      if (role === "instructor") {
        if (!instructorDepartment.trim())
          e.department = "Department is required";
        if (!instructorBio.trim()) e.bio = "A short bio is required";
      }
    }

    setErrors(e);

    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      let regRes: any = null;
      if (type === "login") {
        await login(email, password);
      } else {
        regRes = await registerApi({
          name,
          email,
          password,
          university,
          course,
          year_of_study: role === "student" ? yearOfStudy : 1,
          role,
          ...(role === "instructor"
            ? {
                department: instructorDepartment.trim(),
                bio: instructorBio.trim(),
              }
            : {}),
        });
      }
      onClose();
      navigate(type === "register" ? "/verify-email" : "/dashboard", {
        state: type === "register" ? { email, verificationLink: regRes?.verificationLink } : undefined,
      });
    } catch (err) {
      setErrors({
        general: err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center shadow-md shadow-teal-600/30">
          <BookOpen size={18} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            {type === "login" ? "Welcome back" : "Join the circle"}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {type === "login"
              ? "Sign in to continue learning"
              : "Create your free account"}
          </p>
        </div>
      </div>

      {errors.general && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {type === "register" && (
          <>
            {/* Role toggle */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
              {(["student", "instructor"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer capitalize ${
                    role === r
                      ? "bg-teal-600 text-white shadow-md shadow-teal-600/25"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  As {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>

            {/* Full name */}
            <Field label="Full name" error={errors.name}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className={inputClass(errors.name)}
                autoComplete="name"
              />
            </Field>

            {/* Instructor-only fields */}
            {role === "instructor" && (
              <>
                <Field label="Department" error={errors.department}>
                  <input
                    type="text"
                    value={instructorDepartment}
                    onChange={(e) => setInstructorDepartment(e.target.value)}
                    placeholder="e.g. Computer Science"
                    className={inputClass(errors.department)}
                  />
                </Field>
                <Field label="Short bio" error={errors.bio}>
                  <textarea
                    value={instructorBio}
                    onChange={(e) => setInstructorBio(e.target.value)}
                    placeholder="Tell learners about your expertise"
                    className={`${inputClass(errors.bio)} min-h-[90px] resize-y`}
                  />
                </Field>
              </>
            )}

            {/* University row */}
            <div
              className={`grid gap-4 ${role === "student" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}
            >
              <CustomSelectField
                label="University"
                value={university}
                onChange={(v) => {
                  setUniversity(v);
                  if (v && errors.university)
                    setErrors((p) => ({ ...p, university: undefined }));
                }}
                options={PREDEFINED_UNIVERSITIES}
                placeholder="Select university"
                addLabel="My university isn't listed"
                typingPlaceholder="e.g. Uganda Martyrs University"
                error={errors.university}
              />

              {role === "student" && (
                <Field label="Year of study">
                  <select
                    value={yearOfStudy}
                    onChange={(e) => setYearOfStudy(Number(e.target.value))}
                    className={inputClass()}
                  >
                    {YEAR_OPTIONS.map((y) => (
                      <option key={y} value={y}>
                        Year {y}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
            </div>

            {/* Course — students only */}
            {role === "student" && (
              <CustomSelectField
                label="Course / Programme"
                value={course}
                onChange={(v) => {
                  setCourse(v);
                  if (v && errors.course)
                    setErrors((p) => ({ ...p, course: undefined }));
                }}
                options={PREDEFINED_COURSES}
                placeholder="Select course"
                addLabel="My course isn't listed"
                typingPlaceholder="e.g. Biomedical Engineering"
                error={errors.course}
              />
            )}
          </>
        )}

        {/* Email */}
        <Field label="Email address" error={errors.email}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@gmail.com"
            className={inputClass(errors.email)}
            autoComplete="email"
          />
        </Field>

        {/* Password */}
        <Field label="Password" error={errors.password}>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`${inputClass(errors.password)} pr-11`}
              autoComplete={
                type === "login" ? "current-password" : "new-password"
              }
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </Field>

        {type === "login" && (
          <div className="flex justify-end -mt-2">
            <button
              type="button"
              className="text-xs text-teal-600 hover:text-teal-500 font-medium transition-colors"
            >
              Forgot password?
            </button>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center cursor-pointer justify-center gap-2 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-300 text-white py-3 rounded-xl font-semibold text-sm transition-all duration-150 mt-1 shadow-md shadow-teal-600/20"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {type === "login" ? "Signing in…" : "Creating account…"}
            </>
          ) : (
            <>
              {type === "login" ? "Sign in" : "Create account"}
              <ArrowRight size={16} />
            </>
          )}
        </button>

        <p className="text-center text-sm text-slate-500 mt-1">
          {type === "login"
            ? "Don't have an account?"
            : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={onSwitch}
            className="text-teal-600 cursor-pointer hover:text-teal-500 font-semibold transition-colors"
          >
            {type === "login" ? "Create one free" : "Sign in"}
          </button>
        </p>
      </form>
    </div>
  );
}
