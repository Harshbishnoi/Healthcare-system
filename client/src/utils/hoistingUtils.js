/**
 * JavaScript Hoisting Utilities & Demonstrations
 *
 * Demonstrates hoisting behaviors across:
 * 1. Function Declarations (hoisted completely with body to top of scope)
 * 2. Function Expressions / Arrow Functions (variable declaration hoisted, but in TDZ or initialized to undefined)
 * 3. `var` vs `let` / `const` (Temporal Dead Zone semantics)
 */

/**
 * Hoisted Function Declaration: Can be invoked before its definition in source code
 * @param {string} doctorName
 * @param {string} specialization
 * @returns {string}
 */
export function formatDoctorBadge(doctorName, specialization) {
  return `Dr. ${doctorName.replace(/^Dr\.\s*/i, '')} — ${specialization}`;
}

/**
 * Demonstrates Variable Hoisting & Safe Default Resolution
 * @param {Object} inputConfig
 * @returns {Object}
 */
export const resolveScopedConfiguration = (inputConfig = {}) => {
  // Hoisting demonstration: function declaration is accessible throughout the block
  const formattedFee = calculateFormattedFee(inputConfig.fee);

  function calculateFormattedFee(rawFee) {
    const numeric = Number(rawFee) || 0;
    return `$${numeric.toFixed(2)}`;
  }

  // Block-scoped let/const respect Temporal Dead Zone (TDZ)
  const isAvailable = Boolean(inputConfig.isAvailable);

  return {
    fee: formattedFee,
    isAvailable,
    normalized: true,
  };
};
