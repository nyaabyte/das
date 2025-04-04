let ws, channel;
let channels = {};
function connect() {
  if (ws && ws.readyState == WebSocket.OPEN) return;
  ws = new WebSocket(location + un + '/' + pw);
  ws.onopen = () => {
    localStorage.un = un;
    localStorage.pw = pw;
    connect();
  }
  ws.onmessage = x => {
    let d = JSON.parse(x.data);
    console.log(d);
    switch (d.type) {
      case 'bad':
        if (d.badpw) {
          localStorage.un = un = prompt('username');
          localStorage.pw = pw = prompt('password');
          connect();
        }
        break;
      case 'server':
        document.querySelector('#channels').innerHTML = '';
        d.channels.forEach(x => {
          document.querySelector('#channels').innerHTML +=
            '<b onclick="switchchannel(\'' + x[1] + '\')">' + x[0] + '<span class="ping' + x[1] + '"></span></b><br>';
        });
        channels = Object.fromEntries(d.channels.map(x => [x[1], x[0]]));
        clearmsg();
        break;
      case 'msgs':
        if (d.channel != channel) break;
        document.querySelector('#msg').style.display = 'inline';
        d.content.forEach(x => createmsg(x.user, x.data));
        break;
      case 'message':
        createmsg(d.user, d.data);
        break;
      case 'ping':
        document.querySelector('.ping' + d.channel).innerHTML = ' <span style="color:red">!</span>';
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
  document.querySelector('#msgs').scrollTop = document.querySelector('#msgs').scrollHeight;
}

function clearmsg() {
  lastmsgfrom = '';
  document.querySelector('#msgs').innerHTML = '';
}

function switchchannel(c) {
  let x = document.querySelector('.ping' + channel);
  if (x) x.innerHTML = '';
  channel = c;
  document.querySelector('#channel').innerText = channels[channel];
  document.querySelector('.ping' + channel).innerHTML = ' <';
  clearmsg();
  document.querySelector('#msg').style.display = 'none';
  ws.send(JSON.stringify({
    type: 'getmsgs',
    channel
  }))
}