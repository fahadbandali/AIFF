import { Routes, Route } from "react-router-dom";
import { LandingPage } from "./components/Landing/LandingPage";
import { ConnectBank } from "./components/Connect/ConnectBank";
import { Dashboard } from "./components/Dashboard/Dashboard";

function App() {
  return (
    <div className="min-h-screen bg-base-100">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/connect" element={<ConnectBank />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </div>
  );
}

export default App;
