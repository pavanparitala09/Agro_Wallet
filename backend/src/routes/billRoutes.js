const express = require("express");
const {
  createBill,
  updateBill,
  markBillPaid,
  markBillUnpaid,
  deleteBill,
  getBills,
  getPendingBills,
  getDashboardSummary,
  exportBillsExcel,
  exportBillsPdf,
} = require("../controllers/billController");
const { authRequired } = require("../middleware/authMiddleware");
const { upload } = require("../config/cloudinary");

const router = express.Router();

router.use(authRequired);

router.get("/", getBills);
router.get("/pending", getPendingBills);
router.get("/dashboard/summary", getDashboardSummary);
router.get("/export/excel", exportBillsExcel);
router.get("/export/pdf", exportBillsPdf);

router.post("/", upload.single("image"), createBill);
router.put("/:id", upload.single("image"), updateBill);
router.patch("/:id/mark-paid", markBillPaid);
router.patch("/:id/mark-unpaid", markBillUnpaid);
router.delete("/:id", deleteBill);

module.exports = router;
