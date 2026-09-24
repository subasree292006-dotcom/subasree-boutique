import { useEffect, useState } from "react";
import "./TailorStitching.css";

function TailorStitching() {
  // ==========================================
  // TODAY DATE
  // ==========================================

  const getToday = () => {
    return new Date().toISOString().split("T")[0];
  };

  // ==========================================
  // EMPTY FORM
  // ==========================================

  const emptyForm = {
    date: getToday(),
    customerName: "",
    dressName: "",
    dressType: "Blouse",
    quantity: 1,
    stitchingAmount: "",
    liningUsed: "",
    liningName: "",
    liningColour: "",
    status: "Given to Tailor",
    notes: "",
  };

  // ==========================================
  // STATES
  // ==========================================

  const [orders, setOrders] = useState([]);

  const [monthlyRecords, setMonthlyRecords] =
    useState([]);

  const [liningStock, setLiningStock] =
    useState([]);

  const [form, setForm] =
    useState(emptyForm);

  const [search, setSearch] =
    useState("");

  const [editingId, setEditingId] =
    useState(null);

  const [saving, setSaving] =
    useState(false);

  // ==========================================
  // LOAD ALL DATA
  // ==========================================

  useEffect(() => {
    loadLiningStock();
    loadMonthlyRecords();
    loadOrders();
  }, []);

  // ==========================================
  // LOAD ORDERS
  // ==========================================

  const loadOrders = () => {
    try {
      const savedOrders =
        localStorage.getItem(
          "tailorOrders"
        );

      if (!savedOrders) {
        setOrders([]);
        return;
      }

      const parsedOrders =
        JSON.parse(savedOrders);

      if (Array.isArray(parsedOrders)) {
        setOrders(parsedOrders);

        // IMPORTANT:
        // Existing completed orders
        // will be synced to Monthly Records
        syncCompletedOrdersToMonthly(
          parsedOrders
        );
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error(
        "Error loading orders:",
        error
      );

      setOrders([]);
    }
  };

  // ==========================================
  // LOAD MONTHLY RECORDS
  // ==========================================

  const loadMonthlyRecords = () => {
    try {
      const saved =
        localStorage.getItem(
          "monthlyRecords"
        );

      if (!saved) {
        setMonthlyRecords([]);
        return;
      }

      const parsed =
        JSON.parse(saved);

      if (Array.isArray(parsed)) {
        setMonthlyRecords(parsed);
      } else {
        setMonthlyRecords([]);
      }
    } catch (error) {
      console.error(
        "Error loading monthly records:",
        error
      );

      setMonthlyRecords([]);
    }
  };

  // ==========================================
  // LOAD LINING STOCK
  // ==========================================

  const loadLiningStock = () => {
    try {
      const savedStock =
        localStorage.getItem(
          "liningStock"
        );

      if (savedStock) {
        const parsedStock =
          JSON.parse(savedStock);

        if (Array.isArray(parsedStock)) {
          setLiningStock(parsedStock);
        } else {
          setLiningStock([]);
        }
      } else {
        setLiningStock([]);
      }
    } catch (error) {
      console.error(
        "Error loading lining stock:",
        error
      );

      setLiningStock([]);
    }
  };

  // ==========================================
  // SAVE ORDERS
  // ==========================================

  const saveOrders = (data) => {
    try {
      localStorage.setItem(
        "tailorOrders",
        JSON.stringify(data)
      );
    } catch (error) {
      console.error(
        "Error saving orders:",
        error
      );
    }
  };

  // ==========================================
  // SAVE LINING STOCK
  // ==========================================

  const saveLiningStock = (data) => {
    try {
      localStorage.setItem(
        "liningStock",
        JSON.stringify(data)
      );
    } catch (error) {
      console.error(
        "Error saving lining stock:",
        error
      );
    }
  };

  // ==========================================
  // FIND LINING STOCK
  // ==========================================

  const findLiningStock = (
    liningName,
    colour,
    stock = liningStock
  ) => {
    if (!liningName || !colour) {
      return null;
    }

    return stock.find(
      (item) =>
        String(
          item.liningName || ""
        )
          .trim()
          .toLowerCase() ===
          String(liningName)
            .trim()
            .toLowerCase() &&
        String(
          item.colour || ""
        )
          .trim()
          .toLowerCase() ===
          String(colour)
            .trim()
            .toLowerCase()
    );
  };

  // ==========================================
  // UPDATE LINING STOCK
  // ==========================================

  const updateLiningStock = (
    newStock
  ) => {
    setLiningStock(newStock);
    saveLiningStock(newStock);

    window.dispatchEvent(
      new Event("liningStockUpdated")
    );
  };

  // ==========================================
  // FORM CHANGE
  // ==========================================

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setForm(
      (previousForm) => ({
        ...previousForm,
        [name]: value,
      })
    );
  };

  // ==========================================
  // RESET FORM
  // ==========================================

  const resetForm = () => {
    setEditingId(null);

    setForm({
      ...emptyForm,
      date: getToday(),
    });
  };

  // ==========================================
  // SAVE MONTHLY RECORD
  // ==========================================

  const saveMonthlyRecordLocal = (
    order
  ) => {
    try {
      const saved =
        localStorage.getItem(
          "monthlyRecords"
        );

      let monthlyRecords = saved
        ? JSON.parse(saved)
        : [];

      if (
        !Array.isArray(
          monthlyRecords
        )
      ) {
        monthlyRecords = [];
      }

      const existingIndex =
        monthlyRecords.findIndex(
          (record) =>
            String(record.id) ===
            String(order.id)
        );

      const completedDate =
        order.completedDate ||
        getToday();

      const completedRecord = {
        id: order.id,

        orderId:
          order.orderId ||
          `ORD-${order.id}`,

        date:
          order.date || "",

        customerName:
          order.customerName || "",

        dressName:
          order.dressName || "",

        dressType:
          order.dressType ||
          "Blouse",

        quantity:
          Number(
            order.quantity || 0
          ),

        stitchingAmount:
          Number(
            order.stitchingAmount || 0
          ),

        liningUsed:
          Number(
            order.liningUsed || 0
          ),

        liningName:
          order.liningName || "",

        liningColour:
          order.liningColour || "",

        status: "Completed",

        notes:
          order.notes || "",

        completedDate,

        completedMonth:
          completedDate.slice(0, 7),
      };

      if (
        existingIndex !== -1
      ) {
        monthlyRecords[
          existingIndex
        ] = completedRecord;
      } else {
        monthlyRecords.unshift(
          completedRecord
        );
      }

      localStorage.setItem(
        "monthlyRecords",
        JSON.stringify(
          monthlyRecords
        )
      );

      // Update state immediately
      setMonthlyRecords(
        monthlyRecords
      );

      // Tell Monthly Records page
      window.dispatchEvent(
        new Event(
          "monthlyRecordsUpdated"
        )
      );
    } catch (error) {
      console.error(
        "Monthly record error:",
        error
      );
    }
  };

  // ==========================================
  // SYNC EXISTING COMPLETED ORDERS
  // TO MONTHLY RECORDS
  // ==========================================

  const syncCompletedOrdersToMonthly = (
    allOrders
  ) => {
    try {
      const saved =
        localStorage.getItem(
          "monthlyRecords"
        );

      let records = saved
        ? JSON.parse(saved)
        : [];

      if (
        !Array.isArray(records)
      ) {
        records = [];
      }

      const completedOrders =
        allOrders.filter(
          (order) =>
            String(
              order.status || ""
            ).toLowerCase() ===
            "completed"
        );

      let changed = false;

      completedOrders.forEach(
        (order) => {
          const existingIndex =
            records.findIndex(
              (record) =>
                String(
                  record.id
                ) ===
                String(order.id)
            );

          const completedDate =
            order.completedDate ||
            getToday();

          const completedRecord = {
            id: order.id,

            orderId:
              order.orderId ||
              `ORD-${order.id}`,

            date:
              order.date || "",

            customerName:
              order.customerName ||
              "",

            dressName:
              order.dressName ||
              "",

            dressType:
              order.dressType ||
              "Blouse",

            quantity:
              Number(
                order.quantity || 0
              ),

            stitchingAmount:
              Number(
                order.stitchingAmount ||
                  0
              ),

            liningUsed:
              Number(
                order.liningUsed || 0
              ),

            liningName:
              order.liningName ||
              "",

            liningColour:
              order.liningColour ||
              "",

            status: "Completed",

            notes:
              order.notes || "",

            completedDate,

            completedMonth:
              completedDate.slice(
                0,
                7
              ),
          };

          if (
            existingIndex === -1
          ) {
            records.unshift(
              completedRecord
            );

            changed = true;
          } else {
            // Update existing record
            // so quantity / amount changes
            // are reflected
            records[
              existingIndex
            ] = completedRecord;

            changed = true;
          }
        }
      );

      if (changed) {
        localStorage.setItem(
          "monthlyRecords",
          JSON.stringify(records)
        );

        setMonthlyRecords(
          records
        );

        window.dispatchEvent(
          new Event(
            "monthlyRecordsUpdated"
          )
        );
      } else {
        setMonthlyRecords(
          records
        );
      }
    } catch (error) {
      console.error(
        "Error syncing completed orders:",
        error
      );
    }
  };

  // ==========================================
  // REMOVE MONTHLY RECORD
  // ==========================================

  const removeMonthlyRecord = (
    orderId
  ) => {
    try {
      const saved =
        localStorage.getItem(
          "monthlyRecords"
        );

      if (!saved) {
        return;
      }

      let monthlyRecords =
        JSON.parse(saved);

      if (
        !Array.isArray(
          monthlyRecords
        )
      ) {
        return;
      }

      monthlyRecords =
        monthlyRecords.filter(
          (record) =>
            String(record.id) !==
            String(orderId)
        );

      localStorage.setItem(
        "monthlyRecords",
        JSON.stringify(
          monthlyRecords
        )
      );

      setMonthlyRecords(
        monthlyRecords
      );

      window.dispatchEvent(
        new Event(
          "monthlyRecordsUpdated"
        )
      );
    } catch (error) {
      console.error(
        "Error removing monthly record:",
        error
      );
    }
  };

  // ==========================================
  // ADD / UPDATE
  // ==========================================

  const handleSubmit = (e) => {
    e.preventDefault();

    if (saving) {
      return;
    }

    setSaving(true);

    try {
      // ========================================
      // VALIDATION
      // ========================================

      if (
        !form.dressName.trim()
      ) {
        alert(
          "Please enter Dress Name"
        );

        setSaving(false);
        return;
      }

      if (
        form.stitchingAmount ===
        ""
      ) {
        alert(
          "Please enter Stitching Amount"
        );

        setSaving(false);
        return;
      }

      const quantity =
        Number(
          form.quantity || 1
        );

      const stitchingAmount =
        Number(
          form.stitchingAmount ||
            0
        );

      const liningUsed =
        Number(
          form.liningUsed || 0
        );

      const liningName =
        form.liningName.trim();

      const liningColour =
        form.liningColour.trim();

      // ========================================
      // QUANTITY VALIDATION
      // ========================================

      if (quantity <= 0) {
        alert(
          "Quantity must be greater than 0"
        );

        setSaving(false);
        return;
      }

      // ========================================
      // AMOUNT VALIDATION
      // ========================================

      if (
        stitchingAmount < 0
      ) {
        alert(
          "Stitching amount cannot be negative"
        );

        setSaving(false);
        return;
      }

      // ========================================
      // LINING VALIDATION
      // ========================================

      if (liningUsed < 0) {
        alert(
          "Lining quantity cannot be negative"
        );

        setSaving(false);
        return;
      }

      // ========================================
      // EDIT EXISTING ORDER
      // ========================================

      if (
        editingId !== null
      ) {
        const oldOrder =
          orders.find(
            (order) =>
              String(
                order.id
              ) ===
              String(
                editingId
              )
          );

        if (!oldOrder) {
          alert(
            "Record not found"
          );

          setSaving(false);
          return;
        }

        // ======================================
        // WORKING STOCK
        // ======================================

        let workingStock = [
          ...liningStock,
        ];

        // ======================================
        // RETURN OLD LINING
        // ======================================

        const oldLiningUsed =
          Number(
            oldOrder.liningUsed ||
              0
          );

        if (
          oldLiningUsed > 0 &&
          oldOrder.liningName &&
          oldOrder.liningColour
        ) {
          workingStock =
            workingStock.map(
              (item) => {
                const sameName =
                  String(
                    item.liningName ||
                      ""
                  )
                    .trim()
                    .toLowerCase() ===
                  String(
                    oldOrder.liningName ||
                      ""
                  )
                    .trim()
                    .toLowerCase();

                const sameColour =
                  String(
                    item.colour || ""
                  )
                    .trim()
                    .toLowerCase() ===
                  String(
                    oldOrder.liningColour ||
                      ""
                  )
                    .trim()
                    .toLowerCase();

                if (
                  sameName &&
                  sameColour
                ) {
                  return {
                    ...item,

                    quantity:
                      Number(
                        item.quantity ||
                          0
                      ) +
                      oldLiningUsed,
                  };
                }

                return item;
              }
            );
        }

        // ======================================
        // USE NEW LINING
        // ======================================

        if (
          liningUsed > 0 &&
          liningName &&
          liningColour
        ) {
          const newLiningItem =
            findLiningStock(
              liningName,
              liningColour,
              workingStock
            );

          if (!newLiningItem) {
            alert(
              "Selected lining is not available in stock."
            );

            setSaving(false);
            return;
          }

          const available =
            Number(
              newLiningItem.quantity ||
                0
            );

          if (
            liningUsed >
            available
          ) {
            alert(
              `Only ${available.toFixed(
                1
              )}m available in lining stock.`
            );

            setSaving(false);
            return;
          }

          workingStock =
            workingStock.map(
              (item) => {
                if (
                  item.id ===
                  newLiningItem.id
                ) {
                  return {
                    ...item,

                    quantity:
                      Number(
                        item.quantity ||
                          0
                      ) -
                      liningUsed,
                  };
                }

                return item;
              }
            );
        }

        // ======================================
        // COMPLETED DATE
        // ======================================

        let completedDate =
          oldOrder.completedDate ||
          null;

        if (
          form.status ===
          "Completed"
        ) {
          completedDate =
            oldOrder.completedDate ||
            getToday();
        } else {
          completedDate = null;
        }

        // ======================================
        // UPDATED ORDER
        // ======================================

        const updatedOrder = {
          ...oldOrder,

          date:
            form.date,

          customerName:
            form.customerName.trim(),

          dressName:
            form.dressName.trim(),

          dressType:
            form.dressType,

          quantity,

          stitchingAmount,

          liningUsed,

          liningName,

          liningColour,

          status:
            form.status,

          notes:
            form.notes.trim(),

          completedDate,
        };

        // ======================================
        // UPDATE ORDERS
        // ======================================

        const updatedOrders =
          orders.map(
            (order) =>
              String(
                order.id
              ) ===
              String(
                editingId
              )
                ? updatedOrder
                : order
          );

        setOrders(
          updatedOrders
        );

        saveOrders(
          updatedOrders
        );

        // ======================================
        // UPDATE STOCK
        // ======================================

        updateLiningStock(
          workingStock
        );

        // ======================================
        // MONTHLY RECORD
        // ======================================

        if (
          form.status ===
          "Completed"
        ) {
          saveMonthlyRecordLocal(
            updatedOrder
          );
        } else {
          removeMonthlyRecord(
            updatedOrder.id
          );
        }

        // ======================================
        // SUCCESS
        // ======================================

        alert(
          form.status ===
            "Completed"
            ? "Completed! Record saved in Monthly Records."
            : "Stitching record updated successfully!"
        );

        resetForm();

        setSaving(false);

        return;
      }

      // ========================================
      // NEW ORDER
      // ========================================

      const newId =
        Date.now();

      const newOrder = {
        id: newId,

        orderId:
          `ORD-${newId}`,

        date:
          form.date,

        customerName:
          form.customerName.trim(),

        dressName:
          form.dressName.trim(),

        dressType:
          form.dressType,

        quantity,

        stitchingAmount,

        liningUsed,

        liningName,

        liningColour,

        status:
          form.status,

        notes:
          form.notes.trim(),

        completedDate:
          form.status ===
          "Completed"
            ? getToday()
            : null,
      };

      // ========================================
      // UPDATE LINING STOCK
      // ========================================

      let updatedStock = [
        ...liningStock,
      ];

      if (
        liningUsed > 0 &&
        liningName &&
        liningColour
      ) {
        const stockItem =
          findLiningStock(
            liningName,
            liningColour,
            updatedStock
          );

        if (!stockItem) {
          alert(
            "Selected lining is not available in stock."
          );

          setSaving(false);
          return;
        }

        const available =
          Number(
            stockItem.quantity ||
              0
          );

        if (
          liningUsed >
          available
        ) {
          alert(
            `Only ${available.toFixed(
              1
            )}m available in lining stock.`
          );

          setSaving(false);
          return;
        }

        updatedStock =
          updatedStock.map(
            (item) => {
              if (
                item.id ===
                stockItem.id
              ) {
                return {
                  ...item,

                  quantity:
                    Number(
                      item.quantity ||
                        0
                    ) -
                    liningUsed,
                };
              }

              return item;
            }
          );
      }

      // ========================================
      // SAVE ORDER
      // ========================================

      const updatedOrders = [
        newOrder,
        ...orders,
      ];

      setOrders(
        updatedOrders
      );

      saveOrders(
        updatedOrders
      );

      // ========================================
      // SAVE STOCK
      // ========================================

      updateLiningStock(
        updatedStock
      );

      // ========================================
      // MONTHLY RECORD
      // ========================================

      if (
        form.status ===
        "Completed"
      ) {
        saveMonthlyRecordLocal(
          newOrder
        );
      }

      // ========================================
      // SUCCESS
      // ========================================

      alert(
        form.status ===
          "Completed"
          ? "Completed! Record saved in Monthly Records."
          : "Stitching record added successfully!"
      );

      resetForm();
    } catch (error) {
      console.error(
        "Save error:",
        error
      );

      alert(
        "Unable to save stitching record."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // EDIT
  // ==========================================

  const handleEdit = (
    order
  ) => {
    setForm({
      date:
        order.date ||
        getToday(),

      customerName:
        order.customerName ||
        "",

      dressName:
        order.dressName ||
        "",

      dressType:
        order.dressType ||
        "Blouse",

      quantity:
        order.quantity ??
        1,

      stitchingAmount:
        order.stitchingAmount ??
        "",

      liningUsed:
        order.liningUsed ??
        "",

      liningName:
        order.liningName ||
        "",

      liningColour:
        order.liningColour ||
        "",

      status:
        order.status ||
        "Given to Tailor",

      notes:
        order.notes ||
        "",
    });

    setEditingId(
      order.id
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==========================================
  // CANCEL
  // ==========================================

  const handleCancel = () => {
    resetForm();
  };

  // ==========================================
  // DELETE
  // ==========================================

  const handleDelete = (
    id
  ) => {
    const order =
      orders.find(
        (item) =>
          String(
            item.id
          ) ===
          String(id)
      );

    if (!order) {
      return;
    }

    // ========================================
    // COMPLETED CANNOT DELETE
    // ========================================

    if (
      String(
        order.status || ""
      ).toLowerCase() ===
      "completed"
    ) {
      alert(
        "Completed record cannot be deleted from Tailor Stitching because it must remain in Monthly Records."
      );

      return;
    }

    const confirmDelete =
      window.confirm(
        "Delete this stitching record? Used lining will be returned to stock."
      );

    if (!confirmDelete) {
      return;
    }

    // ========================================
    // RETURN LINING
    // ========================================

    let updatedStock = [
      ...liningStock,
    ];

    const liningUsed =
      Number(
        order.liningUsed ||
          0
      );

    if (
      liningUsed > 0 &&
      order.liningName &&
      order.liningColour
    ) {
      updatedStock =
        updatedStock.map(
          (item) => {
            const sameName =
              String(
                item.liningName ||
                  ""
              )
                .trim()
                .toLowerCase() ===
              String(
                order.liningName ||
                  ""
              )
                .trim()
                .toLowerCase();

            const sameColour =
              String(
                item.colour ||
                  ""
              )
                .trim()
                .toLowerCase() ===
              String(
                order.liningColour ||
                  ""
              )
                .trim()
                .toLowerCase();

            if (
              sameName &&
              sameColour
            ) {
              return {
                ...item,

                quantity:
                  Number(
                    item.quantity ||
                      0
                  ) +
                  liningUsed,
              };
            }

            return item;
          }
        );
    }

    // ========================================
    // DELETE ORDER
    // ========================================

    const updatedOrders =
      orders.filter(
        (item) =>
          String(
            item.id
          ) !==
          String(id)
      );

    setOrders(
      updatedOrders
    );

    saveOrders(
      updatedOrders
    );

    // ========================================
    // SAVE STOCK
    // ========================================

    updateLiningStock(
      updatedStock
    );

    // ========================================
    // RESET EDIT
    // ========================================

    if (
      String(
        editingId
      ) ===
      String(id)
    ) {
      resetForm();
    }

    alert(
      "Stitching record deleted and lining returned to stock!"
    );
  };

  // ==========================================
  // FILTER
  // ==========================================

  const filteredOrders =
    orders.filter(
      (order) => {
        // Completed records are shown
        // only in Monthly Records.

        if (
          String(
            order.status || ""
          ).toLowerCase() ===
          "completed"
        ) {
          return false;
        }

        const text =
          search
            .toLowerCase()
            .trim();

        return (
          String(
            order.customerName ||
              ""
          )
            .toLowerCase()
            .includes(text) ||

          String(
            order.dressName ||
              ""
          )
            .toLowerCase()
            .includes(text) ||

          String(
            order.dressType ||
              ""
          )
            .toLowerCase()
            .includes(text) ||

          String(
            order.status ||
              ""
          )
            .toLowerCase()
            .includes(text)
        );
      }
    );

  // ==========================================
  // COMPLETED CLOTHES
  // FROM MONTHLY RECORDS
  // ==========================================

  const completed =
    monthlyRecords.reduce(
      (
        total,
        record
      ) =>
        total +
        Number(
          record.quantity ||
            0
        ),
      0
    );

  // ==========================================
  // PENDING CLOTHES
  // GIVEN TO TAILOR + STITCHING
  // ==========================================

  const pending =
    orders
      .filter(
        (order) =>
          order.status ===
            "Given to Tailor" ||
          order.status ===
            "Stitching"
      )
      .reduce(
        (
          total,
          order
        ) =>
          total +
          Number(
            order.quantity ||
              0
          ),
        0
      );

  // ==========================================
  // GIVEN TO TAILOR
  // ==========================================

  const givenToTailor =
    orders
      .filter(
        (order) =>
          order.status ===
          "Given to Tailor"
      )
      .reduce(
        (
          total,
          order
        ) =>
          total +
          Number(
            order.quantity ||
              0
          ),
        0
      );

  // ==========================================
  // STITCHING CLOTHES
  // ==========================================

  const stitching =
    orders
      .filter(
        (order) =>
          order.status ===
          "Stitching"
      )
      .reduce(
        (
          total,
          order
        ) =>
          total +
          Number(
            order.quantity ||
              0
          ),
        0
      );

  // ==========================================
  // TOTAL CLOTHES
  // ==========================================

  const totalClothes =
    completed +
    pending;

  // ==========================================
  // PENDING AMOUNT
  // ==========================================

  const totalAmount =
    orders
      .filter(
        (order) =>
          order.status ===
            "Given to Tailor" ||
          order.status ===
            "Stitching"
      )
      .reduce(
        (
          total,
          order
        ) =>
          total +
          Number(
            order.stitchingAmount ||
              0
          ),
        0
      );

  // ==========================================
  // TOTAL LINING
  // ==========================================

  const totalLining =
    orders.reduce(
      (
        total,
        order
      ) =>
        total +
        Number(
          order.liningUsed ||
            0
        ),
      0
    );

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="page-content">

      {/* ======================================
          HEADER
      ====================================== */}

      <div className="page-heading">

        <div>
          <h2>
            🧵 Tailor Stitching
          </h2>

          <p>
            Manage clothes given to tailor
          </p>
        </div>

        <div className="page-stats">

          {/* TOTAL */}

          <div>
            <span>
              Total Clothes
            </span>

            <strong>
              {totalClothes}
            </strong>
          </div>

          {/* COMPLETED */}

          <div>
            <span>
              Completed
            </span>

            <strong>
              {completed}
            </strong>
          </div>

          {/* PENDING */}

          <div>
            <span>
              Pending
            </span>

            <strong>
              {pending}
            </strong>
          </div>

          {/* AMOUNT */}

          <div>
            <span>
              Pending Amount
            </span>

            <strong>
              ₹{totalAmount}
            </strong>
          </div>

        </div>
      </div>

      {/* ======================================
          FORM
      ====================================== */}

      <div className="form-card">

        <div className="form-title">

          <h3>
            {editingId !== null
              ? "✏️ Edit Stitching"
              : "➕ Add Stitching"}
          </h3>

          {editingId !== null && (
            <button
              type="button"
              className="cancel-btn"
              onClick={
                handleCancel
              }
            >
              Cancel
            </button>
          )}

        </div>

        <form
          onSubmit={
            handleSubmit
          }
        >

          <div className="form-grid">

            {/* DATE */}

            <div className="input-group">

              <label>
                Date
              </label>

              <input
                type="date"
                name="date"
                value={
                  form.date
                }
                onChange={
                  handleChange
                }
              />

            </div>

            {/* CUSTOMER */}

            <div className="input-group">

              <label>
                Customer Name
              </label>

              <input
                type="text"
                name="customerName"
                placeholder="Enter customer name"
                value={
                  form.customerName
                }
                onChange={
                  handleChange
                }
              />

            </div>

            {/* DRESS */}

            <div className="input-group">

              <label>
                Dress Name *
              </label>

              <input
                type="text"
                name="dressName"
                placeholder="Example: Lining Blouse"
                value={
                  form.dressName
                }
                onChange={
                  handleChange
                }
                required
              />

            </div>

            {/* TYPE */}

            <div className="input-group">

              <label>
                Dress Type
              </label>

              <select
                name="dressType"
                value={
                  form.dressType
                }
                onChange={
                  handleChange
                }
              >

                <option value="Blouse">
                  Blouse
                </option>

                <option value="Chudi">
                  Chudi
                </option>

                <option value="Kurti">
                  Kurti
                </option>

                <option value="Salwar">
                  Salwar
                </option>

                <option value="Saree Blouse">
                  Saree Blouse
                </option>

                <option value="Dress">
                  Dress
                </option>

                <option value="Other">
                  Other
                </option>

              </select>

            </div>

            {/* QUANTITY */}

            <div className="input-group">

              <label>
                Quantity
              </label>

              <input
                type="number"
                name="quantity"
                min="1"
                value={
                  form.quantity
                }
                onChange={
                  handleChange
                }
              />

            </div>

            {/* AMOUNT */}

            <div className="input-group">

              <label>
                Stitching Amount *
              </label>

              <input
                type="number"
                name="stitchingAmount"
                placeholder="₹ Amount"
                min="0"
                value={
                  form.stitchingAmount
                }
                onChange={
                  handleChange
                }
                required
              />

            </div>

            {/* LINING NAME */}

            <div className="input-group">

              <label>
                Lining Name{" "}
                <small>
                  (Optional)
                </small>
              </label>

              <select
                name="liningName"
                value={
                  form.liningName
                }
                onChange={
                  handleChange
                }
              >

                <option value="">
                  Select Lining
                </option>

                {[
                  ...new Map(
                    liningStock
                      .filter(
                        (item) =>
                          item.liningName
                      )
                      .map(
                        (item) => [
                          item.liningName,
                          item,
                        ]
                      )
                  ).values(),
                ].map(
                  (item) => (

                    <option
                      key={
                        item.id
                      }
                      value={
                        item.liningName
                      }
                    >
                      {
                        item.liningName
                      }
                    </option>

                  )
                )}

              </select>

            </div>

            {/* LINING COLOUR */}

            <div className="input-group">

              <label>
                Lining Colour{" "}
                <small>
                  (Optional)
                </small>
              </label>

              <select
                name="liningColour"
                value={
                  form.liningColour
                }
                onChange={
                  handleChange
                }
              >

                <option value="">
                  Select Colour
                </option>

                {liningStock
                  .filter(
                    (item) =>
                      !form.liningName ||
                      String(
                        item.liningName ||
                          ""
                      )
                        .trim()
                        .toLowerCase() ===
                        String(
                          form.liningName ||
                            ""
                        )
                          .trim()
                          .toLowerCase()
                  )
                  .map(
                    (item) => (

                      <option
                        key={
                          item.id
                        }
                        value={
                          item.colour
                        }
                      >
                        {
                          item.colour
                        }{" "}
                        —{" "}
                        {Number(
                          item.quantity ||
                            0
                        ).toFixed(
                          1
                        )}
                        m
                      </option>

                    )
                  )}

              </select>

            </div>

            {/* LINING USED */}

            <div className="input-group">

              <label>
                Lining Used (Meter){" "}
                <small>
                  (Optional)
                </small>
              </label>

              <input
                type="number"
                name="liningUsed"
                placeholder="Example: 1.5"
                min="0"
                step="0.1"
                value={
                  form.liningUsed
                }
                onChange={
                  handleChange
                }
              />

            </div>

            {/* STATUS */}

            <div className="input-group">

              <label>
                Status
              </label>

              <select
                name="status"
                value={
                  form.status
                }
                onChange={
                  handleChange
                }
              >

                <option value="Given to Tailor">
                  Given to Tailor
                </option>

                <option value="Stitching">
                  Stitching
                </option>

                <option value="Completed">
                  Completed
                </option>

                <option value="Delivered">
                  Delivered
                </option>

              </select>

            </div>

            {/* NOTES */}

            <div className="input-group full-width">

              <label>
                Notes
              </label>

              <textarea
                name="notes"
                placeholder="Any additional details..."
                value={
                  form.notes
                }
                onChange={
                  handleChange
                }
                rows="3"
              />

            </div>

          </div>

          <button
            className="primary-btn"
            type="submit"
            disabled={
              saving
            }
          >
            {saving
              ? "Saving..."
              : editingId !== null
                ? "Update Stitching"
                : "+ Add Stitching"}
          </button>

        </form>

      </div>

      {/* ======================================
          TABLE
      ====================================== */}

      <div className="table-card">

        <div className="table-header">

          <div>

            <h3>
              Stitching Records
            </h3>

            <p>
              {
                filteredOrders.length
              }{" "}
              records found
            </p>

          </div>

          <input
            className="search-input"
            type="text"
            placeholder="🔍 Search..."
            value={
              search
            }
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

        </div>

        {filteredOrders.length ===
        0 ? (

          <div className="empty-state">

            <div>
              🧵
            </div>

            <h3>
              No stitching records
            </h3>

            <p>
              Add your first tailor
              stitching record above.
            </p>

          </div>

        ) : (

          <div className="table-wrapper">

            <table>

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
                    Used
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

                {filteredOrders.map(
                  (order) => (

                    <tr
                      key={
                        order.id
                      }
                    >

                      <td>
                        {
                          order.date
                        }
                      </td>

                      <td>
                        {
                          order.customerName ||
                          "Walk-in Customer"
                        }
                      </td>

                      <td>

                        <strong>
                          {
                            order.dressName
                          }
                        </strong>

                      </td>

                      <td>
                        {
                          order.dressType
                        }
                      </td>

                      <td>
                        {
                          order.quantity
                        }
                      </td>

                      <td className="amount">
                        ₹
                        {Number(
                          order.stitchingAmount ||
                            0
                        )}
                      </td>

                      <td>
                        {order.liningName
                          ? `${order.liningName}${
                              order.liningColour
                                ? ` - ${order.liningColour}`
                                : ""
                            }`
                          : "-"}
                      </td>

                      <td>
                        {Number(
                          order.liningUsed ||
                            0
                        ).toFixed(
                          1
                        )}
                        m
                      </td>

                      <td>

                        <span
                          className={
                            "status " +
                            String(
                              order.status ||
                                ""
                            )
                              .toLowerCase()
                              .replaceAll(
                                " ",
                                "-"
                              )
                          }
                        >
                          {
                            order.status
                          }
                        </span>

                      </td>

                      <td>

                        <div className="action-buttons">

                          <button
                            type="button"
                            className="edit-btn"
                            onClick={() =>
                              handleEdit(
                                order
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="delete-btn"
                            onClick={() =>
                              handleDelete(
                                order.id
                              )
                            }
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
}

export default TailorStitching;