import {
  useEffect,
  useState,
} from "react";

import "./TailorStitching.css";

const API_URL =
  "http://localhost:5000/api";

function TailorStitching() {
  // ===================================================
  // TODAY
  // ===================================================

  const getToday = () =>
    new Date()
      .toISOString()
      .split("T")[0];

  // ===================================================
  // FORM
  // ===================================================

  const createEmptyForm = () => ({
    date: getToday(),

    customerName: "",

    dressName: "",

    dressType: "Blouse",

    quantity: 1,

    stitchingAmount: "",

    liningName: "",

    liningColour: "",

    liningUsed: "",

    status: "Given to Tailor",

    notes: "",
  });

  const [form, setForm] =
    useState(createEmptyForm());

  const [orders, setOrders] =
    useState([]);

  const [
    liningStock,
    setLiningStock,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [
    editingId,
    setEditingId,
  ] = useState(null);

  const [search, setSearch] =
    useState("");

  // ===================================================
  // TOKEN
  // ===================================================

  const getToken = () =>
    localStorage.getItem("token");

  // ===================================================
  // API REQUEST
  // ===================================================

  const apiRequest = async (
    path,
    options = {}
  ) => {
    const token = getToken();

    if (!token) {
      throw new Error(
        "Please login again"
      );
    }

    const response =
      await fetch(
        `${API_URL}${path}`,
        {
          ...options,

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,

            ...(options.headers || {}),
          },
        }
      );

    let data = {};

    try {
      data =
        await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Something went wrong"
      );
    }

    return data;
  };

  // ===================================================
  // MAP STOCK
  // ===================================================

  const mapStock = (item) => ({
    id: Number(item.id),

    stockId:
      item.stock_id || "",

    liningName:
      item.lining_name || "",

    colour:
      item.colour ||
      item.color ||
      "",

    quantity:
      Number(
        item.quantity || 0
      ),

    pricePerMeter:
      Number(
        item.price_per_meter ||
          0
      ),

    purchaseDate:
      item.purchase_date || "",

    notes:
      item.notes || "",
  });

  // ===================================================
  // MAP ORDER
  // ===================================================

  const mapOrder = (order) => ({
    id: Number(order.id),

    orderId:
      order.order_id || "",

    date:
      order.date || "",

    customerName:
      order.customer_name || "",

    dressName:
      order.dress_name || "",

    dressType:
      order.dress_type ||
      "Blouse",

    quantity:
      Number(
        order.quantity || 0
      ),

    stitchingAmount:
      Number(
        order.stitching_amount ||
          0
      ),

    liningName:
      order.lining_name || "",

    liningColour:
      order.lining_color || "",

    liningUsed:
      Number(
        order.lining_used || 0
      ),

    status:
      order.status ||
      "Given to Tailor",

    notes:
      order.notes || "",

    completedDate:
      order.completed_date ||
      null,
  });

  // ===================================================
  // LOAD ORDERS
  // ===================================================

  const loadOrders =
    async () => {
      const data =
        await apiRequest(
          "/orders",
          {
            method: "GET",
          }
        );

      const list =
        Array.isArray(data)
          ? data
          : data.orders || [];

      setOrders(
        list.map(mapOrder)
      );
    };

  // ===================================================
  // LOAD STOCK FROM SQLITE
  // ===================================================

  const loadLiningStock =
    async () => {
      const data =
        await apiRequest(
          "/lining-stock",
          {
            method: "GET",
          }
        );

      const list =
        Array.isArray(data)
          ? data
          : [];

      setLiningStock(
        list.map(mapStock)
      );
    };

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    const loadEverything =
      async () => {
        try {
          setLoading(true);

          await Promise.all([
            loadOrders(),
            loadLiningStock(),
          ]);
        } catch (error) {
          console.error(
            "LOAD ERROR:",
            error
          );

          alert(error.message);
        } finally {
          setLoading(false);
        }
      };

    loadEverything();
  }, []);

  // ===================================================
  // FIND STOCK
  // ===================================================

  const findLiningStock = (
    name,
    colour
  ) => {
    if (
      !name ||
      !colour
    ) {
      return null;
    }

    return liningStock.find(
      (item) =>
        String(
          item.liningName || ""
        )
          .trim()
          .toLowerCase() ===
          String(name)
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

  // ===================================================
  // ADJUST SQLITE STOCK
  // ===================================================

  const adjustStock =
    async (
      stockId,
      change
    ) => {
      return await apiRequest(
        `/lining-stock/${stockId}/adjust`,
        {
          method: "PATCH",

          body: JSON.stringify({
            change,
          }),
        }
      );
    };

  // ===================================================
  // CHANGE
  // ===================================================

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    // If lining name changes,
    // reset colour.

    if (
      name === "liningName"
    ) {
      setForm((previous) => ({
        ...previous,

        liningName: value,

        liningColour: "",
      }));

      return;
    }

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ===================================================
  // RESET
  // ===================================================

  const resetForm = () => {
    setEditingId(null);

    setForm(
      createEmptyForm()
    );
  };

  // ===================================================
  // ORDER PAYLOAD
  // ===================================================

  const createPayload = (
    order,
    oldOrderId = null
  ) => ({
    order_id:
      oldOrderId ||
      order.orderId ||
      `ORD-${Date.now()}`,

    date:
      order.date || "",

    customer_name:
      order.customerName || "",

    dress_name:
      order.dressName || "",

    dress_type:
      order.dressType ||
      "Blouse",

    quantity:
      Number(
        order.quantity || 1
      ),

    stitching_amount:
      Number(
        order.stitchingAmount ||
          0
      ),

    lining_name:
      order.liningName || "",

    lining_color:
      order.liningColour || "",

    lining_used:
      Number(
        order.liningUsed || 0
      ),

    status:
      order.status ||
      "Given to Tailor",

    notes:
      order.notes || "",

    completed_date:
      order.completedDate ||
      null,
  });

  // ===================================================
  // LOCAL MONTHLY SNAPSHOT
  // ===================================================

  const saveMonthlyRecordLocal =
    (order) => {
      try {
        const oldData =
          JSON.parse(
            localStorage.getItem(
              "monthlyRecords"
            ) || "[]"
          );

        const exists =
          oldData.some(
            (item) =>
              String(item.id) ===
              String(order.id)
          );

        if (exists) {
          return;
        }

        const record = {
          ...order,

          completedDate:
            order.completedDate ||
            getToday(),
        };

        localStorage.setItem(
          "monthlyRecords",

          JSON.stringify([
            record,
            ...oldData,
          ])
        );
      } catch (error) {
        console.error(
          "MONTHLY ERROR:",
          error
        );
      }
    };

  // ===================================================
  // SUBMIT
  // ===================================================

  const handleSubmit =
    async (e) => {
      e.preventDefault();

      const dressName =
        form.dressName.trim();

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

      // ===============================================
      // VALIDATION
      // ===============================================

      if (!dressName) {
        alert(
          "Please enter Dress Name"
        );

        return;
      }

      if (
        form.stitchingAmount ===
        ""
      ) {
        alert(
          "Please enter Stitching Amount"
        );

        return;
      }

      if (
        !Number.isFinite(
          quantity
        ) ||
        quantity <= 0
      ) {
        alert(
          "Quantity must be greater than 0"
        );

        return;
      }

      if (
        !Number.isFinite(
          stitchingAmount
        ) ||
        stitchingAmount < 0
      ) {
        alert(
          "Invalid stitching amount"
        );

        return;
      }

      if (
        !Number.isFinite(
          liningUsed
        ) ||
        liningUsed < 0
      ) {
        alert(
          "Invalid lining quantity"
        );

        return;
      }

      // ===============================================
      // FIND NEW LINING
      // ===============================================

      let newStockItem = null;

      if (liningUsed > 0) {
        if (
          !liningName ||
          !liningColour
        ) {
          alert(
            "Please select Lining Name and Colour"
          );

          return;
        }

        newStockItem =
          findLiningStock(
            liningName,
            liningColour
          );

        if (!newStockItem) {
          alert(
            "Selected lining is not available in stock"
          );

          return;
        }
      }

      // ===============================================
      // UPDATE EXISTING ORDER
      // ===============================================

      if (
        editingId !== null
      ) {
        const oldOrder =
          orders.find(
            (item) =>
              item.id ===
              editingId
          );

        if (!oldOrder) {
          alert(
            "Order not found"
          );

          return;
        }

        const oldUsed =
          Number(
            oldOrder.liningUsed ||
              0
          );

        const oldStockItem =
          oldUsed > 0
            ? findLiningStock(
                oldOrder.liningName,
                oldOrder.liningColour
              )
            : null;

        // =============================================
        // AVAILABLE STOCK CALCULATION
        // If editing same lining, old quantity will
        // first come back.
        // =============================================

        let availableForNew =
          newStockItem
            ? Number(
                newStockItem.quantity ||
                  0
              )
            : 0;

        if (
          oldStockItem &&
          newStockItem &&
          oldStockItem.id ===
            newStockItem.id
        ) {
          availableForNew +=
            oldUsed;
        }

        if (
          liningUsed >
          availableForNew
        ) {
          alert(
            `Only ${availableForNew.toFixed(
              1
            )}m available`
          );

          return;
        }

        const completedDate =
          form.status ===
          "Completed"
            ? oldOrder.completedDate ||
              getToday()
            : null;

        const updatedOrder = {
          ...oldOrder,

          date: form.date,

          customerName:
            form.customerName.trim(),

          dressName,

          dressType:
            form.dressType,

          quantity,

          stitchingAmount,

          liningName,

          liningColour,

          liningUsed,

          status:
            form.status,

          notes:
            form.notes.trim(),

          completedDate,
        };

        let returnedOld =
          false;

        let reducedNew =
          false;

        try {
          // ===========================================
          // RETURN OLD STOCK TO SQLITE
          // ===========================================

          if (
            oldUsed > 0 &&
            oldStockItem
          ) {
            await adjustStock(
              oldStockItem.id,
              oldUsed
            );

            returnedOld =
              true;
          }

          // ===========================================
          // REDUCE NEW STOCK FROM SQLITE
          // ===========================================

          if (
            liningUsed > 0 &&
            newStockItem
          ) {
            await adjustStock(
              newStockItem.id,
              -liningUsed
            );

            reducedNew =
              true;
          }

          // ===========================================
          // UPDATE ORDER
          // ===========================================

          await apiRequest(
            `/orders/${editingId}`,
            {
              method: "PUT",

              body:
                JSON.stringify(
                  createPayload(
                    updatedOrder,
                    oldOrder.orderId
                  )
                ),
            }
          );

          if (
            form.status ===
            "Completed"
          ) {
            saveMonthlyRecordLocal(
              updatedOrder
            );
          }

          await Promise.all([
            loadOrders(),
            loadLiningStock(),
          ]);

          resetForm();

          alert(
            form.status ===
              "Completed"
              ? "Completed successfully!"
              : "Stitching updated successfully!"
          );
        } catch (error) {
          console.error(
            "UPDATE ERROR:",
            error
          );

          // ===========================================
          // ROLLBACK STOCK IF ORDER UPDATE FAILS
          // ===========================================

          try {
            if (
              reducedNew &&
              newStockItem
            ) {
              await adjustStock(
                newStockItem.id,
                liningUsed
              );
            }

            if (
              returnedOld &&
              oldStockItem
            ) {
              await adjustStock(
                oldStockItem.id,
                -oldUsed
              );
            }

            await loadLiningStock();
          } catch (
            rollbackError
          ) {
            console.error(
              "ROLLBACK ERROR:",
              rollbackError
            );
          }

          alert(error.message);
        }

        return;
      }

      // ===============================================
      // NEW ORDER
      // ===============================================

      if (
        newStockItem &&
        liningUsed >
          Number(
            newStockItem.quantity ||
              0
          )
      ) {
        alert(
          `Only ${Number(
            newStockItem.quantity ||
              0
          ).toFixed(
            1
          )}m available`
        );

        return;
      }

      const newOrder = {
        date:
          form.date,

        customerName:
          form.customerName.trim(),

        dressName,

        dressType:
          form.dressType,

        quantity,

        stitchingAmount,

        liningName,

        liningColour,

        liningUsed,

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

      let stockReduced =
        false;

      try {
        // =============================================
        // FIRST REDUCE SQLITE STOCK
        // =============================================

        if (
          liningUsed > 0 &&
          newStockItem
        ) {
          await adjustStock(
            newStockItem.id,
            -liningUsed
          );

          stockReduced =
            true;
        }

        // =============================================
        // SAVE ORDER
        // =============================================

        const data =
          await apiRequest(
            "/orders",
            {
              method: "POST",

              body:
                JSON.stringify(
                  createPayload(
                    newOrder
                  )
                ),
            }
          );

        const savedOrder = {
          ...newOrder,

          id:
            Number(
              data.id ||
                data.order?.id
            ),

          orderId:
            data.order_id ||
            data.order?.order_id ||
            "",
        };

        if (
          form.status ===
          "Completed"
        ) {
          saveMonthlyRecordLocal(
            savedOrder
          );
        }

        await Promise.all([
          loadOrders(),
          loadLiningStock(),
        ]);

        resetForm();

        alert(
          form.status ===
            "Completed"
            ? "Completed successfully!"
            : "Stitching added successfully!"
        );
      } catch (error) {
        console.error(
          "ADD ERROR:",
          error
        );

        // =============================================
        // RETURN STOCK IF ORDER FAILED
        // =============================================

        if (
          stockReduced &&
          newStockItem
        ) {
          try {
            await adjustStock(
              newStockItem.id,
              liningUsed
            );

            await loadLiningStock();
          } catch (
            rollbackError
          ) {
            console.error(
              "ROLLBACK ERROR:",
              rollbackError
            );
          }
        }

        alert(error.message);
      }
    };

  // ===================================================
  // EDIT
  // ===================================================

  const handleEdit = (
    order
  ) => {
    setEditingId(
      order.id
    );

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
        order.quantity || 1,

      stitchingAmount:
        order.stitchingAmount ??
        "",

      liningName:
        order.liningName ||
        "",

      liningColour:
        order.liningColour ||
        "",

      liningUsed:
        order.liningUsed ||
        "",

      status:
        order.status ||
        "Given to Tailor",

      notes:
        order.notes ||
        "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ===================================================
  // DELETE
  // ===================================================

  const handleDelete =
    async (order) => {
      if (
        order.status ===
        "Completed"
      ) {
        alert(
          "Completed record cannot be deleted from Tailor Stitching."
        );

        return;
      }

      const confirmed =
        window.confirm(
          "Delete this record? Used lining will be returned to stock."
        );

      if (!confirmed) {
        return;
      }

      const used =
        Number(
          order.liningUsed || 0
        );

      const stockItem =
        used > 0
          ? findLiningStock(
              order.liningName,
              order.liningColour
            )
          : null;

      let returned =
        false;

      try {
        // =============================================
        // RETURN STOCK
        // =============================================

        if (
          used > 0 &&
          stockItem
        ) {
          await adjustStock(
            stockItem.id,
            used
          );

          returned = true;
        }

        // =============================================
        // DELETE ORDER
        // =============================================

        await apiRequest(
          `/orders/${order.id}`,
          {
            method: "DELETE",
          }
        );

        await Promise.all([
          loadOrders(),
          loadLiningStock(),
        ]);

        if (
          editingId ===
          order.id
        ) {
          resetForm();
        }

        alert(
          "Record deleted and lining returned to stock!"
        );
      } catch (error) {
        console.error(
          "DELETE ERROR:",
          error
        );

        // Undo returned stock
        if (
          returned &&
          stockItem
        ) {
          try {
            await adjustStock(
              stockItem.id,
              -used
            );

            await loadLiningStock();
          } catch (
            rollbackError
          ) {
            console.error(
              rollbackError
            );
          }
        }

        alert(error.message);
      }
    };

  // ===================================================
  // AVAILABLE LINING NAMES
  // ===================================================

  const liningNames = [
    ...new Set(
      liningStock
        .filter(
          (item) =>
            Number(
              item.quantity ||
                0
            ) > 0
        )
        .map(
          (item) =>
            item.liningName
        )
    ),
  ];

  // ===================================================
  // COLOURS
  // ===================================================

  const availableColours =
    liningStock.filter(
      (item) =>
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
    );

  // ===================================================
  // FILTER ORDERS
  // ===================================================

  const filteredOrders =
    orders.filter(
      (order) => {
        if (
          order.status ===
          "Completed"
        ) {
          return false;
        }

        const text =
          search
            .trim()
            .toLowerCase();

        return (
          order.customerName
            .toLowerCase()
            .includes(text) ||

          order.dressName
            .toLowerCase()
            .includes(text) ||

          order.dressType
            .toLowerCase()
            .includes(text) ||

          order.status
            .toLowerCase()
            .includes(text)
        );
      }
    );

  // ===================================================
  // STATS
  // ===================================================

  const completed =
    orders
      .filter(
        (order) =>
          order.status ===
          "Completed"
      )
      .reduce(
        (total, order) =>
          total +
          Number(
            order.quantity ||
              0
          ),
        0
      );

  const givenToTailor =
    orders
      .filter(
        (order) =>
          order.status ===
          "Given to Tailor"
      )
      .reduce(
        (total, order) =>
          total +
          Number(
            order.quantity ||
              0
          ),
        0
      );

  const pending =
    givenToTailor;

  const totalClothes =
    completed +
    givenToTailor;

  const totalAmount =
    orders
      .filter(
        (order) =>
          order.status ===
          "Given to Tailor"
      )
      .reduce(
        (total, order) =>
          total +
          Number(
            order.stitchingAmount ||
              0
          ),
        0
      );

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <div className="page-content">
        <div className="empty-state">
          <div>⏳</div>

          <h3>
            Loading stitching
            records...
          </h3>

          <p>Please wait...</p>
        </div>
      </div>
    );
  }

  // ===================================================
  // UI
  // ===================================================

  return (
    <div className="page-content">
      {/* HEADER */}

      <div className="page-heading">
        <div>
          <h2>
            🧵 Tailor Stitching
          </h2>

          <p>
            Manage clothes given
            to tailor
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
              Completed
            </span>

            <strong>
              {completed}
            </strong>
          </div>

          <div>
            <span>
              Pending
            </span>

            <strong>
              {pending}
            </strong>
          </div>

          <div>
            <span>
              Given to Tailor
              Amount
            </span>

            <strong>
              ₹{totalAmount}
            </strong>
          </div>
        </div>
      </div>

      {/* FORM */}

      <div className="form-card">
        <div className="form-title">
          <h3>
            {editingId !== null
              ? "✏️ Edit Stitching"
              : "➕ Add Stitching"}
          </h3>

          {editingId !==
            null && (
            <button
              type="button"
              className="cancel-btn"
              onClick={
                resetForm
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

            <div className="input-group">
              <label>
                Customer Name
              </label>

              <input
                type="text"
                name="customerName"
                value={
                  form.customerName
                }
                placeholder="Customer name"
                onChange={
                  handleChange
                }
              />
            </div>

            <div className="input-group">
              <label>
                Dress Name *
              </label>

              <input
                type="text"
                name="dressName"
                value={
                  form.dressName
                }
                placeholder="Dress name"
                onChange={
                  handleChange
                }
                required
              />
            </div>

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

            <div className="input-group">
              <label>
                Stitching Amount *
              </label>

              <input
                type="number"
                name="stitchingAmount"
                min="0"
                value={
                  form.stitchingAmount
                }
                placeholder="₹ Amount"
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

                {liningNames.map(
                  (name) => (
                    <option
                      key={name}
                      value={name}
                    >
                      {name}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* COLOUR */}

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

                {availableColours.map(
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
                Lining Used
                (Meter){" "}
                <small>
                  (Optional)
                </small>
              </label>

              <input
                type="number"
                name="liningUsed"
                min="0"
                step="0.1"
                value={
                  form.liningUsed
                }
                placeholder="Example: 1.5"
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
                rows="3"
                value={
                  form.notes
                }
                placeholder="Any additional details..."
                onChange={
                  handleChange
                }
              />
            </div>
          </div>

          <button
            className="primary-btn"
            type="submit"
          >
            {editingId !== null
              ? "Update Stitching"
              : "+ Add Stitching"}
          </button>
        </form>
      </div>

      {/* TABLE */}

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
            value={search}
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
            <div>🧵</div>

            <h3>
              No stitching
              records
            </h3>

            <p>
              Add your first
              stitching record.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>

                  <th>
                    Customer
                  </th>

                  <th>Dress</th>

                  <th>Type</th>

                  <th>Qty</th>

                  <th>
                    Amount
                  </th>

                  <th>
                    Lining
                  </th>

                  <th>Used</th>

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
                        {order.customerName ||
                          "Walk-in Customer"}
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
                                order
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