import sys

file_path = 'src/pages/LandingPage.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the viewport config to make animations repeat and trigger slightly later
old_viewport = 'viewport={{ once: true, margin: "-100px" }}'
new_viewport = 'viewport={{ once: false, amount: 0.2 }}'

if old_viewport in content:
    content = content.replace(old_viewport, new_viewport)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated framer-motion animations successfully.")
else:
    print("Could not find the exact viewport string.")
