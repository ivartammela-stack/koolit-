# Õpilaste emotsioonide ja vaimse tervise jälgija – Backend (v1)

FastAPI + SQLite + JWT. Esimene töötav versioon API-st, mille peale saab hiljem UI ehitada.

## Kiirstart

```bash
# 1) Loo ja aktiveeri virtuaalkeskkond (soovituslik)
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 2) Paigalda sõltuvused
pip install -r requirements.txt

# 3) Kopeeri .env.example -> .env ja kohanda (valikuline)
cp .env.example .env  # Windows: copy .env.example .env

# 4) Käivita API
uvicorn app.main:app --reload

# API on vaikimisi: http://127.0.0.1:8000
# Swagger UI: http://127.0.0.1:8000/docs
```

## Esmane sisselogimine
Käivitusel luuakse vaikimisi admin-kasutaja:
- **username**: admin
- **password**: admin123  (muuda kohe!)

Hangi JWT token:
```
POST /api/v1/auth/token
body: x-www-form-urlencoded
username=admin&password=admin123
```
Seejärel kasuta `Authorization: Bearer <token>` kõnedes.

## Põhiressursid (v1)
- **/api/v1/students** – õpilaste CRUD (admin/teacher)
- **/api/v1/emotions** – emotsioonikirjed (teacher; õpilastele saab hiljem anda enda sisestuse õiguse)
- **/api/v1/users/me** – praeguse kasutaja info

## Projektistruktuur
```
app/
  api/
    deps.py
    routes/
      auth.py
      students.py
      emotions.py
  core/
    config.py
    security.py
  crud/
    base.py
    user.py
    student.py
    emotion.py
  db/
    session.py
    init_db.py
  models/
    user.py
    student.py
    emotion.py
  schemas/
    token.py
    user.py
    student.py
    emotion.py
  main.py
.env.example
requirements.txt
```

## Järgmised sammud
- Lisada rollipõhised õigused detailsemalt (klassijuhataja, tugispetsialist jms).
- Lisada jagamislogid ja audit (andmete vaatamise logi).
- Luua front-end (nt HTMX/Alpine.js või React) ja adminpaneel.
- Eraldada õpilase/vanema vaade (nõusolekumehhanism).

_Automaatselt genereeritud: 2025-10-23T10:29:44.702811Z_
