# Deployment Order & Token Management

## When to Generate Token

**Generate the token BEFORE pushing to GitHub**, but understand:

1. **The script (`generate-token.js`)** → ✅ Safe to commit to GitHub
2. **The generated token value** → ❌ NEVER commit to GitHub

## Recommended Workflow

### Step 1: Generate Token (Local)
```bash
cd pana-stream
node generate-token.js
```

**Output example:**
```
🔐 PanaStream API Token Generated
============================================================
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
============================================================
```

**Copy and save this token securely** (password manager, notes app, etc.)

### Step 2: Push Code to GitHub
```bash
git add .
git commit -m "Configure for DO App Platform deployment"
git push origin main
```

**What gets committed:**
- ✅ `generate-token.js` (the script)
- ✅ `app.yaml` (configuration)
- ✅ All server code
- ❌ **NOT the token value** (it's not in any file)

### Step 3: Deploy to DigitalOcean
1. Create app in DigitalOcean App Platform
2. Connect to your GitHub repo
3. **Set environment variables** (including the token you generated)

### Step 4: Configure Fabricated Crime
Set the same token in Fabricated Crime's environment variables.

## Token Storage Locations

**✅ Safe to store token:**
- DigitalOcean App Platform environment variables (marked as SECRET)
- Fabricated Crime environment variables
- Your local password manager
- Deployment documentation (if private)

**❌ NEVER store token:**
- In any `.env` file that's committed to git
- In code files
- In `app.yaml` (leave `value: ""` empty)
- In GitHub repository (even private repos)
- In public documentation

## Verification Checklist

Before deploying:
- [ ] Token generated and saved securely
- [ ] Token NOT in any committed files
- [ ] `generate-token.js` is in repo (safe)
- [ ] `app.yaml` has empty token value: `value: ""`
- [ ] Ready to set token in DigitalOcean dashboard

## Quick Test

After generating token, verify it's not in your repo:
```bash
# This should return nothing (token not found)
cd pana-stream
grep -r "your-generated-token-here" . --exclude-dir=node_modules
```

If it finds something, remove it before committing!

