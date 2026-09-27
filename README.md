# Birthday Surprise — Django

## 1. Create a virtual environment

### Windows
```bash
python -m venv venv
venv\Scripts\activate
```

### macOS/Linux
```bash
python3 -m venv venv
source venv/bin/activate
```

## 2. Install dependencies

```bash
pip install -r requirements.txt
```

## 3. Create the database

```bash
python manage.py makemigrations
python manage.py migrate
```

## 4. Optional: create an admin account

```bash
python manage.py createsuperuser
```

## 5. Run the website

```bash
python manage.py runserver
```

Open:

http://127.0.0.1:8000/

Admin:

http://127.0.0.1:8000/admin/

## How the first puzzle works

- Four wooden sticks appear at random positions.
- Drag a stick to move it.
- Double-click a stick to rotate it by 15 degrees.
- Bring the four sticks together so their endpoints form a closed quadrilateral.
- The JavaScript uses a small endpoint tolerance so exact pixel-perfect placement is not required.
- Until the shape is closed, YES and NO move away when the cursor approaches.
- Once the shape is closed, the buttons stop moving.
- Clicking YES or NO sends the result to Django.
- The selection is saved in `SurpriseInteraction`.

## Next stages

The project is deliberately structured so additional birthday stages can be added later without replacing the first puzzle.