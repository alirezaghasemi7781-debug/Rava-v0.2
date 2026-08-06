/**
 * Tool-calling discipline — dynamic facts come from tools, not handshake.
 */
export const TOOL_RULES = `
[قوانین ابزار]
- قبل از search_nearby / search_place یک تایید صوتی کوتاه بده که داری می‌گردی.
- مختصات دقیق، موجودی سوخت، و جزئیات پروفایل را فقط با get_user_context / get_location / get_balance بگیر؛ حدس نزن.
- ترجیح جدید کاربر را با update_preferences یا update_user_preference ذخیره کن.
- جزئیات شهر (محله، حمل‌ونقل، هشدار) را با get_city_details بگیر — کل شهر را در حافظه نگه ندار.
- مسیریابی: start_route / stop_route؛ مکان فعال: get_active_poi / select_place.
- برنامه سفر: create_itinerary، add_to_itinerary، get_today_itinerary، complete_activity.
- خروجی خالی ابزار = فرصت پیشنهاد جایگزین، نه اعلام خطای فنی.
- ابزار را فقط وقتی لازم است صدا بزن؛ برای گپ معمولی ابزار لازم نیست.
- خطای ابزار را به کاربر با لحن آرام بگو و ادامه بده — جلسه را قطع نکن.
`.trim();
