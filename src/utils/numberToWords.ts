/**
 * Indian Number to Words Formatter
 * Converts a numeric amount (INR) to words according to the Indian numbering system.
 * e.g., 125000 -> "One Lakh Twenty Five Thousand Rupees Only"
 */

export function numberToIndianWords(num: number): string {
  if (isNaN(num) || num <= 0) return 'Zero Rupees Only';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n: number): string => {
    let str = '';
    if (n > 99) {
      str += a[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n > 19) {
      str += b[Math.floor(n / 10)] + ' ' + a[n % 10];
    } else if (n > 0) {
      str += a[n];
    }
    return str.trim();
  };

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  let output = '';

  const crore = Math.floor(integerPart / 10000000);
  let rem = integerPart % 10000000;
  const lakh = Math.floor(rem / 100000);
  rem %= 100000;
  const thousand = Math.floor(rem / 1000);
  const hundredAndRest = rem % 1000;

  if (crore > 0) output += inWords(crore) + ' Crore ';
  if (lakh > 0) output += inWords(lakh) + ' Lakh ';
  if (thousand > 0) output += inWords(thousand) + ' Thousand ';
  if (hundredAndRest > 0) output += inWords(hundredAndRest);

  output = output.trim();
  if (!output) {
    output = 'Zero';
  }

  output += ' Rupees';

  if (decimalPart > 0) {
    output += ' and ' + inWords(decimalPart) + ' Paise';
  }

  return output + ' Only';
}
