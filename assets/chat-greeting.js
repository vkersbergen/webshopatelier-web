(() => {
  const launcher = document.querySelector('#chat-launch');
  if (!launcher || !matchMedia('(prefers-reduced-motion:no-preference)').matches) return;
  try {
    if (sessionStorage.getItem('atelier-chat-greeted')) return;
    sessionStorage.setItem('atelier-chat-greeted','1');
  } catch { return; }
  launcher.setAttribute('data-greet','');
  launcher.addEventListener('animationend',()=>launcher.removeAttribute('data-greet'),{once:true});
})();
