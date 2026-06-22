import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  {
    title: "Brands",
    description: "Track every brand partnership in one place. Keep a clear record of collaborations, sponsors, and clients.",
    icon: "🤝",
  },
  {
    title: "Projects",
    description: "Manage deliverables, deadlines, and status across all your active work — from pitch to publish.",
    icon: "📋",
  },
  {
    title: "Public Profile",
    description: "Share your work with a single link. A beautiful, shareable page that shows brands who you are.",
    icon: "✨",
  },
]

export function FeaturesSection() {
  return (
    <section className="py-20 border-t">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-3">
            Everything a creator needs
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            One platform to manage your brand relationships and put your best work forward.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <div className="text-3xl mb-1">{feature.icon}</div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
