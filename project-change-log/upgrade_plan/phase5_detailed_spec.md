
# 🧠 مشخصات فنی فاز ۵: بلوغ عامل هوشمند

## ۱. حافظه معنایی (Semantic Memory)
- **جدول:** اضافه شدن ستون `semantic_profile` به جدول `profiles`.
- **فرایند:** هر شب یک Edge Function چت‌های ذخیره شده در `chat_logs` را می‌خواند و خلاصه‌ای از شخصیت کاربر را آپدیت می‌کند.
- **مثال:** "کاربر از پیاده‌روی خسته می‌شود و رستوران‌های دنج را به شلوغ ترجیح می‌دهد."

## ۲. ابزار تایید خودکار (Auto-Verification)
- **Webhook:** اتصال جدول `price_reports` به Edge Function.
- **Logic:** 
  1. کاربر عکسی از یک منو آپلود می‌کند.
  2. جمینی تصویر را تحلیل می‌کند.
  3. اگر قیمت اعلامی کاربر با تصویر مطابقت داشت -> `status = 'verified'`.
  4. اجرای RPC `increment_wallet(0.5, 100)`.
  5. ارسال Broadcast Realtime به کلاینت.

## ۳. تزریق کانتکست لحظه‌ای (Context Injection)
- **هوک:** ارتقای `useGeminiLive`.
- **Payload:** ارسال آبجکت زیر قبل از هر شروع چت:
  ```json
  {
    "city": "Istanbul",
    "nearby": ["POI_ID_1", "POI_ID_2"],
    "user_preferences": "Loves history, hates seafood",
    "wallet_balance": "120 minutes"
  }
  ```

---
*این فاز، رهنما را از یک بات معمولی به یک دستیار لوکس تبدیل می‌کند که انگار سال‌هاست شما را می‌شناسد.*
