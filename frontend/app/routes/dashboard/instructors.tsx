import { useState } from "react";
import { Loader2, MessageCircle } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { usePrivateChat } from "../../context/PrivateChatContext";
import { UserAvatar } from "../../components/UserAvatar";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

interface Instructor {
  id: string;
  name: string;
  university: string;
  avatar_url: string | null;
  department: string;
  bio: string;
  follower_count: number;
  course_count: number;
  is_following: boolean;
}

export default function InstructorsPage() {
  const { token } = useAuth();
  const { openChat } = usePrivateChat();
  const queryClient = useQueryClient();

  const { data: instructors = [], isLoading: loading } = useQuery<Instructor[]>({
    queryKey: ["instructors"],
    queryFn: () =>
      fetch(`${API_URL}/instructors`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    enabled: !!token,
  });

  async function toggleFollow(id: string, following: boolean) {
    await fetch(`${API_URL}/instructors/${id}/follow`, {
      method: following ? "DELETE" : "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    queryClient.invalidateQueries({ queryKey: ["instructors"] });
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Instructors</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Follow instructors and message them directly
        </p>
      </div>

      {loading ? (
        <Loader2 className="animate-spin text-teal-600 mx-auto" size={24} />
      ) : (
        <div className="space-y-3">
          {instructors.map((inst) => (
            <div
              key={inst.id}
              className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4"
            >
              <UserAvatar
                userId={inst.id}
                name={inst.name}
                avatarUrl={inst.avatar_url}
                size="lg"
                onClick={() =>
                  openChat({
                    id: inst.id,
                    name: inst.name,
                    avatar_url: inst.avatar_url,
                    university: inst.university,
                  })
                }
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900">{inst.name}</p>
                <p className="text-xs text-slate-400">
                  {inst.department} · {inst.university}
                </p>
                <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                  {inst.bio}
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  {inst.follower_count} followers · {inst.course_count} courses
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => toggleFollow(inst.id, inst.is_following)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      inst.is_following
                        ? "bg-slate-100 text-slate-600"
                        : "bg-teal-600 text-white hover:bg-teal-500"
                    }`}
                  >
                    {inst.is_following ? "Following" : "Follow"}
                  </button>
                  <button
                    onClick={() =>
                      openChat({
                        id: inst.id,
                        name: inst.name,
                        avatar_url: inst.avatar_url,
                        university: inst.university,
                      })
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    <MessageCircle size={14} /> Message
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
