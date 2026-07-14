# פיצול סביבות: Production (Hetzner) ו- Staging (GCP)

המטרה: יצירת תהליך פיתוח מקצועי בו ענף `staging` בגיט מתעדכן אוטומטית בשרת הבדיקות בגוגל, וענף `main` מתעדכן בשרת הייצור ב-Hetzner.

## User Review Required
> [!IMPORTANT]  
> הפיצול דורש לשכפל את חלק מהסודות בגיטהאב. נצטרך לתת להם קידומות (Prefix) כדי שהמערכת תדע איזה סוד שייך לאיזה שרת.
> למשל: `PROD_VPS_HOST` לעומת `STAGING_VPS_HOST`. אני אעדכן את קובץ ה-`.env.example` בהתאם.

## Proposed Changes

### GitHub Workflows

#### [MODIFY] .github/workflows/deploy.yml
- אשנה את השם ל- "Deploy to Production".
- אוודא שהטריגר הוא אך ורק לדחיפות (push) לענף `main`.
- אעדכן את הסקריפט להשתמש בסודות עם הקידומת `PROD_`.

#### [NEW] .github/workflows/deploy-staging.yml
- ניצור קובץ CI/CD חדש לגמרי, שיפעל אך ורק בדחיפה לענף `staging`.
- הקובץ יבנה את האימג'ים (עם תגית `staging`).
- הוא יתחבר לשרת הסטייגינג (GCP) באמצעות סודות עם הקידומת `STAGING_`.
- הוא יריץ את קובץ הפריסה `docker-compose.staging.yml`.

### Configuration Files

#### [MODIFY] .env.example
- אארגן מחדש את המסמך ואחלק אותו לשני חלקים ברורים: סודות שמיועדים לפרודקשן (Hetzner) וסודות שמיועדים לסטייגינג (GCP).

## Verification Plan
לאחר שאכתוב את הקוד, איצור ענף בשם `staging` ואדחוף אותו לגיטהאב כדי לוודא ששני הקבצים נמצאים שם ומוכנים לפעולה ברגע שתזין את הסודות.

האם לאשר את התוכנית ולהתחיל בפיצול?
