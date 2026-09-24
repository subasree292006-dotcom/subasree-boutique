import React, { useEffect, useState } from "react";
import "./LiningStock.css";

// =====================================================
// LOCAL STORAGE KEYS
// =====================================================

const STOCK_KEY = "liningStock";
const SALES_KEY = "liningSales";

// =====================================================
// TODAY
// =====================================================

const getToday = () => {
  return new Date().toISOString().split("T")[0];
};

// =====================================================
// EMPTY FORMS
// =====================================================

const getEmptyStockForm = () => ({
  liningName: "",
  colour: "",
  quantity: "",
  pricePerMeter: "",
  purchaseDate: getToday(),
  notes: "",
});

const getEmptySaleForm = () => ({
  liningName: "",
  colour: "",
  quantity: "",
  saleDate: getToday(),
  customerName: "",
  notes: "",
});

// =====================================================
// SAFE LOCAL STORAGE
// =====================================================

const getLocalData = (key) => {
  try {
    const data = localStorage.getItem(key);

    if (!data) {
      return [];
    }

    const parsed = JSON.parse(data);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(
      `Error reading ${key}:`,
      error
    );

    return [];
  }
};

const saveLocalData = (key, data) => {
  localStorage.setItem(
    key,
    JSON.stringify(data)
  );
};

// =====================================================
// COMPONENT
// =====================================================

