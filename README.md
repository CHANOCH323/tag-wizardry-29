# Tag Wizardry - מערכת ניהול תיוגים

מערכת לניהול תיוגים עם תמיכה בקוביות וטקסט חופשי.

## מבנה הפרויקט

```
tag-wizardry-29/
├── client/          # צד לקוח - React + Vite + shadcn/ui
├── server/          # צד שרת - FastAPI + MongoDB
├── API_CONTRACT.md  # חוזה API בין לקוח לשרת
└── README.md
```

## הרצה

### שרת (FastAPI + MongoDB)
```bash
cd server
pip install -r requirements.txt
# ודא ש-MongoDB רץ
uvicorn main:app --reload --port 8000
```

### לקוח (React)
```bash
cd client
npm install
npm run dev
```

הלקוח ירוץ על `http://localhost:5173` ויתחבר לשרת ב-`http://localhost:8000/api`.

## טכנולוגיות

- **לקוח**: React, TypeScript, Vite, shadcn/ui, Tailwind CSS
- **שרת**: FastAPI, MongoDB, JWT
