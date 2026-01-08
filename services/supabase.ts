
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vkzzfccktctoljvkmwsz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrenpmY2NrdGN0b2xqdmttd3N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwMTU5MjcsImV4cCI6MjA4MTU5MTkyN30.E-gEYVtixbbfmktUKVXUOUykr5vHizqVfvzMaJ3Thtk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
