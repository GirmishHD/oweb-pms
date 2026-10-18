import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection

with connection.cursor() as cursor:
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
    """)
    tables = [r[0] for r in cursor.fetchall()]
    print(f"Total tables: {len(tables)}\n")
    for t in tables:
        cursor.execute(f'SELECT COUNT(*) FROM "{t}"')
        cnt = cursor.fetchone()[0]
        print(f"{t}: {cnt} rows")
