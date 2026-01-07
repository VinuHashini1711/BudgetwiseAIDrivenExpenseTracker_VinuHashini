package com.budgetwise.service;

import com.budgetwise.model.Budget;
import com.budgetwise.model.Goal;
import com.budgetwise.model.Transaction;
import com.budgetwise.model.User;
import com.budgetwise.repository.BudgetRepository;
import com.budgetwise.repository.GoalRepository;
import com.budgetwise.repository.TransactionRepository;
import com.budgetwise.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExportImportService {

    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;
    private final GoalRepository goalRepository;
    private final UserRepository userRepository;

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    // Color palette for pie charts and styling
    private static final BaseColor PRIMARY_COLOR = new BaseColor(79, 70, 229); // Indigo
    private static final BaseColor SECONDARY_COLOR = new BaseColor(16, 185, 129); // Green
    private static final BaseColor ACCENT_COLOR = new BaseColor(245, 158, 11); // Amber
    private static final BaseColor DANGER_COLOR = new BaseColor(239, 68, 68); // Red
    private static final BaseColor GRAY_COLOR = new BaseColor(107, 114, 128);
    private static final BaseColor LIGHT_GRAY = new BaseColor(243, 244, 246);
    
    private static final BaseColor[] CHART_COLORS = {
        new BaseColor(79, 70, 229),   // Indigo
        new BaseColor(16, 185, 129),  // Green
        new BaseColor(245, 158, 11),  // Amber
        new BaseColor(239, 68, 68),   // Red
        new BaseColor(59, 130, 246),  // Blue
        new BaseColor(168, 85, 247),  // Purple
        new BaseColor(236, 72, 153),  // Pink
        new BaseColor(20, 184, 166),  // Teal
        new BaseColor(249, 115, 22),  // Orange
        new BaseColor(132, 204, 22),  // Lime
    };

    private User getCurrentUser() {
        String identifier = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(identifier)
                .or(() -> userRepository.findByEmail(identifier))
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // ==================== EXPORT METHODS ====================

    public byte[] exportData(String format, Map<String, Boolean> options) throws Exception {
        User user = getCurrentUser();
        
        switch (format.toLowerCase()) {
            case "pdf":
                return exportToPdf(user, options);
            case "csv":
                return exportToCsv(user, options);
            case "json":
                return exportToJson(user, options);
            default:
                throw new IllegalArgumentException("Unsupported format: " + format);
        }
    }

    private byte[] exportToPdf(User user, Map<String, Boolean> options) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 40, 40, 50, 50);
        PdfWriter writer = PdfWriter.getInstance(document, baos);
        
        document.open();
        
        // Fonts
        Font titleFont = new Font(Font.FontFamily.HELVETICA, 24, Font.BOLD, PRIMARY_COLOR);
        Font headerFont = new Font(Font.FontFamily.HELVETICA, 11, Font.BOLD, BaseColor.WHITE);
        Font sectionFont = new Font(Font.FontFamily.HELVETICA, 16, Font.BOLD, PRIMARY_COLOR);
        Font normalFont = new Font(Font.FontFamily.HELVETICA, 10, Font.NORMAL, BaseColor.DARK_GRAY);
        Font boldFont = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, BaseColor.DARK_GRAY);
        Font smallFont = new Font(Font.FontFamily.HELVETICA, 8, Font.NORMAL, GRAY_COLOR);
        
        // === HEADER SECTION ===
        addReportHeader(document, user, titleFont, smallFont);
        
        // Fetch all data
        List<Transaction> transactions = transactionRepository.findByUser(user);
        List<Budget> budgets = budgetRepository.findByUser(user);
        List<Goal> goals = goalRepository.findByUser(user);
        
        // === FINANCIAL SUMMARY SECTION ===
        addFinancialSummary(document, transactions, sectionFont, normalFont, boldFont);
        
        // === EXPENSE PIE CHART ===
        if (options.getOrDefault("transactions", false) && !transactions.isEmpty()) {
            addExpensePieChart(document, writer, transactions, sectionFont, normalFont, smallFont);
        }
        
        // === INCOME VS EXPENSE COMPARISON ===
        if (options.getOrDefault("transactions", false) && !transactions.isEmpty()) {
            addIncomeExpenseComparison(document, transactions, sectionFont, normalFont);
        }
        
        // === TRANSACTIONS TABLE ===
        if (options.getOrDefault("transactions", false)) {
            addTransactionsSection(document, transactions, sectionFont, headerFont, normalFont, smallFont);
        }
        
        // === BUDGETS SECTION ===
        if (options.getOrDefault("budgets", false)) {
            addBudgetsSection(document, budgets, transactions, sectionFont, headerFont, normalFont, boldFont);
        }
        
        // === GOALS SECTION ===
        if (options.getOrDefault("goals", false)) {
            addGoalsSection(document, goals, sectionFont, headerFont, normalFont, boldFont);
        }
        
        // === FOOTER ===
        addReportFooter(document, smallFont);
        
        document.close();
        return baos.toByteArray();
    }
    
    private void addReportHeader(Document document, User user, Font titleFont, Font smallFont) throws DocumentException {
        // Logo/Title area
        PdfPTable headerTable = new PdfPTable(2);
        headerTable.setWidthPercentage(100);
        headerTable.setWidths(new float[]{70, 30});
        
        // Title cell
        PdfPCell titleCell = new PdfPCell();
        titleCell.setBorder(Rectangle.NO_BORDER);
        titleCell.setPaddingBottom(10);
        
        Paragraph title = new Paragraph("BudgetWise", titleFont);
        titleCell.addElement(title);
        
        Paragraph subtitle = new Paragraph("Personal Financial Report", 
            new Font(Font.FontFamily.HELVETICA, 12, Font.NORMAL, GRAY_COLOR));
        titleCell.addElement(subtitle);
        headerTable.addCell(titleCell);
        
        // Info cell
        PdfPCell infoCell = new PdfPCell();
        infoCell.setBorder(Rectangle.NO_BORDER);
        infoCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        infoCell.setPaddingBottom(10);
        
        Paragraph dateInfo = new Paragraph();
        dateInfo.setAlignment(Element.ALIGN_RIGHT);
        dateInfo.add(new Chunk("Generated: " + LocalDateTime.now().format(
            DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' hh:mm a")), smallFont));
        dateInfo.add(Chunk.NEWLINE);
        dateInfo.add(new Chunk("User: " + user.getUsername(), smallFont));
        if (user.getEmail() != null) {
            dateInfo.add(Chunk.NEWLINE);
            dateInfo.add(new Chunk(user.getEmail(), smallFont));
        }
        infoCell.addElement(dateInfo);
        headerTable.addCell(infoCell);
        
        document.add(headerTable);
        
        // Divider line
        PdfPTable divider = new PdfPTable(1);
        divider.setWidthPercentage(100);
        PdfPCell dividerCell = new PdfPCell();
        dividerCell.setBorder(Rectangle.NO_BORDER);
        dividerCell.setBorderWidthBottom(2);
        dividerCell.setBorderColorBottom(PRIMARY_COLOR);
        dividerCell.setPaddingBottom(10);
        divider.addCell(dividerCell);
        document.add(divider);
        document.add(Chunk.NEWLINE);
    }
    
    private void addFinancialSummary(Document document, List<Transaction> transactions, 
            Font sectionFont, Font normalFont, Font boldFont) throws DocumentException {
        
        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpense = BigDecimal.ZERO;
        
        for (Transaction t : transactions) {
            if ("INCOME".equalsIgnoreCase(t.getType())) {
                totalIncome = totalIncome.add(t.getAmount());
            } else {
                totalExpense = totalExpense.add(t.getAmount());
            }
        }
        
        BigDecimal netBalance = totalIncome.subtract(totalExpense);
        BigDecimal savingsRate = totalIncome.compareTo(BigDecimal.ZERO) > 0 
            ? netBalance.multiply(BigDecimal.valueOf(100)).divide(totalIncome, 1, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;
        
        // Summary cards
        PdfPTable summaryTable = new PdfPTable(4);
        summaryTable.setWidthPercentage(100);
        summaryTable.setSpacingBefore(10);
        summaryTable.setSpacingAfter(20);
        
        // Income Card
        addSummaryCard(summaryTable, "Total Income", "$" + formatAmount(totalIncome), SECONDARY_COLOR);
        
        // Expense Card
        addSummaryCard(summaryTable, "Total Expenses", "$" + formatAmount(totalExpense), DANGER_COLOR);
        
        // Net Balance Card
        BaseColor balanceColor = netBalance.compareTo(BigDecimal.ZERO) >= 0 ? SECONDARY_COLOR : DANGER_COLOR;
        addSummaryCard(summaryTable, "Net Balance", "$" + formatAmount(netBalance), balanceColor);
        
        // Savings Rate Card
        addSummaryCard(summaryTable, "Savings Rate", savingsRate + "%", PRIMARY_COLOR);
        
        document.add(summaryTable);
    }
    
    private void addSummaryCard(PdfPTable table, String label, String value, BaseColor color) {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.BOX);
        cell.setBorderColor(LIGHT_GRAY);
        cell.setBorderWidth(1);
        cell.setPadding(12);
        cell.setBackgroundColor(BaseColor.WHITE);
        
        Paragraph content = new Paragraph();
        content.add(new Chunk(label + "\n", new Font(Font.FontFamily.HELVETICA, 9, Font.NORMAL, GRAY_COLOR)));
        content.add(new Chunk(value, new Font(Font.FontFamily.HELVETICA, 16, Font.BOLD, color)));
        
        cell.addElement(content);
        table.addCell(cell);
    }
    
    private void addExpensePieChart(Document document, PdfWriter writer, List<Transaction> transactions,
            Font sectionFont, Font normalFont, Font smallFont) throws DocumentException {
        
        // Calculate expenses by category
        Map<String, BigDecimal> expensesByCategory = new LinkedHashMap<>();
        BigDecimal totalExpenses = BigDecimal.ZERO;
        
        for (Transaction t : transactions) {
            if ("EXPENSE".equalsIgnoreCase(t.getType())) {
                String category = t.getCategory() != null ? t.getCategory() : "Other";
                expensesByCategory.merge(category, t.getAmount(), BigDecimal::add);
                totalExpenses = totalExpenses.add(t.getAmount());
            }
        }
        
        if (expensesByCategory.isEmpty() || totalExpenses.compareTo(BigDecimal.ZERO) == 0) {
            return;
        }
        
        // Sort by amount descending
        List<Map.Entry<String, BigDecimal>> sortedCategories = expensesByCategory.entrySet()
            .stream()
            .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
            .collect(Collectors.toList());
        
        // Section title
        Paragraph chartTitle = new Paragraph("Expense Breakdown by Category", sectionFont);
        chartTitle.setSpacingBefore(15);
        chartTitle.setSpacingAfter(5);
        document.add(chartTitle);
        
        // Get current vertical position for pie chart
        float currentY = writer.getVerticalPosition(true);
        
        // Draw the actual circular pie chart
        PdfContentByte canvas = writer.getDirectContent();
        float centerX = 150; // X position of pie chart center
        float centerY = currentY - 90; // Y position (below current position)
        float radius = 70; // Pie chart radius
        
        // Draw pie slices
        float startAngle = 0;
        int colorIndex = 0;
        BigDecimal finalTotalExpenses = totalExpenses;
        
        for (Map.Entry<String, BigDecimal> entry : sortedCategories) {
            if (colorIndex >= 10) break;
            
            BaseColor color = CHART_COLORS[colorIndex % CHART_COLORS.length];
            float sweepAngle = entry.getValue().multiply(BigDecimal.valueOf(360))
                .divide(finalTotalExpenses, 2, RoundingMode.HALF_UP).floatValue();
            
            // Draw pie slice
            canvas.setColorFill(color);
            canvas.setColorStroke(BaseColor.WHITE);
            canvas.setLineWidth(1);
            
            // Draw arc segment
            drawPieSlice(canvas, centerX, centerY, radius, startAngle, sweepAngle, color);
            
            startAngle += sweepAngle;
            colorIndex++;
        }
        
        // Draw white center circle for donut effect
        canvas.setColorFill(BaseColor.WHITE);
        canvas.circle(centerX, centerY, radius * 0.45f);
        canvas.fill();
        
        // Add "Total" text in center of donut
        try {
            BaseFont bf = BaseFont.createFont(BaseFont.HELVETICA_BOLD, BaseFont.WINANSI, false);
            canvas.beginText();
            canvas.setFontAndSize(bf, 8);
            canvas.setColorFill(GRAY_COLOR);
            String totalLabel = "TOTAL";
            float labelWidth = bf.getWidthPoint(totalLabel, 8);
            canvas.setTextMatrix(centerX - labelWidth/2, centerY + 8);
            canvas.showText(totalLabel);
            canvas.endText();
            
            canvas.beginText();
            canvas.setFontAndSize(bf, 11);
            canvas.setColorFill(BaseColor.DARK_GRAY);
            String totalText = "$" + formatAmount(totalExpenses);
            float textWidth = bf.getWidthPoint(totalText, 11);
            canvas.setTextMatrix(centerX - textWidth/2, centerY - 6);
            canvas.showText(totalText);
            canvas.endText();
        } catch (Exception e) {
            // Ignore font errors
        }
        
        // Create space for the pie chart
        Paragraph spacer = new Paragraph();
        spacer.setSpacingAfter(100);
        document.add(spacer);
        
        // Add legend below the pie chart
        PdfPTable legendTable = new PdfPTable(4);
        legendTable.setWidthPercentage(100);
        legendTable.setWidths(new float[]{5, 30, 35, 30});
        legendTable.setSpacingBefore(10);
        
        colorIndex = 0;
        for (Map.Entry<String, BigDecimal> entry : sortedCategories) {
            if (colorIndex >= 10) break;
            
            BaseColor color = CHART_COLORS[colorIndex % CHART_COLORS.length];
            BigDecimal percentage = entry.getValue().multiply(BigDecimal.valueOf(100))
                .divide(finalTotalExpenses, 1, RoundingMode.HALF_UP);
            
            // Color indicator
            PdfPCell colorCell = new PdfPCell();
            colorCell.setBackgroundColor(color);
            colorCell.setBorder(Rectangle.NO_BORDER);
            colorCell.setFixedHeight(12);
            legendTable.addCell(colorCell);
            
            // Category name
            PdfPCell nameCell = new PdfPCell(new Phrase(entry.getKey(), normalFont));
            nameCell.setBorder(Rectangle.NO_BORDER);
            nameCell.setPaddingLeft(8);
            nameCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            legendTable.addCell(nameCell);
            
            // Amount
            PdfPCell amountCell = new PdfPCell(new Phrase("$" + formatAmount(entry.getValue()), normalFont));
            amountCell.setBorder(Rectangle.NO_BORDER);
            amountCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            amountCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            legendTable.addCell(amountCell);
            
            // Percentage
            PdfPCell percCell = new PdfPCell(new Phrase(percentage + "%", 
                new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, color)));
            percCell.setBorder(Rectangle.NO_BORDER);
            percCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            percCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            legendTable.addCell(percCell);
            
            colorIndex++;
        }
        
        document.add(legendTable);
        document.add(Chunk.NEWLINE);
    }
    
    private void drawPieSlice(PdfContentByte canvas, float cx, float cy, float r, 
            float startAngle, float sweepAngle, BaseColor color) {
        canvas.setColorFill(color);
        canvas.setColorStroke(BaseColor.WHITE);
        canvas.setLineWidth(2);
        
        // Move to center
        canvas.moveTo(cx, cy);
        
        // Draw arc
        float startRad = (float) Math.toRadians(startAngle);
        float endRad = (float) Math.toRadians(startAngle + sweepAngle);
        
        // Line to start of arc
        float startX = cx + r * (float) Math.cos(startRad);
        float startY = cy + r * (float) Math.sin(startRad);
        canvas.lineTo(startX, startY);
        
        // Draw arc using bezier curves (approximation)
        int segments = Math.max(1, (int) Math.ceil(sweepAngle / 45));
        float anglePerSegment = sweepAngle / segments;
        
        float currentAngle = startAngle;
        for (int i = 0; i < segments; i++) {
            float nextAngle = currentAngle + anglePerSegment;
            float currRad = (float) Math.toRadians(currentAngle);
            float nextRad = (float) Math.toRadians(nextAngle);
            float midRad = (float) Math.toRadians(currentAngle + anglePerSegment / 2);
            
            // Calculate control point for bezier curve
            float k = (float) (4.0 / 3.0 * Math.tan(Math.toRadians(anglePerSegment / 4)));
            
            float x1 = cx + r * (float) Math.cos(currRad);
            float y1 = cy + r * (float) Math.sin(currRad);
            float x4 = cx + r * (float) Math.cos(nextRad);
            float y4 = cy + r * (float) Math.sin(nextRad);
            
            float x2 = x1 - k * r * (float) Math.sin(currRad);
            float y2 = y1 + k * r * (float) Math.cos(currRad);
            float x3 = x4 + k * r * (float) Math.sin(nextRad);
            float y3 = y4 - k * r * (float) Math.cos(nextRad);
            
            canvas.curveTo(x2, y2, x3, y3, x4, y4);
            currentAngle = nextAngle;
        }
        
        // Close path back to center
        canvas.lineTo(cx, cy);
        canvas.closePathFillStroke();
    }
    
    private void addIncomeExpenseComparison(Document document, List<Transaction> transactions,
            Font sectionFont, Font normalFont) throws DocumentException {
        
        // Calculate monthly breakdown
        Map<String, BigDecimal[]> monthlyData = new TreeMap<>();
        
        for (Transaction t : transactions) {
            if (t.getDate() == null) continue;
            
            String monthKey = t.getDate().format(DateTimeFormatter.ofPattern("yyyy-MM"));
            monthlyData.putIfAbsent(monthKey, new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
            
            if ("INCOME".equalsIgnoreCase(t.getType())) {
                monthlyData.get(monthKey)[0] = monthlyData.get(monthKey)[0].add(t.getAmount());
            } else {
                monthlyData.get(monthKey)[1] = monthlyData.get(monthKey)[1].add(t.getAmount());
            }
        }
        
        if (monthlyData.isEmpty()) return;
        
        // Section title
        Paragraph title = new Paragraph("Monthly Income vs Expenses", sectionFont);
        title.setSpacingBefore(15);
        title.setSpacingAfter(10);
        document.add(title);
        
        // Create comparison table
        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{25, 25, 25, 25});
        
        // Headers
        String[] headers = {"Month", "Income", "Expenses", "Net"};
        Font headerFont = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, BaseColor.WHITE);
        for (String header : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(header, headerFont));
            cell.setBackgroundColor(PRIMARY_COLOR);
            cell.setPadding(8);
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            table.addCell(cell);
        }
        
        // Get last 6 months of data
        List<String> recentMonths = new ArrayList<>(monthlyData.keySet());
        int startIndex = Math.max(0, recentMonths.size() - 6);
        
        boolean alternate = false;
        for (int i = startIndex; i < recentMonths.size(); i++) {
            String month = recentMonths.get(i);
            BigDecimal[] data = monthlyData.get(month);
            BigDecimal net = data[0].subtract(data[1]);
            
            BaseColor rowColor = alternate ? LIGHT_GRAY : BaseColor.WHITE;
            
            // Month
            LocalDate monthDate = LocalDate.parse(month + "-01");
            addTableCell(table, monthDate.format(DateTimeFormatter.ofPattern("MMM yyyy")), normalFont, rowColor);
            
            // Income
            PdfPCell incomeCell = new PdfPCell(new Phrase("$" + formatAmount(data[0]),
                new Font(Font.FontFamily.HELVETICA, 10, Font.NORMAL, SECONDARY_COLOR)));
            incomeCell.setBackgroundColor(rowColor);
            incomeCell.setPadding(6);
            incomeCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            table.addCell(incomeCell);
            
            // Expenses
            PdfPCell expenseCell = new PdfPCell(new Phrase("$" + formatAmount(data[1]),
                new Font(Font.FontFamily.HELVETICA, 10, Font.NORMAL, DANGER_COLOR)));
            expenseCell.setBackgroundColor(rowColor);
            expenseCell.setPadding(6);
            expenseCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            table.addCell(expenseCell);
            
            // Net
            BaseColor netColor = net.compareTo(BigDecimal.ZERO) >= 0 ? SECONDARY_COLOR : DANGER_COLOR;
            String netPrefix = net.compareTo(BigDecimal.ZERO) >= 0 ? "+" : "";
            PdfPCell netCell = new PdfPCell(new Phrase(netPrefix + "$" + formatAmount(net),
                new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, netColor)));
            netCell.setBackgroundColor(rowColor);
            netCell.setPadding(6);
            netCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            table.addCell(netCell);
            
            alternate = !alternate;
        }
        
        document.add(table);
        document.add(Chunk.NEWLINE);
    }
    
    private void addTransactionsSection(Document document, List<Transaction> transactions,
            Font sectionFont, Font headerFont, Font normalFont, Font smallFont) throws DocumentException {
        
        document.newPage();
        
        Paragraph title = new Paragraph("Transaction History", sectionFont);
        title.setSpacingAfter(15);
        document.add(title);
        
        // Recent transactions table
        PdfPTable table = new PdfPTable(6);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{15, 25, 15, 12, 18, 15});
        
        // Header
        String[] headers = {"Date", "Description", "Category", "Type", "Amount", "Method"};
        for (String header : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(header, headerFont));
            cell.setBackgroundColor(PRIMARY_COLOR);
            cell.setPadding(8);
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            table.addCell(cell);
        }
        
        // Sort by date descending
        List<Transaction> sortedTransactions = transactions.stream()
            .sorted((a, b) -> {
                if (b.getDate() == null) return -1;
                if (a.getDate() == null) return 1;
                return b.getDate().compareTo(a.getDate());
            })
            .limit(50) // Limit to most recent 50
            .collect(Collectors.toList());
        
        boolean alternate = false;
        for (Transaction t : sortedTransactions) {
            BaseColor rowColor = alternate ? LIGHT_GRAY : BaseColor.WHITE;
            
            addTableCell(table, t.getDate() != null ? 
                t.getDate().format(DateTimeFormatter.ofPattern("MMM dd, yyyy")) : "-", normalFont, rowColor);
            addTableCell(table, truncate(t.getDescription(), 25), normalFont, rowColor);
            addTableCell(table, t.getCategory() != null ? truncate(t.getCategory(), 12) : "-", normalFont, rowColor);
            
            // Type with color
            PdfPCell typeCell = new PdfPCell(new Phrase(t.getType(), 
                new Font(Font.FontFamily.HELVETICA, 9, Font.BOLD, 
                    "INCOME".equalsIgnoreCase(t.getType()) ? SECONDARY_COLOR : DANGER_COLOR)));
            typeCell.setBackgroundColor(rowColor);
            typeCell.setPadding(6);
            typeCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            table.addCell(typeCell);
            
            // Amount with sign
            String amountStr = ("INCOME".equalsIgnoreCase(t.getType()) ? "+" : "-") + 
                "$" + formatAmount(t.getAmount());
            PdfPCell amountCell = new PdfPCell(new Phrase(amountStr, 
                new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD,
                    "INCOME".equalsIgnoreCase(t.getType()) ? SECONDARY_COLOR : DANGER_COLOR)));
            amountCell.setBackgroundColor(rowColor);
            amountCell.setPadding(6);
            amountCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            table.addCell(amountCell);
            
            addTableCell(table, t.getPaymentMethod() != null ? t.getPaymentMethod() : "-", normalFont, rowColor);
            
            alternate = !alternate;
        }
        
        document.add(table);
        
        if (transactions.size() > 50) {
            Paragraph note = new Paragraph("Showing 50 most recent transactions out of " + 
                transactions.size() + " total.", smallFont);
            note.setSpacingBefore(5);
            document.add(note);
        }
    }
    
    private void addBudgetsSection(Document document, List<Budget> budgets, List<Transaction> transactions,
            Font sectionFont, Font headerFont, Font normalFont, Font boldFont) throws DocumentException {
        
        if (budgets.isEmpty()) {
            return;
        }
        
        document.newPage();
        
        Paragraph title = new Paragraph("Budget Overview", sectionFont);
        title.setSpacingAfter(15);
        document.add(title);
        
        // Calculate spending per category for current month
        Map<String, BigDecimal> spendingByCategory = new HashMap<>();
        LocalDate now = LocalDate.now();
        
        for (Transaction t : transactions) {
            if ("EXPENSE".equalsIgnoreCase(t.getType()) && t.getDate() != null) {
                LocalDate txDate = t.getDate().toLocalDate();
                if (txDate.getMonth() == now.getMonth() && txDate.getYear() == now.getYear()) {
                    spendingByCategory.merge(t.getCategory(), t.getAmount(), BigDecimal::add);
                }
            }
        }
        
        PdfPTable table = new PdfPTable(5);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{25, 18, 18, 18, 21});
        
        // Header
        String[] headers = {"Category", "Budget", "Spent", "Remaining", "Status"};
        for (String header : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(header, headerFont));
            cell.setBackgroundColor(PRIMARY_COLOR);
            cell.setPadding(8);
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            table.addCell(cell);
        }
        
        boolean alternate = false;
        for (Budget b : budgets) {
            BigDecimal spent = spendingByCategory.getOrDefault(b.getCategory(), BigDecimal.ZERO);
            BigDecimal remaining = b.getAmount().subtract(spent);
            double percentUsed = b.getAmount().compareTo(BigDecimal.ZERO) > 0 
                ? spent.multiply(BigDecimal.valueOf(100)).divide(b.getAmount(), 0, RoundingMode.HALF_UP).doubleValue()
                : 0;
            
            BaseColor rowColor = alternate ? LIGHT_GRAY : BaseColor.WHITE;
            
            addTableCell(table, b.getCategory(), boldFont, rowColor);
            addTableCell(table, "$" + formatAmount(b.getAmount()), normalFont, rowColor);
            addTableCell(table, "$" + formatAmount(spent), normalFont, rowColor);
            
            // Remaining with color
            BaseColor remainingColor = remaining.compareTo(BigDecimal.ZERO) >= 0 ? SECONDARY_COLOR : DANGER_COLOR;
            PdfPCell remCell = new PdfPCell(new Phrase("$" + formatAmount(remaining), 
                new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, remainingColor)));
            remCell.setBackgroundColor(rowColor);
            remCell.setPadding(6);
            remCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            table.addCell(remCell);
            
            // Status indicator
            String status;
            BaseColor statusColor;
            if (percentUsed >= 100) {
                status = "Over Budget";
                statusColor = DANGER_COLOR;
            } else if (percentUsed >= 80) {
                status = "Warning";
                statusColor = ACCENT_COLOR;
            } else {
                status = "On Track";
                statusColor = SECONDARY_COLOR;
            }
            
            PdfPCell statusCell = new PdfPCell(new Phrase(status, 
                new Font(Font.FontFamily.HELVETICA, 9, Font.BOLD, statusColor)));
            statusCell.setBackgroundColor(rowColor);
            statusCell.setPadding(6);
            statusCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            table.addCell(statusCell);
            
            alternate = !alternate;
        }
        
        document.add(table);
    }
    
    private void addGoalsSection(Document document, List<Goal> goals,
            Font sectionFont, Font headerFont, Font normalFont, Font boldFont) throws DocumentException {
        
        if (goals.isEmpty()) {
            return;
        }
        
        Paragraph title = new Paragraph("Savings Goals", sectionFont);
        title.setSpacingBefore(25);
        title.setSpacingAfter(15);
        document.add(title);
        
        for (Goal g : goals) {
            PdfPTable goalCard = new PdfPTable(1);
            goalCard.setWidthPercentage(100);
            goalCard.setSpacingAfter(10);
            
            PdfPCell card = new PdfPCell();
            card.setBorder(Rectangle.BOX);
            card.setBorderColor(LIGHT_GRAY);
            card.setBorderWidth(1);
            card.setPadding(12);
            
            // Goal name and category
            Paragraph goalHeader = new Paragraph();
            goalHeader.add(new Chunk(g.getGoalName(), boldFont));
            goalHeader.add(new Chunk("  •  " + g.getCategory(), 
                new Font(Font.FontFamily.HELVETICA, 9, Font.NORMAL, GRAY_COLOR)));
            card.addElement(goalHeader);
            
            // Progress calculation
            double progress = g.getTargetAmount() > 0 
                ? (g.getCurrentAmount() / g.getTargetAmount()) * 100 : 0;
            progress = Math.min(progress, 100);
            
            // Progress bar
            float filledWidth = Math.max((float) progress, 1);
            float emptyWidth = Math.max(100 - (float) progress, 1);
            
            PdfPTable progressBar = new PdfPTable(2);
            progressBar.setWidthPercentage(100);
            progressBar.setWidths(new float[]{filledWidth, emptyWidth});
            progressBar.setSpacingBefore(8);
            
            PdfPCell filledCell = new PdfPCell();
            filledCell.setBackgroundColor(progress >= 100 ? SECONDARY_COLOR : PRIMARY_COLOR);
            filledCell.setBorder(Rectangle.NO_BORDER);
            filledCell.setFixedHeight(8);
            progressBar.addCell(filledCell);
            
            PdfPCell emptyCell = new PdfPCell();
            emptyCell.setBackgroundColor(LIGHT_GRAY);
            emptyCell.setBorder(Rectangle.NO_BORDER);
            emptyCell.setFixedHeight(8);
            progressBar.addCell(emptyCell);
            
            card.addElement(progressBar);
            
            // Amount details
            Paragraph amounts = new Paragraph();
            amounts.setSpacingBefore(8);
            amounts.add(new Chunk(String.format("$%.2f", g.getCurrentAmount()), 
                new Font(Font.FontFamily.HELVETICA, 12, Font.BOLD, PRIMARY_COLOR)));
            amounts.add(new Chunk(String.format(" of $%.2f (%.0f%%)", g.getTargetAmount(), progress),
                new Font(Font.FontFamily.HELVETICA, 10, Font.NORMAL, GRAY_COLOR)));
            card.addElement(amounts);
            
            // Deadline and priority
            if (g.getDeadline() != null || g.getPriority() != null) {
                Paragraph details = new Paragraph();
                details.setSpacingBefore(5);
                if (g.getDeadline() != null) {
                    details.add(new Chunk("Deadline: " + g.getDeadline().format(
                        DateTimeFormatter.ofPattern("MMM dd, yyyy")), 
                        new Font(Font.FontFamily.HELVETICA, 9, Font.NORMAL, GRAY_COLOR)));
                }
                if (g.getPriority() != null) {
                    if (g.getDeadline() != null) details.add(new Chunk("  |  ", 
                        new Font(Font.FontFamily.HELVETICA, 9, Font.NORMAL, GRAY_COLOR)));
                    BaseColor priorityColor = "High".equalsIgnoreCase(g.getPriority()) ? DANGER_COLOR :
                        "Medium".equalsIgnoreCase(g.getPriority()) ? ACCENT_COLOR : GRAY_COLOR;
                    details.add(new Chunk("Priority: " + g.getPriority(),
                        new Font(Font.FontFamily.HELVETICA, 9, Font.BOLD, priorityColor)));
                }
                card.addElement(details);
            }
            
            goalCard.addCell(card);
            document.add(goalCard);
        }
    }
    
    private void addReportFooter(Document document, Font smallFont) throws DocumentException {
        Paragraph footer = new Paragraph();
        footer.setSpacingBefore(30);
        footer.setAlignment(Element.ALIGN_CENTER);
        footer.add(new Chunk("─────────────────────────────────────────────────────────────────", smallFont));
        footer.add(Chunk.NEWLINE);
        footer.add(new Chunk("This report was generated by BudgetWise - Your Personal Finance Assistant", smallFont));
        footer.add(Chunk.NEWLINE);
        footer.add(new Chunk("© " + LocalDate.now().getYear() + " BudgetWise. All financial data is confidential.", smallFont));
        document.add(footer);
    }
    
    private void addTableCell(PdfPTable table, String text, Font font, BaseColor bgColor) {
        PdfPCell cell = new PdfPCell(new Phrase(text != null ? text : "-", font));
        cell.setBackgroundColor(bgColor);
        cell.setPadding(6);
        table.addCell(cell);
    }
    
    private String formatAmount(BigDecimal amount) {
        if (amount == null) return "0.00";
        return String.format("%,.2f", amount.abs());
    }
    
    private String truncate(String text, int maxLength) {
        if (text == null) return "";
        return text.length() > maxLength ? text.substring(0, maxLength - 3) + "..." : text;
    }

    // ==================== CSV EXPORT ====================

    private byte[] exportToCsv(User user, Map<String, Boolean> options) throws Exception {
        StringBuilder csv = new StringBuilder();
        
        if (options.getOrDefault("transactions", false)) {
            List<Transaction> transactions = transactionRepository.findByUser(user);
            csv.append("# TRANSACTIONS\n");
            csv.append("id,description,amount,category,date,type,paymentMethod,currency\n");
            
            for (Transaction t : transactions) {
                csv.append(String.format("%d,\"%s\",%.2f,\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"\n",
                        t.getId(),
                        escapeCsv(t.getDescription()),
                        t.getAmount(),
                        escapeCsv(t.getCategory()),
                        t.getDate() != null ? t.getDate().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : "",
                        t.getType(),
                        t.getPaymentMethod() != null ? escapeCsv(t.getPaymentMethod()) : "",
                        t.getCurrency() != null ? t.getCurrency() : ""));
            }
            csv.append("\n");
        }
        
        if (options.getOrDefault("budgets", false)) {
            List<Budget> budgets = budgetRepository.findByUser(user);
            csv.append("# BUDGETS\n");
            csv.append("id,category,amount,startDate,endDate\n");
            
            for (Budget b : budgets) {
                csv.append(String.format("%d,\"%s\",%.2f,\"%s\",\"%s\"\n",
                        b.getId(),
                        escapeCsv(b.getCategory()),
                        b.getAmount(),
                        b.getStartDate(),
                        b.getEndDate()));
            }
            csv.append("\n");
        }
        
        if (options.getOrDefault("goals", false)) {
            List<Goal> goals = goalRepository.findByUser(user);
            csv.append("# GOALS\n");
            csv.append("id,goalName,category,targetAmount,currentAmount,deadline,priority,createdAt\n");
            
            for (Goal g : goals) {
                csv.append(String.format("%d,\"%s\",\"%s\",%.2f,%.2f,\"%s\",\"%s\",\"%s\"\n",
                        g.getId(),
                        escapeCsv(g.getGoalName()),
                        escapeCsv(g.getCategory()),
                        g.getTargetAmount(),
                        g.getCurrentAmount(),
                        g.getDeadline() != null ? g.getDeadline() : "",
                        g.getPriority() != null ? g.getPriority() : "",
                        g.getCreatedAt() != null ? g.getCreatedAt() : ""));
            }
        }
        
        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }
    
    private String escapeCsv(String value) {
        if (value == null) return "";
        return value.replace("\"", "\"\"");
    }

    // ==================== JSON EXPORT ====================

    private byte[] exportToJson(User user, Map<String, Boolean> options) throws Exception {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("exportDate", LocalDateTime.now().toString());
        data.put("exportedBy", user.getUsername());
        
        if (options.getOrDefault("transactions", false)) {
            List<Transaction> transactions = transactionRepository.findByUser(user);
            List<Map<String, Object>> transactionList = transactions.stream().map(t -> {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("id", t.getId());
                map.put("description", t.getDescription());
                map.put("amount", t.getAmount());
                map.put("category", t.getCategory());
                map.put("date", t.getDate() != null ? t.getDate().toString() : null);
                map.put("type", t.getType());
                map.put("paymentMethod", t.getPaymentMethod());
                map.put("currency", t.getCurrency());
                return map;
            }).collect(Collectors.toList());
            data.put("transactions", transactionList);
        }
        
        if (options.getOrDefault("budgets", false)) {
            List<Budget> budgets = budgetRepository.findByUser(user);
            List<Map<String, Object>> budgetList = budgets.stream().map(b -> {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("id", b.getId());
                map.put("category", b.getCategory());
                map.put("amount", b.getAmount());
                map.put("startDate", b.getStartDate() != null ? b.getStartDate().toString() : null);
                map.put("endDate", b.getEndDate() != null ? b.getEndDate().toString() : null);
                return map;
            }).collect(Collectors.toList());
            data.put("budgets", budgetList);
        }
        
        if (options.getOrDefault("goals", false)) {
            List<Goal> goals = goalRepository.findByUser(user);
            List<Map<String, Object>> goalList = goals.stream().map(g -> {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("id", g.getId());
                map.put("goalName", g.getGoalName());
                map.put("category", g.getCategory());
                map.put("targetAmount", g.getTargetAmount());
                map.put("currentAmount", g.getCurrentAmount());
                map.put("deadline", g.getDeadline() != null ? g.getDeadline().toString() : null);
                map.put("priority", g.getPriority());
                map.put("createdAt", g.getCreatedAt() != null ? g.getCreatedAt().toString() : null);
                return map;
            }).collect(Collectors.toList());
            data.put("goals", goalList);
        }
        
        return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(data);
    }

    // ==================== IMPORT METHODS ====================

    @Transactional
    public Map<String, Object> importData(String format, InputStream inputStream, Map<String, Boolean> options) throws Exception {
        User user = getCurrentUser();
        
        switch (format.toLowerCase()) {
            case "csv":
                return importFromCsv(user, inputStream, options);
            case "json":
                return importFromJson(user, inputStream, options);
            case "pdf":
                return importFromPdf(user, inputStream, options);
            default:
                throw new IllegalArgumentException("Unsupported import format: " + format);
        }
    }

    private Map<String, Object> importFromPdf(User user, InputStream inputStream, Map<String, Boolean> options) throws Exception {
        Map<String, Object> result = new HashMap<>();
        int transactionsImported = 0;
        int budgetsImported = 0;
        int goalsImported = 0;
        List<String> errors = new ArrayList<>();

        try {
            // Read PDF content using iText PdfReader
            PdfReader reader = new PdfReader(inputStream);
            StringBuilder textContent = new StringBuilder();
            
            for (int i = 1; i <= reader.getNumberOfPages(); i++) {
                textContent.append(com.itextpdf.text.pdf.parser.PdfTextExtractor.getTextFromPage(reader, i));
                textContent.append("\n");
            }
            reader.close();
            
            String content = textContent.toString();
            String[] lines = content.split("\n");
            
            String currentSection = "";
            boolean skipHeaderLine = false;
            
            for (String line : lines) {
                line = line.trim();
                if (line.isEmpty()) continue;
                
                // Detect sections
                if (line.toUpperCase().contains("TRANSACTION") && (line.toUpperCase().contains("HISTORY") || line.toUpperCase().contains("SUMMARY"))) {
                    currentSection = "transactions";
                    skipHeaderLine = true;
                    continue;
                } else if (line.toUpperCase().contains("BUDGET") && (line.toUpperCase().contains("OVERVIEW") || line.toUpperCase().contains("SUMMARY") || line.toUpperCase().contains("STATUS"))) {
                    currentSection = "budgets";
                    skipHeaderLine = true;
                    continue;
                } else if (line.toUpperCase().contains("GOAL") && (line.toUpperCase().contains("PROGRESS") || line.toUpperCase().contains("SAVINGS"))) {
                    currentSection = "goals";
                    skipHeaderLine = true;
                    continue;
                }
                
                // Skip table header lines
                if (skipHeaderLine && (line.toUpperCase().contains("DATE") || line.toUpperCase().contains("CATEGORY") || 
                    line.toUpperCase().contains("DESCRIPTION") || line.toUpperCase().contains("AMOUNT") ||
                    line.toUpperCase().contains("TYPE") || line.toUpperCase().contains("METHOD"))) {
                    skipHeaderLine = false;
                    continue;
                }
                skipHeaderLine = false;
                
                // Parse transaction lines - handle various formats from PDF extraction
                if (currentSection.equals("transactions") && options.getOrDefault("transactions", false)) {
                    try {
                        // PDF table extraction often produces space-separated values
                        // Look for lines with date patterns: "Jan 05, 2026", "2026-01-05", "05/01/2026"
                        if (line.matches(".*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\\s+\\d{1,2},?\\s+\\d{4}.*") ||
                            line.matches(".*\\d{4}-\\d{2}-\\d{2}.*") ||
                            line.matches(".*\\d{1,2}/\\d{1,2}/\\d{4}.*")) {
                            
                            String[] parts = line.split("\\s{2,}"); // Split by multiple spaces
                            if (parts.length >= 4) {
                                String dateStr = parts[0].trim();
                                String description = parts[1].trim();
                                String category = parts[2].trim();
                                String typeStr = parts.length > 3 ? parts[3].trim().toUpperCase() : "EXPENSE";
                                String amountStr = parts.length > 4 ? parts[4].trim().replaceAll("[^\\d.,]", "") : "0";
                                
                                // Clean up amount - remove commas, handle decimal
                                amountStr = amountStr.replace(",", "");
                                if (amountStr.isEmpty()) amountStr = "0";
                                
                                LocalDateTime date = parseFlexibleDate(dateStr);
                                BigDecimal amount = new BigDecimal(amountStr);
                                
                                // Determine type from the parsed text or default
                                String type = typeStr.contains("INCOME") ? "INCOME" : "EXPENSE";
                                
                                if (amount.compareTo(BigDecimal.ZERO) > 0 && !description.isEmpty()) {
                                    Transaction transaction = Transaction.builder()
                                            .description(description)
                                            .amount(amount.abs())
                                            .category(category)
                                            .date(date != null ? date : LocalDateTime.now())
                                            .type(type)
                                            .currency("INR")
                                            .user(user)
                                            .build();
                                    transactionRepository.save(transaction);
                                    transactionsImported++;
                                }
                            }
                        }
                    } catch (Exception e) {
                        // Skip invalid lines silently
                    }
                }
                
                // Parse budget lines
                if (currentSection.equals("budgets") && options.getOrDefault("budgets", false)) {
                    try {
                        // Skip header-like lines
                        if (line.toUpperCase().contains("CATEGORY") || line.toUpperCase().contains("BUDGET") || 
                            line.toUpperCase().contains("SPENT") || line.toUpperCase().contains("REMAINING")) {
                            continue;
                        }
                        
                        // Look for budget data: Category  Amount  Spent  Remaining
                        String[] parts = line.split("\\s{2,}");
                        if (parts.length >= 2) {
                            String category = parts[0].trim();
                            String amountStr = parts[1].trim().replaceAll("[^\\d.,]", "").replace(",", "");
                            
                            if (!category.isEmpty() && !amountStr.isEmpty() && amountStr.matches("\\d+\\.?\\d*")) {
                                BigDecimal amount = new BigDecimal(amountStr);
                                if (amount.compareTo(BigDecimal.ZERO) > 0) {
                                    Budget budget = Budget.builder()
                                            .category(category)
                                            .amount(amount)
                                            .startDate(LocalDate.now().withDayOfMonth(1))
                                            .endDate(LocalDate.now().withDayOfMonth(1).plusMonths(1).minusDays(1))
                                            .user(user)
                                            .build();
                                    budgetRepository.save(budget);
                                    budgetsImported++;
                                }
                            }
                        }
                    } catch (Exception e) {
                        // Skip invalid lines silently
                    }
                }
                
                // Parse goal lines
                if (currentSection.equals("goals") && options.getOrDefault("goals", false)) {
                    try {
                        // Skip header-like lines
                        if (line.toUpperCase().contains("GOAL NAME") || line.toUpperCase().contains("TARGET") || 
                            line.toUpperCase().contains("PROGRESS") || line.toUpperCase().contains("DEADLINE")) {
                            continue;
                        }
                        
                        String[] parts = line.split("\\s{2,}");
                        if (parts.length >= 2) {
                            String goalName = parts[0].trim();
                            String targetStr = parts[1].trim().replaceAll("[^\\d.,]", "").replace(",", "");
                            String currentStr = parts.length > 2 ? parts[2].trim().replaceAll("[^\\d.,]", "").replace(",", "") : "0";
                            
                            if (!goalName.isEmpty() && !targetStr.isEmpty() && targetStr.matches("\\d+\\.?\\d*") &&
                                !goalName.toUpperCase().contains("GOAL") && !goalName.toUpperCase().contains("NAME")) {
                                Double target = Double.parseDouble(targetStr);
                                Double current = currentStr.isEmpty() || !currentStr.matches("\\d+\\.?\\d*") ? 0.0 : Double.parseDouble(currentStr);
                                
                                if (target > 0) {
                                    Goal goal = Goal.builder()
                                            .goalName(goalName)
                                            .category("Savings")
                                            .targetAmount(target)
                                            .currentAmount(current)
                                            .deadline(LocalDate.now().plusMonths(6))
                                            .priority("Medium")
                                            .createdAt(LocalDate.now())
                                            .user(user)
                                            .build();
                                    goalRepository.save(goal);
                                    goalsImported++;
                                }
                            }
                        }
                    } catch (Exception e) {
                        // Skip invalid lines silently
                    }
                }
            }
            
            // Provide helpful message if nothing was imported
            if (transactionsImported == 0 && budgetsImported == 0 && goalsImported == 0) {
                result.put("success", true);
                result.put("message", "PDF was read successfully but no data could be extracted. " +
                        "Note: PDF import works best with BudgetWise exported PDFs. " +
                        "For best results, use JSON or CSV format for importing data.");
            } else {
                result.put("success", true);
                result.put("message", String.format("PDF import completed! Imported %d transactions, %d budgets, %d goals.", 
                        transactionsImported, budgetsImported, goalsImported));
            }
            result.put("transactionsImported", transactionsImported);
            result.put("budgetsImported", budgetsImported);
            result.put("goalsImported", goalsImported);
            if (!errors.isEmpty()) {
                result.put("warnings", errors);
            }
            
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Failed to parse PDF file. Please ensure it's a valid BudgetWise export file. For best results, use JSON or CSV format.");
            result.put("error", e.getMessage());
        }
        
        return result;
    }

    private LocalDateTime parseFlexibleDate(String dateStr) {
        String[] formats = {
            "yyyy-MM-dd HH:mm:ss",
            "yyyy-MM-dd HH:mm",
            "yyyy-MM-dd",
            "dd/MM/yyyy",
            "MM/dd/yyyy",
            "dd-MM-yyyy",
            "MMM dd, yyyy"
        };
        
        for (String format : formats) {
            try {
                if (format.contains("HH")) {
                    return LocalDateTime.parse(dateStr, DateTimeFormatter.ofPattern(format));
                } else {
                    return LocalDate.parse(dateStr, DateTimeFormatter.ofPattern(format)).atStartOfDay();
                }
            } catch (Exception e) {
                // Try next format
            }
        }
        return LocalDateTime.now();
    }

    private Map<String, Object> importFromJson(User user, InputStream inputStream, Map<String, Boolean> options) throws Exception {
        Map<String, Object> result = new HashMap<>();
        int transactionsImported = 0;
        int budgetsImported = 0;
        int goalsImported = 0;
        List<String> errors = new ArrayList<>();
        
        try {
            String jsonContent = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))
                    .lines().collect(Collectors.joining("\n"));
            
            JsonNode rootNode = objectMapper.readTree(jsonContent);
            
            // Import transactions
            if (options.getOrDefault("transactions", false) && rootNode.has("transactions")) {
                JsonNode transactionsNode = rootNode.get("transactions");
                if (transactionsNode.isArray()) {
                    for (JsonNode tNode : transactionsNode) {
                        try {
                            Transaction transaction = Transaction.builder()
                                    .description(getTextValue(tNode, "description", "Imported transaction"))
                                    .amount(getBigDecimalValue(tNode, "amount"))
                                    .category(getTextValue(tNode, "category", "Other"))
                                    .date(parseDateTimeValue(tNode, "date"))
                                    .type(getTextValue(tNode, "type", "EXPENSE"))
                                    .paymentMethod(getTextValue(tNode, "paymentMethod", null))
                                    .currency(getTextValue(tNode, "currency", "USD"))
                                    .user(user)
                                    .build();
                            transactionRepository.save(transaction);
                            transactionsImported++;
                        } catch (Exception e) {
                            errors.add("Transaction import error: " + e.getMessage());
                        }
                    }
                }
            }
            
            // Import budgets
            if (options.getOrDefault("budgets", false) && rootNode.has("budgets")) {
                JsonNode budgetsNode = rootNode.get("budgets");
                if (budgetsNode.isArray()) {
                    for (JsonNode bNode : budgetsNode) {
                        try {
                            Budget budget = Budget.builder()
                                    .category(getTextValue(bNode, "category", "Other"))
                                    .amount(getBigDecimalValue(bNode, "amount"))
                                    .startDate(parseDateValue(bNode, "startDate"))
                                    .endDate(parseDateValue(bNode, "endDate"))
                                    .user(user)
                                    .build();
                            budgetRepository.save(budget);
                            budgetsImported++;
                        } catch (Exception e) {
                            errors.add("Budget import error: " + e.getMessage());
                        }
                    }
                }
            }
            
            // Import goals
            if (options.getOrDefault("goals", false) && rootNode.has("goals")) {
                JsonNode goalsNode = rootNode.get("goals");
                if (goalsNode.isArray()) {
                    for (JsonNode gNode : goalsNode) {
                        try {
                            Goal goal = Goal.builder()
                                    .goalName(getTextValue(gNode, "goalName", "Imported Goal"))
                                    .category(getTextValue(gNode, "category", "Other"))
                                    .targetAmount(getDoubleValue(gNode, "targetAmount"))
                                    .currentAmount(getDoubleValue(gNode, "currentAmount"))
                                    .deadline(parseDateValue(gNode, "deadline"))
                                    .priority(getTextValue(gNode, "priority", "Medium"))
                                    .createdAt(parseDateValue(gNode, "createdAt") != null ? parseDateValue(gNode, "createdAt") : LocalDate.now())
                                    .user(user)
                                    .build();
                            goalRepository.save(goal);
                            goalsImported++;
                        } catch (Exception e) {
                            errors.add("Goal import error: " + e.getMessage());
                        }
                    }
                }
            }
            
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Failed to parse JSON file: " + e.getMessage());
            return result;
        }
        
        result.put("success", true);
        result.put("message", String.format("Import completed. Transactions: %d, Budgets: %d, Goals: %d",
                transactionsImported, budgetsImported, goalsImported));
        result.put("transactionsImported", transactionsImported);
        result.put("budgetsImported", budgetsImported);
        result.put("goalsImported", goalsImported);
        
        if (!errors.isEmpty()) {
            result.put("warnings", errors);
        }
        
        return result;
    }

    private Map<String, Object> importFromCsv(User user, InputStream inputStream, Map<String, Boolean> options) throws Exception {
        Map<String, Object> result = new HashMap<>();
        int transactionsImported = 0;
        int budgetsImported = 0;
        int goalsImported = 0;
        List<String> errors = new ArrayList<>();
        
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            String line;
            String currentSection = null;
            String[] headers = null;
            
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                
                if (line.isEmpty()) {
                    continue;
                }
                
                // Detect section
                if (line.startsWith("# TRANSACTIONS")) {
                    currentSection = "transactions";
                    headers = null;
                    continue;
                } else if (line.startsWith("# BUDGETS")) {
                    currentSection = "budgets";
                    headers = null;
                    continue;
                } else if (line.startsWith("# GOALS")) {
                    currentSection = "goals";
                    headers = null;
                    continue;
                }
                
                // Skip comment lines
                if (line.startsWith("#")) {
                    continue;
                }
                
                // Parse header line
                if (headers == null) {
                    headers = parseCsvLine(line);
                    continue;
                }
                
                // Parse data line
                String[] values = parseCsvLine(line);
                
                if (currentSection == null) {
                    // Try to auto-detect based on headers
                    if (headers.length > 0) {
                        if (containsHeader(headers, "description") && containsHeader(headers, "type")) {
                            currentSection = "transactions";
                        } else if (containsHeader(headers, "startDate") && containsHeader(headers, "endDate")) {
                            currentSection = "budgets";
                        } else if (containsHeader(headers, "goalName") || containsHeader(headers, "targetAmount")) {
                            currentSection = "goals";
                        }
                    }
                }
                
                try {
                    if ("transactions".equals(currentSection) && options.getOrDefault("transactions", false)) {
                        Transaction transaction = parseTransactionFromCsv(headers, values, user);
                        if (transaction != null) {
                            transactionRepository.save(transaction);
                            transactionsImported++;
                        }
                    } else if ("budgets".equals(currentSection) && options.getOrDefault("budgets", false)) {
                        Budget budget = parseBudgetFromCsv(headers, values, user);
                        if (budget != null) {
                            budgetRepository.save(budget);
                            budgetsImported++;
                        }
                    } else if ("goals".equals(currentSection) && options.getOrDefault("goals", false)) {
                        Goal goal = parseGoalFromCsv(headers, values, user);
                        if (goal != null) {
                            goalRepository.save(goal);
                            goalsImported++;
                        }
                    }
                } catch (Exception e) {
                    errors.add("CSV line parse error: " + e.getMessage());
                }
            }
        }
        
        result.put("success", true);
        result.put("message", String.format("Import completed. Transactions: %d, Budgets: %d, Goals: %d",
                transactionsImported, budgetsImported, goalsImported));
        result.put("transactionsImported", transactionsImported);
        result.put("budgetsImported", budgetsImported);
        result.put("goalsImported", goalsImported);
        
        if (!errors.isEmpty()) {
            result.put("warnings", errors);
        }
        
        return result;
    }
    
    private boolean containsHeader(String[] headers, String headerName) {
        for (String h : headers) {
            if (h.equalsIgnoreCase(headerName)) {
                return true;
            }
        }
        return false;
    }

    private String[] parseCsvLine(String line) {
        List<String> result = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;
        
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            
            if (c == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    current.append('"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c == ',' && !inQuotes) {
                result.add(current.toString().trim());
                current = new StringBuilder();
            } else {
                current.append(c);
            }
        }
        result.add(current.toString().trim());
        
        return result.toArray(new String[0]);
    }

    private Transaction parseTransactionFromCsv(String[] headers, String[] values, User user) {
        Map<String, String> row = new HashMap<>();
        for (int i = 0; i < headers.length && i < values.length; i++) {
            row.put(headers[i].toLowerCase().trim(), values[i]);
        }
        
        return Transaction.builder()
                .description(row.getOrDefault("description", "Imported"))
                .amount(new BigDecimal(row.getOrDefault("amount", "0")))
                .category(row.getOrDefault("category", "Other"))
                .date(parseDateTime(row.get("date")))
                .type(row.getOrDefault("type", "EXPENSE").toUpperCase())
                .paymentMethod(row.get("paymentmethod"))
                .currency(row.getOrDefault("currency", "USD"))
                .user(user)
                .build();
    }

    private Budget parseBudgetFromCsv(String[] headers, String[] values, User user) {
        Map<String, String> row = new HashMap<>();
        for (int i = 0; i < headers.length && i < values.length; i++) {
            row.put(headers[i].toLowerCase().trim(), values[i]);
        }
        
        return Budget.builder()
                .category(row.getOrDefault("category", "Other"))
                .amount(new BigDecimal(row.getOrDefault("amount", "0")))
                .startDate(parseDate(row.get("startdate")))
                .endDate(parseDate(row.get("enddate")))
                .user(user)
                .build();
    }

    private Goal parseGoalFromCsv(String[] headers, String[] values, User user) {
        Map<String, String> row = new HashMap<>();
        for (int i = 0; i < headers.length && i < values.length; i++) {
            row.put(headers[i].toLowerCase().trim(), values[i]);
        }
        
        return Goal.builder()
                .goalName(row.getOrDefault("goalname", "Imported Goal"))
                .category(row.getOrDefault("category", "Other"))
                .targetAmount(Double.parseDouble(row.getOrDefault("targetamount", "0")))
                .currentAmount(Double.parseDouble(row.getOrDefault("currentamount", "0")))
                .deadline(parseDate(row.get("deadline")))
                .priority(row.getOrDefault("priority", "Medium"))
                .createdAt(parseDate(row.get("createdat")) != null ? parseDate(row.get("createdat")) : LocalDate.now())
                .user(user)
                .build();
    }

    // Helper methods for JSON parsing
    private String getTextValue(JsonNode node, String field, String defaultValue) {
        if (node.has(field) && !node.get(field).isNull()) {
            return node.get(field).asText();
        }
        return defaultValue;
    }

    private BigDecimal getBigDecimalValue(JsonNode node, String field) {
        if (node.has(field) && !node.get(field).isNull()) {
            return new BigDecimal(node.get(field).asText());
        }
        return BigDecimal.ZERO;
    }

    private Double getDoubleValue(JsonNode node, String field) {
        if (node.has(field) && !node.get(field).isNull()) {
            return node.get(field).asDouble();
        }
        return 0.0;
    }

    private LocalDateTime parseDateTimeValue(JsonNode node, String field) {
        if (node.has(field) && !node.get(field).isNull()) {
            return parseDateTime(node.get(field).asText());
        }
        return LocalDateTime.now();
    }

    private LocalDate parseDateValue(JsonNode node, String field) {
        if (node.has(field) && !node.get(field).isNull()) {
            return parseDate(node.get(field).asText());
        }
        return null;
    }

    private LocalDateTime parseDateTime(String dateStr) {
        if (dateStr == null || dateStr.isEmpty()) {
            return LocalDateTime.now();
        }
        
        // Try multiple formats
        List<DateTimeFormatter> formatters = Arrays.asList(
                DateTimeFormatter.ISO_LOCAL_DATE_TIME,
                DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"),
                DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"),
                DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm"),
                DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm:ss"),
                DateTimeFormatter.ofPattern("MM/dd/yyyy HH:mm:ss")
        );
        
        for (DateTimeFormatter formatter : formatters) {
            try {
                return LocalDateTime.parse(dateStr, formatter);
            } catch (DateTimeParseException ignored) {
            }
        }
        
        // Try parsing as date only
        LocalDate date = parseDate(dateStr);
        if (date != null) {
            return date.atStartOfDay();
        }
        
        return LocalDateTime.now();
    }

    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isEmpty()) {
            return null;
        }
        
        List<DateTimeFormatter> formatters = Arrays.asList(
                DateTimeFormatter.ISO_LOCAL_DATE,
                DateTimeFormatter.ofPattern("yyyy-MM-dd"),
                DateTimeFormatter.ofPattern("dd-MM-yyyy"),
                DateTimeFormatter.ofPattern("MM/dd/yyyy"),
                DateTimeFormatter.ofPattern("dd/MM/yyyy")
        );
        
        for (DateTimeFormatter formatter : formatters) {
            try {
                return LocalDate.parse(dateStr, formatter);
            } catch (DateTimeParseException ignored) {
            }
        }
        
        return null;
    }
}
