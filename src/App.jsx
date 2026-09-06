import { useEffect, useState } from "react";

import Login from "./Login";
import Register from "./Register";

import Dashboard from "./Dashboard";
import TailorStitching from "./TailorStitching";
import MonthlyRecords from "./MonthlyRecords";

import "./App.css";

const API_URL = "http://localhost:5000/api";

function App() {
  // ==========================================
  // AUTH STATES
  // ==========================================

  const [isCheckingAuth, setIsCheckingAuth] =
    useState(true);

  const [isLoggedIn, setIsLoggedIn] =
    useState(false);

  const [currentUser, setCurrentUser] =
    useState(null);

  const [showRegister, setShowRegister] =
    useState(false);

  // ==========================================
  // PAGE STATE
  // ==========================================

  const [activePage, setActivePage] =
    useState("Dashboard");

  // ==========================================
  // SIDEBAR STATE
  // ==========================================

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  // ==========================================
  // CHECK LOGIN
  // ==========================================

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    const token =
      localStorage.getItem("token");

    if (!token) {
      setIsLoggedIn(false);
      setCurrentUser(null);
      setIsCheckingAuth(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/auth/me`,
        {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Invalid or expired token"
        );
      }

      const data =
        await response.json();

      const user =
        data.user || data;

      setCurrentUser(user);
      setIsLoggedIn(true);

      localStorage.setItem(
        "currentUser",
        JSON.stringify(user)
      );

    } catch (error) {
      console.log(
        "Authentication failed:",
        error
      );

      localStorage.removeItem(
        "token"
      );

      localStorage.removeItem(
        "currentUser"
      );

      setIsLoggedIn(false);
      setCurrentUser(null);

    } finally {
      setIsCheckingAuth(false);
    }
  };

  // ==========================================
  // LOGIN SUCCESS
  // ==========================================

  const handleLogin = () => {
    const savedUser =
      localStorage.getItem(
        "currentUser"
      );

    if (savedUser) {
      try {
        setCurrentUser(
          JSON.parse(savedUser)
        );
      } catch (error) {
        console.log(
          "User data error:",
          error
        );
      }
    }

    setIsLoggedIn(true);
    setActivePage("Dashboard");
  };

  // ==========================================
  // GO TO LOGIN
  // ==========================================

  const handleGoToLogin = () => {
    setShowRegister(false);
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    const confirmLogout =
      window.confirm(
        "Are you sure you want to logout?"
      );

    if (!confirmLogout) {
      return;
    }

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "currentUser"
    );

    setCurrentUser(null);
    setIsLoggedIn(false);
    setShowRegister(false);
    setActivePage("Dashboard");
    setSidebarOpen(false);
  };

  // ==========================================
  // PAGE CHANGE
  // ==========================================

  const changePage = (page) => {
    setActivePage(page);

    // Close sidebar on mobile
    setSidebarOpen(false);
  };

  // ==========================================
  // AUTH LOADING
  // ==========================================

  if (isCheckingAuth) {
    return (
      <div className="auth-loading-screen">

        <div className="auth-loading-box">

          <div className="loading-spinner"></div>

          <h2>
            Tailor Manager
          </h2>

          <p>
            Checking login...
          </p>

        </div>

      </div>
    );
  }

  // ==========================================
  // REGISTER PAGE
  // ==========================================

  if (
    !isLoggedIn &&
    showRegister
  ) {
    return (
      <Register
        goToLogin={
          handleGoToLogin
        }
      />
    );
  }

  // ==========================================
  // LOGIN PAGE
  // ==========================================

  if (!isLoggedIn) {
    return (
      <Login
        onLogin={
          handleLogin
        }
        goToRegister={() =>
          setShowRegister(true)
        }
      />
    );
  }

  // ==========================================
  // MAIN APP
  // ==========================================

  return (
    <div className="app-container">

      {/* ======================================
          MOBILE TOP BAR
      ======================================= */}

      <div className="mobile-topbar">

        <button
          className="sidebar-toggle"
          onClick={() =>
            setSidebarOpen(
              !sidebarOpen
            )
          }
        >
          ☰
        </button>

        <div className="mobile-logo">
          🧵 Tailor Manager
        </div>

      </div>

      {/* ======================================
          SIDEBAR
      ======================================= */}

      <aside
        className={`app-sidebar ${
          sidebarOpen
            ? "sidebar-open"
            : ""
        }`}
      >

        {/* ====================================
            LOGO
        ==================================== */}

        <div className="sidebar-logo">

          <div className="logo-icon">
            🧵
          </div>

          <div>
            <h2>
              Tailor Manager
            </h2>

            <span>
              Management System
            </span>
          </div>

        </div>

        {/* ====================================
            USER
        ==================================== */}

        <div className="sidebar-user">

          <div className="sidebar-user-icon">
            👤
          </div>

          <div className="sidebar-user-details">

            <strong>
              {currentUser?.name ||
                "User"}
            </strong>

            <small>
              @{currentUser?.username ||
                ""}
            </small>

          </div>

        </div>

        {/* ====================================
            NAVIGATION
        ==================================== */}

        <nav className="sidebar-nav">

          {/* MAIN MENU */}

          <p className="nav-section-title">
            MAIN MENU
          </p>

          {/* DASHBOARD */}

          <button
            className={
              activePage ===
              "Dashboard"
                ? "sidebar-nav-item active"
                : "sidebar-nav-item"
            }
            onClick={() =>
              changePage(
                "Dashboard"
              )
            }
          >
            <span className="nav-icon">
              📊
            </span>

            <span className="nav-text">
              Dashboard
            </span>
          </button>

          {/* TAILOR STITCHING */}

          <button
            className={
              activePage ===
              "Tailor Stitching"
                ? "sidebar-nav-item active"
                : "sidebar-nav-item"
            }
            onClick={() =>
              changePage(
                "Tailor Stitching"
              )
            }
          >
            <span className="nav-icon">
              ✂️
            </span>

            <span className="nav-text">
              Tailor Stitching
            </span>
          </button>

          {/* MONTHLY RECORDS */}

          <button
            className={
              activePage ===
              "Monthly Records"
                ? "sidebar-nav-item active"
                : "sidebar-nav-item"
            }
            onClick={() =>
              changePage(
                "Monthly Records"
              )
            }
          >
            <span className="nav-icon">
              📅
            </span>

            <span className="nav-text">
              Monthly Records
            </span>
          </button>

        </nav>

        {/* ====================================
            SIDEBAR BOTTOM
        ==================================== */}

        <div className="sidebar-bottom">

          <button
            className="sidebar-logout"
            onClick={
              handleLogout
            }
          >
            <span className="nav-icon">
              🚪
            </span>

            <span className="nav-text">
              Logout
            </span>
          </button>

        </div>

      </aside>

      {/* ======================================
          MOBILE OVERLAY
      ======================================= */}

      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() =>
            setSidebarOpen(false)
          }
        ></div>
      )}

      {/* ======================================
          MAIN CONTENT
      ======================================= */}

      <main className="app-content">

        {activePage ===
          "Dashboard" && (
          <Dashboard />
        )}

        {activePage ===
          "Tailor Stitching" && (
          <TailorStitching />
        )}

        {activePage ===
          "Monthly Records" && (
          <MonthlyRecords />
        )}

      </main>

    </div>
  );
}

export default App;