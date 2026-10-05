import { createClient } from "@supabase/supabase-js"

const SUPABASE_DEFAULT_URL = "https://lzkkhqmesqyydygfuwao.supabase.co"
const SUPABASE_DEFAULT_KEY = "sb_publishable_eY4vgnmmdMXlnrBXkNiQbw_CFbGEuh6"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || SUPABASE_DEFAULT_URL
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || SUPABASE_DEFAULT_KEY

export const supabase = createClient(supabaseUrl, supabasePublishableKey)
