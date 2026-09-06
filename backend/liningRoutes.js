const express = require("express");
const db = require("./database");
const authMiddleware = require("./authMiddleware");

const router = express.Router();

/* =========================================================
   GET LINING STOCK
   GET /api/lining-stock
========================================================= */

router.get("/lining-stock", authMiddleware, (req, res) => {
  try {
    const stock = db
      .prepare(`
        SELECT *
        FROM lining_stock
        WHERE user_id = ?
        ORDER BY id DESC
      `)
      .all(req.user.id);

    res.json(stock);
  } catch (error) {
    console.error("Get lining stock error:", error);

    res.status(500).json({
      message: "Failed to load lining stock",
    });
  }
});

/* =========================================================
   ADD LINING STOCK
   POST /api/lining-stock
========================================================= */

router.post("/lining-stock", authMiddleware, (req, res) => {
  try {
    const {
      stock_id,
      lining_name,
      color,
      quantity,
      price_per_meter,
      purchase_date,
      notes,
    } = req.body;

    if (!lining_name || !color) {
      return res.status(400).json({
        message: "Lining name and colour are required",
      });
    }

    const qty = Number(quantity || 0);
    const price = Number(price_per_meter || 0);

    if (qty <= 0) {
      return res.status(400).json({
        message: "Quantity must be greater than 0",
      });
    }

    const generatedStockId =
      stock_id || `STK-${Date.now()}`;

    const result = db
      .prepare(`
        INSERT INTO lining_stock (
          user_id,
          stock_id,
          lining_name,
          color,
          quantity,
          price_per_meter,
          purchase_date,
          notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        req.user.id,
        generatedStockId,
        lining_name.trim(),
        color.trim(),
        qty,
        price,
        purchase_date || "",
        notes || ""
      );

    const stock = db
      .prepare(`
        SELECT *
        FROM lining_stock
        WHERE id = ?
      `)
      .get(result.lastInsertRowid);

    res.status(201).json({
      message: "Lining stock added successfully",
      stock,
    });
  } catch (error) {
    console.error("Add lining stock error:", error);

    res.status(500).json({
      message: "Failed to add lining stock",
    });
  }
});

/* =========================================================
   UPDATE LINING STOCK
   PUT /api/lining-stock/:id
========================================================= */

router.put("/lining-stock/:id", authMiddleware, (req, res) => {
  try {
    const {
      lining_name,
      color,
      quantity,
      price_per_meter,
      purchase_date,
      notes,
    } = req.body;

    const existingStock = db
      .prepare(`
        SELECT *
        FROM lining_stock
        WHERE id = ?
        AND user_id = ?
      `)
      .get(req.params.id, req.user.id);

    if (!existingStock) {
      return res.status(404).json({
        message: "Lining stock not found",
      });
    }

    const qty = Number(quantity || 0);
    const price = Number(price_per_meter || 0);

    if (!lining_name || !color) {
      return res.status(400).json({
        message: "Lining name and colour are required",
      });
    }

    if (qty < 0) {
      return res.status(400).json({
        message: "Quantity cannot be negative",
      });
    }

    db.prepare(`
      UPDATE lining_stock
      SET
        lining_name = ?,
        color = ?,
        quantity = ?,
        price_per_meter = ?,
        purchase_date = ?,
        notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      AND user_id = ?
    `).run(
      lining_name.trim(),
      color.trim(),
      qty,
      price,
      purchase_date || "",
      notes || "",
      req.params.id,
      req.user.id
    );

    const stock = db
      .prepare(`
        SELECT *
        FROM lining_stock
        WHERE id = ?
        AND user_id = ?
      `)
      .get(req.params.id, req.user.id);

    res.json({
      message: "Lining stock updated successfully",
      stock,
    });
  } catch (error) {
    console.error("Update lining stock error:", error);

    res.status(500).json({
      message: "Failed to update lining stock",
    });
  }
});

/* =========================================================
   DELETE LINING STOCK
   DELETE /api/lining-stock/:id
========================================================= */

router.delete("/lining-stock/:id", authMiddleware, (req, res) => {
  try {
    const result = db
      .prepare(`
        DELETE FROM lining_stock
        WHERE id = ?
        AND user_id = ?
      `)
      .run(req.params.id, req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({
        message: "Lining stock not found",
      });
    }

    res.json({
      message: "Lining stock deleted successfully",
    });
  } catch (error) {
    console.error("Delete lining stock error:", error);

    res.status(500).json({
      message: "Failed to delete lining stock",
    });
  }
});

/* =========================================================
   GET LINING SALES
   GET /api/lining-sales
========================================================= */

router.get("/lining-sales", authMiddleware, (req, res) => {
  try {
    const sales = db
      .prepare(`
        SELECT
          id,
          sale_id,
          date,
          lining_name,
          color,
          quantity,
          price_per_meter,
          amount,
          customer_name,
          notes,
          created_at
        FROM lining_sold
        WHERE user_id = ?
        ORDER BY id DESC
      `)
      .all(req.user.id);

    const formattedSales = sales.map((sale) => ({
      id: sale.id,
      saleId: sale.sale_id,
      saleDate: sale.date,
      liningName: sale.lining_name,
      colour: sale.color,
      quantity: Number(sale.quantity || 0),
      pricePerMeter: Number(sale.price_per_meter || 0),
      totalAmount: Number(sale.amount || 0),
      customerName: sale.customer_name || "",
      notes: sale.notes || "",
      createdAt: sale.created_at,
    }));

    res.json(formattedSales);
  } catch (error) {
    console.error("Get lining sales error:", error);

    res.status(500).json({
      message: "Failed to load lining sales",
    });
  }
});

/* =========================================================
   ADD LINING SALE
   POST /api/lining-sales
========================================================= */

router.post("/lining-sales", authMiddleware, (req, res) => {
  const transaction = db.transaction(() => {
    const {
      sale_date,
      lining_name,
      colour,
      quantity,
      price_per_meter,
      customer_name,
      notes,
    } = req.body;

    if (!lining_name || !colour) {
      throw new Error(
        "Lining name and colour are required"
      );
    }

    const saleQuantity = Number(quantity || 0);
    const price = Number(price_per_meter || 0);

    if (saleQuantity <= 0) {
      throw new Error(
        "Sale quantity must be greater than 0"
      );
    }

    /* FIND STOCK */

    const stockItem = db
      .prepare(`
        SELECT *
        FROM lining_stock
        WHERE user_id = ?
        AND LOWER(TRIM(lining_name)) = LOWER(TRIM(?))
        AND LOWER(TRIM(color)) = LOWER(TRIM(?))
        LIMIT 1
      `)
      .get(
        req.user.id,
        lining_name,
        colour
      );

    if (!stockItem) {
      throw new Error(
        "This lining and colour is not available in Lining Stock."
      );
    }

    const availableQuantity =
      Number(stockItem.quantity || 0);

    if (saleQuantity > availableQuantity) {
      throw new Error(
        `Only ${availableQuantity.toFixed(
          1
        )} meter available in stock.`
      );
    }

    /* REDUCE STOCK */

    db.prepare(`
      UPDATE lining_stock
      SET
        quantity = quantity - ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      AND user_id = ?
    `).run(
      saleQuantity,
      stockItem.id,
      req.user.id
    );

    /* CREATE SALE */

    const saleId =
      `SALE-${Date.now()}`;

    const totalAmount =
      saleQuantity * price;

    const result = db
      .prepare(`
        INSERT INTO lining_sold (
          user_id,
          sale_id,
          date,
          lining_name,
          color,
          quantity,
          price_per_meter,
          amount,
          customer_name,
          notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        req.user.id,
        saleId,
        sale_date || "",
        lining_name.trim(),
        colour.trim(),
        saleQuantity,
        price,
        totalAmount,
        customer_name || "",
        notes || ""
      );

    return {
      id: result.lastInsertRowid,
      saleId,
      saleDate: sale_date || "",
      liningName: lining_name.trim(),
      colour: colour.trim(),
      quantity: saleQuantity,
      pricePerMeter: price,
      totalAmount,
      customerName: customer_name || "",
      notes: notes || "",
    };
  });

  try {
    const sale = transaction();

    res.status(201).json({
      message: "Sale added successfully",
      sale,
    });
  } catch (error) {
    console.error("Add lining sale error:", error);

    res.status(400).json({
      message: error.message,
    });
  }
});

