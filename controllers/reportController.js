const PDFDocument = require('pdfkit');
const FoodLog     = require('../models/FoodLog');
const { calculateDailyCalories, calculateMacros, calculateBMI } = require('../utils/dietCalculator');
const { getDerivedNutrition } = require('../utils/foodLogNutrition');

const toDateKey = (value = new Date()) => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ─── Colour palette ────────────────────────────────────────────────
const COLORS = {
  primary:   '#4F46E5',   // indigo
  success:   '#22C55E',   // green
  warning:   '#F59E0B',   // amber
  danger:    '#EF4444',   // red
  muted:     '#6B7280',   // gray-500
  border:    '#E5E7EB',   // gray-200
  bg:        '#F9FAFB',   // gray-50
  dark:      '#111827',   // gray-900
};

// ─── Helpers ───────────────────────────────────────────────────────

/**
 * Format number as localized string with grouped thousands separator
 * @param {number} value - Number to format
 * @returns {string} Formatted number e.g., "1,234"
 */
const formatNumber = (value) => Math.round(value).toLocaleString();

/**
 * Format date in short readable format
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date e.g., "Jan 15"
 */
const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

/**
 * Calculate percentage capped at 100%
 * @param {number} consumed - Actual consumption value
 * @param {number} target - Target consumption value
 * @returns {number} Percentage (0-100)
 */
const calculatePercentage = (consumed, target) =>
  target > 0 ? Math.min(Math.round((consumed / target) * 100), 100) : 0;

/**
 * Determine color status based on consumption vs target
 * @param {number} consumed - Actual consumption
 * @param {number} target - Target consumption
 * @returns {string} Color code from COLORS palette
 */
const getStatusColor = (consumed, target) => {
  const percentage = calculatePercentage(consumed, target);
  if (consumed > target) return COLORS.danger;
  if (percentage >= 85) return COLORS.warning;
  return COLORS.success;
};

// ─── Get last N days of logs grouped by date ───────────────────────
/**
 * Fetch and group food logs by date for the past N days
 * @param {string} userId - User ID
 * @param {number} days - Number of days to fetch (default 7)
 * @returns {Promise<Array>} Array of daily summaries { date, entries, calories, protein, carbs, fats }
 */
const getWeeklyLogs = async (userId, days = 7) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days - 1));

  const end = toDateKey(endDate);
  const start = toDateKey(startDate);

  const logs = await FoodLog.find({
    userId,
    date: { $gte: start, $lte: end },
  })
    .populate('foodId', 'calories protein carbs fat')
    .sort({ date: 1, time: 1, createdAt: 1 });

  // Group by date string YYYY-MM-DD
  const byDay = {};
  for (let i = 0; i < days; i++) {
    const eachDay = new Date(startDate);
    eachDay.setDate(eachDay.getDate() + i);
    const key = toDateKey(eachDay);
    byDay[key] = { date: key, entries: [], calories: 0, protein: 0, carbs: 0, fats: 0 };
  }

  logs.forEach((log) => {
    const key = log.date;
    if (byDay[key]) {
      const nutrition = getDerivedNutrition(log);
      byDay[key].entries.push(log);
      byDay[key].calories += nutrition.calories;
      byDay[key].protein  += nutrition.protein;
      byDay[key].carbs    += nutrition.carbs;
      byDay[key].fats     += nutrition.fat;
    }
  });

  return Object.values(byDay);
};

