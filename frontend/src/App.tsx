import { Routes, Route } from 'react-router-dom'

function App() {
  return (
    <div className="min-h-screen bg-base-100">
      <Routes>
        <Route path="/" element={
          <div className="hero min-h-screen">
            <div className="hero-content text-center">
              <div className="max-w-md">
                <h1 className="text-5xl font-bold">Welcome to AIFF</h1>
                <p className="py-6">
                  Your personal finance management application. Connect your bank accounts,
                  track transactions, and manage budgets with ease.
                </p>
                <button className="btn btn-primary">Get Started</button>
              </div>
            </div>
          </div>
        } />
        <Route path="/dashboard" element={
          <div className="p-8">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="mt-4">Dashboard content coming soon...</p>
          </div>
        } />
      </Routes>
    </div>
  )
}

export default App

