# 🚀 Local Development Guide

## Quick Start

1. **Setup local environment:**
   ```bash
   ./setup-local-dev.sh
   ```

2. **Start development server:**
   ```bash
   ./restart-dev.sh
   ```

3. **Open your browser:**
   - Go to `http://localhost:3000`
   - Your app will auto-reload when you make changes

## Development Workflow

### Making Changes
1. **Edit files** in `frontend/src/`
2. **Test locally** - changes auto-reload
3. **Commit and push** when ready:
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```

### Environment Variables
- **Local**: `frontend/.env.local` (auto-copied from root)
- **Production**: Set in Vercel Dashboard
- **Never commit** `.env.local` files to git

### Available Scripts

| Script | Purpose |
|--------|---------|
| `./setup-local-dev.sh` | Initial setup |
| `./restart-dev.sh` | Start/restart dev server |
| `./start.sh` | Alternative start script |
| `cd frontend && npm run dev` | Direct Next.js start |

### Troubleshooting

**Port 3000 in use:**
```bash
./restart-dev.sh  # This kills existing processes
```

**Environment issues:**
```bash
rm frontend/.env.local
./setup-local-dev.sh
```

**Dependencies issues:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## Production vs Local

| Feature | Local | Production |
|---------|-------|------------|
| URL | `localhost:3000` | `max-wonkage.vercel.app` |
| Auth | Same Supabase | Same Supabase |
| Images | DALL-E (if enabled) | DALL-E |
| Database | Same Supabase | Same Supabase |

## Tips

- **Test locally first** before pushing to production
- **Use browser dev tools** to debug
- **Check console logs** for detailed debugging info
- **Images are slower locally** - consider disabling for faster dev
