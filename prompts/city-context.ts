import { CityMode } from '../types';
import { assistantCache, CACHE_TTL } from '../services/cache/assistantCache';

const CITY_BLURBS: Record<string, string> = {
  Istanbul: 'استانبول: دو قاره، بازار بزرگ، تکسیم، بسفور، غذای خیابانی و چانه‌زنی. جزئیات را با get_city_details بگیر.',
  Dubai: 'دبی: مترو تمیز، مال‌ها، گرمای شدید تابستان، ادب رسمی و حمل‌ونقل راحت. جزئیات را با get_city_details بگیر.',
  Tehran: 'تهران: ترافیک، مترو، شمال‌شهر/جنوب‌شهر، کافه‌ها و کوه‌پیمایی دربند/توچال.',
};

/**
 * Short city summary for session context — not a full knowledge dump.
 * Full City Pack loads via cityPackService / get_city_details tool.
 */
export function buildCitySummary(city: CityMode | string | null | undefined): string {
  if (!city) return 'شهر هنوز مشخص نشده؛ از مسافر بپرس کجاست.';
  return CITY_BLURBS[city] || `شهر فعلی: ${city}`;
}

/** Cache short prompt blurbs (TTL) for assistant reuse. */
export async function getCachedCityPrompt(city: CityMode | string | null): Promise<string> {
  if (!city) return buildCitySummary(city);
  return assistantCache.getOrFetch('city_prompts', String(city), CACHE_TTL.cityPrompts, async () =>
    buildCitySummary(city),
  );
}
