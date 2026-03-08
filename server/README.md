# Tag Wizardry API Server

## הרצה

```bash
cd server
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**דרישות:** MongoDB רץ על `localhost:27017` (או הגדר `MONGODB_URL` ב-`.env`)
