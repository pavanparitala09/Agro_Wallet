const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const Bill = require('../models/Bill');
const Section = require('../models/Section');
const { calculateInterestForBill } = require('../utils/interestCalculator');

function buildBillFilters(query, userId) {
  const filters = { userId };

  if (query.sectionId) {
    filters.sectionId = query.sectionId;
  }

  if (query.status) {
    filters.status = query.status;
  }

  if (query.vendorName) {
    filters.vendorName = { $regex: query.vendorName, $options: 'i' };
  }

  if (query.search) {
    const regex = { $regex: query.search, $options: 'i' };
    filters.$or = [
      { title: regex },
      { vendorName: regex },
      { notes: regex }
    ];
  }

  if (query.minAmount || query.maxAmount) {
    filters.amount = {};
    if (query.minAmount) filters.amount.$gte = Number(query.minAmount);
    if (query.maxAmount) filters.amount.$lte = Number(query.maxAmount);
  }

  if (query.startDate || query.endDate) {
    filters.billDate = {};
    if (query.startDate) filters.billDate.$gte = new Date(query.startDate);
    if (query.endDate) filters.billDate.$lte = new Date(query.endDate);
  }

  return filters;
}

function attachInterest(bills) {
  return bills.map((bill) => {
    const { interest, total } = calculateInterestForBill(bill);
    const paidAmount = Number(bill.paidAmount) || 0;
    const amountDue = Math.max(0, total - paidAmount);
    return {
      ...bill.toObject(),
      calculatedInterest: interest,
      totalPayable: total,
      paidAmount,
      amountDue
    };
  });
}

