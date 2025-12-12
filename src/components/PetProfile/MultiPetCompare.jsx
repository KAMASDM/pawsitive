import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCheck, FiX } from 'react-icons/fi';
import { FaPaw, FaWeight, FaDollarSign, FaSyringe, FaPills, FaCalendar, FaBirthdayCake } from 'react-icons/fa';
import { getPetAgeInfo } from '../../utils/petAgeCalculator';

const MultiPetCompare = ({ pets }) => {
  const [selectedPets, setSelectedPets] = useState([]);
  const [compareView, setCompareView] = useState('overview'); // overview, health, expenses

  useEffect(() => {
    // Auto-select first 2 pets
    if (pets && pets.length > 0) {
      setSelectedPets(pets.slice(0, Math.min(2, pets.length)).map(p => p.id));
    }
  }, [pets]);

  const togglePetSelection = (petId) => {
    if (selectedPets.includes(petId)) {
      setSelectedPets(selectedPets.filter(id => id !== petId));
    } else if (selectedPets.length < 4) {
      setSelectedPets([...selectedPets, petId]);
    }
  };

  const comparedPets = pets.filter(pet => selectedPets.includes(pet.id));

  if (!pets || pets.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 text-center">
        <FaPaw className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">No pets to compare</p>
        <p className="text-gray-400 text-sm mt-2">Add pets to your profile first</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pet Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
      >
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Select Pets to Compare (Max 4)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {pets.map(pet => (
            <button
              key={pet.id}
              onClick={() => togglePetSelection(pet.id)}
              disabled={!selectedPets.includes(pet.id) && selectedPets.length >= 4}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedPets.includes(pet.id)
                  ? 'border-violet-500 bg-violet-50'
                  : 'border-gray-200 hover:border-gray-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <img
                src={pet.image || '/default-pet.png'}
                alt={pet.name}
                className="w-16 h-16 rounded-full object-cover mx-auto mb-2 border-2 border-white shadow-md"
              />
              <p className={`text-sm font-semibold text-center ${
                selectedPets.includes(pet.id) ? 'text-violet-600' : 'text-gray-900'
              }`}>
                {pet.name}
              </p>
              {selectedPets.includes(pet.id) && (
                <div className="mt-2 flex justify-center">
                  <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center">
                    <FiCheck className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {comparedPets.length < 2 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
          <p className="text-yellow-800">Select at least 2 pets to compare</p>
        </div>
      )}

      {comparedPets.length >= 2 && (
        <>
          {/* View Tabs */}
          <div className="flex gap-2 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'health', label: 'Health', icon: '💉' },
              { id: 'expenses', label: 'Expenses', icon: '💰' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setCompareView(tab.id)}
                className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                  compareView === tab.id
                    ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Comparison Table */}
          <motion.div
            key={compareView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
          >
            {compareView === 'overview' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-violet-500 to-purple-500 text-white">
                    <tr>
                      <th className="p-4 text-left font-semibold">Attribute</th>
                      {comparedPets.map(pet => (
                        <th key={pet.id} className="p-4 text-center font-semibold">
                          <div className="flex flex-col items-center gap-2">
                            <img
                              src={pet.image || '/default-pet.png'}
                              alt={pet.name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-white"
                            />
                            <span>{pet.name}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <ComparisonRow
                      label="Type"
                      icon={<FaPaw className="w-4 h-4" />}
                      values={comparedPets.map(pet => pet.type || 'Unknown')}
                    />
                    <ComparisonRow
                      label="Breed"
                      icon={<FaPaw className="w-4 h-4" />}
                      values={comparedPets.map(pet => pet.breed || 'Unknown')}
                    />
                    <ComparisonRow
                      label="Gender"
                      icon={<span>⚧</span>}
                      values={comparedPets.map(pet => pet.gender || 'Unknown')}
                    />
                    <ComparisonRow
                      label="Age (Actual)"
                      icon={<FaBirthdayCake className="w-4 h-4" />}
                      values={comparedPets.map(pet => {
                        const ageInfo = pet.dateOfBirth ? getPetAgeInfo(pet.type, pet.dateOfBirth) : null;
                        return ageInfo ? `${ageInfo.ageInYears}y ${ageInfo.ageInMonths}m` : 'Unknown';
                      })}
                    />
                    <ComparisonRow
                      label="Age (Human Years)"
                      icon={<FaCalendar className="w-4 h-4" />}
                      values={comparedPets.map(pet => {
                        const ageInfo = pet.dateOfBirth ? getPetAgeInfo(pet.type, pet.dateOfBirth) : null;
                        return ageInfo ? `${ageInfo.humanYears} years` : 'Unknown';
                      })}
                      highlight={true}
                    />
                    <ComparisonRow
                      label="Life Stage"
                      icon={<span>🎭</span>}
                      values={comparedPets.map(pet => {
                        const ageInfo = pet.dateOfBirth ? getPetAgeInfo(pet.type, pet.dateOfBirth) : null;
                        return ageInfo?.lifeStage ? `${ageInfo.lifeStage.emoji} ${ageInfo.lifeStage.stage}` : 'Unknown';
                      })}
                    />
                    <ComparisonRow
                      label="Weight"
                      icon={<FaWeight className="w-4 h-4" />}
                      values={comparedPets.map(pet => {
                        const currentWeight = pet.weightHistory 
                          ? Object.values(pet.weightHistory).sort((a, b) => new Date(b.date) - new Date(a.date))[0]?.weight 
                          : pet.weight;
                        return currentWeight ? `${parseFloat(currentWeight).toFixed(1)} kg` : 'Not set';
                      })}
                      compareNumbers={comparedPets.map(pet => {
                        const currentWeight = pet.weightHistory 
                          ? Object.values(pet.weightHistory).sort((a, b) => new Date(b.date) - new Date(a.date))[0]?.weight 
                          : pet.weight;
                        return parseFloat(currentWeight) || 0;
                      })}
                    />
                    <ComparisonRow
                      label="Color"
                      icon={<span>🎨</span>}
                      values={comparedPets.map(pet => pet.color || 'Unknown')}
                    />
                  </tbody>
                </table>
              </div>
            )}

            {compareView === 'health' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                    <tr>
                      <th className="p-4 text-left font-semibold">Health Metric</th>
                      {comparedPets.map(pet => (
                        <th key={pet.id} className="p-4 text-center font-semibold">
                          <div className="flex flex-col items-center gap-2">
                            <img
                              src={pet.image || '/default-pet.png'}
                              alt={pet.name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-white"
                            />
                            <span>{pet.name}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <ComparisonRow
                      label="Vaccinations"
                      icon={<FaSyringe className="w-4 h-4" />}
                      values={comparedPets.map(pet => {
                        const count = pet.vaccinations ? pet.vaccinations.length : 0;
                        return `${count} recorded`;
                      })}
                      compareNumbers={comparedPets.map(pet => pet.vaccinations ? pet.vaccinations.length : 0)}
                    />
                    <ComparisonRow
                      label="Medications"
                      icon={<FaPills className="w-4 h-4" />}
                      values={comparedPets.map(pet => {
                        const count = pet.medications ? pet.medications.length : 0;
                        return `${count} active`;
                      })}
                      compareNumbers={comparedPets.map(pet => pet.medications ? pet.medications.length : 0)}
                    />
                    <ComparisonRow
                      label="Medical Conditions"
                      icon={<span>🩺</span>}
                      values={comparedPets.map(pet => {
                        const conditions = pet.medicalConditions || pet.medical?.conditions || [];
                        if (typeof conditions === 'string') return conditions || 'None';
                        return conditions.length > 0 ? conditions.join(', ') : 'None';
                      })}
                    />
                    <ComparisonRow
                      label="Allergies"
                      icon={<span>⚠️</span>}
                      values={comparedPets.map(pet => {
                        const allergies = pet.allergies || pet.medical?.allergies || [];
                        if (typeof allergies === 'string') return allergies || 'None';
                        return allergies.length > 0 ? allergies.join(', ') : 'None';
                      })}
                    />
                    <ComparisonRow
                      label="Available for Mating"
                      icon={<span>💕</span>}
                      values={comparedPets.map(pet => 
                        pet.availableForMating ? '✅ Yes' : '❌ No'
                      )}
                    />
                    <ComparisonRow
                      label="Available for Adoption"
                      icon={<span>🏠</span>}
                      values={comparedPets.map(pet => 
                        pet.availableForAdoption ? '✅ Yes' : '❌ No'
                      )}
                    />
                  </tbody>
                </table>
              </div>
            )}

            {compareView === 'expenses' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                    <tr>
                      <th className="p-4 text-left font-semibold">Expense Category</th>
                      {comparedPets.map(pet => (
                        <th key={pet.id} className="p-4 text-center font-semibold">
                          <div className="flex flex-col items-center gap-2">
                            <img
                              src={pet.image || '/default-pet.png'}
                              alt={pet.name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-white"
                            />
                            <span>{pet.name}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <ComparisonRow
                      label="Total Expenses"
                      icon={<FaDollarSign className="w-4 h-4" />}
                      values={comparedPets.map(pet => {
                        const total = pet.expenses 
                          ? Object.values(pet.expenses).reduce((sum, e) => sum + e.amount, 0)
                          : 0;
                        return `$${total.toFixed(2)}`;
                      })}
                      compareNumbers={comparedPets.map(pet => {
                        return pet.expenses 
                          ? Object.values(pet.expenses).reduce((sum, e) => sum + e.amount, 0)
                          : 0;
                      })}
                      highlight={true}
                    />
                    <ComparisonRow
                      label="Number of Expenses"
                      icon={<span>📝</span>}
                      values={comparedPets.map(pet => {
                        const count = pet.expenses ? Object.keys(pet.expenses).length : 0;
                        return `${count} entries`;
                      })}
                      compareNumbers={comparedPets.map(pet => 
                        pet.expenses ? Object.keys(pet.expenses).length : 0
                      )}
                    />
                    <ComparisonRow
                      label="Average per Expense"
                      icon={<span>📊</span>}
                      values={comparedPets.map(pet => {
                        if (!pet.expenses) return '$0.00';
                        const expenses = Object.values(pet.expenses);
                        const total = expenses.reduce((sum, e) => sum + e.amount, 0);
                        const avg = expenses.length > 0 ? total / expenses.length : 0;
                        return `$${avg.toFixed(2)}`;
                      })}
                      compareNumbers={comparedPets.map(pet => {
                        if (!pet.expenses) return 0;
                        const expenses = Object.values(pet.expenses);
                        const total = expenses.reduce((sum, e) => sum + e.amount, 0);
                        return expenses.length > 0 ? total / expenses.length : 0;
                      })}
                    />
                    <ComparisonRow
                      label="Weight Entries"
                      icon={<FaWeight className="w-4 h-4" />}
                      values={comparedPets.map(pet => {
                        const count = pet.weightHistory ? Object.keys(pet.weightHistory).length : 0;
                        return `${count} recorded`;
                      })}
                      compareNumbers={comparedPets.map(pet => 
                        pet.weightHistory ? Object.keys(pet.weightHistory).length : 0
                      )}
                    />
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>

          {/* Summary Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-6 border border-violet-200"
          >
            <h3 className="text-lg font-bold text-violet-900 mb-4">💡 Quick Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-1">Oldest Pet</p>
                <p className="text-lg font-bold text-gray-900">
                  {(() => {
                    const oldest = comparedPets.reduce((prev, current) => {
                      const prevAge = prev.dateOfBirth ? getPetAgeInfo(prev.type, prev.dateOfBirth) : null;
                      const currAge = current.dateOfBirth ? getPetAgeInfo(current.type, current.dateOfBirth) : null;
                      if (!prevAge) return current;
                      if (!currAge) return prev;
                      return prevAge.humanYears > currAge.humanYears ? prev : current;
                    });
                    const ageInfo = oldest.dateOfBirth ? getPetAgeInfo(oldest.type, oldest.dateOfBirth) : null;
                    return `${oldest.name} (${ageInfo?.humanYears || 0} human years)`;
                  })()}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-1">Highest Expenses</p>
                <p className="text-lg font-bold text-gray-900">
                  {(() => {
                    const highest = comparedPets.reduce((prev, current) => {
                      const prevTotal = prev.expenses ? Object.values(prev.expenses).reduce((sum, e) => sum + e.amount, 0) : 0;
                      const currTotal = current.expenses ? Object.values(current.expenses).reduce((sum, e) => sum + e.amount, 0) : 0;
                      return currTotal > prevTotal ? current : prev;
                    });
                    const total = highest.expenses ? Object.values(highest.expenses).reduce((sum, e) => sum + e.amount, 0) : 0;
                    return `${highest.name} ($${total.toFixed(2)})`;
                  })()}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

const ComparisonRow = ({ label, icon, values, compareNumbers, highlight }) => {
  const maxValue = compareNumbers ? Math.max(...compareNumbers) : null;
  
  return (
    <tr className={highlight ? 'bg-violet-50' : ''}>
      <td className="p-4 font-semibold text-gray-900">
        <div className="flex items-center gap-2">
          <span className="text-violet-600">{icon}</span>
          <span>{label}</span>
        </div>
      </td>
      {values.map((value, index) => {
        const isMax = compareNumbers && compareNumbers[index] === maxValue && maxValue > 0;
        return (
          <td key={index} className={`p-4 text-center ${isMax ? 'bg-green-50' : ''}`}>
            <span className={`${isMax ? 'font-bold text-green-600' : 'text-gray-700'}`}>
              {value}
              {isMax && compareNumbers.filter(n => n === maxValue).length === 1 && ' 🏆'}
            </span>
          </td>
        );
      })}
    </tr>
  );
};

export default MultiPetCompare;