// ─── PDF builder ──────────────────────────────────────────────────
const buildPDF = (doc, user, days, calorieGoal, macroGoal) => {
  const PAGE_W   = doc.page.width;
  const MARGIN   = 50;
  const CONTENT  = PAGE_W - MARGIN * 2;

  // ── HEADER banner ────────────────────────────────────────────────
  doc.rect(0, 0, PAGE_W, 90).fill(COLORS.primary);

  doc.fillColor('#fff')
     .font('Helvetica-Bold')
     .fontSize(24)
     .text('🥗 NutriTrack', MARGIN, 22);

  doc.font('Helvetica')
     .fontSize(11)
     .text('Weekly Nutrition Report', MARGIN, 52);

  const dateRange = `${formatDate(new Date(Date.now() - 6 * 86400000))} – ${formatDate(new Date())}`;
  doc.text(dateRange, PAGE_W - MARGIN - 180, 52, { width: 180, align: 'right' });

  doc.moveDown(0.5);

  // ── USER INFO row ────────────────────────────────────────────────
  doc.y = 106;

  doc.rect(MARGIN, doc.y, CONTENT, 54)
     .fillAndStroke(COLORS.bg, COLORS.border);

  doc.fillColor(COLORS.dark).font('Helvetica-Bold').fontSize(12)
     .text(user.name, MARGIN + 12, doc.y + 8 - 54);  // hack: y already advanced

  // re-draw cleanly
  const infoY = 110;
  doc.rect(MARGIN, infoY, CONTENT, 54).fillAndStroke(COLORS.bg, COLORS.border);

  doc.fillColor(COLORS.dark).font('Helvetica-Bold').fontSize(13)
     .text(user.name,  MARGIN + 14, infoY + 8, { continued: false });

  doc.fillColor(COLORS.muted).font('Helvetica').fontSize(10)
     .text(`${user.email}  ·  Goal: ${(user.goal || 'maintain').replace('_', ' ')}  ·  Weight: ${user.weight ?? '—'} kg  ·  Height: ${user.height ?? '—'} cm  ·  Daily Target: ${formatNumber(calorieGoal)} kcal`,
       MARGIN + 14, infoY + 26, { width: CONTENT - 28 });

  doc.y = infoY + 74;

  // ── WEEKLY SUMMARY CARDS (4 across) ─────────────────────────────
  const totalCal  = days.reduce((sum, curr) => sum + curr.calories, 0);
  const totalPro  = days.reduce((sum, curr) => sum + curr.protein,  0);
  const avgCal    = totalCal / days.length;
  const daysOnGoal = days.filter((curr) => curr.calories > 0 && curr.calories <= calorieGoal).length;
  const daysLogged = days.filter((curr) => curr.entries.length > 0).length;

  const cards = [
    { label: 'Total Calories', value: formatNumber(totalCal) + ' kcal', color: COLORS.primary },
    { label: 'Avg / Day',      value: formatNumber(avgCal)   + ' kcal', color: COLORS.primary },
    { label: 'Total Protein',  value: formatNumber(totalPro) + ' g',    color: COLORS.success },
    { label: 'Days On Goal',   value: `${daysOnGoal} / ${daysLogged}`, color: getStatusColor(daysOnGoal < daysLogged ? daysOnGoal * calorieGoal : calorieGoal, calorieGoal) },
  ];

  const CARD_W = (CONTENT - 30) / 4;
  const cardY  = doc.y;

  cards.forEach((card, index) => {
    const columnX = MARGIN + index * (CARD_W + 10);
    doc.rect(columnX, cardY, CARD_W, 64).fillAndStroke('#fff', COLORS.border);

    // top accent line
    doc.rect(columnX, cardY, CARD_W, 4).fill(card.color);

    doc.fillColor(COLORS.muted).font('Helvetica').fontSize(9)
       .text(card.label, columnX + 8, cardY + 12, { width: CARD_W - 16 });

    doc.fillColor(COLORS.dark).font('Helvetica-Bold').fontSize(15)
       .text(card.value,  columnX + 8, cardY + 26, { width: CARD_W - 16 });
  });

  doc.y = cardY + 80;

  // ── SECTION: DAILY BREAKDOWN TABLE ──────────────────────────────
  sectionTitle(doc, 'Daily Breakdown', MARGIN, CONTENT);

  // Table header
  const cols = [
    { label: 'Date',     w: 100 },
    { label: 'Meals',    w: 48  },
    { label: 'Calories', w: 90  },
    { label: 'vs Goal',  w: 64  },
    { label: 'Protein',  w: 68  },
    { label: 'Carbs',    w: 62  },
    { label: 'Fats',     w: 58  },
  ];

  drawTableHeader(doc, MARGIN, doc.y, cols, CONTENT);

  // Table rows
  days.forEach((day, index) => {
    if (doc.y > doc.page.height - 120) { doc.addPage(); }

    const rowY  = doc.y;
    const rowBg = index % 2 === 0 ? '#fff' : COLORS.bg;
    doc.rect(MARGIN, rowY, CONTENT, 24).fill(rowBg);

    const statusColorValue = getStatusColor(day.calories, calorieGoal);
    const caloriesDifference = day.calories - calorieGoal;
    const diffLabel = day.calories === 0 ? '—' :
      caloriesDifference > 0 ? `+${formatNumber(caloriesDifference)}` : `${formatNumber(caloriesDifference)}`;

    drawTableRow(doc, MARGIN, rowY, cols, [
      formatDate(day.date + 'T12:00:00Z'),
      String(day.entries.length),
      day.calories === 0 ? '—' : formatNumber(day.calories) + ' kcal',
      diffLabel,
      day.protein === 0 ? '—' : formatNumber(day.protein) + 'g',
      day.carbs   === 0 ? '—' : formatNumber(day.carbs)   + 'g',
      day.fats    === 0 ? '—' : formatNumber(day.fats)     + 'g',
    ], [COLORS.dark, COLORS.dark, COLORS.dark, statusColorValue, COLORS.success, COLORS.primary, COLORS.warning]);

    doc.y = rowY + 24;
  });

  // bottom border
  doc.moveTo(MARGIN, doc.y).lineTo(MARGIN + CONTENT, doc.y).stroke(COLORS.border);
  doc.y += 20;

  // ── SECTION: MACRO TOTALS ────────────────────────────────────────
  if (doc.y > doc.page.height - 160) { doc.addPage(); }
  sectionTitle(doc, 'Weekly Macro Totals', MARGIN, CONTENT);

  const totalCarbs = days.reduce((sum, curr) => sum + curr.carbs, 0);
  const totalFats  = days.reduce((sum, curr) => sum + curr.fats,  0);
  const macroRows  = [
    { name: 'Protein', total: totalPro,   daily: totalPro / 7,   goal: macroGoal.protein, color: COLORS.success },
    { name: 'Carbs',   total: totalCarbs, daily: totalCarbs / 7,  goal: macroGoal.carbs,   color: COLORS.primary },
    { name: 'Fats',    total: totalFats,  daily: totalFats / 7,   goal: macroGoal.fat,     color: COLORS.warning },
  ];

  const macroY = doc.y;
  const MCOL   = (CONTENT - 20) / 3;

  macroRows.forEach((macro, index) => {
    const macroX = MARGIN + index * (MCOL + 10);
    doc.rect(macroX, macroY, MCOL, 80).fillAndStroke('#fff', COLORS.border);
    doc.rect(macroX, macroY, MCOL, 4).fill(macro.color);

    doc.fillColor(COLORS.muted).font('Helvetica').fontSize(9)
       .text(macro.name, macroX + 10, macroY + 12);

    doc.fillColor(COLORS.dark).font('Helvetica-Bold').fontSize(16)
       .text(`${formatNumber(macro.total)}g`, macroX + 10, macroY + 24);

    doc.fillColor(COLORS.muted).font('Helvetica').fontSize(9)
       .text(`Avg/day: ${formatNumber(macro.daily)}g   Goal: ${formatNumber(macro.goal)}g`, macroX + 10, macroY + 50);

    // Mini progress bar
    const barWidth  = MCOL - 20;
    const fillWidth = Math.min((macro.daily / macro.goal) * barWidth, barWidth);
    doc.rect(macroX + 10, macroY + 64, barWidth, 6).fillAndStroke(COLORS.bg, COLORS.border);
    doc.rect(macroX + 10, macroY + 64, fillWidth, 6).fill(macro.color);
  });

  doc.y = macroY + 96;

  // ── FOOTER ───────────────────────────────────────────────────────
  const footerY = doc.page.height - 40;
  doc.moveTo(MARGIN, footerY - 8).lineTo(PAGE_W - MARGIN, footerY - 8).stroke(COLORS.border);
  doc.fillColor(COLORS.muted).font('Helvetica').fontSize(9)
     .text(`Generated by NutriTrack · ${new Date().toLocaleString()}`, MARGIN, footerY, { width: CONTENT, align: 'center' });
};

