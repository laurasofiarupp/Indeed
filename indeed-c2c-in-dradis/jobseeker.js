const lock = document.querySelector('#lock');
const incoming = document.querySelector('#incoming');
const status = document.querySelector('#phone-status');
const actions = document.querySelector('.call-actions');
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('indeed-c2c-call') : null;
let ringTimer;
function startNotification() {
  clearTimeout(ringTimer);
  lock.hidden = false;
  incoming.hidden = true;
  actions.hidden = false;
  status.textContent = 'Incoming call';
  ringTimer = setTimeout(() => {
    lock.hidden = true;
    incoming.hidden = false;
  }, 11000);
}
function finishCall(message) {
  clearTimeout(ringTimer);
  lock.hidden = true;
  incoming.hidden = false;
  status.textContent = message;
  actions.hidden = true;
}
document.querySelector('#replay').addEventListener('click', startNotification);
document.querySelector('#answer').addEventListener('click', () => {
  status.textContent = 'Call in progress';
  actions.hidden = true;
  channel?.postMessage('answered');
});
document.querySelector('#decline').addEventListener('click', () => {
  finishCall('Call declined');
  channel?.postMessage('declined');
});
if (channel) channel.onmessage = ({data}) => {
  if (data === 'start') startNotification();
  if (data === 'ended') finishCall('Call ended');
};
startNotification();
