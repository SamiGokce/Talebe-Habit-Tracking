import Link from "next/link";
import { GraduationCap, Users, Moon, BookOpen, Heart } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen px-4 py-10 sm:py-16 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 glass-soft rounded-full px-4 py-1.5 mb-5 text-mocha-500 text-sm">
            <Moon size={14} className="text-accent-gold" />
            <span>Track every step of the path</span>
          </div>
          <h1 className="font-display text-5xl sm:text-6xl font-semibold text-mocha-700 tracking-tight">
            Talebe Tracker
          </h1>
          <p className="mt-4 text-mocha-500 text-lg max-w-md mx-auto">
            A simple, calm space for students and group leaders to grow their
            daily worship together.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 animate-slide-up">
          <Link
            href="/student/join"
            className="tap glass-strong rounded-3xl p-7 flex flex-col gap-3 hover:shadow-glass-lg group"
          >
            <div className="w-12 h-12 rounded-2xl bg-accent-sage/15 text-accent-sage flex items-center justify-center">
              <GraduationCap size={26} />
            </div>
            <div>
              <div className="text-xl font-semibold text-mocha-700">
                I'm a Student
              </div>
              <p className="text-mocha-500 text-sm mt-1">
                Join your group with a code and track your daily goals.
              </p>
            </div>
            <span className="mt-2 text-mocha-600 text-sm font-medium group-hover:translate-x-1 transition-transform">
              Join group →
            </span>
          </Link>

          <Link
            href="/leader"
            className="tap glass-strong rounded-3xl p-7 flex flex-col gap-3 hover:shadow-glass-lg group"
          >
            <div className="w-12 h-12 rounded-2xl bg-mocha-200/60 text-mocha-600 flex items-center justify-center">
              <Users size={26} />
            </div>
            <div>
              <div className="text-xl font-semibold text-mocha-700">
                I'm a Leader
              </div>
              <p className="text-mocha-500 text-sm mt-1">
                Create your group, manage members, and run contests.
              </p>
            </div>
            <span className="mt-2 text-mocha-600 text-sm font-medium group-hover:translate-x-1 transition-transform">
              Open dashboard →
            </span>
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-3 text-center text-mocha-500 text-xs sm:text-sm animate-fade-in">
          <div className="glass rounded-2xl p-4 flex flex-col items-center gap-1.5">
            <Moon size={18} className="text-accent-gold" />
            <span>5 prayers + sunnah</span>
          </div>
          <div className="glass rounded-2xl p-4 flex flex-col items-center gap-1.5">
            <BookOpen size={18} className="text-mocha-500" />
            <span>Quran & reading</span>
          </div>
          <div className="glass rounded-2xl p-4 flex flex-col items-center gap-1.5">
            <Heart size={18} className="text-accent-rose" />
            <span>Zikr & contests</span>
          </div>
        </div>
      </div>
    </main>
  );
}