// ─── Layout helpers ────────────────────────────────────────────────

/**
 * Draw a section title with underline
 * @param {PDFDocument} doc - PDFKit document
 * @param {string} title - Section title text
 * @param {number} margin - Left margin
 * @param {number} contentWidth - Width of content area
 */
const sectionTitle = (doc, title, margin, contentWidth) => {
  doc.fillColor(COLORS.primary).font('Helvetica-Bold').fontSize(13)
     .text(title, margin, doc.y);
  doc.moveDown(0.3);
  doc.moveTo(margin, doc.y).lineTo(margin + contentWidth, doc.y).stroke(COLORS.primary);
  doc.moveDown(0.5);
};

/**
 * Draw table header row
 * @param {PDFDocument} doc - PDFKit document
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {Array} columns - Column definitions with { label, w }
 * @param {number} contentWidth - Total content width
 */
const drawTableHeader = (doc, x, y, columns, contentWidth) => {
  doc.rect(x, y, contentWidth, 22).fill(COLORS.primary);
  let columnX = x + 8;
  columns.forEach((col) => {
    doc.fillColor('#fff').font('Helvetica-Bold').fontSize(9)
       .text(col.label, columnX, y + 6, { width: col.w - 4, lineBreak: false });
    columnX += col.w;
  });
  doc.y = y + 22;
};

/**
 * Draw table data row
 * @param {PDFDocument} doc - PDFKit document
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {Array} columns - Column definitions with { label, w }
 * @param {Array} values - Cell values
 * @param {Array} colorMap - Colors for each cell
 */
const drawTableRow = (doc, x, y, columns, values, colorMap) => {
  let columnX = x + 8;
  columns.forEach((col, index) => {
    doc.fillColor(colorMap[index] || COLORS.dark).font('Helvetica').fontSize(9)
       .text(values[index] ?? '—', columnX, y + 7, { width: col.w - 4, lineBreak: false });
    columnX += col.w;
  });
};

// ─── Controller ────────────────────────────────────────────────────
// @desc  Download weekly PDF report
// @route GET /api/report/weekly
// @access Private
const downloadWeeklyReport = async (req, res) => {
  try {
    const user       = req.user;
    const calorieGoal = calculateDailyCalories(user.weight || 70, user.goal || 'maintain');
    const macroGoal   = calculateMacros(calorieGoal, user.goal || 'maintain');
    const bmi         = calculateBMI(user.weight, user.height);

    const days = await getWeeklyLogs(user._id, 7);

    // Stream PDF directly to response
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    const safeDate = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="nutritrack-report-${safeDate}.pdf"`);

    doc.pipe(res);
    buildPDF(doc, user, days, calorieGoal, macroGoal, bmi);
    doc.end();
  } catch (err) {
    // Only send error header if nothing written yet
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to generate report.' });
    }
  }
};

module.exports = { downloadWeeklyReport };
