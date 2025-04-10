require('dotenv').config();
const djs = require("discord.js");
const static = require('node-static');
const ws = require('ws');
const users = Object.fromEntries(process.env.USERS.split(',').map(x => x.split(':')))
const client = new djs.Client({
  intents: [
    djs.GatewayIntentBits.Guilds,
    djs.GatewayIntentBits.GuildMessages,
    djs.GatewayIntentBits.MessageContent,
    djs.GatewayIntentBits.GuildWebhooks,
    djs.GatewayIntentBits.GuildMembers,
    djs.GatewayIntentBits.GuildPresences
  ]
});
/**
 * @type {djs.Guild}
 */
let guild;

client.on("ready", async () => {
  console.log("piss");
  guild = client.guilds.cache.get(process.env.GUILD);
});

const filesvr = new static.Server('./client');
const server = require('http').createServer((req, res) => {
  req.addListener('end', () => {
    filesvr.serve(req, res);
  }).resume();
}).listen(process.env.PORT || 6565);

const wss = new ws.Server({ server });
wss.on('connection', async (ws, req) => {
  ws.un = decodeURI(req.url.split('/')[1]);
  ws.pw = decodeURI(req.url.split('/')[2]);
  if (!users[ws.un] || users[ws.un] != ws.pw || !guild) {
    ws.send(JSON.stringify({
      type: 'bad',
      badpw: !!guild
    }));
    ws.close();
    return;
  }

  const channels = await guild.channels.fetch();
  const userlist = await guild.members.fetch();
  ws.send(JSON.stringify({
    type: 'server',
    channels: channels
      .filter(x => x.type == djs.ChannelType.GuildText)
      .sort((a, b) => a.rawPosition - b.rawPosition)
      .map(x => [x.name, x.id]),
    users: userlist
      .filter(x => !x.user.bot)
      .map(x => [x.user.globalName || x.user.username, x.id, x.presence?.status || "offline"])
      .sort((a, b) =>
        (b[2] == 'offline' ? -1 : b[2] == 'dnd' ? -2 : 1) -
        (a[2] == 'offline' ? -1 : a[2] == 'dnd' ? -2 : 1))
  }));

  ws.on('message', async x => {
    let d;
    try {
      d = JSON.parse(x);
    } catch (e) {
      return;
    }
    let c, w, m;
    switch (d.type) {
      case 'message':
        c = (await guild.channels.fetch()).find(x => x.id == d.channel);
        w = await c.fetchWebhooks();
        w = w.find(x => x.name == 'DAT-WH');
        if (!w)
          w = await c.createWebhook({
            name: 'DAT-WH',
            avatar: 'https://meowguardon.top/icon.png',
          });
        w.send({ content: d.data, username: ws.un + ' (at school)' });
        break;
      case 'getmsgs':
        ws.channel = d.channel
        c = (await guild.channels.fetch()).find(x => x.id == d.channel);
        m = await c.messages.fetch({ limit: 100 });
        ws.send(JSON.stringify({
          type: 'msgs',
          channel: d.channel,
          content: m.map(x => ({
            data: x.content,
            user: x.author.globalName || x.author.username,
          })).reverse()
        }));
        break;
    }
  })
});

client.on("messageCreate", (message) => {
  let user = message.author.globalName || message.author.username;
  wss.clients.forEach(ws => {
    if (ws.channel == message.channelId && user != ws.un + ' (at school)')
      ws.send(JSON.stringify({
        type: 'message',
        user,
        data: message.content
      }));
    else if (ws.channel != message.channelId)
      ws.send(JSON.stringify({
        type: 'ping',
        channel: message.channelId
      }))
  });
});

client.on("presenceUpdate", (_, presence) => {
  wss.clients.forEach(ws => {
    ws.send(JSON.stringify({
      type: 'status',
      user: presence.member.id,
      data: presence.status
    }));
  });
});

client.login(process.env.TOKEN);