const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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
  exportBillsPdf
} = require('../controllers/billController');
const { authRequired } = require('../middleware/authMiddleware');

const router = express.Router();

// Multer storage (local dev)
const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

router.use(authRequired);

router.get('/', getBills);
router.get('/pending', getPendingBills);
router.get('/dashboard/summary', getDashboardSummary);
router.get('/export/excel', exportBillsExcel);
router.get('/export/pdf', exportBillsPdf);

router.post('/', upload.single('image'), createBill);
router.put('/:id', upload.single('image'), updateBill);
router.patch('/:id/mark-paid', markBillPaid);
router.patch('/:id/mark-unpaid', markBillUnpaid);
router.delete('/:id', deleteBill);

module.exports = router;


