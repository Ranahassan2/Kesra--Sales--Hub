import os

files = [
    'prisma/seed.ts',
    'backend/prisma/seed.ts'
]

for file in files:
    if os.path.exists(file):
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        content = content.replace('zawolf.ai', 'kesra.ai')
        content = content.replace('Zawolf', 'Kesra')
        
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
