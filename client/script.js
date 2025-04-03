let ws;
function connect() {
  if (ws && ws.readyState == WebSocket.OPEN) return;
  ws = new WebSocket('ws://localhost:6565/' + un + '/' + pw);
  ws.onopen = () => {
    localStorage.un = un;
    localStorage.pw = pw;
    connect();
  }
  ws.onmessage = x => {
    let d = JSON.parse(x.data);
    switch(d.type) {
      case 'bad':
        localStorage.un = un = prompt('username');
        localStorage.pw = pw = prompt('password');
        break;
      case 'channels':
        
        break;
      case 'msgs':
        document.querySelector('#msg').style.display = 'inline';
        break;
    }
  }
  ws.onclose = () => {
    setTimeout(connect, 10e3);
  }
}
let un = localStorage.un || prompt('username');
let pw = localStorage.pw || prompt('password');
connect();

function sendmsg(data) {
  ws.send(JSON.stringify({
    type: 'message',
    channel,
    data
  }));
  createmsg(un + ' (at school)', data);
}

let lastmsgfrom = '';

function createmsg(from, data) {
  if (lastmsgfrom != from)
    document.querySelector('#msgs').innerHTML += '<b>' + from + '</b><br>'
  let q = document.createElement('q');
  q.innerText = data;
  document.querySelector('#msgs').innerHTML += q.innerHTML + '<br>';
  lastmsgfrom = from;
}

function clearmsg() {
  lastmsgfrom = '';
  document.querySelector('#msgs').innerHTML = '';
}

function switchchannel(c) {
  channel = c;
  clearmsg();
  document.querySelector('#msg').style.display = 'none';
}