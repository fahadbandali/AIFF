import { Routes, Route, Navigate } from "react-router-dom";
import { LandingPage } from "./components/Landing/LandingPage";
import { ConnectBank } from "./components/Connect/ConnectBank";
import { Dashboard } from "./components/Dashboard/Dashboard";
import { BudgetDashboard } from "./components/Budgets/BudgetDashboard";
import DataManagement from "./components/Settings/DataManagement";

function App() {
  return (
    <div className="min-h-screen bg-base-100">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/connect" element={<ConnectBank />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route
          path="/analytics"
          element={<Navigate to="/dashboard" replace />}
        />
        <Route path="/budgets" element={<BudgetDashboard />} />
        <Route path="/settings" element={<DataManagement />} />
      </Routes>
    </div>
  );
}

export default App;
