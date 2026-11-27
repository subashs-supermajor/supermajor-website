import re

with open(r'services\product-animation.html', 'r', encoding='utf-8') as f:
    pa = f.read()

with open(r'services.html', 'r', encoding='utf-8') as f:
    s = f.read()

def dump_layout(html, name):
    print(f"=== {name} ===")
    sections = re.findall(r'<section[^>]*>', html)
    for sec in sections:
        print("  SECTION:", sec)
    containers = re.findall(r'<div class="[^"]*mx-auto[^"]*">', html)
    print("  CONTAINERS:")
    for c in sorted(set(containers)):
        print("   ", c)

dump_layout(pa, "product-animation.html")
print()
dump_layout(s, "services.html")
