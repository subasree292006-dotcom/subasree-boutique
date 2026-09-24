import { useEffect, useState } from "react";
import "./Dashboard.css";

function Dashboard() {
  const [orders, setOrders] = useState([]);

  // ==========================================
  // LOAD ORDERS FROM LOCAL STORAGE
  // ==========================================

  const loadData = () => {
    try {
      const savedOrders =
        localStorage.getItem("tailorOrders");

      if (savedOrders) {
        const parsedOrders = JSON.parse(savedOrders);

        if (Array.isArray(parsedOrders)) {
          setOrders(parsedOrders);
        } else {
          setOrders([]);
        }
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      setOrders([]);
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    loadData();

    const handleDataUpdate = () => {
      loadData();
    };

    window.addEventListener(
      "ordersUpdated",
      handleDataUpdate
    );

    return () => {
      window.removeEventListener(
        "ordersUpdated",
        handleDataUpdate
      );
    };
  }, []);

  // ==========================================
  // TODAY
  // ==========================================

  const today = new Date()
    .toISOString()
    .split("T")[0];

  // ==========================================
  // COMPLETED RECORDS
  // ==========================================

  const completedRecords = orders.filter(
    (order) => order.status === "Completed"
  );

  const completedCount = completedRecords.reduce(
    (total, order) =>
      total + Number(order.quantity || 0),
    0
  );

  // ==========================================
  // GIVEN TO TAILOR
  // ==========================================

  const givenToTailorRecords = orders.filter(
    (order) => order.status === "Given to Tailor"
  );

  const pendingCount = givenToTailorRecords.reduce(
    (total, order) =>
      total + Number(order.quantity || 0),
    0
  );

  // ==========================================
  // STITCHING
  // ==========================================

  const stitchingRecords = orders.filter(
    (order) => order.status === "Stitching"
  );

  const stitchingCount = stitchingRecords.reduce(
    (total, order) =>
      total + Number(order.quantity || 0),
    0
  );

  // ==========================================
  // TOTAL CLOTHES
  // ==========================================

  const totalClothes =
    completedCount +
    pendingCount +
    stitchingCount;

  // ==========================================
  // TOTAL STITCHING AMOUNT
  // ==========================================

  const totalAmount = orders.reduce(
    (total, order) =>
      total +
      Number(order.stitchingAmount || 0),
    0
  );

  // ==========================================
  // PENDING AMOUNT
  // ==========================================

  const pendingAmount =
    givenToTailorRecords.reduce(
      (total, order) =>
        total +
        Number(order.stitchingAmount || 0),
      0
    );

  // ==========================================
  // TODAY ORDERS
  // ==========================================

  const todayOrders = orders.filter(
    (order) =>
      order.date === today &&
      order.status !== "Completed"
  );

  const todayCount = todayOrders.reduce(
    (total, order) =>
      total + Number(order.quantity || 0),
    0
  );

  // ==========================================
  // TODAY COMPLETED
  // ==========================================

  const todayCompleted = completedRecords
    .filter(
      (order) => order.completedDate === today
    )
    .reduce(
      (total, order) =>
        total + Number(order.quantity || 0),
      0
    );

  // ==========================================
  // RECENT ACTIVE RECORDS
  // ==========================================

  const recentOrders = [...orders]
    .filter(
      (order) => order.status !== "Completed"
    )
    .sort(
      (a, b) =>
        new Date(b.date) - new Date(a.date)
    )
    .slice(0, 6);

  // ==========================================
  // ACTIVE ORDER COUNT
  // ==========================================

  const activeOrderCount = orders.filter(
    (order) => order.status !== "Completed"
  ).length;

  // ==========================================
  // STATUS CLASS
  // ==========================================

  const getStatusClass = (status) => {
    return String(status || "")
      .toLowerCase()
      .replaceAll(" ", "-");
  };

  // ==========================================
  // REFRESH
  // ==========================================

  const handleRefresh = () => {
    loadData();
  };

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <div className="dashboard-page">

      {/* HEADER */}

      <div className="dashboard-header">

        <div>
          <h1>
            📊 Dashboard
          </h1>

          <p>
            Tailoring & Boutique Overview
          </p>
        </div>

        <button
          className="refresh-btn"
          onClick={handleRefresh}
        >
          🔄 Refresh
        </button>

      </div>


      {/* MAIN STATS */}

      <div className="dashboard-stats">

        {/* TOTAL CLOTHES */}

        <div className="dashboard-card">

          <div className="card-icon">
            👗
          </div>

          <div>
            <span>
              Total Clothes
            </span>

            <h2>
              {totalClothes}
            </h2>

            <small>
              All tailoring work
            </small>
          </div>

        </div>


        {/* COMPLETED */}

        <div className="dashboard-card">

          <div className="card-icon">
            ✅
          </div>

          <div>
            <span>
              Completed
            </span>

            <h2>
              {completedCount}
            </h2>

            <small>
              Finished clothes
            </small>
          </div>

        </div>


        {/* PENDING */}

        <div className="dashboard-card">

          <div className="card-icon">
            ⏳
          </div>

          <div>
            <span>
              Pending
            </span>

            <h2>
              {pendingCount}
            </h2>

            <small>
              Given to tailor
            </small>
          </div>

        </div>


        {/* STITCHING */}

        <div className="dashboard-card">

          <div className="card-icon">
            🧵
          </div>

          <div>
            <span>
              Stitching
            </span>

            <h2>
              {stitchingCount}
            </h2>

            <small>
              Currently stitching
            </small>
          </div>

        </div>

      </div>


      {/* SECONDARY STATS */}

      <div className="secondary-stats">

        <div className="small-card">

          <span>
            💰 Total Amount
          </span>

          <strong>
            ₹{totalAmount}
          </strong>

        </div>


        <div className="small-card">

          <span>
            💵 Pending Amount
          </span>

          <strong>
            ₹{pendingAmount}
          </strong>

        </div>

      </div>


      {/* TODAY SECTION */}

      <div className="today-section">

        <div className="section-title">

          <div>
            <h2>
              📅 Today's Summary
            </h2>

            <p>
              {today}
            </p>
          </div>

        </div>


        <div className="today-grid">

          <div className="today-card">

            <span>
              Today's Orders
            </span>

            <strong>
              {todayCount}
            </strong>

          </div>


          <div className="today-card">

            <span>
              Today's Completed
            </span>

            <strong>
              {todayCompleted}
            </strong>

          </div>


          <div className="today-card">

            <span>
              Active Orders
            </span>

            <strong>
              {activeOrderCount}
            </strong>

          </div>

        </div>

      </div>


      {/* RECENT RECORDS */}

      <div className="recent-section">

        <div className="section-title">

          <div>
            <h2>
              🧵 Recent Tailor Records
            </h2>

            <p>
              Active stitching records
            </p>
          </div>

        </div>


        {recentOrders.length === 0 ? (

          <div className="dashboard-empty">

            <div>
              🧵
            </div>

            <h3>
              No active records
            </h3>

            <p>
              Add tailoring records from
              Tailor Stitching.
            </p>

          </div>

        ) : (

          <div className="recent-table-wrapper">

            <table className="recent-table">

              <thead>

                <tr>

                  <th>
                    Date
                  </th>

                  <th>
                    Customer
                  </th>

                  <th>
                    Dress
                  </th>

                  <th>
                    Qty
                  </th>

                  <th>
                    Amount
                  </th>

                  <th>
                    Status
                  </th>

                </tr>

              </thead>


              <tbody>

                {recentOrders.map((order) => (

                  <tr key={order.id}>

                    <td>
                      {order.date}
                    </td>

                    <td>
                      {order.customerName ||
                        "Walk-in"}
                    </td>

                    <td>
                      <strong>
                        {order.dressName}
                      </strong>
                    </td>

                    <td>
                      {order.quantity}
                    </td>

                    <td>
                      ₹
                      {Number(
                        order.stitchingAmount || 0
                      )}
                    </td>

                    <td>

                      <span
                        className={
                          "dashboard-status " +
                          getStatusClass(
                            order.status
                          )
                        }
                      >
                        {order.status}
                      </span>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* QUICK SUMMARY */}

      <div className="quick-summary">

        <h2>
          📌 Quick Summary
        </h2>


        <div className="summary-list">

          <div>

            <span>
              👗 Total Clothes
            </span>

            <strong>
              {totalClothes}
            </strong>

          </div>


          <div>

            <span>
              ✅ Completed
            </span>

            <strong>
              {completedCount}
            </strong>

          </div>


          <div>

            <span>
              ⏳ Pending
            </span>

            <strong>
              {pendingCount}
            </strong>

          </div>


          <div>

            <span>
              🧵 Stitching
            </span>

            <strong>
              {stitchingCount}
            </strong>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Dashboard;