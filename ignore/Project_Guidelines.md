# הוספת מערכת שיתוף ומעקב תנועה (Social Share & UTM Analytics)

המטרה: לאפשר למשתמשים לשתף את החנות והמוצרים בצורה חכמה, תוך כדי מעקב ואנליטיקה מלאה שמגיעה עד לפאנל הניהול, כולל אפשרות לאיפוס נתונים.

## User Review Required

> [!IMPORTANT]
> **מבנה בסיס הנתונים:**
> ניצור טבלה חדשה בבסיס הנתונים בשם `traffic_visits` שתכיל את העמודות הבאות:
> - `id`: מזהה ייחודי
> - `source`: מקור ההגעה (למשל: `share_whatsapp`, `share_facebook` או `organic`)
> - `created_at`: תאריך ושעת הביקור
> כיוון שמדובר בשינוי סכמה, נריץ מיגרציה באמצעות Alembic לאחר אישור התוכנית.

## Open Questions

> [!TIP]
> 1. **מבנה קישורים:** כרגע השיתוף מוגדר להוסיף את הפרמטר בסוף כתובת ה-URL ככה: `?ref=share_whatsapp`. האם זה בסדר, או שאתה מעדיף פרמטר אחר כמו `?utm_source=whatsapp`? (לצורך התוכנית אשתמש ב-`ref`).
> 2. **אייקון השיתוף:** בווידג'ט עצמו, האם תרצה להשתמש באייקון רגיל של שיתוף (Share2) מ-Lucide-React?

## Proposed Changes

---

### Backend - Database & Tracking API

#### [MODIFY] [backend/app/domains/products/models.py](file:///home/yaakov/Desktop/bingo.online/backend/app/domains/products/models.py)
- הוספת מודל `TrafficVisit` (SQLAlchemy).

#### [MODIFY] [backend/app/domains/products/schemas.py](file:///home/yaakov/Desktop/bingo.online/backend/app/domains/products/schemas.py)
- הוספת סכימה חדשה `TrackVisitCreate` המקבלת `source` מסוג מחרוזת.

#### [MODIFY] [backend/app/domains/products/services.py](file:///home/yaakov/Desktop/bingo.online/backend/app/domains/products/services.py)
- הוספת פונקציה `track_visit` ששומרת רשומה חדשה בטבלת `TrafficVisit`.

#### [MODIFY] [backend/app/domains/products/routes.py](file:///home/yaakov/Desktop/bingo.online/backend/app/domains/products/routes.py)
- חשיפת חלונית קצה ציבורית חדשה: `POST /products/track-visit`.

---

### Backend - Admin Analytics

#### [MODIFY] [backend/app/domains/admin/schemas.py](file:///home/yaakov/Desktop/bingo.online/backend/app/domains/admin/schemas.py)
- הרחבת `SalesReportOut` כך שיכלול שדה חדש: `traffic_sources: Dict[str, int]`.

#### [MODIFY] [backend/app/domains/admin/services.py](file:///home/yaakov/Desktop/bingo.online/backend/app/domains/admin/services.py)
- עדכון `get_sales_report` לכלול אגרגציה (GROUP BY) של כלל הביקורים מקובצים לפי ה-`source`.
- יצירת פונקציה חדשה `clear_traffic_data` שמוחקת את כל הנתונים מטבלת `TrafficVisit`.

#### [MODIFY] [backend/app/domains/admin/routes.py](file:///home/yaakov/Desktop/bingo.online/backend/app/domains/admin/routes.py)
- הוספת נקודת קצה מוגנת: `DELETE /reports/traffic` שתאפשר למנהל לאפס את הסטטיסטיקות.

---

### Frontend - Tracking Logic

#### [MODIFY] [frontend/src/App.jsx](file:///home/yaakov/Desktop/bingo.online/frontend/src/App.jsx)
- הוספת מאזין גלובלי (`useEffect`) בטעינת האפליקציה שקורא את כתובת ה-URL ומחפש את הפרמטר `ref`.
- במידה ונמצא ערך, ולא קיים דגל במטמון העמוד (`sessionStorage`), הוא ישלח בקשת `POST` לשרת ויסמן את הביקור כדי לא לספור את אותו משתמש כפול במהלך הסשן הנוכחי.

---

### Frontend - User Interface

#### [NEW] [frontend/src/components/ShareWidget.jsx](file:///home/yaakov/Desktop/bingo.online/frontend/src/components/ShareWidget.jsx)
- יצירת קומפוננטת שיתוף התומכת קודם כל ב-`navigator.share` (טבעי במובייל).
- במידה ואין תמיכה (למשל במחשב), יפתח מודל מעוצב עם אפשרויות בחירה (WhatsApp, Facebook, Telegram, העתקת קישור).
- כל כפתור יוסיף אוטומטית את פרמטר המעקב הרלוונטי בסוף הקישור וישתף.

#### [MODIFY] [frontend/src/features/catalog/CatalogView.jsx](file:///home/yaakov/Desktop/bingo.online/frontend/src/features/catalog/CatalogView.jsx)
- הוספת הווידג'ט בראש עמוד הקטלוג (ישמש לשיתוף החנות כולה, קרי ה-`window.location.origin`).

#### [MODIFY] [frontend/src/features/catalog/ProductDetailView.jsx](file:///home/yaakov/Desktop/bingo.online/frontend/src/features/catalog/ProductDetailView.jsx)
- הוספת הווידג'ט לצד שם המוצר (ישמש לשיתוף העמוד הספציפי כולל ה-ID שלו: `window.location.href`).

#### [MODIFY] [frontend/src/features/admin/AdminDashboard.jsx](file:///home/yaakov/Desktop/bingo.online/frontend/src/features/admin/AdminDashboard.jsx)
- הוספת "קלף" חדש בשם "מקורות הגעה" (Traffic Sources).
- יציג רשימה מסכמת של מאיפה משתמשים הגיעו (למשל: whatsapp: 15).
- הוספת כפתור "איפוס נתונים" בצבע אדום, המלווה בהתראת `window.confirm`.
- אישור ההתראה יקרא ל-`DELETE /api/v1/admin/reports/traffic` וירענן את הנתונים.

## Verification Plan

### Automated Tests
- וידוא שמיגרציית Alembic עוברת בהצלחה (קובץ המיגרציה נוצר והטבלה מוקמת כהלכה בפוסטגרס).

### Manual Verification
1. יצירת קישור מעקב באופן ידני (למשל הוספת `?ref=test` בסוף ה-URL המקומי). טעינת העמוד ווידוא קריאה לשרת באמצעות כלי המפתחים.
2. כניסה לפאנל הניהול ווידוא שהביקור "test" מופיע בעמודת "מקורות הגעה".
3. לחיצה על כפתור השיתוף מתוך קטלוג הראשי ומתוך עמוד מוצר ספציפי, בדיקה שהפרמטר `?ref=share_whatsapp` מצטרף לקישור.
4. לחיצה על "איפוס נתונים" בפאנל הניהול ווידוא שהסטטיסטיקה מתאפסת מידית מבלי לפגוע בנתוני המכירות/הזמנות.


