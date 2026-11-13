const lock=document.querySelector('#lock');
const messages=document.querySelector('#messages');
const incoming=document.querySelector('#incoming');
const status=document.querySelector('#phone-status');
const actions=document.querySelector('.call-actions');
const channel=typeof BroadcastChannel!=='undefined'?new BroadcastChannel('indeed-c2c-call'):null;
let ringTimer,elapsedTimer;
const connectedControls=document.querySelector('.connected-controls');
function resetConnectedControls(){clearInterval(elapsedTimer);connectedControls.hidden=true;connectedControls.querySelectorAll('button[aria-pressed]').forEach(button=>{button.setAttribute('aria-pressed','false');});}

let openingAnimations=[];let openingToken=0;
function cancelOpening(){openingToken++;openingAnimations.forEach(animation=>animation.cancel());openingAnimations=[];}
function openMessages(){
 if(lock.hidden||openingAnimations.length)return;
 const notification=document.querySelector('.notification');
 const showMessages=()=>{lock.hidden=true;messages.hidden=false;incoming.hidden=true;clearTimeout(ringTimer);ringTimer=setTimeout(()=>{cancelOpening();messages.hidden=true;incoming.hidden=false;incoming.classList.add('ringing');},5000);};
 if(matchMedia('(prefers-reduced-motion: reduce)').matches||!notification.animate){showMessages();return;}
 const token=++openingToken;
 const pulse=notification.animate([
 {transform:'scale(1)',opacity:1},
 {transform:'scale(1.035)',opacity:1,offset:.6},
 {transform:'scale(1.02)',opacity:1}
 ],{duration:160,easing:'ease-out',fill:'both'});
 openingAnimations=[pulse];
 pulse.finished.then(()=>{if(token!==openingToken)return;showMessages();cancelOpening();}).catch(()=>{});
}
function startNotification(){
 resetConnectedControls();
 cancelOpening();
 clearTimeout(ringTimer);
 lock.hidden=false;messages.hidden=true;incoming.hidden=true;actions.hidden=false;
 status.textContent='Incoming call';incoming.classList.remove('ringing');
 document.querySelector('#message-list').querySelectorAll('.sent-message').forEach(el=>el.remove());

}
function finishCall(text){resetConnectedControls();incoming.classList.remove('ringing');cancelOpening();clearTimeout(ringTimer);lock.hidden=true;messages.hidden=false;incoming.hidden=true;status.textContent=text;actions.hidden=true;}
document.querySelector('.notification').addEventListener('click',openMessages);
document.querySelector('#replay').addEventListener('click',startNotification);
document.querySelector('#answer').addEventListener('click',()=>{incoming.classList.remove('ringing');status.textContent='Call in progress · 0:00';actions.hidden=true;connectedControls.hidden=false;let seconds=0;clearInterval(elapsedTimer);elapsedTimer=setInterval(()=>{seconds++;status.textContent='Call in progress · '+Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');},1000);channel?.postMessage('answered');});
document.querySelector('#decline').addEventListener('click',()=>{finishCall('Call declined');channel?.postMessage('declined');});
document.querySelector('#message-form').addEventListener('submit',event=>{event.preventDefault();const input=document.querySelector('#message-input');if(!input.value.trim())return;const message=document.createElement('p');message.className='sent-message';message.textContent=input.value.trim();document.querySelector('#message-list').append(message);input.value='';message.scrollIntoView({block:'nearest'});});
if(channel)channel.onmessage=({data})=>{if(data==='start')startNotification();if(data==='ended')finishCall('Call ended');};
startNotification();

for(const [id,onLabel,offLabel] of [['call-camera','Turn camera off','Turn camera on'],['call-microphone','Unmute microphone','Mute microphone'],['call-speaker','Turn speakerphone off','Turn speakerphone on']]){
 document.getElementById(id).addEventListener('click',event=>{const button=event.currentTarget;const active=button.getAttribute('aria-pressed')!=='true';button.setAttribute('aria-pressed',String(active));button.setAttribute('aria-label',active?onLabel:offLabel);});
}
document.querySelector('#call-end').addEventListener('click',()=>{finishCall('Call ended');channel?.postMessage('ended');});