/* =========================================================
   UPDATE LINING SALE
   PUT /api/lining-sales/:id
========================================================= */

router.put("/lining-sales/:id", authMiddleware, (req, res) => {
  const transaction = db.transaction(() => {
    const oldSale = db
      .prepare(`
        SELECT *
        FROM lining_sold
        WHERE id = ?
        AND user_id = ?
      `)
      .get(
        req.params.id,
        req.user.id
      );

    if (!oldSale) {
      throw new Error(
        "Sale record not found"
      );
    }

    const {
      sale_date,
      lining_name,
      colour,
      quantity,
      price_per_meter,
      customer_name,
      notes,
    } = req.body;

    const newQuantity =
      Number(quantity || 0);

    const newPrice =
      Number(price_per_meter || 0);

    if (!lining_name || !colour) {
      throw new Error(
        "Lining name and colour are required"
      );
    }

    if (newQuantity <= 0) {
      throw new Error(
        "Sale quantity must be greater than 0"
      );
    }

    /* =====================================================
       RETURN OLD SALE QUANTITY
    ===================================================== */

    const oldStock = db
      .prepare(`
        SELECT *
        FROM lining_stock
        WHERE user_id = ?
        AND LOWER(TRIM(lining_name)) =
            LOWER(TRIM(?))
        AND LOWER(TRIM(color)) =
            LOWER(TRIM(?))
        LIMIT 1
      `)
      .get(
        req.user.id,
        oldSale.lining_name,
        oldSale.color
      );

    if (oldStock) {
      db.prepare(`
        UPDATE lining_stock
        SET
          quantity = quantity + ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        AND user_id = ?
      `).run(
        Number(oldSale.quantity || 0),
        oldStock.id,
        req.user.id
      );
    }

    /* =====================================================
       FIND NEW STOCK
    ===================================================== */

    const newStock = db
      .prepare(`
        SELECT *
        FROM lining_stock
        WHERE user_id = ?
        AND LOWER(TRIM(lining_name)) =
            LOWER(TRIM(?))
        AND LOWER(TRIM(color)) =
            LOWER(TRIM(?))
        LIMIT 1
      `)
      .get(
        req.user.id,
        lining_name,
        colour
      );

    if (!newStock) {
      throw new Error(
        "Selected lining and colour is not available in stock."
      );
    }

    const availableQuantity =
      Number(newStock.quantity || 0);

    if (newQuantity > availableQuantity) {
      throw new Error(
        `Only ${availableQuantity.toFixed(
          1
        )} meter available in stock.`
      );
    }

    /* =====================================================
       DEDUCT NEW QUANTITY
    ===================================================== */

    db.prepare(`
      UPDATE lining_stock
      SET
        quantity = quantity - ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      AND user_id = ?
    `).run(
      newQuantity,
      newStock.id,
      req.user.id
    );

    /* =====================================================
       UPDATE SALE
    ===================================================== */

    const totalAmount =
      newQuantity * newPrice;

    db.prepare(`
      UPDATE lining_sold
      SET
        date = ?,
        lining_name = ?,
        color = ?,
        quantity = ?,
        price_per_meter = ?,
        amount = ?,
        customer_name = ?,
        notes = ?
      WHERE id = ?
      AND user_id = ?
    `).run(
      sale_date || "",
      lining_name.trim(),
      colour.trim(),
      newQuantity,
      newPrice,
      totalAmount,
      customer_name || "",
      notes || "",
      req.params.id,
      req.user.id
    );

    return {
      id: Number(req.params.id),
      saleDate: sale_date || "",
      liningName: lining_name.trim(),
      colour: colour.trim(),
      quantity: newQuantity,
      pricePerMeter: newPrice,
      totalAmount,
      customerName: customer_name || "",
      notes: notes || "",
    };
  });

  try {
    const sale = transaction();

    res.json({
      message: "Sale updated successfully",
      sale,
    });
  } catch (error) {
    console.error("Update lining sale error:", error);

    res.status(400).json({
      message: error.message,
    });
  }
});

