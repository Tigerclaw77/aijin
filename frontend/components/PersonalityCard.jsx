import { useState } from "react";

export default function PersonalityCard({
  name,
  tone,
  behavior,
  mbti,
  isSelected,
  onClick,
}) {
  const [isHovered, setIsHovered] = useState(false);

  const mbtiIcons = {
    INFJ: "🌿", ENFP: "🎉", INTJ: "🛡️", ISFP: "❤️",
    ESFP: "😎", INFP: "🌙", INTP: "📘", ISTP: "💨",
    ISFJ: "🧸", ENFJ: "✨", ENTP: "🔥", ENTJ: "📊",
    ESTP: "⚡", ESTJ: "🗂️", ESFJ: "🐾", ISTJ: "🧠",
  };

  const mbtiBackgrounds = {
    INFJ: "bg-gradient-to-r from-pink-500 to-purple-500",
    ENFP: "bg-gradient-to-r from-yellow-400 to-orange-500",
    INTJ: "bg-gradient-to-r from-blue-500 to-indigo-600",
    ISFP: "bg-gradient-to-r from-green-400 to-teal-500",
    ESFP: "bg-gradient-to-r from-pink-400 to-red-500",
    INFP: "bg-gradient-to-r from-indigo-400 to-blue-500",
    INTP: "bg-gradient-to-r from-purple-500 to-indigo-500",
    ISTP: "bg-gradient-to-r from-gray-500 to-gray-600",
    ISFJ: "bg-gradient-to-r from-teal-400 to-teal-600",
    ENFJ: "bg-gradient-to-r from-blue-400 to-blue-500",
    ENTP: "bg-gradient-to-r from-red-500 to-orange-500",
    ENTJ: "bg-gradient-to-r from-blue-600 to-green-500",
    ESTP: "bg-gradient-to-r from-yellow-500 to-orange-500",
    ESTJ: "bg-gradient-to-r from-indigo-600 to-blue-600",
    ESFJ: "bg-gradient-to-r from-green-500 to-green-600",
    ISTJ: "bg-gradient-to-r from-gray-600 to-gray-700",
  };

  const personalityQuotes = {
    INFJ: ["I want to understand your soul.", "How are you *really* feeling today?", "Your happiness means everything."],
    ENFP: ["Let’s run away somewhere magical!", "You're my favorite daydream.", "Let’s make today unforgettable!"],
    INTJ: ["I already optimized our future.", "You’re the constant in my equation.", "I'm two steps ahead, with you in mind."],
    ISFP: ["You're like a melody I can't stop humming.", "Let’s make something beautiful together.", "I feel safe when it’s just us."],
    ESFP: ["You and me — let’s own the night!", "Life’s a party, and you’re the VIP.", "Kiss me under the lights!"],
    INFP: ["Hi... I missed you today.", "You feel like poetry to me.", "Let’s get lost in each other’s thoughts."],
    INTP: ["I was up all night thinking about your last message.", "You're the exception to my logic.", "Tell me something strange and beautiful."],
    ISTP: ["I like that you're not too clingy.", "Let’s just vibe, no pressure.", "You're cooler than you think."],
    ISFJ: ["Did you eat something warm today?", "I’m always here for you.", "Let me take care of everything."],
    ENFJ: ["You're my reason to lead with heart.", "I’ll support your dreams like they’re mine.", "We were meant to inspire each other."],
    ENTP: ["Let’s argue... and then make up. 😏", "You like danger? Because I *am* it.", "Say something clever — I dare you."],
    ENTJ: ["We move together. No hesitation.", "Don’t waste my time — or my affection.", "I respect strength. You’ve got it."],
    ESTP: ["Wanna do something crazy?", "You bring out my wild side.", "Let’s break a few rules today."],
    ESTJ: ["Time to crush today’s goals — with you.", "I like things done right. You qualify.", "No excuses, just progress. Together."],
    ESFJ: ["Text me when you get home, okay?", "I just want you to feel loved.", "You mean more to me than you know."],
    ISTJ: ["I'm not much for small talk, but I’d listen to you all day.", "We don’t need flair — just honesty.", "You’re consistent. I value that."]
  };

  const sampleQuotes = personalityQuotes[mbti] || [];

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative z-10 cursor-pointer rounded-xl p-4 shadow-md transition-transform transform-gpu hover:scale-105
        border border-white/20 hover:border-white/40
        ${mbtiBackgrounds[mbti] || "bg-slate-800"}
        ${isSelected ? "ring-2 ring-pink-400" : ""}
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          {mbtiIcons[mbti]} {name}
          <span className="text-sm text-white/80">({mbti})</span>
        </h2>
      </div>

      <p className="text-sm text-white/90 mb-2">
        <strong>{tone}</strong> — {behavior}
      </p>

      {/* Hover Quotes Layer */}
      <div
  className={`absolute inset-0 bg-black bg-opacity-90 p-4 rounded-xl
    transition-all duration-500 pointer-events-none
    transform ${isHovered ? "opacity-100 blur-none translate-y-0" : "opacity-0 blur-sm"}`}
  style={{ zIndex: 20 }}
>
  <ul className="text-sm text-white space-y-1">
    {sampleQuotes.map((quote, i) => (
      <li key={i} className="before:content-['“'] after:content-['”'] block">
        {quote}
      </li>
    ))}
  </ul>
</div>

    </div>
  );
}
