import sys

file_path = 'src/pages/LandingPage.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Make sure we don't double replace
if "<motion.section" not in content:
    # Replace all opening section tags
    content = content.replace('<section', '<motion.section\n        initial={{ opacity: 0, y: 60 }}\n        whileInView={{ opacity: 1, y: 0 }}\n        viewport={{ once: true, margin: "-100px" }}\n        transition={{ duration: 0.8, ease: "easeOut" }}')
    
    # Replace all closing section tags
    content = content.replace('</section>', '</motion.section>')

    # Inject framer-motion import if not present
    if "import { motion }" not in content:
        content = content.replace("import { useState", "import { motion } from 'framer-motion';\nimport { useState")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("Replaced sections with motion.section.")
else:
    print("Already contains motion.section.")
