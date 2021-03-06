const API_KEY = ' ';
let f = discord.command.filters;

const QuerySlashCommand = discord.interactions.commands;
const QueryCommand = new discord.command.CommandGroup({
  defaultPrefix: 'p.'
});

QuerySlashCommand.register(
  {
    name: 'search',
    description: 'Search with Wolfram Alpha API',
    options: (opt) => ({
      query: opt.string({
        name: 'query',
        description: 'Search with Wolfram Alpha API'
      })
    })
  },
  async (interaction, { query }) => {
    const s = Date.now();
    const api = await fetch(
      `http://api.wolframalpha.com/v1/result?appid=${API_KEY}&i=${encodeURIComponent(
        query
      )}`
    );
    const res = await api.text();
    await interaction.respond(`.
You searched for: \`${query}\`
Result: ${res}

(Done in ${Date.now() - s}ms)`);
  }
);

QueryCommand.on(
  {
    name: 'search',
    aliases: ['s', 'wolfram', 'ws', 'wa'],
    description: 'Search with Wolfram Alpha API'
  },
  (args) => ({
    query: args.text()
  }),
  async (message, { query }) => {
    const appId = API_KEY;

    let api = await fetch(
      `http://api.wolframalpha.com/v1/result?appid=${appId}&i=${query}`
    );
    let result = await api.text();

    const replyEmbed = new discord.Embed();
    const description = `**Query:**
    \`\`\`${query}\`\`\`
    **Response:**
    \`\`\`${result}\`\`\``;
    replyEmbed.setDescription(description);
    replyEmbed.setFooter({
      text: `Powered by the WolframAlpha API`,
      iconUrl:
        'https://community.wolfram.com/group-branding-portlet/images/wa-asset.png'
    });

    await message.reply(replyEmbed);
  }
);
