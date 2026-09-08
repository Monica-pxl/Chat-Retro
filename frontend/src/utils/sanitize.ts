// Instalar: npm install xss
import xss from 'xss';

export const sanitizeMessage = (text: string): string => {
  if (!text) return '';

  let sanitized = text.trim();

  if (sanitized.length > 1000) {
    sanitized = sanitized.substring(0, 1000);
  }

  sanitized = xss(sanitized, {
    whiteList: {},
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style'],
  });

  return sanitized;
};

export const renderSafeMessage = (text: string): string => {
  if (!text) return '';
  return xss(text, {
    whiteList: {},
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style'],
  });
};