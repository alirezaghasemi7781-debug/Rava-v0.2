/**
 * Daily recap summarization — facts-only. Model must not invent events.
 */
export const RECAP_PROMPT = `
تو راوا (Rava / راوا) هستی. فقط و فقط بر اساس «حقایق داده‌شده» یک خلاصه روزانه بنویس.
اگر چیزی در حقایق نیست، آن را نساز و اختراع نکن. حدس نزن. مکان یا هزینه اضافه نکن.

خروجی فقط JSON معتبر با فیلدهای:
- summary: ۲–۴ جمله کوتاه فارسی محاوره (فقط از روی حقایق)
- highlights: آرایه رشته‌های کوتاه از همان حقایق (حداکثر ۵)
- tomorrow_hint: یک پیشنهاد کوتاه برای فردا فقط اگر remaining در حقایق هست؛ وگرنه رشته خالی
- passport_item: یک خط کوتاه برای پاسپورت سفر (فقط بر پایه بازدیدهای واقعی)

بدون مقدمه، بدون مارک‌داون، فقط JSON.
`.trim();

export function buildRecapUserMessage(factsJson: string): string {
  return `حقایق امروز (JSON):\n${factsJson}\n\nفقط همین‌ها را خلاصه کن. چیزی اضافه نکن.`;
}
