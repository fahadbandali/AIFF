interface FeatureCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export function FeatureCard({ title, description, icon }: FeatureCardProps) {
  return (
    <div className="card bg-base-200 shadow-xl">
      <div className="card-body">
        {icon && <div className="text-4xl mb-4">{icon}</div>}
        <h3 className="card-title text-xl">{title}</h3>
        <p className="text-base-content/70">{description}</p>
      </div>
    </div>
  );
}
