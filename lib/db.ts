import { neon } from "@neondatabase/serverless"

// URL direta do banco - isso vai funcionar imediatamente
const DATABASE_URL = "postgresql://neondb_owner:npg_ZQJ7UM9hjKFG@ep-quiet-feather-an14tef4-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require"

export const sql = neon(DATABASE_URL)