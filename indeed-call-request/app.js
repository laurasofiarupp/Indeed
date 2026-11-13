const scene = document.querySelector("#scene");
const viewport = document.querySelector("#viewport");
const chat = document.querySelector("#chat");
const chatContent = document.querySelector("#chat-content");
const chatToggle = document.querySelector(".chat-toggle");
const tip = document.querySelector("#invite-tip");
const conversation = document.querySelector("#conversation");
const scheduleBackdrop = document.querySelector("#schedule-backdrop");
const inviteMessage = document.querySelector("#invite-message");
const originalMessage = inviteMessage.value;
const rewriteMessages = ["Hi Oliver, I’m excited you applied for the server role at Haru. Let’s set up some time to talk soon. Are you available in the next couple of days? Go ahead and pick a time that works best for you.", "Hi Oliver, thanks for your interest in the server position at Haru. I’d love to learn more about your experience. Please choose an available time for a quick conversation.", "Hello Oliver! We’d like to connect about the server role at Haru. Take a look at the available times and select one that suits your schedule. Looking forward to speaking with you.", "Hi Oliver, your application for the server role at Haru caught our attention. Let’s arrange a brief chat about the opportunity. Pick a time that works well for you."];
let rewriteIndex = 0;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
let tipDismissed = false;
let tipTimer;
let confirmationTimer;
let toastTimer;
let activeCandidate = 0;
let week = 0;
let selectedSlot = null;
let returnFocus = null;
let sentRequest = null;

function fitScene() {
  const scale = innerWidth / 1616.19;
  const logicalHeight = innerHeight / scale + 82;
  scene.style.height = logicalHeight + 'px';
  scene.style.transform = 'translateY(' + (-82 * scale) + 'px) scale(' + scale + ')';
  viewport.style.left = '0px';
  viewport.style.top = '0px';
  viewport.style.width = innerWidth + 'px';
  viewport.style.height = innerHeight + 'px';
}
addEventListener("resize", fitScene);
fitScene();

function openChat() {
  clearTimeout(tipTimer);
  chat.classList.add("is-open");
  chatContent.inert = false;
  chatToggle.setAttribute("aria-expanded", "true");
  if (!tipDismissed && !sentRequest) {
    tipTimer = setTimeout(() => {
      if (chat.classList.contains("is-open") && scheduleBackdrop.hidden) showInviteTip();
    }, 3500);
  }
}
function closeChat() {
  clearTimeout(tipTimer);
  tip.hidden = true;
  chat.classList.remove("is-open", "is-expanded");
  chatContent.inert = true;
  chatToggle.setAttribute("aria-expanded", "false");
}
document.querySelectorAll("[data-open-chat]").forEach(button => button.addEventListener("click", openChat));
chatToggle.addEventListener("click", () => chat.classList.contains("is-open") ? closeChat() : openChat());
document.querySelector(".minimize").addEventListener("click", closeChat);
document.querySelector("#dismiss-tip").addEventListener("click", () => {
  tipDismissed = true;
  tip.hidden = true;
  document.querySelector("#invite").focus({ preventScroll: true });
});
document.querySelector(".expand").addEventListener("click", () => chat.classList.toggle("is-expanded"));