function LiningStock() {
  const [stock, setStock] = useState([]);
  const [sales, setSales] = useState([]);

  const [form, setForm] = useState(
    getEmptyStockForm()
  );

  const [saleForm, setSaleForm] = useState(
    getEmptySaleForm()
  );

  const [editingId, setEditingId] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [selling, setSelling] =
    useState(false);

  const [search, setSearch] =
    useState("");

  // =====================================================
  // LOAD DATA
  // =====================================================

  const loadData = () => {
    const stockData =
      getLocalData(STOCK_KEY);

    const salesData =
      getLocalData(SALES_KEY);

    setStock(stockData);
    setSales(salesData);
  };

  // =====================================================
  // PAGE OPEN
  // =====================================================

  useEffect(() => {
    loadData();
  }, []);

  // =====================================================
  // STOCK FORM CHANGE
  // =====================================================

  const handleStockChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // SALE FORM CHANGE
  // =====================================================

  const handleSaleChange = (e) => {
    const { name, value } = e.target;

    setSaleForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // ADD / UPDATE STOCK
  // =====================================================

  const handleStockSubmit = (e) => {
    e.preventDefault();

    const liningName = String(
      form.liningName ?? ""
    ).trim();

    const colour = String(
      form.colour ??
        form.color ??
        ""
    ).trim();

    const quantity = Number(
      form.quantity
    );

    const pricePerMeter = Number(
      form.pricePerMeter || 0
    );

    // =================================================
    // VALIDATION
    // =================================================

    if (liningName === "") {
      alert(
        "Please enter Lining Name"
      );
      return;
    }

    if (colour === "") {
      alert(
        "Please enter Colour"
      );
      return;
    }

    if (
      form.quantity === "" ||
      !Number.isFinite(quantity) ||
      quantity < 0
    ) {
      alert(
        "Please enter valid quantity"
      );
      return;
    }

    if (
      !Number.isFinite(
        pricePerMeter
      ) ||
      pricePerMeter < 0
    ) {
      alert(
        "Please enter valid price"
      );
      return;
    }

    // =================================================
    // STOCK OBJECT
    // =================================================

    const stockItem = {
      id:
        editingId !== null
          ? editingId
          : Date.now(),

      liningName:
        liningName,

      colour:
        colour,

      quantity:
        quantity,

      pricePerMeter:
        pricePerMeter,

      purchaseDate:
        form.purchaseDate ||
        getToday(),

      notes:
        String(
          form.notes || ""
        ).trim(),
    };

    // =================================================
    // UPDATE EXISTING STOCK
    // =================================================

    if (editingId !== null) {
      const updatedStock =
        stock.map((item) =>
          Number(item.id) ===
          Number(editingId)
            ? stockItem
            : item
        );

      saveLocalData(
        STOCK_KEY,
        updatedStock
      );

      setStock(updatedStock);

      alert(
        "Lining stock updated successfully"
      );
    }

    // =================================================
    // ADD NEW STOCK
    // =================================================

    else {
      const updatedStock = [
        ...stock,
        stockItem,
      ];

      saveLocalData(
        STOCK_KEY,
        updatedStock
      );

      setStock(updatedStock);

      alert(
        "Lining stock added successfully"
      );
    }

    // =================================================
    // RESET
    // =================================================

    setForm(
      getEmptyStockForm()
    );

    setEditingId(null);

    // Notify other components
    window.dispatchEvent(
      new Event("liningStockUpdated")
    );
  };

  // =====================================================
  // EDIT STOCK
  // =====================================================

  const handleEdit = (item) => {
    setEditingId(item.id);

    setForm({
      liningName:
        item.lining_name ??
        item.liningName ??
        "",

      colour:
        item.colour ??
        item.color ??
        "",

      quantity:
        item.quantity ??
        "",

      pricePerMeter:
        item.price_per_meter ??
        item.pricePerMeter ??
        "",

      purchaseDate:
        item.purchase_date ??
        item.purchaseDate ??
        getToday(),

      notes:
        item.notes ??
        "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =====================================================
  // CANCEL EDIT
  // =====================================================

  const handleCancelEdit = () => {
    setEditingId(null);

    setForm(
      getEmptyStockForm()
    );
  };

  // =====================================================
  // DELETE STOCK
  // =====================================================

  const handleDelete = (id) => {
    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this lining stock?"
      );

    if (!confirmDelete) {
      return;
    }

    const updatedStock =
      stock.filter(
        (item) =>
          Number(item.id) !==
          Number(id)
      );

    saveLocalData(
      STOCK_KEY,
      updatedStock
    );

    setStock(updatedStock);

    alert(
      "Lining stock deleted successfully"
    );

    window.dispatchEvent(
      new Event("liningStockUpdated")
    );
  };

  // =====================================================
  // SELL LINING
  // =====================================================

  const handleSale = (e) => {
    e.preventDefault();

    const liningName = String(
      saleForm.liningName ?? ""
    ).trim();

    const colour = String(
      saleForm.colour ??
        saleForm.color ??
        ""
    ).trim();

    const quantity = Number(
      saleForm.quantity
    );

    // =================================================
    // VALIDATION
    // =================================================

    if (liningName === "") {
      alert(
        "Please enter Lining Name"
      );
      return;
    }

    if (colour === "") {
      alert(
        "Please enter Colour"
      );
      return;
    }

    if (
      saleForm.quantity === "" ||
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      alert(
        "Please enter valid Sale Quantity"
      );
      return;
    }

    // =================================================
    // FIND STOCK
    // =================================================

    const selectedStock =
      stock.find((item) => {
        const itemName =
          String(
            item.lining_name ??
              item.liningName ??
              ""
          )
            .trim()
            .toLowerCase();

        const itemColour =
          String(
            item.colour ??
              item.color ??
              ""
          )
            .trim()
            .toLowerCase();

        return (
          itemName ===
            liningName.toLowerCase() &&
          itemColour ===
            colour.toLowerCase()
        );
      });

    // =================================================
    // STOCK NOT FOUND
    // =================================================

    if (!selectedStock) {
      alert(
        "Lining stock not found. Please check Lining Name and Colour."
      );

      return;
    }

    // =================================================
    // AVAILABLE QUANTITY
    // =================================================

    const availableQuantity =
      Number(
        selectedStock.quantity || 0
      );

    if (
      quantity >
      availableQuantity
    ) {
      alert(
        `Only ${availableQuantity.toFixed(
          1
        )} meter available`
      );

      return;
    }

    // =================================================
    // PRICE
    // =================================================

    const pricePerMeter =
      Number(
        selectedStock.pricePerMeter ??
          selectedStock.price_per_meter ??
          0
      );

    const saleAmount =
      quantity * pricePerMeter;

    // =================================================
    // UPDATE STOCK
    // =================================================

    const remainingQuantity =
      availableQuantity -
      quantity;

    const updatedStock =
      stock.map((item) => {
        if (
          Number(item.id) ===
          Number(selectedStock.id)
        ) {
          return {
            ...item,

            quantity:
              remainingQuantity,
          };
        }

        return item;
      });

    // =================================================
    // CREATE SALE RECORD
    // =================================================

    const saleRecord = {
      id: Date.now(),

      saleId:
        `SALE-${Date.now()}`,

      saleDate:
        saleForm.saleDate ||
        getToday(),

      liningName:
        liningName,

      colour:
        colour,

      quantity:
        quantity,

      pricePerMeter:
        pricePerMeter,

      saleAmount:
        saleAmount,

      customerName:
        String(
          saleForm.customerName ||
            ""
        ).trim(),

      notes:
        String(
          saleForm.notes ||
            ""
        ).trim(),
    };

    // =================================================
    // SAVE STOCK
    // =================================================

    saveLocalData(
      STOCK_KEY,
      updatedStock
    );

    // =================================================
    // SAVE SALE
    // =================================================

    const updatedSales = [
      ...sales,
      saleRecord,
    ];

    saveLocalData(
      SALES_KEY,
      updatedSales
    );

    // =================================================
    // UPDATE UI
    // =================================================

    setStock(updatedStock);
    setSales(updatedSales);

    alert(
      "Lining sold successfully"
    );

    // =================================================
    // RESET SALE FORM
    // =================================================

    setSaleForm(
      getEmptySaleForm()
    );

    // Notify other components
    window.dispatchEvent(
      new Event("liningStockUpdated")
    );
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    const parsedDate =
      new Date(
        `${date}T00:00:00`
      );

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return date;
    }

    return parsedDate.toLocaleDateString(
      "en-IN"
    );
  };

  // =====================================================
  // FILTER STOCK
  // =====================================================

  const filteredStock =
    stock.filter((item) => {
      const name =
        String(
          item.lining_name ??
            item.liningName ??
            ""
        ).toLowerCase();

      const colour =
        String(
          item.colour ??
            item.color ??
            ""
        ).toLowerCase();

      const searchText =
        search
          .toLowerCase()
          .trim();

      return (
        name.includes(
          searchText
        ) ||
        colour.includes(
          searchText
        )
      );
    });

  // =====================================================
  // TOTAL STOCK
  // =====================================================

  const totalStock =
    stock.reduce(
      (total, item) => {
        return (
          total +
          Number(
            item.quantity || 0
          )
        );
      },
      0
    );

  // =====================================================
  // TOTAL SOLD
  // =====================================================

  const totalSold =
    sales.reduce(
      (total, item) => {
        return (
          total +
          Number(
            item.quantity || 0
          )
        );
      },
      0
    );

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="lining-page">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="page-heading">

        <div>

          <h1>
            Lining Stock
          </h1>

          <p>
            Manage your lining
            stock and sales
          </p>

        </div>

      </div>

      {/* =================================================
          STATS
      ================================================= */}

      <div className="page-stats">

        <div className="stat-card">

          <span>
            Total Stock
          </span>

          <strong>
            {totalStock.toFixed(1)} m
          </strong>

        </div>

        <div className="stat-card">

          <span>
            Total Sold
          </span>

          <strong>
            {totalSold.toFixed(1)} m
          </strong>

        </div>

        <div className="stat-card">

          <span>
            Stock Items
          </span>

          <strong>
            {stock.length}
          </strong>

        </div>

        <div className="stat-card">

          <span>
            Sales
          </span>

          <strong>
            {sales.length}
          </strong>

        </div>

      </div>

      {/* =================================================
          ADD / UPDATE STOCK
      ================================================= */}

      <div className="form-card">

        <h2>
          {editingId !== null
            ? "Update Lining Stock"
            : "Add Lining Stock"}
        </h2>

        <form
          onSubmit={
            handleStockSubmit
          }
        >

          <div className="form-grid">

            {/* NAME */}

            <div className="input-group">

              <label>
                Lining Name *
              </label>

              <input
                type="text"
                name="liningName"
                value={
                  form.liningName ||
                  ""
                }
                onChange={
                  handleStockChange
                }
                placeholder="Enter lining name"
                autoComplete="off"
              />

            </div>

            {/* COLOUR */}

            <div className="input-group">

              <label>
                Colour *
              </label>

              <input
                type="text"
                name="colour"
                value={
                  form.colour ||
                  ""
                }
                onChange={
                  handleStockChange
                }
                placeholder="Enter colour"
                autoComplete="off"
              />

            </div>

            {/* QUANTITY */}

            <div className="input-group">

              <label>
                Quantity (Meter) *
              </label>

              <input
                type="number"
                name="quantity"
                value={
                  form.quantity
                }
                onChange={
                  handleStockChange
                }
                placeholder="10"
                min="0"
                step="0.1"
              />

            </div>

            {/* PRICE */}

            <div className="input-group">

              <label>
                Price / Meter
              </label>

              <input
                type="number"
                name="pricePerMeter"
                value={
                  form.pricePerMeter
                }
                onChange={
                  handleStockChange
                }
                placeholder="35"
                min="0"
                step="0.01"
              />

            </div>

            {/* PURCHASE DATE */}

            <div className="input-group">

              <label>
                Purchase Date
              </label>

              <input
                type="date"
                name="purchaseDate"
                value={
                  form.purchaseDate
                }
                onChange={
                  handleStockChange
                }
              />

            </div>

            {/* NOTES */}

            <div className="input-group">

              <label>
                Notes
              </label>

              <input
                type="text"
                name="notes"
                value={
                  form.notes
                }
                onChange={
                  handleStockChange
                }
                placeholder="Optional notes"
              />

            </div>

          </div>

          <div className="button-row">

            <button
              type="submit"
              className="primary-btn"
              disabled={loading}
            >

              {loading
                ? "Saving..."
                : editingId !== null
                ? "Update Stock"
                : "Add Stock"}

            </button>

            {editingId !== null && (

              <button
                type="button"
                className="cancel-btn"
                onClick={
                  handleCancelEdit
                }
              >
                Cancel
              </button>

            )}

          </div>

        </form>

      </div>

      {/* =================================================
          SELL LINING
      ================================================= */}

      <div className="form-card">

        <h2>
          Sell Lining
        </h2>

        <form
          onSubmit={handleSale}
        >

          <div className="form-grid">

            {/* SALE NAME */}

            <div className="input-group">

              <label>
                Lining Name *
              </label>

              <input
                type="text"
                name="liningName"
                value={
                  saleForm.liningName ||
                  ""
                }
                onChange={
                  handleSaleChange
                }
                placeholder="Enter lining name"
                list="lining-name-list"
                autoComplete="off"
              />

              <datalist
                id="lining-name-list"
              >

                {stock.map(
                  (item) => (

                    <option
                      key={
                        item.id
                      }
                      value={
                        item.lining_name ??
                        item.liningName ??
                        ""
                      }
                    />

                  )
                )}

              </datalist>

            </div>

            {/* SALE COLOUR */}

            <div className="input-group">

              <label>
                Colour *
              </label>

              <input
                type="text"
                name="colour"
                value={
                  saleForm.colour ||
                  ""
                }
                onChange={
                  handleSaleChange
                }
                placeholder="Enter colour"
                list="lining-colour-list"
                autoComplete="off"
              />

              <datalist
                id="lining-colour-list"
              >

                {stock.map(
                  (item) => (

                    <option
                      key={
                        `colour-${item.id}`
                      }
                      value={
                        item.colour ??
                        item.color ??
                        ""
                      }
                    />

                  )
                )}

              </datalist>

            </div>

            {/* SALE QUANTITY */}

            <div className="input-group">

              <label>
                Sale Quantity (Meter) *
              </label>

              <input
                type="number"
                name="quantity"
                value={
                  saleForm.quantity
                }
                onChange={
                  handleSaleChange
                }
                placeholder="1"
                min="0.1"
                step="0.1"
              />

            </div>

            {/* SALE DATE */}

            <div className="input-group">

              <label>
                Sale Date
              </label>

              <input
                type="date"
                name="saleDate"
                value={
                  saleForm.saleDate
                }
                onChange={
                  handleSaleChange
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
                value={
                  saleForm.customerName
                }
                onChange={
                  handleSaleChange
                }
                placeholder="Customer name"
              />

            </div>

            {/* NOTES */}

            <div className="input-group">

              <label>
                Notes
              </label>

              <input
                type="text"
                name="notes"
                value={
                  saleForm.notes
                }
                onChange={
                  handleSaleChange
                }
                placeholder="Optional notes"
              />

            </div>

          </div>

          <button
            type="submit"
            className="primary-btn full-btn"
            disabled={selling}
          >

            {selling
              ? "Selling..."
              : "Sell Lining"}

          </button>

        </form>

      </div>

      {/* =================================================
          STOCK LIST
      ================================================= */}

      <div className="table-card">

        <div className="table-header">

          <div>

            <h2>
              Lining Stock List
            </h2>

            <p>
              {filteredStock.length}{" "}
              item
              {filteredStock.length !==
              1
                ? "s"
                : ""}{" "}
              found
            </p>

          </div>

          <input
            type="text"
            className="search-input"
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="🔍 Search lining, colour..."
          />

        </div>

        {filteredStock.length ===
        0 ? (

          <div className="empty-text">

            {search
              ? "No matching lining found."
              : "No lining stock found."}

          </div>

        ) : (

          <div className="table-wrapper">

            <table>

              <thead>

                <tr>

                  <th>
                    Lining Name
                  </th>

                  <th>
                    Colour
                  </th>

                  <th>
                    Quantity
                  </th>

                  <th>
                    Price / Meter
                  </th>

                  <th>
                    Purchase Date
                  </th>

                  <th>
                    Notes
                  </th>

                  <th>
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredStock.map(
                  (item) => {

                    const quantity =
                      Number(
                        item.quantity ||
                          0
                      );

                    return (

                      <tr
                        key={
                          item.id
                        }
                      >

                        <td>
                          {item.lining_name ??
                            item.liningName ??
                            "-"}
                        </td>

                        <td>
                          {item.colour ??
                            item.color ??
                            "-"}
                        </td>

                        <td>

                          <span
                            className={
                              quantity <= 0
                                ? "stock-status out"
                                : quantity <= 2
                                ? "stock-status low"
                                : "stock-status"
                            }
                          >

                            {quantity.toFixed(
                              1
                            )}{" "}
                            m

                          </span>

                        </td>

                        <td>

                          ₹
                          {Number(
                            item.price_per_meter ??
                              item.pricePerMeter ??
                              0
                          ).toFixed(2)}

                        </td>

                        <td>

                          {formatDate(
                            item.purchase_date ??
                              item.purchaseDate
                          )}

                        </td>

                        <td>

                          {item.notes ||
                            "-"}

                        </td>

                        <td>

                          <div className="action-buttons">

                            <button
                              type="button"
                              onClick={() =>
                                handleEdit(
                                  item
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  item.id
                                )
                              }
                            >
                              Delete
                            </button>

                          </div>

                        </td>

                      </tr>

                    );

                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* =================================================
          SOLD HISTORY
      ================================================= */}

      <div className="table-card">

        <div className="table-header">

          <div>

            <h2>
              Lining Sold History
            </h2>

            <p>

              {sales.length} sale
              {sales.length !==
              1
                ? "s"
                : ""}

            </p>

          </div>

        </div>

        {sales.length === 0 ? (

          <div className="empty-text">
            No lining sales found.
          </div>

        ) : (

          <div className="table-wrapper">

            <table>

              <thead>

                <tr>

                  <th>
                    Sale ID
                  </th>

                  <th>
                    Date
                  </th>

                  <th>
                    Lining Name
                  </th>

                  <th>
                    Colour
                  </th>

                  <th>
                    Quantity
                  </th>

                  <th>
                    Price / Meter
                  </th>

                  <th>
                    Amount
                  </th>

                  <th>
                    Customer
                  </th>

                  <th>
                    Notes
                  </th>

                </tr>

              </thead>

              <tbody>

                {sales.map(
                  (sale) => {

                    const saleName =
                      sale.lining_name ??
                      sale.liningName ??
                      "-";

                    const saleColour =
                      sale.colour ??
                      sale.color ??
                      "-";

                    const salePrice =
                      Number(
                        sale.price_per_meter ??
                          sale.pricePerMeter ??
                          0
                      );

                    const saleAmount =
                      Number(
                        sale.sale_amount ??
                          sale.saleAmount ??
                          sale.amount ??
                          0
                      );

                    const customer =
                      sale.customer_name ??
                      sale.customerName ??
                      "-";

                    return (

                      <tr
                        key={
                          sale.id
                        }
                      >

                        <td>

                          {sale.sale_id ??
                            sale.saleId ??
                            "-"}

                        </td>

                        <td>

                          {formatDate(
                            sale.sale_date ??
                              sale.saleDate ??
                              sale.date
                          )}

                        </td>

                        <td>
                          {saleName}
                        </td>

                        <td>
                          {saleColour}
                        </td>

                        <td>

                          {Number(
                            sale.quantity ||
                              0
                          ).toFixed(
                            1
                          )}{" "}
                          m

                        </td>

                        <td>

                          ₹
                          {salePrice.toFixed(
                            2
                          )}

                        </td>

                        <td>

                          ₹
                          {saleAmount.toFixed(
                            2
                          )}

                        </td>

                        <td>

                          {customer}

                        </td>

                        <td>

                          {sale.notes ||
                            "-"}

                        </td>

                      </tr>

                    );

                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
}

export default LiningStock;