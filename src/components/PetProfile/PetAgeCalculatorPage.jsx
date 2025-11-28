import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiInfo } from 'react-icons/fi';
import { FaDog, FaCat, FaPaw, FaBirthdayCake } from 'react-icons/fa';
import { getPetAgeInfo, calculateDogAge, calculateCatAge } from '../../utils/petAgeCalculator';

const PetAgeCalculator = ({ initialPet }) => {
  const [petType, setPetType] = useState(initialPet?.type || 'dog');
  const [dateOfBirth, setDateOfBirth] = useState(
    initialPet?.dateOfBirth || new Date().toISOString().split('T')[0]
  );
  const [showResults, setShowResults] = useState(!!initialPet?.dateOfBirth);

  const ageInfo = dateOfBirth ? getPetAgeInfo(petType, dateOfBirth) : null;

  const handleCalculate = () => {
    setShowResults(true);
  };

  // Calculate future milestones
  const getFutureMilestones = () => {
    if (!ageInfo) return [];
    
    const milestones = [];
    const birthDate = new Date(dateOfBirth);
    const currentAge = ageInfo.ageInYears;

    const lifeStageMilestones = {
      dog: [
        { age: 0.5, stage: 'Young Puppy', humanAge: 7 },
        { age: 1, stage: 'Adolescent', humanAge: 15 },
        { age: 3, stage: 'Adult', humanAge: 28 },
        { age: 7, stage: 'Mature', humanAge: 47 },
        { age: 10, stage: 'Senior', humanAge: 60 }
      ],
      cat: [
        { age: 0.5, stage: 'Young Kitten', humanAge: 7 },
        { age: 1, stage: 'Adolescent', humanAge: 15 },
        { age: 3, stage: 'Young Adult', humanAge: 28 },
        { age: 7, stage: 'Mature', humanAge: 44 },
        { age: 11, stage: 'Senior', humanAge: 60 }
      ]
    };

    const stages = lifeStageMilestones[petType] || lifeStageMilestones.dog;
    
    stages.forEach(milestone => {
      if (milestone.age > currentAge) {
        const milestoneDate = new Date(birthDate);
        milestoneDate.setFullYear(birthDate.getFullYear() + Math.floor(milestone.age));
        milestoneDate.setMonth(birthDate.getMonth() + Math.round((milestone.age % 1) * 12));
        
        milestones.push({
          age: milestone.age,
          stage: milestone.stage,
          humanAge: milestone.humanAge,
          date: milestoneDate,
          monthsUntil: Math.round((milestoneDate - new Date()) / (1000 * 60 * 60 * 24 * 30))
        });
      }
    });

    return milestones.slice(0, 3); // Return next 3 milestones
  };

  const futureMilestones = showResults ? getFutureMilestones() : [];

  return (
    <div className="space-y-6">
      {/* Calculator Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <FaBirthdayCake className="w-7 h-7 text-violet-600" />
          Pet Age Calculator
        </h2>

        <div className="space-y-6">
          {/* Pet Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Pet Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPetType('dog')}
                className={`p-6 rounded-xl border-2 transition-all ${
                  petType === 'dog'
                    ? 'border-violet-500 bg-violet-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FaDog className={`w-12 h-12 mx-auto mb-3 ${
                  petType === 'dog' ? 'text-violet-600' : 'text-gray-400'
                }`} />
                <p className={`text-lg font-semibold ${
                  petType === 'dog' ? 'text-violet-600' : 'text-gray-600'
                }`}>
                  Dog
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPetType('cat')}
                className={`p-6 rounded-xl border-2 transition-all ${
                  petType === 'cat'
                    ? 'border-violet-500 bg-violet-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FaCat className={`w-12 h-12 mx-auto mb-3 ${
                  petType === 'cat' ? 'text-violet-600' : 'text-gray-400'
                }`} />
                <p className={`text-lg font-semibold ${
                  petType === 'cat' ? 'text-violet-600' : 'text-gray-600'
                }`}>
                  Cat
                </p>
              </button>
            </div>
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Date of Birth
            </label>
            <div className="relative">
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
              />
              <FiCalendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Calculate Button */}
          <button
            onClick={handleCalculate}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Calculate Age
          </button>
        </div>
      </motion.div>

      {/* Results */}
      {showResults && ageInfo && (
        <>
          {/* Main Age Display */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-8 text-white shadow-2xl"
          >
            <div className="text-center mb-6">
              <div className="text-7xl mb-4">{ageInfo.lifeStage?.emoji || '🐾'}</div>
              <h3 className="text-2xl font-bold mb-2">Your {petType} is</h3>
              <div className="text-6xl font-bold mb-4">{ageInfo.humanAge}</div>
              <p className="text-2xl opacity-90">human years old</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <p className="text-sm opacity-90 mb-1">Actual Age</p>
                <p className="text-2xl font-bold">
                  {ageInfo.actualAge?.years || 0}y {ageInfo.actualAge?.months || 0}m
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <p className="text-sm opacity-90 mb-1">Life Stage</p>
                <p className="text-2xl font-bold">{ageInfo.lifeStage?.stage}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <p className="text-sm opacity-90 mb-1">Days Old</p>
                <p className="text-2xl font-bold">
                  {Math.floor((new Date() - new Date(dateOfBirth)) / (1000 * 60 * 60 * 24))}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Life Stage Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`bg-gradient-to-r ${ageInfo.lifeStage?.color || 'from-violet-400 to-purple-400'} rounded-2xl p-6 text-white shadow-lg`}
          >
            <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
              <FiInfo className="w-6 h-6" />
              {ageInfo.lifeStage?.stage} Stage
            </h3>
            <p className="text-lg opacity-90 mb-4">{ageInfo.lifeStage?.description}</p>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <h4 className="font-semibold mb-3">Care Tips:</h4>
              <ul className="space-y-2">
                {ageInfo.lifeStage?.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-xl">✓</span>
                    <span className="flex-1">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Fun Fact */}
          {ageInfo.funFact && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200"
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl">💡</div>
                <div>
                  <h3 className="text-lg font-bold text-amber-900 mb-2">Fun Fact</h3>
                  <p className="text-amber-800">{ageInfo.funFact}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Future Milestones */}
          {futureMilestones.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                🎯 Upcoming Milestones
              </h3>
              <div className="space-y-4">
                {futureMilestones.map((milestone, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-200"
                  >
                    <div>
                      <p className="font-bold text-gray-900">{milestone.stage}</p>
                      <p className="text-sm text-gray-600">
                        {milestone.age} years old • {milestone.humanAge} human years
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-violet-600">
                        {milestone.date.toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        in {milestone.monthsUntil} months
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Age Conversion Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">Age Conversion Chart</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-violet-50">
                  <tr>
                    <th className="p-3 text-left text-sm font-semibold text-gray-900">Pet Age</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-900">Human Years</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-900">Life Stage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[0.5, 1, 2, 3, 5, 7, 10, 13, 16].map(age => {
                    const humanAge = petType === 'dog' ? calculateDogAge(age) : calculateCatAge(age);
                    const tempAgeInfo = getPetAgeInfo(petType, 
                      new Date(new Date().setFullYear(new Date().getFullYear() - Math.floor(age))).toISOString().split('T')[0]
                    );
                    return (
                      <tr key={age} className={age === Math.floor(ageInfo.ageInYears) ? 'bg-violet-50' : ''}>
                        <td className="p-3 text-gray-900">{age} years</td>
                        <td className="p-3 text-gray-900 font-semibold">{humanAge} years</td>
                        <td className="p-3 text-gray-600">{tempAgeInfo?.lifeStage?.stage}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default PetAgeCalculator;
