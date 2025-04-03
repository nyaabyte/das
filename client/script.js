let ws, channel;
let channels = {};
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
    console.log(d);
    switch(d.type) {
      case 'bad':
        localStorage.un = un = prompt('username');
        localStorage.pw = pw = prompt('password');
        break;
      case 'server':
        document.querySelector('#channels')
        d.channels.forEach(x => {
          document.querySelector('#channels').innerHTML += '<b onclick="switchchannel(\'' + x[1] + '\')">' + x[0] + '</b><br>';
        });
        channels = Object.fromEntries(d.channels.map(x => [x[1], x[0]]));
        break;
      case 'msgs':
        if (d.channel != channel) break;
        document.querySelector('#msg').style.display = 'inline';
        d.content.forEach(x => createmsg(x.user, x.data));
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
  document.querySelector('#channel').innerText = channels[channel];
  clearmsg();
  document.querySelector('#msg').style.display = 'none';
  ws.send(JSON.stringify({
    type: 'getmsgs',
    channel
  }))
}