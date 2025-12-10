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
import com.itextpdf.text.Document;
import com.itextpdf.text.Element;
import com.itextpdf.text.Paragraph;
import com.itextpdf.text.pdf.PdfWriter;
import com.opencsv.CSVReader;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.InputStreamReader;
import java.io.InputStream;
import java.time.LocalDateTime;
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
        Document document = new Document();
        PdfWriter.getInstance(document, baos);
        document.open();
        
        // Add title
        Paragraph title = new Paragraph("BudgetWise Data Export");
        title.setAlignment(Element.ALIGN_CENTER);
        document.add(title);
        
        // Add export info
        document.add(new Paragraph("Export Date: " + data.get("exportDate")));
        document.add(new Paragraph("User: " + data.get("userName")));
        document.add(new Paragraph(" "));
        
        // Add Transactions
        if (data.containsKey("transactions")) {
            document.add(new Paragraph("TRANSACTIONS"));
            @SuppressWarnings("unchecked")
            List<Transaction> transactions = (List<Transaction>) data.get("transactions");
            for (Transaction t : transactions) {
                document.add(new Paragraph(
                    t.getDate() + " | " + t.getDescription() + " | " + 
                    t.getType() + " | " + t.getAmount() + " " + t.getCurrency()
                ));
            }
            document.add(new Paragraph(" "));
        }
        
        // Add Budgets
        if (data.containsKey("budgets")) {
            document.add(new Paragraph("BUDGETS"));
            @SuppressWarnings("unchecked")
            List<Budget> budgets = (List<Budget>) data.get("budgets");
            for (Budget b : budgets) {
                document.add(new Paragraph(
                    b.getCategory() + " | " + b.getAmount() + " | " + 
                    b.getStartDate() + " to " + b.getEndDate()
                ));
            }
            document.add(new Paragraph(" "));
        }
        
        // Add Goals
        if (data.containsKey("goals")) {
            document.add(new Paragraph("GOALS"));
            @SuppressWarnings("unchecked")
            List<Goal> goals = (List<Goal>) data.get("goals");
            for (Goal g : goals) {
                document.add(new Paragraph(
                    g.getGoalName() + " | " + g.getTargetAmount() + " | " + g.getPriority()
                ));
            }
        }
        
        document.close();
        return baos.toByteArray();
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
