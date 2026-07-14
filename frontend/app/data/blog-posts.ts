export interface BlogPost {
  slug: string;
  title: string;
  tag: string;
  tagColor: string;
  excerpt: string;
  date: string;
  readTime: string;
  author: string;
  heroImage: string;
  content: BlogSection[];
}

export type BlogSection =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "image"; src: string; alt: string }
  | { type: "quote"; text: string; author?: string }
  | { type: "list"; items: string[] };

export const blogPosts: BlogPost[] = [
  {
    slug: "how-studycircle-started",
    title: "How StudyCircle Started: From One Campus to Students Everywhere",
    tag: "Origin Story",
    tagColor: "bg-violet-50 text-violet-600",
    excerpt:
      "We didn't build StudyCircle because we thought it was a cool idea. We built it because we were tired of studying alone.",
    date: "June 2026",
    readTime: "5 min read",
    author: "The StudyCircle Team",
    heroImage:
      "/blog/How it started.png",
    content: [
      {
        type: "paragraph",
        text: "It started with a simple frustration. We were university students juggling lectures, assignments, and part-time work. Every exam season, the same pattern repeated — we'd scramble for notes, text classmates last minute, and show up to study sessions unprepared.",
      },
      {
        type: "paragraph",
        text: "There was no single place where students could organize their academic lives. WhatsApp groups were chaotic. Google Drive folders were messy. And there was no way to find other students taking the same courses at your own university.",
      },
      {
        type: "heading",
        text: "The Problem We Knew Too Well",
      },
      {
        type: "paragraph",
        text: "Universities everywhere have the same issue — thousands of students, but most study in isolation. Lecture halls hold 200+ students. You sit next to someone for a whole semester and never learn their name. When exam time comes, you realize you don't have a single study partner.",
      },
      {
        type: "paragraph",
        text: "We talked to students across campuses in Uganda, Kenya, Nigeria, the UK, and the US. The same story everywhere: students wanted to collaborate but had no tools designed for how they actually study.",
      },
      {
        type: "heading",
        text: "What We Built First",
      },
      {
        type: "paragraph",
        text: "The first version of StudyCircle was embarrassingly simple. Just a way to create a group, share a file, and chat. That was it. No fancy features, no progress tracking, no session scheduling.",
      },
      {
        type: "paragraph",
        text: "But something unexpected happened. Within the first week, students from multiple campuses had created groups. They were sharing past papers, organizing study sessions, and actually showing up. The tool was working because it solved a real problem.",
      },
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1000&q=80",
        alt: "Students collaborating around a laptop",
      },
      {
        type: "heading",
        text: "Growing With Our Users",
      },
      {
        type: "paragraph",
        text: "We didn't design StudyCircle in a boardroom. We designed it in libraries, common rooms, and cafeteria tables. Every feature was born from a real request. 'Can we schedule study sessions?' became the session scheduler. 'I wish I could track what we've covered' became the progress tracker. 'How do I find students in my course?' became group matching.",
      },
      {
        type: "paragraph",
        text: "We added instructor support because lecturers kept asking if they could join. They wanted to share resources, post announcements, and see what their students were struggling with. So we built that too.",
      },
      {
        type: "heading",
        text: "Where We're Going",
      },
      {
        type: "paragraph",
        text: "StudyCircle is still early. We're a small team with big ambitions. We want to make collaborative studying the default way students learn — not the exception. Every feature we build is guided by one question: does this help students study better together?",
      },
      {
        type: "paragraph",
        text: "If you're reading this, you're part of the story. Welcome to StudyCircle.",
      },
    ],
  },
  {
    slug: "5-ways-study-groups-improve-grades",
    title: "5 Ways Study Groups Actually Improve Your Grades",
    tag: "Study Tips",
    tagColor: "bg-teal-50 text-teal-600",
    excerpt:
      "Research shows students who study in groups retain information better. Here's the science behind why — and how to make it work for you.",
    date: "July 2026",
    readTime: "4 min read",
    author: "The StudyCircle Team",
    heroImage:
      "/blog/gathered.png",
    content: [
      {
        type: "paragraph",
        text: "There's a myth that studying alone is the most effective way to learn. That quiet, focused, solo sessions are superior to working with others. The research says otherwise.",
      },
      {
        type: "paragraph",
        text: "A meta-analysis published in the Journal of Educational Psychology found that collaborative learning strategies consistently outperformed individual learning across multiple measures — including retention, critical thinking, and exam performance.",
      },
      {
        type: "heading",
        text: "1. Teaching Forces You to Understand",
      },
      {
        type: "paragraph",
        text: "The single most effective study technique is teaching someone else. When you explain a concept to a group member, you're forced to organize your thoughts, identify gaps in your understanding, and communicate clearly. This is called the Protégé Effect, and it's backed by decades of research.",
      },
      {
        type: "heading",
        text: "2. You Catch Your Own Mistakes",
      },
      {
        type: "paragraph",
        text: "In a study group, someone will always ask the question you didn't think to ask. They'll spot the assumption you made, the step you skipped, the concept you misunderstood. This peer feedback loop accelerates learning in ways solo study simply can't.",
      },
      {
        type: "heading",
        text: "3. Accountability Keeps You Consistent",
      },
      {
        type: "paragraph",
        text: "Let's be honest — it's easy to skip a solo study session. But when three other people are counting on you to show up and review Chapter 7, you show up. Study groups create social accountability that turns intention into action.",
      },
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1515169067868-5387ec356754?w=1000&q=80",
        alt: "Students studying together in a library",
      },
      {
        type: "heading",
        text: "4. Diverse Perspectives Deepen Understanding",
      },
      {
        type: "paragraph",
        text: "Everyone brings different strengths to a group. One person is great at math, another at theory, another at practical applications. When you combine these perspectives, everyone walks away with a richer understanding than they'd get alone.",
      },
      {
        type: "heading",
        text: "5. It Reduces Study Anxiety",
      },
      {
        type: "paragraph",
        text: "Exam stress is real, and it hurts performance. Study groups normalize the struggle. When you hear others say 'I don't get this either,' you realize you're not behind — you're just learning. That emotional support matters more than most students realize.",
      },
      {
        type: "quote",
        text: "If you want to go fast, go alone. If you want to go far, go together. This applies to studying more than almost anything else.",
      },
      {
        type: "heading",
        text: "How to Start",
      },
      {
        type: "paragraph",
        text: "You don't need a formal club or a big group. Start with 3-4 classmates. Set a regular time. Pick a topic. Take turns explaining concepts. That's it. StudyCircle makes it easy to organize, schedule, and stay on track — but the principle is simple: just start.",
      },
    ],
  },
  {
    slug: "best-study-schedule-university-students",
    title: "The Best Study Schedule for University Students",
    tag: "Productivity",
    tagColor: "bg-amber-50 text-amber-600",
    excerpt:
      "A practical, realistic study schedule that actually works — designed for students with lectures, assignments, and a life outside school.",
    date: "July 2026",
    readTime: "6 min read",
    author: "The StudyCircle Team",
    heroImage:
      "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1200&q=80",
    content: [
      {
        type: "paragraph",
        text: "Most study advice assumes you have unlimited time. You don't. You have lectures from 8am to 5pm, assignments due Friday, a part-time commitment, and maybe — just maybe — a social life. So let's build a schedule around reality, not fantasy.",
      },
      {
        type: "heading",
        text: "The Core Principle: Spread It Out",
      },
      {
        type: "paragraph",
        text: "Cramming doesn't work. Research consistently shows that spaced repetition — reviewing material at increasing intervals — produces dramatically better retention than marathon study sessions. One hour a day beats seven hours on Sunday.",
      },
      {
        type: "heading",
        text: "A Realistic Weekly Template",
      },
      {
        type: "list",
        items: [
          "Morning (before lectures): 30 min review of yesterday's material",
          "Between lectures: 15 min quick review of notes while fresh",
          "Evening (post-lectures): 1-2 hours focused study on the day's topics",
          "Weekend: 2-3 hour deep work session on assignments or upcoming exams",
          "One evening per week: Study group session (collaborative review)",
        ],
      },
      {
        type: "heading",
        text: "The 50/10 Rule",
      },
      {
        type: "paragraph",
        text: "Work for 50 minutes, break for 10. This isn't optional — it's neuroscience. Your brain needs rest to consolidate information. After 50 minutes of focused work, your attention drops sharply. The 10-minute break isn't laziness; it's strategy.",
      },
      {
        type: "paragraph",
        text: "During your 10-minute break: stand up, stretch, get water, look at something far away. Don't scroll social media — that's not a break, it's a different kind of mental load.",
      },
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1000&q=80",
        alt: "Student writing in a notebook with a planner",
      },
      {
        type: "heading",
        text: "Protect Your Peak Hours",
      },
      {
        type: "paragraph",
        text: "Everyone has 2-3 hours when their brain works best. For most people, this is mid-morning or early evening. Find yours. Guard those hours fiercely. This is when you do your hardest work — not easy review, but the stuff that requires real thinking.",
      },
      {
        type: "heading",
        text: "Use Study Groups Strategically",
      },
      {
        type: "paragraph",
        text: "Don't use group time to read notes together silently. That's wasted potential. Use group sessions for: explaining concepts to each other, working through practice problems, testing each other, and identifying collective weak spots. The group is for interaction, not parallel studying.",
      },
      {
        type: "quote",
        text: "A schedule isn't a prison. It's a framework that gives you freedom — because when you know when you'll study, you stop feeling guilty about not studying.",
      },
      {
        type: "heading",
        text: "Start Small, Stay Consistent",
      },
      {
        type: "paragraph",
        text: "Don't try to overhaul your entire life overnight. Pick one habit from this list. Do it for two weeks. Then add another. Consistency beats intensity every single time. The best study schedule is the one you actually follow.",
      },
    ],
  },
  {
    slug: "stay-motivated-during-exam-season",
    title: "How to Stay Motivated During Exam Season",
    tag: "Wellness",
    tagColor: "bg-rose-50 text-rose-600",
    excerpt:
      "Exam season breaks everyone. Here's how to keep going when your brain wants to quit — without burning out completely.",
    date: "July 2026",
    readTime: "4 min read",
    author: "The StudyCircle Team",
    heroImage:
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&q=80",
    content: [
      {
        type: "paragraph",
        text: "There's a point every exam season where it all feels impossible. You look at the amount of material, the number of days, and the distance between where you are and where you need to be. That gap feels crushing.",
      },
      {
        type: "paragraph",
        text: "Here's the truth: everyone feels this way. The students who get through it aren't superhuman. They just have systems.",
      },
      {
        type: "heading",
        text: "Shrink the Task",
      },
      {
        type: "paragraph",
        text: "Don't think about 'studying for finals.' Think about 'reviewing Chapter 3 for the next 45 minutes.' Big goals are paralyzing. Small actions are empowering. Break everything into tasks so small they feel almost too easy. Then do them one at a time.",
      },
      {
        type: "heading",
        text: "Start With the Hardest Thing",
      },
      {
        type: "paragraph",
        text: "Your willpower is highest in the first hour of studying. Don't waste it on easy review. Attack the hardest subject first, when you're freshest. Save the easier stuff for when your energy dips.",
      },
      {
        type: "heading",
        text: "Use the 'Two-Minute Rule'",
      },
      {
        type: "paragraph",
        text: "If something takes less than two minutes, do it now. Reply to that message. Write that note. Review that formula. These tiny completions build momentum. Motivation doesn't cause action — action causes motivation.",
      },
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=1000&q=80",
        alt: "Student studying late at night with coffee",
      },
      {
        type: "heading",
        text: "Study With Others (Seriously)",
      },
      {
        type: "paragraph",
        text: "Exam season is the worst time to study alone. The isolation amplifies anxiety. A study group gives you structure, accountability, and the simple comfort of knowing others are struggling alongside you. Even two hours with a friend can reset your entire mindset.",
      },
      {
        type: "heading",
        text: "Rest Is Not the Enemy",
      },
      {
        type: "paragraph",
        text: "Pulling all-nighters before exams is a rite of passage that shouldn't be. Sleep is when your brain consolidates memories. Studying for 12 hours on no sleep produces worse results than studying for 6 hours with 8 hours of sleep. This isn't opinion — it's neuroscience.",
      },
      {
        type: "quote",
        text: "You don't need to feel motivated to start. You need to start to feel motivated.",
      },
      {
        type: "heading",
        text: "Remember Why You Started",
      },
      {
        type: "paragraph",
        text: "When everything feels pointless, go back to your reason. Maybe it's your family. Maybe it's the career you're building. Maybe it's proving something to yourself. Whatever it is, write it on a sticky note and put it where you study. Motivation fades. Purpose doesn't.",
      },
    ],
  },
  {
    slug: "why-studying-alone-isnt-working",
    title: "Why Studying Alone Isn't Working (And What to Do Instead)",
    tag: "Study Tips",
    tagColor: "bg-teal-50 text-teal-600",
    excerpt:
      "Solo study feels productive but often isn't. Here's why — and the simple shift that changes everything.",
    date: "June 2026",
    readTime: "4 min read",
    author: "The StudyCircle Team",
    heroImage:
      "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&q=80",
    content: [
      {
        type: "paragraph",
        text: "Studying alone feels like the responsible thing to do. You find a quiet corner, open your notes, and read for hours. It feels productive. You're putting in the time. But at the end of the session, how much do you actually remember?",
      },
      {
        type: "paragraph",
        text: "For most students, the honest answer is: not enough. And there's a neurological reason for that.",
      },
      {
        type: "heading",
        text: "The Illusion of Competence",
      },
      {
        type: "paragraph",
        text: "When you read your notes, your brain recognizes the information. It feels familiar. You think you know it. But recognition isn't the same as understanding. You can read a solution a hundred times and still not be able to solve the problem yourself.",
      },
      {
        type: "paragraph",
        text: "This is called the 'illusion of competence' — one of the most well-documented cognitive biases in learning science. Solo study is particularly vulnerable to it because there's no one to challenge your understanding.",
      },
      {
        type: "heading",
        text: "What You're Missing",
      },
      {
        type: "list",
        items: [
          "Feedback — no one to tell you you're wrong",
          "Explanation — you never articulate concepts out loud",
          "Accountability — easy to drift off or stop early",
          "Perspective — you only see the problem from your angle",
          "Emotional support — isolation increases anxiety and reduces retention",
        ],
      },
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=1000&q=80",
        alt: "Students discussing and studying together",
      },
      {
        type: "heading",
        text: "The Simple Fix: Study With One Other Person",
      },
      {
        type: "paragraph",
        text: "You don't need a big group. Just one study partner can transform your learning. Here's why: when you explain something to someone else, your brain has to organize the information differently. You can't just recognize it — you have to understand it deeply enough to teach it.",
      },
      {
        type: "paragraph",
        text: "And when your partner asks a question you can't answer? That's the gap in your knowledge, revealed before the exam instead of during it.",
      },
      {
        type: "heading",
        text: "How to Make It Work",
      },
      {
        type: "list",
        items: [
          "Find someone taking the same course",
          "Set a regular time (even 30 minutes helps)",
          "Take turns explaining concepts out loud",
          "Quiz each other — active recall beats passive reading",
          "Use StudyCircle to organize, schedule, and share materials",
        ],
      },
      {
        type: "quote",
        text: "The student who studies alone and the student who studies with one partner are not in the same league. The difference compounds over an entire semester.",
      },
      {
        type: "paragraph",
        text: "Solo study has its place — quick review, reading ahead, personal reflection. But if it's your only strategy, you're leaving marks on the table. The shift to collaborative learning is small. The impact is not.",
      },
    ],
  },
  {
    slug: "how-to-run-effective-study-group",
    title: "How to Run an Effective Study Group",
    tag: "Guide",
    tagColor: "bg-blue-50 text-blue-600",
    excerpt:
      "Most study groups fail. Here's the framework that makes yours actually work — from the first session to exam day.",
    date: "July 2026",
    readTime: "5 min read",
    author: "The StudyCircle Team",
    heroImage:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80",
    content: [
      {
        type: "paragraph",
        text: "You've seen it before. A study group forms with enthusiasm. By the third session, half the members stop showing up. By the fifth, it's dead. The problem isn't the people — it's the structure.",
      },
      {
        type: "paragraph",
        text: "Effective study groups don't happen by accident. They follow a framework. Here's the one that works.",
      },
      {
        type: "heading",
        text: "Step 1: Set the Ground Rules Early",
      },
      {
        type: "paragraph",
        text: "Before your first session, agree on the basics: how often you'll meet, how long, where, and what happens if someone can't make it. Ambiguity kills groups. Clarity saves them.",
      },
      {
        type: "list",
        items: [
          "Meeting frequency: once or twice a week",
          "Session length: 60-90 minutes (not 3 hours)",
          "Location: consistent, quiet, accessible",
          "Attendance: what happens if someone skips?",
          "Roles: who leads each session? Rotate weekly",
        ],
      },
      {
        type: "heading",
        text: "Step 2: Keep It Small",
      },
      {
        type: "paragraph",
        text: "3-5 people is the sweet spot. Fewer than 3 and you don't get enough perspectives. More than 5 and it becomes a social gathering. Smaller groups mean more participation per person and less coordination overhead.",
      },
      {
        type: "heading",
        text: "Step 3: Have an Agenda (Always)",
      },
      {
        type: "paragraph",
        text: "Never meet without a plan. Before each session, the session leader posts an agenda: what topics will be covered, what materials to bring, and what the goal is. Without an agenda, study groups devolve into conversations about everything except studying.",
      },
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1000&q=80",
        alt: "Team collaborating at a table with notebooks",
      },
      {
        type: "heading",
        text: "Step 4: Use Active Learning Techniques",
      },
      {
        type: "paragraph",
        text: "Don't just read notes together silently. That's parallel studying, not group studying. Instead, use these techniques:",
      },
      {
        type: "list",
        items: [
          "Teach-back: one person explains, others ask questions",
          "Practice problems: work through questions individually, then compare",
          "Quiz each other: flashcard-style or whiteboard challenges",
          "Debate: argue different sides of a theoretical concept",
          "Summary rounds: each person summarizes a topic in 2 minutes",
        ],
      },
      {
        type: "heading",
        text: "Step 5: End With Action Items",
      },
      {
        type: "paragraph",
        text: "The last 5 minutes of every session should answer: what did we cover? What do we still not understand? What should everyone review before next time? This closes the loop and keeps the group moving forward.",
      },
      {
        type: "quote",
        text: "A study group without structure is just a social gathering. Structure is what turns hanging out into learning.",
      },
      {
        type: "heading",
        text: "Use Tools to Stay Organized",
      },
      {
        type: "paragraph",
        text: "StudyCircle was built for exactly this. Create a group, invite your members, share materials, schedule sessions, and track what you've covered. The less time you spend organizing, the more time you spend learning. That's the whole point.",
      },
    ],
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}
