type CustomSlots = {
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
};

export function buildCustomPlanName(slots: CustomSlots): string {
  const parts: string[] = [];
  if (slots.breakfast) {
    parts.push('Breakfast');
  }
  if (slots.lunch) {
    parts.push('Lunch');
  }
  if (slots.dinner) {
    parts.push('Dinner');
  }
  return parts.length > 0 ? parts.join(' + ') : 'Custom';
}
