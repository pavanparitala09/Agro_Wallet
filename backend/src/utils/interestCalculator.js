function calculateDateDiff(start, end, frequency) {
  const msInDay = 1000 * 60 * 60 * 24;
  const diffMs = end.getTime() - start.getTime();
  if (frequency === 'daily') {
    return Math.max(0, Math.floor(diffMs / msInDay));
  }
  // monthly approximation based on calendar months
  let months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());
  if (end.getDate() < start.getDate()) {
    months -= 1;
  }
  return Math.max(0, months);
}

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function calculateInterestForBill(bill, now = new Date()) {
  const {
    interestEnabled,
    interestType,
    interestFrequency,
    interestRate,
    interestStartDate,
    status,
    completedAt,
    amount
  } = bill;


  if (!interestEnabled || !interestStartDate || !interestRate) {
    return {
      interest: 0,
      total: round2(amount)
    };
  }

  const startDate = new Date(interestStartDate);
  const endDate =
    status === 'paid' && completedAt ? new Date() : now;

  const periods = calculateDateDiff(startDate, endDate, interestFrequency);
  const r = interestRate / 100; // percentage per period

  let total = amount;

  if (interestType === 'simple') {
    total = amount * (1 + r * periods);
  } else if (interestType === 'compound') {
    total = amount * Math.pow(1 + r, periods);
  }

  const interest = total - amount;
  

  return {
    interest: round2(interest),
    total: round2(total)
  };
}

module.exports = {
  calculateInterestForBill
};


