# DATA INSIGHTS 2026 — E-Certificate System
## Complete Setup Guide

---

## What You're Getting

A full web application with:
- **Public page** — participants search their name and download their certificate as a PDF
- **Admin panel** (password-protected) — you add participants and send certificates to their Gmail
- **Auto-generated certificates** — name is printed on a professional template automatically
- **Free hosting** on Vercel + free database on Supabase

---

## STEP 1 — Create Your Supabase Database (Free)

1. Go to **https://supabase.com** and sign up (free)
2. Click **"New Project"** → give it a name like `ecert-2026`
3. Wait for it to set up (~1 minute)
4. Go to the **SQL Editor** (left sidebar) and run this query:

```sql
create table participants (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  email_sent boolean default false,
  created_at timestamp default now()
);
```

5. Go to **Settings → API** and copy:
   - `Project URL` (looks like `https://xxxxx.supabase.co`)
   - `anon public` key (long string)

---

## STEP 2 — Set Up EmailJS (Free — 200 emails/month)

1. Go to **https://emailjs.com** and sign up (free)
2. Click **"Add New Service"** → choose **Gmail** → connect your instructor Gmail account
3. Note down your **Service ID** (e.g., `service_abc123`)
4. Go to **Email Templates** → **Create New Template**
5. Use this template:

**Subject:** Your E-Certificate for DATA INSIGHTS 2026

**Body:**
```
Dear {{to_name}},

Congratulations on completing the DATA INSIGHTS 2026 Virtual Training!

You can download your e-certificate here:
{{certificate_url}}

Best regards,
DATA INSIGHTS 2026 Team
```

6. Note down your **Template ID** (e.g., `template_xyz789`)
7. Go to **Account → General** → copy your **Public Key**

---

## STEP 3 — Deploy to Vercel (Free)

### Option A: Using GitHub (Recommended)

1. Create a free account at **https://github.com** if you don't have one
2. Create a new repository called `ecert-2026`
3. Upload all the project files (the folder you received)
4. Go to **https://vercel.com** → sign up with GitHub
5. Click **"New Project"** → import your `ecert-2026` repo
6. Before deploying, click **"Environment Variables"** and add these:

| Variable Name | Value |
|---|---|
| `REACT_APP_SUPABASE_URL` | Your Supabase Project URL |
| `REACT_APP_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `REACT_APP_ADMIN_PASSWORD` | Your chosen password (e.g., `insights2026!`) |
| `REACT_APP_EMAILJS_SERVICE_ID` | Your EmailJS Service ID |
| `REACT_APP_EMAILJS_TEMPLATE_ID` | Your EmailJS Template ID |
| `REACT_APP_EMAILJS_PUBLIC_KEY` | Your EmailJS Public Key |

7. Click **Deploy** — done! You'll get a free URL like `ecert-2026.vercel.app`

### Option B: Vercel CLI

```bash
npm install -g vercel
cd ecert-app
vercel
```

---

## STEP 4 — Using the System

### Adding Participants (Admin)

1. Go to `your-site.vercel.app/admin`
2. Enter your admin password
3. Type the participant's **Full Name** (exactly as it should appear on the certificate)
4. Type their **Gmail address**
5. Click **+ Add**
6. Click **📧 Send Email** to send them their certificate link, OR
7. Click **⬇ Download** to download the PDF yourself

### Participants Getting Their Certificate

1. Participants go to `your-site.vercel.app`
2. They type their name and click **Search**
3. They click **👁 Preview** to see it, then **⬇ Download PDF**

---

## Project File Structure

```
ecert-app/
├── public/
│   └── index.html
├── src/
│   ├── pages/
│   │   ├── AdminPage.jsx     ← Admin panel (password protected)
│   │   └── PublicPage.jsx    ← Public search page
│   ├── App.js                ← Routing
│   ├── supabaseClient.js     ← Database connection
│   └── certificateGenerator.js  ← PDF certificate generator
├── .env.example              ← Template for environment variables
├── vercel.json               ← Vercel routing config
└── package.json
```

---

## Customizing the Certificate

To change what's on the certificate, edit **`src/certificateGenerator.js`**:

- **Event name**: Change `'DATA INSIGHTS 2026'` on line 4
- **Event dates**: Find `April 15, 17, 22, 24, 29 & May 1, 2026` and update
- **Colors**: `#1a1060` is the dark purple, `#c9a84c` is the gold
- **Signature labels**: Find `['Instructor', 'Program Director', 'Institution Head']`

---

## Troubleshooting

| Problem | Solution |
|---|---|
| "Error adding participant" | Check your Supabase URL and key in Vercel env vars |
| Email not sending | Double-check EmailJS Service ID, Template ID, and Public Key |
| Certificate looks wrong | Check browser console for errors; try a different browser |
| Can't log into admin | Check `REACT_APP_ADMIN_PASSWORD` in Vercel env vars |

---

## Quick Links

- Supabase: https://supabase.com
- EmailJS: https://emailjs.com  
- Vercel: https://vercel.com
- GitHub: https://github.com

---

*Built for DATA INSIGHTS 2026 — Virtual Training Series on Data Mining Concepts, Techniques, and Applications*
