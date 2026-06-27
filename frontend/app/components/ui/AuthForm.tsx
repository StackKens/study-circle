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

export function AuthForm({ type, onSwitch, onClose }: AuthFormProps) {
  const { login, register: registerApi } = useAuth();

  const navigate = useNavigate();

  // Base fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [university, setUniversity] = useState("");
  const [course, setCourse] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState<number>(1);
  const [role, setRole] = useState<"student" | "instructor">("student");

  // Custom input toggles and temporary values
  const [showCustomUniversityInput, setShowCustomUniversityInput] =
    useState(false);
  const [customUniversityName, setCustomUniversityName] = useState("");
  const [showCustomCourseInput, setShowCustomCourseInput] = useState(false);
  const [customCourseName, setCustomCourseName] = useState("");

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<
    Partial<AuthFormData & { general: string }>
  >({});

  // Helper: get final value for backend
  const getFinalUniversity = () => {
    if (university && !PREDEFINED_UNIVERSITIES.includes(university))
      return university;
    return university;
  };

  const getFinalCourse = () => {
    if (course && !PREDEFINED_COURSES.includes(course)) return course;
    return course;
  };

  // Add custom university
  const handleAddCustomUniversity = () => {
    if (customUniversityName.trim()) {
      setUniversity(customUniversityName.trim());
      setShowCustomUniversityInput(false);
      setCustomUniversityName("");
      if (errors.university)
        setErrors((prev) => ({ ...prev, university: undefined }));
    }
  };

  // Add custom course
  const handleAddCustomCourse = () => {
    if (customCourseName.trim()) {
      setCourse(customCourseName.trim());
      setShowCustomCourseInput(false);
      setCustomCourseName("");
      if (errors.course) setErrors((prev) => ({ ...prev, course: undefined }));
    }
  };

  // Validation
  function validate(): boolean {
    const newErrors: Partial<AuthFormData & { general: string }> = {};

    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email))
      newErrors.email = "Enter a valid email";

    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6)
      newErrors.password = "Must be at least 6 characters";

    if (type === "register") {
      if (!name.trim()) newErrors.name = "Your name is required";
      if (!university)
        newErrors.university = "Please select or add your university";
      if (!course) newErrors.course = "Please select or add your course";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // Submit handler
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      if (type === "login") {
        await login(email, password);
      } else {
        await registerApi({
          name,
          email,
          password,
          university: getFinalUniversity(),
          course: getFinalCourse(),
          year_of_study: yearOfStudy,
          role,
        });
      }
      onClose();
      if (type === "register") {
        navigate("/verify-email", { state: { email } });
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setErrors({
        general: err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      setIsLoading(false);
    }
  }
  const inputClass = (hasError?: string) =>
    `w-full px-4 py-2.5 text-sm rounded-xl border bg-slate-50 text-slate-800 outline-none transition-all duration-150 focus:bg-white focus:ring-2 focus:ring-teal-500/20 ${
      hasError
        ? "border-red-400 focus:border-red-400"
        : "border-slate-200 focus:border-teal-500"
    }`;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center">
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
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRole("student")}
                className={`flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  role === "student"
                    ? "bg-teal-600 text-white shadow-md shadow-teal-600/30"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                As Student
              </button>
              <button
                type="button"
                onClick={() => setRole("instructor")}
                className={`flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  role === "instructor"
                    ? "bg-teal-600 text-white shadow-md shadow-teal-600/30"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                As Instructor
              </button>
            </div>

            {/* Full name */}
            <Field label="Full name" error={errors.name}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className={inputClass(errors.name)}
                autoComplete="name"
              />
            </Field>

            {/* University & Year row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* University field */}
              <Field label="University" error={errors.university}>
                {!university || PREDEFINED_UNIVERSITIES.includes(university) ? (
                  <>
                    <select
                      value={university}
                      onChange={(e) => setUniversity(e.target.value)}
                      className={inputClass(errors.university)}
                    >
                      <option value="" disabled>
                        Select university
                      </option>
                      {PREDEFINED_UNIVERSITIES.map((uni) => (
                        <option key={uni} value={uni}>
                          {uni}
                        </option>
                      ))}
                    </select>
                    {!showCustomUniversityInput ? (
                      <button
                        type="button"
                        onClick={() => setShowCustomUniversityInput(true)}
                        className="mt-2 text-sm text-teal-600 cursor-pointer hover:text-teal-700 flex items-center gap-1"
                      >
                        <Plus size={14} /> Add your university if not listed
                      </button>
                    ) : (
                      <div className="mt-2 flex gap-2 items-center">
                        <input
                          type="text"
                          value={customUniversityName}
                          onChange={(e) =>
                            setCustomUniversityName(e.target.value)
                          }
                          placeholder="e.g. Uganda Martyrs University"
                          className={`flex-1 px-3 py-2 text-sm rounded-lg border ${inputClass("")} border-slate-200`}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomUniversity}
                          className="px-3 py-2 bg-teal-600  cursor-pointer text-white text-sm rounded-lg hover:bg-teal-700"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCustomUniversityInput(false);
                            setCustomUniversityName("");
                          }}
                          className="p-2 text-slate-400 cursor-pointer hover:text-slate-600"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-teal-50 border border-teal-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-teal-700 font-medium">
                        {university}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const currentCustom = university;
                        setUniversity("");
                        setShowCustomUniversityInput(true);
                        setCustomUniversityName(currentCustom);
                      }}
                      className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                      Edit
                    </button>
                  </div>
                )}
              </Field>

              {/* Year of study */}
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
            </div>

            {/* Course field */}
            <Field label="Course / Programme" error={errors.course}>
              {!course || PREDEFINED_COURSES.includes(course) ? (
                <>
                  <select
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className={inputClass(errors.course)}
                  >
                    <option value="" disabled>
                      Select course
                    </option>
                    {PREDEFINED_COURSES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {!showCustomCourseInput ? (
                    <button
                      type="button"
                      onClick={() => setShowCustomCourseInput(true)}
                      className="mt-2 text-sm cursor-pointer text-teal-600 hover:text-teal-700 flex items-center gap-1"
                    >
                      <Plus size={14} /> Add your course if not listed
                    </button>
                  ) : (
                    <div className="mt-2 flex gap-2 items-center">
                      <input
                        type="text"
                        value={customCourseName}
                        onChange={(e) => setCustomCourseName(e.target.value)}
                        placeholder="e.g. Biomedical Engineering"
                        className={`flex-1 px-3 py-2 text-sm rounded-lg border ${inputClass("")} border-slate-200`}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomCourse}
                        className="px-3 py-2 bg-teal-600 cursor-pointer text-white text-sm rounded-lg hover:bg-teal-700"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCustomCourseInput(false);
                          setCustomCourseName("");
                        }}
                        className="p-2 text-slate-400 cursor-pointer hover:text-slate-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-between p-3 bg-teal-50 border border-teal-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-teal-700 font-medium">{course}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const currentCustom = course;
                      setCourse("");
                      setShowCustomCourseInput(true);
                      setCustomCourseName(currentCustom);
                    }}
                    className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                    Edit
                  </button>
                </div>
              )}
            </Field>
          </>
        )}

        {/* Shared fields: email and password */}
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer hover:text-slate-600"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </Field>

        {type === "login" && (
          <div className="flex justify-end -mt-2">
            <button
              type="button"
              className="text-xs text-teal-600 hover:text-teal-500 font-medium"
            >
              Forgot password?
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center cursor-pointer justify-center gap-2 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-300 text-white py-3 rounded-xl font-semibold text-sm transition-all duration-150 mt-1"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {type === "login" ? "Signing in..." : "Creating account..."}
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
            className="text-teal-600  cursor-pointer hover:text-teal-500 font-semibold"
          >
            {type === "login" ? "Create one free" : "Sign in"}
          </button>
        </p>
      </form>
    </div>
  );
}
