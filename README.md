# 🧵 Bingo Fabrics - E-Commerce Platform

An advanced, luxurious e-commerce platform built exclusively for "Bingo Fabrics".
The system features a modern "Glassmorphism" UI, rich micro-animations (such as blooming products and a spinning cart coin), and distinct "Day & Night" modes with realistic scrolling fabric textures.

## 🚀 Tech Stack

* **Frontend:** React (Vite), React Router, Context API
* **Styling:** Advanced Vanilla CSS, CSS Variables, custom animations
* **Backend:** Python with FastAPI
* **Databases:** MySQL 8.0, Redis 7.2
* **DevOps & Infrastructure:** Docker, Docker Compose, GitHub Actions (CI/CD)

## ✨ Key Features
* 🌙 **Day / Night Mode:** An animated toggle to switch between a bright pearl design and a luxurious dark mode. Features high-quality seamless fabric textures that scroll with the page, automatically adapting the frosted glass (Glassmorphism) elements.
* 🛒 **Dynamic Cart Coin:** A golden coin cart button that flips elegantly and displays a "bubble burst" animation when products are added. The item count blooms "like a flower" back onto the coin.
* 💳 **Smart Checkout Flow:** Full support for cart management, user authentication, and order processing.
* 🔗 **Premium Share Widget:** A luxurious floating share widget (WhatsApp, Facebook, copy link) with smooth pop-up animations.
* ⚙️ **Admin Dashboard:** Full management of fabric inventory and customer orders.

---

## 🛠️ Local Development Setup

The entire project is containerized with Docker, meaning you can spin up the whole environment with a single command.
Ensure you have `Docker` and `Docker Compose` installed.

1. Copy the environment variables file:
   ```bash
   cp .env.example .env
   # Edit .env if necessary
   ```

2. Run the project:
   ```bash
   docker-compose up --build
   ```

3. Access the services:
   * **Frontend Website:** `http://localhost:5173`
   * **Backend / Swagger API:** `http://localhost:8000/docs`

---

## 🌍 CI/CD Pipeline & Deployment

The project is configured with a fully automated GitHub Actions Workflow.
Every time you `git push` to the `main` branch, the system will:
1. Build production-optimized Docker images for the Frontend and Backend.
2. Push the images securely to your Docker Hub.

**For Production Deployment:**
Use the `docker-compose.prod.yml` file on your live server (e.g., Oracle Cloud), which pulls the pre-built images directly from Docker Hub and runs them securely behind an Nginx server.

---
<br><br>

<a name="hebrew-version"></a>
# 🧵 בינגו בדים (Bingo Fabrics) - E-Commerce Platform

[English above 👆](#-bingo-fabrics---e-commerce-platform)

מערכת מסחר אלקטרוני יוקרתית ומתקדמת, שנבנתה במיוחד עבור "בינגו בדים".
המערכת משלבת עיצוב "Glassmorphism" מודרני, אנימציות עשירות (Micro-animations) כמו פריחת מוצרים, מטבע עגלה מסתובב, ומצבי "יום ולילה" עם טקסטורות בדים אמיתיות.

## 🚀 טכנולוגיות מרכזיות (Tech Stack)

* **צד לקוח (Frontend):** React (Vite), React Router, Context API
* **עיצוב (Styling):** Vanilla CSS מתקדם, משתני CSS (CSS Variables), אנימציות מותאמות אישית.
* **צד שרת (Backend):** Python עם FastAPI
* **מסדי נתונים (Databases):** MySQL 8.0, Redis 7.2
* **תשתיות ואוטומציה (DevOps):** Docker, Docker Compose, GitHub Actions (CI/CD)

## ✨ פיצ'רים בולטים
* 🌙 **מצב יום / מצב לילה:** מתג אנימטיבי להחלפת עיצוב מלא, הכולל טקסטורות בדים איכותיות הנגללות עם העמוד, ועדכון אוטומטי של "זכוכית חלבית" כהה/בהירה (Glassmorphism).
* 🛒 **עגלה דינאמית:** כפתור עגלה בצורת "מטבע זהב" שמסתובב אלגנטית ומציג "פיצוץ בועות" בעת הוספת מוצרים. מספר המוצרים צומח "כמו פרח" בחזרה על המטבע.
* 💳 **תהליך רכישה חכם:** תמיכה מלאה בתהליך הוספה לעגלה, התחברות משתמשים (Auth), ומערכת הזמנות.
* 🔗 **שיתוף מתקדם:** ווידג'ט שיתוף יוקרתי (WhatsApp, Facebook, העתקת קישור) שקופץ באנימציה נעימה.
* ⚙️ **לוח בקרה למנהל (Admin Dashboard):** ניהול מלא של מלאי הבדים וההזמנות.

---

## 🛠️ איך להריץ את הפרויקט על המחשב (Local Development)

הפרויקט עטוף כולו ב-Docker, מה שאומר שהרצת הפרויקט דורשת פקודה אחת בלבד.
ודא שיש לך `Docker` ו-`Docker Compose` מותקנים על המחשב.

1. העתק את קובץ הגדרות הסביבה:
   ```bash
   cp .env.example .env
   # ניתן לערוך את .env במידת הצורך
   ```

2. הרץ את הפרויקט:
   ```bash
   docker-compose up --build
   ```

3. גישה לשירותים:
   * **אתר הלקוחות (Frontend):** `http://localhost:5173`
   * **השרת (Backend / Swagger API):** `http://localhost:8000/docs`

---

## 🌍 העלאה לרשת (CI/CD Pipeline)

הפרויקט מוגדר עם Workflow אוטומטי מלא עבור GitHub Actions.
בכל פעם שתבצע `git push` לענף ה-`main`, המערכת:
1. תבנה תמונות (Images) מותאמות ל-Production עבור ה-Frontend וה-Backend.
2. תעלה את התמונות ל-Docker Hub שלך.

**להפעלת השרת החי (Production):**
יש להשתמש בקובץ `docker-compose.prod.yml` על גבי השרת שלך (כגון Oracle Cloud), אשר מושך ישירות את הגרסאות המוכנות מ-Docker Hub ומריץ אותן בסביבת ייצור מאובטחת באמצעות שרת Nginx.
