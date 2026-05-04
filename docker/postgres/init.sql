-- Create the shadow database used by Prisma Migrate.
SELECT 'CREATE DATABASE contact_portal_shadow'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'contact_portal_shadow')\gexec
