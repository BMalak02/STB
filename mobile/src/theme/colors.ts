// ─── Design Tokens — STB SmartCredit (Minimal & Professional) ────────────────

export const COLORS = {
  // Brand
  primary:       '#1565C0',
  primaryLight:  '#E3F0FF',
  primaryMid:    '#BBDEFB',
  primaryDark:   '#0D47A1',
  accent:        '#1E88E5',
  accentLight:   '#E3F2FD',

  // Semantic
  success:       '#2E7D32',
  successLight:  '#E8F5E9',
  warning:       '#E65100',
  warningLight:  '#FFF3E0',
  error:         '#C62828',
  errorLight:    '#FFEBEE',

  // Neutral scale
  white:         '#FFFFFF',
  background:    '#F8FAFC',
  surface:       '#FFFFFF',
  border:        '#E2E8F0',
  borderLight:   '#F1F5F9',

  // Text
  text:          '#0F172A',
  textLight:     '#374151',
  textMuted:     '#64748B',
  textHint:      '#94A3B8',

  // Legacy / kept for compat
  gold:          '#F59E0B',
};

export const GRADIENTS = {
  primary: [COLORS.primaryDark, COLORS.primary] as [string, string],
};