async function createBill(req, res) {
  try {
    const {
      sectionId,
      title,
      amount,
      billDate,
      status,
      paidAmount,
      vendorName,
      notes,
      interestEnabled,
      interestType,
      interestFrequency,
      interestRate,
      interestStartDate
    } = req.body;

    if (!sectionId || !title || !amount || !billDate || !status) {
      return res.status(400).json({ message: 'Section, title, amount, billDate and status are required' });
    }

    const paidNum = status === 'partial_paid' ? Number(paidAmount) || 0 : 0;

    let imageUrl;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const bill = await Bill.create({
      userId: req.userId,
      sectionId,
      vendorName,
      title,
      amount,
      billDate,
      status,
      paidAmount: paidNum,
      notes,
      interestEnabled: !!interestEnabled,
      interestType: interestType || 'simple',
      interestFrequency: interestFrequency || 'monthly',
      interestRate: interestRate || 0,
      interestStartDate: interestStartDate || null,
      completedAt: status === 'paid' ? new Date() : null
    });

    res.status(201).json(bill);
  } catch (err) {
    console.error('Create bill error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
}

async function updateBill(req, res) {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (req.file) {
      updates.imageUrl = `/uploads/${req.file.filename}`;
    }

    updates.edited = true;
    updates.editedAt = new Date();

    if (updates.status === 'paid') {
      updates.completedAt = updates.completedAt || new Date();
      updates.paidAmount = undefined; // will use total when paid
    }
    if (updates.status === 'partial_paid' && typeof updates.paidAmount !== 'undefined') {
      updates.paidAmount = Number(updates.paidAmount) || 0;
    }

    const bill = await Bill.findOneAndUpdate(
      { _id: id, userId: req.userId },
      updates,
      { new: true }
    );

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    res.json(bill);
  } catch (err) {
    console.error('Update bill error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
}

async function markBillPaid(req, res) {
  try {
    const { id } = req.params;

    const bill = await Bill.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { status: 'paid', completedAt: new Date() },
      { new: true }
    );

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    res.json(bill);
  } catch (err) {
    console.error('Mark bill paid error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
}

async function markBillUnpaid(req, res) {
  try {
    const { id } = req.params;

    const bill = await Bill.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { status: 'unpaid', completedAt: null, paidAmount: 0 },
      { new: true }
    );

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    res.json(bill);
  } catch (err) {
    console.error('Mark bill unpaid error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
}

async function deleteBill(req, res) {
  try {
    const { id } = req.params;

    const bill = await Bill.findOneAndDelete({ _id: id, userId: req.userId });

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    res.json({ message: 'Bill deleted' });
  } catch (err) {
    console.error('Delete bill error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getBills(req, res) {
  try {
    const filters = buildBillFilters(req.query, req.userId);

    const bills = await Bill.find(filters)
      .sort({ createdAt: -1 })
      .populate('sectionId', 'sectionName');

    const withInterest = attachInterest(bills);
    res.json(withInterest);
  } catch (err) {
    console.error('Get bills error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getPendingBills(req, res) {
  try {
    const baseFilters = buildBillFilters(req.query, req.userId);
    baseFilters.status = { $in: ['unpaid', 'partial_paid'] };

    const bills = await Bill.find(baseFilters)
      .sort({ billDate: 1 })
      .populate('sectionId', 'sectionName');

    const withInterest = attachInterest(bills);
    res.json(withInterest);
  } catch (err) {
    console.error('Get pending bills error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getDashboardSummary(req, res) {
  try {
    const bills = await Bill.find({ userId: req.userId });

    let totalPrincipal = 0;
    let totalInterest = 0;
    let totalPaid = 0;
    let totalPending = 0;

    const now = new Date();

    bills.forEach((bill) => {
      totalPrincipal += bill.amount;
      const { interest, total } = calculateInterestForBill(bill, now);
      totalInterest += interest;

      const paidAmt = Number(bill.paidAmount) || 0;
      if (bill.status === 'paid') {
        totalPaid += total;
      } else if (bill.status === 'partial_paid') {
        totalPaid += paidAmt;
        totalPending += Math.max(0, total - paidAmt);
      } else {
        totalPending += total;
      }
    });

    res.json({
      totalPrincipal: Number(totalPrincipal.toFixed(2)),
      totalInterest: Number(totalInterest.toFixed(2)),
      totalPaid: Number(totalPaid.toFixed(2)),
      totalPending: Number(totalPending.toFixed(2)),
      totalBillsCount: bills.length
    });
  } catch (err) {
    console.error('Dashboard summary error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
}

async function exportBillsExcel(req, res) {
  try {
    const filters = buildBillFilters(req.query, req.userId);
    const bills = await Bill.find(filters).populate('sectionId', 'sectionName');
    const withInterest = attachInterest(bills);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Ledger');

    sheet.columns = [
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Vendor', key: 'vendorName', width: 20 },
      { header: 'Section', key: 'section', width: 20 },
      { header: 'Principal', key: 'amount', width: 15 },
      { header: 'Interest', key: 'interest', width: 15 },
      { header: 'Total', key: 'total', width: 15 },
      { header: 'Status', key: 'status', width: 10 },
      { header: 'Bill Date', key: 'billDate', width: 15 }
    ];

    withInterest.forEach((b) => {
      sheet.addRow({
        title: b.title,
        vendorName: b.vendorName || '',
        section: b.sectionId?.sectionName || '',
        amount: b.amount,
        interest: b.calculatedInterest,
        total: b.totalPayable,
        status: b.status,
        billDate: b.billDate ? new Date(b.billDate).toISOString().slice(0, 10) : ''
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=\"ledger.xlsx\"'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Export Excel error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
}

async function exportBillsPdf(req, res) {
  try {
    const filters = buildBillFilters(req.query, req.userId);
    const bills = await Bill.find(filters).populate('sectionId', 'sectionName');
    const withInterest = attachInterest(bills);

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=\"ledger.pdf\"'
    );

    doc.pipe(res);

    doc.fontSize(18).text('Rural Ledger - Export', { align: 'center' });
    doc.moveDown();

    withInterest.forEach((b) => {
      doc
        .fontSize(12)
        .text(`Title: ${b.title}`)
        .text(`Vendor: ${b.vendorName || ''}`)
        .text(`Section: ${b.sectionId?.sectionName || ''}`)
        .text(`Principal: ${b.amount}`)
        .text(`Interest: ${b.calculatedInterest}`)
        .text(`Total: ${b.totalPayable}`)
        .text(`Status: ${b.status}`)
        .text(
          `Bill Date: ${
            b.billDate ? new Date(b.billDate).toISOString().slice(0, 10) : ''
          }`
        )
        .moveDown();
    });

    doc.end();
  } catch (err) {
    console.error('Export PDF error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
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
};


