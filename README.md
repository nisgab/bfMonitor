# מוניטור הנקה - Breastfeeding Monitor

אפליקציית ווב פשוטה לניטור הנקה, מיועדת לאמהות מניקות. האפליקציה מאפשרת רישום מהיר של הנקות עם בחירת צד וזמן, צפייה בהנקות אחרונות, ייצוא נתונים ושיתוף יומן הנקה.

## תכונות

- **התחברות ורישום משתמש** - אימות משתמש מאובטח דרך Supabase
- **רישום הנקה מהיר** - לחיצה אחת לרישום הנקה עם צד וזמן
- **מעקב הנקות** - צפייה ב-3 ההנקות האחרונות
- **ייצוא נתונים** - הורדת יומן הנקה כקובץ CSV
- **שיתוף יומן** - שיתוף קישור לצפייה ביומן עם אחרים
- **צפייה ביומן משותף** - צפייה בנתונים משותפים עם סטטיסטיקות מפורטות
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

## פתרון בעיות

### בעיית הרשאות - שיתוף יומן לא עובד

אם לא מצליח לראות נתונים משותפים (מופיע "לא נמצאו נתונים"), הבעיה כנראה בהרשאות מסד הנתונים.

**פתרון:**
1. היכנס ל-Supabase Dashboard
2. עבור ל-SQL Editor  
3. הרץ את הקוד הבא:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Users can access their own feeding sessions" ON feeding_sessions;
DROP POLICY IF EXISTS "Users can access their own stats" ON feeding_sessions;

-- Policy for authenticated users - they can do everything with their own data
CREATE POLICY "Authenticated users can manage their own sessions" ON feeding_sessions
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy for anonymous users - they can only read (for shared links)
CREATE POLICY "Anonymous users can read sessions for sharing" ON feeding_sessions
    FOR SELECT 
    USING (auth.role() = 'anon');
```

**הסבר הבעיה:**
- הגרסה הראשונה של מדיניות הגישה לא אפשרה למשתמשים אנונימיים לראות נתונים
- שיתוף יומן דורש גישת קריאה למשתמשים לא מחוברים
- הפתרון יוצר מדיניות נפרדת למשתמשים מחוברים ולא מחוברים

## שימוש באפליקציה

### הרשמה והתחברות
1. פתח את האפליקציה
2. הירשם עם כתובת אימייל וסיסמה
3. האפליקציה תחבר אותך אוטומטית לאחר ההרשמה
4. בביקורים הבאים - התחבר עם הפרטים שלך

### רישום הנקה
1. לחץ על כפתור "הנקה - שמאל" או "הנקה - ימין"
2. הפעילות תירשם אוטומטית עם הזמן הנוכחי
3. הכפתור יציג "נרשם!" לאישור

### צפייה בהנקות אחרונות
- האפליקציה מציגה את 3 ההנקות האחרונות
- מוצגים: צד וזמן ההנקה

### ייצוא נתונים
- לחץ על "ייצא CSV" כדי להוריד את כל יומן ההנקה
- הקובץ יכלול את כל ההנקות עם פרטים מלאים

### שיתוף יומן
- לחץ על "שתף יומן" כדי לקבל קישור לשיתוף
- העתק את הקישור ושתף עם בן/בת הזוג או עם גורמים רפואיים
- הקישור מאפשר צפייה ב-10 ההנקות האחרונות

### צפייה ביומן משותף
- פתח קישור משותף שקיבלת מהורה אחר
- צפה ב-10 ההנקות האחרונות של המשתמש המשתף
- קבל סטטיסטיקות מפורטות:
  - סה"כ הנקות
  - הנקה אחרונה
  - מספר הנקות בכל צד
- אפשרות לייצא את הנתונים המשותפים ל-CSV
- לחץ על "התחבר לחשבון שלי" כדי לחזור לחשבון שלך

## מבנה הקבצים

```
bfMonitor/
├── index.html           # קובץ HTML ראשי
├── style.css            # עיצוב והגדרות CSS
├── script.js            # לוגיקה וחיבור ל-Supabase
├── demo.html            # גרסת דמו ללא Supabase
├── database_setup.sql   # הגדרת מסד נתונים מלא
├── fix_permissions.sql  # תיקון הרשאות לשיתוף
└── README.md            # הוראות שימוש
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
- קישורי שיתוף מאפשרים צפייה בלבד (אין אפשרות לעריכה)
- אימות מאובטח דרך Supabase Auth

## תמיכה ופיתוח

האפליקציה מיועדת לשימוש פשוט ויעיל. עבור שאלות או הצעות לשיפור, ניתן לפתוח issue בגיטהאב.

## רישיון

פרויקט זה מופץ תחת רישיון MIT - עיין בקובץ LICENSE לפרטים. 