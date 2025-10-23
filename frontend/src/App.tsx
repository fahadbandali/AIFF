import { Routes, Route } from "react-router-dom";
import { LandingPage } from "./components/Landing/LandingPage";
import { ConnectBank } from "./components/Connect/ConnectBank";
import { Dashboard } from "./components/Dashboard/Dashboard";
import AnalyticsDashboard from "./components/Analytics/AnalyticsDashboard";
import { BudgetDashboard } from "./components/Budgets/BudgetDashboard";
import GoalDashboard from "./components/Goals/GoalDashboard";

function App() {
  return (
    <div className="min-h-screen bg-base-100">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/connect" element={<ConnectBank />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analytics" element={<AnalyticsDashboard />} />
        <Route path="/budgets" element={<BudgetDashboard />} />
        <Route path="/goals" element={<GoalDashboard />} />
      </Routes>
    </div>
  );
}

export default App;
