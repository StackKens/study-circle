import { useParams, Link } from "react-router";
import { ArrowLeft, Clock, User } from "lucide-react";
import { getPostBySlug, blogPosts } from "../data/blog-posts";
import type { BlogSection } from "../data/blog-posts";

export function meta() {
  return [{ title: "Blog · StudyCircle" }];
}

function RenderSection({ section }: { section: BlogSection }) {
  switch (section.type) {
    case "heading":
      return (
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-10 mb-4">
          {section.text}
        </h2>
      );
    case "paragraph":
      return (
        <p className="text-slate-600 leading-[1.8] text-[15px] mb-5">
          {section.text}
        </p>
      );
    case "image":
      return (
        <figure className="my-8 rounded-xl overflow-hidden border border-slate-100">
          <img
            src={section.src}
            alt={section.alt}
            className="w-full h-auto object-cover"
            loading="lazy"
          />
        </figure>
      );
    case "quote":
      return (
        <blockquote className="my-8 border-l-4 border-teal-400 pl-5 py-1 bg-teal-50/50 rounded-r-lg">
          <p className="text-slate-700 text-[15px] leading-relaxed italic">
            {section.text}
          </p>
          {section.author && (
            <cite className="block mt-2 text-xs text-slate-400 not-italic">
              — {section.author}
            </cite>
          )}
        </blockquote>
      );
    case "list":
      return (
        <ul className="my-5 space-y-2.5 pl-1">
          {section.items.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-2.5 text-slate-600 text-[15px] leading-relaxed"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-2.5 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      );
    default:
      return null;
  }
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = getPostBySlug(slug ?? "");

  if (!post) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">
          Post not found
        </h1>
        <p className="text-slate-500 text-sm mb-6">
          The blog post you're looking for doesn't exist.
        </p>
        <Link
          to="/blog"
          className="text-sm font-semibold text-teal-600 hover:text-teal-700"
        >
          ← Back to blog
        </Link>
      </main>
    );
  }

  const currentIndex = blogPosts.findIndex((p) => p.slug === slug);
  const nextPost = blogPosts[currentIndex + 1] ?? blogPosts[0];

  return (
    <main className="bg-white">
      {/* Hero image */}
      <div className="w-full h-64 sm:h-80 md:h-96 relative overflow-hidden">
        <img
          src={post.heroImage}
          alt={post.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
          <div className="max-w-3xl mx-auto">
            <Link
              to="/blog"
              className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-xs font-medium mb-4 transition-colors"
            >
              <ArrowLeft size={13} />
              Back to blog
            </Link>
          </div>
        </div>
      </div>

      {/* Article */}
      <article className="max-w-3xl mx-auto px-6 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10">
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md ${post.tagColor}`}
            >
              {post.tag}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Clock size={11} />
              {post.readTime}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight leading-tight mb-5">
            {post.title}
          </h1>

          {/* Author */}
          <div className="flex items-center gap-3 pb-6 mb-8 border-b border-slate-100">
            <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center">
              <User size={15} className="text-teal-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">
                {post.author}
              </p>
              <p className="text-xs text-slate-400">{post.date}</p>
            </div>
          </div>

          {/* Content */}
          <div>
            {post.content.map((section, i) => (
              <RenderSection key={i} section={section} />
            ))}
          </div>

          {/* CTA */}
          <div className="mt-12 pt-8 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500 mb-4">
              Ready to study smarter with others?
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors shadow-md shadow-teal-600/20"
            >
              Join StudyCircle Free
            </Link>
          </div>
        </div>
      </article>

      {/* Next post */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-4">
          Next up
        </p>
        <Link
          to={`/blog/${nextPost.slug}`}
          className="group block p-6 bg-slate-50 rounded-xl border border-slate-200 hover:border-teal-200 hover:bg-white transition-all"
        >
          <span
            className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${nextPost.tagColor}`}
          >
            {nextPost.tag}
          </span>
          <h3 className="text-lg font-bold text-slate-900 mt-3 mb-2 group-hover:text-teal-700 transition-colors">
            {nextPost.title}
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            {nextPost.excerpt}
          </p>
        </Link>
      </section>
    </main>
  );
}
