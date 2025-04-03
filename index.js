require('dotenv').config();
const djs = require("discord.js");
const ws = require('ws');
const users = Object.fromEntries(process.env.USERS.split(',').map(x => x.split(':')))
const client = new djs.Client({
  intents: [
    djs.GatewayIntentBits.Guilds,
    djs.GatewayIntentBits.GuildMessages,
    djs.GatewayIntentBits.MessageContent,
    djs.GatewayIntentBits.GuildWebhooks,
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

const wss = new ws.Server({ port: 6565 });
wss.on('connection', async (ws, req) => {
  ws.un = req.url.split('/')[1];
  ws.pw = req.url.split('/')[2];
  if (!users[ws.un] || users[ws.un] != ws.pw || !guild) {
    ws.send(JSON.stringify({
      type: 'bad'
    }));
    ws.close();
    return;
  }

  const channels = await guild.channels.fetch();
  ws.send(JSON.stringify({
    type: 'server',
    channels: channels
      .filter(x => x.type == djs.ChannelType.GuildText)
      .map(x => [x.name, x.id])
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
            avatar: 'https://meowguardon.top/diane.png',
          });
        w.send({ content: d.data, username: ws.un + ' (at school)' });
        break;
      case 'getmsgs':
        c = (await guild.channels.fetch()).find(x => x.id == d.channel);
        m = await c.messages.fetch({ limit: 100 });
        ws.send(JSON.stringify({
          type: 'msgs',
          channel: x.id,
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
  if (message.content.startsWith("ping")) {
    message.channel.send("pong!");
  }
});

client.login(process.env.TOKEN);