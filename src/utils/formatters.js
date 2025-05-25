/**
 * Format a date string to a localized format
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '';
    
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Format a number as Nepali Rupees (NPR)
 * @param {number} amount - The amount to format
 * @param {boolean} showSymbol - Whether to show the currency symbol (default: true)
 * @returns {string} Formatted price string
 */
export const formatPrice = (amount, showSymbol = true) => {
  // Return empty string if amount is null/undefined
  if (amount == null) return '';
  
  // Convert to number if string
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Return empty string if not a valid number
  if (isNaN(numAmount)) return '';
  
  try {
    const formatter = new Intl.NumberFormat('ne-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    const formatted = formatter.format(numAmount);
    return showSymbol ? formatted : formatted.replace(/[^\d.,]/g, '');
  } catch (error) {
    console.error('Error formatting price:', error);
    return showSymbol ? `NRs. ${numAmount.toFixed(2)}` : numAmount.toFixed(2);
  }
};

/**
 * Format a number with commas for thousands
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (num) => {
  if (num == null) return '';
  
  try {
    return new Intl.NumberFormat('en-IN').format(num);
  } catch (error) {
    console.error('Error formatting number:', error);
    return num.toString();
  }
}; 