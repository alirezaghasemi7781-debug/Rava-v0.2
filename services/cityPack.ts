/**
 * City Pack — structured city knowledge for Rava.
 * Short summary goes to system/session prompt; details via get_city_details tool.
 */
import { CityMode } from '../types';
import { assistantCache, CACHE_TTL } from './cache/assistantCache';
import { buildCitySummary } from '../prompts/city-context';
import { discoveryService } from './discoveryService';

export interface CityPack {
  city: string;
  summary: string;
  districts: { name: string; nameFa: string; vibe: string }[];
  transport: { tip: string; cards?: string; hubs?: string[] };
  culture: string[];
  warnings: string[];
  categories: string[];
  selectedPOIs: { id: string; name: string; category: string; lat: number; lng: number }[];
  updatedAt: number;
}

const STATIC_PACKS: Record<string, Omit<CityPack, 'city' | 'summary' | 'selectedPOIs' | 'updatedAt'>> = {
  Istanbul: {
    districts: [
      { name: 'Sultanahmet', nameFa: 'سلطان احمد', vibe: 'تاریخی، موزه، توریست' },
      { name: 'Beyoğlu / Taksim', nameFa: 'بی‌اوغلو / تکسیم', vibe: 'مدرن، شب‌زنده‌داری، خرید' },
      { name: 'Kadıköy', nameFa: 'کادیکوی', vibe: 'محلی، غذا، آسیایی' },
      { name: 'Balat', nameFa: 'بالات', vibe: 'رنگارنگ، پنهان، عکاسی' },
      { name: 'Beşiktaş', nameFa: 'بشی‌ک‌تاش', vibe: 'جوان، کافه، بسفور' },
    ],
    transport: {
      tip: 'İstanbulkart برای مترو، تراموا، متروبوس و کشتی. کشتی (Vapur) ارزان‌ترین ویوی بسفور است.',
      cards: 'İstanbulkart',
      hubs: ['Taksim', 'Eminönü', 'Kadıköy', 'Marmaray'],
    },
    culture: [
      'چانه‌زنی در بازار بزرگ رایج است.',
      'کفش را در مساجد دربیاور؛ شانه‌ها و زانوها پوشیده باشد.',
      'چای رایگان اغلب بعد از خرید تعارف می‌شود.',
    ],
    warnings: [
      'تاکسی‌های فرودگاه گاهی مسیر طولانی می‌گیرند — ترجیحاً BiTaksi یا مترو.',
      'در مناطق شلوغ مراقب جیب‌بری باشید.',
      'جمعه‌ها نماز ظهر مساجد شلوغ است.',
    ],
    categories: [
      'attractions',
      'food',
      'cafes',
      'shopping',
      'nightlife',
      'hidden_gems',
      'budget',
      'family',
      'transport',
      'essentials',
    ],
  },
  Dubai: {
    districts: [
      { name: 'Downtown', nameFa: 'داون‌تاون', vibe: 'برج خلیفه، مال، فواره' },
      { name: 'Marina / JBR', nameFa: 'مارینا / جی‌بی‌آر', vibe: 'ساحل، پیاده‌روی، رستوران' },
      { name: 'Deira / Bur Dubai', nameFa: 'دیره / بر دبی', vibe: 'قدیم، سوق، آبرا' },
      { name: 'Palm Jumeirah', nameFa: 'نخل جمیرا', vibe: 'لوکس، هتل، ویو' },
      { name: 'Al Fahidi', nameFa: 'الفهیدی', vibe: 'میراث، گالری، آرام' },
    ],
    transport: {
      tip: 'کارت Nol برای مترو و اتوبوس. تاکسی رانی و Careem قابل اعتمادند. تابستان پیاده‌روی طولانی توصیه نمی‌شود.',
      cards: 'Nol Card',
      hubs: ['BurJuman', 'Union', 'Mall of the Emirates', 'Airport T1/T3'],
    },
    culture: [
      'ادب رسمی؛ لباس پوشیده در مکان‌های عمومی.',
      'الکل فقط در مجوزدارها؛ مستی در خیابان غیرقانونی است.',
      'عکس از افراد محلی بدون اجازه نگیر.',
    ],
    warnings: [
      'گرمای تابستان خطرناک است — آب زیاد بنوشید، ظهر بیرون نمانید.',
      'جرایم رانندگی و پارکینگ سنگین است.',
      'رمضان: احترام به روزه‌داران در فضای عمومی.',
    ],
    categories: [
      'attractions',
      'food',
      'cafes',
      'shopping',
      'nightlife',
      'hidden_gems',
      'budget',
      'family',
      'transport',
      'essentials',
    ],
  },
  Tehran: {
    districts: [
      { name: 'Tajrish', nameFa: 'تجریش', vibe: 'بازار، کوهپایه' },
      { name: 'Valiasr', nameFa: 'ولیعصر', vibe: 'محور اصلی شهر' },
    ],
    transport: {
      tip: 'مترو و اسنپ اصلی‌ترین گزینه‌ها هستند.',
      hubs: ['Tehran Metro'],
    },
    culture: ['تعارف رایج است.', 'کافه و گالری‌های شمال شهر فعال‌اند.'],
    warnings: ['ترافیک سنگین در ساعات اوج.', 'آلودگی هوا در بعضی روزها.'],
    categories: ['attractions', 'food', 'cafes', 'shopping'],
  },
};

export const cityPackService = {
  getShortSummary(city: CityMode | string | null | undefined): string {
    return buildCitySummary(city);
  },

  async load(city: CityMode | string | null): Promise<CityPack | null> {
    if (!city) return null;
    const key = String(city);

    return assistantCache.getOrFetch('city_pack', key, CACHE_TTL.cityPack, async () => {
      const base = STATIC_PACKS[key] || {
        districts: [],
        transport: { tip: `اطلاعات محدود برای ${key}` },
        culture: [],
        warnings: [],
        categories: ['attractions', 'food', 'cafes'],
      };

      let selectedPOIs: CityPack['selectedPOIs'] = [];
      try {
        const curated = await discoveryService.getCuratedPlaces(key);
        selectedPOIs = curated.slice(0, 12).map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          lat: p.lat,
          lng: p.lng,
        }));
      } catch {
        selectedPOIs = [];
      }

      const pack: CityPack = {
        city: key,
        summary: buildCitySummary(key),
        ...base,
        selectedPOIs,
        updatedAt: Date.now(),
      };
      return pack;
    });
  },

  async getDetails(
    city: CityMode | string | null,
    section?: keyof Omit<CityPack, 'city' | 'updatedAt'>,
  ): Promise<unknown> {
    const pack = await this.load(city);
    if (!pack) return { error: 'شهر مشخص نیست.' };
    if (section && section in pack) {
      return { city: pack.city, [section]: (pack as any)[section] };
    }
    // Don't dump every POI transcript — trim for tool response
    return {
      city: pack.city,
      summary: pack.summary,
      districts: pack.districts,
      transport: pack.transport,
      culture: pack.culture,
      warnings: pack.warnings,
      categories: pack.categories,
      selectedPOIs: pack.selectedPOIs.slice(0, 8),
    };
  },

  async onCityChange(city: CityMode): Promise<void> {
    if (!city) return;
    await assistantCache.invalidate('city_pack', city);
    await this.load(city);
  },
};
