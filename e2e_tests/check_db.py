import psycopg2

conn_string = "postgresql://postgres.lzfnmjojlymmnkhlpcda:JdTzHPoZ693hR1kW@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"
try:
    conn = psycopg2.connect(conn_string, connect_timeout=5)
except Exception:
    conn_string = "postgresql://postgres.lzfnmjojlymmnkhlpcda:JdTzHPoZ693hR1kW@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"
    conn = psycopg2.connect(conn_string, connect_timeout=5)

cur = conn.cursor()
cur.execute("SELECT id, first_name, last_name, role, group_id FROM profiles;")
print("PROFILES IN DB:")
for row in cur.fetchall():
    print(" -", row)

cur.execute("SELECT id, email FROM auth.users;")
print("\nUSERS IN AUTH.USERS:")
for row in cur.fetchall():
    print(" -", row)

cur.execute("SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'profiles';")
print("\nPOLICIES ON PROFILES:")
for row in cur.fetchall():
    print(" -", row)

cur.close()
conn.close()
