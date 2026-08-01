import { useEffect } from 'react';

export const useSmoothScroll = () => {
  useEffect(() => {
    // 1. INTERSECTION OBSERVER (Fade Up & Stagger para animaciones de entrada)
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -15% 0px',
      threshold: 0.1
    };

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const target = entry.target as HTMLElement;
        
        if (entry.isIntersecting) {
          // A. Animación de contenedores principales
          if (target.classList.contains('reveal-hidden')) {
            target.classList.add('reveal-visible');
          }

          // B. Animación en cascada (Stagger)
          if (target.hasAttribute('data-stagger-container')) {
            const items = target.querySelectorAll('.stagger-item');
            items.forEach((item, index) => {
              setTimeout(() => {
                item.classList.add('visible');
              }, index * 100);
            });
          }
        } else {
          // Remover clases al salir del viewport para permitir la animación en ambas direcciones
          if (target.classList.contains('reveal-hidden')) {
            target.classList.remove('reveal-visible');
          }
          if (target.hasAttribute('data-stagger-container')) {
            const items = target.querySelectorAll('.stagger-item');
            items.forEach(item => item.classList.remove('visible'));
          }
        }
      });
    }, observerOptions);

    // 2. INYECTAR OBSERVADORES
    // Esperar a que el DOM esté listo
    setTimeout(() => {
      const mainSections = document.querySelectorAll('section, .main-container');
      mainSections.forEach(section => {
        section.classList.add('reveal-hidden');
        revealObserver.observe(section);
      });

      const cardContainers = document.querySelectorAll('.cards-grid, .mirrors-container');
      cardContainers.forEach(container => {
        container.setAttribute('data-stagger-container', 'true');
        revealObserver.observe(container);
        
        const cards = container.children;
        Array.from(cards).forEach(card => {
          card.classList.add('stagger-item');
        });
      });
    }, 100);

    return () => {
      revealObserver.disconnect();
    };
  }, []);
};

