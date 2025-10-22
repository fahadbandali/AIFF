import { Hero } from "./Hero";
import { FeatureCard } from "./FeatureCard";

export function LandingPage() {
  const features = [
    {
      title: "Bank Connection",
      description:
        "Securely connect your bank accounts and credit cards via Plaid. Support for major Canadian banks and American Express with encrypted credential storage.",
      icon: "🏦",
    },
    {
      title: "Smart Categorization",
      description:
        "Automatic transaction categorization with custom rules. Create pattern-based rules to categorize transactions automatically, with manual override capability.",
      icon: "🏷️",
    },
    {
      title: "Budget Tracking",
      description:
        "Visual budget management with spending insights. Set monthly spending limits per category and track your progress with intuitive charts and alerts.",
      icon: "📊",
    },
  ];

  return (
    <div className="min-h-screen bg-base-100">
      <Hero />

      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Everything you need to manage your finances
        </h2>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
