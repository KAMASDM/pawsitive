import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiX, FiDollarSign, FiTrash2, FiEdit2, FiCalendar, FiPieChart, FiTrendingUp } from 'react-icons/fi';
import { FaDog, FaSyringe, FaCut, FaBone, FaShoppingCart, FaHospital, FaEllipsisH } from 'react-icons/fa';
import { ref as dbRef, update, push } from 'firebase/database';
import { database, auth } from '../../firebase';

const EXPENSE_CATEGORIES = [
  { id: 'food', label: 'Food & Treats', icon: FaBone, color: 'from-orange-500 to-amber-500' },
  { id: 'vet', label: 'Vet Visits', icon: FaSyringe, color: 'from-blue-500 to-cyan-500' },
  { id: 'grooming', label: 'Grooming', icon: FaCut, color: 'from-pink-500 to-rose-500' },
  { id: 'toys', label: 'Toys & Accessories', icon: FaDog, color: 'from-purple-500 to-indigo-500' },
  { id: 'supplies', label: 'Supplies', icon: FaShoppingCart, color: 'from-green-500 to-emerald-500' },
  { id: 'medical', label: 'Medical', icon: FaHospital, color: 'from-red-500 to-pink-500' },
  { id: 'other', label: 'Other', icon: FaEllipsisH, color: 'from-gray-500 to-slate-500' },
];

const ExpenseTracker = ({ pet, onUpdate }) => {
  const [expenses, setExpenses] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formData, setFormData] = useState({
    amount: '',
    category: 'food',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'chart'
  const [timeFilter, setTimeFilter] = useState('all'); // 'all', 'month', 'year'

  useEffect(() => {
    if (pet?.expenses) {
      const expenseList = Object.entries(pet.expenses).map(([id, data]) => ({
        id,
        ...data
      })).sort((a, b) => new Date(b.date) - new Date(a.date));
      setExpenses(expenseList);
    }
  }, [pet]);

  const filteredExpenses = expenses.filter(expense => {
    if (timeFilter === 'all') return true;
    const expenseDate = new Date(expense.date);
    const now = new Date();
    if (timeFilter === 'month') {
      return expenseDate.getMonth() === now.getMonth() && 
             expenseDate.getFullYear() === now.getFullYear();
    }
    if (timeFilter === 'year') {
      return expenseDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const expensesByCategory = EXPENSE_CATEGORIES.map(category => {
    const categoryExpenses = filteredExpenses.filter(e => e.category === category.id);
    const total = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
    return {
      ...category,
      total,
      count: categoryExpenses.length,
      percentage: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0
    };
  }).filter(c => c.total > 0);

  const handleSubmit = async () => {
    if (!formData.amount || !formData.category || !formData.date) return;

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      const expenseData = {
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description.trim(),
        date: formData.date,
        timestamp: Date.now()
      };

      const petRef = dbRef(database, `userPets/${user.uid}/${pet.id}`);

      if (editingExpense) {
        await update(dbRef(database, `userPets/${user.uid}/${pet.id}/expenses/${editingExpense.id}`), expenseData);
      } else {
        const expensesRef = dbRef(database, `userPets/${user.uid}/${pet.id}/expenses`);
        const newExpenseRef = push(expensesRef);
        await update(petRef, {
          [`expenses/${newExpenseRef.key}`]: expenseData
        });
      }

      if (onUpdate) onUpdate();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving expense:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (expenseId) => {
    if (!window.confirm('Delete this expense?')) return;

    try {
      const user = auth.currentUser;
      if (!user) return;

      const expenseRef = dbRef(database, `userPets/${user.uid}/${pet.id}/expenses/${expenseId}`);
      await update(expenseRef, null);

      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      amount: expense.amount.toString(),
      category: expense.category,
      description: expense.description,
      date: expense.date
    });
    setShowAddDialog(true);
  };

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setEditingExpense(null);
    setFormData({
      amount: '',
      category: 'food',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <FiDollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm opacity-90">Total Spent</p>
              <p className="text-3xl font-bold">${totalExpenses.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            {['all', 'month', 'year'].map(filter => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  timeFilter === filter
                    ? 'bg-white/30 backdrop-blur-sm'
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                {filter === 'all' ? 'All Time' : filter === 'month' ? 'This Month' : 'This Year'}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <FiPieChart className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm opacity-90">Total Expenses</p>
              <p className="text-3xl font-bold">{filteredExpenses.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-violet-500 to-purple-500 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <FiTrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm opacity-90">Avg per Expense</p>
              <p className="text-3xl font-bold">
                ${filteredExpenses.length > 0 ? (totalExpenses / filteredExpenses.length).toFixed(2) : '0.00'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowAddDialog(true)}
          className="flex-1 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <FiPlus className="w-5 h-5" />
          Add Expense
        </button>
        <button
          onClick={() => setViewMode(viewMode === 'list' ? 'chart' : 'list')}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
        >
          {viewMode === 'list' ? '📊 Chart' : '📝 List'}
        </button>
      </div>

      {/* Category Breakdown */}
      {viewMode === 'chart' && expensesByCategory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">Expenses by Category</h3>
          <div className="space-y-3">
            {expensesByCategory.map(category => {
              const Icon = category.icon;
              return (
                <div key={category.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${category.color} flex items-center justify-center text-white`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{category.label}</p>
                        <p className="text-sm text-gray-500">{category.count} expenses</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">${category.total.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">{category.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${category.color}`}
                      style={{ width: `${category.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Expenses List */}
      {viewMode === 'list' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">Expense History</h3>
          
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-8">
              <FiDollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No expenses recorded yet</p>
              <button
                onClick={() => setShowAddDialog(true)}
                className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all"
              >
                Add First Expense
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredExpenses.map((expense, index) => {
                const category = EXPENSE_CATEGORIES.find(c => c.id === expense.category);
                const Icon = category?.icon || FaEllipsisH;
                return (
                  <motion.div
                    key={expense.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center justify-between p-4 bg-gradient-to-r ${category?.color || 'from-gray-400 to-slate-400'} bg-opacity-10 rounded-xl border border-gray-200 hover:shadow-md transition-all`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${category?.color || 'from-gray-400 to-slate-400'} flex items-center justify-center text-white flex-shrink-0`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{expense.description || category?.label}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <FiCalendar className="w-4 h-4" />
                          <span>{new Date(expense.date).toLocaleDateString()}</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-600">{category?.label}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xl font-bold text-gray-900">${expense.amount.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* Add/Edit Expense Dialog */}
      <AnimatePresence>
        {showAddDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleCloseDialog}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl"
            >
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingExpense ? 'Edit Expense' : 'Add Expense'}
                </h3>
                <button
                  onClick={handleCloseDialog}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {EXPENSE_CATEGORIES.map(category => {
                      const Icon = category.icon;
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, category: category.id })}
                          className={`p-3 rounded-xl border-2 transition-all ${
                            formData.category === category.id
                              ? 'border-violet-500 bg-violet-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Icon className={`w-6 h-6 mx-auto mb-1 ${formData.category === category.id ? 'text-violet-600' : 'text-gray-600'}`} />
                          <p className={`text-xs font-semibold ${formData.category === category.id ? 'text-violet-800' : 'text-gray-600'}`}>
                            {category.label}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="e.g., 45.99"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g., Monthly dog food"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!formData.amount || !formData.category || !formData.date || loading}
                  className="w-full py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : editingExpense ? 'Update Expense' : 'Add Expense'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExpenseTracker;
