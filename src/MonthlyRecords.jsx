import { useEffect, useState } from "react";
import "./MonthlyRecords.css";

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
  // LOAD RECORDS FROM LOCAL STORAGE
  // ==========================================

  const loadRecords = () => {
    try {
      setLoading(true);

      const savedRecords =
        localStorage.getItem("monthlyRecords");

      if (!savedRecords) {
        setRecords([]);
        return;
      }

      const parsedRecords =
        JSON.parse(savedRecords);

      if (Array.isArray(parsedRecords)) {
        setRecords(parsedRecords);
      } else {
        setRecords([]);
      }
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

    window.addEventListener(
      "monthlyRecordsUpdated",
      handleUpdate
    );

    return () => {
      window.removeEventListener(
        "ordersUpdated",
        handleUpdate
      );

      window.removeEventListener(
        "monthlyRecordsUpdated",
        handleUpdate
      );
    };
  }, []);

  // ==========================================
  // GET RECORD DATE
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

        groups[monthKey].push(record);

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
  // DELETE ONE RECORD
  // ==========================================

  const handleDelete = (id) => {
    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this completed record permanently?"
      );

    if (!confirmDelete) {
      return;
    }

    try {
      const updatedRecords =
        records.filter(
          (record) =>
            String(record.id) !==
            String(id)
        );

      // Update state
      setRecords(updatedRecords);

      // Save localStorage
      localStorage.setItem(
        "monthlyRecords",
        JSON.stringify(
          updatedRecords
        )
      );

      // Update other pages
      window.dispatchEvent(
        new Event(
          "ordersUpdated"
        )
      );

      window.dispatchEvent(
        new Event(
          "monthlyRecordsUpdated"
        )
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
  // CLEAR ALL RECORDS
  // ==========================================

  const handleClearAll = () => {
    if (records.length === 0) {
      return;
    }

    const confirmClear =
      window.confirm(
        "WARNING!\n\nThis will permanently delete ALL completed records.\n\nAre you sure?"
      );

    if (!confirmClear) {
      return;
    }

    try {
      // Clear state
      setRecords([]);

      // Clear localStorage
      localStorage.setItem(
        "monthlyRecords",
        JSON.stringify([])
      );

      // Update other pages
      window.dispatchEvent(
        new Event(
          "ordersUpdated"
        )
      );

      window.dispatchEvent(
        new Event(
          "monthlyRecordsUpdated"
        )
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
        "Failed to clear monthly records."
      );

      loadRecords();
    }
  };

  // ==========================================
  // TOTAL CLOTHES
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

  // ==========================================
  // TOTAL AMOUNT
  // ==========================================

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
  // TOTAL LINING
  // ==========================================

  const totalLining =
    filteredRecords.reduce(
      (total, record) =>
        total +
        Number(
          record.liningUsed || 0
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
              Getting your completed
              stitching history.
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

          <div>

            <span>
              Lining Used
            </span>

            <strong>
              {totalLining.toFixed(1)}m
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
              Completed records are
              stored in your browser.
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
                      key={
                        monthKey
                      }
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
            // MONTH TOTAL LINING
            // =================================

            const monthLining =
              monthRecords.reduce(
                (total, record) =>
                  total +
                  Number(
                    record.liningUsed ||
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

                    <div>

                      <small>
                        Lining Used
                      </small>

                      <strong
                        style={{
                          display:
                            "block",
                        }}
                      >
                        {monthLining.toFixed(
                          1
                        )}m
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
                          Stitching Date
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

                                {record.liningName
                                  ? `${record.liningName}${
                                      record.liningColour
                                        ? ` - ${record.liningColour}`
                                        : ""
                                    }`
                                  : record.liningColor
                                  ? record.liningColor
                                  : Number(
                                      record.liningUsed ||
                                        0
                                    ) > 0
                                  ? `${Number(
                                      record.liningUsed ||
                                        0
                                    ).toFixed(
                                      1
                                    )} m`
                                  : "-"}

                              </td>

                              {/* STATUS */}

                              <td>

                                <span className="status completed">
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