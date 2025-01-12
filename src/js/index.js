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
  const cursor = document.querySelector('.cursor');
  cursor.classList.add('hide');

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
                cursor.classList.remove('hide');
                const cursorTextInactive = document.querySelector(
                  '.cursor-text-inactive'
                );
                const cursorTextActive = document.querySelector('.cursor-text');
                canvas.addEventListener('touchmove', (event) => {
                  const touch = event.touches[0];
                  cursor.style.transform = `translate(${touch.clientX}px, ${touch.clientY}px)`;
                });
                canvas.addEventListener('touchstart', (event) => {
                  const touch = event.touches[0];
                  cursor.style.transform = `translate(${touch.clientX}px, ${touch.clientY}px)`;
                  cursor.classList.remove('hide');
                  cursor.classList.add('active');
                  cursorTextInactive.style.display = 'none';
                  cursorTextActive.style.display = 'block';
                });

                canvas.addEventListener('touchend', () => {
                  cursor.classList.remove('active');
                  cursorTextInactive.style.display = 'block';
                  cursorTextActive.style.display = 'none';
                  cursor.classList.remove('hide');
                });

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
                window.addEventListener('pointermove', (event) => {
                  if (event.target === canvas) {
                    cursor.classList.remove('hide');
                    updateCursor(event);
                  } else {
                    cursor.classList.add('hide');
                  }
                });

                canvas.addEventListener('pointerdown', handleMouseDown);
                canvas.addEventListener('pointerup', handleMouseUp);

                canvas.addEventListener('pointerleave', () =>
                  cursor.classList.add('hide')
                );
                canvas.addEventListener('pointerenter', () =>
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
