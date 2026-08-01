import re

file_path = 'src/pages/LandingPage.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove framer-motion import
content = content.replace("import { motion } from 'framer-motion';\n", "")

# Add useSmoothScroll import
if "useSmoothScroll" not in content:
    content = content.replace("import { Brain3D } from '../components/animations/Brain3D';", "import { Brain3D } from '../components/animations/Brain3D';\nimport { useSmoothScroll } from '../hooks/useSmoothScroll';")

# Call useSmoothScroll inside LandingPage component
if "useSmoothScroll();" not in content:
    content = content.replace("export const LandingPage = ({ onNavigate }: LandingPageProps) => {", "export const LandingPage = ({ onNavigate }: LandingPageProps) => {\n  useSmoothScroll();")

# Remove framer-motion props and revert to standard section
# <motion.section ... > to <section ... >
# We will use regex to find all <motion.section ... > and replace with <section ... >
# First, remove the framer-motion props
motion_props = r'initial=\{\{ opacity: 0, y: 60 \}\}\s*whileInView=\{\{ opacity: 1, y: 0 \}\}\s*viewport=\{\{ once: false, amount: 0\.2 \}\}\s*transition=\{\{ duration: 0\.8, ease: "easeOut" \}\}'
content = re.sub(motion_props, '', content)

# Change <motion.section to <section
content = content.replace('<motion.section', '<section')
# Change </motion.section> to </section>
content = content.replace('</motion.section>', '</section>')

# Now add reveal-hidden to the sections that need them. 
# Our useSmoothScroll script automatically finds `section` and adds reveal-hidden if it isn't there, 
# BUT wait, the useSmoothScroll hook does exactly that:
# `mainSections.forEach(section => { section.classList.add('reveal-hidden'); revealObserver.observe(section); });`
# So we don't even need to manually add `.reveal-hidden` to the HTML classes!

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Stripped framer-motion and injected useSmoothScroll successfully.")
