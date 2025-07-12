# מוניטור הנקה - Breastfeeding Monitor

אפליקציית ווב פשוטה לניטור זמני הנקה, מיועדת לאמהות מניקות. האפליקציה מספקת טיימר לזמן הנקה, מעקב אחר 3 ההנקות האחרונות, ייצוא נתונים ושיתוף יומן הנקה.

## תכונות

- **התחברות ורישום משתמש** - אימות משתמש מאובטח דרך Supabase
- **טיימר הנקה** - בחירת צד (ימין/שמאל) והפעלת טיימר
- **מעקב הנקות** - צפייה ב-3 ההנקות האחרונות
- **ייצוא נתונים** - הורדת יומן הנקה כקובץ CSV
- **שיתוף יומן** - שיתוף קישור לצפייה ביומן עם אחרים
- **ממשק בעברית** - כל האפליקציה בעברית עם תמיכה ב-RTL
- **ידידותי לנייד** - מותאם לשימוש במכשירים ניידים

## התקנה והגדרה

### 1. הגדרת Supabase

1. היכנס לאתר [Supabase](https://supabase.com) ויצור חשבון
2. צור פרויקט חדש
3. בתפריט SQL Editor, הרץ את הקוד הבא ליצירת הטבלה:

```sql
CREATE TABLE feeding_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    side VARCHAR(10) NOT NULL CHECK (side IN ('left', 'right')),
    duration INTEGER NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE feeding_sessions ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to access only their own sessions
CREATE POLICY "Users can access their own feeding sessions" ON feeding_sessions
    FOR ALL USING (auth.uid() = user_id);
```

4. העתק את ה-URL של הפרויקט ואת ה-anon key מהעמוד Settings > API

### 2. הגדרת האפליקציה

1. פתח את הקובץ `script.js`
2. החלף את הערכים הבאים:
   ```javascript
   const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // הכנס כאן את URL הפרויקט
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // הכנס כאן את anon key
   ```

### 3. העלאה ל-GitHub Pages

1. צור repository חדש ב-GitHub
2. העלה את הקבצים: `index.html`, `style.css`, `script.js`
3. עבור ל-Settings > Pages
4. בחר Source: Deploy from a branch
5. בחר Branch: main
6. שמור וחכה כמה דקות
7. האפליקציה תהיה זמינה בכתובת: `https://USERNAME.github.io/REPOSITORY-NAME`

## שימוש באפליקציה

### הרשמה והתחברות
1. פתח את האפליקציה
2. הירשם עם כתובת אימייל וסיסמה
3. אשר את החשבון דרך האימייל שתקבל
4. התחבר לאפליקציה

### הנקה
1. בחר צד (ימין/שמאל)
2. לחץ על "התחל" כדי להתחיל את הטיימר
3. לחץ על "עצור" כדי לעצור את הטיימר ולשמור את הפעילות

### צפייה בהנקות אחרונות
- האפליקציה מציגה את 3 ההנקות האחרונות
- מוצגים: צד, תאריך, שעה ומשך זמן

### ייצוא נתונים
- לחץ על "ייצא CSV" כדי להוריד את כל יומן ההנקה
- הקובץ יכלול את כל ההנקות עם פרטים מלאים

### שיתוף יומן
- לחץ על "שתף יומן" כדי לקבל קישור לשיתוף
- העתק את הקישור ושתף עם בן/בת הזוג או עם גורמים רפואיים

## מבנה הקבצים

```
bfMonitor/
├── index.html      # קובץ HTML ראשי
├── style.css       # עיצוב והגדרות CSS
├── script.js       # לוגיקה וחיבור ל-Supabase
└── README.md       # הוראות שימוש
```

## טכנולוגיות

- **HTML5** - מבנה האפליקציה
- **CSS3** - עיצוב רספונסיבי עם תמיכה ב-RTL
- **JavaScript (ES6+)** - לוגיקה ופונקציונליות
- **Supabase** - מסד נתונים ואימות משתמש
- **GitHub Pages** - אחסון והגשת האפליקציה

## אבטחה

- האפליקציה משתמשת ב-Row Level Security של Supabase
- כל משתמש יכול לגשת רק לנתונים שלו
- אימות מאובטח דרך Supabase Auth

## תמיכה ופיתוח

האפליקציה מיועדת לשימוש פשוט ויעיל. עבור שאלות או הצעות לשיפור, ניתן לפתוח issue בגיטהאב.

## רישיון

פרויקט זה מופץ תחת רישיון MIT - עיין בקובץ LICENSE לפרטים. 