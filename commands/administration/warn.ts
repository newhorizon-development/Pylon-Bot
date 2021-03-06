const adminRoles: string[] = [' '];
const warnRole: string = ' ';
const removeRole: string = ' ';
const adminLogChannel: string = ' ';

const WarnCommands: discord.command.CommandGroup = new discord.command.CommandGroup(
  {
    defaultPrefix: '~'
  }
);

import * as Database from './db/database';

interface structure {
  index: string;
  reason: string[];
  author: string[];
  timestamp: number[];
}

WarnCommands.on(
  {
    name: 'warn',
    description: 'warn a user'
  },
  (_arguments) => ({
    member: _arguments.guildMember(),
    reason: _arguments.text()
  }),
  async (message, { member, reason }) => {
    console.log('exect');
    if (!message.member.roles.some((r) => adminRoles.includes(r))) {
      await message.reply('You are not permitted to use this command.');
      return;
    }

    if (member.roles.some((r) => adminRoles.includes(r))) {
      await message.reply("You can't warn a teammember.");
      return;
    }

    if (member.user.bot) {
      await message.reply("You can't warn a bot.");
      return;
    }

    try {
      await member.removeRole(removeRole);
      await member.addRole(warnRole);
    } catch (_) {}

    await message.reply(
      `User ${member.toMention()} was warned by ${message.member.toMention()} with the reason: "${reason}".`
    );

    discord
      .getGuildTextChannel(adminLogChannel)
      .then((channel) =>
        channel?.sendMessage(
          `User ${member.toMention()} was warned by ${message.member.toMention()} with the reason: "${reason}".`
        )
      );

    const oldData = await Database.GetData(
      `warncase-${member.user.id}`,
      'warncases'
    );
    if (oldData === undefined)
      await Database.SaveData(
        {
          index: `warncase-${member.user.id}`,
          reason: [reason],
          author: [message.member.user.id],
          timestamp: [Date.now()]
        },
        'warncases'
      );
    else
      await Database.UpdateDataValues(
        `warncase-${member.user.id}`,

        (data: structure) => {
          data.reason.push(reason);
          data.author.push(message.member.user.id);
          data.timestamp.push(Date.now());
          return data;
        },
        'warncases'
      );
  }
);

WarnCommands.on(
  {
    name: 'get-warns',
    description: 'get warn info about a user'
  },
  (_arguments) => ({
    user: _arguments.guildMember()
  }),
  async (message, { user }) => {
    if (!message.member.roles.some((r) => adminRoles.includes(r))) {
      await message.reply('You are not permitted to use this command.');
      return;
    }

    const infos: undefined | structure = await Database.GetData(
      `warncase-${user.user.id}`,
      'warncases'
    );

    if (infos === undefined) await message.reply('No cases for this user!');
    else {
      let msg: string = `Warn cases for user <@${user.user.id}>: `;
      console.log(infos);
      for (let i: number = 0; i < infos.reason.length; ++i) {
        msg = msg.replace(
          msg,
          msg +
            `\nAuthor: <@${infos.author[i] ?? 'no id'}>. Reason: ${infos.reason[
              i
            ] ?? 'no reason'}. Timestamp: ${new Date(infos.timestamp[i])}.`
        );
      }

      await message.reply(msg);
    }
  }
);

WarnCommands.on(
  {
    name: 'delete-warn',
    description: 'delete all the cases from a user'
  },
  (_arguments) => ({
    user: _arguments.guildMember()
  }),
  async (message, { user }) => {
    if (!message.member.roles.some((r) => adminRoles.includes(r))) {
      await message.reply('You are not permitted to use this command.');
      return;
    }

    if (await Database.DeleteData(`warncase-${user.user.id}`, 'warncases'))
      await message.reply(
        `Warn cases for the user ${user.toMention()} were succesfully deleted.`
      );
    else
      await message.reply(
        `No warn cases were deleted for the user ${user.toMention()}. Probably were no data saved before...`
      );
  }
);