function openSchedule() {
  openChat();
  tip.hidden = true;
  clearTimeout(tipTimer);
  returnFocus = document.activeElement;
  scheduleBackdrop.hidden = false;
  for (const child of scene.children) {
    if (child !== scheduleBackdrop) child.inert = true;
  }
  scheduleBackdrop.querySelector("[data-close-schedule]").focus({ preventScroll: true });
}
function closeSchedule() {
  scheduleBackdrop.hidden = true;
  for (const child of scene.children) child.inert = false;
  chatContent.inert = !chat.classList.contains("is-open");
  returnFocus?.focus({ preventScroll: true });
}
document.querySelector("#invite").addEventListener("click", openSchedule);
document.querySelector("#setup").addEventListener("click", openSchedule);
document.querySelectorAll("[data-close-schedule]").forEach(button => button.addEventListener("click", closeSchedule));
scheduleBackdrop.addEventListener("click", event => {
  if (event.target === scheduleBackdrop) closeSchedule();
});
document.addEventListener("keydown", event => {
  if (!scheduleBackdrop.hidden && event.key === "Escape") {
    event.preventDefault();
    closeSchedule();
  }
  if (!scheduleBackdrop.hidden && event.key === "Tab") {
    const controls = [...scheduleBackdrop.querySelectorAll("button:not([disabled]), input, select, textarea, a[href]")].filter(element => element.getClientRects().length);
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

function notify(message) {
  const toast = document.querySelector(".toast");
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;
  toastTimer = setTimeout(() => { toast.hidden = true; }, 3500);
}
document.querySelector("#write-ai").addEventListener("click", () => {
  inviteMessage.value = rewriteMessages[rewriteIndex++ % rewriteMessages.length];
  document.querySelector("#revert").hidden = false;
  if (!reducedMotion.matches) inviteMessage.animate([{ opacity: .4 }, { opacity: 1 }], { duration: 380 });
});
document.querySelector("#revert").addEventListener("click", () => {
  inviteMessage.value = originalMessage;
  document.querySelector("#revert").hidden = true;
});
inviteMessage.addEventListener("input", () => {
  document.querySelector("#revert").hidden = inviteMessage.value === originalMessage;
});

function showSettings(event) {
  event?.preventDefault();
  const panel = document.querySelector("#settings-panel");
  panel.hidden = !panel.hidden;
  if (!panel.hidden) panel.scrollIntoView({ behavior: reducedMotion.matches ? "instant" : "smooth", block: "end" });
}
document.querySelector("#settings").addEventListener("click", showSettings);
document.querySelector("#next-days").addEventListener("click", showSettings);
function updateWeek() {
  const date = new Date(2024, 10, 1 + week * 7);
  document.querySelector("#week-label").textContent = "Week of " + date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  document.querySelector("#week-prev").disabled = week === 0;
  document.querySelectorAll(".day-headings em").forEach((label, index) => {
    label.textContent = new Date(2024, 10, 1 + week * 7 + index).getDate();
  });
}
document.querySelector("#week-prev").addEventListener("click", () => { week = Math.max(0, week - 1); updateWeek(); });
document.querySelector("#week-next").addEventListener("click", () => { week++; updateWeek(); });
document.querySelector("#duration").addEventListener("change", event => {
  document.querySelector("#duration-label").textContent = event.target.value;
  document.querySelector("#opening-count").textContent = Math.floor(1260 / Number(event.target.value));
});
document.querySelectorAll(".slot").forEach(button => {
  button.disabled = false;
  button.addEventListener("click", () => {
    if (!button.dataset.originalClass) button.dataset.originalClass = button.className;
    const changed = button.dataset.changed !== "true";
    button.dataset.changed = String(changed);
    button.className = changed ? (button.dataset.originalClass.includes("available") ? "slot" : "slot available") : button.dataset.originalClass;
    button.setAttribute("aria-pressed", String(button.classList.contains("available")));
    selectedSlot = button.classList.contains("available") ? button.getAttribute("aria-label") : null;
  });
});
function appendRequestMessage(copy, confirmed = false) {
  if (confirmed) {
    const divider = document.createElement('div');
    divider.className = 'today-divider';
    divider.textContent = 'Today';
    conversation.append(divider);
  }
  const row = document.createElement('div');
  row.className = confirmed ? 'confirmation-message' : 'sent-message';
  const author = document.createElement('div');
  author.className = 'message-author';
  const name = document.createElement('strong');
  name.textContent = confirmed ? 'Oliver S' : 'You';
  const timestamp = document.createElement('time');
  timestamp.textContent = ' · ' + (confirmed ? '7:06 p.m.' : '7:05 p.m.');
  author.append(name, timestamp);
  const body = document.createElement('p');
  body.textContent = copy;
  row.append(author, body);
  conversation.append(row);
  return row;
}
function addRequestCard(row, confirmed = false) {
  const card = document.createElement('div');
  card.className = 'request-card';
  const label = document.createElement('span');
  label.className = 'request-label' + (confirmed ? ' confirmed' : '');
  label.textContent = confirmed ? 'Confirmed' : 'Call request sent';
  if (confirmed) {
    const check = document.createElement('img');
    check.src = 'assets/confirmed-check.svg';
    check.alt = '';
    check.width = 17;
    check.height = 17;
    check.setAttribute('aria-hidden', 'true');
    const confirmedText = document.createElement('span');
    confirmedText.className = 'confirmed-text';
    confirmedText.textContent = 'Confirmed';
    label.replaceChildren(check, confirmedText);
  }
  if (!confirmed) {
    const calendarIcon = document.createElement('img');
    calendarIcon.src = 'assets/40000004-68263-c59ca.svg';
    calendarIcon.alt = '';
    calendarIcon.width = 17;
    calendarIcon.height = 17;
    calendarIcon.style.objectFit = 'contain';
    label.prepend(calendarIcon);
  }
  card.append(label);

  row.append(card);
  if (!reducedMotion.matches) card.animate([{opacity: 0, transform: 'translateY(8px) scale(.94)'}, {opacity: 1, transform: 'none'}], {duration: 550, easing: 'cubic-bezier(.2,1.2,.4,1)'});
  conversation.scrollTo({top: conversation.scrollHeight, behavior: reducedMotion.matches ? 'instant' : 'smooth'});
}
let sendingRequest = false;
document.querySelector('#schedule-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (sendingRequest) return;
  sendingRequest = true;
  clearTimeout(confirmationTimer);
  sentRequest = {message: inviteMessage.value};
  if (!reducedMotion.matches) {
    await Promise.all([
      scheduleBackdrop.animate([{opacity: 1}, {opacity: 0}], {duration: 420, fill: 'forwards'}).finished,
      scheduleBackdrop.querySelector('.schedule').animate([{transform: 'none'}, {transform: 'translateY(12px) scale(.985)'}], {duration: 420, fill: 'forwards'}).finished
    ]);
  }
  closeSchedule();
  scheduleBackdrop.getAnimations().forEach(animation => animation.cancel());
  scheduleBackdrop.querySelector('.schedule').getAnimations().forEach(animation => animation.cancel());
  openChat();
  const row = appendRequestMessage(sentRequest.message);
  conversation.scrollTo({top: conversation.scrollHeight, behavior: 'smooth'});
  setTimeout(() => {
    addRequestCard(row);
    sendingRequest = false;
    confirmationTimer = setTimeout(() => {
      const reply = appendRequestMessage('Yes, I’m very excited about this job!', true);
      addRequestCard(reply, true);
    }, 6500);
  }, 2200);
});
document.querySelector('#message-form').addEventListener('submit', event => {
  event.preventDefault();
  const input = event.currentTarget.querySelector('textarea');
  if (!input.value.trim()) return;
  appendRequestMessage(input.value.trim());
  input.value = '';
  conversation.scrollTo({top: conversation.scrollHeight, behavior: 'smooth'});
});

// Simulated call walkthrough; no phone connection is made.
const callPanel = document.createElement('section');
callPanel.className = 'call-panel';
callPanel.hidden = true;
callPanel.setAttribute('aria-label', 'Call status');
scene.append(callPanel);
const interestTip = document.createElement('div');
interestTip.className = 'interest-tip';
interestTip.textContent = 'Still interested in Oliver?';
interestTip.hidden = true;
scene.append(interestTip);
function positionInterestTip() {
  const controls = document.querySelector('.rating > button:first-child').getBoundingClientRect();
  const bounds = scene.getBoundingClientRect();
  const scale = bounds.width / scene.offsetWidth;
  interestTip.style.left = ((controls.left + controls.width / 2 - bounds.left) / scale) + 'px';
  interestTip.style.top = ((controls.top - bounds.top) / scale - interestTip.offsetHeight - 10) + 'px';
}
addEventListener('resize', () => { if (!interestTip.hidden) positionInterestTip(); });
let callInterval, callTimeout, callSeconds = 0, callPhase = 'idle', callMuted = false;
const durationText = () => Math.floor(callSeconds / 60) + ':' + String(callSeconds % 60).padStart(2, '0');
function callPrompt() {
  callPhase = 'feedback';
  callPanel.classList.add('is-feedback');
  callPanel.innerHTML = '<div class="call-top"><strong>Did you connect with Oliver?</strong><button class="call-dismiss" aria-label="Close call feedback">×</button></div><div class="call-feedback"><button aria-label="Yes, connected"><img class="feedback-icon" src="assets/feedback-check.svg" alt=""></button><button aria-label="No, did not connect"><img class="feedback-icon" src="assets/feedback-close.svg" alt=""></button></div>';
  interestTip.hidden = true;
  callPanel.querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
    callPanel.hidden = true;
    interestTip.hidden = false;
  positionInterestTip();
  if (button.getAttribute('aria-label') === 'No, did not connect') {
      document.querySelector('.call-completed > strong').textContent = 'Call unanswered';
    setTimeout(() => {
      const message = document.querySelector('.system-message');
      message.hidden = false;
      tipDismissed = false;
      openChat();
      clearTimeout(tipTimer);
      tipTimer = setTimeout(showInviteTip, 1400);
      if (!reducedMotion.matches) message.animate([{opacity: 0, transform: 'translateY(10px)'}, {opacity: 1, transform: 'none'}], {duration: 450, easing: 'ease-out'});
      conversation.scrollTo({top: 0, behavior: 'smooth'});
    }, 2200);
  }
}));
}
function endCall() {
  if (callPhase === 'countdown' || callPhase === 'calling') {
    clearInterval(callInterval);
    clearTimeout(callTimeout);
    callPhase = 'idle';
    callPanel.hidden = true;
    interestTip.hidden = true;
    return;
  }
  recordCompletedCall();
  clearInterval(callInterval);
  clearTimeout(callTimeout);
  callPhase = 'ended';
  callPanel.querySelector('.call-status').classList.remove('has-signal');
  callPanel.querySelector('.call-status').textContent = 'Call ended  ' + durationText();
  callPanel.querySelectorAll('button').forEach(button => button.disabled = true);
  callTimeout = setTimeout(callPrompt, 1600);
}
document.querySelector('#call').addEventListener('click', () => {
  clearInterval(callInterval);
  clearTimeout(callTimeout);
  interestTip.hidden = true;
  callSeconds = 0;
  callMuted = false;
  callPhase = 'countdown';
  callPanel.classList.remove('is-feedback');
  closeChat();
  callPanel.innerHTML = '<div class="call-top"><strong><img src="assets/40000004-74942-174be.svg" alt="">Oliver Smith</strong><button class="call-mute" aria-label="Mute microphone" aria-pressed="false"><img src="assets/microphone-muted.png" alt=""></button><button class="call-hangup" aria-label="End call"><svg viewBox="0 0 24 24" width="24" height="24"><path fill="white" d="M3 13l3 3 3-3-1-3c3-1 5-1 8 0l-1 3 3 3 3-3c-5-7-13-7-18 0z"/></svg></button></div><p class="call-status" aria-live="polite">Notifying Oliver — please wait 10 seconds</p>';
  callPanel.hidden = false;
  callPanel.querySelector('.call-mute').addEventListener('click', event => {
    callMuted = !callMuted;
    event.currentTarget.setAttribute('aria-pressed', String(callMuted));
    event.currentTarget.setAttribute('aria-label', callMuted ? 'Unmute microphone' : 'Mute microphone');
  });
  callPanel.querySelector('.call-hangup').addEventListener('click', endCall);
  let remaining = 10;
  callInterval = setInterval(() => {
    remaining--;
    if (remaining > 0) {
      callPanel.querySelector('.call-status').textContent = 'Notifying Oliver — please wait ' + remaining + (remaining === 1 ? ' second' : ' seconds');
    } else {
      clearInterval(callInterval);
      callPhase = 'calling';
      callPanel.querySelector('.call-status').classList.add('has-signal');
      callPanel.querySelector('.call-status').textContent = 'Calling Oliver…';
      callTimeout = setTimeout(() => {
        callPhase = 'connected';
        callPanel.querySelector('.call-status').textContent = 'Call in progress  0:00';
        callInterval = setInterval(() => {
          callSeconds++;
          callPanel.querySelector('.call-status').textContent = 'Call in progress  ' + durationText();
        }, 1000);
      }, 1800);
    }
  }, 1000);
});

