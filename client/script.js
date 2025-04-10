const $ = x => document.querySelector(x);
let ws, channel;
let statuses = {
  online: '&#128994;',
  dnd: '&#128683;',
  offline: '&#127761;',
  idle: '&#127769;'
};
let channels = {}, users = {};
function connect() {
  if (ws && ws.readyState == WebSocket.OPEN) return;
  ws = new WebSocket(location + encodeURI(un) + '/' + encodeURI(pw));
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
        $('#channels').innerHTML = '';
        d.channels.forEach(x => {
          $('#channels').innerHTML +=
            '<b onclick="switchchannel(\'' + x[1] + '\')">' + x[0] + '<span class="ping' + x[1] + '"></span></b><br>';
        });
        $('#users').innerHTML = '';
        d.users.forEach(x => {
          $('#users').innerHTML +=
            '<b onclick="mention(\'' + x[1] + '\')">' + (x[0].match(/.{0,16}/)?.[0] || '') +
            ' <span id="status' + x[1] + '">' + statuses[x[2]] + '</span></b><br>';
        });
        users = Object.fromEntries(d.users.map(x => [x[1], [x[0], x[2]]]));
        channels = Object.fromEntries(d.channels.map(x => [x[1], x[0]]));
        clearmsg();
        break;
      case 'msgs':
        if (d.channel != channel) break;
        $('#msg').style.display = 'inline';
        d.content.forEach(x => createmsg(x.user, x.data));
        break;
      case 'message':
        createmsg(d.user, d.data);
        break;
      case 'ping':
        $('.ping' + d.channel).innerHTML = ' <span style="color:red">!</span>';
        break;
      case 'status':
        $('#status' + d.user).innerHTML = statuses[d.data];
        users[d.user] = d.data;
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
    $('#msgs').innerHTML += '<b  onclick="mention(\'' +
      (Object.entries(users).find(x => x[1][0] == from)?.[0] || '') + '\')">' + from + '</b><br>'
  let q = document.createElement('q');
  q.innerText = data.replace(/<@(\d{15,20})>/, (_, x) => '[@' + (users[x]?.[0] || 'unknown') + ']');
  $('#msgs').innerHTML += q.innerHTML + '<br>';
  lastmsgfrom = from;
  $('#msgs').scrollTop = $('#msgs').scrollHeight;
}

function clearmsg() {
  lastmsgfrom = '';
  $('#msgs').innerHTML = '';
}

function switchchannel(c) {
  let x = $('.ping' + channel);
  if (x) x.innerHTML = '';
  channel = c;
  $('#channel').innerText = channels[channel];
  $('.ping' + channel).innerHTML = ' <';
  clearmsg();
  $('#msg').style.display = 'none';
  ws.send(JSON.stringify({
    type: 'getmsgs',
    channel
  }))
}

function mention(user) {
  if (user)
    $('#msg').value += '<@' + user + '>';
}