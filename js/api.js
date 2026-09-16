/* ============================================================
   E PROPERTIES BD — API layer
   এখন Netlify Functions/Blobs এর বদলে সরাসরি Supabase ব্যবহার
   করে: Postgres (listings + site settings) আর Supabase Storage
   (ছবি)। কোনো backend server code লাগে না — Netlify শুধু static
   ফাইল হোস্ট করে, Supabase-ই আসল কাজ করে।

   নিরাপত্তা RLS (Row Level Security) দিয়ে হয় (দেখুন
   supabase/schema.sql): visitor রা শুধু read করতে পারে, লগইন করা
   admin ছাড়া কেউ write (add/edit/delete) করতে পারবে না।
   ============================================================ */

const DEFAULT_WHATSAPP_NUMBER = '8801410893338';
const DEFAULT_WHATSAPP_MESSAGE = 'Hi, I am interested in a property listed on E Properties BD.';
const IMAGE_BUCKET = 'property-images';

const DEFAULT_SETTINGS = {
  siteName: 'E Properties BD',
  tagline: 'FLATS & PLOTS MARKETPLACE',
  logoUrl: '',
  whatsappNumber: DEFAULT_WHATSAPP_NUMBER,
  whatsappMessage: DEFAULT_WHATSAPP_MESSAGE,
  heroEyebrow: 'STATUS & ELITE LISTINGS ACROSS DHAKA',
  heroTitle: 'Find your next flat, plot or commercial space — without the runaround.',
  heroDescription: 'Every listing here is added and verified by the E Properties BD team directly, with real photos, walkthrough videos, and one WhatsApp tap to the person who can actually close the deal.',
  footerText: 'All listings verified by our team.',
  footerAddress: '',
  facebookUrl: ''
};

function rowToProperty(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title || '',
    category: row.category || 'Flat',
    location: row.location || '',
    price: row.price || '',
    size: row.size || '',
    beds: row.beds || 'N/A',
    baths: row.baths || 'N/A',
    featured: Boolean(row.featured),
    images: Array.isArray(row.images) ? row.images : [],
    videoUrl: row.video_url || '',
    description: row.description || '',
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now()
  };
}

function propertyToRow(data) {
  return {
    title: (data.title || '').trim(),
    category: data.category || 'Flat',
    location: (data.location || '').trim(),
    price: (data.price || '').trim(),
    size: (data.size || '').trim(),
    beds: (data.beds || '').trim() || 'N/A',
    baths: (data.baths || '').trim() || 'N/A',
    featured: Boolean(data.featured),
    images: Array.isArray(data.images) ? data.images : [],
    video_url: (data.videoUrl || '').trim(),
    description: (data.description || '').trim()
  };
}

function rowToSettings(row) {
  if (!row) return { ...DEFAULT_SETTINGS };
  return {
    siteName: row.site_name || DEFAULT_SETTINGS.siteName,
    tagline: row.tagline || DEFAULT_SETTINGS.tagline,
    logoUrl: row.logo_url || '',
    whatsappNumber: row.whatsapp_number || DEFAULT_WHATSAPP_NUMBER,
    whatsappMessage: row.whatsapp_message || DEFAULT_WHATSAPP_MESSAGE,
    heroEyebrow: row.hero_eyebrow || DEFAULT_SETTINGS.heroEyebrow,
    heroTitle: row.hero_title || DEFAULT_SETTINGS.heroTitle,
    heroDescription: row.hero_description || DEFAULT_SETTINGS.heroDescription,
    footerText: row.footer_text || DEFAULT_SETTINGS.footerText,
    footerAddress: row.footer_address || '',
    facebookUrl: row.facebook_url || ''
  };
}

