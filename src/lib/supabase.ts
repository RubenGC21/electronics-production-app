import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eyporzasgysbnynmtmru.supabase.co';
const supabaseKey = 'sb_publishable_HM3Wq3K2Uci3ZT5Nt7fvlg_3A2zS0Tk';

export const supabase = createClient(supabaseUrl, supabaseKey);
