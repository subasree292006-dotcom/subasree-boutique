const express = require("express");
const db = require("./database");
const authMiddleware = require("./authMiddleware");

const router = express.Router();

// ==========================================
// GET ALL ORDERS
// ==========================================

router.get("/", authMiddleware, (req, res) => {
  try {
    const orders = db
      .prepare(`
        SELECT *
        FROM tailor_orders
        WHERE user_id = ?
        ORDER BY id DESC
      `)
      .all(req.user.id);

    res.json(orders);

  } catch (error) {
    console.error("Get orders error:", error);

    res.status(500).json({
      message: "Failed to load orders",
    });
  }
});


// ==========================================
// ADD ORDER
// ==========================================

router.post("/", authMiddleware, (req, res) => {
  try {
    const {
      order_id,
      date,
      customer_name,
      dress_name,
      dress_type,
      quantity,
      stitching_amount,
      lining_name,
      lining_color,
      lining_used,
      status,
      notes,
      completed_date,
    } = req.body;

    // ========================================
    // DRESS NAME VALIDATION
    // ========================================

    if (
      !dress_name ||
      !String(dress_name).trim()
    ) {
      return res.status(400).json({
        message: "Dress name is required",
      });
    }

    // ========================================
    // ORDER ID
    // ========================================

    const generatedOrderId =
      order_id ||
      `ORD-${Date.now()}`;

    // ========================================
    // INSERT
    // ========================================

    const result = db
      .prepare(`
        INSERT INTO tailor_orders (
          user_id,
          order_id,
          date,
          customer_name,
          dress_name,
          dress_type,
          quantity,
          stitching_amount,
          lining_name,
          lining_color,
          lining_used,
          status,
          notes,
          completed_date
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        req.user.id,

        generatedOrderId,

        date || "",

        customer_name || "",

        String(dress_name).trim(),

        dress_type || "Blouse",

        Number(quantity || 1),

        Number(stitching_amount || 0),

        lining_name || "",

        lining_color || "",

        Number(lining_used || 0),

        status || "Given to Tailor",

        notes || "",

        completed_date || null
      );

    // ========================================
    // GET SAVED ORDER
    // ========================================

    const order = db
      .prepare(`
        SELECT *
        FROM tailor_orders
        WHERE id = ?
        AND user_id = ?
      `)
      .get(
        result.lastInsertRowid,
        req.user.id
      );

    // ========================================
    // RESPONSE
    // ========================================

    res.status(201).json({
      message: "Order saved successfully",

      id: order.id,

      order_id: order.order_id,

      order,
    });

  } catch (error) {
    console.error(
      "Add order error:",
      error
    );

    res.status(500).json({
      message: "Failed to save order",
      error: error.message,
    });
  }
});


// ==========================================
// UPDATE ORDER
// ==========================================

router.put("/:id", authMiddleware, (req, res) => {
  try {
    const {
      order_id,
      date,
      customer_name,
      dress_name,
      dress_type,
      quantity,
      stitching_amount,
      lining_name,
      lining_color,
      lining_used,
      status,
      notes,
      completed_date,
    } = req.body;

    // ========================================
    // DRESS NAME VALIDATION
    // ========================================

    if (
      !dress_name ||
      !String(dress_name).trim()
    ) {
      return res.status(400).json({
        message: "Dress name is required",
      });
    }

    // ========================================
    // CHECK ORDER
    // ========================================

    const existingOrder = db
      .prepare(`
        SELECT *
        FROM tailor_orders
        WHERE id = ?
        AND user_id = ?
      `)
      .get(
        req.params.id,
        req.user.id
      );

    if (!existingOrder) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // ========================================
    // UPDATE
    // ========================================

    db.prepare(`
      UPDATE tailor_orders

      SET
        order_id = ?,
        date = ?,
        customer_name = ?,
        dress_name = ?,
        dress_type = ?,
        quantity = ?,
        stitching_amount = ?,
        lining_name = ?,
        lining_color = ?,
        lining_used = ?,
        status = ?,
        notes = ?,
        completed_date = ?,
        updated_at = CURRENT_TIMESTAMP

      WHERE id = ?
      AND user_id = ?
    `).run(
      order_id ||
        existingOrder.order_id,

      date || "",

      customer_name || "",

      String(dress_name).trim(),

      dress_type || "Blouse",

      Number(quantity || 1),

      Number(stitching_amount || 0),

      lining_name || "",

      lining_color || "",

      Number(lining_used || 0),

      status || "Given to Tailor",

      notes || "",

      completed_date || null,

      req.params.id,

      req.user.id
    );

    // ========================================
    // GET UPDATED ORDER
    // ========================================

    const updatedOrder = db
      .prepare(`
        SELECT *
        FROM tailor_orders
        WHERE id = ?
        AND user_id = ?
      `)
      .get(
        req.params.id,
        req.user.id
      );

    res.json({
      message: "Order updated successfully",
      order: updatedOrder,
    });

  } catch (error) {
    console.error(
      "Update order error:",
      error
    );

    res.status(500).json({
      message: "Failed to update order",
      error: error.message,
    });
  }
});


// ==========================================
// DELETE ORDER
// ==========================================

router.delete("/:id", authMiddleware, (req, res) => {
  try {
    const result = db
      .prepare(`
        DELETE FROM tailor_orders
        WHERE id = ?
        AND user_id = ?
      `)
      .run(
        req.params.id,
        req.user.id
      );

    if (result.changes === 0) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    res.json({
      message:
        "Order deleted successfully",
    });

  } catch (error) {
    console.error(
      "Delete order error:",
      error
    );

    res.status(500).json({
      message: "Failed to delete order",
      error: error.message,
    });
  }
});


module.exports = router;