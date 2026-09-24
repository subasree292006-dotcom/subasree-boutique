import { useState } from "react";

import Dashboard from "./Dashboard";
import TailorStitching from "./TailorStitching";
import LiningStock from "./LiningStock";
import MonthlyRecords from "./MonthlyRecords";

import "./App.css";

function App() {
  const [activePage, setActivePage] =
    useState("Dashboard");

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  // =====================================================
  // CHANGE PAGE
  // =====================================================

  const changePage = (page) => {
    setActivePage(page);
    setSidebarOpen(false);
  };

  // =====================================================
  // PAGE CONTENT
  // =====================================================

  const renderPage = () => {
    if (activePage === "Dashboard") {
      return <Dashboard />;
    }

    if (activePage === "Tailor Stitching") {
      return <TailorStitching />;
    }

    if (activePage === "Lining Stock") {
      return <LiningStock />;
    }

    if (activePage === "Monthly Records") {
      return <MonthlyRecords />;
    }

    return <Dashboard />;
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="app-container">

      {/* =================================================
          MOBILE TOP BAR
      ================================================= */}

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

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        className={
          sidebarOpen
            ? "app-sidebar sidebar-open"
            : "app-sidebar"
        }
      >

        {/* =================================================
            LOGO
        ================================================= */}

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

        {/* =================================================
            BUSINESS
        ================================================= */}

        <div className="sidebar-business">

          <span>
            BUSINESS
          </span>

          <strong>
            Subasree Boutique
          </strong>

        </div>

        {/* =================================================
            NAVIGATION
        ================================================= */}

        <nav className="sidebar-nav">

          {/* DASHBOARD */}

          <button
            className={
              activePage === "Dashboard"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              changePage("Dashboard")
            }
          >
            <span className="nav-icon">
              🏠
            </span>

            <span>
              Dashboard
            </span>
          </button>

          {/* TAILOR STITCHING */}

          <button
            className={
              activePage ===
              "Tailor Stitching"
                ? "nav-item active"
                : "nav-item"
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

            <span>
              Tailor Stitching
            </span>
          </button>

          {/* LINING STOCK */}

          <button
            className={
              activePage ===
              "Lining Stock"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              changePage(
                "Lining Stock"
              )
            }
          >
            <span className="nav-icon">
              🧵
            </span>

            <span>
              Lining Stock
            </span>
          </button>

          {/* MONTHLY RECORDS */}

          <button
            className={
              activePage ===
              "Monthly Records"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              changePage(
                "Monthly Records"
              )
            }
          >
            <span className="nav-icon">
              📊
            </span>

            <span>
              Monthly Records
            </span>
          </button>

        </nav>

        {/* =================================================
            SIDEBAR FOOTER
        ================================================= */}

        <div className="sidebar-footer">

          <div className="footer-icon">
            🧵
          </div>

          <div>
            <strong>
              Subasree Boutique
            </strong>

            <span>
              Tailoring Management
            </span>
          </div>

        </div>

      </aside>

      {/* =================================================
          MOBILE OVERLAY
      ================================================= */}

      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="app-main">

        {renderPage()}

      </main>

    </div>
  );
}

export default App;