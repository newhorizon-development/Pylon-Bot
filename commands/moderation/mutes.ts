let f = discord.command.filters;
const MUTE_PERMS = f.and(f.canMuteMembers());
const muteRole = ' ';
const muteKv = new pylon.KVNamespace('mutes');

const MuteCommands: discord.command.CommandGroup = new discord.command.CommandGroup(
  {
    defaultPrefix: '~',
    filters: MUTE_PERMS
  }
);

async function TempMute(member: discord.GuildMember, duration: number) {
  if (!member.roles.includes(muteRole)) await member.addRole(muteRole);
  await muteKv.put(member.user.id, Date.now() + duration, {
    ifNotExists: true
  });
}

async function UnMute(member: discord.GuildMember) {
  if (member.roles.includes(muteRole)) await member.removeRole(muteRole);
  await muteKv.delete(member.user.id);
}

pylon.tasks.cron('Every_5_Min', '0 0/5 * * * * *', async () => {
  const now = Date.now();
  const items = await muteKv.items();
  const guild = await discord.getGuild();
  let toRemove: string[] = [];
  await Promise.all(
    items.map(async (val) => {
      const member = await guild.getMember(val.key);
      if (member === null || !member.roles.includes(muteRole)) {
        toRemove.push(val.key);
        return;
      }
      if (typeof val.value !== 'number') return;
      const diff = now - val.value;
      if (diff > 0) {
        await member.removeRole(muteRole);
        toRemove.push(val.key);
      }
    })
  );
  if (toRemove.length > 0) {
    await muteKv.transactMulti(toRemove, () => undefined);
  }
});

MuteCommands.on(
  {
    name: 'mute',
    aliases: ['m']
  },
  (ctx) => ({
    member: ctx.guildMember(),
    duration: ctx.integer({ minValue: 1, maxValue: 1000000 })
  }),
  async (msg, { member, duration }) => {
    await msg.reply(async () => {
      if (member.roles.includes(muteRole))
        return 'The target is already muted!';
      await TempMute(member, duration * 1000 * 60);
      return `${
        discord.decor.Emojis.WHITE_CHECK_MARK
      } ${member.toMention()} was muted for ${duration} minutes!`;
    });
  }
);

MuteCommands.on(
  {
    name: 'unmute',
    aliases: ['u']
  },
  (ctx) => ({
    member: ctx.guildMember()
  }),
  async (msg, { member }) => {
    await msg.reply(async () => {
      if (!member.roles.includes(muteRole)) return 'The target is not muted!';
      await UnMute(member);
      return `${
        discord.decor.Emojis.WHITE_CHECK_MARK
      } ${member.toMention()} was un-muted!`;
    });
  }
);
