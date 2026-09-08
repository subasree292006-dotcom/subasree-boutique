import { useState } from "react";
import "./Auth.css";

// Backend API URL
const API_URL = "https://subasree-boutique-backend.onrender.com";

function Login({ onLogin, goToRegister }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    // Validation
    if (!username.trim() || !password.trim()) {
      setError("Please enter username and password");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username.trim(),
            password,
          }),
        }
      );

      // Handle non-JSON response
      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error("Server returned an invalid response");
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Invalid username or password"
        );
      }

      // Save login information
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      if (data.user) {
        localStorage.setItem(
          "currentUser",
          JSON.stringify(data.user)
        );
      }

      // Login success
      onLogin(data.user);

    } catch (error) {
      console.error("Login Error:", error);

      if (error.name === "TypeError") {
        setError(
          "Unable to connect to server. Please check your backend."
        );
      } else {
        setError(error.message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-card">

        {/* Logo */}
        <div className="auth-logo">
          ✂️
        </div>

        {/* Title */}
        <h1>Tailor Manager</h1>

        <p className="auth-subtitle">
          Login to manage your tailoring business
        </p>

        {/* Login Form */}
        <form onSubmit={handleLogin}>

          {/* Username */}
          <div className="auth-input-group">

            <label htmlFor="username">
              Username
            </label>

            <input
              id="username"
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
              }}
              autoComplete="username"
              disabled={loading}
            />

          </div>

          {/* Password */}
          <div className="auth-input-group">

            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              autoComplete="current-password"
              disabled={loading}
            />

          </div>

          {/* Error */}
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

        {/* Register */}
        <div className="auth-switch">

          <span>
            Don't have an account?
          </span>

          <button
            type="button"
            onClick={goToRegister}
            disabled={loading}
          >
            Create Account
          </button>

        </div>

      </div>

    </div>
  );
}

export default Login;