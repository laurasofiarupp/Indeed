const lock=document.querySelector('#lock');
const messages=document.querySelector('#messages');
const incoming=document.querySelector('#incoming');
const status=document.querySelector('#phone-status');
const actions=document.querySelector('.call-actions');
const channel=typeof BroadcastChannel!=='undefined'?new BroadcastChannel('indeed-c2c-call'):null;
let ringTimer,deadline;
function openMessages(){lock.hidden=true;messages.hidden=false;incoming.hidden=true;}
function startNotification(){
 clearTimeout(ringTimer);deadline=Date.now()+11000;
 lock.hidden=false;messages.hidden=true;incoming.hidden=true;actions.hidden=false;
 status.textContent='Incoming call';
 document.querySelector('#message-list').querySelectorAll('.sent-message').forEach(el=>el.remove());
 ringTimer=setTimeout(()=>{lock.hidden=true;messages.hidden=true;incoming.hidden=false;},11000);
}
function finishCall(text){clearTimeout(ringTimer);lock.hidden=true;messages.hidden=true;incoming.hidden=false;status.textContent=text;actions.hidden=true;}
document.querySelector('.notification').addEventListener('click',openMessages);
document.querySelector('#replay').addEventListener('click',startNotification);
document.querySelector('#answer').addEventListener('click',()=>{status.textContent='Call in progress';actions.hidden=true;channel?.postMessage('answered');});
document.querySelector('#decline').addEventListener('click',()=>{finishCall('Call declined');channel?.postMessage('declined');});
document.querySelector('#message-form').addEventListener('submit',event=>{event.preventDefault();const input=document.querySelector('#message-input');if(!input.value.trim())return;const message=document.createElement('p');message.className='sent-message';message.textContent=input.value.trim();document.querySelector('#message-list').append(message);input.value='';message.scrollIntoView({block:'nearest'});});
if(channel)channel.onmessage=({data})=>{if(data==='start')startNotification();if(data==='ended')finishCall('Call ended');};
startNotification();
