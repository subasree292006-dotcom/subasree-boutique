import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api";

function MonthlyRecords() {
  // ==========================================
  // STATES
  // ==========================================

  const [records, setRecords] = useState([]);

  const [search, setSearch] = useState("");

  const [selectedMonth, setSelectedMonth] =
    useState("all");

  const [loading, setLoading] = useState(true);

  // ==========================================
  // FORMAT BACKEND RECORD
  // ==========================================

  const formatRecord = (record) => ({
    id: record.id,

    orderId:
      record.order_id || "",

    // IMPORTANT:
    // Tailor Stitching DATE gets first priority
    date:
      record.date || "",

    customerName:
      record.customer_name || "",

    dressName:
      record.dress_name || "",

    dressType:
      record.dress_type || "",

    quantity:
      Number(record.quantity || 0),

    stitchingAmount:
      Number(record.stitching_amount || 0),

    liningName:
      record.lining_name || "",

    liningColor:
      record.lining_color || "",

    liningUsed:
      Number(record.lining_used || 0),

    status:
      record.status || "",

    notes:
      record.notes || "",

    // Keep completed_date separately
    completedDate:
      record.completed_date || "",
  });

  // ==========================================
  // LOAD COMPLETED RECORDS
  // ==========================================

  const loadRecords = async () => {
    try {
      setLoading(true);

      const token =
        localStorage.getItem("token");

      // ======================================
      // NO LOGIN
      // ======================================

      if (!token) {
        setRecords([]);
        return;
      }

      // ======================================
      // FETCH ORDERS
      // ======================================

      const response = await fetch(
        `${API_URL}/orders`,
        {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      // ======================================
      // INVALID TOKEN
      // ======================================

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem(
          "currentUser"
        );

        window.location.reload();

        return;
      }

      // ======================================
      // OTHER ERROR
      // ======================================

      if (!response.ok) {
        throw new Error(
          "Failed to load records"
        );
      }

      // ======================================
      // RESPONSE
      // ======================================

      const data =
        await response.json();

      // ======================================
      // SUPPORT BOTH RESPONSE FORMATS
      // ======================================

      const allOrders =
        Array.isArray(data)
          ? data
          : Array.isArray(data.orders)
          ? data.orders
          : [];

      // ======================================
      // ONLY COMPLETED ORDERS
      // ======================================

      const completedOrders =
        allOrders
          .filter(
            (order) =>
              String(
                order.status || ""
              ).toLowerCase() ===
              "completed"
          )
          .map(formatRecord);

      // ======================================
      // SAVE
      // ======================================

      setRecords(
        completedOrders
      );

    } catch (error) {
      console.error(
        "Monthly records loading error:",
        error
      );

      setRecords([]);

    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    loadRecords();

    const handleUpdate = () => {
      loadRecords();
    };

    window.addEventListener(
      "ordersUpdated",
      handleUpdate
    );

    return () => {
      window.removeEventListener(
        "ordersUpdated",
        handleUpdate
      );
    };
  }, []);

  // ==========================================
  // IMPORTANT:
  // RECORD DATE
  // ==========================================
  //
  // Tailor Stitching date should be used
  // for Monthly Records.
  //
  // Example:
  // date = 2026-10-10
  // completed_date = 2026-09-03
  //
  // Monthly Records will use:
  // 2026-10-10
  //
  // ==========================================

  const getRecordDate = (record) => {
    return (
      record.date ||
      record.completedDate ||
      ""
    );
  };

  // ==========================================
  // MONTH NAME
  // ==========================================

  const getMonthName = (dateString) => {
    if (!dateString) {
      return "Unknown Month";
    }

    const date = new Date(
      `${dateString}T00:00:00`
    );

    if (isNaN(date.getTime())) {
      return "Unknown Month";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        month: "long",
        year: "numeric",
      }
    );
  };

  // ==========================================
  // MONTH KEY
  // ==========================================

  const getMonthKey = (dateString) => {
    if (!dateString) {
      return "unknown";
    }

    const date = new Date(
      `${dateString}T00:00:00`
    );

    if (isNaN(date.getTime())) {
      return "unknown";
    }

    const year =
      date.getFullYear();

    const month =
      String(
        date.getMonth() + 1
      ).padStart(2, "0");

    return `${year}-${month}`;
  };

  // ==========================================
  // MONTH LIST
  // ==========================================

  const monthList = [
    ...new Set(
      records.map((record) =>
        getMonthKey(
          getRecordDate(record)
        )
      )
    ),
  ]
    .filter(
      (month) =>
        month !== "unknown"
    )
    .sort()
    .reverse();

  // ==========================================
  // FILTER RECORDS
  // ==========================================

  const filteredRecords =
    records.filter((record) => {
      const text =
        search
          .toLowerCase()
          .trim();

      const recordDate =
        getRecordDate(record);

      const monthKey =
        getMonthKey(recordDate);

      // ======================================
      // SEARCH
      // ======================================

      const matchesSearch =
        !text ||
        String(
          record.customerName || ""
        )
          .toLowerCase()
          .includes(text) ||

        String(
          record.dressName || ""
        )
          .toLowerCase()
          .includes(text) ||

        String(
          record.dressType || ""
        )
          .toLowerCase()
          .includes(text) ||

        String(
          recordDate || ""
        )
          .toLowerCase()
          .includes(text);

      // ======================================
      // MONTH
      // ======================================

      const matchesMonth =
        selectedMonth === "all" ||
        monthKey === selectedMonth;

      return (
        matchesSearch &&
        matchesMonth
      );
    });

  // ==========================================
  // GROUP BY MONTH
  // ==========================================

  const groupedRecords =
    filteredRecords.reduce(
      (groups, record) => {
        const recordDate =
          getRecordDate(record);

        const monthKey =
          getMonthKey(recordDate);

        if (!groups[monthKey]) {
          groups[monthKey] = [];
        }

        groups[monthKey].push(
          record
        );

        return groups;
      },
      {}
    );

  // ==========================================
  // SORT MONTHS
  // ==========================================

  const sortedMonths =
    Object.keys(
      groupedRecords
    )
      .sort()
      .reverse();

  // ==========================================
  // DELETE RECORD
  // ==========================================

  const handleDelete = async (id) => {
    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this completed record permanently?"
      );

    if (!confirmDelete) {
      return;
    }

    try {
      const token =
        localStorage.getItem("token");

      if (!token) {
        alert(
          "Please login again."
        );

        return;
      }

      const response = await fetch(
        `${API_URL}/orders/${id}`,
        {
          method: "DELETE",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      // ======================================
      // TOKEN EXPIRED
      // ======================================

      if (response.status === 401) {
        localStorage.removeItem(
          "token"
        );

        localStorage.removeItem(
          "currentUser"
        );

        window.location.reload();

        return;
      }

      // ======================================
      // ERROR
      // ======================================

      if (!response.ok) {
        throw new Error(
          "Failed to delete record"
        );
      }

      // ======================================
      // REMOVE FROM UI
      // ======================================

      setRecords(
        (previousRecords) =>
          previousRecords.filter(
            (record) =>
              record.id !== id
          )
      );

      // ======================================
      // UPDATE OTHER PAGES
      // ======================================

      window.dispatchEvent(
        new Event("ordersUpdated")
      );

      alert(
        "Monthly record deleted successfully!"
      );

    } catch (error) {
      console.error(
        "Delete monthly record error:",
        error
      );

      alert(
        "Failed to delete monthly record."
      );
    }
  };

  // ==========================================
  // CLEAR ALL
  // ==========================================

  const handleClearAll = async () => {
    if (records.length === 0) {
      return;
    }

    const confirmClear =
      window.confirm(
        "WARNING!\n\nThis will permanently delete ALL completed records for this account.\n\nAre you sure?"
      );

    if (!confirmClear) {
      return;
    }

    try {
      const token =
        localStorage.getItem("token");

      if (!token) {
        alert(
          "Please login again."
        );

        return;
      }

      // ======================================
      // DELETE ONE BY ONE
      // ======================================

      for (
        const record of records
      ) {
        const response =
          await fetch(
            `${API_URL}/orders/${record.id}`,
            {
              method: "DELETE",

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        if (!response.ok) {
          throw new Error(
            `Failed to delete record ${record.id}`
          );
        }
      }

      // ======================================
      // CLEAR UI
      // ======================================

      setRecords([]);

      // ======================================
      // UPDATE OTHER PAGES
      // ======================================

      window.dispatchEvent(
        new Event("ordersUpdated")
      );

      alert(
        "All monthly records deleted successfully!"
      );

    } catch (error) {
      console.error(
        "Clear all error:",
        error
      );

      alert(
        "Some records could not be deleted."
      );

      loadRecords();
    }
  };

  // ==========================================
  // TOTALS
  // ==========================================

  const totalClothes =
    filteredRecords.reduce(
      (total, record) =>
        total +
        Number(
          record.quantity || 0
        ),
      0
    );

  const totalAmount =
    filteredRecords.reduce(
      (total, record) =>
        total +
        Number(
          record.stitchingAmount ||
            0
        ),
      0
    );

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="page-content">

        <div className="table-card">

          <div className="empty-state">

            <div>
              🔄
            </div>

            <h3>
              Loading Monthly Records...
            </h3>

            <p>
              Getting your history
              from database.
            </p>

          </div>

        </div>

      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="page-content">

      {/* ======================================
          HEADER
      ======================================= */}

      <div className="page-heading">

        <div>

          <h2>
            📅 Monthly Records
          </h2>

          <p>
            Completed stitching history
          </p>

        </div>

        <div className="page-stats">

          <div>

            <span>
              Total Clothes
            </span>

            <strong>
              {totalClothes}
            </strong>

          </div>

          <div>

            <span>
              Total Amount
            </span>

            <strong>
              ₹{totalAmount}
            </strong>

          </div>

          <div>

            <span>
              Completed Records
            </span>

            <strong>
              {filteredRecords.length}
            </strong>

          </div>

        </div>

      </div>

      {/* ======================================
          FILTER
      ======================================= */}

      <div className="table-card">

        <div className="table-header">

          <div>

            <h3>
              Monthly Stitching History
            </h3>

            <p>
              Your completed records
              are stored permanently
              in the database.
            </p>

          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >

            {/* MONTH SELECT */}

            <select
              className="search-input"
              value={
                selectedMonth
              }
              onChange={(e) =>
                setSelectedMonth(
                  e.target.value
                )
              }
            >

              <option value="all">
                All Months
              </option>

              {monthList.map(
                (monthKey) => {

                  const sampleRecord =
                    records.find(
                      (record) =>
                        getMonthKey(
                          getRecordDate(
                            record
                          )
                        ) ===
                        monthKey
                    );

                  return (
                    <option
                      key={monthKey}
                      value={
                        monthKey
                      }
                    >
                      {getMonthName(
                        getRecordDate(
                          sampleRecord
                        )
                      )}
                    </option>
                  );
                }
              )}

            </select>

            {/* SEARCH */}

            <input
              className="search-input"
              type="text"
              placeholder="🔍 Search..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
            />

          </div>

        </div>

      </div>

      {/* ======================================
          NO RECORDS
      ======================================= */}

      {sortedMonths.length === 0 ? (

        <div className="table-card">

          <div className="empty-state">

            <div>
              📅
            </div>

            <h3>
              No Monthly Records
            </h3>

            <p>
              Completed stitching
              records will appear
              here month-wise.
            </p>

          </div>

        </div>

      ) : (

        sortedMonths.map(
          (monthKey) => {

            const monthRecords =
              groupedRecords[
                monthKey
              ];

            // =================================
            // MONTH TOTAL CLOTHES
            // =================================

            const monthClothes =
              monthRecords.reduce(
                (total, record) =>
                  total +
                  Number(
                    record.quantity ||
                      0
                  ),
                0
              );

            // =================================
            // MONTH TOTAL AMOUNT
            // =================================

            const monthAmount =
              monthRecords.reduce(
                (total, record) =>
                  total +
                  Number(
                    record.stitchingAmount ||
                      0
                  ),
                0
              );

            // =================================
            // MONTH NAME
            // =================================

            const firstRecord =
              monthRecords[0];

            const monthName =
              getMonthName(
                getRecordDate(
                  firstRecord
                )
              );

            return (

              <div
                className="table-card"
                key={monthKey}
                style={{
                  marginTop: "20px",
                }}
              >

                {/* =================================
                    MONTH HEADER
                ================================= */}

                <div className="table-header">

                  <div>

                    <h3>
                      📅 {monthName}
                    </h3>

                    <p>
                      {
                        monthRecords.length
                      } completed records
                    </p>

                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "20px",
                      alignItems:
                        "center",
                    }}
                  >

                    <div>

                      <small>
                        Clothes
                      </small>

                      <strong
                        style={{
                          display:
                            "block",
                        }}
                      >
                        {monthClothes}
                      </strong>

                    </div>

                    <div>

                      <small>
                        Stitching Amount
                      </small>

                      <strong
                        style={{
                          display:
                            "block",
                        }}
                      >
                        ₹{monthAmount}
                      </strong>

                    </div>

                  </div>

                </div>

                {/* =================================
                    TABLE
                ================================= */}

                <div className="table-wrapper">

                  <table>

                    <thead>

                      <tr>

                        <th>
                          Completed Date
                        </th>

                        <th>
                          Customer
                        </th>

                        <th>
                          Dress
                        </th>

                        <th>
                          Type
                        </th>

                        <th>
                          Qty
                        </th>

                        <th>
                          Amount
                        </th>

                        <th>
                          Lining
                        </th>

                        <th>
                          Status
                        </th>

                        <th>
                          Action
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {monthRecords.map(
                        (record) => {

                          const recordDate =
                            getRecordDate(
                              record
                            );

                          return (

                            <tr
                              key={
                                record.id
                              }
                            >

                              {/* DATE */}

                              <td>
                                {
                                  recordDate
                                }
                              </td>

                              {/* CUSTOMER */}

                              <td>
                                {
                                  record.customerName ||
                                  "Walk-in Customer"
                                }
                              </td>

                              {/* DRESS */}

                              <td>

                                <strong>
                                  {
                                    record.dressName
                                  }
                                </strong>

                              </td>

                              {/* TYPE */}

                              <td>
                                {
                                  record.dressType ||
                                  "-"
                                }
                              </td>

                              {/* QUANTITY */}

                              <td>
                                {
                                  record.quantity
                                }
                              </td>

                              {/* AMOUNT */}

                              <td className="amount">

                                ₹
                                {Number(
                                  record.stitchingAmount ||
                                    0
                                )}

                              </td>

                              {/* LINING */}

                              <td>

                                {Number(
                                  record.liningUsed ||
                                    0
                                ).toFixed(
                                  1
                                )}{" "}
                                m

                              </td>

                              {/* STATUS */}

                              <td>

                                <span
                                  className="status completed"
                                >
                                  Completed
                                </span>

                              </td>

                              {/* DELETE */}

                              <td>

                                <button
                                  type="button"
                                  className="delete-btn"
                                  onClick={() =>
                                    handleDelete(
                                      record.id
                                    )
                                  }
                                >
                                  Delete
                                </button>

                              </td>

                            </tr>
                          );
                        }
                      )}

                    </tbody>

                  </table>

                </div>

              </div>
            );
          }
        )

      )}

      {/* ======================================
          CLEAR ALL
      ======================================= */}

      {records.length > 0 && (

        <div
          style={{
            marginTop: "20px",
            textAlign: "right",
          }}
        >

          <button
            type="button"
            className="delete-btn"
            onClick={
              handleClearAll
            }
          >
            🗑️ Clear All Monthly Records
          </button>

        </div>

      )}

    </div>
  );
}

export default MonthlyRecords;