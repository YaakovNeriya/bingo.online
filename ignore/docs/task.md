# משימות: מנגנון מחיקת לוגים אוטומטי (Cron Job)

- [x] **שלב 1: התקנת תלויות**
  - [x] הוספת `apscheduler` ל-`requirements.txt`.
  - [x] הרצת `pip install apscheduler` בתוך השרת.

- [x] **שלב 2: יצירת פונקציית מחיקה**
  - [x] ב-`app/core/audit.py`, יצירת פונקציית `delete_old_audit_logs(days=400)`.

- [x] **שלב 3: חיבור ל-FastAPI Lifespan**
  - [x] יצירת ה-`AsyncIOScheduler`.
  - [x] הגדרת ה-`lifespan` ב-`app/__init__.py`.
  - [x] קינפוג המשימה לרוץ פעם בשבוע (`interval`, `weeks=1`).

- [x] **שלב 4: כתיבת בדיקה אוטומטית (Test)**
  - [x] ב-`tests/test_audit.py`, הוספת טסט שמוודא שרק לוגים בני יותר מ-400 יום נמחקים.
