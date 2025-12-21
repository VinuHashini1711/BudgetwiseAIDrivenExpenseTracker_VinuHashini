package com.budgetwise.service;

import com.budgetwise.model.Transaction;
import com.budgetwise.model.Budget;
import com.budgetwise.model.Goal;
import com.budgetwise.model.User;
import com.budgetwise.repository.TransactionRepository;
import com.budgetwise.repository.BudgetRepository;
import com.budgetwise.repository.GoalRepository;
import com.budgetwise.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import com.opencsv.CSVReader;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.InputStreamReader;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExportImportService {

    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;
    private final GoalRepository goalRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public byte[] exportData(String format, Map<String, Boolean> options) {
        try {
            User currentUser = getCurrentUser();
            
            Map<String, Object> data = new HashMap<>();
            
            if (options.getOrDefault("transactions", true)) {
                List<Transaction> transactions = transactionRepository.findByUser(currentUser);
                data.put("transactions", transactions);
            }
            
            if (options.getOrDefault("budgets", true)) {
                List<Budget> budgets = budgetRepository.findByUser(currentUser);
                data.put("budgets", budgets);
            }
            
            if (options.getOrDefault("goals", true)) {
                List<Goal> goals = goalRepository.findByUser(currentUser);
                data.put("goals", goals);
            }
            
            data.put("exportDate", LocalDateTime.now().toString());
            data.put("userName", currentUser.getUsername());
            
            switch (format.toLowerCase()) {
                case "json":
                    return exportAsJson(data);
                case "csv":
                    return exportAsCsv(data);
                case "pdf":
                    return exportAsPdf(data);
                default:
                    throw new IllegalArgumentException("Unsupported format: " + format);
            }
        } catch (Exception e) {
            log.error("Export failed: ", e);
            throw new RuntimeException("Export failed: " + e.getMessage());
        }
    }

    private byte[] exportAsJson(Map<String, Object> data) throws Exception {
        return objectMapper.writerWithDefaultPrettyPrinter()
                .writeValueAsBytes(data);
    }

    private byte[] exportAsCsv(Map<String, Object> data) throws Exception {
        StringBuilder csv = new StringBuilder();
        
        // Add header with export info
        csv.append("BudgetWise Data Export\n");
        csv.append("Export Date,").append(data.get("exportDate")).append("\n");
        csv.append("User,").append(data.get("userName")).append("\n\n");
        
        // Export Transactions
        if (data.containsKey("transactions")) {
            csv.append("TRANSACTIONS\n");
            csv.append("Date,Description,Type,Category,Amount,Currency,PaymentMethod\n");
            @SuppressWarnings("unchecked")
            List<Transaction> transactions = (List<Transaction>) data.get("transactions");
            for (Transaction t : transactions) {
                csv.append(escapeCsv(t.getDate().toString())).append(",")
                   .append(escapeCsv(t.getDescription())).append(",")
                   .append(escapeCsv(t.getType())).append(",")
                   .append(escapeCsv(t.getCategory())).append(",")
                   .append(t.getAmount()).append(",")
                   .append(escapeCsv(t.getCurrency())).append(",")
                   .append(escapeCsv(t.getPaymentMethod())).append("\n");
            }
            csv.append("\n");
        }
        
        // Export Budgets
        if (data.containsKey("budgets")) {
            csv.append("BUDGETS\n");
            csv.append("Category,Amount,StartDate,EndDate\n");
            @SuppressWarnings("unchecked")
            List<Budget> budgets = (List<Budget>) data.get("budgets");
            for (Budget b : budgets) {
                csv.append(escapeCsv(b.getCategory())).append(",")
                   .append(b.getAmount()).append(",")
                   .append(b.getStartDate()).append(",")
                   .append(b.getEndDate()).append("\n");
            }
            csv.append("\n");
        }
        
        // Export Goals
        if (data.containsKey("goals")) {
            csv.append("GOALS\n");
            csv.append("GoalName,Category,TargetAmount,CurrentAmount,Deadline,Priority\n");
            @SuppressWarnings("unchecked")
            List<Goal> goals = (List<Goal>) data.get("goals");
            for (Goal g : goals) {
                csv.append(escapeCsv(g.getGoalName())).append(",")
                   .append(escapeCsv(g.getCategory())).append(",")
                   .append(g.getTargetAmount()).append(",")
                   .append(g.getCurrentAmount()).append(",")
                   .append(g.getDeadline()).append(",")
                   .append(escapeCsv(g.getPriority())).append("\n");
            }
        }
        
        return csv.toString().getBytes();
    }

    private byte[] exportAsPdf(Map<String, Object> data) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 40, 40, 50, 50);
        PdfWriter writer = PdfWriter.getInstance(document, baos);
        document.open();
        
        // Define colors
        BaseColor primaryPurple = new BaseColor(139, 92, 246);
        BaseColor darkPurple = new BaseColor(109, 40, 217);
        BaseColor lightPurple = new BaseColor(233, 213, 255);
        BaseColor incomeGreen = new BaseColor(16, 185, 129);
        BaseColor expenseRed = new BaseColor(239, 68, 68);
        BaseColor headerBg = new BaseColor(46, 16, 101);
        BaseColor lightGray = new BaseColor(243, 244, 246);
        
        // Define fonts
        Font titleFont = new Font(Font.FontFamily.HELVETICA, 28, Font.BOLD, BaseColor.WHITE);
        Font subtitleFont = new Font(Font.FontFamily.HELVETICA, 12, Font.NORMAL, BaseColor.WHITE);
        Font sectionFont = new Font(Font.FontFamily.HELVETICA, 16, Font.BOLD, primaryPurple);
        Font headerFont = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, BaseColor.WHITE);
        Font normalFont = new Font(Font.FontFamily.HELVETICA, 10, Font.NORMAL, BaseColor.DARK_GRAY);
        Font boldFont = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, BaseColor.DARK_GRAY);
        Font incomeFont = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, incomeGreen);
        Font expenseFont = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, expenseRed);
        Font summaryTitleFont = new Font(Font.FontFamily.HELVETICA, 14, Font.BOLD, BaseColor.WHITE);
        Font summaryValueFont = new Font(Font.FontFamily.HELVETICA, 20, Font.BOLD, BaseColor.WHITE);
        
        // ===== HEADER SECTION =====
        PdfPTable headerTable = new PdfPTable(1);
        headerTable.setWidthPercentage(100);
        
        PdfPCell headerCell = new PdfPCell();
        headerCell.setBackgroundColor(headerBg);
        headerCell.setPadding(25);
        headerCell.setBorder(Rectangle.NO_BORDER);
        
        Paragraph titlePara = new Paragraph();
        titlePara.add(new Chunk("BudgetWise", titleFont));
        titlePara.add(new Chunk("\n"));
        titlePara.add(new Chunk("Financial Report", new Font(Font.FontFamily.HELVETICA, 18, Font.NORMAL, lightPurple)));
        titlePara.setAlignment(Element.ALIGN_CENTER);
        headerCell.addElement(titlePara);
        
        String exportDate = LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy 'at' HH:mm"));
        Paragraph datePara = new Paragraph("\nGenerated on " + exportDate + " for " + data.get("userName"), subtitleFont);
        datePara.setAlignment(Element.ALIGN_CENTER);
        headerCell.addElement(datePara);
        
        headerTable.addCell(headerCell);
        document.add(headerTable);
        document.add(new Paragraph("\n"));
        
        // ===== SUMMARY SECTION =====
        @SuppressWarnings("unchecked")
        List<Transaction> transactions = data.containsKey("transactions") ? 
            (List<Transaction>) data.get("transactions") : new ArrayList<>();
        @SuppressWarnings("unchecked")
        List<Budget> budgets = data.containsKey("budgets") ? 
            (List<Budget>) data.get("budgets") : new ArrayList<>();
        @SuppressWarnings("unchecked")
        List<Goal> goals = data.containsKey("goals") ? 
            (List<Goal>) data.get("goals") : new ArrayList<>();
        
        double totalIncome = transactions.stream()
            .filter(t -> "income".equalsIgnoreCase(t.getType()))
            .mapToDouble(Transaction::getAmount)
            .sum();
        double totalExpenses = transactions.stream()
            .filter(t -> "expense".equalsIgnoreCase(t.getType()))
            .mapToDouble(Transaction::getAmount)
            .sum();
        double balance = totalIncome - totalExpenses;
        
        // Summary Cards
        PdfPTable summaryTable = new PdfPTable(3);
        summaryTable.setWidthPercentage(100);
        summaryTable.setSpacingBefore(10);
        summaryTable.setSpacingAfter(20);
        
        // Income Card
        PdfPCell incomeCard = createSummaryCard("Total Income", String.format("₹%.2f", totalIncome), incomeGreen, summaryTitleFont, summaryValueFont);
        summaryTable.addCell(incomeCard);
        
        // Expenses Card
        PdfPCell expenseCard = createSummaryCard("Total Expenses", String.format("₹%.2f", totalExpenses), expenseRed, summaryTitleFont, summaryValueFont);
        summaryTable.addCell(expenseCard);
        
        // Balance Card
        BaseColor balanceColor = balance >= 0 ? incomeGreen : expenseRed;
        PdfPCell balanceCard = createSummaryCard("Net Balance", String.format("₹%.2f", balance), balanceColor, summaryTitleFont, summaryValueFont);
        summaryTable.addCell(balanceCard);
        
        document.add(summaryTable);
        
        // ===== SPENDING BY CATEGORY (Bar Chart Representation) =====
        if (!transactions.isEmpty()) {
            document.add(createSectionHeader("📊 Spending Analysis by Category", sectionFont, primaryPurple));
            document.add(new Paragraph("\n"));
            
            // Calculate category totals for expenses
            Map<String, Double> categoryTotals = new HashMap<>();
            for (Transaction t : transactions) {
                if ("expense".equalsIgnoreCase(t.getType())) {
                    categoryTotals.merge(t.getCategory(), t.getAmount(), Double::sum);
                }
            }
            
            if (!categoryTotals.isEmpty()) {
                double maxAmount = categoryTotals.values().stream().mapToDouble(Double::doubleValue).max().orElse(1);
                
                PdfPTable chartTable = new PdfPTable(3);
                chartTable.setWidthPercentage(100);
                chartTable.setWidths(new float[]{25, 55, 20});
                
                for (Map.Entry<String, Double> entry : categoryTotals.entrySet()) {
                    // Category name
                    PdfPCell catCell = new PdfPCell(new Phrase(entry.getKey(), boldFont));
                    catCell.setBorder(Rectangle.NO_BORDER);
                    catCell.setPadding(8);
                    catCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
                    chartTable.addCell(catCell);
                    
                    // Bar
                    PdfPCell barCell = new PdfPCell();
                    barCell.setBorder(Rectangle.NO_BORDER);
                    barCell.setPadding(8);
                    
                    float barWidth = (float) (entry.getValue() / maxAmount * 100);
                    PdfPTable barTable = new PdfPTable(2);
                    barTable.setWidthPercentage(100);
                    barTable.setWidths(new float[]{barWidth, 100 - barWidth});
                    
                    PdfPCell filledBar = new PdfPCell();
                    filledBar.setBackgroundColor(primaryPurple);
                    filledBar.setBorder(Rectangle.NO_BORDER);
                    filledBar.setFixedHeight(20);
                    barTable.addCell(filledBar);
                    
                    PdfPCell emptyBar = new PdfPCell();
                    emptyBar.setBackgroundColor(lightGray);
                    emptyBar.setBorder(Rectangle.NO_BORDER);
                    emptyBar.setFixedHeight(20);
                    barTable.addCell(emptyBar);
                    
                    barCell.addElement(barTable);
                    chartTable.addCell(barCell);
                    
                    // Amount
                    PdfPCell amountCell = new PdfPCell(new Phrase(String.format("₹%.2f", entry.getValue()), normalFont));
                    amountCell.setBorder(Rectangle.NO_BORDER);
                    amountCell.setPadding(8);
                    amountCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                    amountCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
                    chartTable.addCell(amountCell);
                }
                
                document.add(chartTable);
            }
            document.add(new Paragraph("\n"));
        }
        
        // ===== TRANSACTIONS TABLE =====
        if (data.containsKey("transactions") && !transactions.isEmpty()) {
            document.add(createSectionHeader("💳 Transaction History", sectionFont, primaryPurple));
            document.add(new Paragraph("\n"));
            
            PdfPTable transTable = new PdfPTable(5);
            transTable.setWidthPercentage(100);
            transTable.setWidths(new float[]{20, 25, 15, 20, 20});
            
            // Table headers
            String[] transHeaders = {"Date", "Description", "Type", "Category", "Amount"};
            for (String header : transHeaders) {
                PdfPCell cell = new PdfPCell(new Phrase(header, headerFont));
                cell.setBackgroundColor(primaryPurple);
                cell.setPadding(10);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setBorderColor(primaryPurple);
                transTable.addCell(cell);
            }
            
            // Table rows
            boolean alternate = false;
            for (Transaction t : transactions) {
                BaseColor rowColor = alternate ? lightGray : BaseColor.WHITE;
                
                addTableCell(transTable, t.getDate().toString(), normalFont, rowColor);
                addTableCell(transTable, t.getDescription(), normalFont, rowColor);
                addTableCell(transTable, t.getType(), normalFont, rowColor);
                addTableCell(transTable, t.getCategory(), normalFont, rowColor);
                
                Font amtFont = "income".equalsIgnoreCase(t.getType()) ? incomeFont : expenseFont;
                String amtPrefix = "income".equalsIgnoreCase(t.getType()) ? "+" : "-";
                PdfPCell amtCell = new PdfPCell(new Phrase(amtPrefix + "₹" + t.getAmount(), amtFont));
                amtCell.setBackgroundColor(rowColor);
                amtCell.setPadding(8);
                amtCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                amtCell.setBorderColor(lightGray);
                transTable.addCell(amtCell);
                
                alternate = !alternate;
            }
            
            document.add(transTable);
            document.add(new Paragraph("\n"));
        }
        
        // ===== BUDGETS TABLE =====
        if (data.containsKey("budgets") && !budgets.isEmpty()) {
            document.add(createSectionHeader("💰 Budget Overview", sectionFont, primaryPurple));
            document.add(new Paragraph("\n"));
            
            PdfPTable budgetTable = new PdfPTable(4);
            budgetTable.setWidthPercentage(100);
            budgetTable.setWidths(new float[]{30, 25, 25, 20});
            
            String[] budgetHeaders = {"Category", "Budget Amount", "Period", "Status"};
            for (String header : budgetHeaders) {
                PdfPCell cell = new PdfPCell(new Phrase(header, headerFont));
                cell.setBackgroundColor(primaryPurple);
                cell.setPadding(10);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setBorderColor(primaryPurple);
                budgetTable.addCell(cell);
            }
            
            boolean alternate = false;
            for (Budget b : budgets) {
                BaseColor rowColor = alternate ? lightGray : BaseColor.WHITE;
                
                addTableCell(budgetTable, b.getCategory(), normalFont, rowColor);
                addTableCell(budgetTable, "₹" + b.getAmount(), boldFont, rowColor);
                addTableCell(budgetTable, b.getStartDate() + " to " + b.getEndDate(), normalFont, rowColor);
                
                // Calculate spent amount for this budget category
                double spent = transactions.stream()
                    .filter(t -> "expense".equalsIgnoreCase(t.getType()) && b.getCategory().equalsIgnoreCase(t.getCategory()))
                    .mapToDouble(Transaction::getAmount)
                    .sum();
                double percentage = b.getAmount() > 0 ? (spent / b.getAmount()) * 100 : 0;
                
                String status = percentage < 50 ? "🟢 On Track" : percentage < 80 ? "🟡 Warning" : "🔴 Over Budget";
                PdfPCell statusCell = new PdfPCell(new Phrase(String.format("%.0f%% - %s", percentage, status), normalFont));
                statusCell.setBackgroundColor(rowColor);
                statusCell.setPadding(8);
                statusCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                statusCell.setBorderColor(lightGray);
                budgetTable.addCell(statusCell);
                
                alternate = !alternate;
            }
            
            document.add(budgetTable);
            document.add(new Paragraph("\n"));
        }
        
        // ===== GOALS TABLE =====
        if (data.containsKey("goals") && !goals.isEmpty()) {
            document.add(createSectionHeader("🎯 Financial Goals", sectionFont, primaryPurple));
            document.add(new Paragraph("\n"));
            
            PdfPTable goalsTable = new PdfPTable(5);
            goalsTable.setWidthPercentage(100);
            goalsTable.setWidths(new float[]{25, 20, 20, 15, 20});
            
            String[] goalHeaders = {"Goal Name", "Target", "Current", "Priority", "Progress"};
            for (String header : goalHeaders) {
                PdfPCell cell = new PdfPCell(new Phrase(header, headerFont));
                cell.setBackgroundColor(primaryPurple);
                cell.setPadding(10);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setBorderColor(primaryPurple);
                goalsTable.addCell(cell);
            }
            
            boolean alternate = false;
            for (Goal g : goals) {
                BaseColor rowColor = alternate ? lightGray : BaseColor.WHITE;
                
                addTableCell(goalsTable, g.getGoalName(), boldFont, rowColor);
                addTableCell(goalsTable, "₹" + g.getTargetAmount(), normalFont, rowColor);
                addTableCell(goalsTable, "₹" + g.getCurrentAmount(), normalFont, rowColor);
                
                // Priority with color indicator
                String priorityEmoji = "HIGH".equalsIgnoreCase(g.getPriority()) ? "🔴" : 
                                       "MEDIUM".equalsIgnoreCase(g.getPriority()) ? "🟡" : "🟢";
                addTableCell(goalsTable, priorityEmoji + " " + g.getPriority(), normalFont, rowColor);
                
                // Progress bar representation
                double progress = g.getTargetAmount() > 0 ? (g.getCurrentAmount() / g.getTargetAmount()) * 100 : 0;
                PdfPCell progressCell = new PdfPCell();
                progressCell.setBackgroundColor(rowColor);
                progressCell.setPadding(8);
                progressCell.setBorderColor(lightGray);
                
                PdfPTable progressBar = new PdfPTable(2);
                progressBar.setWidthPercentage(100);
                float progressWidth = (float) Math.min(progress, 100);
                progressBar.setWidths(new float[]{progressWidth, 100 - progressWidth});
                
                PdfPCell filledProgress = new PdfPCell(new Phrase(String.format("%.0f%%", progress), 
                    new Font(Font.FontFamily.HELVETICA, 8, Font.BOLD, BaseColor.WHITE)));
                filledProgress.setBackgroundColor(incomeGreen);
                filledProgress.setBorder(Rectangle.NO_BORDER);
                filledProgress.setFixedHeight(18);
                filledProgress.setHorizontalAlignment(Element.ALIGN_CENTER);
                filledProgress.setVerticalAlignment(Element.ALIGN_MIDDLE);
                progressBar.addCell(filledProgress);
                
                PdfPCell emptyProgress = new PdfPCell();
                emptyProgress.setBackgroundColor(lightGray);
                emptyProgress.setBorder(Rectangle.NO_BORDER);
                emptyProgress.setFixedHeight(18);
                progressBar.addCell(emptyProgress);
                
                progressCell.addElement(progressBar);
                goalsTable.addCell(progressCell);
                
                alternate = !alternate;
            }
            
            document.add(goalsTable);
        }
        
        // ===== FOOTER =====
        document.add(new Paragraph("\n\n"));
        PdfPTable footerTable = new PdfPTable(1);
        footerTable.setWidthPercentage(100);
        
        PdfPCell footerCell = new PdfPCell();
        footerCell.setBackgroundColor(lightGray);
        footerCell.setPadding(15);
        footerCell.setBorder(Rectangle.NO_BORDER);
        
        Font footerFont = new Font(Font.FontFamily.HELVETICA, 9, Font.NORMAL, BaseColor.GRAY);
        Paragraph footerText = new Paragraph("Generated by BudgetWise AI Financial Advisor\n" +
            "This report is for personal use only. Keep your financial data secure.", footerFont);
        footerText.setAlignment(Element.ALIGN_CENTER);
        footerCell.addElement(footerText);
        
        footerTable.addCell(footerCell);
        document.add(footerTable);
        
        document.close();
        return baos.toByteArray();
    }
    
    private PdfPCell createSummaryCard(String title, String value, BaseColor bgColor, Font titleFont, Font valueFont) {
        PdfPCell card = new PdfPCell();
        card.setBackgroundColor(bgColor);
        card.setPadding(20);
        card.setBorder(Rectangle.NO_BORDER);
        card.setHorizontalAlignment(Element.ALIGN_CENTER);
        
        Paragraph titlePara = new Paragraph(title, titleFont);
        titlePara.setAlignment(Element.ALIGN_CENTER);
        card.addElement(titlePara);
        
        Paragraph valuePara = new Paragraph(value, valueFont);
        valuePara.setAlignment(Element.ALIGN_CENTER);
        card.addElement(valuePara);
        
        return card;
    }
    
    private Paragraph createSectionHeader(String title, Font font, BaseColor underlineColor) {
        Paragraph p = new Paragraph(title, font);
        p.setSpacingBefore(15);
        p.setSpacingAfter(5);
        return p;
    }
    
    private void addTableCell(PdfPTable table, String text, Font font, BaseColor bgColor) {
        PdfPCell cell = new PdfPCell(new Phrase(text != null ? text : "", font));
        cell.setBackgroundColor(bgColor);
        cell.setPadding(8);
        cell.setBorderColor(new BaseColor(243, 244, 246));
        table.addCell(cell);
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    public Map<String, Object> importData(String format, InputStream inputStream, Map<String, Boolean> options) {
        try {
            User currentUser = getCurrentUser();
            Map<String, Object> result = new HashMap<>();
            int importedCount = 0;
            
            log.info("Starting import for format: " + format);
            
            if (format == null || format.trim().isEmpty()) {
                result.put("success", false);
                result.put("message", "File format not specified. Please ensure the file has a .csv or .json extension.");
                return result;
            }
            
            switch (format.toLowerCase()) {
                case "json":
                    importedCount = importFromJson(inputStream, currentUser, options);
                    break;
                case "csv":
                    importedCount = importFromCsv(inputStream, currentUser, options);
                    break;
                case "pdf":
                    result.put("success", false);
                    result.put("message", "PDF import is not supported. Please use CSV or JSON format instead.");
                    return result;
                default:
                    result.put("success", false);
                    result.put("message", "Unsupported file format: " + format + ". Supported formats are CSV and JSON.");
                    return result;
            }
            
            if (importedCount == 0) {
                result.put("success", false);
                result.put("message", "No valid records found in the file. Please check that the file format is correct and contains at least one record.");
                return result;
            }
            
            result.put("success", true);
            result.put("message", "Import successful! " + importedCount + " records imported.");
            result.put("recordsImported", importedCount);
            
            log.info("Import completed successfully. Imported " + importedCount + " records.");
            
            return result;
        } catch (com.fasterxml.jackson.core.JsonParseException e) {
            log.error("JSON parsing error: ", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Invalid JSON format. Please ensure the file is a valid JSON file. Error: " + e.getOriginalMessage());
            return errorResponse;
        } catch (Exception e) {
            log.error("Import failed: ", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Import failed: " + e.getMessage() + ". Please check the file format and try again.");
            return errorResponse;
        }
    }

    private int importFromJson(InputStream inputStream, User user, Map<String, Boolean> options) throws Exception {
        @SuppressWarnings("unchecked")
        Map<String, Object> data = objectMapper.readValue(inputStream, Map.class);
        
        int count = 0;
        
        // Import Transactions
        if (options.getOrDefault("transactions", true) && data.containsKey("transactions")) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> transactions = (List<Map<String, Object>>) data.get("transactions");
            log.info("Importing " + (transactions != null ? transactions.size() : 0) + " transactions");
            if (transactions != null) {
                for (Map<String, Object> txnMap : transactions) {
                    try {
                        if (txnMap == null) continue;
                        
                        Transaction txn = new Transaction();
                        txn.setUser(user);
                        txn.setDescription((String) txnMap.getOrDefault("description", ""));
                        txn.setType((String) txnMap.getOrDefault("type", "EXPENSE"));
                        txn.setCategory((String) txnMap.getOrDefault("category", "Other"));
                        
                        Object amountObj = txnMap.get("amount");
                        if (amountObj != null) {
                            txn.setAmount(new java.math.BigDecimal(((Number) amountObj).doubleValue()));
                        } else {
                            txn.setAmount(new java.math.BigDecimal(0));
                        }
                        
                        txn.setCurrency((String) txnMap.getOrDefault("currency", "USD"));
                        txn.setPaymentMethod((String) txnMap.getOrDefault("paymentMethod", "Cash"));
                        txn.setDate(java.time.LocalDateTime.now());
                        
                        transactionRepository.save(txn);
                        count++;
                        log.debug("Imported transaction: " + txn.getDescription());
                    } catch (Exception e) {
                        log.warn("Failed to import transaction: " + e.getMessage());
                    }
                }
            }
        }
        
        // Import Budgets
        if (options.getOrDefault("budgets", true) && data.containsKey("budgets")) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> budgets = (List<Map<String, Object>>) data.get("budgets");
            log.info("Importing " + (budgets != null ? budgets.size() : 0) + " budgets");
            if (budgets != null) {
                for (Map<String, Object> budgetMap : budgets) {
                    try {
                        if (budgetMap == null) continue;
                        
                        Budget budget = new Budget();
                        budget.setUser(user);
                        budget.setCategory((String) budgetMap.getOrDefault("category", "Other"));
                        
                        Object amountObj = budgetMap.get("amount");
                        if (amountObj != null) {
                            budget.setAmount(new java.math.BigDecimal(((Number) amountObj).doubleValue()));
                        } else {
                            budget.setAmount(new java.math.BigDecimal(0));
                        }
                        
                        // Set date ranges
                        java.time.LocalDate now = java.time.LocalDate.now();
                        budget.setStartDate(now);
                        budget.setEndDate(now.plusMonths(1));
                        
                        budgetRepository.save(budget);
                        count++;
                        log.debug("Imported budget: " + budget.getCategory());
                    } catch (Exception e) {
                        log.warn("Failed to import budget: " + e.getMessage());
                    }
                }
            }
        }
        
        // Import Goals
        if (options.getOrDefault("goals", true) && data.containsKey("goals")) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> goals = (List<Map<String, Object>>) data.get("goals");
            log.info("Importing " + (goals != null ? goals.size() : 0) + " goals");
            if (goals != null) {
                for (Map<String, Object> goalMap : goals) {
                    try {
                        if (goalMap == null) continue;
                        
                        Goal goal = new Goal();
                        goal.setUser(user);
                        goal.setGoalName((String) goalMap.getOrDefault("goalName", "Unnamed Goal"));
                        goal.setCategory((String) goalMap.getOrDefault("category", "General"));
                        
                        Object targetObj = goalMap.get("targetAmount");
                        if (targetObj != null) {
                            goal.setTargetAmount(((Number) targetObj).doubleValue());
                        } else {
                            goal.setTargetAmount(0.0);
                        }
                        
                        goal.setPriority((String) goalMap.getOrDefault("priority", "Medium"));
                        goal.setCreatedAt(java.time.LocalDate.now());
                        goal.setCurrentAmount(0.0);
                        
                        goalRepository.save(goal);
                        count++;
                        log.debug("Imported goal: " + goal.getGoalName());
                    } catch (Exception e) {
                        log.warn("Failed to import goal: " + e.getMessage());
                    }
                }
            }
        }
        
        return count;
    }

    private int importFromCsv(InputStream inputStream, User user, Map<String, Boolean> options) throws Exception {
        int count = 0;
        InputStreamReader reader = new InputStreamReader(inputStream);
        CSVReader csvReader = new CSVReader(reader);
        String[] nextLine;
        int lineNum = 0;
        
        boolean inTransactions = false;
        boolean inBudgets = false;
        boolean inGoals = false;
        
        log.info("Starting CSV import");
        
        while ((nextLine = csvReader.readNext()) != null) {
            lineNum++;
            if (nextLine.length == 0) continue;
            
            String firstCol = nextLine[0].trim();
            
            // Detect section
            if ("TRANSACTIONS".equals(firstCol)) {
                inTransactions = true;
                inBudgets = false;
                inGoals = false;
                log.info("Found TRANSACTIONS section at line " + lineNum);
                continue;
            } else if ("BUDGETS".equals(firstCol)) {
                inTransactions = false;
                inBudgets = true;
                inGoals = false;
                log.info("Found BUDGETS section at line " + lineNum);
                continue;
            } else if ("GOALS".equals(firstCol)) {
                inTransactions = false;
                inBudgets = false;
                inGoals = true;
                log.info("Found GOALS section at line " + lineNum);
                continue;
            }
            
            // Skip headers and metadata
            if (firstCol.isEmpty() || firstCol.equals("Date") || firstCol.equals("Category") || 
                firstCol.equals("Goal Name") || firstCol.equals("GoalName") ||
                firstCol.equals("BudgetWise Data Export") || firstCol.equals("Export Date") || 
                firstCol.equals("User") || firstCol.contains("Date,Description")) {
                continue;
            }
            
            try {
                if (inTransactions && options.getOrDefault("transactions", true) && nextLine.length >= 7) {
                    Transaction txn = new Transaction();
                    txn.setUser(user);
                    txn.setDescription(SafeString(nextLine[1]));
                    txn.setType(SafeString(nextLine[2], "EXPENSE"));
                    txn.setCategory(SafeString(nextLine[3], "Other"));
                    
                    try {
                        txn.setAmount(new java.math.BigDecimal(nextLine[4].trim()));
                    } catch (Exception e) {
                        log.warn("Failed to parse amount at line " + lineNum + ": " + nextLine[4]);
                        txn.setAmount(new java.math.BigDecimal(0));
                    }
                    
                    txn.setCurrency(SafeString(nextLine[5], "USD"));
                    txn.setPaymentMethod(SafeString(nextLine[6], "Cash"));
                    txn.setDate(java.time.LocalDateTime.now());
                    
                    transactionRepository.save(txn);
                    count++;
                    log.debug("CSV Imported transaction: " + txn.getDescription());
                } else if (inBudgets && options.getOrDefault("budgets", true) && nextLine.length >= 2) {
                    Budget budget = new Budget();
                    budget.setUser(user);
                    budget.setCategory(SafeString(nextLine[0], "Other"));
                    
                    try {
                        budget.setAmount(new java.math.BigDecimal(nextLine[1].trim()));
                    } catch (Exception e) {
                        log.warn("Failed to parse budget amount at line " + lineNum + ": " + nextLine[1]);
                        budget.setAmount(new java.math.BigDecimal(0));
                    }
                    
                    java.time.LocalDate now = java.time.LocalDate.now();
                    budget.setStartDate(now);
                    budget.setEndDate(now.plusMonths(1));
                    
                    budgetRepository.save(budget);
                    count++;
                    log.debug("CSV Imported budget: " + budget.getCategory());
                } else if (inGoals && options.getOrDefault("goals", true) && nextLine.length >= 2) {
                    Goal goal = new Goal();
                    goal.setUser(user);
                    goal.setGoalName(SafeString(nextLine[0], "Unnamed Goal"));
                    goal.setCategory(SafeString(nextLine[1], "General"));
                    
                    try {
                        goal.setTargetAmount(Double.parseDouble(nextLine[2].trim()));
                    } catch (Exception e) {
                        goal.setTargetAmount(0.0);
                    }
                    
                    goal.setPriority(nextLine.length > 5 ? SafeString(nextLine[5], "Medium") : "Medium");
                    goal.setCreatedAt(java.time.LocalDate.now());
                    goal.setCurrentAmount(0.0);
                    
                    goalRepository.save(goal);
                    count++;
                    log.debug("CSV Imported goal: " + goal.getGoalName());
                }
            } catch (Exception e) {
                log.warn("Failed to import CSV row: " + e.getMessage());
            }
        }
        
        csvReader.close();
        log.info("CSV import completed. Total records: " + count);
        return count;
    }
    
    private String SafeString(String value) {
        return SafeString(value, "");
    }
    
    private String SafeString(String value, String defaultValue) {
        if (value == null || value.trim().isEmpty()) {
            return defaultValue;
        }
        return value.trim();
    }

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        if (username == null || "anonymousUser".equals(username)) {
            throw new RuntimeException("User not authenticated");
        }
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