let lastCallEndedAt = null;
function updateCallTimestamp() {
  if (!lastCallEndedAt) return;
  const seconds = Math.floor((Date.now() - lastCallEndedAt) / 1000);
  const text = seconds < 60 ? 'Now' : Math.floor(seconds / 60) + (seconds < 120 ? ' minute ago' : ' minutes ago');
  document.querySelectorAll('.call-relative').forEach(label => label.textContent = text);
}
function recordCompletedCall() {
  lastCallEndedAt = Date.now();
  document.querySelector('.call-completed').hidden = false;
  document.querySelector('.call-completed > strong').textContent = 'Call completed';
  const history = document.querySelector('#history-panel');
  history.replaceChildren();
  const title = document.createElement('p');
  title.textContent = 'You called Oliver Smith';
  const time = document.createElement('small');
  time.className = 'muted call-relative';
  history.append(title, time);
  updateCallTimestamp();
}
setInterval(updateCallTimestamp, 1000);
document.querySelectorAll('.rating > button').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.rating > button').forEach(other => {
    other.classList.toggle('selected', other === button);
    other.setAttribute('aria-pressed', String(other === button));
  });
}));

document.querySelector('#cai-followup').addEventListener('click', openSchedule);

const selectAllCandidates = document.querySelector('#select-all');
const candidateCheckboxes = [...document.querySelectorAll('.candidate > input[type="checkbox"]')];
function updateCandidateSelection() {
  const selected = candidateCheckboxes.filter(input => input.checked).length;
  document.querySelector('#selection-count').textContent = '(' + selected + ')';
  selectAllCandidates.checked = selected > 0;
  selectAllCandidates.indeterminate = false;
}
selectAllCandidates.addEventListener('change', () => {
  candidateCheckboxes.forEach(input => input.checked = selectAllCandidates.checked);
  updateCandidateSelection();
});
candidateCheckboxes.forEach(input => input.addEventListener('change', updateCandidateSelection));
updateCandidateSelection();

