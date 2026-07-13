import React from 'react';

const Terms = () => {
  return (
    <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem', lineHeight: '1.6', color: 'var(--text-color)' }}>
      <h1 style={{ color: 'var(--primary-color)', borderBottom: '2px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
        תקנון אתר ותנאי שימוש - בינגו בדים
      </h1>
      
      <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>
        ברוכים הבאים לאתר "בינגו בדים" (להלן: "האתר"). האתר מנוהל על ידי בינגו בדים (להלן: "החברה" או "הנהלת האתר") ומשמש כפלטפורמת מסחר קמעונאית וצרכנית (B2C) להזמנות מוקדמות ורכישות של בדים.<br/><br/>
        השימוש באתר, לרבות גלישה בו, הרשמה וביצוע הזמנות, כפוף לתנאי השימוש המפורטים להלן. עצם השימוש באתר מהווה את הסכמתך המלאה לתנאים אלו.
      </p>

      <h2 style={{ color: 'var(--primary-color)', marginTop: '2rem', marginBottom: '1rem' }}>1. כללי</h2>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        <li style={{ marginBottom: '0.5rem' }}>1.1. האתר מיועד לשימוש קמעונאי וצרכני עבור לקוחות קצה.</li>
        <li style={{ marginBottom: '0.5rem' }}>1.2. הנהלת האתר שומרת לעצמה את הזכות לעדכן או לשנות את תנאי השימוש מעת לעת, ללא הודעה מוקדמת.</li>
        <li style={{ marginBottom: '0.5rem' }}>1.3. בכל מקרה של סתירה בין הכתוב בתקנון זה לבין פרסומים אחרים, יגברו הוראות תקנון זה.</li>
      </ul>

      <h2 style={{ color: 'var(--primary-color)', marginTop: '2rem', marginBottom: '1rem' }}>2. אופן ביצוע הזמנות</h2>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        <li style={{ marginBottom: '0.5rem' }}>2.1. האתר פועל במודל של הזמנה מוקדמת (Pre-Order) עונתית לצד רכישות רגילות.</li>
        <li style={{ marginBottom: '0.5rem' }}>2.2. לחיצה על כפתור "שלח הזמנה" (Checkout) מהווה הצהרת כוונות מצד הלקוח על רצונו במוצרים, אך אינה נועלת את העגלה באופן סופי עד להגעת תאריך היעד המוגדר למערכת או לאזור הספציפי.</li>
        <li style={{ marginBottom: '0.5rem' }}>2.3. עד לתאריך היעד, הלקוח רשאי לשוב לעגלת הקניות, לשנות כמויות, להוסיף או להסיר מוצרים.</li>
        <li style={{ marginBottom: '0.5rem' }}>2.4. הנהלת האתר אינה מתחייבת לספק את כל הפריטים שהוזמנו, והאספקה כפופה למלאי הקיים ולתנאי הייבוא. במקרה שפריט אינו זמין, הלקוח לא יחויב בגינו.</li>
      </ul>

      <h2 style={{ color: 'var(--primary-color)', marginTop: '2rem', marginBottom: '1rem' }}>3. מחירים ותשלומים</h2>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        <li style={{ marginBottom: '0.5rem' }}>3.1. המחירים המוצגים באתר כוללים מע"מ כחוק, אלא אם צוין אחרת מפורשות.</li>
        <li style={{ marginBottom: '0.5rem' }}>3.2. נכון למועד זה, האתר אינו מבצע סליקת אשראי מקוונת. התשלום בגין ההזמנות מבוצע באופן פרטי מול הנהלת החברה (בהעברה בנקאית, מזומן או אמצעים אחרים שיוסכמו) לאחר נעילת ההזמנה או האספקה.</li>
        <li style={{ marginBottom: '0.5rem' }}>3.3. באם תופעל בעתיד מערכת סליקה מקוונת, הלקוח מסכים לפעול בהתאם לתנאי חברת הסליקה, ופרטי האשראי לא יישמרו בשרתי האתר.</li>
      </ul>

      <h2 style={{ color: 'var(--primary-color)', marginTop: '2rem', marginBottom: '1rem' }}>4. ביטול עסקה והחזרים (חוק הגנת הצרכן)</h2>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        <li style={{ marginBottom: '0.5rem' }}>4.1. לקוח שהוא צרכן פרטי רשאי לבטל עסקת רכישה בהתאם להוראות חוק הגנת הצרכן, התשמ"א-1981.</li>
        <li style={{ marginBottom: '0.5rem' }}>4.2. ביטול עסקה ייעשה בכתב באמצעות פנייה להנהלת האתר תוך 14 ימים מיום קבלת המוצר או מיום קבלת מסמך הגילוי/ההסכם, לפי המאוחר מביניהם.</li>
        <li style={{ marginBottom: '0.5rem' }}>4.3. סייג לזכות הביטול (חיתוך בדים לפי מידה): בהתאם להוראות חוק הגנת הצרכן, תשמ"א-1981, זכות ביטול עסקה של 14 ימים אינה חלה על "טובין שיוצרו במיוחד בעבור הצרכן בעקבות העסקה". היות שהבדים הנמכרים באתר נחתכים מגליל בהתאם למידות הספציפיות שהוזמנו על ידי הלקוח (הזמנה לפי מטר/סנטימטר), חיתוך זה מהווה התאמה אישית. לפיכך, לא יתאפשר ביטול עסקה, קבלת החזר כספי או החלפה עבור בדים שנחתכו לפי מידה, למעט במקרים של פגם בייצור.</li>
        <li style={{ marginBottom: '0.5rem' }}>4.4. במקרה של ביטול שלא עקב פגם או אי-התאמה, ינוכו דמי ביטול בשיעור של 5% ממחיר העסקה או 100 ש"ח, לפי הנמוך מביניהם, והלקוח יהיה אחראי להחזרת המוצר לחברה במצב תקין ובאריזתו המקורית.</li>
      </ul>

      <h2 style={{ color: 'var(--primary-color)', marginTop: '2rem', marginBottom: '1rem' }}>5. אספקה ומשלוחים</h2>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        <li style={{ marginBottom: '0.5rem' }}>5.1. זמני האספקה המשוערים יימסרו באופן פרטני או בקבוצות הוואטסאפ האזוריות.</li>
        <li style={{ marginBottom: '0.5rem' }}>5.2. יייתכנו עיכובים באספקה שאינם בשליטת החברה, והחברה לא תישא באחריות לנזקים כתוצאה מעיכובים אלו.</li>
      </ul>

      <hr style={{ margin: '3rem 0', borderColor: 'var(--glass-border)' }} />

      <h1 style={{ color: 'var(--primary-color)', borderBottom: '2px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
        מדיניות פרטיות (Privacy Policy)
      </h1>
      
      <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>
        אנו ב"בינגו בדים" רואים חשיבות עליונה בשמירה על פרטיות לקוחותינו, ופועלים בהתאם לחוק הגנת הפרטיות, התשמ"א-1981 ותקנותיו.
      </p>

      <h2 style={{ color: 'var(--primary-color)', marginTop: '2rem', marginBottom: '1rem' }}>6. איסוף מידע ושימוש בו</h2>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        <li style={{ marginBottom: '0.5rem' }}>6.1. בעת ההרשמה לאתר והשימוש בו, נאסף מידע אודותיך הכולל: שם, כתובת, מספר טלפון, כתובת דוא"ל והיסטוריית הזמנות.</li>
        <li style={{ marginBottom: '0.5rem' }}>6.2. השימוש במידע זה נועד אך ורק לצורך ניהול העסק, טיפול בהזמנות, ושיפור חווית המשתמש באתר.</li>
        <li style={{ marginBottom: '0.5rem' }}>6.3. המידע נשמר באופן מאובטח במאגרי המידע של החברה.</li>
      </ul>

      <h2 style={{ color: 'var(--primary-color)', marginTop: '2rem', marginBottom: '1rem' }}>7. סיוע מרחוק ופעולות בשם הלקוח</h2>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        <li style={{ marginBottom: '0.5rem' }}>7.1. כדי לספק שירות אישי, הנהלת האתר מחזיקה ביכולת טכנית להתחבר למערכת "בשם הלקוח" (Impersonation).</li>
        <li style={{ marginBottom: '0.5rem' }}><strong>7.2. שימוש ביכולת זו נעשה אך ורק לבקשת הלקוח או לצורכי סיוע טכני.</strong></li>
        <li style={{ marginBottom: '0.5rem' }}>7.3. כל פעולה המבוצעת על ידי מנהל בשם הלקוח מתועדת באופן אוטומטי ב"יומן ביקורת" מאובטח.</li>
        <li style={{ marginBottom: '0.5rem' }}>7.4. יודגש: למנהלי האתר אין ולא תהיה לעולם גישה לפרטי כרטיס האשראי של הלקוח.</li>
      </ul>

      <h2 style={{ color: 'var(--primary-color)', marginTop: '2rem', marginBottom: '1rem' }}>8. מסירת מידע לצד שלישי</h2>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        <li style={{ marginBottom: '0.5rem' }}>8.1. החברה מתחייבת שלא למסור את פרטי הלקוחות לצדדים שלישיים ללא אישורם, למעט מקרים כגון חברות שילוח ורשויות החוק.</li>
      </ul>
      
      <p style={{ marginTop: '3rem', fontSize: '0.9rem', color: 'var(--text-light)', textAlign: 'center' }}>
        עודכן לאחרונה: יולי 2026
      </p>
    </div>
  );
};

export default Terms;
