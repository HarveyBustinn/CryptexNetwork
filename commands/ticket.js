/**
 * Copyright © 2020 GoogleBots
 *
 * All rights reserved. No part of this publication may be
 * reproduced, distributed, or transmitted in any form or
 * by any means, including photocopying, recording, or other
 * electronic or mechanical methods, without the prior written
 * permission of the publisher.
 *
 * Created in Canada
 *
 * This software is distributed 'as is' and with no warranties of any kind,
 * whether express or implied, including and without limitation, any warranty
 * of merchantability or fitness for a particular purpose.
 *
 * The user (you) must assume the entire risk of using the software.
 *
 * In no event shall any individual, company or organization involved in any way
 * in the development, sale or distribution of this software be liable for any
 * damages whatsoever relating to the use, misuse, or inability to use this software
 * (including, without limitation, damages for loss of profits, business interruption,
 * loss of information, or any other loss).
 */

const { MessageEmbed } = require('discord.js');
const { client: { databases }, utils } = require('../index');

module.exports = {
  aliases: ['new'],
  description: 'Create, modify, and use tickets.',
  options: {
    create: {
      arguments: [
        {
          apply: async a => a ? a.toLowerCase() : true
        }
      ]
    },
    add: {
      restriction: utils.isAdmin,
      arguments: [
        {
          boolean: async a => a,
          error: 'must be present'
        },
        {
          apply: async (a, { guild }) => a && utils.getChannel(guild.channels.cache, a, 'category'),
          error: 'must be a valid category id or name'
        },
        {
          apply: async (a, { guild }) => a && utils.getRole(guild.roles.cache, a),
          error: 'must be a valid role id, name, or tag'
        },
        {
          apply: async a => a && a.toLowerCase(),
          error: 'must be present'
        },
        {
          apply: async (a, { guild }) => a && utils.getEmoji(guild.emojis.cache, a),
          error: 'must be an emoji or emoji id'
        },
        {
          boolean: async a => !!a,
          error: 'must be present'
        }
      ],
      usage: '<name> <category> <role> <prefix> <emoji> <description> [...<question> <title>]'
    },
    remove: {
      restriction: utils.isAdmin,
      arguments: [
        {
          apply: async (a, { guild }) => a && [a.toLowerCase(), await databases.config.update({ guild_id: guild.id, [`tickets.types.${a.toLowerCase()}`]: { $exists: true } }, { $unset: { [`tickets.types.${a.toLowerCase()}`]: true } })],
          error: 'must be a valid ticket name'
        }
      ],
      usage: '<name>'
    },
    list: {
      restriction: utils.isAdmin
    },
    embed: {
      ignore: true,
      restriction: utils.isAdmin,
      usage: '[...<category>]',
      format: async a => a ? a.toLowerCase() : a
    },
    log: {
      arguments: [
        {
          apply: async (a, { guild }) => utils.getChannel(guild.channels.cache, a, 'text'),
          error: 'must be a valid text channel id, name, or tag'
        }
      ],
      usage: '<channel>'
    }
  },
  events: {
    ready: {},
    ticketClose: {},
    ticketCreateAdd: {},
    messageDeleteBulk: {},
    messageDelete: {}
  }
}

async function create({ guild, ticket, user, channel }) {
  const support = await guild.channels.create(`${ticket.prefix}-${user.username}`, {
    parent: ticket.category,
    permissionOverwrites: [
      {
        id: user.id,
        allow: ['SEND_MESSAGES', 'VIEW_CHANNEL']
      },
      {
        id: guild.id,
        deny: ['VIEW_CHANNEL']
      },
      {
        id: ticket.role,
        allow: ['SEND_MESSAGES', 'VIEW_CHANNEL']
      }
    ],
    reason: `Created ticket for ${user.tag}`
  });

  const information = await utils.embed(new MessageEmbed()
    .setDescription('Thank you for creating a ticket with our support team. We will be with you shortly.')
    .setThumbnail(user.displayAvatarURL()), `${user.username}'s Ticket`);

  utils.success(channel, `Your ticket can be viewed at ${support}.`);

  if (ticket.questions.length > 0) {
    const responses = [];

    const loading = await utils.embed('Loading questions...', 'Loading', support);

    for (const { q: question, e: title } of ticket.questions) {
      await loading.edit(utils.embed(question, false));
      const response = await utils.awaitMessage({ channel: support, user });

      if (!response) {
        await utils.error(support, 'You did not send a response in time.');
        break;
      }

      responses.push({ response: response.content, title });

      await response.delete();
    }

    await loading.delete();
    information.addFields(responses.map(r => ({ name: r.title, value: `${r.response}\n\u200b` })));
  }

  await databases.channels.insert({ channel_id: support.id, discord_id: user.id, type: 'ticket' });

  return support.send(information);
}