document.querySelectorAll('.rating-yes img, .shortlist > img').forEach(image => {
  image.src = 'assets/confirmed-check.svg';
  image.classList.add('shared-check');
});

const interestIcons = ['feedback-check.svg', 'interest-question.svg', 'feedback-close.svg'];
document.querySelectorAll('.rating > button img').forEach((image, index) => {
  image.src = 'assets/' + interestIcons[index];
  image.classList.add('interest-icon');
});

document.querySelectorAll('.rating > button').forEach(button => button.addEventListener('click', () => { interestTip.hidden = true; }));

function showInviteTip() {
  if (!chat.classList.contains('is-open') || !scheduleBackdrop.hidden) return;
  tip.hidden = false;
  const target = document.querySelector('#invite').getBoundingClientRect();
  const bounds = scene.getBoundingClientRect();
  const scale = bounds.width / scene.offsetWidth;
  const targetX = (target.left + target.width / 2 - bounds.left) / scale;
  const left = Math.max(70, Math.min(targetX - tip.offsetWidth / 2, scene.offsetWidth - tip.offsetWidth - 12));
  tip.style.left = left + 'px';
  tip.style.top = ((target.top - bounds.top) / scale - tip.offsetHeight - 14) + 'px';
  tip.querySelector('.tip-caret').style.left = (targetX - left) + 'px';
}
addEventListener('resize', () => { if (!tip.hidden) showInviteTip(); });

// The invitation prototype begins with the original incoming system message.
document.querySelector('.system-message').hidden = false;
setTimeout(openChat, 3000);
