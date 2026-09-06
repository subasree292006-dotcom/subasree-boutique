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
// GET ALL SALES
// =====================================================

router.get("/", authMiddleware, (req, res) => {
  try {
    const rows = db
      .prepare(`
        SELECT *
        FROM lining_sold
        WHERE user_id = ?
        ORDER BY id DESC
      `)
      .all(req.user.id);

    res.json(rows);

  } catch (error) {
    console.error(
      "GET LINING SALES ERROR:",
      error
    );

    res.status(500).json({
      message:
        "Failed to load lining sales",
    });
  }
});

// =====================================================
// SELL LINING
// =====================================================

router.post("/", authMiddleware, (req, res) => {

  try {

    const {
      stockId,
      liningName,
      colour,
      quantity,
      saleDate,
      customerName,
      notes,
    } = req.body;

    const stockID = Number(
      stockId
    );

    const saleQuantity = Number(
      quantity
    );

    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (
      !Number.isInteger(stockID) ||
      stockID <= 0
    ) {
      return res.status(400).json({
        message:
          "Invalid lining stock",
      });
    }

    if (
      !Number.isFinite(
        saleQuantity
      ) ||
      saleQuantity <= 0
    ) {
      return res.status(400).json({
        message:
          "Invalid sale quantity",
      });
    }

    // -------------------------------------------------
    // FIND STOCK
    // -------------------------------------------------

    const stock = db
      .prepare(`
        SELECT *
        FROM lining_stock
        WHERE id = ?
          AND user_id = ?
      `)
      .get(
        stockID,
        req.user.id
      );

    if (!stock) {
      return res.status(404).json({
        message:
          "Selected lining stock not found",
      });
    }

    // -------------------------------------------------
    // AVAILABLE STOCK
    // -------------------------------------------------

    const availableQuantity =
      Number(
        stock.quantity || 0
      );

    if (
      saleQuantity >
      availableQuantity
    ) {
      return res.status(400).json({
        message:
          `Insufficient stock. Available: ${availableQuantity.toFixed(
            1
          )} m`,
      });
    }

    // -------------------------------------------------
    // REMAINING
    // -------------------------------------------------

    const remainingQuantity =
      Number(
        (
          availableQuantity -
          saleQuantity
        ).toFixed(1)
      );

    // -------------------------------------------------
    // PRICE
    // -------------------------------------------------

    const pricePerMeter =
      Number(
        stock.price_per_meter ||
          0
      );

    const saleAmount =
      Number(
        (
          saleQuantity *
          pricePerMeter
        ).toFixed(2)
      );

    // -------------------------------------------------
    // SALE ID
    // -------------------------------------------------

    const saleId =
      `SALE-${Date.now()}-${Math.floor(
        Math.random() * 1000
      )}`;

    const finalSaleDate =
      getText(saleDate) ||
      new Date()
        .toISOString()
        .split("T")[0];

    const finalCustomerName =
      getText(customerName);

    const finalNotes =
      getText(notes);

    // -------------------------------------------------
    // TRANSACTION
    // -------------------------------------------------

    const transaction =
      db.transaction(() => {

        // Reduce stock
        db.prepare(`
          UPDATE lining_stock
          SET
            quantity = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
            AND user_id = ?
        `).run(
          remainingQuantity,
          stockID,
          req.user.id
        );

        // Insert sale
        const result =
          db.prepare(`
            INSERT INTO lining_sold
            (
              user_id,
              sale_id,
              stock_id,
              date,
              sale_date,
              lining_name,
              color,
              colour,
              quantity,
              price_per_meter,
              amount,
              sale_amount,
              customer_name,
              notes
            )
            VALUES (
              ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            )
          `).run(
            req.user.id,
            saleId,
            stockID,
            finalSaleDate,
            finalSaleDate,
            stock.lining_name,
            stock.color ||
              stock.colour ||
              getText(
                colour
              ),
            stock.colour ||
              stock.color ||
              getText(
                colour
              ),
            saleQuantity,
            pricePerMeter,
            saleAmount,
            saleAmount,
            finalCustomerName,
            finalNotes
          );

        return result;
      });

    const result =
      transaction();

    // -------------------------------------------------
    // GET SALE
    // -------------------------------------------------

    const sale = db
      .prepare(`
        SELECT *
        FROM lining_sold
        WHERE id = ?
          AND user_id = ?
      `)
      .get(
        result.lastInsertRowid,
        req.user.id
      );

    res.status(201).json({
      message:
        "Lining sold successfully",

      sale,

      remainingQuantity,
    });

  } catch (error) {

    console.error(
      "SELL LINING ERROR:",
      error
    );

    res.status(400).json({
      message:
        error.message ||
        "Failed to sell lining",
    });
  }
});

module.exports = router;