import { Link } from "react-router";
import { ArrowRight, Clock } from "lucide-react";
import { blogPosts } from "../data/blog-posts";

export function meta() {
  return [{ title: "Blog · StudyCircle" }];
}

export default function Blog() {
  const featured = blogPosts[0];
  const rest = blogPosts.slice(1);

  return (
    <main className="bg-white">
      {/* Header */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-12">
        <p className="text-teal-600 text-[11px] font-semibold uppercase tracking-[0.16em] mb-3">
          Blog
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-4">
          Study smarter, together
        </h1>
        <p className="text-slate-500 text-sm sm:text-base leading-relaxed max-w-xl">
          Study tips, platform updates, and insights on collaborative learning.
        </p>
      </section>

      {/* Featured post */}
      <section className="max-w-6xl mx-auto px-6 mb-12">
        <Link
          to={`/blog/${featured.slug}`}
          className="group block rounded-2xl overflow-hidden border border-slate-200 hover:border-teal-200 hover:shadow-lg transition-all"
        >
          <div className="md:flex">
            <div className="md:w-1/2 h-56 sm:h-72 md:h-auto relative overflow-hidden">
              <img
                src={featured.heroImage}
                alt={featured.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
            <div className="md:w-1/2 p-6 sm:p-8 md:p-10 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-4">
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md ${featured.tagColor}`}
                >
                  {featured.tag}
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock size={11} />
                  {featured.readTime}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-3 group-hover:text-teal-700 transition-colors">
                {featured.title}
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                {featured.excerpt}
              </p>
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  {featured.author} · {featured.date}
                </div>
                <span className="flex items-center gap-1 text-xs font-semibold text-teal-600 group-hover:text-teal-700">
                  Read
                  <ArrowRight
                    size={12}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </span>
              </div>
            </div>
          </div>
        </Link>
      </section>

      {/* Post grid */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rest.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="group block bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-teal-200 hover:shadow-md transition-all"
            >
              <div className="h-44 overflow-hidden relative">
                <img
                  src={post.heroImage}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${post.tagColor}`}
                  >
                    {post.tag}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock size={10} />
                    {post.readTime}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm leading-snug mb-2 group-hover:text-teal-700 transition-colors">
                  {post.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                  {post.excerpt}
                </p>
                <div className="mt-4 text-[11px] text-slate-400">
                  {post.date}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
