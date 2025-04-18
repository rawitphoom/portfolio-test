// // For GIF restart when hover
// document.querySelectorAll('.project-card').forEach(card => {
//     const gif = card.querySelector('.hover-gif');
  
//     card.addEventListener('mouseenter', () => {
//       const src = gif.getAttribute('src');
//       gif.setAttribute('src', '');
//       gif.setAttribute('src', src);
//     });
//   });
  
//   // For VIDEO restart when hover + to play for project 2
//   document.querySelectorAll('.project-card').forEach(card => {
//     const video = card.querySelector('.hover-video');
//     if (video) {
//       card.addEventListener('mouseenter', () => {
//         video.currentTime = 0;
//         video.play();
//       });
  
//       card.addEventListener('mouseleave', () => {
//         video.pause();
//       });
//     }
//   });
  
  document.querySelectorAll('.project-card').forEach(card => {
    const video = card.querySelector('.hover-video');
  
    if (video) {
      card.addEventListener('mouseenter', () => {
        video.currentTime = 0;  // restart
        video.play();
      });
  
      card.addEventListener('mouseleave', () => {
        video.pause(); // optional
      });
    }
  
    const gif = card.querySelector('.hover-gif');
    if (gif) {
      card.addEventListener('mouseenter', () => {
        const src = gif.getAttribute('src');
        gif.setAttribute('src', '');
        gif.setAttribute('src', src);
      });
    }
  });
  