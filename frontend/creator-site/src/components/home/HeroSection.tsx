import { Button } from "@/components/ui/button"

const creators = [
  { name: "Sarah Chen",     handle: "sarahchen",   brands: 4, projects: 12, category: "Design",    color: "bg-[#009688]",     initials: "SC" },
  { name: "Marcus Webb",    handle: "marcuswebb",  brands: 2, projects: 8,  category: "Tech",       color: "bg-violet-500",    initials: "MW" },
  { name: "Priya Nair",     handle: "priyanair",   brands: 6, projects: 20, category: "Lifestyle",  color: "bg-rose-500",      initials: "PN" },
  { name: "Liam Torres",    handle: "liamtorres",  brands: 3, projects: 9,  category: "Travel",     color: "bg-amber-500",     initials: "LT" },
  { name: "Aisha Kamara",   handle: "aishak",      brands: 5, projects: 15, category: "Fashion",    color: "bg-pink-500",      initials: "AK" },
  { name: "Yuki Sato",      handle: "yukisato",    brands: 1, projects: 6,  category: "Food",       color: "bg-orange-500",    initials: "YS" },
  { name: "Carlos Mendes",  handle: "carlosm",     brands: 7, projects: 18, category: "Gaming",     color: "bg-blue-600",      initials: "CM" },
  { name: "Emma Vance",     handle: "emmavance",   brands: 4, projects: 11, category: "Fitness",    color: "bg-emerald-500",   initials: "EV" },
  { name: "Dev Patel",      handle: "devpatel",    brands: 3, projects: 14, category: "Tech",       color: "bg-indigo-500",    initials: "DP" },
  { name: "Zoe Kim",        handle: "zoekim",      brands: 5, projects: 9,  category: "Design",     color: "bg-cyan-600",      initials: "ZK" },
]

const row1 = creators
const row2 = [...creators.slice(5), ...creators.slice(0, 5)]

function CreatorCard({ name, handle, brands, projects, category, color, initials }: typeof creators[0]) {
  return (
    <div className="shrink-0 w-56 rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow select-none">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 ${color}`}>
          {initials}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm leading-tight truncate">{name}</p>
          <p className="text-xs text-muted-foreground truncate">@{handle}</p>
        </div>
      </div>
      <div className="flex gap-2 text-xs text-muted-foreground mb-3">
        <span>{brands} brands</span>
        <span>·</span>
        <span>{projects} projects</span>
      </div>
      <span className="text-xs bg-primary/10 text-primary rounded-full px-2.5 py-0.5 font-medium">
        {category}
      </span>
    </div>
  )
}

function MarqueeRow({ cards, reverse = false }: { cards: typeof creators; reverse?: boolean }) {
  const doubled = [...cards, ...cards]
  return (
    <div className={`flex gap-4 ${reverse ? "animate-marquee-reverse" : "animate-marquee"}`}>
      {doubled.map((c, i) => (
        <CreatorCard key={`${c.handle}_${i}`} {...c} />
      ))}
    </div>
  )
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pb-0 pt-20 sm:pt-28">
      {/* Background blobs */}
      <div aria-hidden="true" className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 -z-10">
        <div className="h-[500px] w-[500px] rounded-full bg-primary/15 blur-3xl" />
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute top-1/3 -right-32 -z-10">
        <div className="h-[300px] w-[300px] rounded-full bg-primary/10 blur-2xl" />
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute top-1/2 -left-32 -z-10">
        <div className="h-[250px] w-[250px] rounded-full bg-violet-500/5 blur-2xl" />
      </div>

      {/* Text block */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center mb-16">
        <span className="animate-in fade-in slide-in-from-bottom-2 duration-500 inline-block mb-4 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary tracking-wide uppercase">
          Creator Profile Platform
        </span>

        <h1 className="animate-in fade-in slide-in-from-bottom-3 duration-700 [animation-delay:100ms] [animation-fill-mode:both] text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
          Your work.{" "}
          <span className="text-primary">Your brand.</span>{" "}
          One link.
        </h1>

        <p className="animate-in fade-in slide-in-from-bottom-3 duration-700 [animation-delay:200ms] [animation-fill-mode:both] text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
          CreatorHandle gives creators a beautiful public profile to showcase brands, projects, and work — all in one place.
        </p>

        <div className="animate-in fade-in slide-in-from-bottom-3 duration-700 [animation-delay:300ms] [animation-fill-mode:both] flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild size="lg">
            <a href="/login">Get Started Free</a>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="/creator/demo">See an Example</a>
          </Button>
        </div>
      </div>

      {/* Marquee showcase */}
      <div className="animate-in fade-in duration-1000 [animation-delay:500ms] [animation-fill-mode:both] relative overflow-hidden pb-12">
        {/* Edge fades */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-24 sm:w-40 bg-gradient-to-r from-background to-transparent z-10" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-24 sm:w-40 bg-gradient-to-l from-background to-transparent z-10" />

        <div className="space-y-4">
          <MarqueeRow cards={row1} />
          <MarqueeRow cards={row2} reverse />
        </div>
      </div>
    </section>
  )
}
