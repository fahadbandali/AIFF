import { Link } from "react-router-dom";

export function Hero() {
  return (
    <div className="hero min-h-[60vh] bg-base-100">
      <div className="hero-content text-center">
        <div className="max-w-2xl">
          <h1 className="text-5xl font-bold mb-6">AIFF</h1>
          <p className="text-xl mb-8">
            Your personal finance management application. Connect your bank
            accounts, track transactions, and manage budgets with ease.
          </p>
          <Link to="/connect" className="btn btn-primary btn-lg">
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}
