# 🚀 מדריך פריסה מלא: מאפס לאתר חי על Oracle Cloud (חינם!)

מדריך צעד-אחר-צעד להרמת האתר על שרת ARM חינמי של אורקל. בסוף התהליך, כל פעם שתדחוף קוד ל-GitHub, האתר יתעדכן אוטומטית!

---

## שלב 1: הרשמה ל-Oracle Cloud (5 דקות)

1. היכנס ל-[cloud.oracle.com](https://cloud.oracle.com) ולחץ על **Sign Up**
2. מלא פרטים אישיים (שם, אימייל, מדינה: **Israel**)
3. תצטרך **כרטיס אשראי** לאימות זהות – **לא יגבו ממך כסף** (זה רק לוידוא שאתה בן אדם אמיתי)
4. בחר **Home Region** – בחר את הקרוב אליך, למשל **Israel (Jerusalem)** או **Germany (Frankfurt)**

> [!IMPORTANT]
> ה-Home Region הוא המיקום הקבוע של השרתים החינמיים שלך ולא ניתן לשנות אותו אחר כך! בחר בחוכמה.

---

## שלב 2: יצירת שרת ARM חינמי (10 דקות)

1. אחרי ההתחברות, לחץ על **☰ (תפריט)** → **Compute** → **Instances**
2. לחץ **Create Instance**
3. הגדר את השרת:
   - **Name:** `bingo-server`
   - **Image:** בחר **Ubuntu 22.04** (או Canonical Ubuntu הכי חדש)
   - **Shape:** לחץ **Change Shape** → בחר **Ampere** → בחר **VM.Standard.A1.Flex**
     - **OCPUs:** `2`
     - **Memory:** `12 GB`
   - **Networking:** השאר את ברירת המחדל (יצירת VCN חדש + Subnet ציבורי)
   - **Add SSH Keys:** ⬅️ **זה החלק הכי חשוב!**
     - בחר **Generate a key pair for me**
     - לחץ **Save Private Key** (שמור את הקובץ `ssh-key-YYYY-MM-DD.key` במקום בטוח!)
     - לחץ גם **Save Public Key**
4. לחץ **Create** ← השרת ייצור תוך 1-2 דקות

> [!CAUTION]
> **אל תאבד את קובץ ה-SSH Key!** בלעדיו אין דרך להתחבר לשרת.

5. אחרי שהסטטוס משתנה ל-**RUNNING**, העתק את ה-**Public IP Address** (למשל `129.159.XX.XX`)

---

## שלב 3: פתיחת פורטים בפיירוול של אורקל (5 דקות)

כברירת מחדל, אורקל חוסם את כל התעבורה מהאינטרנט. צריך לפתוח פורטים 80 (HTTP) ו-443 (HTTPS):

1. בדף ה-Instance, לחץ על שם ה-**Subnet** (תחת Primary VNIC)
2. לחץ על ה-**Security List** הקיימת (Default Security List)
3. לחץ **Add Ingress Rules** והוסף 2 חוקים:

| Source CIDR    | Destination Port | Protocol |
|----------------|------------------|----------|
| `0.0.0.0/0`    | `80`             | TCP      |
| `0.0.0.0/0`    | `443`            | TCP      |

---

## שלב 4: התחברות לשרת והתקנת Docker (10 דקות)

פתח טרמינל במחשב שלך (או ב-IDE) והרץ:

```bash
# תן הרשאות לקובץ המפתח
chmod 400 ~/Downloads/ssh-key-*.key

# התחבר לשרת (החלף IP בכתובת שהעתקת)
ssh -i ~/Downloads/ssh-key-*.key ubuntu@129.159.XX.XX
```

**ברגע שאתה בתוך השרת**, הרץ את הפקודות הבאות בסדר:

```bash
# עדכון חבילות
sudo apt update && sudo apt upgrade -y

# התקנת Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER

# התקנת Docker Compose plugin
sudo apt install -y docker-compose-plugin

# פתיחת פורטים בפיירוול הפנימי של Ubuntu
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save

# צא והתחבר מחדש כדי שהרשאות הדוקר ייכנסו לתוקף
exit
```

התחבר שוב:
```bash
ssh -i ~/Downloads/ssh-key-*.key ubuntu@129.159.XX.XX
```

ודא שדוקר עובד:
```bash
docker --version
docker compose version
```

---

## שלב 5: העלאת קבצי הפרויקט לשרת (5 דקות)

```bash
# צור את תיקיית הפרויקט
mkdir -p ~/bingo.online
cd ~/bingo.online

# העתק את קובץ ה-docker-compose מהמחשב שלך
# (הרץ את זה מהמחשב שלך, לא מהשרת!)
```

**מהמחשב המקומי שלך** (טרמינל חדש):
```bash
scp -i ~/Downloads/ssh-key-*.key \
  /home/yaakov/Desktop/bingo.online/docker-compose.prod.yml \
  ubuntu@129.159.XX.XX:~/bingo.online/

scp -i ~/Downloads/ssh-key-*.key \
  /home/yaakov/Desktop/bingo.online/credentials.json \
  ubuntu@129.159.XX.XX:~/bingo.online/

scp -i ~/Downloads/ssh-key-*.key \
  /home/yaakov/Desktop/bingo.online/token.json \
  ubuntu@129.159.XX.XX:~/bingo.online/
```

---

## שלב 6: הגדרת Secrets בגיטהאב (5 דקות)

עכשיו שיש לך שרת, צריך לעדכן את ה-Secrets בגיטהאב כדי שהפריסה האוטומטית תעבוד:

1. כנס ל-GitHub → **Settings** → **Secrets and variables** → **Actions**
2. הוסף/עדכן את 3 הסיקרטים הבאים:

| Secret Name    | Value                                        |
|----------------|----------------------------------------------|
| `VPS_HOST`     | כתובת ה-IP של השרת (`129.159.XX.XX`)          |
| `VPS_USERNAME` | `ubuntu`                                      |
| `VPS_SSH_KEY`  | **תוכן מלא** של קובץ ה-SSH Key הפרטי שהורדת  |

> [!TIP]
> כדי להעתיק את תוכן המפתח, הרץ במחשב שלך:
> ```bash
> cat ~/Downloads/ssh-key-*.key
> ```
> העתק את **הכל** – כולל השורות `-----BEGIN...-----` ו-`-----END...-----`

---

## שלב 7: הפעלה ראשונה ידנית (5 דקות)

**בתוך השרת** (SSH), הרץ:

```bash
cd ~/bingo.online

# צור את קובץ ה-.env (העתק את הערכים מה-.env.example שלך)
nano .env
```

הדבק בתוכו (עם הערכים האמיתיים שלך):
```
DOCKERHUB_USERNAME=your_dockerhub_username
DB_USER=fabric_user
DB_PASSWORD=bingo_fabric_strong_db_password_2026
DB_NAME=fabric_store
ADMIN_EMAIL=admin@bingo.online
ADMIN_PASSWORD=!!yaakov94
SECRET_KEY=d8a1436ad05e392c63acce741b4458421c21d38d9e9cf6db93e77766ead0f3d8
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=bingo.fabric@gmail.com
SMTP_PASS=xcjf qpqd kbrz stcm
```

שמור (Ctrl+O, Enter, Ctrl+X) ואז:
```bash
# משוך את האימג'ים מדוקר האב
docker compose -f docker-compose.prod.yml pull

# הפעל את כל השירותים
docker compose -f docker-compose.prod.yml up -d

# בדוק שהכל רץ
docker compose -f docker-compose.prod.yml ps
```

> [!NOTE]
> ההפעלה הראשונה לוקחת 1-2 דקות כי מסד הנתונים צריך להתאתחל.

---

## שלב 8: בדיקה שהאתר עובד! 🎉

פתח בדפדפן: `http://129.159.XX.XX`

אתה אמור לראות את אתר **Bingo Fabrics** שלך חי ופועל!

---

## מה קורה מעכשיו?

כל פעם שתדחוף קוד ל-GitHub (ל-branch `main`):
1. GitHub Actions יבנה את האימג'ים החדשים (כולל ARM)
2. יעלה אותם לדוקר האב
3. יתחבר לשרת שלך דרך SSH
4. יעדכן את קובץ ה-`.env` עם הסיקרטים
5. ימשוך את הגרסה החדשה ויפעיל מחדש

**הכל אוטומטי לחלוטין!** 🔄

---

## פתרון בעיות נפוצות

| בעיה | פתרון |
|------|-------|
| `Out of host capacity` בזמן יצירת השרת | השרתים החינמיים מוגבלים בזמינות. נסה שוב אחרי כמה שעות, או נסה Availability Domain אחר |
| לא מצליח להתחבר ב-SSH | ודא שנתת הרשאות `chmod 400` לקובץ המפתח |
| האתר לא נטען בדפדפן | ודא שפתחת את הפורטים (שלב 3) וגם את הפיירוול של Ubuntu (שלב 4) |
| `docker: permission denied` | ודא שהרצת `sudo usermod -aG docker $USER` ויצאת/נכנסת מחדש |
