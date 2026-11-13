const lock=document.querySelector('#lock');
const messages=document.querySelector('#messages');
const incoming=document.querySelector('#incoming');
const status=document.querySelector('#phone-status');
const actions=document.querySelector('.call-actions');
const channel=typeof BroadcastChannel!=='undefined'?new BroadcastChannel('indeed-c2c-call'):null;
let ringTimer,deadline;
let openingAnimations=[];let openingToken=0;
function cancelOpening(){openingToken++;openingAnimations.forEach(animation=>animation.cancel());openingAnimations=[];}
function openMessages(){
 if(lock.hidden||openingAnimations.length)return;
 const card=document.querySelector('.notification').getBoundingClientRect();
 const screen=document.querySelector('.screen').getBoundingClientRect();
 messages.hidden=false;incoming.hidden=true;
 if(matchMedia('(prefers-reduced-motion: reduce)').matches||!messages.animate){lock.hidden=true;return;}
 const token=++openingToken;
 const top=(card.top-screen.top)/screen.height*100;
 const right=(screen.right-card.right)/screen.width*100;
 const bottom=(screen.bottom-card.bottom)/screen.height*100;
 const left=(card.left-screen.left)/screen.width*100;
 const timing={duration:560,easing:'cubic-bezier(.22,.8,.2,1)',fill:'both'};
 const reveal=messages.animate([
 {clipPath:'inset('+top+'% '+right+'% '+bottom+'% '+left+'% round 14px)',opacity:.45,transform:'translateY(12px) scale(.98)'},
 {clipPath:'inset(0% 0% 0% 0% round 0px)',opacity:1,transform:'translateY(0) scale(1)'}
 ],timing);
 const retreat=lock.animate([{opacity:1,filter:'blur(0px)',transform:'scale(1)'},{opacity:0,filter:'blur(6px)',transform:'scale(1.05)'}],timing);
 openingAnimations=[reveal,retreat];
 reveal.finished.then(()=>{if(token!==openingToken)return;lock.hidden=true;cancelOpening();}).catch(()=>{});
}
function startNotification(){
 cancelOpening();
 clearTimeout(ringTimer);deadline=Date.now()+11000;
 lock.hidden=false;messages.hidden=true;incoming.hidden=true;actions.hidden=false;
 status.textContent='Incoming call';
 document.querySelector('#message-list').querySelectorAll('.sent-message').forEach(el=>el.remove());
 ringTimer=setTimeout(()=>{cancelOpening();lock.hidden=true;messages.hidden=true;incoming.hidden=false;},11000);
}
function finishCall(text){cancelOpening();clearTimeout(ringTimer);lock.hidden=true;messages.hidden=true;incoming.hidden=false;status.textContent=text;actions.hidden=true;}
document.querySelector('.notification').addEventListener('click',openMessages);
document.querySelector('#replay').addEventListener('click',startNotification);
document.querySelector('#answer').addEventListener('click',()=>{status.textContent='Call in progress';actions.hidden=true;channel?.postMessage('answered');});
document.querySelector('#decline').addEventListener('click',()=>{finishCall('Call declined');channel?.postMessage('declined');});
document.querySelector('#message-form').addEventListener('submit',event=>{event.preventDefault();const input=document.querySelector('#message-input');if(!input.value.trim())return;const message=document.createElement('p');message.className='sent-message';message.textContent=input.value.trim();document.querySelector('#message-list').append(message);input.value='';message.scrollIntoView({block:'nearest'});});
if(channel)channel.onmessage=({data})=>{if(data==='start')startNotification();if(data==='ended')finishCall('Call ended');};
startNotification();