function settingsToRow(data) {
  return {
    site_name: (data.siteName || '').trim(),
    tagline: (data.tagline || '').trim(),
    logo_url: (data.logoUrl || '').trim(),
    whatsapp_number: (data.whatsappNumber || '').trim(),
    whatsapp_message: (data.whatsappMessage || '').trim(),
    hero_eyebrow: (data.heroEyebrow || '').trim(),
    hero_title: (data.heroTitle || '').trim(),
    hero_description: (data.heroDescription || '').trim(),
    footer_text: (data.footerText || '').trim(),
    footer_address: (data.footerAddress || '').trim(),
    facebook_url: (data.facebookUrl || '').trim(),
    updated_at: new Date().toISOString()
  };
}

function isAuthError(error) {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  return error.code === '42501' || error.code === 'PGRST301' || msg.includes('row-level security') || msg.includes('jwt');
}

const EP = {
  _cache: null,
  _settingsCache: null,

  // ---------- Public reads ----------

  async getAll(force) {
    if (this._cache && !force) return this._cache;
    const { data, error } = await supabaseClient
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    this._cache = (data || []).map(rowToProperty);
    return this._cache;
  },

  async getById(id) {
    const { data, error } = await supabaseClient.from('properties').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    return rowToProperty(data);
  },

  async getSettings(force) {
    if (this._settingsCache && !force) return this._settingsCache;
    const { data, error } = await supabaseClient.from('site_settings').select('*').eq('id', 1).maybeSingle();
    if (error) {
      this._settingsCache = { ...DEFAULT_SETTINGS };
    } else {
      this._settingsCache = rowToSettings(data);
    }
    return this._settingsCache;
  },

  // ---------- Admin: auth ----------

  async login(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return data.session;
  },

  async logout() {
    await supabaseClient.auth.signOut();
  },

  async getSession() {
    const { data } = await supabaseClient.auth.getSession();
    return data.session || null;
  },

  onAuthChange(cb) {
    supabaseClient.auth.onAuthStateChange((_event, session) => cb(session));
  },

  // ---------- Admin: listings ----------

  async create(data) {
    const { data: row, error } = await supabaseClient.from('properties').insert(propertyToRow(data)).select().single();
    if (error) throw new Error(isAuthError(error) ? 'UNAUTHORIZED' : error.message);
    this._cache = null;
    return rowToProperty(row);
  },

  async update(id, data) {
    const { data: row, error } = await supabaseClient.from('properties').update(propertyToRow(data)).eq('id', id).select().single();
    if (error) throw new Error(isAuthError(error) ? 'UNAUTHORIZED' : error.message);
    this._cache = null;
    return rowToProperty(row);
  },

  async remove(id) {
    const { error } = await supabaseClient.from('properties').delete().eq('id', id);
    if (error) throw new Error(isAuthError(error) ? 'UNAUTHORIZED' : error.message);
    this._cache = null;
    return { ok: true };
  },

  // ---------- Admin: site settings ----------

  async updateSettings(data) {
    const { data: row, error } = await supabaseClient.from('site_settings').update(settingsToRow(data)).eq('id', 1).select().single();
    if (error) throw new Error(isAuthError(error) ? 'UNAUTHORIZED' : error.message);
    this._settingsCache = rowToSettings(row);
    return this._settingsCache;
  },

  // ---------- Admin: photo upload ----------

  async uploadImage(file) {
    const session = await this.getSession();
    if (!session) throw new Error('UNAUTHORIZED');

    const extMatch = /\.([a-zA-Z0-9]+)$/.exec(file.name || '');
    const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
    const key = 'img-' + Date.now() + '-' + Math.floor(Math.random() * 1000000) + '.' + ext;

    const { error } = await supabaseClient.storage.from(IMAGE_BUCKET).upload(key, file, {
      contentType: file.type || 'image/jpeg',
      upsert: false
    });
    if (error) throw new Error(isAuthError(error) ? 'UNAUTHORIZED' : error.message);

    const { data } = supabaseClient.storage.from(IMAGE_BUCKET).getPublicUrl(key);
    return data.publicUrl;
  }
};

function waLink(message, number) {
  const text = encodeURIComponent(message || DEFAULT_WHATSAPP_MESSAGE);
  return `https://wa.me/${number || DEFAULT_WHATSAPP_NUMBER}?text=${text}`;
}

function fmtDate(ts) {
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
