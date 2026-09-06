import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api";

function LiningSold() {
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
    saleDate: getToday(),
    liningName: "",
    colour: "",
    quantity: "",
    pricePerMeter: "",
    customerName: "",
    notes: "",
  };

  // ==========================================
  // STATES
  // ==========================================

  const [stock, setStock] = useState([]);
  const [sales, setSales] = useState([]);

  const [form, setForm] = useState(emptyForm);

  const [search, setSearch] = useState("");

  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  // ==========================================
  // TOKEN
  // ==========================================

  const getToken = () => {
    return localStorage.getItem("token");
  };

  // ==========================================
  // LOAD STOCK + SALES
  // ==========================================

  const loadData = async () => {
    try {
      setLoading(true);

      const token = getToken();

      if (!token) {
        alert("Please login again.");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [stockResponse, salesResponse] =
        await Promise.all([
          fetch(`${API_URL}/lining-stock`, {
            headers,
          }),

          fetch(`${API_URL}/lining-sales`, {
            headers,
          }),
        ]);

      if (
        stockResponse.status === 401 ||
        salesResponse.status === 401
      ) {
        localStorage.removeItem("token");
        localStorage.removeItem("currentUser");

        alert("Session expired. Please login again.");

        return;
      }

      const stockData =
        await stockResponse.json();

      const salesData =
        await salesResponse.json();

      if (!stockResponse.ok) {
        throw new Error(
          stockData.message ||
            "Failed to load stock"
        );
      }

      if (!salesResponse.ok) {
        throw new Error(
          salesData.message ||
            "Failed to load sales"
        );
      }

      setStock(
        Array.isArray(stockData)
          ? stockData
          : []
      );

      setSales(
        Array.isArray(salesData)
          ? salesData
          : []
      );
    } catch (error) {
      console.error(
        "Load lining data error:",
        error
      );

      alert(
        error.message ||
          "Failed to load lining data"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOAD WHEN PAGE OPENS
  // ==========================================

  useEffect(() => {
    loadData();
  }, []);

  // ==========================================
  // FORM CHANGE
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  };

  // ==========================================
  // RESET FORM
  // ==========================================

  const resetForm = () => {
    setEditingId(null);

    setForm({
      ...emptyForm,
      saleDate: getToday(),
    });
  };

  // ==========================================
  // SUBMIT
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.liningName.trim() ||
      !form.colour.trim() ||
      form.quantity === ""
    ) {
      alert(
        "Please enter Lining Name, Colour and Quantity"
      );

      return;
    }

    const saleQuantity =
      Number(form.quantity);

    if (saleQuantity <= 0) {
      alert(
        "Sale quantity must be greater than 0"
      );

      return;
    }

    const salePrice =
      Number(form.pricePerMeter || 0);

    try {
      setSaving(true);

      const token = getToken();

      const payload = {
        sale_date: form.saleDate,

        lining_name:
          form.liningName.trim(),

        colour:
          form.colour.trim(),

        quantity:
          saleQuantity,

        price_per_meter:
          salePrice,

        customer_name:
          form.customerName.trim(),

        notes:
          form.notes.trim(),
      };

      const url =
        editingId !== null
          ? `${API_URL}/lining-sales/${editingId}`
          : `${API_URL}/lining-sales`;

      const method =
        editingId !== null
          ? "PUT"
          : "POST";

      const response = await fetch(url, {
        method,

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify(payload),
      });

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to save sale"
        );
      }

      await loadData();

      resetForm();

      if (editingId !== null) {
        alert(
          "Sale updated successfully!\nStock adjusted successfully."
        );
      } else {
        alert(
          `Sale added successfully!\n${saleQuantity}m reduced from stock.`
        );
      }
    } catch (error) {
      console.error(
        "Save sale error:",
        error
      );

      alert(
        error.message ||
          "Failed to save sale"
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // EDIT
  // ==========================================

  const handleEdit = (sale) => {
    setForm({
      saleDate:
        sale.saleDate ||
        getToday(),

      liningName:
        sale.liningName || "",

      colour:
        sale.colour || "",

      quantity:
        sale.quantity ?? "",

      pricePerMeter:
        sale.pricePerMeter ?? "",

      customerName:
        sale.customerName || "",

      notes:
        sale.notes || "",
    });

    setEditingId(sale.id);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==========================================
  // DELETE
  // ==========================================

  const handleDelete = async (id) => {
    const saleToDelete =
      sales.find(
        (sale) => sale.id === id
      );

    if (!saleToDelete) {
      alert("Sale record not found");
      return;
    }

    const confirmDelete =
      window.confirm(
        `Delete this sale?\n\n${Number(
          saleToDelete.quantity || 0
        ).toFixed(
          1
        )}m will be returned to Lining Stock.`
      );

    if (!confirmDelete) {
      return;
    }

    try {
      setSaving(true);

      const token = getToken();

      const response = await fetch(
        `${API_URL}/lining-sales/${id}`,
        {
          method: "DELETE",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete sale"
        );
      }

      await loadData();

      if (editingId === id) {
        resetForm();
      }

      alert(
        `Sale deleted successfully!\n${Number(
          saleToDelete.quantity || 0
        ).toFixed(
          1
        )}m returned to Lining Stock.`
      );
    } catch (error) {
      console.error(
        "Delete sale error:",
        error
      );

      alert(
        error.message ||
          "Failed to delete sale"
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // SEARCH
  // ==========================================

  const filteredSales =
    sales.filter((sale) => {
      const text =
        search
          .toLowerCase()
          .trim();

      return (
        String(
          sale.liningName || ""
        )
          .toLowerCase()
          .includes(text) ||

        String(
          sale.colour || ""
        )
          .toLowerCase()
          .includes(text) ||

        String(
          sale.customerName || ""
        )
          .toLowerCase()
          .includes(text) ||

        String(
          sale.saleDate || ""
        )
          .toLowerCase()
          .includes(text)
      );
    });

  // ==========================================
  // TOTAL SOLD
  // ==========================================

  const totalSold =
    sales.reduce(
      (total, sale) =>
        total +
        Number(
          sale.quantity || 0
        ),
      0
    );

  // ==========================================
  // TOTAL SALES
  // ==========================================

  const totalSalesAmount =
    sales.reduce(
      (total, sale) =>
        total +
        Number(
          sale.totalAmount ||
            Number(
              sale.quantity || 0
            ) *
              Number(
                sale.pricePerMeter || 0
              )
        ),
      0
    );

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="page-content">

      {/* HEADER */}

      <div className="page-heading">

        <div>
          <h2>🛒 Lining Sold</h2>

          <p>
            Manage lining sales
          </p>
        </div>

        <div className="page-stats">

          <div>
            <span>Total Sold</span>

            <strong>
              {totalSold.toFixed(1)} m
            </strong>
          </div>

          <div>
            <span>Total Sales</span>

            <strong>
              ₹
              {totalSalesAmount.toFixed(0)}
            </strong>
          </div>

          <div>
            <span>Sales Records</span>

            <strong>
              {sales.length}
            </strong>
          </div>

        </div>

      </div>

      {/* FORM */}

      <div className="form-card">

        <div className="form-title">

          <h3>
            {editingId !== null
              ? "✏️ Edit Lining Sale"
              : "➕ Add Lining Sale"}
          </h3>

          {editingId !== null && (
            <button
              type="button"
              className="cancel-btn"
              onClick={resetForm}
              disabled={saving}
            >
              Cancel
            </button>
          )}

        </div>

        <form
          onSubmit={handleSubmit}
        >

          <div className="form-grid">

            {/* DATE */}

            <div className="input-group">

              <label>
                Sale Date
              </label>

              <input
                type="date"
                name="saleDate"
                value={
                  form.saleDate
                }
                onChange={
                  handleChange
                }
              />

            </div>

            {/* LINING NAME */}

            <div className="input-group">

              <label>
                Lining Name *
              </label>

              <input
                type="text"
                name="liningName"
                placeholder="Example: Soft Lining"
                value={
                  form.liningName
                }
                onChange={
                  handleChange
                }
                required
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
                placeholder="Example: Black"
                value={
                  form.colour
                }
                onChange={
                  handleChange
                }
                required
              />

            </div>

            {/* QUANTITY */}

            <div className="input-group">

              <label>
                Sold Quantity (Meter) *
              </label>

              <input
                type="number"
                name="quantity"
                placeholder="Example: 2.5"
                min="0.1"
                step="0.1"
                value={
                  form.quantity
                }
                onChange={
                  handleChange
                }
                required
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
                placeholder="₹ Price"
                min="0"
                step="0.01"
                value={
                  form.pricePerMeter
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

            {/* NOTES */}

            <div className="input-group full-width">

              <label>
                Notes
              </label>

              <input
                type="text"
                name="notes"
                placeholder="Optional notes"
                value={
                  form.notes
                }
                onChange={
                  handleChange
                }
              />

            </div>

          </div>

          <button
            className="primary-btn"
            type="submit"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : editingId !== null
              ? "Update Sale"
              : "+ Add Sale"}
          </button>

        </form>

      </div>

      {/* TABLE */}

      <div className="table-card">

        <div className="table-header">

          <div>

            <h3>
              Lining Sales Records
            </h3>

            <p>
              {filteredSales.length}{" "}
              records found
            </p>

          </div>

          <input
            className="search-input"
            type="text"
            placeholder="🔍 Search sales..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

        </div>

        {loading ? (

          <div className="empty-state">
            <div>⏳</div>

            <h3>
              Loading sales...
            </h3>
          </div>

        ) : filteredSales.length === 0 ? (

          <div className="empty-state">

            <div>🛒</div>

            <h3>
              No lining sales
            </h3>

            <p>
              Add your first lining
              sale above.
            </p>

          </div>

        ) : (

          <div className="table-wrapper">

            <table>

              <thead>

                <tr>

                  <th>Date</th>

                  <th>Lining</th>

                  <th>Colour</th>

                  <th>Quantity</th>

                  <th>Price / Meter</th>

                  <th>Total</th>

                  <th>Customer</th>

                  <th>Action</th>

                </tr>

              </thead>

              <tbody>

                {filteredSales.map(
                  (sale) => {

                    const total =
                      Number(
                        sale.quantity || 0
                      ) *
                      Number(
                        sale.pricePerMeter ||
                          0
                      );

                    return (
                      <tr
                        key={
                          sale.id
                        }
                      >

                        <td>
                          {
                            sale.saleDate
                          }
                        </td>

                        <td>
                          <strong>
                            {
                              sale.liningName
                            }
                          </strong>
                        </td>

                        <td>
                          {
                            sale.colour
                          }
                        </td>

                        <td>
                          <strong>
                            {Number(
                              sale.quantity ||
                                0
                            ).toFixed(
                              1
                            )}{" "}
                            m
                          </strong>
                        </td>

                        <td className="amount">
                          ₹
                          {Number(
                            sale.pricePerMeter ||
                              0
                          ).toFixed(
                            2
                          )}
                        </td>

                        <td className="amount">
                          ₹
                          {total.toFixed(
                            2
                          )}
                        </td>

                        <td>
                          {
                            sale.customerName ||
                              "Walk-in Customer"
                          }
                        </td>

                        <td>

                          <div className="action-buttons">

                            <button
                              type="button"
                              className="edit-btn"
                              onClick={() =>
                                handleEdit(
                                  sale
                                )
                              }
                              disabled={
                                saving
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="delete-btn"
                              onClick={() =>
                                handleDelete(
                                  sale.id
                                )
                              }
                              disabled={
                                saving
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

    </div>
  );
}

export default LiningSold;