module.exports.options.create.run = async ({ channel, author, guild }, category) => {
  const categories = await utils.config(guild.id, a => a.tickets.types);
  const selection = category ? categories[category] : null;

  if (!selection) throw `Please provide a valid category.\n\nCategories: ${Object.keys(categories).map(c => `\`${c}\``).join(', ') || 'None'}`;

  return create({ guild, ticket: selection, user: author, channel });
}

module.exports.options.log.run = async ({ guild }, log) => {
  await databases.config.update({ guild_id: guild.id }, { $set: { 'channels.logs.tickets': log.id } });
  return `Ticket logs have been updated to ${log}.`;
}

module.exports.options.embed.run = async ({ channel, guild }, ...names) => {
  names = names.length > 0 ? names.map(n => n.toLowerCase()) : [];

  const available = Object.values(await utils.config(guild.id, a => a.tickets.types));
  const filtered = available.filter(a => names.includes(a.name.toLowerCase()));

  const mapped = filtered
    .map(({ name, emoji }) => `${emoji} → **${name}**`);

  if (filtered.length <= 0) throw 'You must provide at least one valid ticket name.';

  const message = await utils.embed(`React with one of the emojis below to create a ticket.\n\n${mapped.join('\n\n')}`, 'Create a Ticket', channel);

  await databases.messages_cache.insert({ channel_id: channel.id, message_id: message.id, action: 'ticketCreate', delete: true });

  for (const emoji of filtered.map(f => f.emoji)) {
    await message.react(utils.parseEmoji(emoji));
  }
}

module.exports.options.add.run = async ({ guild }, name, category, role, prefix, emoji, description, ...q) => {
  const questions = q.reduce((a, b, i) => {
    if (i % 2 === 0) a.push({ q: q[i], e: q[i + 1] });
    return a;
  }, []);

  await databases.config.update({ guild_id: guild.id }, {
    $set: {
      [`tickets.types.${name.toLowerCase()}`]: {
        name,
        prefix,
        category: category.id,
        role: role.id,
        emoji: emoji,
        description,
        questions
      }
    }
  });

  return `Your ticket has been created.\n\n\`${name}\`:\n• Prefix: \`${prefix}\`\n• Category: \`${category.id}\`\n• Role: <@&${role.id}>\n• Emoji: ${emoji}\n• Questions: \`${questions.length}\``
}

module.exports.options.remove.run = async (_, [name, deleted]) => {
  if (deleted > 0) return `Removed \`${name}\` successfully.`;
  else throw `I could not find a ticket by the name of \`${name}\`.`;
}

module.exports.options.list.run = async ({ guild, channel, author }) => {
  const tickets = await utils.config(guild.id, a => a.tickets.types)
    .then(t => t && Object.values(t)
      .map(({ prefix, category, role, emoji, questions, name }) => `\`${name}\`:\n• Prefix: \`${prefix}\`\n• Category: \`${category}\`\n• Role: <@&${role}>\n• Emoji: ${emoji}\n• Questions: \`${questions.length}\``));

  return utils.scroller({ channel, message: tickets.join('\n\n') || 'None', author, title: 'Tickets' });
}

module.exports.events.ticketCreateAdd.every = async ({ guild, channel }, emoji, user) => {
  const ticket = await utils.config(guild.id, a => a.tickets.types).then(a => utils.objectFind(a, b => b.emoji === emoji.toString()));
  if (!ticket) return;

  return create({ guild, ticket, user, channel });
}

module.exports.events.ticketClose.every = async ({ guild, channel, user }, closed, reason, messages) => {
  const id = await utils.config(guild.id, c => c.channels.logs.tickets);
  if (!id) return utils.notifyOwner(guild, 'You have not set a ticket log channel.');

  const logs = guild.channels.cache.get(id);
  if (!logs) return utils.notifyOwner(guild, 'Your ticket logs channel is no longer present.');

  return utils.embed(new MessageEmbed()
    .addField('Creator', `<@${closed.discord_id}>`, true)
    .addField('Closer', user, true)
    .addField('Reason', reason)
    .attachFiles([
      {
        attachment: Buffer.from(messages.filter(m => m.content).map(m => `${m.author.tag}: ${m.content}`).join('\n')),
        name: `${channel.name}.txt`
      }
    ]), `Closed: ${channel.name}`, logs);
}