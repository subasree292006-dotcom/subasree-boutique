const express = require("express");
const router = express.Router();

const db = require("./database");
const authMiddleware = require("./authMiddleware");

// =====================================================
// HELPER
// =====================================================

const getText = (value) => {
  return String(value ?? "").trim();
};

const getNumber = (value, defaultValue = 0) => {
  const number = Number(value);
  return Number.isFinite(number)
    ? number
    : defaultValue;
};

// =====================================================
// GET ALL LINING STOCK
// =====================================================

router.get("/", authMiddleware, (req, res) => {
  try {
    const rows = db
      .prepare(`
        SELECT *
        FROM lining_stock
        WHERE user_id = ?
        ORDER BY id DESC
      `)
      .all(req.user.id);

    res.json(rows);
  } catch (error) {
    console.error(
      "GET LINING STOCK ERROR:",
      error
    );

    res.status(500).json({
      message:
        "Failed to load lining stock",
    });
  }
});

// =====================================================
// ADD LINING STOCK
// =====================================================

router.post("/", authMiddleware, (req, res) => {
  try {
    const liningName = getText(
      req.body.liningName ??
      req.body.lining_name
    );

    const colour = getText(
      req.body.colour ??
      req.body.color ??
      req.body.lining_color
    );

    const quantity = getNumber(
      req.body.quantity,
      NaN
    );

    const pricePerMeter = getNumber(
      req.body.pricePerMeter ??
      req.body.price_per_meter,
      0
    );

    const purchaseDate =
      getText(
        req.body.purchaseDate ??
        req.body.purchase_date
      ) ||
      new Date()
        .toISOString()
        .split("T")[0];

    const notes = getText(
      req.body.notes
    );

    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (!liningName) {
      return res.status(400).json({
        message:
          "Please enter Lining Name",
      });
    }

    if (!colour) {
      return res.status(400).json({
        message:
          "Please enter Colour",
      });
    }

    if (
      !Number.isFinite(quantity) ||
      quantity < 0
    ) {
      return res.status(400).json({
        message:
          "Please enter valid quantity",
      });
    }

    if (
      !Number.isFinite(pricePerMeter) ||
      pricePerMeter < 0
    ) {
      return res.status(400).json({
        message:
          "Please enter valid price",
      });
    }

    // -------------------------------------------------
    // STOCK ID
    // -------------------------------------------------

    const stockId =
      `STK-${Date.now()}-${Math.floor(
        Math.random() * 1000
      )}`;

    // -------------------------------------------------
    // INSERT
    // -------------------------------------------------

    const result = db
      .prepare(`
        INSERT INTO lining_stock
        (
          user_id,
          stock_id,
          lining_name,
          color,
          colour,
          quantity,
          price_per_meter,
          purchase_date,
          notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        req.user.id,
        stockId,
        liningName,
        colour,
        colour,
        quantity,
        pricePerMeter,
        purchaseDate,
        notes
      );

    // -------------------------------------------------
    // GET CREATED STOCK
    // -------------------------------------------------

    const newStock = db
      .prepare(`
        SELECT *
        FROM lining_stock
        WHERE id = ?
          AND user_id = ?
      `)
      .get(
        result.lastInsertRowid,
        req.user.id
      );

    res.status(201).json(
      newStock
    );

  } catch (error) {
    console.error(
      "ADD LINING STOCK ERROR:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Failed to add lining stock",
    });
  }
});

// =====================================================
// UPDATE LINING STOCK
// =====================================================

router.put("/:id", authMiddleware, (req, res) => {
  try {
    const id = Number(
      req.params.id
    );

    const liningName = getText(
      req.body.liningName ??
      req.body.lining_name
    );

    const colour = getText(
      req.body.colour ??
      req.body.color ??
      req.body.lining_color
    );

    const quantity = getNumber(
      req.body.quantity,
      NaN
    );

    const pricePerMeter = getNumber(
      req.body.pricePerMeter ??
      req.body.price_per_meter,
      0
    );

    const purchaseDate =
      getText(
        req.body.purchaseDate ??
        req.body.purchase_date
      ) || null;

    const notes = getText(
      req.body.notes
    );

    // -------------------------------------------------
    // VALIDATE ID
    // -------------------------------------------------

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return res.status(400).json({
        message:
          "Invalid stock ID",
      });
    }

    // -------------------------------------------------
    // VALIDATE NAME
    // -------------------------------------------------

    if (!liningName) {
      return res.status(400).json({
        message:
          "Please enter Lining Name",
      });
    }

    // -------------------------------------------------
    // VALIDATE COLOUR
    // -------------------------------------------------

    if (!colour) {
      return res.status(400).json({
        message:
          "Please enter Colour",
      });
    }

    // -------------------------------------------------
    // VALIDATE QUANTITY
    // -------------------------------------------------

    if (
      !Number.isFinite(quantity) ||
      quantity < 0
    ) {
      return res.status(400).json({
        message:
          "Please enter valid quantity",
      });
    }

    // -------------------------------------------------
    // VALIDATE PRICE
    // -------------------------------------------------

    if (
      !Number.isFinite(pricePerMeter) ||
      pricePerMeter < 0
    ) {
      return res.status(400).json({
        message:
          "Please enter valid price",
      });
    }

    // -------------------------------------------------
    // CHECK STOCK EXISTS
    // -------------------------------------------------

    const existing = db
      .prepare(`
        SELECT *
        FROM lining_stock
        WHERE id = ?
          AND user_id = ?
      `)
      .get(
        id,
        req.user.id
      );

    if (!existing) {
      return res.status(404).json({
        message:
          "Lining stock not found",
      });
    }

    // -------------------------------------------------
    // UPDATE
    // -------------------------------------------------

    db.prepare(`
      UPDATE lining_stock
      SET
        lining_name = ?,
        color = ?,
        colour = ?,
        quantity = ?,
        price_per_meter = ?,
        purchase_date = ?,
        notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND user_id = ?
    `).run(
      liningName,
      colour,
      colour,
      quantity,
      pricePerMeter,
      purchaseDate,
      notes,
      id,
      req.user.id
    );

    // -------------------------------------------------
    // GET UPDATED STOCK
    // -------------------------------------------------

    const updatedStock = db
      .prepare(`
        SELECT *
        FROM lining_stock
        WHERE id = ?
          AND user_id = ?
      `)
      .get(
        id,
        req.user.id
      );

    res.json(
      updatedStock
    );

  } catch (error) {
    console.error(
      "UPDATE LINING STOCK ERROR:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Failed to update lining stock",
    });
  }
});

// =====================================================
// DELETE LINING STOCK
// =====================================================

router.delete("/:id", authMiddleware, (req, res) => {
  try {
    const id = Number(
      req.params.id
    );

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return res.status(400).json({
        message:
          "Invalid stock ID",
      });
    }

    const existing = db
      .prepare(`
        SELECT *
        FROM lining_stock
        WHERE id = ?
          AND user_id = ?
      `)
      .get(
        id,
        req.user.id
      );

    if (!existing) {
      return res.status(404).json({
        message:
          "Lining stock not found",
      });
    }

    db.prepare(`
      DELETE FROM lining_stock
      WHERE id = ?
        AND user_id = ?
    `).run(
      id,
      req.user.id
    );

    res.json({
      message:
        "Lining stock deleted successfully",
    });

  } catch (error) {
    console.error(
      "DELETE LINING STOCK ERROR:",
      error
    );

    res.status(500).json({
      message:
        "Failed to delete lining stock",
    });
  }
});

module.exports = router;