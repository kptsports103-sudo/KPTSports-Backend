import express from "express";
import Visitor from "../models/visitor.model.js";

const router = express.Router();

// Get and increment visitor count
router.get("/visit", async (req, res) => {
  try {
    let visitor = await Visitor.findOne();

    if (!visitor) {
      visitor = new Visitor({ count: 1 });
    } else {
      visitor.count += 1;
    }

    await visitor.save();
    res.json({ count: visitor.count });
  } catch (error) {
    res.status(500).json({ message: "Error updating visitor count" });
  }
});

// Get current count without incrementing
router.get("/count", async (req, res) => {
  try {
    let visitor = await Visitor.findOne();
    res.json({ count: visitor ? visitor.count : 0 });
  } catch (error) {
    res.status(500).json({ message: "Error getting visitor count" });
  }
});

export default router;
