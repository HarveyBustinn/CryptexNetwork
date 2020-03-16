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

const { utils, client: { databases, guilds } } = require('../index');

module.exports = {
  restriction: utils.isAdmin,
  description: 'Mute a user.',
  usage: '<user> [time]',
  arguments: [
    {
      apply: async (a, { guild }) => utils.getUser(guild.members, a),
      error: 'must be a valid user id, name, tag, or nickname'
    }
  ],
  events: {
    ready: {},
    guildDelete: {}
  }
}

module.exports.run = async ({ guild }, offender, ...t) => {
  const time = t.length > 0 ? await utils.parseTime(t.join(' ')) : null;
  if (time === false) throw `\`${t.join(' ')}\` is not a valid timestamp.\n\nExample: \`1mo 1w 1d 1h 1m 1s\``;

  const id = await utils.config(guild.id, a => a.roles.muted);
  if (!id) throw 'You have not set a mute role.';

  const role = await utils.getRole(guild.roles.cache, id);
  await offender.roles.add(role);

  if (time === null) return `${offender} has been muted.`;

  await databases.mutes.update({ guild_id: guild.id, discord_id: offender.id }, { $set: { expiry: Date.now() + time } }, { upsert: true });

  return `${offender} has been muted for ${utils.formatSeconds(time / 1000)}.`;
}

module.exports.events.ready.once = async () => {
  const ids = guilds.cache.map(g => g.id);
  await databases.mutes.remove({ guild_id: { $nin: ids } }, { multi: true });

  await Promise.all((await databases.config.find({}))
    .filter(c => c.roles.muted)
    .map(c => {
      const guild = guilds.cache.get(c.guild_id);
      const role = guild.roles.cache.get(c.roles.muted);

      if (!role) return;

      const remove = guild.channels.cache.filter(c => c.permissionsFor(role).any(['SEND_MESSAGES', 'SPEAK']));
      return Promise.all(remove.map(c => c.updateOverwrite(role, {
        'SEND_MESSAGES': false,
        'SPEAK': false
      }, 'Setting up mute role.')));
    }));

  while (true) {
    const unmute = await databases.mutes.find({ expiry: { $lte: Date.now() } });
    const mapped = unmute.reduce((a, b) => {
      a[b.guild_id] ? a[b.guild_id].push(b.discord_id) : a[b.guild_id] = [b.discord_id];
      return a;
    }, {});

    await Promise.all(Object.entries(mapped)
      .map(async ([ guild, users ]) => {
        const role = await utils.config(guild, a => a.roles.muted);
        if (!role) return;

        const members = await guilds.cache.get(guild).members.fetch(users);
        await Promise.all(members.map(m => m.roles.remove(role).catch(() => {})));

        return databases.mutes.remove({ guild_id: guild, discord_id: { $in: users } }, { multi: true });
      }));

    await utils.sleep(10000);
  }
}

module.exports.events.guildDelete.every = async (guild) => {
  return databases.mutes.remove({ guild_id: guild.id }, { multi: true });
}