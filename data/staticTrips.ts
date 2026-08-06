import { StaticTripTemplate } from '../types';

/**
 * Predefined itinerary templates for Rava (راوا).
 * Cloned into user_trips + trips as a personalized copy.
 */
export const STATIC_TRIPS: StaticTripTemplate[] = [
  {
    id: 'ist-budget-3d',
    city: 'Istanbul',
    title: 'Three-day budget Istanbul',
    titleFa: 'استانبول سه‌روزه اقتصادی',
    description: 'بازار، مساجد، و خیابان‌گردی بدون ولخرجی.',
    days: 3,
    budgetStyle: 'budget',
    tags: ['budget', 'culture', 'walk'],
    activities: [
      { dayOffset: 0, type: 'activity', title: 'ایاصوفیه و میدان سلطان احمد', time: '09:30', sequence: 0, placeName: 'Hagia Sophia', coordinates: [41.0086, 28.9802], details: { notes: 'صبح زود برو تا شلوغ نباشه', price: 0 } },
      { dayOffset: 0, type: 'food', title: 'صبحانه در سلطان احمد', time: '11:00', sequence: 1, placeName: 'Sultanahmet breakfast', coordinates: [41.0058, 28.9770], details: { price: 8 } },
      { dayOffset: 0, type: 'activity', title: 'بازار بزرگ (گرند بازار)', time: '14:00', sequence: 2, placeName: 'Grand Bazaar', coordinates: [41.0107, 28.9680], details: { notes: 'چونه بزن، عجله نکن', price: 0 } },
      { dayOffset: 0, type: 'food', title: 'کباب یا دونر خیابانی', time: '19:00', sequence: 3, placeName: 'Street kebab', coordinates: [41.0110, 28.9700], details: { price: 6 } },
      { dayOffset: 1, type: 'activity', title: 'برج گالاتا و کاراکوی', time: '10:00', sequence: 0, placeName: 'Galata Tower', coordinates: [41.0256, 28.9744], details: { price: 10 } },
      { dayOffset: 1, type: 'food', title: 'قهوه و باقلوا در کاراکوی', time: '13:00', sequence: 1, placeName: 'Karaköy cafe', coordinates: [41.0230, 28.9755], details: { price: 5 } },
      { dayOffset: 1, type: 'activity', title: 'کشتی تنگه بسفر (اقتصادی)', time: '16:00', sequence: 2, placeName: 'Bosphorus ferry', coordinates: [41.0225, 28.9760], details: { price: 2 } },
      { dayOffset: 2, type: 'activity', title: 'پیاده‌روی اورتاکوی', time: '10:30', sequence: 0, placeName: 'Ortaköy', coordinates: [41.0554, 29.0270], details: { price: 0 } },
      { dayOffset: 2, type: 'food', title: 'سمیت اورتاکوی', time: '12:30', sequence: 1, placeName: 'Ortaköy kumpir/simit', coordinates: [41.0550, 29.0265], details: { price: 4 } },
      { dayOffset: 2, type: 'activity', title: 'غروب در اسکله کادیکوی', time: '17:30', sequence: 2, placeName: 'Kadıköy waterfront', coordinates: [40.9900, 29.0250], details: { price: 0 } },
    ],
  },
  {
    id: 'ist-luxury-weekend',
    city: 'Istanbul',
    title: 'Luxury weekend Istanbul',
    titleFa: 'ویکند لوکس استانبول',
    description: 'هتل بوتیک، رستوران‌های سطح بالا، و ویوی بسفر.',
    days: 2,
    budgetStyle: 'luxury',
    tags: ['luxury', 'food', 'spa'],
    activities: [
      { dayOffset: 0, type: 'hotel', title: 'چک‌این هتل بوتیک بسفری', time: '14:00', sequence: 0, placeName: 'Bosphorus boutique hotel', coordinates: [41.0480, 29.0100], details: { address: 'Beşiktaş waterfront', price: 280 } },
      { dayOffset: 0, type: 'activity', title: 'حمام سنتی خصوصی', time: '16:30', sequence: 1, placeName: 'Private hammam', coordinates: [41.0065, 28.9760], details: { price: 90 } },
      { dayOffset: 0, type: 'food', title: 'شام ریزرو با ویوی شهر', time: '20:00', sequence: 2, placeName: 'Fine dining Istanbul', coordinates: [41.0320, 28.9850], details: { price: 120 } },
      { dayOffset: 1, type: 'food', title: 'برانچ لوکس در نیشانتشی', time: '11:00', sequence: 0, placeName: 'Nişantaşı brunch', coordinates: [41.0505, 28.9940], details: { price: 55 } },
      { dayOffset: 1, type: 'activity', title: 'گشت خصوصی بسفر با قایق', time: '15:00', sequence: 1, placeName: 'Private Bosphorus cruise', coordinates: [41.0400, 29.0050], details: { price: 200 } },
      { dayOffset: 1, type: 'food', title: 'دسر و قهوه در پرا', time: '18:30', sequence: 2, placeName: 'Pera pastry', coordinates: [41.0315, 28.9748], details: { price: 25 } },
    ],
  },
  {
    id: 'ist-food-cafes',
    city: 'Istanbul',
    title: 'Istanbul food and cafés',
    titleFa: 'استانبول خوراک و کافه',
    description: 'مسیر طعم: از بالات تا کادیکوی.',
    days: 2,
    budgetStyle: 'mid',
    tags: ['food', 'cafe', 'local'],
    activities: [
      { dayOffset: 0, type: 'food', title: 'صبحانه آناتولیایی در بالات', time: '09:30', sequence: 0, placeName: 'Balat breakfast', coordinates: [41.0295, 28.9485], details: { price: 12 } },
      { dayOffset: 0, type: 'activity', title: 'پیاده‌روی رنگین‌کمانی بالات', time: '11:30', sequence: 1, placeName: 'Balat streets', coordinates: [41.0290, 28.9490], details: { price: 0 } },
      { dayOffset: 0, type: 'food', title: 'ناهار ماهی در امینونو', time: '13:30', sequence: 2, placeName: 'Eminönü fish sandwich', coordinates: [41.0172, 28.9700], details: { price: 7 } },
      { dayOffset: 0, type: 'food', title: 'کافه تخصص‌گرا در کاراکوی', time: '16:00', sequence: 3, placeName: 'Specialty coffee Karaköy', coordinates: [41.0240, 28.9740], details: { price: 6 } },
      { dayOffset: 1, type: 'food', title: 'بازار خوراک کادیکوی', time: '11:00', sequence: 0, placeName: 'Kadıköy food market', coordinates: [40.9905, 29.0275], details: { price: 15 } },
      { dayOffset: 1, type: 'food', title: 'شربت و باقلوا', time: '15:00', sequence: 1, placeName: 'Kadıköy sweets', coordinates: [40.9910, 29.0260], details: { price: 5 } },
      { dayOffset: 1, type: 'food', title: 'شام میخانه‌ای مودا', time: '20:00', sequence: 2, placeName: 'Moda meyhane', coordinates: [40.9840, 29.0250], details: { price: 35 } },
    ],
  },
  {
    id: 'dxb-family',
    city: 'Dubai',
    title: 'Family-friendly Dubai',
    titleFa: 'دبی خانوادگی',
    description: 'پارک، آکواریوم، و پیاده‌روی بدون استرس.',
    days: 3,
    budgetStyle: 'mid',
    tags: ['family', 'kids', 'safe'],
    activities: [
      { dayOffset: 0, type: 'activity', title: 'دبی فریم و ویوی شهر', time: '10:00', sequence: 0, placeName: 'Dubai Frame', coordinates: [25.2352, 55.3002], details: { price: 50 } },
      { dayOffset: 0, type: 'food', title: 'ناهار خانوادگی در دبی مال', time: '13:00', sequence: 1, placeName: 'Dubai Mall dining', coordinates: [25.1985, 55.2796], details: { price: 40 } },
      { dayOffset: 0, type: 'activity', title: 'آکواریوم دبی مال', time: '15:00', sequence: 2, placeName: 'Dubai Aquarium', coordinates: [25.1980, 55.2790], details: { price: 45 } },
      { dayOffset: 0, type: 'activity', title: 'چشمه رقصان دبی فوارین', time: '19:00', sequence: 3, placeName: 'Dubai Fountain', coordinates: [25.1950, 55.2780], details: { price: 0 } },
      { dayOffset: 1, type: 'activity', title: 'پارک Miracle Garden', time: '10:00', sequence: 0, placeName: 'Miracle Garden', coordinates: [25.0600, 55.2440], details: { price: 55 } },
      { dayOffset: 1, type: 'food', title: 'بستنی و استراحت', time: '13:30', sequence: 1, placeName: 'Garden cafe', coordinates: [25.0605, 55.2445], details: { price: 15 } },
      { dayOffset: 1, type: 'activity', title: 'ساحل جمیرا (آرام)', time: '16:30', sequence: 2, placeName: 'Jumeirah Beach', coordinates: [25.1920, 55.2310], details: { price: 0 } },
      { dayOffset: 2, type: 'activity', title: 'پارک آبی / روز خانوادگی', time: '10:30', sequence: 0, placeName: 'Family park day', coordinates: [25.0800, 55.1400], details: { price: 80 } },
      { dayOffset: 2, type: 'food', title: 'شام سبک در مارینا', time: '18:30', sequence: 1, placeName: 'Marina family dinner', coordinates: [25.0805, 55.1405], details: { price: 50 } },
    ],
  },
  {
    id: 'dxb-fast-2d',
    city: 'Dubai',
    title: 'Fast two-day Dubai',
    titleFa: 'دبی دو‌روزه فشرده',
    description: 'هایلایت‌های اصلی در ۴۸ ساعت.',
    days: 2,
    budgetStyle: 'mid',
    tags: ['fast', 'icons', 'photo'],
    activities: [
      { dayOffset: 0, type: 'activity', title: 'برج خلیفه / آت د تاپ', time: '10:00', sequence: 0, placeName: 'Burj Khalifa', coordinates: [25.1972, 55.2744], details: { price: 150 } },
      { dayOffset: 0, type: 'activity', title: 'دبی مال و فوارین', time: '13:00', sequence: 1, placeName: 'Dubai Mall', coordinates: [25.1985, 55.2796], details: { price: 0 } },
      { dayOffset: 0, type: 'food', title: 'ناهار سریع فودکورت', time: '14:30', sequence: 2, placeName: 'Mall food court', coordinates: [25.1983, 55.2794], details: { price: 25 } },
      { dayOffset: 0, type: 'activity', title: 'غروب در مارینا والک', time: '18:00', sequence: 3, placeName: 'Dubai Marina Walk', coordinates: [25.0760, 55.1330], details: { price: 0 } },
      { dayOffset: 1, type: 'activity', title: 'شهر قدیمی و بازار ادویه', time: '10:00', sequence: 0, placeName: 'Spice Souk', coordinates: [25.2695, 55.2972], details: { price: 0 } },
      { dayOffset: 1, type: 'activity', title: 'عکس با برج العرب از ساحل', time: '15:00', sequence: 1, placeName: 'Burj Al Arab viewpoint', coordinates: [25.1412, 55.1853], details: { price: 0 } },
      { dayOffset: 1, type: 'food', title: 'شام در جمیرا', time: '19:30', sequence: 2, placeName: 'Jumeirah dinner', coordinates: [25.2100, 55.2500], details: { price: 45 } },
    ],
  },
  {
    id: 'dxb-shop-ent',
    city: 'Dubai',
    title: 'Dubai shopping and entertainment',
    titleFa: 'دبی خرید و تفریح',
    description: 'مال‌ها، گلوبال ویلیج، و شب‌زنده‌داری سبک.',
    days: 2,
    budgetStyle: 'luxury',
    tags: ['shopping', 'entertainment', 'nightlife'],
    activities: [
      { dayOffset: 0, type: 'activity', title: 'خرید در دبی مال', time: '11:00', sequence: 0, placeName: 'Dubai Mall shopping', coordinates: [25.1985, 55.2796], details: { price: 0 } },
      { dayOffset: 0, type: 'food', title: 'ناهار در فشن‌اونیو', time: '14:00', sequence: 1, placeName: 'Fashion Avenue dining', coordinates: [25.1978, 55.2788], details: { price: 70 } },
      { dayOffset: 0, type: 'activity', title: 'دبی اپرا / نمایش عصر', time: '18:30', sequence: 2, placeName: 'Dubai Opera area', coordinates: [25.1945, 55.2785], details: { price: 100 } },
      { dayOffset: 1, type: 'activity', title: 'مال آف امارات + اسکی دبی', time: '11:00', sequence: 0, placeName: 'Mall of the Emirates', coordinates: [25.1181, 55.2006], details: { price: 120 } },
      { dayOffset: 1, type: 'activity', title: 'گلوبال ویلیج (فصلی)', time: '17:00', sequence: 1, placeName: 'Global Village', coordinates: [25.0680, 55.3100], details: { price: 25 } },
      { dayOffset: 1, type: 'food', title: 'استریت‌فود بین‌المللی', time: '19:30', sequence: 2, placeName: 'Global Village food', coordinates: [25.0682, 55.3102], details: { price: 30 } },
    ],
  },
];

export function getStaticTrip(id: string): StaticTripTemplate | undefined {
  return STATIC_TRIPS.find((t) => t.id === id);
}

export function getStaticTripsForCity(city: string | null | undefined): StaticTripTemplate[] {
  if (!city) return STATIC_TRIPS;
  return STATIC_TRIPS.filter((t) => t.city === city);
}