/* =========================================================
   DELETE LINING SALE
   DELETE /api/lining-sales/:id
========================================================= */

router.delete("/lining-sales/:id", authMiddleware, (req, res) => {
  const transaction = db.transaction(() => {
    const sale = db
      .prepare(`
        SELECT *
        FROM lining_sold
        WHERE id = ?
        AND user_id = ?
      `)
      .get(
        req.params.id,
        req.user.id
      );

    if (!sale) {
      throw new Error(
        "Sale record not found"
      );
    }

    /* RETURN QUANTITY TO STOCK */

    const stockItem = db
      .prepare(`
        SELECT *
        FROM lining_stock
        WHERE user_id = ?
        AND LOWER(TRIM(lining_name)) =
            LOWER(TRIM(?))
        AND LOWER(TRIM(color)) =
            LOWER(TRIM(?))
        LIMIT 1
      `)
      .get(
        req.user.id,
        sale.lining_name,
        sale.color
      );

    if (stockItem) {
      db.prepare(`
        UPDATE lining_stock
        SET
          quantity = quantity + ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        AND user_id = ?
      `).run(
        Number(sale.quantity || 0),
        stockItem.id,
        req.user.id
      );
    }

    /* DELETE SALE */

    db.prepare(`
      DELETE FROM lining_sold
      WHERE id = ?
      AND user_id = ?
    `).run(
      req.params.id,
      req.user.id
    );

    return Number(sale.quantity || 0);
  });

  try {
    const returnedQuantity = transaction();

    res.json({
      message: "Sale deleted successfully",
      returnedQuantity,
    });
  } catch (error) {
    console.error("Delete lining sale error:", error);

    res.status(400).json({
      message: error.message,
    });
  }
});

module.exports = router;