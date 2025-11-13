import React, { useEffect, useState, useContext } from "react";
import axios from "../api/axios";
import { TransactionContext } from "../context/TransactionContext";
import "../styles/Transactions.css";

const BASE_URL = "/api/transactions";
const DEFAULT_CURRENCIES = [
  "₹ INR - Indian Rupee",
  "$ USD - US Dollar",
  "€ EUR - Euro",
  "£ GBP - British Pound",
  "¥ JPY - Japanese Yen",
  "₩ KRW - Korean Won",
  "A$ AUD - Australian Dollar",
  "C$ CAD - Canadian Dollar"
];

export default function Transactions() {
  const { transactions: globalTransactions, loadTransactions: globalLoadTransactions } = useContext(TransactionContext);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    description: "",
    amount: "",
    type: "expense",
    category: "Food",
    paymentMethod: "Cash",
    currency: "₹ INR - Indian Rupee",
    date: new Date().toISOString().slice(0, 10)
  });
  const [categories, setCategories] = useState([
    "Salary",
    "Housing",
    "Food",
    "Transport",
    "Shopping",
    "Entertainment",
    "Healthcare",
    "Education",
    "Other"
  ]);
  const [showOtherCategoryInput, setShowOtherCategoryInput] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All Categories");
  const [filterCurrency, setFilterCurrency] = useState("All Currencies");
  const [selectedCurrency, setSelectedCurrency] = useState("₹ INR - Indian Rupee");
  const [sortBy, setSortBy] = useState("date-desc"); // "date-desc", "date-asc", "alpha-asc", "alpha-desc", "amount-asc", "amount-desc", "category-asc", "category-desc", "currency-asc", "currency-desc"

  // Initialize categories from localStorage
  useEffect(() => {
    const savedCategories = localStorage.getItem('bw_categories');
    if (savedCategories) {
      try {
        const parsedCategories = JSON.parse(savedCategories);
        setCategories(parsedCategories);
      } catch (err) {
        console.error('Error loading categories:', err);
      }
    }
  }, []);

  // Save categories to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('bw_categories', JSON.stringify(categories));
  }, [categories]);

  // Load all transactions on mount
  useEffect(() => {
    globalLoadTransactions();
  }, [globalLoadTransactions]);

  // Apply filters and search
  useEffect(() => {
    let filtered = globalTransactions;

    // Filter by type
    if (filterType !== "All") {
      const typeFilter = filterType.toLowerCase();
      filtered = filtered.filter(
        (t) => {
          const txnType = (t.type || "").toLowerCase();
          return typeFilter === "income" ? txnType === "income" : typeFilter === "expenses" ? txnType === "expense" : true;
        }
      );
    }

    // Filter by category
    if (filterCategory !== "All Categories") {
      filtered = filtered.filter((t) => t.category === filterCategory);
    }

    // Filter by currency
    if (filterCurrency !== "All Currencies") {
      filtered = filtered.filter((t) => (t.currency || "₹ INR - Indian Rupee") === filterCurrency);
    }

    // Search by description
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          (t.description && t.description.toLowerCase().includes(term)) ||
          (t.category && t.category.toLowerCase().includes(term))
      );
    }

    // Apply sorting - Create a copy to avoid mutating
    const sorted = [...filtered];
    
    if (sortBy === "date-desc") {
      sorted.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      });
    } else if (sortBy === "date-asc") {
      sorted.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB;
      });
    } else if (sortBy === "alpha-asc") {
      sorted.sort((a, b) => {
        const descA = (a.description || "").toLowerCase();
        const descB = (b.description || "").toLowerCase();
        return descA.localeCompare(descB);
      });
    } else if (sortBy === "alpha-desc") {
      sorted.sort((a, b) => {
        const descA = (a.description || "").toLowerCase();
        const descB = (b.description || "").toLowerCase();
        return descB.localeCompare(descA);
      });
    } else if (sortBy === "amount-asc") {
      sorted.sort((a, b) => {
        const amountA = parseFloat(a.amount) || 0;
        const amountB = parseFloat(b.amount) || 0;
        return amountA - amountB;
      });
    } else if (sortBy === "amount-desc") {
      sorted.sort((a, b) => {
        const amountA = parseFloat(a.amount) || 0;
        const amountB = parseFloat(b.amount) || 0;
        return amountB - amountA;
      });
    } else if (sortBy === "category-asc") {
      sorted.sort((a, b) => {
        const catA = (a.category || "").toLowerCase();
        const catB = (b.category || "").toLowerCase();
        return catA.localeCompare(catB);
      });
    } else if (sortBy === "category-desc") {
      sorted.sort((a, b) => {
        const catA = (a.category || "").toLowerCase();
        const catB = (b.category || "").toLowerCase();
        return catB.localeCompare(catA);
      });
    } else if (sortBy === "currency-asc") {
      sorted.sort((a, b) => {
        const curA = (a.currency || "").toLowerCase();
        const curB = (b.currency || "").toLowerCase();
        return curA.localeCompare(curB);
      });
    } else if (sortBy === "currency-desc") {
      sorted.sort((a, b) => {
        const curA = (a.currency || "").toLowerCase();
        const curB = (b.currency || "").toLowerCase();
        return curB.localeCompare(curA);
      });
    }

    setFilteredTransactions(sorted);
  }, [globalTransactions, searchTerm, filterType, filterCategory, filterCurrency, sortBy]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));

    // Dynamic category input trigger
    if (name === "category") {
      if (value === "Other") {
        setShowOtherCategoryInput(true);
      } else {
        setShowOtherCategoryInput(false);
        setNewCategory("");
      }
    }
  };

  const handleOtherCategorySubmit = () => {
    if (!newCategory.trim()) {
      alert("Please enter a category name");
      return;
    }
    
    // Check if category already exists
    if (categories.includes(newCategory.trim())) {
      alert("This category already exists");
      return;
    }

    // Add new category before "Other"
    const updatedCategories = categories.filter((c) => c !== "Other");
    updatedCategories.push(newCategory.trim());
    updatedCategories.push("Other");
    
    // Update state (which also saves to localStorage via useEffect)
    setCategories(updatedCategories);
    
    // Set form category to the new category
    setForm((f) => ({ ...f, category: newCategory.trim() }));
    
    // Close input and reset
    setShowOtherCategoryInput(false);
    setNewCategory("");
    
    alert(`Category "${newCategory.trim()}" added successfully!`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form
      if (!form.description.trim()) {
        alert("Please enter a description");
        setLoading(false);
        return;
      }
      if (!form.amount || parseFloat(form.amount) <= 0) {
        alert("Please enter a valid amount");
        setLoading(false);
        return;
      }

      // Convert date to ISO format with time
      const dateObj = new Date(form.date);
      dateObj.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
      
      const payload = {
        description: form.description,
        amount: parseFloat(form.amount),
        type: form.type, // Keep as is: "income" or "expense" (from form default)
        category: form.category,
        paymentMethod: form.paymentMethod,
        currency: form.currency,
        date: dateObj.toISOString()
      };

      console.log("Sending payload:", payload);

      if (editing) {
        await axios.put(`${BASE_URL}/${editing}`, payload);
        console.log("Update successful");
      } else {
        await axios.post(BASE_URL, payload);
        console.log("Create successful");
      }

      // Reload transactions from global context
      await globalLoadTransactions();
      resetForm();
      closeModal();
    } catch (err) {
      console.error("Error saving transaction:", err);
      if (err.response) {
        console.error("Response data:", err.response.data);
        console.error("Response status:", err.response.status);
        alert(`Error: ${err.response.data?.message || err.response.statusText || "Error saving transaction"}`);
      } else if (err.request) {
        console.error("No response received:", err.request);
        alert("No response from server. Make sure the backend is running.");
      } else {
        alert("Error: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      description: "",
      amount: "",
      type: "expense",
      category: "Food",
      paymentMethod: "Cash",
      currency: "₹ INR - Indian Rupee",
      date: new Date().toISOString().slice(0, 10)
    });
    setEditing(null);
    setShowOtherCategoryInput(false);
  };

  const handleEdit = (txn) => {
    setEditing(txn.id);
    setForm({
      description: txn.description,
      amount: txn.amount,
      type: txn.type,
      category: txn.category,
      paymentMethod: txn.paymentMethod,
      currency: txn.currency || "₹ INR - Indian Rupee",
      date: txn.date.slice(0, 10)
    });
    setShowOtherCategoryInput(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this transaction?")) return;
    await axios.delete(`${BASE_URL}/${id}`);
    await globalLoadTransactions();
  };

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert("No transactions to export");
      return;
    }

    const csvHeader = ["Description", "Amount", "Category", "Type", "Date", "Payment Method"].join(",");
    const csvRows = filteredTransactions.map((t) => [
      `"${t.description || ""}"`,
      t.amount,
      t.category,
      t.type,
      new Date(t.date).toLocaleDateString(),
      t.paymentMethod
    ].join(","));

    const csv = [csvHeader, ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const openModal = (txn = null) => {
    if (txn) {
      setEditing(txn.id);
      setForm({
        description: txn.description || "",
        amount: txn.amount,
        type: txn.type,
        category: txn.category,
        paymentMethod: txn.paymentMethod,
        currency: txn.currency || "₹ INR - Indian Rupee",
        date: new Date(txn.date).toISOString().slice(0, 10)
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  return (
    <div className="transactions-page">
      {/* Header with Export & Currency */}
      <div className="transactions-header">
        <div>
          <h1>Transactions</h1>
          <p>Track all your income and expenses</p>
        </div>
        <div className="header-controls">
          <button className="add-transaction-btn" onClick={() => openModal()}>
            ➕ Add Transaction
          </button>
          <button className="export-btn" onClick={handleExportCSV}>
            📥 Export CSV
          </button>
          <div className="currency-selector">
            <label>💱</label>
            <select value={selectedCurrency} onChange={(e) => setSelectedCurrency(e.target.value)}>
              {DEFAULT_CURRENCIES.map((cur) => (
                <option key={cur}>{cur}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="filters-section">
        <input
          type="text"
          className="search-bar"
          placeholder="Search transactions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="filter-buttons">
          {["All", "Income", "Expenses"].map((btn) => (
            <button
              key={btn}
              className={`filter-btn ${filterType === btn ? "active" : ""}`}
              onClick={() => setFilterType(btn)}
            >
              {btn}
            </button>
          ))}
        </div>

        <select
          className="filter-select"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option>All Categories</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <select 
          className="filter-select"
          value={filterCurrency}
          onChange={(e) => setFilterCurrency(e.target.value)}
        >
          <option>All Currencies</option>
          {DEFAULT_CURRENCIES.map((cur) => (
            <option key={cur}>{cur}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          title="Sort transactions"
        >
          <option value="date-desc">📅 Newest First</option>
          <option value="date-asc">📅 Oldest First</option>
          <option value="alpha-asc">📝 A-Z (Description)</option>
          <option value="alpha-desc">📝 Z-A (Description)</option>
          <option value="amount-asc">💰 Amount: Low to High</option>
          <option value="amount-desc">💰 Amount: High to Low</option>
          <option value="category-asc">📂 Category: A-Z</option>
          <option value="category-desc">📂 Category: Z-A</option>
          <option value="currency-asc">💱 Currency: A-Z</option>
          <option value="currency-desc">💱 Currency: Z-A</option>
        </select>
      </div>

      {/* Transaction List */}
      <div className="transactions-list">
        {filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <p>No transactions found</p>
          </div>
        ) : (
          filteredTransactions.map((t) => (
            <div
              key={t.id}
              className={`transaction-card ${
                (t.type || "").toLowerCase() === "income" ? "income" : "expense"
              }`}
            >
              <div className="transaction-card-left">
                <div className="txn-icon">
                  {(t.type || "").toLowerCase() === "income" ? "⊕" : "⊖"}
                </div>
                <div className="txn-info">
                  <div className="txn-description">{t.description}</div>
                  <div className="txn-meta">
                    {t.category} • {new Date(t.date).toLocaleDateString()} • {t.paymentMethod}
                  </div>
                </div>
              </div>
              <div className="transaction-card-right">
                <div className="txn-currency">
                  {t.currency || "₹ INR"}
                </div>
                <div className={`txn-amount ${(t.type || "").toLowerCase() === "income" ? "income" : "expense"}`}>
                  {(t.type || "").toLowerCase() === "income" ? "+" : "-"}
                  {typeof t.amount === 'number' ? t.amount.toFixed(2) : t.amount}
                </div>
                <div className="transaction-actions">
                  <button
                    className="icon-btn edit-btn"
                    onClick={() => openModal(t)}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    className="icon-btn delete-btn"
                    onClick={() => handleDelete(t.id)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Action Button */}


      {/* Modal Overlay */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? "Edit Transaction" : "Add Transaction"}</h2>
              <button className="close-btn" onClick={closeModal}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="transaction-form">
              <div className="form-group">
                <label>Description</label>
                <input
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Enter transaction description"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select name="type" value={form.type} onChange={handleChange}>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                  >
                    {categories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Custom Category Input - Shows when "Other" is selected */}
              {form.category === "Other" && (
                <div className="form-group">
                  <label>Enter New Category Name</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      placeholder="e.g., Groceries, Utilities, etc."
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="btn primary"
                      onClick={handleOtherCategorySubmit}
                      style={{ padding: "10px 16px" }}
                    >
                      Add Category
                    </button>
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Amount</label>
                  <input
                    type="number"
                    name="amount"
                    value={form.amount}
                    onChange={handleChange}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Currency</label>
                  <select
                    name="currency"
                    value={form.currency}
                    onChange={handleChange}
                  >
                    {DEFAULT_CURRENCIES.map((cur) => (
                      <option key={cur}>{cur}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Payment Method</label>
                  <select
                    name="paymentMethod"
                    value={form.paymentMethod}
                    onChange={handleChange}
                  >
                    <option>Cash</option>
                    <option>Card</option>
                    <option>UPI</option>
                    <option>Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn primary" disabled={loading}>
                  {loading ? "Saving..." : editing ? "Update Transaction" : "Add Transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
