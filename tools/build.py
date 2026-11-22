# Сборка ЧЕРЕПАХА 2278 в один HTML-файл (все JS и ассеты внутри) + zip проекта.
import re, os, base64, json, zipfile, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTDIR = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(ROOT)
html = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
eng = open(os.path.join(ROOT, 'js/engine.js'), encoding='utf-8').read()
assets = dict(re.findall(r"(\w+):'(assets/[^']+)'", eng[eng.index('ASSET_LIST'):eng.index('};', eng.index('ASSET_LIST'))]))
mime = {'webp': 'image/webp', 'jpg': 'image/jpeg', 'png': 'image/png'}
data = {}
for k, p in assets.items():
    fp = os.path.join(ROOT, p)
    if os.path.exists(fp):
        data[k] = 'data:%s;base64,%s' % (mime[p.rsplit('.', 1)[1]], base64.b64encode(open(fp, 'rb').read()).decode())
def inline(m):
    src = m.group(1); fp = os.path.join(ROOT, src)
    if not os.path.exists(fp): return ''
    code = open(fp, encoding='utf-8').read().replace('</script', '<\\/script')
    return '<script>/* %s */\n%s\n</script>' % (src, code)
out = re.sub(r'<script src="([^"]+)"></script>', inline, html)
out = out.replace('<script>/* js/engine.js */', '<script>window.ASSET_DATA=%s;</script>\n<script>/* js/engine.js */' % json.dumps(data), 1)
dst = os.path.join(OUTDIR, 'ЧЕРЕПАХА_2278.html')
open(dst, 'w', encoding='utf-8').write(out)
print('standalone:', dst, os.path.getsize(dst) // 1024, 'KB, assets:', len(data), '/', len(assets))
z = os.path.join(OUTDIR, 'turtle2278_project.zip')
with zipfile.ZipFile(z, 'w', zipfile.ZIP_DEFLATED) as zf:
    for base, dirs, files in os.walk(ROOT):
        for f in files:
            if f.endswith(('.gif', '.jpg', '.png')) and 'tools' in base: continue
            full = os.path.join(base, f); zf.write(full, os.path.relpath(full, OUTDIR))
    zf.write(dst, 'turtle2278/ЧЕРЕПАХА_2278.html')
print('zip:', z, os.path.getsize(z) // 1024, 'KB')
