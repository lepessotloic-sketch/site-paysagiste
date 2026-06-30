document.querySelectorAll('.ba').forEach((box)=>{
  const input=box.querySelector('input');
  const after=box.querySelector('.after');
  const handle=box.querySelector('.handle');
  if(!input || !after || !handle) return;
  const set=()=>{after.style.clipPath=`inset(0 0 0 ${input.value}%)`;handle.style.left=`${input.value}%`;};
  input.addEventListener('input',set); set();
});

document.querySelectorAll('.site-compare').forEach((box)=>{
  const input=box.querySelector('input');
  const top=box.querySelector('.top');
  const handle=box.querySelector('.handle');
  if(!input || !top || !handle) return;
  const set=()=>{top.style.clipPath=`inset(0 0 0 ${input.value}%)`;handle.style.left=`${input.value}%`;};
  input.addEventListener('input',set); set();
});

document.querySelectorAll('.faq-question').forEach((button)=>{
  button.addEventListener('click',()=>{
    const item=button.closest('.faq-item');
    item.classList.toggle('is-open');
  });
});

const toggle=document.querySelector('.mobile-toggle');
const menu=document.querySelector('.menu');
if(toggle){toggle.addEventListener('click',()=>{menu.style.display=menu.style.display==='flex'?'none':'flex';});}
