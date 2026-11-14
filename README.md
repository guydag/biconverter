# biconverter
## התראות לטלפון

הקוד של ההתראות נמצא ב-`functions/` (שרת קטן של Firebase) ובאתר עצמו (הגדרות ← התראות, מוצג רק בטלפון).

להפעלה, פעם אחת:

1. ב-Firebase: שדרוג התוכנית ל-Blaze (נדרש בשביל Cloud Functions).
2. בחוקי Firestore להוסיף: `match /subs/{email} { allow read, write: if request.auth != null && request.auth.token.email == email; }`
3. מתוך תיקיית הפרויקט: `npx firebase-tools login` ואז `npx firebase-tools deploy --only functions`.
4. ב-`index.html` לשנות `PUSH_ENABLED` ל-`true`.
