import '../css/global.css';
import '../scss/global.scss';

import gsap from 'gsap';

import Three from './three.js';

document.addEventListener('DOMContentLoaded', () => {
  const enterButton = document.querySelector('#enter-button');
  const introOverlay = document.querySelector('#intro-overlay');
  const warningOverlay = document.querySelector('#warning-overlay');
  const canvas = document.querySelector('#canvas');
  const acceptButton = document.querySelector('#accept-button');

  const audio = new Audio('src/assets/audio/dark-impulse-ambient-part-2.wav');
  audio.loop = true;
  audio.volume = 0.5;
  audio.play();

  enterButton.addEventListener('click', (event) => {
    event.preventDefault();

    gsap.fromTo(
      introOverlay,
      { opacity: 1 },
      {
        opacity: 0,
        duration: 1,
        onComplete: () => {
          warningOverlay.classList.add('visible');
          gsap.fromTo(
            warningOverlay,
            { opacity: 0 },
            {
              opacity: 1,
              duration: 1,
              onComplete: () => {
                introOverlay.style.display = 'none';
              }
            }
          );
        }
      }
    );
  });
  acceptButton.addEventListener('click', () => {
    gsap.fromTo(
      warningOverlay,
      { opacity: 1 },
      {
        opacity: 0,
        duration: 1,
        onComplete: () => {
          if (canvas) {
            new Three(canvas, audio);
          }
          gsap.fromTo(
            canvas,
            { opacity: 0 },
            {
              opacity: 1,
              duration: 1,
              onComplete: () => {
                warningOverlay.style.display = 'none';
                const cursor = document.querySelector('.cursor');
                const cursorTextInactive = document.querySelector(
                  '.cursor-text-inactive'
                );
                const cursorTextActive = document.querySelector('.cursor-text');

                const updateCursor = (event) => {
                  const { clientX: x, clientY: y } = event;
                  cursor.style.transform = `translate(${x}px, ${y}px)`;
                };
                const handleMouseDown = () => {
                  cursor.classList.add('active');
                  cursorTextInactive.style.display = 'none';
                  cursorTextActive.style.display = 'block';
                };
                const handleMouseUp = () => {
                  cursor.classList.remove('active');
                  cursorTextInactive.style.display = 'block';
                  cursorTextActive.style.display = 'none';
                };
                window.addEventListener('mousemove', (event) => {
                  if (event.target === canvas) {
                    cursor.classList.remove('hide');
                    updateCursor(event);
                  } else {
                    cursor.classList.add('hide');
                  }
                });

                canvas.addEventListener('mousedown', handleMouseDown);
                canvas.addEventListener('mouseup', handleMouseUp);

                canvas.addEventListener('mouseleave', () =>
                  cursor.classList.add('hide')
                );
                canvas.addEventListener('mouseenter', () =>
                  cursor.classList.remove('hide')
                );
              }
            }
          );
        }
      }
    );
  });
});
