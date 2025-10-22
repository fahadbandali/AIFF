import { useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { useNavigate } from "react-router-dom";
import { useLinkToken, useExchangeToken } from "../../hooks/usePlaid";

export function ConnectBank() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  // Fetch link token
  const {
    data: linkTokenData,
    isLoading: isLoadingToken,
    error: linkTokenError,
  } = useLinkToken();

  // Exchange public token mutation
  const exchangeToken = useExchangeToken();

  // Plaid Link configuration
  const { open, ready } = usePlaidLink({
    token: linkTokenData?.link_token || null,
    onSuccess: (public_token) => {
      // Exchange public token for access token
      exchangeToken.mutate(
        { public_token },
        {
          onSuccess: () => {
            // Navigate to dashboard on success
            navigate("/dashboard");
          },
          onError: (err: Error) => {
            setError(
              err.message || "Failed to connect account. Please try again."
            );
          },
        }
      );
    },
    onExit: (err) => {
      if (err != null) {
        setError("Connection cancelled. Please try again.");
      }
    },
  });

  // Auto-open Plaid Link when ready (optional - can be triggered by button instead)
  useEffect(() => {
    if (ready && !error && !exchangeToken.isPending) {
      // Automatically open - remove this if you want manual button click
      // open();
    }
  }, [ready, error, exchangeToken.isPending]);

  if (isLoadingToken) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4 text-lg">Preparing bank connection...</p>
        </div>
      </div>
    );
  }

  if (linkTokenError) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
        <div className="card bg-base-200 shadow-xl max-w-md w-full">
          <div className="card-body">
            <h2 className="card-title text-error">Connection Error</h2>
            <p>Unable to initialize bank connection. Please try again later.</p>
            <div className="card-actions justify-end mt-4">
              <button
                className="btn btn-primary"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
              <button className="btn btn-ghost" onClick={() => navigate("/")}>
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (exchangeToken.isPending) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4 text-lg">Connecting your account...</p>
          <p className="text-sm text-base-content/60 mt-2">
            This may take a few moments
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Connect Your Bank Account
            </h1>
            <p className="text-lg text-base-content/70">
              Securely link your bank account to start tracking your finances
            </p>
          </div>

          {/* Security Badge */}
          <div className="alert alert-info mb-8">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-current shrink-0 w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <div>
              <h3 className="font-bold">Bank-level Security</h3>
              <div className="text-sm">
                Your credentials are encrypted and never stored on our servers.
                We use Plaid, trusted by thousands of apps.
              </div>
            </div>
          </div>

          {/* Main Card */}
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">How it works</h2>
              <ol className="list-decimal list-inside space-y-3 mb-6">
                <li>Click "Connect Bank" below</li>
                <li>Search for your bank</li>
                <li>Enter your online banking credentials</li>
                <li>Select accounts to connect</li>
                <li>You're all set!</li>
              </ol>

              {error && (
                <div className="alert alert-error mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="stroke-current shrink-0 h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div className="card-actions justify-center mt-4">
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => open()}
                  disabled={!ready}
                >
                  {ready ? "Connect Bank" : "Loading..."}
                </button>
              </div>

              <div className="divider">OR</div>

              <button
                className="btn btn-ghost btn-sm"
                onClick={() => navigate("/")}
              >
                Back to Home
              </button>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 text-center">
            <div className="p-4">
              <div className="text-3xl mb-2">🔒</div>
              <div className="font-semibold">Bank-Level Encryption</div>
              <div className="text-sm text-base-content/60">
                256-bit encryption
              </div>
            </div>
            <div className="p-4">
              <div className="text-3xl mb-2">🏦</div>
              <div className="font-semibold">11,000+ Banks</div>
              <div className="text-sm text-base-content/60">
                Supported institutions
              </div>
            </div>
            <div className="p-4">
              <div className="text-3xl mb-2">✓</div>
              <div className="font-semibold">Trusted by Millions</div>
              <div className="text-sm text-base-content/60">
                Powered by Plaid
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
